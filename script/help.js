module.exports.config = {
  name: 'help',
  version: '3.8.3',
  hasPermission: 0,
  usePrefix: true,
  description: 'Shows help page number',
  usages: 'help [page]',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  let page = 1;
  if (args.length > 0) {
    const parsed = parseInt(args[0]);
    if (!isNaN(parsed) && parsed > 0) page = parsed;
  }

  const message = `\`\`\`
📌 Help Page ${page}
\`\`\``;

  return api.sendMessage(message, event.threadID, event.messageID);
};
