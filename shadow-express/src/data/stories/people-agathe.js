// Storylets with Sister Agathe (owner: People). Serene, and slyly practical.
// Arc: a Belgian nursing sister who lives on the Munich-Venice and Zurich-Venice lines, with a house in Rome.
// Grants the Doyle cover; carries things across frontiers in her basket and hands them back hours later;
// may see Jovan into Italy as a novice (op-student).
// Flags: agathe-alms, agathe-copy, agathe-pistol, agathe-sold.

const MET = ['any', ['st', 'agathe', 'met'], ['st', 'agathe', 'cultivated'], ['st', 'agathe', 'recruited']];
const HOLDS = ['any', ['flag', 'agathe-copy'], ['flag', 'agathe-pistol']];
const SELL = [['money', 10], ['susp', 'active', -0.1], ['st', 'agathe', 'arrested'], ['trust', 'odile', -2], ['trust', 'amsler', -2],
  ['flag', 'agathe-sold'], ['later', 30, 'agathe.letter']];

export default [
  { id: 'agathe.meet', at: 'train', speaker: 'agathe', if: [['st', 'agathe', 'unknown']], w: 3, once: true,
    title: 'A basket of parcels',
    text: "A nursing sister in a grey habit sits opposite with a basket of parcels at her feet, each tied with string and labelled for a hospital. She offers you a pear. 'Fifteen years I have crossed these mountains with parcels for the poor,' says Sister Agathe. 'The customs men pray I will retire. I pray for them.'",
    choices: [
      { label: 'Help with her parcels at the frontier', sub: 'Customs men look harder at helpers',
        roll: { p: 0.65 },
        ok: [['st', 'agathe', 'met'], ['trust', 'agathe', 2]],
        fail: [['st', 'agathe', 'met'], ['trust', 'agathe', 1], ['record', 'frontier', 0.5]] },
      { label: 'Give her Brussels lace', sub: 'Lace from home, for an altar cloth', if: [['item', 'lace']],
        ok: [['item', '-lace'], ['st', 'agathe', 'met'], ['trust', 'agathe', 2]] },
      { label: 'Talk of nursing, sister to sister', sub: 'She will know at once whether you mean it',
        if: [['sex', 'f']],
        roll: { p: 0.6, mods: [[['aff', 'venue:hospital', '>=', 1], 0.3]] },
        ok: [['st', 'agathe', 'met'], ['trust', 'agathe', 2]],
        fail: [['st', 'agathe', 'met'], ['trust', 'agathe', -1]] },
      { label: 'Ask what is in the parcels', sub: 'She will tell you, too sweetly',
        ok: [['st', 'agathe', 'met'], ['trust', 'agathe', -1],
          ['intel', { subj: 'person:agathe', claim: { note: "Sister Agathe's parcels hold quinine, bandages and letters that are not hers." }, src: 'seen', rel: 0.7, truth: true }]] },
      { label: 'Accept the pear, and sleep', sub: 'She watches over sleepers, and their luggage',
        ok: [['st', 'agathe', 'met'], ['nerve', 1]] },
    ] },

  { id: 'agathe.doyle', at: 'train', speaker: 'agathe', if: [MET, ['trust', 'agathe', '>=', 2]], once: true,
    title: 'A habit is a habit',
    text: "'Our Irish house in Rome,' says Sister Agathe, peeling a pear, 'has a {Father Anselm|Sister Bridget} Doyle on its books who has not been seen since Lent. Papers in order. Nobody asks questions of the Irish; they would only get answers.' She does not look at you. 'The poor of Rome would be grateful for alms.'",
    choices: [
      { label: 'Accept the papers, and give alms', sub: '£5 to the poor of Rome, now', cost: { money: 5 },
        ok: [['cover', '+doyle'], ['trust', 'agathe', 1]] },
      { label: 'Accept, and promise alms in Rome', sub: 'She will hold you to it',
        ok: [['cover', '+doyle'], ['flag', 'agathe-alms'], ['later', 72, 'agathe.alms']] },
      { label: 'Decline: you have names enough', sub: 'She smiles as if you had said yes',
        ok: [['trust', 'agathe', 1], ['nerve', -1]] },
    ] },

  { id: 'agathe.alms', at: 'then', speaker: 'agathe', if: [['flag', 'agathe-alms']], once: true,
    title: 'The poor of Rome remember',
    text: "A postcard of Saint Peter's, in a round convent hand: 'The poor of Rome thank you in advance for the alms you promised, and pray for you daily, which is more than most people get for nothing. Ten pounds would feed the hospice for a month. Sister A.'",
    choices: [
      { label: 'Send the ten pounds', sub: 'A promise kept is a habit too', cost: { money: 10 },
        ok: [['trust', 'agathe', 2], ['unflag', 'agathe-alms']] },
      { label: 'Send what you can spare', sub: '£3, and a guilty conscience', cost: { money: 3 },
        ok: [['trust', 'agathe', -1], ['unflag', 'agathe-alms']] },
    ] },

  { id: 'agathe.basket', at: 'train', speaker: 'agathe', if: [MET, ['trust', 'agathe', '>=', 2], ['not', HOLDS]], w: 2,
    title: 'Room in the basket',
    text: "The frontier is an hour away. Sister Agathe rearranges her parcels and says, to no one in particular, that there is a little room at the bottom of the basket, under the quinine, and that customs men never lift the quinine because it reminds them of their mothers.",
    choices: [
      { label: "Slip the note's text under the quinine", sub: 'She hands it back after the frontier', if: [['item', 'ultimatum-copy']],
        roll: { p: 0.85, mods: [[['st', 'agathe', 'recruited'], 0.1]] },
        ok: [['item', '-ultimatum-copy'], ['flag', 'agathe-copy'], ['later', 6, 'agathe.returns']],
        fail: [['item', '-ultimatum-copy'], ['st', 'agathe', 'compromised'], ['nerve', -2]] },
      { label: 'Slip the pistol under the quinine', sub: 'A nun with a Browning, for an hour', if: [['item', 'browning']],
        roll: { p: 0.85, mods: [[['st', 'agathe', 'recruited'], 0.1]] },
        ok: [['item', '-browning'], ['flag', 'agathe-pistol'], ['later', 6, 'agathe.returns']],
        fail: [['item', '-browning'], ['st', 'agathe', 'compromised'], ['nerve', -2]] },
      { label: 'Thank her, and carry your own risks', sub: 'She approves of honesty, mildly',
        ok: [['trust', 'agathe', 1], ['nerve', -1]] },
      { label: 'Report her basket to the customs', sub: '£10 reward; a nun in a cell', ok: SELL },
    ] },

  { id: 'agathe.returns', at: 'then', speaker: 'agathe', if: [HOLDS], once: false,
    title: 'Under the quinine',
    text: "On the far side of the frontier, while the train takes water, Sister Agathe hands you a parcel tied with hospital string. 'You left this in my basket,' she says serenely. 'So careless. Saint Anthony found it for you. He finds most things, given time and a small donation.'",
    choices: [
      { label: "Take back the note's text", sub: 'And give Saint Anthony his due', if: [['flag', 'agathe-copy']],
        ok: [['item', '+ultimatum-copy'], ['unflag', 'agathe-copy'], ['trust', 'agathe', 1], ['money', -1]] },
      { label: 'Take back the pistol', sub: 'And give Saint Anthony his due', if: [['flag', 'agathe-pistol']],
        ok: [['item', '+browning'], ['unflag', 'agathe-pistol'], ['trust', 'agathe', 1], ['money', -1]] },
    ] },

  { id: 'agathe.rome', at: 'city', speaker: 'agathe', if: [MET], once: true,
    title: 'Alms in a biscuit tin',
    text: "Sister Agathe is in the cloister of the Belgian hospice, counting alms into a biscuit tin and losing count whenever a cat goes by. 'You have come to see the poor,' she says, 'or to see me, or to send something somewhere. Rome is very good for sending things somewhere.'",
    choices: [
      { label: 'Give alms to the hospice', sub: '£10; the poor of Rome remember names', cost: { money: 10 },
        ok: [['trust', 'agathe', 2], ['unflag', 'agathe-alms']] },
      { label: 'Send a report by the Vatican post', sub: 'Slow, holy and nearly never opened',
        ok: [['standing', 3], ['expose', 'agathe', 0.1], ['record', 'list', 0.1]] },
      { label: 'Ask about her banker in Zurich', sub: 'The hospice banks with Herr Amsler',
        ok: [['intel', { subj: 'person:amsler', claim: { note: 'Agathe: Amsler charges the poor exactly what he charges the rich, which she counts a virtue.' }, src: 'person:agathe', rel: 0.7, truth: true }]] },
    ] },

  { id: 'agathe.recruit', at: 'train', speaker: 'agathe', if: [['st', 'agathe', 'cultivated'], ['trust', 'agathe', '>=', 3]], once: true,
    title: 'For the weak, she says',
    text: "'You carry things for a government,' Sister Agathe says. 'I carry things for God, who is less particular about paperwork. Perhaps, for a while, we might carry for each other.' She folds her hands. 'Not for money. For the weak. And the alms are separate.'",
    choices: [
      { label: 'Ask her help, for the weak', sub: 'She will judge whether you mean it',
        roll: { p: 0.55, mods: [[['aff', 'venue:church', '>=', 1], 0.2]] },
        ok: [['st', 'agathe', 'recruited']],
        fail: [['trust', 'agathe', -1]] },
      { label: 'Pledge alms for her hospital', sub: '£15; the alms are separate, she said', cost: { money: 15 },
        ok: [['st', 'agathe', 'recruited'], ['trust', 'agathe', 1]] },
      { label: 'Not yet', sub: 'She will pray for you instead',
        ok: [['trust', 'agathe', -1], ['nerve', 1]] },
    ] },

  { id: 'agathe.novice', at: 'train', speaker: 'agathe', if: [MET, ['item', 'companion-jovan']], once: true,
    title: 'A novice for Rome',
    text: "Sister Agathe looks once at Jovan, sitting stiffly beside you with his hands in his lap, and once at you. 'That boy is frightened of customs men,' she says. 'Novices are frightened of everything, so nobody notices. Give him to me as far as the frontier. He can carry the basket.'",
    choices: [
      { label: 'Let her take him through', sub: 'A frightened novice with a basket of quinine',
        roll: { p: 0.75, mods: [[['st', 'agathe', 'recruited'], 0.15]] },
        ok: [['nerve', 2], ['trust', 'jovan', 1], ['trust', 'agathe', 1]],
        fail: [['record', 'frontier', 0.8], ['st', 'agathe', 'compromised']] },
      { label: 'Keep him beside you', sub: 'Your papers, your risk',
        ok: [['nerve', -1], ['trust', 'agathe', -1]] },
    ] },

  // ---------- protect and betray ----------
  { id: 'agathe.compromised', at: 'train', speaker: 'agathe', if: [['st', 'agathe', 'compromised']], w: 3,
    title: 'They opened the quinine',
    text: "Sister Agathe's basket has been opened at the frontier, down to the bottom, and the quinine lies in the aisle. She picks it up without hurry. 'They have my name in a book now,' she says, 'next to yours, I expect. Fifteen years. Saint Anthony has been careless.'",
    choices: [
      { label: 'Pay her fine at the next station', sub: '£5; customs fines are cheaper than courts', cost: { money: 5 },
        ok: [['st', 'agathe', 'cultivated'], ['trust', 'agathe', 1]] },
      { label: 'Ask her to stop crossing for you', sub: 'She will stop for you; not for the poor',
        ok: [['st', 'agathe', 'met'], ['trust', 'agathe', -1], ['nerve', 1]] },
      { label: 'Let her take all the blame', sub: 'Your name stays out of their book', ok: SELL },
    ] },

  { id: 'agathe.letter', at: 'then', speaker: 'agathe', if: [['flag', 'agathe-sold']],
    title: 'A prayer card',
    text: "A prayer card arrives, Saint Anthony on the front, the patron of lost things. On the back, in the round convent hand: 'I am in a cell at Innsbruck, which is clean, with a crucifix and a view of a wall. I pray for you daily. It is harder than it was. A.'",
    choices: [
      { label: 'Burn it', sub: 'Saint Anthony will find it anyway',
        ok: [['nerve', -2]] },
      { label: 'Send alms to the hospice', sub: '£10, unsigned; Odile will hear of it', cost: { money: 10 },
        ok: [['trust', 'odile', 1], ['nerve', 1]] },
    ] },
];
