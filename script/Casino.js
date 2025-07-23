const fs = require('fs');
const path = require('path');

const ADMIN_ID = "61577040643519"; // Your admin UID here
const dataPath = path.join(__dirname, 'casino_data.json');

// Initialize data file if not exist
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

function loadData() {
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: 'casino',
  version: '2.1.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['pdtcasino', 'pdt'],
  description: "Play PDT Casino with loans, savings, work, social & security",
  usages: "casino [action]",
  credits: 'Kaizenji',
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;
  const now = Date.now();

  const data = loadData();

  // Ensure admin exists
  if (!data[ADMIN_ID]) {
    data[ADMIN_ID] = {
      balance: 0,
      savings: 0,
      loan: 0,
      lastDaily: 0,
      lastCollect: 0,
      history: [],
      tags: ["𝐏𝐑𝐄𝐌𝐈𝐔𝐌"]
    };
  }

  // Ensure user exists
  if (!data[senderID]) {
    data[senderID] = {
      balance: 100,
      savings: 0,
      loan: 0,
      lastDaily: 0,
      lastCollect: 0,
      history: [],
      tags: ["𝐒𝐎𝐂𝐈𝐀𝐋"],
      unlocked: false,
      mpin: null,
      hasProtection: false
    };
  }

  const user = data[senderID];
  const action = args[0]?.toLowerCase();

  // Require unlock for all commands except unlock itself and daily
  const commandsThatDontNeedUnlock = ['unlock', 'daily'];

  if (!commandsThatDontNeedUnlock.includes(action) && !user.unlocked) {
    return api.sendMessage("🔒 You must unlock the casino first using:\ncasino unlock <GR> <MPIN>", threadID, messageID);
  }

  // COMMANDS

  if (action === "balance") {
    const tag = user.tags.includes("𝐏𝐑𝐄𝐌𝐈𝐔𝐌") ? "🌟 𝐏𝐑𝐄𝐌𝐈𝐔𝐌" : "🫂 𝐒𝐎𝐂𝐈𝐀𝐋";
    return api.sendMessage(
      `${tag} Account\n` +
      `💰 Wallet: ${user.balance} PDT\n` +
      `🏦 Savings: ${user.savings} PDT\n` +
      `💳 Loan: ${user.loan} PDT\n` +
      `🔐 MPIN: ${user.mpin || 'None'}\n` +
      `🛡️ Protection: ${user.hasProtection ? '✅ Enabled' : '❌ Not Bought'}`,
      threadID, messageID
    );
  }

  if (action === "transfer") {
    const amount = parseInt(args[2]);
    const mentionID = Object.keys(event.mentions)[0];
    if (!mentionID || isNaN(amount) || amount <= 0) {
      return api.sendMessage("❌ Usage: casino transfer @user <amount>", threadID, messageID);
    }

    if (user.balance < amount) {
      return api.sendMessage("❌ Not enough balance.", threadID, messageID);
    }

    if (!data[mentionID]) {
      data[mentionID] = {
        balance: 100, savings: 0, loan: 0, lastDaily: 0, lastCollect: 0, history: [], tags: ["𝐒𝐎𝐂𝐈𝐀𝐋"], unlocked: false, mpin: null, hasProtection: false
      };
    }

    user.balance -= amount;
    data[mentionID].balance += amount;
    user.history.push(`📤 Sent ${amount} PDT to ${event.mentions[mentionID]}`);
    data[mentionID].history.push(`📥 Received ${amount} PDT from ${senderID}`);

    saveData(data);
    return api.sendMessage(`✅ Transferred ${amount} PDT to ${event.mentions[mentionID]}`, threadID, messageID);
  }

  if (action === "loan") {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ Invalid loan amount.", threadID, messageID);
    user.balance += amount;
    user.loan += amount;
    user.history.push(`💳 Loan received: ${amount} PDT`);
    saveData(data);
    return api.sendMessage(`✅ Loan granted: ${amount} PDT added to your balance.`, threadID, messageID);
  }

  if (action === "repay") {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ Invalid amount.", threadID, messageID);
    if (user.balance < amount) return api.sendMessage("❌ Not enough balance.", threadID, messageID);
    if (user.loan === 0) return api.sendMessage("✅ No loan to repay.", threadID, messageID);

    const repayAmount = Math.min(amount, user.loan);
    user.balance -= repayAmount;
    user.loan -= repayAmount;
    user.history.push(`💵 Repaid loan: ${repayAmount} PDT`);
    saveData(data);
    return api.sendMessage(`✅ Repaid ${repayAmount} PDT of your loan.`, threadID, messageID);
  }

  if (action === "savings") {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0 || user.balance < amount) {
      return api.sendMessage("❌ Invalid amount or not enough balance.", threadID, messageID);
    }
    user.balance -= amount;
    user.savings += amount;
    user.history.push(`🏦 Saved: ${amount} PDT`);
    saveData(data);
    return api.sendMessage(`✅ ${amount} PDT deposited to your savings.`, threadID, messageID);
  }

  if (action === "interest") {
    const interest = Math.floor(user.savings * 0.05);
    return api.sendMessage(`📈 Current interest from savings: ${interest} PDT (5%)`, threadID, messageID);
  }

  if (action === "collect") {
    const cooldown = 24 * 60 * 60 * 1000;
    if (now - user.lastCollect < cooldown) {
      const wait = Math.ceil((cooldown - (now - user.lastCollect)) / (1000 * 60 * 60));
      return api.sendMessage(`⏳ You can collect interest again in ${wait}h`, threadID, messageID);
    }
    const interest = Math.floor(user.savings * 0.05);
    user.balance += interest;
    user.lastCollect = now;
    user.history.push(`📈 Interest collected: ${interest} PDT`);
    saveData(data);
    return api.sendMessage(`✅ You earned ${interest} PDT from savings interest!`, threadID, messageID);
  }

  if (action === "daily") {
    const cooldown = 24 * 60 * 60 * 1000;
    if (now - user.lastDaily < cooldown) {
      const wait = Math.ceil((cooldown - (now - user.lastDaily)) / (1000 * 60 * 60));
      return api.sendMessage(`⏳ Daily already claimed. Try again in ${wait}h`, threadID, messageID);
    }
    const bonus = 100 + Math.floor(Math.random() * 100);
    user.balance += bonus;
    user.lastDaily = now;
    user.history.push(`🎁 Claimed daily bonus: ${bonus} PDT`);
    saveData(data);
    return api.sendMessage(`🎉 You received a daily bonus of ${bonus} PDT!`, threadID, messageID);
  }

  if (action === "work") {
    const jobs = ['Developer', 'Farmer', 'Streamer', 'Chef', 'Tutor', 'Trader'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const pay = 50 + Math.floor(Math.random() * 150);
    user.balance += pay;
    user.history.push(`🧑‍💼 Worked as ${job}, earned ${pay} PDT`);
    saveData(data);
    return api.sendMessage(`💼 You worked as a ${job} and earned ${pay} PDT!`, threadID, messageID);
  }

  if (action === "history") {
    const logs = user.history.slice(-10).reverse().join('\n');
    return api.sendMessage(`📜 Last 10 Transactions:\n${logs || "No activity yet."}`, threadID, messageID);
  }

  // NEW: Unlock casino
  if (action === "unlock") {
    const gr = args[1];
    const mpin = args[2];
    if (!gr || !mpin) return api.sendMessage("🔐 Usage: casino unlock <GR> <MPIN>", threadID, messageID);

    if (user.unlocked) {
      return api.sendMessage("✅ You already unlocked the casino!", threadID, messageID);
    }

    user.unlocked = true;
    user.mpin = mpin;
    user.balance += 100;
    user.history.push(`🔓 Casino unlocked using GR+MPIN, received 100 PDT`);
    saveData(data);

    return api.sendMessage(`✅ Casino access unlocked!\n🎁 You received 100 PDT bonus.`, threadID, messageID);
  }

  // NEW: Buy protection
  if (action === "buyprotection") {
    const mpin = args[1];
    if (!user.unlocked) {
      return api.sendMessage("🔒 You must unlock the casino first using:\ncasino unlock <GR> <MPIN>", threadID, messageID);
    }

    if (!mpin) return api.sendMessage("🔐 Usage: casino buyprotection <MPIN>", threadID, messageID);
    if (user.balance < 100) return api.sendMessage("❌ You need 100 PDT to buy MPIN protection.", threadID, messageID);

    user.balance -= 100;
    user.mpin = mpin;
    user.hasProtection = true;

    // Give 100 PDT to admin
    data[ADMIN_ID].balance += 100;
    data[ADMIN_ID].history.push(`💰 Received 100 PDT from ${senderID} for MPIN protection`);

    user.history.push(`🛡️ Bought MPIN protection for 100 PDT`);
    saveData(data);

    return api.sendMessage("✅ MPIN protection activated. Admin has received the payment.", threadID, messageID);
  }

  return api.sendMessage("❌ Invalid action. Try: balance, transfer, loan, repay, savings, interest, collect, daily, work, history, unlock, buyprotection", threadID, messageID);
};
