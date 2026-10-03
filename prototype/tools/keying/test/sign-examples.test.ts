import { describe, expect, it } from 'vitest';
import type { ResolvedCell } from '../longcsv.ts';
import { FKB_SIGNS, pickExamples } from '../sign-examples.ts';
import { panelForKey } from '../../crops/layout.ts';
import type { Layout } from '../../crops/layout.ts';

const cell = (col: number, row: number, text: string, marks: string[], resolution: ResolvedCell['resolution'] = 'agree', sure: ResolvedCell['sure'] = 'y'): ResolvedCell =>
  ({ crop_id: 'X', kind: 'cell', col, row, text, marks, sure, resolution, note: '' });

describe('sign examples', () => {
  it('picks readable cells carrying each sign, best resolution first and spread over tables', () => {
    const cells = [
      { table: '12', cropId: '12-a', cell: cell(1, 0, '5 45', ['u', 'fn:§'], 'other') },
      { table: '12', cropId: '12-a', cell: cell(5, 0, '8 28', ['fn:§']) },
      { table: '12', cropId: '12-a', cell: cell(6, 0, '8 29', ['fn:§']) },
      { table: '23', cropId: '23-a', cell: cell(2, 0, '4 08', ['fn:§'], 'A') },
      { table: '23', cropId: '23-a', cell: cell(3, 0, '4 0?', ['fn:!'], 'illegible', 'x') },
      { table: '23', cropId: '23-a', cell: cell(4, 0, '7 21', ['u', 'i']) },
      { table: '23', cropId: '23-a', cell: cell(5, 0, '7 22', ['i', 'fn:•']) },
    ];
    const ex = pickExamples(cells, FKB_SIGNS, 2);
    const of = (name: string) => ex.filter((e) => e.sign.name === name).map((e) => `${e.table} c${e.cell.col}`);
    expect(of('section')).toEqual(['12 c5', '23 c2']);
    expect(of('excl')).toEqual([]); // the only ! is illegible
    expect(of('italic')).toEqual(['23 c4']); // a time with another sign is no example of a type style
    expect(of('dot')).toEqual(['23 c5']);
  });

  it('finds the panel of a key by its absolute position', () => {
    const p = (panel: string, page: number, first_col: number, first_row: number) => ({
      panel, page_seq: page, table_bbox: [0, 0, 10, 10], label_bbox: [0, 0, 1, 10], header_bbox: [1, 0, 9, 1],
      col_x: [1, 2, 3], row_y: [1, 2, 3], first_col, first_row,
    }) as Layout['panels'][number];
    const l: Layout = { layout_version: 1, source_id: 's', table_ref: 't', panels: [p('p1', 1, 0, 0), p('p2', 2, 2, 10)] };
    expect(panelForKey(l, { kind: 'cell', col: 3, row: 11 })?.panel).toBe('p2');
    expect(panelForKey(l, { kind: 'header', col: 1, row: 0 })?.panel).toBe('p1');
    expect(panelForKey(l, { kind: 'label', col: 0, row: 10 })?.panel).toBe('p2');
    expect(panelForKey(l, { kind: 'cell', col: 3, row: 0 })).toBeNull();
  });
});
