-- ============================================
-- RLS'yi Etkinleştir (Eğer Kapalıysa)
-- ============================================
-- Bu SQL, RLS kapalıysa açar, açıksa hata vermez

-- Companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'companies' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Companies tablosunda RLS etkinleştirildi';
    ELSE
        RAISE NOTICE 'Companies tablosunda RLS zaten açık';
    END IF;
END $$;

-- Vehicles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Vehicles tablosunda RLS etkinleştirildi';
    ELSE
        RAISE NOTICE 'Vehicles tablosunda RLS zaten açık';
    END IF;
END $$;

-- Contracts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'contracts' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Contracts tablosunda RLS etkinleştirildi';
    ELSE
        RAISE NOTICE 'Contracts tablosunda RLS zaten açık';
    END IF;
END $$;

-- Daily Logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'daily_logs' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Daily_logs tablosunda RLS etkinleştirildi';
    ELSE
        RAISE NOTICE 'Daily_logs tablosunda RLS zaten açık';
    END IF;
END $$;

