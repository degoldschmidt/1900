// Storylets with Ruedi Amsler (owner: People). Careful; every sentence a ledger entry.
// Arc: a distant contact, met in Zurich or Paris or on the Paris-Zurich line, and otherwise heard from by letter: statements,
// tips and, in Act III, a telegram as the exchanges close. One of the three possible moles (Orlova's, if anyone's).
// Ambiguity: his client in black (amsler.meet, amsler.train) looks bad and may be innocent; only amsler.slip / amsler.steady
// (then) test the truth, and they open the same way.
// Flags: amsler-account, amsler-passport, amsler-gold, amsler-planted, amsler-sold.

const MET = ['any', ['st', 'amsler', 'met'], ['st', 'amsler', 'cultivated'], ['st', 'amsler', 'recruited']];
const SELL = [['susp', 'active', -0.2], ['standing', 3], ['st', 'amsler', 'arrested'], ['unflag', 'amsler-account'], ['trust', 'agathe', -2], ['trust', 'odile', -2],
  ['flag', 'amsler-sold'], ['later', 30, 'amsler.letter']];

export default [
  { id: 'amsler.meet', at: 'person', speaker: 'amsler', if: [['st', 'amsler', 'unknown']], w: 10, once: true,
    title: 'A bank without a name',
    text: "No name on the brass plate; a single clerk; a smell of beeswax and money. Herr Amsler writes your name in a ledger before he says good morning. 'Deposits: welcome. Credit: available. Discretion: expensive. Questions: charged by the hour.' He blots the page. 'Which shall we begin with?'",
    choices: [
      { label: "Open a merchant's account", sub: '£5 deposit; a respectable trade', tag: 'topic:finance', cost: { money: 5 },
        if: [['aff', 'topic:trade', '>=', 1]],
        ok: [['st', 'amsler', 'met'], ['trust', 'amsler', 1], ['flag', 'amsler-account'], ['later', 120, 'amsler.statement']] },
      { label: 'Mention your estates, vaguely', sub: 'Bankers love land they cannot see', tag: 'topic:society',
        if: [['aff', 'topic:society', '>=', 1]],
        ok: [['st', 'amsler', 'met'], ['trust', 'amsler', 2], ['flag', 'amsler-account'], ['later', 120, 'amsler.statement']] },
      { label: 'Open an account for London', sub: '£10 of the Bureau’s money, in your cover name', tag: 'venue:bank', cost: { money: 10 },
        ok: [['st', 'amsler', 'met'], ['trust', 'amsler', 1], ['flag', 'amsler-account'], ['record', 'register', 0.2], ['later', 120, 'amsler.statement']] },
      { label: 'Buy a letter of credit', sub: '£5; good in any bank city, for now', cost: { money: 5 },
        ok: [['st', 'amsler', 'met'], ['item', '+letter-of-credit']] },
      { label: 'Ask who else banks here', sub: 'Questions are charged by the hour',
        roll: { p: 0.4, mods: [[['skill', 'commerce', '>=', 2], 0.2]] },
        ok: [['st', 'amsler', 'met'],
          ['intel', { subj: 'person:amsler', claim: { note: 'Amsler keeps an account for a Russian widow who pays only in gold.' }, src: 'person:amsler', rel: 0.7, truth: true }]],
        fail: [['st', 'amsler', 'met'], ['trust', 'amsler', -2]] },
    ] },

  { id: 'amsler.statement', at: 'then', speaker: 'amsler', if: [['flag', 'amsler-account']], once: true,
    title: 'A statement of account',
    text: "A statement of account in Amsler's small, neat hand: your deposit, a commission, a commission on the commission. At the foot, a line without a figure beside it: 'A client in mourning asked to see your page. I declined. Declining costs me her custom, which I note here for your information, and for my invoice.'",
    choices: [
      { label: 'Pay the invoice, with thanks', sub: '£2; discretion is his only product', cost: { money: 2 },
        ok: [['trust', 'amsler', 1],
          ['intel', { subj: 'hunter:orlova', claim: { note: 'Amsler says a client in mourning asked to see your account; he refused.' }, src: 'person:amsler', rel: 0.5, truth: true }]] },
      { label: 'Ask him for her name', sub: 'He will charge for that too',
        roll: { p: 0.4 },
        ok: [['money', -3], ['intel', { subj: 'hunter:orlova', claim: { at: 'ZUR' }, src: 'person:amsler', rel: 0.6, truth: 'auto' }]],
        fail: [['trust', 'amsler', -1], ['expose', 'amsler', 0.2]] },
      { label: 'Ignore it', sub: 'Bankers enlarge their services',
        ok: [['nerve', -1]] },
    ] },

  { id: 'amsler.draw', at: 'person', speaker: 'amsler', if: [MET, ['flag', 'amsler-account']], w: 2,
    title: 'Drawing on London',
    text: "Amsler opens your page in the ledger with the care of a surgeon opening a patient. 'London's balance is adequate. London's patience, I cannot say.' He uncaps his pen. 'Each draft is a wire, and each wire is read by someone. How much, and how loudly?'",
    choices: [
      { label: 'Draw twenty pounds', sub: 'London notices twenty pounds',
        ok: [['money', 20], ['standing', -3], ['record', 'wire', 0.4]] },
      { label: 'Draw ten pounds, quietly', sub: 'A smaller wire, a smaller frown',
        ok: [['money', 10], ['standing', -1], ['record', 'wire', 0.2]] },
      { label: 'Ask for gold, not paper', sub: 'When banks close, gold does not', if: [['act', 3]],
        ok: [['money', 15], ['standing', -2], ['trust', 'amsler', -1]] },
    ] },

  { id: 'amsler.porcelain', at: 'person', speaker: 'amsler', if: [['st', 'amsler', 'met']], w: 4, once: true,
    title: 'A cup held to the light',
    text: "Amsler collects small beautiful things whose value is certain: porcelain, coins, the odd marble head with a vague provenance. He turns a cup to the light, prices it in his head, and is visibly pleased with the figure. 'Gifts are deposits,' he says, 'of a kind. They earn interest.'",
    choices: [
      { label: 'Give him Copenhagen porcelain', sub: 'He will price it, and approve', if: [['item', 'porcelain']],
        ok: [['item', '-porcelain'], ['trust', 'amsler', 2], ['st', 'amsler', 'cultivated']] },
      { label: 'Give him the antiquities', sub: 'He will not ask where they came from', if: [['item', 'antiquities']],
        ok: [['item', '-antiquities'], ['trust', 'amsler', 2], ['st', 'amsler', 'cultivated']] },
      { label: 'Take his advice on gold', sub: '£10 into gold at his rate; he takes a commission', cost: { money: 10 },
        ok: [['trust', 'amsler', 1], ['st', 'amsler', 'cultivated'], ['flag', 'amsler-gold'], ['later', 72, 'amsler.gold']] },
    ] },

  { id: 'amsler.gold', at: 'then', speaker: 'amsler', if: [['flag', 'amsler-gold']], once: true,
    title: 'Gold has risen',
    text: "A note in the small neat hand: 'Gold has risen three per cent since your purchase, which is to say since Vienna stopped pretending. I can sell at once, or hold, if you trust the future more than I do. I do not.'",
    choices: [
      { label: 'Sell at once', sub: 'A small profit, after his commission',
        ok: [['money', 12], ['unflag', 'amsler-gold']] },
      { label: 'Hold until the crisis peaks', sub: 'If the exchanges close first, you hold nothing',
        roll: { p: 0.5 },
        ok: [['money', 16], ['unflag', 'amsler-gold']],
        fail: [['money', 7], ['unflag', 'amsler-gold']] },
    ] },

  { id: 'amsler.ask', at: 'person', speaker: 'amsler', if: [MET, ['trust', 'amsler', '>=', 2]], w: 5, once: true,
    title: 'Questions, by the hour',
    text: "'You wish to ask questions,' Amsler says, and moves the inkwell an inch, as if to make room for them. 'I will answer those that cost me nothing, at a modest fee, and those that cost me something, at an immodest one. Please be brief. Brevity is a courtesy, and a saving.'",
    choices: [
      { label: 'Ask about the widow in black', sub: 'His client, he says; his secret, he means', cost: { money: 2 },
        ok: [['expose', 'amsler', 0.1], ['later', 18, 'amsler.slip'], ['later', 18, 'amsler.steady'],
          ['intel', { subj: 'hunter:orlova', claim: { at: 'ZUR' }, src: 'person:amsler', rel: 0.5, truth: 'auto' }]] },
      { label: 'Ask who is buying francs', sub: 'Money moves before armies do',
        ok: [['intel', { subj: 'city:ZUR', claim: { note: 'Amsler: Vienna banks are selling paper and buying gold, by the cartload.' }, src: 'person:amsler', rel: 0.7, truth: true }]] },
      { label: "Ask how Heller's informers are paid", sub: 'A banker knows; a banker may lie',
        ok: [['intel', { subj: 'hunter:heller', claim: { note: "Amsler: Heller pays his informers in cash at a Vienna savings bank." }, src: 'person:amsler', rel: 0.5, truth: false }]] },
    ] },

  { id: 'amsler.slip', at: 'then', speaker: 'amsler', if: [['loyal', 'amsler', 'enemy:orlova']], once: true,
    title: 'He names your last city',
    text: "Amsler's next note asks politely after the weather in the city you last stayed in, and names it. You have not written to him from there. You posted your last letter two cities away, on purpose. Bankers know a great deal; this banker knows one thing too many.",
    choices: [
      { label: 'Move your money elsewhere', sub: 'A loss on the exchange, and a lesson',
        ok: [['money', -3], ['unflag', 'amsler-account'], ['intel', { subj: 'person:amsler', claim: { loyal: 'enemy' }, src: 'seen', rel: 0.5, truth: true }]] },
      { label: 'Write that you leave for Munich', sub: 'If he talks, someone meets the Munich train',
        ok: [['plant', { via: 'amsler', subj: 'cover:active', claim: { at: 'MUN' } }], ['expose', 'amsler', 0.2]] },
      { label: 'Let it pass', sub: 'Bankers have correspondents everywhere',
        ok: [['nerve', -1], ['record', 'wire', 0.2]] },
    ] },

  { id: 'amsler.steady', at: 'then', speaker: 'amsler', if: [['not', ['loyal', 'amsler', 'enemy:orlova']]], once: true,
    title: 'He names your last city',
    text: "Amsler's next note asks politely after the weather in the city you last stayed in, and names it. You have not written to him from there. Enclosed, with a ledger entry for the postage, is the reason: a letter from your hotel there, asking him to confirm your credit.",
    choices: [
      { label: 'Move your money elsewhere', sub: 'A loss on the exchange, and a lesson',
        ok: [['money', -3], ['unflag', 'amsler-account'], ['intel', { subj: 'person:amsler', claim: { note: 'Amsler knew your last city: your hotel wrote to him for a credit reference.' }, src: 'seen', rel: 0.7, truth: true }]] },
      { label: 'Write that you leave for Munich', sub: 'If he talks, someone meets the Munich train',
        ok: [['plant', { via: 'amsler', subj: 'cover:active', claim: { at: 'MUN' } }], ['expose', 'amsler', 0.2]] },
      { label: 'Let it pass', sub: 'Bankers have correspondents everywhere',
        ok: [['nerve', -1], ['record', 'wire', 0.2]] },
    ] },

  { id: 'amsler.recruit', at: 'person', speaker: 'amsler', if: [['st', 'amsler', 'cultivated'], ['trust', 'amsler', '>=', 3]], w: 6, once: true,
    title: 'Terms of engagement',
    text: "'You propose a relationship,' Amsler says. 'Very well. Terms. I want money, which you have, and safety, which you may not. If there is a war, Switzerland will be neutral, and Swiss bankers will be suspected by everyone. I should like a door somewhere. London, perhaps.'",
    choices: [
      { label: 'Offer him a commission on London', sub: 'The Bureau pays him; Ashby will grumble',
        ok: [['st', 'amsler', 'recruited'], ['standing', -2]] },
      { label: 'Offer him a British passport', sub: 'A door, if war comes; a promise to keep',
        ok: [['st', 'amsler', 'recruited'], ['flag', 'amsler-passport']] },
      { label: 'Not yet', sub: 'He will note the refusal, and the date',
        ok: [['trust', 'amsler', -1], ['nerve', 1]] },
    ] },

  { id: 'amsler.call', at: 'person', speaker: 'amsler', if: [MET], w: 1,
    title: 'Herr Amsler, by appointment',
    text: "Amsler sees you by appointment, for exactly as long as the appointment, and rises when it ends. In between he listens with his pen uncapped, though he never writes anything down while you are in the room. Afterwards, you suspect, he writes everything.",
    choices: [
      { label: 'Bring him Copenhagen porcelain', sub: 'A deposit of a kind', if: [['item', 'porcelain'], ['trust', 'amsler', '<', 4]],
        ok: [['item', '-porcelain'], ['trust', 'amsler', 2]] },
      { label: 'Mention a transfer to Munich', sub: 'If he talks, someone watches the Munich bank', if: [['not', ['flag', 'amsler-planted']]],
        ok: [['plant', { via: 'amsler', subj: 'cover:active', claim: { at: 'MUN' } }], ['expose', 'amsler', 0.3], ['flag', 'amsler-planted']] },
      { label: 'Denounce him to the federal police', sub: 'Bern hates foreign spies; Ashby may approve', ok: SELL },
      { label: 'Keep the appointment short', sub: 'He will bill you for the full hour',
        ok: [['money', -1], ['watch', -0.05]] },
    ] },

  { id: 'amsler.train', at: 'train', speaker: 'amsler', if: [MET], once: true,
    title: 'A widow gets down at Belfort',
    text: "Amsler is in the first-class dining car, adding up his bill twice. At Belfort a small woman in widow's black with very good gloves gets down from the next carriage. Amsler watches her go, and then looks at his bill again, as though she might have added something to it.",
    choices: [
      { label: 'Ask him who she was', sub: 'He may tell you; he may invoice you',
        roll: { p: 0.5 },
        ok: [['intel', { subj: 'person:amsler', claim: { note: 'Amsler says the widow at Belfort is a client, and a difficult one.' }, src: 'person:amsler', rel: 0.5, truth: true }]],
        fail: [['trust', 'amsler', -1]] },
      { label: 'Follow her onto the platform', sub: 'The train will not wait long',
        roll: { p: 0.5, mods: [[['skill', 'observation', '>=', 2], 0.2]] },
        ok: [['delay', 60], ['intel', { subj: 'hunter:orlova', claim: { heading: 'ZUR' }, src: 'seen', rel: 0.7, truth: 'auto' }]],
        fail: [['delay', 60], ['record', 'sighting', 0.8]] },
      { label: 'Say nothing, and note it', sub: 'A note is cheap; a question is not',
        ok: [['intel', { subj: 'person:amsler', claim: { note: 'Amsler watched a widow in black leave the train at Belfort.' }, src: 'seen', rel: 0.9, truth: true }], ['later', 48, 'amsler.statement']] },
    ] },

  { id: 'amsler.closing', at: 'interlude', if: [['act', 3], ['flag', 'amsler-account']], once: true,
    title: 'EXCHANGES CLOSING',
    text: "A telegram from Zurich, prepaid reply: EXCHANGES CLOSING STOP CREDIT LETTERS WORTHLESS FROM TOMORROW STOP CAN WIRE TWENTY IN GOLD TODAY AT FOUR PER CENT STOP OR NOTHING STOP AMSLER. Even in telegraphese he has found room for his commission.",
    choices: [
      { label: 'Wire for the gold', sub: '£20 less his four per cent; London will hear',
        ok: [['money', 19], ['standing', -2], ['record', 'wire', 0.3]] },
      { label: 'Ask him to keep it safe instead', sub: 'Money in Zurich is money in the war',
        ok: [['trust', 'amsler', 1], ['standing', 1]] },
    ] },

  // ---------- protect and betray ----------
  { id: 'amsler.compromised', at: 'person', speaker: 'amsler', if: [['st', 'amsler', 'compromised']], w: 9,
    title: 'A page is missing',
    text: "Amsler's ledger lies open on the desk, and a page has been cut out of it with a razor, very neatly. 'My clerk,' he says. 'Bribed. The page was yours.' He closes the ledger. 'I do not panic. I itemise. Item: they know your name. Item: they know mine. Item: I should like to leave.'",
    choices: [
      { label: 'Give him his British passport now', sub: 'You promised him a door', if: [['flag', 'amsler-passport']],
        ok: [['st', 'amsler', 'cultivated'], ['trust', 'amsler', 2], ['standing', -2]] },
      { label: 'Pay to replace the clerk', sub: '£10 for a clerk who has never heard of you', cost: { money: 10 },
        ok: [['st', 'amsler', 'cultivated'], ['trust', 'amsler', 1]] },
      { label: 'Close your account with him', sub: 'Your money moves; his danger stays',
        ok: [['unflag', 'amsler-account'], ['st', 'amsler', 'met'], ['trust', 'amsler', -2]] },
      { label: 'Denounce him to the federal police', sub: 'Bern hates foreign spies; Ashby may approve', ok: SELL },
    ] },

  { id: 'amsler.letter', at: 'then', speaker: 'amsler', if: [['flag', 'amsler-sold']],
    title: 'A final statement',
    text: "A final statement of account, from a lawyer's office in Bern. Every franc is listed, every commission, every courtesy. At the foot, in Amsler's own small hand: 'Balance carried forward: one denunciation. Interest will accrue. R.A.' The ink is perfectly steady.",
    choices: [
      { label: 'Burn it', sub: 'Lawyers keep copies',
        ok: [['nerve', -2]] },
      { label: 'Pay his legal fees, unsigned', sub: '£15; Agathe banked with him too', cost: { money: 15 },
        ok: [['trust', 'agathe', 1], ['trust', 'odile', 1]] },
    ] },
];
