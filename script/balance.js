const fs = require('fs');
const path = require('path');

const userDataPath = path.resolve(__dirname, 'balance.json');

function loadData() {
  if (!fs.existsSync(userDataPath)) return {};
  const data = fs.readFileSync(userDataPath, 'utf8');
  return JSON.parse(data || '{}');
}

function saveData(data) {
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

/**
 * Returns a boxed message with emoji according to type.
 * @param {string} text - The message text (can be multiline).
 * @param {string} type - One of 'success', 'error', 'info', or 'warning'.
 * @returns {string} Boxed message string.
 */
function boxMessage(text, type = 'info') {
  const emojis = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };
  const emoji = emojis[type] || emojis.info;
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length));
  const top = `╔═ ${emoji} ${'═'.repeat(maxLength)} ═╗`;
  const bottom = `╚${'═'.repeat(maxLength + 4)}╝`;
  const middle = lines
    .map(line => `║ ${line}${' '.repeat(maxLength - line.length)} ║`)
    .join('\n');
  return [top, middle, bottom].join('\n');
}

function initUser(data, userId) {
  if (!data[userId]) data[userId] = { balance: 0 };
}

module.exports.config = {
  name: 'balance',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['bal'],
  description: 'Check and manage your balance',
};

module.exports.run = async function({ api, event, args }) {
  const userId = event.senderID;
  const command = args[0]?.toLowerCase() || '';
  const amountStr = args[1];
  const data = loadData();

  initUser(data, userId);

  let reply = '';

  switch(command) {
    case 'check':
    case 'show':
      reply = boxMessage(`Your balance is: ₱${data[userId].balance}`, 'info');
      break;

    case 'add':
    case 'deposit': {
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        reply = boxMessage('Invalid amount to add.', 'error');
        break;
      }
      data[userId].balance += amount;
      saveData(data);
      reply = boxMessage(
        `Successfully added ₱${amount} to your balance.\nCurrent Balance: ₱${data[userId].balance}`,
        'success'
      );
      break;
    }

    case 'subtract':
    case 'withdraw': {
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        reply = boxMessage('Invalid amount to subtract.', 'error');
        break;
      }
      if (data[userId].balance < amount) {
        reply = boxMessage('Insufficient balance.', 'error');
        break;
      }
      data[userId].balance -= amount;
      saveData(data);
      reply = boxMessage(
        `Successfully withdrew ₱${amount}.\nCurrent Balance: ₱${data[userId].balance}`,
        'success'
      );
      break;
    }

    default:
      reply = boxMessage(
        `Available commands:\n` +
        `- check / show : Check your balance\n` +
        `- add / deposit <amount> : Add money\n` +
        `- subtract / withdraw <amount> : Subtract money`,
        'info'
      );
  }

  return api.sendMessage(reply, event.threadID, event.messageID);
};
