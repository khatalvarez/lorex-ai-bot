module.exports.config = {
    name: "cassjourney",
    version: "1.0.0",
    role: 0,
    credits: "Chatgpt",
    description: "Generate imae base sa prompy",
    hasPrefix: false,
    aliases: ["journey"],
    usage: "[openjourney <prompt>]",
    cooldown: 0
};

const chilli = require("axios");
const pogi = require("fs");
const pogimochill = require("path");

module.exports.run = async function({ api, event, args }) {
    try {
        const cutemochill = args.join(" ");
        if (!cutemochill) {
            api.sendMessage("Usage: openjourney <prompt>", event.threadID);
            return;
        }

        api.sendMessage("🎨 | Generating image, please wait...", event.threadID);

        const chilliResponse = await chilli.get(`https://joshweb.click/openjourney?prompt=${encodeURIComponent(cutemochill)}`, {
            responseType: 'arraybuffer'
        });

        const cutemochillPath = pogimochill.join(__dirname, `/cache/generated_image.png`);
        pogi.writeFileSync(cutemochillPath, Buffer.from(chilliResponse.data, 'binary'));

        api.sendMessage({
            body: "Generated image:",
            attachment: pogi.createReadStream(cutemochillPath)
        }, event.threadID, () => {
            pogi.unlinkSync(cutemochillPath);
        });
    } catch (error) {
        console.error('Error:', error);
        api.sendMessage("An error occurred while processing the request.", event.threadID);
    }
};
