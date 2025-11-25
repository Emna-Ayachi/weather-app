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
  }
}


async function getWeather(lat,long,loc) {
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&location=${loc}&current_weather=true&hourly=apparent_temperature,relativehumidity_2m,precipitation`
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
    const iconPath = `assets/images/${weather.icon}`;
    const card = document.createElement("div");
    card.className = "col text-center text-white p-2";
    card.style.backgroundColor = "#1e2a38";
    card.style.borderRadius = "10px";
    console.log(iconPath)
    card.innerHTML = `
      <div class="fw-bold forecast-card">${shortDay}</div>
      <img src="${iconPath}" alt="${weather.label}" style="width: 50px; height: 50px;" />
      <div>${weather.label}</div>
      <div>${maxTemps[i]}° / ${minTemps[i]}°</div>
    `;
    container.appendChild(card);
  }
}
//GO BACK TO IT 
function renderHourlyForcast(data){
  const times = data.hourly.time;
  const temps = data.hourly.apparent_temperature;
  //console.log(times, temps);
  const currentDay = document.getElementById("dateday").textContent;
  console.log("selected day ", currentDay)
  const today = new Date();
  const selectedDate = new Date(today);

  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const selectedIndex = dayNames.indexOf(currentDay);
  const offset = (selectedIndex - today.getDay() + 7) % 7;
  selectedDate.setDate(today.getDate() + offset);

  const targetDateStr = selectedDate.toISOString().split("T")[0];

  // clear old items
  const hourlyList = document.querySelector(".hourly-list");
  hourlyList.innerHTML = "";
  for (let i = 0; i < times.length; i++) {
    if (times[i].startsWith(targetDateStr)) {
      const hour = new Date(times[i]).getHours();
      const temp = temps[i];
      const label = weatherCodeMap[temp] || "Unknown";

      const item = document.createElement("div");
      item.className = "d-flex justify-content-between mb-2";
      item.innerHTML = `<span>${hour}:00</span><span>${label}</span><span>${temp}°C</span>`;
      hourlyList.appendChild(item);
    }
  }
}

const dropdownItems = document.querySelectorAll(".dropdown-item");
dropdownItems.forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault(); 
    const selectedDay = e.target.textContent; 
    document.getElementById("dateday").textContent = selectedDay;
    renderHourlyForcast(weatherData); 
  });
});
