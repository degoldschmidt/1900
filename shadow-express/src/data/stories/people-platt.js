// Storylets with Lyman Platt (owner: People). A breezy American newspaperman of 1914.
// Arc: met in the Vienna and Berlin postings and on the Paris-Vienna express. He trades rumours, many false, and carries
// any false trail you give him straight to the enemy, unwittingly. His gossip accuses all three possible moles in turn
// (truth decided by the engine), so it never settles the question on its own.
// Routines (repeatable): the hotel bar at six, the press room, Platt's gossip.
// Flags: platt-planted, platt-gossip-brandl, platt-gossip-ilic, platt-gossip-amsler, platt-dispatch, platt-sold.

const MET = ['any', ['st', 'platt', 'met'], ['st', 'platt', 'cultivated'], ['st', 'platt', 'recruited']];
const PLANT_ROME = [['plant', { via: 'platt', subj: 'cover:active', claim: { heading: 'ROM' } }], ['expose', 'platt', 0.2],
  ['flag', 'platt-planted'], ['later', 60, 'platt.clipping']];
const SELL = [['money', 15], ['susp', 'active', -0.2], ['st', 'platt', 'arrested'], ['trust', 'odile', -2], ['trust', 'brandl', -1],
  ['flag', 'platt-sold'], ['later', 30, 'platt.letter']];

