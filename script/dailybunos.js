const fs = require('fs');
const path = './data/users.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');

let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

// Get today's date (YYYY-MM-DD)
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

module.exports.config = {
  name: 'dailybonus',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Claim your daily gift bonus of $500',
  usages: 'dailybonus [username]',
  credits: 'Omega Team 🎁',
  cooldowns: 0,
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const username = args[0];

  if (!username) {
    return api.sendMessage('🎁 Please enter your username.\n📌 Usage: dailybonus [username]', threadID, messageID);
  }

  if (!users[username]) {
    return api.sendMessage('❌ Username not found. Please register first.', threadID, messageID);
  }

  const today = getTodayDate();
  const user = users[username];

  // Check if already claimed today
  if (user.lastClaimDate === today) {
    return api.sendMessage('🕐 You already claimed your 🎁 daily bonus today. Come back tomorrow!', threadID, messageID);
  }

  // Give bonus
  const bonus = 500;
  user.balance += bonus;
  user.lastClaimDate = today;
  saveUserData();

  return api.sendMessage(
    `🎉 DAILY BONUS CLAIMED! 🎉\n\n👤 User: ${username}\n🎁 Reward: $${bonus} coins\n💼 New Balance: $${user.balance}\n🗓️ Claimed: ${today}`,
    threadID,
    messageID
  );
};
