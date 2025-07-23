const fs = require('fs');
const path = require('path');
const protectionFile = path.resolve(__dirname, 'protection.json');

const admins = ['61577040643519', '61575137262643'];

function isProtectionOn() {
  try {
    const data = fs.readFileSync(protectionFile, 'utf-8');
    const json = JSON.parse(data);
    return json.enabled === true;
  } catch {
    return false;
  }
}

function canUseCommand(userID) {
  if (!isProtectionOn()) return true; // protection off, all can use
  return admins.includes(userID);     // protection on, only admins allowed
}

module.exports = {
  isProtectionOn,
  canUseCommand,
  admins
};
