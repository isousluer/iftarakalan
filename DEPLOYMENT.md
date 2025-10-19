# 🚀 GitHub + Netlify Deployment Kılavuzu

Bu proje GitHub'a push edildikten sonra Netlify üzerinden ücretsiz olarak deploy edilebilir ve kendi domain'inizi bağlayabilirsiniz.

## 📋 Gereksinimler

- GitHub hesabı
- Netlify hesabı (GitHub ile giriş yapabilirsiniz - ücretsiz)
- Domain (opsiyonel - iftarakalan.com gibi)

## 🔧 Adım 1: GitHub'a Push

```bash
# Git repository'sini başlat (eğer başlatılmamışsa)
git init

# Dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit - İftar Geri Sayım uygulaması"

# GitHub'da yeni repository oluştur (iftarakalan adında)
# Sonra remote ekle
git remote add origin https://github.com/KULLANICI_ADIN/iftarakalan.git

# Push et
git push -u origin main
```

## ☁️ Adım 2: Netlify'da Deploy

### 2.1 Netlify'a Giriş
1. https://netlify.com adresine git
2. "Sign up" ile GitHub hesabınla giriş yap

### 2.2 Site Oluştur
1. Dashboard'da "Add new site" > "Import an existing project"
2. "Deploy with GitHub" seç
3. Repository'ni seç (iftarakalan)
4. Deploy ayarları:
   - **Build command**: Boş bırak (statik site)
   - **Publish directory**: `.` (nokta)
5. "Deploy site" butonuna tıkla

### 2.3 Deployment Bekle
- Netlify otomatik olarak deploy edecek (~1 dakika)
- URL şuna benzer olacak: `https://random-name-123.netlify.app`

## 🌐 Adım 3: Domain Bağlama

### 3.1 Netlify'da Domain Ayarları
1. Site dashboard'unda "Domain settings"
2. "Add custom domain"
3. Domain'inizi girin: `iftarakalan.com`
4. Netlify 2 seçenek sunar:

#### Seçenek A: Netlify DNS (Önerilen - Kolay)
1. "Use Netlify DNS" seç
2. Domain registrar'ınızda (GoDaddy, Namecheap vb.) nameserver'ları değiştir:
   ```
   dns1.p03.nsone.net
   dns2.p03.nsone.net
   dns3.p03.nsone.net
   dns4.p03.nsone.net
   ```
3. Propagasyon bekle (5 dakika - 48 saat)

#### Seçenek B: External DNS (Manuel)
1. Domain registrar'ında A kaydı ekle:
   - Type: `A`
   - Name: `@`
   - Value: Netlify IP'si (Netlify'da gösterilir)
2. CNAME kaydı ekle (www için):
   - Type: `CNAME`
   - Name: `www`
   - Value: `random-name-123.netlify.app`

### 3.2 SSL Sertifikası
- Netlify otomatik SSL verir (Let's Encrypt)
- 1 dakika içinde aktif olur
- HTTPS otomatik çalışır

## ✅ Test Et

Deploy sonrası test:
```
https://iftarakalan.com
```

1. Sayfanın yüklendiğini kontrol et
2. Konum izni ver veya manuel seç
3. İftar saatinin göründüğünü kontrol et
4. Geri sayımın çalıştığını kontrol et

## 🔄 Güncellemeler

Kod değişikliği yaptığında:
```bash
git add .
git commit -m "Güncelleme açıklaması"
git push
```

Netlify otomatik olarak yeniden deploy eder (1 dakika).

## 🎯 Netlify Özellikleri

### Ücretsiz Plan İçeriği:
- ✅ Unlimited bandwidth
- ✅ Automatic SSL/HTTPS
- ✅ Serverless functions (proxy için)
- ✅ Continuous deployment
- ✅ Custom domain
- ✅ CDN (hızlı yükleme)

### Netlify Functions
Proxy server otomatik çalışır (netlify/functions/proxy.js):
- Development: `http://localhost:8081/api/proxy`
- Production: `https://iftarakalan.com/api/proxy`

## 🐛 Sorun Giderme

### Deploy Başarısız
- Netlify logs'u kontrol et
- `netlify.toml` dosyasını kontrol et

### Proxy Çalışmıyor
- Netlify Functions enabled mi kontrol et
- Browser console'da hata var mı bak

### Domain Çalışmıyor
- DNS propagasyon bekle (max 48 saat)
- Nameserver'ların doğru olduğunu kontrol et
- `dig iftarakalan.com` komutuyla test et

## 📊 Monitoring

Netlify Dashboard'da:
- Deploy history
- Function logs
- Bandwidth usage
- Analytics (opsiyonel ücretli)

## 💡 İpuçları

1. **Branch Deploys**: `dev` branch'i oluştur, test et, sonra `main`'e merge et
2. **Deploy Previews**: Pull request'ler için otomatik preview URL'leri
3. **Environment Variables**: Hassas bilgiler için Netlify env vars kullan
4. **Custom Headers**: `netlify.toml`'da zaten var (güvenlik)

## 🎉 Tamamlandı!

Artık projen canlı: `https://iftarakalan.com` 🌙