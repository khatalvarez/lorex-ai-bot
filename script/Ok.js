module.exports.config = {
  name: 'privacy',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['privacypolicy', 'pp'],
  description: 'Displays the bot privacy policy',
  usage: 'privacy',
  credits: 'OpenAI',
};

module.exports.run = async function({ api, event }) {
  const privacyText = `
PRIVACY POLICY

1. Data Collection:
We do not collect or store any personal data from users.

2. Data Usage:
All data processed by the bot stays temporary and only in-memory during each session.

3. Third-Party Services:
The bot may use third-party APIs, but does not share your data with them beyond necessary API calls.

4. Security:
We implement best practices to ensure your data safety.

5. Contact:
For questions or concerns, please contact the bot developer.

Thank you for using our bot!
  `.trim();

  api.sendMessage(privacyText, event.threadID, event.messageID);
};
