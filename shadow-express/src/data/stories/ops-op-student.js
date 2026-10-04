// Storylets of op-student, Get Jovan Out (owner: Ops). See docs/CONTRACTS.md §5. The Belgrade posting.

// The way out is a chain of `then` continuations armed by finding him (ROAD): Ilić's informer, the Semlin rumour,
// the Bulgarian frontier, and the mobilisation that makes Jovan want to fight. A courier takes him without you.

const traced = ['op', 'op-student', 'step:trace'];
const found = ['op', 'op-student', 'step:find'];
const ROAD = [['later', 0.5, 'op-student.informer'], ['later', 2, 'op-student.semlin'], ['later', 4, 'op-student.tsaribrod'], ['later', 6, 'op-student.enlist']];
const ILIC = ['loyal', 'ilic', 'enemy:heller'];
const WITH = ['item', 'companion-jovan'];
const ilicSold = ['intel', { subj: 'person:ilic', claim: { loyal: 'enemy' }, src: 'seen', rel: 0.75, truth: 'auto' }];
const taken = [['item', '-companion-jovan'], ['st', 'jovan', 'arrested'], ['op', 'op-student', 'fail'], ['record', 'sighting', 1]];
const semlinRumour = ['intel', { subj: 'line:BUD-BEG', claim: { closed: [null, null] }, src: 'rumour', rel: 0.5, truth: 'auto' }];
const northward = { subj: 'op:op-student', claim: { heading: 'BUD' } };
const SHAVED = ['flag', 'op-student-shaved'];

