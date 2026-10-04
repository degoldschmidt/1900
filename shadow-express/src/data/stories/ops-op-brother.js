// Storylets of op-brother, The Brother (owner: Ops). See docs/CONTRACTS.md §5.

const freed = ['op', 'op-brother', 'step:free'];
const ilicSold = ['intel', { subj: 'person:ilic', claim: { loyal: 'enemy' }, src: 'seen', rel: 0.9, truth: 'auto' }];
const sprung = [['op', 'op-brother', 'fail'], ilicSold];

export default [
  { id: 'op-brother.visit', at: 'op',
    title: 'Confession in a cell',
    text: "The warder lets you into the hostages' cell with a lantern and a stool. Twelve men in their shirtsleeves; one of them, with Ilić's nose and a schoolmaster's spectacles, is Pavle. The warder waits outside the door, scratching. You have perhaps a quarter of an hour, the authority of your calling, and nothing else.",
    choices: [
      { label: 'Walk him out as your server', sub: 'He carries the lantern; you bless the warder',
        roll: { p: 0.55, mods: [[['item', 'blessing-letter'], 0.15], [['skill', 'composure', '>=', 2], 0.1]] },
        ok: [freed, ['record', 'register', 0.4]], fail: [['record', 'register', 1], ['susp', 'active', 0.2], ['nerve', -2]] },
      { label: 'Certify him with a fever', sub: 'The military hospital has no bars; it takes a day', cost: { min: 600 },
        ok: [freed, ['record', 'register', 0.3]] },
      { label: 'Leave him a file in a breviary', sub: 'He escapes tonight, alone, or does not',
        roll: { p: 0.4 },
        ok: [freed, ['debrief', 'Pavle filed his way out alone, with the tool you left in a breviary.']],
        fail: [['op', 'op-brother', 'fail'], ['debrief', 'Pavle was caught with your file, and moved to Tuzla in chains.']] },
    ] },

  { id: 'op-brother.warder', at: 'op',
    title: "The warder's price",
    text: "The warder counts your money twice in the back room of a čevabdžinica. 'The hostages go to Tuzla on Thursday,' he says. 'One may fall off the cart. It happens. For another five pounds, he falls off near the Goat's Bridge, where your friends can be waiting.'",
    choices: [
      { label: 'Pay the extra five', sub: 'Five pounds, and his word', cost: { money: 5 },
        ok: [freed, ['record', 'bribe', 0.5]] },
      { label: 'Pay nothing more; trust luck', sub: 'Carts are slow; luck is cheaper',
        roll: { p: 0.5 }, ok: [freed], fail: [['record', 'bribe', 1], ['nerve', -1]] },
      { label: 'Threaten to report him', sub: 'Get your money back, or make an enemy',
        roll: { p: 0.35, mods: [[['item', 'browning'], 0.15], [['skill', 'streetwise', '>=', 2], 0.15]] },
        ok: [freed, ['money', 10]], fail: [['record', 'bribe', 1], ['susp', 'active', 0.2]] },
    ] },

  { id: 'op-brother.trap', at: 'op',
    title: 'We were expecting you',
    text: "The prison yard is too quiet. The warder who was to meet you is not there; instead a police inspector steps out of the guardroom with a list in his hand. 'Pavle Ilić was never arrested,' he says pleasantly. 'His brother is a great help to the Evidenzbureau. Come inside.' Two gendarmes close the gate behind you.",
    choices: [
      { label: 'Run for the gate', sub: 'Before it is barred',
        roll: { p: 0.5, mods: [[['nerve', '>=', 6], 0.1], [['skill', 'streetwise', '>=', 2], 0.1]] },
        ok: [...sprung, ['record', 'sighting', 1]], fail: [...sprung, ['susp', 'active', 0.4], ['nerve', -3]] },
      { label: 'Draw the pistol', sub: 'And then what?', if: [['item', 'browning']],
        roll: { p: 0.65 },
        ok: [...sprung, ['record', 'sighting', 1], ['nerve', -1]], fail: [...sprung, ['susp', 'active', 0.5], ['item', '-browning']] },
      { label: 'Bluff: you came to visit a friar', sub: 'Your legend against his list',
        roll: { p: 0.4, mods: [[['cover', 'doyle'], 0.3], [['skill', 'german', '>=', 2], 0.1]] },
        ok: [...sprung, ['record', 'register', 0.8]], fail: [...sprung, ['susp', 'active', 0.4]] },
    ] },

  { id: 'op-brother.visegrad', at: 'op',
    title: 'Gendarmes at Višegrad',
    text: 'The coach stops at the Višegrad bridge, the old Turkish one of eleven arches, and Austrian gendarmes look in with lanterns. Pavle sits beside you in a borrowed coat, his schoolmaster\'s hands folded, pretending to sleep. The sergeant counts heads twice and frowns, because there is one more than on his list.',
    choices: [
      { label: 'Pay for the extra head', sub: '£3; sergeants can count either way', cost: { money: 3 },
        roll: { p: 0.65 }, ok: [['record', 'bribe', 0.4]], fail: [['record', 'bribe', 1], ['delay', 240]] },
      { label: 'Explain him away in German', sub: 'A servant, a cousin, a fever',
        roll: { p: 0.45, mods: [[['skill', 'german', '>=', 1], 0.2], [['skill', 'composure', '>=', 2], 0.1]] },
        ok: [['record', 'frontier', 0.4]], fail: [['record', 'frontier', 1], ['delay', 360]] },
      { label: "Wake him and walk Ilić's ford", sub: 'A mile downstream, by night, in the water', if: [['flag', 'ilic-path']],
        ok: [['delay', 180], ['nerve', -1]] },
    ] },

  { id: 'op-brother.cross', at: 'op', speaker: 'ilic', if: [['city', 'BEG']],
    title: 'Two brothers on the Kalemegdan',
    text: "Pavle and Dragan Ilić embrace on the ramparts of the Kalemegdan, above the two rivers, while you look elsewhere. Then the lieutenant turns to you, in tears and in uniform. 'I owe you a brother,' he says. 'Ask me for anything. Ask me now, before they send me to the Drina.'",
    choices: [
      { label: 'Ask him about the Drina fords', sub: 'A way out of Serbia, one day',
        ok: [['trust', 'ilic', 1],
          ['intel', { subj: 'city:SAR', claim: { note: 'Ilić: the Drina ford below Višegrad is unguarded on moonless nights.' }, src: 'person:ilic', rel: 0.8, truth: true }]] },
      { label: "Ask for the staff's gossip", sub: 'In a café, where anyone may listen',
        ok: [['trust', 'ilic', 1], ['record', 'meeting', 0.3],
          ['intel', { subj: 'hunter:heller', claim: { at: 'SAR' }, src: 'person:ilic', rel: 0.5, truth: 'auto' }]] },
      { label: 'Ask for nothing', sub: 'A debt is worth more unpaid',
        ok: [['trust', 'ilic', 2]] },
    ] },
];
