/**
 * Ana uygulama - Tüm modülleri koordine eder
 */

const App = {
	state: {
		location: null,
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
			console.log("⏰ loadIftarTimeAndStartCountdown çağrıldı, İlçe ID:", districtId);
			this.showLoading("İftar saati yükleniyor...");

			// İftar saatini API'den al
			console.log("🌐 getTodayIftarTime çağrılıyor...");
			let iftarData = await API.getTodayIftarTime(districtId);

			// Eğer bugünün iftarı geçtiyse, yarının saatini al
			if (this.isIftarPassed(iftarData.time)) {
				console.log("⏭️ Bugünün iftarı geçti, yarının saati alınıyor...");
				iftarData = await API.getTomorrowIftarTime(districtId);
				this.showError("Bugünün iftarı geçti. Yarının iftarına kalan süre gösteriliyor.");
			}

			this.state.iftarTime = iftarData.time;
			this.state.targetDate = iftarData.date; // Tarih bilgisini state'e kaydet

			// Cache durumunu logla
			console.log("✅ İftar saati alındı:", iftarData.time, "(Cache:", iftarData.fromCache ? "Evet" : "Hayır", ")");
			console.log("📊 Hedef tarih:", iftarData.date);
			console.log("📊 Full data:", iftarData.fullData);

			// UI'ı güncelle
			console.log("🎨 UI güncelleniyor...");
			this.updateIftarTimeDisplay(iftarData.time);
			this.updateLocationInfo();

			// Geri sayımı başlat (tarih bilgisi ile)
			const targetDate = iftarData.date;
			console.log("🚀 Countdown başlatılıyor:", iftarData.time, "Hedef tarih:", targetDate);

			// CALLBACK fonksiyonunu tanımla
			const countdownCallback = (countdown) => {
				this.updateCountdownDisplay(countdown);

				if (countdown.needsTomorrowData && !targetDate && !this.state.isLoading && !this.state.tomorrowDataRequested) {
					console.log("📅 İftar geçti, yarının verisi alınıyor");
					this.state.tomorrowDataRequested = true;
					this.loadTomorrowIftarTime();
				}
			};

			// Countdown'u başlat - tarih varsa 3 parametre, yoksa 2
			if (targetDate) {
				console.log("  → Tarih ile başlatılıyor:", targetDate);
				Countdown.start(iftarData.time, targetDate, countdownCallback);
			} else {
				console.log("  → Bugünün tarihi ile başlatılıyor");
				Countdown.start(iftarData.time, countdownCallback);
			}

			console.log("✅ Countdown başlatıldı!");

			this.hideLoading();
		} catch (error) {
			console.error("❌ İftar saati yükleme hatası:", error);
			console.error("Hata detayı:", error.message, error.stack);
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
			console.log("📅 loadTomorrowIftarTime çağrıldı");

			// Önce mevcut countdown'u DURDUR
			Countdown.stop();

			this.showLoading("Yarının iftar saati yükleniyor...");

			const tomorrowData = await API.getTomorrowIftarTime(this.state.location.ilceId);
			console.log("✅ Yarının iftar saati:", tomorrowData.time);

			this.state.iftarTime = tomorrowData.time;
			this.state.tomorrowDataRequested = false; // Reset flag for next day

			this.state.iftarTime = tomorrowData.time;
			this.state.targetDate = tomorrowData.date;

			this.updateIftarTimeDisplay(tomorrowData.time);
			this.showError("Bugünün iftarı geçti. Yarına kalan süre gösteriliyor.");

			// Geri sayımı yeniden başlat (YARIN TARİHİ ile!)
			console.log("🔄 Yarının countdown'u başlatılıyor, tarih:", tomorrowData.date);

			const countdownCallback = (countdown) => {
				this.updateCountdownDisplay(countdown);
			};

			Countdown.stop(); // Önce durdur
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
		console.log("🎯 updateCountdownDisplay:", countdown);

		if (this.elements.hoursDisplay) {
			this.elements.hoursDisplay.textContent = Countdown.formatNumber(countdown.hours);
			console.log("  Saat:", countdown.hours);
		}
		if (this.elements.minutesDisplay) {
			this.elements.minutesDisplay.textContent = Countdown.formatNumber(countdown.minutes);
			console.log("  Dakika:", countdown.minutes);
		}
		if (this.elements.secondsDisplay) {
			this.elements.secondsDisplay.textContent = Countdown.formatNumber(countdown.seconds);
			console.log("  Saniye:", countdown.seconds);
		}

		// Mesaj varsa göster
		if (countdown.message) {
			console.log("📢 Mesaj:", countdown.message);
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
