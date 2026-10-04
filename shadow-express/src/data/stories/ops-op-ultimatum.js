// Storylets of op-ultimatum, The Ultimatum (owner: Ops). See docs/CONTRACTS.md §5.
// Every copy schedules op-ultimatum.papers, which compares it with the note printed on Friday 24 July.

const copied = ['op', 'op-ultimatum', 'step:copy'];
const papers = ['later', 60, 'op-ultimatum.papers'];

export default [
  // ---------- step ----------
  { id: 'op-ultimatum.reach', at: 'op', if: [['city', 'VIE']],
    title: 'Vienna holds its breath',
    text: 'Vienna is at the races and the Prater as if nothing were happening, which is how you know that something is. At the Café Central they say the note will be harsh. At the Ballhausplatz the first-floor lights burn late, and a cab waits all night at the side door. Where will you stay?',
    choices: [
      { label: 'Register at the Hotel Bristol', sub: "Comfort, a register, and Heller's men in the bar", cost: { money: 3 },
        ok: [['record', 'register', 0.6], ['nerve', 2]] },
      { label: "Stay at Brandl's flat", sub: 'His spare room, and his household', if: [['st', 'brandl', 'recruited']],
        ok: [['record', 'register', 0.05], ['expose', 'brandl', 0.2]] },
      { label: 'A pension in the Leopoldstadt', sub: '£1, thin walls, no questions', cost: { money: 1 },
        ok: [['record', 'register', 0.25],
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'The Ballhausplatz night porters drink at the Goldener Hirsch after their shift.' }, src: 'rumour', rel: 0.6, truth: true }]] },
    ] },

  // ---------- ways ----------
  { id: 'op-ultimatum.patient', at: 'op', speaker: 'brandl',
    title: 'The counsellor cannot sleep',
    text: "Brandl's patient is a counsellor of legation with a twitching eyelid and a conscience. He drafted half the note and dreams about the other half. Under Brandl's hand he talks: ten demands, forty-eight hours, Austrian officials on Serbian soil. Brandl writes it all down in a doctor's shorthand and offers you the page without a word.",
    choices: [
      { label: 'Take the page', sub: "Brandl's hand is neat and quick", if: [['loyal', 'brandl', 'enemy:heller']],
        ok: [copied, ['flag', 'op-ultimatum-false'], ['record', 'meeting', 0.5], papers,
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'The note asks Belgrade for an inquiry, not for Austrian officials on Serbian soil.' }, src: 'person:brandl', rel: 0.7, truth: false }]] },
      { label: 'Take the page', sub: "Brandl's hand is neat and quick", if: [['not', ['loyal', 'brandl', 'enemy:heller']]],
        ok: [copied, ['record', 'meeting', 0.3], papers] },
      { label: 'Copy his words yourself', sub: 'An hour longer in the room', cost: { min: 60 },
        ok: [copied, ['record', 'meeting', 0.6], papers] },
    ] },

  { id: 'op-ultimatum.porter', at: 'op',
    title: "The night porter's price",
    text: "The night porter at the Ballhausplatz is a former sergeant with a pension too small for his thirst. For twenty-five pounds he will leave the registry door on the latch from two until three. 'The cipher clerks keep the final text in the green folder,' he says. 'Do not touch the red one. And do not come back.'",
    choices: [
      { label: 'Photograph the green folder', sub: 'Six plates, a shaded lamp', if: [['item', 'vest-camera']],
        roll: { p: 0.7 },
        ok: [copied, ['flag', 'op-ultimatum-porter'], papers],
        fail: [['flag', 'op-ultimatum-porter'], ['record', 'sighting', 1], ['nerve', -2]] },
      { label: 'Copy it out by hand', sub: 'An hour by a shaded lamp', cost: { min: 60 },
        roll: { p: 0.55, mods: [[['nerve', '>=', 6], 0.1]] },
        ok: [copied, ['flag', 'op-ultimatum-porter'], papers],
        fail: [['flag', 'op-ultimatum-porter'], ['record', 'sighting', 1], ['nerve', -2]] },
      { label: 'Open the red folder too', sub: 'Greed, or curiosity; another quarter hour',
        roll: { p: 0.4, mods: [[['item', 'vest-camera'], 0.15]] },
        ok: [copied, ['flag', 'op-ultimatum-porter'], ['standing', 3], papers,
          ['intel', { subj: 'op:op-ultimatum', claim: { note: 'The red folder: orders to mobilise eight corps against Serbia on the twenty-fifth.' }, src: 'paper', rel: 0.9, truth: true }]],
        fail: [['flag', 'op-ultimatum-porter'], ['record', 'sighting', 1], ['nerve', -2], ['susp', 'active', 0.15]] },
    ] },

  { id: 'op-ultimatum.press', at: 'op',
    title: "The Press Office's cigarettes",
    text: 'The chief of the Ballhausplatz press office gives correspondents cigarettes, coffee and nothing else. But he is vain, and you are the only French correspondent who has praised his little book on Metternich. Over the second cigarette he lets slip the shape of the thing: a short time limit, demands Belgrade cannot meet. He will not give you words.',
    choices: [
      { label: 'Take the shape, and be content', sub: 'A summary, not a text',
        ok: [copied, ['standing', -4], ['record', 'meeting', 0.5], papers,
          ['debrief', 'London had the shape of the note from you, not its words.']] },
      { label: 'Flatter him into showing a draft', sub: 'Another hour; he may see the game',
        roll: { p: 0.45, mods: [[['aff', 'topic:press', '>=', 1], 0.1]] },
        ok: [copied, ['record', 'meeting', 0.6], papers],
        fail: [['record', 'meeting', 1], ['susp', 'active', 0.15]] },
    ] },

  { id: 'op-ultimatum.dinner', at: 'op',
    title: 'Moselle at the German embassy',
    text: 'At the German embassy the counsellor drinks Moselle like water. Berlin has seen the text, he confides to the table; it is written to be refused. After the fish the talk is all Serbia. The draft is in his breast pocket, his valet is in the hall with the coats, and the evening is long.',
    choices: [
      { label: 'Brush against his breast pocket', sub: 'Deft fingers in a crowded doorway',
        roll: { p: 0.4, mods: [[['nerve', '>=', 6], 0.1]] },
        ok: [copied, ['record', 'sighting', 0.4], papers],
        fail: [['record', 'sighting', 1], ['susp', 'active', 0.2]] },
      { label: 'Bribe the valet among the coats', sub: '£10; he has served better masters', cost: { money: 10 },
        roll: { p: 0.55 },
        ok: [copied, ['record', 'bribe', 0.5], papers],
        fail: [['record', 'bribe', 1]] },
      { label: 'Only listen, and remember', sub: 'No text, but a true sense of it',
        ok: [copied, ['standing', -4], papers,
          ['debrief', 'You brought away the drift of the note from a German dinner table, not its text.']] },
    ] },

  // ---------- twists ----------
  { id: 'op-ultimatum.paid-twice', at: 'op',
    title: 'The porter has been paid twice',
    text: "The porter is waiting outside your lodging in new boots. He has been paid twice, he explains without shame: once by you to open a door, and once by a stout gentleman with a duelling scar to describe whoever came through it. He is an honest man, he says. He will sell you the gentleman's questions too.",
    choices: [
      { label: "Buy the gentleman's questions", sub: '£5: what does Heller know?', cost: { money: 5 },
        ok: [['intel', { subj: 'hunter:heller', claim: { knows: 'desc' }, src: 'porter', rel: 0.8, truth: 'auto' }]] },
      { label: 'Pay him to describe someone else', sub: '£10 for a fat Dutchman with a beard', cost: { money: 10 },
        roll: { p: 0.5 },
        ok: [['susp', 'active', -0.15]], fail: [['record', 'sighting', 0.8]] },
      { label: 'Threaten him into silence', sub: "He has a sergeant's courage, and friends",
        roll: { p: 0.45, mods: [[['item', 'browning'], 0.2]] },
        ok: [['nerve', -1]], fail: [['record', 'sighting', 1], ['susp', 'active', 0.2]] },
    ] },

  { id: 'op-ultimatum.platt', at: 'op', speaker: 'platt',
    title: 'Platt wants a scoop',
    text: "Platt finds you at the Café Central and sits down without asking. 'Everybody says you've got it,' he lies cheerfully. 'The note. Give me the gist and I'll make you famous in Chicago.' He means it kindly. He would also tell anyone in Vienna who bought him a drink.",
    choices: [
      { label: 'Feed him a false route', sub: 'Trieste; he will spread it for you',
        ok: [['plant', { via: 'platt', subj: 'cover:active', claim: { heading: 'TRI' } }], ['trust', 'platt', -1]] },
      { label: 'Give him the gist', sub: '£10, a headline, and a leak traced to you',
        ok: [['money', 10], ['trust', 'platt', 2], ['susp', 'active', 0.2], ['standing', -3]] },
      { label: 'Tell him nothing', sub: 'He will guess anyway',
        ok: [['trust', 'platt', -1]] },
    ] },

  { id: 'op-ultimatum.pipe', at: 'op',
    title: 'A pipe into the Evidenzbureau',
    text: "You kept the mole you named as a pipe for lies, and tonight it could carry one. If Heller believes you are in Budapest, his men will be watching the Ostbahnhof while you are at the Ballhausplatz. A lie spent now cannot be spent again.",
    choices: [
      { label: 'Feed it through Brandl', sub: 'Over a glass of Tokay', if: [['flag', 'op-mole-kept-brandl']],
        ok: [['plant', { via: 'brandl', subj: 'cover:active', claim: { at: 'BUD' } }], ['unflag', 'op-mole-kept-brandl'], ['record', 'meeting', 0.2]] },
      { label: 'Feed it through Ilić', sub: 'A letter to Belgrade', if: [['flag', 'op-mole-kept-ilic']],
        ok: [['plant', { via: 'ilic', subj: 'cover:active', claim: { at: 'BUD' } }], ['unflag', 'op-mole-kept-ilic'], ['record', 'wire', 0.3]] },
      { label: 'Feed it through Amsler', sub: 'A banking instruction to Zurich', if: [['flag', 'op-mole-kept-amsler']],
        ok: [['plant', { via: 'amsler', subj: 'cover:active', claim: { at: 'BUD' } }], ['unflag', 'op-mole-kept-amsler'], ['record', 'wire', 0.3]] },
      { label: 'Keep the pipe for later', sub: 'A better lie may be needed',
        ok: [['nerve', -1]] },
    ] },

  // ---------- aftermath ----------
  { id: 'op-ultimatum.papers', at: 'then', if: [['day', '56']],
    title: "The note in Friday's papers",
    text: 'The note is in every Friday paper in Europe: ten demands, forty-eight hours, Austrian officials to share in the inquiry on Serbian soil. Belgrade has until six tomorrow evening. You lay the newspaper beside the copy you made and read the two together, line by line, as the café fills with arguing men.',
    choices: [
      { label: 'Find the missing clause', if: [['flag', 'op-ultimatum-false']],
        ok: [['standing', -6], ['debrief', 'Your copy lacked the clause on Austrian officials: Brandl had softened it for Heller.']] },
      { label: 'Find them word for word', if: [['not', ['flag', 'op-ultimatum-false']]],
        ok: [['standing', 3], ['debrief', 'Your copy matched the published note word for word.']] },
    ] },
];
