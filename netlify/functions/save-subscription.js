/**
 * Save Subscription Endpoint
 * Kullanıcı subscription bilgilerini Supabase'e kaydeder
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
		const { subscription, location, settings } = data;

		if (!subscription || !subscription.endpoint) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: "Invalid subscription data" }),
			};
		}

		// Supabase client
		const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

		// Upsert (insert or update)
		const { data: result, error } = await supabase
			.from("subscriptions")
			.upsert(
				{
					endpoint: subscription.endpoint,
					subscription: subscription,
					location: location,
					settings: settings,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "endpoint" }
			)
			.select();

		if (error) {
			console.error("❌ Supabase error:", error);
			return {
				statusCode: 500,
				body: JSON.stringify({ error: error.message }),
			};
		}

		console.log(`✅ Subscription saved to Supabase: ${subscription.endpoint.substring(0, 50)}...`);

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
