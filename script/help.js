const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

module.exports.config = {
  name: 'casshelp',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['tulong'],
  description: "Beginner's guide",
  usage: "Help [page] or [command]",
  credits: 'Developer',
};

module.exports.run = async function({ api, event, enableCommands, args, Utils, prefix }) {
  const input = args.join(' ');
  try {
    const eventCommands = enableCommands[1].handleEvent;
    const commands = enableCommands[0].commands;

    if (!input) {
      const pages = 20, page = 1;
      const start = (page - 1) * pages, end = start + pages;

      // Build help list
      let helpMessage = `Command List:\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `\t${i + 1}. 「 ${prefix}${commands[i]} 」\n`;
      }
      helpMessage += `\nEvent List:\n\n`;
      eventCommands.forEach((evt, idx) => {
        helpMessage += `\t${idx + 1}. 「 ${prefix}${evt} 」\n`;
      });
      helpMessage += `\nPage ${page}/${Math.ceil(commands.length / pages)}. Use '${prefix}help <page>' or '${prefix}help <command>'.`;

      // User info
      const userInfo = await api.getUserInfo(event.senderID);
      const name = userInfo[event.senderID]?.name || "Unknown";
      const uid = event.senderID;
      helpMessage = `👤 User Info:\n➛ Name: ${name}\n➛ UID: ${uid}\n\n` + helpMessage;

      // Fetch weather
      const weatherApiKey = 'YOUR_OPENWEATHERMAP_KEY';
      let weatherSummary = '';
      try {
        const wRes = await axios.get(
          'https://api.openweathermap.org/data/2.5/weather', {
            params: { q: 'Manila,PH', units: 'metric', appid: weatherApiKey }
          }
        );
        const w = wRes.data;
        weatherSummary = `🌤️ Weather in ${w.name}: ${w.weather[0].description}, ${w.main.temp}°C (feels like ${w.main.feels_like}°C)`;
      } catch (e) {
        console.error('Weather error:', e);
        weatherSummary = '🌤️ Weather info unavailable.';
      }
      helpMessage += `\n\n${weatherSummary}`;

      // Fetch current time in PH
      const now = new Date();
      const manilaTime = now.toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: false });
      helpMessage += `\n🕒 Current Philippine time: ${manilaTime}`;

      // Compose image
      const imgPath = path.join(__dirname, 'cache', `${uid}_help.jpg`);
      try {
        const profilePic = await Jimp.read(`https://graph.facebook.com/${uid}/picture?width=512&height=512`);
        const cloudBg = await Jimp.read('https://i.imgur.com/BKYdBlb.jpg');

        profilePic.resize(200, 200);
        cloudBg.resize(512, 512).composite(profilePic, 156, 150);

        const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
        cloudBg.print(font, 10, 10, `Name: ${name}`);
        cloudBg.print(font, 10, 30, `UID: ${uid}`);

        await cloudBg.writeAsync(imgPath);

        api.sendMessage({
          body: helpMessage,
          attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

      } catch (err) {
        console.error('Image creation failed:', err);
        api.sendMessage(helpMessage, event.threadID, event.messageID);
      }

    } else if (!isNaN(input)) {
      // Paged view
      const pageNum = parseInt(input);
      const pages = 20;
      const start = (pageNum - 1) * pages, end = start + pages;
      let message = `Command List:\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        message += `\t${i + 1}. 「 ${prefix}${commands[i]} 」\n`;
      }
      message += `\nEvent List:\n\n`;
      eventCommands.forEach((evt, idx) => {
        message += `\t${idx + 1}. 「 ${prefix}${evt} 」\n`;
      });
      message += `\nPage ${pageNum} of ${Math.ceil(commands.length / pages)}`;
      api.sendMessage(message, event.threadID, event.messageID);

    } else {
      // Show detailed command info
      const cmd = [...Utils.handleEvent, ...Utils.commands]
        .find(([key]) => key.includes(input?.toLowerCase()))?.[1];
      if (cmd) {
        const {
          name, version, role,
          aliases = [], description,
          usage, credits, cooldown
        } = cmd;
        const roleMsg = role === 0 ? '➛ Permission: user'
                      : role === 1 ? '➛ Permission: admin'
                      : role === 2 ? '➛ Permission: thread Admin'
                      : role === 3 ? '➛ Permission: super Admin' : '';
        const aliasMsg = aliases.length ? `➛ Aliases: ${aliases.join(', ')}\n` : '';
        const msg = ` 「 Command 」\n\n➛ Name: ${name}\n` +
                    `${version ? `➛ Version: ${version}\n` : ''}` +
                    `${roleMsg}\n` +
                    `${aliasMsg}` +
                    `${description ? `Description: ${description}\n` : ''}` +
                    `${usage ? `➛ Usage: ${usage}\n` : ''}` +
                    `${credits ? `➛ Credits: ${credits}\n` : ''}` +
                    `${cooldown ? `➛ Cooldown: ${cooldown}s\n` : ''}`;
        api.sendMessage(msg, event.threadID, event.messageID);
      } else {
        api.sendMessage('Command not found.', event.threadID, event.messageID);
      }
    }

  } catch (error) {
    console.error(error);
  }
};

module.exports.handleEvent = async function({ api, event, prefix }) {
  if (event.body?.toLowerCase().startsWith('prefix')) {
    api.sendMessage(`This is my prefix: ${prefix}`, event.threadID, event.messageID);
  }
};
