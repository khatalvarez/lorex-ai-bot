const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports.config = {
  name: 'messandra',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['gpt', 'openai'],
  description: "An AI command powered by GPT-4o & Gemini Vision",
  usages: "ai [prompt]",
  credits: 'LorexAi',
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const input = args.join(' ');
  const defaultImageUrl = 'https://i.ibb.co/6DGYHcc/messandra.jpg';
  const tempPath = path.join(__dirname, 'cache', 'messandra.jpg');

  // Kung walang input, magpapadala ng greeting + image
  if (!input) {
    // I-download muna ang image
    const file = fs.createWriteStream(tempPath);
    https.get(defaultImageUrl, function (response) {
      response.pipe(file);
      file.on('finish', () => {
        file.close(async () => {
          return api.sendMessage({
            body: "🌟 Greetings! I am 𝗠𝗲𝘀𝘀𝗮𝗻𝗱𝗿𝗮, your gateway to GPT-4 intelligence. I am here to assist you.",
            attachment: fs.createReadStream(tempPath)
          }, event.threadID, () => {
            fs.unlinkSync(tempPath); // linisin ang file pagkatapos isend
          }, event.messageID);
        });
      });
    });
    return;
  }

  const isPhotoReply = event.type === "message_reply" && event.messageReply.attachments[0]?.type === "photo";
  const photoUrl = isPhotoReply ? event.messageReply.attachments[0].url : defaultImageUrl;

  api.sendMessage("🔄 Analyzing Image...", event.threadID, event.messageID);

  try {
    const { data } = await axios.get('https://daikyu-api.up.railway.app/api/gemini-flash-vision', {
      params: {
        prompt: input,
        imageUrl: photoUrl
      }
    });

    if (data && data.response) {
      const responseMessage = `${data.response}`;
      return api.sendMessage(responseMessage, event.threadID, (err) => {
        if (err) {
          console.error("Error sending message:", err);
        }
      }, event.messageID);
    } else {
      return api.sendMessage("❌ Unexpected response format from the photo analysis API.", event.threadID, event.messageID);
    }
  } catch (error) {
    console.error("❌ Error processing photo analysis request:", error.message || error);
    api.sendMessage("❌ An error occurred while processing the photo. Please try again.", event.threadID, event.messageID);
  }
};
