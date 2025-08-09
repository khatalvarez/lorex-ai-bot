const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'help',
  version: '1.0.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['menu', 'commands'],
  description: "Show help menu",
  usages: "help",
  credits: 'AI + User',
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // Get user name from api
  try {
    const userInfo = await api.getUserInfo(senderID);
    const userName = userInfo[senderID]?.name || "User";

    const imageUrl = 'https://i.ibb.co/CtT4Rc9/photo-6309477421237622563-y.jpg';

    const cacheDir = path.join(__dirname, 'cache');
    const fileName = 'helpMenu.jpg';
    const filePath = path.join(cacheDir, fileName);

    fs.ensureDirSync(cacheDir);

    // Download image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));

    // Send message with user's name and image
    const message = {
      body: `🧾 Help menu for: ${userName}`,
      attachment: fs.createReadStream(filePath)
    };

    api.sendMessage(message, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (err) {
    console.error("❌ Help Command Error:", err);
    api.sendMessage("❌ Couldn't load help menu image.", threadID, messageID);
  }
};
