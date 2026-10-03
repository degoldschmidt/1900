/**
 * The design-value register, data/design/DESIGN_VALUES.md. Each design value is a level-2
 * heading followed by a field list:
 *
 *   ## DV-001 — Pier transfer at Dover
 *   - value: 20
 *   - unit: minutes
 *   - rationale: No printed figure; chosen so the boat train connects as the guide implies.
 *   - used-by: transfers.csv
 *
 * The heading separator may be an em dash, en dash or hyphen. `value` is parsed as JSON when it
 * is valid JSON (numbers, arrays, objects, quoted strings), otherwise kept as text. A field may
 * continue on following indented lines. value, unit and rationale are required; used-by is
 * informational. Text inside fenced code blocks (```), and any section whose heading is not a
 * DV id, is ignored, so the file can document its own format.
 */
import { issue, type Issue } from './issues.ts';

export interface DesignValue {
  id: string;
  name: string;
  value: unknown;
  unit: string;
  rationale: string;
  usedBy: string;
  /** 1-based line of the heading. */
  line: number;
}

const HEAD_RE = /^##\s+(DV-\d{3,})\s+[—–-]\s+(.+?)\s*$/;
const FIELD_RE = /^[-*]\s+([a-z-]+):\s*(.*)$/;
const FIELDS = ['value', 'unit', 'rationale', 'used-by'];

function parseJsonish(s: string): unknown {
  try { return JSON.parse(s) as unknown; } catch { return s; }
}

export function parseDesignValues(text: string, file = 'DESIGN_VALUES.md'): { values: DesignValue[]; issues: Issue[] } {
  const issues: Issue[] = [];
  const values: DesignValue[] = [];
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let cur: { id: string; name: string; line: number; fields: Map<string, string> } | null = null;
  let lastField: string | null = null;
  const flush = () => {
    if (!cur) return;
    const f = cur.fields;
    for (const req of ['value', 'unit', 'rationale']) {
      if (!f.get(req)) issues.push(issue('V02', 'error', `${file}:${cur.line}`, `${cur.id} has no ${req}`));
    }
    if (f.get('value')) {
      values.push({
        id: cur.id, name: cur.name, value: parseJsonish(f.get('value')!), unit: f.get('unit') ?? '',
        rationale: f.get('rationale') ?? '', usedBy: f.get('used-by') ?? '', line: cur.line,
      });
    }
    cur = null;
  };
  lines.forEach((ln, i) => {
    if (/^\s*```/.test(ln)) { inFence = !inFence; return; }
    if (inFence) return;
    if (/^#{1,2}\s/.test(ln)) {
      flush();
      lastField = null;
      const m = HEAD_RE.exec(ln);
      if (m) cur = { id: m[1]!, name: m[2]!, line: i + 1, fields: new Map() };
      else if (/^##\s+DV-/.test(ln)) issues.push(issue('V02', 'error', `${file}:${i + 1}`, `malformed design-value heading (use "## DV-001 — <name>"): ${ln}`));
      return;
    }
    if (!cur) return;
    const fm = FIELD_RE.exec(ln.trim());
    if (fm && /^[-*]/.test(ln)) {
      const key = fm[1]!;
      if (!FIELDS.includes(key)) { issues.push(issue('V02', 'warning', `${file}:${i + 1}`, `${cur.id}: unknown field "${key}"`)); lastField = null; return; }
      if (cur.fields.has(key)) issues.push(issue('V02', 'error', `${file}:${i + 1}`, `${cur.id}: ${key} given twice`));
      cur.fields.set(key, fm[2]!.trim());
      lastField = key;
      return;
    }
    if (lastField && /^\s+\S/.test(ln)) {
      cur.fields.set(lastField, `${cur.fields.get(lastField) ?? ''} ${ln.trim()}`.trim());
      return;
    }
    if (ln.trim() === '') { lastField = null; }
  });
  flush();
  const seen = new Map<string, number>();
  for (const v of values) {
    const prev = seen.get(v.id);
    if (prev !== undefined) issues.push(issue('V02', 'error', `${file}:${v.line}`, `${v.id} is defined twice (first at line ${prev})`));
    else seen.set(v.id, v.line);
  }
  return { values, issues };
}
