-- ============================================
-- Admin Erişim Hızlı Düzeltme
-- ============================================
-- Bu SQL'i çalıştırın ve admin email'inizi yazın

-- 1. Admin kullanıcıyı kontrol et ve düzelt
-- EMAIL'İNİZİ BURAYA YAZIN:
UPDATE public.profiles
SET 
    role = 'admin',
    is_approved = true,
    subscription_active = true,
    subscription_expires_at = NULL
WHERE email = 'admin@gmail.com';  -- ⚠️ BURAYA KENDİ EMAIL'İNİZİ YAZIN

-- 2. Güncelleme sonucunu kontrol et
SELECT 
    id,
    email,
    role,
    is_approved,
    subscription_active,
    'Güncellendi ✅' as durum
FROM public.profiles
WHERE email = 'admin@gmail.com';  -- ⚠️ BURAYA KENDİ EMAIL'İNİZİ YAZIN

-- 3. is_admin() fonksiyonunu test et
-- (Bu sorgu admin kullanıcı ile çalıştırıldığında true dönmeli)
SELECT 
    auth.uid() as "Kullanıcı ID",
    public.is_admin() as "Admin mi? (true olmalı)";

-- 4. Admin politikalarının çalışıp çalışmadığını test et
-- (Bu sorgular admin kullanıcı ile çalıştırıldığında veri dönmeli)
SELECT 
    'Companies' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.companies
UNION ALL
SELECT 
    'Vehicles' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.vehicles
UNION ALL
SELECT 
    'Contracts' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.contracts
UNION ALL
SELECT 
    'Daily Logs' as tablo,
    COUNT(*) as kayit_sayisi
FROM public.daily_logs;

