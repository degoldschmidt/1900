// Storylets with Commander Ashby (owner: People). Terse, naval; dry, impatient, fair.
// Arc: the handler, in London and Paris. While the agent is posted abroad he is heard from by telegram (interlude cards):
// praise, reprimands, the diplomatic bag as a favour to a high standing, and his view of contacts sold or promises made.
// The Ops agent writes his debriefs inside the operations; these are the rest of the relationship.
// Flags: ashby-bag.

const SOLD = ['any', ['flag', 'jovan-sold'], ['flag', 'brandl-sold'], ['flag', 'sauer-sold'], ['flag', 'kowal-sold'], ['flag', 'novak-sold'],
  ['flag', 'amsler-sold'], ['flag', 'ilic-sold'], ['flag', 'odile-sold'], ['flag', 'agathe-sold'], ['flag', 'kessel-sold'], ['flag', 'platt-sold']];
const FAILED = ['any', ['flag', 'op-cable-failed'], ['flag', 'op-optics-failed'], ['flag', 'op-diamonds-failed'], ['flag', 'op-mole-failed'],
  ['flag', 'op-ultimatum-failed'], ['flag', 'op-student-failed'], ['flag', 'op-typist-failed'], ['flag', 'op-troops-failed']];
const WON = ['any', ['flag', 'op-cable-won'], ['flag', 'op-optics-won'], ['flag', 'op-diamonds-won'], ['flag', 'op-mole-won'],
  ['flag', 'op-ultimatum-won'], ['flag', 'op-student-won'], ['flag', 'op-typist-won']];
const RECRUITED = ['any', ['st', 'brandl', 'recruited'], ['st', 'ilic', 'recruited'], ['st', 'sauer', 'recruited'], ['st', 'kowal', 'recruited'],
  ['st', 'novak', 'recruited'], ['st', 'amsler', 'recruited'], ['st', 'kessel', 'recruited'], ['st', 'jovan', 'recruited']];

