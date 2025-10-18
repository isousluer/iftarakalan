/**
 * Ana uygulama - Tüm modülleri koordine eder
 */

const App = {
	state: {
		location: null,
		autoLocation: null, // Geolocation ile alınan ilk konum
		iftarTime: null,
		targetDate: null, // Hedef tarih (bugün/yarın)
		isLoading: false,
		error: null,
		showManualSelection: false,
		tomorrowDataRequested: false, // Yarının verisi için flag
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
		closePanelBtn: null,
		resetLocationBtn: null,
	},

	/**
	 * Uygulamayı başlat
	 */
	async init() {
		// DOM elementlerini al
		this.initElements();

		// Event listener'ları ekle
		this.attachEventListeners();

		// Kaydedilmiş konumları yükle
		const savedLocation = Storage.getLocation();
		const savedAutoLocation = Storage.getAutoLocation();

		if (savedAutoLocation && savedAutoLocation.method === "geolocation") {
			this.state.autoLocation = savedAutoLocation;
		}

		// Eğer manuel seçim yapılmışsa ve otomatik konum varsa → reset butonu göster
		if (savedLocation && savedLocation.method === "manual" && this.state.autoLocation) {
			this.showResetButton();
		}

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
			closePanelBtn: document.getElementById("close-panel-btn"),
			resetLocationBtn: document.getElementById("reset-location-btn"),
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

		// Panel kapatma butonu
		if (this.elements.closePanelBtn) {
			this.elements.closePanelBtn.addEventListener("click", () => {
				this.hideManualLocationPanel();
			});
		}

		// Otomatik konuma dön butonu
		if (this.elements.resetLocationBtn) {
			this.elements.resetLocationBtn.addEventListener("click", async () => {
				await this.resetToAutoLocation();
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

			// İlk otomatik konumu sakla (reset için)
			if (location.method === "geolocation") {
				this.state.autoLocation = location;
				Storage.saveAutoLocation(location); // STORAGE'A KAYDET!
				// Reset butonu GÖSTERİLMEZ - sadece manuel seçim sonrası gösterilir
			}

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
			let iftarData = await API.getTodayIftarTime(districtId);

			// Eğer bugünün iftarı geçtiyse, yarının saatini al
			if (this.isIftarPassed(iftarData.time)) {
				iftarData = await API.getTomorrowIftarTime(districtId);
				this.showError("Bugünün iftarı geçti. Yarının iftarına kalan süre gösteriliyor.");
			}

			this.state.iftarTime = iftarData.time;
			this.state.targetDate = iftarData.date;

			// UI'ı güncelle
			this.updateIftarTimeDisplay(iftarData.time);
			this.updateLocationInfo();

			// Geri sayımı başlat (tarih bilgisi ile)
			const targetDate = iftarData.date;

			// CALLBACK fonksiyonunu tanımla
			const countdownCallback = (countdown) => {
				this.updateCountdownDisplay(countdown);

				if (countdown.needsTomorrowData && !targetDate && !this.state.isLoading && !this.state.tomorrowDataRequested) {
					this.state.tomorrowDataRequested = true;
					this.loadTomorrowIftarTime();
				}
			};

			// Countdown'u başlat - tarih varsa 3 parametre, yoksa 2
			if (targetDate) {
				Countdown.start(iftarData.time, targetDate, countdownCallback);
			} else {
				Countdown.start(iftarData.time, countdownCallback);
			}

			this.hideLoading();
		} catch (error) {
			console.error("❌ İftar saati yükleme hatası:", error);
			this.showError("İftar saati yüklenemedi. Lütfen tekrar deneyin.");
			this.hideLoading();
		}
	},

	/**
	 * İftar vakti geçti mi kontrol et
	 * @param {string} iftarTime - İftar saati (HH:MM)
	 * @returns {boolean} Geçme durumu
	 */
	isIftarPassed(iftarTime) {
		const now = new Date();
		const [hours, minutes] = iftarTime.split(":").map(Number);

		const iftarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

		return now > iftarDate;
	},

	/**
	 * Geri sayımı başlat
	 */
	// DEPRECATED - Artık loadIftarTimeAndStartCountdown içinde direkt çağrılıyor

	/**
	 * Yarının iftar saatini yükle
	 */
	async loadTomorrowIftarTime() {
		try {
			Countdown.stop();
			this.showLoading("Yarının iftar saati yükleniyor...");

			const tomorrowData = await API.getTomorrowIftarTime(this.state.location.ilceId);

			this.state.iftarTime = tomorrowData.time;
			this.state.targetDate = tomorrowData.date;
			this.state.tomorrowDataRequested = false;

			this.updateIftarTimeDisplay(tomorrowData.time);
			this.showError("Bugünün iftarı geçti. Yarına kalan süre gösteriliyor.");

			// Geri sayımı yeniden başlat
			const countdownCallback = (countdown) => {
				this.updateCountdownDisplay(countdown);
			};

			Countdown.start(tomorrowData.time, tomorrowData.date, countdownCallback);

			this.hideLoading();
		} catch (error) {
			console.error("❌ Yarının iftar saati yüklenemedi:", error);
			this.showError("Yarının iftar saati yüklenemedi.");
			this.hideLoading();
		}
	},

	/**
	 * Manuel konum seçimi panelini göster
	 */
	async showManualLocationPanel() {
		try {
			this.state.showManualSelection = true;

			// Panel görünür yap
			if (this.elements.manualLocationPanel) {
				this.elements.manualLocationPanel.classList.remove("hidden");
			}

			// Şehirleri yükle
			await this.loadCities();

			// Eğer mevcut konum varsa, dropdown'ları otomatik doldur
			if (this.state.location) {
				// Şehri seç
				if (this.elements.citySelect && this.state.location.sehirId) {
					this.elements.citySelect.value = this.state.location.sehirId;
				}

				// İlçeleri yükle ve seç
				if (this.state.location.sehirId) {
					await this.loadDistricts(this.state.location.sehirId);

					// İlçeyi seç
					if (this.elements.districtSelect && this.state.location.ilceId) {
						this.elements.districtSelect.value = this.state.location.ilceId;
					}
				}
			}
		} catch (error) {
			console.error("❌ Manuel konum paneli hatası:", error);
			this.showError("Konum listesi yüklenemedi.");
		}
	},

	/**
	 * Manuel konum panelini gizle
	 */
	hideManualLocationPanel() {
		if (this.elements.manualLocationPanel) {
			this.elements.manualLocationPanel.classList.add("hidden");
		}
		this.state.showManualSelection = false;
	},

	/**
	 * Otomatik konuma geri dön
	 */
	async resetToAutoLocation() {
		try {
			if (!this.state.autoLocation) {
				this.hideManualLocationPanel();
				await this.startLocationDetection();
				return;
			}

			// Otomatik konumu geri yükle
			this.state.location = this.state.autoLocation;

			// STORAGE'A KAYDET! (Hard refresh sonrası korunsun)
			Storage.saveLocation(this.state.autoLocation);

			// Manuel paneli gizle
			this.hideManualLocationPanel();

			// Reset butonunu gizle
			this.hideResetButton();

			// İftar saatini ve countdown'u güncelle
			await this.loadIftarTimeAndStartCountdown(this.state.autoLocation.ilceId);
		} catch (error) {
			console.error("❌ Otomatik konuma dönülemedi:", error);
			this.showError("Otomatik konuma dönülemedi.");
		}
	},

	/**
	 * Reset butonunu göster
	 */
	showResetButton() {
		if (this.elements.resetLocationBtn) {
			this.elements.resetLocationBtn.classList.remove("hidden");
		}
	},

	/**
	 * Reset butonunu gizle
	 */
	hideResetButton() {
		if (this.elements.resetLocationBtn) {
			this.elements.resetLocationBtn.classList.add("hidden");
		}
	},

	/**
	 * Şehirleri yükle
	 */
	async loadCities() {
		try {
			const cities = await LocationManager.populateDropdown("cities", "2");

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
			this.hideManualLocationPanel();

			// Reset butonunu göster (manuel seçim yapıldı)
			if (this.state.autoLocation) {
				this.showResetButton();
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
		// Sadece hata durumunda log at
		if (countdown.error) {
			console.error("❌ Countdown hatası:", countdown);
		}

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
