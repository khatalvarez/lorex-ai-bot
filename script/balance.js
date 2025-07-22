const fs = require('fs');
const BAL_FILE = './balance.json';
const ADMIN_ID = '61575137262643'; // change this to your admin ID

// Load or initialize balance data
let balances = {};
if (fs.existsSync(BAL_FILE)) {
  try {
    balances = JSON.parse(fs.readFileSync(BAL_FILE));
  } catch (err) {
    console.error('❌ Failed to load balance.json. Initializing new file.');
    balances = {};
  }
} else {
  fs.writeFileSync(BAL_FILE, '{}');
}

function saveBalances() {
  try {
    fs.writeFileSync(BAL_FILE, JSON.stringify(balances, null, 2));
  } catch (err) {
    console.error('❌ Failed to save balance.json.', err);
  }
}

module.exports.config = {
  name: 'balance',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['bal'],
  description: 'Check your balance or (admin) see all user balances.',
  usage: 'balance OR balance all (admin)',
  credits: 'OpenAI + You'
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  // Ensure balance entry for user exists
  if (!balances[senderID]) {
    balances[senderID] = {
      name: `User ${senderID}`,
      coins: 100
    };
    saveBalances();
  }

  // === Admin check all balances
  if (args[0] && args[0].toLowerCase() === 'all') {
    if (senderID !== ADMIN_ID) return api.sendMessage('❌ Only admin can use "balance all".', threadID, messageID);

    let msg = `📊 ALL USER BALANCES:\n`;
    for (const [id, info] of Object.entries(balances)) {
      msg += `👤 ${info.name || `User ${id}`}: ${info.coins} coins\n`;
    }

    return api.sendMessage(msg.trim(), threadID, messageID);
  }

  // === Show user balance
  const userInfo = balances[senderID];
  return api.sendMessage(`💰 Your balance: ${userInfo.coins} coins`, threadID, messageID);
};
