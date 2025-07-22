const axios = require('axios'); // Import axios for HTTP requests

module.exports.config = {
  name: 'translate',
  version: '1.0.0',
  hasPermission: 0, // Public command
  usePrefix: true, // Uses prefix (e.g., `!translate`)
  aliases: ['trans', 'tr'], // Aliases for the command
  description: 'Translates text between Tagalog and English',
  usages: 'translate [language] [text]',
  credits: 'CHATGPT',
  cooldowns: 5, // Set cooldown to 5 seconds
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  // Check if the user has provided both language and text
  if (args.length < 2) {
    return api.sendMessage("❌ Please provide both a language (tagalog/english) and the text to translate.", event.threadID, event.messageID);
  }

  // Extract the language and text
  const language = args[0].toLowerCase();
  const text = args.slice(1).join(' ');

  // Validate language input
  if (language !== 'tagalog' && language !== 'english') {
    return api.sendMessage("❌ Invalid language. Use 'tagalog' or 'english' as the language.", event.threadID, event.messageID);
  }

  try {
    // Define the target language based on user input
    const targetLanguage = language === 'tagalog' ? 'tl' : 'en';
    
    // Make the translation request using LibreTranslate API
    const response = await axios.post('https://libretranslate.de/translate', {
      q: text,
      source: language === 'tagalog' ? 'tl' : 'en', // Source language
      target: targetLanguage, // Target language
      format: 'text'
    });

    // Send the translated text back to the user
    const translatedText = response.data.translatedText;
    api.sendMessage(`🔄 Translated Text: \n${translatedText}`, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage('❌ Failed to translate the text. Please try again later.', event.threadID, event.messageID);
  }
};
