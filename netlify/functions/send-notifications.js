/**
 * Webhook Endpoint - Push Notification Sender
 * Harici cron servisi tarafından her dakika çağrılır
 */

const fs = require("fs").promises;
const webpush = require("web-push");

const SUBSCRIPTIONS_FILE = "/tmp/subscriptions.json";

// VAPID keys (environment variables'dan al)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
	console.error("❌ VAPID keys eksik! Netlify Environment Variables'a ekleyin.");
}

// VAPID details
webpush.setVapidDetails("mailto:info@iftarakalan.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

exports.handler = async (event) => {
	console.log("⏰ Notification sender çalıştı:", new Date().toISOString());

	// Basit güvenlik: Secret token kontrolü (opsiyonel)
	const authToken = event.headers["x-auth-token"] || event.headers["X-Auth-Token"];
	const expectedToken = process.env.CRON_SECRET_TOKEN;

	// Token kontrolü (sadece production'da)
	if (expectedToken && authToken !== expectedToken) {
		console.warn("⚠️ Unauthorized request");
		return {
			statusCode: 401,
			body: JSON.stringify({ error: "Unauthorized" }),
		};
	}

	try {
		// Subscriptions'ları oku
		let subscriptions = [];
		try {
			const fileContent = await fs.readFile(SUBSCRIPTIONS_FILE, "utf8");
			subscriptions = JSON.parse(fileContent);
		} catch (error) {
			console.log("ℹ️ Henüz subscription yok");
			return {
				statusCode: 200,
				body: JSON.stringify({ message: "No subscriptions" }),
			};
		}

		if (subscriptions.length === 0) {
			console.log("ℹ️ Subscription listesi boş");
			return {
				statusCode: 200,
				body: JSON.stringify({ message: "No subscriptions" }),
			};
		}

		console.log(`📊 ${subscriptions.length} subscription bulundu`);

		// Her subscription için kontrol et (timeout: 8 saniye)
		const results = await Promise.allSettled(
			subscriptions.map(async (subData) => {
				try {
					// Bildirim gönderilmeli mi kontrol et
					const notification = await checkAndGetNotification(subData);

					if (notification) {
						// Push notification gönder
						await webpush.sendNotification(subData.subscription, JSON.stringify(notification));
						console.log(`✅ Bildirim gönderildi: ${subData.location?.ilceAdi || "Unknown"}`);
						return { success: true, location: subData.location };
					}

					return { success: false, reason: "No notification needed" };
				} catch (error) {
					console.error("❌ Push gönderme hatası:", error);

					// Subscription geçersizse sil
					if (error.statusCode === 410) {
						console.log("🗑️ Geçersiz subscription siliniyor");
						return { success: false, remove: true };
					}

					return { success: false, error: error.message };
				}
			})
		);

		// Geçersiz subscription'ları temizle
		const validSubscriptions = subscriptions.filter((_, index) => {
			const result = results[index];
			return result.status === "fulfilled" && !result.value?.remove;
		});

		if (validSubscriptions.length !== subscriptions.length) {
			await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(validSubscriptions, null, 2));
			console.log(`🗑️ ${subscriptions.length - validSubscriptions.length} geçersiz subscription silindi`);
		}

		const successCount = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Notifications sent",
				total: subscriptions.length,
				sent: successCount,
			}),
		};
	} catch (error) {
		console.error("❌ Notification sender error:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message }),
		};
	}
};

/**
 * Bildirim gönderilmeli mi kontrol et ve notification data döndür
 */
async function checkAndGetNotification(subData) {
	const { location, settings } = subData;

	if (!settings?.enabled) {
		return null;
	}

	if (!location?.ilceId) {
		return null;
	}

	try {
		// İftar saatini al (API'den)
		const iftarTime = await getIftarTime(location.ilceId);

		if (!iftarTime) {
			return null;
		}

		// Şu anki zaman
		const now = new Date();
		const [hours, minutes] = iftarTime.split(":").map(Number);

		// Bugünün iftar saati
		const iftarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

		// İftara kalan dakika
		const diffMs = iftarDate - now;
		const diffMinutes = Math.floor(diffMs / 1000 / 60);

		// Bildirim kontrolü
		if (settings.oneHour && diffMinutes === 60) {
			return {
				title: "İftara 1 Saat Kaldı! 🌙",
				body: `İftar saati: ${iftarTime}`,
				icon: "/favicon.svg",
				badge: "/favicon.svg",
			};
		}

		if (settings.thirtyMinutes && diffMinutes === 30) {
			return {
				title: "İftara 30 Dakika Kaldı! 🌙",
				body: `İftar saati: ${iftarTime}`,
				icon: "/favicon.svg",
				badge: "/favicon.svg",
			};
		}

		if (settings.tenMinutes && diffMinutes === 10) {
			return {
				title: "İftara 10 Dakika Kaldı! 🌙",
				body: `İftar saati: ${iftarTime}. Hazırlıklara başlayın!`,
				icon: "/favicon.svg",
				badge: "/favicon.svg",
			};
		}

		return null;
	} catch (error) {
		console.error("❌ Notification check error:", error);
		return null;
	}
}

/**
 * İftar saatini API'den al
 */
async function getIftarTime(ilceId) {
	try {
		const targetUrl = `https://ezanvakti.emushaf.net/vakitler/${ilceId}`;
		const response = await fetch(targetUrl);

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();

		// Bugünün tarihini bul
		const today = new Date();
		const todayStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`;

		const todayData = data.find((item) => item.MiladiTarihKisa === todayStr);

		if (todayData && todayData.Aksam) {
			return todayData.Aksam;
		}

		return null;
	} catch (error) {
		console.error("❌ İftar saati alma hatası:", error);
		return null;
	}
}
