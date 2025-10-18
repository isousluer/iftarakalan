# System Patterns: İftar Geri Sayım Uygulaması

## Sistem Mimarisi

### Genel Mimari (GÜNCELLENMIŞ - CORS Proxy ile)
```
┌─────────────────────────────────────────────┐
│           Frontend (Web App)                │
├─────────────────────────────────────────────┤
│  • HTML/CSS/JavaScript                      │
│  • Responsive Design                        │
│  • Client-side Logic                        │
└──────────┬──────────────────────────┬───────┘
           │                          │
           ▼                          ▼
    ┌─────────────┐          ┌──────────────┐
    │ Geolocation │          │ CORS Proxy   │
    │     API     │          │ (Python/JS)  │
    │  (Browser)  │          │ Port: 8081   │
    └─────────────┘          └──────┬───────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │ Prayer Times │
                            │     API      │
                            │ (emushaf.net)│
                            └──────────────┘
```

**CORS Proxy Katmanı**:
- Development: Python proxy server (proxy_server.py)
- Production: Netlify/Vercel serverless functions
- İşlev: CORS başlıkları ekleyerek API erişimi sağlar

### Katmanlar

#### 1. Presentation Layer (UI)
- Kullanıcı arayüzü
- Responsive tasarım
- Animasyonlar ve görsel feedback

#### 2. Business Logic Layer
- Konum yönetimi
- Zaman hesaplamaları
- Geri sayım mantığı
- Durum yönetimi

#### 3. Data Layer
- API entegrasyonu
- Konum verileri
- İftar saatleri cache
- LocalStorage kullanımı

## Temel Teknik Kararlar

### 1. Frontend Teknolojisi
**Karar**: Vanilla JavaScript (veya hafif framework)
**Neden**:
- Hızlı yükleme
- Düşük complexity
- Kolay mobil dönüşüm
- Minimum bağımlılık

**Alternatifler**:
- React/Vue (daha sonra değerlendirilebilir)
- Vanilla JS (başlangıç için ideal)

### 2. API Seçimi ve CORS Çözümü
**Seçilen API**: ezanvakti.emushaf.net

**CORS Challenge**:
- API CORS başlıkları sağlamıyor
- Browser'dan direkt çağrı engelleniy or
- Terminal/curl ile çalışıyor ama browser'da değil

**Çözüm**: CORS Proxy Pattern
```
Browser Request → Proxy Server → External API → Proxy → Browser
```

**Proxy Implementation**:
```python
# proxy_server.py
class CORSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        super().end_headers()
    
    def do_GET(self):
        if self.path.startswith('/api/proxy?url='):
            target_url = parse_url_from_query(self.path)
            response = urllib.request.urlopen(target_url)
            self.send_response(200)
            self.send_cors_headers()
            self.wfile.write(response.read())
```

**Değerlendirme Kriterleri**:
- ✅ Ücretsiz kullanım
- ✅ 30 günlük veri (cache friendly)
- ✅ Güvenilirlik (test edildi)
- ✅ Veri doğruluğu (Türkiye verileri)
- ⚠️ CORS gereksinimi (proxy ile çözüldü)

### 3. Veri Yönetimi
**LocalStorage Kullanımı**:
```javascript
{
  "lastLocation": {
    "lat": 41.0082,
    "lng": 28.9784,
    "city": "Istanbul",
    "district": "Besiktas"
  },
  "prayerTimes": {
    "date": "2024-03-15",
    "fajr": "05:30",
    "sunrise": "06:52",
    "dhuhr": "13:15",
    "asr": "16:45",
    "maghrib": "19:25",
    "isha": "20:45"
  },
  "permissions": {
    "geolocationGranted": true
  }
}
```

## Tasarım Desenleri

### 1. State Management Pattern
```javascript
// Simple state management
const AppState = {
  location: null,
  prayerTimes: null,
  countdown: { hours: 0, minutes: 0, seconds: 0 },
  isLoading: false,
  error: null
};
```

### 2. Observer Pattern
Geri sayım güncellemeleri için:
```javascript
// Countdown updates every second
setInterval(() => {
  updateCountdown();
  renderCountdown();
}, 1000);
```

