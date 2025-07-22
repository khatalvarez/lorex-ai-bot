const fs = require('fs');
const path = './data/users.json';

// ✅ Create data file if it doesn't exist
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');

// 🔄 Load users
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

// 🔐 System Control Flags
let isMaintenanceModeActive = false;
let isGameSystemActive = true;
let isNotificationsActive = true;

// 🔊 Groups for notification
const groups = ['1234567890', '9876543210']; // Replace with real group IDs

// 💾 Save user data to file
function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

module.exports.config = {
  name: 'boxing',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Enter the boxing arena and earn $500 coins!',
  usages: 'boxing [username]',
  credits: 'Omega Team',
  cooldowns: 3,
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const username = args[0];

  // ✅ Input check
  if (!username) {
    return api.sendMessage(
      '❌ Please provide your username.\n📌 Usage: boxing [username]',
      threadID,
      messageID
    );
  }

  // 🔧 Maintenance check
  if (isMaintenanceModeActive) {
    return api.sendMessage(
      '⚠️ GTP Casino is under maintenance. Please try again later.',
      threadID,
      messageID
    );
  }

  // 🎮 Game access check
  if (!isGameSystemActive) {
    return api.sendMessage(
      '⚠️ The boxing game is currently disabled by the admin.',
      threadID,
      messageID
    );
  }

  // 👤 User check
  if (!users[username]) {
    return api.sendMessage(
      '❌ Username not found. Please register first.\n📌 Use: gtpCasino register [name] [3-digit number]',
      threadID,
      messageID
    );
  }

  // 🎁 Reward logic
  const reward = 500;
  users[username].balance += reward;
  saveUserData();

  const winMsg = `🥊 𝗕𝗢𝗫𝗜𝗡𝗚 𝗔𝗥𝗘𝗡𝗔 🥇\n👤 User: ${username}\n💰 +$${reward} coins\n💼 New Balance: $${users[username].balance}`;

  api.sendMessage(winMsg, threadID, messageID);

  // 📢 Send to all groups if enabled
  if (isNotificationsActive) {
    for (const groupID of groups) {
      api.sendMessage(`📢 ${username} just earned $${reward} in the 🥊 Boxing Arena!`, groupID);
    }
  }
};
