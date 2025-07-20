module.exports.config = {
  name: 'rules',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['rule', 'gc_rules'],
  description: 'Show rules for Box 1 or Box 2 in group chat',
  usage: 'rules [box number]',
  credits: 'ChatGPT'
};

const boxRules = {
  1: [
    'No spamming.',
    'Be respectful to others.',
    'Use appropriate language.',
    'Follow the admin instructions.'
  ],
  2: [
    'Keep chats related to the topic.',
    'No sharing of personal info.',
    'No advertising or promotions.',
    'Report any suspicious activity.'
  ]
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const boxNumber = args[0];

  if (!boxNumber || !['1', '2'].includes(boxNumber)) {
    return api.sendMessage(
      `📋 Group Chat Rules\n\n` +
      `Please choose a box number to view the rules:\n` +
      `- rules 1 → Box 1 Rules\n` +
      `- rules 2 → Box 2 Rules`,
      threadID,
      messageID
    );
  }

  const rules = boxRules[boxNumber];
  let reply = `📦 Rules for Box ${boxNumber}:\n\n`;

  rules.forEach((rule, index) => {
    reply += `${index + 1}. ${rule}\n`;
  });

  api.sendMessage(reply, threadID, messageID);
};
