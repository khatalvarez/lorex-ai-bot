const os = require('os');

// In-memory system info storage
const systemData = {
  snapshots: []
};

// In-memory user data storage (you can expand as needed)
const userMemory = {}; // userID => { notes: [], otherData: {} }

// Take a system snapshot and save in memory
function takeSnapshot() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    uptime: os.uptime(),
    totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
    freeMemMB: Math.round(os.freemem() / 1024 / 1024),
    usedMemMB: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
    loadAverage: os.loadavg(),
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0].model,
    platform: os.platform(),
    arch: os.arch()
  };
  systemData.snapshots.push(snapshot);
  if(systemData.snapshots.length > 20) systemData.snapshots.shift(); // keep max 20 snapshots
  return snapshot;
}

// Get latest system info summary string
function getLastSnapshot() {
  if (systemData.snapshots.length === 0) return 'No snapshots taken yet.';
  const s = systemData.snapshots[systemData.snapshots.length - 1];
  return `📊 System Snapshot (${s.timestamp})
- Uptime: ${Math.floor(s.uptime / 60)} mins
- RAM: ${s.usedMemMB}MB used / ${s.totalMemMB}MB total
- Load Avg (1,5,15min): ${s.loadAverage.map(n => n.toFixed(2)).join(', ')}
- CPUs: ${s.cpuCount} x ${s.cpuModel}
- Platform: ${s.platform} ${s.arch}`;
}

// Example user memory function: add note for user
function addUserNote(userID, note) {
  if (!userMemory[userID]) userMemory[userID] = { notes: [] };
  userMemory[userID].notes.push({ note, date: new Date().toISOString() });
  return `Note added for user ${userID}.`;
}

// Get user notes
function getUserNotes(userID) {
  if (!userMemory[userID] || userMemory[userID].notes.length === 0) return 'No notes found.';
  return userMemory[userID].notes.map((n, i) => `${i + 1}. ${n.note} (on ${n.date})`).join('\n');
}

// Auto snapshot every 1 minute
setInterval(() => {
  takeSnapshot();
  console.log('New system snapshot taken.');
}, 60000);

// Take one immediately on start
takeSnapshot();
console.log(getLastSnapshot());

// Example usage:
console.log(addUserNote('user123', 'This is a test note.'));
console.log(getUserNotes('user123'));

// Export functions for your bot commands or elsewhere
module.exports = {
  takeSnapshot,
  getLastSnapshot,
  addUserNote,
  getUserNotes,
  systemData,
  userMemory
};
