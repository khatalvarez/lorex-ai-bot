const fs = require('fs');
const path = './data/users.json';

function loadUsers() {
  if (!fs.existsSync(path)) return {};
  const data = fs.readFileSync(path, 'utf-8');
  return JSON.parse(data || '{}');
}

function saveUsers(users) {
  fs.writeFileSync(path, JSON.stringify(users, null, 2));
}

function getUser(uid) {
  const users = loadUsers();
  if (!users[uid]) {
    users[uid] = {
      money: 0,
      house: false,
      protectionExpire: 0,
      resortUpgrade: 0,
      lastProtectionBuy: 0
    };
    saveUsers(users);
  }
  return users[uid];
}

function updateUser(uid, data) {
  const users = loadUsers();
  users[uid] = { ...users[uid], ...data };
  saveUsers(users);
}

module.exports = {
  getUser,
  updateUser,
};
