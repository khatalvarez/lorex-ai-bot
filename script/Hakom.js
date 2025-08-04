const fs = require('fs');
const userDataPath = './data/users.json';

const adminUIDs = ['61575137262643']; // Added admin UID

// Helper functions
function loadUsers() {
  if (!fs.existsSync(userDataPath)) return {};
  return JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
}

function saveUsers(users) {
  fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));
}

function isAdmin(uid) {
  return adminUIDs.includes(uid);
}

function isLoggedIn(uid, users) {
  return users[uid] && users[uid].loggedIn === true;
}

function send(api, threadID, message) {
  api.sendMessage(message, threadID);
}

function generateRedeemCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < len; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports.config = {
  name: 'giga',
  version: '2.1.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Giga system with balance, transfer, redeem, collect, games, social media, and more.',
  usages: 'help',
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const users = loadUsers();
  const senderID = event.senderID;
  const threadID = event.threadID;

  let isNewUser = false;

  // Register new user automatically on first use
  if (!users[senderID]) {
    users[senderID] = {
      money: 0,
      earnings: 0,
      loggedIn: true,
      lastRedeem: 0,
      lastDaily: 0,
      posts: [],
    };
    isNewUser = true;
  }

  const user = users[senderID];
  const command = args[0] ? args[0].toLowerCase() : '';

  const REDEEM_REWARD = 89000;
  const REDEEM_COOLDOWN = 3599000; // ~1 hour in ms
  const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

  // Auto notify GC if new user registered (boxed message with emoji)
  if (isNewUser) {
    const newUserMessage = 
`📢📢📢━━━━━━━━━━━━━━
👋 New user registered!
👤 UID: ${senderID}
🎉 Welcome to Giga System!
━━━━━━━━━━━━━━📢📢📢`;
    send(api, threadID, newUserMessage);
  }

  switch (command) {

    case 'help': {
      const msg = `📦┏━━━ GIGA SYSTEM HELP ━━━┓
👑 Commands:
balance, transfer, redeem, collect, games, socialmedia, profile, daily, leaderboard, login, logout
Use 'giga help2' to see more commands.
──────────────────────────
Contact my pogi owner:
https://www.facebook.com/ZeromeNaval.61577040643519
┗━━━━━━━━━━━━━━━━━━━━━┛`;
      return send(api, threadID, msg);
    }

    case 'help2': {
      const msg = `📦┏━━━ GIGA SYSTEM HELP 2 ━━━┓
Admin Commands:
give <uid> <amount>, reset <uid>
──────────────────────────
Game Instructions:
Choose a game with 'giga games <game>'
Play and earn money! No more coming soon - all unlocked!
──────────────────────────
Contact my pogi owner:
https://www.facebook.com/ZeromeNaval.61577040643519
┗━━━━━━━━━━━━━━━━━━━━━┛`;
      return send(api, threadID, msg);
    }

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

    case 'redeem':
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
      if (!arg) return send(api, threadID, '❗ Usage: giga redeem <new|code>');

      if (arg === 'new') {
        const code = generateRedeemCode();
        users.redeemCodes[code] = REDEEM_REWARD;
        saveUsers(users);
        return send(api, threadID, `🎟️ Redeem code generated: ${code}\nUse: giga redeem ${code}`);
      }

      const code = args[1];
      if (!(code in users.redeemCodes))
        return send(api, threadID, '❌ Invalid or expired redeem code.');

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

      const availableGames = [
        'slots', 'spinwheel', 'dice', 'coinflip', 'trivia',
        'puzzle', 'memory', 'rockpaperscissors', 'blackjack', 'roulette',
        'bingo', 'lottery', 'minesweeper', 'tictactoe', 'sudoku',
        'hangman', 'snake', 'pacman', 'chess', 'checkers'
      ];

      const chosenGame = args[1] ? args[1].toLowerCase() : null;

      if (!chosenGame) {
        return send(api, threadID, `🎮 Available Games:\n${availableGames.join(', ')}\n\nUsage: giga games <game>`);
      }

      if (!availableGames.includes(chosenGame)) {
        return send(api, threadID, `❌ Game "${chosenGame}" not found. Available games:\n${availableGames.join(', ')}`);
      }

      // Simulate game earnings: 80% chance to win (earn between 500-5000), 20% lose (earn 0)
      let earning = 0;
      if (Math.random() < 0.8) {
        earning = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
        user.money += earning;
        saveUsers(users);
        return send(api, threadID, `🎉 Naglaro ka ng ${chosenGame.charAt(0).toUpperCase() + chosenGame.slice(1)} at kumita ng ${earning} 💵!`);
      } else {
        // Lost - auto send boxed message with emojis to GC
        const loseMsg =
`💔💔💔━━━━━━━━━━━━━━
😢 User ${senderID} lost sa laro na ${chosenGame.charAt(0).toUpperCase() + chosenGame.slice(1)}.
Better luck next time! 🍀
━━━━━━━━━━━━━━💔💔💔`;
        send(api, threadID, loseMsg);
        return send(api, threadID, `😞 Sayang! Natalo ka sa ${chosenGame.charAt(0).toUpperCase() + chosenGame.slice(1)}. Subukan mo ulit!`);
      }
    }

    case 'daily': {
      const now = Date.now();
      if (user.lastDaily && now - user.lastDaily < DAILY_COOLDOWN) {
        const remain = Math.ceil((DAILY_COOLDOWN - (now - user.lastDaily)) / 1000);
        return send(api, threadID, `⏳ Daily reward cooldown pa. Subukan mo ulit after ${remain} seconds.`);
      }
      const dailyAmount = 10000;
      user.money += dailyAmount;
      user.lastDaily = now;
      saveUsers(users);
      return send(api, threadID, `🎁 Nakakuha ka ng daily reward na ${dailyAmount} 💵!`);
    }

    case 'login': {
      if (user.loggedIn) return send(api, threadID, '✅ Nakalogin ka na.');
      user.loggedIn = true;
      saveUsers(users);
      return send(api, threadID, '✅ Login successful.');
    }

    case 'logout': {
      if (!user.loggedIn) return send(api, threadID, '❌ Hindi ka naka-login.');
      user.loggedIn = false;
      saveUsers(users);
      return send(api, threadID, '✅ Logout successful.');
    }

    case 'give': {
      if (!isAdmin(senderID)) return send(api, threadID, '❌ Wala kang permission dito.');
      const targetUID = args[1];
      const amount = parseInt(args[2]);
      if (!targetUID || isNaN(amount)) return send(api, threadID, '❗ Usage: giga give <uid> <amount>');
      if (!users[targetUID]) return send(api, threadID, '❌ Target user not found.');
      users[targetUID].money += amount;
      saveUsers(users);
      return send(api, threadID, `✅ Binigyan mo ng ${amount} 💵 si ${targetUID}.`);
    }

    case 'reset': {
      if (!isAdmin(senderID)) return send(api, threadID, '❌ Wala kang permission dito.');
      const targetUID = args[1];
      if (!targetUID) return send(api, threadID, '❗ Usage: giga reset <uid>');
      if (!users[targetUID]) return send(api, threadID, '❌ Target user not found.');
      users[targetUID] = {
        money: 0,
        earnings: 0,
        loggedIn: false,
        lastRedeem: 0,
        lastDaily: 0,
        posts: [],
      };
      saveUsers(users);
      return send(api, threadID, `✅ Na-reset ang account ni ${targetUID}.`);
    }

    default:
      return send(api, threadID, `❌ Unknown command: ${command}. Use giga help to see commands.`);
  }
};
