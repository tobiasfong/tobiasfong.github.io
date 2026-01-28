const LAT = 35.6895;     // Tokyo
const LON = 139.6917;

const tempEl = document.getElementById("temperature");
const descEl = document.getElementById("description");

const weatherCodes = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  61: "Rain",
  71: "Snow",
  80: "Rain showers",
  95: "Thunderstorm"
};

async function loadWeather() {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code`
    );

    if (!res.ok) throw new Error("Network error");

    const data = await res.json();
    const current = data.current;

    tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    descEl.textContent =
      weatherCodes[current.weather_code] || "Unknown conditions";
  } catch (err) {
    tempEl.textContent = "–";
    descEl.textContent = "Unable to load weather data.";
  }
}

loadWeather();
