import { describe, expect, it } from 'vitest';
import type { Dataset } from '../../schema/dataset.ts';
import { issue } from '../../schema/issues.ts';
import { physicsCells, physicsIssues } from '../physics-queue.ts';

const stop = (service_id: string, seq: number, src: string) => ({ service_id, seq, src }) as unknown as Dataset['t']['stops'][number];
const ds = (stops: ReturnType<typeof stop>[]) => ({ t: { stops } }) as unknown as Dataset;

describe('physics re-read queue', () => {
  it('takes the V03 issues that name a leg or a dwell, and nothing else', () => {
    const got = physicsIssues([
      issue('V03', 'warning', 'service S.1', 'speed 3.0 km/h A→B (seq 1→2) outside rail bounds 8–110'),
      issue('V03', 'error', 'service S.2', 'time goes backwards C→D (seq 3→4): 600 min earlier (check day offsets and zones)'),
      issue('V03', 'warning', 'service S.3', 'dwell of 400 min at E (seq 5)'),
      issue('V03', 'error', 'service S.4', 'negative dwell at F (seq 2): arrives 10:00+0, departs 09:00+0'),
      issue('V03', 'error', 'service S.5', 'first stop G has no departure'),
      issue('V03', 'info', 'service S.6', 'speed not checked H→I (seq 1→2): coordinates missing'),
      issue('V05', 'warning', 'service S.7', 'speed 1.0 km/h (seq 1→2)'),
    ]);
    expect(got.map((g) => `${g.service}:${g.seqs.join('-')}`)).toEqual(['S.1:1-2', 'S.2:3-4', 'S.3:5', 'S.4:2']);
  });

  it('re-reads both stops of a leg, each printed line once, and lists stops it cannot place', () => {
    const d = ds([
      stop('S.1', 1, 'src1:p5:T1:T1-c0-3-r0-9:c2r0'),
      stop('S.1', 2, 'src1:p5:T1:T1-c0-3-r0-9:c2r4-5'), // arrival and departure on two lines: two cells
      stop('S.2', 1, 'src1:p5:T1:T1-c0-3-r0-9:c2r4-5'), // the same cells, named by a second issue
      stop('S.2', 2, 'src1:p5:T1:-:-'),
    ]);
    const items = physicsIssues([
      issue('V03', 'warning', 'service S.1', 'speed 3.0 km/h A→B (seq 1→2) outside rail bounds 8–110'),
      issue('V03', 'warning', 'service S.2', 'speed 200.0 km/h B→C (seq 1→2) outside rail bounds 8–110'),
    ]);
    const { cells, unplaced } = physicsCells(d, items);
    expect(cells.map((c) => `c${c.col}r${c.row}:${c.reasons.length}`)).toEqual(['c2r0:1', 'c2r4:2', 'c2r5:2']);
    expect(cells[0]).toMatchObject({ source_id: 'src1', page_seq: 5, table_ref: 'T1', crop_id: 'T1-c0-3-r0-9' });
    expect(unplaced).toEqual(['S.2 seq 2: no body-cell citation (src1:p5:T1:-:-)']);
    expect(physicsCells(d, items, ['other']).cells).toEqual([]);
  });
});
