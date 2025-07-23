module.exports.config = {
  name: 'goodnight',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,  // no prefix needed
  description: 'Replies with a good night message',
  usages: 'Type "good night" to get a reply',
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const msg = event.body.toLowerCase();
  if (msg === 'good night' || msg === 'goodnight') {
    return api.sendMessage('🌙 Good night! Sweet dreams! 😴', event.threadID, event.messageID);
  }
};
