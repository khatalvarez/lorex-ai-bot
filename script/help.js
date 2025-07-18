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

module.exports.run = async function({
  api,
  event,
  enableCommands,
  args,
  Utils,
  prefix
}) {
  const input = args.join(' ');
  try {
    const eventCommands = enableCommands[1].handleEvent;
    const commands = enableCommands[0].commands;

    if (!input) {
      const pages = 20;
      const page = 1;
      const start = (page - 1) * pages;
      const end = start + pages;

      // User info
      const userInfo = await api.getUserInfo(event.senderID);
      const name = userInfo[event.senderID]?.name || "Unknown";
      const uid = event.senderID;

      // Build help message
      let helpMessage = `👤 User Info:\n➛ Name: ${name}\n➛ UID: ${uid}\n\nCommand List:\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `\t${i + 1}. 「 ${prefix}${commands[i]} 」\n`;
      }
      helpMessage += '\nEvent List:\n\n';
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `\t${index + 1}. 「 ${prefix}${eventCommand} 」\n`;
      });
      helpMessage += `\nPage ${page}/${Math.ceil(commands.length / pages)}.\nTo view the next page: '${prefix}help <page>'.\nTo view command info: '${prefix}help <command>'`;

      // Fetch weather in Cavite
      const weatherApiKey = 'YOUR_OPENWEATHERMAP_KEY';
      let weatherSummary = '';
      let weatherColor = '🟢';
      try {
        const wRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
          params: {
            q: 'Cavite,PH',
            units: 'metric',
            appid: weatherApiKey
          }
        });
        const w = wRes.data;
        const desc = w.weather[0].description;
        const temp = w.main.temp;

        // Determine bagyo level
        const wind = w.wind.speed;
        if (wind >= 30) {
          weatherColor = '🟣'; // Typhoon
        } else if (wind >= 15) {
          weatherColor = '🔴'; // Malakas
        } else {
          weatherColor = '🔵'; // Mahina
        }

        weatherSummary = `${weatherColor} Weather in Cavite: ${desc}, ${temp}°C\nWind Speed: ${wind} m/s`;
      } catch (e) {
        console.error('Weather fetch error:', e);
        weatherSummary = '🌤️ Weather info unavailable.';
      }

      // Get current Philippine time
      const now = new Date();
      const phTime = now.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        hour12: false
      });
      helpMessage += `\n\n${weatherSummary}`;
      helpMessage += `\n🕒 Current PH Time: ${phTime}`;
      helpMessage += `\n\n📍 Legend:\n🔴 Malakas na Bagyo\n🔵 Mahinang Bagyo\n🟣 Typhoon`;

      // Generate image with profile + cloud night + design
      const imgPath = path.join(__dirname, 'cache', `${uid}_night_help.jpg`);
      try {
        const profilePic = await Jimp.read(`https://graph.facebook.com/${uid}/picture?width=512&height=512`);
        const nightBg = await Jimp.read('https://i.imgur.com/sCbl1gB.jpg'); // Night cloud background
        profilePic.resize(180, 180);
        nightBg.resize(512, 512).composite(profilePic, 165, 160);

        const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
        nightBg.print(font, 20, 20, `Name: ${name}`);
        nightBg.print(font, 20, 40, `UID: ${uid}`);
        nightBg.print(font, 20, 70, `PH Time: ${phTime}`);

        await nightBg.writeAsync(imgPath);

        api.sendMessage({
          body: helpMessage,
          attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

      } catch (err) {
        console.error('Image creation failed:', err);
        api.sendMessage(helpMessage, event.threadID, event.messageID);
      }

    } else if (!isNaN(input)) {
      const page = parseInt(input);
      const pages = 20;
      const start = (page - 1) * pages;
      const end = start + pages;
      let helpMessage = `Command List:\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `\t${i + 1}. 「 ${prefix}${commands[i]} 」\n`;
      }
      helpMessage += '\nEvent List:\n\n';
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `\t${index + 1}. 「 ${prefix}${eventCommand} 」\n`;
      });
      helpMessage += `\nPage ${page} of ${Math.ceil(commands.length / pages)}`;
      api.sendMessage(helpMessage, event.threadID, event.messageID);

    } else {
      const command = [...Utils.handleEvent, ...Utils.commands]
        .find(([key]) => key.includes(input?.toLowerCase()))?.[1];
      if (command) {
        const {
          name,
          version,
          role,
          aliases = [],
          description,
          usage,
          credits,
          cooldown
        } = command;
        const roleMessage = role !== undefined
          ? (role === 0 ? '➛ Permission: user'
          : role === 1 ? '➛ Permission: admin'
          : role === 2 ? '➛ Permission: thread Admin'
          : role === 3 ? '➛ Permission: super Admin'
          : '') : '';
        const aliasesMessage = aliases.length ? `➛ Aliases: ${aliases.join(', ')}\n` : '';
        const message = ` 「 Command 」\n\n➛ Name: ${name}\n${version ? `➛ Version: ${version}\n` : ''}${roleMessage}\n${aliasesMessage}${description ? `Description: ${description}\n` : ''}${usage ? `➛ Usage: ${usage}\n` : ''}${credits ? `➛ Credits: ${credits}\n` : ''}${cooldown ? `➛ Cooldown: ${cooldown} second(s)\n` : ''}`;
        api.sendMessage(message, event.threadID, event.messageID);
      } else {
        api.sendMessage('Command not found.', event.threadID, event.messageID);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.handleEvent = async function({ api, event, prefix }) {
  const { threadID, messageID, body } = event;
  if (body?.toLowerCase().startsWith('prefix')) {
    api.sendMessage(prefix ? `This is my prefix: ${prefix}` : "Sorry I don't have a prefix.", threadID, messageID);
  }
};
