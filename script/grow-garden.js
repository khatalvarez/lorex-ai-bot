const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'garden',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: "Manage your virtual garden",
  usage: "garden [show|water|stock|help]",
  credits: "ZEROME NAVAL",
};

const gardenImageUrl = 'https://i.imgur.com/f2gH5ky.jpg'; // Sample garden image URL

module.exports.run = async function({ api, event, args, prefix }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const subcommand = args[0]?.toLowerCase() || 'help';

  // Path to temporarily save the image
  const imgPath = path.join(__dirname, 'cache', `garden_${threadID}.jpg`);

  try {
    // Download the garden image once
    const imgRes = await axios.get(gardenImageUrl, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(imgPath);
      imgRes.data.pipe(stream);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    if (subcommand === 'show') {
      // Random values for demonstration
      const moisture = Math.floor(Math.random() * 100);
      const growth = Math.floor(Math.random() * 100);

      const message = `🌿 Your Garden Status 🌿\n\n` +
        `💧 Soil Moisture: ${moisture}%\n` +
        `🌱 Plant Growth: ${growth}%\n\n` +
        `Keep watering and taking care of it!`;

      api.sendMessage(
        { body: message, attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );

    } else if (subcommand === 'water') {
      const message = `💦 You watered your garden! Plants look happier now. Keep it up!`;
      api.sendMessage(
        { body: message, attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );

    } else if (subcommand === 'stock') {
      const fruits = [
        '🍎 Apples: 10',
        '🍊 Oranges: 5',
        '🍌 Bananas: 7',
        '🍇 Grapes: 15',
        '🍉 Watermelons: 3',
      ];

      const message = `🍒 Your Garden Harvest Stock 🍒\n\n${fruits.join('\n')}`;
      api.sendMessage(
        { body: message, attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );

    } else if (subcommand === 'help') {
      const message = `🌻 Garden Command Help 🌻\n\n` +
        `Use these commands to manage your garden:\n` +
        `• ${prefix}garden show - Show garden status\n` +
        `• ${prefix}garden water - Water your garden\n` +
        `• ${prefix}garden stock - Show your garden's harvest stock\n` +
        `• ${prefix}garden help - Show this help message`;

      api.sendMessage(
        { body: message, attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );

    } else {
      fs.unlinkSync(imgPath);
      api.sendMessage(
        `❌ Unknown subcommand: "${subcommand}".\nTry "${prefix}garden help" for available commands.`,
        threadID,
        messageID
      );
    }
  } catch (error) {
    // Make sure to delete image if it exists in case of error
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

    console.error('Error in garden command:', error);
    api.sendMessage(
      '❌ An error occurred while running the garden command. Please try again later.',
      threadID,
      messageID
    );
  }
};
