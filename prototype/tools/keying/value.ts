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
 * file may declare it (`valueMarks`, decision P-010). Without a declaration the default above applies.
 * A guide that reads a train's category from a type style (notation `category.marks`, e.g. italic
 * figures for a Schnellzug in Fritzsches Kursbuch) has it keyed once, on the column's train-number
 * header cell (decision P-013): on header cells those marks are value. Fritzsches Kursbuch 1914
 * therefore declares `valueMarks: ["u"]` (italic on body cells is typography; the category comes
 * from the header) and `category.marks: {"i": …}`.
 *
 * Signs (decision P-013): a doubled or stacked sign (two small rings printed together) is one sign,
 * written twice without a space (`fn:°°`); a keyer who writes the same sign twice as two marks
 * (`fn:°;fn:°`) means the same and longcsv.ts reads it as `fn:°°`. Look-alike characters for one
 * printed sign (`º`, `˚` for the small ring `°`; `◯` for the large ring `○`; `☐` for `□`) have the
 * same value; the small ring `°` and the large ring `○` are different signs.
 */
import { canonicalMarks, marksString, type KeyedCell, type Kind } from './longcsv.ts';

export const TYPOGRAPHIC_MARKS: ReadonlySet<string> = new Set(['i', 'sc']);

/** Type-style marks; any other mark (fn:…, c:…) is always value. */
export const STYLE_MARKS: ReadonlySet<string> = new Set(['b', 'i', 'u', 'sc']);

export interface ValueRules {
  /** Style marks that carry meaning on body cells. */
  cellStyleMarks: ReadonlySet<string>;
  /** Style marks that carry meaning on header cells: underlining, and the guide's category marks. Elsewhere only underlining does. */
  headerStyleMarks: ReadonlySet<string>;
}

export const DEFAULT_RULES: ValueRules = { cellStyleMarks: new Set(['b', 'u']), headerStyleMarks: new Set(['u']) };

/**
 * Rules from a guide's notation file: `valueMarks` lists the style marks with meaning on body cells;
 * the style marks of `category.marks` (a train category read from the column's header) have meaning
 * on header cells.
 */
export function rulesFromNotation(n: { valueMarks?: readonly string[] | undefined; category?: { marks?: Record<string, string> } | undefined } | null | undefined): ValueRules {
  const catMarks = Object.keys(n?.category?.marks ?? {}).filter((m) => STYLE_MARKS.has(m));
  if (!n || (!n.valueMarks && catMarks.length === 0)) return DEFAULT_RULES;
  return {
    cellStyleMarks: n.valueMarks ? new Set(n.valueMarks) : DEFAULT_RULES.cellStyleMarks,
    headerStyleMarks: new Set(['u', ...catMarks]),
  };
}

function keepMark(m: string, kind: Kind, rules: ValueRules): boolean {
  if (!STYLE_MARKS.has(m)) return true;
  if (kind === 'cell') return rules.cellStyleMarks.has(m);
  if (kind === 'header') return rules.headerStyleMarks.has(m);
  return m === 'u';
}

/** Characters that print the same sign: look-alikes → the character the briefs ask for. */
export const SIGN_VARIANTS: Readonly<Record<string, string>> = {
  'º': '°', '˚': '°', '∘': '°', '◦': '°',
  '◯': '○', '⚪': '○', '⚬': '○',
  '☐': '□', '◻': '□', '▢': '□',
  '◼': '■', '▪': '■',
  '⚫': '●', '⬤': '●',
  '✕': '×', '╳': '×',
};

/** A sign with its look-alike characters replaced (`º` → `°`); other characters unchanged. */
export function canonicalSign(s: string): string {
  return [...s].map((ch) => SIGN_VARIANTS[ch] ?? ch).join('');
}

/** A footnote or column mark with look-alike sign characters made equal (`fn:º` → `fn:°`). */
function markValue(m: string): string {
  return m.startsWith('fn:') ? `fn:${canonicalSign(m.slice(3))}` : m;
}

/** Characters that never count as a footnote sign standing after a station name. */
const NOT_A_SIGN = new Set([...'.,:;?\'"/\\&〃…·‚„“”‘’']);

/**
 * A whitespace-separated word that is a single footnote-like sign (□ ● ○ • ◗ § † ‡ * ! °), or such a
 * sign doubled (`°°`, `□□`: two signs printed together are one sign, decision P-013).
 */
export function isSignWord(w: string): boolean {
  const cps = [...w];
  if (cps.length === 2 && cps[0] === cps[1]) return isSignWord(cps[0]!);
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
  marks = canonicalMarks(marks.map(markValue));
  // A cell holding only signs: look-alikes made equal, and a doubled sign written with or without a space.
  if (text !== '' && [...text.replace(/\s+/g, '')].every((ch) => isSignWord(ch))) text = canonicalSign(text.replace(/\s+/g, ''));
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
