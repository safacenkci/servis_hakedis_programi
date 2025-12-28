# ✅ Supabase Kurulumu Tamamlandı - Sonraki Adımlar

## 🎯 Şimdi Yapmanız Gerekenler

### 1. İlk Admin Kullanıcıyı Oluşturun

#### Adım 1: Kullanıcı Oluştur
1. **Supabase Dashboard** > **Authentication** > **Users**
2. **"Add User"** butonuna tıklayın
3. Email ve şifre girin (örnek: `admin@example.com`)
4. **"Create User"** butonuna tıklayın

#### Adım 2: Admin Yetkisi Ver
SQL Editor'de şu komutu çalıştırın (email'i kendi email'inizle değiştirin):

```sql
UPDATE public.profiles 
SET is_approved = true, 
    role = 'admin', 
    subscription_active = true
WHERE email = 'admin@example.com'; -- Buraya kendi email'inizi yazın
```

### 2. Mevcut Kullanıcıları Onaylayın (Opsiyonel)

Eğer daha önce kayıt olmuş kullanıcılar varsa, onları da onaylayabilirsiniz:

```sql
-- Tüm mevcut kullanıcıları onayla
UPDATE public.profiles 
SET is_approved = true, 
    subscription_active = true
WHERE is_approved = false;

-- Veya belirli bir kullanıcıyı onayla
UPDATE public.profiles 
SET is_approved = true, 
    subscription_active = true,
    subscription_expires_at = '2025-12-31' -- Abonelik bitiş tarihi
WHERE email = 'kullanici@example.com';
```

### 3. Email Confirmation Ayarlarını Kontrol Edin

1. **Supabase Dashboard** > **Authentication** > **Settings**
2. **"Enable email confirmations"** seçeneğini açın (önerilir)
3. Bu sayede yeni kullanıcılar email doğrulaması yapmadan giriş yapamaz

### 4. Test Edin

#### Test Senaryosu 1: Yeni Kullanıcı Kaydı
1. Uygulamanızda **"Kayıt Ol"** sayfasına gidin
2. Yeni bir kullanıcı kaydı oluşturun
3. Email doğrulaması yapın (eğer açıksa)
4. Giriş yapmayı deneyin
5. **"Hesap Onayı Bekleniyor"** sayfasını görmelisiniz

#### Test Senaryosu 2: Admin Onayı
1. Admin kullanıcı ile giriş yapın
2. Supabase Dashboard > **Table Editor** > **profiles** tablosuna gidin
3. Yeni kullanıcının `is_approved` değerini `true` yapın
4. Yeni kullanıcı tekrar giriş yapmayı denesin
5. Artık dashboard'a erişebilmeli

### 5. Kullanıcıları Yönetmek İçin

#### Supabase Dashboard'dan:
1. **Table Editor** > **profiles** tablosuna gidin
2. Kullanıcıları görüntüleyin ve düzenleyin
3. `is_approved`, `subscription_active`, `subscription_expires_at` alanlarını güncelleyin

#### SQL ile:
```sql
-- Kullanıcıyı onayla
UPDATE public.profiles 
SET is_approved = true, 
    subscription_active = true,
    subscription_expires_at = '2025-12-31'
WHERE email = 'kullanici@example.com';

-- Kullanıcının aboneliğini iptal et
UPDATE public.profiles 
SET subscription_active = false
WHERE email = 'kullanici@example.com';

-- Kullanıcıyı admin yap
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'kullanici@example.com';
```

### 6. Abonelik Kontrolü

Sistem otomatik olarak şunları kontrol eder:
- ✅ `is_approved = true` (Kullanıcı onaylanmış mı?)
- ✅ `subscription_active = true` (Abonelik aktif mi?)
- ✅ `subscription_expires_at > NOW()` (Abonelik süresi dolmamış mı?)

Eğer bu koşullardan biri sağlanmazsa, kullanıcı sisteme giriş yapamaz.

## 📋 Kontrol Listesi

- [ ] İlk admin kullanıcı oluşturuldu
- [ ] Admin yetkisi verildi (role = 'admin')
- [ ] Email confirmation açıldı (opsiyonel ama önerilir)
- [ ] Yeni kullanıcı kaydı test edildi
- [ ] Admin onayı test edildi
- [ ] Mevcut kullanıcılar onaylandı (eğer varsa)

## 🚀 Artık Hazırsınız!

Sisteminiz artık:
- ✅ Yeni kullanıcılar kayıt olabilir
- ✅ Admin onayı beklerler
- ✅ Onaylandıktan sonra sisteme giriş yapabilirler
- ✅ Abonelik kontrolü yapılır

**Not:** İleride bir admin paneli oluşturarak kullanıcıları daha kolay yönetebilirsiniz. Şimdilik Supabase Dashboard'dan yönetebilirsiniz.

