module.exports.config = {
  name: 'help',
  version: '1.0.0',
  hasPermission: 0,
  description: 'GTP Casino Help Menu (3 Pages)',
  usages: 'help [1|2|3]',
  credits: 'Omega Team 📘',
  cooldowns: 0,
  dependencies: {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const page = args[0];

  let msg = '';

  switch (page) {
    case '1':
      msg = `📖 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 - 𝗣𝗔𝗚𝗘 𝟭

🧾 Registration & Login
📌 register [username] [123] – Create new user
📌 login [username] – Login to your account

🎮 Games to Earn Coins:
🎯 playGame [username] work1 – Win 800
🎯 playGame [username] work2 – Win 400
🎯 playGame [username] shootBallon – Win 400
🎯 playGame [username] spinWheel – Win 200
🥊 playGame [username] boxing – Win 500
💣 playGame [username] mines – Win 600
🎰 playGame [username] slots – Win 9000
🎲 lucky9 [username] – Win 500
🃏 baccrat [username] – Win 500

🎁 Bonuses:
🎁 claim [username] – Daily 500 Gift
🎫 voucher – Auto send free voucher times

Use: help 2 for more commands.
`;
      break;

    case '2':
      msg = `📖 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 - 𝗣𝗔𝗚𝗘 𝟮

🏦 Bank & Finance:
💰 bank register [123] – Create bank account
🔓 bank login [123] – Login to your bank
🏦 bank deposit [123] [amount]
💸 bank withdraw [123] [amount]
📊 bank balance [123]
📜 bank history [123]
💳 bank loan [123] – Get 900 coins auto
🔐 bank lock [123] – Lock protection
🔓 bank unlock [123]

📉 Withdraw limit: $600
🏅 Interest auto adds when checking balance

Use: help 3 for admin & resort tools.
`;
      break;

    case '3':
      msg = `📖 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 - 𝗣𝗔𝗚𝗘 𝟯

🏝️ Resort Commands:
🧹 resort clean [username] – Clean resort
⬆️ resort upgrade [username] – Upgrade level
💰 resort collect [username] – Earn resort income

👤 Profile Commands:
🔍 profile [username]
⏫ upgradeProfile [username] – Upgrade level up to 40

🛠️ Admin Tools (admin only):
🚧 accessControl [casino/games/loan/notifications/maintenance] [on/off]
🔧 gtp maintaince on/off
📣 sendnoti [msg]
📨 feedback [your msg]
🛡️ buy protect/premium [username]

📎 Developer:
🔗 facebook: https://www.facebook.com/haraamihan.25371

✔️ That's all! Use commands wisely.`;

      break;

    default:
      msg = `📘 Use one of the following:
➡️ help 1 – Basic & Games
➡️ help 2 – Bank & Loans
➡️ help 3 – Resort, Admin & More`;
  }

  return api.sendMessage(msg, threadID, messageID);
};
