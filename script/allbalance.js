const fs = require('fs');
const path = require('path');

const userDataPath = path.resolve(__dirname, 'user.json');

function loadUserData() {
  if (!fs.existsSync(userDataPath)) return {};
  const data = fs.readFileSync(userDataPath, 'utf8');
  return JSON.parse(data || '{}');
}

function boxMessage(text) {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length));
  const top = '╔' + '═'.repeat(maxLength + 2) + '╗';
  const bottom = '╚' + '═'.repeat(maxLength + 2) + '╝';
  const middle = lines
    .map(line => `║ ${line}${' '.repeat(maxLength - line.length)} ║`)
    .join('\n');
  return [top, middle, bottom].join('\n');
}

module.exports.config = {
  name: 'allbalance',
  version: '1.0.0',
  description: 'Show all users balance and inventory',
  cooldowns: 5,
  permissions: 2 // admin only
};

module.exports.run = async function({ api, event }) {
  const data = loadUserData();

  if (Object.keys(data).length === 0) {
    return api.sendMessage('Walang user data sa database.', event.threadID, event.messageID);
  }

  let msg = '📊 All Users Balance & Inventory:\n\n';

  for (const [userId, user] of Object.entries(data)) {
    msg += `👤 User ID: ${userId}\n`;
    msg += `💰 Balance: ₱${user.balance || 0}\n`;
    if (user.inventory && Object.keys(user.inventory).length > 0) {
      msg += `🎒 Inventory:\n`;
      for (const [item, qty] of Object.entries(user.inventory)) {
        msg += `   - ${item}: ${qty}\n`;
      }
    } else {
      msg += '🎒 Inventory: Empty\n';
    }
    msg += '\n';
  }

  return api.sendMessage(boxMessage(msg), event.threadID, event.messageID);
};
