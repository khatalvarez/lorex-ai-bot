const fs = require('fs');
const path = './users.json';

// Load data mula sa file
function loadData() {
  try {
    if (!fs.existsSync(path)) fs.writeFileSync(path, '{}', 'utf8');
    const raw = fs.readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading users.json:', e);
    return {};
  }
}

// Save data sa file
function saveData(data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving users.json:', e);
  }
}

module.exports.config = {
  name: 'bank',
  version: '4.9.8',
  hasPermission: 0,
  usePrefix: true,
  description: "Sistema ng banko at resort na may protection, feedback at rental house.",
  usages: "buy house/status/earning/protection/resort buy/collect/upgrade/feedback/loan/payloan/bonus/games slots/games spinwheel",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID } = event;
  const adminUID = '61577040643519';
  const userName = senderID;

  // Helper: reply box style message
  function replyBox(text) {
    return {
      body: `╔═══🎯 𝗕𝗮𝗻𝗸 𝗦𝘆𝘀𝘁𝗲𝗺 🎯═══ ║ ║ ${text.replace(/\n/g, '\n║ ')} ║ ║ 📬 𝗖𝗼𝗻𝘁𝗮𝗰𝘁 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿: ║ https:                                                                                                                       
    };
  }

  const data = loadData();

                              
  if (!data[senderID]) {
    data[senderID] = {
      money: 0,
      house: false,
      houseExpire: 0,
      houseLastCollect: 0,
      protectionExpire: 0,
      lastProtectionDay: 0,
      resort: false,
      resortUpgrade: 0,
      resortLastCollect: 0,
      debt: 0,
      lastBonusClaim: 0
    };
  }

                               
  if (!data[adminUID]) {
    data[adminUID] = {
      money: 0
    };
  }

  const user = data[senderID];
  const now = Date.now();

  function isProtectionActive() {
    return user.protectionExpire > now;
  }

  function canBuyProtection() {
    if (!user.lastProtectionDay) return true;
    const lastDay = new Date(user.lastProtectionDay).toDateString();
    const today = new Date(now).toDateString();
    return lastDay !== today;
  }

  const subcmd = args[0] ? args[0].toLowerCase() : '';

  switch (subcmd) {
                              
    case 'games': {
      const game = args[1] ? args[1].toLowerCase() : '';
      if (game === 'slots') {
        if (user.money < 1000) return api.sendMessage(replyBox(`//www.facebook.com/ZeromeNaval.61577040643519 ╚═══════════════════════`
    };
  }

  const data = loadData();

  // Siguraduhin may user data
  if (!data[senderID]) {
    data[senderID] = {
      money: 0,
      house: false,
      houseExpire: 0,
      houseLastCollect: 0,
      protectionExpire: 0,
      lastProtectionDay: 0,
      resort: false,
      resortUpgrade: 0,
      resortLastCollect: 0,
      debt: 0,
      lastBonusClaim: 0
    };
  }

  // Siguraduhin may admin data
  if (!data[adminUID]) {
    data[adminUID] = {
      money: 0
    };
  }

  const user = data[senderID];
  const now = Date.now();

  function isProtectionActive() {
    return user.protectionExpire > now;
  }

  function canBuyProtection() {
    if (!user.lastProtectionDay) return true;
    const lastDay = new Date(user.lastProtectionDay).toDateString();
    const today = new Date(now).toDateString();
    return lastDay !== today;
  }

  const subcmd = args[0] ? args[0].toLowerCase() : '';

  switch (subcmd) {
    // ... (iba pang mga case)
    case 'games': {
      const game = args[1] ? args[1].toLowerCase() : '';
      if (game === 'slots') {
        if (user.money < 1000) return api.sendMessage(replyBox(`❌ Kulang ang pera mo para maglaro ng slots. Kailangan mo ng 1000 💵.`), threadID);
        user.money -= 1000;
        const slots = ['🍒', '🍋', '🍊', '💎', '🔔'];
        const result = [slots[Math.floor(Math.random() * slots.length)], slots[Math.floor(Math.random() * slots.length)], slots[Math.floor(Math.random() * slots.length)]];
        if (result[0] === result[1] && result[1] === result[2]) {
          user.money += 34000;
          saveData(data);
          return api.sendMessage(replyBox(`🎉 Nanalo ka sa slots! Nakakuha ka ng 34000 💵.\n${result[0]} | ${result[1]} | ${result[2]}`), threadID);
        } else {
          saveData(data);
          return api.sendMessage(replyBox(`😔 Natalo ka sa slots.\n${result[0]} | ${result[1]} | ${result[2]}`), threadID);
        }
      } else if (game
