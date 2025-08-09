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

const responseOpeners = ["𝗔𝗿𝗶𝗮 𝗔𝗜"];

module.exports.config = {
  name: 'messandra2',
  version: '1.1.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aria', 'ariaai'],
  description: "Aria AI via Kaiz API",
  usages: "ai2 [prompt]",
  credits: 'LorexAi',
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ');
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) return api.sendMessage("🌟Greetings! I am 𝗠𝗲𝘀𝘀𝗮𝗻𝗱𝗿𝗮 , your gateway to GPT-4 intelligence. I am here to assist you.", threadID, messageID);

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🔄Searching....", threadID, (err, info) => resolve(info));
  });

  try {
    const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/aria', {
      params: {
        ask: prompt,
        uid,
        apikey: 'acb7e0e8-bbc3-4697-bf64-1f3c6231dee7'
      }
    });

    const raw = data?.response;
    if (!raw) {
      return api.editMessage("⚠️ No response received from Aria API.", loadingMsg.messageID, threadID);
    }

    const formatted = raw
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
    return api.editMessage(`${opener}\n\n${formatted}`, loadingMsg.messageID, threadID);

  } catch (error) {
    console.error(error);
    return api.editMessage("❌ Error while contacting Aria API.", loadingMsg.messageID, threadID);
  }
};
