const fs = require('fs');
const userDataPath = './data/users.json';

const MODERATOR_FB = 'https://www.facebook.com/john.michael.ravello.2024';
const DEVELOPER_FB = 'https://www.facebook.com/ZeromeNaval.61577040643519';

const LOAN_LIMIT = 9000000; // 9 million max loan

// Load users data
function loadUsers() {
  if (!fs.existsSync(userDataPath)) return {};
  return JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
}

// Save users data
function saveUsers(users) {
  fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));
}

// Generate random integer between min and max inclusive
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Games list
const gamesList = [
  'slots', 'spinwheel', 'dice', 'coinflip', 'trivia',
  'puzzle', 'memory', 'rockpaperscissors', 'blackjack', 'roulette',
  'bingo', 'lottery', 'minesweeper', 'tictactoe', 'sudoku',
  'hangman', 'snake', 'pacman', 'chess', 'checkers'
];

// Send message helper
function send(api, threadID, msg) {
  api.sendMessage(msg, threadID);
}

module.exports.config = {
  name: 'economy',
  version: '1.9.2',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['eco'],
  description: '💰 Economy system with 20 games, balance, loan, daily, work, and profile',
};

module.exports.run = async function({ api, event, args }) {
  const users = loadUsers();
  const { senderID, threadID } = event;
  const now = Date.now();

  // Create user if not exist
  if (!users[senderID]) {
    users[senderID] = {
      balance: 1000,
      loan: 0,
      lastWork: 0,
      lastDaily: 0,
      profile: {
        name: 'Player',
        level: 1,
        xp: 0,
      },
    };
  }

  const user = users[senderID];

  function save() {
    saveUsers(users);
  }

  if (!args[0]) {
    return send(api, threadID,
      `💼 Economy commands:
📊 balance
➕ add <amount>
👤 profile
💼 work
🎁 daily
💸 loan <amount>
💳 payloan <amount>
🎮 games <game> <bet>

Available Games: ${gamesList.join(', ')}

───────────────
🛡️ Moderator this AI:
${MODERATOR_FB}

👑 Developer Admin this AI:
${DEVELOPER_FB}`
    );
  }

  const cmd = args[0].toLowerCase();

  switch (cmd) {
    case 'balance':
    case 'bal': {
      return send(api, threadID,
        `💰 Your balance: ${user.balance} coins\n` +
        `💸 Your loan: ${user.loan} coins`
      );
    }

    case 'add': {
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0)
        return send(api, threadID, '❗ Please enter a valid amount to add.');
      user.balance += amount;
      save();
      return send(api, threadID, `✅ Added ${amount} coins to your balance.`);
    }

    case 'profile': {
      const p = user.profile;
      return send(api, threadID,
        `👤 Profile:
🏷️ Name: ${p.name}
⭐ Level: ${p.level}
✨ XP: ${p.xp}
💰 Balance: ${user.balance} coins
💸 Loan: ${user.loan} coins`
      );
    }

    case 'work': {
      if (now - user.lastWork < 3600000) { // 1 hour cooldown
        const m = Math.ceil((3600000 - (now - user.lastWork)) / 60000);
        return send(api, threadID, `⏳ You must wait ${m} minute(s) before working again.`);
      }
      const earned = randInt(100, 500);
      user.balance += earned;
      user.lastWork = now;
      save();
      return send(api, threadID, `💼 You worked and earned ${earned} coins!`);
    }

    case 'daily': {
      if (now - user.lastDaily < 86400000) { // 24 hours cooldown
        const h = Math.ceil((86400000 - (now - user.lastDaily)) / 3600000);
        return send(api, threadID, `⏳ You must wait ${h} hour(s) before claiming daily reward again.`);
      }
      const dailyAmount = 1000;
      user.balance += dailyAmount;
      user.lastDaily = now;
      save();
      return send(api, threadID, `🎁 You claimed your daily reward of ${dailyAmount} coins!`);
    }

    case 'loan': {
      const loanAmount = parseInt(args[1]);
      if (isNaN(loanAmount) || loanAmount <= 0)
        return send(api, threadID, '❗ Please enter a valid loan amount.');
      if (user.loan + loanAmount > LOAN_LIMIT)
        return send(api, threadID, `❌ Loan limit exceeded! You can only borrow up to ${LOAN_LIMIT} coins total.`);
      user.loan += loanAmount;
      user.balance += loanAmount;
      save();
      return send(api, threadID, `💰 You borrowed ${loanAmount} coins. Total loan: ${user.loan} coins.`);
    }

    case 'payloan': {
      const payAmount = parseInt(args[1]);
      if (isNaN(payAmount) || payAmount <= 0)
        return send(api, threadID, '❗ Please enter a valid amount to pay.');
      if (payAmount > user.balance)
        return send(api, threadID, '❌ You do not have enough balance to pay that amount.');
      if (payAmount > user.loan)
        return send(api, threadID, `❗ You only owe ${user.loan} coins. You cannot pay more than your loan.`);
      user.loan -= payAmount;
      user.balance -= payAmount;
      save();
      return send(api, threadID, `✅ You paid ${payAmount} coins towards your loan. Remaining loan: ${user.loan} coins.`);
    }

    case 'games': {
      if (!args[1]) {
        return send(api, threadID,
          `🎮 Available games: ${gamesList.join(', ')}\n` +
          'Usage: economy games <game> <bet>'
        );
      }
      const game = args[1].toLowerCase();
      const bet = parseInt(args[2]);

      if (!gamesList.includes(game))
        return send(api, threadID, `❌ Game "${game}" not found. Available games:\n${gamesList.join(', ')}`);

      if (isNaN(bet) || bet <= 0)
        return send(api, threadID, '❗ Please enter a valid bet amount.');

      if (bet > user.balance)
        return send(api, threadID, '❌ You do not have enough balance to bet that amount.');

      // Play game logic - simple win chance 70%
      const win = Math.random() < 0.7;
      let earning = 0;

      if (win) {
        // Win - random earning between 1x to 3x bet
        earning = bet * randInt(1, 3);
        user.balance += earning;
        save();
        return send(api, threadID,
          `🎉 You played ${game.charAt(0).toUpperCase() + game.slice(1)} and won ${earning} coins! 💰`
        );
      } else {
        // Lose - lose bet
        user.balance -= bet;
        save();
        return send(api, threadID,
          `😞 You played ${game.charAt(0).toUpperCase() + game.slice(1)} and lost ${bet} coins. Try again! 🍀`
        );
      }
    }

    case 'help': {
      return send(api, threadID,
        `💼 Economy commands:
📊 balance
➕ add <amount>
👤 profile
💼 work
🎁 daily
💸 loan <amount>
💳 payloan <amount>
🎮 games <game> <bet>

Available Games: ${gamesList.join(', ')}

───────────────
🛡️ Moderator this AI:
${MODERATOR_FB}

👑 Developer Admin this AI:
${DEVELOPER_FB}`
      );
    }

    default:
      return send(api, threadID, '❗ Unknown economy command. Try "economy help" to see commands.');
  }
};
