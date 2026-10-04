// The Sarajevo Cable (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7 (Act I: the Vienna posting).
// Two journeys: London to the Vienna post, and the fast run to Sarajevo and back. The rest is Vienna work.
// The cable is forged when Heller owns the mole (Brandl or Ilić), genuine when the mole is Orlova's (Amsler):
// forged = ['not', ['loyal','amsler','enemy:orlova']]. Brandl lies about it when he is Heller's man.

export default {
  id: 'op-cable', act: 1, issue: '06-28 17.00', giver: 'handler',
  title: 'The Sarajevo Cable',
  brief: 'TAKE UP POST VIENNA BY FIRST STOP SARAJEVO STUDENT JOVAN MARIC HOLDS CABLE SAID TO TIE BELGRADE OFFICERS TO TODAYS SHOTS STOP FETCH IT BY FOURTH STOP HAVE BRANDL JUDGE IT STOP SEND IT AND YOUR VERDICT BY NINTH STOP POLICE ROUNDING UP STUDENTS ASHBY',
  steps: [
    { id: 'reach', kind: 'goto', city: 'VIE', by: '07-01 18.00', label: 'Take up your Vienna post by the first', story: 'op-cable.post' },
    { id: 'meet', kind: 'meet', person: 'jovan', city: 'SAR', by: '07-04 22.00', gives: 'sarajevo-cable',
      label: 'Meet Jovan in Sarajevo by the fourth', story: 'op-cable.jovan' },
    { id: 'judge', kind: 'act', city: 'VIE', venue: 'venue:cafe', by: '07-08 18.00', label: 'Have the cable judged in Vienna',
      ways: [
        { id: 'brandl', label: 'Show it to Dr Brandl', sub: 'A nerve doctor whose patients wear epaulettes',
          if: [['item', 'sarajevo-cable'], ['not', ['st', 'brandl', 'unknown']]], risk: 0.1, rec: ['meeting', 0.3], story: 'op-cable.brandl' },
        { id: 'novak', label: 'Let Novák read the paper', sub: 'A forger knows a forgery',
          if: [['item', 'sarajevo-cable'], ['not', ['st', 'novak', 'unknown']]], risk: 0.1, rec: ['meeting', 0.3], story: 'op-cable.novak' },
        { id: 'clerk', label: 'Check the telegraph transit register', sub: '£6 to a clerk, and a bribe on record',
          tag: 'venue:telegraph', if: [['item', 'sarajevo-cable']], cost: { money: 6 }, risk: 0.25, rec: ['bribe', 0.5], story: 'op-cable.clerk' },
        { id: 'lens', label: "Study it under a jeweller's loupe", sub: "An optician's eye and a quiet hour",
          tag: 'topic:technical', if: [['item', 'sarajevo-cable'], ['aff', 'topic:technical', '>=', 1]], risk: 0.05, rec: null, story: 'op-cable.lens' },
      ] },
    { id: 'home', kind: 'act', city: 'VIE', venue: 'venue:embassy', by: '07-09 20.00', label: 'Send the cable and your verdict home',
      ways: [
        { id: 'bag', label: 'The embassy bag to London', sub: 'Safe and slow; you are seen going in',
          tag: 'venue:embassy', if: [['item', 'sarajevo-cable']], risk: 0.1, rec: ['sighting', 0.5],
          ok: [['item', '-sarajevo-cable'], ['later', 30, 'op-cable.reply']], fail: [['watch', 0.2]] },
        { id: 'wire', label: 'Wire the text in cipher', sub: '£3; fast, and the censor copies every cipher',
          tag: 'venue:telegraph', if: [['item', 'sarajevo-cable']], cost: { money: 3 }, risk: 0.2, rec: ['wire', 0.7],
          ok: [['item', '-sarajevo-cable'], ['later', 4, 'op-cable.reply']], fail: [['susp', 'active', 0.15]] },
        { id: 'courier', label: 'Hand it to your courier', sub: 'A recruited courier comes to Vienna for it',
          if: [['item', 'sarajevo-cable'], ['any', ['st', 'kowal', 'recruited'], ['st', 'agathe', 'recruited']]], risk: 0.1, rec: null,
          ok: [['item', '-sarajevo-cable'], ['later', 24, 'op-cable.reply']] },
        { id: 'post', label: 'Post it registered to a London box', sub: 'A shilling; the Austrian post opens letters',
          if: [['item', 'sarajevo-cable']], cost: { money: 1 }, risk: 0.35, rec: ['register', 0.4],
          ok: [['item', '-sarajevo-cable'], ['later', 48, 'op-cable.reply']],
          fail: [['item', '-sarajevo-cable'], ['susp', 'active', 0.2], ['debrief', 'The Austrian post opened your letter. The cable never reached London.']] },
      ] },
  ],
  twists: [
    { if: [['op', 'op-cable', 'reach'], ['not', ['op', 'op-cable', 'meet']], ['city', 'SAR']], story: 'op-cable.sarajevo' },
    { if: [['op', 'op-cable', 'reach'], ['not', ['op', 'op-cable', 'meet']], ['mode', 'rail'], ['nation', 'AH'], ['chance', 0.6]], story: 'op-cable.brod' },
    { if: [['op', 'op-cable', 'reach'], ['not', ['op', 'op-cable', 'meet']], ['city', 'SAR'], ['tailed']], story: 'op-cable.shadow' },
    { if: [['op', 'op-cable', 'meet'], ['not', ['op', 'op-cable', 'judge']], ['mode', 'rail'], ['item', 'sarajevo-cable'], ['chance', 0.5]],
      story: 'op-cable.search' },
    { if: [['op', 'op-cable', 'meet'], ['not', ['op', 'op-cable', 'home']], ['city', 'VIE'], ['not', ['loyal', 'amsler', 'enemy:orlova']], ['chance', 0.5]],
      story: 'op-cable.forged' },
    { if: [['op', 'op-cable', 'meet'], ['not', ['op', 'op-cable', 'home']], ['loyal', 'amsler', 'enemy:orlova'], ['chance', 0.5]],
      story: 'op-cable.buyback' },
  ],
  win: [['standing', 10], ['money', 15]],
  fail: [['standing', -15], ['trust', 'jovan', -1]],
  debrief: "Serbian officers had armed the Sarajevo assassins; that much the world would learn. Whether this telegram proved it was another matter. Heller's office kept a forger who wrote good Cyrillic, and Vienna wanted London to believe the worst of Belgrade before the note was sent. Whatever was in your report, someone in the net had told Heller the British were asking.",
};
