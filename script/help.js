const axios = require('axios');

module.exports.config = {
  name: 'help',
  version: '1.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['commands', 'info'],
  description: '📘 Display command list or command info',
  usage: 'help [page number | command name]',
  credits: 'ChatGPT'
};

const narutoImage = 'https://i.ibb.co/wWS3Jyp/naruto-help.jpg'; // direct Naruto image link

module.exports.run = async function({ api, event, args, enableCommands, Utils }) {
  const { threadID, messageID } = event;
  const input = args.join(' ').toLowerCase();
  const commands = enableCommands[0].commands;
  const eventCommands = enableCommands[1].handleEvent;
  const perPage = 20;

  // Helper: Get image buffer
  async function getImageBuffer(url) {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(res.data, 'utf-8');
    } catch {
      return null;
    }
  }

  // Helper: Send Help Page
  async function sendHelpPage(page = 1) {
    const total = commands.length;
    const totalPages = Math.ceil(total / perPage);

    if (page < 1 || page > totalPages) {
      return api.sendMessage(`❌ Invalid page. Only ${totalPages} pages exist.`, threadID, messageID);
    }

    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, total);

    const list = commands
      .slice(start, end)
      .map((cmd, i) => `${start + i + 1}. ${cmd}`)
      .join('\n');

    const eventList = eventCommands?.length
      ? eventCommands.map((e, i) => `${i + 1}. ${e}`).join('\n')
      : 'None';

    const msg = `🍥 Naruto Help Menu (Page ${page}/${totalPages}) 🍥\n\n📜 Commands:\n${list}\n\n🎯 Events:\n${eventList}\n\nℹ️ Type "help [command name]" for more info.`;

    return api.sendMessage({
      body: msg,
      attachment: await getImageBuffer(narutoImage)
    }, threadID, messageID);
  }

  // No input → Page 1
  if (!input) {
    return sendHelpPage(1);
  }

  // Page number
  if (!isNaN(input)) {
    return sendHelpPage(parseInt(input));
  }

  // Specific command
  const allCommands = [...Utils.commands.values()];
  const command = allCommands.find(cmd =>
    cmd.name.toLowerCase() === input || (cmd.aliases && cmd.aliases.includes(input))
  );

  if (command) {
    const {
      name,
      version,
      role,
      aliases = [],
      description = '',
      usage = '',
      credits = '',
      cooldown = 3,
      hasPrefix = true
    } = command;

    const roleMap = ['User', 'Admin', 'Thread Admin', 'Super Admin'];
    const roleStr = roleMap[role] || 'Unknown';

    const info = `🍥 Naruto Command Info 🍥\n\n🔹 Name: ${name}
🔸 Version: ${version}
🔸 Role: ${roleStr}
🔸 Aliases: ${aliases.join(', ') || 'None'}
🔸 Description: ${description}
🔸 Usage: ${usage}
🔸 Cooldown: ${cooldown}s
🔸 Requires Prefix: ${hasPrefix ? 'Yes' : 'No'}
🔸 Credits: ${credits}`;

    return api.sendMessage({
      body: info,
      attachment: await getImageBuffer(narutoImage)
    }, threadID, messageID);
  }

  return api.sendMessage(`❌ Command "${input}" not found. Type "help" to see available commands.`, threadID, messageID);
};
