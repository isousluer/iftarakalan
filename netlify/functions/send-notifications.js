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
	console.log("⏰ Notification sender çalıştı:", new Date().toISOString());

	// Token kontrolü devre dışı (test için)
	console.log("ℹ️ Auth disabled for testing");

	// VAPID keys kontrolü
	if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
		return {
			statusCode: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "VAPID keys not configured" }),
		};
	}

	// TEST: Environment variable'dan oku
	let subscriptions = [];
	
	if (process.env.TEST_SUBSCRIPTION) {
		try {
			const testSub = JSON.parse(process.env.TEST_SUBSCRIPTION);
			subscriptions = [testSub];
			console.log("✅ Using TEST_SUBSCRIPTION from env");
		} catch (e) {
			console.error("❌ Invalid TEST_SUBSCRIPTION:", e.message);
		}
	}
	
	console.log(`📊 ${subscriptions.length} subscriptions`);
	
	try {

		// TEST: Her çalıştırmada bildirim gönder
		if (subscriptions.length > 0) {
			for (const sub of subscriptions) {
				try {
					await webpush.sendNotification(
						sub.subscription,
						JSON.stringify({
							title: "Test Bildirimi 🌙",
							body: "Webhook çalışıyor!",
							icon: "/favicon.svg",
						})
					);
					console.log("✅ Test notification sent");
				} catch (error) {
					console.error("❌ Send error:", error);
				}
			}
		}

		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "✅ Webhook working!",
				subscriptions: subscriptions.length,
				sent: subscriptions.length,
				note: "Auth disabled - TEST MODE",
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
