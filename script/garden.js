const fruitsList = ['🍎 apple', '🍌 banana', '🍊 orange', '🥭 mango', '🍇 grape'];

const gardens = {}; // userID => { seeds: { fruit: count }, planted: { fruit: {count, watered} }, harvested: { fruit: count } }

const gardenHelpImage = 'https://i.ibb.co/SwC5H5mr/garden-image.jpg'; // direct image URL

module.exports.config = {
  name: 'garden',
  version: '1.2.0',
  role: 0,
  hasPrefix: true,
  aliases: ['harvest', 'fruit', 'farm', 'seed', 'water', 'shop'],
  description: '🌻 Farm fruits, water, harvest & get free seeds!',
  usage: `Commands:
- garden shop 🛒 → see free seeds available
- garden buy [fruit] [amount] 🛍️ → get free seeds (example: garden buy apple 3)
- garden seeds 🥚 → show your seeds inventory
- garden plant [fruit] [amount] 🌱 → plant seeds (must have seeds)
- garden water [fruit] 💧 → water your planted fruits
- garden harvest [fruit] 🍎 → harvest watered fruits
- garden status 📊 → show garden status`,
  credits: 'OpenAI'
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
  return ['apple', 'banana', 'orange', 'mango', 'grape'].includes(fruit);
}

