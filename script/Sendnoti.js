const fs = require('fs');

module.exports.config = {
  name: 'sendnoti',
  version: '1.0.0',
  hasPermission: 2,  // Admin access required
  description: 'Send notifications to other groups. Admin only.',
  usages: 'sendnoti [message]',
  credits: 'Omega Team',
  cooldowns: 0,
  dependencies: {}
};

const adminIDs = ['61577040643519', '61575137262643'];  // Admin IDs allowed to use this command
const groups = [
  '1234567890', // Example Group ID 1
  '9876543210'  // Example Group ID 2
];

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  // Check if the sender is an admin
  if (!adminIDs.includes(senderID)) {
    return api.sendMessage('❌ You do not have permission to send notifications.', threadID, messageID);
  }

  // Get the notification message from the arguments
  const message = args.join(' ');
  if (!message) {
    return api.sendMessage('❌ Please provide a message to send.', threadID, messageID);
  }

  // Send the notification message to all other groups
  try {
    for (const groupID of groups) {
      api.sendMessage(`📢 Admin Notification: ${message}`, groupID);
    }
    return api.sendMessage(`✅ Notification sent to ${groups.length} groups.`, threadID, messageID);
  } catch (error) {
    console.error('Error sending notifications:', error);
    return api.sendMessage('❌ Failed to send notifications. Please try again later.', threadID, messageID);
  }
};
