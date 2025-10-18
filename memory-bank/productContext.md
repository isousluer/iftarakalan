# Product Context: İftar Geri Sayım Uygulaması

## Neden Bu Proje Var?

### Problem
Ramazan ayında oruç tutan kişiler, iftara kalan süreyi takip etmek isterler. Mevcut çözümler:
- Statik namaz vakti listeleri (güncellik sorunu)
- Genel amaçlı uygulamalar (karmaşık, fazla özellik)
- Konum bağımlı olmayan çözümler (yanlış iftar saati)

### Çözüm
Kullanıcının konumuna göre anlık, doğru iftar saatini gösteren ve iftara kalan süreyi gerçek zamanlı sayan minimalist bir web uygulaması.

## Nasıl Çalışmalı?

### Kullanıcı Akışı

#### İlk Giriş
1. Kullanıcı siteye girer
2. Konum izni istenir (tarayıcı popup)
3. **İzin verilirse:**
   - Otomatik konum tespit edilir
   - İftar saati hesaplanır
   - Geri sayım başlar
4. **İzin verilmezse:**
   - Manuel konum seçim ekranı gösterilir
   - Ülke > Şehir > İlçe dropdown'ları
   - Seçim sonrası geri sayım başlar

#### Geri Sayım Ekranı
```
┌─────────────────────────────┐
│                             │
│     İftara Kalan Süre       │
│                             │
│      [02:34:15]             │
│     saat:dakika:saniye      │
│                             │
│     İftar Saati: 18:45      │
│                             │
│  [Konumu Değiştir Butonu]   │
│                             │
└─────────────────────────────┘
```

### Temel İşlevler

1. **Konum Tespiti**
   - Otomatik: Geolocation API
   - Manuel: Dropdown seçimi
   - Konum değiştirme imkanı

2. **Zaman Hesaplama**
   - API'den iftar saati çekilir
   - Mevcut zaman ile karşılaştırılır
   - Her saniye güncellenir

3. **Görsel Gösterim**
   - Büyük, okunabilir sayılar
   - Saat:Dakika:Saniye formatı
   - İftar saati bilgisi
   - Responsive tasarım

## Kullanıcı Deneyimi Hedefleri

### Basitlik
- Tek görev odaklı: İftara kalan süre
- Minimum etkileşim
- Anında anlaşılır arayüz

### Hız
- Hızlı yükleme
- Anlık konum tespiti
- Sorunsuz geri sayım

### Güvenilirlik
- Doğru iftar saati
- Kesintisiz sayım
- Hata yönetimi (konum alınamazsa, API hatası vb.)

### Erişilebilirlik
- Tüm cihazlarda çalışma
- Responsive tasarım
- Kolay okunabilirlik

## Gelecek Vizyon

### Faz 1: Web (Mevcut)
- Responsive web uygulaması
- Temel özellikler

### Faz 2: Mobil (Planlanan)
- Native mobil uygulama
- Push bildirimleri
- Widget desteği
- Offline çalışma

### Potansiyel Özellikler (Gelecek)
- Diğer namaz vakitleri
- Bildirimler (iftar vakti yaklaştığında)
- Tema seçenekleri
- Çoklu dil desteği
- Favori konumlar
- Widget/Bildirim entegrasyonu

## Kullanıcı Senaryoları

### Senaryo 1: İlk Kez Kullanan
*Ali, Ramazan'ın ilk günü uygulamayı açıyor*
1. Siteye giriş yapar
2. "Konumunuza erişmek istiyoruz" mesajına izin verir
3. Anında İstanbul için iftara kalan süreyi görür
4. Telefonu kilitlese bile süre sayılmaya devam eder

### Senaryo 2: Farklı Şehirde
*Ayşe iş için Ankara'ya gitti*
1. Uygulamayı açar
2. Sistem otomatik olarak Ankara konumunu tespit eder
3. Ankara'nın iftar saatini gösterir
4. İftara kadar sayım yapar

### Senaryo 3: Konum İzni Yok
*Mehmet tarayıcı konum iznini devre dışı bırakmış*
1. Uygulamayı açar
2. Konum alınamadığını görür
3. Dropdown'dan Türkiye > İzmir > Bornova seçer
4. Geri sayım başlar

## Başarı Metrikleri
- Doğru iftar saati gösterimi: %100
- Konum tespit başarı oranı: >%80
- Sayfa yükleme süresi: <2 saniye
- Mobil kullanılabilirlik skoru: >90/100