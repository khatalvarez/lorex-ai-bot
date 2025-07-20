module.exports.config = {
  name: 'help',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['commands', 'cmds'],
  description: 'Shows all available commands and how to use them.',
  usages: 'help',
  cooldowns: 0
};

const commandsList = [
  {
    name: 'cassandra',
    description: 'Ask Deepseek V3 AI by Kaizenji.',
    usage: 'ai2 [prompt]'
  },
  {
    name: 'restart',
    description: 'Restarts the bot.',
    usage: 'restart'
  },
  {
    name: 'help',
    description: 'Shows all available commands.',
    usage: 'help'
  }
  // Add more commands here if needed
];

module.exports.run = async function({ api, event }) {
  let message = '📜 List of commands:\n\n';

  commandsList.forEach(cmd => {
    message += `🔹 ${cmd.name}\n➡️ Description: ${cmd.description}\n➡️ Usage: ${cmd.usage}\n\n`;
  });

  return api.sendMessage(message.trim(), event.threadID, event.messageID);
};
