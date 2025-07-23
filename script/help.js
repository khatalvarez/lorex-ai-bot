module.exports.config = {
  name: 'help',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Shows the help menu with commands',
  usages: 'help [page]',
  cooldowns: 3
};

const helpPages = [
  `📌 Help Page 1/12:
- hugot: Send a random broken hugot quote
- hugot2: More hugot quotes
- hugot3: Even more hugot quotes
- hugot4: Last set of hugot quotes`,

  `📌 Help Page 2/12:
- cassweather [location]: Shows weather forecast
- pokemon buy <name>: Buy a Pokémon
- pokemon fight: Battle with a Pokémon
- pokemon feed: Feed your Pokémon`,

  `📌 Help Page 3/12:
- garden buy seed <amount>: Buy seeds for your garden
- garden water: Water your garden
- garden harvest: Harvest crops
- garden status: Check garden status`,

  `📌 Help Page 4/12:
- casino balance: Check your casino balance
- casino transfer <@user> <amount>: Send money to friends
- casino loan <amount>: Take a loan
- casino daily: Claim daily bonuses`,

  `📌 Help Page 5/12:
- casino repay <amount>: Build your credit score
- casino savings <amount>: Grow your wealth safely
- casino interest: Calculate your earnings
- casino collect: Claim your interest rewards`,

  `📌 Help Page 6/12:
- casino work: Earn money through various jobs
- casino shop seed <amount>: Buy seed packages
- casino buy protection mpin <100>: Buy MPIN protection for $100 (goes to admin)
- bank history: View your transaction timeline`,

  `📌 Help Page 7/12:
- grow daily claim 500: Claim daily grow bonus
- buy people 100: Hire people to work your garden and earn
- grow balance: Check your grow balance
- grow status: See your garden status`,

  `📌 Help Page 8/12:
- pokemon balance: Check your Pokémon balance
- pokemon shop list: Show list of Pokémon available in the shop
- pokemon feed <pokemon_name>: Feed your Pokémon to keep them strong
- pokemon fight <opponent>: Challenge another Pokémon to battle`,

  `📌 Help Page 9/12:
- tagalog hugot: Get random Tagalog broken hugot quotes
- tagalog hugot2: More Tagalog hugot lines
- tagalog hugot3: Even more hugot lines
- tagalog hugot4: Final batch of hugot quotes`,

  `📌 Help Page 10/12:
- garden sell <amount>: Sell your harvest to earn money
- garden status: Check your current garden progress and balance
- garden water: Water your plants to grow faster
- garden harvest: Collect matured crops`,

  `📌 Help Page 11/12:
- contact owner: Shows the contact info of the bot owner
- report bug <message>: Report any issues or bugs
- invite bot: Get invite link to add the bot to your group
- info bot: Get info about the bot version and developer`,

  `📌 Help Page 12/12:
- contact owner: https://www.facebook.com/ZeromeNaval.61577040643519
- invite bot: https://www.facebook.com/profile.php?id=61577773967503
- report bug <message>: Send your bug report to the admin (UID: 61577040643519)`
];

module.exports.run = async function({ api, event, args }) {
  let page = 1;
  if (args.length > 0) {
    const parsed = parseInt(args[0]);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= helpPages.length) {
      page = parsed;
    }
  }

  const message = helpPages[page - 1];
  return api.sendMessage(message, event.threadID, event.messageID);
};

// Additional command for report bug forwarding to admin

module.exports.reportBug = async function({ api, event, args }) {
  const adminID = '61577040643519';
  const bugMessage = args.join(' ');
  if (!bugMessage) {
    return api.sendMessage('❌ Please provide a bug description.', event.threadID, event.messageID);
  }

  // Send confirmation to user
  await api.sendMessage('✅ Your bug report has been sent to the admin. Thank you!', event.threadID, event.messageID);

  // Forward bug report to admin
  const userName = event.senderName || 'User';
  const forwardMessage = 
    `🐞 New bug report from ${userName} (ID: ${event.senderID}):\n\n${bugMessage}`;

  return api.sendMessage(forwardMessage, adminID);
};
