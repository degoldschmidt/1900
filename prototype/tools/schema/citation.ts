/**
 * Citation strings and design-value ids.
 *
 * A citation names where a value was read:
 *
 *   <source_id>:p<page_seq>:<table_ref or ->:<crop_id or ->:<cell or ->
 *
 * e.g. "BCG1914-06:p412:T254:T254-a:c3r12". No part may contain a colon or whitespace. Cell
 * references follow the keying tools (tools/keying/longcsv.ts): c<col>r<row> (a body cell),
 * h<line>c<col> (a header cell), l<subcol>r<row> (a label cell), f<n> (a footnote line). The
 * normaliser also writes c<col>r<row>-<row2> for a stop whose arrival and departure times are
 * printed on two lines of the same column.
 *
 * A design-value id is "DV-" followed by three or more digits, defined in
 * data/design/DESIGN_VALUES.md.
 */

export interface CitationRef {
  source: string;
  pageSeq: number;
  tableRef: string | null;
  crop: string | null;
  cell: string | null;
}

const CITE_RE = /^([^:\s]+):p(\d+):([^:\s]+):([^:\s]+):([^:\s]+)$/;
const DV_RE = /^DV-(?:C\d{2}-)?\d{3,}$/;

export const isDvId = (s: string): boolean => DV_RE.test(s);

const orNull = (s: string): string | null => (s === '-' ? null : s);

export function parseCitation(s: string): CitationRef | null {
  const m = CITE_RE.exec(s.trim());
  if (!m) return null;
  const pageSeq = Number(m[2]);
  if (pageSeq < 1) return null;
  return { source: m[1]!, pageSeq, tableRef: orNull(m[3]!), crop: orNull(m[4]!), cell: orNull(m[5]!) };
}

export function formatCitation(c: CitationRef): string {
  return `${c.source}:p${c.pageSeq}:${c.tableRef ?? '-'}:${c.crop ?? '-'}:${c.cell ?? '-'}`;
}

export interface CellRef {
  kind: 'cell' | 'header' | 'label' | 'footnote';
  col: number;
  /** First row (header: line; footnote: order). */
  row: number;
  /** Last row (equal to row except for c<col>r<row>-<row2>). */
  row2: number;
}

export function parseCellRef(s: string): CellRef | null {
  let m = /^c(\d+)r(\d+)(?:-(\d+))?$/.exec(s);
  if (m) {
    const row = Number(m[2]); const row2 = m[3] === undefined ? row : Number(m[3]);
    return row2 >= row ? { kind: 'cell', col: Number(m[1]), row, row2 } : null;
  }
  m = /^h(\d+)c(\d+)$/.exec(s);
  if (m) return { kind: 'header', col: Number(m[2]), row: Number(m[1]), row2: Number(m[1]) };
  m = /^l(\d+)r(\d+)$/.exec(s);
  if (m) return { kind: 'label', col: Number(m[1]), row: Number(m[2]), row2: Number(m[2]) };
  m = /^f(\d+)$/.exec(s);
  if (m) return { kind: 'footnote', col: 0, row: Number(m[1]), row2: Number(m[1]) };
  return null;
}

export function formatCellRef(c: CellRef): string {
  switch (c.kind) {
    case 'cell': return c.row2 === c.row ? `c${c.col}r${c.row}` : `c${c.col}r${c.row}-${c.row2}`;
    case 'header': return `h${c.row}c${c.col}`;
    case 'label': return `l${c.col}r${c.row}`;
    case 'footnote': return `f${c.row}`;
  }
}

/**
 * True when citation `outer` (e.g. a stop's src, possibly a two-line range) covers the single
 * cell named by `inner`: same source, page, table and crop, and the cell lies within the range.
 * Body cells are matched by column and row regardless of crop when both crops are given and
 * differ, because overlapping crops show the same printed cell.
 */
export function citationCovers(outer: string, inner: string): boolean {
  if (outer === inner) return true;
  const a = parseCitation(outer); const b = parseCitation(inner);
  if (!a || !b || a.source !== b.source || a.pageSeq !== b.pageSeq || a.tableRef !== b.tableRef) return false;
  if (!a.cell || !b.cell) return false;
  const ca = parseCellRef(a.cell); const cb = parseCellRef(b.cell);
  if (!ca || !cb || ca.kind !== cb.kind) return false;
  if (ca.kind !== 'cell' && a.crop !== b.crop) return false;
  return ca.col === cb.col && cb.row >= ca.row && cb.row2 <= ca.row2;
}
