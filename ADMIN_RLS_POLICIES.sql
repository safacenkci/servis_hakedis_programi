-- ============================================
-- Admin RLS Politikaları - Tüm Verileri Görüntüleme
-- ============================================
-- Bu SQL, admin kullanıcıların tüm kullanıcıların verilerini
-- (şirketler, araçlar, sözleşmeler, günlük kayıtlar) görebilmesi için
-- RLS politikalarını günceller.

-- 1. Companies Tablosu için Admin Politikaları
-- Admin'ler tüm şirketleri görebilir
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
CREATE POLICY "Admins can view all companies"
    ON public.companies FOR SELECT
    USING (public.is_admin());

-- Admin'ler tüm şirketleri güncelleyebilir
DROP POLICY IF EXISTS "Admins can update all companies" ON public.companies;
CREATE POLICY "Admins can update all companies"
    ON public.companies FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admin'ler tüm şirketleri silebilir
DROP POLICY IF EXISTS "Admins can delete all companies" ON public.companies;
CREATE POLICY "Admins can delete all companies"
    ON public.companies FOR DELETE
    USING (public.is_admin());

-- Admin'ler yeni şirket oluşturabilir
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;
CREATE POLICY "Admins can insert companies"
    ON public.companies FOR INSERT
    WITH CHECK (public.is_admin());

-- 2. Vehicles Tablosu için Admin Politikaları
-- Admin'ler tüm araçları görebilir
DROP POLICY IF EXISTS "Admins can view all vehicles" ON public.vehicles;
CREATE POLICY "Admins can view all vehicles"
    ON public.vehicles FOR SELECT
    USING (public.is_admin());

-- Admin'ler tüm araçları güncelleyebilir
DROP POLICY IF EXISTS "Admins can update all vehicles" ON public.vehicles;
CREATE POLICY "Admins can update all vehicles"
    ON public.vehicles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admin'ler tüm araçları silebilir
DROP POLICY IF EXISTS "Admins can delete all vehicles" ON public.vehicles;
CREATE POLICY "Admins can delete all vehicles"
    ON public.vehicles FOR DELETE
    USING (public.is_admin());

-- Admin'ler yeni araç oluşturabilir
DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
CREATE POLICY "Admins can insert vehicles"
    ON public.vehicles FOR INSERT
    WITH CHECK (public.is_admin());

-- 3. Contracts Tablosu için Admin Politikaları
-- Admin'ler tüm sözleşmeleri görebilir
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contracts;
CREATE POLICY "Admins can view all contracts"
    ON public.contracts FOR SELECT
    USING (public.is_admin());

-- Admin'ler tüm sözleşmeleri güncelleyebilir
DROP POLICY IF EXISTS "Admins can update all contracts" ON public.contracts;
CREATE POLICY "Admins can update all contracts"
    ON public.contracts FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admin'ler tüm sözleşmeleri silebilir
DROP POLICY IF EXISTS "Admins can delete all contracts" ON public.contracts;
CREATE POLICY "Admins can delete all contracts"
    ON public.contracts FOR DELETE
    USING (public.is_admin());

-- Admin'ler yeni sözleşme oluşturabilir
DROP POLICY IF EXISTS "Admins can insert contracts" ON public.contracts;
CREATE POLICY "Admins can insert contracts"
    ON public.contracts FOR INSERT
    WITH CHECK (public.is_admin());

-- 4. Daily Logs Tablosu için Admin Politikaları
-- Admin'ler tüm günlük kayıtları görebilir
DROP POLICY IF EXISTS "Admins can view all daily logs" ON public.daily_logs;
CREATE POLICY "Admins can view all daily logs"
    ON public.daily_logs FOR SELECT
    USING (public.is_admin());

-- Admin'ler tüm günlük kayıtları güncelleyebilir
DROP POLICY IF EXISTS "Admins can update all daily logs" ON public.daily_logs;
CREATE POLICY "Admins can update all daily logs"
    ON public.daily_logs FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admin'ler tüm günlük kayıtları silebilir
DROP POLICY IF EXISTS "Admins can delete all daily logs" ON public.daily_logs;
CREATE POLICY "Admins can delete all daily logs"
    ON public.daily_logs FOR DELETE
    USING (public.is_admin());

-- Admin'ler yeni günlük kayıt oluşturabilir
DROP POLICY IF EXISTS "Admins can insert daily logs" ON public.daily_logs;
CREATE POLICY "Admins can insert daily logs"
    ON public.daily_logs FOR INSERT
    WITH CHECK (public.is_admin());

-- ============================================
-- Notlar:
-- ============================================
-- 1. Bu politikalar, mevcut kullanıcı politikalarıyla birlikte çalışır
-- 2. Normal kullanıcılar sadece kendi verilerini görebilir
-- 3. Admin kullanıcılar hem kendi verilerini hem de tüm kullanıcıların verilerini görebilir
-- 4. is_admin() fonksiyonu FIX_RLS_RECURSION.sql'de tanımlanmış olmalı

