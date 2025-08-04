const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'music',
  version: '1.0.2',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['music', 'ytaudio'],
  description: "Search and download YouTube music by title",
  usages: "ytmusic [song title]",
  credits: 'LorexAi',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const userQuery = args.join(" ").trim();

  if (!userQuery) {
    return api.sendMessage("🎧𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝘆𝗽𝗲 𝘁𝗵𝗲 𝗻𝗮𝗺𝗲 𝗼𝗳 𝘁𝗵𝗲 𝗺𝘂𝘀𝗶𝗰", threadID, messageID);
  }

  const searchQuery = userQuery + " audio";

  try {
    api.sendMessage(`🔍 Searching for ${userQuery}...`, threadID, async (err, info) => {
      if (err) return;

      const res = await axios.get(`https://daikyu-api.up.railway.app/api/ytsearch?query=${encodeURIComponent(searchQuery)}`);
      const results = res.data.data;

      if (!Array.isArray(results) || results.length === 0) {
        return api.sendMessage("❌ No results found.", threadID, () => api.unsendMessage(info.messageID));
      }

      const selected = results[0];
      const downloadAPI = `https://daikyu-api.up.railway.app/api/ytmp3?Url=${encodeURIComponent(selected.url)}`;

      const mp3 = await axios.get(downloadAPI);
      if (!mp3.data.download) {
        return api.sendMessage("❌ Failed to fetch download link.", threadID, () => api.unsendMessage(info.messageID));
      }

      const filePath = path.join(__dirname, 'cache', `${Date.now()}_ytmusic.mp3`);
      fs.ensureDirSync(path.dirname(filePath));

      const audio = await axios.get(mp3.data.download, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, Buffer.from(audio.data, 'binary'));

      api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        fs.unlinkSync(filePath);
        api.unsendMessage(info.messageID);
      });
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error downloading audio.", threadID, messageID);
  }
};
