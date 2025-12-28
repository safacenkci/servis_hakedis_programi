-- ============================================
-- Admin Silme Politikasını Düzelt
-- ============================================
-- Bu SQL, admin kullanıcıların silme işlemlerini
-- yapabilmesi için RLS politikalarını düzeltir.

-- 1. Mevcut admin silme politikasını kaldır ve yeniden oluştur
DROP POLICY IF EXISTS "Admins can delete all companies" ON public.companies;
CREATE POLICY "Admins can delete all companies"
    ON public.companies FOR DELETE
    USING (public.is_admin());

-- 2. Kullanıcı silme politikasını da kontrol et (çakışma olmaması için)
-- Bu politika zaten varsa sorun yok, yoksa oluştur
DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;
CREATE POLICY "Users can delete own companies"
    ON public.companies FOR DELETE
    USING (auth.uid() = user_id);

-- 3. RLS'nin aktif olduğundan emin ol
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 4. Test sorgusu - Admin kullanıcı ile test edin
-- (Bu sorguyu admin kullanıcı ile çalıştırın)
SELECT 
    'Admin Delete Policy Test' as test,
    public.is_admin() as "is_admin()",
    COUNT(*) as "Total Companies"
FROM public.companies;

