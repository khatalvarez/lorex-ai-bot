const { Client } = require('node-fbchat');
const { getUser, updateUser } = require('./dataHandler');

const client = new Client();

client.on('message', async (msg) => {
  const uid = msg.senderID;
  const text = msg.body.trim();
  const user = getUser(uid);

  const send = (content) => client.sendMessage(content, uid);

  if (text === '!bank') {
    const activeProtection = user.protectionUntil > Date.now();
    return send(
      `📦 𝗕𝗔𝗡𝗞 𝗦𝗧𝗔𝗧𝗨𝗦 📦\n\n` +
      `💰 Pera: ₱${user.money.toLocaleString()}\n` +
      `🏠 Bahay: ${user.house ? "Meron ✅" : "Wala ❌"}\n` +
      `🛡️ Proteksyon: ${activeProtection ? "Active 🟢" : "Inactive 🔴"}\n` +
      (activeProtection ? `⏰ Expire: ${new Date(user.protectionUntil).toLocaleString()}\n` : '')
    );
  }

  if (text === '!buy protection') {
    const now = Date.now();

    if (user.lastProtectionBuy && now - user.lastProtectionBuy < 24 * 60 * 60 * 1000) {
      return send("❌ Maaari ka lang bumili ng proteksyon isang beses kada 24 oras.");
    }

    if (user.money < 100) {
      return send("❌ Kulang ang pera mo! Kailangan mo ng ₱100.");
    }

    user.money -= 100;
    user.protectionUntil = now + 24 * 60 * 60 * 1000; // +24 hours
    user.lastProtectionBuy = now;
    updateUser(uid, user);

    return send("✅ Nakabili ka ng 24h proteksyon 🛡️!");
  }

  if (text === '!buy house') {
    if (user.house) return send("🏠 May bahay ka na!");

    if (user.money < 2000) {
      return send("❌ Kailangan mo ng ₱2000 para bumili ng bahay.");
    }

    user.money -= 2000;
    user.house = true;
    updateUser(uid, user);

    return send("✅ Congratulations! Bumili ka ng bahay 🏠");
  }

  if (text.startsWith('!feedback ')) {
    const feedback = text.slice(10).trim();
    const adminUID = '61577040643519';
    client.sendMessage(`📩 Feedback mula sa UID ${uid}:\n\n${feedback}`, adminUID);
    return send("✅ Feedback naipadala. Maraming salamat!");
  }

  if (text === '!help') {
    return send(
      `📖 𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 📖\n\n` +
      `🔹 !bank – Tingnan ang status\n` +
      `🔹 !buy protection – Bumili ng proteksyon ₱100\n` +
      `🔹 !buy house – Bumili ng bahay ₱2000\n` +
      `🔹 !feedback <message> – Magpadala ng feedback sa admin\n\n` +
      `📞 Contact Developer: https://www.facebook.com/ZeromeNaval.61577040643519`
    );
  }
});

client.login({
  email: '09121170134',
  password: 'christian4004',
});
