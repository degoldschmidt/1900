// The Mole (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// Each suspect hears a different false meeting place for the Bureau courier on the 17th:
// Brandl → Trieste, Ilić → Budapest, Amsler → Munich. Exactly one of them is the enemy each campaign;
// the hunters go where their informant sent them. In-person plants are twists; the rest go by letter.

export default {
  id: 'op-mole', act: 2, issue: '07-13 09.00', giver: 'handler',
  title: 'The Mole',
  brief: 'Heller knew our Sarajevo business within the week; Brandl, Ilić and Amsler all knew it too. Tell each a different meeting place for our courier on the seventeenth: Brandl Trieste, Ilić Budapest, Amsler Munich. In person is best; letters will do. Watch where the hunters go. Name the leak to me by the twentieth. A.',
  steps: [
    { id: 'feed', kind: 'act', city: '*', venue: 'venue:telegraph', by: '07-16 18.00', label: 'Tell each suspect a different place',
      ways: [
        { id: 'laid', label: 'Wire Ashby that all three are fed', sub: 'Only once you have told all three',
          if: [['flag', 'op-mole-brandl'], ['flag', 'op-mole-ilic'], ['flag', 'op-mole-amsler']], risk: 0, rec: ['wire', 0.2] },
        { id: 'letters', label: 'Feed the rest by letter', sub: 'Quick and cheap; censors open letters',
          risk: 0, story: 'op-mole.letters' },
      ] },
    { id: 'watch', kind: 'observe', city: ['TRI', 'BUD', 'MUN'], after: '07-17 06.00', by: '07-18 18.00', min: 240,
      label: 'Watch one of the three places', story: 'op-mole.watch' },
    { id: 'name', kind: 'act', city: ['LON', 'PAR'], venue: 'venue:hotel', by: '07-20 18.00', label: 'Name the leak to Ashby',
      ways: [
        { id: 'brandl', label: 'Name Dr Brandl', sub: 'Trieste', risk: 0, story: 'op-mole.name-brandl' },
        { id: 'ilic', label: 'Name Lieutenant Ilić', sub: 'Budapest', risk: 0, story: 'op-mole.name-ilic' },
        { id: 'amsler', label: 'Name Herr Amsler', sub: 'Munich', risk: 0, story: 'op-mole.name-amsler' },
        { id: 'nobody', label: 'Admit you cannot say', sub: 'Ashby will not be pleased', risk: 0, story: 'op-mole.name-nobody' },
      ] },
  ],
  twists: [
    { if: [['op', 'op-mole'], ['not', ['op', 'op-mole', 'feed']], ['not', ['flag', 'op-mole-brandl']], ['not', ['st', 'brandl', 'unknown']],
      ['any', ['city', 'VIE'], ['city', 'BUD']]], story: 'op-mole.brandl' },
    { if: [['op', 'op-mole'], ['not', ['op', 'op-mole', 'feed']], ['not', ['flag', 'op-mole-ilic']], ['not', ['st', 'ilic', 'unknown']],
      ['any', ['city', 'BEG'], ['city', 'SAR']]], story: 'op-mole.ilic' },
    { if: [['op', 'op-mole'], ['not', ['op', 'op-mole', 'feed']], ['not', ['flag', 'op-mole-amsler']], ['not', ['st', 'amsler', 'unknown']],
      ['any', ['city', 'ZUR'], ['city', 'PAR']]], story: 'op-mole.amsler' },
    { if: [['op', 'op-mole', 'feed'], ['not', ['op', 'op-mole', 'watch']], ['not', ['st', 'platt', 'unknown']],
      ['any', ['city', 'VIE'], ['city', 'BER'], ['city', 'PAR']], ['chance', 0.5]], story: 'op-mole.platt' },
  ],
  win: [['standing', 15], ['money', 10], ['item', '+diplomatic-bag']],
  fail: [['standing', -12]],
  debrief: 'Three lies to three people is an old trick, and it works because traitors are lazy: they pass on exactly what they were told, no more and no less. Heller and Orlova bought in the same market, and whichever of the three was selling, Vienna heard. The hunters went where their informant sent them. If you were watching the right station, so did the truth.',
};
