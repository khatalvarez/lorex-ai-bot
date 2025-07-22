const axios = require('axios');

module.exports.config = {
  name: 'forcast',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['wthr', 'forecast'],
  description: "Shows current weather and forecast",
  usages: "cassweather [location]",
  credits: 'CHATGPT',
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

// Image link mula sa iyong binigay na screenshot
const WEATHER_IMAGE_URL = 'https://i.ibb.co/XrWZqvB2/weather-image.png';

module.exports.run = async function({ api, event, args }) {
  const location = args.join(' ');
  const apiKey = 'acb7e0e8-bbc3-4697-bf64-1f3c6231dee7';
  const query = encodeURIComponent(location);

  try {
    const { data } = await axios.get(`https://kaiz-apis.gleeze.com/api/weather?q=${query}&apikey=${apiKey}`);
    const weatherData = data['0'];
    if (!weatherData || !weatherData.current) {
      return api.sendMessage(`❌ No weather data found for "${location}".`, event.threadID, event.messageID);
    }

    const { current, forecast, location: loc } = weatherData;
    const message =
      `🌦️ Weather for ${loc.name}\n\n` +
      `🌡️ Temperature: ${current.temperature}°${loc.degreetype}\n` +
      `☁️ Condition: ${current.skytext}\n` +
      `💧 Humidity: ${current.humidity}%\n` +
      `💨 Wind: ${current.winddisplay}\n` +
      `🕒 Observed: ${current.observationtime}\n\n` +
      `📅 5-Day Forecast:\n` +
      forecast.map(day =>
        `📍 ${day.day} (${day.date}):\n` +
        ` - 🌦️ ${day.skytextday}\n` +
        ` - 🌡️ ${day.low}° - ${day.high}°\n` +
        ` - ☔ Chance: ${day.precip}%\n`
      ).join('\n');

    // Send message with image attachment
    return api.sendMessage(
      {
        body: message,
        attachment: await global.utils.getStreamFromURL(WEATHER_IMAGE_URL)
      },
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error(error);
    return api.sendMessage('❌ Failed to fetch weather data.', event.threadID, event.messageID);
  }
};
