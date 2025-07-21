const fs = require('fs');
const path = require('path');
const maintenancePath = path.join(__dirname, '../maintenance.json');

module.exports.config = {
  name: 'maintenance',
  version: '1.0.0',
  hasPermission: 1, // admin only
  usePrefix: true,
  aliases: ['maint'],
  description: "Enable or disable bot maintenance mode",
  usages: "maintenance [on/off]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  if (args.length === 0 || !['on', 'off'].includes(args[0].toLowerCase())) {
    return api.sendMessage("⚙️ Usage: maintenance [on/off]", event.threadID, event.messageID);
  }

  const mode = args[0].toLowerCase() === 'on';
  const message = mode
    ? "🚧 The bot is under maintenance. Please try again later."
    : "";

  fs.writeFileSync(maintenancePath, JSON.stringify({ enabled: mode, message }, null, 2));

  return api.sendMessage(`✅ Maintenance mode is now ${mode ? 'ON' : 'OFF'}.`, event.threadID, event.messageID);
};
