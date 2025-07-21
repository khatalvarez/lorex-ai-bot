module.exports.config = {
  name: 'casster',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Grow a simple garden in the group chat',
  usage: 'garden [plant|water|harvest|status]',
  credits: 'OpenAI'
};

const plantsData = {}; // { threadID: { userID: plantObj } }

// Helper: current time in ms
function now() { return Date.now(); }

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const cmd = args[0] ? args[0].toLowerCase() : null;

  if (!plantsData[threadID]) plantsData[threadID] = {};
  if (!plantsData[threadID][senderID]) {
    plantsData[threadID][senderID] = null; // no plant yet
  }

  let plant = plantsData[threadID][senderID];

  if (!cmd || !['plant','water','harvest','status'].includes(cmd)) {
    return api.sendMessage(
      '🌱 Garden commands:\n' +
      '• plant - Plant a seed\n' +
      '• water - Water your plant (makes it grow)\n' +
      '• harvest - Harvest mature plant\n' +
      '• status - Check your plant status',
      threadID, messageID
    );
  }

  if (cmd === 'plant') {
    if (plant) return api.sendMessage('🌿 You already have a plant growing!', threadID, messageID);
    plantsData[threadID][senderID] = {
      stage: 0, // 0=Seedling,1=Growing,2=Mature
      plantedAt: now(),
      wateredAt: now()
    };
    return api.sendMessage('🌱 You planted a seed! Water it to grow.', threadID, messageID);
  }

  if (!plant) return api.sendMessage('❌ You have no plant yet. Use "garden plant" first.', threadID, messageID);

  if (cmd === 'water') {
    if (plant.stage >= 2) return api.sendMessage('🌻 Your plant is already mature!', threadID, messageID);

    const diff = now() - plant.wateredAt;
    if (diff < 30000) { // 30 seconds cooldown between watering
      const sec = Math.ceil((30000 - diff) / 1000);
      return api.sendMessage(`💧 Wait ${sec}s before watering again.`, threadID, messageID);
    }

    plant.stage++;
    plant.wateredAt = now();

    const stages = ['Seedling', 'Growing', 'Mature'];
    return api.sendMessage(`💦 You watered your plant! It is now at stage: ${stages[plant.stage]}`, threadID, messageID);
  }

  if (cmd === 'harvest') {
    if (plant.stage < 2) return api.sendMessage('🌿 Your plant is not mature yet!', threadID, messageID);
    plantsData[threadID][senderID] = null;
    return api.sendMessage('🎉 You harvested your mature plant! You earned some garden points!', threadID, messageID);
  }

  if (cmd === 'status') {
    if (!plant) return api.sendMessage('🌱 You have no plant. Use "garden plant" to start.', threadID, messageID);
    const stages = ['Seedling', 'Growing', 'Mature'];
    const stageName = stages[plant.stage];
    const sinceWatered = Math.floor((now() - plant.wateredAt) / 1000);
    return api.sendMessage(
      `🌿 Your plant status:\nStage: ${stageName}\nLast watered: ${sinceWatered}s ago`,
      threadID, messageID
    );
  }
};
