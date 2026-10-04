// Storylets with Dr Achille Morel (owner: People). A fussy pedant about teeth and timetables.
// Arc: a red herring who lives on the Marseille lines. He photographs stations, times trains and asks odd questions,
// and looks every inch a watcher. He is harmless; denouncing him costs you, and his plates can still betray you.
// Flags: morel-lied, morel-accused, morel-plate.

const MET = ['any', ['st', 'morel', 'met'], ['st', 'morel', 'cultivated'], ['st', 'morel', 'recruited']];

export default [
  { id: 'morel.meet', at: 'train', speaker: 'morel', if: [['st', 'morel', 'unknown']], w: 3, once: true,
    title: 'A stopwatch and a camera',
    text: "The man opposite has a camera on his knee, a notebook open and a stopwatch in his palm. 'Four minutes late at Mâcon,' he announces. 'The company will hear from me.' He looks at you over his spectacles. 'And you, {Monsieur|Madame}, grind your teeth. I can hear it from here. Morel, dental surgeon, of Lyon.'",
    choices: [
      { label: 'Ask why he photographs stations', sub: 'He will tell you, at length',
        ok: [['st', 'morel', 'met'], ['min', 40],
          ['intel', { subj: 'person:morel', claim: { note: 'Morel says he is writing a book on the stations of the line, with plates.' }, src: 'person:morel', rel: 0.4, truth: true }]] },
      { label: 'Let him look at your teeth', sub: 'He writes your name in his little book',
        ok: [['st', 'morel', 'met'], ['trust', 'morel', 1], ['nerve', 1], ['record', 'register', 0.2]] },
      { label: 'Watch him, not the scenery', sub: 'A man who times trains is timing something',
        roll: { p: 0.5, mods: [[['skill', 'observation', '>=', 2], 0.25]] },
        ok: [['st', 'morel', 'met'],
          ['intel', { subj: 'person:morel', claim: { note: 'Morel times every train and photographs every station; his notebook goes back years.' }, src: 'seen', rel: 0.7, truth: true }]],
        fail: [['st', 'morel', 'met'], ['record', 'sighting', 0.3]] },
      { label: 'Move to another compartment', sub: 'He notes the time you left',
        ok: [['st', 'morel', 'met'], ['nerve', -1]] },
    ] },

  { id: 'morel.platform', at: 'train', speaker: 'morel', if: [MET], once: true,
    title: 'For scale',
    text: "At a halt, while the engine takes water, Dr Morel sets up his camera on the platform and photographs the station clock, the water tower and, for scale, you. 'A human figure gives the proportions,' he explains. 'You have excellent proportions. Your molars, less so.' He folds the tripod with great satisfaction.",
    choices: [
      { label: 'Demand the plate', sub: 'He will be wounded; the plate is yours',
        roll: { p: 0.6 },
        ok: [['trust', 'morel', -1], ['nerve', 1]],
        fail: [['trust', 'morel', -2], ['record', 'photo', 0.4], ['flag', 'morel-plate']] },
      { label: 'Buy the plate from him', sub: '£3; he will think you vain', cost: { money: 3 },
        ok: [['trust', 'morel', 1]] },
      { label: 'Let it be', sub: 'A dentist’s photograph of a station',
        ok: [['record', 'photo', 0.3], ['flag', 'morel-plate']] },
    ] },

  { id: 'morel.questions', at: 'city', speaker: 'morel', if: [MET], once: true,
    title: 'Odd questions on the Canebière',
    text: "Dr Morel falls into step beside you on the Canebière and asks, in order: the time of your next train, the name of your hotel, whether you brush with chalk or with soap, and whether you have noticed that the Ventimiglia express is always late on Mondays. He writes the answers down. All of them.",
    choices: [
      { label: 'Answer him truthfully', sub: 'He writes everything down',
        ok: [['trust', 'morel', 1], ['record', 'register', 0.3]] },
      { label: 'Lie to him, fluently', sub: 'A false trail, if he is what he seems',
        ok: [['plant', { via: 'morel', subj: 'cover:active', claim: { at: 'MAD' } }], ['expose', 'morel', 0.2], ['flag', 'morel-lied'], ['later', 48, 'morel.madrid']] },
      { label: 'Denounce him to the police', sub: 'A foreign spy, you say; he looks like one',
        roll: { p: 0.6 },
        ok: [['st', 'morel', 'arrested'], ['flag', 'morel-accused'], ['later', 72, 'morel.aggrieved']],
        fail: [['watch', 0.2], ['record', 'sighting', 0.5]] },
    ] },

  { id: 'morel.saffron', at: 'train', speaker: 'morel', if: [['st', 'morel', 'met']], once: true,
    title: 'A pedant’s gratitude',
    text: "Dr Morel is complaining about the price of saffron in Marseille, which has risen four per cent since June, a figure he has written down. He also collects porcelain, he confides, and timetables, and the errors in timetables, which are a collection in themselves and never complete.",
    choices: [
      { label: 'Give him a packet of saffron', sub: 'He will weigh it, and beam', if: [['item', 'saffron']],
        ok: [['item', '-saffron'], ['trust', 'morel', 2], ['st', 'morel', 'cultivated'],
          ['intel', { subj: 'frontier:VTM', claim: { closed: ['08-02 00.00', null] }, src: 'person:morel', rel: 0.5, truth: 'auto' }]] },
      { label: 'Give him Copenhagen porcelain', sub: 'He knows the factory mark by heart', if: [['item', 'porcelain']],
        ok: [['item', '-porcelain'], ['trust', 'morel', 2], ['st', 'morel', 'cultivated'],
          ['intel', { subj: 'frontier:VTM', claim: { closed: ['08-02 00.00', null] }, src: 'person:morel', rel: 0.5, truth: 'auto' }]] },
      { label: 'Ask him which trains are late', sub: 'Two hours of a very complete answer', cost: { min: 120 },
        ok: [['trust', 'morel', 1],
          ['intel', { subj: 'line:PAR-MAR', claim: { note: 'Morel: the Marseille express loses twenty minutes at Lyon whenever troops are moving.' }, src: 'person:morel', rel: 0.6, truth: true }]] },
      { label: 'Tell him timetables are dull', sub: 'He will not forgive it',
        ok: [['trust', 'morel', -2], ['nerve', 1]] },
    ] },

  { id: 'morel.shadow', at: 'train', speaker: 'morel', if: [MET], w: 2, once: true,
    title: 'The dentist again',
    text: "Two compartments down, notebook open, sits Dr Morel. He was at Dijon. He was on the platform at Lyon. He is looking, you would swear, at the reflection of your compartment in the corridor window. When you look back, he is cleaning his spectacles with great care.",
    choices: [
      { label: 'Confront him in the corridor', sub: 'If he is a watcher, he will deny it',
        ok: [['trust', 'morel', -2], ['nerve', 1],
          ['intel', { subj: 'person:morel', claim: { note: 'Morel, confronted, was outraged, then explained the Dijon station roof for an hour.' }, src: 'seen', rel: 0.8, truth: true }]] },
      { label: 'Change trains at Lyon', sub: 'Two hours lost; no dentist',
        ok: [['delay', 120], ['nerve', 1]] },
      { label: 'Ignore him', sub: 'And wonder all the way',
        ok: [['nerve', -1]] },
    ] },

  { id: 'morel.compromised', at: 'city', speaker: 'morel', if: [['any', ['st', 'morel', 'compromised'], ['flag', 'morel-plate']]], once: true,
    title: 'His plates were seized',
    text: "Dr Morel is outside the prefecture in a state. 'They have taken my plates! Two hundred stations! Three years!' The police took them on suspicion, and somewhere in the box, between Avignon and Arles, is a very clear photograph of you, standing on a platform for scale.",
    choices: [
      { label: 'Buy the plates back from a sergeant', sub: '£5, and a sergeant who remembers your face', cost: { money: 5 },
        if: [['st', 'morel', 'compromised']],
        ok: [['st', 'morel', 'met'], ['trust', 'morel', 2], ['record', 'bribe', 0.4]] },
      { label: 'Buy the plates back from a sergeant', sub: '£5, and a sergeant who remembers your face', cost: { money: 5 },
        if: [['not', ['st', 'morel', 'compromised']]],
        ok: [['trust', 'morel', 2], ['record', 'bribe', 0.4]] },
      { label: 'Let the police keep them', sub: 'Your photograph goes into a file',
        ok: [['record', 'photo', 0.6], ['trust', 'morel', -1]] },
    ] },

  { id: 'morel.madrid', at: 'then', speaker: 'morel', if: [['flag', 'morel-lied']], once: true,
    title: 'A timetable for Madrid',
    text: "A postcard from Dr Morel, care of your hotel: 'You said Madrid! I enclose the Madrid timetable, corrected in three places, and the name of an excellent dentist in the Calle de Alcalá. Bon voyage!' The hall porter hands it over with the face of a man who has read it twice.",
    choices: [
      { label: 'Tip the porter to forget it', sub: '£1; porters forget for about a day', cost: { money: 1 },
        ok: [['nerve', 1], ['unflag', 'morel-lied']] },
      { label: 'Let him remember Madrid', sub: 'A false trail is a false trail',
        ok: [['record', 'register', 0.2], ['unflag', 'morel-lied']] },
    ] },

  { id: 'morel.aggrieved', at: 'then', speaker: 'morel', if: [['flag', 'morel-accused'], ['st', 'morel', 'arrested']], once: true,
    title: 'Dental surgeon, of Lyon',
    text: "A letter on headed paper: Dr A. Morel, Dental Surgeon, Lyon. 'I was detained for two nights on the denunciation of a stranger. The commissaire has apologised. My plates have been returned, minus one, a figure on a platform, for scale. I have the honour to wish you toothache. A. Morel.'",
    choices: [
      { label: 'Send an apology and saffron', sub: 'He will weigh both', if: [['item', 'saffron']],
        ok: [['item', '-saffron'], ['st', 'morel', 'met'], ['trust', 'morel', 1]] },
      { label: 'Wonder who kept the missing plate', sub: 'The police, or someone who asked them',
        ok: [['st', 'morel', 'met'], ['nerve', -1], ['record', 'photo', 0.3]] },
    ] },
];
