module.exports.config = {
  name: 'encantadia',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['encanta', 'games'],
  description: 'Encantadia game + mini games (guess, riddle, roll, rps)',
  usage: 'encantadia [choose|attack|status|guess|riddle|roll|rps] [option]',
  credits: 'OpenAI'
};

// --- Mini games data ---
const riddles = [
  { q: "What has keys but can't open locks?", a: "keyboard" },
  { q: "What has a neck but no head?", a: "bottle" },
  { q: "What has hands but can't clap?", a: "clock" }
];

// --- Encantadia game data ---
const characters = {
  amihan: { hp: 100, attack: 20 },
  alena: { hp: 90, attack: 25 },
  danaya: { hp: 110, attack: 15 },
  pirena: { hp: 80, attack: 30 }
};
const enemies = [
  { name: 'Taga Demonyo', hp: 80, attack: 15 },
  { name: 'Hagorn', hp: 100, attack: 20 },
  { name: 'Bungisngis', hp: 90, attack: 18 }
];

// Store user game state in-memory
const gameStates = {};

module.exports.run = async function({ api, event, args }) {
  const userID = event.senderID;
  if (!args.length) {
    return api.sendMessage(
      'Welcome! Use subcommands:\n' +
      '- Encantadia game: choose, attack, status\n' +
      '- Mini games: guess [num], riddle [answer], roll, rps [choice]',
      event.threadID, event.messageID
    );
  }

  const cmd = args[0].toLowerCase();
  const input = args.slice(1).join(' ').toLowerCase();

  // Initialize user state if missing
  if (!gameStates[userID]) {
    gameStates[userID] = {
      player: null,
      enemy: null,
      playerHp: 0,
      enemyHp: 0,
      inBattle: false
    };
  }
  const state = gameStates[userID];

  // === Encantadia game commands ===
  if (['choose', 'attack', 'status'].includes(cmd)) {
    if (cmd === 'choose') {
      if (!input || !characters[input]) {
        return api.sendMessage('Choose a character: amihan, alena, danaya, pirena', event.threadID, event.messageID);
      }
      state.player = input;
      state.playerHp = characters[input].hp;
      const enemy = enemies[Math.floor(Math.random() * enemies.length)];
      state.enemy = enemy.name;
      state.enemyHp = enemy.hp;
      state.inBattle = true;
      return api.sendMessage(
        `You chose ${input.charAt(0).toUpperCase() + input.slice(1)}!\n` +
        `An enemy ${state.enemy} appeared!\n` +
        `Type "encantadia attack" to fight!`,
        event.threadID, event.messageID
      );
    }

    if (cmd === 'status') {
      if (!state.inBattle) {
        return api.sendMessage('Not in battle. Use "encantadia choose [character]" first.', event.threadID, event.messageID);
      }
      return api.sendMessage(
        `Status:\nYou (${state.player}): ${state.playerHp} HP\nEnemy (${state.enemy}): ${state.enemyHp} HP`,
        event.threadID, event.messageID
      );
    }

    if (cmd === 'attack') {
      if (!state.inBattle) {
        return api.sendMessage('Not in battle. Use "encantadia choose [character]" first.', event.threadID, event.messageID);
      }

      // Player attacks enemy
      const playerAtk = Math.floor(Math.random() * characters[state.player].attack) + 5;
      state.enemyHp -= playerAtk;
      let msg = `You attacked ${state.enemy} for ${playerAtk} damage!\n`;

      if (state.enemyHp <= 0) {
        state.inBattle = false;
        msg += `You defeated ${state.enemy}! Congratulations! 🎉`;
        return api.sendMessage(msg, event.threadID, event.messageID);
      }

      // Enemy attacks player
      const enemyData = enemies.find(e => e.name === state.enemy);
      const enemyAtk = Math.floor(Math.random() * enemyData.attack) + 5;
      state.playerHp -= enemyAtk;
      msg += `${state.enemy} attacked you for ${enemyAtk} damage!\n`;

      if (state.playerHp <= 0) {
        state.inBattle = false;
        msg += 'You were defeated... Try again by choosing a character.';
        return api.sendMessage(msg, event.threadID, event.messageID);
      }

      msg += `\nCurrent HP:\nYou: ${state.playerHp}\nEnemy: ${state.enemyHp}`;
      return api.sendMessage(msg, event.threadID, event.messageID);
    }
  }

  // === Mini games commands ===
  if (cmd === 'guess') {
    const userGuess = parseInt(input);
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 10) {
      return api.sendMessage('Enter a number between 1 and 10. Example: encantadia guess 7', event.threadID, event.messageID);
    }
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    if (userGuess === randomNumber) {
      return api.sendMessage(`Correct! The number was ${randomNumber}. You win!`, event.threadID, event.messageID);
    } else {
      return api.sendMessage(`Wrong! The number was ${randomNumber}. Try again!`, event.threadID, event.messageID);
    }
  }

  if (cmd === 'riddle') {
    if (!input) {
      const r = riddles[Math.floor(Math.random() * riddles.length)];
      return api.sendMessage(`Riddle: ${r.q}\nAnswer by typing: encantadia riddle [your answer]`, event.threadID, event.messageID);
    } else {
      const correct = riddles.some(r => r.a === input);
      return api.sendMessage(correct ? 'Correct!' : 'Wrong answer, try again.', event.threadID, event.messageID);
    }
  }

  if (cmd === 'roll') {
    const roll = Math.floor(Math.random() * 6) + 1;
    return api.sendMessage(`You rolled a ${roll}`, event.threadID, event.messageID);
  }

  if (cmd === 'rps') {
    if (!input) return api.sendMessage('Choose one: rock, paper, scissors, jack, or empoy', event.threadID, event.messageID);

    const mapping = {
      rock: 'rock',
      paper: 'paper',
      scissors: 'scissors',
      jack: 'rock',
      empoy: 'scissors'
    };

    const userChoice = mapping[input];
    if (!userChoice) {
      return api.sendMessage('Invalid choice. Use rock, paper, scissors, jack, or empoy.', event.threadID, event.messageID);
    }

    const options = ['rock', 'paper', 'scissors'];
    const botChoice = options[Math.floor(Math.random() * options.length)];

    if (userChoice === botChoice) {
      return api.sendMessage(`Tie! Both chose ${userChoice}.`, event.threadID, event.messageID);
    }

    if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      return api.sendMessage(`You win! You: ${userChoice}, Bot: ${botChoice}`, event.threadID, event.messageID);
    } else {
      return api.sendMessage(`You lose! You: ${userChoice}, Bot: ${botChoice}`, event.threadID, event.messageID);
    }
  }

  return api.sendMessage('Unknown subcommand. Use choose, attack, status, guess, riddle, roll, or rps.', event.threadID, event.messageID);
};
