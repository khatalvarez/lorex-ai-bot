const fs = require('fs');
const SETTINGS_FILE = './settings.json';

// Default settings structure
let settings = {
  botSettings: {
    version: "1.0.0",
    botStatus: "active"
  },
  defaultSettings: {
    theme: "light",
    notifications: true,
    language: "en"
  },
  adminSettings: {
    notifyOnLogin: true,
    notifyOnPurchase: true
  }
};

// Load settings from the settings.json file if it exists
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
  } catch (err) {
    console.error('❌ Error loading settings file:', err);
  }
}

// Save settings to the settings.json file
function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('❌ Could not save settings:', err);
  }
}

// Function to view the settings
module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  if (args[0] === 'botSettings') {
    const botSettingsMessage = `
      ⚙️ **Bot Settings** ⚙️\n
      Version: ${settings.botSettings.version}\n
      Status: ${settings.botSettings.botStatus}\n
    `;
    return api.sendMessage(botSettingsMessage, threadID, messageID);
  }

  if (args[0] === 'defaultSettings') {
    const defaultSettingsMessage = `
      🌙 **Default Settings** 🌙\n
      Theme: ${settings.defaultSettings.theme}\n
      Notifications: ${settings.defaultSettings.notifications ? 'Enabled' : 'Disabled'}\n
      Language: ${settings.defaultSettings.language}\n
    `;
    return api.sendMessage(defaultSettingsMessage, threadID, messageID);
  }

  // Admin settings view
  const adminID = '61575137262643';
  if (senderID === adminID && args[0] === 'adminSettings') {
    const adminSettingsMessage = `
      🔒 **Admin Settings** 🔒\n
      Notify on Login: ${settings.adminSettings.notifyOnLogin ? 'Enabled' : 'Disabled'}\n
      Notify on Purchase: ${settings.adminSettings.notifyOnPurchase ? 'Enabled' : 'Disabled'}\n
    `;
    return api.sendMessage(adminSettingsMessage, threadID, messageID);
  }

  // Command to toggle notifications for all users
  if (args[0] === 'toggleNotifications') {
    if (args[1] === 'on') {
      settings.defaultSettings.notifications = true;
    } else if (args[1] === 'off') {
      settings.defaultSettings.notifications = false;
    } else {
      return api.sendMessage("❌ Invalid argument. Use 'on' or 'off'.", threadID, messageID);
    }

    saveSettings(); // Save updated settings
    return api.sendMessage(`✅ Notifications have been turned ${args[1] === 'on' ? 'on' : 'off'}.`, threadID, messageID);
  }

  // Update theme (light or dark)
  if (args[0] === 'updateTheme' && (args[1] === 'light' || args[1] === 'dark')) {
    settings.defaultSettings.theme = args[1];
    saveSettings(); // Save updated settings
    return api.sendMessage(`✅ Theme has been updated to ${args[1]}.`, threadID, messageID);
  }
};
