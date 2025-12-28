import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Company, Vehicle, Contract, DailyLog, Profile } from '../models/database.types';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Initialize session check
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.handleSession(session);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.handleSession(session);
    });
  }

  private handleSession(session: Session | null) {
    if (session?.user) {
      this._currentUser.next(session.user);
    } else {
      this._currentUser.next(null);
    }
  }

  get currentUser$(): Observable<User | null> {
    return this._currentUser.asObservable();
  }

  get currentUser(): User | null {
    return this._currentUser.getValue();
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // --- Auth ---
  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async signIn(email: string, password: string) {
    const result = await this.supabase.auth.signInWithPassword({ email, password });

    // Session'ı yenile ve kullanıcı bilgisini güncelle
    if (!result.error) {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      this.handleSession(session);
    }

    return result;
  }

  async signUp(email: string, password: string, fullName: string) {
    // Email confirmation zorunlu - Supabase Dashboard'da ayarlanmalı
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          is_approved: false, // Varsayılan olarak onay bekliyor
          subscription_active: false,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
  }

  // Kullanıcının onay durumunu kontrol et
  async checkUserApproval(): Promise<boolean> {
    const user = this._currentUser.getValue();
    if (!user) {
      console.log('checkUserApproval: No user found');
      return false;
    }

    try {
      console.log('checkUserApproval: Checking user:', user.id, user.email);

      const { data, error } = await this.supabase
        .from('profiles')
        .select('is_approved, subscription_active, subscription_expires_at, role')
        .eq('id', user.id)
        .single();

      if (error) {
        // Profile tablosu yoksa varsayılan olarak false döndür
        console.error('Profile check error:', error);
        return false;
      }

      console.log('checkUserApproval: Profile data:', data);

      // Kullanıcı onaylanmış olmalı
      const isApproved = data?.is_approved === true;
      if (!isApproved) {
        console.log('checkUserApproval: User not approved');
        return false;
      }

      // Abonelik kontrolü
      const hasActiveSubscription = data?.subscription_active === true;

      // Eğer abonelik aktif değilse, sadece onay yeterli
      if (!hasActiveSubscription) {
        console.log('checkUserApproval: User approved, no subscription required');
        return true; // Onaylanmış kullanıcılar abonelik olmadan da giriş yapabilir
      }

      // Eğer abonelik aktifse, süre kontrolü yap
      if (data?.subscription_expires_at) {
        const expiryDate = new Date(data.subscription_expires_at);
        const subscriptionValid = expiryDate > new Date();
        console.log(
          'checkUserApproval: Subscription expires at:',
          data.subscription_expires_at,
          'Valid:',
          subscriptionValid
        );
        return subscriptionValid;
      }

      // Abonelik aktif ama süre belirtilmemişse (NULL), süresiz kabul et
      console.log('checkUserApproval: User approved with unlimited subscription');
      return true;
    } catch (error) {
      console.error('User approval check error:', error);
      return false;
    }
  }

  // Kullanıcı profilini güncelle (admin için)
  async updateUserProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  }

  // --- Admin Methods ---

  // Tüm kullanıcı profillerini getir (admin için)
  async getAllProfiles() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Profile[];
  }

  // Kullanıcıyı onayla
  async approveUser(
    userId: string,
    subscriptionActive: boolean = true,
    subscriptionExpiresAt?: string
  ) {
    const updates: Partial<Profile> = {
      is_approved: true,
      subscription_active: subscriptionActive,
    };

    if (subscriptionExpiresAt) {
      updates.subscription_expires_at = subscriptionExpiresAt;
    }

    return this.updateUserProfile(userId, updates);
  }

  // Kullanıcıyı reddet/onayı kaldır
  async rejectUser(userId: string) {
    return this.updateUserProfile(userId, { is_approved: false });
  }

  // Kullanıcı rolünü güncelle
  async updateUserRole(userId: string, role: string) {
    return this.updateUserProfile(userId, { role });
  }

  // Kullanıcının admin olup olmadığını kontrol et
  async isAdmin(): Promise<boolean> {
    const user = this._currentUser.getValue();
    if (!user) return false;

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) return false;
      return data?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  // --- Companies ---
  async getCompanies() {
    const { data, error } = await this.supabase.from('companies').select('*').order('name');
    if (error) throw error;
    return data as Company[];
  }

  async upsertCompany(company: Partial<Company>) {
    const user = this._currentUser.getValue();
    if (user && !company.user_id) {
      company.user_id = user.id;
    }

    const { data, error } = await this.supabase.from('companies').upsert(company).select().single();
    if (error) throw error;
    return data as Company;
  }

  async deleteCompany(id: number) {
    const { error } = await this.supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Vehicles ---
  async getVehicles() {
    const { data, error } = await this.supabase.from('vehicles').select('*').order('plate_number');
    if (error) throw error;
    return data as Vehicle[];
  }

  async upsertVehicle(vehicle: Partial<Vehicle>) {
    const user = this._currentUser.getValue();
    if (user && !vehicle.user_id) {
      vehicle.user_id = user.id;
    }

    const { data, error } = await this.supabase.from('vehicles').upsert(vehicle).select().single();
    if (error) throw error;
    return data as Vehicle;
  }

  async deleteVehicle(id: number) {
    const { error } = await this.supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Contracts ---
  async getContracts() {
    const { data, error } = await this.supabase
      .from('contracts')
      .select(
        `
        *,
        companies (name),
        vehicles (plate_number)
      `
      )
      .order('id', { ascending: false });
    // Note: The structure returned by relational queries needs mapping if strict types are used,
    // but for now we trust the shape or cast partially.
    if (error) throw error;
    return data;
  }

  async getActiveContract(companyId: number, vehicleId: number | null, date: string) {
    // Find specific contract first
    let query = this.supabase
      .from('contracts')
      .select('*')
      .eq('company_id', companyId)
      .lte('start_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`);

    if (vehicleId) {
      // Try to find specific vehicle contract
    }

    const { data, error } = await this.supabase
      .from('contracts')
      .select('*')
      .eq('company_id', companyId)
      .lte('start_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`);

    if (error) throw error;

    // Filter in memory for best match if multiple
    if (!data || data.length === 0) return null;

    // Prioritize contract with matching vehicle_id
    const specific = data.find((c) => c.vehicle_id === vehicleId);
    if (specific) return specific;

    // Fallback to general contract (vehicle_id is null)
    const general = data.find((c) => c.vehicle_id === null);
    return general || null;
  }

  async upsertContract(contract: Partial<Contract>) {
    const user = this._currentUser.getValue();
    if (user && !contract.user_id) {
      contract.user_id = user.id;
    }

    const { data, error } = await this.supabase
      .from('contracts')
      .upsert(contract)
      .select()
      .single();
    if (error) throw error;
    return data as Contract;
  }

  async deleteContract(id: number) {
    const { error } = await this.supabase.from('contracts').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Daily Logs ---
  async getDailyLogs() {
    const { data, error } = await this.supabase
      .from('daily_logs')
      .select(
        `
        *,
        companies (name),
        vehicles (plate_number, driver_name)
      `
      )
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addDailyLog(log: Partial<DailyLog>) {
    const user = this._currentUser.getValue();
    if (user && !log.user_id) {
      log.user_id = user.id;
    }

    const { data, error } = await this.supabase.from('daily_logs').insert(log).select().single();
    if (error) throw error;
    return data as DailyLog;
  }

  async deleteDailyLog(id: number) {
    const { error } = await this.supabase.from('daily_logs').delete().eq('id', id);
    if (error) throw error;
  }
}
