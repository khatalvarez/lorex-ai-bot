module.exports.config = {
  name: "novacommand",
  version: "1.0.2",
  permission: 0,
  credits: "owner",
  description: "beginner's guide",
  prefix: true,
  premium: false,
  category: "guide",
  usages: "[Shows Commands]",
  cooldowns: 5,
};

module.exports.languages = {
  english: {
    moduleInfo:
      "%1\n%2\n\nusage : %3\ncategory : %4\nwaiting time : %5 seconds(s)\npermission : %6\n\nmodule code by %7.",
    helpList: `there are %1 commands and %2 categories`,
    user: "user",
    adminGroup: "group admin",
    adminBot: "bot admin",
  },
  bangla: {
    moduleInfo:
      "%1\n%2\n\nusage : %3\ncategory : %4\nwaiting time : %5 seconds(s)\npermission : %6\n\nmodule code by %7.",
    helpList: `there are %1 commands and %2 categories`,
    user: "user",
    adminGroup: "group admin",
    adminBot: "bot admin",
  },
};

module.exports.handleEvent = function ({ api, event, getText, botname, prefix }) {
  const { commands } = global.client;
  const { threadID, messageID, body } = event;

  if (!body || typeof body === "undefined" || body.indexOf("help") !== 0)
    return;
  const splitBody = body.slice(body.indexOf("help")).trim().split(/\s+/);
  if (splitBody.length === 1 || !commands.has(splitBody[1].toLowerCase()))
    return;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const command = commands.get(splitBody[1].toLowerCase());
  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      command.config.description,
      `${prefix}${command.config.name} ${
        command.config.usages ? command.config.usages : ""
      }`,
      command.config.category,
      command.config.cooldowns,
      command.config.permission === 0
        ? getText("user")
        : command.config.permission === 1
        ? getText("adminGroup")
        : getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

module.exports.run = async function ({
  api,
  event,
  args,
  getText,
  botname,
  prefix,
}) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const command = commands.get((args[0] || "").toLowerCase());
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const autoUnsend = true;
  const delayUnsend = 60;

  // Function to convert text to bold Unicode
  function toBold(text) {
    const boldMap = {
      a: "𝗮",
      b: "𝗯",
      c: "𝗰",
      d: "𝗱",
      e: "𝗲",
      f: "𝗳",
      g: "𝗴",
      h: "𝗵",
      i: "𝗶",
      j: "𝗷",
      k: "𝗸",
      l: "𝗹",
      m: "𝗺",
      n: "𝗻",
      o: "𝗼",
      p: "𝗽",
      q: "𝗾",
      r: "𝗿",
      s: "𝘀",
      t: "𝘁",
      u: "𝘂",
      v: "𝘃",
      w: "𝘄",
      x: "𝘅",
      y: "𝘆",
      z: "𝘇",
      A: "𝗔",
      B: "𝗕",
      C: "𝗖",
      D: "𝗗",
      E: "𝗘",
      F: "𝗙",
      G: "𝗚",
      H: "𝗛",
      I: "𝗜",
      J: "𝗝",
      K: "𝗞",
      L: "𝗟",
      M: "𝗠",
      N: "𝗡",
      O: "𝗢",
      P: "𝗣",
      Q: "𝗤",
      R: "𝗥",
      S: "𝗦",
      T: "𝗧",
      U: "𝗨",
      V: "𝗩",
      W: "𝗪",
      X: "𝗫",
      Y: "𝗬",
      Z: "𝗭",
      0: "𝟬",
      1: "𝟭",
      2: "𝟮",
      3: "𝟯",
      4: "𝟰",
      5: "𝟱",
      6: "𝟲",
      7: "𝟳",
      8: "𝟴",
      9: "𝟵",
    };
    return text
      .split("")
      .map((char) => boldMap[char] || char)
      .join("");
  }

  let boldBotName = toBold(botname);

  if (!command) {
    const commandList = Array.from(commands.values());
    const categories = new Set(
      commandList.map((cmd) => cmd.config.category.toLowerCase())
    );
    const categoryCount = categories.size;

    const categoryNames = Array.from(categories);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(categoryNames.length / itemsPerPage);

    let currentPage = 1;
    if (args[0]) {
      const parsedPage = parseInt(args[0]);
      if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= totalPages) {
        currentPage = parsedPage;
      } else {
        return api.sendMessage(
          `Oops, you went too far. Please choose a page between 1 and ${totalPages}.`,
          threadID,
          messageID
        );
      }
    }
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const visibleCategories = categoryNames.slice(startIdx, endIdx);

    let msg = `⇾${boldBotName}⇽\n\n𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗟𝗶𝘀𝘁:\n\n`;

    for (let i = 0; i < visibleCategories.length; i++) {
      const category = visibleCategories[i];
      const categoryCommands = commandList.filter(
        (cmd) => cmd.config.category.toLowerCase() === category
      );
      const commandNames = categoryCommands.map(
        (cmd, index) => `➣ ${index + 1}. ${cmd.config.name}`
      );

      msg += `𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${category
        .charAt(0)
        .toUpperCase() + category.slice(1)}\n\n`;
      msg += `${commandNames.join("\n")}\n\n`;
    }

    msg += `Page ${currentPage} of ${totalPages}\n\nUse \`${prefix}help <page>\` to navigate pages.`;
    msg += `\n\n${getText("helpList", commands.size, categoryCount, prefix)}`;

    return api.sendMessage(msg, threadID, async (error, info) => {
      if (autoUnsend) {
        await new Promise((resolve) => setTimeout(resolve, delayUnsend * 500));
        return api.unsendMessage(info.messageID);
      }
    });
  }
};
