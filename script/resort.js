const fs = require('fs');
const path = './data/users.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

const CLEAN_COST = 100;
const BASE_EARN = 300;
const UPGRADE_COST = 500;

module.exports.config = {
  name: 'resort',
  version: '1.0.0',
  hasPermission: 0,
  description: 'GTP Resort: Clean, upgrade, collect income using coins',
  usages: 'resort [clean|upgrade|collect] [userNumber]',
  credits: 'Omega Team 🏝️',
  cooldowns: 5,
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0];
  const userNum = args[1];

  if (!command || !userNum || !users[userNum]) {
    return api.sendMessage('📌 Usage: resort [clean|upgrade|collect] [number]\nMake sure user is registered.', threadID, messageID);
  }

  // Initialize resort data if not present
  if (!users[userNum].resort) {
    users[userNum].resort = {
      level: 1,
      isClean: false,
      lastCollect: 0
    };
  }

  const resort = users[userNum].resort;
  const now = Date.now();

  switch (command.toLowerCase()) {
    case 'clean': {
      if (users[userNum].balance < CLEAN_COST)
        return api.sendMessage('❌ Not enough balance to clean the resort. Requires $100.', threadID, messageID);

      if (resort.isClean)
        return api.sendMessage('🧼 Resort is already clean. No need to clean again!', threadID, messageID);

      users[userNum].balance -= CLEAN_COST;
      resort.isClean = true;
      saveUserData();

      return api.sendMessage('🧹 You cleaned the resort! Now it can earn income.', threadID, messageID);
    }

    case 'upgrade': {
      const upgradeFee = UPGRADE_COST * resort.level;
      if (users[userNum].balance < upgradeFee)
        return api.sendMessage(`❌ Not enough balance to upgrade. Required: $${upgradeFee}`, threadID, messageID);

      users[userNum].balance -= upgradeFee;
      resort.level += 1;
      saveUserData();

      return api.sendMessage(`⬆️ Resort upgraded to level ${resort.level}! More income unlocked.`, threadID, messageID);
    }

    case 'collect': {
      const hoursPassed = (now - resort.lastCollect) / (1000 * 60 * 60);

      if (!resort.isClean)
        return api.sendMessage('🚫 Your resort is dirty. Clean it before collecting earnings.', threadID, messageID);

      if (hoursPassed < 1)
        return api.sendMessage('🕐 You can only collect once per hour. Please wait.', threadID, messageID);

      const earnings = BASE_EARN * resort.level;
      users[userNum].balance += earnings;
      resort.lastCollect = now;
      resort.isClean = false; // resort gets dirty after collecting
      saveUserData();

      return api.sendMessage(`💰 You collected $${earnings} from your resort!\n🧹 Resort is now dirty, clean it again to earn.`, threadID, messageID);
    }

    default:
      return api.sendMessage('❓ Invalid resort command. Use: clean, upgrade, collect', threadID, messageID);
  }
};
