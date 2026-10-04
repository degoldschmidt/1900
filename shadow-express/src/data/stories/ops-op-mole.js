// Storylets of op-mole, The Mole (owner: Ops). See docs/CONTRACTS.md §5. The Belgrade posting.
// Plants: Ilić → BEG (the quay), Brandl → BUD, Amsler → TRI. Evidence reaches Belgrade on the 17th and 18th
// by four channels of falling honesty: your own eyes, the legation's telegrams, the newspapers, the kafanas.

const plantIlic = ['plant', { via: 'ilic', subj: 'op:op-mole', claim: { at: 'BEG' } }];
const loyalty = (who, claim, src, rel) => ['intel', { subj: `person:${who}`, claim: { loyal: claim }, src, rel, truth: 'auto' }];
const fed = ['op', 'op-mole', 'step:feed'];
const named = ['op', 'op-mole', 'step:name'];
const failed = ['op', 'op-mole', 'fail'];
const BRANDL = ['loyal', 'brandl', 'enemy:heller'];
const ILIC = ['loyal', 'ilic', 'enemy:heller'];
const AMSLER = ['loyal', 'amsler', 'enemy:orlova'];

export default [
  // ---------- the post ----------
  { id: 'op-mole.express', at: 'op',
    title: 'A commercial traveller from Graz',
    text: 'The man who shared your compartment from Budapest has taken the room next to yours. He says he travels in enamelware, and knows nothing about enamelware. He asks whom you know in Belgrade and whether you have been before. His questions are friendly, idle, and arranged in exactly the order of a police form.',
    choices: [
      { label: 'Answer with your legend, fully', sub: 'A good legend survives questions',
        roll: { p: 0.55, mods: [[['skill', 'composure', '>=', 2], 0.15], [['skill', 'german', '>=', 1], 0.1]] },
        ok: [['nerve', 1]], fail: [['record', 'sighting', 0.8]] },
      { label: 'Give him a false address', sub: 'He will check it, and the lie goes on file',
        ok: [['record', 'sighting', 0.3], ['susp', 'active', 0.1]] },
      { label: 'Change your hotel tomorrow', sub: '£1; he will notice that too', cost: { money: 1 },
        ok: [['record', 'sighting', 0.5], ['watch', -0.1]] },
      { label: 'Ask him about enamelware', sub: 'Let him do the lying',
        roll: { p: 0.5, mods: [[['skill', 'observation', '>=', 2], 0.2]] },
        ok: [['intel', { subj: 'hunter:heller', claim: { knows: 'desc' }, src: 'seen', rel: 0.5, truth: 'auto' }]],
        fail: [['record', 'sighting', 0.6]] },
    ] },

  { id: 'op-mole.post', at: 'op', if: [['city', 'BEG']],
    title: 'Belgrade, above two rivers',
    text: 'Belgrade is a small, hot, proud capital of whitewashed houses, cafés and a fortress, with Austria in plain sight across the Sava. Every foreigner here is assumed to be a spy, generally correctly. The police want your passport and an address within the day. The Austrian legation, too, will want to know where you sleep.',
    choices: [
      { label: 'The Hotel Moskva, new and grand', sub: '£4; every legation drinks in its bar', cost: { money: 4 },
        ok: [['legend', 0.15], ['watch', 0.15], ['record', 'register', 0.5]] },
      { label: 'A room above a kafana in Dorćol', sub: '£1; the old Turkish quarter keeps its counsel', cost: { money: 1 },
        ok: [['legend', 0.1], ['record', 'register', 0.2], ['flag', 'op-mole-dorcol']] },
      { label: "Stay with Ilić's family", sub: 'Safe from the police; not from Ilić', if: [['not', ['st', 'ilic', 'unknown']]],
        ok: [['legend', 0.1], ['watch', -0.1], ['expose', 'ilic', 0.2]] },
      { label: 'Register as a correspondent', sub: 'Journalists are watched, and welcomed', if: [['aff', 'venue:press', '>=', 1]],
        ok: [['legend', 0.2], ['watch', 0.2], ['record', 'register', 0.4]] },
    ] },

  // ---------- feeding the suspects ----------
  { id: 'op-mole.ilic', at: 'op', speaker: 'ilic',
    title: 'Ilić in a kafana',
    text: 'Ilić meets you in a kafana under the Kalemegdan, cheerful and much too loud. He talks about the Austrians, the Bulgarians, his brother, the army, the coming war, which he expects to win by Christmas. This is the moment to mention a Bureau courier landing at the Belgrade quay on the seventeenth. He will swear to tell no one. He will swear it loudly.',
    choices: [
      { label: 'Mention the courier at the quay', sub: 'Once said, it cannot be unsaid',
        ok: [plantIlic, ['record', 'meeting', 0.4], fed] },
      { label: 'Say it in Serbian, as a confidence', sub: 'More convincing; he will remember your Serbian', if: [['skill', 'slavic', '>=', 1]],
        ok: [plantIlic, ['trust', 'ilic', 1], ['record', 'meeting', 0.5], fed] },
      { label: 'Let him talk; say nothing yet', sub: 'Another evening, another kafana',
        ok: [['trust', 'ilic', 1], ['min', 120]] },
    ] },

  // ---------- the watch ----------
  { id: 'op-mole.watch', at: 'op', if: [['city', 'BEG']],
    title: 'Watching from Belgrade',
    text: "From Belgrade you can watch only Belgrade: the Danube quay below the fortress, where Ilić's courier is to land, and the trains that come over the Semlin bridge. For Budapest and Trieste you must rely on what reaches you: the legation's telegrams, the Vienna papers, and café gossip, in roughly that order of honesty.",
    choices: [
      { label: 'Hire a window over the quay', sub: '£2 for a room and a view', cost: { money: 2 },
        ok: [['flag', 'op-mole-window'], ['record', 'register', 0.2]] },
      { label: 'Watch from the Kalemegdan with glasses', sub: 'The whole river, and nobody near you', if: [['item', 'field-glasses']],
        ok: [['flag', 'op-mole-window']] },
      { label: "Ask for the legation's telegrams", sub: 'They will share; they will also note your visits', tag: 'venue:embassy',
        ok: [['flag', 'op-mole-legation'], ['watch', 0.15], ['record', 'sighting', 0.3]] },
      { label: 'Buy every Vienna paper daily', sub: 'A dinar a day, and patience', cost: { money: 1 },
        ok: [['flag', 'op-mole-papers']] },
    ] },

  { id: 'op-mole.seventeenth', at: 'op',
    title: 'The seventeenth',
    text: 'The Danube steamer from Orsova ties up at the Belgrade quay at eleven. If anyone in the net has passed on what you told them, someone will be waiting for a courier who does not exist: at the quay, at the Budapest station, or in a Trieste bank. You can watch one thing well, or several badly.',
    choices: [
      { label: 'Watch the quay yourself', sub: 'You see what you see', ok: [['record', 'sighting', 0.2]], next: 'op-mole.quay' },
      { label: "Read the legation's telegrams", sub: 'The consuls report what they see', if: [['flag', 'op-mole-legation']],
        ok: [['watch', 0.1]], next: 'op-mole.reports' },
      { label: 'Read the Vienna and Budapest papers', sub: 'A day late, and honest about small things', if: [['flag', 'op-mole-papers']],
        ok: [['min', 60]], next: 'op-mole.papers' },
      { label: 'Ask in the kafanas', sub: 'Gossip, true and false', ok: [['watch', 0.1]], next: 'op-mole.gossip' },
    ] },

  { id: 'op-mole.quay', at: 'then',
    title: 'The Belgrade quay',
    text: 'The Orsova steamer ties up in a cloud of coal smoke and shouting. Porters, peasants with baskets, a priest, two Greek merchants. You watch the people who are neither getting off nor meeting anyone: the ones who are looking at faces.',
    choices: [
      { label: 'Two men from Semlin watch every face', if: [ILIC, ['flag', 'op-mole-window']],
        ok: [loyalty('ilic', 'enemy', 'seen', 0.9), ['debrief', 'At the Belgrade quay, Heller\'s men waited for a courier only Ilić had heard of.']] },
      { label: 'Two men from Semlin watch every face', if: [ILIC, ['not', ['flag', 'op-mole-window']]],
        ok: [loyalty('ilic', 'enemy', 'seen', 0.75), ['record', 'sighting', 0.4],
          ['debrief', 'At the Belgrade quay, Heller\'s men waited for a courier only Ilić had heard of.']] },
      { label: 'Nobody waits for a courier', if: [['not', ILIC]],
        ok: [loyalty('ilic', 'cause', 'seen', 0.6)] },
    ] },

  { id: 'op-mole.reports', at: 'then',
    title: "The legation's telegrams",
    text: "The legation's second secretary lets you read the morning's telegrams in his office with the door shut, on the understanding that you were never there. Budapest, Vienna, Trieste: the consuls report what they see, which is mostly harvest prices and rumours of war, and occasionally something useful.",
    choices: [
      { label: 'Budapest: police searched the Belgrade train', if: [BRANDL],
        ok: [loyalty('brandl', 'enemy', 'bureau', 0.75), ['debrief', 'Budapest police searched for a courier only Brandl had heard of.']] },
      { label: 'Trieste: a widow called at a bank', if: [AMSLER],
        ok: [loyalty('amsler', 'enemy', 'bureau', 0.75), ['debrief', 'In Trieste Madame Orlova asked for a courier only Amsler had heard of.']] },
      { label: 'Nothing from Budapest or Trieste', if: [ILIC],
        ok: [loyalty('brandl', 'self', 'bureau', 0.6), loyalty('amsler', 'self', 'bureau', 0.6)] },
    ] },

  { id: 'op-mole.papers', at: 'then',
    title: 'Between the lines',
    text: 'The Pester Lloyd and the Neue Freie Presse arrive a day late and smelling of the train, and a Trieste paper with them. You read the police columns, the shipping news and the court circulars, looking for a raid that went nowhere or an arrest that was never made. Newspapers are honest about small things.',
    choices: [
      { label: 'A police search at the Budapest station', if: [BRANDL],
        ok: [loyalty('brandl', 'enemy', 'paper', 0.55)] },
      { label: 'Trieste: a Russian widow and a bank', if: [AMSLER],
        ok: [loyalty('amsler', 'enemy', 'paper', 0.55)] },
      { label: 'Nothing worth reading', if: [ILIC],
        ok: [loyalty('brandl', 'self', 'paper', 0.4), ['nerve', -1]] },
    ] },

  { id: 'op-mole.gossip', at: 'then',
    title: 'What the kafanas say',
    text: 'The kafanas say everything. The Austrians are coming on Sunday; the Russians have promised a million men; a British spy was arrested at the quay this morning, or yesterday, or was a Frenchman. Somewhere in all this there may be a true thing about who waited for your courier.',
    choices: [
      { label: 'Listen in Dorćol, where they know you', sub: 'Your landlord hears everything', if: [['flag', 'op-mole-dorcol'], ILIC],
        ok: [loyalty('ilic', 'enemy', 'rumour', 0.6)] },
      { label: 'Listen in Dorćol, where they know you', sub: 'Your landlord hears everything', if: [['flag', 'op-mole-dorcol'], ['not', ILIC]],
        ok: [loyalty('ilic', 'cause', 'rumour', 0.5)] },
      { label: 'Pay for the best story', sub: 'A dinar buys a good one', cost: { money: 1 },
        ok: [['intel', { subj: 'person:amsler', claim: { loyal: 'enemy' }, src: 'rumour', rel: 0.35, truth: 'auto' }]] },
      { label: 'Leave before you are noticed', sub: 'Kafanas notice listeners',
        ok: [['watch', -0.05], ['nerve', -1]] },
    ] },

  // ---------- naming the mole (ways) ----------
  { id: 'op-mole.name-brandl', at: 'op', speaker: 'ashby',
    title: 'You name Dr Brandl',
    text: 'You wire the name to London in the commercial code and wait. The reply comes the same night, which is unlike Ashby: BRANDL NOTED STOP A DOCTOR WHO TREATS HALF THE AUSTRIAN STAFF FOR NERVES WOULD EXPLAIN MUCH STOP WHAT DO YOU ADVISE.',
    choices: [
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [BRANDL],
        ok: [['st', 'brandl', 'compromised'], ['standing', 5], ['debrief', "Brandl was Heller's man. You named him, and the Bureau cut him off."], named] },
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['not', BRANDL]],
        ok: [['st', 'brandl', 'compromised'], ['trust', 'brandl', -3],
          ['debrief', 'Brandl was innocent. The leak went on, and he never learned why you stopped calling.'], failed] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [BRANDL],
        ok: [['flag', 'op-mole-kept-brandl'], ['standing', 5], ['debrief', "Brandl was Heller's man. You kept him on, as a pipe for lies."], named] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [['not', BRANDL]],
        ok: [['flag', 'op-mole-kept-brandl'], ['debrief', 'Brandl was innocent; the lies you fed him went nowhere, and the leak went on.'], failed] },
    ] },

  { id: 'op-mole.name-ilic', at: 'op', speaker: 'ashby',
    title: 'You name Lieutenant Ilić',
    text: 'You wire the name to London in the commercial code and wait. The reply comes the same night: ILIC NOTED STOP A PATRIOT WHO CANNOT KEEP HIS MOUTH SHUT IN THREE LANGUAGES IS A USEFUL MAN TO HELLER STOP WHAT DO YOU ADVISE.',
    choices: [
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [ILIC],
        ok: [['st', 'ilic', 'compromised'], ['standing', 5], ['debrief', "Ilić was Heller's man. You named him, and the Bureau cut him off."], named] },
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['not', ILIC]],
        ok: [['st', 'ilic', 'compromised'], ['trust', 'ilic', -3],
          ['debrief', 'Ilić was loyal to Serbia and to you. He took your silence for contempt.'], failed] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [ILIC],
        ok: [['flag', 'op-mole-kept-ilic'], ['standing', 5], ['debrief', "Ilić was Heller's man. You kept him on, as a pipe for lies."], named] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [['not', ILIC]],
        ok: [['flag', 'op-mole-kept-ilic'], ['debrief', 'Ilić was innocent; the lies you fed him went nowhere, and the leak went on.'], failed] },
    ] },

  { id: 'op-mole.name-amsler', at: 'op', speaker: 'ashby',
    title: 'You name Herr Amsler',
    text: 'You wire the name to London in the commercial code and wait. The reply comes the same night: AMSLER NOTED STOP OUR BANKER KNOWS WHERE EVERY POUND GOES AND THEREFORE WHERE EVERY ONE OF OUR PEOPLE GOES STOP WHAT DO YOU ADVISE.',
    choices: [
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [AMSLER],
        ok: [['st', 'amsler', 'compromised'], ['standing', 5], ['debrief', 'Amsler was selling to Orlova. You named him, and the Bureau closed its accounts.'], named] },
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['not', AMSLER]],
        ok: [['st', 'amsler', 'compromised'], ['trust', 'amsler', -3],
          ['debrief', 'Amsler was honest, after his fashion. The Bureau closed its accounts with him for nothing.'], failed] },
      { label: 'Keep him, and feed him lies', sub: 'A pipe to Orlova, and through her to Vienna', if: [AMSLER],
        ok: [['flag', 'op-mole-kept-amsler'], ['standing', 5], ['debrief', 'Amsler was selling to Orlova. You kept him on, as a pipe for lies.'], named] },
      { label: 'Keep him, and feed him lies', sub: 'A pipe to Orlova, and through her to Vienna', if: [['not', AMSLER]],
        ok: [['flag', 'op-mole-kept-amsler'], ['debrief', 'Amsler was innocent; the lies you fed him went nowhere, and the leak went on.'], failed] },
    ] },

  { id: 'op-mole.name-nobody', at: 'op', speaker: 'ashby',
    title: 'You name nobody',
    text: 'You wire London that you cannot say. The reply takes a day to come, and when it comes it is two words longer than it needs to be: NOTED STOP THEN WE GO ON LEAKING STOP I HAD HOPED FOR BETTER FROM YOU.',
    choices: [
      { label: 'Accept it', sub: 'Better silence than a wrong name',
        ok: [['standing', -3], ['debrief', 'You named nobody, and the leak stayed open into August.'], failed] },
    ] },
];
