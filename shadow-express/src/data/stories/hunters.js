// Hunters' voices (owner: People). See docs/CONTRACTS.md §5 and docs/REGISTRY.md §6.
// Each hunter has exactly three voice storylets, fired in order as the hunter closes in:
// 1 a hint that someone is asking, 2 a message that names you, 3 a face-to-face scene with no arrest.
// Flags: falk-obliged, falk-defied, heller-warned, orlova-courted, orlova-tea, orlova-bought.

const KNOWS_PLATT = ['any', ['st', 'platt', 'met'], ['st', 'platt', 'cultivated'], ['st', 'platt', 'recruited']];
const KNOWS_KESSEL = ['any', ['st', 'kessel', 'met'], ['st', 'kessel', 'cultivated'], ['st', 'kessel', 'recruited']];
const KNOWS_KOWAL = ['any', ['st', 'kowal', 'met'], ['st', 'kowal', 'cultivated'], ['st', 'kowal', 'recruited']];
const KNOWS_SAUER = ['any', ['st', 'sauer', 'met'], ['st', 'sauer', 'cultivated'], ['st', 'sauer', 'recruited']];
const KNOWS_BRANDL = ['any', ['st', 'brandl', 'met'], ['st', 'brandl', 'cultivated'], ['st', 'brandl', 'recruited']];
const KNOWS_ILIC = ['any', ['st', 'ilic', 'met'], ['st', 'ilic', 'cultivated'], ['st', 'ilic', 'recruited']];
const KNOWS_AMSLER = ['any', ['st', 'amsler', 'met'], ['st', 'amsler', 'cultivated'], ['st', 'amsler', 'recruited']];

