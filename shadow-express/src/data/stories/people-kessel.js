// Storylets with Rittmeister von Kessel (owner: People). Hearty, boastful, sharp-memoried.
// Arc: a traveller on the Cologne and Munich lines who never forgets a face. He remembers the name and trade you gave him
// (kessel-saw-<cover>, or kessel-false), what he boasted to you, and what you lent him; in Act III at Cologne, with the
// troop trains, all of it comes back (kessel.cologne, kessel.doubt, kessel.reprimand).
// Routines (repeatable): a beer and a boast, the dawn ride; his calling card is the gift returned.
// Flags: kessel-saw-hale, kessel-saw-weiss, kessel-saw-marchand, kessel-saw-doyle, kessel-saw-vessey, kessel-false,
// kessel-boasted, kessel-debt, kessel-beaten, kessel-planted, kessel-card, kessel-sold.

const MET = ['any', ['st', 'kessel', 'met'], ['st', 'kessel', 'cultivated'], ['st', 'kessel', 'recruited']];
const GERMAN = [['skill', 'german', '>=', 1], 0.15];
// He met you under one name and you now wear another: (saw X and not cover X) for any cover X, or a false name.
const MISMATCH = ['any',
  ['not', ['any', ['not', ['flag', 'kessel-saw-hale']], ['cover', 'hale']]],
  ['not', ['any', ['not', ['flag', 'kessel-saw-weiss']], ['cover', 'weiss']]],
  ['not', ['any', ['not', ['flag', 'kessel-saw-marchand']], ['cover', 'marchand']]],
  ['not', ['any', ['not', ['flag', 'kessel-saw-doyle']], ['cover', 'doyle']]],
  ['not', ['any', ['not', ['flag', 'kessel-saw-vessey']], ['cover', 'vessey']]],
  ['flag', 'kessel-false']];
const SELL = [['money', 20], ['susp', 'active', -0.2], ['st', 'kessel', 'arrested'], ['trust', 'sauer', -2],
  ['flag', 'kessel-sold'], ['later', 30, 'kessel.letter']];

