-- ============================================
-- RLS Durumunu Kontrol Et
-- ============================================
-- Bu SQL, tablolardaki RLS durumunu kontrol eder

-- 1. RLS Durumunu Kontrol Et
SELECT 
    tablename,
    rowsecurity as "RLS Açık"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('companies', 'vehicles', 'contracts', 'daily_logs')
ORDER BY tablename;

-- 2. Mevcut Politikaları Görüntüle
SELECT 
    tablename,
    policyname,
    cmd as "Komut",
    qual as "Koşul"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('companies', 'vehicles', 'contracts', 'daily_logs')
ORDER BY tablename, policyname;

-- ============================================
-- Eğer RLS Kapalıysa Açmak İçin:
-- ============================================
-- Aşağıdaki komutları çalıştırın (sadece RLS kapalıysa)

-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