export default [
  { id: 'ashby.meet', at: 'person', speaker: 'ashby', if: [['st', 'ashby', 'unknown']], w: 10, once: true,
    title: 'Whitehall Court, top floor',
    text: "A room at the top of Whitehall Court that smells of pipe smoke and wet oilskin. Commander Ashby does not rise. 'Sit. You are freelance, which makes you cheap and deniable. Do not make me regret either.' He taps a newspaper: SARAJEVO. 'Every legation in Europe will be at sea by morning. Questions? Briefly.'",
    choices: [
      { label: 'Ask who hunts for the other side', sub: 'He will give you names, not comfort',
        ok: [['st', 'ashby', 'met'],
          ['intel', { subj: 'hunter:falk', claim: { at: 'BER' }, src: 'person:ashby', rel: 0.8, truth: 'auto' }],
          ['intel', { subj: 'hunter:heller', claim: { at: 'VIE' }, src: 'person:ashby', rel: 0.7, truth: 'auto' }]] },
      { label: 'Ask about the people in the net', sub: 'He has opinions; he rations them',
        ok: [['st', 'ashby', 'met'],
          ['intel', { subj: 'person:brandl', claim: { note: 'Ashby: Brandl in Vienna is useful, expensive and vain. Mind all three.' }, src: 'person:ashby', rel: 0.7, truth: true }],
          ['intel', { subj: 'person:ilic', claim: { note: 'Ashby: Ilić in Belgrade is brave and cannot keep his mouth shut.' }, src: 'person:ashby', rel: 0.7, truth: true }]] },
      { label: 'Ask for an advance', sub: '£20 against your fee; he will remember it',
        ok: [['st', 'ashby', 'met'], ['money', 20], ['standing', -3]] },
      { label: 'Say nothing; take the papers', sub: 'He values a short report above all things',
        ok: [['st', 'ashby', 'met'], ['standing', 2], ['trust', 'ashby', 1]] },
    ] },

  { id: 'ashby.london', at: 'person', speaker: 'ashby', if: [['not', ['st', 'ashby', 'unknown']]], w: 1,
    title: 'Reporting aboard',
    text: "Ashby reads your face before your report, and your report before your expenses. 'Well?' he says. Behind him the river is the colour of a gun barrel and a tug is hooting at nothing. He has a pipe in one hand and a pencil in the other, and he will use the pencil.",
    choices: [
      { label: 'Report in full', sub: 'An hour of his questions', cost: { min: 60 },
        ok: [['standing', 1], ['trust', 'ashby', 1]] },
      { label: 'Ask for money', sub: 'He gives it like a man giving blood',
        ok: [['money', 10], ['standing', -3]] },
      { label: 'Give him port from Lisbon', sub: 'He will pretend not to be pleased', if: [['item', 'port-wine'], ['trust', 'ashby', '<', 4]],
        ok: [['item', '-port-wine'], ['trust', 'ashby', 2], ['standing', 2]] },
      { label: 'Give him Dutch cigars', sub: 'He smokes them on the quarterdeck of his desk', if: [['item', 'dutch-cigars'], ['trust', 'ashby', '<', 4]],
        ok: [['item', '-dutch-cigars'], ['trust', 'ashby', 2], ['standing', 2]] },
    ] },

  { id: 'ashby.well-done', at: 'interlude', speaker: 'ashby', if: [WON, ['standing', '>=', 50]], once: true,
    title: 'A telegram, unusually long',
    text: "A telegram, unusually long for Ashby: SATISFACTORY STOP FOREIGN OFFICE PLEASED WHICH IS RARE STOP DO NOT LET IT GO TO YOUR HEAD STOP IT IS A SMALL HEAD AND THERE IS A GREAT DEAL STILL TO DO STOP ASHBY",
    choices: [
      { label: 'Wire back for a rise', sub: 'He may think you mercenary', cost: { money: 1 },
        ok: [['money', 10], ['standing', -2], ['record', 'wire', 0.2]] },
      { label: 'Ask what the enemy knows of you', sub: 'London reads the other side’s post',
        cost: { money: 1 },
        ok: [['record', 'wire', 0.2], ['intel', { subj: 'cover:active', claim: { knows: 'photo' }, src: 'person:ashby', rel: 0.7, truth: 'auto' }]] },
      { label: 'Wire nothing', sub: 'He prefers silence to gratitude',
        ok: [['standing', 1], ['trust', 'ashby', 1]] },
    ] },

  { id: 'ashby.carpet', at: 'interlude', speaker: 'ashby', if: [FAILED], once: true,
    title: 'On the carpet, by wire',
    text: "A telegram: YOU WERE SENT TO FETCH A THING AND HAVE FETCHED EXCUSES STOP FOREIGN OFFICE ASKS WHY WE PAY YOU STOP SO DO I STOP EXPLAIN BRIEFLY STOP ASHBY. The clerk who handed it over has read it, and looks at you with a kind of sympathy.",
    choices: [
      { label: 'Wire a short apology', sub: 'He likes brevity in apologies too', cost: { money: 1 },
        ok: [['standing', 2], ['record', 'wire', 0.2]] },
      { label: "Blame the Bureau's papers", sub: 'Partly true; he may send better ones',
        roll: { p: 0.4 },
        ok: [['papers', 'active', 0.2], ['standing', 1]],
        fail: [['standing', -4], ['trust', 'ashby', -1]] },
      { label: 'Offer to work the month unpaid', sub: '£10 of your own, and his respect', cost: { money: 10 },
        ok: [['standing', 5], ['trust', 'ashby', 1]] },
    ] },

  { id: 'ashby.bag', at: 'interlude', speaker: 'ashby', if: [['standing', '>=', 60], ['not', ['item', 'diplomatic-bag']], ['not', ['flag', 'ashby-bag']]], once: true,
    title: "A King's Messenger calls",
    text: "A King's Messenger in a bowler hat calls with a canvas bag sealed in red, and a note: 'The bag. One errand. Customs may not open it; you may not lose it. Return it when asked. If it is lost I shall see you hanged at Portsmouth, and I shall not hurry the knot. A.'",
    choices: [
      { label: 'Sign for the bag', sub: 'An unsearchable case, for a while',
        ok: [['item', '+diplomatic-bag'], ['flag', 'ashby-bag'], ['later', 120, 'ashby.bag-due']] },
      { label: 'Send it back with thanks', sub: 'You travel lighter, and he notices',
        ok: [['flag', 'ashby-bag'], ['standing', 2], ['trust', 'ashby', 1]] },
    ] },

  { id: 'ashby.bag-due', at: 'then', speaker: 'ashby', if: [['item', 'diplomatic-bag']], once: true,
    title: 'BAG REQUIRED',
    text: "A telegram, as brief as a blow: BAG REQUIRED STOP MESSENGER CALLS TOMORROW STOP DO NOT BE OUT STOP ASHBY. Somewhere in London a Foreign Office clerk has noticed a bag missing from a ledger, and Ashby is being asked about it in words of one syllable.",
    choices: [
      { label: 'Hand it to the Messenger', sub: 'Promptly; he will note the promptness',
        ok: [['item', '-diplomatic-bag'], ['standing', 2]] },
      { label: 'Keep it a little longer', sub: 'He will note that too',
        ok: [['standing', -6], ['trust', 'ashby', -1]] },
    ] },

  { id: 'ashby.sold', at: 'interlude', speaker: 'ashby', if: [SOLD], once: true,
    title: 'Ashby hears what you sold',
    text: "A letter from Ashby, which is worse than a telegram, because he had time to think. 'I hear one of our friends is in a cell and you are in funds. I do not run a charity. Neither do I run a market. Agents who sell their friends are sold in their turn. Explain. A.'",
    choices: [
      { label: 'It was them or the operation', sub: 'He may accept it; he may not',
        roll: { p: 0.5, mods: [[['standing', '>=', 60], 0.15]] },
        ok: [['standing', 1]],
        fail: [['standing', -5], ['trust', 'ashby', -1]] },
      { label: 'Send him the money', sub: 'Every pound of it, for the prisoner’s family',
        cost: { money: 10 },
        ok: [['standing', 3], ['trust', 'ashby', 1]] },
      { label: 'Do not answer', sub: 'Silence is also an answer',
        ok: [['standing', -3]] },
    ] },

  { id: 'ashby.network', at: 'interlude', speaker: 'ashby', if: [RECRUITED, ['standing', '>=', 40]], once: true,
    title: 'Keep them warm',
    text: "A telegram: UNDERSTAND YOU HAVE A NEW FRIEND STOP GOOD STOP KEEP THEM WARM BUT NOT TOO WARM STOP FRIENDS WHO ARE PAID TOO MUCH SELL TO THE HIGHER BIDDER STOP THE OTHER SIDE BIDS HIGHER STOP ASHBY",
    choices: [
      { label: "Ask London to pay their retainer", sub: 'He will pay, and audit', cost: { money: 1 },
        ok: [['money', 10], ['standing', -1], ['record', 'wire', 0.2]] },
      { label: 'Wire nothing', sub: 'He will take it as competence',
        ok: [['standing', 1]] },
    ] },

  { id: 'ashby.promise', at: 'interlude', speaker: 'ashby', if: [['op', 'op-student'], ['flag', 'jovan-promise']], once: true,
    title: 'You promised the boy',
    text: "A telegram: UNDERSTAND YOU PROMISED THE MARIC BOY HIS PASSAGE STOP I DID NOT STOP THE BUREAU DOES NOT MAKE PROMISES STOP KEEP IT ANYWAY STOP TWENTY POUNDS AT THE LEGATION STOP DO NOT THANK ME STOP ASHBY",
    choices: [
      { label: 'Draw the twenty pounds', sub: 'For the boy, and his passage',
        ok: [['money', 20], ['trust', 'jovan', 1], ['record', 'register', 0.2]] },
      { label: 'Tell him you can manage', sub: 'He will think better of you, and worse of your sums',
        ok: [['standing', 2], ['trust', 'ashby', 1]] },
    ] },

  { id: 'ashby.grete', at: 'interlude', speaker: 'ashby', if: [['op', 'op-typist'], ['flag', 'sauer-grete']], once: true,
    title: 'One typist, not four',
    text: "A telegram: BUREAU PAYS FOR ONE TYPIST STOP NOT A TYPIST A SISTER AND TWO CHILDREN STOP FRONTIERS CLOSING STOP EVERY EXTRA PASSENGER IS A QUESTION AT A BARRIER STOP YOUR DECISION STOP YOUR RISK STOP ASHBY",
    choices: [
      { label: "Pay for Grete's family yourself", sub: '£10 of your own, and the risk', cost: { money: 10 },
        ok: [['trust', 'sauer', 1], ['nerve', -1]] },
      { label: 'Bill it to the Bureau anyway', sub: 'He will see it in the accounts',
        ok: [['standing', -3], ['trust', 'sauer', 1]] },
      { label: 'Tell Sauer the Bureau said no', sub: 'True; she will hear only the no',
        ok: [['trust', 'sauer', -2], ['standing', 1]] },
    ] },

  { id: 'ashby.paris', at: 'city', speaker: 'ashby', if: [['act', 3], ['not', ['st', 'ashby', 'unknown']]], once: true,
    title: 'Ashby at the Gare du Nord',
    text: "Ashby is on the platform at the Gare du Nord in a civilian coat that fools nobody, watching the reservists entrain. 'Every Englishman in France wants to go home tonight,' he says, 'and every one of them wants my help. You may have some. Briefly.'",
    choices: [
      { label: 'Take Embassy papers for the boat', sub: 'Better papers, and his signature on them',
        ok: [['papers', 'active', 0.3], ['standing', -1]] },
      { label: 'Report to him here, in person', sub: 'An hour on a platform, in the open', cost: { min: 60 },
        ok: [['standing', 3], ['record', 'meeting', 0.3]] },
      { label: 'Ask what London knows of your covers', sub: 'He reads their files as they read ours',
        ok: [['intel', { subj: 'cover:active', claim: { knows: 'name' }, src: 'person:ashby', rel: 0.8, truth: 'auto' }], ['trust', 'ashby', -1]] },
    ] },
];
