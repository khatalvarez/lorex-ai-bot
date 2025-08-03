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

let savedMoney = {};
try {
  savedMoney = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch {
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

Contact my developer https://www.facebook.com/haraamihan.25371`;
}

function findFruit(name) {
  return fruitsList.find(f => f.name.toLowerCase() === name.toLowerCase());
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
    };
  }

  const user = users[senderID];
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
        if (user.money < price) return api.sendMessage(box('Insufficient money to buy protection.', 'error'), senderID, messageID);
        user.money -= price;
        user.protection = true;
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
        if (!user.seeds[fruit.name] || user.seeds[fruit.name] < 1) return api.sendMessage(box('You do not have this seed to sell.', 'error'), senderID, messageID);
        const seedSellPrice = Math.floor((fruit.price / 2) * 0.7);
        user.seeds[fruit.name]--;
        if (user.seeds[fruit.name] === 0) delete user.seeds[fruit.name];
        user.money += seedSellPrice;
        saveMoney();
        return api.sendMessage(box(`Sold 1 ${fruit.name} seed for $${seedSellPrice}.`, 'success'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown sell command.', 'error'), senderID, messageID);
    }

    case 'garden': {
      const msg = `Your Garden:

Fruits:
${Object.entries(user.fruits).map(([f, c]) => `${f}: ${c}`).join('\n') || 'None'}

Seeds:
${Object.entries(user.seeds).map(([s, c]) => `${s}: ${c}`).join('\n') || 'None'}`;

      return api.sendMessage(box(msg, 'info'), senderID, messageID);
    }

    case 'earn': {
      const earnAmount = Math.floor(Math.random() * 16) + 5;
      user.money += earnAmount;
      saveMoney();
      return api.sendMessage(box(`You earned $${earnAmount} today!`, 'bonus'), senderID, messageID);
    }

    case 'post': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'add') {
        const content = args.slice(2).join(' ');
        if (!content) return api.sendMessage(box('Please provide content to post.', 'error'), senderID, messageID);
        user.posts.push(content);
        return api.sendMessage(box('Post added!', 'post'), senderID, messageID);
      }
      if (sub === 'list') {
        if (user.posts.length === 0) return api.sendMessage(box('You have no posts.', 'info'), senderID, messageID);
        const postsList = user.posts.map((p, i) => `${i + 1}. ${p}`).join('\n');
        return api.sendMessage(box(`Your posts:\n${postsList}`, 'post'), senderID, messageID);
      }
      if (sub === 'remove') {
        const index = parseInt(args[2], 10);
        if (!index || index < 1 || index > user.posts.length) return api.sendMessage(box('Invalid post number to remove.', 'error'), senderID, messageID);
        user.posts.splice(index - 1, 1);
        return api.sendMessage(box('Post removed.', 'post'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown post command.', 'error'), senderID, messageID);
    }

    case 'loan': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'borrow') {
        if (user.loan > 0) return api.sendMessage(box('You already have a loan. Pay it first.', 'error'), senderID, messageID);
        const amount = parseInt(args[2], 10);
        if (!amount || amount < 50) return api.sendMessage(box('Minimum loan amount is $50.', 'error'), senderID, messageID);
        user.money += amount;
        user.loan = amount;
        saveMoney();
        return api.sendMessage(box(`You borrowed $${amount}.`, 'loan'), senderID, messageID);
      }
      if (sub === 'pay') {
        if (user.loan === 0) return api.sendMessage(box('You have no loan to pay.', 'error'), senderID, messageID);
        const amount = parseInt(args[2], 10);
        if (!amount || amount < 1) return api.sendMessage(box('Please specify amount to pay.', 'error'), senderID, messageID);
        if (amount > user.money) return api.sendMessage(box('Insufficient money to pay loan.', 'error'), senderID, messageID);
        if (amount > user.loan) return api.sendMessage(box(`You only owe $${user.loan}.`, 'error'), senderID, messageID);
        user.money -= amount;
        user.loan -= amount;
        saveMoney();
        if (user.loan === 0) {
          return api.sendMessage(box('Loan fully paid!', 'success'), senderID, messageID);
        }
        return api.sendMessage(box(`Paid $${amount}. Remaining loan: $${user.loan}`, 'loan'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown loan command.', 'error'), senderID, messageID);
    }

    case 'transfer': {
      const targetID = args[1];
      const amount = parseInt(args[2], 10);
      if (!targetID || !amount) return api.sendMessage(box('Please specify target ID and amount to transfer.', 'error'), senderID, messageID);
      if (targetID === senderID) return api.sendMessage(box('You cannot transfer money to yourself.', 'error'), senderID, messageID);
      if (user.money < amount) return api.sendMessage(box('Insufficient money to transfer.', 'error'), senderID, messageID);

      if (!users[targetID]) {
        users[targetID] = {
          money: savedMoney[targetID] || 500,
          fruits: {},
          seeds: {},
          posts: [],
          loan: 0,
          protection: false,
          premium: false,
          nickname: `User${targetID.slice(-4)}`,
        };
      }

      user.money -= amount;
      users[targetID].money += amount;
      saveMoney();

      await api.sendMessage(box(`You transferred $${amount} to ${users[targetID].nickname}.`, 'transfer'), senderID, messageID);
      return api.sendMessage(box(`Received $${amount} from ${user.nickname}.`, 'transfer'), targetID);
    }

    default:
      return api.sendMessage(box('Unknown command.', 'error'), senderID, messageID);
  }
};
