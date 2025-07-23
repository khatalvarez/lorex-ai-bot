const { admins } = require('./protection');
const fs = require('fs');
const path = require('path');
const protectionFile = path.resolve(__dirname, 'protection.json');

module.exports.config = {
  name: 'protection',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Toggle protection mode (admin only)',
  usages: 'protection on | protection off',
  cooldowns: 5
};

function saveProtectionStatus(status) {
  fs.writeFileSync(protectionFile, JSON.stringify({ enabled: status }, null, 2));
}

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;

  if (!admins.includes(senderID)) {
    return api.sendMessage('❌ Only admins can toggle protection.', event.threadID, event.messageID);
  }

  if (!args[0]) {
    return api.sendMessage('⚠️ Usage: protection on | protection off', event.threadID, event.messageID);
  }

  const action = args[0].toLowerCase();
  if (action === 'on') {
    saveProtectionStatus(true);
    return api.sendMessage('✅ Protection is now ON. Only admins can use commands.', event.threadID, event.messageID);
  } else if (action === 'off') {
    saveProtectionStatus(false);
    return api.sendMessage('✅ Protection is now OFF. All users can use commands.', event.threadID, event.messageID);
  } else {
    return api.sendMessage('⚠️ Invalid option. Use "on" or "off".', event.threadID, event.messageID);
  }
};
