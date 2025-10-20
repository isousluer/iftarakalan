/**
 * Remove Subscription Endpoint
 * Kullanıcı subscription'ı Supabase'den siler
 */

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: "Method not allowed" }),
		};
	}

	try {
		const data = JSON.parse(event.body);
		const { endpoint } = data;

		if (!endpoint) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: "Endpoint required" }),
			};
		}

		// Supabase client
		const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

		// Delete
		const { error } = await supabase.from("subscriptions").delete().eq("endpoint", endpoint);

		if (error) {
			console.error("❌ Supabase delete error:", error);
			return {
				statusCode: 500,
				body: JSON.stringify({ error: error.message }),
			};
		}

		console.log(`✅ Subscription removed: ${endpoint.substring(0, 50)}...`);

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
			body: JSON.stringify({ error: error.message }),
		};
	}
};
