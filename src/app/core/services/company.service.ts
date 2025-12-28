import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Company } from '../models/database.types';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {

    constructor(private supabaseService: SupabaseService) { }

    async getCompanies() {
        const user = this.supabaseService.currentUser;
        if (!user) return [];

        // Admin kontrolü - admin ise tüm şirketleri getir
        const isAdmin = await this.supabaseService.isAdmin();
        let query = this.supabaseService.client
            .from('companies')
            .select('*');

        // Admin değilse sadece kendi şirketlerini getir
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('name');
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
                    data.forEach(company => {
                        if (company.user_id) {
                            company.profiles = profileMap.get(company.user_id) || null;
                        }
                    });
                }
            }
        }
        
        return data as any[];
    }

    async upsertCompany(company: Partial<Company>) {
        const user = this.supabaseService.currentUser;
        if (user && !company.user_id) {
            company.user_id = user.id;
        }

        const { data, error } = await this.supabaseService.client
            .from('companies')
            .upsert(company)
            .select()
            .single();
        if (error) throw error;
        return data as Company;
    }

    // Bağlı kayıtları kontrol et ve detaylarını getir
    async checkCompanyDependencies(id: number): Promise<{ contracts: any[] }> {
        const isAdmin = await this.supabaseService.isAdmin();
        
        // Bağlı sözleşmeleri getir
        let contractsQuery = this.supabaseService.client
            .from('contracts')
            .select('id, vehicle_id, start_date, end_date, daily_rate, vehicles(plate_number)')
            .eq('company_id', id);

        if (!isAdmin) {
            const user = this.supabaseService.currentUser;
            if (user) {
                contractsQuery = contractsQuery.eq('user_id', user.id);
            }
        }

        const { data: contracts } = await contractsQuery;

        return {
            contracts: contracts || []
        };
    }

    async deleteCompany(id: number) {
        // Direkt sil - veritabanı foreign key constraint ile koruyor
        const { data, error } = await this.supabaseService.client
            .from('companies')
            .delete()
            .eq('id', id)
            .select();
            
        if (error) {
            console.error('Company delete error:', error); // Debug için
            
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
                throw new Error('DEPENDENCIES_CHECK'); // Özel kod - bağlı kayıtlar var, detayları göster
            }
            // Permission hatası
            if (
                errorMessage.includes('permission') ||
                errorMessage.includes('policy') ||
                errorMessage.includes('row-level security') ||
                errorCode === '42501'
            ) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır. Lütfen admin yetkilerinizi kontrol edin.');
            }
            
            // Genel hata
            throw new Error(errorMessage || 'Şirket silinirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
        
        // Eğer data boşsa (silme başarısız ama hata yok)
        if (!data || data.length === 0) {
            throw new Error('Şirket bulunamadı veya silme yetkiniz bulunmamaktadır.');
        }
    }
}
