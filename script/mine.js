const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'users.json');
const COOLDOWN = 10 * 60 * 1000; // 10 minutes cooldown

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

module.exports.config = {
  name: 'mine',
  version: '1.0',
  description: 'Mine for money, earn random earnings',
  hasPermission: 0,
  cooldown: 0,
};

module.exports.run = async function({ event, api }) {
  const userId = event.senderID;
  let data = loadUserData();
  if (!data[userId]) {
    data[userId] = {
      balance: 0,
      lastMine: 0,
    };
  }

  const now = Date.now();
  if (now - data[userId].lastMine < COOLDOWN) {
    const left = Math.ceil((COOLDOWN - (now - data[userId].lastMine)) / 60000);
    return api.sendMessage(boxMessage(`⏳ Hintay ka pa ng ${left} minuto bago mag-mine ulit.`), event.threadID);
  }

  // Mining earnings random from 100 to 500
  const earnings = Math.floor(Math.random() * 401) + 100; // 100 to 500

  // Chance for bonus 10%
  const bonusChance = Math.random();
  // Chance for penalty 5%
  const penaltyChance = Math.random();

  let message = `⛏️ Nag-mine ka at kumita ng ₱${earnings}!`;

  if (bonusChance <= 0.10) {
    data[userId].balance += 1000;
    message += '\n🎉 Nakakita ka ng bonus na ₱1000!';
  }

  if (penaltyChance <= 0.05) {
    const penalty = Math.min(data[userId].balance, 300);
    data[userId].balance -= penalty;
    message += `\n⚠️ Nasira ang equipment mo, nawala ₱${penalty}.`;
  }

  data[userId].balance += earnings;
  data[userId].lastMine = now;

  saveUserData(data);
  return api.sendMessage(boxMessage(message, 'success'), event.threadID);
};
