# Otomatik Bildirim Kurulumu (Ücretsiz Cron)

## Sorun
Netlify Free plan'de scheduled functions çalışmıyor. Bu yüzden harici bir cron servisi kullanmamız gerekiyor.

## Çözüm: Cron-job.org (Ücretsiz)

### 1. Netlify Environment Variables Ekle

Netlify Dashboard → Site Settings → Environment Variables:

```
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
CRON_SECRET_TOKEN=<random-secret-token>  # Örnek: abc123xyz456
```

**CRON_SECRET_TOKEN**: Güvenlik için rastgele bir string (webhook'u korumak için)

### 2. Cron-job.org Kurulumu

1. **Kayıt Ol**: https://cron-job.org/en/signup/
   - Ücretsiz hesap oluştur

2. **Yeni Cron Job Oluştur**:
   - Dashboard → "Create cronjob"
   
3. **Ayarlar**:
   ```
   Title: İftarakalan Push Notifications
   URL: https://iftarakalan.com/api/send-notifications
   Schedule: Every 1 minute
   ```

4. **Request Settings**:
   - Method: `GET`
   - Headers ekle:
     ```
     x-auth-token: <CRON_SECRET_TOKEN değeriniz>
     ```

5. **Save** → Aktif et

### 3. Test Et

Cron-job.org dashboard'da "Run now" butonuna tıkla:
- ✅ Status 200 dönmeli
- ✅ Response: `{"message":"Notifications sent",...}`

### 4. Netlify Logs Kontrol

Netlify Dashboard → Functions → `send-notifications` → Logs:
```
⏰ Notification sender çalıştı: 2025-10-19T...
✅ Bildirim gönderildi: İSTANBUL
```

## Alternatif Ücretsiz Cron Servisleri

### EasyCron (https://www.easycron.com)
- Free: 1 dakika interval
- Kurulum aynı

### UptimeRobot (https://uptimerobot.com)
- Free: 5 dakika interval (daha az sık)
- Monitor olarak ekle

## Test Senaryosu

1. **Bildirim ayarlarını aç** (uygulamada)
2. **İftar saatini kontrol et** (örn: 18:45)
3. **Sistem saatini değiştir** (test için):
   - 1 saat öncesi: 17:45 → Bildirim gelmeli
   - 30 dk öncesi: 18:15 → Bildirim gelmeli
   - 10 dk öncesi: 18:35 → Bildirim gelmeli

## Sorun Giderme

### Bildirim gelmiyor?

1. **Netlify Logs kontrol et**:
   ```
   Netlify Dashboard → Functions → send-notifications → Logs
   ```

2. **Cron-job.org logs kontrol et**:
   ```
   Dashboard → Job → Execution log
   ```

3. **Browser console kontrol et**:
   ```
   F12 → Console → "✅ Subscription backend'e kaydedildi" mesajı var mı?
   ```

4. **Notification permission kontrol et**:
   ```
   Browser settings → Site settings → Notifications → "Allow"
   ```

### Common Issues

**401 Unauthorized**:
- `CRON_SECRET_TOKEN` Netlify'de tanımlı mı?
- Cron-job.org'da header doğru mu?

**No subscriptions**:
- Uygulamada bildirim izni verildi mi?
- "Bildirimleri Aç" butonuna tıklandı mı?

**API error**:
- İlçe ID doğru mu?
- ezanvakti.emushaf.net API çalışıyor mu?

## Production Checklist

- [ ] VAPID keys Netlify'e eklendi
- [ ] CRON_SECRET_TOKEN oluşturuldu ve eklendi
- [ ] Cron-job.org hesabı oluşturuldu
- [ ] Cron job ayarlandı (1 dakika interval)
- [ ] Test edildi (logs kontrol edildi)
- [ ] Gerçek iftar saatinde test edildi

## Maliyet

**Toplam**: $0/ay (Tamamen ücretsiz!)

- Netlify Free: ✅ 125K function requests/month
- Cron-job.org Free: ✅ Unlimited jobs, 1 min interval
