const fs = require('fs');
const path = require('path');

const ADMIN_UID = '61575137262643';

const DATA_FILE = path.resolve(__dirname, 'cshop_users.json');
const LOGS_FILE = path.resolve(__dirname, 'cshop_logs.json');
const PREMIUM_REQ_FILE = path.resolve(__dirname, 'cshop_premium_requests.json');
const MAINT_FILE = path.resolve(__dirname, 'cshop_maintenance.json');

const POST_REWARD_BASE = 400;
const BONUS_BASE = 100;
const BONUS_COOLDOWN = 60 * 60 * 1000;
const RENT_INCOME = 300;

const PRICES = {
  house: 10000,
  building: 5000,
  protection: 200,
  worker: 1000,
  agent: 2000,
  workerUpgradeBase: 100,
  houseUpgrade: [98000, 54000, 10000],
  bonusUpgrade: [45000, 20000],
};

const LOAN_INTEREST_RATE = 0.1;

function loadJSON(file, def = {}) {
  try {
    if (!fs.existsSync(file)) return def;
    return JSON.parse(fs.readFileSync(file));
  } catch { return def; }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function logAction(text) {
  const logs = loadJSON(LOGS_FILE, []).slice(-99);
  logs.push({ time: new Date().toISOString(), text });
  saveJSON(LOGS_FILE, logs);
}

function initUser(data, uid) {
  if (!data[uid]) {
    data[uid] = {
      balance: 0,
      loan: 0, loanInterest: 0,
      premium: false,
      protection: false,
      houses: 0, buildings: 0, rentedHouses: 0,
      workers: [], workerUpgradeLevel: 0,
      nickname: null,
      lastBonus: 0,
      posts: [], history: [],
      agents: [], houseUpgradeLevel: 0, bonusLevel: 0,
    };
  }
}

function box(text, type = 'info') {
  const icons = {
    success: '✅', error: '❌', warning: '⚠️',
    info: 'ℹ️', loan: '💰', bonus: '🎁', social: '📱', profile: '📊',
  };
  return (icons[type] || '') + ' ' + text;
}

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
};

