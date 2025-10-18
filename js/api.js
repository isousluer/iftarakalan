/**
 * ezanvakti.emushaf.net API entegrasyonu
 */

const API = {
	BASE_URL: "https://ezanvakti.emushaf.net",
	PROXY_URL: "http://localhost:8081/api/proxy",
	USE_PROXY: true, // CORS sorunu için proxy kullan

	/**
	 * API çağrısı yap
	 * @param {string} endpoint - API endpoint
	 * @returns {Promise<any>} API yanıtı
	 */
	async fetch(endpoint) {
		try {
			const targetUrl = `${this.BASE_URL}${endpoint}`;
			const url = this.USE_PROXY ? `${this.PROXY_URL}?url=${encodeURIComponent(targetUrl)}` : targetUrl;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`API Error: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("API fetch error:", error);
			throw error;
		}
	},

	/**
	 * Ülke listesini al
	 * @returns {Promise<Array>} Ülke listesi
	 */
	async getCountries() {
		try {
			return await this.fetch("/ulkeler");
		} catch (error) {
			console.error("Get countries error:", error);
			throw error;
		}
	},

	/**
	 * Şehir listesini al
	 * @param {string} countryId - Ülke ID (Türkiye: 2)
	 * @returns {Promise<Array>} Şehir listesi
	 */
	async getCities(countryId = "2") {
		try {
			return await this.fetch(`/sehirler/${countryId}`);
		} catch (error) {
			console.error("Get cities error:", error);
			throw error;
		}
	},

	/**
	 * İlçe listesini al
	 * @param {string} cityId - Şehir ID
	 * @returns {Promise<Array>} İlçe listesi
	 */
	async getDistricts(cityId) {
		try {
			return await this.fetch(`/ilceler/${cityId}`);
		} catch (error) {
			console.error("Get districts error:", error);
			throw error;
		}
	},

	/**
	 * Namaz vakitlerini al (30 günlük)
	 * @param {string} districtId - İlçe ID
	 * @returns {Promise<Array>} Namaz vakitleri
	 */
	async getPrayerTimes(districtId) {
		try {
			return await this.fetch(`/vakitler/${districtId}`);
		} catch (error) {
			console.error("Get prayer times error:", error);
			throw error;
		}
	},

	/**
	 * Bugünün iftar saatini al
	 * @param {string} districtId - İlçe ID
	 * @returns {Promise<Object>} İftar bilgisi {time, fullData}
	 */
	async getTodayIftarTime(districtId) {
		try {
			console.log("📅 Bugünün iftar saati alınıyor...");

			// Cache kontrolü
			if (Storage.isPrayerTimesValid(districtId)) {
				const cached = Storage.getPrayerTimes();
				const today = new Date();
				const todayStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`;

				console.log("🔍 Cache'de aranan tarih:", todayStr);

				const todayData = cached.data.find((day) => {
					return day.MiladiTarihKisa === todayStr;
				});

				if (todayData) {
					console.log("✅ Cache'den alındı:", todayData.Aksam, "Tarih:", todayStr);
					return {
						time: todayData.Aksam, // İftar saati = Akşam namazı
						date: todayStr, // TARİH BİLGİSİ EKLE!
						fullData: todayData,
						fromCache: true,
					};
				}
			}

			// Cache yoksa veya geçersizse API'den al
			console.log("🌐 API'den alınıyor...");
			const prayerTimes = await this.getPrayerTimes(districtId);
			console.log("✅ API'den", prayerTimes.length, "günlük veri alındı");

			// Cache'e kaydet
			Storage.savePrayerTimes(districtId, prayerTimes);

			// Bugünün verisini bul
			const today = new Date();
			const todayStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`;

			console.log("🔍 API'de aranan tarih:", todayStr);
			console.log("İlk gün örneği:", prayerTimes[0]);

			const todayData = prayerTimes.find((day) => {
				return day.MiladiTarihKisa === todayStr;
			});

			if (!todayData) {
				console.error("❌ Bugünün verisi bulunamadı. Aranan:", todayStr);
				console.error(
					"Mevcut tarihler:",
					prayerTimes.map((d) => d.MiladiTarihKisa)
				);
				throw new Error("Bugünün iftar saati bulunamadı");
			}

			console.log("✅ Bugünün iftar saati:", todayData.Aksam);
			return {
				time: todayData.Aksam,
				date: todayStr, // Tarih bilgisi de ekle
				fullData: todayData,
				fromCache: false,
			};
		} catch (error) {
			console.error("❌ Get today iftar time error:", error);
			throw error;
		}
	},

	/**
	 * Yarının iftar saatini al (iftar vakti geçtiyse)
	 * @param {string} districtId - İlçe ID
	 * @returns {Promise<Object>} İftar bilgisi
	 */
	async getTomorrowIftarTime(districtId) {
		try {
			const prayerTimes = Storage.getPrayerTimes()?.data || (await this.getPrayerTimes(districtId));

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const tomorrowStr = `${tomorrow.getDate().toString().padStart(2, "0")}.${(tomorrow.getMonth() + 1).toString().padStart(2, "0")}.${tomorrow.getFullYear()}`;

			const tomorrowData = prayerTimes.find((day) => {
				return day.MiladiTarihKisa === tomorrowStr;
			});

			if (!tomorrowData) {
				throw new Error("Yarının iftar saati bulunamadı");
			}

			console.log("✅ Yarının iftar saati:", tomorrowData.Aksam, "Tarih:", tomorrowStr);
			return {
				time: tomorrowData.Aksam,
				date: tomorrowStr, // YARIN TARİHİ
				fullData: tomorrowData,
				isTomorrow: true,
			};
		} catch (error) {
			console.error("Get tomorrow iftar time error:", error);
			throw error;
		}
	},

	/**
	 * Koordinatlara en yakın şehri bul (basit mesafe hesaplaması)
	 * @param {number} lat - Enlem
	 * @param {number} lng - Boylam
	 * @returns {Promise<Object>} En yakın şehir bilgisi
	 */
	async findNearestCity(lat, lng) {
		try {
			const cities = await this.getCities("2"); // Türkiye

			// Türkiye'nin büyük şehirlerinin koordinatları (yaklaşık)
			const cityCoords = {
				İSTANBUL: { lat: 41.0082, lng: 28.9784 },
				ANKARA: { lat: 39.9334, lng: 32.8597 },
				İZMİR: { lat: 38.4237, lng: 27.1428 },
				BURSA: { lat: 40.1826, lng: 29.0665 },
				ANTALYA: { lat: 36.8969, lng: 30.7133 },
				ADANA: { lat: 37.0, lng: 35.3213 },
				KONYA: { lat: 37.8746, lng: 32.4932 },
				GAZİANTEP: { lat: 37.0662, lng: 37.3833 },
				TRABZON: { lat: 41.0027, lng: 39.7168 },
				KAYSERİ: { lat: 38.7225, lng: 35.4875 },
			};

			// En yakın şehri bul
			let nearestCity = null;
			let minDistance = Infinity;

			cities.forEach((city) => {
				const coords = cityCoords[city.SehirAdi];
				if (coords) {
					const distance = Math.sqrt(Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2));

					if (distance < minDistance) {
						minDistance = distance;
						nearestCity = city;
					}
				}
			});

			// Eğer koordinatlarda yoksa İstanbul'u varsayılan yap
			if (!nearestCity) {
				nearestCity = cities.find((c) => c.SehirAdi === "İSTANBUL");
			}

			return nearestCity;
		} catch (error) {
			console.error("Find nearest city error:", error);
			throw error;
		}
	},
};

// Global scope'a ekle
window.API = API;
