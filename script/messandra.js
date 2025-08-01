const axios = require('axios');

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

  if (!input) {
    return api.sendMessage(
      "🌟 Greetings! I am 𝗠𝗲𝘀𝘀𝗮𝗻𝗱𝗿𝗮 ,  your gateway to GPT-4 intelligence. I am here to assist you",
      event.threadID,
      event.messageID
    );
  }

  const isPhoto = event.type === "message_reply" && event.messageReply.attachments[0]?.type === "photo";
  if (isPhoto) {
    const photoUrl = event.messageReply.attachments[0].url;

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
        return api.sendMessage("Unexpected response format from the photo analysis API.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error("Error processing photo analysis request:", error.message || error);
      api.sendMessage("An error occurred while processing the photo. Please try again.", event.threadID, event.messageID);
    }

    return;
  }

  api.sendMessage("🔄 Searching...", event.threadID, event.messageID);

  try {
    const { data } = await axios.get('https://daikyu-api.up.railway.app/api/gpt-4o', {
      params: {
        query: input,
        uid: event.senderID
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
      return api.sendMessage("Unexpected response format from the API.", event.threadID, event.messageID);
    }

  } catch (error) {
    console.error("Error processing request:", error.message || error);
    api.sendMessage("An error occurred while processing your request. Please try again.", event.threadID, event.messageID);
  }
};
