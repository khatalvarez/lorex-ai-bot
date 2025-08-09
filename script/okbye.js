const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_PATH = path.join(__dirname, 'gagstock/data.json');
const SHOP_PATH = path.join(__dirname, 'gagstock/shop.json');

module.exports.config = {
  name: 'sanaal',
  version: '10.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['gstock', 'gagcoin', 'gagfarm'],
  description: "Gagstock tracker + farm + shop + persistent save",
  usages: "gagstock [plant|harvest|rain|claim|shop|buy|inventory|leaderboard]",
  credits: "Upgraded by ChatGPT",
  cooldowns: 0
};

let rain = null;

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

const shop = JSON.parse(fs.readFileSync(SHOP_PATH, 'utf8'));

function calcHarvest(seed, inventory) {
  const minutes = (Date.now() / 1000 - seed.timePlanted) / 60;
  const growth = Math.min(minutes, 60);
  let reward = Math.floor(seed.amount * (1 + growth / 100));
  if (inventory?.fertilizer) reward = Math.floor(reward * 1.2);
  return reward;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const cmd = (args[0] || '').toLowerCase();
  const data = loadData();

  if (!data[senderID]) {
    data[senderID] = {
      coins: 0,
      inventory: {},
      seeds: null
    };
  }

  const user = data[senderID];

  // 📈 Price check
  if (!cmd || cmd === 'price') {
    try {
      const res = await axios.get('https://api.gagstock.io/latest');
      const s = res.data;
      const e = parseFloat(s.change) >= 0 ? "📈⬆️" : "📉⬇️";
      return api.sendMessage(`📊 Gagstock Price:\n💰 ${s.price} GAG ${e}\n📉 ${s.change}%\n🕒 ${new Date().toLocaleTimeString()}`, threadID, messageID);
    } catch {
      return api.sendMessage("❌ Failed to fetch price.", threadID, messageID);
    }
  }

  // 🌱 Plant
  if (cmd === 'plant') {
    const amt = parseInt(args[1]);
    if (isNaN(amt) || amt < 1) return api.sendMessage("❌ Usage: gagstock plant 10", threadID, messageID);
    if (user.seeds) return api.sendMessage("🌱 You already planted. Harvest first.", threadID, messageID);
    user.seeds = { timePlanted: Date.now() / 1000, amount: amt };
    saveData(data);
    return api.sendMessage(`🌱 You planted ${amt} seeds. Come back later to harvest.`, threadID, messageID);
  }

  // 🌾 Harvest
  if (cmd === 'harvest') {
    if (!user.seeds) return api.sendMessage("❌ You haven't planted anything!", threadID, messageID);
    const reward = calcHarvest(user.seeds, user.inventory);
    user.coins += reward;
    user.seeds = null;
    saveData(data);
    return api.sendMessage(`🌾 You harvested ${reward} GAG! 💰 Balance: ${user.coins}`, threadID, messageID);
  }

  // 🌧 Rain
  if (cmd === 'rain') {
    if (rain) return api.sendMessage("🌧 Rain already active! Type 'gagstock claim' to grab it!", threadID, messageID);
    const drop = Math.floor(Math.random() * 100) + 50;
    rain = {
      amount: drop,
      threadID,
      claimed: false
    };
    return api.sendMessage(`🌧 Gagcoin rain! First to type 'gagstock claim' gets ${drop} GAG!`, threadID, messageID);
  }

  // ✋ Claim
  if (cmd === 'claim') {
    if (!rain || rain.claimed || rain.threadID !== threadID) return api.sendMessage("❌ No rain to claim.", threadID, messageID);
    user.coins += rain.amount;
    rain.claimed = true;
    saveData(data);
    const name = (await api.getUserInfo(senderID))[senderID]?.name || senderID;
    return api.sendMessage(`🎉 ${name} claimed ${rain.amount} GAG from the rain! 💸`, threadID, messageID);
  }

  // 🛍 Shop
  if (cmd === 'shop') {
    let msg = "🛒 Gagcoin Shop:\n";
    for (const [key, item] of Object.entries(shop)) {
      msg += `- ${item.name} [${key}]: ${item.price} GAG\n  📝 ${item.description}\n`;
    }
    return api.sendMessage(msg, threadID, messageID);
  }

  // 🛒 Buy
  if (cmd === 'buy') {
    const key = args[1];
    const item = shop[key];
    if (!item) return api.sendMessage("❌ Invalid item. Use 'gagstock shop' to see items.", threadID, messageID);
    if (user.coins < item.price) return api.sendMessage("💸 You don’t have enough GAG.", threadID, messageID);
    user.coins -= item.price;
    user.inventory[key] = (user.inventory[key] || 0) + 1;
    saveData(data);
    return api.sendMessage(`🛍 You bought ${item.name} for ${item.price} GAG!`, threadID, messageID);
  }

  // 🎒 Inventory
  if (cmd === 'inventory') {
    const inv = user.inventory;
    if (!Object.keys(inv).length) return api.sendMessage("🎒 Your inventory is empty.", threadID, messageID);
    let msg = "🎒 Your Inventory:\n";
    for (const [key, qty] of Object.entries(inv)) {
      msg += `- ${shop[key]?.name || key}: x${qty}\n`;
    }
    return api.sendMessage(msg, threadID, messageID);
  }

  // 🏆 Leaderboard
  if (cmd === 'leaderboard') {
    const top = Object.entries(data)
      .filter(([, u]) => u.coins > 0)
      .sort((a, b) => b[1].coins - a[1].coins)
      .slice(0, 5);

    if (!top.length) return api.sendMessage("📉 No Gagcoin farmers yet!", threadID, messageID);

    const userInfo = await api.getUserInfo(top.map(([uid]) => uid));
    let msg = "🏆 Top Gagcoin Farmers:\n";
    for (let i = 0; i < top.length; i++) {
      const [uid, udata] = top[i];
      const name = userInfo[uid]?.name || `UID ${uid}`;
      msg += `#${i + 1} 🧑‍🌾 ${name}: ${udata.coins} GAG\n`;
    }

    return api.sendMessage(msg, threadID, messageID);
  }

  // Help fallback
  return api.sendMessage("❓ Available commands:\n" +
    "- gagstock [price] → Check price\n" +
    "- gagstock plant 10\n" +
    "- gagstock harvest\n" +
    "- gagstock rain\n" +
    "- gagstock claim\n" +
    "- gagstock shop\n" +
    "- gagstock buy <item>\n" +
    "- gagstock inventory\n" +
    "- gagstock leaderboard", threadID, messageID);
};
