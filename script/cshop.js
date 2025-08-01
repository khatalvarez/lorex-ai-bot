const fs = require('fs');
const path = require('path');
const axios = require('axios');

const userDataPath = path.resolve(__dirname, 'user.json');

function loadUserData() {
  if (!fs.existsSync(userDataPath)) return {};
  const data = fs.readFileSync(userDataPath, 'utf8');
  return JSON.parse(data || '{}');
}

function saveUserData(data) {
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

const shopItems = {
  tinapay: 20,
  pandesal: 15,
  monay: 25,
  ensaymada: 30,
  puto: 10,
  'pan de coco': 35,
  biskwit: 5,
  ensaimada: 30,
  'pan de leche': 28,
  mamon: 18,
  'puto bumbong': 40,
  kutsinta: 22,
  bibingka: 50,
  'sapin-sapin': 33,
  buchi: 15,
  'pan de regla': 27,
  galletas: 8,
  rosca: 45,
  barquillos: 12,
  turon: 20,
};

const fruits = {
  apple: 20,
  banana: 40,
  carrots: 69,
  potato: 178,
  rice: 260,
};

function boxMessage(text) {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length));
  const top = '╔' + '═'.repeat(maxLength + 2) + '╗';
  const bottom = '╚' + '═'.repeat(maxLength + 2) + '╝';
  const middle = lines
    .map(line => `║ ${line}${' '.repeat(maxLength - line.length)} ║`)
    .join('\n');
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
    };
  }
}

function buyItem(userId, itemName, qty = 1) {
  const data = loadUserData();
  itemName = itemName.toLowerCase();
  initUser(data, userId);

  if (!shopItems[itemName]) {
    return `❌ Item na '${itemName}' ay wala sa shop.`;
  }
  const price = shopItems[itemName] * qty;

  if (data[userId].balance < price) {
    return `❌ Wala kang sapat na pera! Kailangan mo ng ₱${price}, pero may ₱${data[userId].balance} ka lang.`;
  }

  data[userId].balance -= price;
  if (!data[userId].inventory[itemName]) data[userId].inventory[itemName] = 0;
  data[userId].inventory[itemName] += qty;

  saveUserData(data);

  return `🛒 Bumili ka ng ${qty}x ${itemName} sa halagang ₱${price}.\n💰 Natirang balance: ₱${data[userId].balance}`;
}

function sellItem(userId, itemName, qty = 1) {
  const data = loadUserData();
  itemName = itemName.toLowerCase();
  initUser(data, userId);

  if (!shopItems[itemName]) {
    return `❌ Item na '${itemName}' ay wala sa shop.`;
  }

  if (!data[userId].inventory[itemName] || data[userId].inventory[itemName] < qty) {
    return `❌ Wala kang sapat na '${itemName}' para itinda.`;
  }

  const sellPrice = Math.floor(shopItems[itemName] * 0.7) * qty;

  data[userId].inventory[itemName] -= qty;
  if (data[userId].inventory[itemName] === 0) delete data[userId].inventory[itemName];

  data[userId].balance += sellPrice;

  saveUserData(data);

  return `💰 Naibenta mo ang ${qty}x ${itemName} at kumita ng ₱${sellPrice}.\n💵 Bagong balance: ₱${data[userId].balance}`;
}

function shopStatus() {
  let msg = '🛍️ **Mga Available na Tinapay sa Shop:**\n\n';
  Object.entries(shopItems).forEach(([item, price], i) => {
    msg += `${i + 1}. ${item} - ₱${price}\n`;
  });
  msg += '\n🍎 Mga Available na Prutas:\n';
  Object.entries(fruits).forEach(([fruit, price], i) => {
    msg += `${i + 1}. ${fruit} - ₱${price}\n`;
  });
  return boxMessage(msg);
}

function checkBalance(userId) {
  const data = loadUserData();
  if (!data[userId]) return `Wala kang account. Pwede kang bumili ng item para magsimula!`;
  return `💰 Your balance: ₱${data[userId].balance}`;
}

