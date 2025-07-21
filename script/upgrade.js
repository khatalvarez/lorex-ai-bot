const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, 'systemInfo.json');

module.exports.config = {
  name: 'upgrade',
  version: '1.0.0',
  description: 'Upgrade bot version',
};

module.exports.run = async ({ args, reply }) => {
  if (args.length < 1) {
    return reply('Usage: upgrade <new_version>');
  }

  const newVersion = args[0];

  const versionPattern = /^\d+\.\d+\.\d+$/;
  if (!versionPattern.test(newVersion)) {
    return reply('Invalid version format. Use: major.minor.patch (e.g. 2.0.0)');
  }

  fs.writeFileSync(versionFile, JSON.stringify({ version: newVersion }, null, 2));
  return reply(`✅ System successfully upgraded to version ${newVersion}`);
};
