module.exports.config = {
  name: 'games',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['game'],
  description: 'Play games: guess number, riddle, roll, rps',
  usage: 'games [guess|riddle|roll|rps] [input]',
  credits: 'OpenAI'
};

const riddles = [
  { q: "What has keys but can't open locks?", a: "keyboard" },
  { q: "What has a neck but no head?", a: "bottle" },
  { q: "What has hands but can't clap?", a: "clock" }
];

module.exports.run = async function({ api, event, args }) {
  if (args.length === 0) {
    return api.sendMessage(
      'Please choose a game:\n- guess [number]\n- riddle [answer]\n- roll\n- rps [rock|paper|scissors|jack|empoy]',
      event.threadID,
      event.messageID
    );
  }

  const game = args[0].toLowerCase();
  const input = args.slice(1).join(' ').toLowerCase();

  // --- GUESS THE NUMBER ---
  if (game === 'guess') {
    const userGuess = parseInt(input);
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 10) {
      return api.sendMessage('Please enter a number between 1 and 10. Example: games guess 7', event.threadID, event.messageID);
    }
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    if (userGuess === randomNumber) {
      return api.sendMessage(`Correct! The number was ${randomNumber}. You win!`, event.threadID, event.messageID);
    } else {
      return api.sendMessage(`Wrong guess! The number was ${randomNumber}. Try again!`, event.threadID, event.messageID);
    }
  }

  // --- RIDDLE ---
  if (game === 'riddle') {
    if (!input) {
      // Give a riddle
      const r = riddles[Math.floor(Math.random() * riddles.length)];
      return api.sendMessage(`Riddle: ${r.q}\nAnswer by typing: games riddle [your answer]`, event.threadID, event.messageID);
    } else {
      // Check answer
      const correct = riddles.some(r => r.a === input);
      return api.sendMessage(correct ? 'Correct! 🎉' : 'Wrong answer, try again.', event.threadID, event.messageID);
    }
  }

  // --- ROLL DIE ---
  if (game === 'roll') {
    const roll = Math.floor(Math.random() * 6) + 1;
    return api.sendMessage(`🎲 You rolled a ${roll}`, event.threadID, event.messageID);
  }

  // --- ROCK PAPER SCISSORS ---
  if (game === 'rps') {
    if (!input) return api.sendMessage('Choose one: rock, paper, scissors, jack, or empoy', event.threadID, event.messageID);

    // Map special terms "jack" = rock, "empoy" = scissors
    const mapping = {
      rock: 'rock',
      paper: 'paper',
      scissors: 'scissors',
      jack: 'rock',
      empoy: 'scissors'
    };

    const userChoice = mapping[input];
    if (!userChoice) {
      return api.sendMessage('Invalid choice. Choose rock, paper, scissors, jack, or empoy.', event.threadID, event.messageID);
    }

    const options = ['rock', 'paper', 'scissors'];
    const botChoice = options[Math.floor(Math.random() * options.length)];

    if (userChoice === botChoice) {
      return api.sendMessage(`Tie! We both chose ${userChoice}.`, event.threadID, event.messageID);
    }

    if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      return api.sendMessage(`You win! You chose ${userChoice}, I chose ${botChoice}.`, event.threadID, event.messageID);
    } else {
      return api.sendMessage(`You lose! You chose ${userChoice}, I chose ${botChoice}.`, event.threadID, event.messageID);
    }
  }

  return api.sendMessage('Unknown game option. Please use guess, riddle, roll, or rps.', event.threadID, event.messageID);
};
