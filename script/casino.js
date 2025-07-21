const fs = require('fs');
const crypto = require('crypto');

module.exports.config = {
  name: 'casino',
  version: '3.0.1',
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: 'Persistent casino with loans, notifications & admin approval',
  usage: 'casino [command] [args]',
  credits: 'OpenAI + Custom'
};

const DATA_FILE = './data.json';
const ADMIN_ID = '61575137262643'; // ✅ Updated Admin ID
const LOAN_LIMIT = 700;
const DAILY_AMOUNT = 900;
const COOLDOWN_MS = 5000;

let data = { users: {}, threads: [], pendingLoans: [] };
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (err) {
    console.error('❌ Failed to load data file. Using fallback.', err);
    data = { users: {}, threads: [], pendingLoans: [] };
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Failed to save data file.', err);
  }
}

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function notifyAllThreads(api, message) {
  for (const tid of data.threads) {
    api.sendMessage(message, tid);
  }
}

module.exports.run = async function({ api, event, args }) {
  try {
    const { senderID, threadID, messageID } = event;
    if (!data.threads.includes(threadID)) {
      data.threads.push(threadID);
      saveData();
    }

    if (!data.users[senderID]) {
      data.users[senderID] = {
        password: null,
        loggedIn: false,
        balance: 0,
        loan: 0,
        lastDaily: 0
      };
    }

    const user = data.users[senderID];
    user.lastCommand = user.lastCommand || 0;
    if (Date.now() - user.lastCommand < COOLDOWN_MS) {
      return api.sendMessage('⏳ Please wait before using another command.', threadID, messageID);
    }
    user.lastCommand = Date.now();

    if (args.length === 0) {
      return api.sendMessage(
        `🎰 WELCOME TO CASINO 2.0\n` +
        `🧾 Commands:\n` +
        `• register [password]\n` +
        `• login [password]\n` +
        `• logout\n` +
        `• bank\n` +
        `• play\n` +
        `• daily\n` +
        `• loan\n` +
        `• loan-approve (admin only)\n` +
        `• games [page]\n` +
        `• support\n` +
        `• feedback [message]`,
        threadID, messageID
      );
    }

    const cmd = args[0].toLowerCase();
    const param = args.slice(1).join(' ');

    // Register/Login/Logout Commands
    if (cmd === 'register') {
      if (user.password) return api.sendMessage('❌ May account ka na.', threadID, messageID);
      if (!param) return api.sendMessage('❌ Ibigay ang password mo.', threadID, messageID);
      user.password = hashPassword(param);
      user.loggedIn = true;
      user.balance = 100;
      saveData();
      return api.sendMessage('✅ Registered na. May 100 coins ka.', threadID, messageID);
    }

    if (cmd === 'login') {
      if (!user.password) return api.sendMessage('❌ Wala kang account. Register muna.', threadID, messageID);
      if (user.loggedIn) return api.sendMessage('✅ Logged in ka na.', threadID, messageID);
      if (!param) return api.sendMessage('❌ Ibigay ang password mo.', threadID, messageID);
      if (user.password === hashPassword(param)) {
        user.loggedIn = true;
        saveData();
        return api.sendMessage('✅ Logged in!', threadID, messageID);
      } else {
        return api.sendMessage('❌ Mali ang password.', threadID, messageID);
      }
    }

    if (cmd === 'logout') {
      if (!user.loggedIn) return api.sendMessage('❌ Di ka naka-login.', threadID, messageID);
      user.loggedIn = false;
      saveData();
      return api.sendMessage('✅ Logged out.', threadID, messageID);
    }

    // Bank
    if (cmd === 'bank') {
      if (!user.loggedIn) return api.sendMessage('❌ Login muna.', threadID, messageID);
      user.lastBank = user.lastBank || 0;
      const now = Date.now();
      const cooldown = 60 * 1000;

      let bonus = 0;
      if (now - user.lastBank >= cooldown) {
        bonus = 5;
        user.balance += bonus;
        user.lastBank = now;
      }
      saveData();
      return api.sendMessage(
        `🏦 BALANCE: ${user.balance} coins\n` +
        `💳 LOAN: ${user.loan} coins\n` +
        (bonus > 0 ? `🎁 +${bonus} coins bonus!` : `⏳ Wait for bank bonus.`),
        threadID, messageID
      );
    }

    // Play
    if (cmd === 'play') {
      if (!user.loggedIn) return api.sendMessage('❌ Login muna.', threadID, messageID);
      if (user.balance < 10) return api.sendMessage('❌ Kulang coins mo (10 needed).', threadID, messageID);

      user.balance -= 10;
      const spin = ['🍒','🍋','🍊','🍉','⭐','🔔'].map(() =>
        ['🍒','🍋','🍊','🍉','⭐','🔔'][Math.floor(Math.random() * 6)]
      );
      let result = `🎰 Result: ${spin.join(' | ')}\n`;

      if (spin[0] === spin[1] && spin[1] === spin[2]) {
        user.balance += 50;
        result += '🎉 JACKPOT +50 coins!';
      } else if (new Set(spin).size <= 2) {
        user.balance += 20;
        result += '🎉 Panalo +20 coins!';
      } else {
        result += '❌ Talo.';
      }
      result += `\n💰 Balance: ${user.balance}`;
      saveData();
      return api.sendMessage(result, threadID, messageID);
    }

    // Daily
    if (cmd === 'daily') {
      if (!user.loggedIn) return api.sendMessage('❌ Login muna.', threadID, messageID);
      const now = Date.now();
      if (now - user.lastDaily < 86400000) {
        return api.sendMessage('⏳ Bukas ulit. Daily reward nakuha mo na.', threadID, messageID);
      }
      user.balance += DAILY_AMOUNT;
      user.lastDaily = now;
      saveData();
      return api.sendMessage(`🎁 +${DAILY_AMOUNT} daily coins received!`, threadID, messageID);
    }

    // Loan
    if (cmd === 'loan') {
      if (!user.loggedIn) return api.sendMessage('❌ Login muna.', threadID, messageID);
      if (user.loan >= LOAN_LIMIT) return api.sendMessage(`❌ Loan max (${LOAN_LIMIT}).`, threadID, messageID);
      if (data.pendingLoans.includes(senderID)) return api.sendMessage('⏳ Pending approval na.', threadID, messageID);
      data.pendingLoans.push(senderID);
      saveData();
      notifyAllThreads(api, `💳 ${senderID} requested loan. Admin use "casino loan-approve" to approve.`);
      return api.sendMessage('✅ Loan requested. Hintayin ang admin.', threadID, messageID);
    }

    // Admin Loan Approve
    if (cmd === 'loan-approve') {
      if (senderID !== ADMIN_ID) return api.sendMessage('❌ Admin only.', threadID, messageID);
      if (!data.pendingLoans.length) return api.sendMessage('✅ Walang pending loan.', threadID, messageID);
      for (const uid of data.pendingLoans) {
        const u = data.users[uid];
        const diff = LOAN_LIMIT - u.loan;
        u.loan = LOAN_LIMIT;
        u.balance += diff;
      }
      data.pendingLoans = [];
      saveData();
      notifyAllThreads(api, `✅ Lahat ng loan na-approve. Up
