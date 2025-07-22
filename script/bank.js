const fs = require('fs');
const path = './data/users.json';

// Ensure the file exists before reading
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}, null, 2), 'utf-8');
let users = JSON.parse(fs.readFileSync(path, 'utf-8'));

// Constants for bank system
const WITHDRAW_LIMIT = 600;
const LOAN_LIMIT = 900;
const INTEREST_RATE = 0.01; // 1% interest

// Admin account ID
const ADMIN_ACCOUNT = '61577040643519'; // Admin ID

// Bank system metadata
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

// Save user data to file
function saveUserData() {
  fs.writeFileSync(path, JSON.stringify(users, null, 2), 'utf-8');
}

// Command Handlers

// Create Account
function createAccount(accountNumber, role = 'user') {
  if (users[accountNumber]) return `❌ Account ${accountNumber} already exists.`;
  
  users[accountNumber] = {
    balance: 0,
    history: [],
    locked: false,
    loggedIn: false,
    role: role
  };
  
  saveUserData();
  return `✅ Account ${accountNumber} created.`;
}

// Login
function login(accountNumber) {
  const acc = users[accountNumber];
  if (!acc) return `❌ Account ${accountNumber} not found.`;
  if (acc.loggedIn) return `🔓 Already logged in.`;
  
  acc.loggedIn = true;
  saveUserData();
  return `🔓 Logged in to account ${accountNumber}.`;
}

// Deposit
function deposit(accountNumber, amount) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;
  
  acc.balance += amount;
  acc.history.push(`Deposited $${amount}`);
  saveUserData();
  return `🏦 Deposited $${amount} to account ${accountNumber}.`;
}

// Withdraw
function withdraw(accountNumber, amount) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;
  if (amount > WITHDRAW_LIMIT) return `📉 Withdraw limit is $${WITHDRAW_LIMIT}.`;
  if (amount > acc.balance) return `💸 Insufficient funds.`;
  
  acc.balance -= amount;
  acc.history.push(`Withdrew $${amount}`);
  saveUserData();
  return `💸 Withdrew $${amount} from account ${accountNumber}.`;
}

// Balance with interest
function balance(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  
  const interest = acc.balance * INTEREST_RATE;
  acc.balance += interest;
  acc.history.push(`Interest added: $${interest.toFixed(2)}`);
  saveUserData();
  
  return `📊 Balance for ${accountNumber}: $${acc.balance.toFixed(2)} (incl. interest)`;
}

// History
function history(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  
  return `📜 History for ${accountNumber}:\n` + acc.history.join('\n');
}

// Loan
function loan(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  if (acc.locked) return `🔐 Account is locked.`;
  
  acc.balance += LOAN_LIMIT;
  acc.history.push(`Loan received: $${LOAN_LIMIT}`);
  saveUserData();
  
  return `💳 Loan granted. $${LOAN_LIMIT} added to account ${accountNumber}.`;
}

// Lock account
function lock(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  
  acc.locked = true;
  saveUserData();
  return `🔐 Account ${accountNumber} locked.`;
}

// Unlock account
function unlock(accountNumber) {
  const acc = users[accountNumber];
  if (!acc || !acc.loggedIn) return `❌ Login required.`;
  
  acc.locked = false;
  saveUserData();
  return `🔓 Account ${accountNumber} unlocked.`;
}

// Admin Functions

// View all accounts (Admin only)
function viewAllAccounts(adminAccountNumber) {
  if (adminAccountNumber !== ADMIN_ACCOUNT) return `❌ Only admin can view all accounts.`;
  
  let accountsList = "📜 All accounts:\n";
  for (let account in users) {
    accountsList += `Account ${account}: $${users[account].balance.toFixed(2)}\n`;
  }
  
  return accountsList;
}

// Remove account (Admin only)
function removeAccount(adminAccountNumber, accountNumberToRemove) {
  if (adminAccountNumber !== ADMIN_ACCOUNT) return `❌ Only admin can remove accounts.`;
  
  if (!users[accountNumberToRemove]) return `❌ Account ${accountNumberToRemove} does not exist.`;
  
  delete users[accountNumberToRemove];
  saveUserData();
  return `✅ Account ${accountNumberToRemove} has been removed.`;
}

// Command Handler
function handleCommand(cmd) {
  const args = cmd.split(' ');
  const mainCommand = args[1];
  const accountNumber = args[2];
  const amount = Number(args[3]);
  const adminAccount = args[4]; // Optional for admin commands
  
  switch (mainCommand) {
    case 'register': return createAccount(accountNumber, adminAccount === 'admin' ? 'admin' : 'user');
    case 'login': return login(accountNumber);
    case 'deposit': return deposit(accountNumber, amount);
    case 'withdraw': return withdraw(accountNumber, amount);
    case 'balance': return balance(accountNumber);
    case 'history': return history(accountNumber);
    case 'loan': return loan(accountNumber);
    case 'lock': return lock(accountNumber);
    case 'unlock': return unlock(accountNumber);
    case 'viewAllAccounts': return viewAllAccounts(accountNumber);
    case 'removeAccount': return removeAccount(accountNumber, adminAccount);
    default: return '❓ Unknown command.';
  }
}

// Example usage
console.log(handleCommand('💰 bank register 123')); // Create a user account
console.log(handleCommand('🔓 bank login 123')); // Login as user 123
console.log(handleCommand('🏦 bank deposit 123 1000')); // Deposit money
console.log(handleCommand('💸 bank withdraw 123 500')); // Withdraw money
console.log(handleCommand('📊 bank balance 123')); // Check balance with interest
console.log(handleCommand('📜 bank history 123')); // View history
console.log(handleCommand('💳 bank loan 123')); // Request loan

// Admin usage
console.log(handleCommand('💰 bank register 61577040643519 admin')); // Create admin account
console.log(handleCommand('🔓 bank login 61577040643519')); // Admin login
console.log(handleCommand('📜 bank viewAllAccounts 61577040643519')); // Admin view all accounts
console.log(handleCommand('❌ bank removeAccount 61577040643519 123')); // Admin remove user account
