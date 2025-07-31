const fs = require("fs");
const path = require("path");

const usersPath = path.join(__dirname, "users.json");
const leaderboardLogPath = path.join(__dirname, "leaderboard_logs.json");

const gamesList = [
  "Guess the Number", "Rock Paper Scissors", "Tic Tac Toe", "Trivia Quiz", "Hangman",
  "Dice Roll", "Coin Flip", "Word Scramble", "Math Challenge", "Memory Game",
  "Treasure Hunt", "Sudoku", "Puzzle Solver", "Typing Test", "Word Search",
  "Reaction Time", "Color Match", "2048 Game", "Simon Says", "Balance Challenge"
];

// Helpers
function readJSON(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } 
  catch { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Leaderboard helpers
function getTopXPUsers(limit = 10) {
  const users = readJSON(usersPath, {});
  return Object.entries(users)
    .map(([uid, data]) => ({ uid, xp: data.xp || 0, balance: data.balance || 0 }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}
function saveLeaderboardLog(entry) {
  let logs = readJSON(leaderboardLogPath, []);
  logs.unshift(entry);
  writeJSON(leaderboardLogPath, logs.slice(0, 20));
}

module.exports.config = {
  name: "adminpanel",
  version: "5.1.0",
  hasPermission: 0,
  description: "Admin panel with deposit, withdraw, claim, 20 games, XP leaderboard & Agent AI (No OTP, no register/login)",
  commandCategory: "admin",
  usages: "adminpanel [deposit|withdraw|claim|games|play|leaderboard|agent]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const senderID = event.senderID;

  let users = readJSON(usersPath, {});

  if (args.length === 0) {
    return api.sendMessage(
      `⚠️ Usage:\n` +
      `• deposit <amount>\n` +
      `• withdraw <amount>\n` +
      `• claim\n` +
      `• games\n` +
      `• play <game_number>\n` +
      `• leaderboard\n` +
      `• agent\n`,
      threadID,
      event.messageID
    );
  }

  const cmd = args[0].toLowerCase();

  // DEPOSIT (limit 200)
  if (cmd === "deposit") {
    let amount = parseInt(args[1]);
    if (!amount || amount <= 0) return api.sendMessage("❌ Enter a valid deposit amount.", threadID, event.messageID);
    if (amount > 200) return api.sendMessage("❌ Deposit limit is 200.", threadID, event.messageID);

    users[senderID] = users[senderID] || { balance: 0, xp: 0, claimed: false };
    users[senderID].balance = (users[senderID].balance || 0) + amount;
    writeJSON(usersPath, users);

    return api.sendMessage(`💰 You deposited ₱${amount}. Current balance: ₱${users[senderID].balance}`, threadID, event.messageID);
  }

  // WITHDRAW (no limit)
  if (cmd === "withdraw") {
    let amount = parseInt(args[1]);
    if (!amount || amount <= 0) return api.sendMessage("❌ Enter a valid withdraw amount.", threadID, event.messageID);
    users[senderID] = users[senderID] || { balance: 0, xp: 0, claimed: false };

    if (amount > (users[senderID].balance || 0)) return api.sendMessage("❌ Not enough balance.", threadID, event.messageID);

    users[senderID].balance -= amount;
    writeJSON(usersPath, users);

    return api.sendMessage(`💸 You withdrew ₱${amount}. Current balance: ₱${users[senderID].balance}`, threadID, event.messageID);
  }

  // FREE CLAIM bonus 300
  if (cmd === "claim") {
    users[senderID] = users[senderID] || { balance: 0, xp: 0, claimed: false };
    if (users[senderID].claimed) return api.sendMessage("❌ Already claimed bonus.", threadID, event.messageID);

    users[senderID].balance += 300;
    users[senderID].claimed = true;
    writeJSON(usersPath, users);

    // Notify all groups about claim
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup);
    for (const group of groups) {
      api.sendMessage(`🎉 User @${senderID} just claimed free bonus ₱300!`, group.threadID, null, { mentions: [{ id: senderID, tag: `@${senderID}` }] });
    }

    return api.sendMessage("🎁 You successfully claimed ₱300 bonus!", threadID, event.messageID);
  }

  // GAMES list
  if (cmd === "games") {
    let msg = "🎮 *20 Exciting Games You Can Play to Earn XP!* 🎮\n\n";
    gamesList.forEach((game, i) => {
      const num = i + 1;
      msg += `${num}. ${game}\n`;
    });
    msg += `\nUse: adminpanel play <game_number> to start playing!\n`;
    return api.sendMessage(msg, threadID, event.messageID);
  }

  // PLAY game placeholder
  if (cmd === "play") {
    let num = parseInt(args[1]);
    if (!num || num < 1 || num > gamesList.length) return api.sendMessage("❌ Invalid game number.", threadID, event.messageID);

    const gameName = gamesList[num - 1];
    // Placeholder for actual game logic

    users[senderID] = users[senderID] || { balance: 0, xp: 0, claimed: false };
    // Simulate XP earning
    const earnedXP = Math.floor(Math.random() * 50) + 10;
    users[senderID].xp = (users[senderID].xp || 0) + earnedXP;
    writeJSON(usersPath, users);

    return api.sendMessage(`🎲 You played *${gameName}* and earned ${earnedXP} XP! Total XP: ${users[senderID].xp}`, threadID, event.messageID);
  }

  // LEADERBOARD
  if (cmd === "leaderboard") {
    let topUsers = getTopXPUsers(10);
    if (topUsers.length === 0) return api.sendMessage("❌ No users found.", threadID, event.messageID);

    let message = "🏆 *Leaderboard* 🏆\n\n";
    topUsers.forEach(({ uid, xp }, i) => {
      message += `${i + 1}. @${uid} - ${xp} XP\n`;
    });

    const now = new Date();
    message += `\n🕒 Updated: ${now.toLocaleString()}`;

    // Save leaderboard log
    saveLeaderboardLog({ timestamp: now.toISOString(), topUsers });

    return api.sendMessage(message, threadID, event.messageID, { mentions: topUsers.map(u => ({ id: u.uid, tag: `@${u.uid}` })) });
  }

  // AGENT AI PANEL placeholder
  if (cmd === "agent") {
    return api.sendMessage("🤖 Agent AI Panel coming soon! Stay tuned.", threadID, event.messageID);
  }

  return api.sendMessage("❌ Unknown command.", threadID, event.messageID);
};
