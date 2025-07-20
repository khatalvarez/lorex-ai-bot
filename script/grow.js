module.exports.config = {
  name: 'garden',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['grow'],
  description: 'Grow and care for your own mini garden!',
  usage: 'garden [plant | water | harvest | reset | gag on/off]',
  credits: 'YourNameHere'
};

const userGardens = new Map(); // in-memory user gardens

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const input = args.join(' ').toLowerCase();
  
  // Initialize garden if not present
  if (!userGardens.has(senderID)) {
    userGardens.set(senderID, {
      stage: 0, // 0 = nothing, 1 = planted, 2 = watered, 3 = grown
      gag: false
    });
  }

  const user = userGardens.get(senderID);

  // Gag on/off logic
  if (input === 'gag on') {
    user.gag = true;
    return api.sendMessage('🔇 Garden responses have been silenced.', threadID, messageID);
  }

  if (input === 'gag off') {
    user.gag = false;
    return api.sendMessage('🔔 Garden responses have been restored.', threadID, messageID);
  }

  if (user.gag) return; // Suppress responses if gagged

  // Main garden logic
  switch (input) {
    case 'plant':
      if (user.stage > 0) return api.sendMessage('🌱 You already planted something! Try watering it.', threadID, messageID);
      user.stage = 1;
      return api.sendMessage('🌱 You planted a seed. It’s waiting for water.', threadID, messageID);

    case 'water':
      if (user.stage === 0) return api.sendMessage('🌾 You need to plant something first!', threadID, messageID);
      if (user.stage === 1) {
        user.stage = 2;
        return api.sendMessage('💧 You watered the plant. It’s growing!', threadID, messageID);
      }
      if (user.stage === 2) {
        user.stage = 3;
        return api.sendMessage('🌻 Your plant has fully grown! Time to harvest.', threadID, messageID);
      }
      return api.sendMessage('🌻 It’s already fully grown. Try harvesting.', threadID, messageID);

    case 'harvest':
      if (user.stage < 3) return api.sendMessage('🌱 Your plant isn’t ready to harvest yet.', threadID, messageID);
      user.stage = 0;
      return api.sendMessage('🎉 You harvested your plant! The garden is empty now.', threadID, messageID);

    case 'reset':
      user.stage = 0;
      return api.sendMessage('🔄 Your garden has been reset.', threadID, messageID);

    default:
      const status = ['🌾 Nothing planted', '🌱 Seed planted', '💧 Growing', '🌻 Ready to harvest'][user.stage];
      return api.sendMessage(`🌼 Garden Status: ${status}\n\nCommands:\n- garden plant\n- garden water\n- garden harvest\n- garden reset\n- garden gag on/off`, threadID, messageID);
  }
};
