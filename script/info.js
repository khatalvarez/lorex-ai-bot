const si = require('systeminformation'); // Import systeminformation package
const os = require('os'); // Import OS module

module.exports.config = {
  name: 'info',
  version: '1.0.0',
  hasPermission: 0, // Public command
  usePrefix: true, // Uses prefix (e.g., `!info`)
  aliases: ['sysinfo', 'status', 'system'], // Aliases for the command
  description: 'Shows system information: RAM, CPU, and Uptime',
  usages: 'info',
  credits: 'CHATGPT',
  cooldowns: 5, // Set cooldown to 5 seconds
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  try {
    // Get RAM info
    const memory = await si.mem();
    const totalMemory = (memory.total / (1024 ** 3)).toFixed(2); // in GB
    const usedMemory = (memory.used / (1024 ** 3)).toFixed(2); // in GB
    const freeMemory = (memory.free / (1024 ** 3)).toFixed(2); // in GB

    // Get CPU info
    const cpu = await si.currentLoad();
    const cpuUsage = cpu.currentload.toFixed(2); // CPU usage percentage

    // Get Uptime
    const uptime = os.uptime(); // Get system uptime in seconds
    const formattedUptime = formatUptime(uptime);

    // Create the message
    const message = `
    🤖 **System Info**:

    🌟 **RAM Usage**:
    - Total: ${totalMemory} GB
    - Used: ${usedMemory} GB
    - Free: ${freeMemory} GB

    💻 **CPU Usage**: ${cpuUsage}%

    ⏳ **System Uptime**: ${formattedUptime}
    `;

    // Send the message to the user
    api.sendMessage(message, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage('❌ Unable to fetch system information. Please try again later.', event.threadID, event.messageID);
  }
};

// Helper function to format uptime in days, hours, minutes, and seconds
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days} days, ${hours} hours, ${minutes} minutes, ${secs} seconds`;
}
