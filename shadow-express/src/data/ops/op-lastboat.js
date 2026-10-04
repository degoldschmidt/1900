// The Last Boat (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// The run home: settle up wherever the telegram finds you, then London before the British ultimatum expires
// (4 August, 23.00 London, midnight CET). Arriving ends the campaign, so every scene of the run comes before it:
// the Vészy passport at the consul's (a twist), and the troop-train siding, the last sailing and the Semlin bridge
// as `later` continuations armed by the way you set out. The calendar takes the Calais, Ostend and Hook boats off
// at 15.00 on the 4th; Flushing and luck remain.

const RUN = [['later', 0.5, 'op-lastboat.semlin'], ['later', 1, 'op-lastboat.siding'], ['later', 12, 'op-lastboat.quay']];

export default {
  id: 'op-lastboat', act: 3, issue: '08-02 09.00', giver: 'handler',
  title: 'The Last Boat',
  brief: 'COME HOME STOP WAR WITH GERMANY LIKELY WITHIN DAYS STOP ADMIRALTY TAKING THE CHANNEL BOATS STOP BE IN LONDON BY TUESDAY NIGHT WITH WHATEVER PAPERS YOU HOLD STOP AFTER THAT YOU ARE ON YOUR OWN ASHBY',
  steps: [
    { id: 'ready', kind: 'act', city: '*', venue: 'venue:station', label: 'Settle up and make for the coast',
      ways: [
        { id: 'consul', label: "Put your name on the consul's list", sub: 'British subjects first; a list the police may read',
          tag: 'venue:embassy', risk: 0.1, rec: ['list', 0.5], ok: [['flag', 'op-lastboat-listed'], ...RUN] },
        { id: 'bradshaw', label: 'Plan the run from your Bradshaw', sub: "The clerk's pencil marks every frontier that may shut",
          if: [['item', 'bradshaw']], risk: 0, rec: null,
          ok: [['intel', { subj: 'frontier:EMM', claim: { closed: ['08-04 18.00', null] }, src: 'guide', rel: 0.6, truth: 'auto' }], ['min', 30], ...RUN] },
        { id: 'ashby', label: 'Wire Ashby for a berth', sub: '£2; he will hold one, and remember it', cost: { money: 2 },
          risk: 0.1, rec: ['wire', 0.5], ok: [['flag', 'op-lastboat-berth'], ['standing', -2], ...RUN] },
        { id: 'now', label: 'Go now, with what you carry', sub: 'No arrangements; nothing to trace',
          risk: 0, rec: null, ok: [['nerve', -1], ...RUN] },
      ] },
    { id: 'home', kind: 'goto', city: 'LON', by: '08-05 00.00', label: 'London by Tuesday night' },
  ],
  twists: [
    // before you set out: a Hungarian passport in the week Britain goes to war
    { if: [['op', 'op-lastboat'], ['not', ['op', 'op-lastboat', 'ready']], ['cover', 'vessey'], ['not', ['city', 'LON']]], story: 'op-lastboat.alien' },
  ],
  win: [['standing', 10], ['nerve', 3]],
  fail: [['standing', -10], ['nerve', -2]],
  debrief: "At eleven o'clock on the night of the fourth, Big Ben struck and Britain was at war with Germany. Whitehall was full of people who did not know why they had come. Within the week the Kaiser's agents in London were rounded up, and the Bureau's own people abroad went silent one by one. Those who were home by that hour worked again. Those who were not wrote, when they could, from internment.",
};
