module.exports.config = {
  name: 'termsofservice',
  version: '1.0.0',
  hasPermission: 0,
  description: 'Displays Cassandra AI School Research Notes',
  usages: 'termsofservice',
  credits: 'ZeroMe Naval',
  cooldowns: 0,
  dependencies: {}
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  const tosMessage = `
📚 𝗖𝗮𝘀𝘀𝗮𝗻𝗱𝗿𝗮 𝗔𝗜 𝗦𝗰𝗵𝗼𝗼𝗹 𝗥𝗲𝘀𝗲𝗮𝗿𝗰𝗵 𝗡𝗼𝘁𝗲𝘀 🧠

🎓 𝗜𝗻𝘁𝗿𝗼𝗱𝘂𝗰𝘁𝗶𝗼𝗻:
Cassandra is an advanced AI designed to assist with 𝗮𝗹𝗹 𝘀𝘂𝗯𝗷𝗲𝗰𝘁𝘀 across various fields of study. Whether it's solving complex math problems, analyzing literature, or understanding scientific concepts, Cassandra is here to help! Simply 𝘁𝘆𝗽𝗲 "𝗖𝗮𝘀𝘀𝗮𝗻𝗱𝗿𝗮" when asking questions, and she’ll provide accurate and insightful answers.

👩‍💻 𝗢𝘄𝗻𝗲𝗿: ZeroMe Naval

💡 𝗞𝗲𝘆 𝗙𝗲𝗮𝘁𝘂𝗿𝗲𝘀:
1. 📘 𝗠𝘂𝗹𝘁𝗶𝗱𝗶𝘀𝗰𝗶𝗽𝗹𝗶𝗻𝗮𝗿𝘆 𝗘𝘅𝗽𝗲𝗿𝘁𝗶𝘀𝗲 – From math to literature
2. ⚡ 𝗤𝘂𝗶𝗰𝗸 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲𝘀 – Answers delivered in seconds
3. 😊 𝗨𝘀𝗲𝗿-𝗙𝗿𝗶𝗲𝗻𝗱𝗹𝘆 – Just type "Cassandra"
4. 🎨 𝗘𝗺𝗼𝗷𝗶 𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 – Learning made fun and visual!

📌 𝗘𝘅𝗮𝗺𝗽𝗹𝗲 𝗨𝘀𝗮𝗴𝗲:
👤 User: Cassandra, what is the Pythagorean theorem?  
🤖 Cassandra: 🧮 The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a² + b² = c²

🌟 𝗪𝗵𝘆 𝗖𝗮𝘀𝘀𝗮𝗻𝗱𝗿𝗮?
Cassandra is your go-to AI for 𝗮𝗰𝗰𝘂𝗿𝗮𝘁𝗲, 𝗿𝗲𝗹𝗶𝗮𝗯𝗹𝗲, 𝗮𝗻𝗱 𝗲𝗳𝗳𝗶𝗰𝗶𝗲𝗻𝘁 answers. She’s here to make learning easier and more enjoyable for students, researchers, and curious minds!

🔗 𝗔𝗹𝘄𝗮𝘆𝘀 𝗥𝗲𝗺𝗲𝗺𝗯𝗲𝗿:
Start your questions with "𝗖𝗮𝘀𝘀𝗮𝗻𝗱𝗿𝗮" and let the magic begin! 🚀

💬 𝗚𝗲𝘁 𝗦𝘁𝗮𝗿𝘁𝗲𝗱 𝗧𝗼𝗱𝗮𝘆!
Type "Cassandra" and ask away! ✨
  `;

  return api.sendMessage(tosMessage, threadID, messageID);
};
