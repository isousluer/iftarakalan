/**
 * Simple in-memory subscription store
 * NOT for production - just for testing
 */

let subscriptions = [];

module.exports = {
	getAll: () => subscriptions,
	add: (sub) => {
		const existingIndex = subscriptions.findIndex(
			(s) => s.subscription.endpoint === sub.subscription.endpoint
		);
		if (existingIndex !== -1) {
			subscriptions[existingIndex] = sub;
		} else {
			subscriptions.push(sub);
		}
		console.log(`📊 Total subscriptions: ${subscriptions.length}`);
	},
	clear: () => {
		subscriptions = [];
	},
};
