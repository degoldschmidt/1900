// Amber for Berlin (owner: Ops). Side op, started by Kowal (People) in Berlin with ['op', 'op-amber', 'start'].
// See docs/CONTRACTS.md §6. One journey: Warsaw and back across the Russian frontier, which closes on 31 July.
// The parcel is amber, and under the amber the plans of the Novogeorgievsk forts, sold to IIIb.

export default {
  id: 'op-amber', act: 2, issue: null, giver: 'kowal', side: true,
  title: 'Amber for Berlin',
  brief: "Kowal's parcel waits in Warsaw: amber, he says, for a jeweller in the Friedrichstrasse who pays in gold and asks no questions of the Russian customs. 'Fetch it to Berlin and you keep a fifth. Do not open it. It is only amber.'",
  steps: [
    { id: 'parcel', kind: 'act', city: 'WAR', venue: 'venue:market', gives: 'amber', label: 'Collect the parcel in Warsaw',
      ways: [
        { id: 'asis', label: 'Take it as it is', sub: "A smuggler's trust is a currency too",
          risk: 0, rec: ['meeting', 0.2], ok: [['trust', 'kowal', 1]] },
        { id: 'open', label: 'Open it in the cab', sub: 'He tied the string a particular way',
          risk: 0.3, rec: null, story: 'op-amber.open' },
        { id: 'seams', label: "Feel the seams at a jeweller's", sub: '£1; amber is light, and this is not',
          tag: 'topic:trade', cost: { money: 1 }, risk: 0.1, rec: ['meeting', 0.2],
          ok: [['intel', { subj: 'op:op-amber', claim: { note: 'The parcel has a false bottom, and something flat and stiff inside it.' }, src: 'seen', rel: 0.8, truth: true }]] },
      ] },
    { id: 'deliver', kind: 'carry', item: 'amber', to: 'BER', label: 'Carry it back to Berlin' },
    { id: 'handover', kind: 'act', city: 'BER', venue: 'venue:cafe', label: 'Hand it to the jeweller',
      ways: [
        { id: 'asis', label: 'Hand it over as agreed', sub: 'Gold, and no questions either way',
          risk: 0.1, rec: ['meeting', 0.3], ok: [['item', '-amber'], ['money', 12]] },
        { id: 'keep', label: 'Keep what was hidden in it', sub: 'London gets the forts; Kowal gets amber',
          if: [['flag', 'op-amber-opened']], risk: 0.2, rec: ['meeting', 0.4],
          ok: [['item', '-amber'], ['standing', 5], ['trust', 'kowal', -2],
            ['debrief', 'You kept the Novogeorgievsk plans for London and gave the jeweller only amber.']] },
        { id: 'follow', label: 'Watch who collects it', sub: 'From across the street, through glasses',
          if: [['item', 'field-glasses']], risk: 0.15, rec: ['sighting', 0.3],
          ok: [['item', '-amber'], ['money', 12], ['intel', { subj: 'hunter:falk', claim: { at: 'BER' }, src: 'seen', rel: 0.8, truth: 'auto' }]] },
      ] },
  ],
  twists: [
    { if: [['op', 'op-amber', 'parcel'], ['not', ['op', 'op-amber', 'deliver']], ['item', 'amber'], ['mode', 'rail']], story: 'op-amber.customs' },
  ],
  win: [['trust', 'kowal', 2], ['money', 8]],
  fail: [['trust', 'kowal', -2]],
  debrief: 'Kowal sold to whoever paid, and IIIb paid best: the plans of the Novogeorgievsk forts went to Berlin by way of a Friedrichstrasse jeweller who kept the amber for his trouble. Kowal never asked what you had done with the parcel. Smugglers do not ask. They remember.',
};
