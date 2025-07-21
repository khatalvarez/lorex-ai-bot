const rules = []; // In-memory rules list

module.exports.config = {
  name: 'boxrule',
  version: '1.0.0',
  role: 0, // admin only
  hasPrefix: true,
  description: 'Add and remove group rules (limit 20)',
  usage: 'rules add <rule text> | rules remove <number|all> | rules list',
  credits: 'OpenAI'
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;

  // Replace with your actual admin IDs
  const admins = ['1234567890'];

  if (!admins.includes(senderID)) {
    return api.sendMessage('❌ You are not authorized to use this command.', threadID, messageID);
  }

  if (args.length === 0) {
    return api.sendMessage(
      '❌ Please specify a subcommand:\n' +
      '• rules add <rule text>\n' +
      '• rules remove <number|all>\n' +
      '• rules list',
      threadID,
      messageID
    );
  }

  const sub = args[0].toLowerCase();

  if (sub === 'add') {
    const ruleText = args.slice(1).join(' ').trim();
    if (!ruleText) {
      return api.sendMessage('❌ Please provide the text of the rule to add.', threadID, messageID);
    }

    if (rules.length >= 20) {
      return api.sendMessage('❌ Rules limit reached (20). Remove some rules before adding new ones.', threadID, messageID);
    }

    rules.push(ruleText);
    return api.sendMessage(`✅ Rule added. Total rules: ${rules.length}`, threadID, messageID);
  }

  if (sub === 'remove') {
    if (args.length < 2) {
      return api.sendMessage('❌ Provide rule number to remove or "all" to clear.', threadID, messageID);
    }

    const param = args[1].toLowerCase();

    if (param === 'all') {
      rules.length = 0;
      return api.sendMessage('✅ All rules have been removed.', threadID, messageID);
    }

    const index = parseInt(param);
    if (isNaN(index) || index < 1 || index > rules.length) {
      return api.sendMessage('❌ Invalid rule number.', threadID, messageID);
    }

    const removed = rules.splice(index - 1, 1);
    return api.sendMessage(`✅ Removed rule #${index}: "${removed[0]}"`, threadID, messageID);
  }

  if (sub === 'list') {
    if (rules.length === 0) {
      return api.sendMessage('⚠️ No rules set yet.', threadID, messageID);
    }
    let listMsg = '📜 Group Rules:\n';
    rules.forEach((r, i) => {
      listMsg += `${i + 1}. ${r}\n`;
    });
    return api.sendMessage(listMsg, threadID, messageID);
  }

  return api.sendMessage('❌ Unknown subcommand. Use add, remove, or list.', threadID, messageID);
};
