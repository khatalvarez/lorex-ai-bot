const fs = require('fs');
const path = './data/users.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

module.exports.config = {
  name: 'register',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Register and receive free bonus + terms confirmation',
  usages: 'register [username] [3-digit-number]',
  credits: 'ZeroMe Naval',
  cooldowns: 0,
  dependencies: {}
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const [username, number] = args;

  if (!username || !number) {
    return api.sendMessage('📋 Usage: register [username] [3-digit number]', threadID, messageID);
  }

  if (users[username]) {
    return api.sendMessage('❌ Username already exists. Try a new one.', threadID, messageID);
  }

  if (!/^\d{3}$/.test(number)) {
    return api.sendMessage('🔢 The number must be exactly 3 digits.', threadID, messageID);
  }

  // Create user with unconfirmed terms
  users[username] = {
    number,
    balance: 900, // free bonus
    level: 1,
    xp: 0,
    confirmedTerms: false,
    threadID: threadID,
    senderID: senderID
  };
  saveUserData();

  // Send TOS after registration
  const terms = `
📚 𝗖𝗮𝘀𝘀𝗮𝗻𝗱𝗿𝗮 𝗔𝗜 𝗦𝗰𝗵𝗼𝗼𝗹 𝗥𝗲𝘀𝗲𝗮𝗿𝗰𝗵 𝗡𝗼𝘁𝗲𝘀 🧠

🎓 𝗜𝗻𝘁𝗿𝗼: Cassandra is a smart AI that helps with all subjects.
Just start with "Cassandra" and get real-time help in learning.

👩‍💻 Owner: ZeroMe Naval  
🛠️ Features:
• 📘 All-subject help
• ⚡ Fast answers
• 🎨 Emoji-enhanced replies

📌 Example:
User: Cassandra, what’s gravity?
Cassandra: 🌍 Gravity pulls objects toward Earth.

✅ To continue using the system, **please reply with**: 𝗮𝗴𝗿𝗲𝗲
  `;

  api.sendMessage(`✅ Registered as ${username} with 900 bonus coins!\n\n📄 Terms of Service will now be sent.`, threadID, () => {
    api.sendMessage(terms, threadID);
  }, messageID);
};
