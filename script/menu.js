const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'cmdlist',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['commands', 'menu'],
  description: 'Display command list and info',
  usages: 'help',
  credits: 'OpenAI + You',
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  // Replace with actual image URL from i.ibb.co
  const imageUrl = 'https://i.ibb.co/YQXqXPH/help-menu.jpg'; // Converted version of: https://ibb.co/svK2dgZj

  const filePath = path.join(__dirname, 'cache', 'help_image.jpg');
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));

    const helpText = `📘 𝗕𝗼𝘁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗠𝗲𝗻𝘂

💰 Economy:
- daily → claim ₱9000 daily bonus
- balance → view wallet, bank, and debt
- bank [deposit|withdraw] → move money
- loan [amount] → borrow money (unlimited)
- repay [amount] → (optional: repay debt)
- tictactoe → play to win ₱500

📦 Others:
- help → show this menu
- ping → check if bot is online

🧠 Tip: Use commands without prefix.

📸 See image for visual guide.`;

    return api.sendMessage({
      body: helpText,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to load help image.", threadID, messageID);
  }
};
