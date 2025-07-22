const fs = require('fs');
const path = './data/users.json';

// ✅ Auto-create file if it doesn't exist
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');

// 🔄 Load users
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

// 🛡️ Control Flags
let isMaintenanceModeActive = false;
let isGameSystemActive = true;
let isNotificationsActive = true;

// 🔊 Group IDs to notify (replace with real ones)
const groups = ['1234567890', '9876543210'];

// 💾 Save to JSON
function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

module.exports.config = {
  name: 'mines',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Play Mines Boom and earn $600!',
  usages: 'mines [username]',
  credits: 'Omega Team',
  cooldowns: 3,
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const username = args[0];

  // 🧍 Input check
  if (!username) {
    return api.sendMessage(
      '❌ Please provide your username.\n📌 Usage: mines [username]',
      threadID,
      messageID
    );
  }

  // ⚙️ Maintenance check
  if (isMaintenanceModeActive) {
    return api.sendMessage(
      '⚠️ GTP Casino is under maintenance. Try again later.',
      threadID,
      messageID
    );
  }

  // 🎮 Game access check
  if (!isGameSystemActive) {
    return api.sendMessage(
      '⚠️ The game system is currently disabled by the admin.',
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

  // 💣 Mines reward
  const reward = 600;
  users[username].balance += reward;
  saveUserData();

  const result = `💣 𝗠𝗜𝗡𝗘𝗦 𝗕𝗢𝗢𝗠! 💥\n👤 User: ${username}\n💰 +$${reward} coins\n💼 Balance: $${users[username].balance}`;

  api.sendMessage(result, threadID, messageID);

  // 📢 Notify all groups if enabled
  if (isNotificationsActive) {
    for (const groupID of groups) {
      api.sendMessage(`📢 ${username} played 💣 Mines Boom and won $${reward}!`, groupID);
    }
  }
};
