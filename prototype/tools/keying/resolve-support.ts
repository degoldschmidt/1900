/**
 * Resolver packets.
 *
 *   node tools/keying/resolve-support.ts <source_id> <table_ref> [crop_id …]
 *
 * For each crop at status diffed (or the named crops), re-diffs A and B and writes into
 * build/resolve/<source_id>/<table_ref>/<crop_id>/:
 *   packet.md        what the resolver reads: the crop image, then one section per disputed cell with
 *                    both readings and its zoomed sub-crop (4×, the cell outlined in red)
 *   packet.json      the same data for scripts
 *   zoom-<kind>-c<col>-r<row>.png   one per disputed cell
 *   R.template.csv   the rows the resolver must fill in (resolution, text_as_printed, marks, sure, note)
 * The resolver saves the filled template as data/raw/<source_id>/<table_ref>/<crop_id>.R.csv and runs
 * tools/keying/merge.ts. Crops with no disagreement need no packet: merge.ts resolves them directly.
 */
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { writeCsv, writeTextFile } from './csv.ts';
import { cellRef, marksString, RESOLVED_COLUMNS } from './longcsv.ts';
import { cropImage, keyingCsv, resolvePacketDir, roots, statusCsv, type Roots } from './paths.ts';
import { readStatus } from './status.ts';
import { cropOf, loadTable, readKeyer } from './crop-files.ts';
import { diffReadings, type Disagreement } from './diff.ts';
import { expectedKeys, panelForCrop } from '../crops/layout.ts';
import { findPageImage, loadPage, zoomKey } from '../crops/make-crops.ts';

export interface PacketItem {
  kind: string; col: number; row: number; ref: string; reason: string;
  a: { text: string; marks: string; sure: string } | null;
  b: { text: string; marks: string; sure: string } | null;
  zoom: string;
}

export interface Packet {
  source_id: string; table_ref: string; crop_id: string; page_seq: number;
  crop_image: string; agreement_permille: number; total: number;
  items: PacketItem[];
}

const reading = (c: Disagreement['a']) => (c ? { text: c.text, marks: marksString(c.marks), sure: c.sure } : null);
const show = (x: PacketItem['a']) => (x ? `\`${x.text === '' ? '(blank)' : x.text}\`${x.marks ? ` marks \`${x.marks}\`` : ''}${x.sure !== 'y' ? ` sure=${x.sure}` : ''}` : '— (no reading)');

export function packetMarkdown(p: Packet, dir: string): string {
  const L: string[] = [];
  L.push(`# Resolver packet ${p.crop_id}`);
  L.push('');
  L.push(`Source \`${p.source_id}\`, table ${p.table_ref}, page_seq ${p.page_seq}. Agreement ${p.agreement_permille}‰ (${p.items.length} of ${p.total} cells disputed).`);
  L.push('');
  L.push('Follow `tools/keying/RESOLVER_BRIEF.md`. Look at the whole crop first, then at each zoom. Decide from the image only.');
  L.push('');
  L.push(`Crop image: \`${p.crop_image}\``);
  L.push('');
  L.push(`Fill \`R.template.csv\` (this folder) and save it as \`data/raw/${p.source_id}/${p.table_ref}/${p.crop_id}.R.csv\`, then run \`node tools/keying/merge.ts ${p.source_id} ${p.table_ref} ${p.crop_id}\`.`);
  L.push('');
  for (const it of p.items) {
    L.push(`## ${it.kind} col ${it.col} row ${it.row} (${it.ref}) — ${it.reason}`);
    L.push('');
    L.push(`- A: ${show(it.a)}`);
    L.push(`- B: ${show(it.b)}`);
    L.push(`- zoom: \`${relative(dir, it.zoom) || it.zoom}\``);
    L.push('');
  }
  return L.join('\n');
}

export async function buildPacket(r: Roots, source: string, table: string, cropId: string): Promise<Packet | null> {
  const t = loadTable(r, source, table);
  const crop = cropOf(t, cropId);
  const A = readKeyer(r, source, table, cropId, 'A');
  const B = readKeyer(r, source, table, cropId, 'B');
  if (!A || !B) throw new Error(`${cropId}: both A and B keyings are needed`);
  if (A.errors.length || B.errors.length) throw new Error(`${cropId}: malformed keyer file(s); run diff.ts for details`);
  const d = diffReadings(A.cells, B.cells, expectedKeys(t.layout, crop));
  if (d.disagreements.length === 0) return null;
  const dir = resolvePacketDir(r, source, table, cropId);
  const panel = panelForCrop(t.layout, crop);
  const page = await loadPage(findPageImage(r, source, panel.page_seq), panel.deskew_deg ?? 0);
  const items: PacketItem[] = [];
  for (const x of d.disagreements) {
    const zoom = join(dir, `zoom-${x.kind}-c${x.col}-r${x.row}.png`);
    if (x.kind === 'footnote' && !panel.footnote_bbox) {
      // Footnote lines without a footnote box: the resolver reads them from the crop image.
      items.push({ kind: x.kind, col: x.col, row: x.row, ref: cellRef(x), reason: x.reason, a: reading(x.a), b: reading(x.b), zoom: '(see crop image)' });
      continue;
    }
    writeTextFile(zoom, await zoomKey(page, t.layout, crop, x));
    items.push({ kind: x.kind, col: x.col, row: x.row, ref: cellRef(x), reason: x.reason, a: reading(x.a), b: reading(x.b), zoom });
  }
  const p: Packet = {
    source_id: source, table_ref: table, crop_id: cropId, page_seq: crop.page_seq,
    crop_image: cropImage(r, source, table, cropId), agreement_permille: d.permille, total: d.total, items,
  };
  writeTextFile(join(dir, 'packet.json'), JSON.stringify(p, null, 2) + '\n');
  writeTextFile(join(dir, 'packet.md'), packetMarkdown(p, dir));
  writeTextFile(join(dir, 'R.template.csv'), writeCsv(RESOLVED_COLUMNS, d.disagreements.map((x) => ({
    crop_id: cropId, kind: x.kind, col: String(x.col), row: String(x.row), text_as_printed: '', marks: '', sure: '', resolution: '', note: '',
  }))));
  return p;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [source, table, ...ids] = args.filter((a) => !a.startsWith('--'));
  if (!source || !table) { console.error('usage: resolve-support.ts <source_id> <table_ref> [crop_id …]'); process.exit(1); }
  const r = roots();
  const run = async () => {
    const t = loadTable(r, source, table);
    const st = existsSync(statusCsv(r)) ? readStatus(statusCsv(r)) : [];
    const crops = ids.length ? ids : t.crops.map((c) => c.crop_id)
      .filter((id) => st.find((s) => s.source_id === source && s.table_ref === table && s.crop_id === id)?.status === 'diffed');
    for (const id of crops) {
      if (existsSync(keyingCsv(r, source, table, id, 'R'))) console.log(`${id}: note: an R.csv already exists`);
      const p = await buildPacket(r, source, table, id);
      console.log(p ? `${id}: ${p.items.length} disputed cell(s) → ${resolvePacketDir(r, source, table, id)}/packet.md` : `${id}: no disagreements; run merge.ts`);
    }
    if (crops.length === 0) console.log('no crops at status diffed');
  };
  run().catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
