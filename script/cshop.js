const fs = require('fs');
const path = require('path');

const userDataPath = path.resolve(__dirname, 'user.json');
const ADMIN_UID = '61575137262643';

const shopItems = {
  tinapay: 20, pandesal: 15, monay: 25, ensaymada: 30, puto: 10,
  'pan de coco': 35, biskwit: 5, ensaimada: 30, 'pan de leche': 28,
  mamon: 18, 'puto bumbong': 40, kutsinta: 22, bibingka: 50,
  'sapin-sapin': 33, buchi: 15, 'pan de regla': 27, galletas: 8,
  rosca: 45, barquillos: 12, turon: 20,
};

const fruits = {
  apple: 20, banana: 40, carrots: 69, potato: 178, rice: 260,
};

function loadUserData() {
  if (!fs.existsSync(userDataPath)) return {};
  const data = fs.readFileSync(userDataPath, 'utf8');
  return JSON.parse(data || '{}');
}

function saveUserData(data) {
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

function boxMessage(text) {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length));
  const top = '╔' + '═'.repeat(maxLength + 2) + '╗';
  const bottom = '╚' + '═'.repeat(maxLength + 2) + '╝';
  const middle = lines.map(line => `║ ${line}${' '.repeat(maxLength - line.length)} ║`).join('\n');
  return [top, middle, bottom].join('\n');
}

function initUser(data, userId) {
  if (!data[userId]) {
    data[userId] = {
      balance: 1000,
      inventory: {},
      loan: 0,
      workers: [],
      lastCollect: 0,
      premium: false,
      protection: false,
      isRegistered: false,
      history: [],
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

function registerUser(userId) {
  const data = loadUserData();
  initUser(data, userId);
  if (data[userId].isRegistered) return '✅ Registered ka na.';
  data[userId].isRegistered = true;
  saveUserData(data);
  return '✅ Successfully registered! Type `cshop login` to connect.';
}

function loginUser(userId) {
  const data = loadUserData();
  if (!data[userId]?.isRegistered) return '❌ Hindi ka pa registered. Gamitin ang `cshop register`.';
  return '✅ Successfully connected to CSHOP SERVER.';
}

function buyPremium(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const price = 500;
  if (data[userId].premium) return '✅ May premium ka na.';
  if (data[userId].balance < price) return '❌ Kulang pera mo para sa premium (₱500).';
  data[userId].balance -= price;
  data[userId].premium = true;
  saveUserData(data);
  addToHistory(userId, '🎉 Naging PREMIUM Member');
  return `🎉 Premium Activated!\n\n𝐁𝐞𝐧𝐞𝐟𝐢𝐭𝐬:\n- 2x earnings\n- Exclusive investments\n- Higher rewards\n- Priority support\n- Advanced portfolio tools`;
}

function buyProtection(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const price = 300;
  if (data[userId].protection) return '✅ May protection ka na.';
  if (data[userId].balance < price) return '❌ Kulang pera mo para sa protection (₱300).';
  data[userId].balance -= price;
  data[userId].protection = true;
  saveUserData(data);
  addToHistory(userId, '🛡️ Bumili ng Protection');
  return '🛡️ Protection Activated!';
}

function userProfile(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const u = data[userId];
  return `
📊 PROFILE
Balance: ₱${u.balance}
Loan: ₱${u.loan}
Premium: ${u.premium ? '✅' : '❌'}
Protection: ${u.protection ? '✅' : '❌'}
Workers: ${u.workers.length}
Inventory: ${Object.keys(u.inventory).length} item(s)`;
}

function showHistory(userId) {
  const data = loadUserData();
  initUser(data, userId);
  const history = data[userId].history.slice(-10).reverse().join('\n');
  return history ? `📜 Transaction History:\n${history}` : '📜 Walang history.';
}

function resetAllData(senderId) {
  if (senderId !== ADMIN_UID) return '❌ Admin lang ang pwedeng mag-reset!';
  saveUserData({});
  return '⚠️ Lahat ng CSHOP data ay ni-reset!';
}

// You can add the remaining functions (buy/sell/transfer/etc.) below.
// ...

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: "Economy system with shop, loans, premium, and protection",
};

module.exports.run = async function ({ api, event, args }) {
  const command = args[0]?.toLowerCase() || '';
  const params = args.slice(1);
  const userId = event.senderID;
  let reply = '';

  switch (command) {
    case 'register': reply = registerUser(userId); break;
    case 'login': reply = loginUser(userId); break;
    case 'buy':
      if (params[0] === 'premium') reply = buyPremium(userId);
      else if (params[0] === 'protection') reply = buyProtection(userId);
      else reply = '❌ Invalid item. Try: buy premium / buy protection';
      break;
    case 'profile': reply = userProfile(userId); break;
    case 'history': reply = showHistory(userId); break;
    case 'reset': reply = resetAllData(userId); break;
    default:
      reply = '❌ Unknown command. Try: register, login, buy premium, buy protection, profile, history, reset';
  }

  return api.sendMessage(boxMessage(reply), event.threadID, event.messageID);
};
