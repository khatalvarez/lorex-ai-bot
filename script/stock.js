const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// In-memory state; can be saved to file if needed
const gagstockStatus = {};

module.exports.config = {
  name: 'gag',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: 'Toggle gagstock mode with a fun image!',
  usage: 'gagstock on/off',
  credits: 'YourName',
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const action = args[0]?.toLowerCase();

  if (!action || !['on', 'off'].includes(action)) {
    return api.sendMessage('❗Usage: gagstock on | gagstock off', threadID, messageID);
  }

  // Toggle
  const isOn = action === 'on';
  gagstockStatus[threadID] = isOn;
  const textStatus = isOn
    ? '✅ Gagstock mode **ON**! Enjoy your fruit sticks & gagstock water!'
    : '❌ Gagstock mode **OFF**. No more snacks for now.';

  // Compose the image
  const imgPath = path.join(__dirname, 'cache', `gagstock_${threadID}.jpg`);
  try {
    const profile = await Jimp.read(`https://graph.facebook.com/${senderID}/picture?width=512&height=512`);
    const bg = await Jimp.read('https://i.imgur.com/cloud-night-bg.jpg'); // replace with your cloud-night bg
    const fruits = await Jimp.read('https://i.imgur.com/fruits-stick.png'); // fruit sticks overlay PNG
    const water = await Jimp.read('https://i.imgur.com/water-icon.png'); // gagstock water icon

    // Resize & overlay
    profile.resize(150, 150);
    bg.resize(512, 512);
    fruits.resize(512, 200);
    water.resize(150, 150);

    // Composite in layers
    bg.composite(profile, 181, 100);            // profile center
    bg.composite(fruits, 0, 312);               // bottom fruit sticks
    bg.composite(water, 181, 260);              // gagstock water near profile

    // Add some text
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const label = isOn ? 'Gagstock Mode 🔥' : 'Gagstock Mode Off';
    bg.print(font, 10, 10, label);

    await bg.writeAsync(imgPath);

    // Send message + image
    api.sendMessage(
      { body: textStatus, attachment: fs.createReadStream(imgPath) },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );
  } catch (err) {
    console.error('Image composite error:', err);
    api.sendMessage(textStatus, threadID, messageID);
  }
};

// Optional helper for other modules:
module.exports.isGagstockOn = threadID => gagstockStatus[threadID] === true;
