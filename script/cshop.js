const fs = require('fs');
const path = require('path');

const userDataPath = path.resolve(__dirname, 'user.json');
const ADMIN_UID = '61575137262643';

const LOAN_LIMIT = 500000;
const LOAN_INTEREST_RATE = 0.05; // 5%
const BONUS_AMOUNT = 600;
const BONUS_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in ms
const POST_REWARD = 400;

function loadUserData() {
  if (!fs.existsSync(userDataPath)) return {};
  const data = fs.readFileSync(userDataPath, 'utf8');
  return JSON.parse(data || '{}');
}

function saveUserData(data) {
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

function boxMessage(text, type = 'info') {
  const emojis = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    cool: '⏳',
    bonus: '🎁',
    loan: '💰',
    profile: '📊',
    social: '📱',
  };
  const emoji = emojis[type] || emojis.info;
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length));
  const top = `╔═ ${emoji} ${'═'.repeat(maxLength)} ═╗`;
  const bottom = `╚${'═'.repeat(maxLength + 4)}╝`;
  const middle = lines.map(line => `║ ${line}${' '.repeat(maxLength - line.length)} ║`).join('\n');
  return [top, middle, bottom].join('\n');
}

function initUser(data, userId) {
  if (!data[userId]) {
    data[userId] = {
      balance: 1000,
      inventory: {},
      loan: 0,
      loanInterest: 0,
      workers: [],
      lastCollect: 0,
      premium: false,
      protection: false,
      history: [],
      lastBonus: 0,
      posts: [],
    };
  }
}

function addToHistory(userId, message) {
  const data = loadUserData();
  initUser(data, userId);
  const entry = `[${new Date().toLocaleString()}] ${message}`;
  data[userId].history.push(entry);
  if (data[userId].history.length > 20) data[userId].history.shift();
  saveUserData(data);
}

function buyPremium(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const price = 500;
  if (data[userId].premium) return boxMessage('May premium ka na! 🎉', 'success');
  if (data[userId].balance < price) return boxMessage('Kulang pera mo para sa premium (₱500).', 'error');
  data[userId].balance -= price;
  data[userId].premium = true;
  saveUserData(data);
  addToHistory(userId, '🎉 Naging PREMIUM Member');
  return boxMessage(`🎉 Premium Activated!\n\n𝐁𝐞𝐧𝐞𝐟𝐢𝐭𝐬:\n- 2x earnings\n- Exclusive investments\n- Higher rewards\n- Priority support\n- Advanced portfolio tools`, 'success');
}

function buyProtection(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const price = 300;
  if (data[userId].protection) return boxMessage('May protection ka na! 🛡️', 'success');
  if (data[userId].balance < price) return boxMessage('Kulang pera mo para sa protection (₱300).', 'error');
  data[userId].balance -= price;
  data[userId].protection = true;
  saveUserData(data);
  addToHistory(userId, '🛡️ Bumili ng Protection');
  return boxMessage('🛡️ Protection Activated!', 'success');
}

function userProfile(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const u = data[userId];
  return boxMessage(`
Balance: ₱${u.balance}
Loan Principal: ₱${u.loan}
Loan Interest: ₱${u.loanInterest.toFixed(2)}
Premium: ${u.premium ? '✅' : '❌'}
Protection: ${u.protection ? '✅' : '❌'}
Workers: ${u.workers.length}
Inventory: ${Object.keys(u.inventory).length} item(s)
Posts: ${u.posts.length}`, 'profile');
}

function showHistory(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const history = data[userId].history.slice(-10).reverse().join('\n');
  return boxMessage(history ? `Transaction History:\n${history}` : 'Walang history.', 'info');
}

function resetAllData(senderId) {
  if (senderId !== ADMIN_UID) return boxMessage('Admin lang ang pwedeng mag-reset!', 'error');
  saveUserData({});
  return boxMessage('Lahat ng CSHOP data ay ni-reset! ⚠️', 'warning');
}

function takeLoan(userId, amountStr) {
  const data = loadUserData();
  initUser(data, userId);
  const amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) return boxMessage('Invalid loan amount.', 'error');
  if (data[userId].loan + amount > LOAN_LIMIT) return boxMessage(`Loan limit exceeded! Limit is ₱${LOAN_LIMIT}.`, 'error');
  const interest = amount * LOAN_INTEREST_RATE;
  data[userId].loan += amount;
  data[userId].loanInterest += interest;
  data[userId].balance += amount;
  saveUserData(data);
  addToHistory(userId, `Nangutang ng ₱${amount} with interest ₱${interest.toFixed(2)}`);
  return boxMessage(`💰 Humiram ka ng ₱${amount}.\nInterest: ₱${interest.toFixed(2)}\nKabuuang babayaran: ₱${(amount+interest).toFixed(2)}`, 'loan');
}

