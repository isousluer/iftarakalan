/**
 * Save Subscription Endpoint
 * Kullanıcı subscription bilgilerini kaydeder
 */

const store = require("./subscriptions-store");

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

		// In-memory store'a kaydet
		const subscriptionData = {
			subscription,
			location,
			settings,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		store.add(subscriptionData);

		console.log(`✅ Subscription saved: ${subscription.endpoint.substring(0, 50)}...`);

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: "Subscription saved (in-memory)",
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
