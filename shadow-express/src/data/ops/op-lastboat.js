// The Last Boat (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// One step and one journey: London before the British ultimatum expires (4 August, 23.00 London, midnight CET).
// The calendar takes the Calais, Ostend and Hook boats off at 15.00 on the 4th; Flushing and luck remain.

export default {
  id: 'op-lastboat', act: 3, issue: '08-02 09.00', giver: 'handler',
  title: 'The Last Boat',
  brief: 'COME HOME STOP WAR WITH GERMANY LIKELY WITHIN DAYS STOP ADMIRALTY TAKING THE CHANNEL BOATS STOP BE IN LONDON BY TUESDAY NIGHT WITH WHATEVER PAPERS YOU HOLD STOP AFTER THAT YOU ARE ON YOUR OWN ASHBY',
  steps: [
    { id: 'home', kind: 'goto', city: 'LON', by: '08-05 00.00', label: 'London by Tuesday night', story: 'op-lastboat.home' },
  ],
  twists: [
    { if: [['op', 'op-lastboat'], ['not', ['op', 'op-lastboat', 'home']], ['any', ['city', 'FLU'], ['city', 'AMS']]], story: 'op-lastboat.quay' },
    { if: [['op', 'op-lastboat'], ['not', ['op', 'op-lastboat', 'home']], ['cover', 'vessey']], story: 'op-lastboat.alien' },
    { if: [['op', 'op-lastboat'], ['not', ['op', 'op-lastboat', 'home']], ['any', ['city', 'BEG'], ['city', 'BUD']], ['war', 'AH', 'RS']],
      story: 'op-lastboat.semlin' },
    { if: [['op', 'op-lastboat'], ['not', ['op', 'op-lastboat', 'home']], ['mode', 'rail'], ['chance', 0.4]], story: 'op-lastboat.siding' },
  ],
  win: [['standing', 10], ['nerve', 3]],
  fail: [['standing', -10], ['nerve', -2]],
  debrief: "At eleven o'clock on the night of the fourth, Big Ben struck and Britain was at war with Germany. Within the week the Kaiser's agents in London were rounded up, and the Bureau's own people abroad went silent one by one. Those who were home by that hour worked again. Those who were not wrote, when they could, from internment.",
};
