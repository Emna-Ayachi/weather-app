const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const cityInsert = document.getElementById("city");
const temperatureInsert = document.getElementById("temperature");
const exactDate =document.getElementById("exactDate");
const windInsert=document.getElementById("wind");
const feelslikeInsert=document.getElementById("feelslike");
const humidityInsert = document.getElementById("humidity");
const precipitationInsert=document.getElementById("precipitation");



searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) {
    searchCity(city);
  }
});
const now = new Date();
const year = now.getUTCFullYear();
const month = String(now.getUTCMonth() + 1).padStart(2, '0');
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
    exactDate.textContent = targetTime
    getWeather(location.latitude, location.longitude, location.name);

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
    console.log(data)
    temperatureInsert.textContent= data.current_weather.temperature;
    windInsert.textContent=`${data.current_weather.windspeed}${data.current_weather_units.windspeed}` 
    
    const index = data.hourly.time.indexOf(targetTime);
    const feelsLike = data.hourly.apparent_temperature[index];
    const humidity = data.hourly.relativehumidity_2m[index];
    const precipitation = data.hourly.precipitation[index];
    feelslikeInsert.textContent=`${feelsLike}°`;
    humidityInsert.textContent=`${humidity}%`;
    precipitationInsert.textContent=`${precipitation}`
    return data;
  }
  catch (err) {
    console.error(err);
    alert("Error fetching data.");
  }

}




