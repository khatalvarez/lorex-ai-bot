module.exports.config = {
  name: 'restart',
  version: '1.0.0',
  role: 1, // only admin can use
  hasPrefix: true,
  description: 'Restart the bot',
  usage: 'restart',
  credits: 'OpenAI'
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // You can add your admin check here, for example:
  const admins = ['61575137262643']; // replace with your admin IDs
  if (!admins.includes(senderID)) {
    return api.sendMessage('❌ You are not authorized to restart the bot.', threadID, messageID);
  }

  await api.sendMessage('🔄 Restarting the bot...', threadID, messageID);

  // Exit the process, process manager should restart the bot
  process.exit(0);
};
