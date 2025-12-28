import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DailyLog } from '../models/database.types';

@Injectable({
    providedIn: 'root'
})
export class DailyLogService {

    constructor(private supabaseService: SupabaseService) { }

    async getDailyLogs(year?: number, month?: number) {
        const user = this.supabaseService.currentUser;
        if (!user) return [];

        // Admin kontrolü - admin ise tüm günlük kayıtları getir
        const isAdmin = await this.supabaseService.isAdmin();
        let query = this.supabaseService.client
            .from('daily_logs')
            .select(`
                *,
                companies (name),
                vehicles (plate_number, driver_name)
            `);

        // Admin değilse sadece kendi günlük kayıtlarını getir
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        // Apply month filter if provided
        if (year !== undefined && month !== undefined) {
            // Create date range for the month (UTC+3 consideration)
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        
        // Kullanıcı bilgilerini ayrı sorgu ile çek ve birleştir
        if (isAdmin && data && data.length > 0) {
            const userIds = [...new Set(data.map(l => l.user_id).filter(Boolean))];
            if (userIds.length > 0) {
                const { data: profiles } = await this.supabaseService.client
                    .from('profiles')
                    .select('id, email, full_name')
                    .in('id', userIds);
                
                if (profiles) {
                    const profileMap = new Map(profiles.map(p => [p.id, p]));
                    data.forEach(log => {
                        if (log.user_id) {
                            log.profiles = profileMap.get(log.user_id) || null;
                        }
                    });
                }
            }
        }
        
        return data;
    }

    // Get monthly summary per vehicle
    async getMonthlyVehicleSummary(year: number, month: number) {
        const logs = await this.getDailyLogs(year, month);

        // Group by vehicle_id and sum calculated_fee
        const vehicleSummary: {
            [key: number]: {
                vehicle_id: number;
                plate_number: string;
                driver_name: string;
                total_fee: number;
                log_count: number;
                overtime_count: number;
            }
        } = {};

        for (const log of logs) {
            if (!log.vehicle_id) continue;

            if (!vehicleSummary[log.vehicle_id]) {
                vehicleSummary[log.vehicle_id] = {
                    vehicle_id: log.vehicle_id,
                    plate_number: log.vehicles?.plate_number || 'Bilinmiyor',
                    driver_name: log.vehicles?.driver_name || '-',
                    total_fee: 0,
                    log_count: 0,
                    overtime_count: 0
                };
            }

            vehicleSummary[log.vehicle_id].total_fee += Number(log.calculated_fee) || 0;
            vehicleSummary[log.vehicle_id].log_count += 1;
            if (log.is_overtime) {
                vehicleSummary[log.vehicle_id].overtime_count += 1;
            }
        }

        return Object.values(vehicleSummary).sort((a, b) => b.total_fee - a.total_fee);
    }

    async addDailyLog(log: Partial<DailyLog>) {
        const user = this.supabaseService.currentUser;
        if (user && !log.user_id) {
            log.user_id = user.id;
        }

        const { data, error } = await this.supabaseService.client
            .from('daily_logs')
            .insert(log)
            .select()
            .single();
        if (error) throw error;
        return data as DailyLog;
    }

    async deleteDailyLog(id: number) {
        const { error } = await this.supabaseService.client
            .from('daily_logs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}
