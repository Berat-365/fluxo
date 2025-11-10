// weather.js - Hava durumu widget'ı
async function getLocationByIP() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("Konum alınamadı");
    const data = await res.json();
    return { city: data.city || "Istanbul", lat: data.latitude, lon: data.longitude };
  } catch {
    return { city: "Istanbul", lat: 41.0082, lon: 28.9784 };
  }
}

// 🔹 Koordinatları şehirden al (Nominatim API)
async function getCoordsByCity(city) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

// 🔹 Dil bazlı hava durumu metni (OpenMeteo için)
function getConditionText(code, lang = "tr") {
  const maps = {
    tr: { 0: "Açık", 1: "Parçalı bulutlu", 2: "Bulutlu", 3: "Kapalı", 45: "Sis", 48: "Sis", 51: "Çiseleme", 53: "Yağmur", 55: "Şiddetli yağmur", 61: "Hafif yağmur", 63: "Yağmur", 65: "Şiddetli yağmur", 71: "Hafif kar", 73: "Kar", 75: "Şiddetli kar", 80: "Sağnak yağmur", 81: "Hafif sağnak yağmur", 82: "Şiddetli sağnak yağmur", 95: "Fırtına", 96: "Yıldırımlı fırtına", 99: "Şiddetli fırtına" },
    az: { 0: "Açıq", 1: "Qismən buludlu", 2: "Buludlu", 3: "Buludlu", 45: "Duman", 48: "Duman", 51: "Çilək", 53: "Yağış", 55: "Güclü yağış", 61: "Zəif yağış", 63: "Yağış", 65: "Güclü yağış", 71: "Zəif qar", 73: "Qar", 75: "Güclü qar", 80: "Dəbədə yağış", 81: "Zəif dəbədə yağış", 82: "Güclü dəbədə yağış", 95: "Fırtına", 96: "Yıldırımlı fırtına", 99: "Güclü fırtına" },
    tk: { 0: "Açyk", 1: "Bölünip bulutly", 2: "Bulutly", 3: "Bulutly", 45: "Duman", 48: "Duman", 51: "Çilek", 53: "Ýagyş", 55: "Güýçli ýagyş", 61: "Hafif ýagyş", 63: "Ýagyş", 65: "Güýçli ýagyş", 71: "Hafif gar", 73: "Gar", 75: "Güýçli gar", 80: "Saçma ýagyş", 81: "Hafif saçma ýagyş", 82: "Güýçli saçma ýagyş", 95: "Furtına", 96: "Ýyldyrymlı furtına", 99: "Güýçli furtına" },
    kk: { 0: "Ашық", 1: "Бөліп бұлтты", 2: "Бұлтты", 3: "Бұлтты", 45: "Тұман", 48: "Тұман", 51: "Шашыраңқы жаңбыр", 53: "Жаңбыр", 55: "Күшті жаңбыр", 61: "Жеңіл жаңбыр", 63: "Жаңбыр", 65: "Күшті жаңбыр", 71: "Жеңіл қар", 73: "Қар", 75: "Күшті қар", 80: "Шағын жаңбыр", 81: "Жеңіл шағын жаңбыр", 82: "Күшті шағын жаңбыр", 95: "Дауыл", 96: "Мамырмен дауыл", 99: "Күшті дауыл" },
    ky: { 0: "Ачык", 1: "Бөлүнүп булуттуу", 2: "Булуттуу", 3: "Булуттуу", 45: "Туман", 48: "Туман", 51: "Чийки", 53: "Жамгыр", 55: "Күчтүү жамгыр", 61: "Айыл жамгыр", 63: "Жамгыр", 65: "Күчтүү жамгыр", 71: "Айыл кар", 73: "Кар", 75: "Күчтүү кар", 80: "Жамгыр", 81: "Айыл жамгыр", 82: "Күчтүү жамгыр", 95: "Бороон", 96: "Чагылдырылган бороон", 99: "Күчтүү бороон" },
    uz: { 0: "Ochiq", 1: "Qisman bulutli", 2: "Bulutli", 3: "Bulutli", 45: "Tuman", 48: "Tuman", 51: "Chillak", 53: "Yomg'ir", 55: "Kuchli yomg'ir", 61: "Yengil yomg'ir", 63: "Yomg'ir", 65: "Kuchli yomg'ir", 71: "Yengil qor", 73: "Qor", 75: "Kuchli qor", 80: "Shovqinli yomg'ir", 81: "Yengil shovqinli yomg'ir", 82: "Kuchli shovqinli yomg'ir", 95: "Bo'ron", 96: "Momukli bo'ron", 99: "Kuchli bo'ron" },
    tt: { 0: "Асылу", 1: "Бүлектән бөткөн", 2: "Бөткөн", 3: "Бөткөн", 45: "Туман", 48: "Туман", 51: "Чиләк", 53: "Яңын", 55: "Күчле яңын", 61: "Әйлән яңын", 63: "Яңын", 65: "Күчле яңын", 71: "Әйлән кар", 73: "Кар", 75: "Күчле кар", 80: "Шашма яңын", 81: "Әйлән шашма яңын", 82: "Күчле шашма яңын", 95: "Фүртлә", 96: "Ялтсыз фүртлә", 99: "Күчле фүртлә" },
    ba: { 0: "Асылу", 1: "Бүлектән бөткөн", 2: "Бөткөн", 3: "Бөткөн", 45: "Туман", 48: "Туман", 51: "Чиләк", 53: "Яңын", 55: "Күчле яңын", 61: "Әйлән яңын", 63: "Яңын", 65: "Күчле яңын", 71: "Әйлән кар", 73: "Кар", 75: "Күчле кар", 80: "Шашма яңын", 81: "Әйлән шашма яңын", 82: "Күчле шашма яңын", 95: "Фүртлә", 96: "Ялтсыз фүртлә", 99: "Күчле фүртлә" },
    ug: { 0: "ئېچىق", 1: "ئاياللىق بۇلۇتلۇق", 2: "بۇلۇتلۇق", 3: "بۇلۇتلۇق", 45: "ئۈلكە", 48: "ئۈلكە", 51: "ئاز ئۆسلەتكەن يامغۇر", 53: "يامغۇر", 55: "كۈچلۈك يامغۇر", 61: "ئاز يامغۇر", 63: "يامغۇر", 65: "كۈچلۈك يامغۇر", 71: "ئاز قار", 73: "قار", 75: "كۈچلۈك قار", 80: "ئۆسلەتكەن يامغۇر", 81: "ئاز ئۆسلەتكەن يامغۇر", 82: "كۈچلۈك ئۆسلەتكەن يامغۇر", 95: "ئۈرۈل", 96: "قاچىلما ئۈرۈل", 99: "كۈچلۈك ئۈرۈل" },
    sah: { 0: "Ачык", 1: "Бөлүнүп булуттуу", 2: "Булуттуу", 3: "Булуттуу", 45: "Туман", 48: "Туман", 51: "Чийки", 53: "Жамгыр", 55: "Күчтүү жамгыр", 61: "Айыл жамгыр", 63: "Жамгыр", 65: "Күчтүү жамгыр", 71: "Айыл кар", 73: "Кар", 75: "Күчтүү кар", 80: "Жамгыр", 81: "Айыл жамгыр", 82: "Күчтүү жамгыр", 95: "Бороон", 96: "Чагылдырылган бороон", 99: "Күчтүү бороон" },
    cv: { 0: "Аçыk", 1: "Пӑр-ҫӑк", 2: "Ҫӑк", 3: "Ҫӑк", 45: "Туман", 48: "Туман", 51: "Чилӗк", 53: "Яҫ", 55: "Кӑлӑш яҫ", 61: "Ҫӑк яҫ", 63: "Яҫ", 65: "Кӑлӑш яҫ", 71: "Ҫӑк кар", 73: "Кар", 75: "Кӑлӑш кар", 80: "Шашма яҫ", 81: "Ҫӑк шашма яҫ", 82: "Кӑлӑш шашма яҫ", 95: "Фӗр", 96: "Ялтсыз фӗр", 99: "Кӑлӑш фӗр" },
    en: { 0: "Clear", 1: "Partly cloudy", 2: "Cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Rain", 55: "Heavy rain", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Showers", 81: "Light showers", 82: "Heavy showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm" },
    es: { 0: "Despejado", 1: "Parcialmente nublado", 2: "Nublado", 3: "Cubierta", 45: "Niebla", 48: "Niebla", 51: "Llovizna", 53: "Lluvia", 55: "Lluvia fuerte", 61: "Lluvia ligera", 63: "Lluvia", 65: "Lluvia fuerte", 71: "Nieve ligera", 73: "Nieve", 75: "Nieve fuerte", 80: "Chubascos", 81: "Chubascos ligeros", 82: "Chubascos fuertes", 95: "Tormenta", 96: "Tormenta con granizo", 99: "Tormenta severa" },
    ja: { 0: "晴れ", 1: "部分的に曇り", 2: "曇り", 3: "どんより", 45: "霧", 48: "霧", 51: "霧雨", 53: "雨", 55: "強い雨", 61: "小雨", 63: "雨", 65: "強い雨", 71: "小雪", 73: "雪", 75: "強い雪", 80: "にわか雨", 81: "小にわか雨", 82: "強いにわか雨", 95: "雷雨", 96: "雹の雷雨", 99: "激しい雷雨" },
    zh: { 0: "晴朗", 1: "部分多云", 2: "多云", 3: "阴天", 45: "雾", 48: "雾", 51: "毛毛雨", 53: "雨", 55: "大雨", 61: "小雨", 63: "雨", 65: "大雨", 71: "小雪", 73: "雪", 75: "大雪", 80: "阵雨", 81: "小阵雨", 82: "大阵雨", 95: "雷暴", 96: "冰雹雷暴", 99: "严重雷暴" },
    ko: { 0: "맑음", 1: "부분적으로 흐림", 2: "흐림", 3: "구름 많음", 45: "안개", 48: "안개", 51: "이슬비", 53: "비", 55: "강한 비", 61: "약한 비", 63: "비", 65: "강한 비", 71: "약한 눈", 73: "눈", 75: "강한 눈", 80: "소나기", 81: "약한 소나기", 82: "강한 소나기", 95: "뇌우", 96: "우박 뇌우", 99: "심한 뇌우" },
    de: { 0: "Klar", 1: "Teilweise bewölkt", 2: "Bewölkt", 3: "Bedeckt", 45: "Nebel", 48: "Nebel", 51: "Nieselregen", 53: "Regen", 55: "Starker Regen", 61: "Leichter Regen", 63: "Regen", 65: "Starker Regen", 71: "Leichter Schnee", 73: "Schnee", 75: "Starker Schnee", 80: "Schauer", 81: "Leichte Schauer", 82: "Starke Schauer", 95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Schweres Gewitter" },
    fr: { 0: "Soleil", 1: "Partiellement nuageux", 2: "Nuageux", 3: "Couvert", 45: "Brouillard", 48: "Brouillard", 51: "Bruine", 53: "Pluie", 55: "Pluie forte", 61: "Pluie légère", 63: "Pluie", 65: "Pluie forte", 71: "Neige légère", 73: "Neige", 75: "Neige forte", 80: "Averses", 81: "Averses légères", 82: "Averses fortes", 95: "Orage", 96: "Orage de grêle", 99: "Orage violent" },
    ar: { 0: "صافي", 1: "غائم جزئيًا", 2: "غائم", 3: "مغطى", 45: "ضباب", 48: "ضباب", 51: "رذاذ", 53: "مطر", 55: "مطر غزير", 61: "مطر خفيف", 63: "مطر", 65: "مطر غزير", 71: "ثلج خفيف", 73: "ثلج", 75: "ثلج غزير", 80: "زخات", 81: "زخات خفيف", 82: "زخات غزير", 95: "عاصفة رعدية", 96: "عاصفة رعدية بحلق", 99: "عاصفة رعدية شديدة" },
    ru: { 0: "Ясно", 1: "Переменная облачность", 2: "Облачно", 3: "Пасмурно", 45: "Туман", 48: "Туман", 51: "Морось", 53: "Дождь", 55: "Сильный дождь", 61: "Слабый дождь", 63: "Дождь", 65: "Сильный дождь", 71: "Слабый снег", 73: "Снег", 75: "Сильный снег", 80: "Ливень", 81: "Слабый ливень", 82: "Сильный ливень", 95: "Гроза", 96: "Гроза с градом", 99: "Сильная гроза" },
    mn: { 0: "Цэлмэг", 1: "Хагас үүлтэй", 2: "Үүлтэй", 3: "Үүлтэй", 45: "Манан", 48: "Манан", 51: "Чийглэг бороо", 53: "Бороо", 55: "Хүчтэй бороо", 61: "Сул бороо", 63: "Бороо", 65: "Хүчтэй бороо", 71: "Сул цас", 73: "Цас", 75: "Хүчтэй цас", 80: "Борооны шуурга", 81: "Сул борооны шуурга", 82: "Хүчтэй борооны шуурга", 95: "Шуурга", 96: "Элэгдэлтэй шуурга", 99: "Хүчтэй шуурга" },
    he: { 0: "בהיר", 1: "חלקית מעונן", 2: "מעונן", 3: "עננים כבדים", 45: "ערפל", 48: "ערפל", 51: "גשם קל", 53: "גשם", 55: "גשם כבד", 61: "גשם קל", 63: "גשם", 65: "גשם כבד", 71: "שלג קל", 73: "שלג", 75: "שלג כבד", 80: "ממטרים", 81: "ממטרים קלים", 82: "ממטרים כבדים", 95: "סופה", 96: "סופה עם ברד", 99: "סופה חזקה" },
    hi: { 0: "साफ़", 1: "आंशिक बादल", 2: "बादल", 3: "बादल", 45: "कोहरा", 48: "कोहरा", 51: "हल्की बारिश", 53: "बारिश", 55: "भारी बारिश", 61: "हल्की बारिश", 63: "बारिश", 65: "भारी बारिश", 71: "हल्का बर्फ", 73: "बर्फ", 75: "भारी बर्फ", 80: "बरसात", 81: "हल्की बरसात", 82: "भारी बरसात", 95: "तूफान", 96: "ओले के साथ तूफान", 99: "भारी तूफान" },
    el: { 0: "Καθαρός", 1: "Μερικώς συννεφιασμένος", 2: "Συννεφιασμένος", 3: "Συννεφιά", 45: "Ομίχλη", 48: "Ομίχλη", 51: "Ψιλόβροχο", 53: "Βροχή", 55: "Ισχυρή βροχή", 61: "Ασθενής βροχή", 63: "Βροχή", 65: "Ισχυρή βροχή", 71: "Ασθενής χιόνι", 73: "Χιόνι", 75: "Ισχυρό χιόνι", 80: "Πρόσκαιρες βροχές", 81: "Ασθενείς βροχές", 82: "Ισχυρές βροχές", 95: "Καταιγίδα", 96: "Καταιγίδα με χαλάζι", 99: "Έντονη καταιγίδα" },
    it: { 0: "Sereno", 1: "Parzialmente nuvoloso", 2: "Nuvoloso", 3: "Coperto", 45: "Nebbia", 48: "Nebbia", 51: "Pioggerella", 53: "Pioggia", 55: "Pioggia forte", 61: "Pioggia leggera", 63: "Pioggia", 65: "Pioggia forte", 71: "Neve leggera", 73: "Neve", 75: "Neve forte", 80: "Rovesci", 81: "Rovesci leggeri", 82: "Rovesci forti", 95: "Tempesta", 96: "Tempesta con grandine", 99: "Tempesta forte" },
    gag: { 0: "Açık", 1: "Parçalı bulutlu", 2: "Bulutlu", 3: "Kapalı", 45: "Sis", 48: "Sis", 51: "Çiseleme", 53: "Yağmur", 55: "Şiddetli yağmur", 61: "Hafif yağmur", 63: "Yağmur", 65: "Şiddetli yağmur", 71: "Hafif kar", 73: "Kar", 75: "Şiddetli kar", 80: "Saçma yağmur", 81: "Hafif saçma yağmur", 82: "Şiddetli saçma yağmur", 95: "Fırtına", 96: "Yıldırımlı fırtına", 99: "Şiddetli fırtına" },
    pt: { 0: "Despejado", 1: "Parcialmente nublado", 2: "Nublado", 3: "Encoberto", 45: "Nevoeiro", 48: "Nevoeiro", 51: "Chuvisco", 53: "Chuva", 55: "Chuva forte", 61: "Chuva leve", 63: "Chuva", 65: "Chuva forte", 71: "Neve leve", 73: "Neve", 75: "Neve forte", 80: "Aguaceiro", 81: "Aguaceiro leve", 82: "Aguaceiro forte", 95: "Tempestade", 96: "Trovoada", 99: "Tempestade severa" }
  };
  return maps[lang]?.[code] || "Bilinmeyen";
}

// OpenMeteo weather code to emoji mapping
function getWeatherEmojiFromCode(code) {
  const emojiMap = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 55: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "🌨️", 73: "🌨️", 75: "🌨️",
    80: "🌦️", 81: "🌦️", 82: "🌧️", 95: "⛈️", 96: "⛈️", 99: "⛈️"
  };
  return emojiMap[code] || "🌡️";
}

export async function fetchWeather() {
  const lang = localStorage.getItem("language") || "tr";
  let location = localStorage.getItem("weatherLocation") || "Istanbul";
  const widget = document.getElementById("weatherWidget");
  if (!widget || localStorage.getItem("showWeather") === "false") return;

  widget.innerHTML = `<span class="weather-loading">☁️ ... </span>`;

  try {
    if (!localStorage.getItem("weatherLocation")) {
      const locData = await getLocationByIP();
      location = locData.city;
      localStorage.setItem("weatherLocation", location);
    }

    const coords = await getCoordsByCity(location) || await getLocationByIP();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=temperature_2m&timezone=Europe/Istanbul`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Hata: ${response.status}`);

    const data = await response.json();
    if (!data.current_weather) throw new Error("OpenMeteo veri hatası");

    const temp = Math.round(data.current_weather.temperature);
    const condition = getConditionText(data.current_weather.weathercode, lang);
    const emoji = getWeatherEmojiFromCode(data.current_weather.weathercode);

    widget.innerHTML = `<div class="weather-info"><span>${location}: ${temp}°C | ${emoji} ${condition}</span></div>`;
  } catch (error) {
    console.error("Hava durumu hatası:", error.message);
    widget.innerHTML = `<span class="weather-error">Alınamadı: ${error.message} 🚫</span>`;
  }
}

