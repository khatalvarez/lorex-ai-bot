module.exports.config = {
	name: "search",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "xivz",
	description: "Image search",
	usePrefix: true,
	commandCategory: "Search",
	usages: "[Text]",
	cooldowns: 0,
};

module.exports.run = async function({ api, event, args }) {
const axios = require("axios");
  const fs = require("fs-extra");
  const request = require("request");
	const keySearchs = args.join(" ");
	if (!keySearchs) {
		api.sendMessage("commands\n\nread/view <url>\nsearch <query>\nexmaple:asura search updater", event.threadID, event.messageID);
		return
	}
	else if (keySearchs.startsWith("read")) {
		const keySearch = keySearchs.split(" ")[1];
  const res = await axios.get(
    `https://asura.jemcarl.repl.co/asura-read?url=${keySearch}`);
  const data = res.data.imageUrls;
  const numberSearch = data.length;
  var num = 0;
  var imgData = [];
  for (var i = 0; i < numberSearch; i++) {
    let path = __dirname + `/cache/${(num += 1)}.jpg`;
    let getDown = (
      await axios.get(`${data[i]}`, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(path, Buffer.from(getDown, "utf-8"));
    imgData.push(fs.createReadStream(__dirname + `/cache/${num}.jpg`));
  }
  api.sendMessage(
    {
      attachment: imgData,
      body: numberSearch + "Search results for keyword: " + keySearch,
    },
    event.threadID,
    event.messageID
  );
  for (let ii = 1; ii < numberSearch; ii++) {
    fs.unlinkSync(__dirname + `/cache/${ii}.jpg`);
  }
		
	} else if (keySearchs.startsWith("search")) {
		const keySearch = keySearchs.split(" ")[1];
		const res = await axios.get(
			`https://asura.jemcarl.repl.co/asura-search?query=${keySearch}`
		);
		console.log(res.data.length)
		if (res.data.length == 0) {
			api.sendMessage("no results found or website refused", event.threadID, event.messageID);
			return
		}
		const item = res.data[0];

		let results = "";
		for (let i = 0; i < res.data.length; i++) {
			const item = res.data[i];
			const resu = `link: ${item.link}\nimage: ${item.image}\ntitle: ${item.title}\nchapter: ${item.chapter}\nratings: ${item.ratings}`;
			results = results + resu + "\n\n";
		}
		api.sendMessage(results, event.threadID, event.messageID);
	} else if (keySearchs.startsWith("view")) {
		const keySearch = keySearchs.split(" ")[1];
		const res = await axios.get(
			`https://asura.jemcarl.repl.co/asura-view?url=${keySearch}`
		);
		const res1 = JSON.parse(res.data);
		if (res1.lenght == 0) {
			api.sendMessage("no results found or website refused", event.threadID, event.messageID);
			return
		}
		let results = "";
		let count = 0;
		for (let i = 0; i < res1.length; i++) {
			const item = res1[i];
			const resu = `link: ${item.link}\nnum: ${item.num}\ndate: ${item.date}`;
			results = results + resu + "\n\n";
			if (count == 50) {
				api.sendMessage(results, event.threadID, event.messageID);
				count = 0;
				results = "";
			}
			count = count + 1;
		}
		api.sendMessage(results, event.threadID, event.messageID);
	}
};
	  
