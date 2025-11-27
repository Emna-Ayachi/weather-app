const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const cityInsert = document.getElementById("city");
const temperatureInsert = document.getElementById("temperature");
const exactDate =document.getElementById("exactDate");
const windInsert=document.getElementById("wind");
const feelslikeInsert=document.getElementById("feelslike");
const humidityInsert = document.getElementById("humidity");
const precipitationInsert=document.getElementById("precipitation");
const dateday=document.getElementById("dateday");
let weatherData = null;

searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) {
    searchCity(city);
  }
});
const now = new Date();
const year = now.getUTCFullYear();
const month = String(now.getUTCMonth() + 1).padStart(2, '0');
const weekday = now.toLocaleString('en-US', { weekday: 'long' }); 
const monthName = now.toLocaleString('en-US', { month: 'long' });
const day = String(now.getUTCDate()).padStart(2, '0');
const hour = String(now.getUTCHours()).padStart(2, '0');
const targetTime = `${year}-${month}-${day}T${hour}:00`;
async function searchCity(city) {
  showLoading();
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(res)
    console.log(data)
    if (!data.results || data.results.length === 0) {
      alert("City not found. Try again.");
      return;
    }
    const location = data.results[0];
    console.log("Location found:", location);
    cityInsert.textContent = `${location.name}, ${location.country}`;
    exactDate.textContent = `${weekday}, ${monthName} ${day}, ${year}`
    dateday.textContent= weekday;
    getWeather(location.latitude, location.longitude, location.name);
    loadForecast(location.latitude, location.longitude, location.name)

  } catch (err) {
    console.error(err);
    alert("Error fetching location.");
  } finally {
    hideLoading();
  }
}


async function getWeather(lat,long,loc) {
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&location=${loc}&current_weather=true&hourly=apparent_temperature,relativehumidity_2m,precipitation,weathercode`
    const res = await fetch(url);
    const data = await res.json();
    console.log(res)
    console.log("data we need",data)
    temperatureInsert.textContent= data.current_weather.temperature;
    windInsert.textContent=`${data.current_weather.windspeed} ${data.current_weather_units.windspeed}` 
    
    const index = data.hourly.time.indexOf(targetTime);
    const feelsLike = data.hourly.apparent_temperature[index];
    const humidity = data.hourly.relativehumidity_2m[index];
    const precipitation = data.hourly.precipitation[index];
    feelslikeInsert.textContent=`${feelsLike}°`;
    humidityInsert.textContent=`${humidity}${data.hourly_units.relativehumidity_2m}`;
    precipitationInsert.textContent=`${precipitation} ${data.hourly_units.precipitation}`
    weatherData = data;
    renderHourlyForcast(weatherData);
    return data;
  }
  catch (err) {
    console.error(err);
    alert("Error fetching data.");
  }

}



async function loadForecast(lat, long, loc) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  renderForecast(data); 
}
const weatherCodeMap = {
  0: { label: "Sunny", icon: "icon-sunny.webp" },
  1: { label: "Sunny", icon: "icon-sunny.webp" },
  2: { label: "Partly cloudy", icon: "icon-partly-cloudy.webp" },
  3: { label: "Overcast", icon: "icon-overcast.webp" },
  45: { label: "Foggy", icon: "icon-fog.webp" },
  51: { label: "Drizzle", icon: "icon-drizzle.webp" },
  61: { label: "Rainy", icon: "icon-rain.webp" },
  71: { label: "Snow", icon: "icon-snow.webp" },
  95: { label: "Thunderstorms", icon: "icon-storm.webp" },
};


function renderForecast(data) {
  const container = document.getElementById("dailyForecastRow");
  container.innerHTML = "";

  const days = data.daily.time;
  const maxTemps = data.daily.temperature_2m_max;
  const minTemps = data.daily.temperature_2m_min;
  const codes = data.daily.weathercode;
  console.log("Weather codes:", codes);

  for (let i = 0; i < days.length; i++) {
    const date = new Date(days[i]);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const shortDay = dayName.substring(0, 3); 
    const weather = weatherCodeMap[codes[i]] || { label: "Unknown", icon: "icon-overcast.webp" };
    const iconPath = `./assets/images/${weather.icon}`;
    const card = document.createElement("div");
    card.className = "col text-center text-white p-2";
    card.style.backgroundColor = "#1e2a38";
    card.style.borderRadius = "10px";
    console.log(iconPath)
    card.innerHTML = `
      <div class="fw-bold forecast-card col-md-1">${shortDay}</div>
      <img src="${iconPath}" alt="${weather.label}" style="width: 50px; height: 50px;" />
      <div>${weather.label}</div>
      <div>${convertTemperature(maxTemps[i])} / ${convertTemperature(minTemps[i])}</div>
    `;
    container.appendChild(card);
  }
}
//GO BACK TO IT 
function renderHourlyForcast(data) {
  const times = data.hourly.time;
  const temps = data.hourly.apparent_temperature;
  const weatherCodes = data.hourly.weathercode;
  console.log(weatherCodes)
  const selectedDayName = document.getElementById("dateday").textContent.trim();
  console.log("Selected day:", selectedDayName);

  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayIndex = today.getDay();
  const selectedIndex = dayNames.indexOf(selectedDayName);
  if (selectedIndex === -1) {
    console.error("Invalid day selected:", selectedDayName);
    return;
  }
  const offset = (selectedIndex - todayIndex + 7) % 7;
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + offset);

  const targetDateStr = selectedDate.toISOString().split("T")[0];
  console.log("Target date:", targetDateStr);

  const hourlyList = document.querySelector(".hourly-list");
  hourlyList.innerHTML = "";

  for (let i = 0; i < times.length; i++) {
    const timestamp = times[i];
    if (timestamp.startsWith(targetDateStr)) {
      const hour = new Date(timestamp).getHours();
      const temp = temps[i];
      const code = weatherCodes[i];

      const icon = weatherCodeMap[code]?.icon || "icon-unknown.webp";

      const item = document.createElement("div");
      item.className = "hourly-card";
      item.innerHTML = `
        <div class="hourly-icon">
          <img src="./assets/images/${icon}" alt="" />
        </div>
        <div class="hourly-time">
          ${formatHour(hour)}
        </div>
        <div class="hourly-temp">
          ${convertTemperature(temp)}
        </div>
      `;
      hourlyList.appendChild(item);
    }
  }
  if (hourlyList.innerHTML.trim() === "") {
    hourlyList.innerHTML = "<div class='text-muted'>No hourly data available for this day.</div>";
  }
}

function formatHour(h) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12} ${suffix}`;
}

