const fs = require('fs');
const BAL_FILE = './balance.json';

let balances = {};
if (fs.existsSync(BAL_FILE)) {
  try {
    balances = JSON.parse(fs.readFileSync(BAL_FILE));
  } catch (e) {
    console.error('❌ Error loading balance.json:', e);
    balances = {};
  }
}

function saveBalances() {
  fs.writeFileSync(BAL_FILE, JSON.stringify(balances, null, 2));
}

module.exports.config = {
  name: 'horserace',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['race', 'horse'],
  description: 'Horse racing mini-game to win coins.',
  usage: 'horserace [1-4]',
  credits: 'OpenAI + You'
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  if (!balances[senderID]) {
    balances[senderID] = { name: `User ${senderID}`, coins: 100 };
    saveBalances();
  }

  const user = balances[senderID];

  if (!args[0] || isNaN(args[0])) {
    return api.sendMessage('🐎 Pick a horse number (1 to 4). Example: horserace 2', threadID, messageID);
  }

  const chosenHorse = parseInt(args[0]);
  if (chosenHorse < 1 || chosenHorse > 4) {
    return api.sendMessage('🚫 Horse number must be between 1 and 4.', threadID, messageID);
  }

  if (user.coins < 20) {
    return api.sendMessage('❌ You need at least 20 coins to race.', threadID, messageID);
  }

  user.coins -= 20;

  const winningHorse = Math.floor(Math.random() * 4) + 1;
  const reward = Math.floor(Math.random() * 71) + 50; // 50 to 120 coins
  let msg = `🐴 HORSE RACE STARTED!\nYou chose horse #${chosenHorse}.\nWinning horse is #${winningHorse}.\n`;

  if (chosenHorse === winningHorse) {
    user.coins += reward;
    msg += `🎉 You win! +${reward} coins!`;
  } else {
    msg += `😢 You lost. Better luck next time.`;
  }

  msg += `\n💰 Balance: ${user.coins} coins`;

  saveBalances();
  return api.sendMessage(msg, threadID, messageID);
};
