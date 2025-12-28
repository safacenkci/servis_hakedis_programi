export interface Profile {
    id: string; // uuid
    email: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
    is_approved?: boolean; // Admin onayı için
    subscription_active?: boolean; // Abonelik durumu
    subscription_expires_at?: string; // Abonelik bitiş tarihi
    created_at?: string;
}

export interface Company {
    id: number;
    name: string;
    address?: string;
    user_id?: string; // uuid
    created_at?: string;
}

export interface Vehicle {
    id: number;
    plate_number: string;
    driver_name?: string;
    driver_phone?: string;
    capacity?: number;
    user_id?: string; // uuid
    created_at?: string;
}

export interface Contract {
    id: number;
    company_id: number | null;
    vehicle_id: number | null;
    daily_rate: number;
    overtime_rate: number;
    start_date: string;
    end_date?: string | null;
    user_id?: string; // uuid
    created_at?: string;

    // Relations (optional, commonly used in joins)
    companies?: Company;
    vehicles?: Vehicle;
}

export interface DailyLog {
    id: number;
    date: string;
    vehicle_id: number | null;
    company_id: number | null;
    is_overtime: boolean;
    calculated_fee: number;
    description?: string;
    user_id?: string; // uuid
    created_at?: string;

    // Relations
    companies?: Company;
    vehicles?: Vehicle;
}

// Helper specific to Supabase Database structure if generated types are used,
// but for manual typing, the above suffices for the app layer.