export default [
  // ---------- tracing him ----------
  { id: 'op-student.ilic', at: 'op', speaker: 'ilic',
    title: 'Ilić knows a cellar',
    text: "Ilić is in civilian clothes for once, and sober, which frightens you more. 'The boy is in a cellar under a cooper's shop by the Sava,' he says. 'I will take you there tonight. Come alone; the fewer feet, the fewer ears.' He seems genuinely fond of Jovan. He also seems to know a great deal about who else is looking for him.",
    choices: [
      { label: 'Go with him tonight', sub: 'Two are safer than one, he says',
        ok: [traced, ['flag', 'op-student-ilic'], ['trust', 'ilic', 1]] },
      { label: 'Take the address; go alone now', sub: 'Before anyone else can use it', cost: { min: 60 },
        ok: [traced, ['trust', 'ilic', -1]] },
      { label: 'Thank him, and look elsewhere', sub: 'He will be hurt; he may be dangerous',
        ok: [['trust', 'ilic', -1]] },
    ] },

  { id: 'op-student.find', at: 'op', speaker: 'jovan',
    title: "Jovan under the cooper's shop",
    text: "Jovan has not shaved for a week and has lost a stone. He sleeps in a cellar that smells of new barrels, with a borrowed revolver he cannot load. Two Austrian agents asked for him at the Zlatna Moruna yesterday. 'I knew you would come,' he says, which is not quite true. 'Where are we going?'",
    choices: [
      { label: 'With me, tonight', sub: 'You escort him, and answer for him',
        ok: [found, ...ROAD, ['trust', 'jovan', 1], ['nerve', -1]] },
      { label: 'Buy him a shave and a suit', sub: '£4; a different young man', cost: { money: 4 },
        ok: [found, ...ROAD, SHAVED, ['trust', 'jovan', 1]] },
      { label: 'Hand him to your courier', sub: 'Safer for you; he hates strangers',
        if: [['any', ['st', 'kowal', 'recruited'], ['st', 'agathe', 'recruited']]],
        ok: [found, ['item', '-companion-jovan'], ['trust', 'jovan', -1], ['later', 60, 'op-student.courier']] },
    ] },

  { id: 'op-student.courier', at: 'then', if: [['op', 'op-student'], ['not', ['op', 'op-student', 'out']]],
    title: 'Word from the courier',
    text: "Two and a half days after you gave Jovan to your courier, the cable office has a telegram for your cover name: an uncle's news, in a code agreed over a café table. Before you open it you remember how Jovan looked at the courier: a stranger, at a stranger's prices.",
    choices: [
      { label: 'Open the telegram', sub: 'Safe across, or taken at a frontier',
        roll: { p: 0.75, mods: [[['trust', 'jovan', '>=', 2], 0.1], [['st', 'agathe', 'recruited'], 0.05]] },
        ok: [['debrief', 'Your courier took Jovan out of Serbia, and London had its witness without your fingerprints on him.'],
          ['op', 'op-student', 'step:out']],
        fail: [['debrief', 'Your courier lost Jovan at a frontier, and the Austrians had their witness.'],
          ['st', 'jovan', 'arrested'], ['op', 'op-student', 'fail']] },
    ] },

  // ---------- twists ----------
  { id: 'op-student.informer', at: 'then', if: [['flag', 'op-student-ilic'], ILIC, ['city', 'BEG'], WITH],
    title: 'They knew the address',
    text: 'When you step out with Jovan, two men in Austrian-cut suits are drinking coffee across the street, with a Serbian gendarme who has been paid to drink with them. Jovan goes white. Nobody but Ilić knew this address, or this hour. The gendarme reads faces against a paper in his hand, slowly, as if it were a menu.',
    choices: [
      { label: 'Out through the back yards', sub: 'Slowly, as if you had business there',
        roll: { p: 0.5, mods: [[['skill', 'tradecraft', '>=', 2], 0.15], [SHAVED, 0.1]] },
        ok: [ilicSold, ['min', 120]],
        fail: [ilicSold, ['debrief', 'Austrian agents took Jovan in a Belgrade street. Ilić had sold them the address.'], ...taken] },
      { label: 'Bluff: he is your secretary', sub: 'Your legend had better be good',
        roll: { p: 0.4, mods: [[['cover', 'doyle'], 0.2], [['cover', 'vessey'], 0.2], [SHAVED, 0.15], [['legend', '>=', 0.5], 0.1]] },
        ok: [ilicSold, ['record', 'sighting', 0.6]],
        fail: [ilicSold, ['debrief', 'Austrian agents took Jovan in a Belgrade street. Ilić had sold them the address.'], ...taken] },
      { label: 'Outbid them for the gendarme', sub: '£10, in Serbian, and quickly', cost: { money: 10 },
        roll: { p: 0.55, mods: [[['skill', 'slavic', '>=', 1], 0.2]] },
        ok: [ilicSold, ['record', 'bribe', 0.7]],
        fail: [ilicSold, ['debrief', 'A gendarme took your money and Jovan both. Ilić had sold the address.'], ...taken, ['record', 'bribe', 1]] },
    ] },

  { id: 'op-student.semlin', at: 'then', if: [WITH, ['city', 'BEG']],
    title: 'The Semlin bridge is blown',
    text: 'When you go to the station for tickets, it is crowded with families sitting on their trunks, and a rumour runs ahead of every train: the Serbs have mined the Semlin bridge, or blown it already, and nothing will go north again. A clerk chalks DELAYED against every departure and refuses to say more. Jovan watches the gendarmes, and the gendarmes watch everyone.',
    choices: [
      { label: 'Ask the stationmaster outright', sub: 'He knows; he may not say',
        roll: { p: 0.45, mods: [[['skill', 'slavic', '>=', 1], 0.25], [['skill', 'charm', '>=', 2], 0.1]] },
        ok: [['intel', { subj: 'line:BUD-BEG', claim: { note: 'The stationmaster: the bridge stands, mined at both ends; trains run while it does.' }, src: 'seen', rel: 0.85, truth: true }]],
        fail: [semlinRumour, ['watch', 0.1]] },
      { label: 'Bribe the telegraph clerk', sub: '£2; the Semlin wire runs over the bridge', cost: { money: 2 },
        ok: [['intel', { subj: 'line:BUD-BEG', claim: { note: 'The Semlin wire still works, so the bridge still stands. For now.' }, src: 'porter', rel: 0.8, truth: true }],
          ['record', 'bribe', 0.3]] },
      { label: 'Walk down to the Sava and look', sub: 'An hour and a half; foreigners at bridges are noticed', cost: { min: 90 }, if: [['city', 'BEG']],
        ok: [['intel', { subj: 'line:BUD-BEG', claim: { note: 'The bridge stands. Sappers are working under the first span, and they are not mending it.' }, src: 'seen', rel: 0.95, truth: true }],
          ['record', 'sighting', 0.4]] },
      { label: 'Take it on trust', sub: 'Rumours are sometimes true',
        ok: [semlinRumour, ['nerve', -1]] },
    ] },

  { id: 'op-student.enlist', at: 'then', speaker: 'jovan', if: [WITH, ['nation', 'RS'], ['day', '012']],
    title: 'Jovan wants to enlist',
    text: "Serbia is mobilising: reservists in their Sunday clothes at every corner and every station, women running beside them, a band somewhere. Jovan watches from the window for a long time. 'Every Bosnian in Belgrade is volunteering,' he says. 'My friends are in Austrian cells, and you want me to sit in a café abroad.' He is twenty, and he is not asking.",
    choices: [
      { label: 'Talk him round', sub: 'He trusts you, or he does not',
        roll: { p: 0.4, mods: [[['trust', 'jovan', '>=', 2], 0.3], [['flag', 'op-cable-promise'], 0.15], [['skill', 'charm', '>=', 2], 0.1]] },
        ok: [['trust', 'jovan', -1]],
        fail: [['debrief', 'Jovan slipped away to the recruiting office and went to fight for Serbia.'],
          ['item', '-companion-jovan'], ['trust', 'jovan', 1], ['op', 'op-student', 'fail']] },
      { label: 'Let him enlist', sub: 'London loses him; he keeps his honour',
        ok: [['debrief', 'You let Jovan enlist. London wanted him; Serbia got him.'],
          ['item', '-companion-jovan'], ['trust', 'jovan', 2], ['op', 'op-student', 'fail']] },
      { label: 'Tell him London needs his evidence', sub: 'Half true, and he will know which half',
        ok: [['trust', 'jovan', -2], ['debrief', 'You told Jovan that London needed him. It did, a little.']] },
    ] },

  { id: 'op-student.tsaribrod', at: 'then', if: [WITH, ['nation', 'BG']],
    title: 'The Bulgarian frontier at Tsaribrod',
    text: "At Tsaribrod the Bulgarian officials take their time. Bulgaria lost a war to Serbia last summer and has not forgiven it; a young Serb travelling east this July is a spy or a deserter, and either can be sold to somebody. The inspector holds Jovan's papers by one corner, as if they were damp.",
    choices: [
      { label: "Pay the inspector's fee", sub: '£4, which is not a fee', cost: { money: 4 },
        roll: { p: 0.7 }, ok: [['record', 'bribe', 0.4]], fail: [['record', 'bribe', 0.9], ['delay', 360]] },
      { label: 'Vouch for him as your secretary', sub: 'Your legend, and his new suit',
        roll: { p: 0.45, mods: [[SHAVED, 0.15], [['cover', 'doyle'], 0.15], [['cover', 'vessey'], 0.15]] },
        ok: [['record', 'frontier', 0.4]], fail: [['record', 'frontier', 1], ['delay', 720]] },
      { label: 'Talk to him in Bulgarian', sub: 'Near enough to Serbian, if you are good', if: [['skill', 'slavic', '>=', 2]],
        roll: { p: 0.7 }, ok: [['record', 'frontier', 0.3]], fail: [['delay', 360]] },
    ] },

  { id: 'op-student.pipe', at: 'op',
    title: 'A false trail for Jovan',
    text: 'The mole you kept could carry one lie to Vienna tonight: that Jovan is going north, over the Semlin bridge to Budapest. If Heller believes it, his men will wait at Semlin while you take the other road. A lie spent now cannot be spent again.',
    choices: [
      { label: 'Feed it through Brandl', sub: 'A letter about a patient', if: [['flag', 'op-mole-kept-brandl']],
        ok: [['plant', { via: 'brandl', ...northward }], ['unflag', 'op-mole-kept-brandl'], ['record', 'wire', 0.3]] },
      { label: 'Feed it through Ilić', sub: 'He will tell everyone, as usual', if: [['flag', 'op-mole-kept-ilic']],
        ok: [['plant', { via: 'ilic', ...northward }], ['unflag', 'op-mole-kept-ilic'], ['record', 'meeting', 0.3]] },
      { label: 'Feed it through Amsler', sub: 'A draft payable in Budapest', if: [['flag', 'op-mole-kept-amsler']],
        ok: [['plant', { via: 'amsler', ...northward }], ['unflag', 'op-mole-kept-amsler'], ['record', 'wire', 0.3]] },
      { label: 'Keep the pipe for later', sub: 'A better lie may be needed',
        ok: [['nerve', -1]] },
    ] },
];
