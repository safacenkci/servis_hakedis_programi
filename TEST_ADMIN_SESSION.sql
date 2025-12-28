-- ============================================
-- Admin Session Test
-- ============================================
-- Bu SQL'i Angular uygulamasından çağrıldığında çalıştırın
-- veya Supabase Dashboard'da admin kullanıcı ile test edin

-- 1. Mevcut session kullanıcısını kontrol et
SELECT 
    auth.uid() as "Session User ID",
    auth.email() as "Session Email";

-- 2. is_admin() fonksiyonunu test et
SELECT 
    public.is_admin() as "is_admin() Sonucu",
    CASE 
        WHEN public.is_admin() THEN '✅ Admin olarak tanınıyor'
        ELSE '❌ Admin olarak tanınmıyor'
    END as "Durum";

-- 3. Admin kullanıcının profilini kontrol et
SELECT 
    id,
    email,
    role,
    is_approved,
    subscription_active
FROM public.profiles
WHERE id = auth.uid();

-- 4. Admin politikaları ile veri çekmeyi test et
-- (Bu sorgular admin kullanıcı ile çalıştırıldığında veri dönmeli)
SELECT 
    'Companies' as tablo,
    COUNT(*) as kayit_sayisi,
    string_agg(name, ', ') as ornek_veriler
FROM public.companies
LIMIT 5;

SELECT 
    'Vehicles' as tablo,
    COUNT(*) as kayit_sayisi,
    string_agg(plate_number, ', ') as ornek_veriler
FROM public.vehicles
LIMIT 5;

