// Keeps track of like spam counts per thread (GC)
const likeSpamCounts = {};

module.exports.config = {
  name: 'likespam',
  version: '1.0.0',
  role: 0,
  hasPrefix: false, // runs automatically on every message
  description: 'Detect like spam and send spam alerts',
  credits: 'OpenAI'
};

function isLikeSpam(message) {
  // Define what counts as like spam — messages mostly with "like" or 👍 emoji
  const likePatterns = [/like/gi, /👍/g];
  let likeCount = 0;

  likePatterns.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) likeCount += matches.length;
  });

  // Consider spam if message is mostly likes/emojis or has multiple likes
  // Example: if message length is short and majority are likes
  if (likeCount > 0) {
    const ratio = likeCount / message.length;
    if (message.length < 30 && ratio > 0.3) return true;
    if (likeCount >= 3) return true;
  }
  return false;
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body } = event;

  if (!body) return;

  // Check if message is like spam
  if (isLikeSpam(body)) {
    likeSpamCounts[threadID] = (likeSpamCounts[threadID] || 0) + 1;

    if (likeSpamCounts[threadID] >= 3) {
      // Send 3 spam alert messages
      const alertMsgs = [
        '⚠️ Warning: Please avoid spamming likes in the chat.',
        '🚫 Spamming can disrupt the conversation. Let’s keep it clean!',
        '🤖 Auto-alert from the bot: Spam detected, please stop.'
      ];

      for (const msg of alertMsgs) {
        await api.sendMessage(msg, threadID);
      }

      // Reset counter after alert
      likeSpamCounts[threadID] = 0;
    }
  } else {
    // Reset counter if message is not spam
    likeSpamCounts[threadID] = 0;
  }
};