export default [
  // ---------------- Herr Falk: patient, Prussian, correct ----------------
  { id: 'falk.hint', at: 'then', speaker: 'falk',
    title: 'A polite inquiry',
    text: "The hall porter lowers his voice. A tall gentleman in a grey ulster asked after you this morning, by your description rather than your name. He did not hurry, he did not tip, and he wrote nothing down. 'He said he would call again,' the porter adds, 'when it was convenient to everyone.'",
    choices: [
      { label: 'Ask what else he wanted', sub: 'The porter enjoys being asked',
        roll: { p: 0.55, mods: [[['aff', 'venue:hotel', '>=', 1], 0.15]] },
        ok: [['intel', { subj: 'cover:active', claim: { knows: 'name' }, src: 'porter', rel: 0.6, truth: 'auto' }]],
        fail: [['record', 'sighting', 0.4]] },
      { label: 'Pay the porter to forget you', sub: '£3; porters forget for about a day', cost: { money: 3 },
        ok: [['record', 'bribe', 0.3], ['nerve', 1],
          ['intel', { subj: 'cover:active', claim: { knows: 'desc' }, src: 'porter', rel: 0.5, truth: 'auto' }]] },
      { label: 'Let Platt hear you sail from Leith', sub: 'He repeats everything, to everyone', if: [KNOWS_PLATT],
        ok: [['plant', { via: 'platt', subj: 'cover:active', claim: { heading: 'LON' } }], ['expose', 'platt', 0.3]] },
      { label: 'Pack and leave before he calls', sub: 'A paid night lost, and some sleep', cost: { money: 2 },
        ok: [['nerve', -1], ['min', 45]] },
    ] },

  { id: 'falk.letter', at: 'then', speaker: 'falk',
    title: 'With the expression of respect',
    text: "A letter waits at the desk in a fine clerk's hand. 'To {name}. I have the honour to inform you that your papers are under examination by the competent authority. You will find it more comfortable to travel west, and soon. I remain, with the expression of my respect, Falk.' It was not posted. It was handed in.",
    choices: [
      { label: 'Do as he advises', sub: 'Correctness may be repaid in kind',
        ok: [['flag', 'falk-obliged'], ['nerve', -1]] },
      { label: 'Reply as an injured {legend}', sub: 'Indignation is cheap, if it convinces',
        roll: { p: 0.5, mods: [[['cover', 'weiss'], 0.15], [['cover', 'vessey'], 0.1]] },
        ok: [['susp', 'active', -0.1], ['record', 'wire', 0.2]],
        fail: [['susp', 'active', 0.2], ['papers', 'active', -0.2]] },
      { label: 'Burn it and stay', sub: 'He wrote soon; he meant soon',
        ok: [['flag', 'falk-defied'], ['nerve', 1]] },
      { label: 'Tell Kessel you are bound for Metz', sub: 'Every mess in Prussia will hear it', if: [KNOWS_KESSEL],
        ok: [['plant', { via: 'kessel', subj: 'cover:active', claim: { heading: 'PAR' } }], ['expose', 'kessel', 0.3]] },
    ] },

  { id: 'falk.face', at: 'then', speaker: 'falk',
    title: 'Herr Falk takes a chair',
    text: "He sits down opposite without haste and lays his hat on his knee. 'We need not be uncivil. I could have you taken; I prefer to understand. You are {name}, or you are not. Either way you will leave. Before you do, tell me one thing. Who in Berlin gave you dinner?'",
    choices: [
      { label: 'Answer: nobody did', sub: 'He will know if you are lying',
        roll: { p: 0.5, mods: [[['flag', 'falk-obliged'], 0.2], [['flag', 'falk-defied'], -0.2]] },
        ok: [['nerve', 1], ['susp', 'active', -0.1]],
        fail: [['susp', 'active', 0.2], ['record', 'sighting', 1]] },
      { label: 'Give him the smuggler Kowal', sub: 'Falk collects smugglers', if: [KNOWS_KOWAL],
        ok: [['st', 'kowal', 'compromised'], ['expose', 'kowal', 1], ['susp', 'active', -0.2], ['trust', 'kowal', -2]] },
      { label: 'Give him the typist Sauer', sub: 'He may already suspect her', if: [KNOWS_SAUER],
        ok: [['st', 'sauer', 'compromised'], ['expose', 'sauer', 1], ['susp', 'active', -0.2], ['trust', 'sauer', -2]] },
      { label: 'Ask for his card, coldly', sub: 'Bluff him with your papers',
        roll: { p: 0.4, mods: [[['cover', 'weiss'], 0.1], [['cover', 'vessey'], 0.15]] },
        ok: [['susp', 'active', -0.1], ['nerve', 1]],
        fail: [['papers', 'active', -0.3], ['nerve', -1]] },
      { label: 'Rise and walk out', sub: 'He will not stop you. Today.',
        ok: [['nerve', -2], ['record', 'sighting', 1]] },
    ] },

  // ---------------- Hauptmann Heller: genial and cruel ----------------
  { id: 'heller.hint', at: 'then', speaker: 'heller',
    title: 'A cigar you did not order',
    text: "The waiter sets a cigar on a saucer. 'With the compliments of a gentleman who has just left.' On the back of the band someone has written, in a round cheerful hand, 'Bis bald': till soon. The waiter cannot describe him, except that he laughed a great deal and tipped nothing.",
    choices: [
      { label: 'Ask the waiter more', sub: '£1, and the waiter talks to everybody', cost: { money: 1 },
        roll: { p: 0.6 },
        ok: [['intel', { subj: 'cover:active', claim: { knows: 'desc' }, src: 'rumour', rel: 0.6, truth: 'auto' }]],
        fail: [['record', 'sighting', 0.5]] },
      { label: 'Light it, slowly, at the window', sub: 'Let him see you are not afraid',
        ok: [['nerve', 1], ['record', 'sighting', 0.6]] },
      { label: 'Ask Brandl who smokes these', sub: 'A doctor hears every vice in Vienna', if: [KNOWS_BRANDL],
        ok: [['intel', { subj: 'hunter:heller', claim: { at: 'VIE' }, src: 'person:brandl', rel: 0.6, truth: 'auto' }], ['expose', 'brandl', 0.2]] },
      { label: 'Leave by the kitchen door', sub: '£1 to the cook, and your dinner uneaten', cost: { money: 1 },
        ok: [['nerve', -1]] },
    ] },

  { id: 'heller.letter', at: 'then', speaker: 'heller',
    title: 'Do call, dear friend',
    text: "'My dear {name}, Vienna is so dull in July: everyone is at Ischl and nobody is shooting anybody. I have read so much about you this week, and I do dislike reading. Do call. Bring nothing; I have everything already, including, I think, a friend of yours. Warmest regards, H.'",
    choices: [
      { label: 'Wire a warning to your people', sub: '£3, and the censors read wires', cost: { money: 3 },
        ok: [['flag', 'heller-warned'], ['record', 'wire', 0.4]] },
      { label: 'Reply as a puzzled {legend}', sub: 'Your hand on his desk, if it fails',
        roll: { p: 0.5 },
        ok: [['susp', 'active', -0.1]],
        fail: [['susp', 'active', 0.2], ['record', 'wire', 0.6]] },
      { label: 'Let Ilić hear you go to Sarajevo', sub: 'Belgrade cafés carry far', if: [KNOWS_ILIC],
        ok: [['plant', { via: 'ilic', subj: 'cover:active', claim: { at: 'SAR' } }], ['expose', 'ilic', 0.3]] },
      { label: 'Ignore it', sub: 'He wants you frightened; refuse him that',
        ok: [['nerve', -1], ['susp', 'active', 0.1]] },
    ] },

  { id: 'heller.face', at: 'then', speaker: 'heller',
    title: 'Hauptmann Heller is delighted',
    text: "He drops into the chair beside you, cigar unlit, laughing at something nobody said. 'At last! Men in four cities looking for you, and here you sit eating Tafelspitz.' He lays a photograph by your plate: a young man with a split lip, holding a numbered slate. 'Nobody is arresting anybody today. I only want a name. He would not give me one either.'",
    choices: [
      { label: 'Give him nothing; finish your lunch', sub: 'Your hands must not shake',
        roll: { p: 0.5, mods: [[['flag', 'heller-warned'], 0.1], [['nerve', '>=', 6], 0.15]] },
        ok: [['nerve', 1], ['susp', 'active', -0.1]],
        fail: [['nerve', -2], ['record', 'sighting', 1]] },
      { label: 'Give him Lieutenant Ilić', sub: 'A Serb who talks; Heller will be grateful', if: [KNOWS_ILIC],
        ok: [['st', 'ilic', 'compromised'], ['expose', 'ilic', 1], ['susp', 'active', -0.2], ['trust', 'ilic', -2]] },
      { label: 'Give him Dr Brandl', sub: 'A Viennese doctor with foreign friends', if: [KNOWS_BRANDL],
        ok: [['st', 'brandl', 'compromised'], ['expose', 'brandl', 1], ['susp', 'active', -0.2], ['trust', 'brandl', -2]] },
      { label: 'Offer him money', sub: '£10; some officers can be bought', cost: { money: 10 },
        ok: [['record', 'bribe', 1], ['nerve', -1]] },
      { label: 'Leave the table', sub: 'He will laugh. He will remember.',
        ok: [['nerve', -2], ['record', 'sighting', 1]] },
    ] },

  // ---------------- Madame Orlova: clever, mercenary, for sale ----------------
  { id: 'orlova.hint', at: 'then', speaker: 'orlova',
    title: 'A lady with good gloves',
    text: "Handing back your key, the clerk mentions a lady in black. Yesterday she asked to see your signature in the register and paid ten francs for the look. 'Very good gloves,' he says. 'Russian, I think. Or a Russian's idea of a Parisienne.' She did not ask your name. She already had it.",
    choices: [
      { label: 'Pay to see her signature', sub: '£1; she may have signed something', cost: { money: 1 },
        ok: [['intel', { subj: 'hunter:orlova', claim: { note: 'Orlova signs as a widow of Petersburg and pays her bills in gold.' }, src: 'porter', rel: 0.6, truth: true }]] },
      { label: 'Leave her a note at the desk', sub: 'Business, if she likes business',
        ok: [['flag', 'orlova-courted'], ['record', 'register', 0.4]] },
      { label: 'Ask Amsler about Russian widows', sub: 'A banker knows who pays in gold', if: [KNOWS_AMSLER],
        ok: [['intel', { subj: 'hunter:orlova', claim: { at: 'ZUR' }, src: 'person:amsler', rel: 0.5, truth: 'auto' }], ['expose', 'amsler', 0.2]] },
      { label: 'Change hotels tonight', sub: '£2, and a new register to sign', cost: { money: 2 },
        ok: [['record', 'register', 0.3], ['nerve', 1]] },
    ] },

  { id: 'orlova.letter', at: 'then', speaker: 'orlova',
    title: 'A card, cream and heavy',
    text: "'Madame Orlova will take tea at four, wherever you are, dear {sir|madam}; she travels. Vienna pays her forty pounds for your present address. She thinks you worth more, and is sure you agree. Come and outbid them.' The card smells of violets and railway smoke. Someone has underlined forty.",
    choices: [
      { label: 'Accept the invitation', sub: 'A buyer who calls is a better price',
        ok: [['flag', 'orlova-tea'], ['nerve', -1]] },
      { label: 'Reply that you are not for sale', sub: 'She may take that as an asking price',
        roll: { p: 0.5, mods: [[['flag', 'orlova-courted'], 0.2]] },
        ok: [['nerve', 1]],
        fail: [['susp', 'active', 0.2]] },
      { label: 'Feed her a false address', sub: 'Through Amsler, who banks for half of Zurich', if: [KNOWS_AMSLER],
        ok: [['plant', { via: 'amsler', subj: 'cover:active', claim: { at: 'MUN' } }], ['expose', 'amsler', 0.3]] },
      { label: 'Ignore it', sub: 'Then Vienna gets you for forty',
        ok: [['susp', 'active', 0.2]] },
    ] },

  { id: 'orlova.face', at: 'then', speaker: 'orlova',
    title: 'Madame Orlova pours',
    text: "She is smaller than her reputation and pours your tea without asking how you take it, correctly. 'Heller pays me forty pounds for you. An insult to us both. Pay me fifty and I sell him someone else, a Dutch traveller in cocoa, very plausible. Or pay me nothing, and we shall see which of us travels better.'",
    choices: [
      { label: 'Pay her fifty', sub: '£50 for a Dutchman in your place', cost: { money: 50 },
        ok: [['susp', 'active', -0.3], ['flag', 'orlova-bought'], ['later', 96, 'orlova.again']] },
      { label: 'Haggle her down to thirty', sub: '£30; she may keep it and sell you anyway', cost: { money: 30 },
        roll: { p: 0.45, mods: [[['flag', 'orlova-tea'], 0.25], [['flag', 'orlova-courted'], 0.1]] },
        ok: [['susp', 'active', -0.2], ['flag', 'orlova-bought'], ['later', 96, 'orlova.again']],
        fail: [['susp', 'active', 0.1]] },
      { label: "Sell her Amsler's ledgers instead", sub: 'She pays for names; his is worth something', if: [KNOWS_AMSLER],
        ok: [['money', 15], ['st', 'amsler', 'compromised'], ['expose', 'amsler', 1], ['trust', 'amsler', -2]] },
      { label: 'Threaten her with the Swiss police', sub: 'She has more friends there than you',
        roll: { p: 0.35 },
        ok: [['susp', 'active', -0.1], ['nerve', 1]],
        fail: [['record', 'sighting', 1], ['susp', 'active', 0.2]] },
      { label: 'Leave without your tea', sub: 'She will price you accordingly',
        ok: [['nerve', -1], ['record', 'sighting', 0.8]] },
    ] },

  { id: 'orlova.again', at: 'then', speaker: 'orlova', if: [['flag', 'orlova-bought']],
    title: 'Prices have risen',
    text: "A second card, the same violets. 'Dear friend, war is so inflationary. Vienna now offers sixty for you, and the Dutchman is becoming implausible. Twenty more keeps him plausible until the autumn. You see I am honest: I tell you the price before I change it.'",
    choices: [
      { label: 'Pay her twenty more', sub: '£20; she has kept her word so far', cost: { money: 20 },
        ok: [['susp', 'active', -0.1]] },
      { label: 'Refuse; she has had enough', sub: 'Then the Dutchman goes home',
        ok: [['unflag', 'orlova-bought'], ['susp', 'active', 0.3]] },
    ] },
];
