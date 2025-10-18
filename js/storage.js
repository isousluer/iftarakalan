/**
 * LocalStorage yönetimi için utility fonksiyonları
 */

const Storage = {
	/**
	 * LocalStorage'a veri kaydet
	 * @param {string} key - Anahtar
	 * @param {any} value - Değer (JSON.stringify ile kaydedilir)
	 * @returns {boolean} Başarı durumu
	 */
	set(key, value) {
		try {
			const serialized = JSON.stringify(value);
			localStorage.setItem(key, serialized);
			return true;
		} catch (error) {
			console.error("Storage set error:", error);
			return false;
		}
	},

	/**
	 * LocalStorage'dan veri oku
	 * @param {string} key - Anahtar
	 * @returns {any|null} Veri veya null
	 */
	get(key) {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (error) {
			console.error("Storage get error:", error);
			return null;
		}
	},

	/**
	 * LocalStorage'dan veri sil
	 * @param {string} key - Anahtar
	 */
	remove(key) {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.error("Storage remove error:", error);
		}
	},

	/**
	 * Tüm storage'ı temizle
	 */
	clear() {
		try {
			localStorage.clear();
		} catch (error) {
			console.error("Storage clear error:", error);
		}
	},

	/**
	 * Seçili konumu kaydet
	 * @param {Object} location - Konum bilgisi
	 */
	saveLocation(location) {
		return this.set("selectedLocation", location);
	},

	/**
	 * Seçili konumu al
	 * @returns {Object|null} Konum bilgisi
	 */
	getLocation() {
		return this.get("selectedLocation");
	},

	/**
	 * Namaz vakitlerini kaydet
	 * @param {string} ilceId - İlçe ID
	 * @param {Array} data - 30 günlük veri
	 */
	savePrayerTimes(ilceId, data) {
		const prayerData = {
			ilceId,
			fetchDate: new Date().toISOString().split("T")[0],
			data,
		};
		return this.set("prayerTimes", prayerData);
	},

	/**
	 * Namaz vakitlerini al
	 * @returns {Object|null} Prayer times verisi
	 */
	getPrayerTimes() {
		return this.get("prayerTimes");
	},

	/**
	 * Cache'in geçerli olup olmadığını kontrol et
	 * @param {string} ilceId - İlçe ID
	 * @returns {boolean} Cache geçerliliği
	 */
	isPrayerTimesValid(ilceId) {
		const cached = this.getPrayerTimes();
		if (!cached) return false;

		// İlçe değişmişse cache geçersiz
		if (cached.ilceId !== ilceId) return false;

		// Fetch date'i al
		const fetchDate = new Date(cached.fetchDate);
		const today = new Date();

		// Tarih farkını hesapla
		const diffTime = Math.abs(today - fetchDate);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		// 7 günden eskiyse cache'i yenile
		return diffDays < 7;
	},

	/**
	 * Geolocation iznini kaydet
	 * @param {boolean} granted - İzin durumu
	 */
	saveGeolocationPermission(granted) {
		return this.set("geolocationPermission", granted);
	},

	/**
	 * Geolocation iznini al
	 * @returns {boolean|null} İzin durumu
	 */
	getGeolocationPermission() {
		return this.get("geolocationPermission");
	},
};

// Global scope'a ekle
window.Storage = Storage;
