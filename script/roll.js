const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'users.json');
const PLAY_COST = 20;

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

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

module.exports.config = {
  name: 'roll',
  version: '1.0',
  description: 'Roll a dice to earn money!',
  hasPermission: 0,
  cooldown: 0,
};

module.exports.run = async function({ event, api }) {
  const userId = event.senderID;
  let data = loadUserData();
  if (!data[userId]) {
    data[userId] = { balance: 0 };
  }

  if (data[userId].balance < PLAY_COST) {
    return api.sendMessage(boxMessage(`❌ Kulang ang pera mo para maglaro. Kailangan ₱${PLAY_COST}.`), event.threadID);
  }

  data[userId].balance -= PLAY_COST;

  const roll = rollDice();
  let reward = 0;
  let message = '';

  if (roll <= 2) {
    reward = -50; // loss (additional penalty)
    message = `😢 Bigo! Nag-roll ka ng ${roll}. Nawalan ka ng ₱50 pa.`;
  } else if (roll <= 4) {
    reward = 100;
    message = `😊 Maganda! Nag-roll ka ng ${roll}. Nanalo ka ng ₱100!`;
  } else if (roll === 5) {
    reward = 200;
    message = `🎉 Wow! Nag-roll ka ng 5! Nanalo ka ng ₱200!`;
  } else if (roll === 6) {
    reward = 500;
    message = `🏆 JACKPOT! Nag-roll ka ng 6! Nanalo ka ng ₱500!`;
  }

  data[userId].balance += reward;

  if (data[userId].balance < 0) data[userId].balance = 0; // Prevent negative balance

  saveUserData(data);

  const reply = `${message}\n\n💰 Balanseng mo ngayon: ₱${data[userId].balance}`;
  return api.sendMessage(boxMessage(reply, reward > 0 ? 'success' : 'error'), event.threadID);
};
