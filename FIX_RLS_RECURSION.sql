-- ============================================
-- RLS Sonsuz Döngü Düzeltmesi
-- ============================================
-- Bu SQL, profiles tablosundaki admin policy'lerindeki
-- sonsuz döngü sorununu çözer.

-- 1. Admin kontrolü için SECURITY DEFINER function oluştur
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

-- 2. Eski admin policy'lerini kaldır
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Yeni admin policy'lerini oluştur (sonsuz döngü olmadan)
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Trigger function'ı da güncelle (is_admin function'ını kullan)
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

-- ============================================
-- Test
-- ============================================
-- Bu SQL'i çalıştırdıktan sonra, admin kullanıcı ile
-- giriş yapmayı deneyin. Artık sonsuz döngü hatası
-- almamanız gerekir.

