/**
 * Save Subscription Endpoint
 * Kullanıcı subscription bilgilerini kaydeder
 */

const fs = require("fs").promises;
const path = require("path");

// Subscriptions dosya yolu (basit JSON storage)
const SUBSCRIPTIONS_FILE = "/tmp/subscriptions.json";

exports.handler = async (event) => {
	// Sadece POST isteklerini kabul et
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

		// Mevcut subscriptions'ı oku
		let subscriptions = [];
		try {
			const fileContent = await fs.readFile(SUBSCRIPTIONS_FILE, "utf8");
			subscriptions = JSON.parse(fileContent);
		} catch (error) {
			// Dosya yoksa boş array
			subscriptions = [];
		}

		// Yeni subscription ekle veya güncelle
		const existingIndex = subscriptions.findIndex((sub) => sub.subscription.endpoint === subscription.endpoint);

		const subscriptionData = {
			subscription,
			location,
			settings,
			createdAt: existingIndex === -1 ? new Date().toISOString() : subscriptions[existingIndex].createdAt,
			updatedAt: new Date().toISOString(),
		};

		if (existingIndex !== -1) {
			subscriptions[existingIndex] = subscriptionData;
		} else {
			subscriptions.push(subscriptionData);
		}

		// Dosyaya kaydet
		await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));

		console.log(`✅ Subscription kaydedildi: ${subscription.endpoint.substring(0, 50)}...`);

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: "Subscription saved",
			}),
		};
	} catch (error) {
		console.error("❌ Save subscription error:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Internal server error" }),
		};
	}
};
