const fs = require('fs');
const path = require('path');

const approvalFile = path.resolve(__dirname, 'approved_users.json');

function loadApprovals() {
  if (!fs.existsSync(approvalFile)) return {};
  return JSON.parse(fs.readFileSync(approvalFile, 'utf8') || '{}');
}

function saveApprovals(data) {
  fs.writeFileSync(approvalFile, JSON.stringify(data, null, 2));
}

const GROUP_OWNERS = ['61577040643519', '61575137262643'];

module.exports.config = {
  name: 'aigroup',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [''],
  description: 'Approve users to use AI in group chat',
};

module.exports.run = async function({ api, event, args }) {
  const sender = event.senderID;
  const threadID = event.threadID;
  const isGroup = event.isGroup;
  const approvals = loadApprovals();

  if (!isGroup) {
    return api.sendMessage('❌ AI commands ay pwede lang gamitin sa group chats.', threadID, event.messageID);
  }

  // Check if sender is group owner
  if (!GROUP_OWNERS.includes(sender)) {
    // For regular users, check if approved to use AI in this group
    if (!approvals[threadID] || !approvals[threadID].includes(sender)) {
      return api.sendMessage('❌ Hindi ka pa na-approve para gamitin ang AI sa group na ito. Pakiusap magpa-approve sa owner.', threadID, event.messageID);
    }

    // If approved, dito mo ilalagay ang AI logic para sa user, halimbawa:
    // const userMessage = args.join(' ');
    // const aiResponse = await yourAiFunction(userMessage);
    // return api.sendMessage(aiResponse, threadID, event.messageID);

    return api.sendMessage('✅ AI command executed (placeholder)', threadID, event.messageID);
  }

  // Owner commands
  const subcommand = args[0] ? args[0].toLowerCase() : '';
  if (subcommand === 'approvegc') {
    const uidToApprove = args[1];
    if (!uidToApprove) return api.sendMessage('❌ Paki-specify ang UID na i-approve. Halimbawa: approvegc 123456789', threadID, event.messageID);

    if (!approvals[threadID]) approvals[threadID] = [];

    if (approvals[threadID].includes(uidToApprove)) {
      return api.sendMessage(`✅ User ${uidToApprove} ay already approved sa group na ito.`, threadID, event.messageID);
    }

    approvals[threadID].push(uidToApprove);
    saveApprovals(approvals);
    return api.sendMessage(`✅ Na-approve na ang user ${uidToApprove} para gamitin ang AI sa group na ito.`, threadID, event.messageID);
  }

  if (subcommand === 'listapproved') {
    const approvedList = approvals[threadID] || [];
    if (approvedList.length === 0) return api.sendMessage('Walang approved users sa group na ito.', threadID, event.messageID);
    return api.sendMessage('✅ Approved users sa group:\n' + approvedList.join('\n'), threadID, event.messageID);
  }

  return api.sendMessage('❌ Hindi kilalang command. Available commands para sa owner:\n- approvegc [UID]\n- listapproved', threadID, event.messageID);
};
