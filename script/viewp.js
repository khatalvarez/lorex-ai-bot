const fs = require('fs');
const pathViews = './data/views.json';
const pathUserActivity = './data/userActivity.json';

function loadViews() {
  if (!fs.existsSync(pathViews)) return {};
  return JSON.parse(fs.readFileSync(pathViews));
}

function saveViews(views) {
  fs.writeFileSync(pathViews, JSON.stringify(views, null, 2));
}

function loadUserActivity() {
  if (!fs.existsSync(pathUserActivity)) return {};
  return JSON.parse(fs.readFileSync(pathUserActivity));
}

function saveUserActivity(activity) {
  fs.writeFileSync(pathUserActivity, JSON.stringify(activity, null, 2));
}

// Track user-thread interaction
function trackUserInteraction(threadID, senderID) {
  const views = loadViews();
  if (!views[threadID]) views[threadID] = [];
  if (!views[threadID].includes(senderID)) {
    views[threadID].push(senderID);
    saveViews(views);
  }

  // Track user activity count globally
  const activity = loadUserActivity();
  activity[senderID] = (activity[senderID] || 0) + 1;
  saveUserActivity(activity);
}

module.exports.config = {
  name: 'viewers',
  version: '1.1.0',
  hasPermission: 0,
  description: 'Show AI usage stats with top users, active groups, and charts',
};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const views = loadViews();
  const activity = loadUserActivity();

  const groupThreads = Object.keys(views);
  if (groupThreads.length === 0) 
    return api.sendMessage('⚠️ Wala pang data ng user activity.', threadID);

  // Get thread infos
  const threadInfos = await Promise.all(
    groupThreads.map(tid => api.getThreadInfo(tid).catch(() => null))
  );

  // Calculate pinaka-active group chat (highest unique users)
  let maxUsers = 0;
  let activeGroupIndex = 0;
  groupThreads.forEach((tid, i) => {
    if (views[tid].length > maxUsers) {
      maxUsers = views[tid].length;
      activeGroupIndex = i;
    }
  });

  // Prepare top active users sorted by activity count (desc)
  const sortedUsers = Object.entries(activity)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10); // top 10 users

  // Get user info for top active users
  const userInfos = await Promise.all(
    sortedUsers.map(([uid]) => api.getUserInfo(uid).catch(() => null))
  );

  // Build output message
  let message = '🤖✨ AI Usage Stats with Top Users & Active Groups ✨🤖\n\n';

  // Show pinaka-active group chat info
  const activeGroupThread = groupThreads[activeGroupIndex];
  const activeGroupName = threadInfos[activeGroupIndex]?.threadName || 'Unknown Group';
  message += `🔥 Pinaka-Active na Group Chat:\n📌 ${activeGroupName}\n🆔: ${activeGroupThread}\n👥 Unique Users: ${maxUsers}\n\n`;

  // Total unique users across all groups
  const totalUniqueUsers = new Set(Object.values(views).flat()).size;
  message += `📊 Total unique users sa lahat ng groups: ${totalUniqueUsers}\n\n`;

  // Top active users list with emoji "🔥" and name + activity count
  message += `👑 Top 10 Active Users:\n`;
  sortedUsers.forEach(([uid, count], i) => {
    const userName = userInfos[i]?.name || 'Unknown User';
    // Optional: show emoji face or avatar url (just name here)
    message += `${i+1}. 🔥 ${userName} - ${count} interactions\n`;
  });

  // Simple bar chart of group activity using emojis (▇)
  message += `\n📈 Group Activity Chart (Unique Users per Group):\n`;
  groupThreads.forEach((tid, i) => {
    const name = threadInfos[i]?.threadName || 'Unknown';
    const count = views[tid].length;
    const bars = '▇'.repeat(Math.min(count, 20)); // max 20 blocks
    message += `${name} (${count}): ${bars}\n`;
  });

  return api.sendMessage(message, threadID);
};
