const fs = require('fs');
const adminsPath = './admins.json';

module.exports.config = {
  name: 'adpoge',
  version: '1.0.0',
  hasPermission: 2, // Only admins can use
  usePrefix: true,
  aliases: ['adm'],
  description: 'Admin management: add, remove, list admins',
};

let admins = [];

// Load admins list from file on startup
try {
  admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
} catch {
  admins = [];
}

// Save admins list to file
function saveAdmins() {
  fs.writeFileSync(adminsPath, JSON.stringify(admins, null, 2));
}

// Box message template with emojis
function box(message, type = '') {
  const emojis = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
  };
  const emoji = emojis[type] || '';
  return `╔═══════════════╗
${emoji} ${message}
╚═══════════════╝`;
}

// Generate Facebook profile link from UID
function fbProfile(uid) {
  return `https://www.facebook.com/${uid}`;
}

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const messageID = event.messageID;

  // Check if sender is an admin
  if (!admins.includes(senderID)) {
    return api.sendMessage(box('❌ You are not an admin to run this command.', 'error'), senderID, messageID);
  }

  const sub = args[0]?.toLowerCase();

  if (sub === 'add') {
    const newAdmin = args[1];
    if (!newAdmin) return api.sendMessage(box('⚠️ Please specify UID to add.', 'error'), senderID, messageID);
    if (admins.includes(newAdmin)) return api.sendMessage(box('ℹ️ This UID is already an admin.', 'info'), senderID, messageID);

    admins.push(newAdmin);
    saveAdmins();

    return api.sendMessage(box(`✅ Added admin:\n👤 UID: ${newAdmin}\n🔗 Profile: ${fbProfile(newAdmin)}`, 'success'), senderID, messageID);
  }

  if (sub === 'remove') {
    const remAdmin = args[1];
    if (!remAdmin) return api.sendMessage(box('⚠️ Please specify UID to remove.', 'error'), senderID, messageID);
    if (!admins.includes(remAdmin)) return api.sendMessage(box('ℹ️ This UID is not an admin.', 'info'), senderID, messageID);

    admins = admins.filter(id => id !== remAdmin);
    saveAdmins();

    return api.sendMessage(box(`✅ Removed admin:\n👤 UID: ${remAdmin}\n🔗 Profile: ${fbProfile(remAdmin)}`, 'success'), senderID, messageID);
  }

  if (sub === 'list') {
    if (admins.length === 0) return api.sendMessage(box('ℹ️ No admins added yet.', 'info'), senderID, messageID);
    let listText = '👑 Current Admins:\n\n';
    admins.forEach((id, i) => {
      listText += `${i + 1}. 👤 UID: ${id}\n🔗 Profile: ${fbProfile(id)}\n\n`;
    });
    return api.sendMessage(box(listText.trim(), 'info'), senderID, messageID);
  }

  return api.sendMessage(box('❌ Unknown admin command. Use add/remove/list.', 'error'), senderID, messageID);
};
