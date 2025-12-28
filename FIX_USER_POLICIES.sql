-- ============================================
-- Kullanıcı Politikalarını Düzelt
-- ============================================
-- Bu SQL, "Herkese açık" politikalarını kaldırır ve
-- normal kullanıcıların sadece kendi verilerini görebilmesi için
-- doğru politikaları oluşturur.

-- 1. "Herkese açık" politikalarını kaldır
DROP POLICY IF EXISTS "Herkese açık companies" ON public.companies;
DROP POLICY IF EXISTS "Herkese açık vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Herkese açık contracts" ON public.contracts;
DROP POLICY IF EXISTS "Herkese açık daily_logs" ON public.daily_logs;

-- 2. Companies Tablosu için Kullanıcı Politikaları
-- Kullanıcılar sadece kendi şirketlerini görebilir
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view own companies"
    ON public.companies FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcılar kendi şirketlerini güncelleyebilir
DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can update own companies"
    ON public.companies FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi şirketlerini silebilir
DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;
CREATE POLICY "Users can delete own companies"
    ON public.companies FOR DELETE
    USING (auth.uid() = user_id);

-- Kullanıcılar yeni şirket oluşturabilir
DROP POLICY IF EXISTS "Users can insert own companies" ON public.companies;
CREATE POLICY "Users can insert own companies"
    ON public.companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Vehicles Tablosu için Kullanıcı Politikaları
-- Kullanıcılar sadece kendi araçlarını görebilir
DROP POLICY IF EXISTS "Users can view own vehicles" ON public.vehicles;
CREATE POLICY "Users can view own vehicles"
    ON public.vehicles FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcılar kendi araçlarını güncelleyebilir
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
CREATE POLICY "Users can update own vehicles"
    ON public.vehicles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi araçlarını silebilir
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;
CREATE POLICY "Users can delete own vehicles"
    ON public.vehicles FOR DELETE
    USING (auth.uid() = user_id);

-- Kullanıcılar yeni araç oluşturabilir
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
CREATE POLICY "Users can insert own vehicles"
    ON public.vehicles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Contracts Tablosu için Kullanıcı Politikaları
-- Kullanıcılar sadece kendi sözleşmelerini görebilir
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
CREATE POLICY "Users can view own contracts"
    ON public.contracts FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcılar kendi sözleşmelerini güncelleyebilir
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
CREATE POLICY "Users can update own contracts"
    ON public.contracts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi sözleşmelerini silebilir
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
CREATE POLICY "Users can delete own contracts"
    ON public.contracts FOR DELETE
    USING (auth.uid() = user_id);

-- Kullanıcılar yeni sözleşme oluşturabilir
DROP POLICY IF EXISTS "Users can insert own contracts" ON public.contracts;
CREATE POLICY "Users can insert own contracts"
    ON public.contracts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Daily Logs Tablosu için Kullanıcı Politikaları
-- Kullanıcılar sadece kendi günlük kayıtlarını görebilir
DROP POLICY IF EXISTS "Users can view own daily logs" ON public.daily_logs;
CREATE POLICY "Users can view own daily logs"
    ON public.daily_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcılar kendi günlük kayıtlarını güncelleyebilir
DROP POLICY IF EXISTS "Users can update own daily logs" ON public.daily_logs;
CREATE POLICY "Users can update own daily logs"
    ON public.daily_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi günlük kayıtlarını silebilir
DROP POLICY IF EXISTS "Users can delete own daily logs" ON public.daily_logs;
CREATE POLICY "Users can delete own daily logs"
    ON public.daily_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Kullanıcılar yeni günlük kayıt oluşturabilir
DROP POLICY IF EXISTS "Users can insert own daily logs" ON public.daily_logs;
CREATE POLICY "Users can insert own daily logs"
    ON public.daily_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Sonuç:
-- ============================================
-- ✅ "Herkese açık" politikaları kaldırıldı
-- ✅ Normal kullanıcılar sadece kendi verilerini görebilir
-- ✅ Admin kullanıcılar tüm verileri görebilir (admin politikaları zaten var)
-- ✅ Güvenlik sağlandı

