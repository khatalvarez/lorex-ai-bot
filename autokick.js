const reactionTracker = {};

module.exports.config = {
  name: 'cassautokick',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  description: 'Auto-kick spammy like reactors',
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.handleReaction = async function({ api, event }) {
  const { reaction, userID, threadID } = event;

  // ✅ Target only "like" reactions
  if (reaction !== '👍') return;

  // Init tracker per thread
  if (!reactionTracker[threadID]) reactionTracker[threadID] = {};

  // Init per user
  if (!reactionTracker[threadID][userID]) {
    reactionTracker[threadID][userID] = {
      count: 0,
      timeout: null
    };
  }

  // Increment count
  reactionTracker[threadID][userID].count++;

  // Auto-reset count after 10 seconds (to avoid permanent ban risk)
  clearTimeout(reactionTracker[threadID][userID].timeout);
  reactionTracker[threadID][userID].timeout = setTimeout(() => {
    reactionTracker[threadID][userID].count = 0;
  }, 10000);

  // 🔥 Threshold to kick
  const threshold = 5;

  if (reactionTracker[threadID][userID].count >= threshold) {
    try {
      // ⚠️ First, check if bot is admin
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);

      if (!botIsAdmin) return api.sendMessage("❌ Di ako admin, hindi ko ma-kick ang spammer.", threadID);

      // Kick the user
      await api.removeUserFromGroup(userID, threadID);
      api.sendMessage(`🚫 Auto-kicked user ${userID} for spamming 👍 reactions.`, threadID);
    } catch (err) {
      console.error('Kick error:', err);
      api.sendMessage(`⚠️ Hindi ma-kick ang user. Baka admin siya or may error.`, threadID);
    }

    // Reset count after kick
    reactionTracker[threadID][userID].count = 0;
  }
};
