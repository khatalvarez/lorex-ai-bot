
module.exports.config = {
  name: 'bank',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['bank'],
  description: "Manage your bank account",
  usages: "bank [command]",
  credits: 'Your Name',
  cooldowns: 0,
  dependencies: { "axios": "" }
};

let users = {};
const adminUID = '61575137262643'; // Admin UID for the bank income transfer

// List of fruits with their price and emoji
const fruits = {
  'Apple': { price: 10, emoji: '🍎' },
  'Banana': { price: 5, emoji: '🍌' },
  'Cherry': { price: 15, emoji: '🍒' },
  'Grapes': { price: 12, emoji: '🍇' },
  'Lemon': { price: 8, emoji: '🍋' },
  'Mango': { price: 20, emoji: '🥭' },
  'Orange': { price: 10, emoji: '🍊' },
  'Peach': { price: 18, emoji: '🍑' },
  'Pineapple': { price: 25, emoji: '🍍' },
  'Strawberry': { price: 12, emoji: '🍓' },
  'Watermelon': { price: 30, emoji: '🍉' },
  'Papaya': { price: 22, emoji: '🍈' },
  'Kiwi': { price: 16, emoji: '🥝' },
  'Plum': { price: 14, emoji: '🍑' },
  'Pear': { price: 11, emoji: '🍐' },
  'Pomegranate': { price: 18, emoji: '🍎' },
  'Avocado': { price: 24, emoji: '🥑' },
  'Coconut': { price: 23, emoji: '🥥' },
  'Fig': { price: 15, emoji: '🍇' },
  'Jackfruit': { price: 28, emoji: '🌳' },
  'Lychee': { price: 18, emoji: '🍊' },
  'Raspberry': { price: 20, emoji: '🍇' },
  'Dragonfruit': { price: 35, emoji: '🌵' },
  'Apricot': { price: 14, emoji: '🍑' },
  'Cantaloupe': { price: 26, emoji: '🍈' },
  'Tangerine': { price: 12, emoji: '🍊' },
  'Date': { price: 30, emoji: '🌴' },
  'Mulberry': { price: 16, emoji: '🍇' }
};

