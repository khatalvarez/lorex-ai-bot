const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'users.json');
const COOLDOWN = 10 * 60 * 1000; // 10 minutes cooldown
const BET_AMOUNT = 100;

const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣'];

const payouts = {
  '7️⃣3': 2000,
  '💎3': 1000,
  '🔔3': 500,
  '🍋3': 300,
  '🍒3': 200,
  '7️⃣2': 300,
  '💎2': 150,
  '🔔2': 75,
  '🍋2': 50,
  '🍒2': 30,
};

function loadUserData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveUserData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function boxMessage(text, type = 'info') {
  const prefix = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[type] || '';
  return `${prefix} ${text}`;
}

function spinSlots() {
  return [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
}

function evaluateSpin(spin) {
  const counts = {};
  for (const sym of spin) {
    counts[sym] = (counts[sym] || 0) + 1;
  }
  // Find highest payout
  let maxPayout = 0;
  let winningSymbol = null;
  for (const sym in counts) {
    const key3 = sym + '3';
    const key2 = sym + '2';
    if (counts[sym] === 3 && payouts[key3] && payouts[key3] > maxPayout) {
      maxPayout = payouts[key3];
      winningSymbol = sym;
    } else if (counts[sym] === 2 && payouts[key2] && payouts[key2] > maxPayout) {
      maxPayout = payouts[key2];
      winningSymbol = sym;
    }
  }
  return { payout: maxPayout, symbol: winningSymbol };
}

module.exports.config = {
  name: 'scatter',
  version: '1.0',
  description: 'Slots game — scatter to win money!',
  hasPermission: 0,
  cooldown: 0,
};

module.exports.run = async function({ event, api }) {
  const userId = event.senderID;
  let data = loadUserData();
  if (!data[userId]) {
    data[userId] = { balance: 0, lastScatter: 0 };
  }

  const now = Date.now();
  if (now - data[userId].lastScatter < COOLDOWN) {
    const left = Math.ceil((COOLDOWN - (now - data[userId].lastScatter)) / 60000);
    return api.sendMessage(boxMessage(`⏳ Hintay ka pa ng ${left} minuto bago mag-scatter ulit.`), event.threadID);
  }

  if (data[userId].balance < BET_AMOUNT) {
    return api.sendMessage(boxMessage(`❌ Kulang ang pera mo para mag-bet. Kailangan ₱${BET_AMOUNT}.`), event.threadID);
  }

  // Deduct bet
  data[userId].balance -= BET_AMOUNT;

  // Spin slots
  const spin = spinSlots();
  const { payout, symbol } = evaluateSpin(spin);

  let reply = `🎰 Scatter Slots 🎰\n\n[ ${spin.join(' | ')} ]\n\n`;

  if (payout > 0) {
    data[userId].balance += payout;
    reply += `🎉 Panalo! ${payout} pesos ang nakuha mo sa ${symbol}!\n\nBalance mo: ₱${data[userId].balance}`;
  } else {
    reply += `😞 Wala kang napanalunan. Subukan mo ulit!\n\nBalance mo: ₱${data[userId].balance}`;
  }

  data[userId].lastScatter = now;
  saveUserData(data);

  return api.sendMessage(boxMessage(reply, payout > 0 ? 'success' : 'error'), event.threadID);
};
