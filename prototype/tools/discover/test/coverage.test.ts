import { describe, expect, it } from 'vitest';
import { parseCoverage, renderCoverage } from '../coverage.ts';
import { parseCsv } from '../../keying/csv.ts';

const CSV = `edition_id,segment_id,status,pages,table_refs,notes
bradshaw-cont-1914-06,berlin-petersburg,full,412-413,57;60,
bradshaw-cont-1914-06,london-paris,partial,101,12,"night boat train only; day services on p. 99, missing"
bradshaw-cont-1914-03,berlin-petersburg,restricted,,,"HathiTrust pdus"
chaix-1914-06,paris-brussels,missing,,,
`;

describe('coverage matrix', () => {
  it('renders an edition × segment matrix with pages, tables, summaries and notes', () => {
    const { rows, errors } = parseCoverage(parseCsv(CSV).rows);
    expect(errors).toEqual([]);
    const md = renderCoverage(rows, { segments: ['london-paris'], tierA: ['berlin-petersburg', 'london-paris'] });
    expect(md).toContain('| Edition | london-paris | berlin-petersburg | paris-brussels |');
    expect(md).toContain('| bradshaw-cont-1914-06 | ◐ partial<br>pp. 101<br>T 12 | ● full<br>pp. 412-413<br>T 57;60 | · |');
    expect(md).toContain('| bradshaw-cont-1914-03 | · | ⊘ restricted | · |');
    expect(md).toContain('| bradshaw-cont-1914-06 | 1 | 1 | 0 | 0 | 1 | 1/2 (50%) |');
    expect(md).toContain('- **bradshaw-cont-1914-06 × london-paris** (partial): night boat train only; day services on p. 99, missing');
    expect(renderCoverage(rows)).toBe(renderCoverage([...rows].reverse()));
  });

  it('marks editions meeting the 90% tier-A gate', () => {
    const { rows } = parseCoverage(parseCsv(CSV).rows);
    expect(renderCoverage(rows, { tierA: ['berlin-petersburg'] })).toContain('1/1 (100%) ✓ G1');
  });

  it('rejects unknown statuses and duplicates', () => {
    const bad = parseCoverage(parseCsv('edition_id,segment_id,status,pages,table_refs,notes\ne,s,ful,,,\ne,t,full,,,\ne,t,missing,,,\n').rows);
    expect(bad.errors).toHaveLength(2);
    expect(bad.errors[0]).toMatch(/status "ful"/);
    expect(bad.errors[1]).toMatch(/duplicate e × t/);
  });

  it('renders an empty matrix note', () => {
    expect(renderCoverage([])).toContain('_No coverage rows yet._');
  });
});
