const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'balance',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Shows combined balance and earnings from all games',
  usages: 'balance',
  cooldowns: 5
};

const balanceFile = path.resolve(__dirname, 'balance.json');

function getUserBalance(userID) {
  try {
    const data = JSON.parse(fs.readFileSync(balanceFile, 'utf-8'));
    if (!data.users || !data.users[userID]) {
      return {
        casino: { balance: 0, earnings: 0 },
        garden: { balance: 0, earnings: 0 },
        pokemon: { balance: 0, earnings: 0 },
        grow: { balance: 0, earnings: 0 }
      };
    }
    return data.users[userID];
  } catch (err) {
    console.error('Failed to read balance.json:', err);
    return {
      casino: { balance: 0, earnings: 0 },
      garden: { balance: 0, earnings: 0 },
      pokemon: { balance: 0, earnings: 0 },
      grow: { balance: 0, earnings: 0 }
    };
  }
}

module.exports.run = async function({ api, event }) {
  const userID = event.senderID;
  const userBalance = getUserBalance(userID);

  const message =
    `╔═══════════════╗\n` +
    `║  🎮 GAME BALANCE  ║\n` +
    `╠═══════════════╣\n` +
    `║ Casino: ₱${userBalance.casino.balance} (Earnings: ₱${userBalance.casino.earnings})\n` +
    `║ Garden: ₱${userBalance.garden.balance} (Earnings: ₱${userBalance.garden.earnings})\n` +
    `║ Pokemon: ₱${userBalance.pokemon.balance} (Earnings: ₱${userBalance.pokemon.earnings})\n` +
    `║ Grow: ₱${userBalance.grow.balance} (Earnings: ₱${userBalance.grow.earnings})\n` +
    `╚═══════════════╝`;

  return api.sendMessage(message, event.threadID, event.messageID);
};
