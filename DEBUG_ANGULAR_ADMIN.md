# 🔍 Angular Admin Veri Görüntüleme Sorunu - Debug

## Sorun
SQL'de veriler görünüyor ama Angular uygulamasında admin kullanıcı verileri göremiyor.

## Debug Adımları

### 1. Browser Console'u Açın
1. Tarayıcıda **F12** tuşuna basın
2. **Console** sekmesine gidin
3. **Network** sekmesine gidin
4. Sayfayı yenileyin (F5)
5. Şirketler sayfasına gidin

### 2. Network Tab'ında Kontrol Edin
- `companies` için bir istek görüyor musunuz?
- İsteğin **Status** kodu nedir? (200, 400, 500?)
- İsteğin **Response** kısmında ne var?

### 3. Console'da Hata Var mı?
- Kırmızı hata mesajları var mı?
- Özellikle şunları arayın:
  - `Profile check error`
  - `Permission denied`
  - `Row Level Security`

### 4. Test: Manuel SQL Sorgusu
Supabase Dashboard > SQL Editor'de şu sorguyu çalıştırın:

```sql
-- Admin kullanıcı ile test (email'inizi yazın)
SELECT 
    auth.uid() as "Session User ID",
    public.is_admin() as "is_admin() Sonucu",
    COUNT(*) as "Toplam Şirket Sayısı"
FROM public.companies;
```

Eğer bu sorgu veri döndürüyorsa, sorun Angular tarafında.

### 5. Test: Angular'dan Direkt Sorgu
Browser Console'da şunu çalıştırın:

```javascript
// Supabase client'ı al
const supabase = window.supabaseClient; // veya global değişken

// Test sorgusu
supabase.from('companies').select('*').then(result => {
    console.log('Companies result:', result);
});
```

