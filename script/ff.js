const fs = require('fs');
const path = './user.json';

module.exports.config = {
  name: 'casino',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['cas'],
  description: 'Complete Casino with 20 games, profile, premium, protection, login/register',
};

let users = {};
try {
  users = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch {
  users = {};
}

function saveUsers() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2));
}

function box(message, type = '') {
  const emojis = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    game: '🎰',
    premium: '⭐',
    protection: '🛡️',
  };
  const emoji = emojis[type] || '';
  return `╔═══════════════╗
${emoji} ${message}
╚═══════════════╝`;
}

function ensureUser(uid) {
  if (!users[uid]) {
    users[uid] = {
      password: null,
      money: 1000,
      premium: false,
      protection: false,
    };
    saveUsers();
  }
}

// Helper random number generator
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const messageID = event.messageID;
  const cmd = args[0]?.toLowerCase();

  ensureUser(senderID);
  const user = users[senderID];

  if (!user.password && cmd !== 'register' && cmd !== 'login') {
    return api.sendMessage(box('Please register first: casino register <password>', 'error'), senderID, messageID);
  }

  switch (cmd) {
    case 'register': {
      if (user.password) return api.sendMessage(box('You are already registered. Use casino login <password>.', 'error'), senderID, messageID);
      const pass = args[1];
      if (!pass) return api.sendMessage(box('Usage: casino register <password>', 'info'), senderID, messageID);
      user.password = pass;
      saveUsers();
      return api.sendMessage(box('Registration successful! You can now login using casino login <password>.', 'success'), senderID, messageID);
    }

    case 'login': {
      if (!user.password) return api.sendMessage(box('You are not registered yet. Register using casino register <password>.', 'error'), senderID, messageID);
      const pass = args[1];
      if (!pass) return api.sendMessage(box('Usage: casino login <password>', 'info'), senderID, messageID);
      if (pass !== user.password) return api.sendMessage(box('Wrong password.', 'error'), senderID, messageID);
      return api.sendMessage(box('Login successful! You can now play games or buy premium/protection.', 'success'), senderID, messageID);
    }

    case 'profile': {
      const msg = `🎭 Casino Profile:

💰 Money: $${user.money}
⭐ Premium: ${user.premium ? 'Active' : 'None'}
🛡️ Protection: ${user.protection ? 'Active' : 'None'}`;
      return api.sendMessage(box(msg, 'info'), senderID, messageID);
    }

    case 'buy': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'premium') {
        const price = 500;
        if (user.money < price) return api.sendMessage(box('Insufficient money to buy premium.', 'error'), senderID, messageID);
        user.money -= price;
        user.premium = true;
        saveUsers();
        return api.sendMessage(box('Premium purchased! You now have access to special features.', 'premium'), senderID, messageID);
      }
      if (sub === 'protection') {
        const price = 300;
        if (user.money < price) return api.sendMessage(box('Insufficient money to buy protection.', 'error'), senderID, messageID);
        user.money -= price;
        user.protection = true;
        saveUsers();
        return api.sendMessage(box('Protection purchased! You are now protected from losses.', 'protection'), senderID, messageID);
      }
      return api.sendMessage(box('Unknown buy command. Use: buy premium or buy protection', 'error'), senderID, messageID);
    }

    // ---------------------- GAMES ----------------------

    case 'slots': {
      if (user.money < 10) return api.sendMessage(box('You need at least $10 to play slots.', 'error'), senderID, messageID);
      user.money -= 10;
      const symbols = ['🍒', '🍋', '🍉', '⭐', '7️⃣'];
      const spin = [
        symbols[randomInt(0, symbols.length - 1)],
        symbols[randomInt(0, symbols.length - 1)],
        symbols[randomInt(0, symbols.length - 1)],
      ];
      let win = 0;
      if (spin[0] === spin[1] && spin[1] === spin[2]) {
        win = 100;
      } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
        win = 20;
      }
      if (user.protection && win === 0) win = 10; // protection reduces losses
      user.money += win;
      saveUsers();
      let resultMsg = `🎰 Slots Result: ${spin.join(' ')}\n`;
      if (win > 0) {
        resultMsg += `You won $${win}! 🎉`;
      } else {
        resultMsg += `You lost $10. Try again!`;
      }
      return api.sendMessage(box(resultMsg, 'game'), senderID, messageID);
    }

    case 'dice': {
      if (user.money < 5) return api.sendMessage(box('You need at least $5 to play dice.', 'error'), senderID, messageID);
      user.money -= 5;
      const roll = randomInt(1, 6);
      let win = 0;
      if (roll >= 5) win = 15;
      if (user.protection && win === 0) win = 3;
      user.money += win;
      saveUsers();
      let diceMsg = `🎲 You rolled a ${roll}\n`;
      if (win > 0) diceMsg += `You won $${win}!`;
      else diceMsg += `You lost $5. Better luck next time!`;
      return api.sendMessage(box(diceMsg, 'game'), senderID, messageID);
    }

    // 18 more mini-games below (examples)

    case 'coinflip': {
      // Bet 10, guess heads or tails
      if (user.money < 10) return api.sendMessage(box('You need at least $10 to play coinflip.', 'error'), senderID, messageID);
      const guess = args[1]?.toLowerCase();
      if (!['heads', 'tails'].includes(guess)) return api.sendMessage(box('Usage: casino coinflip <heads|tails>', 'info'), senderID, messageID);
      user.money -= 10;
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      if (guess === result) {
        const win = 20;
        user.money += win;
        saveUsers();
        return api.sendMessage(box(`🪙 Coinflip Result: ${result}\nYou won $${win}! 🎉`, 'game'), senderID, messageID);
      } else {
        if (user.protection) {
          const refund = 5;
          user.money += refund;
          saveUsers();
          return api.sendMessage(box(`🪙 Coinflip Result: ${result}\nYou lost $10 but got $${refund} back because of protection.`, 'protection'), senderID, messageID);
        }
        saveUsers();
        return api.sendMessage(box(`🪙 Coinflip Result: ${result}\nYou lost $10. Try again!`, 'game'), senderID, messageID);
      }
    }

    case 'highlow': {
      // Bet 15, guess if next card is higher or lower (cards 1-13)
      if (user.money < 15) return api.sendMessage(box('You need at least $15 to play highlow.', 'error'), senderID, messageID);
      const guess = args[1]?.toLowerCase();
      if (!['high', 'low'].includes(guess)) return api.sendMessage(box('Usage: casino highlow <high|low>', 'info'), senderID, messageID);
      user.money -= 15;
      const firstCard = randomInt(1, 13);
      const nextCard = randomInt(1, 13);
      let win = 0;
      if (guess === 'high' && nextCard > firstCard) win = 40;
      else if (guess === 'low' && nextCard < firstCard) win = 40;
      if (user.protection && win === 0) win = 10;
      user.money += win;
      saveUsers();
      let msg = `🃏 First card: ${firstCard}\nNext card: ${nextCard}\n`;
      if (win > 0) msg += `You won $${win}! 🎉`;
      else msg += `You lost $15. Better luck next time!`;
      return api.sendMessage(box(msg, 'game'), senderID, messageID);
    }

    case 'guessnum': {
      // Bet 10, guess number 1-5
      if (user.money < 10) return api.sendMessage(box('You need at least $10 to play guessnum.', 'error'), senderID, messageID);
      const guess = Number(args[1]);
      if (!guess || guess < 1 || guess > 5) return api.sendMessage(box('Usage: casino guessnum <1-5>', 'info'), senderID, messageID);
      user.money -= 10;
      const num = randomInt(1, 5);
      let win = 0;
      if (guess === num) win = 50;
      if (user.protection && win === 0) win = 5;
      user.money += win;
      saveUsers();
      let msg = `🎯 The number is ${num}\n`;
      if (win > 0) msg += `You won $${win}! 🎉`;
      else msg += `You lost $10. Try again!`;
      return api.sendMessage(box(msg, 'game'), senderID, messageID);
    }

    case 'blackjack': {
      // Simple 1-player blackjack vs dealer
      if (user.money < 20) return api.sendMessage(box('You need at least $20 to play blackjack.', 'error'), senderID, messageID);
      user.money -= 20;
      const handValue = () => randomInt(15, 21);
      const player = handValue();
      const dealer = handValue();
      let win = 0;
      if (player > dealer) win = 50;
      else if (player === dealer) win = 20;
      else if (user.protection) win = 10;
      user.money += win;
      saveUsers();
      let msg = `🃏 Blackjack:
Your hand: ${player}
Dealer hand: ${dealer}\n`;
      if (win > 0) msg += `You won $${win}! 🎉`;
      else msg += `You lost $20. Try again!`;
      return api.sendMessage(box(msg, 'game'), senderID, messageID);
    }

    case 'roulette': {
      // Bet 15, pick number 0-10
      if (user.money < 15) return api.sendMessage(box('You need at least $15 to play roulette.', 'error'), senderID, messageID);
      const guess = Number(args[1]);
      if (guess == null || guess < 0 || guess > 10) return api.sendMessage(box('Usage: casino roulette <0-10>', 'info'), senderID, messageID);
      user.money -= 15;
      const result = randomInt(0, 10);
      let win = 0;
      if (guess === result) win = 100;
      if (user.protection && win === 0) win = 5;
      user.money += win;
      saveUsers();
      let msg = `🎡 Roulette result: ${result}\n`;
      if (win > 0) msg += `You won $${win}! 🎉`;
      else msg += `You lost $15. Try again!`;
      return api.sendMessage(box(msg, 'game'), senderID, messageID);
    }

    case 'bingo': {
      // Bet 20, random bingo number 1-30, win if number <= 5
      if (user.money < 20) return api.sendMessage(box('You need at least $20 to play bingo.', 'error'), senderID, messageID);
      user.money -= 20;
      const num = randomInt(1, 30);
      let win = 0;
      if (num <= 5) win = 100;
      if (user.protection && win === 0) win = 10;
      user.money += win;
      saveUsers();
      let msg = `🔢 Bingo number: ${num}\n`;
      if (win > 0) msg += `You won $${win}! 🎉`;
      else msg += `You lost $20. Try again!`;
      return api.sendMessage(box(msg, 'game'), senderID, messageID);
    }

    case 'scratch': {
      // Bet 10, 3 random emojis, win if 2+ match
      if (user.money < 10) return api.sendMessage(box('You need at least $10 to play scratch.', 'error'), senderID, messageID);
      user.money -= 10;
      const emojis = ['🍀', '💎', '🍎', '🍌', '🍇'];
      const result = [
        emojis[randomInt(0, emojis.length -1)],
        emojis[randomInt(0, emojis.length -1)],
        emojis[randomInt(0, emojis.length -1)],
      ];
      const counts = {};
      result.forEach(e => counts[e] = (counts[e] || 0) + 1);
      const maxCount = Math.max(...Object.values(counts));
      let win = 0;
      if (maxCount === 3) win = 100;
      else if (maxCount === 2) win = 30;
      if (user.protection && win === 0) win = 5;
      user.money += win;
      saveUsers();
      let msg = `🎟️ Scratch result: ${result.join(' ')}\n`;
      if (win > 0) msg += `You won $${win}! 🎉`;
      else msg += `You lost $10. Try again!`;
      return api.sendMessage(box(msg, 'game'), senderID, messageID);
    }

    case 'lotto': {
      // Bet 25, 6 random numbers 1-49, win if all match guess (very hard)
      if (user.money < 25) return api.sendMessage(box('You need at least $25 to play lotto.', 'error'), senderID, messageID);
      const guesses = args.slice(1, 7).map(n => parseInt(n));
      if (guesses.length < 6 || guesses.some(n => isNaN(n) || n < 1 || n > 49))
        return api.sendMessage(box('Usage: casino lotto <6 numbers 1-49>', 'info'), senderID, messageID);
      user.money -= 25;
      const drawn = [];
      while (drawn.length < 6) {
        let n = randomInt(1, 49);
        if (!drawn.includes(n)) drawn.push(n);
      }
      drawn.sort((a,b) => a - b);
      guesses.sort((a,b) => a - b);
      let win = 0;
      if (guesses.every((v,i) => v === drawn[i])) win = 1000;
      if (user.protection && win === 0) win = 20;
      user.money += win;
      saveUsers();
      let msg = `🎟️ Lotto draw: ${drawn.join(', ')}\nYour guesses: ${guesses.join(', ')}\n`;
      if (win > 0) msg += `Jackpot! You won $${win}! 🎉`;
      else msg += `You lost $25. Try again!`;
      return api.sendMessage(box(msg, 'game'), senderID, messageID);
    }

    case 'slotsplus': {
      // Premium Slots (cost 20), better chances, premium only
      if (!user.premium) return api.sendMessage(box('Slotsplus is premium only. Buy premium first.', 'error'), senderID, messageID);
      if (user.money < 20) return api.sendMessage(box('You need at least $20 to play slotsplus.', 'error'), senderID, messageID);
      user.money -= 20;
      const symbols = ['🍒', '🍋', '🍉', '⭐', '7️⃣', '💎', '👑'];
      const spin = [
        symbols[randomInt(0, symbols.length - 1)],
        symbols[randomInt(0, symbols.length - 1)],
        symbols[randomInt(0, symbols.length - 1)],
      ];
      let win = 0;
      if (spin[0] === spin[1] && spin[1] === spin[2]) {
        win = 300;
      } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
        win = 50;
      }
      user.money += win;
      saveUsers();
      let resultMsg = `🎰 SlotsPlus Result: ${spin.join(' ')}\n`;
      if (win > 0) {
