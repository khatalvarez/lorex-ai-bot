const fs = require('fs');
const path = './data/users.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}), 'utf-8');
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

const WITHDRAW_LIMIT = 600;
const LOAN_LIMIT = 900;
const INTEREST_RATE = 0.01;

function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

module.exports.config = {
  name: 'bank',
  version: '2.0.0',
  hasPermission: 0,
  description: 'GTP Bank system with interest, protection, loan, and history',
  usages: 'bank [register|login|deposit|withdraw|balance|loan|lock|unlock|history]',
  credits: 'Omega Team 🏦',
  cooldowns: 0,
  dependencies: {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const action = args[0];
  const input = args[1];
  const amount = parseInt(args[2]);

  if (!action) return api.sendMessage('📌 Usage: bank [register|login|deposit|withdraw|balance|loan|lock|unlock|history] [number] [amount]', threadID, messageID);

  switch (action.toLowerCase()) {
    case 'register': {
      if (!input || !/^\d{3}$/.test(input)) return api.sendMessage('📲 Enter a 3-digit number. Example: bank register 123', threadID, messageID);
      if (users[input]) return api.sendMessage('❌ Number already registered.', threadID, messageID);

      users[input] = {
        balance: 0,
        bank: 0,
        isLoggedIn: true,
        history: [],
        locked: false,
        protection: false,
        loan: 0
      };
      saveUserData();
      return api.sendMessage(`✅ Registered successfully with number ${input}.`, threadID, messageID);
    }

    case 'login': {
      if (!input || !users[input]) return api.sendMessage('❌ Not registered.', threadID, messageID);
      users[input].isLoggedIn = true;
      saveUserData();
      return api.sendMessage(`🔓 Logged in as ${input}`, threadID, messageID);
    }

    case 'deposit': {
      if (!input || !amount || isNaN(amount)) return api.sendMessage('💰 Usage: bank deposit [number] [amount]', threadID, messageID);
      if (!users[input]?.isLoggedIn) return api.sendMessage('❌ Not logged in.', threadID, messageID);
      if (users[input].locked) return api.sendMessage('🔒 Account is locked. Unlock first.', threadID, messageID);
      if (users[input].balance < amount) return api.sendMessage('❌ Not enough wallet balance.', threadID, messageID);

      users[input].balance -= amount;
      users[input].bank += amount;
      users[input].history.push(`📥 Deposit: $${amount}`);
      saveUserData();

      return api.sendMessage(`🏦 Deposited $${amount}.\n💼 Wallet: $${users[input].balance}\n🏦 Bank: $${users[input].bank}`, threadID, messageID);
    }

    case 'withdraw': {
      if (!input || !amount || isNaN(amount)) return api.sendMessage('💸 Usage: bank withdraw [number] [amount]', threadID, messageID);
      if (!users[input]?.isLoggedIn) return api.sendMessage('❌ Not logged in.', threadID, messageID);
      if (users[input].locked) return api.sendMessage('🔒 Account is locked.', threadID, messageID);
      if (amount > WITHDRAW_LIMIT) return api.sendMessage(`⚠️ Max withdraw is $${WITHDRAW_LIMIT}.`, threadID, messageID);
      if (users[input].bank < amount) return api.sendMessage('❌ Not enough bank balance.', threadID, messageID);

      users[input].bank -= amount;
      users[input].balance += amount;
      users[input].history.push(`📤 Withdraw: $${amount}`);
      saveUserData();

      return api.sendMessage(`💸 Withdrawn $${amount}.\n💼 Wallet: $${users[input].balance}\n🏦 Bank: $${users[input].bank}`, threadID, messageID);
    }

    case 'balance': {
      if (!input || !users[input]) return api.sendMessage('❌ Number not found.', threadID, messageID);

      // Interest calculation (applied every time you check)
      let interest = Math.floor(users[input].bank * INTEREST_RATE);
      users[input].bank += interest;
      users[input].history.push(`🏅 Interest Added: $${interest}`);
      saveUserData();

      return api.sendMessage(`📊 Account: ${input}\n💼 Wallet: $${users[input].balance}\n🏦 Bank: $${users[input].bank}\n🏅 Interest: +$ ​:contentReference[oaicite:0]{index=0}​
