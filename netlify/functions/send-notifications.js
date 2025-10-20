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

	try {
		// TODO: Database'den subscriptions oku
		const subscriptions = [];

		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "✅ Webhook working!",
				subscriptions: 0,
				note: "Database needed",
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
