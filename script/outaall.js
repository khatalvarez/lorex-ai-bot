module.exports.config = {
  name: 'outall',
  version: '1.0.0',
  hasPermission: 2, // Usually admin permission needed
  usePrefix: false,
  aliases: [],
  description: 'Leave all group chats',
};

module.exports.run = async function({ api, event, args }) {
  try {
    // Get all threads (conversations)
    const threads = await api.getThreadList(100, null, ['INBOX']);

    let leftCount = 0;
    for (const thread of threads) {
      if (thread.isGroup) {
        await api.removeUserFromGroup(api.getCurrentUserID(), thread.threadID);
        leftCount++;
      }
    }

    return api.sendMessage(`✅ Left ${leftCount} group(s).`, event.threadID, event.messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage('❌ Failed to leave all groups.', event.threadID, event.messageID);
  }
};
