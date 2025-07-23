module.exports.config = {
  name: "speedsignal",
  version: "1.0.0",
  hasPermssion: 2, // admin only
  credits: "ChatGPT",
  description: "Send speed signal message to all groups with emoji and latency",
  commandCategory: "Utilities",
  cooldowns: 10,
};

module.exports.run = async ({ api, event }) => {
  try {
    // Get up to 100 threads
    const allThreads = await api.getThreadList(100, null, ["INBOX"]);
    // Filter only group threads
    const groupThreads = allThreads.filter(thread => thread.isGroup);

    if (groupThreads.length === 0) {
      return api.sendMessage("No groups found to send messages!", event.threadID);
    }

    let count = 0;
    const results = [];

    for (const group of groupThreads) {
      count++;
      const start = Date.now();

      // Send a test message (optional)
      await api.sendMessage("⏳ Measuring response time...", group.threadID);

      const latency = Date.now() - start;

      // Choose emoji based on latency (ms)
      // 🔵 = fast (<100ms), ⏺️ = medium (100-300ms), 🟢 = slow (>300ms)
      let emoji = "🟢";
      if (latency < 100) emoji = "🔵";
      else if (latency >= 100 && latency <= 300) emoji = "⏺️";

      const msg = `${emoji} Speedsignal for Group #${count}\n→ Response time: ${latency} ms`;

      // Send final message with emoji and latency
      await api.sendMessage(msg, group.threadID);

      results.push(`Group #${count}: ${latency}ms ${emoji}`);
    }

    // Send summary message to command sender
    return api.sendMessage(`Speedsignal sent to ${groupThreads.length} groups.\n\n` + results.join("\n"), event.threadID);
  } catch (error) {
    console.error(error);
    return api.sendMessage("An error occurred while sending speedsignal!", event.threadID);
  }
};
