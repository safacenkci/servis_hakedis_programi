# 🚀 Hızlı Deployment ve Güvenlik Rehberi

## 📋 Özet

**Soru:** Angular kodlarını direkt yükleyince veritabanıyla çalışacak mı?

**Cevap:** Hayır! Angular bir frontend framework'tür. Önce **build** edilmesi gerekir. Build sonrası static HTML/CSS/JS dosyaları oluşur ve bunlar hosting'e yüklenir. Supabase zaten cloud'da çalışıyor, ayrı bir veritabanı sunucusu gerekmez.

---

# 🚀 Hızlı Deployment Adımları

## 1. Projeyi Build Etme

```bash
# Terminal'de proje klasörüne gidin
cd servis_hakedis_programi

# Production build
ng build --configuration production

# Build başarılı olursa dosyalar şurada:
# dist/servis-hakedis-programi/browser/
```

## 2. Vercel ile Deploy (5 Dakika)

### Adım 1: GitHub'a Yükleyin
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADI/PROJE-ADI.git
git push -u origin main
```

### Adım 2: Vercel'e Deploy
1. https://vercel.com → Sign up (GitHub ile)
2. "Add New..." → "Project"
3. GitHub repo'nuzu seçin
4. **Framework Preset:** Angular
5. **Root Directory:** ./ (boş bırakın)
6. **Build Command:** `ng build --configuration production`
7. **Output Directory:** `dist/servis-hakedis-programi/browser`
8. **Environment Variables:**
   - `SUPABASE_URL` = Supabase proje URL'iniz
   - `SUPABASE_ANON_KEY` = Supabase anon key'iniz
9. "Deploy" butonuna tıklayın

### Adım 3: Domain Bağlama (Opsiyonel)
- Vercel otomatik domain verir: `proje-adi.vercel.app`
- Settings > Domains'den kendi domain'inizi ekleyebilirsiniz

## 3. Supabase Güvenlik Ayarları

### Adım 1: Profiles Tablosu
1. Supabase Dashboard > SQL Editor
2. `SUPABASE_SETUP.sql` dosyasındaki SQL'i çalıştırın

### Adım 2: Email Confirmation
1. Supabase Dashboard > Authentication > Settings
2. "Enable email confirmations" açın
3. "Confirm email" seçeneğini aktif edin

### Adım 3: İlk Admin Kullanıcı
1. Authentication > Users > "Add User"
2. Email ve şifre girin
3. SQL Editor'de:
```sql
UPDATE public.profiles 
SET is_approved = true, 
    role = 'admin', 
    subscription_active = true
WHERE email = 'admin@example.com';
```

## 4. Test Etme

1. Yeni bir kullanıcı kaydı oluşturun
2. Email doğrulaması yapın
3. Giriş yapmayı deneyin → "Hesap Onayı Bekleniyor" sayfası görünmeli
4. Admin kullanıcı ile giriş yapın
5. Kullanıcıyı onaylayın (Supabase Dashboard'dan veya admin panelinden)
6. Kullanıcı tekrar giriş yapabilmeli

## ✅ Tamamlandı!

Artık:
- ✅ Projeniz canlıda
- ✅ Sadece onaylanan kullanıcılar giriş yapabilir
- ✅ Email doğrulaması zorunlu
- ✅ Abonelik kontrolü aktif