let weatherTimer;
export function startWeatherUpdate() {
  if (weatherTimer) clearInterval(weatherTimer);
  let intervalStr = localStorage.getItem("weatherUpdateInterval") || "0";
  let interval = parseInt(intervalStr, 10) || 0;
  fetchWeather();
  if (interval > 0) {
    weatherTimer = setInterval(fetchWeather, interval * 60 * 1000);
  }
}

// Storage değişikliği dinle (aynı sekmede ayar değişikliklerini yakala)
window.addEventListener('storage', (e) => {
  if (e.key === 'weatherLocation' || e.key === 'weatherUpdateInterval' || e.key === 'showWeather') {
    fetchWeather();
    startWeatherUpdate();
  }
});

// Ayar değişikliklerini yakalamak için custom event dinle (settings.js'den dispatch et)
window.addEventListener('settingsChanged', () => {
  fetchWeather();
  startWeatherUpdate();
});

document.addEventListener("DOMContentLoaded", () => {
  startWeatherUpdate();
});

// JS'te fetch5DayForecast fonksiyonunu güncelle ve openWeatherWidget'i değiştir
async function fetch5DayForecast() {
    const lang = localStorage.getItem("language") || "tr";
    const location = localStorage.getItem("weatherLocation") || "Istanbul";
    const listEl = document.getElementById("forecastList");
    const popupLoc = document.getElementById("popupLocation");
    if (!listEl) return;

    listEl.innerHTML = '<div class="forecast-day"><span class="weather-loading">☁️ ... </span></div>';

    // 5 günlük tahmin başlığı için çeviriler
    const forecastTitles = {
      tr: "5 günlük tahmin",
      az: "5 günlük proqnoz",
      tk: "5 günlük çaklama",
      kk: "5 күндік болжам",
      ky: "5 күндүк болжолдоо",
      uz: "5 kunlik prognoz",
      tt: "5 көнлек фараз",
      ba: "5 көнлек фараз",
      ug: "5 كۈنلۈك پىروگنوظ",
      sah: "5 күөннүүлээх оңоһук",
      cv: "5 пӗлӗк яҫӑрӑш",
      en: "5-day forecast",
      es: "Pronóstico a 5 días",
      ja: "5日間の予報",
      zh: "5 天预报",
      ko: "5일 예보",
      de: "5-Tage-Wettervorhersage",
      fr: "Prévisions à 5 jours",
      ar: "توقعات الطقس لمدة 5 أيام",
      ru: "Прогноз на 5 дней",
      mn: "5 өдрийн төлөв",
      he: "תחזית ל-5 ימים",
      hi: "5 दिन का पूर्वानुमान",
      el: "Πρόγνωση 5 ημερών",
      it: "Previsioni a 5 giorni",
      gag: "5 günlük tahmin",
      pt: "Previsão a 5 dias"
    };
    const title = forecastTitles[lang] || "5 günlük tahmin";
    popupLoc.innerHTML = `${location} - <span data-lang-key="5day_forecast">${title}</span>`;

    try {
        const coords = await getCoordsByCity(location) || await getLocationByIP();

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=Europe/Istanbul&forecast_days=6`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Tahmin alınamadı");

        const data = await response.json();
        const daily = data.daily;
        const dayNames = {
          tr: ["Paz", "Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt"],
          az: ["Bz", "BE", "ÇA", "ÇŞ", "CA", "CÜ", "ŞN"],
          tk: ["Yok", "Duş", "Siş", "Çar", "Pen", "Ann", "Şen"],
          kk: ["Жек", "Дүй", "Сей", "Сәр", "Бей", "Жұм", "Сен"],
          ky: ["Жек", "Дүй", "Шей", "Шар", "Бей", "Жум", "Иш"],
          uz: ["Yak", "Dush", "Sesh", "Chor", "Pays", "Jum", "Shan"],
          tt: ["Kün", "Düş", "Siş", "Çär", "Pen", "Cum", "Cöm"],
          ba: ["Kün", "Düş", "Siş", "Çör", "Pen", "Cum", "Çöm"],
          ug: ["يەك", "دۈ", "سەي", "چار", "پەي", "جۈ", "شەن"],
          sah: ["Бэ", "Бэ", "Оп", "Сэ", "Бэ", "Су", "Бэ"],
          cv: ["Puş", "Puş", "Ar", "Yup", "Pir", "Pyat", "Şăt"],
          en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
          ja: ["日", "月", "火", "水", "木", "金", "土"],
          zh: ["日", "一", "二", "三", "四", "五", "六"],
          ko: ["일", "월", "화", "수", "목", "금", "토"],
          de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
          fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
          ar: ["أحد", "اثن", "ثلاث", "أرب", "خميس", "جمعة", "سبت"],
          ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
          mn: ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бяа"],
          he: ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"],
          hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
          el: ["Κυρ", "Δευ", "Τρι", "Τετ", "Πέμ", "Παρ", "Σάβ"],
          it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
          gag: ["Paz", "Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt"]
        };
        const days = dayNames[lang] || ["Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt", "Paz"];
        let html = "";

        for (let i = 1; i <= 5; i++) {
            const date = new Date(daily.time[i]);
            const dayName = days[date.getDay()];
            const dayStr = `${dayName} ${date.getDate()}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const minTemp = Math.round(daily.temperature_2m_min[i]);
            const precip = daily.precipitation_probability_max[i];
            const code = daily.weathercode[i];
            const emoji = getWeatherEmojiFromCode(code);
            const cond = getConditionText(code, lang);

            html += `
                <div class="forecast-day">
                    <span class="forecast-icon">${emoji}</span>
                    <div class="forecast-details">
                        <span>${dayStr}</span>
                        <span>${minTemp}° / ${maxTemp}°</span>
                        <span>${precip}% ${cond}</span>
                    </div>
                </div>
            `;
        }

        listEl.innerHTML = html;
    } catch (error) {
        console.error("Tahmin hatası:", error);
        listEl.innerHTML = `<div class="forecast-day"><span class="weather-error">${error.message} 🚫</span></div>`;
    }
}

// Weather widget onclick'i güncelle (HTML'de onclick="openWeatherWidget()" var, JS'te tanımla)
window.openWeatherWidget = function() {
    const popup = document.getElementById("weatherPopup");
    const widget = document.getElementById("weatherWidget");
    if (popup.style.display === "block") {
        closeWeatherPopup();
    } else {
        const rect = widget.getBoundingClientRect();
        popup.style.top = `${rect.height + 5}px`;
        popup.style.left = '0';
        popup.style.display = "block";
        fetch5DayForecast();
    }
};

window.closeWeatherPopup = function() {
    document.getElementById("weatherPopup").style.display = "none";
};

// Dışarı tıklamada kapat
document.addEventListener("click", (e) => {
    const popup = document.getElementById("weatherPopup");
    const widget = document.getElementById("weatherWidget");
    if (popup.style.display === "block" && !widget.contains(e.target) && !popup.contains(e.target)) {
        closeWeatherPopup();
    }
});
