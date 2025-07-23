module.exports.config = {
  name: 'serivcerule',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['rules', 'owner', 'contact'],
  description: 'Shows group rules and owner contact info',
  usages: 'rules | owner | contact',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;
  const command = args[0]?.toLowerCase();

  if (command === 'rules') {
    const rulesMessage = 
`📜 *Cassandra AI Group Rules* 📜

1. Be respectful to all members.
2. No spamming or flooding the chat.
3. Avoid sharing illegal or harmful content.
4. Use English or agreed language only.
5. Listen to the admins and moderators.
6. Have fun and help each other!`;

    return api.sendMessage(rulesMessage, threadID, messageID);
  }

  if (command === 'owner' || command === 'contact') {
    const ownerMessage = 
`👤 *Owner Contact Info*

Facebook: https://www.facebook.com/ZeromeNaval.61577040643519

Feel free to reach out for questions, support, or business inquiries.`;

    // Optionally add owner as contact (if your platform supports it)
    // This part depends on your API. Example below is a generic placeholder:
    /*
    api.addUserToThread({
      userID: '61577040643519',
      threadID: threadID
    });
    */

    return api.sendMessage(ownerMessage, threadID, messageID);
  }

  return api.sendMessage("❌ Unknown command. Try 'rules' or 'owner'.", threadID, messageID);
};
