# 🚀 Deployment ve Güvenlik Rehberi

## 📦 Projeyi Yayınlama (Deployment)

### Angular Nasıl Çalışır?

Angular bir **frontend framework**'tür. Build edildiğinde:
- Static HTML, CSS ve JavaScript dosyaları oluşur
- Bu dosyalar herhangi bir web sunucusunda çalışabilir
- **Backend gerekmez** - Supabase zaten cloud'da çalışıyor

### Deployment Adımları

#### 1. Projeyi Build Etme

```bash
# Production build
ng build --configuration production

# Build sonrası dosyalar şu klasörde oluşur:
# dist/servis-hakedis-programi/browser/
```

#### 2. Hosting Seçenekleri

##### ✅ Vercel (Önerilen - Ücretsiz)

1. **GitHub'a Push Edin:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/kullanici-adi/proje-adi.git
   git push -u origin main
   ```

2. **Vercel'e Deploy:**
   - https://vercel.com adresine gidin
   - GitHub ile giriş yapın
   - "New Project" > GitHub repo'nuzu seçin
   - Framework Preset: **Angular**
   - Build Command: `ng build --configuration production`
   - Output Directory: `dist/servis-hakedis-programi/browser`
   - Environment Variables ekleyin:
     - `SUPABASE_URL`: Supabase proje URL'iniz
     - `SUPABASE_ANON_KEY`: Supabase anon key'iniz
   - Deploy edin

3. **Domain Bağlama:**
   - Vercel ücretsiz domain verir: `proje-adi.vercel.app`
   - Settings > Domains'den kendi domain'inizi ekleyebilirsiniz
   - SSL otomatik sağlanır

##### ✅ Netlify (Alternatif)

1. GitHub'a push edin
2. https://netlify.com > "New site from Git"
3. Build settings:
   - Build command: `ng build --configuration production`
   - Publish directory: `dist/servis-hakedis-programi/browser`
4. Environment variables ekleyin
5. Deploy edin

##### ✅ Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Angular projesi seçin
# dist/servis-hakedis-programi/browser klasörünü seçin
ng build --configuration production
firebase deploy
```

### 3. Environment Variables

Production'da environment variables kullanın:

**Vercel/Netlify'da:**
- `SUPABASE_URL`: Supabase proje URL'iniz
- `SUPABASE_ANON_KEY`: Supabase anon key'iniz

**ÖNEMLİ:** Bu değerleri `.env` dosyasına koymayın, hosting platformunda ekleyin!

### 4. Veritabanı Bağlantısı

- ✅ Supabase zaten cloud'da çalışıyor
- ✅ Ayrı bir veritabanı sunucusu **GEREKMEZ**
- ✅ Angular uygulaması sadece Supabase API'ye istek atıyor
- ✅ Her kullanıcının verileri `user_id` ile ayrılır

### 5. Domain ve SSL

- Hosting platformları ücretsiz SSL sağlar (Let's Encrypt)
- Kendi domain'inizi bağlayabilirsiniz
- DNS ayarlarını domain sağlayıcınızda yapmanız gerekir

---

## 🔒 Güvenlik Önlemleri

### Seçenek 1: Email Confirmation (Basit)

**Supabase Dashboard'da:**
1. Authentication > Settings
2. "Enable email confirmations" açın
3. Kullanıcılar email doğrulaması yapmadan giriş yapamaz

### Seçenek 2: Admin Onayı Sistemi (Önerilen) ✅

Kodda zaten eklendi! Kullanıcılar kayıt olur ama admin onayı bekler.

**Supabase'de Yapılacaklar:**

1. **Profiles Tablosu Oluştur:**
   ```sql
   CREATE TABLE IF NOT EXISTS profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     full_name TEXT,
     is_approved BOOLEAN DEFAULT false,
     subscription_active BOOLEAN DEFAULT false,
     subscription_expires_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Trigger Oluştur (Yeni kullanıcı kaydında otomatik profile oluştur):**
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, full_name, is_approved, subscription_active)
     VALUES (
       NEW.id,
       NEW.email,
       NEW.raw_user_meta_data->>'full_name',
       false,
       false
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

3. **RLS (Row Level Security) Politikaları:**
   ```sql
   -- Kullanıcılar sadece kendi profilini görebilir
   CREATE POLICY "Users can view own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = id);

   -- Admin'ler tüm profilleri görebilir ve güncelleyebilir
   CREATE POLICY "Admins can manage all profiles"
     ON profiles FOR ALL
     USING (
       EXISTS (
         SELECT 1 FROM profiles
         WHERE id = auth.uid()
         AND role = 'admin'
       )
     );
   ```

4. **Admin Kullanıcı Oluşturma:**
   - Supabase Dashboard > Authentication > Users
   - Manuel olarak bir kullanıcı oluşturun
   - SQL Editor'de şu komutu çalıştırın:
   ```sql
   UPDATE profiles 
   SET is_approved = true, role = 'admin', subscription_active = true
   WHERE email = 'admin@example.com';
   ```

### Seçenek 3: Invite-Only Sistem

Sadece davet edilen email'ler kayıt olabilir.

**Supabase Dashboard'da:**
1. Authentication > Settings > Auth Providers
2. "Enable email confirmations" açın
3. "Disable sign ups" açın (sadece admin davet edebilir)

### Seçenek 4: Subscription Kontrolü

Abonelik durumunu kontrol eden sistem (kodda zaten var).

**Kullanım:**
- `subscription_active`: Abonelik aktif mi?
- `subscription_expires_at`: Abonelik ne zaman bitiyor?
- Admin panelinde bu değerleri güncelleyebilirsiniz

---

## 📋 Deployment Checklist

- [ ] Projeyi GitHub'a push edin
- [ ] Vercel/Netlify'da proje oluşturun
- [ ] Environment variables ekleyin
- [ ] Build settings'i yapılandırın
- [ ] Deploy edin
- [ ] Domain bağlayın (opsiyonel)
- [ ] Supabase'de profiles tablosu oluşturun
- [ ] Trigger ve RLS politikalarını ekleyin
- [ ] Admin kullanıcı oluşturun
- [ ] Email confirmation'ı açın (Supabase Dashboard)
- [ ] Test edin

---

## 🎯 Özet

1. **Angular Build:** `ng build` → Static dosyalar oluşur
2. **Hosting:** Vercel/Netlify'a yükleyin (ücretsiz)
3. **Domain:** Kendi domain'inizi bağlayın (opsiyonel)
4. **Veritabanı:** Supabase zaten cloud'da, ekstra bir şey gerekmez
5. **Güvenlik:** Admin onayı sistemi + Email confirmation

**Angular kodları direkt çalışmaz**, önce build edilmesi gerekir. Build sonrası static dosyalar oluşur ve bunlar hosting'e yüklenir. Supabase backend olarak çalışır, veritabanı ayrı bir sunucuda değil Supabase cloud'unda.
