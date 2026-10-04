// Fräulein Sauer (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7 (Act III: the Berlin posting).
// Two journeys: from wherever op-student left you to the Berlin post, and out with Sauer to neutral ground as the frontiers close.
// The post can be taken up as late as Friday morning, so that even the Constantinople road with Jovan can still reach it;
// arriving earlier buys days of cultivating Sauer (People), which the twists and rolls reward.
// She cannot be met before the 30th. The scenes of the way out are `later` continuations armed when the annex is out.

const ROAD = [['later', 1, 'op-typist.permit'], ['later', 2, 'op-typist.major']];

export default {
  id: 'op-typist', act: 3, issue: '07-26 09.00', giver: 'handler',
  title: 'Fräulein Sauer',
  brief: 'TAKE UP BERLIN POST BY FRIDAY MORNING STOP IIIB HUNTING A LEAK IN THE GENERAL STAFF TYPING POOL STOP CULTIVATE SAUER QUIETLY AND MEET HER BY FRIDAY EVENING STOP SHE CAN BRING THE RAILWAY ANNEX STOP GET HER TO NEUTRAL GROUND BY SUNDAY STOP FRONTIERS WILL CLOSE ASHBY',
  steps: [
    { id: 'reach', kind: 'wait', city: 'BER', min: 120, by: '07-31 10.30', label: 'Take up the Berlin post by Friday morning', story: 'op-typist.post' },
    { id: 'meet', kind: 'meet', person: 'sauer', city: 'BER', after: '07-30 08.00', by: '07-31 18.00', gives: 'companion-sauer',
      label: 'Meet Sauer by Friday evening',
      ways: [
        { id: 'tearoom', label: 'The Wertheim tea room, as arranged', sub: 'A parcel of gloves; she will be early', risk: 0.1, story: 'op-typist.meet' },
        { id: 'church', label: 'A pew behind hers at evening prayers', sub: 'Two hours of hymns; nobody follows a typist to church',
          tag: 'venue:church', cost: { min: 120 }, risk: 0.15, rec: ['meeting', 0.3], ok: [['trust', 'sauer', 1]], fail: [['expose', 'sauer', 0.3]] },
      ] },
    { id: 'annex', kind: 'act', city: 'BER', venue: 'venue:cafe', by: '08-01 06.00', gives: 'staff-papers',
      label: 'Get the railway annex out',
      ways: [
        { id: 'bag', label: 'She carries it out in her bag', sub: 'The gate guards search one bag in ten',
          risk: 0.25, rec: null, ok: [['trust', 'sauer', 1], ...ROAD], fail: [['expose', 'sauer', 0.6], ['nerve', -2]] },
        { id: 'camera', label: 'She photographs it at her desk', sub: 'Your vest camera, under her cardigan',
          if: [['item', 'vest-camera']], risk: 0.15, rec: null,
          ok: [...ROAD, ['debrief', 'Sauer photographed the annex at her own desk, with your camera under her cardigan.']],
          fail: [['expose', 'sauer', 0.5], ['item', '-vest-camera']] },
        { id: 'retype', label: 'She retypes it from her shorthand', sub: 'A night of work; slow, and safe',
          cost: { min: 480 }, risk: 0.05, rec: null,
          ok: [...ROAD, ['debrief', 'Sauer retyped the annex from her shorthand through the night.']] },
        { id: 'carbons', label: 'Buy the carbons from the wastepaper man', sub: '£12; IIIb searches the waste too',
          tag: 'topic:underworld', cost: { money: 12 }, risk: 0.3, rec: ['bribe', 0.6], ok: [...ROAD], fail: [['watch', 0.2]] },
      ] },
    { id: 'out', kind: 'carry', item: 'companion-sauer', to: ['CPH', 'AMS', 'FLU', 'ZUR', 'STO'], by: '08-02 18.00',
      label: 'Get her to neutral ground by Sunday' },
    { id: 'deliver', kind: 'carry', item: 'staff-papers', to: ['CPH', 'AMS', 'FLU', 'ZUR', 'STO', 'LON'], by: '08-03 18.00',
      label: 'The annex to a neutral city or London' },
  ],
  twists: [
    // Sauer is followed: IIIb is already watching you, or she is too frightened to hide it
    { if: [['op', 'op-typist', 'meet'], ['not', ['op', 'op-typist', 'out']], ['city', 'BER'], ['any', ['watched'], ['trust', 'sauer', '<', 1]]],
      story: 'op-typist.followed' },
    { if: [['op', 'op-typist', 'meet'], ['not', ['op', 'op-typist', 'out']],
      ['any', ['flag', 'op-mole-kept-brandl'], ['flag', 'op-mole-kept-ilic'], ['flag', 'op-mole-kept-amsler']]], story: 'op-typist.pipe' },
  ],
  win: [['standing', 15], ['money', 20], ['trust', 'sauer', 2], ['item', '-companion-sauer'], ['item', '-staff-papers']],
  fail: [['standing', -15], ['trust', 'sauer', -2], ['item', '-companion-sauer']],
  debrief: 'The annex listed the trains of the western deployment, timed to the minute: eleven thousand of them, most bound for the Belgian frontier. The French had guessed; now they knew. Sauer never typed for anyone again. IIIb arrested two other typists from the pool. One of them had done nothing at all.',
};
