import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Vehicle } from '../models/database.types';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  constructor(private supabaseService: SupabaseService) {}

  async getVehicles() {
    const user = this.supabaseService.currentUser;
    if (!user) return [];

    // Admin kontrolü - admin ise tüm araçları getir
    const isAdmin = await this.supabaseService.isAdmin();
    let query = this.supabaseService.client.from('vehicles').select('*');

    // Admin değilse sadece kendi araçlarını getir
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('plate_number');
    if (error) throw error;

    // Kullanıcı bilgilerini ayrı sorgu ile çek ve birleştir
    if (isAdmin && data && data.length > 0) {
      const userIds = [...new Set(data.map((v) => v.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await this.supabaseService.client
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        if (profiles) {
          const profileMap = new Map(profiles.map((p) => [p.id, p]));
          data.forEach((vehicle) => {
            if (vehicle.user_id) {
              vehicle.profiles = profileMap.get(vehicle.user_id) || null;
            }
          });
        }
      }
    }

    return data as any[];
  }

  async upsertVehicle(vehicle: Partial<Vehicle>) {
    const user = this.supabaseService.currentUser;
    if (user && !vehicle.user_id) {
      vehicle.user_id = user.id;
    }

    const { data, error } = await this.supabaseService.client
      .from('vehicles')
      .upsert(vehicle)
      .select()
      .single();
    if (error) throw error;
    return data as Vehicle;
  }

  // Bağlı kayıtları kontrol et ve detaylarını getir
  async checkVehicleDependencies(id: number): Promise<{ contracts: any[]; logs: any[] }> {
    const isAdmin = await this.supabaseService.isAdmin();

    // Paralel sorgular - daha hızlı
    const [contractsResult, logsResult] = await Promise.all([
      // Bağlı sözleşmeleri getir
      (async () => {
        let contractsQuery = this.supabaseService.client
          .from('contracts')
          .select('id, company_id, vehicle_id, start_date, end_date, companies!inner(name)')
          .or(`vehicle_id.eq.${id},vehicle_id.is.null`);

        if (!isAdmin) {
          const user = this.supabaseService.currentUser;
          if (user) {
            contractsQuery = contractsQuery.eq('user_id', user.id);
          }
        }

        const { data: contracts } = await contractsQuery;
        return contracts || [];
      })(),
      // Bağlı günlük kayıtları getir
      (async () => {
        let logsQuery = this.supabaseService.client
          .from('daily_logs')
          .select('id, date, company_id, calculated_fee, companies!inner(name)')
          .eq('vehicle_id', id);

        if (!isAdmin) {
          const user = this.supabaseService.currentUser;
          if (user) {
            logsQuery = logsQuery.eq('user_id', user.id);
          }
        }

        const { data: logs } = await logsQuery;
        return logs || [];
      })(),
    ]);

    return {
      contracts: contractsResult,
      logs: logsResult,
    };
  }

  async deleteVehicle(id: number) {
    // Direkt sil - veritabanı foreign key constraint ile koruyor
    const { data, error } = await this.supabaseService.client
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Vehicle delete error:', error); // Debug için

      // Foreign key constraint hatası - bağlı kayıtlar var
      const errorMessage = error.message || error.toString() || '';
      const errorCode = error.code || '';

      if (
        errorMessage.includes('foreign key') ||
        errorMessage.includes('violates foreign key') ||
        errorMessage.includes('23503') ||
        errorCode === '23503' ||
        errorCode === 'PGRST116' // PostgREST no rows returned (bağlı kayıt var)
      ) {
        throw new Error(
          'DEPENDENCIES_CHECK' // Özel kod - bağlı kayıtlar var, detayları göster
        );
      }
      // Permission hatası
      if (
        errorMessage.includes('permission') ||
        errorMessage.includes('policy') ||
        errorMessage.includes('row-level security') ||
        errorCode === '42501'
      ) {
        throw new Error(
          'Bu işlem için yetkiniz bulunmamaktadır. Lütfen admin yetkilerinizi kontrol edin.'
        );
      }

      // Genel hata
      throw new Error(errorMessage || 'Araç silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }

    // Eğer data boşsa (silme başarısız ama hata yok)
    if (!data || data.length === 0) {
      throw new Error('Araç bulunamadı veya silme yetkiniz bulunmamaktadır.');
    }
  }
}
