const axios = require('axios');

module.exports.config = {
  name: 'playvideo',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Search and play video via keyword (with Play button)',
  usage: 'playvideo [keywords]',
  credits: 'OpenAI'
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(' ');

  if (!query) {
    return api.sendMessage('❌ Please provide keywords to search for a video.\n\nUsage: playvideo [title]', threadID, messageID);
  }

  try {
    // Example using YouTube Search API (free endpoint from yt-api.js.org or replace with your own)
    const res = await axios.get(`https://yt-api.js.org/api/search?q=${encodeURIComponent(query)}`);
    const videos = res.data.items.filter(item => item.type === 'video');

    if (!videos || videos.length === 0) {
      return api.sendMessage('❌ No videos found for your search.', threadID, messageID);
    }

    const video = videos[0]; // Get first result
    const title = video.title;
    const url = `https://www.youtube.com/watch?v=${video.id}`;

    // Check if Messenger allows buttons (fallback if not)
    if (typeof api.sendMessage === 'function' && api.sendMessage.length >= 2) {
      return api.sendMessage({
        body: `🎬 Video Found: ${title}`,
        attachment: null,
        buttons: [
          {
            type: 'web_url',
            url: url,
            title: '▶️ Play Video'
          }
        ]
      }, threadID, messageID);
    } else {
      // Messenger fallback: just show the link
      return api.sendMessage(`🎬 Video Found: ${title}\n🔗 ${url}`, threadID, messageID);
    }

  } catch (err) {
    console.error(err);
    return api.sendMessage('❌ Error occurred while searching for the video.', threadID, messageID);
  }
};