// Command handler
module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;

  // Initialize user data if not already present
  if (!users[senderID]) {
    users[senderID] = { 
      balance: 0, 
      house: false, 
      worker: false, 
      workerLevel: 0, 
      shop: false, 
      shopLevel: 0, 
      protection: false, 
      inventory: {},
      workerEarnings: 0, 
      loan: 0 // Track loan balance
    };
  }

  // Command to check balance
  if (args[0] === 'balance') {
    api.sendMessage(`Your current balance is: $${users[senderID].balance}`, event.threadID, event.messageID);
  }

  // Command to view profile
  else if (args[0] === 'profile') {
    api.sendMessage(`Your profile:\nBalance: $${users[senderID].balance}\nHouse: ${users[senderID].house ? 'Yes' : 'No'}\nWorker: ${users[senderID].worker ? 'Yes' : 'No'}\nShop: ${users[senderID].shop ? 'Yes' : 'No'}\nProtection: ${users[senderID].protection ? 'Yes' : 'No'}\nInventory: ${Object.keys(users[senderID].inventory).length} item(s)\nLoan: $${users[senderID].loan}`, event.threadID, event.messageID);
  }

  // Command to buy protection or fruits
  else if (args[0] === 'buy') {
    if (args[1] === 'protection') {
      const protectionPrice = 10000;
      if (users[senderID].balance >= protectionPrice) {
        // Deduct protection price from user
        users[senderID].balance -= protectionPrice;
        users[senderID].protection = true;

        // Add protection price to admin balance
        if (!users[adminUID]) {
          users[adminUID] = { balance: 0 }; // Ensure admin exists in user data
        }
        users[adminUID].balance += protectionPrice;

        api.sendMessage(`You bought protection for $${protectionPrice}. Your new balance is: $${users[senderID].balance}`, event.threadID, event.messageID);
        api.sendMessage(`$${protectionPrice} has been added to the admin's balance.`, event.threadID, event.messageID);
      } else {
        api.sendMessage("Insufficient funds. You need $10000 to buy protection.", event.threadID, event.messageID);
      }
    }
    else if (args[1] === 'fruits') {
      let fruitList = 'Fruits available for purchase:\n';
      Object.keys(fruits).forEach(fruit => {
        fruitList += `${fruits[fruit].emoji} ${fruit} - $${fruits[fruit].price}\n`;
      });
      api.sendMessage(fruitList, event.threadID, event.messageID);

      const selectedFruit = args[2]; // Choose the fruit name from args
      if (fruits[selectedFruit]) {
        const fruitPrice = fruits[selectedFruit].price;
        if (users[senderID].balance >= fruitPrice) {
          // Deduct fruit price from user
          users[senderID].balance -= fruitPrice;

          // Add fruits to user's inventory
          if (!users[senderID].inventory[selectedFruit]) {
            users[senderID].inventory[selectedFruit] = 0;
          }
          users[senderID].inventory[selectedFruit] += 1;

          api.sendMessage(`You bought ${selectedFruit} for $${fruitPrice}. Your new balance is: $${users[senderID].balance}`, event.threadID, event.messageID);
          api.sendMessage(`You now have ${users[senderID].inventory[selectedFruit]} ${selectedFruit}(s) in your inventory.`, event.threadID, event.messageID);
        } else {
          api.sendMessage(`Insufficient funds. You need $${fruitPrice} to buy ${selectedFruit}.`, event.threadID, event.messageID);
        }
      } else {
        api.sendMessage("Invalid fruit selected. Please choose a valid fruit from the list.", event.threadID, event.messageID);
      }
    }
  }

  // Command to upgrade worker
  else if (args[0] === 'upgrade') {
    const upgradeCost = 5000;
    if (users[senderID].balance >= upgradeCost) {
      users[senderID].workerLevel += 1;
      users[senderID].balance -= upgradeCost;
      api.sendMessage(`You upgraded your worker to level ${users[senderID].workerLevel}. Your new balance is: $${users[senderID].balance}`, event.threadID, event.messageID);
    } else {
      api.sendMessage(`Insufficient funds. You need $${upgradeCost} to upgrade your worker.`, event.threadID, event.messageID);
    }
  }

  // Command to collect worker earnings
  else if (args[0] === 'earnings') {
    const earnings = users[senderID].workerLevel * 50; // Worker earns $50 per level
    users[senderID].balance += earnings;
    users[senderID].workerEarnings += earnings;
    api.sendMessage(`You collected $${earnings} from your worker earnings. Your new balance is: $${users[senderID].balance}`, event.threadID, event.messageID);
  }

  // Command to transfer balance to another user
  else if (args[0] === 'transfer') {
    const recipientUID = args[1];
    const amount = parseInt(args[2]);

    if (users[senderID].balance >= amount) {
      if (!users[recipientUID]) users[recipientUID] = { balance: 0 };
      users[senderID].balance -= amount;
      users[recipientUID].balance += amount;

      api.sendMessage(`You transferred $${amount} to ${recipientUID}. Your new balance is: $${users[senderID].balance}`, event.threadID, event.messageID);
      api.sendMessage(`You received $${amount} from ${senderID}. Your new balance is: $${users[recipientUID].balance}`, event.threadID, event.messageID);
    } else {
      api.sendMessage("Insufficient funds for the transfer.", event.threadID, event.messageID);
    }
  }

  // Command to take out a loan
  else if (args[0] === 'loan') {
    const loanAmount = parseInt(args[1]);

    if (loanAmount > 0 && loanAmount <= 5000) {
      users[senderID].loan += loanAmount;
      users[senderID].balance += loanAmount;
      api.sendMessage(`You took a loan of $${loanAmount}. Your new balance is: $${users[senderID].balance}`, event.threadID, event.messageID);
    } else {
      api.sendMessage("Invalid loan amount. You can only take a loan between $1 and $5000.", event.threadID, event.messageID);
    }
  }

  // Command to pay back the loan
  else if (args[0] === 'payloan') {
    const payAmount = parseInt(args[1]);

    if (payAmount <= users[senderID].loan) {
      if (users[senderID].balance >= payAmount) {
        users[senderID].loan -= payAmount;
        users[senderID].balance -= payAmount;
        api.sendMessage(`You paid $${payAmount} towards your loan. Your remaining loan is: $${users[senderID].loan}`, event.threadID, event.messageID);
      } else {
        api.sendMessage("Insufficient funds to pay the loan.", event.threadID, event.messageID);
      }
    } else {
      api.sendMessage("You can't pay more than your current loan balance.", event.threadID, event.messageID);
    }
  }
};
```

 
