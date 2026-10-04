// Count the Trains (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.
// Troop trains crossed the Hohenzollern bridge from 2 August; Germany entered Belgium on 4 August.
// On the run west from the Berlin post: Herbesthal closes on the 4th, Emmerich perhaps that night (calendar).

export default {
  id: 'op-troops', act: 3, issue: '07-31 09.00', giver: 'handler',
  title: 'Count the Trains',
  brief: 'WHEN GERMANY MOBILISES HER WESTERN ARMIES WILL CROSS THE RHINE AT COLOGNE STOP WATCH THE HOHENZOLLERN BRIDGE FROM SUNDAY DAWN TO MONDAY EVENING STOP COUNT TRAINS BY HOUR AND DIRECTION STOP TALLY TO LONDON FLUSHING AMSTERDAM OR BRUSSELS BY TUESDAY NIGHT STOP THEY SHOOT SPIES NOW ASHBY',
  steps: [
    { id: 'reach', kind: 'goto', city: 'COL', by: '08-02 12.00', label: 'Reach Cologne by Sunday noon', story: 'op-troops.reach' },
    { id: 'watch', kind: 'observe', city: 'COL', after: '08-02 06.00', by: '08-03 18.00', min: 480,
      label: 'Watch the bridge for eight hours', story: 'op-troops.watch' },
    { id: 'count', kind: 'act', city: 'COL', venue: 'venue:station', by: '08-03 20.00', gives: 'troop-tally',
      label: 'Turn your watch into a tally',
      ways: [
        { id: 'eye', label: 'Write up your own count', sub: 'Honest, partial, done by midnight',
          risk: 0.1, rec: ['sighting', 0.2], ok: [['debrief', 'Your tally was your own count: honest, partial, written by candlelight.']] },
        { id: 'memory', label: 'Keep the count in your head', sub: 'Nothing on paper until you are out',
          if: [['skill', 'observation', '>=', 2]], risk: 0.05, rec: null,
          ok: [['standing', 3], ['debrief', 'You carried the count in your head and wrote it out only across the frontier.']] },
        { id: 'glasses', label: "Read the wagons' chalk through glasses", sub: 'Regiments as well as trains; glasses at a bridge',
          tag: 'topic:military', if: [['item', 'field-glasses']], risk: 0.25, rec: ['sighting', 0.5],
          ok: [['standing', 3], ['debrief', 'Through field glasses you read the regiments chalked on the wagons.']],
          fail: [['nerve', -2], ['susp', 'active', 0.2]] },
        { id: 'kessel', label: 'Let Kessel boast over dinner', sub: 'He remembers faces; yours among them',
          if: [['trust', 'kessel', '>=', 1]], risk: 0.2, rec: ['meeting', 0.5], story: 'op-troops.kessel' },
        { id: 'clerk', label: "Buy the dispatcher's sheet", sub: '£15; exact figures, and a bribe he may confess',
          tag: 'topic:railways', cost: { money: 15 }, risk: 0.35, rec: ['bribe', 0.7],
          ok: [['standing', 5], ['debrief', "You bought the dispatcher's sheet: every train, to the minute."]],
          fail: [['nerve', -2], ['susp', 'active', 0.25]] },
        { id: 'tower', label: 'Count from the cathedral tower', sub: 'The sacristan lets a religious climb',
          tag: 'topic:religion', if: [['aff', 'topic:religion', '>=', 1]], risk: 0.05, rec: null,
          ok: [['standing', 2], ['debrief', 'You counted the trains from the cathedral tower, among the jackdaws.']] },
      ] },
    { id: 'out', kind: 'carry', item: 'troop-tally', to: ['LON', 'FLU', 'AMS', 'BRU'], by: '08-04 23.00',
      label: 'Tally to London or the Low Countries' },
  ],
  twists: [
    { if: [['op', 'op-troops', 'reach'], ['not', ['op', 'op-troops', 'out']], ['city', 'COL'], ['chance', 0.5]], story: 'op-troops.spies' },
    { if: [['op', 'op-troops', 'reach'], ['not', ['op', 'op-troops', 'count']], ['city', 'COL'], ['not', ['st', 'kessel', 'unknown']], ['trust', 'kessel', '<', 1]],
      story: 'op-troops.kessel-sees' },
    { if: [['op', 'op-troops', 'count'], ['not', ['op', 'op-troops', 'out']], ['item', 'troop-tally'], ['nation', 'DE'], ['day', '2']],
      story: 'op-troops.border' },
  ],
  win: [['standing', 15], ['money', 20], ['item', '-troop-tally']],
  fail: [['standing', -12]],
  debrief: 'Between the second and the eighteenth of August some two thousand trains crossed the Hohenzollern bridge, nearly all of them westward. Your tally of the first two days showed the direction before anybody had to guess: Aachen, Liège, Belgium. Nobody in London was surprised, because of you. Nobody in London could change anything, either.',
};
