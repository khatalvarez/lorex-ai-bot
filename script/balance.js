const fs = require('fs-extra');
const path = require('path');
const dataPath = path.join(__dirname, 'cache', 'balance.json');

module.exports.config = {
  name: 'balance',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['bal', 'money', 'pera'],
  description: 'Check your current balance, bank, and debt',
  usages: 'balance',
  credits: 'OpenAI + You',
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, senderID } = event;

  let data = {};
  try {
    data = fs.readJsonSync(dataPath);
  } catch {
    data = {};
  }

  if (!data[senderID]) {
    data[senderID] = { wallet: 0, bank: 0, debt: 0 };
    fs.writeJsonSync(dataPath, data);
  }

  const userData = data[senderID];
  const wallet = userData.wallet || 0;
  const bank = userData.bank || 0;
  const debt = userData.debt || 0;

  const message = `🧾 Your Balance:
💼 Wallet: ₱${wallet.toLocaleString()}
🏦 Bank: ₱${bank.toLocaleString()}
📉 Debt: ₱${debt.toLocaleString()}`;

  return api.sendMessage(message, threadID);
};
