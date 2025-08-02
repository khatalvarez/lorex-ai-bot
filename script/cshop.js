const fs = require('fs');
const path = require('path');

const ADMIN_UID = '61575137262643';

const DATA_FILE = path.resolve(__dirname, 'cshop_users.json');
const LOGS_FILE = path.resolve(__dirname, 'cshop_logs.json');
const PREMIUM_REQ_FILE = path.resolve(__dirname, 'cshop_premium_requests.json');
const MAINTENANCE_FILE = path.resolve(__dirname, 'cshop_maintenance.json');

const POST_REWARD = 400;
const BONUS_BASE = 100;
const BONUS_COOLDOWN = 60 * 60 * 1000; // 1 hour cooldown
const WORKER_BASE_PRICE = 1000;
const WORKER_UPGRADE_PRICE_BASE = 100;
const HOUSE_BASE_PRICE = 10000;
const BUILDING_BASE_PRICE = 5000;
const PROTECTION_PRICE = 200;
const AGENT_PRICE = 2000;
const LOAN_INTEREST_RATE = 0.1; // 10%
const RENT_INCOME = 300;

const HOUSE_UPGRADE_PRICES = [98000, 54000, 10000]; // Admin only
const BONUS_UPGRADE_PRICES = [45000, 20000]; // Admin only

// Load/save helpers
function loadJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return fallback;
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Logging helper
function logAction(text) {
  const logs = loadJSON(LOGS_FILE, []);
  logs.push({ timestamp: new Date().toISOString(), text });
  if (logs.length > 100) logs.shift();
  saveJSON(LOGS_FILE, logs);
}

function addHistory(user, text) {
  if (!user.history) user.history = [];
  user.history.push(text);
  if (user.history.length > 50) user.history.shift();
}

// Box message formatter
function boxMessage(text, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loan: '💰',
    bonus: '🎁',
    social: '📱',
    profile: '📊',
    agent: '👨‍💼',
  };
  const prefix = icons[type] || '';
  return `${prefix} ${text}`;
}

// Initialize user data if none
function initUser(data, uid) {
  if (!data[uid]) {
    data[uid] = {
      balance: 0,
      loan: 0,
      premium: false,
      protection: false,
      workers: [],
      houses: 0,
      buildings: 0,
      rentedHouses: 0,
      nickname: null,
      lastBonus: 0,
      posts: [],
      history: [],
      lastIncomeTime: 0,
      agents: [],
      houseUpgradeLevel: 0,
      bonusLevel: 0,
    };
  }
}

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: 'CSHOP economy commands with premium, loans, houses, workers, agents, posts, logs',
};