function buyFruit(userId, fruitName, qty = 1) {
  const data = loadUserData();
  fruitName = fruitName.toLowerCase();
  initUser(data, userId);

  if (!fruits[fruitName]) {
    return `❌ Wala sa prutas ang '${fruitName}'.`;
  }
  const price = fruits[fruitName] * qty;

  if (data[userId].balance < price) {
    return `❌ Wala kang sapat na pera! Kailangan mo ng ₱${price}, pero may ₱${data[userId].balance} ka lang.`;
  }

  data[userId].balance -= price;
  if (!data[userId].inventory[fruitName]) data[userId].inventory[fruitName] = 0;
  data[userId].inventory[fruitName] += qty;

  saveUserData(data);

  return `🍇 Bumili ka ng ${qty}x ${fruitName} sa halagang ₱${price}.\n💰 Natirang balance: ₱${data[userId].balance}`;
}

function transferMoney(senderId, receiverId, amount) {
  const data = loadUserData();
  initUser(data, senderId);
  initUser(data, receiverId);

  amount = parseInt(amount);
  if (isNaN(amount) || amount <= 0) {
    return '❌ Invalid na halaga ng pera.';
  }

  if (data[senderId].balance < amount) {
    return `❌ Wala kang sapat na pera para mag-transfer ng ₱${amount}.`;
  }

  data[senderId].balance -= amount;
  data[receiverId].balance += amount;

  saveUserData(data);

  return `✅ Na-transfer mo ang ₱${amount} kay UID ${receiverId}.\n💰 Natirang balance mo: ₱${data[senderId].balance}`;
}

function loanMoney(userId, amount) {
  const data = loadUserData();
  initUser(data, userId);

  amount = parseInt(amount);
  if (isNaN(amount) || amount <= 0) {
    return '❌ Invalid na halaga ng loan.';
  }

  data[userId].loan += amount;
  data[userId].balance += amount;

  saveUserData(data);

  return `💸 Humiram ka ng ₱${amount}.\n💰 Balance mo ngayon: ₱${data[userId].balance}\n⚠️ Utang mo: ₱${data[userId].loan}`;
}

function repayLoan(userId, amount) {
  const data = loadUserData();
  initUser(data, userId);

  amount = parseInt(amount);
  if (isNaN(amount) || amount <= 0) {
    return '❌ Invalid na halaga ng bayad.';
  }

  if (data[userId].balance < amount) {
    return '❌ Wala kang sapat na pera para magbayad ng utang.';
  }

  if (data[userId].loan <= 0) {
    return '✅ Wala kang utang na kailangang bayaran.';
  }

  if (amount > data[userId].loan) amount = data[userId].loan;

  data[userId].balance -= amount;
  data[userId].loan -= amount;

  saveUserData(data);

  return `💵 Nagbayad ka ng ₱${amount} sa utang mo.\n⚠️ Natitirang utang: ₱${data[userId].loan}\n💰 Balance mo ngayon: ₱${data[userId].balance}`;
}

function hireWorker(userId) {
  const data = loadUserData();
  initUser(data, userId);

  const cost = 500;
  if (data[userId].balance < cost) {
    return `❌ Wala kang sapat na pera para mag-hire ng worker. Kailangan mo ng ₱${cost}.`;
  }

  data[userId].balance -= cost;
  data[userId].workers.push({ level: 1 });

  saveUserData(data);

  return `👷 Nag-hire ka ng bagong worker! Mayroon ka nang ${data[userId].workers.length} worker(s).`;
}

function upgradeWorker(userId, index) {
  const data = loadUserData();
  initUser(data, userId);

  if (index < 0 || index >= data[userId].workers.length) {
    return `❌ Worker index na yan ay wala sa listahan mo.`;
  }

  const worker = data[userId].workers[index];
  const cost = 300 * worker.level;

  if (data[userId].balance < cost) {
    return `❌ Wala kang sapat na pera para i-upgrade ang worker. Kailangan mo ng ₱${cost}.`;
  }

  data[userId].balance -= cost;
  worker.level += 1;

  saveUserData(data);

  return `⚙️ Na-upgrade mo ang worker #${index + 1} sa level ${worker.level}.`;
}

