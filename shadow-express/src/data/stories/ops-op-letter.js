// Storylets of op-letter, Odile's Letter (owner: Ops). See docs/CONTRACTS.md §5.

const postscript = ['intel', { subj: 'city:BRU', claim: { note: 'The French staff will not move into Belgium until the Germans are already there.' }, src: 'person:odile', rel: 0.65, truth: true }];

export default [
  { id: 'op-letter.steam', at: 'op',
    title: 'Lilac paper, green wax',
    text: "The wax lifts cleanly enough. Inside are two pages of the most conventional endearments in the language, and a postscript: 'The wives of the rue Royale say their husbands will not set foot in Belgium until the Germans have done so first.' It is a love letter. It is also the best intelligence you have read this month.",
    choices: [
      { label: 'Reseal it and say nothing', sub: 'Steady hands, and warm wax',
        roll: { p: 0.7, mods: [[['skill', 'tradecraft', '>=', 2], 0.15], [['skill', 'paperwork', '>=', 2], 0.1]] },
        ok: [['op', 'op-letter', 'step:open'], postscript, ['flag', 'op-letter-read']],
        fail: [['op', 'op-letter', 'step:open'], postscript, ['flag', 'op-letter-read'], ['flag', 'op-letter-smudged']] },
      { label: 'Copy the postscript for Ashby', sub: 'A wire, and a debt to Odile you cannot pay',
        ok: [['op', 'op-letter', 'step:open'], postscript, ['flag', 'op-letter-read'], ['standing', 2], ['record', 'wire', 0.3]] },
      { label: 'Burn it; tell Odile it was lost', sub: 'She will know',
        ok: [['op', 'op-letter', 'fail'], ['trust', 'odile', -3]] },
    ] },

  { id: 'op-letter.lemaire', at: 'op',
    title: 'Captain Lemaire reads it',
    text: "Lemaire is younger than Odile, with a cavalryman's moustache and a staff officer's worried eyes. He reads the letter twice. At the postscript his face changes. 'Tell her,' he says, 'that I understood. All of it.' He looks at you a moment longer than is comfortable. 'You are not a postman.'",
    choices: [
      { label: 'Admit you read it', sub: 'He may respect the honesty', if: [['flag', 'op-letter-read']],
        ok: [['op', 'op-letter', 'step:deliver'], ['trust', 'odile', -1],
          ['intel', { subj: 'city:BRU', claim: { note: 'Lemaire: the Belgian staff expect the Germans at Liège, and no help in time.' }, src: 'seen', rel: 0.7, truth: true }]] },
      { label: 'Say you are a friend of hers', sub: 'Nothing more, nothing less',
        roll: { p: 0.75, mods: [[['flag', 'op-letter-smudged'], -0.4]] },
        ok: [['op', 'op-letter', 'step:deliver'], ['trust', 'odile', 1]],
        fail: [['op', 'op-letter', 'step:deliver'], ['trust', 'odile', -2], ['debrief', 'Lemaire saw the smudged wax and wrote to Odile about it.']] },
      { label: "Offer him the Bureau's friendship", sub: 'A Belgian staff officer is worth having',
        ok: [['op', 'op-letter', 'step:deliver'], ['record', 'meeting', 0.5], ['standing', 3], ['trust', 'odile', -1]] },
    ] },

  { id: 'op-letter.wife', at: 'op',
    title: 'Madame Lemaire answers',
    text: "The door of the captain's flat is opened by a handsome woman in a morning dress, with a child on her hip. 'My husband is at the barracks,' says Madame Lemaire. 'I will give him anything you have for him.' She holds out her free hand for the lilac envelope.",
    choices: [
      { label: 'Give it to her', sub: 'She is his wife, after all',
        ok: [['op', 'op-letter', 'fail'], ['trust', 'odile', -3], ['debrief', "You gave Odile's letter to the captain's wife."]] },
      { label: 'Say you have the wrong house', sub: 'She will remember your face',
        ok: [['record', 'sighting', 0.3]] },
      { label: 'Call it a bill from his tailor', sub: 'Lilac paper, for a tailor',
        roll: { p: 0.5, mods: [[['skill', 'composure', '>=', 2], 0.2], [['skill', 'french', '>=', 1], 0.1]] },
        ok: [['nerve', 1]], fail: [['op', 'op-letter', 'fail'], ['trust', 'odile', -2]] },
    ] },
];
