const fs = require('fs');
const crypto = require('crypto');
const moment = require('moment');

module.exports.config = {
  name: 'casino',
  version: '3.1.7',
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: 'Casino system with 50+ new features, including buy protection, voucher codes, and admin approval.',
  usage: 'casino [command]',
  credits: 'Casino Team + Enhanced by You'
};

const DATA_FILE = './data.json';
const ADMIN_ID = '61575137262643'; // Admin UID
const LOAN_LIMIT = 1000;
const DAILY_AMOUNT = 1000;
const COOLDOWN_MS = 3000;
const PROTECTION_COST = 100; // Price for buying protection
const VOUCHER_CODE_AMOUNT = 900; // Voucher coins amount
const VOUCHER_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours expiration time in milliseconds
const VOUCHER_TIME = '01:30'; // Time to send voucher notification

const GAME_LIST = [
  "1. Blackjack", "2. Baccarat", "3. Roulette", "4. Craps", "5. Sic Bo", "6. Three Card Poker", "7. Caribbean Stud Poker", "8. Pai Gow Poker", 
  "9. Let It Ride", "10. Casino War", "11. Texas Hold’em", "12. Omaha Poker", "13. Seven Card Stud", "14. Five Card Draw", "15. Chinese Poker", 
  "16. Classic Slots", "17. Video Slots", "18. Progressive Jackpot Slots", "19. Megaways Slots", "20. Fruit Machines", "21. Keno", "22. Bingo", 
  "23. Wheel of Fortune", "24. Big Six Wheel", "25. Scratch Cards", "26. Live Dealer Games", "27. Virtual Sports Betting", "28. Online Lottery Games", 
  "29. Crash Games", "30. Skill-Based Arcade Games"
];

let data = { 
  users: {}, 
  settings: {}, 
  threads: [], 
  pendingLoans: [], 
  feedbacks: [], 
  achievements: [],
  vouchers: [] // Track voucher codes and expiration times
};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (err) {
    console.error('❌ Error loading data file.', err);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Could not save data.', err);
  }
}

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function notifyAllThreads(api, msg) {
  for (const tid of data.threads) {
    api.sendMessage(msg, tid);
  }
}

function sandraSupportAI(query) {
  const responses = {
    help: "🤖 Hello! I'm Sandra v3.1.7 — your casino assistant. Use `casino` to see commands. For account issues, use `casino support`.",
    error: "⚠️ If you encountered a bug, please report it with `casino feedback [your issue]`.",
    games: `🎮 You can play any of the following games:\n${GAME_LIST.join('\n')}`,
    feedback: "💬 Please submit your feedback, and I'll forward it to all groups for review."
  };

  query = query.toLowerCase();
  if (query.includes("help")) return responses.help;
  if (query.includes("bug") || query.includes("error")) return responses.error;
  if (query.includes("game") || query.includes("play")) return responses.games;
  if (query.includes("feedback")) return responses.feedback;
  return "🤖 Sandra v3.1.7: I’m not sure how to help with that. Try `casino support`.";
}

function checkVoucherExpiry() {
  const now = Date.now();
  data.vouchers = data.vouchers.filter(voucher => now - voucher.timestamp < VOUCHER_EXPIRY_MS);
  saveData();
}

module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  // Add thread to list
  if (!data.threads.includes(threadID)) {
    data.threads.push(threadID);
    saveData();
  }

  // Initialize user data
  if (!data.users[senderID]) {
    data.users[senderID] = {
      password: null,
      loggedIn: false,
      balance: 0,
      loan: 0,
      protection: false,
      settings: {},
      lastDaily: 0,
      lastCommand: 0
    };
  }

  const user = data.users[senderID];

  if (Date.now() - user.lastCommand < COOLDOWN_MS) {
    return api.sendMessage('⏳ Please wait a bit.', threadID, messageID);
  }
  user.lastCommand = Date.now();

  const cmd = args[0]?.toLowerCase() || '';
  const param = args.slice(1).join(' ');

  // === Main Menu with Box
  if (!cmd) {
    return api.sendMessage(
      `🎰 **Welcome to Casino 3.1.7**\n` +
      `🧾 **Commands**:\n` +
      `\`\`\` 
      register [password]
      login [password]
      logout
      play [game number 1-30]
      bank
      daily
      loan / loan-approve
      settings [key] [value]
      support [question]
      feedback [message]
      buy protection
      \`\`\``,
      threadID, messageID
    );
  }

  // === Register/Login ===
  if (cmd === 'register' || cmd === 'login') {
    if (!param) return api.sendMessage('❌ Please provide a password.', threadID, messageID);
    
    // Register new user or login existing user
    if (cmd === 'register') {
      if (user.password) return api.sendMessage('❌ Account already exists.', threadID, messageID);
      user.password = hashPassword(param);
      user.loggedIn = true;
      user.balance = 100; // Default balance for new users
    } else {
      if (user.loggedIn) return api.sendMessage('✅ Already logged in.', threadID, messageID);
      if (hashPassword(param) === user.password) {
        user.loggedIn = true;
      } else {
        return api.sendMessage('❌ Incorrect password.', threadID, messageID);
      }
    }

    // Issue voucher code for the user if they are logging in or registering
    const voucherCode = `${Date.now()}-VOUCHER`; // Generate unique voucher code
    user.balance += VOUCHER_CODE_AMOUNT;
    data.vouchers.push({ userID: senderID, timestamp: Date.now() });

    // Notify all group chats about the voucher code
    const voucherMsg = `🎉 **Voucher Code: ${voucherCode}**\nYou have received **900 coins**! This voucher will expire in **4 hours**.`;
    notifyAllThreads(api, voucherMsg);

    saveData();
    return api.sendMessage(`✅ Welcome! You received 900 free coins via voucher. Voucher expires in 4 hours.`, threadID, messageID);
  }

  // === Buy Protection ===
  if (cmd === 'buy protection') {
    if (!user.loggedIn) return api.sendMessage('❌ Login required.', threadID, messageID);
    if (user.protection) return api.sendMessage('❌ You already have protection.', threadID, messageID);
    if (user.balance < PROTECTION_COST) return api.sendMessage(`❌ You don't have enough coins for protection. You need ${PROTECTION_COST} coins.`, threadID, messageID);

    // Deduct protection cost from user
    user.balance -= PROTECTION_COST;
    saveData();

    // Transfer protection cost to admin
    if (!data.users[ADMIN_ID]) data.users[ADMIN_ID] = { balance: 0 };
    data.users[ADMIN_ID].balance += PROTECTION_COST;
    saveData();

    // Send notification to all threads
    const notificationMsg = `💎 **${senderID} has purchased protection for $${PROTECTION_COST}!** Please wait for admin approval
