const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'pokemonData.json');

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error loading pokemon data:', e);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving pokemon data:', e);
  }
}

function getUserData(data, userID) {
  if (!data[userID]) {
    data[userID] = {
      coins: 500,
      pokemon: {
        name: 'Pikachu',
        health: 100,
        maxHealth: 100,
        attack: 20,
        fedTimes: 0,
      }
    };
  }
  return data[userID];
}

const POKEMON_SHOP = {
  pikachu: { name: 'Pikachu', price: 0, health: 100, attack: 20 },
  charmander: { name: 'Charmander', price: 300, health: 120, attack: 25 },
  bulbasaur: { name: 'Bulbasaur', price: 250, health: 130, attack: 22 },
  squirtle: { name: 'Squirtle', price: 280, health: 140, attack: 21 },
  eevee: { name: 'Eevee', price: 350, health: 110, attack: 27 }
};

module.exports.config = {
  name: 'pokemon',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Pokemon battle and management system with shop',
  usages: 'pokemon <balance|feed|fight|shop|buy> [@user|pokemon_name]',
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const data = loadData();
  const userID = event.senderID;
  const user = getUserData(data, userID);
  const threadID = event.threadID;
  const subCommand = args[0] ? args[0].toLowerCase() : '';

  switch (subCommand) {
    case 'balance': {
      const p = user.pokemon;
      const msg = 
        `🎮 PokéCoins: ${user.coins}\n` +
        `🐾 Pokémon: ${p.name}\n` +
        `❤️ Health: ${p.health}/${p.maxHealth}\n` +
        `⚔️ Attack Power: ${p.attack}\n` +
        `🍽️ Times Fed: ${p.fedTimes}`;
      return api.sendMessage(msg, threadID, event.messageID);
    }

    case 'feed': {
      if (user.coins < 50) {
        return api.sendMessage('❌ You need at least 50 PokéCoins to feed your Pokémon.', threadID, event.messageID);
      }
      user.coins -= 50;
      const p = user.pokemon;
      p.fedTimes++;
      p.health = Math.min(p.maxHealth, p.health + 20); // heal 20 health max
      saveData(data);
      return api.sendMessage(`🍎 You fed ${p.name}. Health is now ${p.health}/${p.maxHealth}. PokéCoins left: ${user.coins}`, threadID, event.messageID);
    }

    case 'fight': {
      if (args.length < 2) {
        return api.sendMessage('❌ Please mention a user to fight. Usage: pokemon fight <@user>', threadID, event.messageID);
      }

      const mentioned = event.mentions;
      if (!mentioned || Object.keys(mentioned).length === 0) {
        return api.sendMessage('❌ Please mention a valid user to fight.', threadID, event.messageID);
      }

      const opponentID = Object.keys(mentioned)[0];
      if (opponentID === userID) {
        return api.sendMessage('❌ You cannot fight yourself.', threadID, event.messageID);
      }

      const opponent = getUserData(data, opponentID);

      // Simple fight logic: each attacks once, higher health after wins.
      const userPower = user.pokemon.health + user.pokemon.attack;
      const opponentPower = opponent.pokemon.health + opponent.pokemon.attack;

      let resultMessage = '';
      if (userPower > opponentPower) {
        // Winner gains coins
        const reward = 100;
        user.coins += reward;
        opponent.pokemon.health = Math.max(10, opponent.pokemon.health - 30); // opponent loses health
        resultMessage = `🔥 You won the fight against ${opponent.pokemon.name}!\nYou earned ${reward} PokéCoins.\nTheir health dropped to ${opponent.pokemon.health}.`;
      } else if (userPower < opponentPower) {
        const loss = 50;
        user.coins = Math.max(0, user.coins - loss);
        user.pokemon.health = Math.max(10, user.pokemon.health - 30);
        resultMessage = `💥 You lost the fight against ${opponent.pokemon.name}.\nYou lost ${loss} PokéCoins.\nYour Pokémon's health dropped to ${user.pokemon.health}.`;
      } else {
        resultMessage = `🤝 It's a tie! No coins won or lost.`;
      }

      saveData(data);
      return api.sendMessage(resultMessage, threadID, event.messageID);
    }

    case 'shop': {
      let shopList = '🛒 Pokémon Shop List:\n\n';
      for (const key in POKEMON_SHOP) {
        const poke = POKEMON_SHOP[key];
        shopList += `• ${poke.name} - Price: ${poke.price} PokéCoins\n`;
      }
      return api.sendMessage(shopList.trim(), threadID, event.messageID);
    }

    case 'buy': {
      if (args.length < 2) {
        return api.sendMessage('❌ Usage: pokemon buy <pokemon_name>', threadID, event.messageID);
      }
      const choice = args[1].toLowerCase();
      if (!POKEMON_SHOP[choice]) {
        return api.sendMessage(`❌ Pokémon "${args[1]}" not found in shop. Use "pokemon shop" to see the list.`, threadID, event.messageID);
      }

      const selected = POKEMON_SHOP[choice];
      if (user.coins < selected.price) {
        return api.sendMessage(`❌ You don't have enough PokéCoins to buy ${selected.name}. Price is ${selected.price}.`, threadID, event.messageID);
      }

      // Replace user's current Pokémon with new one
      user.coins -= selected.price;
      user.pokemon = {
        name: selected.name,
        health: selected.health,
        maxHealth: selected.health,
        attack: selected.attack,
        fedTimes: 0
      };

      saveData(data);
      return api.sendMessage(`🎉 Congratulations! You bought ${selected.name} for ${selected.price} PokéCoins.`, threadID, event.messageID);
    }

    default:
      return api.sendMessage(
        `📝 Pokemon commands:\n` +
        `- pokemon balance : Check your coins and Pokémon stats\n` +
        `- pokemon feed : Feed your Pokémon for 50 coins (restores health)\n` +
        `- pokemon fight <@user> : Battle another user's Pokémon\n` +
        `- pokemon shop : List available Pokémon to buy\n` +
        `- pokemon buy <pokemon_name> : Buy a Pokémon from the shop\n`,
        threadID, event.messageID
      );
  }
};
