/**
 * Remove Subscription Endpoint
 * Kullanıcı subscription'ını siler
 */

const fs = require("fs").promises;

const SUBSCRIPTIONS_FILE = "/tmp/subscriptions.json";

exports.handler = async (event) => {
	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: "Method not allowed" }),
		};
	}

	try {
		const { endpoint } = JSON.parse(event.body);

		if (!endpoint) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: "Endpoint required" }),
			};
		}

		// Mevcut subscriptions'ı oku
		let subscriptions = [];
		try {
			const fileContent = await fs.readFile(SUBSCRIPTIONS_FILE, "utf8");
			subscriptions = JSON.parse(fileContent);
		} catch (error) {
			return {
				statusCode: 404,
				body: JSON.stringify({ error: "No subscriptions found" }),
			};
		}

		// Subscription'ı sil
		subscriptions = subscriptions.filter((sub) => sub.subscription.endpoint !== endpoint);

		// Dosyaya kaydet
		await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));

		console.log(`✅ Subscription silindi: ${endpoint.substring(0, 50)}...`);

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				success: true,
				message: "Subscription removed",
			}),
		};
	} catch (error) {
		console.error("❌ Remove subscription error:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Internal server error" }),
		};
	}
};
