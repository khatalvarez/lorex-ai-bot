module.exports.config = {
  name: 'kick',
  version: '1.0.0',
  role: 1, // admin only
  hasPrefix: true,
  description: 'Kick a user by UID or Facebook profile link',
  usage: 'kick <UID or Facebook profile link>',
  credits: 'OpenAI'
};

function extractUID(input) {
  // If input is a full Facebook profile link, extract the UID or username
  // Facebook URLs can be like https://www.facebook.com/username or with ?id= numeric id
  try {
    const url = new URL(input);
    if (url.hostname.includes('facebook.com')) {
      // Check for id= in search params (numeric uid)
      if (url.searchParams.has('id')) {
        return url.searchParams.get('id');
      }
      // Otherwise take the pathname part (username)
      let path = url.pathname.replace(/\//g, '');
      return path || null;
    }
  } catch {
    // Not a URL, might be UID
    return input;
  }
  return null;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;

  // Admin IDs - replace with your admins
  const admins = ['1234567890'];

  if (!admins.includes(senderID)) {
    return api.sendMessage('❌ You are not authorized to use this command.', threadID, messageID);
  }

  if (args.length === 0) {
    return api.sendMessage('❌ Please provide a user UID or Facebook profile link to kick.', threadID, messageID);
  }

  const userInput = args[0];
  const uid = extractUID(userInput);

  if (!uid) {
    return api.sendMessage('❌ Could not extract UID from the input.', threadID, messageID);
  }

  try {
    await api.removeUserFromGroup(uid, threadID);
    return api.sendMessage(`✅ User ${uid} has been kicked from this group.`, threadID, messageID);
  } catch (error) {
    return api.sendMessage('❌ Failed to kick user. Maybe the UID is invalid or I lack permissions.', threadID, messageID);
  }
};
