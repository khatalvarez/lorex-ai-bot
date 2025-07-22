const fs = require('fs');
const path = require('path');

// Assuming the lock status is stored in a separate settings file or directly in data
const SETTINGS_FILE = path.join(__dirname, '..', 'config', 'settings.json');

// Load settings
let settings = require(SETTINGS_FILE);

// Admin UID
const ADMIN_UID = '61575137262643';

// Default lock status (false means unlocked)
if (!settings.lock) {
  settings.lock = false; // Default value, unlocked
}

// Save settings to settings.json
function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('❌ Error saving settings:', err);
  }
}

// Command Handler for Lock
module.exports.config = {
  name: 'lock',
  version: '1.0.0',
  hasPermission: 0, // For public usage
  usePrefix: true, // Enable prefix usage
  aliases: ['lockcommand', 'lockcmd'],
  description: 'Allows the admin to lock/unlock commands',
  usages: 'lock [on|off]',
  credits: 'CHATGPT',
  cooldowns: 5,
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  // Check if the sender is the admin
  if (senderID !== ADMIN_UID) {
    return api.sendMessage('❌ You are not authorized to use this command.', threadID, messageID);
  }

  // Command arguments (on/off)
  const cmd = args[0]?.toLowerCase();

  if (!cmd) {
    return api.sendMessage('❌ Please specify "on" or "off" to lock/unlock.', threadID, messageID);
  }

  if (cmd === 'on') {
    // Lock all commands
    if (settings.lock) {
      return api.sendMessage('❌ The bot is already locked.', threadID, messageID);
    }

    settings.lock = true; // Turn on the lock
    saveSettings();

    return api.sendMessage('✅ Bot commands are now locked. No user can use any commands.', threadID, messageID);
  }

  if (cmd === 'off') {
    // Unlock all commands
    if (!settings.lock) {
      return api.sendMessage('❌ The bot is already unlocked.', threadID, messageID);
    }

    settings.lock = false; // Turn off the lock
    saveSettings();

    return api.sendMessage('✅ Bot commands are now unlocked. Users can use commands again.', threadID, messageID);
  }

  return api.sendMessage('❌ Invalid argument. Use "on" or "off".', threadID, messageID);
};

// Check if bot is locked, restrict command execution
module.exports.checkLock = async function({ api, event }) {
  if (settings.lock) {
    const { threadID, senderID, messageID } = event;

    // Prevent non-admins from using commands while locked
    if (senderID !== ADMIN_UID) {
      return api.sendMessage('❌ The bot is locked. Please wait until it is unlocked.', threadID, messageID);
    }
  }
};
