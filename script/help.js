module.exports.config = {
  name: 'help',
  version: '2.9.5',
  role: 0,
  hasPrefix: true,
  aliases: ['commands', 'h'],
  description: 'Show help info for all commands or a specific command with an image.',
  usage: 'help [command]',
  credits: 'OpenAI'
};

const HELP_IMAGE_URL = 'https://i.ibb.co/4ZYPNW5P/moto-code.png'; // Gamitin itong link sa ibinigay mo

// Simple command list for example
const commandsList = {
  help: {
    description: 'Show help info for all commands or a specific command.',
    usage: 'help [command]'
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Get sender's name
  const userNameData = await api.getUserInfo(senderID);
  const userName = userNameData[senderID]?.name || 'User';

  const cmd = args[0]?.toLowerCase();

  if (!cmd) {
    let message = `📚 Hello, ${userName}! Here are the available commands:\n\n`;
    for (const key in commandsList) {
      message += `• ${key}: ${commandsList[key].description}\nUsage:\n\`\`\`\n${commandsList[key].usage}\n\`\`\`\n\n`;
    }
    message += `Type "help [command]" to get details about a specific command.`;

    // Send text + image
    return api.sendMessage(
      {
        body: message,
        attachment: await global.utils.getStreamFromURL(HELP_IMAGE_URL) // or another way to fetch stream if your bot supports
      },
      threadID,
      messageID
    );
  }

  if (commandsList[cmd]) {
    const c = commandsList[cmd];
    const message = `📖 Hello, ${userName}! Here's help for "${cmd}":\n\nDescription:\n${c.description}\n\nUsage:\n\`\`\`\n${c.usage}\n\`\`\``;

    return api.sendMessage(
      {
        body: message,
        attachment: await global.utils.getStreamFromURL(HELP_IMAGE_URL)
      },
      threadID,
      messageID
    );
  }

  return api.sendMessage(`❌ Sorry, ${userName}, command "${cmd}" not found.`, threadID, messageID);
};
