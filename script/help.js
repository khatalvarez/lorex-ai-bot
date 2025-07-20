module.exports.config = {
  name: 'help',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Show help message with auto bold Unicode font',
  usage: 'help',
  credits: 'ChatGPT'
};

// Helper: convert normal text to bold Unicode letters (basic A-Z, a-z, 0-9)
function toBold(text) {
  const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bold = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵';
  return text.split('').map(c => {
    const index = normal.indexOf(c);
    return index !== -1 ? bold[index] : c;
  }).join('');
}

const helpText = `
${toBold('🤖 Bot Help Menu')}

${toBold('Commands:')}

- ${toBold('games [guess|riddle|roll|rps] [input]')}
  Play fun games like guess number, riddles, roll dice, or rock-paper-scissors.

- ${toBold('garden')}
  Manage your virtual garden 🌱: plant seeds, water plants, harvest fruits.

- ${toBold('system')}
  Show system info like RAM, CPU, uptime.

- ${toBold('help')}
  Show this help message.

${toBold('Usage:')}  
Type the command prefix + command name to run a command.  
Example: ${toBold('!games guess 7')}

Enjoy! 🎉
`;

module.exports.run = async function({ api, event }) {
  return api.sendMessage(helpText, event.threadID, event.messageID);
};
