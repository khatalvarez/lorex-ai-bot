const fs = require('fs');

module.exports.config = {
  name: 'antiout',
  version: '1.0.0',
  hasPermission: 2, // Admin role for access
  description: 'Prevent or allow members from leaving the group.',
  usages: 'antiout [on/off]',
  credits: 'YourBotTeam',
  cooldowns: 0,
};

const SETTINGS_FILE = './settings.json';

// Load current settings from settings.json
let settings = {};

if (fs.existsSync(SETTINGS_FILE)) {
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
  } catch (err) {
    console.error('Error loading settings file.', err);
  }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;

  // Only admins can toggle anti-out feature
  if (settings.admins && !settings.admins.includes(senderID)) {
    return api.sendMessage('❌ You do not have permission to use this command.', threadID);
  }

  // Get command input
  const command = args[0]?.toLowerCase();

  // Anti-Out On
  if (command === 'on') {
    settings.antiOutEnabled = true;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return api.sendMessage('✅ Anti-out has been enabled. No one can leave the group now.', threadID);
  }

  // Anti-Out Off
  if (command === 'off') {
    settings.antiOutEnabled = false;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return api.sendMessage('✅ Anti-out has been disabled. Members can leave the group freely.', threadID);
  }

  return api.sendMessage('❌ Invalid command. Use "antiout on" to enable or "antiout off" to disable.', threadID);
};

// Event listener for when someone tries to leave the group
module.exports.eventHandler = async function ({ api, event }) {
  const { threadID, senderID } = event;

  // Check if anti-out is enabled
  if (settings.antiOutEnabled && !settings.admins.includes(senderID)) {
    // Prevent user from leaving the group by adding them back automatically
    api.addUserToGroup(senderID, threadID, function (err) {
      if (err) {
        console.error('Error adding user back to the group:', err);
      } else {
        console.log(`User ${senderID} tried to leave the group, but was automatically added back.`);
        api.sendMessage(`❌ You cannot leave the group while anti-out is enabled.`, threadID);
      }
    });
  }
};
