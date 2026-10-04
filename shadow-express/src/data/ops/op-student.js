// Get Jovan Out (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// Ilić's help is a trap when Ilić is Heller's man; a promise made in op-cable opens the easiest way.

export default {
  id: 'op-student', act: 2, issue: '07-21 09.00', giver: 'handler',
  title: 'Get Jovan Out',
  brief: 'SARAJEVO POLICE HAVE JOVAN MARICS NAME FROM A PRISONER STOP THEY WILL TAKE HIM BEFORE SATURDAY STOP FIND HIM STOP BRING HIM OUT TO ITALY SWITZERLAND OR LONDON BY TUESDAY NIGHT STOP HE KNOWS YOUR FACE AND SO WILL THEY ASHBY',
  steps: [
    { id: 'reach', kind: 'goto', city: 'SAR', by: '07-25 06.00', label: 'Reach Sarajevo before Saturday', story: 'op-student.reach' },
    { id: 'find', kind: 'act', city: 'SAR', venue: 'venue:cafe', by: '07-25 20.00', gives: 'companion-jovan',
      label: 'Find Jovan before the police do',
      ways: [
        { id: 'word', label: 'He sent word, as you promised', sub: 'A boy at the station with a note',
          if: [['flag', 'op-cable-promise']], risk: 0.05, rec: null,
          ok: [['trust', 'jovan', 1], ['debrief', 'Jovan sent for you himself, because you had once promised to come.']] },
        { id: 'ilic', label: 'Ask Lieutenant Ilić where he hides', sub: 'Ilić knows every Serb in Sarajevo',
          if: [['not', ['st', 'ilic', 'unknown']]], risk: 0.1, rec: ['meeting', 0.3], story: 'op-student.ilic' },
        { id: 'friars', label: 'Ask the Franciscans', sub: 'They hide the hunted of every faith',
          tag: 'topic:religion', if: [['aff', 'topic:religion', '>=', 1]], risk: 0.05, rec: null,
          ok: [['debrief', 'The Franciscans found Jovan for you, and asked nothing in return.']] },
        { id: 'mother', label: "Watch his mother's house", sub: 'Hours in a doorway; the police watch it too',
          cost: { min: 300 }, risk: 0.3, rec: ['sighting', 0.5], ok: [['trust', 'jovan', 1]], fail: [['nerve', -1], ['expose', 'jovan', 0.3]] },
        { id: 'list', label: 'Buy the police search list', sub: '£10 to a clerk: where they search, and when',
          tag: 'topic:police', cost: { money: 10 }, risk: 0.25, rec: ['bribe', 0.6],
          ok: [['intel', { subj: 'city:SAR', claim: { note: 'The police mean to search the Latin Bridge quarter at dawn on Saturday.' }, src: 'police', rel: 0.8, truth: true }]] },
      ] },
    { id: 'out', kind: 'carry', item: 'companion-jovan', to: ['VEN', 'ROM', 'ZUR', 'LON'], by: '07-28 23.00',
      label: 'Get him to Italy, Switzerland or London' },
  ],
  twists: [
    { if: [['op', 'op-student', 'find'], ['not', ['op', 'op-student', 'out']], ['city', 'SAR'], ['flag', 'op-student-ilic'], ['loyal', 'ilic', 'enemy:heller']],
      story: 'op-student.informer' },
    { if: [['op', 'op-student', 'find'], ['not', ['op', 'op-student', 'out']], ['item', 'companion-jovan'], ['any', ['city', 'BUD'], ['city', 'VIE']]],
      story: 'op-student.semlin' },
    { if: [['op', 'op-student', 'find'], ['not', ['op', 'op-student', 'out']], ['item', 'companion-jovan'], ['day', '0126'], ['chance', 0.5]],
      story: 'op-student.belgrade' },
    { if: [['op', 'op-student', 'reach'], ['not', ['op', 'op-student', 'out']],
      ['any', ['flag', 'op-mole-kept-brandl'], ['flag', 'op-mole-kept-ilic'], ['flag', 'op-mole-kept-amsler']]], story: 'op-student.pipe' },
  ],
  win: [['standing', 10], ['money', 10], ['trust', 'jovan', 2], ['item', '-companion-jovan']],
  fail: [['standing', -10], ['trust', 'jovan', -1], ['item', '-companion-jovan']],
  debrief: 'Jovan was never important, which is why he mattered: a student who had held a cable for a week and could name the men who gave it to him. The police wanted him for that, and so did Heller. In Italy or London he was only a refugee with half a law degree. In a Sarajevo cell he would have been evidence.',
};
