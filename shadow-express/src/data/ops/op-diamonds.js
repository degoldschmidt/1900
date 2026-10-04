// Stones for Petersburg (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// Optional: the one long journey of Act I, away from the Vienna post. Win grants the Vészy cover.
// Taking it costs Vienna time (op-optics) and makes the run to the Belgrade post (op-mole, 15 July) tight.

export default {
  id: 'op-diamonds', act: 1, issue: '07-04 09.00', giver: 'handler', optional: true,
  title: 'Stones for Petersburg',
  brief: 'IF VIENNA CAN SPARE YOU STOP BUREAU FUNDS AT TWENTSCHE BANK AMSTERDAM FROM SIXTH STOP BUY UNCUT STONES STOP CARRY THEM TO PETERSBURG BY FIFTEENTH STOP OUR FRIEND WAITS AT THE ANGLETERRE STOP RUSSIAN CUSTOMS SEARCH FOR STONES STOP PAYMENT IS A NEW NAME FOR YOU ASHBY',
  steps: [
    { id: 'buy', kind: 'act', city: 'AMS', venue: 'venue:market', after: '07-06 09.00', by: '07-11 18.00', gives: 'diamonds',
      label: 'Buy the stones in Amsterdam',
      ways: [
        { id: 'bourse', label: 'Buy on the diamond bourse', sub: "Bureau money, and a members' book to sign",
          tag: 'topic:trade', if: [['aff', 'topic:trade', '>=', 1]], risk: 0.1, rec: ['register', 0.5],
          ok: [['debrief', 'You bought the stones on the bourse, and signed for them in your cover name.']] },
        { id: 'dealer', label: 'A dealer in the Jodenbreestraat', sub: '£4 commission, and honesty not guaranteed',
          cost: { money: 4 }, risk: 0.2, rec: ['meeting', 0.3], story: 'op-diamonds.dealer' },
        { id: 'amsler', label: "Through Amsler's Amsterdam correspondent", sub: 'Quick and quiet; Amsler will know your route',
          if: [['st', 'amsler', 'recruited']], risk: 0.05, rec: null, ok: [['flag', 'op-diamonds-amsler']] },
        { id: 'docks', label: 'Buy from a smuggler on the docks', sub: '£8 cheaper, unsigned, and possibly stolen',
          tag: 'venue:docks', risk: 0.3, rec: ['sighting', 0.4], ok: [['money', 8]], fail: [['nerve', -2], ['susp', 'active', 0.1]] },
      ] },
    { id: 'carry', kind: 'carry', item: 'diamonds', to: 'SPB', by: '07-15 12.00', label: 'Carry the stones to Petersburg by the fifteenth' },
    { id: 'deliver', kind: 'act', city: 'SPB', venue: 'venue:hotel', by: '07-15 20.00', label: 'Hand them to the colonel',
      ways: [
        { id: 'angleterre', label: 'Room fourteen at the Angleterre', sub: 'As agreed; the hall porter reports to the Okhrana',
          if: [['item', 'diamonds']], risk: 0.15, rec: ['meeting', 0.5], ok: [['item', '-diamonds']], fail: [['susp', 'active', 0.1], ['nerve', -1]] },
        { id: 'opera', label: 'In a box at the Mariinsky', sub: 'Between the acts, under cover of the music',
          tag: 'venue:opera', if: [['item', 'diamonds'], ['aff', 'venue:opera', '>=', 1]], risk: 0.05, rec: ['sighting', 0.2], ok: [['item', '-diamonds']] },
        { id: 'church', label: "A pew at St Isaac's after vespers", sub: 'A candle, a prayer book, a parcel left behind',
          tag: 'venue:church', if: [['item', 'diamonds']], cost: { min: 180 }, risk: 0.1, rec: ['sighting', 0.2], ok: [['item', '-diamonds']] },
        { id: 'kowal', label: "Through Kowal's cousin in the Haymarket", sub: 'Smugglers deliver; they also remember',
          if: [['item', 'diamonds'], ['st', 'kowal', 'recruited']], risk: 0.1, rec: null, ok: [['item', '-diamonds'], ['trust', 'kowal', 1]] },
      ] },
  ],
  twists: [
    { if: [['op', 'op-diamonds', 'carry'], ['not', ['op', 'op-diamonds', 'deliver']], ['flag', 'op-diamonds-paste']], story: 'op-diamonds.paste' },
    { if: [['op', 'op-diamonds', 'buy'], ['not', ['op', 'op-diamonds', 'carry']], ['nation', 'DE'], ['chance', 0.3]], story: 'op-diamonds.tip' },
    { if: [['op', 'op-diamonds', 'buy'], ['not', ['op', 'op-diamonds', 'carry']], ['nation', 'DE'],
      ['flag', 'op-diamonds-amsler'], ['loyal', 'amsler', 'enemy:orlova']], story: 'op-diamonds.tipped' },
    { if: [['op', 'op-diamonds', 'buy'], ['not', ['op', 'op-diamonds', 'deliver']], ['nation', 'RU'], ['item', 'diamonds'],
      ['flag', 'op-diamonds-amsler'], ['loyal', 'amsler', 'enemy:orlova'], ['not', ['flag', 'op-diamonds-hidden']]], story: 'op-diamonds.search' },
    { if: [['op', 'op-diamonds', 'buy'], ['not', ['op', 'op-diamonds', 'carry']], ['mode', 'rail'], ['item', 'diamonds'], ['chance', 0.4]],
      story: 'op-diamonds.nord' },
  ],
  win: [['standing', 10], ['money', 10], ['cover', '+vessey']],
  fail: [['standing', -10]],
  debrief: "The stones paid a colonel of the Russian General Staff who preferred carats to cheques; he sold London the dates of Russia's trial mobilisation. His office also paid in kind: the passports of the Vészys, a childless Hungarian couple dead of typhus in a Petersburg clinic in May. The Almanach de Gotha still lists them alive.",
};
