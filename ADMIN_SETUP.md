# 🔧 Admin Kullanıcı Onaylama - Adım Adım

## Sorun
Admin girişi yaptığınızda "Hesap Onayı Bekleniyor" sayfası görünüyor. Bu, admin kullanıcınızın `profiles` tablosunda `is_approved = true` olmadığı anlamına geliyor.

## Çözüm Adımları

### 1. Mevcut Durumu Kontrol Edin

Supabase Dashboard > SQL Editor'de şu sorguyu çalıştırın:

```sql
-- Tüm kullanıcıları ve durumlarını görüntüle
SELECT 
    id,
    email,
    full_name,
    role,
    is_approved,
    subscription_active,
    subscription_expires_at
FROM public.profiles
ORDER BY created_at DESC;
```

Bu sorgu size tüm kullanıcıları gösterecek. Admin email'inizi bulun.

### 2. Admin Kullanıcıyı Onaylayın

Admin email'inizi bulduktan sonra, şu SQL'i çalıştırın (email'i kendi email'inizle değiştirin):

```sql
UPDATE public.profiles 
SET is_approved = true, 
    role = 'admin', 
    subscription_active = true,
    subscription_expires_at = NULL  -- Süresiz abonelik için NULL
WHERE email = 'admin@example.com';  -- Buraya kendi email'inizi yazın
```

**ÖNEMLİ:** Email adresinizi tam olarak yazın (büyük/küçük harf duyarlı değil ama tam eşleşmeli).

### 3. Alternatif: Kullanıcı ID ile Onaylama

Eğer email ile bulamazsanız, kullanıcı ID'si ile de yapabilirsiniz:

```sql
-- Önce kullanıcı ID'nizi bulun
SELECT id, email FROM public.profiles WHERE email = 'admin@example.com';

-- Sonra ID ile güncelleyin
UPDATE public.profiles 
SET is_approved = true, 
    role = 'admin', 
    subscription_active = true
WHERE id = 'kullanici-uuid-buraya';  -- Yukarıdaki sorgudan aldığınız ID'yi yazın
```

### 4. Tüm Mevcut Kullanıcıları Onaylamak İsterseniz

Eğer test amaçlı tüm kullanıcıları onaylamak isterseniz:

```sql
-- Tüm kullanıcıları onayla
UPDATE public.profiles 
SET is_approved = true, 
    subscription_active = true
WHERE is_approved = false;
```

### 5. Tekrar Giriş Yapın

1. Uygulamadan çıkış yapın
2. Tekrar admin kullanıcı ile giriş yapın
3. Artık dashboard'a erişebilmelisiniz

## Kontrol Sorguları

### Admin kullanıcıyı kontrol et:
```sql
SELECT 
    email,
    role,
    is_approved,
    subscription_active
FROM public.profiles
WHERE email = 'admin@example.com';
```

Beklenen sonuç:
- `role` = 'admin'
- `is_approved` = true
- `subscription_active` = true

## Hala Çalışmıyorsa

### 1. Cache Temizleme
- Tarayıcı cache'ini temizleyin
- Veya gizli modda (incognito) deneyin

### 2. Session Kontrolü
- Çıkış yapın ve tekrar giriş yapın
- Supabase session'ı yenilenmeli

### 3. Kod Kontrolü
`checkUserApproval()` fonksiyonu doğru çalışıyor mu kontrol edin. Eğer hala sorun varsa, bana bildirin.

