const axios = require('axios');
const fs = require('fs');
const COOLDOWN_TIME = 10 * 1000; // 10 seconds cooldown

const dataFile = './sandra_stats.json';
let stats = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};
let cooldowns = {};

module.exports.config = {
  name: 'sandra',
  version: '1.1.0',
  role: 0,
  hasPrefix: true,
  aliases: ['funny', 'tagalogfun', 'sandrajokes'],
  description: 'Sandra funny Tagalog jokes and quotes with API fetch.',
  usage: 'sandra [tag someone]',
  credits: 'OpenAI + You'
};

function saveStats() {
  fs.writeFileSync(dataFile, JSON.stringify(stats, null, 2));
}

async function fetchJoke() {
  try {
    // Example generic jokes API (replace or customize kung may sariling joke API)
    const response = await axios.get('https://v2.jokeapi.dev/joke/Any?lang=es&type=single'); // Using Spanish for demo
    if (response.data && response.data.joke) {
      // You can translate or modify joke here if needed
      return response.data.joke;
    }
    return null;
  } catch {
    return null;
  }
}

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID, mentions } = event;

  // Check cooldown
  const now = Date.now();
  if (cooldowns[senderID] && now - cooldowns[senderID] < COOLDOWN_TIME) {
    return api.sendMessage("⏳ Sandali lang, maghintay muna bago ulit magpa-tawa!", threadID, messageID);
  }
  cooldowns[senderID] = now;

  // Try fetch joke from API
  let joke = await fetchJoke();

  // If no API joke, fallback to static jokes
  if (!joke) {
    const fallbackJokes = [
      "Sandra: 'Hoy, alam mo ba na ang tawa ko ay mas malakas pa sa ulan!' 😂",
      "Sandra: 'Ang buhay parang traffic, minsan stuck, minsan mabilis, pero laging nakakainis!' 🤣",
      "Sandra: 'Puso ko parang WiFi, mahina kung malayo sa'yo!' 😍",
      "Sandra: 'Kapag sinabi kong 'may time ako,' ibig sabihin wala talaga!' 😜"
    ];
    joke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
  }

  // Tag mentioned users if any
  let tagText = '';
  if (mentions && Object.keys(mentions).length > 0) {
    tagText = Object.values(mentions).map(user => user.name).join(', ');
    tagText = `Hey ${tagText}! Pakinggan mo 'to:\n`;
  }

  // Update stats
  if (!stats[senderID]) stats[senderID] = { jokesSent: 0 };
  stats[senderID].jokesSent++;
  saveStats();

  const reply = `${tagText}${joke}\n\n😂 Total jokes sent: ${stats[senderID].jokesSent}`;
  return api.sendMessage(reply, threadID, messageID);
};

