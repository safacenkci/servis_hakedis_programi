# 🔧 Session Sorunu Çözümü

## Sorun
Console'da `NavigatorLockAcquireTimeoutError` hatası görünüyor. Bu, Supabase'in session yönetimi ile ilgili bir sorun.

## Hızlı Çözüm

### 1. Tüm Tab'ları Kapatın
- Tarayıcıda açık olan **tüm tab'ları** kapatın
- Sadece **bir tab** açık bırakın
- O tab'ı da kapatın

### 2. Browser Cache'ini Temizleyin
- **Chrome/Edge:** `Ctrl + Shift + Delete`
- **Firefox:** `Ctrl + Shift + Delete`
- Şunları seçin:
  - ✅ Cookies and other site data
  - ✅ Cached images and files
- **Time range:** "All time"
- **Clear data** butonuna tıklayın

### 3. Gizli Modda Deneyin
- `Ctrl + Shift + N` (Chrome/Edge)
- `Ctrl + Shift + P` (Firefox)
- Gizli modda uygulamayı açın
- Giriş yapın

### 4. Console Log'larını Kontrol Edin
F12 > Console'da şu log'ları arayın:
- `checkUserApproval: Checking user:`
- `checkUserApproval: Profile data:`

Eğer bu log'lar görünmüyorsa, sorun session'da.

## Alternatif Çözüm: Session'ı Manuel Yenileme

Eğer hala çalışmıyorsa, şu kodu geçici olarak ekleyebiliriz:

```typescript
// signIn sonrası session'ı yenile
async signIn(email: string, password: string) {
    const result = await this.supabase.auth.signInWithPassword({ email, password });
    
    if (!result.error) {
        // Session'ı yenile
        await this.supabase.auth.refreshSession();
        // Kullanıcı bilgisini güncelle
        const { data: { session } } = await this.supabase.auth.getSession();
        this.handleSession(session);
    }
    
    return result;
}
```

## En Olası Neden
Birden fazla tab açık olduğunda Supabase'in lock mekanizması çakışıyor. Tüm tab'ları kapatıp tekrar deneyin.

