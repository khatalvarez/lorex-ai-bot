const fs = require('fs');
const path = './data/users.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');

let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

// Control flags (update in memory only)
let isMaintenanceModeActive = false;
let isGameSystemActive = true;
let isNotificationsActive = true;

// Group IDs to send notifications (replace with real group IDs)
const groups = ['1234567890', '9876543210'];

// Save users to JSON
function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

module.exports.config = {
  name: 'slots',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Play slots box 🎰 and win $9000!',
  usages: 'slots [username]',
  credits: 'Omega Team 🎰',
  cooldowns: 3,
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const username = args[0];

  if (!username) {
    return api.sendMessage('📦 Please provide your username.\n📌 Usage: slots [username]', threadID, messageID);
  }

  if (!users[username]) {
    return api.sendMessage('❌ Username not found. Please register first.', threadID, messageID);
  }

  if (isMaintenanceModeActive) {
    return api.sendMessage('🛠️ GTP Casino is under maintenance. Try again later.', threadID, messageID);
  }

  if (!isGameSystemActive) {
    return api.sendMessage('🚫 The slot game is currently disabled by the admin.', threadID, messageID);
  }

  const reward = 9000;
  users[username].balance += reward;
  saveUserData();

  const result = `📦 𝗦𝗟𝗢𝗧 𝗕𝗢𝗫 𝗪𝗜𝗡𝗡𝗘𝗥 🎰\n\n👤 User: ${username}\n💵 Prize: $${reward}\n💼 Balance: $${users[username].balance}`;

  api.sendMessage(result, threadID, messageID);

  if (isNotificationsActive) {
    for (const groupID of groups) {
      api.sendMessage(`📢 ${username} just opened a 📦 Slot Box and won 💸 $${reward}!`, groupID);
    }
  }
};
