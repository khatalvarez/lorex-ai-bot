const fs = require('fs');
const path = './users.json';

// Load data mula sa file
function loadData() {
  try {
    if (!fs.existsSync(path)) fs.writeFileSync(path, '{}', 'utf8');
    const raw = fs.readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading users.json:', e);
    return {};
  }
}

// Save data sa file
function saveData(data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving users.json:', e);
  }
}

module.exports.config = {
  name: 'bank',
  version: '4.9.8',
  hasPermission: 0,
  usePrefix: true,
  description: "Sistema ng banko at resort na may protection, feedback at rental house.",
  usages: "buy house/status/earning/protection/resort buy/collect/upgrade/feedback",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID } = event;
  const adminUID = '61577040643519';
  const userName = senderID; // Kung gusto mo ng actual name, kailangan mo pa ng ibang paraan to get it

  // Helper: reply box style message
  function replyBox(text) {
    return {
      body:
`╔═══🎯 𝗕𝗮𝗻𝗸 𝗦𝘆𝘀𝘁𝗲𝗺 🎯═══
║
║ ${text.replace(/\n/g, '\n║ ')}
║
║ 📬 𝗖𝗼𝗻𝘁𝗮𝗰𝘁 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿:
║ https://www.facebook.com/ZeromeNaval.61577040643519
╚═══════════════════════`
    };
  }

  const data = loadData();

  // Siguraduhin may user data
  if (!data[senderID]) {
    data[senderID] = {
      money: 0,
      house: false,
      houseExpire: 0,
      houseLastCollect: 0,
      protectionExpire: 0,
      lastProtectionDay: 0,
      resort: false,
      resortUpgrade: 0,
      resortLastCollect: 0
    };
  }

  // Siguraduhin may admin data
  if (!data[adminUID]) {
    data[adminUID] = { money: 0 };
  }

  const user = data[senderID];
  const now = Date.now();

  function isProtectionActive() {
    return user.protectionExpire > now;
  }

  function canBuyProtection() {
    if (!user.lastProtectionDay) return true;
    const lastDay = new Date(user.lastProtectionDay).toDateString();
    const today = new Date(now).toDateString();
    return lastDay !== today;
  }

  const subcmd = args[0] ? args[0].toLowerCase() : '';

  switch (subcmd) {
    case 'buy': {
      const item = args[1] ? args[1].toLowerCase() : '';
      if (item === 'house') {
        if (user.money < 5000) return api.sendMessage(replyBox(`❌ Wala kang sapat na pera para bumili ng bahay. Kailangan mo ng 5,000 💵.`), threadID);
        user.money -= 5000;
        user.house = true;
        user.houseExpire = now + 30 * 24 * 60 * 60 * 1000; // 30 days
        saveData(data);
        return api.sendMessage(replyBox(`🏠 𝗡𝗮𝗯𝗶𝗹𝗶 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗯𝗮𝗵𝗮𝘆! Maaari kang kumita araw-araw ng 200 mula dito.`), threadID);
      }
      else if (item === 'protection') {
        if (!canBuyProtection()) return api.sendMessage(replyBox(`❌ Limitado lang ang pagbili ng protection ng isang beses kada araw.`), threadID);
        if (user.money < 100) return api.sendMessage(replyBox(`❌ Kulang ang pera mo para bumili ng protection. Kailangan mo ng 100 💵.`), threadID);
        user.money -= 100;
        user.protectionExpire = now + 24 * 60 * 60 * 1000; // 24 hours
        user.lastProtectionDay = now;

        // Bayad papunta sa admin
        data[adminUID].money = (data[adminUID].money || 0) + 100;

        saveData(data);
        return api.sendMessage(replyBox(`🛡️ 𝗡𝗮𝗯𝗶𝗹𝗶 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗽𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻 𝗻𝗴 𝟮𝟰 𝗼𝗿𝗮𝘀! Aktibo ito hanggang ${new Date(user.protectionExpire).toLocaleString()}.`), threadID);
      }
      else if (item === 'resort') {
        if (user.resort) return api.sendMessage(replyBox(`❌ May resort ka na. Pwede mong i-upgrade o kolektahin ang kita.`), threadID);
        if (user.money < 100) return api.sendMessage(replyBox(`❌ Kulang ang pera mo para bumili ng resort. Kailangan mo ng 100 💵.`), threadID);
        user.money -= 100;
        user.resort = true;
        user.resortUpgrade = 0;
        user.resortLastCollect = 0;
        saveData(data);
        return api.sendMessage(replyBox(`🏝️ 𝗡𝗮𝗯𝗶𝗹𝗶 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗿𝗲𝘀𝗼𝗿𝘁! Maaari kang kumita araw-araw dito.`), threadID);
      }
      else {
        return api.sendMessage(replyBox(`❓ Hindi malinaw ang nais mong bilhin. Puwedeng house, protection, o resort.`), threadID);
      }
      break;
    }

    case 'status': {
      const houseStatus = user.house ? `🏠 𝗕𝗮𝗵𝗮𝘆: May-ari, Expire sa ${new Date(user.houseExpire).toLocaleDateString()}` : '🏠 𝗕𝗮𝗵𝗮𝘆: Wala';
      const protectionStatus = isProtectionActive() ? `🛡️ 𝗣𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻: Aktibo hanggang ${new Date(user.protectionExpire).toLocaleString()}` : '🛡️ 𝗣𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻: Wala o expired';
      const resortStatus = user.resort ? `🏝️ 𝗥𝗲𝘀𝗼𝗿𝘁: May-ari, Upgrade level ${user.resortUpgrade}` : '🏝️ 𝗥𝗲𝘀𝗼𝗿𝘁: Wala';

      return api.sendMessage(replyBox(
        `𝗦𝘁𝗮𝘁𝘂𝘀 𝗻𝗴 𝗶𝘆𝗼𝗻𝗴 𝗯𝗮𝗻𝗸 𝗮𝗰𝗰𝗼𝘂𝗻𝘁:\n` +
        `💵 𝗣𝗲𝗿𝗮: ${user.money}\n` +
        `${houseStatus}\n` +
        `${protectionStatus}\n` +
        `${resortStatus}`
      ), threadID);
    }

    case 'earning': {
      if (!user.house) return api.sendMessage(replyBox(`❌ Wala kang bahay para pagkakitaan.`), threadID);
      const oneDay = 24 * 60 * 60 * 1000;
      if (!user.houseLastCollect || now - user.houseLastCollect >= oneDay) {
        user.money += 200;
        user.houseLastCollect = now;
        saveData(data);
        return api.sendMessage(replyBox(`💰 𝗡𝗮𝗸𝗼𝗹𝗲𝗸𝘁𝗮 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝟮𝟬𝟬 mula sa iyong bahay.`), threadID);
      } else {
        return api.sendMessage(replyBox(`⏳ Nakolekta mo na ang renta para sa araw na ito. Subukan muli bukas.`), threadID);
      }
    }

    case 'resort': {
      const sub2 = args[1] ? args[1].toLowerCase() : '';
      if (!user.resort) return api.sendMessage(replyBox(`❌ Wala kang resort para dito.`), threadID);

      if (sub2 === 'collect' || sub2 === 'earn') {
        const oneDay = 24 * 60 * 60 * 1000;
        if (!user.resortLastCollect || now - user.resortLastCollect >= oneDay) {
          let earning = 300 + (user.resortUpgrade * 50);
          user.money += earning;
          user.resortLastCollect = now;
          saveData(data);
          return api.sendMessage(replyBox(`💸 𝗡𝗮𝗸𝗼𝗹𝗲𝗸𝘁𝗮 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 ${earning} mula sa iyong resort.`), threadID);
        } else {
          return api.sendMessage(replyBox(`⏳ Nakolekta mo na ang kita para sa araw na ito. Subukan muli bukas.`), threadID);
        }
      }
      else if (sub2 === 'upgrade') {
        if (user.money < 100) return api.sendMessage(replyBox(`❌ Kulang ang pera mo para mag-upgrade ng resort. Kailangan mo ng 100 💵.`), threadID);
        user.money -= 100;
        user.resortUpgrade += 1;
        saveData(data);
        return api.sendMessage(replyBox(`🔧 𝗡𝗮-𝘂𝗽𝗴𝗿𝗮𝗱𝗲 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗿𝗲𝘀𝗼𝗿𝘁 mo sa level ${user.resortUpgrade}! Mas malaki ang kita araw-araw.`), threadID);
      }
      else {
        return api.sendMessage(replyBox(`❓ Hindi malinaw ang nais mong gawin sa resort. Puwede kang gumamit ng "collect" o "upgrade".`), threadID);
      }
      break;
    }

    case 'feedback': {
      const feedbackMsg = args.slice(1).join(' ');
      if (!feedbackMsg) return api.sendMessage(replyBox(`❗ Pakilagay ang iyong feedback pagkatapos ng command. Halimbawa:\nbank feedback Maganda ang laro!`), threadID);

      const adminMsg =
        `📢 𝗙𝗲𝗲𝗱𝗯𝗮𝗰𝗸 mula kay ${userName} (ID: ${senderID}):\n\n` +
        feedbackMsg;

      try {
        await api.sendMessage(adminMsg, adminUID);
        return api.sendMessage(replyBox(`✅ Natanggap na ang iyong feedback. Maraming salamat!`), threadID);
      }
      catch (err) {
        return api.sendMessage(replyBox(`❌ May problema sa pagpapadala ng feedback. Subukan muli mamaya.`), threadID);
      }
    }

    default:
      return api.sendMessage(replyBox(
        `📜 𝗠𝗮𝗴𝗮 𝗽𝘄𝗲𝗱𝗲𝗻𝗴 𝗴𝗮𝗺𝗶𝘁𝗶𝗻 𝗻𝗮 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀:\n` +
        `• bank buy house - Bumili ng bahay (5,000 pera)\n` +
        `• bank buy protection - Bumili ng protection (100 pera, 1x/day, 24h)\n` +
        `• bank buy resort - Bumili ng resort (100 pera)\n` +
        `• bank resort collect/earn - Kolektahin kita mula resort\n` +
        `• bank resort upgrade - Mag-upgrade ng resort (100 pera)\n` +
        `• bank status - Tingnan ang status ng iyong bank account\n` +
        `• bank earning - Kolektahin kita mula bahay (200 araw-araw)\n` +
        `• bank feedback <message> - Magbigay ng feedback sa developer`
      ), threadID);
  }
};
