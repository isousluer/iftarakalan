/**
 * Ana uygulama - Tüm modülleri koordine eder
 */

const App = {
	state: {
		location: null,
		iftarTime: null,
		isLoading: false,
		error: null,
		showManualSelection: false,
	},

	// DOM elementleri
	elements: {
		hoursDisplay: null,
		minutesDisplay: null,
		secondsDisplay: null,
		iftarTimeDisplay: null,
		locationInfo: null,
		loadingOverlay: null,
		errorMessage: null,
		countrySelect: null,
		citySelect: null,
		districtSelect: null,
		manualLocationPanel: null,
		changeLocationBtn: null,
	},

	/**
	 * Uygulamayı başlat
	 */
	async init() {
		console.log("🚀 Uygulama başlatılıyor...");

		// DOM elementlerini al
		this.initElements();

		// Event listener'ları ekle
		this.attachEventListeners();

		// Otomatik konum tespiti dene
		await this.startLocationDetection();
	},

	/**
	 * DOM elementlerini initialize et
	 */
	initElements() {
		this.elements = {
			hoursDisplay: document.getElementById("hours"),
			minutesDisplay: document.getElementById("minutes"),
			secondsDisplay: document.getElementById("seconds"),
			iftarTimeDisplay: document.getElementById("iftar-time"),
			locationInfo: document.getElementById("location-info"),
			loadingOverlay: document.getElementById("loading"),
			errorMessage: document.getElementById("error-message"),
			countrySelect: document.getElementById("country-select"),
			citySelect: document.getElementById("city-select"),
			districtSelect: document.getElementById("district-select"),
			manualLocationPanel: document.getElementById("manual-location"),
			changeLocationBtn: document.getElementById("change-location-btn"),
		};
	},

	/**
	 * Event listener'ları ekle
	 */
	attachEventListeners() {
		// Şehir dropdown değiştiğinde ilçeleri yükle
		if (this.elements.citySelect) {
			this.elements.citySelect.addEventListener("change", async (e) => {
				const cityId = e.target.value;
				if (cityId) {
					await this.loadDistricts(cityId);
				}
			});
		}

		// İlçe seçildiğinde geri sayımı başlat
		if (this.elements.districtSelect) {
			this.elements.districtSelect.addEventListener("change", async (e) => {
				const districtId = e.target.value;
				if (districtId) {
					const cityId = this.elements.citySelect.value;
					await this.handleManualLocationSelect("2", cityId, districtId);
				}
			});
		}

		// Konum değiştir butonu
		if (this.elements.changeLocationBtn) {
			this.elements.changeLocationBtn.addEventListener("click", () => {
				this.showManualLocationPanel();
			});
		}
	},

	/**
	 * Konum tespitini başlat
	 */
	async startLocationDetection() {
		try {
			this.showLoading("Konum tespit ediliyor...");

			// Otomatik konum tespiti
			const location = await LocationManager.autoDetectLocation();
			this.state.location = location;

			// İftar saatini al ve geri sayımı başlat
			await this.loadIftarTimeAndStartCountdown(location.ilceId);
		} catch (error) {
			console.error("Konum tespit hatası:", error);

			if (error.message === "PERMISSION_DENIED") {
				// İzin reddedildiyse manuel seçimi göster
				this.showManualLocationPanel();
			} else {
				// Diğer hatalar için hata mesajı göster
				this.showError("Konum tespit edilemedi. Lütfen manuel olarak seçin.");
				this.showManualLocationPanel();
			}
		} finally {
			this.hideLoading();
		}
	},

	/**
	 * İftar saatini yükle ve geri sayımı başlat
	 */
	async loadIftarTimeAndStartCountdown(districtId) {
		try {
			this.showLoading("İftar saati yükleniyor...");

			// İftar saatini API'den al
			const iftarData = await API.getTodayIftarTime(districtId);
			this.state.iftarTime = iftarData.time;

			// Cache durumunu logla
			console.log("İftar saati:", iftarData.time, "(Cache:", iftarData.fromCache ? "Evet" : "Hayır", ")");

			// UI'ı güncelle
			this.updateIftarTimeDisplay(iftarData.time);
			this.updateLocationInfo();

			// Geri sayımı başlat
			this.startCountdown(iftarData.time);

			this.hideLoading();
			this.hideError();
		} catch (error) {
			console.error("İftar saati yükleme hatası:", error);
			this.showError("İftar saati yüklenemedi. Lütfen tekrar deneyin.");
			this.hideLoading();
		}
	},

	/**
	 * Geri sayımı başlat
	 */
	startCountdown(iftarTime) {
		Countdown.start(iftarTime, (countdown) => {
			// İftar vakti geçtiyse yarının verisini al
			if (countdown.needsTomorrowData && !this.state.isLoading) {
				this.loadTomorrowIftarTime();
				return;
			}

			// Countdown'u güncelle
			this.updateCountdownDisplay(countdown);
		});
	},

	/**
	 * Yarının iftar saatini yükle
	 */
	async loadTomorrowIftarTime() {
		try {
			console.log("İftar vakti geçti, yarının saati yükleniyor...");
			const tomorrowData = await API.getTomorrowIftarTime(this.state.location.ilceId);

			this.state.iftarTime = tomorrowData.time;
			this.updateIftarTimeDisplay(tomorrowData.time);

			// Geri sayımı yeniden başlat
			this.startCountdown(tomorrowData.time);
		} catch (error) {
			console.error("Yarının iftar saati yüklenemedi:", error);
			this.showError("Yarının iftar saati yüklenemedi.");
		}
	},

	/**
	 * Manuel konum seçimi panelini göster
	 */
	async showManualLocationPanel() {
		try {
			console.log("📍 Manuel konum paneli açılıyor...");
			this.state.showManualSelection = true;

			// Panel görünür yap
			if (this.elements.manualLocationPanel) {
				console.log("✅ Panel elementi bulundu, hidden class kaldırılıyor");
				this.elements.manualLocationPanel.classList.remove("hidden");
			} else {
				console.error("❌ Panel elementi bulunamadı!");
			}

			// Şehirleri yükle
			console.log("🌆 loadCities() çağrılıyor...");
			await this.loadCities();
			console.log("✅ loadCities() tamamlandı");
		} catch (error) {
			console.error("❌ Manuel konum paneli hatası:", error);
			console.error("Hata detayı:", error.message, error.stack);
			this.showError("Konum listesi yüklenemedi.");
		}
	},

	/**
	 * Şehirleri yükle
	 */
	async loadCities() {
		try {
			console.log("🏙️ Şehirler yükleniyor...");
			const cities = await LocationManager.populateDropdown("cities", "2");
			console.log("✅ Şehirler alındı:", cities.length, "şehir");
			console.log("İlk şehir örneği:", cities[0]);

			if (this.elements.citySelect) {
				this.elements.citySelect.innerHTML = '<option value="">Şehir seçin...</option>';

				cities.forEach((city) => {
					const option = document.createElement("option");
					option.value = city.SehirID;
					option.textContent = city.SehirAdi;
					this.elements.citySelect.appendChild(option);
				});
			}
		} catch (error) {
			console.error("Şehir yükleme hatası:", error);
			throw error;
		}
	},

	/**
	 * İlçeleri yükle
	 */
	async loadDistricts(cityId) {
		try {
			const districts = await LocationManager.populateDropdown("districts", cityId);

			if (this.elements.districtSelect) {
				this.elements.districtSelect.innerHTML = '<option value="">İlçe seçin...</option>';

				districts.forEach((district) => {
					const option = document.createElement("option");
					option.value = district.IlceID;
					option.textContent = district.IlceAdi;
					this.elements.districtSelect.appendChild(option);
				});

				// İlçe dropdown'ını aktif et
				this.elements.districtSelect.disabled = false;
			}
		} catch (error) {
			console.error("İlçe yükleme hatası:", error);
			this.showError("İlçeler yüklenemedi.");
		}
	},

	/**
	 * Manuel konum seçimini işle
	 */
	async handleManualLocationSelect(countryId, cityId, districtId) {
		try {
			this.showLoading("Konum ayarlanıyor...");

			// Konumu kaydet
			const location = await LocationManager.selectManualLocation(countryId, cityId, districtId);
			this.state.location = location;

			// Manuel paneli gizle
			if (this.elements.manualLocationPanel) {
				this.elements.manualLocationPanel.classList.add("hidden");
			}

			// İftar saatini yükle ve geri sayımı başlat
			await this.loadIftarTimeAndStartCountdown(districtId);
		} catch (error) {
			console.error("Manuel konum seçim hatası:", error);
			this.showError("Konum ayarlanamadı.");
			this.hideLoading();
		}
	},

	/**
	 * Countdown görüntüsünü güncelle
	 */
	updateCountdownDisplay(countdown) {
		if (this.elements.hoursDisplay) {
			this.elements.hoursDisplay.textContent = Countdown.formatNumber(countdown.hours);
		}
		if (this.elements.minutesDisplay) {
			this.elements.minutesDisplay.textContent = Countdown.formatNumber(countdown.minutes);
		}
		if (this.elements.secondsDisplay) {
			this.elements.secondsDisplay.textContent = Countdown.formatNumber(countdown.seconds);
		}

		// Mesaj varsa göster
		if (countdown.message) {
			this.showError(countdown.message);
		}
	},

	/**
	 * İftar saati görüntüsünü güncelle
	 */
	updateIftarTimeDisplay(time) {
		if (this.elements.iftarTimeDisplay) {
			this.elements.iftarTimeDisplay.textContent = time;
		}
	},

	/**
	 * Konum bilgisini güncelle
	 */
	updateLocationInfo() {
		if (this.elements.locationInfo && this.state.location) {
			const { sehirAdi, ilceAdi } = this.state.location;
			this.elements.locationInfo.textContent = `${sehirAdi} / ${ilceAdi}`;
		}
	},

	/**
	 * Loading göster
	 */
	showLoading(message = "Yükleniyor...") {
		this.state.isLoading = true;
		if (this.elements.loadingOverlay) {
			this.elements.loadingOverlay.classList.remove("hidden");
			const loadingText = this.elements.loadingOverlay.querySelector(".loading-text");
			if (loadingText) {
				loadingText.textContent = message;
			}
		}
	},

	/**
	 * Loading gizle
	 */
	hideLoading() {
		this.state.isLoading = false;
		if (this.elements.loadingOverlay) {
			this.elements.loadingOverlay.classList.add("hidden");
		}
	},

	/**
	 * Hata mesajı göster
	 */
	showError(message) {
		this.state.error = message;
		if (this.elements.errorMessage) {
			this.elements.errorMessage.textContent = message;
			this.elements.errorMessage.classList.remove("hidden");
		}
	},

	/**
	 * Hata mesajını gizle
	 */
	hideError() {
		this.state.error = null;
		if (this.elements.errorMessage) {
			this.elements.errorMessage.classList.add("hidden");
		}
	},
};

// Sayfa yüklendiğinde uygulamayı başlat
document.addEventListener("DOMContentLoaded", () => {
	App.init();
});

// Global scope'a ekle (debugging için)
window.App = App;
