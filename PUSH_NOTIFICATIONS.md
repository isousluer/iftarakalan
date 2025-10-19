# 🔔 Push Notifications Kılavuzu

## 📋 Genel Bakış

İftara Kalan uygulaması artık **tarayıcı kapalı olsa bile** bildirim gönderebiliyor!

### ✨ Özellikler
- ✅ İftara 1 saat kala bildirim
- ✅ İftara 30 dakika kala bildirim
- ✅ İftara 10 dakika kala bildirim
- ✅ Kullanıcı hangi bildirimleri istediğini seçebilir
- ✅ Tarayıcı kapalı olsa bile çalışır (PWA)
- ✅ Test bildirimi özelliği

---

## 🛠️ Kurulum Adımları

### 1. Dependencies Yükle

```bash
cd /home/usluer/www/iftarakalan
npm install
```

Bu komut `web-push` paketini yükleyecek.

### 2. VAPID Keys Oluştur

```bash
npm run generate-vapid
```

Bu komut size 2 key verecek:
- **VAPID_PUBLIC_KEY** (public - frontend'de kullanılır)
- **VAPID_PRIVATE_KEY** (private - GİZLİ TUTUN!)

**Örnek çıktı:**
```
🔑 VAPID Keys oluşturuluyor...

✅ VAPID Keys başarıyla oluşturuldu!

📋 Bu key'leri Netlify Environment Variables'a ekleyin:

VAPID_PUBLIC_KEY:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

VAPID_PRIVATE_KEY:
bdSiNzUhUP6piAxLH-tW88zfBlWWveIx0dAsDO66aVU
```

### 3. Netlify Environment Variables Ekle

1. Netlify Dashboard'a git: https://app.netlify.com
2. Sitenizi seçin
3. **Site Settings** → **Environment Variables**
4. **Add a variable** butonuna tıkla
5. İki key'i ekle:

```
Key: VAPID_PUBLIC_KEY
Value: [yukarıdaki public key]

Key: VAPID_PRIVATE_KEY
Value: [yukarıdaki private key]
```

⚠️ **ÖNEMLİ:** Private key'i GitHub'a commit ETMEYİN!

### 4. Deploy

```bash
git add .
git commit -m "Push notifications eklendi"
git push origin main
```

Netlify otomatik deploy edecek.

---

## 📱 Kullanıcı Deneyimi

### Kullanıcı Akışı

1. **Siteye giriş** → Sağ altta 🔔 butonu görünür
2. **🔔 Butonuna tıkla** → Bildirim paneli açılır
3. **"Bildirimleri Aktif Et"** → Tarayıcı izin ister
4. **İzin ver** → Bildirimler aktif!
5. **Ayarları seç** → Hangi bildirimleri istediğini seç
6. **Test Et** → Test bildirimi gönder

### Bildirim Zamanları

| Zaman | Başlık | İçerik |
|-------|--------|--------|
| İftara 1 saat kala | İftara 1 Saat Kaldı! 🌙 | İftar saati: 18:45 |
| İftara 30 dakika kala | İftara 30 Dakika Kaldı! 🌙 | İftar saati: 18:45 |
| İftara 10 dakika kala | İftara 10 Dakika Kaldı! 🌙 | İftar saati: 18:45. Hazırlıklara başlayın! |

---

## 🏗️ Teknik Mimari

### Frontend

```
index.html
├── manifest.json (PWA config)
├── sw.js (Service Worker - push dinleme)
└── js/notifications.js (Notification Manager)
```

### Backend (Netlify Functions)

```
netlify/functions/
├── vapid-public-key.js (Public key endpoint)
├── save-subscription.js (Subscription kaydetme)
├── remove-subscription.js (Subscription silme)
└── scheduler.js (Cron job - her dakika çalışır)
```

### Veri Akışı

```
Kullanıcı → İzin verir → Subscription oluşturulur
                              ↓
                    Backend'e kaydedilir (/tmp/subscriptions.json)
                              ↓
                    Scheduler her dakika kontrol eder
                              ↓
                    "İftara 1 saat kaldı mı?"
                              ↓
                    EVET → Push notification gönder
                              ↓
                    Service Worker alır → Bildirim gösterir
```

---

## 🔧 Teknik Detaylar

### Service Worker (sw.js)

- Push event'lerini dinler
- Notification gösterir
- Bildirime tıklandığında uygulamayı açar

### Notification Manager (js/notifications.js)

- Service Worker kaydı
- İzin yönetimi
- Subscription oluşturma
- Ayarları kaydetme

### Scheduler (netlify/functions/scheduler.js)

- **Çalışma sıklığı:** Her dakika (cron: `* * * * *`)
- **İşlevi:**
  1. Tüm subscriptions'ları oku
  2. Her kullanıcı için iftar saatini kontrol et
  3. Bildirim zamanı geldiyse push gönder
  4. Geçersiz subscriptions'ları temizle

### Subscription Storage

**Development/Test:** `/tmp/subscriptions.json` (basit JSON dosyası)

**Production için öneriler:**
- Netlify Blobs (key-value storage)
- Firebase Firestore
- MongoDB Atlas
- PostgreSQL (Supabase)

---

## 📊 Tarayıcı Desteği

| Tarayıcı | Desktop | Mobile | Notlar |
|----------|---------|--------|--------|
| Chrome | ✅ | ✅ | Mükemmel |
| Firefox | ✅ | ✅ | Mükemmel |
| Edge | ✅ | ✅ | Mükemmel |
| Safari (macOS) | ✅ | - | İyi |
| Safari (iOS) | - | ⚠️ | iOS 16.4+ (Add to Home Screen gerekli) |

**iOS Kullanıcıları için:**
1. Safari'de siteyi aç
2. Share butonu → "Add to Home Screen"
3. Home screen'den aç
4. Bildirimleri aktif et

---

## 🧪 Test Etme

### Local Test (Development)

```bash
# 1. Dependencies yükle
npm install

# 2. Proxy server başlat
python3 proxy_server.py

# 3. Tarayıcıda aç
http://localhost:8081

# 4. Bildirim panelini aç (🔔 butonu)
# 5. "Bildirimleri Aktif Et"
# 6. "Test Et" butonuna tıkla
```

### Production Test

1. Netlify'a deploy et
2. VAPID keys'leri environment variables'a ekle
3. Siteyi aç (HTTPS gerekli)
4. Bildirimleri aktif et
5. Test bildirimi gönder
6. Tarayıcıyı kapat
7. İftar saatine yakın bir zaman ayarla (test için)
8. Scheduler çalışacak ve bildirim gelecek

---

## 🐛 Troubleshooting

### "Service Worker kaydedilemedi"

**Çözüm:** HTTPS gerekli. Localhost'ta veya HTTPS'te çalıştırın.

### "Notification izni verilmedi"

**Çözüm:** Tarayıcı ayarlarından site izinlerini kontrol edin.

### "Push notification gelmiyor"

**Kontrol listesi:**
1. ✅ VAPID keys Netlify'da tanımlı mı?
2. ✅ Scheduler function çalışıyor mu? (Netlify Functions logs)
3. ✅ Subscription kaydedildi mi? (Console'da kontrol et)
4. ✅ İftar saati doğru mu?
5. ✅ Bildirim ayarları aktif mi?

### "iOS'ta çalışmıyor"

**Çözüm:** 
- iOS 16.4+ gerekli
- "Add to Home Screen" yapılmalı
- Home screen'den açılmalı

---

## 📈 Monitoring

### Netlify Functions Logs

```bash
# Netlify CLI ile logs izle
netlify functions:log scheduler
```

### Console Logs

```javascript
// Frontend'de
console.log(NotificationManager.settings);
console.log(await NotificationManager.swRegistration.pushManager.getSubscription());

// Backend'de (scheduler.js)
// Logs Netlify dashboard'da görünür
```

---

## 🚀 Production Optimizasyonları

### 1. Database Kullan

`/tmp/subscriptions.json` yerine gerçek database:

```javascript
// Netlify Blobs örneği
const { getStore } = require("@netlify/blobs");

const store = getStore("subscriptions");
await store.set(endpoint, subscriptionData);
const data = await store.get(endpoint);
```

### 2. Rate Limiting

Aynı kullanıcıya çok fazla bildirim göndermeyi önle:

```javascript
// Son bildirim zamanını kaydet
const lastNotification = subscriptionData.lastNotification;
const now = Date.now();

if (now - lastNotification < 5 * 60 * 1000) {
  // 5 dakikadan kısa sürede tekrar gönderme
  return;
}
```

### 3. Analytics

Bildirim istatistikleri:

```javascript
// Kaç bildirim gönderildi?
// Kaç kullanıcı aktif?
// Hangi bildirimler daha çok açılıyor?
```

---

## 📝 Notlar

- **VAPID Keys:** Her proje için farklı key kullanın
- **Private Key:** Asla GitHub'a commit etmeyin
- **Subscription Storage:** Production'da database kullanın
- **Scheduler Frequency:** Her dakika çalışır (Netlify ücretsiz plan: 125K/ay)
- **iOS Support:** iOS 16.4+ ve "Add to Home Screen" gerekli

---

## 🔗 Faydalı Linkler

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/)
- [web-push Library](https://github.com/web-push-libs/web-push)

---

**Hazırlayan:** İftarakalan.com Team
**Tarih:** 2025-10-19
**Versiyon:** 2.0.0
