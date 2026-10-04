// The Brother (owner: Ops). Side op, started by Ilić (People) in Belgrade with ['op', 'op-brother', 'start'].
// See docs/CONTRACTS.md §6. One journey there and back: Sarajevo's garrison prison, then home over the Drina.
// When Ilić is Heller's man there is no brother in the prison: it is a trap (op-brother.trap).

export default {
  id: 'op-brother', act: 2, issue: null, giver: 'ilic', side: true,
  title: 'The Brother',
  brief: "Ilić's brother Pavle is nineteen. He carried leaflets, only leaflets, and has been held in the Sarajevo garrison gaol since the round-ups. 'Get him out,' Ilić says, 'and I am yours. The Drina is shallow at Višegrad this summer.'",
  steps: [
    { id: 'reach', kind: 'goto', city: 'SAR', label: 'Go to Sarajevo' },
    { id: 'free', kind: 'act', city: 'SAR', venue: 'venue:prison', label: 'Get Pavle out of the garrison prison',
      ways: [
        { id: 'visitor', label: 'Visit the hostages as a religious', sub: 'Prisons let a priest or a sister in',
          tag: 'venue:prison', if: [['aff', 'venue:prison', '>=', 1]], risk: 0.15, rec: ['register', 0.4], story: 'op-brother.visit' },
        { id: 'warder', label: 'Bribe a warder', sub: '£15; Bosnian warders are poorly paid',
          tag: 'topic:underworld', cost: { money: 15 }, risk: 0.3, rec: ['bribe', 0.6], story: 'op-brother.warder' },
        { id: 'order', label: 'Forge a release order', sub: 'A night with pen and stamp; the adjutant reads closely',
          tag: 'topic:police', if: [['skill', 'paperwork', '>=', 2]], cost: { min: 480 }, risk: 0.3, rec: ['register', 0.5],
          ok: [['debrief', 'Pavle walked out on a release order you forged yourself.']], fail: [['nerve', -2], ['susp', 'active', 0.2]] },
        { id: 'officer', label: 'Demand him for questioning', sub: "A title's arrogance and a colonel's tone",
          tag: 'venue:barracks', if: [['aff', 'venue:barracks', '>=', 1]], risk: 0.25, rec: ['meeting', 0.6],
          ok: [['debrief', 'A Hungarian title demanded the prisoner, and the garrison did not dare refuse.']], fail: [['susp', 'active', 0.25]] },
        { id: 'keys', label: 'The yard door at night', sub: 'Skeleton keys, and a sentry who drinks',
          tag: 'venue:prison', if: [['item', 'skeleton-keys'], ['clock', '22.00', '04.00']], risk: 0.45, rec: ['sighting', 0.6],
          ok: [['debrief', 'You let Pavle out through the yard door with keys from Marseille.']], fail: [['nerve', -2], ['susp', 'active', 0.25]] },
      ] },
    { id: 'cross', kind: 'goto', city: 'BEG', label: 'Bring Pavle to his brother', story: 'op-brother.barrier' },
  ],
  twists: [
    { if: [['op', 'op-brother', 'reach'], ['not', ['op', 'op-brother', 'free']], ['city', 'SAR'], ['loyal', 'ilic', 'enemy:heller']], story: 'op-brother.trap' },
    { if: [['op', 'op-brother', 'free'], ['not', ['op', 'op-brother', 'cross']], ['mode', 'road']], story: 'op-brother.visegrad' },
  ],
  win: [['trust', 'ilic', 2], ['item', '+slivovitz']],
  fail: [['trust', 'ilic', -2]],
  debrief: 'Pavle Ilić was nineteen, had carried leaflets, and had never fired a gun. He was held as a hostage for the good behaviour of a village he had never visited. If his brother was Heller\'s man, Pavle was never in that prison at all: he was the bait, and the trap was set for whoever came to take him.',
};
