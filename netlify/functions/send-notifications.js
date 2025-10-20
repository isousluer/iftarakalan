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

	// Token kontrolü (sadece token tanımlıysa)
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

	let subscriptions = [];
	
	try {
		// Netlify Blob'dan subscriptions oku
		try {
			const { getStore } = await import("@netlify/blobs");
			const store = getStore("subscriptions");
			const data = await store.get("list", { type: "json" });
			subscriptions = data || [];
			console.log(`📊 ${subscriptions.length} subscriptions loaded from Blobs`);
		} catch (blobError) {
			console.warn("⚠️ Blobs error:", blobError.message);
			console.log("ℹ️ Using empty subscriptions list");
			subscriptions = [];
		}

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
