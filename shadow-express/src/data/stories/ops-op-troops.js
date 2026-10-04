// Storylets of op-troops, Count the Trains (owner: Ops). See docs/CONTRACTS.md §5.

const tallyLost = [['item', '-troop-tally'], ['susp', 'active', 0.4], ['record', 'frontier', 1], ['op', 'op-troops', 'fail']];
const OUT = ['later', 1, 'op-troops.border'];

export default [
  // ---------- steps ----------
  { id: 'op-troops.reach', at: 'op', if: [['city', 'COL']],
    title: 'Cologne, a fortress again',
    text: "Cologne is a fortress again. Sentries with fixed bayonets hold the bridge approaches, and posters promise death to spies and to anyone photographing a railway. In the cathedral square the crowds sing 'Die Wacht am Rhein' at every train. Somewhere you must watch the Hohenzollern bridge for a day without being seen to watch it.",
    choices: [
      { label: 'A room at the Dom Hotel', sub: '£4; a window on the bridge, and a register', cost: { money: 4 },
        ok: [['record', 'register', 0.7], ['flag', 'op-troops-window']] },
      { label: 'Lodge in Deutz, across the river', sub: "£1; rooms full of reservists' wives", cost: { money: 1 },
        ok: [['record', 'register', 0.3], ['flag', 'op-troops-window']] },
      { label: 'Sleep in the crowd, if at all', sub: 'Cheer with the rest; no register',
        ok: [['nerve', -2], ['record', 'sighting', 0.3]] },
      { label: 'Pass for a Rhinelander', sub: 'Your German against a city of Germans', if: [['skill', 'german', '>=', 2]],
        roll: { p: 0.7 }, ok: [['legend', 0.2], ['flag', 'op-troops-window']], fail: [['watch', 0.3], ['record', 'sighting', 0.6]] },
    ] },

  { id: 'op-troops.watch', at: 'op', if: [['city', 'COL']],
    title: 'A train every ten minutes',
    text: "They come over the bridge from the east bank in an unbroken procession: field-grey, horses, guns under tarpaulins, 'To Paris!' chalked on the wagons. A train every ten minutes, day and night. Each turns south-west at the far end, towards Aachen and the Belgian frontier, not south towards Alsace. You must count them, and remember.",
    choices: [
      { label: 'Count from your window', sub: 'Every train, every hour, in a notebook', if: [['flag', 'op-troops-window']],
        ok: [['standing', 2], ['record', 'sighting', 0.1]] },
      { label: 'Count from the crowd', sub: 'Cheering, watching, writing nothing down',
        roll: { p: 0.6, mods: [[['skill', 'observation', '>=', 2], 0.25]] },
        ok: [['standing', 1], ['record', 'sighting', 0.3]], fail: [['nerve', -1], ['record', 'sighting', 0.5]] },
      { label: 'Read the regiments through glasses', sub: 'Better figures; glasses at a bridge are noticed', if: [['item', 'field-glasses']],
        roll: { p: 0.6 },
        ok: [['standing', 3], ['record', 'sighting', 0.3]], fail: [['record', 'sighting', 1], ['nerve', -2]] },
      { label: 'Sketch the trains for a newspaper', sub: "A correspondent's licence, if they believe it", if: [['aff', 'topic:press', '>=', 1]],
        roll: { p: 0.55 },
        ok: [['standing', 2], ['record', 'sighting', 0.3]], fail: [['record', 'sighting', 0.9], ['susp', 'active', 0.15]] },
    ] },

  // ---------- way ----------
  { id: 'op-troops.kessel', at: 'op', speaker: 'kessel',
    title: 'The Rittmeister at dinner',
    text: "Kessel is magnificent in field-grey and drunk on the war before it has begun. 'Two thousand trains in a fortnight, over this one bridge!' he cries, banging the table. 'Liège in a week, Paris in six.' He remembers your face perfectly, and seems delighted that you, of all people, should be here to see it.",
    choices: [
      { label: 'Write down every boast later', sub: 'He talks; you remember',
        ok: [['op', 'op-troops', 'step:count'], OUT, ['record', 'meeting', 0.5],
          ['intel', { subj: 'op:op-troops', claim: { note: 'Kessel: two thousand trains over the bridge in a fortnight, and Liège within a week.' }, src: 'person:kessel', rel: 0.7, truth: true }]] },
      { label: 'Ask him for a bridge pass', sub: 'He might; he might wonder why',
        roll: { p: 0.5, mods: [[['trust', 'kessel', '>=', 3], 0.2]] },
        ok: [['op', 'op-troops', 'step:count'], OUT, ['standing', 4], ['record', 'meeting', 0.6]],
        fail: [['trust', 'kessel', -2], ['record', 'meeting', 1], ['susp', 'active', 0.2]] },
    ] },

  // ---------- twists ----------
  { id: 'op-troops.spies', at: 'op',
    title: 'Spy fever on the Domplatz',
    text: "A shout goes up: 'Spion!' The crowd closes on a little man with a camera and a foreign accent, a Dutch commercial traveller by the look of him. They are beating him with umbrellas. A policeman is shouldering through, slowly. Nobody is looking at you, yet.",
    choices: [
      { label: 'Pull him out of the crowd', sub: 'Brave, and conspicuous',
        roll: { p: 0.45, mods: [[['nerve', '>=', 6], 0.1]] },
        ok: [['nerve', 1], ['record', 'sighting', 0.5]], fail: [['record', 'sighting', 1], ['nerve', -2], ['susp', 'active', 0.2]] },
      { label: "Shout 'Spion!' with the rest", sub: 'Safe, and you will remember it',
        ok: [['nerve', -2]] },
      { label: 'Slip away down the Trankgasse', sub: 'Quietly, before anyone looks round',
        ok: [['record', 'sighting', 0.2]] },
    ] },

  { id: 'op-troops.kessel-sees', at: 'op', speaker: 'kessel',
    title: 'Kessel never forgets a face',
    text: "At the station barrier a cavalry officer turns, frowns and smiles all at once. Rittmeister von Kessel. 'We met on a train!' he says. 'And now here, at the bridge, in this week of all weeks.' He is still smiling, but he has stopped walking, and the sentry beside him has noticed that he has.",
    choices: [
      { label: 'Greet him like an old friend', sub: 'Warmth is the best disguise',
        roll: { p: 0.55, mods: [[['trust', 'kessel', '>=', 0], 0.15]] },
        ok: [['trust', 'kessel', 1], ['record', 'meeting', 0.4]], fail: [['record', 'sighting', 1], ['susp', 'active', 0.25]] },
      { label: 'Give him cigars and an excuse', sub: 'Dutch cigars; he cannot resist them', if: [['item', 'dutch-cigars']],
        ok: [['item', '-dutch-cigars'], ['trust', 'kessel', 2], ['record', 'meeting', 0.3]] },
      { label: 'Walk on as if you never met', sub: 'He may let it go; the sentry may not',
        ok: [['record', 'sighting', 0.8], ['trust', 'kessel', -1]] },
    ] },

  { id: 'op-troops.border', at: 'then', if: [['item', 'troop-tally'], ['nation', 'DE'], ['day', '2'], ['clock', '08.00', '23.59']],
    title: 'The frontier at war',
    text: 'German troops crossed into Belgium at dawn. Every train to the frontier is searched now, by soldiers rather than customs men, who tip out cases on the platform and read every scrap of paper. Whoever carries a pencilled list of troop trains will not be fined. They shoot such people against the station wall.',
    choices: [
      { label: 'Trust the valise lining', sub: 'One forbidden thing under your shirts', if: [['item', 'lined-valise']],
        roll: { p: 0.8 }, ok: [['nerve', -1]], fail: tallyLost },
      { label: "Hide it in the King's bag", sub: 'Soldiers may not care about seals', if: [['item', 'diplomatic-bag']],
        ok: [['record', 'frontier', 0.3]] },
      { label: 'Copy it small into a hymn book', sub: "An hour's work, and a prayer", cost: { min: 60 },
        roll: { p: 0.6, mods: [[['aff', 'topic:religion', '>=', 1], 0.2]] },
        ok: [['nerve', -1]], fail: tallyLost },
      { label: 'Learn it by heart and burn it', sub: 'Your memory will have to do',
        ok: [['debrief', 'You burned the tally on the platform. What you remembered reached London a week late.'],
          ['item', '-troop-tally'], ['standing', 3], ['op', 'op-troops', 'fail']] },
    ] },
];
