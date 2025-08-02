const fs = require('fs');
const path = require('path');

const ADMIN_UID = '61575137262643'; // Admin user ID
const LOAN_INTEREST_RATE = 0.1; // 10% interest (used if wanted)
const BONUS_AMOUNT = 100;
const BONUS_COOLDOWN = 3600000; // 1 hour
const POST_REWARD = 500; // increased to 500
const INCOME_COOLDOWN = 600000; // 10 minutes cooldown for collecting income
const RENT_INCOME = 300; // income from rent command

const BUILDING_PRICE = 5000;
const HOUSE_PRICE = 10000;

const dataFile = path.join(__dirname, 'users.json');
const maintenanceFile = path.join(__dirname, 'maintenance.json');

function loadUserData() {
  try {
    if (!fs.existsSync(dataFile)) return {};
    const raw = fs.readFileSync(dataFile);
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveUserData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

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

function saveMaintenance(state) {
  fs.writeFileSync(maintenanceFile, JSON.stringify({ maintenance: state }, null, 2));
}

let maintenanceMode = loadMaintenance();

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
      lastIncome: 0,
      nickname: null,
      houses: 0,
      buildings: 0,
      rentedHouses: 0,
    };
  }
}

// limit workers upgrades levels and income boosts per level
const WORKER_MAX_LEVEL = 10;
const WORKER_BASE_INCOME = 100;
const WORKER_INCOME_BOOST_PER_LEVEL = 0.2; // 20% boost per upgrade level

// Helper: add history (keep max 50)
function addToHistory(userId, text, data) {
  if (!data[userId].history) data[userId].history = [];
  data[userId].history.push(text);
  if (data[userId].history.length > 50) data[userId].history.shift();
}

// Message box helper
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

// Send notification to all group threads where bot is active
async function notifyAllGroups(api, message) {
  try {
    const threads = await api.getThreadList(100, null, ['INBOX']);
    for (const thread of threads) {
      await api.sendMessage(message, thread.threadID);
    }
  } catch (e) {
    console.error('Failed to notify all groups:', e);
  }
}

function setMaintenanceMode(state) {
  maintenanceMode = state;
  saveMaintenance(state);
}

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: "CSHOP command - manage economy features like premium, loans, posts, workers, buildings, houses etc.",
};

