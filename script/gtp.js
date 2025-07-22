const fs = require('fs');
const path = './data/users.json'; // File to store user data

// Check if the file exists, if not, create it
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({}), 'utf-8');
}

let users = JSON.parse(fs.readFileSync(path, 'utf-8')); // Load user data from file

const adminID = '61577040643519'; // Admin ID for approval
const maxLoanLimit = 800000; // Loan limit of 800K
const groups = ['1234567890', '9876543210']; // Example groups for broadcasting feedback

const games = {
  'work1': 800,   // Work 1: Price = 800
  'work2': 400,   // Work 2: Price = 400
  'shootBallon': 400,   // Shoot Ballon: Price = 400
  'spinWheel': 200,     // Spin Wheel: Price = 200
};

// Access Control Flags
let isCasinoActive = true; // Flag to turn casino features on or off
let isLoanSystemActive = true; // Flag to turn loan system on or off
let isGameSystemActive = true; // Flag to turn games system on or off
let isNotificationsActive = true; // Flag to send notifications to all GCs
let isMaintenanceModeActive = false; // Flag to indicate maintenance mode

// Profile Upgrade System: Levels from 1 to 40
const MAX_LEVEL = 40;

module.exports.config = {
  name: 'gtpCasino',
  version: '1.0.0',
  hasPermission: 0, // Everyone can use this
  description: 'GTP Casino with profile upgrades, games, balance, and bonuses',
  usages: 'gtpCasino [command]',
  credits: 'Omega Team',
  cooldowns: 0,
  dependencies: {}
};

// Save user data to the JSON file
function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users), 'utf-8');
}

// Developer Info Command
module.exports.developerInfo = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const developerMessage = `
    🔧 GTP Casino Developer Info 🔧
    
    This casino system was developed by the talented team at GTP Casino.
    
    🖥️ Developer: Haraamihan
    📱 Facebook: [Click here to visit the developer's Facebook page](https://www.facebook.com/haraamihan.25371)
    
    If you have any issues or questions about the casino, feel free to contact the developer directly. ✉️
  `;

  return api.sendMessage(developerMessage, threadID, messageID);
};

// GTP Access Commands for Admin to Enable/Disable Features
module.exports.accessControl = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const adminSenderID = event.senderID;

  // Check if the sender is admin
  if (adminSenderID !== adminID) {
    return api.sendMessage('❌ Only the admin can change access settings.', threadID, messageID);
  }

  const [feature, action] = args;

  if (!feature || !action) {
    return api.sendMessage('❌ Please provide the feature and action (on/off). Example: `accessControl games on`', threadID, messageID);
  }

  switch (feature.toLowerCase()) {
    case 'casino':
      isCasinoActive = action.toLowerCase() === 'on';
      return api.sendMessage(`✅ Casino system is now ${isCasinoActive ? 'ON' : 'OFF'}.`, threadID, messageID);
    
    case 'loan':
      isLoanSystemActive = action.toLowerCase() === 'on';
      return api.sendMessage(`✅ Loan system is now ${isLoanSystemActive ? 'ON' : 'OFF'}.`, threadID, messageID);
    
    case 'games':
      isGameSystemActive = action.toLowerCase() === 'on';
      return api.sendMessage(`✅ Game system is now ${isGameSystemActive ? 'ON' : 'OFF'}.`, threadID, messageID);

    case 'notifications':
      isNotificationsActive = action.toLowerCase() === 'on';
      return api.sendMessage(`✅ Notifications system is now ${isNotificationsActive ? 'ON' : 'OFF'}.`, threadID, messageID);

    case 'maintenance':
      isMaintenanceModeActive = action.toLowerCase() === 'on';
      if (isMaintenanceModeActive) {
        // If maintenance mode is ON, disable all features
        isCasinoActive = false;
        isLoanSystemActive = false;
        isGameSystemActive = false;
        isNotificationsActive = false;
      } else {
        // If maintenance mode is OFF, re-enable all features
        isCasinoActive = true;
        isLoanSystemActive = true;
        isGameSystemActive = true;
        isNotificationsActive = true;
      }
      return api.sendMessage(`✅ GTP Casino maintenance mode is now ${isMaintenanceModeActive ? 'ON' : 'OFF'}.`, threadID, messageID);

    default:
      return api.sendMessage('❌ Invalid feature. Available features: casino, loan, games, notifications, maintenance.', threadID, messageID);
  }
};

// Maintenance Mode Check Before Any Action
function checkMaintenanceMode(api, threadID, messageID) {
  if (isMaintenanceModeActive) {
    return api.sendMessage('❌ GTP Casino is currently under maintenance. Please try again later.', threadID, messageID);
  }
}

// Register a new user with profile details
module.exports.register = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const [username, number] = args;

  // Check if casino is under maintenance
  checkMaintenanceMode(api, threadID, messageID);
  if (isMaintenanceModeActive) return;

  if (users[username]) {
    return api.sendMessage('❌ Username already exists, please try a different one.', threadID, messageID);
  }

  if (!/^\d{3}$/.test(number)) {
    return api.sendMessage('❌ The number must be 3 digits.', threadID, messageID);
  }

  // Register the user and add a free bonus of 900
  users[username] = {
    number,
    balance: 900,  // Free bonus of 900 upon registration
    level: 1,      // Default level
    xp: 0,         // Initial XP
    profile: {     // Basic profile information
      name: username,
      status: 'New User',
      skills: 'Beginner',
      upgrades: []
    },
    loanApplied: 0, // Amount of loan requested
    protectionPaid: false, // If user paid the $100 protection fee
    premiumPaid: false, // If user paid the $100 premium
  };

  // Save updated user data to the file
  saveUserData();

  return api.sendMessage(`✅ User ${username} registered successfully! You've received a free bonus of 900. Your profile is set to level 1.`, threadID, messageID);
};

// Play Game - Adds balance based on the game played
module.exports.playGame = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const [username, gameChoice] = args;

  // Check if casino is under maintenance
  checkMaintenanceMode(api, threadID, messageID);
  if (isMaintenanceModeActive) return;

  if (!users[username]) {
    return api.sendMessage('❌ User not found. Please log in or register first.', threadID, messageID);
  }

  if (!games[gameChoice]) {
    return api.sendMessage('❌ Invalid game. Choose from work1, work2, shootBallon, or spinWheel.', threadID, messageID);
  }

  if (!isGameSystemActive) {
    return api.sendMessage('❌ The game system is currently disabled by the admin.', threadID, messageID);
  }

  // Add game price to balance
  try {
    users[username].balance += games[gameChoice];
    const gameMessage = `🎮 ${username} has played ${gameChoice} and earned $${games[gameChoice]}!`;

    // Broadcast message to all groups if notifications are active
    if (isNotificationsActive) {
      for (const group
