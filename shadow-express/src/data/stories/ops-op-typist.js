// Storylets of op-typist, Fräulein Sauer (owner: Ops). See docs/CONTRACTS.md §5.

const lost = (line) => [['st', 'sauer', 'arrested'], ['item', '-companion-sauer'], ['op', 'op-typist', 'fail'], ['debrief', line]];
const southward = { subj: 'op:op-typist', claim: { heading: 'MUN' } };

export default [
  // ---------- step ----------
  { id: 'op-typist.meet', at: 'op', speaker: 'sauer', if: [['city', 'BER']],
    title: 'Gloves she did not buy',
    text: "Sauer is waiting in the Wertheim tea room with a parcel of gloves she did not buy. This week she has typed the same railway timetable four times: which trains, which bridges, which day. Yesterday two men from IIIb went through the typing pool's wastepaper baskets. 'I will come,' she says. 'I am frightened, so I will be quick.'",
    choices: [
      { label: 'Leave tonight, as you are', sub: 'Quick; she leaves her whole life behind',
        ok: [['trust', 'sauer', -1], ['nerve', 1]] },
      { label: 'Give her a day to settle', sub: 'Steadier, and a day for IIIb', cost: { min: 720 },
        ok: [['trust', 'sauer', 2], ['expose', 'sauer', 0.2]] },
      { label: 'Give her a Paris hat for travelling', sub: 'Courage comes in hatboxes', if: [['item', 'couture-hat']],
        ok: [['trust', 'sauer', 2], ['item', '-couture-hat']] },
    ] },

  // ---------- twists ----------
  { id: 'op-typist.followed', at: 'op',
    title: 'Sauer is followed',
    text: "In a tobacconist's window you see her reflection, and behind it, at a steady forty paces, a young man in a straw boater who is looking at nothing in particular. He was outside the Wertheim too. Sauer has not seen him. If she turns now, he will know that she knows.",
    choices: [
      { label: 'Lose him in the Underground', sub: 'Two changes, one crowded platform',
        roll: { p: 0.55, mods: [[['trust', 'sauer', '>=', 2], 0.1]] },
        ok: [['nerve', -1]], fail: [['expose', 'sauer', 0.8], ['record', 'sighting', 0.8]] },
      { label: 'Let him follow to a false address', sub: 'Two hours; he reports a flat you never use', cost: { min: 120 },
        ok: [['record', 'sighting', 0.5], ['expose', 'sauer', 0.3]] },
      { label: 'Split up; meet at the station', sub: 'He must choose whom to follow',
        roll: { p: 0.6 },
        ok: [['trust', 'sauer', -1]],
        fail: lost('Sauer was taken alone in the Friedrichstrasse, with your train ticket in her glove.') },
    ] },

  { id: 'op-typist.sister', at: 'op', speaker: 'sauer',
    title: 'A sister in Hamburg',
    text: "On the platform Sauer stops dead. 'Lotte,' she says. 'My sister. When they cannot find me, they will go to her.' Hamburg lies on the slow road to Copenhagen, by the Korsør ferry. It lies on the way to nowhere else. She does not ask; she waits to see what kind of person you are.",
    choices: [
      { label: 'Go by Hamburg and fetch Lotte', sub: 'The slow road, and two women to hide',
        ok: [['trust', 'sauer', 2], ['later', 2, 'op-typist.lotte']] },
      { label: 'Wire Lotte money to run', sub: '£8, and a telegram IIIb may read', cost: { money: 8 },
        ok: [['trust', 'sauer', 1], ['record', 'wire', 0.6]] },
      { label: 'There is no time', sub: 'She will not forgive it',
        ok: [['trust', 'sauer', -2], ['debrief', 'You would not wait for Lotte Sauer. IIIb questioned her for a week.']] },
    ] },

  { id: 'op-typist.permit', at: 'op',
    title: 'Papers, Fräulein',
    text: 'Since noon the Empire has been in a state of imminent danger of war; the posters say so on every pillar. At the ticket office a police officer asks every German traveller for a permit to leave, and he looks with particular interest at young women travelling with foreigners.',
    choices: [
      { label: 'Dress her as a nursing sister', sub: "A spare habit, and your order's name", if: [['cover', 'doyle']],
        ok: [['record', 'sighting', 0.2]] },
      { label: 'Pass her off as your maid', sub: 'Nobody questions a countess about her maid', if: [['cover', 'vessey']],
        ok: [['record', 'sighting', 0.3]] },
      { label: 'Buy her a permit', sub: '£12 to a clerk who has seen worse', cost: { money: 12 },
        roll: { p: 0.65 },
        ok: [['record', 'bribe', 0.5]], fail: [['record', 'bribe', 1], ['expose', 'sauer', 0.5]] },
      { label: 'Brazen it out', sub: 'Your manner, and her nerve',
        roll: { p: 0.4, mods: [[['trust', 'sauer', '>=', 3], 0.1]] },
        ok: [['nerve', -1]],
        fail: [['record', 'sighting', 1], ...lost('The police took Sauer at the ticket office for want of a permit.')] },
    ] },

  { id: 'op-typist.pipe', at: 'op',
    title: 'A false road for Sauer',
    text: 'The mole you kept could carry one lie tonight: that Fräulein Sauer is being taken south, through Munich to Switzerland. If IIIb believes it, they will watch the Munich trains. Make sure you are not on one.',
    choices: [
      { label: 'Feed it through Brandl', sub: 'Vienna tells Berlin everything now', if: [['flag', 'op-mole-kept-brandl']],
        ok: [['plant', { via: 'brandl', ...southward }], ['unflag', 'op-mole-kept-brandl'], ['record', 'wire', 0.3]] },
      { label: 'Feed it through Ilić', sub: 'A long way round, but it travels', if: [['flag', 'op-mole-kept-ilic']],
        ok: [['plant', { via: 'ilic', ...southward }], ['unflag', 'op-mole-kept-ilic'], ['record', 'wire', 0.3]] },
      { label: 'Feed it through Amsler', sub: 'A Munich draft in her name', if: [['flag', 'op-mole-kept-amsler']],
        ok: [['plant', { via: 'amsler', ...southward }], ['unflag', 'op-mole-kept-amsler'], ['record', 'wire', 0.3]] },
      { label: 'Keep the pipe for later', sub: 'There may not be a later',
        ok: [['nerve', -1]] },
    ] },

  // ---------- aftermath ----------
  { id: 'op-typist.lotte', at: 'then', speaker: 'sauer', if: [['city', 'HAM']],
    title: 'Lotte Sauer will not pack',
    text: 'Lotte is younger, louder, and engaged to a reservist of the 76th Infantry who left for his depot this morning. She will not go. She will not let Hedwig go without her. The sisters argue in whispers in a kitchen that smells of cabbage, and the clock says the Korsør boat leaves in two hours.',
    choices: [
      { label: 'Persuade Lotte to come', sub: 'Two hours, and two stubborn women',
        roll: { p: 0.5, mods: [[['trust', 'sauer', '>=', 3], 0.2]] },
        ok: [['trust', 'sauer', 2], ['record', 'register', 0.3], ['debrief', 'Both Sauer sisters crossed to Denmark on the Korsør boat.']],
        fail: [['trust', 'sauer', -1], ['min', 120]] },
      { label: 'Leave Lotte money and an address', sub: '£5; she may follow, one day', cost: { money: 5 },
        ok: [['trust', 'sauer', 1]] },
    ] },
];
