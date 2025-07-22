const fs = require('fs');
const path = './data/users.json';
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

// Detect "agree" message for TOS
async function handleAgreeMessage({ api, event }) {
  const { senderID, threadID, body } = event;

  // Loop through users to find matching senderID
  for (const username in users) {
    const user = users[username];

    if (user.senderID === senderID && user.threadID === threadID && !user.confirmedTerms) {
      if (body.trim().toLowerCase() === 'agree') {
        user.confirmedTerms = true;
        saveUserData();

        return api.sendMessage(`✅ Thank you for agreeing to the Terms of Service, ${username}!\nYou may now use all commands. 🎉`, threadID);
      } else {
        return api.sendMessage(`❗ Please reply with "agree" to confirm the Terms of Service.`, threadID);
      }
    }
  }
}
