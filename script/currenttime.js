const axios = require('axios');
require('dotenv').config();

module.exports.config = {
  name: 'currenttime',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['time', 'weather'],
  description: "Shows current time and weather in the Philippines 🇵🇭",
  usage: "currenttime",
  credits: "Developer",
};

module.exports.run = async function({ api, event }) {
  const city = "Manila";
  const countryCode = "PH";
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

  try {
    // Fetch current weather from OpenWeatherMap API
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city},${countryCode}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.data) throw new Error("No weather data");

    const weatherData = weatherResponse.data;
    const temp = weatherData.main.temp;
    const desc = weatherData.weather[0].description;
    const weatherEmoji = getWeatherEmoji(desc);

    // Get current Philippine time using Asia/Manila timezone
    const now = new Date();
    const manilaTime = now.toLocaleString("en-US", { timeZone: "Asia/Manila", hour12: false });

    // Construct the message with emojis
    const message = `🌤️ Weather in ${city}, Philippines:\n` +
      `🌡️ Temperature: ${temp}°C\n` +
      `🌥️ Condition: ${desc} ${weatherEmoji}\n\n` +
      `⏰ Current Time (Philippines): ${manilaTime}`;

    // Send the message
    api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Failed to fetch current time or weather. Please check your API key or try again later.", event.threadID, event.messageID);
  }
};

function getWeatherEmoji(description) {
  description = description.toLowerCase();
  if (description.includes("clear")) return "☀️";
  if (description.includes("cloud")) return "☁️";
  if (description.includes("rain")) return "🌧️";
  if (description.includes("storm")) return "⛈️";
  if (description.includes("snow")) return "❄️";
  if (description.includes("fog") || description.includes("mist")) return "🌫️";
  return "🌈";
}
