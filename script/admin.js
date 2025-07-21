const fs = require('fs');
const adminPath = __dirname + '/admin.json';

if (!fs.existsSync(adminPath)) {
  fs.writeFileSync(adminPath, JSON.stringify({ password: "", unlocked: [] }, null, 2));
}

let data = JSON.parse(fs.readFileSync(adminPath));
const adminUIDs = ['YOUR_ADMIN_UID']; // 👈 Replace with your actual admin UID(s)

function saveAdminData() {
  fs.writeFileSync(adminPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: 'admin',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  description: 'Admin tools and password lock system',
  usage: 'admin password [add/remove]',
  credits: 'OpenAI'
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID, body } = event;

  // 🔐 Admin Password Control
  if (args[0] === 'password') {
    if (!adminUIDs.includes(senderID)) {
      return api.sendMessage('❌ Only bot admins can use this command.', threadID, messageID);
    }

    if (args[1] === 'add' && args[2]) {
      data.password = args[2];
      saveAdminData();
      return api.sendMessage(`🔐 Password set to: ${args[2]}`, threadID, messageID);
    }

    if (args[1] === 'remove') {
      data.password = '';
      data.unlocked = [];
      saveAdminData();
      return api.sendMessage('✅ Password removed. All users locked.', threadID, messageID);
    }

    return api.sendMessage('❌ Usage:\n- admin password add [password]\n- admin password remove', threadID, messageID);
  }

  // 🔓 Help Unlocking
  if (args[0] === 'help' || body.toLowerCase().startsWith('help')) {
    const parts = body.split(' ');
    const inputPassword = parts[1];

    if (!data.password) {
      return api.sendMessage('📜 Public bot. No password required.\n\nCommands:\n- casino\n- rules\n- play...', threadID, messageID);
    }

    if (data.unlocked.includes(senderID)) {
      return api.sendMessage('✅ You already have access to commands.', threadID, messageID);
    }

    if (inputPassword === data.password) {
      if (!data.unlocked.includes(senderID)) {
        data.unlocked.push(senderID);
        saveAdminData();
      }
      return api.sendMessage('🔓 Access granted! You can now use all commands.', threadID, messageID);
    }

    return api.sendMessage('❌ Incorrect password. Type: help [password]', threadID, messageID);
  }

  // 🚫 Block all other commands if password is set and user is locked
  if (data.password && !data.unlocked.includes(senderID)) {
    return api.sendMessage('🔒 Bot is locked. Type `help [password]` to unlock.', threadID, messageID);
  }

  // ✅ If passed, allow other modules to handle the message
};
