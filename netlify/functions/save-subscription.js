/**
 * Save Subscription Endpoint
 * Kullanıcı subscription bilgilerini kaydeder
 */

// Temporary: Global subscriptions array
// Her deploy'da sıfırlanır - sadece test için
global.subscriptions = global.subscriptions || [];

exports.handler = async (event) => {
	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: "Method not allowed" }),
		};
	}

	try {
		const data = JSON.parse(event.body);
		const { subscription, location, settings } = data;

		if (!subscription || !subscription.endpoint) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: "Invalid subscription data" }),
			};
		}

		// Global array'e kaydet (test için)
		const subscriptionData = {
			subscription,
			location,
			settings,
			createdAt: new Date().toISOString(),
		};

		// Mevcut var mı kontrol et
		const existingIndex = global.subscriptions.findIndex(
			(s) => s.subscription.endpoint === subscription.endpoint
		);

		if (existingIndex !== -1) {
			global.subscriptions[existingIndex] = subscriptionData;
		} else {
			global.subscriptions.push(subscriptionData);
		}

		console.log(`📊 Total: ${global.subscriptions.length} subscriptions`);

		console.log(`✅ Subscription saved: ${subscription.endpoint.substring(0, 50)}...`);

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: "Subscription saved (global)",
				total: global.subscriptions.length,
			}),
		};
	} catch (error) {
		console.error("❌ Save subscription error:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message }),
		};
	}
};
