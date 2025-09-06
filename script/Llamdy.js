const axios = require('axios');

function convertToBold(text) {
  const boldMap = {
    'a': '𝗮','b': '𝗯','c': '𝗰','d': '𝗱','e': '𝗲','f': '𝗳','g': '𝗴','h': '𝗵','i': '𝗶','j': '𝗷',
    'k': '𝗸','l': '𝗹','m': '𝗺','n': '𝗻','o': '𝗼','p': '𝗽','q': '𝗾','r': '𝗿','s': '𝘀','t': '𝘁',
    'u': '𝘂','v': '𝘃','w': '𝘄','x': '𝘅','y': '𝘆','z': '𝘇',
    'A': '𝗔','B': '𝗕','C': '𝗖','D': '𝗗','E': '𝗘','F': '𝗙','G': '𝗚','H': '𝗛','I': '𝗜','J': '𝗝',
    'K': '𝗞','L': '𝗟','M': '𝗠','N': '𝗡','O': '𝗢','P': '𝗣','Q': '𝗤','R': '𝗥','S': '𝗦','T': '𝗧',
    'U': '𝗨','V': '𝗩','W': '𝗪','X': '𝗫','Y': '𝗬','Z': '𝗭',
  };
  return text.split('').map(char => boldMap[char] || char).join('');
}

module.exports.config = {
  name: 'metaai',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['meta', 'llama'],
  description: "Meta AI via arychauhann API",
  usages: "metaai [prompt]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ');
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage(
      "🌟 Greetings! I am Meta AI assistant. Please provide a prompt.",
      threadID,
      messageID
    );
  }

  const fullPrompt = prompt;

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🔄 Processing your request...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://arychauhann.onrender.com/api/metaai?ask=${encodeURIComponent(fullPrompt)}&uid=${uid}`;
    const { data } = await axios.get(url);

    const raw = data?.response;
    if (!raw || raw.trim() === '') {
      return api.editMessage("⚠️ Walang sagot na natanggap mula sa Meta AI.", loadingMsg.messageID, threadID);
    }

    const formatted = raw
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    await api.unsendMessage(loadingMsg.messageID);

    const replyMessage = `🤖 Meta AI Response:\n\n${formatted}`;
    await api.sendMessage(replyMessage, threadID);

  } catch (error) {
    console.error("❌ Meta AI API Error:", error.message);
    return api.editMessage("❌ Error habang kinokonekta ang Meta AI API.", loadingMsg.messageID, threadID);
  }
};