const dayDropdown = document.querySelector("#dayDropdown");
const dropdownItems = dayDropdown.querySelectorAll(".dropdown-item");
dropdownItems.forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    const selectedDay = e.target.textContent;
    document.getElementById("dateday").textContent = selectedDay;
    renderHourlyForcast(weatherData);
  });
});


let currentUnits = {
  temperature: "metric",      
  windSpeed: "km/h",          
  precipitation: "mm"         
};
document.querySelectorAll(".dropdown-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active-unit"));
    const text = item.textContent.trim();
    if (text.includes("Switch to Imperial/Metric")) {
      const switchingToImperial = currentUnits.temperature === "metric";

      currentUnits.temperature = switchingToImperial ? "imperial" : "metric";
      currentUnits.windSpeed = switchingToImperial ? "mph" : "km/h";
      currentUnits.precipitation = switchingToImperial ? "in" : "mm";

      updateActiveStyles();
      updateWeatherDisplay();
      return;
    }
    if (text.includes("Celsius")) currentUnits.temperature = "metric";
    if (text.includes("Fahrenheit")) currentUnits.temperature = "imperial";
    if (text.includes("km/h")) currentUnits.windSpeed = "km/h";
    if (text.includes("mph")) currentUnits.windSpeed = "mph";
    if (text.includes("Millimeters")) currentUnits.precipitation = "mm";
    if (text.includes("Inches")) currentUnits.precipitation = "in";
    updateWeatherDisplay();
  });
});
function convertTemperature(temp) {
  return currentUnits.temperature === "imperial"
    ? (temp * 9/5 + 32).toFixed(1) + "°F"
    : temp.toFixed(1) + "°C";
}
function convertWind(speed) {
  return currentUnits.windSpeed === "mph"
    ? (speed / 1.609).toFixed(1) + " mph"
    : speed.toFixed(1) + " km/h";
}
function convertPrecip(mm) {
  return currentUnits.precipitation === "in"
    ? (mm / 25.4).toFixed(2) + " in"
    : mm.toFixed(1) + " mm";
}
function updateWeatherDisplay() {
  if (!weatherData) return;
  temperatureInsert.textContent = convertTemperature(weatherData.current_weather.temperature);
  windInsert.textContent = convertWind(weatherData.current_weather.windspeed);
  const index = weatherData.hourly.time.indexOf(targetTime);
  if (index !== -1) {
    const feelsLike = weatherData.hourly.apparent_temperature[index];
    const humidity = weatherData.hourly.relativehumidity_2m[index];
    const precipitation = weatherData.hourly.precipitation[index];

    feelslikeInsert.textContent = convertTemperature(feelsLike);
    humidityInsert.textContent = `${humidity}${weatherData.hourly_units.relativehumidity_2m}`;
    precipitationInsert.textContent = convertPrecip(precipitation);
  }
  renderHourlyForcast(weatherData);
  loadForecast(weatherData.latitude, weatherData.longitude, weatherData.location);
}
function updateActiveStyles() {
  document.querySelectorAll("nav .dropdown-item").forEach(item => {
    item.classList.remove("active-unit");

    const text = item.textContent.trim();

    if (
      (text.includes("Celsius")     && currentUnits.temperature === "metric") ||
      (text.includes("Fahrenheit")  && currentUnits.temperature === "imperial") ||

      (text.includes("km/h")        && currentUnits.windSpeed === "km/h") ||
      (text.includes("mph")         && currentUnits.windSpeed === "mph") ||

      (text.includes("Millimeters") && currentUnits.precipitation === "mm") ||
      (text.includes("Inches")      && currentUnits.precipitation === "in")
    ) {
      item.classList.add("active-unit");
    }
  });
}

function showLoading() {
  document.getElementById("loadingOverlay").classList.remove("d-none");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.add("d-none");
}
