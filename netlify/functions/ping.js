exports.handler = async () => {
	console.log("🔔 PING FUNCTION CALLED!");
	return {
		statusCode: 200,
		body: JSON.stringify({ message: "PONG! 🏓" })
	};
};