module.exports.run = async ({ event, api, args }) => {
  const uid = event.senderID;
  const threadID = event.threadID;
  const msgID = event.messageID;
  const cmd = (args[0] || '').toLowerCase();

  let data = loadJSON(DATA_FILE, {});
  let maintenance = loadJSON(MAINT_FILE, { maintenance: false }).maintenance;
  let premiumReq = loadJSON(PREMIUM_REQ_FILE, []);

  if (maintenance && uid !== ADMIN_UID) {
    return api.sendMessage(box('⚠️ CSHOP under maintenance', 'warning'), threadID, msgID);
  }

  initUser(data, uid);
  initUser(data, ADMIN_UID);
  const user = data[uid];

  async function save() {
    saveJSON(DATA_FILE, data);
  }
  async function notifyAll(msg) {
    try {
      const list = await api.getThreadList(100, null, ['INBOX']);
      for (const t of list) {
        await api.sendMessage(msg, t.threadID);
      }
    } catch {}
  }

  switch (cmd) {
    case 'help':
      return api.sendMessage(box(`
Commands:
balance • buy • rent • rentstatus • loan take/pay • bonus • bonusupgrade (admin) • post • social
nickname • profile • premiumrequest • premiumapprove (admin) • logs (admin)
agent list/buy/show • worker upgrade <id> • houseupgrade (admin) • setnickname
`, 'info'), threadID, msgID);

    case 'balance':
      return api.sendMessage(box(`💰Balance: ₱${user.balance}`, 'profile'), threadID, msgID);

    case 'buy': {
      const item = (args[1] || '').toLowerCase();
      if (item === 'house') {
        if (user.balance < PRICES.house) return api.sendMessage(box(`Not enough for house`, 'error'), threadID, msgID);
        user.balance -= PRICES.house;
        user.houses++;
        user.history.push(`Bought house`);
        logAction(`${uid} bought house`);
        await save();
        await api.sendMessage(box(`🏠 Bought a house!`, 'success'), threadID, msgID);
        await notifyAll(`📢 User ${(user.nickname||uid)} bought a house!`);
      } else if (item === 'building') {
        if (user.balance < PRICES.building) return api.sendMessage(box(`Not enough for building`, 'error'), threadID, msgID);
        user.balance -= PRICES.building; user.buildings++;
        user.history.push('Bought building');
        logAction(`${uid} bought building`);
        await save();
        await api.sendMessage(box('🏢 Bought building!', 'success'), threadID, msgID);
        await notifyAll(`📢 User ${(user.nickname||uid)} bought building!`);
      } else if (item === 'premium') {
        if (user.premium) return api.sendMessage(box('Already premium', 'success'), threadID, msgID);
        if (user.balance < 500) return api.sendMessage(box('Not enough for premium', 'error'), threadID, msgID);
        user.balance -= 500; user.premium = true;
        user.history.push('Premium activated');
        logAction(`${uid} activated premium`);
        await save();
        await api.sendMessage(box('🎉 Premium activated!', 'success'), threadID, msgID);
        await notifyAll(`📢 User ${(user.nickname||uid)} bought premium!`);
      } else if (item === 'protection') {
        if (user.protection) return api.sendMessage(box('Already have protection', 'success'), threadID, msgID);
        if (user.balance < PRICES.protection) return api.sendMessage(box('Not enough for protection', 'error'), threadID, msgID);
        user.balance -= PRICES.protection; user.protection = true;
        data[ADMIN_UID].balance += PRICES.protection;
        user.history.push('Bought protection'); logAction(`${uid} bought protection`);
        await save();
        await api.sendMessage(box('🛡️ Protection activated!', 'success'), threadID, msgID);
        await notifyAll(`📢 User ${(user.nickname||uid)} bought protection!`);
      } else if (item === 'worker') {
        if (user.balance < PRICES.worker) return api.sendMessage(box('Not enough for worker', 'error'), threadID, msgID);
        user.balance -= PRICES.worker;
        user.workers.push({ id: Date.now(), level:1 });
        user.history.push('Bought worker'); logAction(`${uid} bought worker`);
        await save();
        await api.sendMessage(box('👷 Bought worker!', 'success'), threadID, msgID);
        await notifyAll(`📢 User ${(user.nickname||uid)} bought worker!`);
      } else if (item === 'agent') {
        if (user.balance < PRICES.agent) return api.sendMessage(box('Not enough for agent', 'error'), threadID, msgID);
        user.balance -= PRICES.agent;
        user.agents.push({ id:Date.now(), income:100 });
        user.history.push('Bought agent'); logAction(`${uid} bought agent`);
        await save();
        await api.sendMessage(box('🕵️ Agent bought!', 'success'), threadID, msgID);
        await notifyAll(`📢 User ${(user.nickname||uid)} bought agent!`);
      } else {
        return api.sendMessage(box('Unknown item', 'error'), threadID, msgID);
      }
      break;
    }

    case 'rent': {
      if (args[1] !== 'house') return api.sendMessage(box('Use rent house', 'error'), threadID, msgID);
      if (user.houses < 1) return api.sendMessage(box('No houses to rent', 'error'), threadID, msgID);
      user.balance += RENT_INCOME * user.houses;
      user.history.push(`Collected rent ₱${RENT_INCOME * user.houses}`);
      logAction(`${uid} collected rent`);
      await save();
      return api.sendMessage(box(`🏠 You earned ₱${RENT_INCOME * user.houses} from houses`, 'success'), threadID, msgID);
    }

    case 'rentstatus':
      return api.sendMessage(box(`You have ${user.houses} houses.`, 'info'), threadID, msgID);

    case 'loan': {
      const act = (args[1]||'').toLowerCase();
      const amt = parseInt(args[2])||0;
      if (act === 'take') {
        user.loan += amt;
        user.loanInterest += amt * LOAN_INTEREST_RATE;
        user.balance += amt;
        user.history.push(`Took loan ₱${amt}`); logAction(`${uid} took loan`);
        await save();
        return api.sendMessage(box(`Loan ₱${amt} taken. Interest ₱${(amt*LOAN_INTEREST_RATE).toFixed(2)}`, 'loan'), threadID, msgID);
      } else if (act === 'pay') {
        let pay = Math.min(amt, user.loan + user.loanInterest);
        if (user.balance < pay) return api.sendMessage(box('Not enough to pay', 'error'), threadID, msgID);
        user.balance -= pay;
        if (pay > user.loanInterest) {
          pay -= user.loanInterest; user.loanInterest=0; user.loan = Math.max(0, user.loan - pay);
        } else user.loanInterest -= pay;
        user.history.push(`Paid loan ₱${amt}`); logAction(`${uid} paid loan`);
        await save();
        return api.sendMessage(box(`Paid ₱${amt}. Remaining loan ₱${user.loan}`, 'loan'), threadID, msgID);
      } else {
        return api.sendMessage(box('Use loan take/pay <amount>', 'info'), threadID, msgID);
      }
    }

    case 'bonus':
      const now = Date.now();
      if (now - user.lastBonus < BONUS_COOLDOWN)
        return api.sendMessage(box(`Bonus cooldown. Try later.`, 'cool'), threadID, msgID);
      const bonus = BONUS_BASE + user.bonusLevel * 50;
      user.balance += bonus;
      user.lastBonus = now;
      user.history.push(`Claimed bonus ₱${bonus}`); logAction(`${uid} claimed bonus`);
      await save();
      return api.sendMessage(box(`🎁 You got bonus ₱${bonus}`, 'bonus'), threadID, msgID);

    case 'bonusupgrade':
      if (uid!==ADMIN_UID) return api.sendMessage(box('Admins only', 'error'), threadID, msgID);
      const lvl = parseInt(args[1]);
      if (!lvl || lvl<1 || lvl>PRICES.bonusUpgrade.length)
        return api.sendMessage(box('Invalid bonus upgrade level', 'error'), threadID, msgID);
      const cost = PRICES.bonusUpgrade[lvl-1];
      if (data[ADMIN_UID].balance < cost) return api.sendMessage(box('Admin insufficient funds', 'error'), threadID, msgID);
      data[ADMIN_UID].balance -= cost;
      for (const u in data) if (u!==ADMIN_UID) data[u].bonusLevel = Math.max(data[u].bonusLevel || 0, lvl);
      logAction(`Admin upgraded bonus level to ${lvl} costing ₱${cost}`);
      await save();
      return api.sendMessage(box(`Bonus level set to ${lvl}!`, 'success'), threadID, msgID);

    case 'houseupgrade':
      if (uid!==ADMIN_UID) return api.sendMessage(box('Admins only', 'error'), threadID, msgID);
