require('dotenv').config();
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY_HERE';

module.exports.config = {
  name: 'currenttime',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['time', 'weather'],
  description: "Shows current time and weather in the Philippines with emoji, uses OpenAI key for possible expansions",
  usage: "currenttime [city]",
  credits: 'Developer',
};

function getWeatherEmoji(weatherId) {
  if (weatherId >= 200 && weatherId < 300) return '⛈️'; // Thunderstorm
  if (weatherId >= 300 && weatherId < 500) return '🌦️'; // Drizzle
  if (weatherId >= 500 && weatherId < 600) return '🌧️'; // Rain
  if (weatherId >= 600 && weatherId < 700) return '❄️'; // Snow
  if (weatherId >= 700 && weatherId < 800) return '🌫️'; // Atmosphere
  if (weatherId === 800) return '☀️'; // Clear
  if (weatherId > 800 && weatherId < 900) return '☁️'; // Clouds
  return '🌈'; // Default
}

async function callOpenAI(prompt) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return null;
  }
}

module.exports.run = async function({ api, event, args }) {
  const city = args.join(' ') || 'Manila';

  try {
    // Current time in Philippines timezone
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });

    // Fetch weather info
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PH&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const weatherRes = await axios.get(weatherUrl);
    const weather = weatherRes.data;

    const temp = weather.main.temp.toFixed(1);
    const weatherId = weather.weather[0].id;
    const weatherDesc = weather.weather[0].description;
    const emoji = getWeatherEmoji(weatherId);

    // Optional: Use OpenAI to generate a small weather commentary
    const prompt = `Write a short friendly weather commentary for ${city}, Philippines: Current temperature is ${temp}°C with weather described as ${weatherDesc}.`;
    const aiCommentary = await callOpenAI(prompt);

    const message = `
📍 Location: ${city}, Philippines
🕒 Current Time: ${timeString} (PHT)
🌡️ Temperature: ${temp}°C ${emoji}
🌤️ Weather: ${weatherDesc}
💬 Commentary: ${aiCommentary || "No commentary available."}
    `;

    api.sendMessage(message.trim(), event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage('Failed to fetch current time or weather. Please check the city name or try again later.', event.threadID, event.messageID);
  }
};
