module.exports.config = {
  name: 'goodafternoon',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false, // no prefix needed
  description: 'Replies with a good afternoon message',
  usages: 'Type "good afternoon" or "afternoon" to get a reply',
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const msg = event.body.toLowerCase();
  if (msg === 'good afternoon' || msg === 'afternoon') {
    return api.sendMessage('🌤️ Good afternoon! Hope your day is going well! 😊', event.threadID, event.messageID);
  }
};
