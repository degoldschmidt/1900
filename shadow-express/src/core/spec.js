// The vocabularies of the data language: one table drives both the validator and the interpreter.
// Argument types are checked in core/schema.js; see docs/CONTRACTS.md for their meaning.

export const NATIONS = ['GB', 'FR', 'DE', 'AH', 'RU', 'IT', 'CH', 'NL', 'BE', 'DK', 'SE', 'ES', 'PT', 'RS', 'RO', 'GR', 'OT', 'BG', 'LU', 'US'];
export const STATUSES = ['unknown', 'met', 'cultivated', 'recruited', 'compromised', 'arrested', 'dead', 'turned'];
export const RECORD_KINDS = ['register', 'frontier', 'berth', 'list', 'wire', 'sighting', 'bribe', 'meeting', 'photo'];
export const STORY_AT = ['city', 'train', 'op', 'interlude', 'control', 'encounter', 'person', 'then'];
export const MODES = ['rail', 'ferry', 'sea', 'road'];
export const SERVICE_KINDS = ['express', 'mail', 'night', 'slow', 'steamer', 'coach', 'path'];
export const CHECKS = ['onboard', 'station', 'none'];
export const WORLD_STATES = ['peace', 'tension', 'war'];
export const BLOCS = ['central', 'entente', 'neutral'];
export const ITEM_FNS = ['trade', 'gift', 'prop', 'access', 'tool', 'doc', 'companion'];
export const ITEM_USES = ['camera', 'keys', 'guide', 'binoculars', 'credit', 'nerve', 'lining', 'pouch'];
export const STEP_KINDS = ['goto', 'act', 'meet', 'wait', 'carry', 'observe'];
export const CMP = ['>', '>=', '<', '<=', '==', '!='];
export const LOYALTIES = ['self', 'bureau', 'cause']; // or 'enemy:<hunterId>'
export const PERKS = ['safehouse', 'papers', 'warn', 'courier', 'intel'];
export const SOURCES = ['seen', 'porter', 'paper', 'bureau', 'rumour', 'police', 'guide']; // or 'person:<id>'
export const CLAIMS = ['at', 'heading', 'loyal', 'closed', 'knows', 'note'];
export const KNOWS = ['name', 'desc', 'photo'];
export const HATS = ['none', 'bowler', 'top', 'cap', 'boater', 'fez', 'veil', 'kepi', 'wide'];
export const HAIR = ['short', 'long', 'bun', 'bald'];
export const BEARDS = ['none', 'moustache', 'full', 'goatee'];
export const COLLARS = ['lace', 'stiff', 'uniform', 'cassock', 'fur'];
export const AGES = ['young', 'mid', 'old'];
export const WANTS = ['money', 'safety', 'revenge', 'love', 'cause', 'fame', 'debt', 'family', 'escape', 'faith', 'career', 'thrill'];

/** Plausibility tags: `venue:x`, `topic:x`, `item:<itemId>`, `class:1|2|3`. */
export const VENUES = ['station', 'hotel', 'cafe', 'market', 'church', 'telegraph', 'docks', 'ministry', 'embassy', 'barracks',
  'factory', 'opera', 'club', 'press', 'bank', 'hospital', 'university', 'archive', 'prison', 'observatory', 'fortress', 'bazaar'];
export const TOPICS = ['military', 'naval', 'diplomatic', 'political', 'shipping', 'trade', 'finance', 'technical', 'religion',
  'arts', 'society', 'police', 'railways', 'press', 'medicine', 'underworld'];
export const TAG_PREFIXES = ['venue', 'topic', 'item', 'class'];

/** A cover's affinity for a tag it does not list: these venues are open to anyone; everything else is odd (0). */
export const DEFAULT_AFF = { 'venue:station': 1, 'venue:hotel': 1, 'venue:cafe': 1, 'venue:market': 1, 'venue:church': 1, 'venue:telegraph': 1 };
/** Travelling in class c under a cover of class cls: 1 if it matches, 0 one class off, -1 two off (a count in third is noticed). */
export const classAff = (cls, c) => [1, 0, -1][Math.abs(cls - c)];

/** Conditions: name → argument types (see checkArg in schema.js). */
export const CONDS = {
  city: ['city'], nation: ['nation'], act: ['actArgs'],
  st: ['person', 'status'], trust: ['person', 'cmp', 'num'], loyal: ['person', 'loyalty'],
  item: ['item'], cover: ['cover'], aff: ['tag', 'cmp', 'num'], sex: ['sex'],
  flag: ['flag'], not: ['cond'], any: ['cond+'], op: ['op', 'step?'], tailed: [],
  clock: ['clock', 'clock'], day: ['days'], chance: ['prob'],
  money: ['cmp', 'num'], nerve: ['cmp', 'num'], standing: ['cmp', 'num'],
  mode: ['mode'], kind: ['skind'], class: ['cls'],
  state: ['nation', 'wstate'], war: ['nation', 'nation'], hunter: ['hunter', 'here'],
};

/** Effects: name → argument types. */
export const EFFECTS = {
  money: ['num'], nerve: ['num'], standing: ['num'], min: ['num'],
  trust: ['person', 'num'], st: ['person', 'status'],
  flag: ['flagSet'], unflag: ['flag'], item: ['itemDelta'],
  intel: ['intelObj'], record: ['rkind', 'prob'], susp: ['coverOrActive', 'num'],
  expose: ['person', 'prob'], plant: ['plantObj'],
  cover: ['coverDelta'], papers: ['coverOrActive', 'num'],
  op: ['op', 'opAction'], later: ['hours', 'story'], delay: ['num'],
  unlock: ['unlockFlag'], debrief: ['str'],
};

/** Calendar effects: name → argument types. */
export const CAL_FX = {
  state: ['nation', 'wstate'], war: ['nation', 'nation'], neutral: ['nation'],
  suspend: ['target', 'timeOrNull', 'timeOrNull'],
  control: ['nationOrFrontier', 'num'], lag: ['nation', 'num'], alien: ['nation', 'nation'],
  credit: ['bool'], hunter: ['hunter', 'bool'], price: ['item', 'city', 'num'],
};

/** Effects that risk something when present (for the "every storylet risks something" rule). */
export const RISKY = new Set(['record', 'susp', 'expose', 'later', 'delay']);
