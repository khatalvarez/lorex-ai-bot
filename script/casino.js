const fs = require('fs');
const crypto = require('crypto');

module.exports.config = {
  name: 'casino',
  version: '3.0.0',
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: 'Persistent casino with loans, notifications & admin approval',
  usage: 'casino [command] [args]',
  credits: 'OpenAI + Custom'
};

const DATA_FILE = './data.json';
const ADMIN_ID = '1000123456789'; // Palitan ng admin ID(s)
const LOAN_LIMIT = 700;
const DAILY_AMOUNT = 900;
const COOLDOWN_MS = 5000;

let data = { users: {}, threads: [], pendingLoans: [] };
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE));
}
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
  const { senderID, threadID, messageID } = event;
  if (!data.threads.includes(threadID)) {
    data.threads.push(threadID);
    saveData();
  }

  if (!data.users[senderID]) {
    data.users[senderID] = { password: null, loggedIn: false, balance: 0, loan: 0, lastDaily: 0 };
  }
  const user = data.users[senderID];

  // Cooldown
  user.lastCommand = user.lastCommand || 0;
  if (Date.now() - user.lastCommand < COOLDOWN_MS) {
    return api.sendMessage('⏳ Please wait before using another command.', threadID, messageID);
  }
  user.lastCommand = Date.now();

  if (args.length === 0) {
    return api.sendMessage(
      `🎰 CASINO SANDRA SYSTEM\n` +
      `Commands:\n` +
      `• register [pwd]\n` +
      `• login [pwd]\n` +
      `• logout\n` +
      `• bank\n` +
      `• play\n` +
      `• daily\n` +
      `• loan\n` +
      `• loan-approve (admin only)\n` +
      `• games [page]\n` +
      `• support\n` +
      `• feedback [msg]`,
      threadID, messageID
    );
  }

  const cmd = args[0].toLowerCase();
  const param = args.slice(1).join(' ');

  // Register
  if (cmd === 'register') {
    if (user.password) return api.sendMessage('❌ Already has account.', threadID, messageID);
    if (!param) return api.sendMessage('❌ Provide a password.', threadID, messageID);
    user.password = hashPassword(param);
    user.loggedIn = true;
    user.balance = 100;
    saveData();
    return api.sendMessage('✅ Registered & logged in! Starting 100 coins.', threadID, messageID);
  }

  // Login
  if (cmd === 'login') {
    if (!user.password) return api.sendMessage('❌ No account. Register first.', threadID, messageID);
    if (user.loggedIn) return api.sendMessage('✅ Already logged in.', threadID, messageID);
    if (!param) return api.sendMessage('❌ Provide password.', threadID, messageID);
    if (user.password === hashPassword(param)) {
      user.loggedIn = true;
      saveData();
      return api.sendMessage('✅ Logged in!', threadID, messageID);
    } else {
      return api.sendMessage('❌ Wrong password.', threadID, messageID);
    }
  }

  // Logout
  if (cmd === 'logout') {
    if (!user.loggedIn) return api.sendMessage('❌ Not logged in.', threadID, messageID);
    user.loggedIn = false;
    saveData();
    return api.sendMessage('✅ Logged out.', threadID, messageID);
  }

  // Bank command (replaces balance)
  if (cmd === 'bank') {
    if (!user.loggedIn) return api.sendMessage('❌ Login first.', threadID, messageID);

    user.lastBank = user.lastBank || 0;
    const now = Date.now();
    const bankCooldown = 60 * 1000; // 1 minute

    let bonus = 0;
    if (now - user.lastBank >= bankCooldown) {
      bonus = 5;
      user.balance += bonus;
      user.lastBank = now;
    }

    saveData();

    const bankMsg =
      `🏦 **BANK STATUS**\n\n` +
      `💰 **Balance:** ${user.balance} coins\n` +
      `💳 **Loan:** ${user.loan} coins\n` +
      (bonus > 0
        ? `🎉 You earned **+${bonus} coins** for checking your bank!\n`
        : `⏳ No bonus yet. Try again later.`);

    return api.sendMessage(bankMsg, threadID, messageID);
  }

  // Play
  if (cmd === 'play') {
    if (!user.loggedIn) return api.sendMessage('❌ Login to play.', threadID, messageID);
    if (user.balance < 10) return api.sendMessage('❌ Not enough coins (10 needed).', threadID, messageID);
    user.balance -= 10;
    const slots = ['🍒','🍋','🍊','🍉','⭐','🔔'];
    const spin = Array.from({ length: 3 }, () => slots[Math.floor(Math.random() * slots.length)]);
    let msg = `🎰 You spun: ${spin.join(' | ')}\n`;
    if (spin[0] === spin[1] && spin[1] === spin[2]) {
      user.balance += 50;
      msg += '🎉 Jackpot! +50';
    } else if (new Set(spin).size <= 2) {
      user.balance += 20;
      msg += '🎉 Win! +20';
    } else {
      msg += '❌ No win.';
    }
    msg += `\n💰 Balance: ${user.balance}`;
    saveData();
    return api.sendMessage(msg, threadID, messageID);
  }

  // Daily
  if (cmd === 'daily') {
    if (!user.loggedIn) return api.sendMessage('❌ Login first.', threadID, messageID);
    const now = Date.now(), dayMs = 24*60*60*1000;
    if (now - user.lastDaily < dayMs) {
      const m = Math.ceil((dayMs - (now - user.lastDaily)) / (60*1000));
      return api.sendMessage(`⏳ Try again in ${m} min.`, threadID, messageID);
    }
    user.balance += DAILY_AMOUNT;
    user.lastDaily = now;
    saveData();
    return api.sendMessage(`🎁 Received ${DAILY_AMOUNT} coins!`, threadID, messageID);
  }

  // Loan
  if (cmd === 'loan') {
    if (!user.loggedIn) return api.sendMessage('❌ Login first.', threadID, messageID);
    if (user.loan >= LOAN_LIMIT) return api.sendMessage(`❌ Loan limit reached (${LOAN_LIMIT}).`, threadID, messageID);
    data.pendingLoans.push(senderID);
    saveData();
    notifyAllThreads(api, `💳 @${senderID} requested a loan. Waiting admin approval via "casino loan-approve".`);
    return api.sendMessage('✅ Loan requested. Await admin approval.', threadID, messageID);
  }

  // Loan approval (admin)
  if (cmd === 'loan-approve') {
    if (senderID !== 61577040643519) return api.sendMessage('❌ Admin only.', threadID, messageID);
    if (!data.pendingLoans.length) return api.sendMessage('✅ No pending loan requests.', threadID, messageID);
    for (const uid of data.pendingLoans) {
      const u = data.users[uid];
      const amt = LOAN_LIMIT - (u.loan || 0);
      u.loan = LOAN_LIMIT;
      u.balance += amt;
    }
    data.pendingLoans = [];
    saveData();
    notifyAllThreads(api, `✅ Admin approved all pending loans. Borrowers received up to ${LOAN_LIMIT} coins each.`);
    return api.sendMessage('✅ Approved all loans.', threadID, messageID);
  }

  // Games command
  if (cmd === 'games') {
    const page = parseInt(args[1]) || 1;
    const games = [
      "The Legend of Zelda: Breath of the Wild", "Elden Ring", "Red Dead Redemption 2",
      "The Witcher 3: Wild Hunt", "God of War:
