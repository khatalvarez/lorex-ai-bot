const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'gardenData.json');
const DAILY_CLAIM_AMOUNT = 500;
const SEED_PACKAGE_AMOUNT = 100;
const WORKER_COST = 100;
const ADMIN_UID = '61575137262643';

// Utility box for message display
function box(content) {
  const lines = content.split('\n');
  const width = Math.max(...lines.map(l => l.length));
  const top = '╔' + '═'.repeat(width + 2) + '╗';
  const bottom = '╚' + '═'.repeat(width + 2) + '╝';
  const middle = lines.map(line => '║ ' + line + ' '.repeat(width - line.length) + ' ║').join('\n');
  return [top, middle, bottom].join('\n');
}

// Load/save data
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error loading data:', e);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

// Get or initialize user data
function getUserData(data, userID) {
  if (!data[userID]) {
    data[userID] = {
      username: null,
      password: null,
      money: 1000,
      seeds: 0,
      plantsGrowing: 0,
      harvestReady: 0,
      lastGrowTime: 0,
      workers: 0,
      lastDailyClaim: 0,
      vouchers: [],
      invested: 0,
      posts: [],
      feedbacks: [],
      harvestEarned: 0
    };
  }
  return data[userID];
}

// Cooldowns and timings
function canGrow(user) {
  const growCooldown = 5 * 60 * 1000; // 5 minutes
  return Date.now() - user.lastGrowTime >= growCooldown;
}

function isDailyAvailable(user) {
  return Date.now() - user.lastDailyClaim >= 24 * 60 * 60 * 1000;
}

// Shop items (fruits)
const SHOP_ITEMS = {
  apple: 1.5,
  banana: 0.5,
  mango: 2.0,
  orange: 1.0,
  grapes: 3.0,
  strawberry: 2.5,
  watermelon: 5.0,
  pineapple: 3.0,
  peach: 1.5,
  cherry: 4.0,
  plum: 2.0,
  kiwi: 1.0,
  blueberry: 3.5,
  raspberry: 3.0,
  lemon: 0.5,
  lime: 0.5,
  grapefruit: 1.5,
  pomegranate: 3.0,
  'acai berry': 5.0,
  apricot: 2.5,
  avocado: 2.0,
  bilberry: 4.0,
  blackberry: 3.0,
  blackcurrant: 3.5,
  'blood orange': 2.0,
  boysenberry: 3.5,
  cantaloupe: 3.0,
  cherimoya: 3.0,
  cranberry: 2.5,
  date: 2.0,
  'dragon fruit': 3.0,
  durian: 5.0,
  elderberry: 4.0,
  feijoa: 3.0,
  fig: 3.0,
  'goji berry': 5.0,
  guava: 2.0,
  jackfruit: 3.0,
  'java plum': 2.5,
  jujube: 2.0,
  kumquat: 2.5,
  longan: 3.0,
  loquat: 3.0,
  'mango plum': 2.5,
  mangosteen: 3.0,
  melon: 3.0,
  'miracle fruit': 5.0,
  'monstera deliciosa': 3.0,
  mulberry: 3.0,
  nectarine: 2.0,
  orangequat: 2.5,
  papaya: 2.0,
  'passion fruit': 3.0,
  'peach palm': 3.0,
  pear: 1.5,
  persimmon: 3.0,
  physalis: 3.0,
  pineberry: 3.5,
  pitaya: 3.0,
  plumcot: 2.5,
  pomelo: 2.0,
  pummelo: 3.0,
  quince: 3.0,
  rambutan: 3.0,
  redcurrant: 3.5,
  soursop: 3.0,
  starfruit: 2.0,
  'strawberry guava': 3.0,
  'sugar apple': 3.0,
  tamarillo: 3.0,
  tangerine: 2.0,
  'ugli fruit': 2.5,
  'white currant': 3.5,
  'white sapote': 3.0,
  yuzu: 2.0,
  'acerola cherry': 4.0,
  ambarella: 2.5,
  amla: 2.0,
  babaco: 3.0,
  bael: 2.5,
  'barbados cherry': 4.0,
  carambola: 2.5,
  cempedak: 3.0,
  cupuacu: 3.0,
  damson: 3.0,
  'date plum': 2.5,
  'desert banana': 2.0,
  'desert fig': 3.0,
  duku: 3.0
};

// Voucher system
const VALID_VOUCHERS = {}; // key: voucherCode, value: usedByUserID or null

// Weather system state
let weatherState = 'sun'; // 'sun' or 'rain'

// AI agent state per user
const agentStates = {};

// Helper: get top harvest earners list (sorted desc)
function getTopHarvesters(data) {
  return Object.entries(data)
    .map(([uid, u]) => ({ uid, username: u.username || uid, harvestEarned: u.harvestEarned || 0 }))
    .sort((a, b) => b.harvestEarned - a.harvestEarned)
    .slice(0, 10);
}

// Helper: AI agent reply (simple demo)
function agentReply(userID, message) {
  if (!agentStates[userID]) agentStates[userID] = { history: [] };
  const state = agentStates[userID];
  state.history.push({ from: 'user', message });

  let reply = "🤖 Pasensya na, di kita maintindihan. Pwede kang magtanong tungkol sa hardin mo!";

  const msg = message.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi')) reply = '👋 Hello! Paano kita matutulungan sa hardin mo?';
  else if (msg.includes('help')) reply = '📖 Pwede kang magtanong tungkol sa grow, harvest, buyseed, atbp.';
  else if (msg.includes('grow')) reply = '🌱 Para mag-grow, gamitin ang "grow" command para magtanim.';
  else if (msg.includes('harvest')) reply = '🍎 Para mag-harvest, gamitin ang "harvest" command kapag handa na ang plants.';
  
  state.history.push({ from: 'bot', message: reply });
  return reply;
}

// Save data shortcut
function save(data) {
  saveData(data);
}

// MAIN MODULE EXPORT
module.exports.config = {
  name: 'harvestgame',
  version: '2.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: "Comprehensive harvest game with shop, vouchers, AI agent, social feed, weather, feedback, and more.",
  usages: "garden <command>",
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const data = loadData();
  const userID = event.senderID;
  const user = getUserData(data, userID);
  const threadID = event.threadID;
  const msg = args[0] ? args[0].toLowerCase() : '';

  // Helper to send boxed message
  function sendBoxed(text) {
    return api.sendMessage(box(text), threadID, event.messageID);
  }

  // === COMMANDS ===

  // REGISTER command
  if (msg === 'register') {
    const username = args[1];
    const password = args[2];
    if (!username || !password) {
      return sendBoxed('❌ Usage: register <username> <password>');
    }
    if (user.username) {
      return sendBoxed('⚠️ You are already registered.');
    }
    // Save credentials
    user.username = username;
    user.password = password;
    save(data);

    // Feedback to admin
    api.sendMessage(box(`👤 New registration:\nUser: ${username}\nID: ${userID}`), ADMIN_UID);

    //
