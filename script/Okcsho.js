const fs = require('fs');
const path = './data/users.json';

const ADMIN_UID = '61575137262643';
const DAILY_CLAIM_AMOUNT = 9800;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours cooldown

function loadUsers() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

function saveUsers(users) {
  fs.writeFileSync(path, JSON.stringify(users, null, 2));
}

function boxMessage(title, content) {
  return `╔═══════ ${title} ═══════\n${content}\n╚═══════════════════════`;
}

function send(api, threadID, message) {
  api.sendMessage(message, threadID);
}

// Send auto notifications to all group chats (example: all threads with 'threadID' in global array)
// For demonstration, assume you have a global array of group threadIDs called `globalGroupThreads`
async function sendAllGroups(api, message) {
  if (typeof globalGroupThreads === 'undefined') return;
  for (const tid of globalGroupThreads) {
    try {
      await api.sendMessage(message, tid);
    } catch {}
  }
}

const fruitsList = {
  apple: 10, banana: 15, orange: 12, mango: 20, grapes: 18,
  pineapple: 25, watermelon: 30, strawberry: 22, kiwi: 24, peach: 17,
  cherry: 28, blueberry: 26, lemon: 13, lime: 14, papaya: 19,
  pear: 16, plum: 21, raspberry: 27, blackberry: 23, coconut: 29
};

module.exports.config = {
  name: 'cshop',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: "Community Shop with login, buy, sell, profile, daily, loan, workers, friends, messages.",
};

