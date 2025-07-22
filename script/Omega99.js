const fs = require('fs');
const axios = require('axios');
const SETTINGS_FILE = './settings.json';
const DATA_FILE = './data.json';

let data = {
  users: {},
  feedbacks: [],
  pendingLoans: [],
  threads: [],
  logs: []
};

let settings = {
  defaultSettings: {
    theme: "light",
    notifications: true
  }
};

// Load data files
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (err) {
    console.error('❌ Error loading data file:', err);
  }
}

// Load settings files
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
  } catch (err) {
    console.error('❌ Error loading settings file:', err);
  }
}

// Save data files
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Could not save data:', err);
  }
}

// Save settings files
function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('❌ Could not save settings:', err);
  }
}

module.exports.config = {
  name: 'omega99',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['omega99'],
  description: 'Casino bot with login, register, feedback, settings, games, protection, and free daily coins.',
  credits: 'ChatGPT',
  cooldowns: 0
};

// Main bot functionality
module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const user = data.users[senderID] || { loggedIn: false, username: '', password: '', balance: 1000, protection: false, lastClaimed: 0 };

  // === Admin Panel ===
  const adminID = '61577040643519';
  const isAdmin = senderID === adminID;

  // Admin Panel to view logs and user details
  if (args[0] === 'adminPanel' && isAdmin) {
    let logs = data.logs.join("\n");
    let users = Object.values(data.users).map(u => `Username: ${u.username}, Balance: ${u.balance}, Protection: ${u.protection ? 'Active' : 'Not Active'}`).join("\n");

    return api.sendMessage(`🔒 **Admin Panel** 🔒\n\n` +
      `**User Logs:**\n${logs}\n\n` +
      `**Registered Users:**\n${users}`, threadID, messageID);
  }

  // === Register Command ===
  if (args[0] === 'register') {
    const username = args[1];
    const password = args[2];

    if (!username || !password || password.length !== 3 || !/^\d+$/.test(password)) {
      return api.sendMessage("❌ Invalid username or password. Please ensure the password is a 3-digit number.", threadID, messageID);
    }

    if (data.users[senderID]) {
      return api.sendMessage("❌ You are already registered.", threadID, messageID);
    }

    // Register user and give free bonus of 600 coins
    data.users[senderID] = { username, password, loggedIn: false, balance: 1600, protection: false, lastClaimed: 0 }; // 1000 + 600 bonus
    data.logs.push(`User ${username} registered with a free bonus of 600 coins.`); // Log registration
    saveData();

    return api.sendMessage(`✅ Registration successful! You have received a free bonus of 600 coins. Your balance is now 1600 coins. Please log in using the username and your 3-digit password.`, threadID, messageID);
  }

  // === Login Command ===
  if (args[0] === 'login') {
    const username = args[1];
    const password = args[2];

    if (!username || !password) {
      return api.sendMessage("❌ Please provide a valid username and password.", threadID, messageID);
    }

    const userData = data.users[senderID];

    if (!userData) {
      return api.sendMessage("❌ You need to register first. Use 'register [username] [password]'.", threadID, messageID);
    }

    if (userData.username !== username || userData.password !== password) {
      return api.sendMessage("❌ Incorrect username or password.", threadID, messageID);
    }

    userData.loggedIn = true;
    data.logs.push(`User ${username} logged in.`); // Log login
    saveData();
    return api.sendMessage(`✅ Welcome ${username}! You are now logged in. Your balance is ${userData.balance} coins.`, threadID, messageID);
  }

  // === Logout Command ===
  if (args[0] === 'logout') {
    if (!user.loggedIn) {
      return api.sendMessage("❌ You are not logged in.", threadID, messageID);
    }

    user.loggedIn = false;
    data.logs.push(`User ${user.username} logged out.`); // Log logout
    saveData();
    return api.sendMessage(`✅ You have been logged out, ${user.username}.`, threadID, messageID);
  }

  // === Buy Protection Command ===
  if (args[0] === 'buyProtection') {
    if (!user.loggedIn) {
      return api.sendMessage("❌ You need to log in first.", threadID, messageID);
    }

    const protectionCost = 100; // ₱100 for protection

    if (user.balance < protectionCost) {
      return api.sendMessage(`❌ You don't have enough balance. Protection costs ₱${protectionCost}. Your balance is ${user.balance} coins.`, threadID, messageID);
    }

    // Deduct protection cost
    user.balance -= protectionCost;
    user.protection = true;
    data.logs.push(`User ${user.username} bought protection for ₱${protectionCost}.`); // Log protection purchase
    saveData();

    // Send notification to admin
    api.sendMessage(`📢 Admin, the user ${user.username} has successfully bought protection for ₱${protectionCost}.`, adminID);

    return api.sendMessage(`✅ Protection bought successfully! Your account is now protected.`, threadID, messageID);
  }

  // === Profile Details Command ===
  if (args[0] === 'profile') {
    if (!user.loggedIn) {
      return api.sendMessage("❌ You need to log in first.", threadID, messageID);
    }

    const protectionStatus = user.protection ? "Active" : "Not Active";
    return api.sendMessage(`👤 **Profile Details**:\n` +
      `Username: ${user.username}\n` +
      `Balance: ${user.balance} coins\n` +
      `Protection Status: ${protectionStatus}\n`, threadID, messageID);
  }

  // === Free Daily Coins Command ===
  if (args[0] === 'claimFree') {
    if (!user.loggedIn) {
      return api.sendMessage("❌ You need to log in first.", threadID, messageID);
    }

    // Check if 24 hours have passed since last claim
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - user.lastClaimed < twentyFourHours) {
      return api.sendMessage("❌ You can only claim free coins once every 24 hours.", threadID, messageID);
    }

    // Add free coins (100 coins)
    user.balance += 100;
    user.lastClaimed = now;
    data.logs.push(`User ${user.username} claimed 100 free coins.`); // Log free claim
    saveData();

    return api.sendMessage("✅ You have successfully claimed 100 free coins! Come back tomorrow for more.", threadID, messageID);
  }

  // === Save Settings Command (Modify Settings) ===
  if (args[0] === 'set' && user.loggedIn) {
    const settingName = args[1];
    const settingValue = args[2];

    if (!settingName || !settingValue) {
      return api.sendMessage("❌ You need to specify a setting and value. E.g., set theme dark.", threadID, messageID);
    }

    if (settingName === 'theme
