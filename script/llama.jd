const axios = require('axios');

module.exports.config = {
  name: "llama",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Chat with Llama 70B AI!",
  usages: "llama [message]",
  credits: "Grok",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const query = args.join(" ");
  if (!query) {
    return api.sendMessage("Hello! I am Llama 70B, an advanced AI model developed by Meta and Messandra AI Companion how can I help you today?.\n\nUsage: llama [your question]", event.threadID, event.messageID);
  }

  try {
    const { data } = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/Llama70b?ask=${encodeURIComponent(query)}`);
    const reply = data.response || " No response from Llama 70B.";
    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error fetching response from Llama 70B.", event.threadID, event.messageID);
  }
};
