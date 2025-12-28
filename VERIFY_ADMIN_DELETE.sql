-- ============================================
-- Admin Silme İşlemi Doğrulama
-- ============================================
-- Bu SQL, admin kullanıcıların silme işlemlerini
-- yapabilmesi için RLS politikalarını kontrol eder.

-- 1. Mevcut admin silme politikalarını kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'companies'
  AND cmd = 'DELETE'
ORDER BY policyname;

-- 2. is_admin() fonksiyonunu test et
SELECT 
    public.is_admin() as "is_admin() Sonucu",
    auth.uid() as "Current User ID";

-- 3. Admin kullanıcının profilini kontrol et
SELECT 
    id,
    email,
    role,
    is_approved
FROM public.profiles
WHERE role = 'admin'
LIMIT 5;

-- 4. Companies tablosundaki RLS durumunu kontrol et
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';

-- 5. Eğer admin silme politikası yoksa, oluştur
-- (Bu komutları sadece gerekirse çalıştırın)
/*
DROP POLICY IF EXISTS "Admins can delete all companies" ON public.companies;
CREATE POLICY "Admins can delete all companies"
    ON public.companies FOR DELETE
    USING (public.is_admin());
*/

