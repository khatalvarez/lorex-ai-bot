const axios = require('axios');

module.exports.config = {
  name: 'cassweather',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['wthr', 'forecast'],
  description: "Shows current weather and forecast",
  usages: "cassweather [location]",
  credits: 'Kaizenji',
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

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

    api.sendMessage(message, event.threadID, event.messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage('❌ Failed to fetch weather data.', event.threadID, event.messageID);
  }
};
