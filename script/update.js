const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'update',
  version: '1.0.0',
  role: 1, // admin only
  hasPrefix: true,
  description: 'Show versions of all commands',
  usage: 'update',
  credits: 'OpenAI'
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // Replace with your admin IDs
  const admins = ['61577040643519', '61577040643519'];

  if (!admins.includes(senderID)) {
    return api.sendMessage('❌ You are not authorized to run this command.', threadID, messageID);
  }

  const commandsDir = __dirname; // folder where commands are stored
  let response = '📄 Versions of all commands:\n';

  try {
    const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js') && file !== 'update.js');

    for (const file of files) {
      const commandPath = path.join(commandsDir, file);
      delete require.cache[require.resolve(commandPath)]; // clear cache to get fresh version
      const command = require(commandPath);
      const name = command.config?.name || file.replace('.js', '');
      const version = command.config?.version || 'unknown';
      response += `• ${name}: v${version}\n`;
    }

    return api.sendMessage(response, threadID, messageID);
  } catch (error) {
    return api.sendMessage('❌ Error fetching command versions: ' + error.message, threadID, messageID);
  }
};

