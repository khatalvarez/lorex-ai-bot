const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
  name: 'uptime',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Shows how long the bot has been running (with image)',
  usage: 'uptime',
  credits: 'OpenAI',
};

const startTime = Date.now();

module.exports.run = async function({ api, event }) {
  const now = Date.now();
  const diff = now - startTime;

  // Convert milliseconds to days, hours, minutes, seconds
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Create Canvas
  const width = 600;
  const height = 250;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background color
  ctx.fillStyle = '#1e1e2f';
  ctx.fillRect(0, 0, width, height);

  // Add header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BOT UPTIME', width / 2, 60);

  // Draw a separator line
  ctx.strokeStyle = '#00bcd4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, 80);
  ctx.lineTo(width - 50, 80);
  ctx.stroke();

  // Uptime text
  ctx.fillStyle = '#00bcd4';
  ctx.font = '24px Sans-serif';
  ctx.fillText(`${days} day(s), ${hours} hour(s)`, width / 2, 130);
  ctx.fillText(`${minutes} minute(s), ${seconds} second(s)`, width / 2, 170);

  // Optional: small footer
  ctx.font = '16px Sans-serif';
  ctx.fillStyle = '#999999';
  ctx.fillText('Powered by OpenAI', width / 2, height - 30);

  // Convert canvas to buffer and send image
  const imageBuffer = canvas.toBuffer();

  return api.sendMessage(
    { attachment: imageBuffer },
    event.threadID,
    event.messageID
  );
};
