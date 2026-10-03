import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runDiff } from '../../keying/diff.ts';
import { mergeCrop } from '../../keying/merge.ts';
import { edit, FN, GRID, setupTable, SOURCE, TABLE, truthGrid, writeKeyer } from '../../keying/test/fixture.ts';
import { buildViews, writeReview } from '../side-by-side.ts';

describe('side-by-side review page', () => {
  it('embeds each crop image beside its resolved grid and highlights resolved, doubtful and illegible cells', async () => {
    const { r, dir } = await setupTable();
    writeKeyer(dir, GRID, 'A', edit(truthGrid(), { 'label:0:1': { sure: 'n' }, 'cell:3:0': { text: '11 0<5' } }));
    writeKeyer(dir, GRID, 'B', edit(truthGrid(), { 'cell:3:0': { text: '11 06' } }));
    runDiff(r, SOURCE, TABLE, { crops: [GRID] });
    writeKeyer(dir, GRID, 'R', `crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note\n${GRID},cell,3,0,11 05,,y,other,both misread the 5\n`);
    expect(mergeCrop(r, SOURCE, TABLE, GRID).errors).toEqual([]);
    writeKeyer(dir, FN, 'A', `crop_id,kind,col,row,text_as_printed,marks,sure\n${FN},footnote,0,0,† Runs on S?? weekdays only.,fn:†,x\n`);

    const out = writeReview(r, SOURCE, TABLE);
    expect(out.endsWith(`build/review/${SOURCE}-${TABLE}.html`)).toBe(true);
    const html = readFileSync(out, 'utf8');
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html.match(/data:image\/png;base64,/g)).toHaveLength(2);
    expect(html).toMatch(/<td class="resolved" title="A: 11 0&lt;5\nB: 11 06\nresolution: other\nnote: both misread the 5">11 05<\/td>/);
    expect(html).toMatch(/<td class="doubt"[^>]*>SYN_Neubrück<\/td>/);
    expect(html).toMatch(/<td class="illegible"[^>]*>† Runs on S\?\? weekdays only.<sup>†<\/sup><\/td>/);
    expect(html).toContain('<b>D 40</b>');
    expect(html).toContain('cells from keyer A only (not resolved)');
    expect(html).not.toMatch(/<script|https?:\/\/(?!www\.w3)/);

    const { views } = buildViews(r, SOURCE, TABLE);
    expect(views.map((v) => [v.crop.crop_id, v.source, v.status])).toEqual([[GRID, 'R', 'resolved 956‰'], [FN, 'A', 'no status']]);
  });
});
