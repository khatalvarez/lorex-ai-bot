const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

    // If no input: show first help page + profile image and user info
    if (!input) {
      const pages = 20;
      let page = 1;
      let start = (page - 1) * pages;
      let end = start + pages;

      // Construct command list
      let helpMessage = `Command List:\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `\t${i + 1}. 「 ${prefix}${commands[i]} 」\n`;
      }

      // Construct event list
      helpMessage += '\nEvent List:\n\n';
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `\t${index + 1}. 「 ${prefix}${eventCommand} 」\n`;
      });

      helpMessage += `\nPage ${page}/${Math.ceil(commands.length / pages)}. To view the next page, type '${prefix}help page number'. To view information about a specific command, type '${prefix}help command name'.`;

      // Get user info
      const userInfo = await api.getUserInfo(event.senderID);
      const name = userInfo[event.senderID]?.name || "Unknown";
      const uid = event.senderID;

      helpMessage = `👤 User Info:\n➛ Name: ${name}\n➛ UID: ${uid}\n\n` + helpMessage;

      // Prepare to fetch and send profile image
      const imgPath = path.join(__dirname, 'cache', `${uid}.jpg`);
      const imgUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;

      try {
        const imgRes = await axios.get(imgUrl, { responseType: 'stream' });
        imgRes.data.pipe(fs.createWriteStream(imgPath)).on('finish', () => {
          api.sendMessage({
            body: helpMessage,
            attachment: fs.createReadStream(imgPath)
          }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
        });
      } catch (err) {
        console.error("Failed to fetch profile picture:", err);
        api.sendMessage(helpMessage, event.threadID, event.messageID);
      }

    } else if (!isNaN(input)) {
      // If input is a number, show corresponding page
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
      // If input is a specific command name
      const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) =>
        key.includes(input?.toLowerCase())
      )?.[1];

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

        const roleMessage = role !== undefined
          ? (role === 0 ? '➛ Permission: user'
          : role === 1 ? '➛ Permission: admin'
          : role === 2 ? '➛ Permission: thread Admin'
          : role === 3 ? '➛ Permission: super Admin'
          : '') : '';

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
  const { threadID, messageID, body } = event;
  const message = prefix ? 'This is my prefix: ' + prefix : "Sorry I don't have a prefix.";
  if (body?.toLowerCase().startsWith('prefix')) {
    api.sendMessage(message, threadID, messageID);
  }
};
