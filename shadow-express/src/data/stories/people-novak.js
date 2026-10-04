// Storylets with Václav Novák (owner: People). Dry and principled.
// Arc: a printer and forger in Prague, a short trip from the Vienna posting; the second judge of the cable (Ops scene);
// mends papers (repeatable), grants the Marchand cover, sells Arsenal passes during op-optics, and posts blank forms once recruited.
// Flags: novak-planted, novak-sold.

const MET = ['any', ['st', 'novak', 'met'], ['st', 'novak', 'cultivated'], ['st', 'novak', 'recruited']];
const SELL = [['money', 20], ['susp', 'active', -0.1], ['st', 'novak', 'arrested'], ['trust', 'jovan', -2], ['trust', 'kowal', -2],
  ['flag', 'novak-sold'], ['later', 30, 'novak.letter']];

export default [
  { id: 'novak.meet', at: 'person', speaker: 'novak', if: [['st', 'novak', 'unknown']], w: 10, once: true,
    title: 'Lamp-black and wet paper',
    text: "A print shop that smells of lamp-black and wet paper. A grey-bearded man sets type for a funeral card and does not look up. 'I print hymns, invitations and the truth, in that order of demand,' says Václav Novák. 'The truth pays worst. Which have you come for?'",
    choices: [
      { label: 'Order a hundred hymn sheets', sub: 'A cleric’s errand, and a password of sorts', tag: 'topic:religion',
        if: [['aff', 'venue:church', '>=', 1]],
        ok: [['st', 'novak', 'met'], ['trust', 'novak', 1], ['legend', 0.05]] },
      { label: 'Admire the press, knowledgeably', sub: 'An instrument man knows a good machine', tag: 'topic:technical',
        if: [['aff', 'topic:technical', '>=', 1]],
        ok: [['st', 'novak', 'met'], ['trust', 'novak', 2]] },
      { label: "Speak of Bohemia's cause", sub: 'He distrusts foreigners who flatter',
        roll: { p: 0.45, mods: [[['aff', 'topic:political', '>=', 1], 0.2], [['skill', 'slavic', '>=', 1], 0.2]] },
        ok: [['st', 'novak', 'met'], ['trust', 'novak', 2]],
        fail: [['st', 'novak', 'met'], ['trust', 'novak', -1]] },
      { label: 'Order a box of visiting cards', sub: '£1; your cover, engraved', cost: { money: 1 },
        ok: [['st', 'novak', 'met'], ['trust', 'novak', 1], ['legend', 0.05]] },
    ] },

  { id: 'novak.papers', at: 'person', speaker: 'novak', if: [MET], w: 2,
    title: 'The wrong shade of blue',
    text: "Novák holds your passport to the lamp and sighs through his beard. 'The eagle is the wrong blue, and the clerk who signed this never learned to write.' He turns a page. 'I can mend it, or I can make you someone else. Mending is cheaper. Being someone else is permanent.'",
    choices: [
      { label: 'Mend these papers properly', sub: '£8 and four hours of his time', cost: { money: 8, min: 240 },
        ok: [['papers', 'active', 0.3], ['trust', 'novak', 1]] },
      { label: 'Mend them cheaply', sub: '£3; cheap work shows, sometimes', cost: { money: 3 },
        roll: { p: 0.6 },
        ok: [['papers', 'active', 0.2]],
        fail: [['papers', 'active', -0.2]] },
      { label: 'Ask who else he mends for', sub: 'He dislikes the question',
        ok: [['trust', 'novak', -1],
          ['intel', { subj: 'person:novak', claim: { note: 'Novák mends papers for smugglers from Warsaw and students from Sarajevo.' }, src: 'person:novak', rel: 0.8, truth: true }]] },
    ] },

  { id: 'novak.marchand', at: 'person', speaker: 'novak', if: [MET, ['trust', 'novak', '>=', 2]], w: 6, once: true,
    title: 'A correspondent of L’Écho',
    text: "'L'Écho du Soir had a correspondent in Salonika who died of a fever in May,' Novák says. 'Nobody told Paris. His card is still good, and his name is still respectable.' He lays a press card on the stone, the ink still wet. 'A dead man's name is the safest kind. He never contradicts you.'",
    choices: [
      { label: 'Take the Marchand papers', sub: '£15; a French journalist, new to you', cost: { money: 15 },
        ok: [['cover', '+marchand'], ['trust', 'novak', 1]] },
      { label: 'Pay him with your vest camera', sub: 'A forger has uses for a camera', if: [['item', 'vest-camera']],
        ok: [['item', '-vest-camera'], ['cover', '+marchand'], ['trust', 'novak', 2]] },
      { label: 'Decline: one name is enough', sub: 'He respects caution; he respects money more',
        ok: [['trust', 'novak', 1], ['nerve', 1]] },
    ] },

  { id: 'novak.supper', at: 'person', speaker: 'novak', if: [['st', 'novak', 'met'], ['trust', 'novak', '>=', 1]], w: 4, once: true,
    title: 'Dumplings and Bohemia',
    text: "Novák takes you to a beer hall where the waiters speak only Czech and the menu only dumplings. He talks about Hus, Palacký and the price of paper, and asks you exactly one question about yourself, which he has clearly been preparing all evening. It is a good question.",
    choices: [
      { label: 'Answer him as honestly as you can', sub: 'Three hours, and a little of the truth', cost: { min: 180 },
        ok: [['st', 'novak', 'cultivated'], ['trust', 'novak', 1], ['expose', 'novak', 0.1]] },
      { label: 'Give him your vest camera', sub: 'An answer of a kind', if: [['item', 'vest-camera']],
        ok: [['item', '-vest-camera'], ['st', 'novak', 'cultivated'], ['trust', 'novak', 2]] },
      { label: 'Turn the question aside', sub: 'He will notice the turning',
        ok: [['trust', 'novak', -1], ['nerve', 1]] },
    ] },

  { id: 'novak.recruit', at: 'person', speaker: 'novak', if: [['st', 'novak', 'cultivated'], ['trust', 'novak', '>=', 3]], w: 6, once: true,
    title: 'What a principled forger wants',
    text: "'I forge papers, not opinions,' Novák says. 'I will work for London if London will one day say the word Bohemia aloud, in public, and mean it. Or I will work for money, which says nothing and means it. I would prefer the first. I can live on the second.'",
    choices: [
      { label: 'Promise London will say the word', sub: 'He will know if you are lying',
        roll: { p: 0.5, mods: [[['aff', 'topic:political', '>=', 1], 0.15], [['trust', 'novak', '>=', 4], 0.2]] },
        ok: [['st', 'novak', 'recruited'], ['later', 96, 'novak.parcel']],
        fail: [['trust', 'novak', -2]] },
      { label: 'Buy him a new press', sub: '£25; money says nothing, honestly', cost: { money: 25 },
        ok: [['st', 'novak', 'recruited'], ['later', 96, 'novak.parcel']] },
      { label: 'Not yet', sub: 'He will not ask twice',
        ok: [['trust', 'novak', -1], ['nerve', 1]] },
    ] },

  { id: 'novak.parcel', at: 'then', speaker: 'novak', if: [['st', 'novak', 'recruited']], once: true,
    title: 'Hymn books from Prague',
    text: "A parcel of Czech hymn books arrives, addressed in a clerk's hand. Between the pages of the Advent hymns are blank forms: police registrations, a railway pass, a consular stamp, very good. A card says only: 'For emergencies. Burn the hymns; they are badly printed. V.N.'",
    choices: [
      { label: 'Keep the forms in your papers', sub: 'Better papers, and evidence if searched',
        ok: [['papers', 'active', 0.3], ['record', 'list', 0.1]] },
      { label: 'Burn the forms with the hymns', sub: 'Safer; he will be offended',
        ok: [['trust', 'novak', -1], ['nerve', 1]] },
    ] },

  { id: 'novak.arsenal', at: 'person', speaker: 'novak', if: [['op', 'op-optics'], MET], w: 8, once: true,
    title: 'A pass for the Arsenal',
    text: "Novák does not look surprised. 'The Arsenal,' he says. 'Everybody who wants to see the Arsenal comes to me in the end. The passes are printed in Vienna on bad paper, which is a mercy.' He opens a drawer of blank forms. 'Visitor, contractor or chimney sweep?'",
    choices: [
      { label: "Buy a contractor's pass", sub: '£8; good for one visit, if nobody telephones', cost: { money: 8 },
        ok: [['papers', 'active', 0.2], ['trust', 'novak', 1]] },
      { label: 'Ask who else bought one', sub: 'He sells to all sides; he says so',
        roll: { p: 0.5, mods: [[['trust', 'novak', '>=', 3], 0.25]] },
        ok: [['intel', { subj: 'op:op-optics', claim: { note: 'Novák forged an Arsenal pass last week for a man with a Russian accent.' }, src: 'person:novak', rel: 0.7, truth: true }]],
        fail: [['trust', 'novak', -1]] },
      { label: 'Ask him to forge nothing for anyone', sub: 'A principled forger may agree, for a fee', cost: { money: 3 },
        ok: [['trust', 'novak', 1], ['expose', 'novak', 0.1]] },
    ] },

  { id: 'novak.train', at: 'train', speaker: 'novak', if: [['st', 'novak', 'met']], once: true,
    title: 'Proofs on the Vienna train',
    text: "Novák is on the Vienna train, correcting the proofs of a Czech hymnal that is not entirely a hymnal. The ticket inspector reads Czech; Novák knows he does, and corrects a little more slowly. He moves his umbrella so that you can sit, which from him is a speech of welcome.",
    choices: [
      { label: 'Read proofs with him', sub: 'Two hours of commas and sedition', cost: { min: 120 },
        ok: [['trust', 'novak', 1], ['st', 'novak', 'cultivated']] },
      { label: 'Give him your vest camera', sub: 'A forger has uses for a camera', if: [['item', 'vest-camera']],
        ok: [['item', '-vest-camera'], ['trust', 'novak', 2], ['st', 'novak', 'cultivated']] },
      { label: 'Distract the inspector', sub: 'Ask him a question in bad German',
        roll: { p: 0.6, mods: [[['skill', 'german', '>=', 1], 0.15]] },
        ok: [['trust', 'novak', 2], ['st', 'novak', 'cultivated']],
        fail: [['record', 'list', 0.5], ['trust', 'novak', 1]] },
    ] },

  { id: 'novak.call', at: 'person', speaker: 'novak', if: [MET], w: 1,
    title: 'Novák, setting type',
    text: "Novák sets type with one hand and pours coffee with the other, and spills neither. He listens to you the way he reads proof: for errors. 'Well,' he says. 'Say it plainly. I charge extra for ornament.'",
    choices: [
      { label: 'Bring him a vest camera', sub: 'He wants it for faces on passports', if: [['item', 'vest-camera'], ['trust', 'novak', '<', 4]],
        ok: [['item', '-vest-camera'], ['trust', 'novak', 2]] },
      { label: 'Tell him you leave for Paris', sub: 'If the police ever ask him, he will say so',
        if: [['not', ['flag', 'novak-planted']]],
        ok: [['plant', { via: 'novak', subj: 'cover:active', claim: { at: 'PAR' } }], ['expose', 'novak', 0.3], ['flag', 'novak-planted']] },
      { label: 'Sell him to the police', sub: '£20; a forger is worth something to them', ok: SELL },
      { label: 'Leave him to his type', sub: 'A quiet visit, a quiet life',
        ok: [['nerve', 1], ['watch', -0.05]] },
    ] },

  // ---------- protect and betray ----------
  { id: 'novak.compromised', at: 'person', speaker: 'novak', if: [['st', 'novak', 'compromised']], w: 9,
    title: 'The press under seal',
    text: "There is a police seal on the press and a boy crying in the back room. 'They took my apprentice,' Novák says, very calm. 'Sixteen. He knows nothing, which they will not believe. He knows your face, which they will.' He wipes his hands on his apron for a long time. 'What do you propose?'",
    choices: [
      { label: "Pay the apprentice's bail", sub: '£12, and a lawyer who asks questions', cost: { money: 12 },
        ok: [['st', 'novak', 'cultivated'], ['trust', 'novak', 1], ['expose', 'novak', 0.2]] },
      { label: 'Move his type to Vienna tonight', sub: 'A long night with a handcart', cost: { min: 480 },
        ok: [['st', 'novak', 'cultivated'], ['trust', 'novak', 1], ['nerve', -1]] },
      { label: 'Tell him to deny everything', sub: 'A forger can forge a clean conscience',
        roll: { p: 0.5 },
        ok: [['st', 'novak', 'cultivated']],
        fail: [['st', 'novak', 'arrested'], ['trust', 'jovan', -1]] },
      { label: 'Sell him to the police', sub: '£20; a forger is worth something to them', ok: SELL },
    ] },

  { id: 'novak.letter', at: 'then', speaker: 'novak', if: [['flag', 'novak-sold']],
    title: 'A proof, corrected',
    text: "A single sheet arrives by post: a printer's proof of a funeral card, with your cover's name set in the space for the deceased. Novák has corrected one letter in the margin, in red, as if it were the only thing wrong with it. There is no other message. There does not need to be.",
    choices: [
      { label: 'Burn it', sub: 'He has other copies; printers always do',
        ok: [['nerve', -2]] },
      { label: "Pay the apprentice's bail anyway", sub: '£12; it will not buy you back', cost: { money: 12 },
        ok: [['trust', 'jovan', 1], ['trust', 'kowal', 1]] },
    ] },
];
