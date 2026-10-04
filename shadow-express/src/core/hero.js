// The agent the player makes: name, looks, background, skills, languages, virtues and vices, starting kit.
// Every choice has weight in play: controls, encounters, tails, cultivation, trade, papers, how fast a legend
// settles in a city, how quickly the police notice a foreigner.

import { SKILLS, LANGUAGES } from './spec.js';

export const SKILL_MAX = 3, LANG_MAX = 2, POINTS = 9;

export const SKILL_TEXT = {
  charm: 'People like you, and say more than they meant to.',
  tradecraft: 'Tails, dead letter-boxes, changing names in a crowd.',
  observation: 'You notice the same coat twice, and what a man does with his hands.',
  composure: 'A steady voice when the commissioner reaches your name.',
  paperwork: 'Passports, permits, the look of a genuine stamp.',
  streetwise: 'Porters, touts, smugglers, and what each of them costs.',
  commerce: 'Prices, bills of lading, the talk of the trade.',
  german: 'Germany, Austria, Bohemia; the lingua franca of half the continent.',
  french: 'France, Belgium, the legations, the Levant.',
  italian: 'Italy, Trieste, the Adriatic ports.',
  slavic: 'Serbo-Croat, Czech, Russian: enough to pass, or to listen.',
};

export const BACKGROUNDS = [
  { id: 'vintner', name: 'The wine trade', blurb: 'A Bristol shipper\'s child. You know cellars, quays and the price of everything, and nobody wonders why you travel.',
    covers: ['hale', 'weiss'], money: 50, standing: 50, skills: { commerce: 2, charm: 1 }, langs: { french: 1 }, item: 'port-wine' },
  { id: 'navy', name: 'Half-pay naval officer', blurb: 'Retired early, for reasons the Admiralty keeps to itself. Commander Ashby served with your father.',
    covers: ['hale', 'weiss'], money: 40, standing: 58, skills: { observation: 2, composure: 1 }, langs: { german: 1 }, item: 'field-glasses' },
  { id: 'press', name: 'Foreign correspondent', blurb: 'Ten years of legations, press rooms and other people\'s secrets. You can make a man talk by asking about something else.',
    covers: ['marchand', 'hale'], money: 40, standing: 48, skills: { charm: 1, observation: 1, streetwise: 1 }, langs: { french: 2 }, item: 'bradshaw' },
  { id: 'optician', name: 'Instrument maker', blurb: 'Apprenticed in Jena, employed in Zurich, recruited in London. You read a rangefinder drawing as others read a novel.',
    covers: ['weiss', 'hale'], money: 42, standing: 50, skills: { paperwork: 1, observation: 1, commerce: 1 }, langs: { german: 2 }, item: 'vest-camera' },
  { id: 'society', name: 'Society adventurer', blurb: 'Hunting in Hungary, baccarat in Monte Carlo, debts in four currencies. The Bureau finds your friends useful.',
    covers: ['vessey', 'hale'], money: 70, standing: 45, skills: { charm: 2 }, langs: { german: 1, french: 1 }, item: 'opera-tickets' },
  { id: 'police', name: 'Special Branch, retired', blurb: 'Twelve years watching anarchists in Soho. You know how a watcher thinks, because you were one.',
    covers: ['hale', 'weiss'], money: 38, standing: 52, skills: { tradecraft: 2, streetwise: 1 }, langs: {}, item: 'browning' },
  { id: 'cleric', name: 'Lapsed seminarian', blurb: 'Six years in Rome, then the faith went and the Latin stayed. Sacristans open doors to you that ministries keep shut.',
    covers: ['doyle', 'hale'], money: 35, standing: 50, skills: { composure: 1, paperwork: 1 }, langs: { italian: 2 }, item: 'blessing-letter' },
];

/** Virtues cost nothing but each is a choice; vices give a skill point back. At most two of each. */
export const TRAITS = [
  { id: 'forgettable', kind: 'virtue', name: 'A forgettable face', text: 'Descriptions of you are vague. The enemy learns your looks slowly.' },
  { id: 'iron', kind: 'virtue', name: 'Iron nerves', text: 'You start with more nerve, and a fright costs you less.' },
  { id: 'money', kind: 'virtue', name: 'Private means', text: '£30 more to begin with, and a banker who asks nothing.' },
  { id: 'protege', kind: 'virtue', name: 'Ashby\'s protégé', text: 'The Bureau thinks well of you: more standing to lose.' },
  { id: 'quick', kind: 'virtue', name: 'A quick study', text: 'Your legend settles in a new city half as fast again.' },
  { id: 'nightowl', kind: 'virtue', name: 'Creature of the night', text: 'Hunters find you less often after dark.' },
  { id: 'striking', kind: 'vice', name: 'Striking looks', text: 'People remember you. Descriptions of you are sharp.' },
  { id: 'known', kind: 'vice', name: 'A face on file', text: 'Berlin\'s police photographed you once, years ago. The enemy starts with a description.' },
  { id: 'gambler', kind: 'vice', name: 'A gambler', text: '£15 less to begin with, and cards are hard to refuse.' },
  { id: 'debts', kind: 'vice', name: 'Debts the Bureau knows of', text: 'Less standing to begin with.' },
  { id: 'drink', kind: 'vice', name: 'Fond of drink', text: 'Less nerve to begin with; brandy restores more of it.' },
  { id: 'nervous', kind: 'vice', name: 'A nervous traveller', text: 'Frontier controls cost you nerve.' },
];

