/**
 * VAPID Keys Generator
 * Push notification için gerekli VAPID key'lerini oluşturur
 * 
 * Kullanım: node scripts/generate-vapid.js
 */

const webpush = require("web-push");

console.log("🔑 VAPID Keys oluşturuluyor...\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("✅ VAPID Keys başarıyla oluşturuldu!\n");
console.log("📋 Bu key'leri Netlify Environment Variables'a ekleyin:\n");
console.log("VAPID_PUBLIC_KEY:");
console.log(vapidKeys.publicKey);
console.log("\nVAPID_PRIVATE_KEY:");
console.log(vapidKeys.privateKey);
console.log("\n⚠️  PRIVATE KEY'i GİZLİ TUTUN! GitHub'a commit ETMEYİN!\n");
console.log("📖 Netlify'da Environment Variables ekleme:");
console.log("   Site Settings → Environment Variables → Add a variable\n");
