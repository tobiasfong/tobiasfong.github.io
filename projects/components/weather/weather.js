const pageLang = document.documentElement.lang || "en";
const isJapanese = pageLang.startsWith("ja");
const citySelect = document.getElementById("citySelect");
const tempEl = document.getElementById("temperature");
const descEl = document.getElementById("description");
const iconEl = document.getElementById("icon");

const cities = {
  tokyo: { lat: 35.6895, lon: 139.6917, name: "Tokyo" },
  singapore: { lat: 1.3521, lon: 103.8198, name: "Singapore" },
  minneapolis: { lat: 44.9778, lon: -93.2650, name: "Minneapolis" }
};

const weatherMap = {
  0: { text: "Clear sky", icon: "☀️" },
  1: { text: "Mainly clear", icon: "🌤️" },
  2: { text: "Partly cloudy", icon: "⛅" },
  3: { text: "Overcast", icon: "☁️" },
  45: { text: "Fog", icon: "🌫️" },
  48: { text: "Rime fog", icon: "🌫️" },
  51: { text: "Drizzle", icon: "🌦️" },
  61: { text: "Rain", icon: "🌧️" },
  71: { text: "Snow", icon: "❄️" },
  80: { text: "Rain showers", icon: "🌦️" },
  95: { text: "Thunderstorm", icon: "⛈️" }
};

async function loadWeather(cityKey) {
  const city = cities[cityKey];

  descEl.textContent = "Loading…";
  tempEl.textContent = "–";
  iconEl.textContent = "⏳";

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code`
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    const current = data.current;

    const weather =
      weatherMap[current.weather_code] || {
        text: "Unknown",
        icon: "❓"
      };

    tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    descEl.textContent = weather.text;
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