export default [
  { id: 'kessel.meet', at: 'train', speaker: 'kessel', if: [['st', 'kessel', 'unknown']], w: 3, once: true,
    title: 'The Rittmeister takes a seat',
    text: "A cavalry captain takes the seat opposite, unbuttons his tunic and then his life story. 'Von Kessel, Third Uhlans! You have heard of my grey, Blücher, who took the Kaiserpreis at Hoppegarten? No? Then you are a foreigner. Excellent. Foreigners listen.' He looks at you properly for the first time, and you feel yourself being filed.",
    choices: [
      { label: 'Tell him who you are', sub: 'He will remember every word',
        ok: [['st', 'kessel', 'met'], ['trust', 'kessel', 1]], next: 'kessel.who' },
      { label: 'Give him a false name', sub: 'He will remember that too',
        ok: [['st', 'kessel', 'met'], ['flag', 'kessel-false'], ['nerve', -1]] },
      { label: 'Offer him Swedish punsch', sub: 'A cavalryman never refuses a glass', if: [['item', 'punsch']],
        ok: [['item', '-punsch'], ['st', 'kessel', 'met'], ['trust', 'kessel', 2]], next: 'kessel.who' },
      { label: 'Feign sleep until Hanover', sub: 'He studies sleeping faces too',
        ok: [['st', 'kessel', 'met'], ['trust', 'kessel', -1], ['record', 'sighting', 0.3]] },
    ] },

  { id: 'kessel.who', at: 'then', speaker: 'kessel',
    title: 'Name and trade, please',
    text: "He wants your name and your trade, and he will repeat both in every mess from Metz to Königsberg. He has a memory for faces like a regimental ledger: whatever you tell him now, he will hold you to. 'Well?' he says, beaming. 'Who have I the honour of boring?'",
    choices: [
      { label: 'Tell him you sell wine', sub: 'He will ask for a discount', if: [['cover', 'hale']],
        ok: [['flag', 'kessel-saw-hale'], ['trust', 'kessel', 1]] },
      { label: 'Tell him you sell lenses', sub: 'He will talk rangefinders all the way', if: [['cover', 'weiss']],
        ok: [['flag', 'kessel-saw-weiss'], ['trust', 'kessel', 1], ['record', 'meeting', 0.2]] },
      { label: "Tell him you write for L'Écho", sub: 'He adores the press, and repeats everything', if: [['cover', 'marchand']],
        ok: [['flag', 'kessel-saw-marchand'], ['trust', 'kessel', 2], ['record', 'meeting', 0.4]] },
      { label: 'Tell him you serve the Church', sub: 'He will want a blessing for his horse', if: [['cover', 'doyle']],
        ok: [['flag', 'kessel-saw-doyle'], ['trust', 'kessel', 1]] },
      { label: 'Give him your family name', sub: 'He knows his Gotha; so may others', if: [['cover', 'vessey']],
        ok: [['flag', 'kessel-saw-vessey'], ['trust', 'kessel', 2], ['record', 'meeting', 0.3]] },
    ] },

  { id: 'kessel.cards', at: 'train', speaker: 'kessel', if: [['st', 'kessel', 'met']], once: true,
    title: 'Skat for small stakes',
    text: "Between Hanover and Berlin von Kessel produces a pack of cards and teaches you skat, badly, for money, well. He loses, and talks; he wins, and talks more. The Uhlans will be first over the frontier, naturally, and he could tell you which frontier, but then he would have to shoot you, ha!",
    choices: [
      { label: 'Let him win, and keep him talking', sub: '£5 lost; a great deal heard', cost: { money: 5 },
        ok: [['trust', 'kessel', 2], ['st', 'kessel', 'cultivated'], ['flag', 'kessel-boasted'],
          ['intel', { subj: 'city:COL', claim: { note: 'Kessel: the Uhlans entrain at Cologne-Deutz on the second day, westward.' }, src: 'person:kessel', rel: 0.6, truth: true }]] },
      { label: 'Win his money', sub: 'He hates losing more than he shows',
        roll: { p: 0.5, mods: [[['skill', 'observation', '>=', 2], 0.2]] },
        ok: [['money', 8], ['trust', 'kessel', -1], ['flag', 'kessel-beaten']],
        fail: [['money', -4], ['trust', 'kessel', 1]] },
      { label: 'Lend him money for his debts', sub: '£10; a debtor is a friend who remembers', cost: { money: 10 },
        ok: [['trust', 'kessel', 1], ['st', 'kessel', 'cultivated'], ['flag', 'kessel-debt']] },
    ] },

  // ---------- routines (repeatable) ----------
  { id: 'kessel.beer', at: 'person', speaker: 'kessel', if: [MET, ['clock', '17.00', '23.59']], w: 3,
    title: 'A beer and a boast',
    text: "Von Kessel drinks his beer in three swallows and his stories in one: the Kaiser's manoeuvres, his grey's hocks, the colonel's wife, the French, the Russians, the price of oats. He has an elephant's memory and a cavalryman's discretion, which is none. Tonight he is buying.",
    choices: [
      { label: 'Listen, and laugh in the right places', sub: 'An hour and a half of the Uhlans', cost: { min: 90 }, if: [['trust', 'kessel', '<', 4]],
        ok: [['trust', 'kessel', 1], ['record', 'meeting', 0.2]] },
      { label: 'Give him his revenge at skat', sub: '£3 lost on purpose; he will know, and like it', cost: { money: 3 },
        if: [['flag', 'kessel-beaten']],
        ok: [['trust', 'kessel', 2], ['unflag', 'kessel-beaten']] },
      { label: 'Match his boasts with your own', sub: 'He will remember every one',
        roll: { p: 0.5, mods: [[['skill', 'charm', '>=', 2], 0.2]] },
        ok: [['trust', 'kessel', 1], ['nerve', 1]],
        fail: [['trust', 'kessel', -1], ['record', 'meeting', 0.4]] },
      { label: 'Steer him to the railways', sub: 'Officers know the timetables; he knows his',
        roll: { p: 0.5, mods: [GERMAN, [['trust', 'kessel', '>=', 3], 0.15]] },
        ok: [['flag', 'kessel-boasted'],
          ['intel', { subj: 'line:COL-BER', claim: { note: 'Kessel: on mobilisation the Cologne line carries only troops, every ten minutes, westward.' }, src: 'person:kessel', rel: 0.6, truth: true }]],
        fail: [['record', 'meeting', 0.6], ['susp', 'active', 0.1]] },
    ] },

  { id: 'kessel.ride', at: 'person', speaker: 'kessel', if: [MET, ['clock', '06.00', '10.00'], ['chance', 0.6]], w: 2,
    title: 'Out at dawn with Blücher',
    text: "Von Kessel rides at dawn and assumes that everybody does. He has a second horse saddled for you, a bay with opinions. 'Blücher will show you the way,' he says, 'and the bay will show you the ground.' Blücher is enormous. The bay looks at you sideways.",
    choices: [
      { label: 'Ride the bay', sub: 'Stay on, and he will love you',
        roll: { p: 0.45, mods: [[['nerve', '>=', 6], 0.15]] },
        ok: [['trust', 'kessel', 2]],
        fail: [['nerve', -1], ['trust', 'kessel', 1]] },
      { label: 'Admire Blücher at length', sub: 'The way to the master is the horse', if: [['trust', 'kessel', '<', 3]],
        ok: [['trust', 'kessel', 1], ['min', 60]] },
      { label: 'Ask about the remount depots', sub: 'Horses before men, in a mobilisation',
        roll: { p: 0.5, mods: [GERMAN] },
        ok: [['intel', { subj: 'city:COL', claim: { note: 'Kessel: the remount depots have orders to buy every horse in the Rhineland.' }, src: 'person:kessel', rel: 0.6, truth: true }]],
        fail: [['trust', 'kessel', -1], ['record', 'sighting', 0.3]] },
    ] },

  { id: 'kessel.card', at: 'person', speaker: 'kessel', if: [MET, ['trust', 'kessel', '>=', 3], ['not', ['flag', 'kessel-card']]], w: 4, once: true,
    title: "The Rittmeister's card",
    text: "Von Kessel returns your kindness the only way he knows: he writes on the back of his card, 'The bearer is known to me', signs it with a flourish and a blot, and presses it on you. 'Show that to any railway officer between here and Metz. They will stand up.'",
    choices: [
      { label: 'Keep the card in your papers', sub: 'A Prussian officer vouches for you, in ink',
        ok: [['flag', 'kessel-card'], ['papers', 'active', 0.2], ['trust', 'kessel', 1]] },
      { label: 'Decline it gracefully', sub: 'A card with his name is a link to yours',
        ok: [['flag', 'kessel-card'], ['trust', 'kessel', -1], ['nerve', 1]] },
    ] },

  { id: 'kessel.recruit', at: 'person', speaker: 'kessel', if: [['st', 'kessel', 'cultivated'], ['trust', 'kessel', '>=', 3]], w: 6, once: true,
    title: 'Debts of honour',
    text: "Von Kessel's tailor has written twice and his bookmaker not at all, which is worse. He tells you so cheerfully, then not cheerfully. 'A Rittmeister with debts is a Rittmeister on half-pay. My grandfather took a French battery at Mars-la-Tour. I cannot be on half-pay.'",
    choices: [
      { label: 'Pay the tailor and the bookmaker', sub: '£30, and he will never say it aloud', cost: { money: 30 },
        ok: [['st', 'kessel', 'recruited'], ['trust', 'kessel', 1]] },
      { label: 'Forgive what he owes you', sub: 'For a favour now and then', if: [['flag', 'kessel-debt']],
        ok: [['st', 'kessel', 'recruited'], ['unflag', 'kessel-debt']] },
      { label: 'Wish him luck with his creditors', sub: 'He will remember who did not help',
        ok: [['trust', 'kessel', -2]] },
    ] },

  { id: 'kessel.call', at: 'person', speaker: 'kessel', if: [MET], w: 1,
    title: 'The Rittmeister, at leisure',
    text: "Von Kessel is at leisure, which in his case is loud. He greets you by name, the name you gave him, and asks after your health, your trade and the weather in the place you said you came from. He forgets nothing. It is his only vanity he does not boast of.",
    choices: [
      { label: 'Bring him Swedish punsch', sub: 'A cavalryman’s weakness', if: [['item', 'punsch'], ['trust', 'kessel', '<', 4]],
        ok: [['item', '-punsch'], ['trust', 'kessel', 2]] },
      { label: 'Bring him Dutch cigars', sub: 'He will smoke them all at once', if: [['item', 'dutch-cigars'], ['trust', 'kessel', '<', 4]],
        ok: [['item', '-dutch-cigars'], ['trust', 'kessel', 2]] },
      { label: 'Bring him caviar', sub: 'Odessa caviar, for a Prussian palate', if: [['item', 'caviar'], ['trust', 'kessel', '<', 4]],
        ok: [['item', '-caviar'], ['trust', 'kessel', 2]] },
      { label: 'Tell him you are bound for Munich', sub: 'Every mess in Prussia will hear it',
        if: [['not', ['flag', 'kessel-planted']]],
        ok: [['plant', { via: 'kessel', subj: 'cover:active', claim: { at: 'MUN' } }], ['expose', 'kessel', 0.4], ['flag', 'kessel-planted']] },
      { label: 'Report his loose tongue to Falk', sub: '£20, and a Rittmeister court-martialled', ok: SELL },
    ] },

  // ---------- Act III: Cologne, the troop trains ----------
  { id: 'kessel.cologne', at: 'city', speaker: 'kessel', if: [['act', 3], MET], w: 3, once: true,
    title: 'He never forgets a face',
    text: "Cologne-Deutz, and the troop trains: chalk on the wagons, flowers in the rifles, a band that will not stop. Von Kessel, in field grey now, sees you across the platform and his face lights up. He never forgets a face. He never forgets what the face told him, either.",
    choices: [
      { label: 'Greet him as an old friend', sub: 'He will remember who you said you were',
        ok: [['trust', 'kessel', 1],
          ['intel', { subj: 'city:COL', claim: { note: 'Kessel: forty trains a day over the Hohenzollern bridge, all westward.' }, src: 'person:kessel', rel: 0.7, truth: true }]],
        next: 'kessel.doubt' },
      { label: 'Remind him of the money he owes', sub: 'He pays his debts in favours', if: [['flag', 'kessel-debt']],
        ok: [['unflag', 'kessel-debt'], ['papers', 'active', 0.2], ['nerve', 1]] },
      { label: 'Remind him what he told you', sub: 'Blackmail, between friends',
        if: [['flag', 'kessel-boasted']],
        roll: { p: 0.5, mods: [[['trust', 'kessel', '>=', 3], 0.2]] },
        ok: [['trust', 'kessel', -2],
          ['intel', { subj: 'line:BRU-COL', claim: { note: 'Kessel, cornered: the Uhlans go to Aachen, then Liège.' }, src: 'person:kessel', rel: 0.8, truth: true }]],
        fail: [['record', 'sighting', 1], ['susp', 'active', 0.2]] },
      { label: 'Turn away into the crowd', sub: 'He has seen you; has he placed you?',
        roll: { p: 0.5 },
        ok: [['nerve', -1]],
        fail: [['record', 'sighting', 1], ['nerve', -1]] },
    ] },

  { id: 'kessel.doubt', at: 'then', speaker: 'kessel', if: [MISMATCH],
    title: 'On the Munich train you were…',
    text: "His smile stays where it is; his eyes do not. 'Wait. On the train you told me something else. A different name, or a different trade, or both.' He taps his temple. 'I never forget. A Rittmeister's memory is his only capital.' Two Feldgendarmen are drinking coffee at the next stall.",
    choices: [
      { label: 'Laugh: a second trade, for wartime', sub: 'He wants to believe you; does he?',
        roll: { p: 0.4, mods: [[['trust', 'kessel', '>=', 3], 0.3], GERMAN, [['skill', 'composure', '>=', 2], 0.1]] },
        ok: [['nerve', 1]],
        fail: [['record', 'sighting', 1], ['susp', 'active', 0.2], ['trust', 'kessel', -3]] },
      { label: 'Confide in him, a little', sub: 'A gamble on his debts and his vanity', if: [['trust', 'kessel', '>=', 3]],
        roll: { p: 0.35, mods: [[['st', 'kessel', 'recruited'], 0.4], [['flag', 'kessel-debt'], 0.15]] },
        ok: [['trust', 'kessel', 1], ['st', 'kessel', 'recruited']],
        fail: [['record', 'sighting', 1], ['susp', 'active', 0.3], ['st', 'kessel', 'compromised']] },
      { label: 'Walk away, quickly', sub: 'Before he calls to the Feldgendarmen',
        ok: [['nerve', -2], ['record', 'sighting', 0.8]] },
    ] },

  { id: 'kessel.reprimand', at: 'city', speaker: 'kessel', if: [['act', 3], ['flag', 'kessel-planted'], MET], w: 4, once: true,
    title: 'A story with your name',
    text: "Von Kessel crosses the platform at you like a man crossing a parade ground. 'That story of yours. I repeated it in the mess, and a gentleman from Berlin asked me where I heard it, and I was made to look a fool.' He is red to the ears. 'Officers are not made to look fools.'",
    choices: [
      { label: 'Apologise, and pay for his trouble', sub: '£10; his pride is expensive', cost: { money: 10 },
        ok: [['trust', 'kessel', 1], ['unflag', 'kessel-planted']] },
      { label: 'Deny it was you', sub: 'He never forgets a face',
        roll: { p: 0.3, mods: [GERMAN] },
        ok: [['nerve', 1]],
        fail: [['trust', 'kessel', -2], ['record', 'sighting', 0.8]] },
      { label: 'Leave him on the platform', sub: 'He will tell the gentleman from Berlin',
        ok: [['trust', 'kessel', -2], ['susp', 'active', 0.1]] },
    ] },

  // ---------- protect and betray ----------
  { id: 'kessel.compromised', at: 'person', speaker: 'kessel', if: [['st', 'kessel', 'compromised']], w: 9,
    title: 'A gentleman from Abteilung IIIb',
    text: "For once von Kessel is quiet. 'A tall fellow in a grey ulster asked me about my foreign friend. Very polite. He knew the train, and the carriage, and that I had lost at skat.' He turns his cap in his hands. 'I told him you were a horse dealer. I am not sure he believed me.'",
    choices: [
      { label: 'Tell him: stick to the horse dealer', sub: 'A lie is safer if both keep it',
        roll: { p: 0.5, mods: [[['trust', 'kessel', '>=', 3], 0.2]] },
        ok: [['st', 'kessel', 'cultivated'], ['trust', 'kessel', 1]],
        fail: [['st', 'kessel', 'arrested'], ['trust', 'sauer', -1]] },
      { label: 'Pay his debts before Falk does', sub: '£20; a debtor can be bought by anyone', cost: { money: 20 },
        ok: [['st', 'kessel', 'cultivated'], ['trust', 'kessel', 2]] },
      { label: 'Report him to Falk first', sub: '£20, and a Rittmeister court-martialled', ok: SELL },
    ] },

  { id: 'kessel.letter', at: 'then', speaker: 'kessel', if: [['flag', 'kessel-sold']],
    title: 'From the fortress at Glatz',
    text: "A letter from the fortress at Glatz, in a hand that has not got smaller. 'They tell me I talked too much to a foreigner. True! I talk too much to everyone. But only one of them went to Falk. I remember your face. I remember everything. When this war is over I shall come and find it. K.'",
    choices: [
      { label: 'Burn it', sub: 'Threats from prison keep',
        ok: [['nerve', -2]] },
      { label: 'Pay his tailor anyway', sub: '£10, unsigned; guilt is an expense', cost: { money: 10 },
        ok: [['trust', 'sauer', 1], ['nerve', 1]] },
    ] },
];
