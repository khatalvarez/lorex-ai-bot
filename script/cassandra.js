const axios = require('axios');

module.exports.config = {
  name: 'cassandra',
  version: '2.1.0',
  role: 0,
  hasPrefix: false,
  aliases: ['ai', 'cass', 'agent'],
  description: '🤖 Cassandra Agent AI - Anime-style intelligent assistant',
  usage: 'cassandra [say | status | joke | remember | recall | help]',
  credits: 'ChatGPT'
};

// In-memory memory (per user)
const memoryBank = {};

// AI Agent image (futuristic anime look)
const imageURL = 'https://i.ibb.co/2NDbZtw/ai-agent-girl.jpg';

async function getImageBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data, 'utf-8');
  } catch {
    return null;
  }
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const [command = '', ...rest] = args;
  const value = rest.join(' ');
  const imageBuffer = await getImageBuffer(imageURL);

  if (!command) {
    return api.sendMessage({
      body: `👁️ [Cassandra AI Active]\n\nTry:\n- cassandra say hello\n- cassandra joke\n- cassandra remember I like ramen\n- cassandra recall\n- cassandra status`,
      attachment: imageBuffer
    }, threadID, messageID);
  }

  switch (command.toLowerCase()) {
    case 'say':
      if (!value) return api.sendMessage(`[Cassandra] What shall I say?`, threadID, messageID);
      return api.sendMessage(`🗣️ [Cassandra] "${value}"`, threadID, messageID);

    case 'status':
      return api.sendMessage({
        body:
          `🔎 [System Report – Cassandra Agent AI]\n\n🧠 Memory Users: ${Object.keys(memoryBank).length}\n⚙️ Uptime: ${process.uptime().toFixed(1)} seconds\n🌐 Status: Operational\n🔋 Emotion Mode: Neutral`,
        attachment: imageBuffer
      }, threadID, messageID);

    case 'joke':
      return api.sendMessage({
        body:
          `😂 [Cassandra AI Humor Core]\n\nWhy did the robot go on a diet?\nBecause it had too many bytes.`,
        attachment: imageBuffer
      }, threadID, messageID);

    case 'remember':
      if (!value) return api.sendMessage(`💾 [Cassandra] What exactly do you want me to remember?`, threadID, messageID);
      memoryBank[senderID] = value;
      return api.sendMessage(`🧠 [Cassandra] Memory recorded:\n"${value}"`, threadID, messageID);

    case 'recall':
      const memory = memoryBank[senderID];
      return api.sendMessage({
        body: memory
          ? `📂 [Cassandra] Recalling your memory:\n"${memory}"`
          : `📂 [Cassandra] I don't have anything stored for you yet.`,
        attachment: imageBuffer
      }, threadID, messageID);

    case 'help':
      return api.sendMessage({
        body:
          `📘 [Cassandra Agent AI Help Panel]\n\nAvailable commands:\n` +
          `- cassandra say [text] → I’ll speak it\n` +
          `- cassandra joke → A light-hearted AI pun\n` +
          `- cassandra remember [text] → I’ll store a memory\n` +
          `- cassandra recall → I’ll recall your memory\n` +
          `- cassandra status → Diagnostic system report\n` +
          `- cassandra help → Show this guide`,
        attachment: imageBuffer
      }, threadID, messageID);

    default:
      return api.sendMessage({
        body: `❓ [Cassandra] Unknown command: "${command}". Type "cassandra help" for guidance.`,
        attachment: imageBuffer
      }, threadID, messageID);
  }
};
