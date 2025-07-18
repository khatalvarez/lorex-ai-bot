const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'help',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['tulong'],
  description: "List of commands with Encantadia-themed image",
  usage: "help [page or command]",
  credits: 'ZEROME NAVAL',
};

module.exports.run = async function({ api, event, enableCommands, args, prefix }) {
  const input = args.join(' ');
  try {
    const commands = enableCommands[0].commands;
    const pages = 20;
    let page = 1;

    if (!input || !isNaN(input)) {
      page = input && !isNaN(input) ? parseInt(input) : 1;
      const start = (page - 1) * pages;
      const end = start + pages;

      let helpMessage = `✨ Encantadia Commands List (Page ${page}/${Math.ceil(commands.length / pages)}) ✨\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `\t${i + 1}. 「 ${prefix}${commands[i]} 」\n`;
      }
      helpMessage += `\nTo see next page, type: ${prefix}help ${page + 1}\n\nDeveloper: ZEROME NAVAL`;

      // Image URL ng Encantadia fairy logo (pwedeng palitan mo)
      const imgUrl = 'https://i.imgur.com/1O4uXWl.png'; 
      const imgPath = path.join(__dirname, 'cache', 'encantadia_fairy.png');

      const response = await axios.get(imgUrl, { responseType: 'stream' });
      response.data.pipe(fs.createWriteStream(imgPath)).on('finish', () => {
        api.sendMessage({
          body: helpMessage,
          attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => {
          fs.unlinkSync(imgPath);
        }, event.messageID);
      });

    } else {
      const commandName = input.toLowerCase();
      const command = commands.find(cmd => cmd.toLowerCase() === commandName);
      if (command) {
        const message = `✨ Command Details ✨\n\n` +
          `Name: ${command}\n` +
          `Usage: ${prefix}${command}\n` +
          `Description: (Add description here if you want)\n\nDeveloper: ZEROME NAVAL`;

        api.sendMessage(message, event.threadID, event.messageID);
      } else {
        api.sendMessage('Command not found.', event.threadID, event.messageID);
      }
    }
  } catch (error) {
    console.error(error);
    api.sendMessage('An error occurred while fetching the help commands.', event.threadID, event.messageID);
  }
};
