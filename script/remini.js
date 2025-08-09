const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'remini',
  version: '1.0.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['enhance', 'rem'],
  description: "Enhance a photo using AI by replying to an image",
  usages: "remini (reply to an image)",
  credits: 'LorexAi',
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, messageReply } = event;

  const isPhotoReply = messageReply &&
    Array.isArray(messageReply.attachments) &&
    messageReply.attachments[0]?.type === 'photo';

  if (!isPhotoReply) {
    return api.sendMessage("❌ Please reply to an image to enhance it.", threadID, messageID);
  }

  const imageUrl = messageReply.attachments[0].url;

  try {
    const time = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${time}_remini.png`;
    const cacheDir = path.join(__dirname, 'cache');
    const filePath = path.join(cacheDir, fileName);

    fs.ensureDirSync(cacheDir);

    api.sendMessage("🛠️ Enhancing Image...", threadID, async (err, info) => {
      if (err) return;

      try {
        const response = await axios.get(`https://daikyu-api.up.railway.app/api/remini?imageUrl=${encodeURIComponent(imageUrl)}`, {
          responseType: "arraybuffer"
        });

        fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));

        api.sendMessage({
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          fs.unlinkSync(filePath);
          api.unsendMessage(info.messageID); 
        });

      } catch (error) {
        console.error(error);
        api.sendMessage("❌ Failed to enhance image. Try again later.", threadID, messageID);
        api.unsendMessage(info.messageID); // Unsend loading msg if failed
      }
    });

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Unexpected error occurred.", threadID, messageID);
  }
};
