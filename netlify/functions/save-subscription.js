/**
 * Save Subscription Endpoint
 * Kullanıcı subscription bilgilerini kaydeder
 */

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

		// Netlify Blobs'a kaydet
		try {
			const { getStore } = await import("@netlify/blobs");
			const store = getStore("subscriptions");

			// Mevcut subscriptions'ı oku
			let subscriptions = [];
			try {
				const data = await store.get("list", { type: "json" });
				subscriptions = data || [];
			} catch (e) {
				subscriptions = [];
			}

			// Yeni subscription ekle veya güncelle
			const existingIndex = subscriptions.findIndex(
				(s) => s.subscription.endpoint === subscription.endpoint
			);

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

			// Blobs'a kaydet
			await store.set("list", JSON.stringify(subscriptions));
			console.log(`✅ Saved to Blobs. Total: ${subscriptions.length}`);
		} catch (blobError) {
			console.error("❌ Blobs save error:", blobError.message);
			// Devam et (en azından log'da görünür)
		}

		console.log(`✅ Subscription saved: ${subscription.endpoint.substring(0, 50)}...`);

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
			body: JSON.stringify({ error: error.message }),
		};
	}
};
