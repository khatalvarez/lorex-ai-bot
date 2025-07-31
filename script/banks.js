module.exports.config = {
  name: 'banko',
  version: '4.9.8',
  hasPermission: 0,
  usePrefix: true,
  description: "Sistema ng banko at resort na may protection, feedback at rental house.",
  usages: "buy house/status/earning/protection/resort buy/collect/upgrade/feedback",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args, Users, Currencies }) {
  const { senderID, threadID } = event;
  const adminUID = '61577040643519';
  const userName = await Users.getName(senderID) || 'User';
  const subcmd = args[0] ? args[0].toLowerCase() : '';
  const now = Date.now();

  // Helper para box reply
  function replyBox(text, emoji = '💰') {
    return {
      body: `╔═══🎯 𝗕𝗮𝗻𝗸 𝗦𝘆𝘀𝘁𝗲𝗺 🎯═══\n║\n║ ${text.replace(/\n/g, '\n║ ')}\n║\n║ 📬 𝗖𝗼𝗻𝘁𝗮𝗰𝘁 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿: https://www.facebook.com/ZeromeNaval.61577040643519\n╚═══════════════════════`,
    };
  }

  // Load user data or set default
  let data = await Currencies.getData(senderID);
  if (!data) {
    data = {
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

  // Save user data helper
  async function saveData() {
    await Currencies.setData(senderID, data);
  }

  // Check if protection active
  function isProtectionActive() {
    return data.protectionExpire > now;
  }

  // Check if user can buy protection today
  function canBuyProtection() {
    const lastDay = new Date(data.lastProtectionDay).toDateString();
    const today = new Date(now).toDateString();
    return lastDay !== today;
  }

  // --- COMMANDS ---
  switch(subcmd) {
    case 'buy':
      if (args[1] === 'house') {
        if (data.money < 5000) return api.sendMessage(replyBox(`❌ Wala kang sapat na pera para bumili ng bahay. Kailangan mo ng 5,000 💵.`), threadID);
        data.money -= 5000;
        data.house = true;
        data.houseExpire = now + 30*24*60*60*1000;
        await saveData();
        return api.sendMessage(replyBox(`🏠 𝗡𝗮𝗯𝗶𝗹𝗶 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗯𝗮𝗵𝗮𝘆! Maaari kang kumita araw-araw ng 200 mula dito.`), threadID);
      }
      else if (args[1] === 'protection') {
        if (!canBuyProtection()) return api.sendMessage(replyBox(`❌ Limitado lang ang pagbili ng protection ng isang beses kada araw.`), threadID);
        if (data.money < 100) return api.sendMessage(replyBox(`❌ Kulang ang pera mo para bumili ng protection. Kailangan mo ng 100 💵.`), threadID);
        data.money -= 100;
        data.protectionExpire = now + 24*60*60*1000;
        data.lastProtectionDay = now;
        await saveData();

        // Send payment to admin
        let adminData = await Currencies.getData(adminUID) || { money: 0 };
        adminData.money = (adminData.money || 0) + 100;
        await Currencies.setData(adminUID, adminData);

        return api.sendMessage(replyBox(`🛡️ 𝗡𝗮𝗯𝗶𝗹𝗶 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗽𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻 𝗻𝗴 𝟮𝟰 𝗼𝗿𝗮𝘀! Aktibo ito hanggang ${new Date(data.protectionExpire).toLocaleString()}.`), threadID);
      }
      else if (args[1] === 'resort') {
        if (data.resort) return api.sendMessage(replyBox(`❌ May resort ka na. Pwede mong i-upgrade o kolektahin ang kita.`), threadID);
        if (data.money < 100) return api.sendMessage(replyBox(`❌ Kulang ang pera mo para bumili ng resort. Kailangan mo ng 100 💵.`), threadID);
        data.money -= 100;
        data.resort = true;
        data.resortUpgrade = 0;
        data.resortLastCollect = 0;
        await saveData();
        return api.sendMessage(replyBox(`🏝️ 𝗡𝗮𝗯𝗶𝗹𝗶 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗿𝗲𝘀𝗼𝗿𝘁! Maaari kang kumita araw-araw dito.`), threadID);
      }
      else {
        return api.sendMessage(replyBox(`❓ Hindi malinaw ang nais mong bilhin. Puwedeng house, protection, o resort.`), threadID);
      }
      break;

    case 'status':
      {
        const houseStatus = data.house ? `🏠 𝗕𝗮𝗵𝗮𝘆: May-ari, Expire sa ${new Date(data.houseExpire).toLocaleDateString()}` : '🏠 𝗕𝗮𝗵𝗮𝘆: Wala';
        const protectionStatus = isProtectionActive() ? `🛡️ 𝗣𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻: Aktibo hanggang ${new Date(data.protectionExpire).toLocaleString()}` : '🛡️ 𝗣𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻: Wala o expired';
        const resortStatus = data.resort ? `🏝️ 𝗥𝗲𝘀𝗼𝗿𝘁: May-ari, Upgrade level ${data.resortUpgrade}` : '🏝️ 𝗥𝗲𝘀𝗼𝗿𝘁: Wala';

        return api.sendMessage(replyBox(
          `𝗦𝘁𝗮𝘁𝘂𝘀 𝗻𝗴 𝗶𝘆𝗼𝗻𝗴 𝗯𝗮𝗻𝗸 𝗮𝗰𝗰𝗼𝘂𝗻𝘁:\n` +
          `💵 𝗣𝗲𝗿𝗮: ${data.money}\n` +
          `${houseStatus}\n` +
          `${protectionStatus}\n` +
          `${resortStatus}`
        ), threadID);
      }

    case 'earning':
      {
        if (!data.house) return api.sendMessage(replyBox(`❌ Wala kang bahay para pagkakitaan.`), threadID);
        const oneDay = 24*60*60*1000;
        if (!data.houseLastCollect || now - data.houseLastCollect >= oneDay) {
          data.money += 200;
          data.houseLastCollect = now;
          await saveData();
          return api.sendMessage(replyBox(`💰 𝗡𝗮𝗸𝗼𝗹𝗲𝗸𝘁𝗮 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝟮𝟬𝟬 mula sa iyong bahay.`), threadID);
        } else {
          return api.sendMessage(replyBox(`⏳ Nakolekta mo na ang renta para sa araw na ito. Subukan muli bukas.`), threadID);
        }
      }

    case 'resort':
      {
        const sub2 = args[1] ? args[1].toLowerCase() : '';
        if (!data.resort) return api.sendMessage(replyBox(`❌ Wala kang resort para dito.`), threadID);

        if (sub2 === 'collect' || sub2 === 'earn') {
          const oneDay = 24*60*60*1000;
          if (!data.resortLastCollect || now - data.resortLastCollect >= oneDay) {
            let earning = 300 + (data.resortUpgrade * 50);
            data.money += earning;
            data.resortLastCollect = now;
            await saveData();
            return api.sendMessage(replyBox(`💸 𝗡𝗮𝗸𝗼𝗹𝗲𝗸𝘁𝗮 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 ${earning} mula sa iyong resort.`), threadID);
          } else {
            return api.sendMessage(replyBox(`⏳ Nakolekta mo na ang kita para sa araw na ito. Subukan muli bukas.`), threadID);
          }
        }
        else if (sub2 === 'upgrade') {
          if (data.money < 100) return api.sendMessage(replyBox(`❌ Kulang ang pera mo para mag-upgrade ng resort. Kailangan mo ng 100 💵.`), threadID);
          data.money -= 100;
          data.resortUpgrade += 1;
          await saveData();
          return api.sendMessage(replyBox(`🔧 𝗡𝗮-𝘂𝗽𝗴𝗿𝗮𝗱𝗲 𝗺𝗼 𝗻𝗮 𝗮𝗻𝗴 𝗿𝗲𝘀𝗼𝗿𝘁 mo sa level ${data.resortUpgrade}! Mas malaki ang kita araw-araw.`), threadID);
        }
        else {
          return api.sendMessage(replyBox(`❓ Hindi malinaw ang nais mong gawin sa resort. Puwede kang gumamit ng "collect" o "upgrade".`), threadID);
        }
      }

    case 'feedback':
      {
        const feedbackMsg = args.slice(1).join(' ');
        if (!feedbackMsg) return api.sendMessage(replyBox(`❗ Pakilagay ang iyong feedback pagkatapos ng command. Halimbawa:\nbank feedback Maganda ang laro!`), threadID);

        const adminMsg =
          `📢 𝗙𝗲𝗲𝗱𝗯𝗮𝗰𝗸 𝗺𝘂𝗹𝗮 𝗸𝗮𝘆 ${userName} (ID: ${senderID}):\n\n` +
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
        `• bank buy house - Bumili ng bahay (5000 pera)\n` +
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
