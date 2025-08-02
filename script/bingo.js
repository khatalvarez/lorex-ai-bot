const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'users.json');
const ENTRY_FEE = 100;
const WIN_AMOUNT = 500;

function loadUserData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveUserData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function boxMessage(text, type = 'info') {
  const prefix = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }[type] || '';
  return `${prefix} ${text}`;
}

function shuffle(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function checkBingo(card, called) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6],          // diagonals
  ];

  return lines.some(line => line.every(idx => called.includes(card[idx])));
}

module.exports.config = {
  name: 'bingo',
  version: '1.0',
  description: 'Play Bingo and win money!',
  hasPermission: 0,
};

module.exports.run = async function({ event, api }) {
  const userId = event.senderID;
  let data = loadUserData();
  if (!data[userId]) data[userId] = { balance: 0 };

  if (data[userId].balance < ENTRY_FEE) {
    return api.sendMessage(boxMessage(`❌ Kulang ang pera mo para maglaro ng Bingo. Kailangan ₱${ENTRY_FEE}.`), event.threadID);
  }

  data[userId].balance -= ENTRY_FEE;

  // Generate bingo card: 3x3 unique numbers 1-9 shuffled
  const card = shuffle([1,2,3,4,5,6,7,8,9]).slice(0,9);

  // Call 5 random numbers 1-9
  const called = shuffle([1,2,3,4,5,6,7,8,9]).slice(0,5);

  const isBingo = checkBingo(card, called);

  if (isBingo) {
    data[userId].balance += WIN_AMOUNT;
  }

  saveUserData(data);

  // Format card display
  let cardDisplay = '';
  for(let i=0; i<9; i+=3) {
    cardDisplay += card.slice(i,i+3).map(n => called.includes(n) ? `[${n}]` : `${n}`).join(' | ') + '\n';
  }

  const resultMsg = isBingo
    ? `🎉 BINGO! Panalo ka ng ₱${WIN_AMOUNT}!`
    : `😞 Wala kang Bingo line. Natanggal ₱${ENTRY_FEE}. Subukan mo ulit!`;

  const reply = `${resultMsg}\n\nCard (numbers called are in brackets):\n${cardDisplay}\nCalled numbers: ${called.join(', ')}\n\nBalanseng mo ngayon: ₱${data[userId].balance}`;

  return api.sendMessage(boxMessage(reply, isBingo ? 'success' : 'error'), event.threadID);
};
