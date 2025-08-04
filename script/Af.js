const fs = require('fs');
const path = './data/users.json';

// Ensure the file exists
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}, null, 2), 'utf-8');
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

const WITHDRAW_LIMIT = 600;
const LOAN_LIMIT = 900;
const INTEREST_RATE = 0.01;
const ADMIN_ACCOUNT = '61575137262643';

module.exports.config = {
  name: 'omega',
  version: '3.0.0',
  hasPermission: 0,
  description: 'Complete GTP Bank system with features',
  usages: 'bank [commands]',
  credits: 'Omega Team 🏦',
  cooldowns: 0,
  dependencies: {}
};

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

// ---------- Account Management ----------

function createAccount(accountNumber, role = 'user') {
  if (users[accountNumber]) return `❌ Account ${accountNumber} already exists.`;

  users[accountNumber] = {
    balance: 0,
    history: [],
    locked: false,
    loggedIn: false,
    role,
    protected: false,
    premium: false,
    hasLoan: false,
    posts: []
  };

  saveUserData();
  return `✅ Account ${accountNumber} created.`;
}

function login(accountNumber) {
  const acc = users[accountNumber];
  if (!acc) return `❌ Account ${accountNumber} not found.`;
  if (acc.loggedIn) return `🔓 Already logged in.`;

  acc.loggedIn = true;
  saveUserData();
  return `🔓 Logged in to account ${accountNumber}.`;
}

function lock(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;

  acc.locked = true;
  saveUserData();
  return `🔐 Account ${accountNumber} locked.`;
}

function unlock(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;

  acc.locked = false;
  saveUserData();
  return `🔓 Account ${accountNumber} unlocked.`;
}

// ---------- Bank Functions ----------

function deposit(accountNumber, amount) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;

  acc.balance += amount;
  acc.history.push(`Deposited ₱${amount}`);
  saveUserData();
  return `🏦 Deposited ₱${amount} to account ${accountNumber}.`;
}

function withdraw(accountNumber, amount) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;

  const limit = acc.premium ? WITHDRAW_LIMIT * 1.25 : WITHDRAW_LIMIT;
  if (amount > limit) return `📉 Withdraw limit is ₱${limit.toFixed(0)}.`;
  if (amount > acc.balance) return `💸 Insufficient funds.`;

  acc.balance -= amount;
  acc.history.push(`Withdrew ₱${amount}`);
  saveUserData();
  return `💸 Withdrew ₱${amount} from account ${accountNumber}.`;
}

function balance(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;

  const interest = acc.balance * INTEREST_RATE;
  acc.balance += interest;
  acc.history.push(`Interest added: ₱${interest.toFixed(2)}`);
  saveUserData();

  return `📊 Balance: ₱${acc.balance.toFixed(2)} (incl. interest)`;
}

function loan(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;
  if (acc.hasLoan) return `❌ You already have an active loan.`;

  const amount = acc.protected ? 1500 : LOAN_LIMIT;

  acc.balance += amount;
  acc.hasLoan = true;
  acc.history.push(`Loan received: ₱${amount}`);
  saveUserData();

  return `💳 Loan granted: ₱${amount} added.`;
}

// ---------- Premium / Protection ----------

function buyProtection(accountNumber) {
  const acc = users[accountNumber];
  const admin = users[ADMIN_ACCOUNT];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;
  if (acc.protected) return `✅ Already protected.`;
  if (acc.balance < 900) return `💸 Not enough balance. ₱900 needed.`;

  acc.balance -= 900;
  admin.balance += 900;
  acc.protected = true;
  acc.history.push(`[Buy] Protection ₱900`);
  admin.history.push(`[Admin] Received ₱900 from ${accountNumber} (Protection)`);
  saveUserData();

  return `🛡️ Protection activated!`;
}

function buyPremium(accountNumber) {
  const acc = users[accountNumber];
  const admin = users[ADMIN_ACCOUNT];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;
  if (acc.premium) return `✅ Already premium.`;
  if (acc.balance < 400) return `💸 Not enough balance. ₱400 needed.`;

  acc.balance -= 400;
  admin.balance += 400;
  acc.premium = true;
  acc.history.push(`[Buy] Premium ₱400`);
  admin.history.push(`[Admin] Received ₱400 from ${accountNumber} (Premium)`);
  saveUserData();

  return `🌟 Premium granted!`;
}

function viewStatus(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;

  return `👤 Status for ${accountNumber}:\n🛡️ Protected: ${acc.protected ? '✅ Yes' : '❌ No'}\n🌟 Premium: ${acc.premium ? '✅ Yes' : '❌ No'}`;
}

// ---------- Social Media ----------

function postMessage(accountNumber, message) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;

  const reward = acc.premium ? 20 : 10;
  const timestamp = new Date().toLocaleString();

  acc.posts.push({ message, timestamp });
  acc.balance += reward;
  acc.history.push(`[Post] "${message}" (+₱${reward})`);
  saveUserData();

  return `📢 Post created. +₱${reward}`;
}

function viewOwnPosts(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.posts.length === 0) return `📭 No posts yet.`;

  return `📝 Posts by ${accountNumber}:\n` + acc.posts.map(
    (p, i) => `${i + 1}. [${p.timestamp}] ${p.message}`
  ).join('\n');
}

function viewAllPosts() {
  let result = [];
  for (let acc in users) {
    users[acc].posts?.forEach(post => {
      result.push(`[${post.timestamp}] ${acc}: ${post.message}`);
    });
  }
  return result.length ? `📢 Social Dashboard:\n${result.join('\n')}` : `📭 No posts yet.`;
}

// ---------- Games ----------

function coinFlip(accountNumber, bet, choice) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;
  if (acc.balance < bet) return `💸 Not enough balance.`;
  if (!['heads', 'tails'].includes(choice)) return `❌ Choose heads or tails.`;

  const flip = Math.random() < 0.5 ? 'heads' : 'tails';
  const win = flip === choice;
  acc.balance += win ? bet : -bet;
  acc.history.push(`[Game] Coin flip: ${choice} → ${flip} ${win ? '(+)' : '(-)'} ₱${bet}`);
  saveUserData();
