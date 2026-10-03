/**
 * Money in integer minor units. Pounds are counted in farthings (£1 = 20s = 240d = 960 farthings);
 * francs in centimes; marks in pfennig; gulden in cents; kronen in heller; roubles in kopecks.
 * Conversion uses exact rational parities (BigInt) taken from cited parameter rows.
 */
export type Currency = 'GBP' | 'FRF' | 'BEF' | 'CHF' | 'DEM' | 'NLG' | 'AUK' | 'RUB' | 'USD';

export interface Money { cur: Currency; minor: number }

export const MINOR_PER_UNIT: Record<Currency, number> = { GBP: 960, FRF: 100, BEF: 100, CHF: 100, DEM: 100, NLG: 100, AUK: 100, RUB: 100, USD: 100 };

export const money = (cur: Currency, minor: number): Money => {
  if (!Number.isSafeInteger(minor)) throw new Error(`Money must be an integer number of minor units, got ${minor}`);
  return { cur, minor };
};

/** £sd → farthings: lsd(2, 3, 6) = £2 3s 6d; `farthings` adds ¼d units (2 = ½d). */
export const lsd = (pounds: number, shillings = 0, pence = 0, farthings = 0): Money =>
  money('GBP', pounds * 960 + shillings * 48 + pence * 4 + farthings);

function same(a: Money, b: Money): void {
  if (a.cur !== b.cur) throw new Error(`Currency mismatch: ${a.cur} vs ${b.cur}`);
}
export const add = (a: Money, b: Money): Money => { same(a, b); return money(a.cur, a.minor + b.minor); };
export const sub = (a: Money, b: Money): Money => { same(a, b); return money(a.cur, a.minor - b.minor); };
export const times = (a: Money, k: number): Money => {
  if (!Number.isInteger(k)) throw new Error('Multiply money by integers only');
  return money(a.cur, a.minor * k);
};
export const compare = (a: Money, b: Money): number => { same(a, b); return a.minor - b.minor; };

/** A parity: `num` minor units of `to` per `den` minor units of `from`. */
export interface Parity { from: Currency; to: Currency; num: number; den: number }

/** Exact conversion with round-half-up (away from zero for negatives). */
export function convert(m: Money, p: Parity): Money {
  if (m.cur !== p.from) throw new Error(`Parity ${p.from}>${p.to} cannot convert ${m.cur}`);
  const n = BigInt(m.minor) * BigInt(p.num);
  const d = BigInt(p.den);
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const q = (abs * 2n + d) / (2n * d);
  return money(p.to, Number(neg ? -q : q));
}

const SYMBOL: Record<Currency, [string, string]> = {
  GBP: ['£', ''], FRF: ['', ' fr.'], BEF: ['', ' fr.'], CHF: ['', ' fr.'], DEM: ['', ' M.'], NLG: ['fl. ', ''], AUK: ['', ' K.'], RUB: ['', ' rbl.'], USD: ['$', ''],
};

/** "£2 3s. 6½d." style for pounds; decimal with the period's abbreviation for the rest. */
export function format(m: Money): string {
  const neg = m.minor < 0;
  const abs = Math.abs(m.minor);
  let body: string;
  if (m.cur === 'GBP') {
    const pounds = Math.floor(abs / 960);
    const rest = abs - pounds * 960;
    const shillings = Math.floor(rest / 48);
    const farth = rest - shillings * 48;
    const pence = Math.floor(farth / 4);
    const frac = ['', '¼', '½', '¾'][farth - pence * 4]!;
    const parts: string[] = [];
    if (pounds) parts.push(`£${pounds}`);
    if (shillings || (pounds && (pence || frac))) parts.push(`${shillings}s.`);
    if (pence || frac || parts.length === 0) parts.push(`${pence}${frac}d.`);
    body = parts.join(' ');
  } else {
    const per = MINOR_PER_UNIT[m.cur];
    const whole = Math.floor(abs / per);
    const cents = String(abs - whole * per).padStart(2, '0');
    const [pre, post] = SYMBOL[m.cur];
    body = `${pre}${whole}.${cents}${post}`;
  }
  return neg ? `−${body}` : body;
}
