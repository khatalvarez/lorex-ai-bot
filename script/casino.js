module.exports.config = {
  name: 'casino',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: 'Casino game with login and register (memory only)',
  usage: 'casino [register|login|logout|balance|play] [args]',
  credits: 'OpenAI'
};

const users = {}; // In-memory users: { userID: { password, loggedIn, balance } }

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const threadID = event.threadID;

  if (args.length === 0) {
    return api.sendMessage(
      `🎰 Casino Commands:\n` +
      `• register [password] - Create account\n` +
      `• login [password] - Login\n` +
      `• logout - Logout\n` +
      `• balance - Show your coin balance\n` +
      `• play - Play slot machine (costs 10 coins)`,
      threadID,
      event.messageID
    );
  }

  const cmd = args[0].toLowerCase();
  const param = args.slice(1).join(' ');

  // Register new user
  if (cmd === 'register') {
    if (users[senderID]) {
      return api.sendMessage('❌ You already have an account. Use login.', threadID, event.messageID);
    }
    if (!param) return api.sendMessage('❌ Please provide a password to register.', threadID, event.messageID);

    users[senderID] = {
      password: param,
      loggedIn: true,
      balance: 100 // Starting coins
    };
    return api.sendMessage('✅ Registered and logged in! Starting balance: 100 coins.', threadID, event.messageID);
  }

  // Login existing user
  if (cmd === 'login') {
    if (!users[senderID]) return api.sendMessage('❌ You have no account. Register first.', threadID, event.messageID);
    if (users[senderID].loggedIn) return api.sendMessage('✅ You are already logged in.', threadID, event.messageID);
    if (!param) return api.sendMessage('❌ Please provide your password.', threadID, event.messageID);

    if (users[senderID].password === param) {
      users[senderID].loggedIn = true;
      return api.sendMessage('✅ Logged in successfully!', threadID, event.messageID);
    } else {
      return api.sendMessage('❌ Wrong password.', threadID, event.messageID);
    }
  }

  // Logout
  if (cmd === 'logout') {
    if (!users[senderID] || !users[senderID].loggedIn) {
      return api.sendMessage('❌ You are not logged in.', threadID, event.messageID);
    }
    users[senderID].loggedIn = false;
    return api.sendMessage('✅ Logged out successfully.', threadID, event.messageID);
  }

  // Check balance
  if (cmd === 'balance') {
    if (!users[senderID] || !users[senderID].loggedIn) {
      return api.sendMessage('❌ You must be logged in to check balance.', threadID, event.messageID);
    }
    return api.sendMessage(`💰 Your balance: ${users[senderID].balance} coins.`, threadID, event.messageID);
  }

  // Play slot machine
  if (cmd === 'play') {
    if (!users[senderID] || !users[senderID].loggedIn) {
      return api.sendMessage('❌ You must be logged in to play.', threadID, event.messageID);
    }

    const user = users[senderID];
    if (user.balance < 10) {
      return api.sendMessage('❌ Not enough coins to play. Cost is 10 coins.', threadID, event.messageID);
    }

    user.balance -= 10;

    const slots = ['🍒', '🍋', '🍊', '🍉', '⭐', '🔔'];
    let spin = [];
    for (let i = 0; i < 3; i++) {
      spin.push(slots[getRandomInt(0, slots.length -1)]);
    }

    let message = `🎰 You spun: ${spin.join(' | ')}\n`;

    // Simple slot rules:
    // 3 same = win 50 coins
    // 2 same = win 20 coins
    // else lose

    if (spin[0] === spin[1] && spin[1] === spin[2]) {
      user.balance += 50;
      message += '🎉 Jackpot! You won 50 coins!';
    } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
      user.balance += 20;
      message += '🎉 You won 20 coins!';
    } else {
      message += '❌ No win this time, try again!';
    }

    message += `\n💰 Balance: ${user.balance} coins.`;
    return api.sendMessage(message, threadID, event.messageID);
  }

  return api.sendMessage('❌ Unknown casino command. Use register, login, logout, balance, or play.', threadID, event.messageID);
};