module.exports.run = async function ({ event, api, args }) {
  const userId = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;
  const input = args.join(' ').trim();
  const cmd = (args[0] || '').toLowerCase();

  // Load data
  let data = loadJSON(DATA_FILE, {});
  let maintenance = loadJSON(MAINTENANCE_FILE, { maintenance: false }).maintenance;
  let premiumRequests = loadJSON(PREMIUM_REQ_FILE, []);

  if (maintenance && userId !== ADMIN_UID) {
    return api.sendMessage(boxMessage('⚠️ CSHOP is under maintenance, try again later.', 'warning'), threadID, messageID);
  }

  initUser(data, userId);
  const user = data[userId];

  async function save() {
    saveJSON(DATA_FILE, data);
  }

  async function notifyAllGroups(message) {
    try {
      const threads = await api.getThreadList(100, null, ['INBOX']);
      for (const t of threads) {
        await api.sendMessage(message, t.threadID);
      }
    } catch (e) {
      console.error('Notify all groups error:', e);
    }
  }

  // --- COMMAND HANDLERS ---
  switch (cmd) {
    case 'help': {
      const helpmsg = boxMessage(
        `Available commands:\n` +
          `balance - Check balance\n` +
          `buy <premium|protection|building|house|worker|agent> - Purchase items\n` +
          `loan take <amount> - Take a loan\n` +
          `loan pay <amount> - Pay loan\n` +
          `bonus - Claim bonus (cooldown applies)\n` +
          `bonusupgrade <level> - Admin only bonus upgrade\n` +
          `post <message> - Post and earn ₱${POST_REWARD}\n` +
          `social - Show social feed\n` +
          `nickname <name> - Set nickname\n` +
          `profile - Show your profile\n` +
          `rent house - Collect rent income\n` +
          `rent status - Show your rented houses\n` +
          `premiumrequest - Request free premium (admin approval)\n` +
          `premiumapprove <uid> - Admin approve premium\n` +
          `logs - Show logs (admin only)\n` +
          `agent list - Show available agents\n` +
          `agent buy - Buy agent\n` +
          `agent show - Show owned agents\n` +
          `interest - Show loan interest\n` +
          `houseupgrade <level> - Admin house price upgrade\n` +
          `worker upgrade <id> - Upgrade worker\n` +
          `setnickname <name> - Set nickname\n` +
          `cshop help - Show this help`,
        'info'
      );
      return api.sendMessage(helpmsg, threadID, messageID);
    }

    case 'balance': {
      return api.sendMessage(boxMessage(`💰 Your balance: ₱${user.balance}`, 'profile'), threadID, messageID);
    }

    case 'buy': {
      const item = (args[1] || '').toLowerCase();
      if (!item) return api.sendMessage(boxMessage('❌ Please specify an item to buy.', 'error'), threadID, messageID);

      if (item === 'premium') {
        const price = 500;
        if (user.premium) return api.sendMessage(boxMessage('🎉 You already have premium!', 'success'), threadID, messageID);
        if (user.balance < price) return api.sendMessage(boxMessage('❌ Not enough balance for premium (₱500)', 'error'), threadID, messageID);
        user.balance -= price;
        user.premium = true;
        addHistory(user, 'Activated Premium');
        logAction(`User ${user.nickname || userId} bought premium for ₱${price}`);
        await save();
        await api.sendMessage(boxMessage('🎉 Premium Activated! You get 2x earnings, exclusive benefits.', 'success'), threadID, messageID);
        await notifyAllGroups(`📢 User ${user.nickname || userId} bought premium!`);
        return;
      } else if (item === 'protection') {
        if (user.protection) return api.sendMessage(boxMessage('🛡️ You already have protection!', 'success'), threadID, messageID);
        if (user.balance < PROTECTION_PRICE) return api.sendMessage(boxMessage(`❌ Not enough balance for protection (₱${PROTECTION_PRICE})`, 'error'), threadID, messageID);
        user.balance -= PROTECTION_PRICE;
        user.protection = true;

        // Admin gets 200 from protection buy
        initUser(data, ADMIN_UID);
        data[ADMIN_UID].balance += PROTECTION_PRICE;
        addHistory(user, 'Bought Protection');
        logAction(`User ${user.nickname || userId} bought protection for ₱${PROTECTION_PRICE}`);
        await save();
        await api.sendMessage(boxMessage('🛡️ Protection activated!', 'success'), threadID, messageID);
        await notifyAllGroups(`📢 User ${user.nickname || userId} bought protection! (Admin earned ₱${PROTECTION_PRICE})`);
        return;
      } else if (item === 'building') {
        if (user.balance < BUILDING_BASE_PRICE) return api.sendMessage(boxMessage(`❌ Not enough balance for building (₱${BUILDING_BASE_PRICE})`, 'error'), threadID, messageID);
        user.balance -= BUILDING_BASE_PRICE;
        user.buildings++;
        addHistory(user, `Bought building, total ${user.buildings}`);
        logAction(`User ${user.nickname || userId} bought building for ₱${BUILDING_BASE_PRICE}`);
        await save();
        await api.sendMessage(boxMessage(`🏢 You bought a building! Total buildings: ${user.buildings}`, 'success'), threadID, messageID);
        await notifyAllGroups(`📢 User ${user.nickname || userId} bought a building!`);
        return;
      } else if (item === 'house') {
        if (user.balance < HOUSE_BASE_PRICE) return api.sendMessage(boxMessage(`❌ Not enough balance for house (₱${HOUSE_BASE_PRICE})`, 'error'), threadID, messageID);
        user.balance -= HOUSE_BASE_PRICE;
        user.houses++;
        addHistory(user, `Bought house, total ${user.houses}`);
        logAction(`User ${user.nickname || userId} bought house for ₱${HOUSE_BASE_PRICE}`);
        await save();
        await api.sendMessage(boxMessage(`🏠 You bought a house! Total houses: ${user.houses}`, 'success'), threadID, messageID);
        await notifyAllGroups(`📢 User ${user.nickname || userId} bought a house!`);
        return;
      } else if (item === 'worker') {
        if (user.balance < WORKER_BASE_PRICE) return api.sendMessage(boxMessage(`❌ Not enough balance for worker (₱${WORKER_BASE_PRICE})`, 'error'), threadID, messageID);
        user.balance -= WORKER_BASE_PRICE;
        user.workers.push({ id: Date.now(), level: 1, incomeBoost: 0 });
        addHistory(user, 'Bought worker');
        logAction(`User ${user.nickname || userId} bought worker for ₱${WORKER_BASE_PRICE}`);
        await save();
        await api.sendMessage(boxMessage('👷 You bought a worker!', 'success'), threadID, messageID);
        await notifyAllGroups(`📢 User ${user.nickname || userId} bought a worker!`);
        return;
      } else if (item === 'agent') {
        if (user.balance < AGENT_PRICE) return api.sendMessage(boxMessage(`❌ Not enough balance for agent (₱${AGENT_PRICE})`, 'error'), threadID, messageID);
        user.balance -= AGENT_PRICE;
        user.agents.push({ id: Date.now(), income: 100 });
        addHistory(user, 'Bought agent');
        logAction(`User ${user.nickname || userId} bought agent for ₱${AGENT_PRICE}`);
        await save();
        await api.sendMessage(boxMessage('👨‍💼 You bought an agent!', 'success'), threadID, messageID);
        await notifyAllGroups(`📢 User ${user.nickname || userId} bought an agent!`);
        return;
      } else {
        return api.sendMessage(boxMessage('❌ Unknown item to buy.', 'error'), threadID, messageID);
      }
    }

    case 'loan': {
      const subcmd = (args[1] || '').toLowerCase();
      const amount = parseInt(args[2]) || 0;
      if (subcmd === 'take') {
        if (!amount || amount <= 0) return api.sendMessage(boxMessage('❌ Specify a valid loan amount.', 'error'), threadID, messageID);
        user.balance += amount;
        user.loan += amount;
        user.loanInterest += amount * LOAN_INTEREST_RATE;
        addHistory(user, `Took loan ₱${amount} + interest ₱${(amount * LOAN_INTEREST_RATE).toFixed(2)}`);
        logAction(`User ${user.nickname || userId} took loan ₱${amount}`);
        await save();
        return api.sendMessage(boxMessage(`💰 Loan taken: ₱${amount}. Interest: ₱${(amount * LOAN_INTEREST_RATE).toFixed(2)}`, 'loan'), threadID, messageID);
      } else if (subcmd === 'pay') {
        if (!amount || amount <= 0) return api.sendMessage(boxMessage('❌ Specify a valid pay amount.', 'error'), threadID, messageID);
        if (user.balance < amount) return api.sendMessage(boxMessage('❌ Not enough balance to pay loan.', 'error'), threadID, messageID);
        if (user.loan <= 0) return api.sendMessage(boxMessage('❌ You have no loan to pay.', 'error'), threadID, messageID);
        let payAmount = Math.min(amount, user.loan + user.loanInterest);
        user.balance -= payAmount;
        if (payAmount > user.loan) {
          user.loanInterest -= (payAmount - user.loan);
          user.loan = 0;
          if (user.loanInterest < 0) user.loanInterest = 0;
        } else {
          user.loan -= payAmount;
        }
        addHistory(user, `Paid loan ₱${payAmount.toFixed(2)}`);
        logAction(`User ${user.nickname || userId} paid loan ₱${payAmount.toFixed(2)}`);
        await save();
        return api.sendMessage(boxMessage(`💰 Paid loan ₱${payAmount.toFixed(2)}. Remaining loan: ₱${user.loan.toFixed(2)}`, 'loan'), threadID, messageID);
      } else {
        return api.sendMessage(boxMessage('❌ Use loan take <amount> or loan pay <amount>.', 'error'), threadID, messageID);
      }
    }

    case 'bonus': {
      const now = Date.now();
      if (now - user.lastBonus < BONUS_COOLDOWN) {
        return api.sendMessage(boxMessage('⏳ Bonus is on cooldown. Try later.', 'cool'), threadID, messageID);
      }
      let bonus = BONUS_BASE + user.bonusLevel * 50;
      if (user.premium) bonus *= 2;
      user.balance += bonus;
      user.lastBonus = now;
      addHistory(user, `Claimed bonus ₱${bonus}`);
      logAction(`User ${user.nickname || userId} claimed bonus ₱${bonus}`);
      await save();
      return api.sendMessage(boxMessage(`🎁 You claimed bonus ₱${bonus}!`, 'bonus'), threadID, messageID);
    }

    case 'bonusupgrade': {
      if (userId !== ADMIN_UID) return api.sendMessage(boxMessage('❌ Admins only.', 'error'), threadID, messageID);
      const level = parseInt(args[1]);
      if (!level || level < 1 || level > BONUS_UPGRADE_PRICES.length) return api.sendMessage(boxMessage('❌ Invalid bonus upgrade level.', 'error'), threadID, messageID);
      const price = BONUS_UPGRADE_PRICES[level - 1];
      if (data[ADMIN_UID].balance < price) return api.sendMessage(boxMessage('❌ Admin does not have enough balance.', 'error'), threadID, messageID);
      data[ADMIN_UID].balance -= price;
      for (const uid in data) {
        if (uid === ADMIN_UID) continue;
        if (data[uid].bonusLevel < level) data[uid].bonusLevel = level;
      }
      addLog(`Admin upgraded bonus to level ${level} for ₱${price}`);
      await save();
      return api.sendMessage(box
