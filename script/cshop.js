const fs = require('fs');
const path = require('path');

const ADMIN_UID = '61575137262643'; // Admin user ID
const LOAN_LIMIT = 10000; // Max loan limit
const LOAN_INTEREST_RATE = 0.1; // 10% interest
const BONUS_AMOUNT = 100;
const BONUS_COOLDOWN = 3600000; // 1 hour in ms
const POST_REWARD = 50;

const dataFile = path.join(__dirname, 'users.json');
const maintenanceFile = path.join(__dirname, 'maintenance.json');

// Load user data from JSON file
function loadUserData() {
  try {
    if (!fs.existsSync(dataFile)) return {};
    const raw = fs.readFileSync(dataFile);
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

// Save user data to JSON file
function saveUserData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Load maintenance mode (true/false)
function loadMaintenance() {
  try {
    if (!fs.existsSync(maintenanceFile)) return false;
    const raw = fs.readFileSync(maintenanceFile);
    const obj = JSON.parse(raw);
    return obj.maintenance || false;
  } catch (e) {
    return false;
  }
}

// Save maintenance mode
function saveMaintenance(state) {
  fs.writeFileSync(maintenanceFile, JSON.stringify({ maintenance: state }, null, 2));
}

let maintenanceMode = loadMaintenance();

// Helper: init user data if not exist
function initUser(data, userId) {
  if (!data[userId]) {
    data[userId] = {
      balance: 0,
      loan: 0,
      loanInterest: 0,
      premium: false,
      protection: false,
      workers: [],
      inventory: {},
      posts: [],
      history: [],
      lastBonus: 0,
    };
  }
}

// Helper: add to user history (keep max 50 records)
function addToHistory(userId, text, data) {
  if (!data[userId].history) data[userId].history = [];
  data[userId].history.push(text);
  if (data[userId].history.length > 50) data[userId].history.shift();
}

// Helper: box message format (customize as needed)
function boxMessage(text, type = 'info') {
  const prefix = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loan: '💰',
    bonus: '🎁',
    social: '📱',
    cool: '⏳',
    profile: '📊',
  }[type] || '';
  return `${prefix} ${text}`;
}

function setMaintenanceMode(state) {
  maintenanceMode = state;
  saveMaintenance(state);
}

// Main exported config
module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: "CSHOP command - manage economy features like premium, loans, posts, etc.",
};

