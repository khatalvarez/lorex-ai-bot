const admins = ['1234567890']; // Replace with your admin IDs
let maintenanceMode = false;

module.exports.config = {
  name: 'replyspeed',
  version: '1.0.0',
  role: 1,
  hasPrefix: true,
  description: 'Check AI reply speed and toggle maintenance mode',
  usage: 'replyspeed [maintenance on|off]',
  credits: 'OpenAI'
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Admin-only maintenance toggle
  if (args[0] === 'maintenance') {
    if (!admins.includes(senderID)) {
      return api.sendMessage('❌ Only admins can toggle maintenance mode.', threadID, messageID);
    }
    if (args[1] === 'on') {
      maintenanceMode = true;
      return api.sendMessage('🛠️ Maintenance mode enabled. AI replies are now disabled.', threadID, messageID);
    }
    if (args[1] === 'off') {
      maintenanceMode = false;
      return api.sendMessage('✅ Maintenance mode disabled. AI replies are enabled.', threadID, messageID);
    }
    return api.sendMessage('❌ Usage: replyspeed maintenance [on|off]', threadID, messageID);
  }

  // If maintenance mode is ON, block AI replies
  if (maintenanceMode) {
    return api.sendMessage('🛑 AI is under maintenance right now. Please try again later.', threadID, messageID);
  }

  // Simulate measuring AI reply time
  const startTime = Date.now();

  // Simulate delay - replace with your real AI call timing
  const simulatedDelay = Math.floor(Math.random() * 5000); // 0-5 sec
  await new Promise(r => setTimeout(r, simulatedDelay));

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Convert delay to percentage speed (0ms=100%, 5000ms=0%)
  let speedPercent = Math.max(0, Math.min(100, Math.floor(100 - (duration / 50))));

  let statusEmoji = '';
  let statusText = '';

  if (speedPercent >= 90) {
    statusEmoji = '🟢';
    statusText = 'Normal (Few users)';
  } else if (speedPercent >= 50) {
    statusEmoji = '🟠';
    statusText = 'Busy (Moderate users)';
  } else {
    statusEmoji = '🔴';
    statusText = 'Slow (Many users)';
  }

  return api.sendMessage(
    `⏱️ AI Reply Speed: ${speedPercent}% ${statusEmoji}\nStatus: ${statusText}\nResponse Time: ${duration}ms`,
    threadID,
    messageID
  );
};
