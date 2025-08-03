module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: "Complete cshop module with fruits, posts, loans, premium, protection, transfer, and more",
};

const adminID = '61575137262643'; // Admin UID

// Sample user database (replace with your DB)
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

// Utility box message with emoji and image + developer contact
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

function save() {
  // Implement DB saving here
}

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const messageID = event.messageID;

  if (!users[senderID]) {
    users[senderID] = {
      money: 500,
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
    // BUY COMMANDS
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
        save();
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
        save();
        return api.sendMessage(box(`Bought 1 ${fruit.name} seed for $${seedPrice}.`, 'success'), senderID, messageID);
      }
      if (sub === 'protection') {
        const price = 56;
        if (user.money < price) return api.sendMessage(box('Insufficient money to buy protection.', 'error'), senderID, messageID);
        user.money -= price;
        user.protection = true;
        api.sendMessage(`Protection bought by ${user.nickname} for $${price}.`, adminID);
        save();
        return api.sendMessage(box(`You bought protection for $${price}.`, 'success'), senderID, messageID);
      }
      if (sub === 'premium') {
        const price = 100;
        if (user.money < price) return api.sendMessage(box('Insufficient money to buy premium.', 'error'), senderID, messageID);
        user.money -= price;
        user.premium = true;
        api.sendMessage(`Premium bought by ${user.nickname} for $${price}.`, adminID);
        save();
        return api.sendMessage(box(`You bought premium for $${price}.`, 'success'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown buy command.', 'error'), senderID, messageID);
    }

    // SELL COMMANDS
    case 'sell': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'fruits') {
        const fruitName = args.slice(2).join(' ');
        if (!fruitName) return api.sendMessage(box('Please specify fruit name to sell.', 'error'), senderID, messageID);
        const fruit = findFruit(fruitName);
        if (!fruit) return api.sendMessage(box('Fruit not found.', 'error'), senderID, messageID);
        if (!user.fruits[fruit.name] || user.fruits[fruit.name] <= 0) return api.sendMessage(box(`You don't have any ${fruit.name} to sell.`, 'error'), senderID, messageID);
        const sellPrice = Math.floor(fruit.price * 0.7);
        user.fruits[fruit.name]--;
        user.money += sellPrice;
        save();
        return api.sendMessage(box(`Sold 1 ${fruit.name} for $${sellPrice}.`, 'success'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown sell command.', 'error'), senderID, messageID);
    }

    // GARDEN - grow seeds to fruits
    case 'garden': {
      let grown = [];
      for (const seedName in user.seeds) {
        if (user.seeds[seedName] > 0) {
          user.seeds[seedName]--;
          user.fruits[seedName] = (user.fruits[seedName] || 0) + 1;
          grown.push(seedName);
        }
      }
      if (grown.length === 0) return api.sendMessage(box('No seeds to grow.', 'error'), senderID, messageID);
      save();
      return api.sendMessage(box(`Grown seeds into fruits: ${grown.join(', ')}`, 'success'), senderID, messageID);
    }

    // EARN from fruits
    case 'earn': {
      let totalEarn = 0;
      for (const f in user.fruits) {
        const fruit = findFruit(f);
        if (fruit && user.fruits[f] > 0) {
          totalEarn += fruit.price * user.fruits[f] * 0.5;
          user.fruits[f] = 0;
        }
      }
      if (totalEarn === 0) return api.sendMessage(box('No fruits to earn from.', 'error'), senderID, messageID);
      user.money += Math.floor(totalEarn);
      save();
      return api.sendMessage(box(`You earned $${Math.floor(totalEarn)} from your fruits!`, 'success'), senderID, messageID);
    }

    // POST commands
    case 'post': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'dashboard') {
        if (!user.posts.length) return api.sendMessage(box('You have no posts yet.', 'post'), senderID, messageID);
        let earned = 0;
        let message = 'Your posts with >=40%:\n';
        user.posts.forEach(post => {
          if (post.percent >= 40) {
            earned += 300;
            message += `- ${post.title} (${post.percent}%)\n`;
          }
        });
        if (earned > 0) {
          user.money += earned;
          save();
          message += `\nYou earned $${earned} for posts >=40%. New balance: $${user.money}`;
        } else {
          message = 'No posts with >=40% found.';
        }
        return api.sendMessage(box(message, 'bonus'), senderID, messageID);
      }
      if (sub === 'add') {
        if (args.length < 4) return api.sendMessage(box('Usage: cshop post add <title> <percent>', 'error'), senderID, messageID);
        const percent = parseInt(args[args.length - 1]);
        const title = args.slice(2, -1).join(' ');
        if (!title || isNaN(percent)) return api.sendMessage(box('Usage: cshop post add <title> <percent>', 'error'), senderID, messageID);
        user.posts.push({ title, percent });
        save();
        return api.sendMessage(box(`Added post "${title}" with percent ${percent}%.`, 'post'), senderID, messageID);
      }
      if (sub === 'social') {
        if (!user.posts.length) return api.sendMessage(box('You have no social media posts.', 'social'), senderID, messageID);
        let message = 'Your Social Media Posts:\n';
        user.posts.forEach((post, i) => {
          message += `${i + 1}. ${post.title} - ${post.percent}%\n`;
        });
        return api.sendMessage(box(message, 'social'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown post command.', 'error'), senderID, messageID);
    }

    // LOAN commands
    case 'loan': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'get') {
        const amount = parseInt(args[2]);
        if (isNaN(amount) || amount <= 0) return api.sendMessage(box('Usage: cshop loan get <amount>', 'error'), senderID, messageID);
        user.loan += amount;
        user.money += amount;
        save();
        return api.sendMessage(box(`Loan granted: $${amount}. You owe $${user.loan} total.`, 'loan'), senderID, messageID);
      }
      if (sub === 'pay') {
        const amount = parseInt(args[2]);
        if (isNaN(amount) || amount <= 0) return api.sendMessage(box('Usage: cshop loan pay <amount>', 'error'), senderID, messageID);
        if (amount > user.money) return api.sendMessage(box('Insufficient money to pay loan.', 'error'), senderID, messageID);
        if (amount > user.loan) return api.sendMessage(box(`Your loan is only $${user.loan}.`, 'error'), senderID, messageID);
        user.loan -= amount;
        user.money -= amount;
        save();
        return api.sendMessage(box(`Loan payment of $${amount} successful. Remaining loan: $${user.loan}`, 'loan'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown loan command.', 'error'), senderID, messageID);
    }

    // TRANSFER money by UID
    case 'transfer': {
      const targetUID = args[1];
      const amount = parseInt(args[2]);
      if (!targetUID || isNaN(amount) || amount <= 0) return api.sendMessage(box('Usage: cshop transfer <UID> <amount>', 'error'), senderID, messageID);
      if (targetUID === senderID) return api.sendMessage(box('You cannot transfer money to yourself.', 'error'), senderID, messageID);
      if (!users[targetUID]) return api.sendMessage(box('Target user not found.', 'error'), senderID, messageID);
      if (user.money < amount) return api.sendMessage(box('Insufficient funds to transfer.', 'error'), senderID, messageID);
      user.money -= amount;
      users[targetUID].money = (users[targetUID].money || 0) + amount;
      save();
      return api.sendMessage(box(`Transferred $${amount} to ${users[targetUID].nickname || targetUID}.`, 'transfer'), senderID, messageID);
    }

    // PROFILE command
    case 'profile': {
      let fruitsOwned = Object.entries(user.fruits).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None';
      let seedsOwned = Object.entries(user.seeds).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None';
      let msg = `Nickname: ${user.nickname}
Money: $${user.money}
Loan: $${user.loan}
Protection: ${user.protection ? 'Yes' : 'No'}
Premium: ${user.premium ? 'Yes' : 'No'}
Fruits: ${fruitsOwned}
Seeds: ${seedsOwned}
Posts: ${user.posts.length}`;
      return api.sendMessage(box(msg, 'info'), senderID, messageID);
    }

    // LIST top users by money and show nickname
    case 'list': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'top') {
        // Sort users by money desc
        const sorted = Object.entries(users).sort((a, b) => (b[1].money || 0) - (a[1].money || 0));
        let msg = 'Top Users:\n';
        sorted.slice(0, 10).forEach(([uid, u], i) => {
          msg += `${i + 1}. ${u.nickname || uid} - $${u.money}\n`;
        });
        return api.sendMessage(box(msg, 'info'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown list command.', 'error'), senderID, messageID);
    }

    // HELP command with box + image
    case 'help': {
      const helpMsg = 
`cshop Commands:

buy fruits <name> - Buy a fruit
buy seed <name> - Buy a seed
buy protection - Buy protection $56
buy premium - Buy premium $100
sell fruits <name> - Sell a fruit
garden - Grow your seeds into fruits
earn - Earn money from fruits
post add <title> <percent> - Add a post
post dashboard - Check posts with >=40% earnings
post social - Show social media posts
loan get <amount> - Get loan
loan pay <amount> - Pay loan
transfer <UID> <amount> - Transfer money to user
profile - Show your profile
list top - Show top users`;

      return api.sendMessage(box(helpMsg, 'info'), senderID, messageID);
    }

    default:
      return api.sendMessage(box('Unknown command. Use cshop help for list.', 'error'), senderID, messageID);
  }
};
