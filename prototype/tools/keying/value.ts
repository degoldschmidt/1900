/**
 * The value of a keyed reading: what the data means, with typography removed (decision P-003, P-005).
 * Shared by the keyer diff (tools/keying/diff.ts: two readings with the same value disagree only in
 * typography) and the synthetic-page scorer (tools/synth/score.ts: value error rate).
 *
 * Typography, i.e. dropped or made equal:
 * - the separator printed between figures (space, point, raised point, colon, comma);
 * - spacing around a hyphen or en dash (`Wien - Berlin`, `Wien-Berlin`; a hyphen itself is value),
 *   and after an abbreviation point (`F. J. B.`, `F.J.B.`; the point itself is value);
 * - italic and small capitals; bold outside body cells (emphasis on station names and train numbers);
 * - in labels, leader dots after the name (`.`, `. .`, `...`, `…`, or none at all);
 * - in labels, a footnote sign printed after the station name as a word of its own (`Bodenbach □`):
 *   whether the keyer wrote it in the text or as the mark `fn:□`, the value is the same sign.
 * Value, i.e. kept: every letter and digit, bold on a body cell (p.m. in many guides), underlining
 * (night minutes in the German Kursbücher), footnote and column marks.
 *
 * Which type styles carry meaning on body cells is a property of the guide, so a guide's notation
 * file may declare it (`valueMarks`, decision P-010): Fritzsches Kursbuch 1914 gives meaning to
 * underlined minutes (night) and italic figures (express trains) and none to bold. Without a
 * declaration the default above applies.
 */
import { canonicalMarks, marksString, type KeyedCell, type Kind } from './longcsv.ts';

export const TYPOGRAPHIC_MARKS: ReadonlySet<string> = new Set(['i', 'sc']);

/** Type-style marks; any other mark (fn:…, c:…) is always value. */
export const STYLE_MARKS: ReadonlySet<string> = new Set(['b', 'i', 'u', 'sc']);

export interface ValueRules {
  /** Style marks that carry meaning on body cells. Outside body cells only underlining does. */
  cellStyleMarks: ReadonlySet<string>;
}

export const DEFAULT_RULES: ValueRules = { cellStyleMarks: new Set(['b', 'u']) };

/** Rules from a guide's notation file: `valueMarks` lists the style marks with meaning in its tables. */
export function rulesFromNotation(n: { valueMarks?: readonly string[] | undefined } | null | undefined): ValueRules {
  return n?.valueMarks ? { cellStyleMarks: new Set(n.valueMarks) } : DEFAULT_RULES;
}

function keepMark(m: string, kind: Kind, rules: ValueRules): boolean {
  if (!STYLE_MARKS.has(m)) return true;
  return kind === 'cell' ? rules.cellStyleMarks.has(m) : m === 'u';
}

/** Characters that never count as a footnote sign standing after a station name. */
const NOT_A_SIGN = new Set([...'.,:;?\'"/\\&〃…·‚„“”‘’']);

/** A whitespace-separated word that is a single footnote-like sign (□ ● ○ • ◗ § † ‡ * ! °). */
export function isSignWord(w: string): boolean {
  const cps = [...w];
  return cps.length === 1 && /[\p{So}\p{Po}]/u.test(w) && !NOT_A_SIGN.has(w);
}

/**
 * Removes leader dots at the end of a label: a run of `.`, `…` or `·` after a space or after a sign,
 * and any `…`/`·` run. A full stop directly after a letter or digit is an abbreviation (`Hbf.`) and stays.
 */
export function stripLeaders(text: string): string {
  let s = text;
  for (;;) {
    const m = /^(.*?)(\s*)([.…·]+)$/u.exec(s);
    if (!m) return s;
    const head = m[1]!; const space = m[2]!; const dots = m[3]!;
    const afterWord = space === '' && /[\p{L}\p{N}]$/u.test(head);
    if (afterWord && /^\.+$/.test(dots)) return s; // an abbreviation's full stop
    // "Wettinerstr.…": keep the abbreviation's stop, drop the leader.
    const next = (afterWord && dots.startsWith('.') ? `${head}.` : head).trimEnd();
    if (next === s) return s;
    s = next;
  }
}

/** A label's text without leader dots, and the footnote signs printed after the name as words. */
export function labelValue(text: string): { text: string; signs: string[] } {
  const words = stripLeaders(text).split(' ').filter(Boolean);
  const signs: string[] = [];
  const rest: string[] = [];
  for (const w of words) {
    // "□." is a sign followed directly by leader dots.
    const bare = w.length > 1 ? stripLeaders(w) : w;
    if (isSignWord(bare)) signs.push(bare); else rest.push(w);
  }
  return { text: stripLeaders(rest.join(' ')), signs };
}

export interface Value { text: string; marks: string }

/** The value of a reading as separate text and marks. */
export function valueParts(c: Pick<KeyedCell, 'text' | 'marks'>, kind: Kind = 'cell', rules: ValueRules = DEFAULT_RULES): Value {
  let text = c.text;
  let marks = c.marks.filter((m) => keepMark(m, kind, rules));
  if (kind === 'label') {
    const l = labelValue(text);
    text = l.text;
    marks = canonicalMarks([...marks, ...l.signs.map((s) => `fn:${s}`)]);
  }
  text = text.replace(/(?<=\d)[\s.·:,]+(?=\d)/g, ' ').replace(/\s*([-–])\s*/g, '$1').replace(/\.\s+/g, '.');
  return { text, marks: marksString(marks) };
}

/** The value of a reading as one comparable string. */
export function valueOf(c: Pick<KeyedCell, 'text' | 'marks'>, kind: Kind = 'cell', rules: ValueRules = DEFAULT_RULES): string {
  const v = valueParts(c, kind, rules);
  return `${v.text}\u0000${v.marks}`;
}

/** True when two readings differ at most in typography. */
export function sameValue(a: Pick<KeyedCell, 'text' | 'marks'>, b: Pick<KeyedCell, 'text' | 'marks'>, kind: Kind, rules: ValueRules = DEFAULT_RULES): boolean {
  return valueOf(a, kind, rules) === valueOf(b, kind, rules);
}
