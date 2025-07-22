module.exports.config = {
  name: 'groupsettings',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Admin-only command to access or change group chat settings',
  usage: 'groupsettings [option]',
  credits: 'OpenAI + You'
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;

  // Get group admin IDs for this thread
  const groupInfo = await api.getThreadInfo(threadID);
  const adminIDs = groupInfo.adminIDs.map(admin => admin.id);

  // Check if sender is admin
  if (!adminIDs.includes(senderID)) {
    return api.sendMessage('❌ Only group admins can use this command.', threadID, messageID);
  }

  // Admin access granted - proceed with settings options
  const subcmd = args[0]?.toLowerCase();

  switch (subcmd) {
    case 'view':
      return api.sendMessage(
        `✅ Group name: ${groupInfo.threadName}\n` +
        `👥 Members: ${groupInfo.participantIDs.length}\n` +
        `🛡️ Admins: ${adminIDs.length}`,
        threadID,
        messageID
      );

    case 'setname':
      const newName = args.slice(1).join(' ');
      if (!newName) return api.sendMessage('❌ Please provide a new group name.', threadID, messageID);

      await api.setTitle(newName, threadID);
      return api.sendMessage(`✅ Group name changed to "${newName}"`, threadID, messageID);

    // Add other group settings commands here

    default:
      return api.sendMessage(
        '⚙️ Group Settings Commands:\n' +
        ' - groupsettings view : Show group info\n' +
        ' - groupsettings setname [new name] : Change group name\n',
        threadID,
        messageID
      );
  }
};
