const fs = require('fs');
const path = './user.json';

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: "cshop module with buy, sell, posts, loans, premium, protection, transfer",
};

const adminID = '61575137262643';

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, '{}');
}

let savedMoney = {};
try {
  savedMoney = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {
  console.error('Failed to load user.json:', e);
  savedMoney = {};
}

const users = {};

const fruitsList = [
  { name: 'Apple', price: 10 },
  { name: 'Banana', price: 8 },
  { name: 'Orange', price: 12 },
  { name: 'Mango', price: 20 },
  { name: 'Grapes', price: 15 },
  { name: 'Pineapple', price: 25 },
  { name: 'Strawberry', price: 30 },
  { name: 'Watermelon', price: 18 },
  { name: 'Cherry', price: 22 },
  { name: 'Peach', price: 14 },
  { name: 'Pear', price: 16 },
  { name: 'Kiwi', price: 19 },
  { name: 'Papaya', price: 17 },
  { name: 'Plum', price: 21 },
  { name: 'Coconut', price: 24 },
  { name: 'Lemon', price: 13 },
  { name: 'Blueberry', price: 28 },
  { name: 'Guava', price: 23 },
  { name: 'Melon', price: 20 },
  { name: 'Avocado', price: 26 },
];

function saveMoney() {
  for (const uid in users) {
    savedMoney[uid] = users[uid].money;
  }
  fs.writeFileSync(path, JSON.stringify(savedMoney, null, 2));
}

function box(message, type = '') {
  const emojis = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    post: '📝',
    bonus: '💰',
    social: '📱',
    loan: '💵',
    transfer: '💸',
    shop: '🛒',
  };
  const emoji = emojis[type] || '';
  return `╔═══════════════╗
${emoji} ${message}
╚═══════════════╝

<a href="https://ibb.co/svK2dgZj"><img src="https://i.ibb.co/PZcNvrdx/img-1-1754226722176.jpg" alt="img" border="0"></a>

Contact my developer https://www.facebook.com/haraamihan.25371`;
}

function findFruit(name) {
  return fruitsList.find(f => f.name.toLowerCase() === name.toLowerCase());
}

function checkProtection(user) {
  if (user.protection && user.protectionUntil) {
    if (Date.now() > user.protectionUntil) {
      user.protection = false;
      user.protectionUntil = null;
    }
  }
}

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const messageID = event.messageID;

  if (!users[senderID]) {
    users[senderID] = {
      money: savedMoney[senderID] || 500,
      fruits: {},
      seeds: {},
      posts: [],
      loan: 0,
      protection: false,
      premium: false,
      nickname: `User${senderID.slice(-4)}`,
      protectionUntil: null,
      lastEarn: 0,
    };
  }

  const user = users[senderID];
  checkProtection(user);
  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    case 'buy': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'fruits') {
        const fruitName = args.slice(2).join(' ');
        if (!fruitName) return api.sendMessage(box('Please specify fruit name to buy.', 'error'), senderID, messageID);
        const fruit = findFruit(fruitName);
        if (!fruit) return api.sendMessage(box('Fruit not found.', 'error'), senderID, messageID);
        if (user.money < fruit.price) return api.sendMessage(box('Insufficient money to buy this fruit.', 'error'), senderID, messageID);
        user.money -= fruit.price;
        user.fruits[fruit.name] = (user.fruits[fruit.name] || 0) + 1;
        saveMoney();
        return api.sendMessage(box(`Bought 1 ${fruit.name} for $${fruit.price}.`, 'success'), senderID, messageID);
      }
      if (sub === 'seed') {
        const seedName = args.slice(2).join(' ');
        if (!seedName) return api.sendMessage(box('Please specify seed name to buy.', 'error'), senderID, messageID);
        const fruit = findFruit(seedName);
        if (!fruit) return api.sendMessage(box('Seed not found.', 'error'), senderID, messageID);
        const seedPrice = Math.floor(fruit.price / 2);
        if (user.money < seedPrice) return api.sendMessage(box('Insufficient money to buy this seed.', 'error'), senderID, messageID);
        user.money -= seedPrice;
        user.seeds[fruit.name] = (user.seeds[fruit.name] || 0) + 1;
        saveMoney();
        return api.sendMessage(box(`Bought 1 ${fruit.name} seed for $${seedPrice}.`, 'success'), senderID, messageID);
      }
      if (sub === 'protection') {
        const price = 56;
        const now = Date.now();
        const duration = 24 * 60 * 60 * 1000;
        if (user.money < price) return api.sendMessage(box('Insufficient money to buy protection.', 'error'), senderID, messageID);
        user.money -= price;
        user.protection = true;
        user.protectionUntil = now + duration;
        await api.sendMessage(`Protection bought by ${user.nickname} for $${price}.`, adminID);
        saveMoney();
        return api.sendMessage(box(`You bought protection for $${price}.`, 'success'), senderID, messageID);
      }
      if (sub === 'premium') {
        const price = 100;
        if (user.money < price) return api.sendMessage(box('Insufficient money to buy premium.', 'error'), senderID, messageID);
        user.money -= price;
        user.premium = true;
        await api.sendMessage(`Premium bought by ${user.nickname} for $${price}.`, adminID);
        saveMoney();
        return api.sendMessage(box(`You bought premium for $${price}.`, 'success'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown buy command.', 'error'), senderID, messageID);
    }

    case 'sell': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'fruits') {
        const fruitName = args.slice(2).join(' ');
        if (!fruitName) return api.sendMessage(box('Please specify fruit name to sell.', 'error'), senderID, messageID);
        const fruit = findFruit(fruitName);
        if (!fruit) return api.sendMessage(box('Fruit not found.', 'error'), senderID, messageID);
        if (!user.fruits[fruit.name] || user.fruits[fruit.name] < 1) return api.sendMessage(box('You do not have this fruit to sell.', 'error'), senderID, messageID);
        const sellPrice = Math.floor(fruit.price * 0.7);
        user.fruits[fruit.name]--;
        if (user.fruits[fruit.name] === 0) delete user.fruits[fruit.name];
        user.money += sellPrice;
        saveMoney();
        return api.sendMessage(box(`Sold 1 ${fruit.name} for $${sellPrice}.`, 'success'), senderID, messageID);
      }
      if (sub === 'seed') {
        const seedName = args.slice(2).join(' ');
        if (!seedName) return api.sendMessage(box('Please specify seed name to sell.', 'error'), senderID, messageID);
        const fruit = findFruit(seedName);
        if (!fruit) return api.sendMessage(box('Seed not found.', 'error'), senderID, messageID);
        if (!user.seeds[fruit.name] || user.seeds[fruit.name] < 1) return api.sendMessage
