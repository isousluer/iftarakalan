/**
 * VAPID Public Key Endpoint
 * Push notification için gerekli public key'i döndürür
 */

exports.handler = async (event) => {
	// VAPID keys (web-push ile generate edilmeli)
	// Geçici test key - production'da environment variable kullan
	const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			publicKey: VAPID_PUBLIC_KEY,
		}),
	};
};
