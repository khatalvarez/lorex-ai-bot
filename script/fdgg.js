const fs = require('fs-extra');
const path = require('path');
const dataPath = path.join(__dirname, 'cache', 'balance.json');

module.exports.config = {
  name: 'bank',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['wallet', 'atm'],
  description: 'Deposit, withdraw or check your bank balance',
  usages: 'bank [deposit|withdraw] [amount]',
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
  const data = loadData();

  if (!data[senderID]) {
    data[senderID] = { wallet: 0, bank: 0 };
  }

  const user = data[senderID];

  const [action, amountArg] = args;

  if (!action) {
    return api.sendMessage(
      `🏦 Your Account:\n` +
      `💼 Wallet: ₱${user.wallet.toLocaleString()}\n` +
      `🏦 Bank: ₱${user.bank.toLocaleString()}\n\n` +
      `Use:\n- bank deposit [amount]\n- bank withdraw [amount]`,
      threadID,
      messageID
    );
  }

  const amount = parseInt(amountArg);
  if (isNaN(amount) || amount <= 0) {
    return api.sendMessage("❌ Please provide a valid amount.", threadID, messageID);
  }

  if (action.toLowerCase() === 'deposit') {
    if (user.wallet < amount) {
      return api.sendMessage("❌ You don't have enough in your wallet.", threadID, messageID);
    }
    user.wallet -= amount;
    user.bank += amount;
    saveData(data);
    return api.sendMessage(
      `✅ Deposited ₱${amount.toLocaleString()} to your bank.\n` +
      `💼 Wallet: ₱${user.wallet.toLocaleString()}\n` +
      `🏦 Bank: ₱${user.bank.toLocaleString()}`,
      threadID,
      messageID
    );
  }

  if (action.toLowerCase() === 'withdraw') {
    if (user.bank < amount) {
      return api.sendMessage("❌ You don't have enough in your bank.", threadID, messageID);
    }
    user.bank -= amount;
    user.wallet += amount;
    saveData(data);
    return api.sendMessage(
      `✅ Withdrew ₱${amount.toLocaleString()} from your bank.\n` +
      `💼 Wallet: ₱${user.wallet.toLocaleString()}\n` +
      `🏦 Bank: ₱${user.bank.toLocaleString()}`,
      threadID,
      messageID
    );
  }

  return api.sendMessage("❌ Invalid action. Use 'deposit' or 'withdraw'.", threadID, messageID);
};
