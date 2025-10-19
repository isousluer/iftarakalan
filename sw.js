/**
 * Service Worker - Push Notifications
 */

const CACHE_NAME = "iftarakalan-v1";

// Service Worker kurulumu
self.addEventListener("install", (event) => {
	console.log("✅ Service Worker yüklendi");
	self.skipWaiting();
});

// Service Worker aktifleştirilmesi
self.addEventListener("activate", (event) => {
	console.log("✅ Service Worker aktif");
	event.waitUntil(clients.claim());
});

// Push bildirimi geldiğinde
self.addEventListener("push", (event) => {
	console.log("📬 Push bildirimi alındı:", event);

	let data = {
		title: "İftara Kalan",
		body: "Bildirim",
		icon: "/favicon.svg",
		badge: "/favicon.svg",
	};

	// Push data varsa parse et
	if (event.data) {
		try {
			data = { ...data, ...event.data.json() };
		} catch (e) {
			data.body = event.data.text();
		}
	}

	const options = {
		body: data.body,
		icon: data.icon,
		badge: data.badge,
		vibrate: [200, 100, 200],
		tag: "iftar-notification",
		requireInteraction: false,
		data: {
			url: data.url || "/",
		},
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});

// Bildirime tıklandığında
self.addEventListener("notificationclick", (event) => {
	console.log("🔔 Bildirime tıklandı");

	event.notification.close();

	event.waitUntil(
		clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			// Açık pencere varsa odaklan
			for (const client of clientList) {
				if (client.url === "/" && "focus" in client) {
					return client.focus();
				}
			}
			// Yoksa yeni pencere aç
			if (clients.openWindow) {
				return clients.openWindow("/");
			}
		})
	);
});
