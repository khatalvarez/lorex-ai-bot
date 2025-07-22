const fs = require('fs');
const PET_FILE = './pets.json';
let pets = fs.existsSync(PET_FILE) ? JSON.parse(fs.readFileSync(PET_FILE)) : {};

function savePets() {
  fs.writeFileSync(PET_FILE, JSON.stringify(pets, null, 2));
}

const SHOP_ITEMS = {
  'heal': { name: 'Healing Potion', price: 50, description: 'Restores 50 HP' },
  'train': { name: 'Training Session', price: 100, description: 'Increases ATK by 5' }
};

module.exports.config = {
  name: 'pet',
  version: '2.2.0',
  role: 0,
  hasPrefix: true,
  aliases: ['petarena', 'p'],
  description: 'Pet Battle Arena with training, fighting, shop, and rewards.',
  usage: 'pet [create|fight|join|buy|daily|shop|train|heal|leaderboard]',
  credits: 'OpenAI + You'
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  let user = pets[senderID] || {
    name: null,
    hp: 100,
    atk: 10,
    wins: 0,
    coins: 100,
    lastDaily: 0,
    arena: false
  };
  pets[senderID] = user;

  const subcmd = args[0]?.toLowerCase();

  // 🐣 CREATE PET (allow emoji names)
  if (subcmd === 'create') {
    const petName = args.slice(1).join(' ');
    if (!petName) return api.sendMessage('❌ Pet name is required.\nUsage: pet create [name]', threadID, messageID);
    if (user.name) return api.sendMessage(`❌ You already have a pet named "${user.name}"`, threadID, messageID);
    // Allow any characters including emojis
    user.name = petName;
    savePets();
    return api.sendMessage(`✅ Pet "${petName}" created!\nHP: ${user.hp}, ATK: ${user.atk}`, threadID, messageID);
  }

  // 🎮 JOIN ARENA
  if (subcmd === 'join') {
    if (!user.name) return api.sendMessage('❌ Create a pet first. Use: pet create [name]', threadID, messageID);
    if (user.arena) return api.sendMessage('⚔️ Your pet is already in the arena.', threadID, messageID);
    user.arena = true;
    savePets();
    return api.sendMessage(`🐾 ${user.name} joined the arena! Type 'pet fight' to challenge!`, threadID, messageID);
  }

  // ⚔️ PET FIGHT
  if (subcmd === 'fight') {
    if (!user.name) return api.sendMessage('❌ You don’t have a pet yet.', threadID, messageID);
    if (!user.arena) return api.sendMessage('❌ You must join the arena first using: pet join', threadID, messageID);

    const opponents = Object.entries(pets)
      .filter(([id, p]) => id !== senderID && p.arena && p.hp > 0);

    if (opponents.length === 0) return api.sendMessage('🥱 No available opponents in the arena.', threadID, messageID);

    const [oppoID, opponent] = opponents[Math.floor(Math.random() * opponents.length)];

    let log = `⚔️ ${user.name} vs ${opponent.name}\n`;

    const playerDamage = Math.floor(Math.random() * user.atk) + 5;
    const enemyDamage = Math.floor(Math.random() * opponent.atk) + 5;

    opponent.hp -= playerDamage;
    user.hp -= enemyDamage;

    if (opponent.hp < 0) opponent.hp = 0;
    if (user.hp < 0) user.hp = 0;

    log += `💥 You hit ${opponent.name} for ${playerDamage}!\n`;
    log += `🩸 ${opponent.name} hit you for ${enemyDamage}!\n`;

    if (opponent.hp === 0) {
      user.coins += 50;
      user.wins += 1;
      log += `🏆 You defeated ${opponent.name}!\n💰 +50 coins!`;
      opponent.arena = false;
      opponent.hp = 100; // Reset opponent HP after defeat
    }

    if (user.hp === 0) {
      log += `😵 Your pet fainted! Heal up to return.`;
      user.arena = false;
    }

    savePets();
    return api.sendMessage(log, threadID, messageID);
  }

  // 🛒 SHOW SHOP ITEMS
  if (subcmd === 'shop') {
    let shopMsg = '🛒 Pet Shop Items:\n';
    for (const key in SHOP_ITEMS) {
      const item = SHOP_ITEMS[key];
      shopMsg += `\n${item.name} (${key}) — ${item.price} coins\n${item.description}\n`;
    }
    return api.sendMessage(shopMsg, threadID, messageID);
  }

  // 🛍️ BUY ITEMS FROM SHOP
  if (subcmd === 'buy') {
    const itemKey = args[1]?.toLowerCase();
    if (!itemKey || !SHOP_ITEMS[itemKey]) return api.sendMessage('❌ Invalid item. Use: pet shop to see items.', threadID, messageID);

    const item = SHOP_ITEMS[itemKey];
    if (user.coins < item.price) return api.sendMessage('❌ You do not have enough coins.', threadID, messageID);

    user.coins -= item.price;

    // Apply item effects
    if (itemKey === 'heal') {
      user.hp += 50;
      if (user.hp > 100) user.hp = 100; // max HP cap
      await api.sendMessage(`🧪 You used a Healing Potion. HP restored to ${user.hp}!`, threadID, messageID);
    }
    else if (itemKey === 'train') {
      user.atk += 5;
      await api.sendMessage(`💪 Training complete! ATK increased to ${user.atk}!`, threadID, messageID);
    }

    savePets();
    return api.sendMessage(`✅ You bought ${item.name} for ${item.price} coins.`, threadID, messageID);
  }

  // 🎁 DAILY REWARD
  if (subcmd === 'daily') {
    const now = Date.now();
    if (now - user.lastDaily < 86400000) {
      return api.sendMessage('⏳ You already claimed daily today. Come back later.', threadID, messageID);
    }

    const reward = 100;
    user.coins += reward;
    user.lastDaily = now;
    savePets();
    return api.sendMessage(`🎁 Daily bonus claimed!\n💰 +${reward} coins`, threadID, messageID);
  }

  // 📈 LEADERBOARD (top 5 by wins)
  if (subcmd === 'leaderboard' || subcmd === 'lb') {
    const sorted = Object.entries(pets)
      .filter(([id, p]) => p.name)
      .sort((a, b) => b[1].wins - a[1].wins)
      .slice(0, 5);

    let lbMsg = '🏆 Pet Battle Leaderboard:\n';
    sorted.forEach(([id, p], i) => {
      lbMsg += `\n${i+1}. ${p.name} - Wins: ${p.wins}, Coins: ${p.coins}`;
    });

    if (sorted.length === 0) lbMsg = 'No pets have battled yet!';

    return api.sendMessage(lbMsg, threadID, messageID);
  }

  // 📊 STATUS
  return api.sendMessage(
    user.name
      ? `🐾 Pet Name: ${user.name}\n❤️ HP: ${user.hp}\n💪 ATK: ${user.atk}\n🏆 Wins: ${user.wins}\n💰 Coins: ${user.coins}\n🗡️ In Arena: ${user.arena ? 'Yes' : 'No'}`
      : '❌ You don’t have a pet yet.\nUse: pet create [name]',
    threadID,
    messageID
  );
};
