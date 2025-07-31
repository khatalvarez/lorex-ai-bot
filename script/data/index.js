const { Client } = require('node-fbchat');
const { getUser, updateUser } = require('./dataHandler');
const AOI = require('aoi.js');

// Initialize AOI.js Bot instance (dummy, we use only commands from here)
const bot = new AOI.Bot({
  token: '', // Not used here, but required by AOI.js
  prefix: '!',
});

// Sample AOI.js command (bank status)
bot.command({
  name: 'bank',
  code: async (data) => {
    const uid = data.senderID;
    const user = getUser(uid);

    return `💰 Saldo mo: ${user.money} pesos.\n🏠 Bahay: ${user.house ? 'Meron' : 'Wala'}\n⏳ Protection active hanggang: ${user.protectionExpire > Date.now() ? new Date(user.protectionExpire).toLocaleString() : 'Wala'}`;
  }
});

// Sample AOI.js command (buy protection 100, lasts 24 hours)
bot.command({
  name: 'buy protection',
  code: async (data) => {
    const uid = data.senderID;
    const user = getUser(uid);

    const now = Date.now();
    if (user.lastProtectionBuy && (now - user.lastProtectionBuy) < 24 * 60 * 60 * 1000) {
      return '🚫 Maaari ka lang bumili ng protection isang beses lang kada araw.';
    }

    if (user.money < 100) return '❌ Kulang ang pera mo para bumili ng protection.';

    user.money -= 100;
    user.protectionExpire = now + (24 * 60 * 60 * 1000); // 24h
    user.lastProtectionBuy = now;

    updateUser(uid, user);

    return '✅ Bumili ka na ng protection na tatagal ng 24 oras.';
  }
});

// Facebook client
const client = new Client();

client.on('message', async (event) => {
  const senderID = event.senderID;
  const message = event.body?.toLowerCase() || '';

  // Map facebook sender to AOI.js data format
  const aoiData = {
    senderID,
    message,
  };

  // Parse command using AOI.js bot
  // AOI.js normally listens on Discord but here we manually run the command
  const prefix = '!';
  if (message.startsWith(prefix)) {
    const args = message.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift();

    const cmd = bot.commands.find((c) => c.name === cmdName || c.name === `${cmdName} ${args[0]}` || cmdName + ' ' + args[0] === c.name);
    if (!cmd) {
      client.sendMessage(`⚠️ Command hindi nakita. Subukan ang !bank or !buy protection`, senderID);
      return;
    }

    // Run command
    const reply = await cmd.code({
      senderID,
      message,
      args,
    });

    if (reply) {
      client.sendMessage(reply, senderID);
    }
  }
});

// Log in with your Facebook account credentials
client.login({
  email: 'YOUR_FACEBOOK_EMAIL',
  password: 'YOUR_FACEBOOK_PASSWORD',
});
