module.exports.config = {
  name: "ping",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Check bot latency",
  commandCategory: "Utilities",
  cooldowns: 5,
};

module.exports.run = async ({ event, api }) => {
  const start = Date.now();
  return api.sendMessage("Pinging...", event.threadID, async (err, info) => {
    if (err) return console.error(err);
    const end = Date.now();
    const latency = end - start;
    return api.sendMessage(`Pong! Latency: ${latency}ms`, event.threadID, info.messageID);
  });
};
