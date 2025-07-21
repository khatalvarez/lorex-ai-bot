const https = require('https');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'install',
  version: '1.0',
  role: 0,
  description: 'Install a script from Pastebin and display commands',
  usage: 'install [pastebin_raw_url]',
  cooldown: 5,
  aliases: []
};

const COMMANDS = [
  'register [password]',
  'login [password]',
  'logout',
  'balance',
  'play',
  'daily',
  'loan',
  'loan-approve',
  'games [page]',
  'buy-protect [password]',
  'settings',
  'tos',
  'support',
  'feedback [message]'
];

function downloadScript(url, dest, callback) {
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      callback(new Error(`Failed to download script: Status code ${res.statusCode}`));
      return;
    }
    const fileStream = fs.createWriteStream(dest);
    res.pipe(fileStream);
    fileStream.on('finish', () => fileStream.close(callback));
  }).on('error', (err) => {
    fs.unlink(dest, () => {}); // Delete partial file if error
    callback(err);
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args.length === 0) {
    return api.sendMessage('❌ Please provide a Pastebin raw URL.', threadID, messageID);
  }

  const pastebinUrl = args[0];
  if (!pastebinUrl.startsWith('https://pastebin.com/raw/')) {
    return api.sendMessage('❌ Invalid Pastebin raw URL. Make sure it starts with https://pastebin.com/raw/', threadID, messageID);
  }

  const savePath = path.join(__dirname, 'script.js');

  api.sendMessage('⬇️ Downloading script...', threadID, messageID);

  downloadScript(pastebinUrl, savePath, (err) => {
    if (err) {
      api.sendMessage(`❌ Download failed: ${err.message}`, threadID, messageID);
      return;
    }
    let reply = `✅ Script downloaded and saved as script.js\n\n📋 Available Commands:\n`;
    for (const cmd of COMMANDS) {
      reply += `• ${cmd}\n`;
    }
    api.sendMessage(reply, threadID, messageID);
  });
};
