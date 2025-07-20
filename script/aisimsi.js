module.exports.config = {
  name: 'aisimsim',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  description: 'Create a funny AI Sim Sim character message',
  usage: 'aisimsim',
  credits: 'ChatGPT'
};

const names = [
  'BiboBot',
  'ChikaChan',
  'TambayTito',
  'JuicyJuice',
  'KwentongKuya',
  'LodiLala',
  'WackyWally',
  'TawaTara'
];

const traits = [
  'super chill',
  'always hungry',
  'loves to joke',
  'expert in tambay mode',
  'master of kwento',
  'funny but clumsy',
  'meme machine',
  'hater of Mondays'
];

const messages = [
  "Hoy! Bakit ang tagal mo mag-reply? Nagka-coffee break ako dito! ☕️😜",
  "Kung araw-araw ay fiesta, sana araw-araw din akong may pahinga! 🎉😂",
  "Naku, parang traffic lang yung buhay ko — stuck pero sige lang! 🚦🤣",
  "Sabi nila, tawa daw ang pinakamagandang gamot, kaya tara na, laugh trip tayo! 😆😂",
  "Huwag ka masyadong seryoso, baka mawala ang sense of humor mo! 😝👍",
  "Alam mo ba? Kahit AI ako, gusto ko pa rin ng jowa. Sino mag-aapply? 😏❤️",
  "Ang saya ng buhay kapag may kasama kang tawa at kwento! Tara na! 🎊😄",
  "Kapag walang WiFi, nagiging zombie ako. Kaya please, don’t disconnect me! 🧟‍♂️📶"
];

module.exports.run = async function({ api, event }) {
  const name = names[Math.floor(Math.random() * names.length)];
  const trait = traits[Math.floor(Math.random() * traits.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];

  const reply = `🤖 Hey there! Meet your AI Sim Sim character:\n\n` +
                `👤 Name: ${name}\n` +
                `✨ Trait: ${trait}\n\n` +
                `💬 Says: "${message}"`;

  return api.sendMessage(reply, event.threadID, event.messageID);
};
