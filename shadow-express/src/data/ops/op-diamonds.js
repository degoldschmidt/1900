// Stones for Petersburg (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// Optional: the one long journey of Act I, away from the Vienna post. Win grants the Vészy cover.
// Taking it costs Vienna time (op-optics). The stones must be in Petersburg by the 11th, so that the 12 July
// Warsaw mail still brings you to the Belgrade post (op-mole) at 06.30 on the 15th; the telegram says so.
// The carry hands the stones over on arrival; journey scenes are `later` continuations armed when you buy.

const ROAD = [['later', 3, 'op-diamonds.tip'], ['later', 6, 'op-diamonds.nord']];

export default {
  id: 'op-diamonds', act: 1, issue: '07-04 09.00', giver: 'handler', optional: true,
  title: 'Stones for Petersburg',
  brief: 'IF VIENNA CAN SPARE YOU STOP BUREAU FUNDS AT TWENTSCHE BANK AMSTERDAM FROM SIXTH STOP BUY UNCUT STONES BY EIGHTH STOP CARRY THEM TO PETERSBURG BY ELEVENTH STOP OUR FRIEND WAITS AT THE ANGLETERRE STOP RUSSIAN CUSTOMS SEARCH FOR STONES STOP YOUR NEXT POST IS BELGRADE ON FIFTEENTH STOP PAYMENT IS A NEW NAME ASHBY',
  steps: [
    { id: 'buy', kind: 'act', city: 'AMS', venue: 'venue:market', after: '07-06 09.00', by: '07-08 18.00', gives: 'diamonds',
      label: 'Buy the stones in Amsterdam',
      ways: [
        { id: 'bourse', label: 'Buy on the diamond bourse', sub: "Bureau money, and a members' book to sign",
          tag: 'topic:trade', if: [['aff', 'topic:trade', '>=', 1]], risk: 0.1, rec: ['register', 0.5],
          ok: [...ROAD, ['debrief', 'You bought the stones on the bourse, and signed for them in your cover name.']] },
        { id: 'dealer', label: 'A dealer in the Jodenbreestraat', sub: '£4 commission, and honesty not guaranteed',
          cost: { money: 4 }, risk: 0.2, rec: ['meeting', 0.3], story: 'op-diamonds.dealer' },
        { id: 'amsler', label: "Through Amsler's Amsterdam correspondent", sub: 'Quick and quiet; Amsler will know your route',
          if: [['st', 'amsler', 'recruited']], risk: 0.05, rec: null,
          ok: [...ROAD, ['later', 3, 'op-diamonds.tipped'], ['later', 10, 'op-diamonds.search']] },
        { id: 'docks', label: 'Buy from a smuggler on the docks', sub: '£8 cheaper, unsigned, and possibly stolen',
          tag: 'venue:docks', risk: 0.3, rec: ['sighting', 0.4], ok: [...ROAD, ['money', 8]], fail: [['nerve', -2], ['susp', 'active', 0.1]] },
      ] },
    { id: 'carry', kind: 'carry', item: 'diamonds', to: 'SPB', by: '07-11 12.00', label: 'Carry the stones to Petersburg by the eleventh' },
    { id: 'deliver', kind: 'act', city: 'SPB', venue: 'venue:hotel', by: '07-11 20.00', label: 'Hand them to the colonel',
      ways: [
        { id: 'angleterre', label: 'Room fourteen at the Angleterre', sub: 'As agreed; the hall porter reports to the Okhrana',
          risk: 0.15, rec: ['meeting', 0.5], ok: [['nerve', 1]], fail: [['susp', 'active', 0.1], ['nerve', -1]] },
        { id: 'opera', label: 'In a box at Pavlovsk', sub: 'The summer concerts at the Vauxhall; music covers talk',
          tag: 'venue:opera', if: [['aff', 'venue:opera', '>=', 1]], risk: 0.05, rec: ['sighting', 0.2], ok: [['legend', 0.1]] },
        { id: 'church', label: "A pew at St Isaac's after vespers", sub: 'A candle, a prayer book, a parcel left behind',
          tag: 'venue:church', cost: { min: 180 }, risk: 0.1, rec: ['sighting', 0.2], ok: [['watch', -0.1]] },
        { id: 'kowal', label: "Through Kowal's cousin in the Haymarket", sub: 'Smugglers deliver; they also remember',
          if: [['st', 'kowal', 'recruited']], risk: 0.1, rec: null, ok: [['trust', 'kowal', 1]] },
      ] },
  ],
  twists: [
    { if: [['op', 'op-diamonds', 'carry'], ['not', ['op', 'op-diamonds', 'deliver']], ['flag', 'op-diamonds-paste']], story: 'op-diamonds.paste' },
  ],
  win: [['standing', 10], ['money', 10], ['cover', '+vessey']],
  fail: [['standing', -10]],
  debrief: "The stones paid a colonel of the Russian General Staff who preferred carats to cheques; he sold London the dates of Russia's trial mobilisation. His office also paid in kind: the passports of the Vészys, a childless Hungarian couple dead of typhus in a Petersburg clinic in May. The Almanach de Gotha still lists them alive.",
};
