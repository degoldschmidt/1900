// The Ultimatum (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// The note was delivered in Belgrade on Thursday 23 July at 18.00; the text must be wired before then.

export default {
  id: 'op-ultimatum', act: 2, issue: '07-18 09.00', giver: 'handler',
  title: 'The Ultimatum',
  brief: 'VIENNA DRAFTING NOTE TO BELGRADE STOP FINAL TEXT AT BALLHAUSPLATZ FROM TWENTIETH EVENING STOP BE IN VIENNA BY TWENTYFIRST STOP COPY IT STOP WIRE IT FROM NEUTRAL GROUND OR LONDON BEFORE IT IS DELIVERED STOP THEY MEAN TO DELIVER ON THURSDAY EVENING ASHBY',
  steps: [
    { id: 'reach', kind: 'goto', city: 'VIE', by: '07-21 12.00', label: 'Be in Vienna by the twenty-first', story: 'op-ultimatum.reach' },
    { id: 'copy', kind: 'act', city: 'VIE', venue: 'venue:ministry', after: '07-20 18.00', by: '07-22 20.00', gives: 'ultimatum-copy',
      label: 'Copy the note at the Ballhausplatz',
      ways: [
        { id: 'patient', label: "Through Brandl's patient", sub: 'A counsellor of legation who cannot sleep',
          if: [['st', 'brandl', 'recruited']], risk: 0.15, rec: ['meeting', 0.3], story: 'op-ultimatum.patient' },
        { id: 'porter', label: 'Bribe the night porter', sub: '£25 and a long night',
          cost: { money: 25 }, if: [['clock', '21.00', '05.00']], risk: 0.35, rec: ['bribe', 0.6], story: 'op-ultimatum.porter' },
        { id: 'press', label: 'Work the Press Office', sub: "A correspondent's privilege, and the chief's vanity",
          tag: 'venue:press', if: [['aff', 'venue:press', '>=', 1]], risk: 0.2, rec: ['meeting', 0.5], story: 'op-ultimatum.press' },
        { id: 'dinner', label: 'Dine at the German embassy', sub: 'Berlin has seen the text; Berlin drinks',
          tag: 'venue:embassy', if: [['aff', 'venue:embassy', '>=', 1]], risk: 0.25, rec: ['sighting', 0.4], story: 'op-ultimatum.dinner' },
        { id: 'keys', label: 'The registry by night', sub: "Skeleton keys and the cipher clerks' corridor",
          tag: 'venue:ministry', if: [['item', 'skeleton-keys'], ['clock', '23.00', '04.00']], risk: 0.45, rec: ['sighting', 0.5],
          ok: [['later', 60, 'op-ultimatum.papers'], ['debrief', 'You copied the note by a shaded lamp in the registry, with keys from Marseille.']],
          fail: [['nerve', -2], ['susp', 'active', 0.2]] },
      ] },
    { id: 'wire', kind: 'carry', item: 'ultimatum-copy', to: ['ZUR', 'VEN', 'ROM', 'LON'], by: '07-23 18.00',
      label: "Wire it before Thursday, six o'clock" },
  ],
  twists: [
    { if: [['flag', 'op-ultimatum-porter'], ['op', 'op-ultimatum', 'copy'], ['not', ['op', 'op-ultimatum', 'wire']], ['chance', 0.6]],
      story: 'op-ultimatum.paid-twice' },
    { if: [['op', 'op-ultimatum', 'reach'], ['not', ['op', 'op-ultimatum', 'wire']], ['city', 'VIE'], ['not', ['st', 'platt', 'unknown']], ['chance', 0.4]],
      story: 'op-ultimatum.platt' },
    { if: [['op', 'op-ultimatum', 'reach'], ['not', ['op', 'op-ultimatum', 'copy']], ['city', 'VIE'],
      ['any', ['flag', 'op-mole-kept-brandl'], ['flag', 'op-mole-kept-ilic'], ['flag', 'op-mole-kept-amsler']]], story: 'op-ultimatum.pipe' },
  ],
  win: [['standing', 15], ['money', 20], ['item', '-ultimatum-copy']],
  fail: [['standing', -15]],
  debrief: 'The note was written to be refused. Vienna timed its delivery for the hour the French President sailed from Petersburg, so that Paris and Petersburg could not agree a reply. If your copy reached London first, the Foreign Office had one night of warning. It changed nothing. It was the only warning anyone had.',
};
