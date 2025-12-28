# 🔍 Debug Adımları - Admin Giriş Sorunu

## Sorun
Admin kullanıcı veritabanında doğru ayarlanmış ama hala "Hesap Onayı Bekleniyor" sayfası görünüyor.

## Debug Adımları

### 1. Browser Console'u Açın
1. Tarayıcıda **F12** tuşuna basın
2. **Console** sekmesine gidin
3. Sayfayı yenileyin (F5)
4. Console'da şu logları görmelisiniz:
   - `checkUserApproval: Checking user: [user-id] [email]`
   - `checkUserApproval: Profile data: {...}`
   - `checkUserApproval: User approved...` veya hata mesajı

### 2. Hata Mesajlarını Kontrol Edin

Eğer console'da hata görüyorsanız:

#### Hata: "Profile check error"
- RLS politikaları sorun çıkarıyor olabilir
- Çözüm: Aşağıdaki SQL'i çalıştırın

#### Hata: "No user found"
- Session sorunu var
- Çözüm: Çıkış yapıp tekrar giriş yapın

### 3. RLS Politikalarını Kontrol Edin

Supabase Dashboard > SQL Editor'de şu sorguyu çalıştırın:

```sql
-- Mevcut RLS politikalarını görüntüle
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

### 4. Manuel Test - SQL ile Kontrol

Supabase Dashboard > SQL Editor'de şu sorguyu çalıştırın (email'inizi yazın):

```sql
-- Kullanıcı profilini kontrol et
SELECT 
    id,
    email,
    role,
    is_approved,
    subscription_active,
    subscription_expires_at
FROM public.profiles
WHERE email = 'admin@gmail.com';
```

Beklenen sonuç:
- `is_approved` = `true`
- `subscription_active` = `true`
- `role` = `admin`

### 5. RLS Politikasını Geçici Olarak Devre Dışı Bırakın (Test İçin)

**DİKKAT:** Sadece test için! Production'da kullanmayın!

```sql
-- Geçici olarak RLS'yi kapat (SADECE TEST İÇİN!)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Test edin, çalışıyorsa tekrar açın:

```sql
-- RLS'yi tekrar aç
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### 6. Session'ı Temizleyin

1. Uygulamadan **çıkış yapın**
2. Browser'da **F12** > **Application** > **Local Storage**
3. Supabase ile ilgili tüm key'leri silin
4. **Cookies** sekmesine gidin
5. Supabase ile ilgili tüm cookie'leri silin
6. Sayfayı yenileyin
7. Tekrar giriş yapın

### 7. Hard Refresh

- **Windows/Linux:** `Ctrl + Shift + R` veya `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`

## En Olası Sorun: RLS Politikaları

Eğer RLS politikaları sorun çıkarıyorsa, şu SQL'i çalıştırın:

```sql
-- Kullanıcıların kendi profilini görebilmesi için policy (zaten var olmalı)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
```

## Console Log'larını Paylaşın

Eğer hala çalışmıyorsa, browser console'daki log'ları paylaşın. Özellikle:
- `checkUserApproval: Checking user:` satırı
- `checkUserApproval: Profile data:` satırı
- Herhangi bir hata mesajı

