const fs = require('fs');
const path = require('path');

const freeNumberList = [
  "09171234567",
  "09182345678",
  "09193456789",
  "09204567890",
  "09315678901"
];

const otpStorePath = path.join(__dirname, "otp.json");
const usersStorePath = path.join(__dirname, "users.json");

function readJSON(filepath, defaultVal) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    return defaultVal;
  }
}

function saveJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const gamesList = [
  "Guess the Number",
  "Rock Paper Scissors",
  "Tic Tac Toe",
  "Trivia Quiz",
  "Hangman",
  "Dice Roll",
  "Coin Flip",
  "Word Scramble",
  "Math Challenge",
  "Memory Game"
];

module.exports.config = {
  name: "adminpanel",
  version: "4.0.0",
  hasPermission: 0,
  description: "Admin panel with OTP, free number register, auto register, and 10 mini games menu",
  commandCategory: "admin",
  usages: "adminpanel [register|login|games|play]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  let users = readJSON(usersStorePath, {});
  let otps = readJSON(otpStorePath, {});

  if (args.length === 0) {
    return api.sendMessage(
      `⚠️ Usage:\n• adminpanel register <phone_number>\n• adminpanel login <phone_number> <otp>\n• adminpanel games\n• adminpanel play <game_number>\n\nFree Numbers: ${freeNumberList.join(", ")}`,
      event.threadID,
      event.messageID
    );
  }

  const action = args[0].toLowerCase();

  if (action === "register") {
    const phone = args[1];
    if (!phone) return api.sendMessage("❌ Please provide your phone number.", event.threadID, event.messageID);
    if (!freeNumberList.includes(phone)) return api.sendMessage("❌ Phone number not in free number list.", event.threadID, event.messageID);
    if (users[phone]) return api.sendMessage("❌ This phone number is already registered.", event.threadID, event.messageID);

    // Generate OTP and save
    const otp = generateOTP();
    otps[phone] = { code: otp, expiresAt: Date.now() + 5 * 60000 };
    saveJSON(otpStorePath, otps);

    // Auto-send OTP message to all groups (auto send notification)
    const threads = await api.getThreadList(100, null, ['INBOX']);
    const groups = threads.filter(t => t.isGroup);

    for (const group of groups) {
      api.sendMessage(`🔔 New registration OTP sent to ${phone}: ${otp}`, group.threadID);
    }

    return api.sendMessage(`📲 OTP sent for registration of ${phone}: ${otp} (expires in 5 minutes)`, event.threadID, event.messageID);
  }

  if (action === "login") {
    const phone = args[1];
    const otpInput = args[2];
    if (!phone || !otpInput) return api.sendMessage("❌ Usage: adminpanel login <phone_number> <otp>", event.threadID, event.messageID);
    if (!users[phone]) return api.sendMessage("❌ Number not registered.", event.threadID, event.messageID);
    if (!otps[phone]) return api.sendMessage("❌ No OTP found. Please register again.", event.threadID, event.messageID);

    if (Date.now() > otps[phone].expiresAt) {
      delete otps[phone];
      saveJSON(otpStorePath, otps);
      return api.sendMessage("❌ OTP expired. Please register again.", event.threadID, event.messageID);
    }

    if (otpInput !== otps[phone].code) return api.sendMessage("❌ Incorrect OTP.", event.threadID, event.messageID);

    delete otps[phone];
    saveJSON(otpStorePath, otps);
    users[phone].isAdmin = true;
    saveJSON(usersStorePath, users);

    return api.sendMessage("✅ Login successful! You now have admin access.", event.threadID, event.messageID);
  }

  if (action === "games") {
    let message = "🎮✨ *Welcome to the Fun Games Zone!* ✨🎮\n\n";
    message += "Here are *10 exciting games* you can play right now with the bot:\n\n";

    gamesList.forEach((game, i) => {
      const gameNumber = i + 1;
      switch (gameNumber) {
        case 1:
          message += `🔢 ${gameNumber}. *${game}* - Challenge your mind and guess the secret number!\n`;
          break;
        case 2:
          message += `✂️📄🪨 ${gameNumber}. *${game}* - Classic Rock, Paper, Scissors showdown!\n`;
          break;
        case 3:
          message += `❌⭕ ${gameNumber}. *${game}* - Test your strategy with Tic Tac Toe.\n`;
          break;
        case 4:
          message += `❓ ${gameNumber}. *${game}* - Trivia Quiz to test your general knowledge.\n`;
          break;
        case 5:
          message += `🪤 ${gameNumber}. *${game}* - Hangman! Guess the word before it's too late.\n`;
          break;
        case 6:
          message += `🎲 ${gameNumber}. *${game}* - Roll the dice and see what luck brings!\n`;
          break;
        case 7:
          message += `🪙 ${gameNumber}. *${game}* - Flip a coin, heads or tails?\n`;
          break;
        case 8:
          message += `🔤 ${gameNumber}. *${game}* - Unscramble the letters and find the hidden word.\n`;
          break;
        case 9:
          message += `➕➖✖️➗ ${gameNumber}. *${game}* - Solve quick math challenges.\n`;
          break;
        case 10:
          message += `🧠 ${gameNumber}. *${game}* - Memory Game to train your brain.\n`;
          break;
        default:
          message += `${gameNumber}. *${game}*\n`;
      }
    });

    message +=
      `\n🔥 *How to play?*\n` +
      `• Use the command: _adminpanel play <game_number>_\n` +
      `• Example: _adminpanel play 1_ to start *Guess the Number*.\n\n` +
      `🕹️ Have fun and good luck! Don't forget to share your scores with friends! 🎉🎉`;

    return api.sendMessage(message, event.threadID, event.messageID);
  }

  if (action === "play") {
    const gameNumber = parseInt(args[1]);
    if (!gameNumber || gameNumber < 1 || gameNumber > gamesList.length) {
      return api.sendMessage("❌ Invalid game number.", event.threadID, event.messageID);
    }
    const selectedGame = gamesList[gameNumber - 1];
    // TODO: Implement game logic here for each game
    return api.sendMessage(`🎲 Starting game: ${selectedGame}\n(Feature coming soon!)`, event.threadID, event.messageID);
  }

  return api.sendMessage("❌ Unknown command.", event.threadID, event.messageID);
};
