const fs = require('fs');
const crypto = require('crypto');

module.exports.config = {
  name: 'casino',
  version: '3.5.0',
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: 'Casino system with 40+ games, settings, and Sandra AI Support v2.1.4',
  usage: 'casino [command]',
  credits: 'OpenAI + Enhanced by You'
};

const DATA_FILE = './data.json';
const ADMIN_ID = '61575137262643';
const LOAN_LIMIT = 700;
const DAILY_AMOUNT = 900;
const COOLDOWN_MS = 4000;
const GAME_LIST = Array.from({ length: 40 }, (_, i) => `Game ${i + 1}`);

let data = { users: {}, settings: {}, threads: [], pendingLoans: [] };
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
    help: "🤖 Hello! I'm Sandra v2.1.4 — your casino assistant. Use `casino` to see commands. For account issues, use `casino support`.",
    error: "⚠️ If you encountered a bug, please report it with `casino feedback [your issue]`.",
    games: `🎮 You can play any of the following games:\n${GAME_LIST.map((g, i) => `${i + 1}. ${g}`).join('\n')}`
  };

  query = query.toLowerCase();
  if (query.includes("help")) return responses.help;
  if (query.includes("bug") || query.includes("error")) return responses.error;
  if (query.includes("game") || query.includes("play")) return responses.games;
  return "🤖 Sandra v2.1.4: I’m not sure how to help with that. Try `casino support`.";
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

  // === Main Menu
  if (!cmd) {
    return api.sendMessage(
      `🎰 Welcome to Casino 3.5.0\n` +
      `🧾 Commands:\n` +
      `• register [password]\n` +
      `• login [password]\n` +
      `• logout\n` +
      `• play [game number 1-40]\n` +
      `• bank\n` +
      `• daily\n` +
      `• loan / loan-approve\n` +
      `• settings [key] [value]\n` +
      `• support [question]\n` +
      `• feedback [message]`,
      threadID, messageID
    );
  }

  // === Authentication ===
  if (cmd === 'register') {
    if (user.password) return api.sendMessage('❌ May account ka na.', threadID, messageID);
    if (!param) return api.sendMessage('❌ Please provide a password.', threadID, messageID);
    user.password = hashPassword(param);
    user.loggedIn = true;
    user.balance = 100;
    saveData();
    return api.sendMessage('✅ Registered! You got 100 coins.', threadID, messageID);
  }

  if (cmd === 'login') {
    if (!user.password) return api.sendMessage('❌ No account found. Register first.', threadID, messageID);
    if (user.loggedIn) return api.sendMessage('✅ Already logged in.', threadID, messageID);
    if (!param) return api.sendMessage('❌ Please provide your password.', threadID, messageID);
    if (hashPassword(param) === user.password) {
      user.loggedIn = true;
      saveData();
      return api.sendMessage('✅ Logged in successfully!', threadID, messageID);
    }
    return api.sendMessage('❌ Incorrect password.', threadID, messageID);
  }

  if (cmd === 'logout') {
    return api.sendMessage('❓ Confirm logout? Reply with "yes" within 15 seconds.', threadID, (err, info) => {
      const listener = (reply) => {
        if (reply.senderID === senderID && reply.body.toLowerCase() === 'yes') {
          user.loggedIn = false;
          saveData();
          api.sendMessage('✅ Logged out.', threadID);
        }
        api.removeListener('message', listener);
      };
      api.listen(listener);
    });
  }

  // === Game Play
  if (cmd === 'play') {
    if (!user.loggedIn) return api.sendMessage('❌ Login required.', threadID, messageID);
    const num = parseInt(args[1]);
    if (isNaN(num) || num < 1 || num > 40)
      return api.sendMessage('🎮 Invalid game. Use a number from 1 to 40.', threadID, messageID);

    const reward = Math.floor(Math.random() * 80) + 20;
    user.balance += reward;
    saveData();
    return api.sendMessage(`🎲 Played Game ${num}. You earned ${reward} coins!\n💰 Balance: ${user.balance}`, threadID, messageID);
  }

  // === Bank
  if (cmd === 'bank') {
    if (!user.loggedIn) return api.sendMessage('❌ Login first.', threadID, messageID);
    return api.sendMessage(`🏦 Balance: ${user.balance}\n💳 Loan: ${user.loan}`, threadID, messageID);
  }

  // === Daily Reward
  if (cmd === 'daily') {
    if (!user.loggedIn) return api.sendMessage('❌ Login first.', threadID, messageID);
    const now = Date.now();
    if (now - user.lastDaily < 86400000)
      return api.sendMessage('⏳ You already claimed today.', threadID, messageID);
    user.balance += DAILY_AMOUNT;
    user.lastDaily = now;
    saveData();
    return api.sendMessage(`🎁 Daily reward: +${DAILY_AMOUNT} coins!`, threadID, messageID);
  }

  // === Loan
  if (cmd === 'loan') {
    if (!user.loggedIn) return api.sendMessage('❌ Login required.', threadID, messageID);
    if (user.loan >= LOAN_LIMIT) return api.sendMessage('❌ Loan limit reached.', threadID, messageID);
    if (data.pendingLoans.includes(senderID)) return api.sendMessage('⏳ Loan pending approval.', threadID, messageID);
    data.pendingLoans.push(senderID);
    saveData();
    notifyAllThreads(api, `💳 ${senderID} requested a loan. Admin: use "casino loan-approve".`);
    return api.sendMessage('✅ Loan request sent to admin.', threadID, messageID);
  }

  if (cmd === 'loan-approve') {
    if (senderID !== ADMIN_ID) return api.sendMessage('❌ Admin only.', threadID, messageID);
    if (!data.pendingLoans.length) return api.sendMessage('✅ No pending loans.', threadID, messageID);
    for (const uid of data.pendingLoans) {
      const u = data
