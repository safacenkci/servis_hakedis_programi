-- ============================================
-- Admin Erişim Sorununu Debug Et
-- ============================================

-- 1. Admin kullanıcının rolünü kontrol et
-- (Email'inizi buraya yazın)
SELECT 
    id,
    email,
    role,
    is_approved,
    subscription_active
FROM public.profiles
WHERE email = 'admin@gmail.com';  -- Admin email'inizi yazın

-- 2. is_admin() fonksiyonunu test et
-- (Kullanıcı ID'nizi buraya yazın - yukarıdaki sorgudan alın)
SELECT public.is_admin() as "Admin mi?";

-- 3. Mevcut oturum kullanıcısını kontrol et
SELECT auth.uid() as "Mevcut Kullanıcı ID";

-- 4. is_admin() fonksiyonunun içeriğini kontrol et
SELECT 
    p.proname as "Fonksiyon Adı",
    pg_get_functiondef(p.oid) as "Fonksiyon Tanımı"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'is_admin';

-- 5. Admin politikalarının çalışıp çalışmadığını test et
-- (Bu sorguyu admin kullanıcı ile çalıştırın)
SELECT COUNT(*) as "Toplam Şirket Sayısı" FROM public.companies;
SELECT COUNT(*) as "Toplam Araç Sayısı" FROM public.vehicles;
SELECT COUNT(*) as "Toplam Sözleşme Sayısı" FROM public.contracts;
SELECT COUNT(*) as "Toplam Günlük Kayıt Sayısı" FROM public.daily_logs;