// Main exported run function
module.exports.run = async function ({ event, api, args, Users }) {
  const userId = event.senderID;
  const params = args;
  const command = params[0]?.toLowerCase() || 'help';

  // Load data fresh each command
  const data = loadUserData();
  initUser(data, userId);

  // Check maintenance mode except admin
  if (maintenanceMode && userId !== ADMIN_UID) {
    return api.sendMessage(boxMessage('⚠ MAINTENANCE MODE ACTIVE. Hindi pwedeng magamit ang cshop ngayon.', 'warning'), event.threadID, event.messageID);
  }

  // Helpers for history and save
  function save() {
    saveUserData(data);
  }
  function addHistory(text) {
    addToHistory(userId, text, data);
  }

  let reply = '';

  switch (command) {
    case 'balance':
      reply = boxMessage(`💰 Balance mo: ₱${data[userId].balance}`, 'profile');
      break;

    case 'buy':
      if (params[1] === 'premium') {
        const price = 500;
        if (data[userId].premium) reply = boxMessage('May premium ka na! 🎉', 'success');
        else if (data[userId].balance < price) reply = boxMessage('Kulang pera mo para sa premium (₱500).', 'error');
        else {
          data[userId].balance -= price;
          data[userId].premium = true;
          save();
          addHistory('🎉 Naging PREMIUM Member');
          reply = boxMessage(`🎉 Premium Activated!\n\n𝐁𝐞𝐧𝐞𝐟𝐢𝐭𝐬:\n- 2x earnings\n- Exclusive investments\n- Higher rewards\n- Priority support\n- Advanced tools`, 'success');
        }
      } else if (params[1] === 'protection') {
        const price = 300;
        if (data[userId].protection) reply = boxMessage('May protection ka na! 🛡️', 'success');
        else if (data[userId].balance < price) reply = boxMessage('Kulang pera mo para sa protection (₱300).', 'error');
        else {
          data[userId].balance -= price;
          data[userId].protection = true;
          save();
          addHistory('🛡️ Bumili ng Protection');
          reply = boxMessage('🛡️ Protection Activated!', 'success');
        }
      } else {
        reply = boxMessage('❌ Invalid item. Try: buy premium / buy protection', 'error');
      }
      break;

    case 'loan':
      if (params[1] === 'take') {
        const amount = parseInt(params[2]);
        if (isNaN(amount) || amount <= 0) reply = boxMessage('Invalid loan amount.', 'error');
        else if (data[userId].loan + amount > LOAN_LIMIT) reply = boxMessage(`Loan limit exceeded! Limit is ₱${LOAN_LIMIT}.`, 'error');
        else {
          const interest = amount * LOAN_INTEREST_RATE;
          data[userId].loan += amount;
          data[userId].loanInterest += interest;
          data[userId].balance += amount;
          save();
          addHistory(`Nangutang ng ₱${amount} with interest ₱${interest.toFixed(2)}`);
          reply = boxMessage(`💰 Humiram ka ng ₱${amount}.\nInterest: ₱${interest.toFixed(2)}\nKabuuang babayaran: ₱${(amount + interest).toFixed(2)}`, 'loan');
        }
      } else if (params[1] === 'pay') {
        const amount = parseInt(params[2]);
        if (isNaN(amount) || amount <= 0) reply = boxMessage('Invalid payment amount.', 'error');
        else if (data[userId].loan <= 0) reply = boxMessage('Walang utang na kailangang bayaran.', 'info');
        else if (data[userId].balance < amount) reply = boxMessage('Kulang pera mo para magbayad.', 'error');
        else {
          let payPrincipal = 0;
          let payInterest = 0;
          if (amount >= data[userId].loan + data[userId].loanInterest) {
            payPrincipal = data[userId].loan;
            payInterest = data[userId].loanInterest;
          } else if (amount <= data[userId].loanInterest) {
            payInterest = amount;
          } else {
            payInterest = data[userId].loanInterest;
            payPrincipal = amount - payInterest;
          }

          data[userId].loan -= payPrincipal;
          data[userId].loanInterest -= payInterest;
          data[userId].balance -= amount;

          initUser(data, ADMIN_UID);
          data[ADMIN_UID].balance += payPrincipal;
          save();
          addHistory(`Nagbayad ng ₱${amount} sa loan (Principal: ₱${payPrincipal.toFixed(2)}, Interest: ₱${payInterest.toFixed(2)})`);
          reply = boxMessage(`💰 Nagbayad ka ng ₱${amount} sa loan.\nPrincipal: ₱${payPrincipal.toFixed(2)}\nInterest: ₱${payInterest.toFixed(2)}\nUtang: ₱${data[userId].loan.toFixed(2)}\nInterest natira: ₱${data[userId].loanInterest.toFixed(2)}`, 'loan');
        }
      } else {
        reply = boxMessage('❌ Subcommands: loan take <amount>, loan pay <amount>', 'error');
      }
      break;

    case 'bonus':
      const now = Date.now();
      if (now - data[userId].lastBonus < BONUS_COOLDOWN) {
        const left = Math.ceil((BONUS_COOLDOWN - (now - data[userId].lastBonus)) / 60000);
        reply = boxMessage(`⏳ Hintay ka pa ng ${left} minuto bago ka makagamit ng bonus muli.`, 'cool');
      } else {
        data[userId].balance += BONUS_AMOUNT;
        data[userId].lastBonus = now;
        save();
        addHistory(`Nakatanggap ng bonus na ₱${BONUS_AMOUNT}`);
        reply = boxMessage(`🎁 Bonus! Nakatanggap ka ng ₱${BONUS_AMOUNT}`, 'bonus');
      }
      break;

    case 'post':
      const msg = params.slice(1).join(' ').trim();
      if (!msg) reply = boxMessage('❌ Walang post na na-type.', 'error');
      else {
        const post = { id: Date.now(), userId, message: msg, time: new Date().toLocaleString() };
        data[userId].posts.push(post);
        data[userId].balance += POST_REWARD;
        save();
        addHistory('Nagpost ng bagong social post.');
        reply = boxMessage(`📱 Successfully posted! Nakatanggap ka ng ₱${POST_REWARD}`, 'social');
      }
      break;

    case 'feed':
      let allPosts = [];
      for (const uid in data) {
        if (data[uid].posts?.length > 0) allPosts = allPosts.concat(data[uid].posts);
      }
      if (allPosts.length === 0) reply = boxMessage('Walang posts sa feed.', 'info');
      else {
        allPosts.sort((a, b) => b.id - a.id);
        const feedText = allPosts.slice(0, 10).map(post => {
          const userLabel = post.userId === userId ? 'IKAW' : `UID:${post.userId}`;
          return `─ ${userLabel} ─\n${post.message}\n🕒 ${post.time}`;
        }).join('\n\n');
        reply = boxMessage(`📱 Feed:\n${feedText}`, 'social');
      }
      break;

    case 'profile':
      reply = boxMessage(`
Balance: ₱${data[userId].balance}
Loan Principal: ₱${data[userId].loan}
Loan Interest: ₱${data[userId].loanInterest.toFixed(2)}
Premium: ${data[userId].premium ? '✅' : '❌'}
Protection: ${data[userId].protection ? '✅' : '❌'}
Workers: ${data[userId].workers.length}
Inventory: ${Object.keys(data[userId].inventory).length} item(s)
Posts: ${data[userId].posts.length}
`, 'profile');
      break;

    case 'history':
      const history = data[userId].history.slice(-10).reverse().join('\n');
      reply = boxMessage(history ? `Transaction History:\n${history}` : 'Walang history.', 'info');
      break;

    case 'reset':
      if (userId !== ADMIN_UID) {
        reply = boxMessage('Admin lang ang pwedeng mag-reset!', 'error');
      } else {
        saveUserData({});
        reply = boxMessage('✅ Lahat ng data ay na-reset na!', 'success');
      }
      break;

    case 'help':
    default:
      reply = boxMessage(
        `CSHOP Commands:
- balance: Tingnan ang balance
- buy premium|protection: Bumili ng item
- loan take|pay <amount>: Humiram o magbayad ng loan
- bonus: Kumuha ng bonus bawat 1 oras
- post <message>: Magpost sa social feed
- feed: Tingnan ang mga post
- profile: Ipakita ang iyong profile
- history: Transaction history
- reset: (Admin only) I-reset lahat ng data
`, 'info');
      break;
  }

  return api.sendMessage(reply, event.threadID, event.messageID);
};
