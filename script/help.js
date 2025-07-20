const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'help',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['info'],
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

    // === DEFAULT HELP PAGE (NO INPUT) ===
    if (!input) {
      const page = 1;
      const perPage = 20;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      let helpMessage = `**COMMAND LIST**\n\n`;

      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `${i + 1}. ${prefix}${commands[i]}\n`;
      }

      helpMessage += `\n**EVENT HANDLERS:**\n`;
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `${index + 1}. ${prefix}${eventCommand}\n`;
      });

      helpMessage += `\nPage ${page}/${Math.ceil(commands.length / perPage)}\n`;
      helpMessage += `Type '${prefix}help [page]' to navigate or '${prefix}help [command]' for details.`;

      // Send with logo image
      const imagePath = path.join(__dirname, 'assets', 'encantadia_logo.jpg');
      const imageStream = fs.createReadStream(imagePath);

      return api.sendMessage({
        body: helpMessage,
        attachment: imageStream
      }, event.threadID, event.messageID);
    }

    // === PAGINATED HELP ===
    else if (!isNaN(input)) {
      const page = parseInt(input);
      const perPage = 20;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      let helpMessage = `**COMMAND LIST** (Page ${page})\n\n`;

      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `${i + 1}. ${prefix}${commands[i]}\n`;
      }

      helpMessage += `\n**EVENT HANDLERS:**\n`;
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `${index + 1}. ${prefix}${eventCommand}\n`;
      });

      helpMessage += `\nPage ${page} of ${Math.ceil(commands.length / perPage)}\n`;
      helpMessage += `Use '${prefix}help [page]' to navigate.`;
      return api.sendMessage(helpMessage, event.threadID, event.messageID);
    }

    // === SPECIFIC COMMAND HELP ===
    else {
      const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) =>
        key.includes(input.toLowerCase())
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
        } = command;

        const roleMessage = role !== undefined
          ? (role === 0 ? 'User' : role === 1 ? 'Admin' : role === 2 ? 'Thread Admin' : 'Super Admin')
          : 'Unknown';

        let infoMessage = `**COMMAND INFO**\n\n`;
        infoMessage += `• Name: ${name}\n`;
        infoMessage += `• Version: ${version || '1.0.0'}\n`;
        infoMessage += `• Permission: ${roleMessage}\n`;
        if (aliases.length) infoMessage += `• Aliases: ${aliases.join(', ')}\n`;
        if (description) infoMessage += `• Description: ${description}\n`;
        if (usage) infoMessage += `• Usage: ${usage}\n`;
        if (cooldown) infoMessage += `• Cooldown: ${cooldown} second(s)\n`;
        if (credits) infoMessage += `• Credits: ${credits}\n`;

        return api.sendMessage(infoMessage, event.threadID, event.messageID);
      } else {
        return api.sendMessage('Command not found.', event.threadID, event.messageID);
      }
    }
  } catch (error) {
    console.error(error);
    api.sendMessage('An error occurred while processing your help request.', event.threadID, event.messageID);
  }
};

module.exports.handleEvent = async function({ api, event, prefix }) {
  const { threadID, messageID, body } = event;
  const message = prefix
    ? `System prefix: ${prefix}`
    : `Sorry, I don't have a prefix configured.`;

  if (body?.toLowerCase().startsWith('prefix')) {
    api.sendMessage(message, threadID, messageID);
  }
};
