// Temporary in-memory storage
const userGardens = {};

const cropData = {
  carrot: { growTime: 2, yield: 3 },
  tomato: { growTime: 3, yield: 5 },
  potato: { growTime: 2, yield: 4 }
};

module.exports.config = {
  name: 'cassgarden',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['farm'],
  description: 'Grow a simple garden (no database)',
  usages: 'garden [action]',
  credits: 'ChatGPT',
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const userID = event.senderID;
  const action = args[0]?.toLowerCase();

  // Create garden if not exist
  if (!userGardens[userID]) {
    userGardens[userID] = {
      garden: [],
      inventory: {},
      watered: false
    };
  }

  const data = userGardens[userID];

  switch (action) {
    case 'plant': {
      const seed = args[1]?.toLowerCase();
      if (!cropData[seed]) {
        return api.sendMessage(`🌾 Unknown crop.\nAvailable: ${Object.keys(cropData).join(', ')}`, event.threadID);
      }

      data.garden.push({
        type: seed,
        stage: 0,
        watered: false
      });

      return api.sendMessage(`🪴 You planted ${seed}! Don’t forget to water it.`, event.threadID);
    }

    case 'water': {
      if (data.garden.length === 0) return api.sendMessage("🚫 Nothing to water.", event.threadID);

      data.garden.forEach(crop => {
        if (!crop.watered) crop.watered = true;
      });

      return api.sendMessage("💧 You watered your garden!", event.threadID);
    }

    case 'grow': {
      if (data.garden.length === 0) return api.sendMessage("🌱 Nothing is growing yet.", event.threadID);

      let grown = 0;
      data.garden.forEach(crop => {
        if (crop.watered && crop.stage < cropData[crop.type].growTime) {
          crop.stage++;
          crop.watered = false;
          grown++;
        }
      });

      return api.sendMessage(`🌞 ${grown} crops have grown a stage!`, event.threadID);
    }

    case 'harvest': {
      let harvested = 0;

      data.garden = data.garden.filter(crop => {
        if (crop.stage >= cropData[crop.type].growTime) {
          const yieldAmount = cropData[crop.type].yield;
          data.inventory[crop.type] = (data.inventory[crop.type] || 0) + yieldAmount;
          harvested++;
          return false; // remove
        }
        return true;
      });

      return api.sendMessage(`🌾 Harvested ${harvested} crop(s)!`, event.threadID);
    }

    case 'collect': {
      const inv = Object.entries(data.inventory).map(([item, count]) => `📦 ${item}: ${count}`).join('\n') || "Empty inventory.";
      return api.sendMessage(`🎒 Inventory:\n${inv}`, event.threadID);
    }

    case 'show': {
      if (data.garden.length === 0) return api.sendMessage("🌱 Your garden is empty.", event.threadID);

      const view = data.garden.map((crop, i) =>
        `#${i + 1}: ${crop.type} | Stage: ${crop.stage}/${cropData[crop.type].growTime} | ${crop.watered ? '💧 Watered' : '🌵 Dry'}`
      ).join('\n');

      return api.sendMessage(`🌻 Your garden:\n${view}`, event.threadID);
    }

    case 'clear': {
      data.garden = [];
      return api.sendMessage("🧹 Your garden has been cleared.", event.threadID);
    }

    default:
      return api.sendMessage(
        `🌿 Garden Commands:\n` +
        `• garden plant [carrot/tomato/potato]\n` +
        `• garden water\n` +
        `• garden grow\n` +
        `• garden harvest\n` +
        `• garden collect\n` +
        `• garden show\n` +
        `• garden clear`, event.threadID);
  }
};
