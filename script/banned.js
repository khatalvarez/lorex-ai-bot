module.exports.config = {
  name: 'autobannedreply',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  description: 'Auto-reply banned message to all group chats',
};

module.exports.run = async function ({ event, api }) {
  // Check if message is in a group thread
  if (event.isGroup) {
    return api.sendMessage('⚠YOUR BANNED PLEASE TRY AGAIN.', event.threadID);
  }
};