module.exports.run = async function({ api, event, args, Users }) {
  const userID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const message = event.body.toLowerCase();

  // Auto reply if message contains "garden" anywhere
  if (message.includes('garden') && (!args.length || args[0].toLowerCase() !== 'garden')) {
    return api.sendMessage({
      body:
        `🌿 It looks like you mentioned *garden*! Here are the commands to get you started:\n\n` +
        `🛒 garden shop\n` +
        `🛍️ garden buy [fruit] [amount]\n` +
        `🥚 garden seeds\n` +
        `🌱 garden plant [fruit] [amount]\n` +
        `💧 garden water [fruit]\n` +
        `🍎 garden harvest [fruit]\n` +
        `📊 garden status`,
      attachment: await require('axios')
        .get(gardenHelpImage, { responseType: 'arraybuffer' })
        .then(res => Buffer.from(res.data, 'utf-8'))
        .catch(() => null)
    }, threadID, messageID);
  }

  const userGarden = getUserGarden(userID);
  const subcommand = args[0] ? args[0].toLowerCase() : '';
  const fruit = args[1] ? args[1].toLowerCase() : '';
  const amount = args[2] ? parseInt(args[2]) : 1;

  if (subcommand === 'shop') {
    return api.sendMessage(
      `🌻 Garden Shop - Free Seeds Available:\n` +
      ['🍎 apple', '🍌 banana', '🍊 orange', '🥭 mango', '🍇 grape'].join('\n') +
      `\n\nGet seeds by typing:\n` +
      `garden buy [fruit] [amount]\n` +
      `Example: garden buy apple 3`,
      threadID,
      messageID
    );
  }

  if (subcommand === 'buy') {
    if (!fruit || !isValidFruit(fruit)) {
      return api.sendMessage(`❌ Invalid fruit! Available seeds: apple, banana, orange, mango, grape`, threadID, messageID);
    }
    if (isNaN(amount) || amount < 1) {
      return api.sendMessage(`❌ Please enter a valid amount (1 or more).`, threadID, messageID);
    }
    userGarden.seeds[fruit] = (userGarden.seeds[fruit] || 0) + amount;
    return api.sendMessage(`✅ You got ${amount} ${fruit} seed${amount > 1 ? 's' : ''} for free! 🎉`, threadID, messageID);
  }

  if (subcommand === 'seeds') {
    const seedEntries = Object.entries(userGarden.seeds).filter(([f, c]) => c > 0);
    if (seedEntries.length === 0) {
      return api.sendMessage('🌱 You have no seeds. Get some from the shop:\ngarden shop', threadID, messageID);
    }
    let msg = '🌱 Your Seed Inventory:\n';
    seedEntries.forEach(([f, c]) => msg += `- ${f}: ${c}\n`);
    return api.sendMessage(msg, threadID, messageID);
  }

  if (subcommand === 'plant') {
    if (!fruit || !isValidFruit(fruit)) {
      return api.sendMessage(`❌ Invalid fruit! Available seeds: apple, banana, orange, mango, grape`, threadID, messageID);
    }
    if (isNaN(amount) || amount < 1) {
      return api.sendMessage(`❌ Please enter a valid amount to plant (1 or more).`, threadID, messageID);
    }
    const availableSeeds = userGarden.seeds[fruit] || 0;
    if (availableSeeds < amount) {
      return api.sendMessage(`❌ You only have ${availableSeeds} ${fruit} seed${availableSeeds !== 1 ? 's' : ''}.`, threadID, messageID);
    }
    userGarden.seeds[fruit] -= amount;

    if (!userGarden.planted[fruit]) userGarden.planted[fruit] = { count: 0, watered: false };
    userGarden.planted[fruit].count += amount;
    userGarden.planted[fruit].watered = false;

    return api.sendMessage(`🌱 You planted ${amount} ${fruit} seed${amount > 1 ? 's' : ''}. Don't forget to water them! 💧`, threadID, messageID);
  }

  if (subcommand === 'water') {
    if (!fruit || !isValidFruit(fruit)) {
      return api.sendMessage(`❌ Invalid fruit to water!`, threadID, messageID);
    }
    if (!userGarden.planted[fruit] || userGarden.planted[fruit].count === 0) {
      return api.sendMessage(`❌ You have no planted ${fruit} to water.`, threadID, messageID);
    }
    userGarden.planted[fruit].watered = true;
    return api.sendMessage(`💧 You watered your planted ${fruit}. They are ready to harvest! 🍎`, threadID, messageID);
  }

  if (subcommand === 'harvest') {
    if (!fruit || !isValidFruit(fruit)) {
      return api.sendMessage(`❌ Invalid fruit to harvest!`, threadID, messageID);
    }
    const planted = userGarden.planted[fruit];
    if (!planted || planted.count === 0) {
      return api.sendMessage(`❌ You have no planted ${fruit} to harvest.`, threadID, messageID);
    }
    if (!planted.watered) {
      return api.sendMessage(`❌ You need to water your planted ${fruit} before harvesting! 💧`, threadID, messageID);
    }
    const harvestCount = planted.count;
    planted.count = 0;
    planted.watered = false;

    userGarden.harvested[fruit] = (userGarden.harvested[fruit] || 0) + harvestCount;
    return api.sendMessage(`🍎 You harvested ${harvestCount} ${fruit}${harvestCount > 1 ? 's' : ''}! 🎉`, threadID, messageID);
  }

  if (subcommand === 'status') {
    let msg = '🌻 Your Garden Status:\n\n';

    // Seeds
    const seedEntries = Object.entries(userGarden.seeds).filter(([f, c]) => c > 0);
    msg += 'Seeds:\n';
    if (seedEntries.length === 0) msg += '- None\n';
    else seedEntries.forEach(([f, c]) => msg += `- ${f}: ${c}\n`);

    // Planted
    msg += '\nPlanted:\n';
    const plantedEntries = Object.entries(userGarden.planted).filter(([f, p]) => p.count > 0);
    if (plantedEntries.length === 0) msg += '- None\n';
    else
      plantedEntries.forEach(([f, p]) =>
        msg += `- ${f}: ${p.count} (Watered: ${p.watered ? 'Yes 💧' : 'No ❌'})\n`
      );

    // Harvested
    msg += '\nHarvested:\n';
    const harvestedEntries = Object.entries(userGarden.harvested).filter(([f, c]) => c > 0);
    if (harvestedEntries.length === 0) msg += '- None\n';
    else harvestedEntries.forEach(([f, c]) => msg += `- ${f}: ${c}\n`);

    return api.sendMessage(msg, threadID, messageID);
  }

  // Default help message
  return api.sendMessage(
    `🌿 Garden Commands:\n` +
    `🛒 garden shop → See free seeds available\n` +
    `🛍️ garden buy [fruit] [amount] → Get free seeds\n` +
    `🥚 garden seeds → Show your seeds inventory\n` +
    `🌱 garden plant [fruit] [amount] → Plant seeds\n` +
    `💧 garden water [fruit] → Water your planted fruits\n` +
    `🍎 garden harvest [fruit] → Harvest watered fruits\n` +
    `📊 garden status → Show garden status\n\n` +
    `Available fruits: apple, banana, orange, mango, grape`,
    threadID,
    messageID
  );
};
