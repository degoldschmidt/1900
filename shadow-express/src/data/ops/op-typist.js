// Fräulein Sauer (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// Using Sauer in op-optics (flag op-optics-sauer) makes certain she is followed now.

export default {
  id: 'op-typist', act: 3, issue: '07-27 09.00', giver: 'handler',
  title: 'Fräulein Sauer',
  brief: 'IIIB HUNTING A LEAK IN THE GENERAL STAFF TYPING POOL STOP SAUER IN DANGER STOP MEET HER IN BERLIN BY FRIDAY NOON STOP SHE CAN BRING THE RAILWAY ANNEX STOP GET HER AND IT TO NEUTRAL GROUND BY SUNDAY EVENING STOP FRONTIERS WILL CLOSE ASHBY',
  steps: [
    { id: 'meet', kind: 'meet', person: 'sauer', city: 'BER', by: '07-31 12.00', gives: 'companion-sauer',
      label: 'Meet Sauer in Berlin by Friday noon', story: 'op-typist.meet' },
    { id: 'annex', kind: 'act', city: 'BER', venue: 'venue:cafe', by: '08-01 06.00', gives: 'staff-papers',
      label: 'Get the railway annex out',
      ways: [
        { id: 'bag', label: 'She carries it out in her bag', sub: 'The gate guards search one bag in ten',
          risk: 0.25, rec: null, ok: [['trust', 'sauer', 1]], fail: [['expose', 'sauer', 0.6], ['nerve', -2]] },
        { id: 'camera', label: 'She photographs it at her desk', sub: 'Your vest camera, under her cardigan',
          if: [['item', 'vest-camera']], risk: 0.15, rec: null,
          ok: [['debrief', 'Sauer photographed the annex at her own desk, with your camera under her cardigan.']],
          fail: [['expose', 'sauer', 0.5], ['item', '-vest-camera']] },
        { id: 'retype', label: 'She retypes it from her shorthand', sub: 'A night of work; slow, and safe',
          cost: { min: 480 }, risk: 0.05, rec: null,
          ok: [['debrief', 'Sauer retyped the annex from her shorthand through the night.']] },
        { id: 'carbons', label: "Buy the carbons from the wastepaper man", sub: '£12; IIIb searches the waste too',
          tag: 'topic:underworld', cost: { money: 12 }, risk: 0.3, rec: ['bribe', 0.6] },
      ] },
    { id: 'out', kind: 'carry', item: 'companion-sauer', to: ['CPH', 'AMS', 'FLU', 'ZUR', 'STO'], by: '08-02 18.00',
      label: 'Get her to neutral ground by Sunday' },
    { id: 'deliver', kind: 'carry', item: 'staff-papers', to: ['CPH', 'AMS', 'FLU', 'ZUR', 'STO', 'LON'], by: '08-03 18.00',
      label: 'The annex to a neutral city or London' },
  ],
  twists: [
    { if: [['op', 'op-typist', 'meet'], ['not', ['op', 'op-typist', 'out']], ['city', 'BER'], ['any', ['flag', 'op-optics-sauer'], ['chance', 0.4]]],
      story: 'op-typist.followed' },
    { if: [['op', 'op-typist', 'annex'], ['not', ['op', 'op-typist', 'out']], ['item', 'companion-sauer']], story: 'op-typist.sister' },
    { if: [['op', 'op-typist', 'meet'], ['not', ['op', 'op-typist', 'out']], ['item', 'companion-sauer'], ['nation', 'DE'], ['day', '56']],
      story: 'op-typist.permit' },
    { if: [['op', 'op-typist', 'meet'], ['not', ['op', 'op-typist', 'out']],
      ['any', ['flag', 'op-mole-kept-brandl'], ['flag', 'op-mole-kept-ilic'], ['flag', 'op-mole-kept-amsler']]], story: 'op-typist.pipe' },
  ],
  win: [['standing', 15], ['money', 20], ['trust', 'sauer', 2], ['item', '-companion-sauer'], ['item', '-staff-papers']],
  fail: [['standing', -15], ['trust', 'sauer', -2], ['item', '-companion-sauer']],
  debrief: 'The annex listed the trains of the western deployment, timed to the minute: eleven thousand of them, most bound for the Belgian frontier. The French had guessed; now they knew. Sauer never typed for anyone again. IIIb arrested two other typists from the pool. One of them had done nothing at all.',
};
