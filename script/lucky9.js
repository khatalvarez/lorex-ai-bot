const fs = require('fs');
const path = './data/users.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

let isMaintenanceModeActive = false;
let isGameSystemActive = true;
let isNotificationsActive = true;

const groups = ['1234567890', '9876543210']; // Replace with real group IDs

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

module.exports.config = {
  name: 'lucky9',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Play Lucky 9 and win $500',
  usages: 'lucky9 [username]',
  credits: 'Omega Team 🎲',
  cooldowns: 3,
  dependencies: {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const username = args[0];

  if (!username) return api.sendMessage('🎲 Enter your username.\n📌 lucky9 [username]', threadID, messageID);
  if (!users[username]) return api.sendMessage('❌ Username not found. Please register first.', threadID, messageID);
  if (isMaintenanceModeActive) return api.sendMessage('🛠️ GTP Casino is under maintenance.', threadID, messageID);
  if (!isGameSystemActive) return api.sendMessage('🚫 Game system is currently disabled.', threadID, messageID);

  const reward = 500;
  users[username].balance += reward;
  saveUserData();

  const msg = `🎰 𝗟𝗨𝗖𝗞𝗬 𝟵 𝗪𝗜𝗡 🎉\n👤 User: ${username}\n💵 +$${reward}\n💼 Balance: $${users[username].balance}`;
  api.sendMessage(msg, threadID, messageID);

  if (isNotificationsActive) {
    for (const group of groups) {
      api.sendMessage(`📢 ${username} just won 🎲 Lucky 9 and earned $${reward}!`, group);
    }
  }
};
