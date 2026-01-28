const pageLang = document.documentElement.lang || "en";
const isJapanese = pageLang.startsWith("ja");
const citySelect = document.getElementById("citySelect");
const tempEl = document.getElementById("temperature");
const descEl = document.getElementById("description");
const iconEl = document.getElementById("icon");
const cardEl = document.querySelector(".weather-card");

function setLoading(isLoading) {
  if (!cardEl) return;
  cardEl.classList.toggle("is-loading", isLoading);
  cardEl.setAttribute("aria-busy", isLoading ? "true" : "false");
}

const cities = {
  tokyo: {
    lat: 35.6895,
    lon: 139.6917,
    name: { en: "Tokyo", ja: "東京" }
  },
  singapore: {
    lat: 1.3521,
    lon: 103.8198,
    name: { en: "Singapore", ja: "シンガポール" }
  },
  minneapolis: {
    lat: 44.9778,
    lon: -93.2650,
    name: { en: "Minneapolis", ja: "ミニアポリス" }
  }
};

const weatherMap = {
  0: {
    en: "Clear sky",
    ja: "快晴",
    icon: "☀️"
  },
  1: {
    en: "Mainly clear",
    ja: "晴れ",
    icon: "🌤️"
  },
  2: {
    en: "Partly cloudy",
    ja: "くもり時々晴れ",
    icon: "⛅"
  },
  3: {
    en: "Overcast",
    ja: "くもり",
    icon: "☁️"
  },
  45: {
    en: "Fog",
    ja: "霧",
    icon: "🌫️"
  },
  51: {
    en: "Drizzle",
    ja: "霧雨",
    icon: "🌦️"
  },
  61: {
    en: "Rain",
    ja: "雨",
    icon: "🌧️"
  },
  71: {
    en: "Snow",
    ja: "雪",
    icon: "❄️"
  },
  80: {
    en: "Rain showers",
    ja: "にわか雨",
    icon: "🌦️"
  },
  95: {
    en: "Thunderstorm",
    ja: "雷雨",
    icon: "⛈️"
  }
};

async function loadWeather(cityKey) {
  const city = cities[cityKey];

  setLoading(true);

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code`
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    const current = data.current;

    const weather =
      weatherMap[current.weather_code] || {
        en: "Unknown",
        ja: "不明",
        icon: "❓"
      };

    tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    descEl.textContent = isJapanese ? weather.ja : weather.en;
    iconEl.textContent = weather.icon;

    setLoading(false);
  } catch (err) {
    tempEl.textContent = "–";
    descEl.textContent = isJapanese
      ? "天気情報を取得できませんでした"
      : "Unable to load weather.";
    iconEl.textContent = "⚠️";

    setLoading(false);
  }
}

    tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    descEl.textContent = isJapanese ? weather.ja : weather.en;
    iconEl.textContent = weather.icon;
  } catch (err) {
    descEl.textContent = "Unable to load weather.";
    iconEl.textContent = "⚠️";
  }
}

citySelect.addEventListener("change", () => {
  loadWeather(citySelect.value);
});

// Load default city
loadWeather(citySelect.value);
cityTitle.textContent = isJapanese
  ? city.name.ja
  : city.name.en;
