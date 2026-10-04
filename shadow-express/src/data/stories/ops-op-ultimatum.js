// Storylets of op-ultimatum, The Ultimatum (owner: Ops). See docs/CONTRACTS.md §5. The Belgrade posting.
// Every copy schedules op-ultimatum.papers, which compares it with the note printed on Friday 24 July.

const copied = ['op', 'op-ultimatum', 'step:copy'];
const papers = ['later', 12, 'op-ultimatum.papers'];
const ILIC = ['loyal', 'ilic', 'enemy:heller'];
const eastward = { subj: 'op:op-ultimatum', claim: { heading: 'IST' } };

export default [
  // ---------- the delivery ----------
  { id: 'op-ultimatum.note', at: 'op', if: [['city', 'BEG']],
    title: "Six o'clock, Thursday",
    text: "By two the word is in every café on Knez Mihailova: the Austrian minister has asked to be received at the Foreign Ministry at six. The Prime Minister is away electioneering; his deputy will have to take whatever it is. Belgrade spends the afternoon guessing. You have four hours to choose where to stand when the carriage comes.",
    choices: [
      { label: 'Watch from the café opposite', sub: 'A view of the door, and of the watchers',
        ok: [['record', 'sighting', 0.3],
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'The note went to the deputy premier at six; the copies are in the ministry registry.' }, src: 'seen', rel: 0.8, truth: true }]] },
      { label: 'Wait by the Austrian legation gate', sub: 'See who comes and goes; be seen doing it',
        ok: [['watch', 0.2],
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'Smoke from the Austrian legation garden: they are burning papers already.' }, src: 'seen', rel: 0.9, truth: true }]] },
      { label: 'Sit with the journalists at the Moskva', sub: 'Every rumour, within the hour',
        ok: [['legend', 0.05],
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'They say the note gives forty-eight hours and wants Austrian police in Serbia.' }, src: 'rumour', rel: 0.6, truth: true }]] },
    ] },

  // ---------- ways of copying it ----------
  { id: 'op-ultimatum.cousin', at: 'op', speaker: 'ilic',
    title: 'A cousin at the ministry',
    text: "Ilić's cousin is a junior clerk with ink-stained cuffs and a large family. Tonight he has made four fair copies of the note for the cabinet, and he can make a fifth, which Ilić reads over before handing it to you. 'For Dragan,' says the cousin, meaning Ilić, and meaning the twenty dinars you put on the table.",
    choices: [
      { label: 'Take the fifth copy', sub: 'Quick, and in a clerk\'s fair hand', if: [ILIC],
        ok: [copied, ['flag', 'op-ultimatum-false'], ['record', 'meeting', 0.6], papers,
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'The note asks Belgrade for an inquiry, not for Austrian officials on Serbian soil.' }, src: 'person:ilic', rel: 0.7, truth: false }]] },
      { label: 'Take the fifth copy', sub: 'Quick, and in a clerk\'s fair hand', if: [['not', ILIC]],
        ok: [copied, ['record', 'meeting', 0.3], papers] },
      { label: 'Read it against a cabinet copy', sub: 'An hour longer; the cousin sweats', cost: { min: 60 },
        ok: [copied, ['record', 'meeting', 0.5], papers, ['nerve', -1]] },
    ] },

  { id: 'op-ultimatum.porter', at: 'op',
    title: "The night porter's price",
    text: "The night porter at the Foreign Ministry is a veteran of the Bulgarian war with a pension too small for his thirst. For ten pounds he will leave the registry door on the latch from two until three. 'The copies are in the green folder,' he says. 'Do not touch the red one. And do not come back.'",
    choices: [
      { label: 'Photograph the green folder', sub: 'Six plates, a shaded lamp', if: [['item', 'vest-camera']],
        roll: { p: 0.7 },
        ok: [copied, ['flag', 'op-ultimatum-porter'], papers],
        fail: [['flag', 'op-ultimatum-porter'], ['record', 'sighting', 1], ['nerve', -2]] },
      { label: 'Copy it out by hand', sub: 'An hour by a shaded lamp', cost: { min: 60 },
        roll: { p: 0.55, mods: [[['nerve', '>=', 6], 0.1], [['skill', 'slavic', '>=', 2], 0.1]] },
        ok: [copied, ['flag', 'op-ultimatum-porter'], papers],
        fail: [['flag', 'op-ultimatum-porter'], ['record', 'sighting', 1], ['nerve', -2]] },
      { label: 'Open the red folder too', sub: 'Greed, or curiosity; another quarter hour',
        roll: { p: 0.4, mods: [[['item', 'vest-camera'], 0.15]] },
        ok: [copied, ['flag', 'op-ultimatum-porter'], ['standing', 3], papers,
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'The red folder: Serbian mobilisation orders, signed, waiting only for a date.' }, src: 'paper', rel: 0.9, truth: true }]],
        fail: [['flag', 'op-ultimatum-porter'], ['record', 'sighting', 1], ['nerve', -2], ['watch', 0.3]] },
    ] },

  { id: 'op-ultimatum.press', at: 'op',
    title: 'The Politika night desk',
    text: "Politika's night editor has the text before the cabinet has finished reading it, because his brother-in-law sits in the cabinet. He will print a summary on Saturday. For a French colleague, and a bottle, he will let you sit in the proof room for an hour with a pencil. He will not let you take the proof.",
    choices: [
      { label: 'Copy it out in the proof room', sub: 'An hour, and a compositor watching', cost: { min: 60 },
        ok: [copied, ['record', 'meeting', 0.5], papers] },
      { label: 'Pocket the proof sheet', sub: 'Faster; he will notice in the morning',
        roll: { p: 0.5, mods: [[['skill', 'tradecraft', '>=', 2], 0.2]] },
        ok: [copied, ['record', 'meeting', 0.6], papers],
        fail: [['record', 'meeting', 1], ['watch', 0.3]] },
    ] },

  // ---------- twists ----------
  { id: 'op-ultimatum.paid-twice', at: 'op',
    title: 'The porter has been paid twice',
    text: "The porter is waiting outside your lodging in new boots. He has been paid twice, he explains without shame: once by you to open a door, and once by a gentleman from the Austrian legation to describe whoever came through it. He is an honest man, he says. He will sell you the gentleman's questions too.",
    choices: [
      { label: "Buy the gentleman's questions", sub: '£5: what does Vienna know?', cost: { money: 5 },
        ok: [['intel', { subj: 'hunter:heller', claim: { knows: 'desc' }, src: 'porter', rel: 0.8, truth: 'auto' }]] },
      { label: 'Pay him to describe someone else', sub: '£10 for a fat Greek with a beard', cost: { money: 10 },
        roll: { p: 0.5, mods: [[['skill', 'slavic', '>=', 1], 0.1]] },
        ok: [['susp', 'active', -0.15]], fail: [['record', 'sighting', 0.8]] },
      { label: 'Threaten him into silence', sub: "He has a sergeant's courage, and friends",
        roll: { p: 0.45, mods: [[['item', 'browning'], 0.2]] },
        ok: [['nerve', -1]], fail: [['record', 'sighting', 1], ['watch', 0.3]] },
    ] },

  { id: 'op-ultimatum.alert', at: 'op',
    title: 'Belgrade on alert',
    text: 'After the note, Belgrade expects Austrian guns by morning. Patrols stop foreigners in the street, and a gendarme has stood opposite your door since nine, smoking and looking at your window. The kafana owner says the police asked him what language you talk in your sleep.',
    choices: [
      { label: 'Go out the back way', sub: 'Over the yard wall, into Dorćol',
        roll: { p: 0.6, mods: [[['skill', 'streetwise', '>=', 2], 0.2]] },
        ok: [['nerve', -1]], fail: [['record', 'sighting', 0.9], ['watch', 0.2]] },
      { label: 'Invite the gendarme in for coffee', sub: 'Serbian manners; your Serbian had better hold',
        roll: { p: 0.45, mods: [[['skill', 'slavic', '>=', 1], 0.25], [['legend', '>=', 0.5], 0.1]] },
        ok: [['watch', -0.3], ['legend', 0.1]], fail: [['watch', 0.2], ['record', 'register', 0.5]] },
      { label: 'Stay in and work by lamplight', sub: 'Hours lost, and the window lit', cost: { min: 240 },
        ok: [['watch', -0.1]] },
    ] },

  { id: 'op-ultimatum.pipe', at: 'op',
    title: 'A pipe into the Evidenzbureau',
    text: 'You kept the mole you named as a pipe for lies. Tonight it could carry one to Vienna: that your copy will leave by courier on the Constantinople express. If Heller believes it, his men will watch the eastern line while your text goes another way. A lie spent now cannot be spent again.',
    choices: [
      { label: 'Feed it through Brandl', sub: 'A letter about a patient', if: [['flag', 'op-mole-kept-brandl']],
        ok: [['plant', { via: 'brandl', ...eastward }], ['unflag', 'op-mole-kept-brandl'], ['record', 'wire', 0.3]] },
      { label: 'Feed it through Ilić', sub: 'Over rakija, loudly', if: [['flag', 'op-mole-kept-ilic']],
        ok: [['plant', { via: 'ilic', ...eastward }], ['unflag', 'op-mole-kept-ilic'], ['record', 'meeting', 0.3]] },
      { label: 'Feed it through Amsler', sub: 'A draft payable in Constantinople', if: [['flag', 'op-mole-kept-amsler']],
        ok: [['plant', { via: 'amsler', ...eastward }], ['unflag', 'op-mole-kept-amsler'], ['record', 'wire', 0.3]] },
      { label: 'Keep the pipe for later', sub: 'A better lie may be needed',
        ok: [['nerve', -1]] },
    ] },

  // ---------- aftermath ----------
  { id: 'op-ultimatum.papers', at: 'then', if: [['day', '56']],
    title: "The note in Friday's papers",
    text: 'The note is in every Friday paper in Europe: ten demands, forty-eight hours, Austrian officials to share in the inquiry on Serbian soil. Belgrade has until six tomorrow evening. You lay the newspaper beside the copy you made and read the two together, line by line, as the kafana fills with arguing men.',
    choices: [
      { label: 'Find the missing clause', if: [['flag', 'op-ultimatum-false']],
        ok: [['standing', -6], ['debrief', 'Your copy lacked the clause on Austrian officials: Ilić had softened it for Heller.']] },
      { label: 'Find them word for word', if: [['not', ['flag', 'op-ultimatum-false']]],
        ok: [['standing', 3], ['debrief', 'Your copy matched the published note word for word.']] },
    ] },
];
