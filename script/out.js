module.exports.config = {
  name: "out",
  version: "1.0.0",
  role: 1,
  hasPrefix: true,
  credits: "CHATGPT",
  description: "Bot leaves the thread",
  usages: "out",
  cooldowns: 10,

};

module.exports.run = async function({ api, event, args }) {
  try { 
  if (!args[0]) return api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
  if (!isNaN(args[0])) return api.removeUserFromGroup(api.getCurrentUserID(), args.join(" "));
    } catch (error) {
      api.sendMessage(error.message, event.threadID, event.messageID);
    }
};
