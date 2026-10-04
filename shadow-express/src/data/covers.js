// Cover identities (owner: Ops). See docs/CONTRACTS.md §4 and docs/REGISTRY.md §5.
// aff: 1 fits · 0 odd · -1 implausible. Unlisted tags are odd (0), except station hotel cafe market church telegraph, which fit everyone.

export default [
  {
    id: 'hale', nation: 'GB', cls: 2,
    man: { name: 'Edmund Hale', legend: 'wine merchant of Bristol' },
    woman: { name: 'Margaret Hale', legend: 'widow running the family wine house' },
    papers: 0.8, backstopH: 72,
    aff: {
      'venue:docks': 1, 'venue:market': 1, 'venue:bank': 1, 'venue:bazaar': 1,
      'topic:shipping': 1, 'topic:trade': 1, 'topic:finance': 1, 'topic:railways': 1,
      'item:port-wine': 1, 'item:tokaji': 1, 'item:champagne': 1,
      'venue:barracks': -1, 'venue:fortress': -1, 'venue:observatory': -1,
      'topic:military': -1, 'topic:technical': -1, 'topic:diplomatic': -1,
    },
    props: ['port-wine'], unlock: null,
    blurb: 'A Bristol wine merchant has every reason to haunt docks, markets and bonded warehouses, and none at all to be found near a barracks or a rangefinder.',
  },
  {
    id: 'weiss', nation: 'CH', cls: 2,
    man: { name: 'Carl Weiss', legend: 'traveller in optical instruments for a Zurich firm' },
    woman: { name: 'Clara Weiss', legend: 'correspondent of a Zurich optical firm' },
    papers: 0.85, backstopH: 18,
    aff: {
      'venue:factory': 1, 'venue:observatory': 1, 'venue:university': 1, 'venue:bank': 1,
      'topic:technical': 1, 'topic:railways': 1, 'topic:trade': 1,
      'item:field-glasses': 1, 'item:vest-camera': 1, 'item:swiss-watches': 1,
      'venue:barracks': -1, 'venue:embassy': -1, 'venue:ministry': -1, 'venue:fortress': -1,
      'topic:military': -1, 'topic:diplomatic': -1, 'topic:naval': -1,
    },
    props: ['field-glasses'], unlock: null,
    blurb: 'Swiss papers pass every frontier with a nod, and an optics traveller may tour any works; but Zurich answers a telegram in hours, and soldiers distrust salesmen.',
  },
  {
    id: 'marchand', nation: 'FR', cls: 2,
    man: { name: 'Henri Marchand', legend: "correspondent of L'Écho du Soir" },
    woman: { name: 'Héloïse Marchand', legend: "correspondent of L'Écho du Soir" },
    papers: 0.7, backstopH: 36,
    aff: {
      'venue:press': 1, 'venue:ministry': 1, 'venue:embassy': 1, 'venue:opera': 1, 'venue:university': 1,
      'topic:political': 1, 'topic:diplomatic': 1, 'topic:press': 1, 'topic:society': 1, 'topic:police': 1, 'topic:arts': 1,
      'item:vest-camera': 1,
      'venue:barracks': -1, 'venue:fortress': -1, 'venue:observatory': -1, 'topic:technical': -1,
    },
    props: ['vest-camera'], unlock: 'person:novak',
    blurb: 'A Paris correspondent may put impertinent questions to ministers and haunt any legation; after the ultimatum, German and Austrian police open every French correspondent\'s letters.',
  },
  {
    id: 'doyle', nation: 'GB', cls: 3,
    man: { name: 'Father Anselm Doyle SJ', legend: 'Irish Jesuit scholar of Continental church archives' },
    woman: { name: 'Sister Bridget Doyle', legend: 'Irish nursing sister travelling between convent hospitals' },
    papers: 0.75, backstopH: 120,
    aff: {
      'venue:archive': 1, 'venue:hospital': 1, 'venue:university': 1, 'venue:prison': 1,
      'topic:religion': 1, 'topic:medicine': 1, 'topic:arts': 1, 'item:blessing-letter': 1,
      'venue:club': 0, 'venue:barracks': 0,
      'venue:opera': -1, 'topic:military': -1, 'topic:naval': -1, 'topic:finance': -1, 'topic:underworld': -1,
      'item:browning': -1, 'item:diamonds': -1,
    },
    props: ['blessing-letter'], unlock: 'person:agathe',
    blurb: 'Nobody searches a priest\'s or a nursing sister\'s bag, and archives, hospitals and prisons open to a religious; clubs and barracks find one odd, the opera worse.',
  },
  {
    id: 'vessey', nation: 'AH', cls: 1,
    man: { name: 'Count Pál Vészy', legend: 'Hungarian count of small estates and large debts' },
    woman: { name: 'Countess Ilona Vészy', legend: 'Hungarian countess of small estates and large debts' },
    papers: 0.8, backstopH: 48,
    aff: {
      'venue:embassy': 1, 'venue:club': 1, 'venue:opera': 1, 'venue:barracks': 1, 'venue:ministry': 1,
      'topic:society': 1, 'topic:military': 1, 'topic:diplomatic': 1, 'topic:political': 1,
      'item:tokaji': 1, 'item:opera-tickets': 1,
      'venue:market': 0,
      'venue:docks': -1, 'venue:bazaar': -1, 'venue:factory': -1, 'topic:trade': -1, 'topic:underworld': -1, 'class:3': -1,
    },
    props: ['tokaji', 'opera-tickets'], unlock: 'op:op-diamonds',
    blurb: 'A Hungarian title opens embassies, clubs, opera boxes and officers\' messes, but demands first class; after the declarations, Paris and London will intern its bearer.',
  },
];
