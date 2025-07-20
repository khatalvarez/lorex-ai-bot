const axios = require('axios');

module.exports.config = {
  name: 'cassweather',
  version: '1.1.0',
  role: 0,
  hasPrefix: true,
  aliases: ['forecast'],
  description: 'Check current weather using AgroMonitoring API',
  usage: 'weather [city]',
  credits: 'OpenAI + You'
};

module.exports.run = async function({ api, event, args }) {
  const city = args.join(' ');

  // 🔐 Replace with your actual API keys
  const agroApiKey = 'YOUR_AGROMONITORING_API_KEY';
  const geoApiKey = 'YOUR_GEOCODING_API_KEY';

  if (!city) {
    return api.sendMessage('Please provide a city. Example: weather Manila', event.threadID, event.messageID);
  }

  try {
    // Step 1: Get coordinates from city using OpenCage Geocoding
    const geoRes = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${geoApiKey}`);
    const geoData = geoRes.data;

    if (!geoData.results.length) {
      return api.sendMessage('City not found. Please check the spelling.', event.threadID, event.messageID);
    }

    const lat = geoData.results[0].geometry.lat;
    const lon = geoData.results[0].geometry.lng;

    // Step 2: Get current weather from AgroMonitoring
    const weatherRes = await axios.get(`https://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lon}&appid=${agroApiKey}`);
    const weather = weatherRes.data;

    // Helpers
    const toCelsius = (k) => (k - 273.15).toFixed(1);
    const toTime = (unix) => new Date(unix * 1000).toLocaleString();

    // Build response
    const reply = `Current Weather in ${city}

Date/Time: ${toTime(weather.dt)}
Condition: ${weather.weather[0].main} - ${weather.weather[0].description}
Temperature: ${toCelsius(weather.main.temp)}°C
Feels Like: ${toCelsius(weather.main.feels_like)}°C
Min: ${toCelsius(weather.main.temp_min)}°C / Max: ${toCelsius(weather.main.temp_max)}°C
Humidity: ${weather.main.humidity}%
Pressure: ${weather.main.pressure} hPa
Wind: ${weather.wind.speed} m/s, Gust: ${weather.wind.gust || 'N/A'} m/s, Direction: ${weather.wind.deg}°
Cloudiness: ${weather.clouds.all}%
Coordinates: (${lat.toFixed(2)}, ${lon.toFixed(2)})`;

    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage('An error occurred while retrieving weather data.', event.threadID, event.messageID);
  }
};
