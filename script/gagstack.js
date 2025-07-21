const fs = require('fs');
const path = require('path');

let autoSendInterval = null;
let targetThreadID = null;

module.exports.config = {
  name: "gagstock",
  version: "1.2.0",
  description: "Tracker auto send with package seed, gear, seed, eage commands",
  commandCategory: "group",
  usages: "[tracker auto send on|tracker auto send off|package seed <type>|gear|seed|eage]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args.length === 0) return api.sendMessage("❗ Please provide a sub-command.", threadID, messageID);

  const subCommand = args[0].toLowerCase();

  // Tracker auto send on/off
  if (subCommand === "tracker") {
    if (args[1] === "auto" && args[2] === "send") {
      const action = args[3]?.toLowerCase();

      if (action === "on") {
        if (autoSendInterval) return api.sendMessage("⚠️ Auto send is already ON.", threadID);

        targetThreadID = threadID;
        autoSendInterval = setInterval(() => {
          api.sendMessage("📡 Gagstock Tracker Auto Send Message! Stay updated every 10 minutes! ⏰", targetThreadID);
        }, 600000); // 10 minutes in ms

        return api.sendMessage("✅ Tracker Auto send turned ON! Messages will be sent every 10 minutes.", threadID);
      }
      else if (action === "off") {
        if (!autoSendInterval) return api.sendMessage("⚠️ Auto send is already OFF.", threadID);

        clearInterval(autoSendInterval);
        autoSendInterval = null;
        targetThreadID = null;

        return api.sendMessage("🛑 Tracker Auto send turned OFF!", threadID);
      }
      else {
        return api.sendMessage("❗ Usage: gagstock tracker auto send [on|off]", threadID);
      }
    }
    else {
      return api.sendMessage("❗ Usage: gagstock tracker auto send [on|off]", threadID);
    }
  }

  // Package seed commands
  if (subCommand === "package") {
    if (args[1] === "seed") {
      const seedType = args[2] ? args[2].toLowerCase() : null;

      switch(seedType) {
        case "600":
          return api.sendMessage("🌾 Package seed: 600! Perfect for a big harvest! 🌻", threadID);
        case "fruits":
          return api.sendMessage("🍎🍌 Package seed: Fruits! Grow your orchard! 🌳", threadID);
        case "water":
          return api.sendMessage("💧💦 Package seed: Water! Essential for growth! 🌿", threadID);
        case "rain":
          return api.sendMessage("🌧️☔ Package seed: Rain! Natural watering! 🌱", threadID);
        default:
          return api.sendMessage("❗ Usage: gagstock package seed [600|fruits|water|rain]", threadID);
      }
    } else {
      return api.sendMessage("❗ Usage: gagstock package seed [600|fruits|water|rain]", threadID);
    }
  }

  // GEAR command
  if (subCommand === "gear") {
    return api.sendMessage("⚙️ GEAR status: All systems operational! 🔧", threadID);
  }

  // SEED command
  if (subCommand === "seed") {
    return api.sendMessage("🌱 SEED status: Seeds are planted and growing well! 🌾", threadID);
  }

  // EAGE command
  if (subCommand === "eage") {
    return api.sendMessage("🦅 EAGE status: Eagles are soaring high! 🦉", threadID);
  }

  return api.sendMessage("❓ Unknown command.", threadID);
};
