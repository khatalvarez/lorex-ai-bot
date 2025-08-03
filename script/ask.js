module.exports.config = {
  name: 'ask',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['askme'],
  description: 'Message to ask the user with rules and emoji in box message',
};

function box(message, type = '') {
  const emojis = {
    info: '💬',
    rules: '📜',
  };
  const emoji = emojis[type] || '';
  return `╔═══════════════╗
${emoji} ${message}
╚═══════════════╝`;
}

module.exports.run = async function({ api, event }) {
  const senderID = event.senderID;
  const messageID = event.messageID;

  const msg = `Hello! 👋

If you want to ask me something, just type your question here.

Please follow these rules:

1. Be polite and respectful 🙏
2. No spamming or flooding the chat 🚫
3. Keep your questions clear and concise ✍️

Thank you! 😊`;

  return api.sendMessage(box(msg, 'info') + '\n\n' + box('Rules:\n1. Be polite\n2. No spamming\n3. Clear questions', 'rules'), senderID, messageID);
};
