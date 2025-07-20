const fruitsList = ['apple', 'banana', 'orange', 'mango', 'grape'];
const fruitEmojis = {
  apple: '🍎',
  banana: '🍌',
  orange: '🍊',
  mango: '🥭',
  grape: '🍇'
};

const gardens = {}; // userID => { seeds, planted, harvested }

const gardenHelpImage = 'https://i.ibb.co/SwC5H5mr/garden-image.jpg';

module.exports.config = {
  name: 'garden',
  version: '1.2.1',
  role: 0,
  hasPrefix: true,
  aliases: ['harvest', 'fruit', 'farm', 'seed', 'water', 'shop'],
  description: '🌻 Farm fruits, water, harvest & get free seeds!',
  usage: `See 'garden' for full help`,
  credits: 'OpenAI (fixed by ChatGPT)'
};

function getUserGarden(userID) {
  if (!gardens[userID]) {
    gardens[userID] = {
      seeds: {},
      planted: {},
      harvested: {}
    };
  }
  return gardens[userID];
}

function isValidFruit(fruit) {
  return fruitsList.includes(fruit);
}

module.exports.run = async function({ api, event, args }) {
  const userID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;
  const message = event.body.toLowerCase();

  const userGarden = getUserGarden(userID);

  const sub = args[0]?.toLowerCase() || '';
  const fruit = args[1]?.toLowerCase();
  const amount = parseInt(args[2]) || 1;

  // Auto-help image if user says "garden"
  if (message.includes('garden') && !sub) {
    return api.sendMessage({
      body: `🌿 Welcome to your Garden! Try these:\n\n🛒 garden shop\n🛍️ garden buy [fruit] [amount]\n🥚 garden seeds\n🌱 garden plant [fruit] [amount]\n💧 garden water [fruit]\n🍎 garden harvest [fruit]\n📊 garden status`,
      attachment: await require('axios')
        .get(gardenHelpImage, { responseType: 'arraybuffer' })
        .then(res => Buffer.from(res.data, 'utf-8'))
        .catch(() => null)
    }, threadID, messageID);
  }

  // SHOP
  if (sub === 'shop') {
    const shopList = fruitsList.map(f => `${fruitEmojis[f]} ${f}`).join('\n');
    return api.sendMessage(`🛒 Garden Shop:\n${shopList}\n\nUse: garden buy [fruit] [amount]`, threadID, messageID);
  }

  // BUY
  if (sub === 'buy') {
    if (!isValidFruit(fruit)) {
      return api.sendMessage('❌ Invalid fruit! Try: apple, banana, orange, mango, grape', threadID, messageID);
    }
    if (isNaN(amount) || amount < 1) {
      return api.sendMessage('❌ Enter a valid number greater than 0.', threadID, messageID);
    }
    userGarden.seeds[fruit] = (userGarden.seeds[fruit] || 0) + amount;
    return api.sendMessage(`✅ You got ${amount} ${fruitEmojis[fruit]} ${fruit} seed${amount > 1 ? 's' : ''}!`, threadID, messageID);
  }

  // SEEDS
  if (sub === 'seeds') {
    const seedMsg = Object.entries(userGarden.seeds)
      .filter(([_, count]) => count > 0)
      .map(([f, c]) => `- ${fruitEmojis[f]} ${f}: ${c}`)
      .join('\n') || '- None';
    return api.sendMessage(`🥚 Your Seeds:\n${seedMsg}`, threadID, messageID);
  }

  // PLANT
  if (sub === 'plant') {
    if (!isValidFruit(fruit)) {
      return api.sendMessage('❌ Invalid fruit to plant.', threadID, messageID);
    }
    if (isNaN(amount) || amount < 1) {
      return api.sendMessage('❌ Enter a valid amount to plant.', threadID, messageID);
    }
    const available = userGarden.seeds[fruit] || 0;
    if (available < amount) {
      return api.sendMessage(`❌ You only have ${available} ${fruitEmojis[fruit]} ${fruit} seed${available !== 1 ? 's' : ''}.`, threadID, messageID);
    }

    userGarden.seeds[fruit] -= amount;
    if (!userGarden.planted[fruit]) userGarden.planted[fruit] = { count: 0, watered: false };

    userGarden.planted[fruit].count += amount;
    userGarden.planted[fruit].watered = false;

    return api.sendMessage(`🌱 Planted ${amount} ${fruitEmojis[fruit]} ${fruit} seed${amount > 1 ? 's' : ''}. Don't forget to water! 💧`, threadID, messageID);
  }

  // WATER
  if (sub === 'water') {
    if (!isValidFruit(fruit)) {
      return api.sendMessage('❌ Invalid fruit to water.', threadID, messageID);
    }
    const planted = userGarden.planted[fruit];
    if (!planted || planted.count === 0) {
      return api.sendMessage(`❌ You have no planted ${fruitEmojis[fruit]} ${fruit}.`, threadID, messageID);
    }
    if (planted.watered) {
      return api.sendMessage(`💧 Your ${fruit} is already watered. Ready to harvest!`, threadID, messageID);
    }

    planted.watered = true;
    return api.sendMessage(`💧 You watered your ${planted.count} ${fruitEmojis[fruit]} ${fruit}. Ready to harvest! 🍎`, threadID, messageID);
  }

  // HARVEST
  if (sub === 'harvest') {
    if (!isValidFruit(fruit)) {
      return api.sendMessage('❌ Invalid fruit to harvest.', threadID, messageID);
    }
    const planted = userGarden.planted[fruit];
    if (!planted || planted.count === 0) {
      return api.sendMessage(`❌ You have no planted ${fruitEmojis[fruit]} ${fruit}.`, threadID, messageID);
    }
    if (!planted.watered) {
      return api.sendMessage(`❌ You must water your ${fruit} before harvesting. 💧`, threadID, messageID);
    }

    const harvested = planted.count;
    planted.count = 0;
    planted.watered = false;
    userGarden.harvested[fruit] = (userGarden.harvested[fruit] || 0) + harvested;

    return api.sendMessage(`🎉 You harvested ${harvested} ${fruitEmojis[fruit]} ${fruit}${harvested > 1 ? 's' : ''}!`, threadID, messageID);
  }

  // STATUS
  if (sub === 'status') {
    let msg = '📊 Your Garden Status:\n\n';

    const seeds = Object.entries(userGarden.seeds).filter(([_, c]) => c > 0);
    const planted = Object.entries(userGarden.planted).filter(([_, p]) => p.count > 0);
    const harvested = Object.entries(userGarden.harvested).filter(([_, c]) => c > 0);

    msg += '🥚 Seeds:\n' + (seeds.length ? seeds.map(([f, c]) => `- ${fruitEmojis[f]} ${f}: ${c}`).join('\n') : '- None') + '\n\n';
    msg += '🌱 Planted:\n' + (planted.length
      ? planted.map(([f, p]) => `- ${fruitEmojis[f]} ${f}: ${p.count} (Watered: ${p.watered ? 'Yes 💧' : 'No ❌'})`).join('\n')
      : '- None') + '\n\n';
    msg += '🍎 Harvested:\n' + (harvested.length ? harvested.map(([f, c]) => `- ${fruitEmojis[f]} ${f}: ${c}`).join('\n') : '- None');

    return api.sendMessage(msg, threadID, messageID);
  }

  // DEFAULT HELP
  return api.sendMessage(
    `🌿 Garden Commands:\n` +
    `🛒 garden shop → See free seeds available\n` +
    `🛍️ garden buy [fruit] [amount] → Get free seeds
