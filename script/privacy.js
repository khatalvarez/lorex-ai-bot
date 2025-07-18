const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Jimp = require('jimp');

module.exports.config = {
  name: 'privacy',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['privacypolicy', 'pp'],
  description: "Shows AI Privacy Policy",
  usage: "privacy",
  credits: "Developer",
};

module.exports.run = async function({ api, event }) {
  try {
    // Privacy policy text
    const privacyText = `
🤖 AI Privacy Policy

1. We do not store any personal messages.
2. User data is only used temporarily for command processing.
3. No data is shared with third parties.
4. Your privacy and security are our top priorities.
5. By using this AI, you agree to these terms.
`;

    // Image URL (privacy-themed)
    const imageUrl = 'https://i.imgur.com/8fK4h6b.png'; // Example privacy icon image

    // Download image to temp path
    const imagePath = path.join(__dirname, 'cache', `privacy_${event.senderID}.png`);

    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(imagePath, Buffer.from(response.data, 'utf-8'));

    // Send privacy text + image
    api.sendMessage(
      {
        body: privacyText,
        attachment: fs.createReadStream(imagePath)
      },
      event.threadID,
      () => fs.unlinkSync(imagePath),
      event.messageID
    );

  } catch (err) {
    console.error(err);
    api.sendMessage('Error fetching privacy policy.', event.threadID, event.messageID);
  }
};
