# İftar Geri Sayım Uygulaması 🌙

[![Status](https://img.shields.io/badge/status-production%20ready-success)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Ramazan ayında kullanıcılara iftara kalan süreyi anlık olarak gösteren, konum bazlı web uygulaması.

## 🌟 Özellikler

- ⏰ **Gerçek Zamanlı Geri Sayım**: İftara kalan saat, dakika ve saniye
- 📍 **Otomatik Konum Tespiti**: Tarayıcı geolocation API ile otomatik konum
- 🗺️ **Manuel Konum Seçimi**: Ülke > Şehir > İlçe dropdown seçimi
- 🎨 **Modern Tasarım**: Glassmorphism efektli dark theme
- 📱 **Responsive**: Tüm cihazlarda mükemmel çalışır
- ⚡ **Hızlı**: Minimal bağımlılık, hızlı yükleme
- 💾 **Akıllı Cache**: 30 günlük veri cache'lenir

## 🛠️ Teknolojiler

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS (CDN)
- **Font**: Plus Jakarta Sans (Google Fonts)
- **API**: ezanvakti.emushaf.net (Python proxy ile)
- **CORS Proxy**: Python HTTP server (development + production)

## 📁 Proje Yapısı

```
iftarakalan/
├── index.html              # Ana HTML dosyası
├── proxy_server.py         # CORS proxy server (GEREKLI!)
├── js/
│   ├── api.js             # API entegrasyonu (proxy kullanıyor)
│   ├── location.js        # Konum yönetimi
│   ├── countdown.js       # Geri sayım mantığı
│   ├── storage.js         # LocalStorage yönetimi
│   └── app.js             # Ana uygulama
├── memory-bank/           # Proje dokümantasyonu
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── activeContext.md
│   └── progress.md
└── README.md
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Python 3.x (proxy server için)
- Modern web browser

### Development Ortamı

1. **Projeyi klonlayın:**
```bash
git clone <repo-url>
cd iftarakalan
```

2. **CORS Proxy Server'ı başlatın (ZORUNLU):**
```bash
python3 proxy_server.py
```

Server şu mesajı gösterecek:
```
🚀 Proxy server başlatıldı: http://localhost:8081
📡 Proxy endpoint: http://localhost:8081/api/proxy?url=TARGET_URL
```

3. **Tarayıcıda açın:**
```
http://localhost:8081
```

### Neden Proxy Server Gerekli?

ezanvakti.emushaf.net API'si CORS (Cross-Origin Resource Sharing) başlıkları sağlamıyor. Bu yüzden browser'dan direkt API çağrısı yapılamaz. Proxy server bu sorunu çözer:

```
Browser → Proxy (CORS headers ekler) → emushaf API → Proxy → Browser
```

**Not**: Production deployment için Netlify Functions veya Vercel Edge Functions kullanılmalı.

## 📝 Kullanım

### Otomatik Konum
1. Uygulamayı açın
2. Tarayıcı konum izni isteğine "İzin Ver" deyin
3. Geri sayım otomatik başlar

### Manuel Konum
1. Konum izni reddedilirse veya "Konum Değiştir" butonuna tıklayın
2. Ülke, Şehir ve İlçe seçin
3. Geri sayım başlar

### 🍎 Safari Kullanıcıları İçin
Safari'de `localhost:8081` üzerinde geolocation çalışmaz (HTTPS gereksinimi). İki seçenek:
1. **Manuel Konum Seç** (önerilen - development için)
2. **HTTPS'te Test Et** (production'da çalışır - `https://iftarakalan.com`)

Detaylı bilgi: [`DEPLOYMENT.md - Safari Özel Notlar`](DEPLOYMENT.md#-safari-özel-notlar)

## 🔌 API Entegrasyonu

Uygulama [ezanvakti.emushaf.net](https://ezanvakti.emushaf.net) API'sini **CORS proxy üzerinden** kullanır:

### API Endpoints (Proxy üzerinden)
```javascript
// Development
GET http://localhost:8081/api/proxy?url=https://ezanvakti.emushaf.net/ulkeler
GET http://localhost:8081/api/proxy?url=https://ezanvakti.emushaf.net/sehirler/2
GET http://localhost:8081/api/proxy?url=https://ezanvakti.emushaf.net/ilceler/{sehirId}
GET http://localhost:8081/api/proxy?url=https://ezanvakti.emushaf.net/vakitler/{ilceId}
```

### Test Sonuçları (2025-10-18)
- ✅ 81 Türkiye şehri başarıyla yükleniyor
- ✅ Tüm ilçeler dinamik olarak yükleniyor
- ✅ 30 günlük namaz vakitleri alınıyor
- ✅ Cache sistemi çalışıyor
- ✅ İftar saati: `Aksam` field'ı kullanılıyor

## 💾 Veri Yönetimi

- **LocalStorage** kullanılır
- Prayer times: 30 gün cache
- Konum bilgisi: Persistent
- Günlük otomatik güncelleme

## 🎨 Tasarım

- **Renk Paleti**: Emerald Green (#34d399)
- **Tema**: Dark mode default
- **Efektler**: Glassmorphism, backdrop blur
- **Tipografi**: Plus Jakarta Sans

## 🧪 Testing

### Tamamlanan Testler (2025-10-18)
- [x] Geolocation timeout → manuel fallback
- [x] Manuel konum seçimi (81 şehir + tüm ilçeler)
- [x] API entegrasyonu (proxy üzerinden)
- [x] 30 günlük veri çekimi
- [x] Dropdown'ların dinamik doldurulması
- [x] LocalStorage cache sistemi

### Bekleyen Testler
- [x] Geolocation izin verildi senaryosu
- [x] Countdown doğruluğu (gerçek zamanlı)
- [x] Offline senaryo
- [x] Cross-browser (Safari, Firefox)
- [x] Mobile devices
- [x] Performance metrics

## 🚀 GitHub + Netlify ile Kolay Deployment

### Hızlı Başlangıç (3 Adım!)

```bash
# 1. GitHub'a push et
git add .
git commit -m "Initial commit"
git push origin main

# 2. Netlify'a bağlan
# https://netlify.com → "Import from GitHub" → Repo seç → Deploy!

# 3. Domain bağla (opsiyonel)
# Netlify Dashboard → Domain settings → Custom domain ekle
```

### 📖 Detaylı Deployment Kılavuzu
👉 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Adım adım tüm süreç!

### ✨ Netlify Özellikleri (Ücretsiz!)
- ✅ Otomatik SSL/HTTPS
- ✅ Serverless functions (proxy dahil!)
- ✅ CDN (dünya çapında hızlı yükleme)
- ✅ Custom domain desteği
- ✅ Continuous deployment (git push = auto deploy)
- ✅ Deploy previews (PR'lar için)

## 📦 Alternatif Deployment Seçenekleri

### ⚠️ ÖNEMLİ: CORS Proxy Gereksinimi

Production'da proxy server gereklidir. Seçenekler:

### Seçenek 1: Netlify Functions (ÖNERİLEN)

1. **Function dosyası oluştur:**
```javascript
// netlify/functions/proxy.js
exports.handler = async (event) => {
  const targetUrl = event.queryStringParameters.url;
  
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

2. **api.js'i güncelle:**
```javascript
PROXY_URL: "/.netlify/functions/proxy"
```

3. **Deploy:**
```bash
netlify deploy --prod
```

### Seçenek 2: Vercel Edge Functions

1. **Function dosyası:**
```javascript
// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;
  const response = await fetch(url);
  const data = await response.json();
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}
```

2. **Deploy:**
```bash
vercel --prod
```

### Seçenek 3: Custom Backend

Railway, Render, Fly.io üzerinde proxy_server.py'yi deploy edin.

## 📱 PWA (Gelecek)

Progressive Web App özellikleri eklenecek:
- Service Worker
- Offline support
- Add to Home Screen
- Push notifications

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.

## 👨‍💻 Geliştirici

Made with ❤️ for Ramadan

## 🔮 Gelecek Özellikler

- [ ] Diğer namaz vakitleri
- [ ] Bildirim sistemi
- [ ] Widget desteği
- [ ] Çoklu dil desteği
- [ ] Dark/Light theme toggle
- [ ] Mobil uygulama (Capacitor)
- [ ] Favori konumlar

## 📞 İletişim

Sorularınız için [issue açabilirsiniz](../../issues).

---

**Not**: Bu uygulama Ramazan ayında kullanım için tasarlanmıştır.