module.exports.run = async function ({ event, api, args }) {
  const userId = event.senderID;
  const params = args;
  const command = params[0]?.toLowerCase() || 'help';

  const data = loadUserData();
  initUser(data, userId);

  if (maintenanceMode && userId !== ADMIN_UID) {
    return api.sendMessage(boxMessage('⚠ MAINTENANCE MODE ACTIVE. Hindi pwedeng magamit ang cshop ngayon.', 'warning'), event.threadID, event.messageID);
  }

  // Save helper
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
      {
        const item = params[1]?.toLowerCase();
        if (!item) {
          reply = boxMessage('❌ Ano ang bibilhin? (premium, protection, building, house, worker)', 'error');
          break;
        }

        if (item === 'premium') {
          const price = 500;
          if (data[userId].premium) reply = boxMessage('May premium ka na! 🎉', 'success');
          else if (data[userId].balance < price) reply = boxMessage('Kulang pera mo para sa premium (₱500).', 'error');
          else {
            data[userId].balance -= price;
            data[userId].premium = true;
            save();
            addHistory('🎉 Naging PREMIUM Member');
            reply = boxMessage(`🎉 Premium Activated!\n\n𝐁𝐞𝐧𝐞𝐟𝐢𝐭𝐬:\n- 2x earnings\n- Exclusive investments\n- Higher rewards\n- Priority support\n- Advanced tools`, 'success');
            await api.sendMessage(`📢 User ${data[userId].nickname || userId} bought premium!`, event.threadID);
          }
        } else if (item === 'protection') {
          const price = 300;
          if (data[userId].protection) reply = boxMessage('May protection ka na! 🛡️', 'success');
          else if (data[userId].balance < price) reply = boxMessage('Kulang pera mo para sa protection (₱300).', 'error');
          else {
            data[userId].balance -= price;
            data[userId].protection = true;
            save();
            addHistory('🛡️ Bumili ng Protection');
            reply = boxMessage('🛡️ Protection Activated!', 'success');
            await api.sendMessage(`📢 User ${data[userId].nickname || userId} bought protection!`, event.threadID);
          }
        } else if (item === 'building') {
          if (data[userId].balance < BUILDING_PRICE) reply = boxMessage(`Kulang pera mo para bumili ng building (₱${BUILDING_PRICE}).`, 'error');
          else {
            data[userId].balance -= BUILDING_PRICE;
            data[userId].buildings++;
            save();
            addHistory(`🏢 Bumili ng building (Total: ${data[userId].buildings})`);
            reply = boxMessage(`🏢 Bumili ka ng building! Mayroon ka nang ${data[userId].buildings} building(s).`, 'success');
            // Notify all groups automatically (no approval)
            await notifyAllGroups(api, `📢 User ${data[userId].nickname || userId} bumili ng building!`);
          }
        } else if (item === 'house') {
          if (data[userId].balance < HOUSE_PRICE) reply = boxMessage(`Kulang pera mo para bumili ng house (₱${HOUSE_PRICE}).`, 'error');
          else {
            data[userId].balance -= HOUSE_PRICE;
            data[userId].houses++;
            save();
            addHistory(`🏠 Bumili ng house (Total: ${data[userId].houses})`);
            reply = boxMessage(`🏠 Bumili ka ng house! Mayroon ka nang ${data[userId].houses} house(s).`, 'success');
            await notifyAllGroups(api, `📢 User ${data[userId].nickname || userId} bumili ng house!`);
          }
        } else if (item === 'worker') {
          const workerPrice = 1000;
          if (data[userId].balance < workerPrice) reply = boxMessage(`Kulang pera mo para bumili ng worker (₱${workerPrice}).`, 'error');
          else {
            data[userId].balance -= workerPrice;
            // add new worker object
            data[userId].workers.push({
              id: Date.now(),
              level: 1,
              incomeBoost: 0,
            });
            save();
            addHistory('👷 Bumili ng worker');
            reply = boxMessage(`👷 Bumili ka ng worker! Mayroon ka nang ${data[userId].workers.length} worker(s).`, 'success');
            await notifyAllGroups(api, `📢 User ${data[userId].nickname || userId} bumili ng worker!`);
          }
        } else {
          reply = boxMessage('❌ Invalid item. Try: buy premium / buy protection / buy building / buy house / buy worker', 'error');
        }
      }
      break;

    case 'loan':
      {
        const sub = params[1];
        const amount = parseInt(params[2]);
        if (sub === 'take') {
          if (isNaN(amount) || amount <= 0) reply = boxMessage('Invalid loan amount.', 'error');
          else {
            // unlimited loan, interest applied
            const interest = amount * LOAN_INTEREST_RATE;
            data[userId].loan += amount;
            data[userId].loanInterest += interest;
            data[userId].balance += amount;
            save();
            addHistory(`Nangutang ng ₱${amount} with interest ₱${interest.toFixed(2)}`);
            reply = boxMessage(`💰 Humiram ka ng ₱${amount}.\nInterest: ₱${interest.toFixed(2)}\nKabuuang babayaran: ₱${(amount + interest).toFixed(2)}`, 'loan');
            // Notify all groups including admin
            await notifyAllGroups(api, `⚠️ User ${data[userId].nickname || userId} nangutang ng ₱${amount}!`);
          }
        } else if (sub === 'pay') {
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
      }
      break;

    case 'bonus':
      {
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
      }
      break;

    case 'post':
      {
        const msg = params.slice(1).join(' ').trim();
        if (!msg) {
          reply = boxMessage('❌ Walang post na na-type.', 'error');
          break;
        }
        const post = {
          id: Date.now(),
          userId,
          message: msg,
          time: new Date().toLocaleString(),
          nickname: data[userId].nickname || 'Anonymous',
          earningPercent: ((data[userId].balance / 10000) * 100).toFixed(2),
        };
        data[userId].posts.push(post);
        data[userId].balance += POST_REWARD;
        save();
        addHistory('Nagpost ng bagong social post.');
        reply = boxMessage(`📱 Successfully posted! Nakatanggap ka ng ₱${POST_REWARD}`, 'social');
      }
      break;

    case 'social':
      {
        let allPosts = [];
        for (const uid in data) {
          if (data[uid].posts?.length > 0) {
            allPosts = allPosts.concat(data[uid].posts);
          }
        }

        if (allPosts.length === 0) {
          reply = boxMessage('Walang mga posts sa social feed.', 'info');
          break;
        }

        allPosts.sort((a, b) => b.id - a.id);

        const postsToShow = allPosts.slice(0, 10);

        reply = postsToShow.map(post => {
          return `📱 ${post.nickname} (${post.time}):\n${post.message}\nEarnings: ₱${post.earningPercent}%`;
        }).join('\n\n');
      }
      break;

    default:
      reply = boxMessage('Available commands: balance, buy, loan, bonus, post, social', 'info');
  }

  await api.sendMessage(reply, event.threadID, event.messageID);
};
