exports.handler = async function (event, context) {
	// CORS headers
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Content-Type": "application/json",
	};

	// Handle preflight requests
	if (event.httpMethod === "OPTIONS") {
		return {
			statusCode: 200,
			headers,
			body: "",
		};
	}

	// Get target URL from query parameters
	const targetUrl = event.queryStringParameters?.url;

	if (!targetUrl) {
		return {
			statusCode: 400,
			headers,
			body: JSON.stringify({ error: "Missing url parameter" }),
		};
	}

	try {
		// Fetch from target URL
		const response = await fetch(targetUrl);
		const data = await response.json();

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(data),
		};
	} catch (error) {
		console.error("Proxy error:", error);
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ error: error.message }),
		};
	}
};
