// Storylets with Odile Vasseur (owner: People). Quick, practical, warm.
// Arc: a distant contact, met in Paris or Brussels or on the express between them; she gives the side op op-letter,
// and once met she writes: officers' wives' gossip, and in Act III a warning about who has been asking.
// Flags: odile-heart, odile-carried, odile-planted, odile-sold.

const MET = ['any', ['st', 'odile', 'met'], ['st', 'odile', 'cultivated'], ['st', 'odile', 'recruited']];
const CHARM = [['skill', 'charm', '>=', 2], 0.2];
const SELL = [['money', 10], ['susp', 'active', -0.2], ['st', 'odile', 'arrested'], ['trust', 'platt', -2], ['trust', 'agathe', -2],
  ['flag', 'odile-sold'], ['later', 30, 'odile.cell']];

export default [
  { id: 'odile.meet', at: 'person', speaker: 'odile', if: [['st', 'odile', 'unknown']], w: 10, once: true,
    title: 'Feathers and mirrors',
    text: "A milliner's all feathers and mirrors. Odile Vasseur talks through a mouthful of pins. 'You don't want a hat. Nobody with that face wants a hat. Sit, sit. Madame la Générale is due at four, and she tells me everything, and I tell nobody, except the people I like. Do I like you? We shall see.'",
    choices: [
      { label: 'Order a hat, and listen', sub: '£8; her best clients talk while she pins', cost: { money: 8 },
        if: [['sex', 'f']],
        ok: [['st', 'odile', 'met'], ['trust', 'odile', 2], ['legend', 0.05]] },
      { label: 'Order three hats, extravagantly', sub: '£15; a {count|countess} is expected to', cost: { money: 15 },
        if: [['cover', 'vessey']],
        ok: [['st', 'odile', 'met'], ['trust', 'odile', 2]] },
      { label: 'Bring her Brussels lace', sub: 'The way to a milliner is through her trimmings', if: [['item', 'lace']],
        ok: [['item', '-lace'], ['st', 'odile', 'met'], ['trust', 'odile', 2]] },
      { label: "Ask about the officers' wives", sub: 'She may laugh, or show you the door',
        roll: { p: 0.5, mods: [CHARM, [['skill', 'french', '>=', 1], 0.15]] },
        ok: [['st', 'odile', 'met'], ['trust', 'odile', 1],
          ['intel', { subj: 'city:PAR', claim: { note: "Odile: the general's wife has cancelled her August at Deauville." }, src: 'person:odile', rel: 0.6, truth: true }]],
        fail: [['st', 'odile', 'met'], ['trust', 'odile', -1]] },
      { label: 'Hold her pins while she works', sub: 'An hour of feathers and opinions', cost: { min: 60 },
        ok: [['st', 'odile', 'met'], ['trust', 'odile', 1]] },
    ] },

  { id: 'odile.gossip', at: 'person', speaker: 'odile', if: [MET, ['trust', 'odile', '>=', 1]], w: 4, once: true,
    title: 'What the wives say',
    text: "Odile has had the general's wife, the colonel's wife and a deputy's wife in one afternoon, and her head is full of other people's husbands. 'One at a time,' she says, 'or I mix them up, and then I sell the wrong hat to the wrong war.'",
    choices: [
      { label: "What the general's wife said", sub: 'Generals tell their wives more than ministers',
        ok: [['intel', { subj: 'city:PAR', claim: { note: "Odile: officers' leave is to be stopped after the twenty-fifth, quietly." }, src: 'person:odile', rel: 0.7, truth: true }]] },
      { label: "What the colonel's wife said", sub: 'Colonels count horses',
        ok: [['intel', { subj: 'city:PAR', claim: { note: 'Odile: the remount officers are buying every carriage horse in Paris.' }, src: 'person:odile', rel: 0.6, truth: true }]] },
      { label: "What the deputy's wife said", sub: 'Deputies hear everything, wrongly',
        ok: [['intel', { subj: 'city:PAR', claim: { note: 'Odile: the deputies say England will stay out, whatever happens.' }, src: 'person:odile', rel: 0.5, truth: false }]] },
      { label: 'Pay her for all three', sub: '£3; she prefers to be paid in hats', cost: { money: 3 },
        ok: [['trust', 'odile', -1],
          ['intel', { subj: 'city:PAR', claim: { note: "Odile: officers' leave is to be stopped after the twenty-fifth, quietly." }, src: 'person:odile', rel: 0.7, truth: true }]] },
    ] },

  { id: 'odile.letter', at: 'person', speaker: 'odile', if: [MET, ['trust', 'odile', '>=', 2], ['not', ['op', 'op-letter']], ['not', ['flag', 'op-letter-won']], ['not', ['flag', 'op-letter-failed']]], w: 7, once: true,
    title: 'Only a love letter',
    text: "Odile holds out an envelope, sealed with green wax, addressed to a captain of Guides in Brussels. 'It's only a love letter,' she says, a little too quickly. 'The post is slow and his colonel reads it. You are going north anyway. Aren't you?' She does not let go of the envelope at once.",
    choices: [
      { label: 'Carry it for her', sub: 'A sealed letter; whatever it says, you carry it',
        ok: [['op', 'op-letter', 'start'], ['trust', 'odile', 2]] },
      { label: 'Carry it, and steam it open', sub: 'Green wax shows every touch',
        roll: { p: 0.5, mods: [[['skill', 'tradecraft', '>=', 2], 0.25]] },
        ok: [['op', 'op-letter', 'start'],
          ['intel', { subj: 'op:op-letter', claim: { note: "Odile's letter is written in lovers' pet names, too regular for love." }, src: 'seen', rel: 0.7, truth: true }]],
        fail: [['op', 'op-letter', 'start'], ['trust', 'odile', -3]] },
      { label: 'Refuse: you carry nothing sealed', sub: 'She will not ask twice',
        ok: [['trust', 'odile', -1], ['nerve', 1]] },
    ] },

  { id: 'odile.heart', at: 'city', speaker: 'odile', if: [['st', 'odile', 'met']], once: true,
    title: 'Red eyes on the terrace',
    text: "Odile is alone at a café table with a cold chocolate and red eyes, which she blames on the dust. Her captain in Brussels has written that his regiment has been moved to Liège, and that he loves her, in that order. 'In that order,' she says. 'You see?'",
    choices: [
      { label: 'Give her Venetian brocade', sub: 'Something beautiful, for no reason', if: [['item', 'silk-brocade']],
        ok: [['item', '-silk-brocade'], ['trust', 'odile', 2], ['st', 'odile', 'cultivated']] },
      { label: 'Sit with her, and listen', sub: 'Two hours of a captain’s virtues', cost: { min: 120 },
        ok: [['trust', 'odile', 1], ['st', 'odile', 'cultivated'], ['flag', 'odile-heart']] },
      { label: 'Ask what else he wrote', sub: 'A regiment at Liège is news',
        roll: { p: 0.5, mods: [CHARM] },
        ok: [['intel', { subj: 'city:BRU', claim: { note: "Odile's captain writes that his Guides have moved to Liège, by night." }, src: 'person:odile', rel: 0.7, truth: true }]],
        fail: [['trust', 'odile', -2]] },
    ] },

  { id: 'odile.recruit', at: 'person', speaker: 'odile', if: [['st', 'odile', 'cultivated'], ['trust', 'odile', '>=', 3]], w: 6, once: true,
    title: 'Hats, and a little more',
    text: "'You want me to listen for you,' Odile says. 'I listen anyway. The difference is whether I get paid, and whether you look after my captain if the Germans come.' She takes a pin out of her mouth. 'I am practical. I am also in love. Both cost money.'",
    choices: [
      { label: "Pay her for the wives' gossip", sub: '£10 a month, in hats if she prefers', cost: { money: 10 },
        ok: [['st', 'odile', 'recruited'], ['trust', 'odile', 1]] },
      { label: 'Promise to look after her captain', sub: 'A promise about a soldier, in 1914', if: [['any', ['flag', 'odile-heart'], ['flag', 'odile-carried'], ['op', 'op-letter']]],
        ok: [['st', 'odile', 'recruited'], ['trust', 'odile', 1]] },
      { label: 'Not yet', sub: 'She shrugs; she has other customers',
        ok: [['trust', 'odile', -1], ['nerve', 1]] },
    ] },

  { id: 'odile.express', at: 'train', speaker: 'odile', if: [MET], once: true,
    title: 'Three hatboxes for Brussels',
    text: "Odile is on the Brussels express with three hatboxes and an expression that says do not ask. At Quévy the Belgian customs men are opening hatboxes, which they never do. She looks at you, then at the third hatbox, then out of the window, humming.",
    choices: [
      { label: 'Claim the third hatbox as yours', sub: 'If they open it, it is your hat',
        roll: { p: 0.6, mods: [[['sex', 'f'], 0.15]] },
        ok: [['trust', 'odile', 2], ['flag', 'odile-carried']],
        fail: [['record', 'frontier', 0.8], ['trust', 'odile', 1], ['flag', 'odile-carried']] },
      { label: 'Ask what is in the hatboxes', sub: 'Hats, she will say',
        ok: [['trust', 'odile', -1], ['intel', { subj: 'person:odile', claim: { note: 'Odile carries more than hats to Brussels: letters, probably.' }, src: 'seen', rel: 0.6, truth: true }]] },
      { label: 'Move to another carriage', sub: 'She will notice which carriage',
        ok: [['trust', 'odile', -1], ['nerve', 1]] },
    ] },

  { id: 'odile.post', at: 'interlude', speaker: 'odile', if: [MET, ['act', 2]], once: true,
    title: 'A letter that smells of violets',
    text: "A letter from Paris that smells of violets and millinery size. Odile writes as she talks, in a rush, underlining: the general's wife has bought a black hat, just in case; the colonel's wife has bought two. 'Nobody buys black in July,' she writes, 'unless somebody has told them something. Write to me!'",
    choices: [
      { label: 'Write back, and ask for more', sub: 'Letters to Paris are read in Paris', cost: { money: 1 },
        ok: [['trust', 'odile', 1], ['record', 'wire', 0.2],
          ['intel', { subj: 'city:PAR', claim: { note: "Odile: officers' wives in Paris are buying mourning in July." }, src: 'person:odile', rel: 0.6, truth: true }]] },
      { label: 'Burn it unanswered', sub: 'Safer; she will be hurt',
        ok: [['trust', 'odile', -1], ['nerve', 1]] },
    ] },

  { id: 'odile.warning', at: 'interlude', speaker: 'odile', if: [MET, ['act', 3], ['trust', 'odile', '>=', 2]], once: true,
    title: 'A lady asked about you',
    text: "Odile writes in pencil, in a hurry. 'A German lady bought the dearest hat in the shop and asked, while I pinned it, whether a friend of yours still came in. She knew your face. She did not know your name, I think. I said I sell hats, not friends. Take care. O.'",
    choices: [
      { label: 'Wire her your thanks', sub: 'A wire from you is a link to her', cost: { money: 1 },
        ok: [['trust', 'odile', 1], ['expose', 'odile', 0.2],
          ['intel', { subj: 'cover:active', claim: { knows: 'desc' }, src: 'person:odile', rel: 0.7, truth: 'auto' }]] },
      { label: 'Do not answer', sub: 'Silence protects her, perhaps',
        ok: [['nerve', -1], ['intel', { subj: 'cover:active', claim: { knows: 'desc' }, src: 'person:odile', rel: 0.7, truth: 'auto' }]] },
    ] },

  { id: 'odile.thanks', at: 'person', speaker: 'odile', if: [['flag', 'op-letter-won'], MET], w: 8, once: true,
    title: 'Both cheeks, and a hat',
    text: "Odile kisses you on both cheeks and then, after a moment's thought, a third time, which is Belgian. 'He wrote back. He is well. He is at Liège, which is a fortress, so he says he is safe.' She looks at you over her pins. 'Is he safe?'",
    choices: [
      { label: 'Tell her the truth about Liège', sub: 'The Germans will come that way first',
        ok: [['trust', 'odile', 1], ['nerve', -1]] },
      { label: 'Tell her he is quite safe', sub: 'She wants to believe it, today',
        ok: [['trust', 'odile', 2], ['later', 200, 'odile.liege']] },
    ] },

  { id: 'odile.liege', at: 'then', speaker: 'odile', if: [MET, ['war', 'DE', 'BE']], once: true,
    title: 'Liège is a fortress',
    text: "A letter from Odile, the writing larger than usual. 'You said he was safe. The newspapers say the Germans are at Liège. You said. I know you could not know. I am only writing it down so that I remember who said it.' There is no signature, only an O, very hard.",
    choices: [
      { label: 'Write back, and apologise', sub: 'An apology posted to Paris, in August', cost: { money: 1 },
        ok: [['trust', 'odile', -1]] },
      { label: 'Let it lie', sub: 'Some letters are not answered',
        ok: [['trust', 'odile', -2]] },
    ] },

  { id: 'odile.cold', at: 'person', speaker: 'odile', if: [['flag', 'op-letter-failed'], MET], w: 8, once: true,
    title: 'She does not look up',
    text: "Odile does not look up from her pins. 'It never arrived,' she says. 'He waited at the post office for three days. Now his colonel has questions, and so do I.' She puts a pin in very carefully. 'You can sit, if you like. The chair is not a hat. It costs nothing.'",
    choices: [
      { label: 'Buy a hat she cannot sell', sub: '£8, and an apology in it', cost: { money: 8 },
        ok: [['trust', 'odile', 1]] },
      { label: 'Tell her the frontier was closing', sub: 'True enough; it changes nothing',
        ok: [['trust', 'odile', -1], ['nerve', -1]] },
    ] },

  { id: 'odile.call', at: 'person', speaker: 'odile', if: [MET], w: 1,
    title: 'Odile, pinning',
    text: "Odile is pinning a hat on a wooden head that looks remarkably like a cabinet minister. 'Talk,' she says. 'I can pin and listen. I can pin and lie, too, but not to you, not today.' The shop bell rings, and she waves the customer into a chair without turning round.",
    choices: [
      { label: 'Give her Venetian brocade', sub: 'She will make it into something wicked', if: [['item', 'silk-brocade'], ['trust', 'odile', '<', 4]],
        ok: [['item', '-silk-brocade'], ['trust', 'odile', 2]] },
      { label: 'Give her Brussels lace', sub: 'Trimming for a dozen hats', if: [['item', 'lace'], ['trust', 'odile', '<', 4]],
        ok: [['item', '-lace'], ['trust', 'odile', 2]] },
      { label: 'Tell her you go to Brussels next', sub: 'Her customers repeat everything', if: [['not', ['flag', 'odile-planted']]],
        ok: [['plant', { via: 'odile', subj: 'cover:active', claim: { at: 'BRU' } }], ['expose', 'odile', 0.3], ['flag', 'odile-planted']] },
      { label: 'Denounce her to the Sûreté', sub: 'A courier for a foreign officer; the police pay', ok: SELL },
    ] },

  // ---------- protect and betray ----------
  { id: 'odile.compromised', at: 'person', speaker: 'odile', if: [['st', 'odile', 'compromised']], w: 9,
    title: 'A customer who never buys',
    text: "'A man has been in three times and bought nothing,' Odile says, pinning too hard. 'He asks about my Belgian, and about my English friend, which is you. He has a German accent and a French name.' She jabs the hat. 'I am frightened, and I do not like it. What do I do?'",
    choices: [
      { label: 'Close the shop for a week', sub: '£10 for her lost custom', cost: { money: 10 },
        ok: [['st', 'odile', 'cultivated'], ['trust', 'odile', 1], ['watch', -0.1]] },
      { label: 'Send her to Brussels for a while', sub: 'Brussels, in August 1914',
        ok: [['st', 'odile', 'cultivated'], ['trust', 'odile', 1], ['later', 200, 'odile.liege']] },
      { label: 'Use her as bait for him', sub: 'Feed him a story; she pays the risk',
        ok: [['plant', { via: 'odile', subj: 'cover:active', claim: { at: 'BRU' } }], ['expose', 'odile', 0.5], ['trust', 'odile', -1]] },
      { label: 'Denounce her to the Sûreté', sub: 'A courier for a foreign officer; the police pay', ok: SELL },
    ] },

  { id: 'odile.cell', at: 'then', speaker: 'odile', if: [['flag', 'odile-sold']],
    title: 'From Saint-Lazare',
    text: "A note from the women's prison of Saint-Lazare, on paper that smells of carbolic instead of violets. 'They say I carried letters for a foreign officer. I carried letters for a man I love. The magistrate laughed. I made his wife's hats for six years. Tell me it was not you. Tell me anything. O.'",
    choices: [
      { label: 'Burn it', sub: 'Carbolic burns badly',
        ok: [['nerve', -2]] },
      { label: 'Pay for her advocate', sub: '£15, unsigned; Platt will hear of it', cost: { money: 15 },
        ok: [['trust', 'platt', 1], ['nerve', 1]] },
    ] },
];
