const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'claimdaily',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['claim', 'bonus'],
  description: 'Daily claim ng ₱9000 bonus',
  usages: 'daily',
  credits: 'OpenAI + You',
  cooldowns: 5
};

const DAILY_AMOUNT = 9000;
const COOLDOWN_HOURS = 24;
const dbPath = path.join(__dirname, 'cache', 'daily.json');

module.exports.run = async function({ api, event }) {
  const { threadID, senderID, messageID } = event;

  // Ensure cache file exists
  fs.ensureFileSync(dbPath);

  // Load or initialize the data
  let db = {};
  try {
    db = fs.readJsonSync(dbPath);
  } catch (e) {
    db = {};
  }

  const now = Date.now();
  const lastClaim = db[senderID]?.lastClaim || 0;
  const timePassed = now - lastClaim;
  const cooldown = COOLDOWN_HOURS * 60 * 60 * 1000;

  if (timePassed < cooldown) {
    const timeLeft = cooldown - timePassed;
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
    return api.sendMessage(
      `⏳ You already claimed your daily bonus.\n🕒 Try again in ${hours}h ${minutes}m ${seconds}s.`,
      threadID,
      messageID
    );
  }

  // Update claim time
  db[senderID] = {
    lastClaim: now
  };
  fs.writeJsonSync(dbPath, db);

  // Send success message
  return api.sendMessage(
    `✅ You have claimed your ₱${DAILY_AMOUNT.toLocaleString()} daily bonus!`,
    threadID,
    messageID
  );
};
