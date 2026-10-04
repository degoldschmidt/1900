// Storylets of op-amber, Amber for Berlin (owner: Ops). See docs/CONTRACTS.md §5.

const collected = ['op', 'op-amber', 'step:parcel'];
const ROAD = ['later', 1, 'op-amber.customs'];

export default [
  { id: 'op-amber.open', at: 'op',
    title: 'Not only amber',
    text: 'Under the amber are the letters Kowal admits to, in Polish, for a printer. Under the letters is a flat packet of tracing linen: the forts of Novogeorgievsk, gun by gun, signed by a Russian engineer captain. Kowal is not smuggling amber. He is selling a fortress to the Germans, and you are the mule.',
    choices: [
      { label: 'Take the plans for London', sub: 'Kowal will know soon enough',
        ok: [collected, ROAD, ['flag', 'op-amber-opened'], ['standing', 3], ['trust', 'kowal', -1]] },
      { label: 'Retie it exactly as it was', sub: "Kowal's knots are particular",
        roll: { p: 0.6, mods: [[['skill', 'tradecraft', '>=', 2], 0.2]] },
        ok: [collected, ROAD, ['flag', 'op-amber-opened']], fail: [collected, ROAD, ['flag', 'op-amber-opened'], ['trust', 'kowal', -2]] },
      { label: 'Throw it in the Vistula', sub: 'Nobody gets the fortress',
        ok: [['op', 'op-amber', 'fail'], ['trust', 'kowal', -3], ['standing', 2], ['debrief', "You threw Kowal's fortress into the Vistula."]] },
    ] },

  { id: 'op-amber.customs', at: 'then', if: [['item', 'amber'], ['mode', 'rail'], ['nation', 'RU'], ['not', ['kind', 'path']]],
    title: 'Customs at Alexandrowo',
    text: 'At Alexandrowo the Russian customs open everything going west: hampers, hatboxes, a coffin. A gendarme with a sabre stands behind the inspector. Amber is dutiable; a plan of a Russian fortress is a rope. The inspector reaches for your parcel and weighs it in his hand.',
    choices: [
      { label: 'Declare amber and pay the duty', sub: '£3, and a customs receipt with your name', cost: { money: 3 },
        roll: { p: 0.7, mods: [[['not', ['flag', 'op-amber-opened']], 0.1]] },
        ok: [['record', 'frontier', 0.5]], fail: [['item', '-amber'], ['record', 'frontier', 1], ['susp', 'active', 0.3], ['op', 'op-amber', 'fail']] },
      { label: 'Trust the valise lining', sub: 'One forbidden thing under your shirts', if: [['item', 'lined-valise']],
        roll: { p: 0.85 }, ok: [['nerve', -1]], fail: [['item', '-amber'], ['record', 'frontier', 1], ['op', 'op-amber', 'fail']] },
      { label: 'Talk to him in Polish', sub: 'A countryman, and a little money', if: [['skill', 'slavic', '>=', 1]], cost: { money: 1 },
        roll: { p: 0.65, mods: [[['skill', 'slavic', '>=', 2], 0.15]] },
        ok: [['record', 'bribe', 0.3]], fail: [['record', 'bribe', 0.9], ['delay', 240]] },
    ] },
];
