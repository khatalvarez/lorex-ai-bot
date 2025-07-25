module.exports.config = {
  name: 'hugot',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  description: 'Sends a random Tagalog broken hugot quote',
  usages: 'hugot',
  cooldowns: 2
};

const hugotLines = [
  "Kung mahal mo siya, ipaglaban mo, hindi siya pakawalan.",
  "Minsan kahit gaano ka ka-lakas, kailangan mo pa rin ng panahon para maghilom.",
  "Hindi lahat ng nagmamahal, nagtatagal.",
  "Masakit man, kailangan mong bitawan yung taong hindi na para sa'yo.",
  "Kung ayaw niya, ipaglaban mo, pero huwag mong ipilit.",
  "Minsan, ang pag-ibig parang ulan—dumarating nang biglaan at umaalis nang walang paalam.",
  "Hindi ako nawalan ng pag-asa, natuto lang akong maghintay ng tamang panahon.",
  "Sakit man, pero mas masakit ang magpanggap na okay ka.",
  "Walang silbi ang pag-aalala sa isang taong hindi naman nagmamalasakit.",
  "Hindi mo kailangang maging perpekto para mahalin, pero kailangan mong mahalin ang sarili mo muna.",
  "Mahal kita, pero hindi ako sapat para sa’yo.",
  "Bakit masakit ang pag-asa kung walang kasiguruhan?",
  "Minsan, mas mahirap ang maghintay kaysa sa sumuko.",
  "Walang saysay ang luha kung paulit-ulit lang ang sakit.",
  "Natutunan kong magmahal kahit walang kapalit.",
  "Ang puso ko, pinaglaruan mo lang pala.",
  "Sakit man, pero mas masakit ang walang closure.",
  "Parang laro lang ang puso ko sa mga kamay mo.",
  "Hindi lahat ng 'ikaw lang' ay para sa'yo.",
  "Nagmahal ako ng tapat, pero sinaktan mo pa rin ako.",
  "Hindi kita makalimutan, kahit ayaw ko na.",
  "Minsan, ang taong mahal mo ay hindi ka na mahal.",
  "Masakit man, masakit man, kailangan mong bumangon.",
  "Kung hindi siya para sa'yo, palampasin mo na lang.",
  "Lahat tayo, may kwento ng broken heart.",
  "Ang sakit ng pag-iisa, lalo na kung may kasama kang iniwan.",
  "Kung hindi ka na mahal, wag mo nang pilitin.",
  "Minsan, mas madali pang kalimutan ang taong minahal mo ng sobra.",
  "Puso ko, sugatan pero tumatagal pa rin.",
  "Hindi ko alam kung saan nagkamali, pero nasaktan ako.",
  "Minsan, ang mahal mo ay hindi para sa’yo, pero ang gusto mo ay sadyang di para sa'yo.",
  "Nagmahal ako ng sobra, pero iniwan mo pa rin ako.",
  "Masakit man, pero kailangan mong tanggapin ang katotohanan.",
  "Hindi lahat ng kwento ng pag-ibig ay may happy ending.",
  "Masakit ang mawala, pero mas masakit ang maghintay nang walang patutunguhan.",
  "Masakit ang maghintay ng 'di na darating.",
  "Nagtiwala ako, pero niloko mo lang pala ako.",
  "Minsan, masakit ang mahalin ang taong hindi ka naman mahal.",
  "Bakit kailangang masaktan para matuto magmahal?",
  "Hindi ako perpekto, pero mahal kita ng totoo.",
  "Kung hindi mo na kayang magmahal, wag mo na akong saktan.",
  "Minsan, kailangan mong bumitaw para sa sarili mo.",
  "Walang saysay ang magpanggap kung hindi naman tunay ang nararamdaman.",
  "Pilit na pag-ibig, walang patutunguhan.",
  "Masakit man, pero kailangan ko nang mag-move on.",
  "Hindi ko sinabing ayaw kita, pero hindi rin kita kayang intindihin pa.",
  "Nagmahal ako ng buong puso, pero wala kang lugar sa akin.",
  "Minsan, mas masakit pa ang walang closure kaysa sa pag-alis.",
  "Ang pag-ibig, hindi palaging pantay.",
  "Nagmahal ako, pero nasaktan din.",
  "Minsan, ang pag-ibig ay sapat na dahilan para masaktan.",
  "Kung ayaw mo, sabihin mo na lang, huwag mo akong gawing tanga.",
  "Sakit ng rejection, kahit gaano kalakas ang loob, ramdam pa rin.",
  "Hindi mo kailangan pilitin ang sarili mo para mahalin ang iba.",
  "Minsan, ang taong mahal mo ay nagmamahal sa iba.",
  "Masakit ang pag-ibig kapag isa lang ang nagmamahal.",
  "Hindi lahat ng 'paalam' ay nangangahulugang tapos na.",
  "Minsan, kailangan mong lumaban para sa sarili mo.",
  "Walang dahilan para pagsamantalahan ang puso ng iba.",
  "Masakit ang magmahal nang walang kasiguraduhan.",
  "Hindi lahat ng ngiti ay nagpapakita ng saya.",
  "Masakit man, kailangan mong itigil ang pag-aalala sa taong ayaw na sa’yo.",
  "Walang kasiguraduhan ang pag-ibig, kaya minsan nasasaktan tayo.",
  "Minsan, mas madali pang limutin ang taong minahal kaysa ang tao.",
  "Nagmahal ako ng tunay, pero niloko mo ako.",
  "Kung hindi mo ako mahal, wag mo akong ipilit.",
  "Minsan, kailangan mong magpaalam para sa sarili mo.",
  "Masakit man, pero mas masakit ang magpanggap na okay ka lang.",
  "Walang kasiguraduhan ang puso, kaya minsan nasasaktan tayo.",
  "Hindi ko sinabing ayaw kita, pero hindi rin kita kayang asahan.",
  "Minsan, ang taong mahal mo ay hindi ka naman pinapansin.",
  "Masakit ang mawala, pero mas masakit ang maghintay ng walang sagot.",
  "Kung mahal mo siya, ipaglaban mo, pero huwag mong ipilit.",
  "Minsan, mas mahirap ang maghintay kaysa sumuko.",
  "Pilit na pagmamahal, walang patutunguhan.",
  "Masakit ang magmahal nang hindi ka mahal.",
  "Minsan, kailangan mong bumitaw para sa sarili mo.",
  "Hindi lahat ng pagmamahal ay may happy ending.",
  "Kung hindi ka niya mahal, wag mong pilitin ang sarili mo.",
  "Masakit ang pag-ibig kapag isa lang ang nagmamahal.",
  "Nagmahal ako ng sobra, pero iniwan mo pa rin ako.",
  "Minsan, masakit ang kalimutan ang taong mahal mo.",
  "Walang saysay ang luha kung paulit-ulit lang ang sakit.",
  "Hindi ko na alam kung paano magmahal ulit.",
  "Masakit ang rejection, pero kailangan mong tanggapin.",
  "Kung ayaw niya, ipaglaban mo, pero huwag mong ipilit.",
  "Minsan, kailangan mong magmahal ng sarili mo muna.",
  "Walang kasiguraduhan ang puso, kaya minsan nasasaktan tayo.",
  "Masakit man, pero kailangan mong mag-move on.",
  "Hindi lahat ng nagmamahal ay nagtatagal.",
  "Minsan, masakit ang magmahal ng taong hindi ka mahal.",
  "Kung mahal mo siya, ipaglaban mo, hindi siya pakawalan.",
  "Minsan, kailangan mong bumitaw para sa sarili mo.",
  "Masakit ang maghintay ng taong di na darating.",
  "Walang silbi ang pag-aalala sa taong ayaw na sa’yo.",
  "Kung hindi ka niya mahal, wag mong pilitin.",
  "Minsan, masakit ang magmahal na walang kasiguraduhan.",
  "Masakit ang mawala, pero mas masakit ang magpanggap na okay ka.",
  "Nagmahal ako ng totoo, pero niloko mo lang pala ako.",
  "Kung ayaw niya, sabihin mo na lang, huwag mo akong gawing tanga.",
  "Minsan, masakit ang magmahal ng taong hindi ka pinapansin.",
  "Masakit man, pero kailangan mong mag-move on.",
  "Hindi ko sinabing ayaw kita, pero hindi rin kita kayang asahan.",
  "Minsan, kailangan mong bumitaw para sa sarili mo.",
  "Masakit ang rejection, pero kailangan mong tanggapin.",
  "Walang kasiguraduhan ang pag-ibig, kaya masakit ang magtiwala.",
  "Minsan, mas madali pang kalimutan ang mga alaala kaysa ang tao.",
  "Kung mahal mo siya, ipaglaban mo, pero huwag mong ipilit.",
  "Minsan, mas mahirap ang maghintay kaysa sumuko.",
  "Pilit na pagmamahal, walang patutunguhan.",
  "Masakit ang magmahal nang hindi ka mahal."
];

module.exports.run = async function({ api, event }) {
  const randomIndex = Math.floor(Math.random() * hugotLines.length);
  const message = hugotLines[randomIndex];
  return api.sendMessage(`💔 Broken Hugot:\n\n"${message}"`, event.threadID, event.messageID);
};
