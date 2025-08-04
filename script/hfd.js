const fs = require('fs-extra');
const path = require('path');
const dataPath = path.join(__dirname, 'cache', 'balance.json');

module.exports.config = {
  name: 'loan',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['utang', 'borrow'],
  description: 'Borrow money (unlimited)',
  usages: 'loan [amount]',
  credits: 'OpenAI + You',
  cooldowns: 3
};

function loadData() {
  try {
    return fs.readJsonSync(dataPath);
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeJsonSync(dataPath, data);
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const amount = parseInt(args[0]);

  if (isNaN(amount) || amount <= 0) {
    return api.sendMessage("❌ Please enter a valid loan amount (positive number).", threadID, messageID);
  }

  const data = loadData();

  if (!data[senderID]) {
    data[senderID] = { wallet: 0, bank: 0, debt: 0 };
  }

  data[senderID].wallet += amount;
  data[senderID].debt = (data[senderID].debt || 0) + amount;

  saveData(data);

  return api.sendMessage(
    `💸 You borrowed ₱${amount.toLocaleString()}.\n` +
    `💼 New Wallet: ₱${data[senderID].wallet.toLocaleString()}\n` +
    `📉 Total Debt: ₱${data[senderID].debt.toLocaleString()}`,
    threadID,
    messageID
  );
};

