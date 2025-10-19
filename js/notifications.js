/**
 * Notification Manager - Push Notifications
 */

const NotificationManager = {
	// Notification ayarları
	settings: {
		enabled: false,
		oneHour: true,
		thirtyMinutes: true,
		tenMinutes: true,
	},

	// Service Worker registration
	swRegistration: null,

	/**
	 * Notification sistemini başlat
	 */
	async init() {
		// Service Worker desteği kontrolü
		if (!("serviceWorker" in navigator)) {
			console.warn("⚠️ Service Worker desteklenmiyor");
			return false;
		}

		// Push API desteği kontrolü
		if (!("PushManager" in window)) {
			console.warn("⚠️ Push API desteklenmiyor");
			return false;
		}

		// Notification desteği kontrolü
		if (!("Notification" in window)) {
			console.warn("⚠️ Notification API desteklenmiyor");
			return false;
		}

		try {
			// Service Worker'ı kaydet
			this.swRegistration = await navigator.serviceWorker.register("/sw.js");
			console.log("✅ Service Worker kaydedildi");

			// Kaydedilmiş ayarları yükle
			this.loadSettings();

			return true;
		} catch (error) {
			console.error("❌ Service Worker kayıt hatası:", error);
			return false;
		}
	},

	/**
	 * Notification izni iste
	 */
	async requestPermission() {
		if (!("Notification" in window)) {
			return false;
		}

		try {
			const permission = await Notification.requestPermission();

			if (permission === "granted") {
				console.log("✅ Notification izni verildi");
				this.settings.enabled = true;
				this.saveSettings();

				// Push subscription oluştur
				await this.subscribeToPush();

				return true;
			} else {
				console.log("❌ Notification izni reddedildi");
				return false;
			}
		} catch (error) {
			console.error("❌ Notification izin hatası:", error);
			return false;
		}
	},

	/**
	 * Push subscription oluştur
	 */
	async subscribeToPush() {
		if (!this.swRegistration) {
			console.error("❌ Service Worker kayıtlı değil");
			return null;
		}

		try {
			// Mevcut subscription kontrolü
			let subscription = await this.swRegistration.pushManager.getSubscription();

			if (!subscription) {
				// VAPID public key (backend'den alınacak)
				const vapidPublicKey = await this.getVapidPublicKey();

				// Yeni subscription oluştur
				subscription = await this.swRegistration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
				});

				console.log("✅ Push subscription oluşturuldu");
			}

			// Subscription'ı backend'e kaydet
			await this.saveSubscriptionToBackend(subscription);

			return subscription;
		} catch (error) {
			console.error("❌ Push subscription hatası:", error);
			return null;
		}
	},

	/**
	 * VAPID public key al (backend'den)
	 */
	async getVapidPublicKey() {
		try {
			const response = await fetch("/api/vapid-public-key");
			const data = await response.json();
			return data.publicKey;
		} catch (error) {
			console.error("❌ VAPID key alınamadı:", error);
			// Fallback: Geçici test key (production'da backend'den alınmalı)
			return "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
		}
	},

	/**
	 * Subscription'ı backend'e kaydet
	 */
	async saveSubscriptionToBackend(subscription) {
		try {
			// Kullanıcı konum bilgisi
			const location = Storage.getLocation();

			const response = await fetch("/api/save-subscription", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					subscription: subscription.toJSON(),
					location: location,
					settings: this.settings,
				}),
			});

			if (response.ok) {
				console.log("✅ Subscription backend'e kaydedildi");
			} else {
				console.error("❌ Subscription kayıt hatası:", response.status);
			}
		} catch (error) {
			console.error("❌ Backend kayıt hatası:", error);
		}
	},

	/**
	 * Notification ayarlarını güncelle
	 */
	async updateSettings(newSettings) {
		this.settings = { ...this.settings, ...newSettings };
		this.saveSettings();

		// Backend'e güncellemeyi gönder
		const subscription = await this.swRegistration?.pushManager.getSubscription();
		if (subscription) {
			await this.saveSubscriptionToBackend(subscription);
		}
	},

	/**
	 * Ayarları kaydet (LocalStorage)
	 */
	saveSettings() {
		Storage.set("notificationSettings", this.settings);
	},

	/**
	 * Ayarları yükle (LocalStorage)
	 */
	loadSettings() {
		const saved = Storage.get("notificationSettings");
		if (saved) {
			this.settings = { ...this.settings, ...saved };
		}
	},

	/**
	 * Notification durumunu kontrol et
	 */
	getPermissionStatus() {
		if (!("Notification" in window)) {
			return "unsupported";
		}
		return Notification.permission;
	},

	/**
	 * Test bildirimi gönder
	 */
	async sendTestNotification() {
		if (Notification.permission !== "granted") {
			console.warn("⚠️ Notification izni yok");
			return;
		}

		try {
			await this.swRegistration.showNotification("İftara Kalan 🌙", {
				body: "Bildirimler başarıyla aktif edildi!",
				icon: "/favicon.svg",
				badge: "/favicon.svg",
				vibrate: [200, 100, 200],
				tag: "test-notification",
			});
		} catch (error) {
			console.error("❌ Test bildirimi hatası:", error);
		}
	},

	/**
	 * Base64 VAPID key'i Uint8Array'e çevir
	 */
	urlBase64ToUint8Array(base64String) {
		const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	},

	/**
	 * Bildirimleri devre dışı bırak
	 */
	async disable() {
		try {
			const subscription = await this.swRegistration?.pushManager.getSubscription();
			if (subscription) {
				await subscription.unsubscribe();
				console.log("✅ Subscription iptal edildi");
			}

			this.settings.enabled = false;
			this.saveSettings();

			// Backend'e bildir
			await fetch("/api/remove-subscription", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					endpoint: subscription?.endpoint,
				}),
			});
		} catch (error) {
			console.error("❌ Disable hatası:", error);
		}
	},
};

// Global scope'a ekle
window.NotificationManager = NotificationManager;
