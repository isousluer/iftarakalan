/**
 * Geri sayım mantığı ve zaman hesaplamaları
 */

const Countdown = {
	intervalId: null,
	currentIftarTime: null,
	isIftarPassed: false,

	/**
	 * Geri sayımı başlat
	 * @param {string} iftarTime - İftar saati (HH:MM formatında)
	 * @param {Function} callback - Her saniye çağrılacak callback
	 */
	start(iftarTime, callback) {
		// Önceki interval'i temizle
		this.stop();

		this.currentIftarTime = iftarTime;

		// İlk hesaplamayı hemen yap
		const countdown = this.calculate(iftarTime);
		callback(countdown);

		// Her saniye güncelle
		this.intervalId = setInterval(() => {
			const countdown = this.calculate(iftarTime);
			callback(countdown);
		}, 1000);
	},

	/**
	 * Geri sayımı durdur
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	},

	/**
	 * Geri sayımı hesapla
	 * @param {string} iftarTime - İftar saati (HH:MM formatında)
	 * @returns {Object} Geri sayım {hours, minutes, seconds, isExpired, message}
	 */
	calculate(iftarTime) {
		try {
			const now = new Date();

			// Bugünün tarihini al
			const today = new Date(now);
			const [hours, minutes] = iftarTime.split(":").map(Number);

			// İftar zamanını bugüne set et
			const iftarDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);

			// Zaman farkını hesapla
			let diff = iftarDate - now;

			// Eğer iftar vakti geçtiyse
			if (diff <= 0) {
				this.isIftarPassed = true;
				return {
					hours: 0,
					minutes: 0,
					seconds: 0,
					isExpired: true,
					message: "İftar vakti geçti. Yarının iftar saati yükleniyor...",
					needsTomorrowData: true,
				};
			}

			this.isIftarPassed = false;

			// Saat, dakika, saniye hesapla
			const totalSeconds = Math.floor(diff / 1000);
			const hoursLeft = Math.floor(totalSeconds / 3600);
			const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
			const secondsLeft = totalSeconds % 60;

			return {
				hours: hoursLeft,
				minutes: minutesLeft,
				seconds: secondsLeft,
				isExpired: false,
				message: null,
				needsTomorrowData: false,
			};
		} catch (error) {
			console.error("Countdown calculate error:", error);
			return {
				hours: 0,
				minutes: 0,
				seconds: 0,
				isExpired: true,
				message: "Hesaplama hatası",
				error: true,
			};
		}
	},

	/**
	 * Sayıyı formatla (2 haneli: 05, 23, 42)
	 * @param {number} num - Sayı
	 * @returns {string} Formatlanmış sayı
	 */
	formatNumber(num) {
		return num.toString().padStart(2, "0");
	},

	/**
	 * Zamanı formatla (HH:MM:SS)
	 * @param {number} hours - Saat
	 * @param {number} minutes - Dakika
	 * @param {number} seconds - Saniye
	 * @returns {string} Formatlanmış zaman
	 */
	formatTime(hours, minutes, seconds) {
		return `${this.formatNumber(hours)}:${this.formatNumber(minutes)}:${this.formatNumber(seconds)}`;
	},

	/**
	 * İftar vaktine ne kadar kaldığını metin olarak döndür
	 * @param {number} hours - Saat
	 * @param {number} minutes - Dakika
	 * @param {number} seconds - Saniye
	 * @returns {string} Metin açıklama
	 */
	getTimeDescription(hours, minutes, seconds) {
		if (hours > 0) {
			return `${hours} saat ${minutes} dakika`;
		} else if (minutes > 0) {
			return `${minutes} dakika ${seconds} saniye`;
		} else {
			return `${seconds} saniye`;
		}
	},

	/**
	 * İftar vaktine çok yakın mı kontrol et (son 5 dakika)
	 * @param {number} hours - Saat
	 * @param {number} minutes - Dakika
	 * @returns {boolean} Yakınlık durumu
	 */
	isNearIftar(hours, minutes) {
		return hours === 0 && minutes < 5;
	},

	/**
	 * Mevcut durumu al
	 * @returns {Object} Durum bilgisi
	 */
	getStatus() {
		return {
			isRunning: this.intervalId !== null,
			currentIftarTime: this.currentIftarTime,
			isIftarPassed: this.isIftarPassed,
		};
	},

	/**
	 * Bugünün tarihini formatla
	 * @returns {string} Formatlanmış tarih
	 */
	getTodayFormatted() {
		const today = new Date();
		const options = {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "long",
		};
		return today.toLocaleDateString("tr-TR", options);
	},

	/**
	 * İftar saatini formatla (görüntüleme için)
	 * @param {string} time - Saat (HH:MM)
	 * @returns {string} Formatlanmış saat
	 */
	formatIftarTime(time) {
		return time; // Zaten HH:MM formatında
	},
};

// Global scope'a ekle
window.Countdown = Countdown;
