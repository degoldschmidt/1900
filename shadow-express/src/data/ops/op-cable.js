// The Sarajevo Cable (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// The cable is forged when Heller owns the mole (Brandl or Ilić), genuine when the mole is Orlova's (Amsler):
// forged = ['not', ['loyal','amsler','enemy:orlova']]. Brandl lies about it when he is Heller's man.

export default {
  id: 'op-cable', act: 1, issue: '06-28 17.00', giver: 'handler',
  title: 'The Sarajevo Cable',
  brief: 'SARAJEVO STUDENT JOVAN MARIC HOLDS CABLE SAID TO TIE BELGRADE OFFICERS TO TODAYS SHOTS STOP REACH HIM BY SECOND STOP HAVE IT JUDGED BY BRANDL VIENNA OR NOVAK PRAGUE STOP LONDON BY NINTH WITH YOUR VERDICT STOP POLICE ROUNDING UP STUDENTS DO NOT BE ONE OF THEM ASHBY',
  steps: [
    { id: 'reach', kind: 'goto', city: 'SAR', by: '07-02 23.00', label: 'Reach Sarajevo by the second', story: 'op-cable.reach' },
    { id: 'meet', kind: 'meet', person: 'jovan', city: 'SAR', by: '07-03 20.00', gives: 'sarajevo-cable',
      label: 'Meet Jovan and take the cable', story: 'op-cable.jovan' },
    { id: 'judge', kind: 'act', city: ['VIE', 'PRG'], venue: 'venue:cafe', by: '07-06 18.00', label: 'Have the cable judged in Vienna or Prague',
      ways: [
        { id: 'brandl', label: 'Show it to Dr Brandl', sub: 'A nerve doctor whose patients wear epaulettes',
          if: [['city', 'VIE'], ['not', ['st', 'brandl', 'unknown']]], risk: 0.1, rec: ['meeting', 0.3], story: 'op-cable.brandl' },
        { id: 'novak', label: 'Let Novák read the paper', sub: 'A forger knows a forgery',
          if: [['city', 'PRG'], ['not', ['st', 'novak', 'unknown']]], risk: 0.1, rec: ['meeting', 0.3], story: 'op-cable.novak' },
        { id: 'clerk', label: 'Check the telegraph transit register', sub: '£6 to a clerk, and a bribe on record',
          tag: 'venue:telegraph', cost: { money: 6 }, risk: 0.25, rec: ['bribe', 0.5], story: 'op-cable.clerk' },
        { id: 'lens', label: "Study it under a jeweller's loupe", sub: "An optician's eye and a quiet hour",
          tag: 'topic:technical', if: [['aff', 'topic:technical', '>=', 1]], risk: 0.05, rec: null, story: 'op-cable.lens' },
      ] },
    { id: 'home', kind: 'carry', item: 'sarajevo-cable', to: 'LON', by: '07-09 12.00', label: 'Carry the cable to London' },
    { id: 'report', kind: 'act', city: 'LON', venue: 'venue:hotel', by: '07-10 12.00', label: 'Give Ashby your verdict',
      ways: [
        { id: 'genuine', label: 'Call it genuine', sub: "Belgrade's officers sent it", risk: 0, story: 'op-cable.say-genuine' },
        { id: 'forged', label: 'Call it a forgery', sub: 'Someone wants Belgrade blamed', risk: 0, story: 'op-cable.say-forged' },
        { id: 'unsure', label: 'Say you cannot tell', sub: 'Ashby dislikes a shrug', risk: 0, story: 'op-cable.say-unsure' },
      ] },
  ],
  twists: [
    { if: [['op', 'op-cable', 'reach'], ['not', ['op', 'op-cable', 'meet']], ['city', 'SAR'], ['tailed']], story: 'op-cable.shadow' },
    { if: [['op', 'op-cable', 'meet'], ['not', ['op', 'op-cable', 'home']], ['nation', 'AH'], ['not', ['loyal', 'amsler', 'enemy:orlova']], ['chance', 0.5]],
      story: 'op-cable.forged' },
    { if: [['op', 'op-cable', 'meet'], ['not', ['op', 'op-cable', 'home']], ['loyal', 'amsler', 'enemy:orlova'], ['chance', 0.5]],
      story: 'op-cable.buyback' },
  ],
  win: [['standing', 10], ['money', 15]],
  fail: [['standing', -15], ['trust', 'jovan', -1]],
  debrief: "Serbian officers had armed the Sarajevo assassins; that much the world would learn. Whether this telegram proved it was another matter. Heller's office kept a forger who wrote good Cyrillic, and Vienna wanted London to believe the worst of Belgrade before the note was sent. Whatever was in your report, someone in the net had told Heller the British were asking.",
};
