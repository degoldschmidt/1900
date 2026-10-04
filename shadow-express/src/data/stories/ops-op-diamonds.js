// Storylets of op-diamonds, Stones for Petersburg (owner: Ops). See docs/CONTRACTS.md §5.

const buy = ['op', 'op-diamonds', 'step:buy'];
const amslerSold = (src, rel) => ['intel', { subj: 'person:amsler', claim: { loyal: 'enemy' }, src, rel, truth: 'auto' }];

export default [
  // ---------- way ----------
  { id: 'op-diamonds.dealer', at: 'op',
    title: 'A dealer in the Jodenbreestraat',
    text: "Mijnheer Cardozo's shop is one room with a north light and a scale under a glass bell. He tips a dozen rough stones onto black velvet. 'Brazil and the Cape,' he says. 'Sixty carats, all honest.' Some are greasy grey pebbles; some glint like ice. Rough stones, as everyone knows, are easily salted with good glass.",
    choices: [
      { label: 'Test each one under a loupe', sub: "An optician's eye, and an hour", cost: { min: 60 },
        if: [['aff', 'topic:technical', '>=', 1]],
        ok: [buy, ['money', 3], ['debrief', 'You caught Cardozo salting the parcel with glass; he knocked three pounds off the price.']] },
      { label: 'Haggle like a merchant', sub: 'Cheaper, if you know the trade',
        roll: { p: 0.5, mods: [[['aff', 'topic:trade', '>=', 1], 0.25]] },
        ok: [buy, ['money', 5]], fail: [buy, ['flag', 'op-diamonds-paste']] },
      { label: 'Pay his price and trust him', sub: 'He has an honest face; they all do',
        roll: { p: 0.5 },
        ok: [buy], fail: [buy, ['flag', 'op-diamonds-paste']] },
    ] },

  // ---------- twists ----------
  { id: 'op-diamonds.paste', at: 'op',
    title: 'Glass among the stones',
    text: "In the hotel lamplight two of the stones are too clear, too clean, too eager to sparkle. Glass. The colonel will see it at once; he is said to be a jeweller's son. You have a day, a purse, and the dealers of the Gostiny Dvor, who are no more honest than Amsterdam's.",
    choices: [
      { label: 'Buy two true stones here', sub: '£12, and no receipt', cost: { money: 12 },
        ok: [['unflag', 'op-diamonds-paste'], ['record', 'meeting', 0.2]] },
      { label: 'Hand them over and say nothing', sub: 'He may not look closely',
        ok: [['unflag', 'op-diamonds-paste'], ['standing', -5], ['debrief', 'Two of your stones were Amsterdam glass. The colonel noticed, and London heard.']] },
      { label: 'Confess it to the colonel', sub: 'Honesty, of a kind',
        ok: [['unflag', 'op-diamonds-paste'], ['standing', -2], ['debrief', 'You admitted the glass. The colonel liked your honesty better than your stones.']] },
    ] },

  { id: 'op-diamonds.tip', at: 'op',
    title: 'A porter with a warning',
    text: "A porter carries your case further than he needs to and lowers his voice. 'The Russians at the frontier have been told about a traveller with stones,' he murmurs. 'For a mark more I will tell you which train they are watching.' He has the honest, anxious face of a man who has said this many times before.",
    choices: [
      { label: 'Pay him the mark', sub: 'A shilling for a secret', cost: { money: 1 },
        ok: [['intel', { subj: 'frontier:EYD', claim: { note: 'Russian customs at Eydtkuhnen are said to be watching the Nord Express for stones.' }, src: 'porter', rel: 0.4, truth: false }]] },
      { label: 'Lose a day and change your route', sub: 'Safer, if he is honest', cost: { min: 720 },
        ok: [['nerve', 1]] },
      { label: 'Laugh and tip him nothing', sub: 'He will remember the laugh',
        ok: [['record', 'sighting', 0.2]] },
    ] },

  { id: 'op-diamonds.tipped', at: 'op',
    title: 'Ashby wires a warning',
    text: "A telegram at the hotel desk, in the Bureau's commercial code: RUSSIAN CUSTOMS TOLD TO EXPECT STONES ON YOUR TRAIN STOP SOURCE IN ZURICH STOP TAKE CARE. Only one man in Zurich knew which train you meant to take, because his correspondent booked it for you.",
    choices: [
      { label: 'Sew the stones into the lining', sub: 'The valise was made for this', if: [['item', 'lined-valise']],
        ok: [['flag', 'op-diamonds-hidden'], amslerSold('bureau', 0.6)] },
      { label: 'Send them on in the bag', sub: 'Nobody opens the King\'s mail', if: [['item', 'diplomatic-bag']],
        ok: [['flag', 'op-diamonds-hidden'], amslerSold('bureau', 0.6)] },
      { label: 'Swallow the smallest stones', sub: 'A day lost to nature, and all dignity', cost: { min: 720 },
        ok: [['flag', 'op-diamonds-hidden'], ['nerve', -2], amslerSold('bureau', 0.6)] },
      { label: 'Trust to luck and your face', sub: 'Customs men are often lazy',
        ok: [['nerve', -1], amslerSold('bureau', 0.6)] },
    ] },

  { id: 'op-diamonds.search', at: 'op',
    title: 'The customs knew',
    text: 'Two Russian customs officers and a gendarme in a white tunic are waiting, and they search nobody else. They unpack your case shirt by shirt, slit the lining of your hat and feel the seams of your coat with practised fingers. The senior one smiles. Somebody has told them exactly what to look for.',
    choices: [
      { label: 'Offer the senior one a gift', sub: '£15 in roubles, folded small', cost: { money: 15 },
        roll: { p: 0.55 },
        ok: [['record', 'bribe', 0.6]],
        fail: [['item', '-diamonds'], ['record', 'bribe', 1], amslerSold('seen', 0.7)] },
      { label: 'Protest loudly, in French', sub: 'Officials fear a scene with a foreign newspaper',
        roll: { p: 0.3, mods: [[['aff', 'topic:diplomatic', '>=', 1], 0.2]] },
        ok: [['record', 'frontier', 0.6]],
        fail: [['item', '-diamonds'], ['record', 'frontier', 1], amslerSold('seen', 0.7)] },
      { label: 'Let them find the stones', sub: 'Lose them, but keep your liberty',
        ok: [['item', '-diamonds'], ['record', 'frontier', 0.8], amslerSold('seen', 0.7),
          ['debrief', 'The Russian customs took the stones, exactly as somebody in Zurich had arranged.']] },
    ] },
];
