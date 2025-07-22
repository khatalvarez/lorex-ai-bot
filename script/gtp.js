const fs = require('fs');
const path = './data/users.json'; // File to store user data

/**
 * 🚀 GTP Casino System 🚀
 * Moto: Play smart, win big! 🎰💰
 * Developed by Omega Team
 */

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
let isCasinoActive = true; 
let isLoanSystemActive = true; 
let isGameSystemActive = true; 
let isNotificationsActive = true; 
let isMaintenanceModeActive = false; 

// Profile Upgrade System: Levels 1 to 40
const MAX_LEVEL = 40;

module.exports.config = {
  name: 'gtpCasino',
  version: '1.0.0',
  hasPermission: 0,
  description: 'GTP Casino with profile upgrades, games, balance, and bonuses',
  usages: 'gtpCasino [command]',
  credits: 'Omega Team',
  cooldowns: 0,
  dependencies: {}
};

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

function checkMaintenanceMode(api, threadID, messageID) {
  if (isMaintenanceModeActive) {
    api.sendMessage('❌ GTP Casino is currently under maintenance. Please try again later.', threadID, messageID);
    return true;
  }
  return false;
}

module.exports.register = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const [username, number] = args;

  if (checkMaintenanceMode(api, threadID, messageID)) return;

  if (!username || !number) {
    return api.sendMessage('❌ Please provide a username and a 3-digit number.\nExample: register john 123', threadID, messageID);
  }

  if (users[username]) {
    return api.sendMessage('❌ Username already exists, please try a different one.', threadID, messageID);
  }

  if (!/^\d{3}$/.test(number)) {
    return api.sendMessage('❌ The number must be exactly 3 digits.', threadID, messageID);
  }

  users[username] = {
    number,
    balance: 900, // Free bonus
    level: 1,
    xp: 0,
    profile: {
      name: username,
      status: 'New User',
      skills: 'Beginner',
      upgrades: []
    },
    loanApplied: 0,
    protectionPaid: false,
    premiumPaid: false
  };

  saveUserData();

  return api.sendMessage(`✅ User ${username} registered successfully! You received a free bonus of 900.`, threadID, messageID);
};

module.exports.playGame = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const [username, gameChoice] = args;

  if (checkMaintenanceMode(api, threadID, messageID)) return;

  if (!users[username]) {
    return api.sendMessage('❌ User not found. Please register first.', threadID, messageID);
  }

  if (!games[gameChoice]) {
    return api.sendMessage('❌ Invalid game. Options: work1, work2, shootBallon, spinWheel.', threadID, messageID);
  }

  if (!isGameSystemActive) {
    return api.sendMessage('❌ The game system is currently disabled by the admin.', threadID, messageID);
  }

  users[username].balance += games[gameChoice];
  saveUserData();

  const gameMsg = `🎮 ${username} played ${gameChoice} and earned $${games[gameChoice]}!`;

  if (isNotificationsActive) {
    for (const groupID of groups) {
      api.sendMessage(gameMsg, groupID);
    }
  }

  return api.sendMessage(`✅ You earned $${games[gameChoice]}! Current balance: $${users[username].balance}`, threadID, messageID);
};

// ... (other commands like loan, buy protection, buy premium, feedback, accessControl, developerInfo etc.)

