// Storylets of op-student, Get Jovan Out (owner: Ops). See docs/CONTRACTS.md §5.

const found = ['op', 'op-student', 'step:find'];
const ilicSold = ['intel', { subj: 'person:ilic', claim: { loyal: 'enemy' }, src: 'seen', rel: 0.75, truth: 'auto' }];
const taken = [['item', '-companion-jovan'], ['st', 'jovan', 'arrested'], ['op', 'op-student', 'fail'], ['record', 'sighting', 1]];
const semlin = ['intel', { subj: 'line:BUD-BEG', claim: { closed: [null, null] }, src: 'rumour', rel: 0.5, truth: 'auto' }];
const southward = { subj: 'op:op-student', claim: { heading: 'BEG' } };

export default [
  // ---------- step ----------
  { id: 'op-student.reach', at: 'op', if: [['city', 'SAR']],
    title: 'Sarajevo under martial law',
    text: 'Posters in three scripts proclaim the state of emergency. Serb shops are shuttered; Serb men are taken as hostages for the good behaviour of their villages. A gendarme checks papers at the Latin Bridge. Somewhere in this town Jovan is hiding, and somewhere a prisoner is buying his own release by naming where.',
    choices: [
      { label: 'Walk in openly under your legend', sub: 'Papers shown, a register signed',
        ok: [['record', 'register', 0.5], ['nerve', 1]] },
      { label: 'Come in with the market carts', sub: 'At dawn; muddy boots, no register', cost: { min: 180 },
        ok: [['record', 'sighting', 0.15]] },
      { label: 'Wire Ilić to meet you', sub: 'He knows the town; the censor reads wires', if: [['not', ['st', 'ilic', 'unknown']]],
        ok: [['flag', 'op-student-ilic'], ['record', 'wire', 0.4]] },
    ] },

  // ---------- way ----------
  { id: 'op-student.ilic', at: 'op', speaker: 'ilic',
    title: 'Ilić knows a cellar',
    text: "Ilić is in civilian clothes for once, and sober, which frightens you more. 'The boy is in a cellar under a cooper's shop by the Miljacka,' he says. 'I will take you there tonight. Come alone; the fewer feet, the fewer ears.' He seems genuinely fond of Jovan. He also seems to know a great deal about the police's plans.",
    choices: [
      { label: 'Go with him tonight', sub: 'Two are safer than one, he says',
        ok: [found, ['flag', 'op-student-ilic'], ['trust', 'ilic', 1]] },
      { label: 'Take the address; go alone now', sub: 'Before anyone else can use it', cost: { min: 60 },
        ok: [found, ['trust', 'ilic', -1]] },
      { label: 'Thank him, and look elsewhere', sub: 'He will be hurt; he may be dangerous',
        ok: [['trust', 'ilic', -1]] },
    ] },

  // ---------- twists ----------
  { id: 'op-student.informer', at: 'op',
    title: 'They knew the hour',
    text: 'At the station two gendarmes stand exactly where you would have stood, watching exactly the train you meant to take. Jovan goes white. Nobody but Ilić knew the hour. Behind you a third gendarme walks slowly down the platform, reading faces against a paper in his hand.',
    choices: [
      { label: 'Walk him out through the goods yard', sub: 'Slowly, as if you had business there',
        roll: { p: 0.5, mods: [[['nerve', '>=', 6], 0.1]] },
        ok: [ilicSold, ['min', 120]],
        fail: [ilicSold, ...taken, ['debrief', 'The gendarmes took Jovan at Sarajevo station. Ilić had sold them the hour.']] },
      { label: 'Bluff: he is your secretary', sub: 'Your legend had better be good',
        roll: { p: 0.4, mods: [[['cover', 'doyle'], 0.2], [['cover', 'vessey'], 0.2]] },
        ok: [ilicSold, ['record', 'sighting', 0.6]],
        fail: [ilicSold, ...taken, ['debrief', 'The gendarmes took Jovan at Sarajevo station. Ilić had sold them the hour.']] },
      { label: 'Bribe the third gendarme', sub: '£10, and he may take it', cost: { money: 10 },
        roll: { p: 0.6 },
        ok: [ilicSold, ['record', 'bribe', 0.7]],
        fail: [ilicSold, ...taken, ['record', 'bribe', 1]] },
    ] },

  { id: 'op-student.semlin', at: 'op',
    title: 'The Semlin bridge is blown',
    text: "The station is a riot of reservists, and a rumour runs ahead of every train: the Serbs have blown the Semlin bridge, and Serbian spies are riding the Vienna expresses. Gendarmes are checking every young man's papers for a Bosnian birthplace. Jovan's papers say Sarajevo, and his face says the rest.",
    choices: [
      { label: 'Take a sleeping compartment', sub: '£6; a closed door, and a berth list', cost: { money: 6 },
        ok: [['record', 'berth', 0.6], semlin] },
      { label: 'Pass him off as your secretary', sub: 'Gendarmes respect a confident employer',
        roll: { p: 0.5, mods: [[['cover', 'doyle'], 0.2], [['cover', 'vessey'], 0.2], [['item', 'blessing-letter'], 0.1]] },
        ok: [['record', 'sighting', 0.3], semlin],
        fail: [semlin, ...taken, ['debrief', 'Jovan was taken off the train in the spy panic of the Semlin rumour.']] },
      { label: 'Wait until the panic passes', sub: 'Six hours you may not have', cost: { min: 360 },
        ok: [semlin] },
    ] },

  { id: 'op-student.belgrade', at: 'op', speaker: 'jovan',
    title: 'Jovan wants to fight',
    text: "News of the Serbian mobilisation runs along the platform, shouted from hand to hand. Jovan reads the newspaper twice and stands up. 'Belgrade,' he says. 'My friends are in cells and my country is calling its men, and you are taking me to Italy to be safe.' He is twenty, and he is not asking.",
    choices: [
      { label: 'Talk him round', sub: 'He trusts you, or he does not',
        roll: { p: 0.4, mods: [[['trust', 'jovan', '>=', 2], 0.3], [['flag', 'op-cable-promise'], 0.15]] },
        ok: [['trust', 'jovan', -1]],
        fail: [['item', '-companion-jovan'], ['trust', 'jovan', 1], ['op', 'op-student', 'fail'],
          ['debrief', 'Jovan got off the train and went home to fight for Serbia.']] },
      { label: 'Let him go to Belgrade', sub: 'London loses him; he keeps his honour',
        ok: [['item', '-companion-jovan'], ['trust', 'jovan', 2], ['op', 'op-student', 'fail'],
          ['debrief', 'You let Jovan go home to fight. London wanted him; Serbia got him.']] },
      { label: 'Tell him London needs his evidence', sub: 'Half true, and he will know which half',
        ok: [['trust', 'jovan', -2], ['debrief', 'You told Jovan that London needed him. It did, a little.']] },
    ] },

  { id: 'op-student.pipe', at: 'op',
    title: 'A false trail for Jovan',
    text: "The mole you kept could carry one lie to Vienna tonight: that Jovan is being taken south, over the Drina to Belgrade. If Heller believes it, his men will watch Višegrad and the Drina fords while you take the northern line.",
    choices: [
      { label: 'Feed it through Brandl', sub: 'A letter about a patient', if: [['flag', 'op-mole-kept-brandl']],
        ok: [['plant', { via: 'brandl', ...southward }], ['unflag', 'op-mole-kept-brandl'], ['record', 'wire', 0.3]] },
      { label: 'Feed it through Ilić', sub: 'He will tell everyone, as usual', if: [['flag', 'op-mole-kept-ilic']],
        ok: [['plant', { via: 'ilic', ...southward }], ['unflag', 'op-mole-kept-ilic'], ['record', 'wire', 0.3]] },
      { label: 'Feed it through Amsler', sub: 'A draft payable in Belgrade', if: [['flag', 'op-mole-kept-amsler']],
        ok: [['plant', { via: 'amsler', ...southward }], ['unflag', 'op-mole-kept-amsler'], ['record', 'wire', 0.3]] },
      { label: 'Keep the pipe for later', sub: 'A better lie may be needed',
        ok: [['nerve', -1]] },
    ] },
];