function collectDailyIncome(userId) {
  const data = loadUserData();
  initUser(data, userId);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (now - data[userId].lastCollect < oneDay) {
    const remain = Math.ceil((oneDay - (now - data[userId].lastCollect)) / (60 * 60 * 1000));
    return `⏳ Pwede kang mag-collect ng daily income ulit sa loob ng ${remain} oras.`;
  }

  let totalIncome = 0;
  data[userId].workers.forEach(worker => {
    totalIncome += 50 * worker.level;
  });

  if (totalIncome === 0) {
    return '❌ Wala kang worker na nagbibigay ng daily income. Mag-hire ka muna!';
  }

  data[userId].balance += totalIncome;
  data[userId].lastCollect = now;

  saveUserData(data);

  return `💵 Nakakuha ka ng daily income na ₱${totalIncome} mula sa iyong worker(s).\n💰 Balance mo ngayon: ₱${data[userId].balance}`;
}

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: 'Simplified shop with loans, workers, fruits, transfers, and admin info',
};

module.exports.run = async function({ api, event, args }) {
  const command = args[0] ? args[0].toLowerCase() : '';
  const params = args.slice(1);
  const userId = event.senderID;

  let reply = '';

  switch(command) {
    case 'buy':
      if (!params[0]) return api.sendMessage('❌ Paki-specify ang item na bibilhin.', event.threadID, event.messageID);
      const qtyBuy = parseInt(params[1]) || 1;
      reply = buyItem(userId, params[0], qtyBuy);
      break;
    case 'sell':
      if (!params[0]) return api.sendMessage('❌ Paki-specify ang item na ibebenta.', event.threadID, event.messageID);
      const qtySell = parseInt(params[1]) || 1;
      reply = sellItem(userId, params[0], qtySell);
      break;
    case 'buyfruit':
      if (!params[0]) return api.sendMessage('❌ Paki-specify ang fruit na bibilhin.', event.threadID, event.messageID);
      const qtyFruit = parseInt(params[1]) || 1;
      reply = buyFruit(userId, params[0], qtyFruit);
      break;
    case 'transfer':
      if (!params[0] || !params[1]) return api.sendMessage('❌ Paki-specify ang UID at amount. Halimbawa: transfer 123456789 100', event.threadID, event.messageID);
      reply = transferMoney(userId, params[0], params[1]);
      break;
    case 'loan':
      if (!params[0]) return api.sendMessage('❌ Paki-specify ang halaga ng utang.', event.threadID, event.messageID);
      reply = loanMoney(userId, params[0]);
      break;
    case 'repay':
      if (!params[0]) return api.sendMessage('❌ Paki-specify ang halaga ng bayad.', event.threadID, event.messageID);
      reply = repayLoan(userId, params[0]);
      break;
    case 'hire':
      reply = hireWorker(userId);
      break;
    case 'upgrade':
      if (!params[0]) return api.sendMessage('❌ Paki-specify ang worker index. Halimbawa: upgrade 1', event.threadID, event.messageID);
      reply = upgradeWorker(userId, parseInt(params[0]) - 1);
      break;
    case 'collect':
      reply = collectDailyIncome(userId);
      break;
    case 'shop':
      reply = shopStatus();
      break;
    case 'balance':
      reply = checkBalance(userId);
      break;
    case 'admin':
      reply = boxMessage('🛠️ Creator/Admin Info:\n\nFacebook: https://www.facebook.com/ZeromeNaval.61577040643519');
      break;
    default:
      reply = '❌ Hindi kilalang command. Available commands:\n' +
              '- buy [item] [qty]\n' +
              '- sell [item] [qty]\n' +
              '- buyfruit [fruit] [qty]\n' +
              '- transfer [uid] [amount]\n' +
              '- loan [amount]\n' +
              '- repay [amount]\n' +
              '- hire\n' +
              '- upgrade [worker_index]\n' +
              '- collect\n' +
              '- shop\n' +
              '- balance\n' +
              '- admin';
  }

  return api.sendMessage(boxMessage(reply), event.threadID, event.messageID);
};