export default [
  { id: 'platt.meet', at: 'city', speaker: 'platt', if: [['st', 'platt', 'unknown']], w: 2, once: true,
    title: 'Chicago, at the hotel bar',
    text: "A young American in a straw boater drops into the chair across from yours. 'Lyman Platt, Chicago Daily Clarion. Say, you look like somebody who knows something. Most folks in this town look like they know nothing, and they're right.' He orders two of whatever you are having, and lets you pay.",
    choices: [
      { label: 'Talk shop, one correspondent to another', sub: 'He will treat you as a colleague, and a rival', tag: 'venue:press',
        if: [['aff', 'venue:press', '>=', 1]],
        ok: [['st', 'platt', 'met'], ['trust', 'platt', 2], ['record', 'meeting', 0.3]] },
      { label: 'Trade a rumour for a rumour', sub: 'His are free; yours cost something', cost: { money: 1 },
        ok: [['st', 'platt', 'met'], ['trust', 'platt', 1],
          ['intel', { subj: 'hunter:heller', claim: { heading: 'BEG' }, src: 'person:platt', rel: 0.35, truth: 'auto' }]] },
      { label: 'Give him a story to print', sub: 'A traveller bound for Rome: you',
        ok: [['st', 'platt', 'met'], ['trust', 'platt', 1], ...PLANT_ROME] },
      { label: 'Tell him nothing, pleasantly', sub: 'He will find that interesting',
        ok: [['st', 'platt', 'met'], ['trust', 'platt', -1], ['nerve', 1]] },
    ] },

  { id: 'platt.compartment', at: 'train', speaker: 'platt', if: [['st', 'platt', 'unknown']], once: true,
    title: 'A boater in the corridor',
    text: "Somewhere after Strasbourg a young American in a boater leans into your compartment. 'Lyman Platt, Chicago Daily Clarion. I've got sandwiches, a bottle of Rhine wine and no one to talk to. You look like you speak English, or could be talked into it.' He is already sitting down.",
    choices: [
      { label: 'Share his sandwiches', sub: 'Ham, and five hundred miles of questions',
        ok: [['st', 'platt', 'met'], ['trust', 'platt', 1], ['record', 'list', 0.2]] },
      { label: 'Answer questions with questions', sub: 'He will enjoy the game, and remember it',
        roll: { p: 0.5, mods: [[['skill', 'charm', '>=', 2], 0.2]] },
        ok: [['st', 'platt', 'met'], ['trust', 'platt', 2]],
        fail: [['st', 'platt', 'met'], ['record', 'list', 0.5]] },
      { label: 'Give him a story to print', sub: 'A traveller bound for Rome: you',
        ok: [['st', 'platt', 'met'], ...PLANT_ROME] },
    ] },

  // ---------- routines (repeatable) ----------
  { id: 'platt.bar', at: 'person', speaker: 'platt', if: [MET, ['clock', '17.00', '23.59']], w: 3,
    title: 'The bar at six',
    text: "At six every evening Platt holds the corner of the hotel bar like a newspaper office: two telegrams, one whisky, three rumours, all of them wonderful. 'Say, have you heard?' he begins, and you have not, and neither has anyone else, because it has not happened yet and may never.",
    choices: [
      { label: 'Stand him dinner at Sacher’s', sub: '£3; he will write you into his memoirs', cost: { money: 3 },
        if: [['st', 'platt', 'met']],
        ok: [['st', 'platt', 'cultivated'], ['trust', 'platt', 1], ['record', 'meeting', 0.2]] },
      { label: 'Buy a round for his rumours', sub: '£1; some of them are even true', cost: { money: 1 },
        if: [['trust', 'platt', '<', 4]],
        ok: [['trust', 'platt', 1],
          ['intel', { subj: 'hunter:falk', claim: { at: 'VIE' }, src: 'person:platt', rel: 0.3, truth: 'auto' }]] },
      { label: 'Ask what the police ask about you', sub: 'He hears the questions they put to porters',
        roll: { p: 0.5, mods: [[['trust', 'platt', '>=', 3], 0.2]] },
        ok: [['intel', { subj: 'cover:active', claim: { knows: 'name' }, src: 'person:platt', rel: 0.4, truth: 'auto' }]],
        fail: [['record', 'meeting', 0.4]] },
      { label: 'Steer him off your affairs', sub: 'He takes a hint the way a dog takes a bone',
        roll: { p: 0.5 },
        ok: [['watch', -0.05], ['nerve', 1]],
        fail: [['trust', 'platt', -1], ['watch', 0.1]] },
    ] },

  { id: 'platt.press', at: 'person', speaker: 'platt', if: [MET, ['clock', '09.00', '13.00'], ['chance', 0.6]], w: 2,
    title: 'Filing at the cable office',
    text: "Platt files his copy every morning at the cable office, fighting the censor over every adjective. 'They cut grave. They cut ominous. They let me keep the weather is fine, in full. Say, how do you spell Hohenzollern? Never mind, the desk will fix it.'",
    choices: [
      { label: 'Help him with his German', sub: 'He will owe you, and say so loudly',
        roll: { p: 0.5, mods: [[['skill', 'german', '>=', 1], 0.3]] },
        ok: [['trust', 'platt', 1]],
        fail: [['trust', 'platt', -1], ['record', 'wire', 0.2]] },
      { label: 'Read over his shoulder', sub: 'His notes are better than his copy',
        roll: { p: 0.5, mods: [[['skill', 'observation', '>=', 2], 0.2]] },
        ok: [['intel', { subj: 'city:VIE', claim: { note: "Platt's notes: the Russian ambassador has cancelled his leave, quietly." }, src: 'person:platt', rel: 0.5, truth: true }]],
        fail: [['trust', 'platt', -2]] },
      { label: 'File your own wire beside him', sub: '£1; the censor sees you together', cost: { money: 1 },
        ok: [['record', 'wire', 0.4], ['legend', 0.05]] },
    ] },

  { id: 'platt.gossip', at: 'person', speaker: 'platt', if: [MET, ['trust', 'platt', '>=', 1], ['chance', 0.5]], w: 2,
    title: 'Platt has a theory',
    text: "Platt lowers his voice, which brings it to the level of other people's. 'Between you and me and the cuspidor, somebody in your line of work is talking to Vienna. I've got a nose for it.' He taps the nose. It has been wrong before, often and with confidence.",
    choices: [
      { label: 'Ask about the doctor in Vienna', sub: 'Platt dislikes Brandl; Brandl dislikes Platt', if: [['not', ['flag', 'platt-gossip-brandl']]],
        ok: [['flag', 'platt-gossip-brandl'], ['intel', { subj: 'person:brandl', claim: { loyal: 'enemy' }, src: 'person:platt', rel: 0.3, truth: 'auto' }]] },
      { label: 'Ask about the Serbian lieutenant', sub: 'Platt drank with Ilić once, and lost', if: [['not', ['flag', 'platt-gossip-ilic']]],
        ok: [['flag', 'platt-gossip-ilic'], ['intel', { subj: 'person:ilic', claim: { loyal: 'enemy' }, src: 'person:platt', rel: 0.3, truth: 'auto' }]] },
      { label: 'Ask about the Zurich banker', sub: 'Platt banks with Amsler, and resents the fees', if: [['not', ['flag', 'platt-gossip-amsler']]],
        ok: [['flag', 'platt-gossip-amsler'], ['intel', { subj: 'person:amsler', claim: { loyal: 'enemy' }, src: 'person:platt', rel: 0.3, truth: 'auto' }]] },
      { label: 'Ask about the printer in Prague', sub: 'Everybody has an opinion on forgers',
        ok: [['intel', { subj: 'person:novak', claim: { note: 'Platt: the Prague printer Novák prints for the police too.' }, src: 'person:platt', rel: 0.3, truth: false }]] },
      { label: 'Tell him to keep his nose out', sub: 'He will sulk for an hour',
        ok: [['trust', 'platt', -1], ['watch', -0.05]] },
    ] },

  { id: 'platt.dispatch', at: 'person', speaker: 'platt', if: [MET, ['trust', 'platt', '>=', 2], ['stay', '>=', 2]], w: 4, once: true,
    title: 'A dispatch past the censor',
    text: "'Say, you're travelling,' Platt says. 'I've got a piece the censor will butcher. A real corker: troop trains, the works. If you carried it over the frontier and posted it, I'd owe you a dinner at Delmonico's.' He holds out an envelope as thick as a sandwich. Your name is not on it. Yet.",
    choices: [
      { label: 'Carry it over the frontier', sub: 'If you are searched, it is your envelope',
        ok: [['trust', 'platt', 2], ['flag', 'platt-dispatch'], ['record', 'list', 0.2], ['later', 48, 'platt.wired']] },
      { label: 'Read it first', sub: 'In case it mentions a certain traveller',
        roll: { p: 0.6, mods: [[['skill', 'tradecraft', '>=', 2], 0.2]] },
        ok: [['flag', 'platt-dispatch'], ['later', 48, 'platt.wired'],
          ['intel', { subj: 'cover:active', claim: { note: "Platt's dispatch mentions a 'quiet foreigner' at his hotel, not by name." }, src: 'seen', rel: 0.9, truth: true }]],
        fail: [['trust', 'platt', -2]] },
      { label: 'Refuse: carry your own risks', sub: 'He will find someone less careful',
        ok: [['trust', 'platt', -1], ['nerve', 1]] },
    ] },

  { id: 'platt.recruit', at: 'person', speaker: 'platt', if: [['st', 'platt', 'cultivated'], ['trust', 'platt', '>=', 3]], w: 6, once: true,
    title: 'The story of the century',
    text: "'I know what you are,' Platt says happily. 'Don't tell me. I like it better not knowing. But when it's over, whatever it is, I get the story first. The whole thing, with names. That's my price.' He means it. He also means to tell everybody he means it.",
    choices: [
      { label: 'Promise him the story, after', sub: 'A promise to a newspaperman has a long memory',
        ok: [['st', 'platt', 'recruited'], ['trust', 'platt', 1]] },
      { label: 'Pay him by the column instead', sub: '£10 a month for his ears', cost: { money: 10 },
        ok: [['st', 'platt', 'recruited']] },
      { label: 'Not him: he cannot keep a secret', sub: 'True, and he will find out you said it',
        ok: [['trust', 'platt', -2], ['nerve', 1]] },
    ] },

  { id: 'platt.call', at: 'person', speaker: 'platt', if: [MET], w: 1,
    title: 'Platt, between editions',
    text: "Platt is between editions, between drinks and between theories. He has a new hat, a new rumour and the same old Chicago confidence that the world is a story somebody has not yet written down properly. 'What've you got for me?' he asks. 'I'll trade you even.'",
    choices: [
      { label: 'Give him a lump of amber', sub: 'He collects it, and stories about it', if: [['item', 'amber'], ['trust', 'platt', '<', 4]],
        ok: [['item', '-amber'], ['trust', 'platt', 2]] },
      { label: 'Give him caviar', sub: 'He eats it with a spoon, like oatmeal', if: [['item', 'caviar'], ['trust', 'platt', '<', 4]],
        ok: [['item', '-caviar'], ['trust', 'platt', 2]] },
      { label: 'Give him the opera tickets', sub: 'He will review the audience, not the opera', if: [['item', 'opera-tickets'], ['trust', 'platt', '<', 4]],
        ok: [['item', '-opera-tickets'], ['trust', 'platt', 2]] },
      { label: 'Tell him you are bound for Rome', sub: 'It will be in print by Thursday', if: [['not', ['flag', 'platt-planted']]],
        ok: PLANT_ROME },
      { label: 'Denounce him to Falk as a spy', sub: '£15, and Falk chases an American', ok: SELL },
    ] },

  { id: 'platt.clipping', at: 'then', speaker: 'platt', if: [['flag', 'platt-planted']], once: true,
    title: 'A clipping from Chicago',
    text: "A clipping arrives from Platt, very pleased with himself: a paragraph in the Clarion about a mysterious traveller bound for Rome. Your traveller. He has spelled your name wrong, which helps, and described your hat exactly, which does not. 'Swell, huh?' he has written in the margin.",
    choices: [
      { label: 'Wire him thanks', sub: 'Every wire is a record',
        ok: [['trust', 'platt', 1], ['record', 'wire', 0.3]] },
      { label: 'Buy a new hat', sub: '£2, and an afternoon', cost: { money: 2 },
        ok: [['nerve', 1]] },
    ] },

  { id: 'platt.wired', at: 'then', speaker: 'platt', if: [['flag', 'platt-dispatch']], once: true,
    title: 'CORKER STOP',
    text: "A telegram, forwarded from your last hotel: CORKER STOP DESK DELIGHTED STOP PAGE ONE STOP OWE YOU DELMONICOS STOP PLATT. The German censor has stamped it as read, and somebody has underlined the word owe.",
    choices: [
      { label: 'Burn it', sub: 'The censor kept a copy anyway',
        ok: [['nerve', -1], ['unflag', 'platt-dispatch']] },
      { label: 'Wire back: you owe me', sub: 'He pays his debts in gossip', cost: { money: 1 },
        ok: [['trust', 'platt', 1], ['record', 'wire', 0.3], ['unflag', 'platt-dispatch']] },
    ] },

  // ---------- protect and betray ----------
  { id: 'platt.compromised', at: 'person', speaker: 'platt', if: [['st', 'platt', 'compromised']], w: 9,
    title: 'They took his notebook',
    text: "Platt is indignant, which is his version of frightened. 'Two fellows took my notebook at the station. Took it! Said it was a formality. Your name's in it, I'm sorry to say, spelled three different ways.' He tries to grin. 'I guess the third way was right, huh?'",
    choices: [
      { label: 'Buy the notebook back', sub: '£15 to a station policeman',
        cost: { money: 15 },
        roll: { p: 0.6 },
        ok: [['st', 'platt', 'cultivated'], ['trust', 'platt', 1]],
        fail: [['record', 'bribe', 0.8], ['st', 'platt', 'met']] },
      { label: 'Send him home to Chicago', sub: 'A boat from Hamburg; the paper will grumble',
        ok: [['st', 'platt', 'met'], ['trust', 'platt', -1], ['watch', -0.1]] },
      { label: 'Use him: let him spread a story', sub: 'They will read his next notebook too',
        ok: [['plant', { via: 'platt', subj: 'cover:active', claim: { at: 'ROM' } }], ['expose', 'platt', 0.5], ['trust', 'platt', -1]] },
      { label: 'Denounce him to Falk as a spy', sub: '£15, and Falk chases an American', ok: SELL },
    ] },

  { id: 'platt.letter', at: 'then', speaker: 'platt', if: [['flag', 'platt-sold']],
    title: 'Expelled, with regrets',
    text: "A letter from Platt, postmarked Rotterdam. 'They held me nine days and put me on a Dutch boat. The Clarion is thrilled: I am a martyr to the free press. A fellow at the Wilhelmstrasse told me who named me. I didn't believe him. I'm not sure I don't now. Yours, still, L.P.'",
    choices: [
      { label: 'Burn it', sub: 'He will tell the story anyway',
        ok: [['nerve', -1]] },
      { label: 'Write back, and lie well', sub: 'He wants to believe you',
        roll: { p: 0.5, mods: [[['skill', 'charm', '>=', 2], 0.2]] },
        ok: [['trust', 'platt', 2]],
        fail: [['trust', 'platt', -1], ['record', 'wire', 0.3]] },
    ] },
];
