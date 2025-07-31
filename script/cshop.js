const fs = require('fs');
const path = require('path');

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

function buyItem(userId, itemName, qty = 1) {
  const data = loadUserData();
  itemName = itemName.toLowerCase();

  if (!shopItems[itemName]) {
    return `❌ Item na '${itemName}' ay wala sa shop.`;
  }
  const price = shopItems[itemName] * qty;

  if (!data[userId]) {
    data[userId] = { balance: 1000, inventory: {} };
  }

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

  if (!shopItems[itemName]) {
    return `❌ Item na '${itemName}' ay wala sa shop.`;
  }

  if (!data[userId] || !data[userId].inventory[itemName] || data[userId].inventory[itemName] < qty) {
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
  return boxMessage(msg);
}

function checkBalance(userId) {
  const data = loadUserData();
  if (!data[userId]) return `Wala kang account. Pwede kang bumili ng item para magsimula!`;
  return `💰 Your balance: ₱${data[userId].balance}`;
}

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  description: 'Simplified Shop with balance saved to JSON file',
  usages: '[buy|sell|status|balance] [args]',
  cooldowns: 5,
  permissions: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const command = args[0];
  const params = args.slice(1);
  const userId = event.senderID;

  switch (command) {
    case 'buy': {
      if (params.length < 1)
        return api.sendMessage('❌ Ilagay ang item na bibilhin. Halimbawa: buy tinapay', event.threadID, event.messageID);
      const item = params[0];
      const qty = params[1] ? parseInt(params[1]) : 1;
      const res = buyItem(userId, item, qty);
      return api.sendMessage(boxMessage(res), event.threadID, event.messageID);
    }

    case 'sell': {
      if (params.length < 1)
        return api.sendMessage('❌ Ilagay ang item na ititinda. Halimbawa: sell tinapay', event.threadID, event.messageID);
      const item = params[0];
      const qty = params[1] ? parseInt(params[1]) : 1;
      const res = sellItem(userId, item, qty);
      return api.sendMessage(boxMessage(res), event.threadID, event.messageID);
    }

    case 'status': {
      const res = shopStatus();
      return api.sendMessage(res, event.threadID, event.messageID);
    }

    case 'balance': {
      const res = checkBalance(userId);
      return api.sendMessage(boxMessage(res), event.threadID, event.messageID);
    }

    default:
      return api.sendMessage(
        '❌ Hindi kilalang command. Available commands:\n' +
          '- buy [item] [qty]\n' +
          '- sell [item] [qty]\n' +
          '- status\n' +
          '- balance',
        event.threadID,
        event.messageID
      );
  }
};
