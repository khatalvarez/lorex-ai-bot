const fs = require('fs');
const path = require('path');

const adminsFile = path.join(__dirname, 'admins.json');

module.exports.config = {
  name: 'owner',
  version: '1.0.0',
  description: 'Add or remove admin by UID',
};

function loadAdmins() {
  if (!fs.existsSync(adminsFile)) {
    fs.writeFileSync(adminsFile, JSON.stringify([]));
  }
  const data = fs.readFileSync(adminsFile);
  return JSON.parse(data);
}

function saveAdmins(admins) {
  fs.writeFileSync(adminsFile, JSON.stringify(admins, null, 2));
}

module.exports.run = async ({ args, reply }) => {
  // args example: ['add', '123456789']
  if (args.length < 2) {
    return reply('Usage: update <add|remove> <uid>');
  }

  const action = args[0].toLowerCase();
  const uid = args[1];

  if (!uid.match(/^\d+$/)) {
    return reply('Invalid UID format. UID should be numeric.');
  }

  let admins = loadAdmins();

  if (action === 'add') {
    if (admins.includes(uid)) {
      return reply(`UID ${uid} is already an admin.`);
    }
    admins.push(uid);
    saveAdmins(admins);
    return reply(`Successfully added UID ${uid} as admin.`);
  } else if (action === 'remove') {
    if (!admins.includes(uid)) {
      return reply(`UID ${uid} is not an admin.`);
    }
    admins = admins.filter(id => id !== uid);
    saveAdmins(admins);
    return reply(`Successfully removed UID ${uid} from admins.`);
  } else {
    return reply('Invalid action. Use "add" or "remove".');
  }
};
