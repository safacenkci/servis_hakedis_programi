-- ============================================
-- Admin Erişim Sorununu Düzelt
-- ============================================
-- Eğer admin kullanıcı verileri göremiyorsa bu SQL'i çalıştırın

-- 1. Admin kullanıcının rolünü kontrol ve düzelt
-- (Email'inizi buraya yazın)
UPDATE public.profiles
SET 
    role = 'admin',
    is_approved = true,
    subscription_active = true
WHERE email = 'admin@gmail.com';  -- Admin email'inizi yazın

-- 2. is_admin() fonksiyonunu yeniden oluştur (güvenli versiyon)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    current_user_id UUID;
BEGIN
    -- Mevcut kullanıcı ID'sini al
    current_user_id := auth.uid();
    
    -- Eğer kullanıcı yoksa false döndür
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- SECURITY DEFINER ile RLS'yi bypass ederek admin kontrolü yap
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = current_user_id;
    
    -- Eğer role bulunamazsa false döndür
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Test sorgusu - Admin mi kontrol et
SELECT 
    email,
    role,
    public.is_admin() as "Admin mi?"
FROM public.profiles
WHERE email = 'admin@gmail.com';  -- Admin email'inizi yazın

