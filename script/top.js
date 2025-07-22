const fs = require('fs');
const BAL_FILE = './balance.json';

module.exports.config = {
  name: 'top',
  version: '2.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['leaderboard', 'topcoins'],
  description: 'Show top users with highest coins (uses balance.json)',
  usage: 'top',
  credits: 'OpenAI + You'
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  // Load balances from file
  let balances = {};
  if (fs.existsSync(BAL_FILE)) {
    try {
      balances = JSON.parse(fs.readFileSync(BAL_FILE));
    } catch (err) {
      console.error('❌ Failed to read balance.json:', err);
      return api.sendMessage('❌ Error loading balances.', threadID, messageID);
    }
  }

  const users = Object.entries(balances);
  if (users.length === 0) {
    return api.sendMessage('📉 Walang data sa leaderboard pa. Maglaro muna kayo!', threadID, messageID);
  }

  // Sort by coin balance
  const topUsers = users
    .sort((a, b) => b[1].coins - a[1].coins)
    .slice(0, 10); // Top 10

  // Build message
  let message = '🏆 TOP 10 RICHEST USERS:\n';
  for (let i = 0; i < topUsers.length; i++) {
    const [id, user] = topUsers[i];
    message += `${i + 1}. ${user.name || 'User'} (ID: ${id}) — 💰 ${user.coins} coins\n`;
  }

  return api.sendMessage(message.trim(), threadID, messageID);
};