module.exports.run = async function({ api, event, args }) {
  let users = loadUsers();
  const senderID = event.senderID;
  const threadID = event.threadID;
  if (!users[senderID]) {
    users[senderID] = {
      money: 0,
      password: null,
      loggedIn: false,
      username: null,
      inventory: {},
      friends: [],
      inbox: [],
      loan: 0,
      lastDaily: 0,
      cshopFruits: 0,
      cshopWorkers: 0,
    };
  }

  const user = users[senderID];
  const cmd = args[0] ? args[0].toLowerCase() : '';

  switch (cmd) {
    case 'register': {
      if (user.loggedIn) return send(api, threadID, boxMessage('Register', 'You are already registered and logged in.'));
      const password = args[1];
      if (!password) return send(api, threadID, boxMessage('Register', 'Usage: cshop register <password>'));
      user.password = password;
      user.loggedIn = true;
      saveUsers(users);
      return send(api, threadID, boxMessage('Register', 'Registration successful! You are now logged in.'));
    }

    case 'login': {
      if (user.loggedIn) return send(api, threadID, boxMessage('Login', 'You are already logged in.'));
      const password = args[1];
      if (!password) return send(api, threadID, boxMessage('Login', 'Usage: cshop login <password>'));
      if (user.password !== password) return send(api, threadID, boxMessage('Login', 'Incorrect password.'));
      user.loggedIn = true;
      saveUsers(users);
      return send(api, threadID, boxMessage('Login', 'Login successful!'));
    }

    case 'buy': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Buy', 'You must be logged in to buy items.'));
      const item = args[1] ? args[1].toLowerCase() : null;
      let quantity = parseInt(args[2]) || 1;
      if (!item || !fruitsList[item]) return send(api, threadID, boxMessage('Buy', `Available fruits: ${Object.keys(fruitsList).join(', ')}`));
      if (quantity <= 0) quantity = 1;

      // Protection item ₱700
      if (item === 'protection') {
        if (user.money < 700) return send(api, threadID, boxMessage('Buy Protection', 'Insufficient funds for Protection (₱700).'));
        user.money -= 700;
        saveUsers(users);
        await api.sendMessage(`🛡️ User ${user.username || senderID} bought Protection for ₱700!`, threadID);
        return send(api, threadID, boxMessage('Buy Protection', 'Protection purchased successfully.'));
      }

      // Premium item ₱460, payment goes to admin
      if (item === 'premium') {
        if (user.money < 460) return send(api, threadID, boxMessage('Buy Premium', 'Insufficient funds for Premium (₱460).'));
        user.money -= 460;
        // Give money to admin user account
        if (!users[ADMIN_UID]) users[ADMIN_UID] = { money: 0, password: null, loggedIn: false, username: 'Admin', inventory: {}, friends: [], inbox: [], loan: 0, lastDaily: 0, cshopFruits: 0, cshopWorkers: 0 };
        users[ADMIN_UID].money += 460;
        saveUsers(users);
        await api.sendMessage(`✨ User ${user.username || senderID} bought Premium for ₱460!`, threadID);
        return send(api, threadID, boxMessage('Buy Premium', 'Premium purchased successfully. Payment sent to Admin.'));
      }

      const cost = fruitsList[item] * quantity;
      if (user.money < cost) return send(api, threadID, boxMessage('Buy', `Insufficient funds! You need ₱${cost} but have ₱${user.money}.`));

      user.money -= cost;
      user.inventory[item] = (user.inventory[item] || 0) + quantity;

      // Auto notify all groups when purchase is made
      await sendAllGroups(api, `🍎 New purchase alert!\nUser ${user.username || senderID} bought ${quantity} ${item}(s) for ₱${cost}.`);

      saveUsers(users);
      return send(api, threadID, boxMessage('Buy', `You bought ${quantity} ${item}(s) for ₱${cost}.`));
    }

    case 'sell': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Sell', 'You must be logged in to sell items.'));
      const item = args[1] ? args[1].toLowerCase() : null;
      let quantity = parseInt(args[2]) || 1;
      if (!item || !fruitsList[item]) return send(api, threadID, boxMessage('Sell', `Available fruits: ${Object.keys(fruitsList).join(', ')}`));
      if (quantity <= 0) quantity = 1;
      if (!user.inventory[item] || user.inventory[item] < quantity) return send(api, threadID, boxMessage('Sell', `You don't have enough ${item} to sell.`));

      const sellPrice = Math.floor(fruitsList[item] * 0.8) * quantity;
      user.inventory[item] -= quantity;
      if (user.inventory[item] <= 0) delete user.inventory[item];
      user.money += sellPrice;

      saveUsers(users);
      return send(api, threadID, boxMessage('Sell', `You sold ${quantity} ${item}(s) for ₱${sellPrice}.`));
    }

    case 'balance': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Balance', `You must be logged in to check your balance.`));
      return send(api, threadID, boxMessage('Balance', `Your balance is ₱${user.money}.`));
    }

    case 'profile': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Profile', 'You must be logged in to view your profile.'));
      const inventoryStr = Object.entries(user.inventory).map(([f, q]) => `${f}: ${q}`).join('\n') || 'No fruits in inventory.';
      const friendsCount = user.friends.length || 0;
      const loan = user.loan || 0;
      const username = user.username || 'Not set';

      const profileMsg = `Username: ${username}\nMoney: ₱${user.money}\nLoan: ₱${loan}\nFriends: ${friendsCount}\nFruits:\n${inventoryStr}\nWorkers: ${user.cshopWorkers}`;
      return send(api, threadID, boxMessage('Profile', profileMsg));
    }

    case 'set': {
      if (args[1] && args[1].toLowerCase() === 'username') {
        if (!user.loggedIn) return send(api, threadID, boxMessage('Set Username', 'You must be logged in to set your username.'));
        const newUsername = args.slice(2).join(' ');
        if (!newUsername) return send(api, threadID, boxMessage('Set Username', 'Usage: cshop set username <new username>'));
        user.username = newUsername;
        saveUsers(users);
        return send(api, threadID, boxMessage('Username Updated', `Your username has been set to:\n${newUsername}`));
      }
      return send(api, threadID, boxMessage('Set', 'Usage: cshop set username <new username>'));
    }

    case 'daily': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Daily Claim', 'You must be logged in to claim daily rewards.'));
      const now = Date.now();
      if (user.lastDaily && (now - user.lastDaily) < DAILY_COOLDOWN) {
        const remaining = DAILY_COOLDOWN - (now - user.lastDaily);
        const hrs = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        return send(api, threadID, boxMessage('Daily Claim', `You already claimed your daily reward.\nTry again in ${hrs}h ${mins}m.`));
      }
      user.money += DAILY_CLAIM_AMOUNT;
      user.lastDaily = now;
      saveUsers(users);

      await sendAllGroups(api, `🎉 User ${user.username || senderID} claimed their daily ₱${DAILY_CLAIM_AMOUNT}!`);

      return send(api, threadID, boxMessage('Daily Claim', `You claimed ₱${DAILY_CLAIM_AMOUNT} successfully!\nNew balance: ₱${user.money}.`));
    }

    case 'loan': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Loan', 'You must be logged in to take a loan.'));
      let amount = parseInt(args[1]);
      if (!amount || amount <= 0) return send(api, threadID, boxMessage('Loan', 'Usage: cshop loan <amount>'));
      user.money += amount;
      user.loan = (user.loan || 0) + amount;

      // Deduct ₱100 fee on loan
      user.money -= 100;

      saveUsers(users);

      await sendAllGroups(api, `⚠️ User ${user.username || senderID} took a loan of ₱${amount} and paid ₱100 fee.`);

      return send(api, threadID, boxMessage('Loan Granted', `You received a loan of ₱${amount}.\nTotal loan debt: ₱${user.loan}.\n₱100 fee has been deducted.`));
    }

    case 'repay': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Repay', 'You must be logged in to repay loans.'));
      let repayAmount = parseInt(args[1]);
      if (!repayAmount || repayAmount <= 0) return send(api, threadID, boxMessage('Repay', 'Usage: cshop repay <amount>'));
      if (user.money < repayAmount) return send(api, threadID, boxMessage('Repay', 'You do not have enough money to repay this amount.'));
      if (!user.loan || user.loan <= 0) return send(api, threadID, boxMessage('Repay', 'You have no loan to repay.'));
      if (repayAmount > user.loan) repayAmount = user.loan;

      user.money -= repayAmount;
      user.loan -= repayAmount;
      saveUsers(users);

      return send(api, threadID, boxMessage('Loan Repayment', `You repaid ₱${repayAmount} of your loan.\nRemaining loan: ₱${user.loan}.`));
    }

    case 'worker': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Worker', 'You must be logged in to manage workers.'));
      const subcmd = args[1] ? args[1].toLowerCase() : '';
      if (subcmd === 'buy') {
        if (user.money < 20) return send(api, threadID, boxMessage('Worker Buy', 'You do not have enough money to buy a worker (₱20).'));
        user.money -= 20;
        user.cshopWorkers = (user.cshopWorkers || 0) + 1;
        saveUsers(users);

        await sendAllGroups(api, `👷 User ${user.username || senderID} bought a CShop worker for ₱20!`);

        return send(api, threadID, boxMessage('Worker Buy', 'You successfully bought a worker for ₱20.'));
      } else if (subcmd === 'status') {
        return send(api, threadID, boxMessage('Worker Status', `You currently have ${user.cshopWorkers || 0} worker(s) in your CShop.`));
      } else {
        return send(api, threadID, boxMessage('Worker', 'Usage: cshop worker buy\ncshop worker status'));
      }
    }

    case 'friend': {
      if (!user.loggedIn) return send(api, threadID, boxMessage('Friend', 'You must be logged in to manage friends.'));
      const action = args[1] ? args[1].toLowerCase() : '';
      const friendID = args[2];
      if (!action || !friendID) return send(api, threadID, boxMessage('Friend', 'Usage: cshop friend add|remove
