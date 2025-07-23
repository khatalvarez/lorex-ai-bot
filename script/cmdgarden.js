module.exports.config = {
  name: 'cmdgarden',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: "Grow a garden with seeds, harvest, workers, and more",
  usages: "garden help [1-4]",
  cooldowns: 0
};

const helpPages = [
  `
╔═══════════════╗
║    𝐆𝐀𝐑𝐃𝐄𝐍 𝐇𝐄𝐋𝐏 1   ║
╚═══════════════╝

🌻 balance
Check your money, seeds, plants, harvest, and workers.

🌻 buyseed
Buy 100 seeds for $100.
  `,
  `
╔═══════════════╗
║    𝐆𝐀𝐑𝐃𝐄𝐍 𝐇𝐄𝐋𝐏 2   ║
╚═══════════════╝

🌻 grow
Plant 1 seed (5 min grow cooldown).

🌻 water
Water your plants.

🌻 harvest
Harvest plants after they have grown.
  `,
  `
╔═══════════════╗
║    𝐆𝐀𝐑𝐃𝐄𝐍 𝐇𝐄𝐋𝐏 3   ║
╚═══════════════╝

🌻 sell
Sell your harvested crops for money.

🌻 daily
Claim daily $500 bonus.

🌻 hire
Hire a worker for $100.
  `,
  `
╔═══════════════╗
║    𝐆𝐀𝐑𝐃𝐄𝐍 𝐇𝐄𝐋𝐏 4   ║
╚═══════════════╝

🌻 work
Let your workers earn money for you.

🌻 status
Show your garden status and balances.

🌻 help
Show this help message.
  `
];

module.exports.run = async function({ api, event, args }) {
  let page = 1;
  if (args[0]) {
    const parsed = parseInt(args[0], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= helpPages.length) {
      page = parsed;
    }
  }

  return api.sendMessage(helpPages[page - 1].trim(), event.threadID, event.messageID);
};
