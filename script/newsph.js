const axios = require('axios');

module.exports.config = {
  name: 'newsph',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Get the latest news headlines from the Philippines',
  usages: 'newsph',
  cooldowns: 5,
  dependencies: {
    axios: ''
  }
};

module.exports.run = async function ({ api, event }) {
  // Your API key inserted here
  const apiKey = '05358f837515462181cf6398cb3b6f3f';

  const url = `https://newsapi.org/v2/top-headlines?country=ph&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const articles = response.data.articles;

    if (!articles || articles.length === 0) {
      return api.sendMessage('❌ No news found.', event.threadID, event.messageID);
    }

    // Show top 5 headlines
    const topNews = articles.slice(0, 5);
    let message = '📰 Latest News from the Philippines:\n\n';

    topNews.forEach((article, i) => {
      message += `${i + 1}. ${article.title}\n`;
      if (article.url) message += `🔗 ${article.url}\n`;
      message += '\n';
    });

    api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage('❌ Failed to fetch news.', event.threadID, event.messageID);
  }
};
