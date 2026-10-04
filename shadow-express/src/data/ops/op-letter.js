// Odile's Letter (owner: Ops). Side op, started by Odile (People) with ['op', 'op-letter', 'start'].
// See docs/CONTRACTS.md §6. It is a love letter; it is also a warning, in the only code the lovers share.

export default {
  id: 'op-letter', act: 1, issue: null, giver: 'odile', side: true,
  title: "Odile's Letter",
  brief: "A letter in lilac paper, sealed with green wax, for Captain Lemaire of the Guides at Brussels. 'It is only a love letter,' Odile says, 'so do not read it.' She is a poor liar, or a very good one.",
  steps: [
    { id: 'open', kind: 'act', city: '*', venue: 'venue:hotel', label: 'Decide what to do with the letter',
      ways: [
        { id: 'sealed', label: 'Carry it as it is', sub: 'Odile trusts you; so, oddly, do you',
          risk: 0, rec: null, ok: [['trust', 'odile', 1]] },
        { id: 'steam', label: 'Steam it open over a kettle', sub: 'An hour; green wax is hard to reseal',
          cost: { min: 60 }, risk: 0.3, rec: null, story: 'op-letter.steam' },
        { id: 'camera', label: 'Photograph it, then reseal it', sub: "For Ashby's codebreakers",
          if: [['item', 'vest-camera']], risk: 0.2, rec: null, story: 'op-letter.steam' },
      ] },
    { id: 'deliver', kind: 'act', city: 'BRU', venue: 'venue:cafe', label: "Put it in Lemaire's hands",
      ways: [
        { id: 'barracks', label: "Ask for him at the Guides' barracks", sub: "A visitors' book, and a sentry's memory",
          tag: 'venue:barracks', if: [['aff', 'venue:barracks', '>=', 0]], risk: 0.2, rec: ['register', 0.5], story: 'op-letter.lemaire' },
        { id: 'church', label: 'Wait for him after Mass', sub: 'Sainte-Gudule, a long morning, a public place',
          tag: 'venue:church', cost: { min: 240 }, risk: 0.1, rec: ['sighting', 0.2], story: 'op-letter.lemaire' },
        { id: 'batman', label: 'Through his batman', sub: '£2; not quite what Odile asked',
          cost: { money: 2 }, risk: 0.25, rec: ['bribe', 0.4], ok: [['trust', 'odile', -1]] },
      ] },
  ],
  twists: [
    // in the morning the captain is at the barracks, and his wife answers the door
    { if: [['op', 'op-letter', 'open'], ['not', ['op', 'op-letter', 'deliver']], ['city', 'BRU'], ['clock', '09.00', '12.00']], story: 'op-letter.wife' },
  ],
  win: [['trust', 'odile', 2], ['standing', 2]],
  fail: [['trust', 'odile', -2]],
  debrief: 'It was a love letter. It was also a warning, in the only code Odile and Lemaire shared: the French staff would not enter Belgium first, and Liège would stand alone. Lemaire\'s battery held the forts east of the Meuse for eleven days in August. Odile never asked whether you had read it.',
};
