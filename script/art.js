const fs = require('fs');
const dataFile = './gamesData.json';

module.exports.config = {
  name: 'games',
  version: '1.3.0',
  role: 0,
  hasPrefix: true,
  aliases: ['game'],
  description: 'Play games: guess, riddle, roll, rps, petbattle, leaderboard, toplist, balance',
  usage: 'games [guess|riddle|roll|rps|petbattle|leaderboard|toplist|balance] [input]',
  credits: 'OpenAI'
};

const riddles = [
  { q: "What has keys but can't open locks? 🔑", a: "keyboard" },
  { q: "What has a neck but no head? 🍼", a: "bottle" },
  { q: "What has hands but can't clap? ⏰", a: "clock" }
];

let data = {
  balances: {},
  leaderboard: {},
  petBattleData: {}
};

function loadData() {
  if (fs.existsSync(dataFile)) {
    try {
      const raw = fs.readFileSync(dataFile);
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Error reading games data:', e);
    }
  }
}

function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving games data:', e);
  }
}

loadData();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ensureBalance(userID) {
  if (!(userID in data.balances)) {
    data.balances[userID] = 0;
    saveData();
  }
}

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const threadID = event.threadID;

  if (args.length === 0) {
    return api.sendMessage(
      '🎮 Please choose a game:\n- guess [number]\n- riddle [answer]\n- roll\n- rps [rock|paper|scissors|jack|empoy]\n- petbattle [attack|heal|status]\n- leaderboard\n- toplist\n- balance',
      threadID,
      event.messageID
    );
  }

  const game = args[0].toLowerCase();
  const input = args.slice(1).join(' ').toLowerCase();

  ensureBalance(senderID);

  // --- GUESS THE NUMBER ---
  if (game === 'guess') {
    const userGuess = parseInt(input);
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 10) {
      return api.sendMessage('❌ Please enter a number between 1 and 10. Example: games guess 7', threadID, event.messageID);
    }
    const randomNumber = randomInt(1, 10);
    if (userGuess === randomNumber) {
      data.balances[senderID] += 5;
      saveData();
      return api.sendMessage(`🎉 Correct! The number was ${randomNumber}. You win 5 coins! 💰\nYour balance: ${data.balances[senderID]} coins.`, threadID, event.messageID);
    } else {
      return api.sendMessage(`❌ Wrong guess! The number was ${randomNumber}. Try again! 🤞`, threadID, event.messageID);
    }
  }

  // --- RIDDLE ---
  if (game === 'riddle') {
    if (!input) {
      const r = riddles[randomInt(0, riddles.length - 1)];
      return api.sendMessage(`🧩 Riddle: ${r.q}\nAnswer by typing: games riddle [your answer]`, threadID, event.messageID);
    } else {
      const correct = riddles.some(r => r.a === input);
      if (correct) {
        data.balances[senderID] += 5;
        saveData();
        return api.sendMessage(`🎉 Correct! You earned 5 coins! 💰\nBalance: ${data.balances[senderID]} coins.`, threadID, event.messageID);
      } else {
        return api.sendMessage('❌ Wrong answer, try again.', threadID, event.messageID);
      }
    }
  }

  // --- ROLL DIE ---
  if (game === 'roll') {
    const roll = randomInt(1, 6);
    data.balances[senderID] += roll;
    saveData();
    return api.sendMessage(`🎲 You rolled a ${roll} and earned ${roll} coins! 💰\nBalance: ${data.balances[senderID]} coins.`, threadID, event.messageID);
  }

  // --- ROCK PAPER SCISSORS ---
  if (game === 'rps') {
    if (!input) return api.sendMessage('✂️ Choose one: rock, paper, scissors, jack, or empoy', threadID, event.messageID);

    const mapping = {
      rock: 'rock',
      paper: 'paper',
      scissors: 'scissors',
      jack: 'rock',
      empoy: 'scissors'
    };

    const userChoice = mapping[input];
    if (!userChoice) {
      return api.sendMessage('❌ Invalid choice. Choose rock, paper, scissors, jack, or empoy.', threadID, event.messageID);
    }

    const options = ['rock', 'paper', 'scissors'];
    const botChoice = options[randomInt(0, options.length - 1)];

    if (userChoice === botChoice) {
      return api.sendMessage(`🤝 Tie! We both chose ${userChoice}. No coins earned.`, threadID, event.messageID);
    }

    if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      data.balances[senderID] += 10;
      saveData();
      return api.sendMessage(`🎉 You win! You chose ${userChoice}, I chose ${botChoice}. You earned 10 coins! 💰\nBalance: ${data.balances[senderID]} coins.`, threadID, event.messageID);
    } else {
      return api.sendMessage(`😞 You lose! You chose ${userChoice}, I chose ${botChoice}. No coins earned.`, threadID, event.messageID);
    }
  }

  // --- PET BATTLE ---
  if (game === 'petbattle') {
    if (!data.petBattleData[senderID]) {
      data.petBattleData[senderID] = { hp: 100, attack: 15 };
      saveData();
      return api.sendMessage('🐾 Your pet is ready for battle! Type "games petbattle attack" to attack or "games petbattle heal" to heal your pet (costs 10 coins).', threadID, event.messageID);
    }

    const pet = data.petBattleData[senderID];
    const enemy = { hp: 100, attack: 15 };

    if (input === 'attack') {
      enemy.hp -= pet.attack;
      let msg = `🐾 You attacked the enemy pet! Enemy HP: ${enemy.hp <= 0 ? 0 : enemy.hp}\n`;

      if (enemy.hp <= 0) {
        data.leaderboard[senderID] = (data.leaderboard[senderID] || 0) + 1;
        data.balances[senderID] += 20;
        delete data.petBattleData[senderID];
        saveData();
        return api.sendMessage(msg + `🎉 You defeated the enemy pet! You gained a win and 20 coins! 💰\nBalance: ${data.balances[senderID]} coins.\nType "games petbattle" to battle again.`, threadID, event.messageID);
      }

      pet.hp -= enemy.attack;
      msg += `🐕 Enemy attacked you back! Your pet HP: ${pet.hp <= 0 ? 0 : pet.hp}\n`;

      if (pet.hp <= 0) {
        delete data.petBattleData[senderID];
        saveData();
        return api.sendMessage(msg + '💀 Your pet was defeated! Game over. Type "games petbattle" to start a new battle.', threadID, event.messageID);
      }

      saveData();
      return api.sendMessage(msg + 'Type "games petbattle attack" to continue attacking or "games petbattle heal" to heal your pet (costs 10 coins).', threadID, event.messageID);
    }

    if (input === 'heal') {
      if (data.balances[senderID] < 10) {
        return api.sendMessage('❌ Not enough coins to heal! You need 10 coins.', threadID, event.messageID);
      }
      data.balances[senderID] -= 10;
      pet.hp += 20;
      if (pet.hp > 100) pet.hp = 100;
      saveData();
      return api.sendMessage(`💖 You healed your pet by 20 HP. Current HP: ${pet.hp}\nBalance: ${data.balances[senderID]} coins.\nType "games petbattle attack" to attack again.`, threadID, event.messageID);
    }

    if (input === 'status') {
      return api.sendMessage(`🐾 Your pet's current HP: ${pet.hp}\nAttack power: ${pet.attack}\nBalance: ${data.balances[senderID]} coins.`, threadID, event.messageID);
    }

    return api.sendMessage('❓ Unknown petbattle command. Use attack, heal, or status.', threadID, event.messageID);
  }

  // --- LEADERBOARD ---
  if (game === 'leaderboard') {
    const leaderboardArray = Object.entries(data.leaderboard);
    if (leaderboardArray.length === 0) return api.sendMessage('🏆 No pet battle wins recorded yet.', threadID, event.messageID);

    leaderboardArray.sort((a, b) => b[1] - a[1]);
    let msg = '🏆 Pet Battle Leaderboard:\n';
    for (let i = 0; i < Math.min(10, leaderboardArray.length); i++) {
      const [userID, wins] = leaderboardArray[i];
      msg += `${i + 1}. ${userID} - ${wins} wins\n`; // You can replace userID with names if you want
    }
    return api.sendMessage(msg, threadID, event.messageID);
  }

  // --- TOPLIST (top balance) ---
  if (game === 'toplist') {
    const balArray = Object.entries(data.balances);
    if (balArray.length === 0) return api.sendMessage('💰 No balances recorded yet.', threadID, event.messageID);

    balArray.sort((a, b) => b[1] - a[1]);
    let msg = '💰 Top Balances:\n';
    for (let i = 0; i < Math.min(10, balArray.length); i++) {
      const [userID, bal] = balArray[i];
      msg += `${i + 1}. ${userID} - ${bal} coins\n`; // You can replace userID with names if you want
    }
    return api.sendMessage(msg, threadID, event.messageID);
  }

  // --- BALANCE ---
  if (game === 'balance') {
    return api.sendMessage(`💰 Your current balance: ${data.balances[senderID]} coins.`, threadID, event.messageID);
  }

  return api.sendMessage('❌ Unknown game option. Please use guess, riddle, roll, rps, petbattle, leaderboard, toplist, or balance.', threadID, event.messageID);
};
