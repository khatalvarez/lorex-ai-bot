const fs = require("fs");
const path = require("path");

// Paths to your data files
const usersPath = path.join(__dirname, "users.json");
const leaderboardLogPath = path.join(__dirname, "leaderboard_logs.json");

// Fake API object placeholder — replace with your bot's real API object
// Example: const api = require('your-bot-api');
const api = require("./yourApiInstance"); // <-- Replace this!

async function getGroupThreads(api) {
  try {
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    return threads.filter(t => t.isGroup);
  } catch (e) {
    console.error("Failed to fetch threads:", e);
    return [];
  }
}

function readJSON(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getTopXPUsers(users, limit = 10) {
  return Object.entries(users)
    .map(([uid, data]) => ({ uid, xp: data.xp || 0 }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

async function sendLeaderboard(api) {
  const users = readJSON(usersPath, {});
  const topUsers = getTopXPUsers(users, 10);

  if (topUsers.length === 0) {
    console.log("No users with XP found.");
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleString();

  // Compose message with mentions
  let message = `🏆 *Weekly XP Leaderboard* 🏆\n\n`;
  topUsers.forEach(({ uid, xp }, i) => {
    message += `${i + 1}. @${uid} - ${xp} XP\n`;
  });
  message += `\n🕒 Updated: ${timeStr}`;

  // Mentions array for tagging top users
  const mentions = topUsers.map(u => ({ id: u.uid, tag: `@${u.uid}` }));

  // Save leaderboard log
  let logs = readJSON(leaderboardLogPath, []);
  logs.unshift({ timestamp: now.toISOString(), topUsers });
  writeJSON(leaderboardLogPath, logs.slice(0, 20));

  // Get all group threads
  const groups = await getGroupThreads(api);

  // Send leaderboard to all groups tagging top users
  for (const group of groups) {
    try {
      await api.sendMessage(message, group.threadID, null, { mentions });
      console.log(`Leaderboard sent to group ${group.threadID}`);
    } catch (err) {
      console.error(`Failed to send leaderboard to group ${group.threadID}:`, err);
    }
  }
}

// Run sendLeaderboard if this file is run directly
if (require.main === module) {
  (async () => {
    try {
      await sendLeaderboard(api);
      console.log("Auto leaderboard process completed.");
    } catch (e) {
      console.error("Error running auto leaderboard:", e);
    }
  })();
}

module.exports = { sendLeaderboard };