### 3. Strategy Pattern
Konum tespiti için:
```javascript
// Try geolocation first, fallback to manual
async function getLocation() {
  try {
    return await getGeolocation();
  } catch (error) {
    return await getManualLocation();
  }
}
```

## Bileşen Yapısı

### Ana Bileşenler
```
App
├── LocationManager
│   ├── GeolocationHandler
│   └── ManualLocationSelector
│       ├── CountryDropdown
│       ├── CityDropdown
│       └── DistrictDropdown
├── CountdownDisplay
│   ├── TimeDisplay (HH:MM:SS)
│   └── PrayerTimeInfo
├── LoadingState
└── ErrorHandler
```

### Bileşen İlişkileri
- **LocationManager**: Konum verisi sağlar
- **CountdownDisplay**: Konum ve prayer time verisi alır
- **LoadingState**: Async işlemler sırasında gösterilir
- **ErrorHandler**: Hata durumlarını yönetir

## Kritik İmplementasyon Yolları

### 1. Uygulama Başlatma
```
1. Sayfa yüklenir
2. LocalStorage kontrol edilir
   ├─ Kayıtlı konum var mı?
   │  └─ Evet: Son konumu yükle
   └─ Hayır: Konum izni iste
3. Prayer times API çağrısı
4. Geri sayım başlatılır
```

### 2. Konum İzni Akışı
```
1. navigator.geolocation.getCurrentPosition() çağrılır
2. Kullanıcı yanıt verir
   ├─ İzin verildi
   │  ├─ Koordinatlar alınır
   │  ├─ Reverse geocoding (opsiyonel)
   │  └─ Prayer times API çağrısı
   └─ İzin reddedildi
      └─ Manuel konum seçim ekranı göster
```

### 3. Geri Sayım Mantığı
```javascript
function calculateCountdown(iftarTime) {
  const now = new Date();
  const iftar = new Date(iftarTime);
  const diff = iftar - now;
  
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isExpired: false
  };
}
```

### 4. Hata Yönetimi
```
Hata Türleri:
├── Geolocation Hatası
│   ├── İzin reddedildi → Manuel seçim
│   ├── Timeout → Tekrar dene veya manuel
│   └── Pozisyon alınamadı → Manuel seçim
├── API Hatası
│   ├── Network hatası → Offline mesajı
│   ├── Rate limit → Cache kullan
│   └── Invalid response → Hata mesajı
└── Data Hatası
    ├── Invalid prayer time → Hata mesajı
    └── Cache bozuk → Cache temizle
```

## Performans Optimizasyonları

### 1. API Çağrıları
- Prayer times günlük cache'lenir
- Aynı gün için tekrar API çağrısı yapılmaz
- Rate limiting kontrolü

### 2. DOM Manipülasyonu
- Minimum DOM update
- RequestAnimationFrame kullanımı (opsiyonel)
- Virtual DOM değil, selective update

### 3. Veri Yönetimi
- LocalStorage etkin kullanım
- Gereksiz re-render önleme
- Debouncing/throttling (gerekirse)

## Güvenlik Düşünceleri

### 1. API Keys
- API anahtarları environment variables
- Backend proxy (eğer gerekirse)
- Rate limiting

### 2. Kullanıcı Verileri
- Konum verisi sadece hesaplama için kullanılır
- Sunucuya konum gönderilmez (privacy)
- LocalStorage şifreleme (opsiyonel)

### 3. XSS Koruması
- User input sanitization
- CSP headers
- Safe DOM manipulation

## Mobil Dönüşüm Hazırlığı

### Progressive Web App (PWA)
- Service Worker
- Manifest file
- Offline capability
- Add to Home Screen

### Hybrid App Hazırlığı
- Clean separation of concerns
- API-driven architecture
- Platform-agnostic logic
- Capacitor/Cordova uyumlu yapı

## Testing Strategy

### Unit Tests
- Countdown calculation logic
- Date/time utilities
- Location parsing
- API response handling

### Integration Tests
- Geolocation flow
- API integration
- LocalStorage operations
- Error scenarios

### E2E Tests
- Complete user flows
- Permission scenarios
- Different device types
- Network conditions