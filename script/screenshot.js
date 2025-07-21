const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'screenshot',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Take a screenshot of any website URL',
  usage: 'screenshot [url]',
  credits: 'OpenAI'
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const url = args[0];

  if (!url || !url.startsWith('http')) {
    return api.sendMessage('❌ Please provide a valid URL starting with http or https.\n\nUsage: screenshot https://example.com', threadID, messageID);
  }

  const filename = `screenshot-${Date.now()}.png`;
  const filepath = path.join(__dirname, filename);

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: filepath, fullPage: true });
    await browser.close();

    const stream = fs.createReadStream(filepath);
    api.sendMessage({ body: `📸 Screenshot of: ${url}`, attachment: stream }, threadID, async () => {
      // Delete file after sending
      fs.unlinkSync(filepath);
    }, messageID);

  } catch (err) {
    console.error('Screenshot error:', err);
    return api.sendMessage('❌ Failed to capture screenshot. Check the URL or try again later.', threadID, messageID);
  }
};
