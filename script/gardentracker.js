const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'gardenData.json');
const DAILY_CLAIM_AMOUNT = 500;
const SEED_PACKAGE_AMOUNT = 100;
const WORKER_COST = 100;

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error loading data:', e);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

function getUserData(data, userID) {
  if (!data[userID]) {
    data[userID] = {
      money: 1000,
      seeds: 0,
      plantsGrowing: 0,
      harvestReady: 0,
      lastGrowTime: 0,
      workers: 0,
      lastDailyClaim: 0
    };
  }
  return data[userID];
}

function canGrow(user) {
  const growCooldown = 5 * 60 * 1000; // 5 minutes grow time
  return Date.now() - user.lastGrowTime >= growCooldown;
}

module.exports.config = {
  name: 'harvestgame',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: "Grow a garden, buy seeds, water, harvest, sell, daily claim, hire workers",
  usages: "garden <command>",
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const data = loadData();
  const userID = event.senderID;
  const user = getUserData(data, userID);
  const threadID = event.threadID;
  const msg = args[0] ? args[0].toLowerCase() : '';

  switch(msg) {
    case 'balance':
      return api.sendMessage(
        `💰 Balance: $${user.money}\n🌱 Seeds: ${user.seeds}\n🌿 Plants Growing: ${user.plantsGrowing}\n🍎 Harvest Ready: ${user.harvestReady}\n👩‍🌾 Workers: ${user.workers}`,
        threadID, event.messageID
      );

    case 'buyseed':
      if (user.money < 100) 
        return api.sendMessage('❌ You need $100 to buy a seed package (100 seeds).', threadID, event.messageID);
      user.money -= 100;
      user.seeds += SEED_PACKAGE_AMOUNT;
      saveData(data);
      return api.sendMessage(`✅ You bought 100 seeds! You now have ${user.seeds} seeds.`, threadID, event.messageID);

    case 'water':
      if (user.plantsGrowing <= 0)
        return api.sendMessage('❌ You have no plants growing. Use "grow" to plant seeds.', threadID, event.messageID);
      return api.sendMessage('💧 You watered your plants. Keep growing!', threadID, event.messageID);

    case 'grow':
      if (user.seeds <= 0) return api.sendMessage('❌ You need seeds to grow plants. Buy seeds first.', threadID, event.messageID);
      if (!canGrow(user)) return api.sendMessage('⏳ Your plants are still growing. Wait a bit before growing again.', threadID, event.messageID);
      
      user.seeds--;
      user.plantsGrowing++;
      user.lastGrowTime = Date.now();
      saveData(data);
      return api.sendMessage(`🌱 You planted a seed. Plants growing: ${user.plantsGrowing}. Seeds left: ${user.seeds}`, threadID, event.messageID);

    case 'harvest':
      if (user.plantsGrowing <= 0) return api.sendMessage('❌ No plants to harvest yet.', threadID, event.messageID);
      
      // For simplicity: after grow cooldown, plants can be harvested
      if (!canGrow(user)) return api.sendMessage('⏳ Plants are not ready for harvest yet. Please wait.', threadID, event.messageID);

      const harvestAmount = user.plantsGrowing;
      user.harvestReady += harvestAmount;
      user.plantsGrowing = 0;
      saveData(data);
      return api.sendMessage(`🍎 You harvested ${harvestAmount} fruits! Ready to sell: ${user.harvestReady}`, threadID, event.messageID);

    case 'sell':
      if (user.harvestReady <= 0) return api.sendMessage('❌ No harvest to sell.', threadID, event.messageID);
      const earnings = user.harvestReady * 50; // $50 per harvest item
      user.money += earnings;
      user.harvestReady = 0;
      saveData(data);
      return api.sendMessage(`💵 You sold your harvest and earned $${earnings}! Balance: $${user.money}`, threadID, event.messageID);

    case 'daily':
      const now = Date.now();
      if (now - user.lastDailyClaim < 24 * 60 * 60 * 1000) {
        const left = 24*60*60*1000 - (now - user.lastDailyClaim);
        const hr = Math.floor(left / (60*60*1000));
        const min = Math.floor((left % (60*60*1000)) / (60*1000));
        return api.sendMessage(`⏳ Daily reward already claimed. Wait ${hr}h ${min}m`, threadID, event.messageID);
      }
      user.money += DAILY_CLAIM_AMOUNT;
      user.lastDailyClaim = now;
      saveData(data);
      return api.sendMessage(`🎉 You claimed your daily $${DAILY_CLAIM_AMOUNT}! Balance: $${user.money}`, threadID, event.messageID);

    case 'hire':
      if (user.money < WORKER_COST) return api.sendMessage(`❌ You need $${WORKER_COST} to hire a worker.`, threadID, event.messageID);
      user.money -= WORKER_COST;
      user.workers++;
      saveData(data);
      return api.sendMessage(`👩‍🌾 You hired a worker! Total workers: ${user.workers}`, threadID, event.messageID);

    case 'work':
      if (user.workers <= 0) return api.sendMessage('❌ You have no workers to work the garden. Hire some first.', threadID, event.messageID);
      const workEarn = user.workers * 100;
      user.money += workEarn;
      saveData(data);
      return api.sendMessage(`💼 Your workers earned you $${workEarn}! Balance: $${user.money}`, threadID, event.messageID);

    case 'status':
      return api.sendMessage(
        `🌱 Garden Status:\n` +
        `Money: $${user.money}\n` +
        `Seeds: ${user.seeds}\n` +
        `Plants Growing: ${user.plantsGrowing}\n` +
        `Harvest Ready: ${user.harvestReady}\n` +
        `Workers: ${user.workers}\n` +
        `Last Grow Time: ${user.lastGrowTime ? new Date(user.lastGrowTime).toLocaleString() : 'Never'}`,
        threadID, event.messageID
      );

    case 'help':
    default:
      return api.sendMessage(
        `🌻 Garden Bot Commands:\n` +
        `- balance: Check your money and seeds\n` +
        `- buyseed: Buy 100 seeds for $100\n` +
        `- grow: Plant 1 seed (5 min grow time)\n` +
        `- water: Water your plants\n` +
        `- harvest: Harvest grown plants\n` +
        `- sell: Sell your harvest for money\n` +
        `- daily: Claim daily $500 bonus\n` +
        `- hire: Hire a worker for $100\n` +
        `- work: Workers earn money for you\n` +
        `- status: Show garden and balance status\n` +
        `- help: Show this message`,
        threadID, event.messageID
      );
  }
};
