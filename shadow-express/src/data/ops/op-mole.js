// The Mole (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7 (Act II: the Belgrade posting).
// Each suspect hears a different false place for the Bureau courier on the 17th:
// Ilić (in person, Belgrade) → the Belgrade quay; Brandl (letter) → Budapest; Amsler (letter) → Trieste.
// Exactly one of them is the enemy each campaign; the hunters go where their informant sent them.

const TOLD_ILIC = [['plant', { via: 'ilic', subj: 'op:op-mole', claim: { at: 'BEG' } }]];
const LETTERS = [['plant', { via: 'brandl', subj: 'op:op-mole', claim: { at: 'BUD' } }], ['plant', { via: 'amsler', subj: 'op:op-mole', claim: { at: 'TRI' } }]];

export default {
  id: 'op-mole', act: 2, issue: '07-13 09.00', giver: 'handler',
  title: 'The Mole',
  brief: 'Take up the Belgrade post by the fifteenth. Heller knew our Sarajevo business within the week; Brandl, Ilić and Amsler all knew it too. Tell Ilić in person that our courier lands at the Belgrade quay on the seventeenth; write Brandl that it is Budapest, Amsler that it is Trieste. Watch. Wire me the name by the twentieth. A.',
  steps: [
    { id: 'reach', kind: 'wait', city: 'BEG', min: 120, by: '07-15 12.00', label: 'Take up the Belgrade post by the fifteenth', story: 'op-mole.post' },
    { id: 'feed', kind: 'act', city: 'BEG', venue: 'venue:cafe', by: '07-16 12.00', label: 'Tell Ilić of the courier, in person',
      ways: [
        { id: 'kafana', label: 'Over rakija in his kafana', sub: 'He talks; that is why it may work',
          if: [['not', ['st', 'ilic', 'unknown']]], risk: 0.1, rec: ['meeting', 0.4], story: 'op-mole.ilic' },
        { id: 'batman', label: 'Through his batman', sub: '£2; less convincing, and less of you in it',
          tag: 'topic:military', cost: { money: 2 }, risk: 0.2, rec: ['bribe', 0.4],
          ok: TOLD_ILIC },
        { id: 'note', label: 'A note left at the War Ministry', sub: 'Cheap; anyone may read it on the way',
          risk: 0.15, rec: ['wire', 0.4],
          ok: TOLD_ILIC },
      ] },
    { id: 'feed-2', kind: 'act', city: 'BEG', venue: 'venue:telegraph', by: '07-16 18.00', label: 'Write to Brandl and Amsler',
      ways: [
        { id: 'post', label: 'Post both letters at the main office', sub: 'A dinar; the Serbian censor reads them first',
          cost: { money: 1 }, risk: 0.1, rec: ['wire', 0.5],
          ok: LETTERS, fail: [['watch', 0.2]] },
        { id: 'legation', label: 'Send them in the legation bag', sub: 'Unread; you are seen at the legation',
          tag: 'venue:embassy', risk: 0.1, rec: ['sighting', 0.4],
          ok: LETTERS, fail: [['watch', 0.2]] },
        { id: 'attendant', label: 'Give them to a sleeping-car attendant', sub: '£3; posted in Budapest, out of Serbia',
          cost: { money: 3 }, risk: 0.2, rec: ['bribe', 0.3],
          ok: LETTERS, fail: [['nerve', -1]] },
      ] },
    { id: 'watch', kind: 'wait', city: 'BEG', min: 2880, by: '07-19 12.00', label: 'Watch Belgrade for two days', story: 'op-mole.watch' },
    { id: 'name', kind: 'act', city: 'BEG', venue: 'venue:telegraph', after: '07-17 18.00', by: '07-20 18.00', label: 'Wire the name to London',
      ways: [
        { id: 'brandl', label: 'Name Dr Brandl', sub: 'Budapest', risk: 0, story: 'op-mole.name-brandl' },
        { id: 'ilic', label: 'Name Lieutenant Ilić', sub: 'The Belgrade quay', risk: 0, story: 'op-mole.name-ilic' },
        { id: 'amsler', label: 'Name Herr Amsler', sub: 'Trieste', risk: 0, story: 'op-mole.name-amsler' },
        { id: 'nobody', label: 'Admit you cannot say', sub: 'Ashby will not be pleased', risk: 0, story: 'op-mole.name-nobody' },
      ] },
  ],
  twists: [
    { if: [['op', 'op-mole', 'reach'], ['not', ['op', 'op-mole', 'feed-2']], ['city', 'BEG'], ['stay', '<', 2]], story: 'op-mole.express' },
    { if: [['op', 'op-mole', 'feed-2'], ['not', ['op', 'op-mole', 'name']], ['city', 'BEG'], ['day', '56']], story: 'op-mole.seventeenth' },
  ],
  win: [['standing', 15], ['money', 10], ['item', '+diplomatic-bag']],
  fail: [['standing', -12]],
  debrief: 'Three lies to three people is an old trick, and it works because traitors are lazy: they pass on exactly what they were told. Heller and Orlova bought in the same market, and whichever of the three was selling, Vienna heard. The hunters went where their informant sent them: the Belgrade quay, the Budapest station, or a bank in Trieste.',
};
