# Tech Context: İftar Geri Sayım Uygulaması

## Teknoloji Stack'i

### Frontend
- **HTML5**: Semantic markup, geolocation API
- **Tailwind CSS**: Utility-first CSS framework (CDN)
- **JavaScript (ES6+)**: Vanilla JS, modern features, async/await
- **Font**: Plus Jakarta Sans (Google Fonts)

### Design System
- **Primary Color**: #34d399 (Emerald/Green)
- **Background Dark**: #052e16 (Dark green)
- **Background Light**: #f0fdf4 (Light green)
- **Effects**: Glassmorphism (backdrop-filter blur)
- **Theme**: Dark mode default
- **Border Radius**: 0.5rem (default), 1rem (lg), 1.5rem (xl)

### APIs & Services

#### 1. Namaz Vakitleri API - ezanvakti.emushaf.net

**✅ SEÇILDI VE TEST EDİLDİ: ezanvakti.emushaf.net API**

**⚠️ CORS Sorunu ve Çözümü**:
- **Problem**: API CORS başlıkları sağlamıyor (browser'dan direkt erişim engelleniyor)
- **Çözüm**: Python proxy server ([`proxy_server.py`](../proxy_server.py))
- **Status**: ✅ Çalışıyor (port 8081)

**Endpoints**:
```javascript
// Ülke listesi
GET https://ezanvakti.emushaf.net/ulkeler
// Response: [{ "UlkeAdi": "Türkiye", "UlkeID": "2" }]

// Şehir listesi
GET https://ezanvakti.emushaf.net/sehirler/{UlkeID}
// Response: [{ "SehirAdi": "İSTANBUL", "SehirID": "539" }]

// İlçe listesi
GET https://ezanvakti.emushaf.net/ilceler/{SehirID}
// Response: [{ "IlceAdi": "BEŞİKTAŞ", "IlceID": "9541" }]

// Namaz vakitleri (30 günlük)
GET https://ezanvakti.emushaf.net/vakitler/{IlceID}
// Response: Array of 30 days
// {
//   "MiladiTarihKisa": "18.10.2025",
//   "Aksam": "18:27",  // ← İFTAR SAATİ
//   "Imsak": "05:47",
//   "Gunes": "07:12",
//   "Ogle": "12:54",
//   "Ikindi": "15:56",
//   "Yatsi": "19:46"
// }
```

**Avantajlar**:
- ✅ Türkçe içerik
- ✅ 30 günlük veri (cache için ideal)
- ✅ Ücretsiz
- ✅ Türkiye'deki tüm il/ilçeler (81 şehir)
- ⚠️ CORS sorunu var → Python proxy ile çözüldü

#### 2. Konum API'leri

**Browser Geolocation API**
```javascript
navigator.geolocation.getCurrentPosition(
  successCallback,
  errorCallback,
  { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
);
```

**Reverse Geocoding** (opsiyonel)
- OpenStreetMap Nominatim
- Google Maps Geocoding API
- MapBox API

### Veri Kaynakları

#### Türkiye İl/İlçe Verisi
```json
// cities.json
{
  "countries": [
    {
      "name": "Türkiye",
      "code": "TR",
      "cities": [
        {
          "name": "İstanbul",
          "latitude": 41.0082,
          "longitude": 28.9784,
          "districts": ["Beşiktaş", "Kadıköy", ...]
        }
      ]
    }
  ]
}
```

**Kaynak Seçenekleri**:
- Static JSON file
- İBB API
- Nüfus İdaresi veritabanı

## Development Setup

### Geliştirme Ortamı
```bash
# Proje yapısı
iftarakalan/
├── index.html
├── proxy_server.py      # ← CORS proxy (development + production)
├── js/
│   ├── app.js          # Ana koordinasyon
│   ├── location.js     # Geolocation + manuel seçim
│   ├── countdown.js    # Geri sayım mantığı
│   ├── api.js          # API wrapper (proxy kullanıyor)
│   └── storage.js      # LocalStorage utility
├── memory-bank/        # Proje dokümantasyonu
└── README.md
```

### Development Server (CORS Proxy)
```bash
# Python proxy server başlat (port 8081)
python3 proxy_server.py

# Tarayıcıda aç
http://localhost:8081
```

**Proxy Endpoint**:
```
http://localhost:8081/api/proxy?url={TARGET_URL}
```

**Örnek Kullanım**:
```javascript
// api.js içinde
const targetUrl = 'https://ezanvakti.emushaf.net/sehirler/2';
const proxyUrl = `http://localhost:8081/api/proxy?url=${encodeURIComponent(targetUrl)}`;
const response = await fetch(proxyUrl);
```

### Build Tools
- **Development Server**: Python CORS proxy (proxy_server.py - port 8081)
- **Minification**: Terser (production için)
- **CSS Processing**: PostCSS (opsiyonel)
- **Linting**: ESLint (code quality)

### Production Requirements
- **Proxy Server**: Netlify Functions veya Vercel Edge Functions
- **Alternative**: Custom backend (Node.js, Python Flask/FastAPI)

### Version Control
- Git
- GitHub/GitLab
- Semantic versioning

## Teknik Kısıtlamalar

### Browser Compatibility
**Hedef Tarayıcılar**:
- Chrome/Edge (son 2 versiyon)
- Firefox (son 2 versiyon)
- Safari (son 2 versiyon)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Minimum Gereksinimler**:
- ES6 desteği
- Geolocation API desteği
- LocalStorage desteği
- Flexbox/Grid desteği

### Performance Budgets
- **Initial Load**: < 2 saniye
- **Time to Interactive**: < 3 saniye
- **First Contentful Paint**: < 1.5 saniye
- **Bundle Size**: < 100KB (minified + gzipped)

### API Limitations
- **Prayer Times API**: Rate limits (kontrol edilecek)
- **Geolocation**: Kullanıcı izni gerekli
- **Browser API**: Offline durumunda çalışmaz

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    // Minimal - çoğunlukla vanilla
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "terser": "^5.0.0"
  }
}
```

### Utility Libraries (Opsiyonel)
- **date-fns** veya **dayjs**: Tarih/saat işlemleri
- **axios**: HTTP istekleri (fetch API alternatifi)
- **localforage**: LocalStorage wrapper

**Karar**: Mümkün olduğunca native API'lar kullanılacak

## Tool Usage Patterns

### LocalStorage Pattern
```javascript
// Storage utility
const Storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  }
};
```

### API Call Pattern
```javascript
// API utility with error handling
async function fetchPrayerTimes(lat, lng) {
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${Date.now()}?latitude=${lat}&longitude=${lng}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.timings;
  } catch (error) {
    console.error('Prayer times fetch error:', error);
    throw error;
  }
}
```

### Geolocation Pattern
```javascript
// Geolocation with Promise
function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}
```

## CSS Architecture

### Naming Convention
**BEM (Block Element Modifier)**
```css
/* Block */
.countdown { }

/* Element */
.countdown__time { }
.countdown__label { }

/* Modifier */
.countdown--large { }
.countdown--expired { }
```

### Responsive Approach
**Mobile-First Design**
```css
/* Mobile styles (default) */
.countdown {
  font-size: 2rem;
}

/* Tablet */
@media (min-width: 768px) {
  .countdown {
    font-size: 3rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .countdown {
    font-size: 4rem;
  }
}
```

### CSS Custom Properties
```css
:root {
  --color-primary: #1a472a;
  --color-secondary: #2d6a4f;
  --color-accent: #40916c;
  --color-text: #333;
  --color-background: #f8f9fa;
  
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.5rem;
  --font-size-xl: 3rem;
}
```

## Error Handling Strategy

### Error Types
```javascript
class LocationError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'LocationError';
    this.type = type; // 'PERMISSION_DENIED', 'POSITION_UNAVAILABLE', 'TIMEOUT'
  }
}

class APIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}
```

### Global Error Handler
```javascript
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Log to error tracking service (future)
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Log to error tracking service (future)
});
```

## Testing Approach

### Manual Testing Checklist
- [ ] Geolocation izin verildi senaryosu
- [ ] Geolocation izin reddedildi senaryosu
- [ ] Manuel konum seçimi
- [ ] Countdown accuracy
- [ ] API başarısız senaryosu
- [ ] Offline senaryo
- [ ] Farklı cihazlar (mobile, tablet, desktop)
- [ ] Farklı tarayıcılar

### Future: Automated Testing
- Jest (unit tests)
- Cypress (e2e tests)
- Browser testing (BrowserStack)

## Deployment

### CORS Proxy Deployment Stratejisi

#### Development (Mevcut)
```bash
python3 proxy_server.py  # Port 8081
```

#### Production Seçenekleri

**1. Netlify Functions (ÖNERİLEN)**
```javascript
// netlify/functions/proxy.js
exports.handler = async (event) => {
  const targetUrl = event.queryStringParameters.url;
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
};
```

**2. Vercel Edge Functions**
```javascript
// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
}
```

**3. Custom Backend**
- Node.js + Express
- Python + Flask/FastAPI
- Deploy on: Railway, Render, Fly.io

### Hosting Options
1. **Static Hosting + Serverless**
   - Netlify (recommended) - Functions included
   - Vercel - Edge Functions included
   - Cloudflare Pages + Workers

2. **Full Stack Hosting**
   - Railway (Node.js/Python backend)
   - Render
   - Fly.io

### Deployment Pipeline
```
Local Development
    ↓
Git Push to Main
    ↓
Automated Build
    ↓
Deploy to Hosting
    ↓
Production
```

### Environment Variables
```
# .env (future, if needed)
API_BASE_URL=https://api.aladhan.com
API_KEY=xxx (if needed)
```

## Monitoring & Analytics (Future)

### Error Tracking
- Sentry
- LogRocket

### Analytics
- Google Analytics (minimal)
- Custom event tracking
- Performance monitoring

### Metrics to Track
- Page load time
- API response time
- Geolocation success rate
- User interactions
- Device/browser stats

## Mobile App Conversion (Phase 2)

### Technology Options
1. **React Native**
   - Native performance
   - Shared codebase with web (if using React)
   
2. **Capacitor**
   - Web-based
   - Easy conversion from web app
   - Access to native features

3. **Flutter**
   - High performance
   - Different codebase

**Recommendation**: Capacitor (kolay web-to-mobile conversion)