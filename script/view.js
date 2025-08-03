const fetch = require('node-fetch');

module.exports.config = {
  name: 'view',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['status', 'uptime'],
  description: "View AI uptime status from server",
};

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const messageID = event.messageID;
  const cmd = args[0]?.toLowerCase() || 'view';

  if (['view', 'uptime', 'status'].includes(cmd)) {
    try {
      const response = await fetch('https://lorex-ai-bot-xv6l.onrender.com/uptime');
      if (!response.ok) throw new Error(`Status code: ${response.status}`);

      // Change .json() to .text() if your API returns plain text
      const data = await response.json();
      const uptime = data.uptime || JSON.stringify(data);

      const message = `🤖 AI Uptime Status:\n${uptime}`;
      return api.sendMessage(message, senderID, messageID);
    } catch (error) {
      console.error('Failed to fetch uptime:', error);
      return api.sendMessage('❌ Failed to fetch AI uptime data.', senderID, messageID);
    }
  } else {
    return api.sendMessage('❌ Unknown command. Use "view", "uptime", or "status".', senderID, messageID);
  }
};
