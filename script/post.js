module.exports.config = {
  name: 'post',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['feed', 'publish', 'like'],
  description: 'Post content, view feed, and like posts to earn coins',
  usage: 'post [your message] | like [post number]',
  credits: 'OpenAI'
};

const userPosts = [];

module.exports.run = async function({ api, event, args, Users }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  const command = args[0] ? args[0].toLowerCase() : '';
  const content = args.slice(1).join(' ');

  // LIKE command handler
  if (command === 'like') {
    const postIndex = parseInt(content) - 1;
    if (isNaN(postIndex) || postIndex < 0 || postIndex >= userPosts.length) {
      return api.sendMessage('❌ Invalid post number. Use `post` to see available posts.', threadID, messageID);
    }
    userPosts[postIndex].likes++;
    userPosts[postIndex].coins += 5; // reward coins
    return api.sendMessage(`❤️ You liked post #${postIndex + 1}.\n🎉 ${userPosts[postIndex].author} earned 5 coins!`, threadID, messageID);
  }

  // If no content or just 'post' → show feed
  if (!command || command === 'post') {
    // If only 'post' without message
    if (!content && command === 'post') {
      if (userPosts.length === 0) {
        return api.sendMessage('📰 No posts yet! Be the first to post by typing:\npost your message', threadID, messageID);
      }
      let feed = '📰 Community Feed:\n\n';
      userPosts.forEach((post, i) => {
        feed += `#${i + 1} 👤 ${post.author}\n"${post.content}"\n❤️ Likes: ${post.likes} | 💰 Coins: ${post.coins}\n\n`;
      });
      feed += '👍 To like a post, type:\nlike [post number]';
      return api.sendMessage(feed, threadID, messageID);
    }

    // Otherwise treat as new post content
    const userName = (await Users.getName(senderID)) || 'User';
    const postContent = command === 'post' ? content : args.join(' ');
    if (!postContent) {
      return api.sendMessage('❌ Please provide a message to post.\nExample: post Hello everyone!', threadID, messageID);
    }

    userPosts.push({
      author: userName,
      content: postContent,
      likes: 0,
      coins: 0,
      id: senderID
    });

    return api.sendMessage(`✅ Post created!\n📰 Type 'post' to see all posts.`, threadID, messageID);
  }

  // Unknown command or wrong usage
  return api.sendMessage('❌ Unknown command. Use:\n- post [message] to post\n- post to see feed\n- like [post number] to like a post', threadID, messageID);
};
