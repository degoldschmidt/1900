// Coincidence (owner: Ops). See docs/CONTRACTS.md §6 and docs/REGISTRY.md §7.

export default {
  id: 'op-optics', act: 1, issue: '07-03 09.00', giver: 'handler',
  title: 'Coincidence',
  brief: 'FRIEDENAU OPTICAL WORKS HAS NEW COINCIDENCE RANGEFINDER FOR FIELD ARTILLERY STOP DRAWINGS AT WORKS AND GENERAL STAFF TRIALS OFFICE FIFTH TO TENTH ONLY STOP PHOTOGRAPH THEM STOP PLATES TO LONDON BY TWELFTH STOP FALK WATCHES THE WORKS ASHBY',
  steps: [
    { id: 'reach', kind: 'goto', city: 'BER', by: '07-08 12.00', label: 'Reach Berlin by the eighth', story: 'op-optics.reach' },
    { id: 'photo', kind: 'act', city: 'BER', venue: 'venue:factory', after: '07-05 08.00', by: '07-10 18.00', gives: 'rangefinder-plates',
      label: 'Photograph the drawings, fifth to tenth',
      ways: [
        { id: 'visit', label: 'A sales call at the works', sub: "Your legend's own errand, and a visitors' book",
          if: [['aff', 'venue:factory', '>=', 1], ['day', '12345'], ['clock', '08.00', '17.00']],
          risk: 0.15, rec: ['register', 0.5], story: 'op-optics.visit' },
        { id: 'sauer', label: 'Through Fräulein Sauer', sub: 'She types the trials office reports; it will mark her',
          tag: 'venue:cafe', if: [['st', 'sauer', 'recruited']], risk: 0.1, rec: ['meeting', 0.3], story: 'op-optics.sauer' },
        { id: 'draughtsman', label: 'Bribe a draughtsman', sub: '£20 in a Friedenau beer cellar',
          tag: 'topic:technical', cost: { money: 20 }, risk: 0.3, rec: ['bribe', 0.6], story: 'op-optics.draughtsman' },
        { id: 'keys', label: 'The drawing office by night', sub: 'Skeleton keys, a dark lantern, a watchman',
          tag: 'venue:factory', if: [['item', 'skeleton-keys'], ['clock', '22.00', '04.00']],
          risk: 0.35, rec: ['sighting', 0.5], story: 'op-optics.night' },
      ] },
    { id: 'home', kind: 'carry', item: 'rangefinder-plates', to: 'LON', by: '07-12 18.00', label: 'Plates to London by the twelfth' },
  ],
  twists: [
    { if: [['op', 'op-optics', 'photo'], ['not', ['op', 'op-optics', 'home']], ['chance', 0.4]], story: 'op-optics.buyer' },
    { if: [['op', 'op-optics'], ['not', ['op', 'op-optics', 'photo']], ['city', 'BER'], ['not', ['st', 'kessel', 'unknown']], ['chance', 0.35]],
      story: 'op-optics.kessel' },
  ],
  win: [['standing', 12], ['money', 20], ['item', '-rangefinder-plates']],
  fail: [['standing', -15]],
  debrief: "The instrument was real: a coincidence rangefinder with a one-metre base, meant for the field artillery and good enough to put a battery's first salvo on a farmhouse at four miles. The Admiralty's optical men thought it a year ahead of Barr and Stroud. Falk had watched the works since May; he kept a list of every visitor, and he read it every evening.",
};
