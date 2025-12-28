-- ============================================
-- Supabase Database Setup for Admin Approval
-- ============================================
-- Bu SQL mevcut tablolara eksik kolonları ekler
-- Tablolar zaten oluşturulmuş olduğu için sadece eksik kolonları ekliyoruz

-- 1. Profiles tablosuna eksik kolonları ekle
DO $$ 
BEGIN
    -- is_approved kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_approved'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN is_approved BOOLEAN DEFAULT false;
        
        -- Mevcut kullanıcıları varsayılan olarak onaylı yap (opsiyonel - yorum satırını kaldırarak aktif edebilirsiniz)
        -- UPDATE public.profiles SET is_approved = true WHERE is_approved IS NULL;
    END IF;

    -- subscription_active kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_active'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_active BOOLEAN DEFAULT false;
    END IF;

    -- subscription_expires_at kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_expires_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_expires_at TIMESTAMP;
    END IF;

    -- updated_at kolonu (eğer yoksa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Index'ler ekle
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_is_approved_idx ON public.profiles(is_approved);
CREATE INDEX IF NOT EXISTS profiles_subscription_active_idx ON public.profiles(subscription_active);

-- 3. Yeni kullanıcı kaydında otomatik profile oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        is_approved, 
        subscription_active,
        role
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        false, -- Varsayılan olarak onay bekliyor
        false, -- Varsayılan olarak abonelik yok
        'user' -- Varsayılan rol
    )
    ON CONFLICT (id) DO NOTHING; -- Eğer profil zaten varsa hata verme
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS (Row Level Security) etkinleştir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Politikaları

-- Kullanıcılar sadece kendi profilini görebilir
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Kullanıcılar kendi profilini güncelleyebilir (sadece belirli alanlar)
-- NOT: is_approved, subscription_active ve role alanlarını değiştirmek için trigger kullanıyoruz
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin kontrolü için SECURITY DEFINER function (sonsuz döngüyü önlemek için)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- SECURITY DEFINER ile RLS'yi bypass ederek admin kontrolü yap
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin'ler tüm profilleri görebilir
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

-- Admin'ler tüm profilleri güncelleyebilir
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Kullanıcıların kritik alanları değiştirmesini engelleyen trigger
CREATE OR REPLACE FUNCTION public.prevent_critical_field_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    is_admin BOOLEAN;
BEGIN
    -- auth.uid() al (eğer null ise Supabase Dashboard'dan yapılıyor demektir, izin ver)
    current_user_id := auth.uid();
    
    -- Eğer auth.uid() null ise (Supabase Dashboard'dan yapılıyor), izin ver
    IF current_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Kullanıcının admin olup olmadığını kontrol et (is_admin function'ını kullan)
    is_admin := public.is_admin();
    
    -- Eğer kullanıcı admin değilse, kritik alanları değiştiremez
    IF NOT is_admin THEN
        -- Admin olmayan kullanıcılar bu alanları değiştiremez
        IF OLD.is_approved IS DISTINCT FROM NEW.is_approved THEN
            RAISE EXCEPTION 'is_approved alanını değiştirme yetkiniz yok';
        END IF;
        
        IF OLD.subscription_active IS DISTINCT FROM NEW.subscription_active THEN
            RAISE EXCEPTION 'subscription_active alanını değiştirme yetkiniz yok';
        END IF;
        
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            RAISE EXCEPTION 'role alanını değiştirme yetkiniz yok';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger'ları oluştur
DO $$
BEGIN
    -- Kritik alan değişikliklerini engelleyen trigger
    DROP TRIGGER IF EXISTS prevent_critical_changes ON public.profiles;
    CREATE TRIGGER prevent_critical_changes
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_critical_field_changes();
    
    -- Updated_at trigger (sadece updated_at kolonu varsa)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- Kullanım Notları:
-- ============================================
-- 1. Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın
-- 2. İlk admin kullanıcıyı manuel oluşturun:
--    - Supabase Dashboard > Authentication > Users > Add User
--    - Email ve şifre girin
--    - Sonra şu SQL'i çalıştırın:
--
--    UPDATE public.profiles 
--    SET is_approved = true, 
--        role = 'admin', 
--        subscription_active = true
--    WHERE email = 'admin@example.com';
--
-- 3. Yeni kullanıcılar kayıt olduğunda otomatik olarak:
--    - profiles tablosunda kayıt oluşur
--    - is_approved = false (onay bekliyor)
--    - subscription_active = false (abonelik yok)
--
-- 4. Admin kullanıcı Supabase Dashboard'dan veya bir admin panelinden
--    kullanıcıları onaylayabilir:
--
--    UPDATE public.profiles 
--    SET is_approved = true, 
--        subscription_active = true,
--        subscription_expires_at = '2025-12-31'
--    WHERE id = 'user-uuid-here';
