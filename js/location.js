/**
 * Konum yönetimi - Geolocation ve Manuel seçim
 */

const LocationManager = {
	/**
	 * Tarayıcı Geolocation API ile otomatik konum al
	 * @returns {Promise<Object>} Koordinatlar {lat, lng}
	 */
	async getGeolocation() {
		return new Promise((resolve, reject) => {
			console.log("📍 Geolocation API başlatılıyor...");

			if (!navigator.geolocation) {
				console.error("❌ Geolocation desteklenmiyor");
				reject(new Error("Geolocation desteklenmiyor"));
				return;
			}

			console.log("⏳ Konum izni bekleniyor (timeout: 10 saniye)...");

			navigator.geolocation.getCurrentPosition(
				(position) => {
					console.log("✅ Konum alındı:", position.coords.latitude, position.coords.longitude);
					const coords = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};

					// İzin verildiğini kaydet
					Storage.saveGeolocationPermission(true);

					resolve(coords);
				},
				(error) => {
					console.error("❌ Geolocation hatası:", error.code, error.message);

					// İzin reddedildiğini kaydet
					Storage.saveGeolocationPermission(false);

					let errorMessage = "Konum alınamadı";
					switch (error.code) {
						case error.PERMISSION_DENIED:
							errorMessage = "Konum izni reddedildi";
							console.log("🚫 Kullanıcı konum iznini reddetti");
							break;
						case error.POSITION_UNAVAILABLE:
							errorMessage = "Konum bilgisi alınamadı";
							console.log("⚠️ Konum bilgisi mevcut değil");
							break;
						case error.TIMEOUT:
							errorMessage = "Konum alma zaman aşımına uğradı";
							console.log("⏱️ Timeout: Konum alınamadı");
							break;
					}

					reject(new Error(errorMessage));
				},
				{
					enableHighAccuracy: true,
					timeout: 10000, // 10 saniye (5'ten artırıldı)
					maximumAge: 0,
				}
			);
		});
	},

	/**
	 * Koordinatlardan konum bilgisi al (şehir bulma)
	 * @param {number} lat - Enlem
	 * @param {number} lng - Boylam
	 * @returns {Promise<Object>} Konum bilgisi
	 */
	async getLocationFromCoords(lat, lng) {
		try {
			// En yakın şehri bul
			const city = await API.findNearestCity(lat, lng);

			// İlk ilçeyi al (şehir merkezi genelde ilk sıradadır)
			const districts = await API.getDistricts(city.SehirID);
			const district = districts[0]; // İlk ilçe

			const location = {
				ulkeId: "2",
				ulkeAdi: "Türkiye",
				sehirId: city.SehirID,
				sehirAdi: city.SehirAdi,
				ilceId: district.IlceID,
				ilceAdi: district.IlceAdi,
				method: "geolocation",
			};

			// Konumu kaydet
			Storage.saveLocation(location);

			return location;
		} catch (error) {
			console.error("Get location from coords error:", error);
			throw error;
		}
	},

	/**
	 * Manuel konum seçimi
	 * @param {string} countryId - Ülke ID
	 * @param {string} cityId - Şehir ID
	 * @param {string} districtId - İlçe ID
	 * @returns {Promise<Object>} Konum bilgisi
	 */
	async selectManualLocation(countryId, cityId, districtId) {
		try {
			// Şehir ve ilçe isimlerini al
			const cities = await API.getCities(countryId);
			const city = cities.find((c) => c.SehirID === cityId);

			const districts = await API.getDistricts(cityId);
			const district = districts.find((d) => d.IlceID === districtId);

			const location = {
				ulkeId: countryId,
				ulkeAdi: "Türkiye", // Şimdilik sadece Türkiye
				sehirId: cityId,
				sehirAdi: city.SehirAdi,
				ilceId: districtId,
				ilceAdi: district.IlceAdi,
				method: "manual",
			};

			// Konumu kaydet
			Storage.saveLocation(location);

			return location;
		} catch (error) {
			console.error("Select manual location error:", error);
			throw error;
		}
	},

	/**
	 * Kayıtlı konumu al
	 * @returns {Object|null} Konum bilgisi
	 */
	getSavedLocation() {
		return Storage.getLocation();
	},

	/**
	 * Konum değiştirildi mi kontrol et
	 * @param {string} districtId - Yeni ilçe ID
	 * @returns {boolean} Değişim durumu
	 */
	hasLocationChanged(districtId) {
		const saved = this.getSavedLocation();
		return !saved || saved.ilceId !== districtId;
	},

	/**
	 * Otomatik konum tespiti yap (ana fonksiyon)
	 * @returns {Promise<Object>} Konum bilgisi
	 */
	async autoDetectLocation() {
		try {
			// Önce kaydedilmiş konum var mı kontrol et
			const savedLocation = this.getSavedLocation();
			if (savedLocation) {
				console.log("Kaydedilmiş konum kullanılıyor:", savedLocation);
				return savedLocation;
			}

			// Geolocation izni daha önce verilmiş mi kontrol et
			const permission = Storage.getGeolocationPermission();
			if (permission === false) {
				// İzin reddedilmişse manuel seçim gerekli
				throw new Error("PERMISSION_DENIED");
			}

			// Geolocation dene
			console.log("Geolocation ile konum alınıyor...");
			const coords = await this.getGeolocation();
			console.log("Koordinatlar alındı:", coords);

			// Koordinatlardan konum bilgisi al
			const location = await this.getLocationFromCoords(coords.lat, coords.lng);
			console.log("Konum belirlendi:", location);

			return location;
		} catch (error) {
			console.error("Auto detect location error:", error);
			throw error;
		}
	},

	/**
	 * Dropdown'ları doldur
	 * @param {string} type - 'cities' veya 'districts'
	 * @param {string} parentId - Parent ID (cityId for districts)
	 * @returns {Promise<Array>} Liste
	 */
	async populateDropdown(type, parentId = null) {
		try {
			let data = [];

			switch (type) {
				case "countries":
					data = await API.getCountries();
					break;
				case "cities":
					data = await API.getCities(parentId || "2");
					break;
				case "districts":
					if (!parentId) throw new Error("City ID gerekli");
					data = await API.getDistricts(parentId);
					break;
				default:
					throw new Error("Geçersiz dropdown tipi");
			}

			return data;
		} catch (error) {
			console.error("Populate dropdown error:", error);
			throw error;
		}
	},
};

// Global scope'a ekle
window.LocationManager = LocationManager;
