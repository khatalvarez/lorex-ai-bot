module.exports.config = {
  name: "autokick",
  version: "1.0.0",
  hasPermission: 1,
  usePrefix: false,
  description: "Automatically kick spammers in group chats",
  commandCategory: "group moderation",
  usages: "automatic",
  cooldowns: 0
};

const spamTracker = {}; // Store message counts

const SPAM_LIMIT = 5;            // Max messages within cooldown window
const TIME_WINDOW = 7000;        // 7 seconds

module.exports.handleEvent = async function ({ api, event }) {
  const { senderID, threadID, isGroup, messageID } = event;

  if (!isGroup || !senderID || event.type !== "message") return;

  // Initialize tracker for this thread and user
  if (!spamTracker[threadID]) spamTracker[threadID] = {};
  if (!spamTracker[threadID][senderID]) {
    spamTracker[threadID][senderID] = {
      count: 1,
      firstMsgTime: Date.now()
    };
  } else {
    let userData = spamTracker[threadID][senderID];
    userData.count++;

    if (Date.now() - userData.firstMsgTime <= TIME_WINDOW) {
      if (userData.count >= SPAM_LIMIT) {
        try {
          await api.removeUserFromGroup(senderID, threadID);
          api.sendMessage(`🚨 User ${senderID} was auto-kicked for spamming.`, threadID);
        } catch (err) {
          api.sendMessage(`❌ Unable to kick user ${senderID}. Bot may lack permissions.`, threadID);
        }
        delete spamTracker[threadID][senderID]; // Reset after kick
      }
    } else {
      // Reset count if time window passed
      spamTracker[threadID][senderID] = {
        count: 1,
        firstMsgTime: Date.now()
      };
    }
  }
};
