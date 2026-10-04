// Storylets of op-mole, The Mole (owner: Ops). See docs/CONTRACTS.md §5.
// Plants: Brandl → TRI, Ilić → BUD, Amsler → MUN. The watch and the naming test the hidden loyalty.

const plantBrandl = ['plant', { via: 'brandl', subj: 'op:op-mole', claim: { at: 'TRI' } }];
const plantIlic = ['plant', { via: 'ilic', subj: 'op:op-mole', claim: { at: 'BUD' } }];
const plantAmsler = ['plant', { via: 'amsler', subj: 'op:op-mole', claim: { at: 'MUN' } }];
const loyalty = (who, claim, rel) => ['intel', { subj: `person:${who}`, claim: { loyal: claim }, src: 'seen', rel, truth: 'auto' }];
const named = ['op', 'op-mole', 'step:name'];
const failed = ['op', 'op-mole', 'fail'];

export default [
  // ---------- in-person plants (twists) ----------
  { id: 'op-mole.brandl', at: 'op', speaker: 'brandl',
    title: 'Tokay with Dr Brandl',
    text: 'Brandl pours two glasses of Tokay in his consulting room and listens, as he always listens, with his fingertips together. Now is the moment to let slip, as if by accident, that a Bureau courier comes ashore at Trieste on the seventeenth. He never asks questions. That may be discretion. It may be something else.',
    choices: [
      { label: 'Let slip the Trieste courier', sub: 'Once said, it cannot be unsaid',
        ok: [plantBrandl, ['flag', 'op-mole-brandl'], ['record', 'meeting', 0.3]] },
      { label: 'Talk only of his patients', sub: 'Write to him later instead',
        ok: [['trust', 'brandl', 1], ['min', 60]] },
    ] },

  { id: 'op-mole.ilic', at: 'op', speaker: 'ilic',
    title: 'Ilić in a kafana',
    text: 'Ilić meets you in a kafana near the station, cheerful and much too loud. He talks about the Austrians, the Bulgarians, his brother, the army. This is the moment to mention a Bureau courier changing trains at Budapest on the seventeenth. He will swear to tell no one. He will swear it loudly.',
    choices: [
      { label: 'Mention the Budapest courier', sub: 'He talks; that is why it may work',
        ok: [plantIlic, ['flag', 'op-mole-ilic'], ['record', 'meeting', 0.4]] },
      { label: 'Let him talk; say nothing', sub: 'Write to him later instead',
        ok: [['trust', 'ilic', 1], ['min', 60]] },
    ] },

  { id: 'op-mole.amsler', at: 'op', speaker: 'amsler',
    title: "Herr Amsler's neat hand",
    text: "Amsler receives you in a panelled room where money is never mentioned aloud. This is the moment to ask him to hold funds for a Bureau courier, who will draw them at his Munich correspondent's on the seventeenth. He would write the instruction in a small, neat hand, blot it, and ask after your health.",
    choices: [
      { label: 'Ask him to hold the funds', sub: '£5 deposited, to make it real', cost: { money: 5 },
        ok: [plantAmsler, ['flag', 'op-mole-amsler'], ['record', 'meeting', 0.2]] },
      { label: 'Discuss only your own account', sub: 'Write to him later instead',
        ok: [['trust', 'amsler', 1], ['min', 60]] },
    ] },

  { id: 'op-mole.platt', at: 'op', speaker: 'platt',
    title: 'Platt hears things',
    text: "Platt corners you by the newspaper rack, delighted with himself. 'The Vienna police have booked a whole compartment to Trieste for Friday,' he says. 'Something's up on the Adriatic. You heard anything?' Platt hears everything, checks nothing, and repeats it all by dinner.",
    choices: [
      { label: 'Buy him a drink for the rest', sub: '£1, and an hour of his voice', cost: { money: 1 },
        ok: [['trust', 'platt', 1],
          ['intel', { subj: 'hunter:heller', claim: { heading: 'TRI' }, src: 'person:platt', rel: 0.45, truth: 'auto' }]] },
      { label: 'Tell him you heard Budapest', sub: 'He will repeat it everywhere',
        ok: [['trust', 'platt', -1], ['plant', { via: 'platt', subj: 'op:op-mole', claim: { at: 'BUD' } }]] },
      { label: 'Shrug him off', sub: 'He sulks, briefly',
        ok: [['trust', 'platt', -1]] },
    ] },

  // ---------- feeding by letter (way) ----------
  { id: 'op-mole.letters', at: 'op',
    title: 'Three letters, three lies',
    text: "You write three letters in three different moods. To Brandl, a patient's gossip about a courier landing at Trieste. To Ilić, a friend's warning of a man changing trains at Budapest. To Amsler, instructions for funds to be drawn in Munich. Each names the seventeenth. Each will be steamed open by somebody before it arrives.",
    choices: [
      { label: 'Post them from the main office', sub: 'A shilling; the censors read everything', cost: { money: 1 },
        ok: [plantBrandl, plantIlic, plantAmsler, ['flag', 'op-mole-brandl'], ['flag', 'op-mole-ilic'], ['flag', 'op-mole-amsler'],
          ['record', 'wire', 0.6], ['op', 'op-mole', 'step:feed']] },
      { label: "Send them by the Bureau's courier", sub: '£4, and nobody else reads them', cost: { money: 4 },
        ok: [plantBrandl, plantIlic, plantAmsler, ['flag', 'op-mole-brandl'], ['flag', 'op-mole-ilic'], ['flag', 'op-mole-amsler'],
          ['record', 'wire', 0.1], ['op', 'op-mole', 'step:feed']] },
    ] },

  // ---------- the watch ----------
  { id: 'op-mole.watch', at: 'op', if: [['any', ['city', 'TRI'], ['city', 'BUD'], ['city', 'MUN']]],
    title: 'The seventeenth',
    text: 'You take a table with a view of the station forecourt and a newspaper you do not read. Trains come and go; porters argue; a flower-seller works the cab rank. If anyone in the net has told Heller or Orlova about a courier here, they will come today, and they will not be subtle about it. You watch the faces.',
    choices: [
      { label: 'Watch the Lloyd quay', sub: 'Where the Venice steamer ties up', if: [['city', 'TRI']],
        ok: [['record', 'sighting', 0.2]], next: 'op-mole.watch-tri' },
      { label: 'Watch the Vienna trains come in', sub: 'Platform three, the Belgrade connection', if: [['city', 'BUD']],
        ok: [['record', 'sighting', 0.2]], next: 'op-mole.watch-bud' },
      { label: 'Watch the bank across the square', sub: "Amsler's correspondent opens at ten", if: [['city', 'MUN']],
        ok: [['record', 'sighting', 0.2]], next: 'op-mole.watch-mun' },
      { label: 'Note the date; you are elsewhere', sub: 'The hunters will not wait for you',
        if: [['not', ['any', ['city', 'TRI'], ['city', 'BUD'], ['city', 'MUN']]]],
        ok: [['nerve', -1]] },
    ] },

  { id: 'op-mole.watch-tri', at: 'then',
    title: 'Trieste, the Lloyd quay',
    text: 'The Lloyd steamer from Venice ties up at noon in a smell of coal and oranges. Passengers stream down the gangway into the arms of porters, cousins and customs men. You count the hats on the quay, and the men who are looking at hats instead of at the passengers.',
    choices: [
      { label: 'Two plain-clothes men meet the boat', if: [['loyal', 'brandl', 'enemy:heller']],
        ok: [loyalty('brandl', 'enemy', 0.85),
          ['debrief', 'At Trieste the Evidenzbureau met a courier who did not exist. Only Brandl had heard of him.']] },
      { label: 'Nobody meets the boat but cousins', if: [['not', ['loyal', 'brandl', 'enemy:heller']]],
        ok: [loyalty('brandl', 'self', 0.6)] },
    ] },

  { id: 'op-mole.watch-bud', at: 'then',
    title: 'Budapest, under the iron roof',
    text: 'The Vienna express steams in under the great iron roof of the Keleti station at a quarter past two. A courier changing for Belgrade would cross platform three with a small case. You choose a bench with a view of platform three, and of the men who might be waiting there.',
    choices: [
      { label: 'Gendarmes search every small case', if: [['loyal', 'ilic', 'enemy:heller']],
        ok: [loyalty('ilic', 'enemy', 0.85),
          ['debrief', 'At Budapest the gendarmes searched for a courier only Ilić had heard of.']] },
      { label: 'Nobody searches platform three', if: [['not', ['loyal', 'ilic', 'enemy:heller']]],
        ok: [loyalty('ilic', 'cause', 0.6)] },
    ] },

  { id: 'op-mole.watch-mun', at: 'then',
    title: 'Munich, opposite the bank',
    text: "Amsler's Munich correspondent keeps a discreet bank on the Promenadeplatz, with a brass plate and a doorman. A courier drawing funds would go in at ten and come out by half past. You take a window seat in the café opposite, with a view of the brass plate and the doorman.",
    choices: [
      { label: 'A widow in black, very good gloves', if: [['loyal', 'amsler', 'enemy:orlova']],
        ok: [loyalty('amsler', 'enemy', 0.85),
          ['debrief', 'At Munich Madame Orlova waited for a courier only Amsler had heard of.']] },
      { label: 'Only clerks, and a dog', if: [['not', ['loyal', 'amsler', 'enemy:orlova']]],
        ok: [loyalty('amsler', 'self', 0.6)] },
    ] },

  // ---------- naming the mole (ways) ----------
  { id: 'op-mole.name-brandl', at: 'op', speaker: 'ashby',
    title: 'You name Dr Brandl',
    text: "Ashby listens without interrupting, which is rare. When you have finished he takes off his spectacles. 'Brandl. A doctor who treats half the Austrian staff for their nerves. It would explain a great deal.' He writes the name on a card and turns it face down. 'Very well. What do you want done with him?'",
    choices: [
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['loyal', 'brandl', 'enemy:heller']],
        ok: [['st', 'brandl', 'compromised'], ['standing', 5], ['debrief', "Brandl was Heller's man. You named him, and the Bureau cut him off."], named] },
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['not', ['loyal', 'brandl', 'enemy:heller']]],
        ok: [['st', 'brandl', 'compromised'], ['trust', 'brandl', -3],
          ['debrief', 'Brandl was innocent. The leak went on, and he never learned why you stopped calling.'], failed] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [['loyal', 'brandl', 'enemy:heller']],
        ok: [['flag', 'op-mole-kept-brandl'], ['standing', 5], ['debrief', "Brandl was Heller's man. You kept him on, as a pipe for lies."], named] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [['not', ['loyal', 'brandl', 'enemy:heller']]],
        ok: [['flag', 'op-mole-kept-brandl'], ['debrief', 'Brandl was innocent; the lies you fed him went nowhere, and the leak went on.'], failed] },
    ] },

  { id: 'op-mole.name-ilic', at: 'op', speaker: 'ashby',
    title: 'You name Lieutenant Ilić',
    text: "Ashby listens without interrupting, which is rare. 'Ilić. A patriot who cannot keep his mouth shut in three languages. A careless man is a useful man, to Heller.' He writes the name on a card and turns it face down. 'Very well. What do you want done with him?'",
    choices: [
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['loyal', 'ilic', 'enemy:heller']],
        ok: [['st', 'ilic', 'compromised'], ['standing', 5], ['debrief', "Ilić was Heller's man. You named him, and the Bureau cut him off."], named] },
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['not', ['loyal', 'ilic', 'enemy:heller']]],
        ok: [['st', 'ilic', 'compromised'], ['trust', 'ilic', -3],
          ['debrief', 'Ilić was loyal to Serbia and to you. He took your silence for contempt.'], failed] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [['loyal', 'ilic', 'enemy:heller']],
        ok: [['flag', 'op-mole-kept-ilic'], ['standing', 5], ['debrief', "Ilić was Heller's man. You kept him on, as a pipe for lies."], named] },
      { label: 'Keep him, and feed him lies', sub: "A pipe into Heller's office", if: [['not', ['loyal', 'ilic', 'enemy:heller']]],
        ok: [['flag', 'op-mole-kept-ilic'], ['debrief', 'Ilić was innocent; the lies you fed him went nowhere, and the leak went on.'], failed] },
    ] },

  { id: 'op-mole.name-amsler', at: 'op', speaker: 'ashby',
    title: 'You name Herr Amsler',
    text: "Ashby listens without interrupting, which is rare. 'Amsler. Our banker. He knows where every one of our pounds goes, and therefore where every one of our people goes.' He writes the name on a card and turns it face down. 'Very well. What do you want done with him?'",
    choices: [
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['loyal', 'amsler', 'enemy:orlova']],
        ok: [['st', 'amsler', 'compromised'], ['standing', 5], ['debrief', "Amsler was selling to Orlova. You named him, and the Bureau closed its accounts."], named] },
      { label: 'Cut him off', sub: 'No more meetings, no more leaks', if: [['not', ['loyal', 'amsler', 'enemy:orlova']]],
        ok: [['st', 'amsler', 'compromised'], ['trust', 'amsler', -3],
          ['debrief', 'Amsler was honest, after his fashion. The Bureau closed its accounts with him for nothing.'], failed] },
      { label: 'Keep him, and feed him lies', sub: "A pipe to Orlova, and through her to Vienna", if: [['loyal', 'amsler', 'enemy:orlova']],
        ok: [['flag', 'op-mole-kept-amsler'], ['standing', 5], ['debrief', 'Amsler was selling to Orlova. You kept him on, as a pipe for lies.'], named] },
      { label: 'Keep him, and feed him lies', sub: "A pipe to Orlova, and through her to Vienna", if: [['not', ['loyal', 'amsler', 'enemy:orlova']]],
        ok: [['flag', 'op-mole-kept-amsler'], ['debrief', 'Amsler was innocent; the lies you fed him went nowhere, and the leak went on.'], failed] },
    ] },

  { id: 'op-mole.name-nobody', at: 'op', speaker: 'ashby',
    title: 'You name nobody',
    text: "Ashby waits. When it is clear that nothing more is coming, he sighs and puts the cap back on his pen. 'Then we go on as we were,' he says. 'Leaking. I had hoped for better from you.'",
    choices: [
      { label: 'Accept it', sub: 'Better silence than a wrong name',
        ok: [['standing', -3], ['debrief', 'You named nobody, and the leak stayed open into August.'], failed] },
    ] },
];
