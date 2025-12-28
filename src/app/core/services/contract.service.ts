import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Contract } from '../models/database.types';

@Injectable({
    providedIn: 'root'
})
export class ContractService {

    constructor(private supabaseService: SupabaseService) { }

    async getContracts() {
        const user = this.supabaseService.currentUser;
        if (!user) return [];

        // Admin kontrolü - admin ise tüm sözleşmeleri getir
        const isAdmin = await this.supabaseService.isAdmin();
        let query = this.supabaseService.client
            .from('contracts')
            .select(`
        *,
        companies (name),
        vehicles (plate_number)
      `);

        // Admin değilse sadece kendi sözleşmelerini getir
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        
        // Kullanıcı bilgilerini ayrı sorgu ile çek ve birleştir
        if (isAdmin && data && data.length > 0) {
            const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))];
            if (userIds.length > 0) {
                const { data: profiles } = await this.supabaseService.client
                    .from('profiles')
                    .select('id, email, full_name')
                    .in('id', userIds);
                
                if (profiles) {
                    const profileMap = new Map(profiles.map(p => [p.id, p]));
                    data.forEach(contract => {
                        if (contract.user_id) {
                            contract.profiles = profileMap.get(contract.user_id) || null;
                        }
                    });
                }
            }
        }
        
        return data;
    }

    async getActiveContract(companyId: number, vehicleId: number | null, date: string) {
        const { data, error } = await this.supabaseService.client
            .from('contracts')
            .select('*')
            .eq('company_id', companyId)
            .lte('start_date', date)
            .or(`end_date.is.null,end_date.gte.${date}`);

        if (error) throw error;

        if (!data || data.length === 0) return null;

        // Prioritize contract with matching vehicle_id
        const specific = data.find(c => c.vehicle_id === vehicleId);
        if (specific) return specific;

        // Fallback to general contract (vehicle_id is null)
        const general = data.find(c => c.vehicle_id === null);
        return general || null;
    }

    async upsertContract(contract: Partial<Contract>) {
        const user = this.supabaseService.currentUser;
        if (user && !contract.user_id) {
            contract.user_id = user.id;
        }

        const { data, error } = await this.supabaseService.client
            .from('contracts')
            .upsert(contract)
            .select()
            .single();
        if (error) throw error;
        return data as Contract;
    }

    async deleteContract(id: number) {
        const { error } = await this.supabaseService.client
            .from('contracts')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}