function payLoan(userId, amountStr) {
  const data = loadUserData();
  initUser(data, userId);
  const amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) return boxMessage('Invalid payment amount.', 'error');
  if (data[userId].loan <= 0) return boxMessage('Walang utang na kailangang bayaran.', 'info');
  if (data[userId].balance < amount) return boxMessage('Kulang pera mo para magbayad.', 'error');

  let payPrincipal = 0;
  let payInterest = 0;

  if (amount >= data[userId].loan + data[userId].loanInterest) {
    // Full payment
    payPrincipal = data[userId].loan;
    payInterest = data[userId].loanInterest;
  } else if (amount <= data[userId].loanInterest) {
    // Bayad muna interest
    payInterest = amount;
  } else {
    payInterest = data[userId].loanInterest;
    payPrincipal = amount - payInterest;
  }

  data[userId].loan -= payPrincipal;
  data[userId].loanInterest -= payInterest;
  data[userId].balance -= amount;

  // Transfer principal payment to admin balance (original loan amount)
  initUser(data, ADMIN_UID);
  data[ADMIN_UID].balance += payPrincipal;

  saveUserData(data);
  addToHistory(userId, `Nagbayad ng ₱${amount} sa loan (Principal: ₱${payPrincipal.toFixed(2)}, Interest: ₱${payInterest.toFixed(2)})`);

  return boxMessage(`💰 Nagbayad ka ng ₱${amount} sa loan.\nPrincipal nabawas: ₱${payPrincipal.toFixed(2)}\nInterest nabawas: ₱${payInterest.toFixed(2)}\nNatitirang utang: ₱${data[userId].loan.toFixed(2)}\nNatitirang interest: ₱${data[userId].loanInterest.toFixed(2)}`, 'loan');
}

function giveBonus(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const now = Date.now();
  if (now - data[userId].lastBonus < BONUS_COOLDOWN) {
    const left = Math.ceil((BONUS_COOLDOWN - (now - data[userId].lastBonus)) / 60000);
    return boxMessage(`⏳ Hintay ka pa ng ${left} minuto bago ka makagamit ng bonus muli.`, 'cool');
  }
  data[userId].balance += BONUS_AMOUNT;
  data[userId].lastBonus = now;
  saveUserData(data);
  addToHistory(userId, `Nakatanggap ng bonus na ₱${BONUS_AMOUNT}`);
  return boxMessage(`🎁 Bonus! Nakatanggap ka ng ₱${BONUS_AMOUNT}`, 'bonus');
}

function postSocial(userId, message) {
  if (!message) return boxMessage('❌ Walang post na na-type.', 'error');
  const data = loadUserData();
  initUser(data, userId);
  const post = {
    id: Date.now(),
    userId,
    message,
    time: new Date().toLocaleString(),
  };
  data[userId].posts.push(post);
  data[userId].balance += POST_REWARD;
  saveUserData(data);
  addToHistory(userId, `Nagpost ng bagong social post.`);
  return boxMessage(`📱 Successfully posted! Nakatanggap ka ng ₱${POST_REWARD}`, 'social');
}

function feedSocial(userId) {
  const data = loadUserData();
  initUser(data, userId);
  let allPosts = [];
  // Collect all posts from all users
  for (const uid in data) {
    if (data[uid].posts && data[uid].posts.length > 0) {
      allPosts = allPosts.concat(data[uid].posts);
    }
  }
  if (allPosts.length === 0) return boxMessage('Walang posts sa feed.', 'info');
  // Sort posts newest first
  allPosts.sort((a,b) => b.id - a.id);

  const feedText = allPosts.slice(0, 10).map(post => {
    const userLabel = post.userId === userId ? 'IKAW' : `UID:${post.userId}`;
    return `─ ${userLabel} ─\n${post.message}\n🕒 ${post.time}`;
  }).join('\n\n');

  return boxMessage(`📱 Feed:\n${feedText}`, 'social');
}

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: "Economy system with loan, bonus, premium, protection, social posts, and more",
};

module.exports.run = async function ({ api, event, args }) {
  const command = args[0]?.toLowerCase() || '';
  const params = args.slice(1);
  const userId = event.senderID;
  let reply = '';

  switch (command) {
    case 'buy':
      if (params[0] === 'premium') reply = buyPremium(userId);
      else if (params[0] === 'protection') reply = buyProtection(userId);
      else reply = boxMessage('❌ Invalid item. Try: buy premium / buy protection', 'error');
      break;

    case 'profile':
      reply = userProfile(userId);
      break;

    case 'history':
      reply = showHistory(userId);
      break;

    case 'reset':
      reply = resetAllData(userId);
      break;

    case 'loan':
      if (params[0] === 'take') {
        const amount = params[1];
        reply = takeLoan(userId, amount);
      } else if (params[0] === 'pay') {
        const amount = params[1];
        reply = payLoan(userId, amount);
      } else {
        reply = boxMessage('❌ Subcommands: loan take <amount>, loan pay <amount>', 'error');
      }
      break;

    case 'bonus':
      reply = giveBonus(userId);
      break;

    case 'post':
      const message = params.join(' ');
      reply = postSocial(userId, message);
      break;

    case 'feed':
      reply = feedSocial(userId);
      break;

    default:
      reply = boxMessage('❌ Unknown command. Try: buy, profile, history, reset, loan, bonus, post, feed', 'error');
  }

  return api.sendMessage(reply, event.threadID, event.messageID);
};
