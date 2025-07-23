module.exports.config = {
  name: 'admincheck',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Check if user is admin',
  usages: 'admincheck',
  cooldowns: 3,
  admins: ['61577040643519', '61575137262643']  // Admin user IDs here
};

module.exports.run = async function({ api, event, config }) {
  const senderID = event.senderID;
  if (config.admins.includes(senderID)) {
    return api.sendMessage('✅ You are an admin!', event.threadID, event.messageID);
  } else {
    return api.sendMessage('❌ You are NOT an admin.', event.threadID, event.messageID);
  }
};
