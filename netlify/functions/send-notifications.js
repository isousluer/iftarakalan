/**
 * Webhook Endpoint - Push Notification Sender
 * Harici cron servisi tarafından her dakika çağrılır
 */

const webpush = require("web-push");

// VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
	webpush.setVapidDetails("mailto:info@iftarakalan.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

exports.handler = async (event) => {
	console.log("=".repeat(50));
	console.log("🚀 SEND-NOTIFICATIONS FUNCTION CALLED");
	console.log("⏰ Time:", new Date().toISOString());
	console.log("=".repeat(50));

	// Token kontrolü
	const authToken = event.headers["x-auth-token"] || event.headers["X-Auth-Token"];
	const expectedToken = process.env.CRON_SECRET_TOKEN;

	if (expectedToken && expectedToken.length > 0) {
		if (authToken !== expectedToken) {
			console.warn("⚠️ Unauthorized: Token mismatch");
			return {
				statusCode: 401,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ error: "Unauthorized" }),
			};
		}
		console.log("✅ Auth OK");
	} else {
		console.log("ℹ️ Auth disabled (no token configured)");
	}

	// VAPID keys kontrolü
	if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
		return {
			statusCode: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "VAPID keys not configured" }),
		};
	}

	// Supabase'den subscriptions oku
	let subscriptions = [];
	
	try {
		const { createClient } = require("@supabase/supabase-js");
		const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
		
		const { data, error } = await supabase
			.from("subscriptions")
			.select("*")
			.eq("settings->>enabled", true);
		
		if (error) {
			throw error;
		}
		
		subscriptions = data || [];
		console.log(`📊 ${subscriptions.length} subscriptions loaded from Supabase`);
	} catch (dbError) {
		console.error("❌ Supabase error:", dbError.message);
		
		// Fallback: TEST_SUBSCRIPTION
		if (process.env.TEST_SUBSCRIPTION) {
			try {
				const testSub = JSON.parse(process.env.TEST_SUBSCRIPTION);
				subscriptions = [testSub];
				console.log("✅ Using TEST_SUBSCRIPTION fallback");
			} catch (e) {
				console.error("❌ Invalid TEST_SUBSCRIPTION:", e.message);
			}
		}
	}
	
	try {

		// Her subscription için iftar saati kontrolü
		let sentCount = 0;
		
		for (const subData of subscriptions) {
			try {
				const notification = await checkAndSendNotification(subData);
				if (notification) {
					sentCount++;
				}
			} catch (error) {
				console.error("❌ Notification error:", error.message);
			}
		}

		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "✅ Webhook completed",
				subscriptions: subscriptions.length,
				sent: sentCount,
				timestamp: new Date().toISOString(),
			}),
		};


	} catch (error) {
		console.error("❌ Error:", error);
		return {
			statusCode: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: error.message }),
		};
	}
};

/**
 * İftar saatini kontrol et ve gerekirse bildirim gönder
 */
async function checkAndSendNotification(subData) {
	const { subscription, location, settings } = subData;

	if (!settings?.enabled) {
		console.log("ℹ️ Notifications disabled for user");
		return false;
	}

	if (!location?.ilceId) {
		console.log("⚠️ No location data");
		return false;
	}

	try {
		// İftar saatini API'den al
		let iftarTime = await getIftarTime(location.ilceId);

		if (!iftarTime) {
			console.log("⚠️ Could not get iftar time");
			return false;
		}

		// TEST MODE: İftar saatini şu andan 1 saat sonrasına ayarla
		if (process.env.TEST_IFTAR_TIME === "true") {
			const now = new Date();
			const testIftar = new Date(now.getTime() + 60 * 60 * 1000); // 1 saat sonra
			// Türkiye saati (UTC+3)
			const turkeyTime = new Date(testIftar.getTime() + 3 * 60 * 60 * 1000);
			iftarTime = `${turkeyTime.getHours().toString().padStart(2, "0")}:${turkeyTime.getMinutes().toString().padStart(2, "0")}`;
			console.log(`🧪 TEST MODE: İftar saati ${iftarTime} olarak ayarlandı (Türkiye saati)`);
		}

		// Şu anki zaman
		const now = new Date();
		const [hours, minutes] = iftarTime.split(":").map(Number);

		// Bugünün iftar saati
		const iftarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

		// İftara kalan dakika
		const diffMs = iftarDate - now;
		const diffMinutes = Math.floor(diffMs / 1000 / 60);

		console.log(`⏰ İftar: ${iftarTime}, Kalan: ${diffMinutes} dakika`);

		// TEST MODE: Her zaman bildirim gönder
		if (process.env.TEST_NOTIFICATIONS === "true") {
			console.log("🧪 TEST MODE: Sending notification");
			const testNotification = {
				title: "TEST: İftara Kalan 🌙",
				body: `İftar: ${iftarTime}, Kalan: ${diffMinutes} dk`,
				icon: "/favicon.svg",
				badge: "/favicon.svg",
			};
			await webpush.sendNotification(subscription, JSON.stringify(testNotification));
			console.log("✅ TEST bildirim gönderildi");
			return true;
		}

		// Bildirim kontrolü (tolerans: ±1 dakika)
		let notification = null;

		if (settings.oneHour && diffMinutes >= 59 && diffMinutes <= 61) {
			notification = {
				title: "İftara 1 Saat Kaldı! 🌙",
				body: `İftar saati: ${iftarTime}`,
				icon: "/favicon.svg",
				badge: "/favicon.svg",
			};
		} else if (settings.thirtyMinutes && diffMinutes >= 29 && diffMinutes <= 31) {
			notification = {
				title: "İftara 30 Dakika Kaldı! 🌙",
				body: `İftar saati: ${iftarTime}`,
				icon: "/favicon.svg",
				badge: "/favicon.svg",
			};
		} else if (settings.tenMinutes && diffMinutes >= 9 && diffMinutes <= 11) {
			notification = {
				title: "İftara 10 Dakika Kaldı! 🌙",
				body: `İftar saati: ${iftarTime}. Hazırlıklara başlayın!`,
				icon: "/favicon.svg",
				badge: "/favicon.svg",
			};
		}

		if (notification) {
			await webpush.sendNotification(subscription, JSON.stringify(notification));
			console.log(`✅ Bildirim gönderildi: ${notification.title}`);
			return true;
		}

		return false;
	} catch (error) {
		console.error("❌ Check error:", error.message);
		return false;
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
		console.error("❌ İftar saati alma hatası:", error.message);
		return null;
	}
}
