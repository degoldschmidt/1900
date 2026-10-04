// Get Jovan Out (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7 (Act II: the Belgrade posting).
// Jovan has fled to Belgrade. Trace him through the people you have cultivated, meet him, then the one journey:
// escort him yourself (east by Tsaribrod to Constantinople, or north over Semlin) or give him to a recruited courier.
// Ilić's help is a trap when Ilić is Heller's man; a promise made in op-cable opens the easiest way.

export default {
  id: 'op-student', act: 2, issue: '07-21 09.00', giver: 'handler',
  title: 'Get Jovan Out',
  brief: 'JOVAN MARIC HAS FLED SARAJEVO TO BELGRADE STOP AUSTRIAN AGENTS WANT HIM AS A WITNESS STOP FIND HIM BY SATURDAY STOP GET HIM TO CONSTANTINOPLE ATHENS ITALY OR LONDON BY TUESDAY NIGHT STOP TAKE HIM YOURSELF OR TRUST A COURIER ASHBY',
  steps: [
    { id: 'trace', kind: 'act', city: 'BEG', venue: 'venue:cafe', by: '07-24 20.00', label: 'Learn where Jovan is hiding',
      ways: [
        { id: 'word', label: 'He sent word, as you promised', sub: 'A boy at your door with a note',
          if: [['flag', 'op-cable-promise']], risk: 0.05, rec: null,
          ok: [['trust', 'jovan', 1], ['debrief', 'Jovan sent for you himself, because you had once promised to come.']] },
        { id: 'ilic', label: 'Ask Lieutenant Ilić', sub: 'Ilić knows every Bosnian in Belgrade',
          if: [['not', ['st', 'ilic', 'unknown']]], risk: 0.1, rec: ['meeting', 0.3], story: 'op-student.ilic' },
        { id: 'moruna', label: 'Ask at the Zlatna Moruna', sub: 'The Bosnian exiles drink there; so do informers',
          if: [['skill', 'slavic', '>=', 1]], risk: 0.25, rec: ['sighting', 0.4], fail: [['watch', 0.2]] },
        { id: 'church', label: 'Ask the priest at the cathedral', sub: 'Priests hear where the frightened sleep',
          tag: 'topic:religion', if: [['aff', 'topic:religion', '>=', 1]], risk: 0.05, rec: null },
        { id: 'police', label: 'Buy a Serbian police clerk', sub: '£8; they watch the Bosnians too',
          tag: 'topic:police', cost: { money: 8 }, risk: 0.25, rec: ['bribe', 0.6],
          ok: [['intel', { subj: 'hunter:heller', claim: { at: 'BEG' }, src: 'police', rel: 0.6, truth: 'auto' }]] },
      ] },
    { id: 'find', kind: 'meet', person: 'jovan', city: 'BEG', by: '07-25 20.00', gives: 'companion-jovan',
      label: 'Find Jovan by Saturday', story: 'op-student.find' },
    { id: 'out', kind: 'carry', item: 'companion-jovan', to: ['IST', 'ATH', 'ROM', 'VEN', 'LON'], by: '07-28 23.00',
      label: 'Get him out by Tuesday night' },
  ],
  twists: [
    { if: [['op', 'op-student', 'find'], ['not', ['op', 'op-student', 'out']], ['city', 'BEG'], ['flag', 'op-student-ilic'], ['loyal', 'ilic', 'enemy:heller']],
      story: 'op-student.informer' },
    { if: [['op', 'op-student', 'find'], ['not', ['op', 'op-student', 'out']], ['item', 'companion-jovan'], ['any', ['city', 'BEG'], ['city', 'BUD']]],
      story: 'op-student.semlin' },
    { if: [['op', 'op-student', 'find'], ['not', ['op', 'op-student', 'out']], ['item', 'companion-jovan'], ['day', '0126'], ['chance', 0.5]],
      story: 'op-student.enlist' },
    { if: [['op', 'op-student', 'find'], ['not', ['op', 'op-student', 'out']], ['item', 'companion-jovan'], ['mode', 'rail'], ['nation', 'BG']],
      story: 'op-student.tsaribrod' },
    { if: [['op', 'op-student'], ['not', ['op', 'op-student', 'out']],
      ['any', ['flag', 'op-mole-kept-brandl'], ['flag', 'op-mole-kept-ilic'], ['flag', 'op-mole-kept-amsler']]], story: 'op-student.pipe' },
  ],
  win: [['standing', 10], ['money', 10], ['trust', 'jovan', 2], ['item', '-companion-jovan']],
  fail: [['standing', -10], ['trust', 'jovan', -1], ['item', '-companion-jovan']],
  debrief: 'Jovan was never important, which is why he mattered: a student who had held a cable for a week and could name the men who gave it to him. Heller wanted him for that, and in Belgrade a Bosnian student could vanish without anyone asking where. In Constantinople or London he was only a refugee with half a law degree. In an Austrian cell he would have been evidence.',
};