export const KIT = [ // starting purchases, paid from the starting purse
  { id: 'bradshaw', price: 2 }, { id: 'vest-camera', price: 12 }, { id: 'field-glasses', price: 9 }, { id: 'lined-valise', price: 7 },
  { id: 'letter-of-credit', price: 5 }, { id: 'browning', price: 8 }, { id: 'skeleton-keys', price: 6 }, { id: 'slivovitz', price: 1 },
];

/** Someone the agent knew before the war: they start with your trust. */
export const FRIENDS = [
  { id: 'brandl', why: 'You took the cure at his sanatorium in 1911, and talked half the night about Freud.' },
  { id: 'platt', why: 'You shared a cab and a bottle with him in Tangier, and he still owes you for both.' },
  { id: 'novak', why: 'He printed a pamphlet for you once, and asked no questions about what was in it.' },
  { id: 'amsler', why: 'Your family has banked with his house for two generations.' },
  { id: 'odile', why: 'She dressed you, or your sister, for three Paris seasons.' },
  { id: 'kessel', why: 'You hunted boar with him in Silesia; he thinks you are a capital fellow.' },
  { id: null, why: 'Nobody. You arrive a stranger everywhere, which has its uses.' },
];

export const AGES = [['young', 'twenty-six'], ['mid', 'thirty-eight'], ['old', 'fifty-one']];
export const BIRTH = [['england', 'England'], ['scotland', 'Scotland'], ['ireland', 'Ireland'], ['wales', 'Wales'], ['abroad', 'born abroad, of British parents']];

/** A default agent for tests and quick starts. */
export function defaultHero(sex = 'm') {
  return {
    first: sex === 'f' ? 'Evelyn' : 'Thomas', last: 'Kemp', sex, age: 'mid', birth: 'england', background: 'vintner',
    portrait: { seed: 501, sex, hat: sex === 'f' ? 'wide' : 'bowler', hair: sex === 'f' ? 'bun' : 'short', beard: sex === 'f' ? 'none' : 'moustache', collar: sex === 'f' ? 'lace' : 'stiff', age: 'mid' },
    skills: { charm: 1, tradecraft: 1, observation: 1, composure: 1, paperwork: 1, streetwise: 0, commerce: 0 }, langs: { german: 1, french: 1, italian: 0, slavic: 0 },
    traits: [], kit: ['bradshaw'], friend: null,
  };
}

/** Points spent and available; and whether a hero is complete. */
export function points(h) {
  const vices = h.traits.filter((t) => TRAITS.find((x) => x.id === t)?.kind === 'vice').length;
  const spent = SKILLS.reduce((a, k) => a + (h.skills[k] ?? 0), 0) + LANGUAGES.reduce((a, k) => a + (h.langs[k] ?? 0), 0);
  return { spent, total: POINTS + vices, left: POINTS + vices - spent };
}
export function kitCost(h, I) { return h.kit.reduce((a, id) => a + (KIT.find((k) => k.id === id)?.price ?? 0), 0); }

/** Skill level including the background's gift, capped. */
export function skill(h, name) {
  if (!h) return 0;
  const bg = BACKGROUNDS.find((b) => b.id === h.background);
  if (LANGUAGES.includes(name)) return Math.min(LANG_MAX, (h.langs?.[name] ?? 0) + (bg?.langs?.[name] ?? 0));
  return Math.min(SKILL_MAX, (h.skills?.[name] ?? 0) + (bg?.skills?.[name] ?? 0));
}
export const has = (h, t) => !!h?.traits?.includes(t);

/** Which language a country is worked in (the educated lingua franca where English will not do). */
export const LANG_OF = { DE: 'german', AH: 'german', CH: 'german', NL: 'german', DK: 'german', SE: 'german', LU: 'german', FR: 'french', BE: 'french', RO: 'french', GR: 'french', OT: 'french', ES: 'french', PT: 'french', IT: 'italian', RS: 'slavic', RU: 'slavic', BG: 'slavic', GB: null, US: null };
/** 0 none, 1 serviceable, 2 fluent; English at home counts as fluent. */
export function tongue(h, nation) { const l = LANG_OF[nation]; return l === null ? 2 : skill(h, l); }

export const fullName = (h) => `${h.first} ${h.last}`.trim();
