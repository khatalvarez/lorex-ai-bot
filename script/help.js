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
      let page = 1;
      let start = (page - 1) * pages;
      let end = start + pages;
      let helpMessage = `Command List:\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `\t${i + 1}. 「 ${prefix}${commands[i]} 」\n`;
      }
      helpMessage += '\nEvent List:\n\n';
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `\t${index + 1}. 「 ${prefix}${eventCommand} 」\n`;
      });
      helpMessage += `\nPage ${page}/${Math.ceil(commands.length / pages)}. To view the next page, type '${prefix}help page number'. To view information about a specific command, type '${prefix}help command name'.`;

      // --- Image composition start ---
      // Get user info + profile picture URL
      const userID = event.senderID;
      const profilePicUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;

      // Paths
      const imgPath = path.join(__dirname, 'cache', `help_${userID}.jpg`);

      try {
        // Load images
        const [bg, profilePic] = await Promise.all([
          Jimp.read('https://i.imgur.com/9e7FsGv.jpg'),  // Cloud night background (replace with your preferred)
          Jimp.read(profilePicUrl)
        ]);

        // Resize background to 512x512
        bg.resize(512, 512);

        // Resize profile pic and circle crop
        profilePic.resize(150, 150);
        const mask = await Jimp.read('https://i.imgur.com/OPxhXQi.png'); // circle mask PNG (white circle on transparent)
        mask.resize(150, 150);
        profilePic.mask(mask, 0, 0);

        // Composite profile pic onto bg (centered horizontally, 60px from top)
        bg.composite(profilePic, (bg.bitmap.width / 2) - (profilePic.bitmap.width / 2), 60);

        // Write image
        await bg.writeAsync(imgPath);

        // Prepend user info to help message
        const userInfo = await api.getUserInfo(userID);
        const name = userInfo[userID]?.name || 'Unknown';
        helpMessage = `👤 User Info:\n➛ Name: ${name}\n➛ UID: ${userID}\n\n` + helpMessage;

        // Send message with image
        api.sendMessage(
          {
            body: helpMessage,
            attachment: fs.createReadStream(imgPath)
          },
          event.threadID,
          () => fs.unlinkSync(imgPath),
          event.messageID
        );

      } catch (e) {
        console.error('Error creating help image:', e);
        // fallback: just send text help
        api.sendMessage(helpMessage, event.threadID, event.messageID);
      }

      // --- Image composition end ---

    } else if (!isNaN(input)) {
      // (handle page numbers exactly as before)
      const page = parseInt(input);
      const pages = 20;
      let start = (page - 1) * pages;
      let end = start + pages;
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
      // (handle specific command info exactly as before)
      const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) => key.includes(input?.toLowerCase()))?.[1];
      if (command) {
        const {
          name,
          version,
          role,
          aliases = [],
          description,
          usage,
          credits,
          cooldown,
          hasPrefix
        } = command;
        const roleMessage = role !== undefined ? (role === 0 ? '➛ Permission: user' : (role === 1 ? '➛ Permission: admin' : (role === 2 ? '➛ Permission: thread Admin' : (role === 3 ? '➛ Permission: super Admin' : '')))) : '';
        const aliasesMessage = aliases.length ? `➛ Aliases: ${aliases.join(', ')}\n` : '';
        const descriptionMessage = description ? `Description: ${description}\n` : '';
        const usageMessage = usage ? `➛ Usage: ${usage}\n` : '';
        const creditsMessage = credits ? `➛ Credits: ${credits}\n` : '';
        const versionMessage = version ? `➛ Version: ${version}\n` : '';
        const cooldownMessage = cooldown ? `➛ Cooldown: ${cooldown} second(s)\n` : '';
        const message = ` 「 Command 」\n\n➛ Name: ${name}\n${versionMessage}${roleMessage}\n${aliasesMessage}${descriptionMessage}${usageMessage}${creditsMessage}${cooldownMessage}`;
        api.sendMessage(message, event.threadID, event.messageID);
      } else {
        api.sendMessage('Command not found.', event.threadID, event.messageID);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.handleEvent = async function({
  api,
  event,
  prefix
}) {
  const {
    threadID,
    messageID,
    body
  } = event;
  const message = prefix ? 'This is my prefix: ' + prefix : "Sorry i don't have prefix";
  if (body?.toLowerCase().startsWith('prefix')) {
    api.sendMessage(message, threadID, messageID);
  }
};
