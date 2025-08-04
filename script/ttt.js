const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'tictactoe',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['ttt', 'xo'],
  description: 'Play Tic Tac Toe to win ₱500',
  usages: 'tictactoe',
  credits: 'OpenAI + You',
  cooldowns: 5
};

const balancePath = path.join(__dirname, 'cache', 'balance.json');
fs.ensureFileSync(balancePath);

function getBalance(userID) {
  let data = {};
  try {
    data = fs.readJsonSync(balancePath);
  } catch (e) {}
  return data[userID] || 0;
}

function setBalance(userID, amount) {
  let data = {};
  try {
    data = fs.readJsonSync(balancePath);
  } catch (e) {}
  data[userID] = amount;
  fs.writeJsonSync(balancePath, data);
}

function renderBoard(board) {
  return board.map((cell, i) => cell || (i + 1)).reduce((acc, val, idx) => {
    return acc + val + ((idx + 1) % 3 === 0 ? '\n' : ' | ');
  }, '');
}

function checkWin(board, player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(pattern => pattern.every(index => board[index] === player));
}

function isDraw(board) {
  return board.every(cell => cell);
}

function botMove(board) {
  const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const board = Array(9).fill(null);
  const userSymbol = '❌';
  const botSymbol = '⭕';

  const msg = `🎮 Let's play Tic Tac Toe!\n\n${renderBoard(board)}\n\nReply with a number (1–9) to place your ${userSymbol}.`;

  return api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      board,
      userID: senderID,
      userSymbol,
      botSymbol
    });
  }, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.userID !== senderID) return;

  const move = parseInt(body);
  if (isNaN(move) || move < 1 || move > 9 || handleReply.board[move - 1]) {
    return api.sendMessage("❌ Invalid move. Choose an empty number between 1–9.", threadID, messageID);
  }

  handleReply.board[move - 1] = handleReply.userSymbol;

  // Check if user won
  if (checkWin(handleReply.board, handleReply.userSymbol)) {
    const balance = getBalance(senderID) + 500;
    setBalance(senderID, balance);
    return api.sendMessage(
      `🎉 You won ₱500!\n\n${renderBoard(handleReply.board)}\nYour balance: ₱${balance}`,
      threadID,
      messageID
    );
  }

  // Bot's turn
  if (!isDraw(handleReply.board)) {
    const botIdx = botMove(handleReply.board);
    handleReply.board[botIdx] = handleReply.botSymbol;
  }

  // Check if bot won
  if (checkWin(handleReply.board, handleReply.botSymbol)) {
    return api.sendMessage(
      `💔 You lost!\n\n${renderBoard(handleReply.board)}\nBetter luck next time.`,
      threadID,
      messageID
    );
  }

  // Draw check
  if (isDraw(handleReply.board)) {
    return api.sendMessage(`🤝 It's a draw!\n\n${renderBoard(handleReply.board)}`, threadID, messageID);
  }

  // Continue game
  return api.sendMessage(
    `🎮 Your move:\n\n${renderBoard(handleReply.board)}\n\nReply with a number (1–9).`,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        ...handleReply,
        messageID: info.messageID
      });
    },
    messageID
  );
};
