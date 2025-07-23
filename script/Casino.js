const fs = require('fs');
const path = require('path');

const ADMIN_ID = "61577040643519"; // Admin UserID
const DATA_FILE = path.join(__dirname, 'casino_data.json');

// Load or initialize user data
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: 'casino',
  version: '3.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['pdtcasino', 'pdt'],
  description: "Casino with loans, vouchers, vault, daily, protection & games",
  usages: "casino <command> [args]",
  credits: 'Kaizenji + Custom',
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const sender = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  let data = loadData();

  // Initialize admin data if not exist
  if (!data[ADMIN_ID]) {
    data[ADMIN_ID] = {
      balance: 0,
      savings: 0,
      loan: 0,
      lastDaily: 0,
      lastCollect: 0,
      history: [],
      maintenance: false,
      guardOn: true,
      pendingLoans: [],
      voucherCodes: {},
      loseAllTotal: 0
    };
  }

  // Initialize user data if not exist
  if (!data[sender]) {
    data[sender] = {
      balance: 100,
      savings: 0,
      loan: 0,
      lastDaily: 0,
      lastCollect: 0,
      history: [],
      tags: ["𝐒𝐎𝐂𝐈𝐀𝐋"],
      unlocked: false,
      mpin: null,
      grCode: null,
      upgraded: false,
      hasProtection: false,
      vault: 0,
      creditScore: 600,
      insurance: [],
      loseAll: 0
    };
  }

  const user = data[sender];
  const action = args[0]?.toLowerCase();

  // If user tries commands (except unlock, daily, help) without unlocking first
  if (!["unlock", "daily", "help", "admin", "voucher", "profile", "buyupgrade"].includes(action) && !user.unlocked) {
    return api.sendMessage("🔒 You must unlock the casino first using:\ncasino unlock <GR> <MPIN>", threadID, messageID);
  }

  switch (action) {
    case "unlock": {
      const gr = args[1];
      const mpin = args[2];
      if (!gr || !mpin) return api.sendMessage("❌ Usage: casino unlock <GR> <MPIN>", threadID, messageID);
      user.grCode = gr;
      user.mpin = mpin;
      user.unlocked = true;
      saveData(data);
      return api.sendMessage("✅ Casino unlocked successfully.", threadID, messageID);
    }

    case "balance": {
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

    case "transfer": {
      const amount = parseInt(args[1]);
      const toUID = args[2];
      if (!amount || amount <= 0) return api.sendMessage("❌ Specify a valid amount.", threadID, messageID);
      if (!toUID || !data[toUID]) return api.sendMessage("❌ Specify a valid user ID to transfer.", threadID, messageID);
      if (user.balance < amount) return api.sendMessage("❌ You don't have enough balance.", threadID, messageID);

      user.balance -= amount;
      data[toUID].balance += amount;
      user.history.push(`💸 Transferred ${amount} PDT to ${toUID}`);
      data[toUID].history.push(`💰 Received ${amount} PDT from ${sender}`);

      saveData(data);
      return api.sendMessage(`✅ Transferred ${amount} PDT to user ${toUID}`, threadID, messageID);
    }

    case "loan": {
      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return api.sendMessage("❌ Enter a valid loan amount.", threadID, messageID);
      if (user.loan > 0) return api.sendMessage("❌ You already have an unpaid loan.", threadID, messageID);
      if (amount > 1000) return api.sendMessage("❌ Max loan amount is 1000 PDT.", threadID, messageID);

      data[ADMIN_ID].pendingLoans.push({ uid: sender, amount, approved: false });
      saveData(data);

      api.sendMessage(`📢 New loan request:\nUser: ${sender}\nAmount: ${amount} PDT`, ADMIN_ID);
      // Notify group chat or admin GC, replace YOUR_GC_ID below:
      const YOUR_GC_ID = "1234567890";
      api.sendMessage(`📢 New loan request:\nUser: ${sender}\nAmount: ${amount} PDT`, YOUR_GC_ID);

      return api.sendMessage("✅ Loan request sent! Wait for admin approval.", threadID, messageID);
    }

    case "repay": {
      let amount = parseInt(args[1]);
      if (!amount || amount <= 0) return api.sendMessage("❌ Enter a valid amount to repay.", threadID, messageID);
      if (user.loan <= 0) return api.sendMessage("❌ You have no loan to repay.", threadID, messageID);
      if (user.balance < amount) return api.sendMessage("❌ You don't have enough balance.", threadID, messageID);

      if (amount > user.loan) amount = user.loan;

      user.balance -= amount;
      user.loan -= amount;
      user.history.push(`💸 Repaid loan ${amount} PDT`);

      saveData(data);
      return api.sendMessage(`✅ You repaid ${amount} PDT of your loan. Remaining loan: ${user.loan} PDT`, threadID, messageID);
    }

    case "savings": {
      return api.sendMessage(
        `💰 Your savings: ${user.savings} PDT\n` +
        `🏦 Use 'casino deposit <amount>' to add savings.\n` +
        `🏦 Use 'casino withdraw <amount>' to withdraw from savings.`,
        threadID, messageID
      );
    }

    case "deposit": {
      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return api.sendMessage("❌ Enter a valid amount to deposit.", threadID, messageID);
      if (user.balance < amount) return api.sendMessage("❌ You don't have enough balance.", threadID, messageID);

      user.balance -= amount;
      user.vault += amount;
      user.history.push(`🗄️ Deposited ${amount} PDT to vault`);

      saveData(data);
      return api.sendMessage(`✅ Deposited ${amount} PDT to vault (ultra-secure storage).`, threadID, messageID);
    }

    case "withdraw": {
      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return api.sendMessage("❌ Enter a valid amount to withdraw.", threadID, messageID);
      if (user.vault < amount) return api.sendMessage("❌ Not enough balance in vault.", threadID, messageID);

      user.vault -= amount;
      user.balance += amount;
      user.history.push(`🗄️ Withdrew ${amount} PDT from vault`);

      saveData(data);
      return api.sendMessage(`✅ Withdrew ${amount} PDT from vault.`, threadID, messageID);
    }

    case "credit": {
      return api.sendMessage(`🎰 Your Casino Credit Score: ${user.creditScore}`, threadID, messageID);
    }

    case "insurance": {
      const sub = args[1]?.toLowerCase();
      if (sub === "list") {
        if (!user.insurance.length) return api.sendMessage("❌ You have no insurance.", threadID, messageID);
        return api.sendMessage("📋 Your Insurance Policies:\n" + user.insurance.join("\n"), threadID, messageID);
      }
      if (sub === "buy") {
        const type = args[2];
        if (!type) return api.sendMessage("❌ Specify insurance type to buy.", threadID, messageID);
        if (user.balance < 100) return api.sendMessage("❌ You need 100 PDT to buy insurance.", threadID, messageID);
        user.balance -= 100;
        user.insurance.push(type);
        user.history.push(`🛡️ Bought insurance: ${type}`);
        saveData(data);
        return api.sendMessage(`✅ Bought insurance '${type}'.`, threadID, messageID);
      }
      if (sub === "claim") {
        const type = args[2];
        if (!type) return api.sendMessage("❌ Specify insurance type to claim.", threadID, messageID);
        const idx = user.insurance.indexOf(type);
        if (idx === -1) return api.sendMessage("❌ You don't have this insurance.", threadID, messageID);
        user.insurance.splice(idx, 1);
        user.balance += 100; // Payout example
        user.history.push(`💰 Claimed insurance: ${type}`);
        saveData(data);
        return api.sendMessage(`✅ Claimed insurance '${type}' for 100 PDT.`, threadID, messageID);
      }
      return api.sendMessage("Usage: casino insurance <list|buy|claim> [type]", threadID, messageID);
    }

    case "daily": {
      const cooldown = 24 * 60 * 60 * 1000;
      if (Date.now() - user.lastDaily < cooldown) {
        return api.sendMessage("❌ You can only claim daily reward once every 24 hours.", threadID, messageID);
      }
      const dailyReward = 100;
      user.balance += dailyReward;
      user.lastDaily = Date.now();
      user.history.push(`🎁 Claimed daily reward ${dailyReward} PDT`);
      saveData(data);
      return api.sendMessage(`🎉 You received your daily ${dailyReward} PDT!`, threadID, messageID);
    }

    case "work": {
      const earn = Math.floor(Math.random() * 200) + 50;
      user.balance += earn;
      user.history.push(`💼 Worked and earned ${earn} PDT`);
      saveData(data);
      return api.sendMessage(`💼 You worked and earned ${earn} PDT!`, threadID, messageID);
    }

    case "history": {
      if (!user.history.length) return api.sendMessage("No history yet.", threadID, messageID);
      const last10 = user.history.slice(-10).reverse().join('\n');
      return api.sendMessage(`📝 Last 10 actions:\n${last10}`, threadID, messageID);
    }

    case "buyupgrade": {
      if (user.balance < 100) return api.sendMessage("❌ You need 100 PDT to upgrade your profile.", threadID, messageID);
      user.balance -= 100;
      user.upgraded = true;
      user.history.push("🔝 Bought profile upgrade for 100 PDT");
      saveData(data);
      return api.sendMessage("✅ Profile upgraded successfully!", threadID, messageID);
    }

    case "voucher": {
      const sub = args[1]?.toLowerCase();
      if (sub === "claim") {
        const code = args[2];
        if (!code) return api.sendMessage("❌ Provide a voucher code.", threadID, messageID);
        if (!data[ADMIN_ID].voucherCodes[code]) return api.sendMessage("❌ Invalid or expired voucher code.", threadID, messageID);
        if (data[ADMIN_ID].voucherCodes[code].claimedBy?.includes(sender)) return api.sendMessage("❌ You already claimed this voucher.", threadID, messageID);

        const voucher = data[ADMIN_ID].voucherCodes[code];
        if (Date.now() > voucher.expires) {
          delete data[ADMIN_ID].voucherCodes[code];
          saveData(data);
          return api.sendMessage("❌ Voucher code expired.", threadID, messageID);
        }

        user.balance += voucher.amount;
        if (!voucher.claimedBy) voucher.claimedBy = [];
        voucher.claimedBy.push(sender);
        user.history.push(`🎟️ Claimed voucher ${code} for ${voucher.amount} PDT`);

        saveData(data);
        return api.sendMessage(`✅ You claimed ${voucher.amount} PDT from voucher code!`, threadID, messageID);
      }
      return api.sendMessage("Usage: casino voucher claim <code>", threadID, messageID);
    }

    case "play": {
      const game = args[1]?.toLowerCase();
      if (!game) return api.sendMessage("Specify game to play: mines, jackpot", threadID, messageID);

      if (game === "mines") {
        return api.sendMessage("🎮 Mines game coming soon!", threadID, messageID);
      }
      if (game === "jackpot") {
        return api.sendMessage("🎮 Jackpot Empoy game coming soon!", threadID, messageID);
      }

      return api.sendMessage("❌ Unknown game.", threadID, messageID);
    }

    case "help": {
      return api.sendMessage(
        "🎲 Casino Commands:\n" +
        "- balance\n- transfer <amount> <uid>\n- loan <amount>\n- repay <amount>\n" +
        "- savings\n- deposit <amount>\n- withdraw <amount>\n- credit\n- insurance <list|buy|claim> [type]\n" +
        "- daily\n- work\n- history\n- unlock <GR> <MPIN>\n- buyupgrade\n- voucher claim <code>\n- play <game>",
        threadID, messageID
      );
    }

    default:
      return api.sendMessage("❌ Unknown command. Use 'casino help' for list of commands.", threadID, messageID);
  }

  saveData(data);
};
