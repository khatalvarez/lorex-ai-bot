module.exports.config = {
  name: 'teaminfo',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Show developer and moderator information',
  usages: 'teaminfo',
  credits: 'GTP Casino ⚙️',
  cooldowns: 0,
  dependencies: {}
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  const message = `
👑 𝗚𝗧𝗣 𝗖𝗔𝗦𝗜𝗡𝗢 𝗧𝗘𝗔𝗠 👑

🧑‍💻 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿:
🔗 https://www.facebook.com/ZeromeNaval.61577040643519

👮 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿:
🔗 https://www.facebook.com/chat.gpt.user

📢 Thank you for supporting GTP Casino!
  `;

  return api.sendMessage(message, threadID, messageID);
};
