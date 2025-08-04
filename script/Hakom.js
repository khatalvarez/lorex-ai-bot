const fs = require('fs');
const path = './data/users.json';

// Load user data
function loadUsers() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

// Save user data
function saveUsers(users) {
  fs.writeFileSync(path, JSON.stringify(users, null, 2));
}

// Check if logged in (simplified)
function isLoggedIn(uid, users) {
  return users[uid] && users[uid].loggedIn === true;
}

// Send message shortcut
function send(api, threadID, message) {
  api.sendMessage(message, threadID);
}

// Generate random redeem code
function generateRedeemCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports.config = {
  name: 'giga',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Giga system with balance, transfer, redeem, collect, games etc.',
  usages: 'balance/transfer/redem/collect/games',
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const users = loadUsers();
  const senderID = event.senderID;
  const threadID = event.threadID;

  // Ensure user data exists
  if (!users[senderID]) {
    users[senderID] = {
      money: 0,
      earnings: 0,
      loggedIn: true, // For demo assume logged in
      lastRedeem: 0,
    };
  }

  const user = users[senderID];
  const cmd = args[0] ? args[0].toLowerCase() : '';

  // Constants
  const REDEEM_REWARD = 89000;
  const REDEEM_COOLDOWN = (3600 + 59) * 1000; // 1 hour 59 sec

  switch (cmd) {
    case 'balance': {
      if (!isLoggedIn(senderID, users))
        return send(api, threadID, '❌ You must be logged in to view balance.');

      return send(api, threadID, `💰 Your balance: ${user.money} 💵`);
    }

    case 'transfer': {
      if (!isLoggedIn(senderID, users))
        return send(api, threadID, '❌ You must be logged in to transfer money.');

      const recipientUID = args[1];
      const amount = parseInt(args[2]);

      if (!recipientUID || isNaN(amount) || amount <= 0)
        return send(api, threadID, '❗ Usage: giga transfer <uid> <amount>');

      if (!(recipientUID in users))
        return send(api, threadID, '❌ Recipient UID not found.');

      if (recipientUID === senderID)
        return send(api, threadID, '❌ Hindi pwedeng mag-transfer sa sarili.');

      if (user.money < amount)
        return send(api, threadID, '❌ Wala kang sapat na pera para mag-transfer.');

      user.money -= amount;
      users[recipientUID].money += amount;

      saveUsers(users);

      return send(api, threadID, `✅ Successfully transferred ${amount} 💵 to UID: ${recipientUID}.`);
    }

    case 'redem': {
      if (!isLoggedIn(senderID, users))
        return send(api, threadID, '❌ You must be logged in to redeem codes.');

      if (!users.redeemCodes) users.redeemCodes = {};

      const now = Date.now();

      if (user.lastRedeem && now - user.lastRedeem < REDEEM_COOLDOWN) {
        const remain = Math.ceil((REDEEM_COOLDOWN - (now - user.lastRedeem)) / 1000);
        return send(api, threadID, `⏳ May cooldown pa ang redeem. Subukan mo ulit after ${remain} seconds.`);
      }

      const arg = args[1] ? args[1].toLowerCase() : null;

      if (!arg) return send(api, threadID, '❗ Usage: giga redem <new|code>');

      if (arg === 'new') {
        const code = generateRedeemCode();
        users.redeemCodes[code] = REDEEM_REWARD;
        saveUsers(users);
        return send(api, threadID, `🎟️ Redeem code generated: ${code}\nUse: giga redem ${code}`);
      }

      // Redeem code
      const code = args[1];
      if (!(code in users.redeemCodes)) {
        return send(api, threadID, '❌ Invalid or expired redeem code.');
      }

      const amount = users.redeemCodes[code];
      user.money += amount;

      delete users.redeemCodes[code];
      user.lastRedeem = now;

      saveUsers(users);

      return send(api, threadID, `✅ Successfully redeemed code! Nakakuha ka ng ${amount} 💵.`);
    }

    case 'collect': {
      if (!isLoggedIn(senderID, users))
        return send(api, threadID, '❌ You must be logged in to collect earnings.');

      if (!user.earnings || user.earnings === 0)
        return send(api, threadID, 'ℹ️ Wala kang ma-collect na earnings.');

      const amount = user.earnings;
      user.money += amount;
      user.earnings = 0;

      saveUsers(users);

      return send(api, threadID, `✅ Nakolekta mo na ang iyong kita na ${amount} 💵.`);
    }

    case 'games': {
      if (!isLoggedIn(senderID, users))
        return send(api, threadID, '❌ You must be logged in to play games.');

      const gamesList = [
        'Slots', 'Spinwheel', 'Dice', 'CoinFlip', 'Trivia',
        'Puzzle', 'Memory', 'RockPaperScissors', 'Blackjack', 'Roulette',
        'Bingo', 'Lottery', 'Minesweeper', 'TicTacToe', 'Sudoku',
        'Hangman', 'Snake', 'Pacman', 'Chess', 'Checkers'
      ];

      const chosenGame = args[1] ? args[1].toLowerCase() : null;

      if (!chosenGame) {
        return send(api, threadID, `🎮 Available Games:\n${gamesList.join(', ')}\n\nUsage: giga games <game>`);
      }

      if (!gamesList.map(g => g.toLowerCase()).includes(chosenGame)) {
        return send(api, threadID, `❌ Game "${chosenGame}" not found. Available games:\n${gamesList.join(', ')}`);
      }

      // Random earning between 500 and 5000 per game play
      const earning = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;

      user.money += earning;
      saveUsers(users);

      return send(api, threadID, `🎉 Naglaro ka ng ${chosenGame.charAt(0).toUpperCase() + chosenGame.slice(1)} at kumita ng ${earning} 💵!`);
    }

    default:
      return send(api, threadID, '❗ Available commands: balance, transfer, redem, collect, games');
  }
};
