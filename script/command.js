module.exports.config = {
  name: 'casscmd',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Ask user details: name, image, anime',
  usage: 'help',
  credits: 'OpenAI + User'
};

const userStates = {}; // Memory for storing user inputs

const DEFAULT_IMAGE = 'https://i.ibb.co/8c7vR1C/anime-boy.jpg'; // Direct link from imgbb

module.exports.run = async function({ api, event }) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const message = event.body && event.body.trim();

  if (!userStates[senderID]) {
    userStates[senderID] = { step: 1 };
    return api.sendMessage('👋 Hi there! What is your name?', threadID);
  }

  const state = userStates[senderID];

  if (state.step === 1) {
    if (!message) return api.sendMessage('❓ Please enter your name.', threadID);
    state.name = message;
    state.step = 2;
    return api.sendMessage('🖼️ Nice! Now please send me an image URL of yourself (or just press enter to use default).', threadID);
  }

  if (state.step === 2) {
    // Use default if no URL given
    if (!message || !message.startsWith('http')) {
      state.image = DEFAULT_IMAGE;
    } else {
      state.image = message;
    }
    state.step = 3;
    return api.sendMessage('✨ Last question! What is your favorite anime?', threadID);
  }

  if (state.step === 3) {
    if (!message) return api.sendMessage('🎌 Please type your favorite anime.', threadID);
    state.anime = message;

    const summary = 
      `✅ Thank you for your info!\n\n` +
      `👤 Name: ${state.name}\n` +
      `🖼️ Image: ${state.image}\n` +
      `🎌 Favorite Anime: ${state.anime}\n\n` +
      `Have a great day, ${state.name}! 🌸`;

    const imageAttachment = {
      body: summary,
      attachment: await global.utils.getStreamFromURL(state.image)
    };

    delete userStates[senderID];
    return api.sendMessage(imageAttachment, threadID);
  }
};
