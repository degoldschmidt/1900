/**
 * Layout assist: proposes one panel of a layout.json (tools/crops/layout.ts) from the page image's
 * projection profiles and, where the library has it, the ALTO word coordinates; and draws the grid
 * of a layout over its page so a person (or an agent reading the PNG) can check and correct it.
 *
 *   node tools/crops/propose-layout.ts propose <source_id> <table_ref> --page <seq> [--panel p1]
 *        [--region x,y,w,h] [--body y0,y1] [--header-lines 2] [--first-col 0] [--first-row 0]
 *        [--keep "Dresden,Bodenbach|Tetschen,…"] [--skip 3-7,12] [--footnote y0,y1] [--rotate 90] [--no-alto] [--print]
 *   node tools/crops/propose-layout.ts overlay <source_id> <table_ref> [--panel p1] [--zoom x,y,w,h] [--out file.png]
 *
 * propose writes (or replaces, by panel name) the panel in data/raw/<source_id>/<table_ref>/layout.json,
 * or prints it with --print. overlay writes build/layout/<source_id>-<table_ref>-<panel>.png. The
 * proposal is a starting point: check every grid on its overlay and correct the layout by hand.
 *
 * How the proposal is made (all coordinates are page pixels, after deskew):
 * - deskew: the slope of the long vertical rules (ink centroid in the upper vs lower half); applied
 *   when it exceeds 0.1°;
 * - vertical rules: x positions where a dark run covers at least 40% of the body height; the label
 *   column is the widest gap between rules in the left half, and the train columns are the gaps to its
 *   right (gaps under 12 px are double rules). Time-shaped ALTO tokens ("8 15", "815", "1022") are
 *   clustered by x and split a gap that holds two clusters; a gap much wider than the others is only
 *   reported (it is usually one train with a vertical note beside its times);
 * - rows: text-line bands of the label column's ink profile (ALTO line baselines in the label column
 *   when the ALTO is upright), with boundaries at the midpoints, moved onto a horizontal rule when one
 *   lies between two rows;
 * - header band: the `--header-lines` text lines directly above the first body row;
 * - skip_rows: with --keep, rows whose ALTO label matches none of the names (node-only rule);
 *   with --skip, the listed rows. OCR text only selects rows; no value is ever taken from it.
 *
 * ALTO from ABBYY is sometimes stored for the page rotated by 90° (its width and height swapped, on
 * pages with many vertical notes); such ALTO is ignored and the proposal uses the image alone.
 * --rotate 90 (or 180, 270) turns a table printed sideways upright first; region, body and all
 * output coordinates are then in the turned page, and deskew_deg holds the turn plus the deskew.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { createHttp } from '../discover/http.ts';
import { parseSourceId } from '../discover/catalogue.ts';
import * as sl from '../discover/slub.ts';
import { foldForMatch } from '../discover/archive-org.ts';
import { writeTextFile } from '../keying/csv.ts';
import { httpCacheDir, layoutJson, roots, type Roots } from '../keying/paths.ts';
import { parsePageList } from '../fetch/manifest.ts';
import { findPageImage } from './make-crops.ts';
import { validateLayout, keptRows, type Box, type Layout, type Panel } from './layout.ts';

export interface Gray { width: number; height: number; data: Uint8Array }

export interface Word { text: string; x: number; y: number; w: number; h: number }

export interface ProposeOptions {
  panel?: string;
  pageSeq: number;
  /** Table area; default: the bounding box of the long rules. */
  region?: Box;
  /** Body rows' y-range; default: below the header band to the region's bottom. */
  body?: [number, number];
  headerLines?: number;
  firstCol?: number;
  firstRow?: number;
  /** Station names (variants separated by "|") whose rows are keyed; the others go to skip_rows. */
  keep?: string[];
  /** Absolute rows to skip (in addition to --keep). */
  skip?: number[];
  footnote?: [number, number];
  /** Ink threshold (0–255); default: Otsu over the region. */
  threshold?: number;
}

export interface Proposal { panel: Panel; notes: string[] }

// ---------------------------------------------------------------- image helpers

/** Otsu's threshold over a box of the image: pixels darker than it are ink. */
export function otsu(img: Gray, box: Box): number {
  const hist = new Array<number>(256).fill(0);
  let n = 0;
  for (let y = box[1]; y < box[1] + box[3]; y += 2) for (let x = box[0]; x < box[0] + box[2]; x += 2) { hist[img.data[y * img.width + x]!]!++; n++; }
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i]!;
  let sumB = 0; let wB = 0; let best = 0; let thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]!; if (wB === 0) continue;
    const wF = n - wB; if (wF === 0) break;
    sumB += t * hist[t]!;
    const mB = sumB / wB; const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) { best = between; thr = t; }
  }
  return thr + 1; // ink is `< threshold`; Otsu's t is the last value of the dark class
}

const clampBox = (img: Gray, b: Box): Box => {
  const x0 = Math.max(0, Math.min(img.width - 1, b[0])); const y0 = Math.max(0, Math.min(img.height - 1, b[1]));
  const x1 = Math.max(x0 + 1, Math.min(img.width, b[0] + b[2])); const y1 = Math.max(y0 + 1, Math.min(img.height, b[1] + b[3]));
  return [x0, y0, x1 - x0, y1 - y0];
};

/** Longest dark run (gaps up to `gap` px bridged) down column window [x-half, x+half] within [y0, y1). */
function verticalRun(img: Gray, thr: number, x: number, y0: number, y1: number, half: number, gap: number): number {
  let best = 0; let run = 0; let miss = 0;
  for (let y = y0; y < y1; y++) {
    let dark = false;
    for (let dx = -half; dx <= half && !dark; dx++) {
      const xx = x + dx;
      if (xx >= 0 && xx < img.width && img.data[y * img.width + xx]! < thr) dark = true;
    }
    if (dark) { run += 1 + miss; miss = 0; if (run > best) best = run; }
    else if (run > 0 && miss < gap) miss++;
    else { run = 0; miss = 0; }
  }
  return best;
}

function horizontalRun(img: Gray, thr: number, y: number, x0: number, x1: number, half: number, gap: number): number {
  let best = 0; let run = 0; let miss = 0;
  for (let x = x0; x < x1; x++) {
    let dark = false;
    for (let dy = -half; dy <= half && !dark; dy++) {
      const yy = y + dy;
      if (yy >= 0 && yy < img.height && img.data[yy * img.width + x]! < thr) dark = true;
    }
    if (dark) { run += 1 + miss; miss = 0; if (run > best) best = run; }
    else if (run > 0 && miss < gap) miss++;
    else { run = 0; miss = 0; }
  }
  return best;
}

/** Groups sorted positions closer than `tol` and returns each group's centre. */
export function groupPositions(xs: readonly number[], tol: number): number[] {
  const out: number[][] = [];
  for (const x of [...xs].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && x - last[last.length - 1]! <= tol) last.push(x); else out.push([x]);
  }
  return out.map((g) => Math.round((g[0]! + g[g.length - 1]!) / 2));
}

/** x positions of vertical rules within a box: dark runs covering at least `frac` of its height. */
export function verticalRules(img: Gray, thr: number, box: Box, frac = 0.4, half = 1): number[] {
  const [bx, by, bw, bh] = box;
  const hits: number[] = [];
  for (let x = bx; x < bx + bw; x++) if (verticalRun(img, thr, x, by, by + bh, half, 3) >= frac * bh) hits.push(x);
  return groupPositions(hits, 4);
}

/** y positions of horizontal rules within a box: dark runs covering at least `frac` of its width. */
export function horizontalRules(img: Gray, thr: number, box: Box, frac = 0.5): number[] {
  const [bx, by, bw, bh] = box;
  const hits: number[] = [];
  for (let y = by; y < by + bh; y++) if (horizontalRun(img, thr, y, bx, bx + bw, 0, 3) >= frac * bw) hits.push(y);
  return groupPositions(hits, 3);
}

/**
 * Skew of the page in degrees (positive: the page must be rotated clockwise to straighten it), from
 * the ink centroid of long vertical rules in the upper and lower thirds of the box.
 */
export function estimateSkew(img: Gray, thr: number, box: Box): number {
  const rules = verticalRules(img, thr, box, 0.5, 4);
  const [, by, , bh] = box;
  const slopes: number[] = [];
  const centroid = (x: number, y0: number, y1: number): number | null => {
    let s = 0; let n = 0;
    for (let y = y0; y < y1; y++) for (let dx = -6; dx <= 6; dx++) {
      const xx = x + dx; if (xx < 0 || xx >= img.width) continue;
      if (img.data[y * img.width + xx]! < thr) { s += xx; n++; }
    }
    return n > (y1 - y0) / 2 ? s / n : null;
  };
  for (const x of rules) {
    const a = centroid(x, by, by + Math.round(bh / 3)); const b = centroid(x, by + Math.round((2 * bh) / 3), by + bh);
    if (a !== null && b !== null) slopes.push((b - a) / ((2 * bh) / 3));
  }
  if (slopes.length === 0) return 0;
  slopes.sort((p, q) => p - q);
  const m = slopes[Math.floor(slopes.length / 2)]!;
  // A rule drifting right going down (m > 0): turning the page clockwise (sharp's positive angle)
  // swings its lower end back to the left.
  return Math.atan(m) * (180 / Math.PI);
}

/** Text-line bands of a box's horizontal ink profile (rule pixels excluded), as [y0, y1) pairs. */
export function textBands(img: Gray, thr: number, box: Box, ruleYs: readonly number[] = [], minInk = 2): Array<[number, number]> {
  const [bx, by, bw, bh] = box;
  const prof: number[] = [];
  for (let y = by; y < by + bh; y++) {
    if (ruleYs.some((r) => Math.abs(r - y) <= 2)) { prof.push(0); continue; }
    let n = 0;
    for (let x = bx; x < bx + bw; x++) if (img.data[y * img.width + x]! < thr) n++;
    prof.push(n);
  }
  // Ink that runs through every line (a rule or the page edge inside the box) sets the floor.
  const floor = [...prof].sort((a, b) => a - b)[Math.floor(prof.length * 0.1)] ?? 0;
  const need = floor + Math.max(minInk, Math.round(bw * 0.03));
  const bands: Array<[number, number]> = [];
  let start = -1;
  for (let i = 0; i <= prof.length; i++) {
    const on = i < prof.length && prof[i]! >= need;
    if (on && start < 0) start = i;
    if (!on && start >= 0) { if (i - start >= 4) bands.push([by + start, by + i]); start = -1; }
  }
  return bands;
}

const median = (xs: readonly number[]): number => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)]! : 0; };

/** Merges bands closer than `join` px (superscripts, dots) and splits bands taller than 1.7× the pitch. */
export function normaliseBands(bands: ReadonlyArray<[number, number]>, join: number): Array<[number, number]> {
  const merged: Array<[number, number]> = [];
  for (const b of bands) {
    const last = merged[merged.length - 1];
    if (last && b[0] - last[1] <= join && b[1] - last[0] <= 30) last[1] = b[1]; else merged.push([b[0], b[1]]);
  }
  const pitch = median(merged.map((b, i) => (i ? b[0] - merged[i - 1]![0] : 0)).filter((d) => d > 0));
  const hMed = median(merged.map((b) => b[1] - b[0]));
  const out: Array<[number, number]> = [];
  for (const b of merged) {
    const h = b[1] - b[0];
    const k = pitch > 0 && h > 1.7 * Math.max(hMed, pitch * 0.75) ? Math.round(h / pitch) : 1;
    for (let i = 0; i < Math.max(1, k); i++) out.push([Math.round(b[0] + (h * i) / k), Math.round(b[0] + (h * (i + 1)) / k)]);
  }
  return out;
}

/** Row boundaries from row bands: midpoints, or a horizontal rule lying between two rows. */
export function rowBoundaries(bands: ReadonlyArray<[number, number]>, rules: readonly number[], limits: [number, number]): number[] {
  if (bands.length === 0) return [];
  const pitch = median(bands.map((b, i) => (i ? b[0] - bands[i - 1]![0] : 0)).filter((d) => d > 0)) || 24;
  const ys: number[] = [Math.max(limits[0], Math.round(bands[0]![0] - Math.max(2, (pitch - (bands[0]![1] - bands[0]![0])) / 2)))];
  for (let i = 1; i < bands.length; i++) {
    const a = bands[i - 1]![1]; const b = bands[i]![0];
    const rule = rules.find((r) => r >= a - 1 && r <= b + 1);
    ys.push(rule ?? Math.round((a + b) / 2));
  }
  const last = bands[bands.length - 1]!;
  ys.push(Math.min(limits[1], Math.round(last[1] + Math.max(2, (pitch - (last[1] - last[0])) / 2))));
  // Strictly increasing.
  for (let i = 1; i < ys.length; i++) if (ys[i]! <= ys[i - 1]!) ys[i] = ys[i - 1]! + 1;
  return ys;
}

/** "8 15", "8.15", "815", "1022" (OCR's superscript minutes included). */
export const isTimeToken = (t: string): boolean => /^[•*†‡§!:°]?\d{1,2}[ .·:]?\d{2}[*†‡§]?$/.test(t.trim());

/** x-clusters of time-shaped words (centre positions), each with its word count. */
export function timeClusters(words: readonly Word[], box: Box, tol = 14): Array<{ x: number; n: number; x0: number; x1: number }> {
  const ws = words.filter((w) => isTimeToken(w.text) && w.x >= box[0] && w.x + w.w <= box[0] + box[2] && w.y >= box[1] && w.y + w.h <= box[1] + box[3]);
  const cs = ws.map((w) => ({ c: w.x + w.w / 2, x0: w.x, x1: w.x + w.w })).sort((a, b) => a.c - b.c);
  const out: Array<{ x: number; n: number; x0: number; x1: number; sum: number }> = [];
  for (const c of cs) {
    const last = out[out.length - 1];
    if (last && c.c - last.sum / last.n <= tol) { last.n++; last.sum += c.c; last.x0 = Math.min(last.x0, c.x0); last.x1 = Math.max(last.x1, c.x1); }
    else out.push({ x: 0, n: 1, sum: c.c, x0: c.x0, x1: c.x1 });
  }
  return out.filter((c) => c.n >= 2).map((c) => ({ x: Math.round(c.sum / c.n), n: c.n, x0: c.x0, x1: c.x1 }));
}

/** Rotates a point the way sharp.rotate(deg) turns the page (clockwise, canvas grown to fit). */
export function rotatePoint(x: number, y: number, deg: number, w: number, h: number): [number, number] {
  const t = (deg * Math.PI) / 180; const c = Math.cos(t); const s = Math.sin(t);
  const W = Math.abs(w * c) + Math.abs(h * s); const H = Math.abs(w * s) + Math.abs(h * c);
  const dx = x - w / 2; const dy = y - h / 2;
  return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c];
}

// ---------------------------------------------------------------- proposal

/** Proposes one panel from a (deskewed) page image and optional upright ALTO words. */
export function proposePanel(img: Gray, words: readonly Word[] | null, o: ProposeOptions): Proposal {
  const notes: string[] = [];
  const region = clampBox(img, o.region ?? [Math.round(img.width * 0.04), Math.round(img.height * 0.05), Math.round(img.width * 0.92), Math.round(img.height * 0.9)]);
  const thr = o.threshold ?? Math.min(150, otsu(img, region));
  const [rx, ry, rw, rh] = region;
  const body: [number, number] = o.body ?? [ry, ry + rh];
  const bodyBox: Box = clampBox(img, [rx, body[0], rw, body[1] - body[0]]);

  // Columns: vertical rules over the body.
  let vr = verticalRules(img, thr, bodyBox, 0.4, 1);
  // The region's edges stand in for missing outer rules, unless they lie much closer than a column width.
  const spacing = median(vr.map((x, i) => (i ? x - vr[i - 1]! : 0)).filter((d) => d >= 12)) || rw;
  if (vr.length === 0 || vr[0]! - rx > 0.6 * spacing) vr = [rx, ...vr];
  if (rx + rw - vr[vr.length - 1]! > 0.6 * spacing) vr.push(rx + rw);
  // Drop double rules: keep the first of rules closer than 12 px... but keep its partner as the gap end.
  const gaps: Array<[number, number]> = [];
  for (let i = 1; i < vr.length; i++) if (vr[i]! - vr[i - 1]! >= 12) gaps.push([vr[i - 1]!, vr[i]!]);
  const half = rx + rw / 2;
  let labelIdx = 0;
  gaps.forEach((g, i) => { if (g[0] < half && g[1] - g[0] > gaps[labelIdx]![1] - gaps[labelIdx]![0]) labelIdx = i; });
  const label = gaps[labelIdx]!;
  let cols = gaps.slice(labelIdx + 1);
  if (cols.length === 0) throw new Error('no train columns found right of the label column (check --region and --body)');

  // A long pass-through bar ("|") in mid-column looks like a rule: it leaves two half-width gaps.
  const wMed = median(cols.map((g) => g[1] - g[0]));
  const joined: Array<[number, number]> = [];
  for (let i = 0; i < cols.length; i++) {
    const a = cols[i]!; const b = cols[i + 1];
    const wa = a[1] - a[0]; const wb = b ? b[1] - b[0] : 0;
    if (b && wa < 0.65 * wMed && wb < 0.65 * wMed && wa + wb >= 0.75 * wMed && wa + wb <= 1.35 * wMed) {
      joined.push([a[0], b[1]]); i++;
      notes.push(`rule at x ${a[1]} taken for a pass-through bar inside the column ${a[0]}–${b[1]}`);
    } else joined.push(a);
  }
  cols = joined;
  // Split gaps holding two time-token clusters.
  const clusters = words ? timeClusters(words, bodyBox) : [];
  const split: Array<[number, number]> = [];
  for (const g of cols) {
    const inside = clusters.filter((c) => c.x > g[0] && c.x < g[1]);
    if (inside.length >= 2) {
      const bounds = [g[0]];
      for (let i = 1; i < inside.length; i++) bounds.push(Math.round((inside[i - 1]!.x1 + inside[i]!.x0) / 2));
      bounds.push(g[1]);
      for (let i = 1; i < bounds.length; i++) split.push([bounds[i - 1]!, bounds[i]!]);
      notes.push(`gap ${g[0]}–${g[1]} split by ${inside.length} time-token clusters (no printed rule between them)`);
    } else {
      // A wide column is usually one train with a vertical note beside its times: never split without evidence.
      if (g[1] - g[0] > 1.7 * wMed && wMed > 0) notes.push(`column ${g[0]}–${g[1]} is ${((g[1] - g[0]) / wMed).toFixed(1)}× the median width and has no printed rule inside: one train with a note, or two trains? check it`);
      split.push(g);
    }
  }
  cols = split;
  const colX = [cols[0]![0], ...cols.map((g) => g[1])];
  for (let i = 1; i < colX.length; i++) if (colX[i]! <= colX[i - 1]!) colX[i] = colX[i - 1]! + 1;

  // Rows: text bands in the label column (inside its rules).
  const hr = horizontalRules(img, thr, clampBox(img, [label[0], ry, colX[colX.length - 1]! - label[0], rh]), 0.5);
  const labelInner: Box = clampBox(img, [label[0] + 3, body[0], label[1] - label[0] - 6, body[1] - body[0]]);
  let bands: Array<[number, number]>;
  const labelWords = words?.filter((w) => w.x >= label[0] - 4 && w.x + w.w <= label[1] + 4 && w.y + w.h / 2 >= body[0] && w.y + w.h / 2 <= body[1]) ?? [];
  if (labelWords.length >= 5) {
    const ys = labelWords.map((w) => ({ y0: w.y, y1: w.y + w.h, c: w.y + w.h / 2 })).sort((a, b) => a.c - b.c);
    const hMed = median(ys.map((y) => y.y1 - y.y0));
    const groups: Array<{ y0: number; y1: number; c: number[] }> = [];
    for (const y of ys) {
      const g = groups[groups.length - 1];
      if (g && y.c - median(g.c) <= 0.6 * hMed) { g.y0 = Math.min(g.y0, y.y0); g.y1 = Math.max(g.y1, y.y1); g.c.push(y.c); }
      else groups.push({ y0: y.y0, y1: y.y1, c: [y.c] });
    }
    bands = groups.map((g) => [g.y0, g.y1] as [number, number]);
    // Rows the OCR missed in the label column still show as ink bands.
    const inkBands = normaliseBands(textBands(img, thr, labelInner, hr), 2);
    const hMin = 0.5 * median(bands.map((x) => x[1] - x[0]));
    for (const b of inkBands) if (b[1] - b[0] >= hMin && !bands.some((x) => x[0] < b[1] && b[0] < x[1])) { bands.push(b); notes.push(`row at y ${b[0]}–${b[1]} found in the ink only (no ALTO label word)`); }
    bands.sort((a, b) => a[0] - b[0]);
  } else {
    bands = normaliseBands(textBands(img, thr, labelInner, hr), 2);
    const hMin = 0.5 * median(bands.map((x) => x[1] - x[0]));
    bands = bands.filter((x) => x[1] - x[0] >= hMin);
    if (words) notes.push('few ALTO words in the label column: rows from the image profile only');
  }
  const rowY = rowBoundaries(bands, hr, [body[0], body[1]]);

  // Header: the N text lines directly above the first body row.
  const nH = o.headerLines ?? 2;
  const headTop = Math.max(ry, rowY[0]! - 40 * nH - 20);
  // A rule above the header band (the one just under it, between header and first row, does not count).
  const ruleAbove = hr.filter((r) => r < rowY[0]! - 12 && r >= headTop).pop();
  const hBox: Box = clampBox(img, [colX[0]!, ruleAbove !== undefined ? ruleAbove + 3 : headTop, colX[colX.length - 1]! - colX[0]!, rowY[0]! - (ruleAbove !== undefined ? ruleAbove + 3 : headTop)]);
  const hb = normaliseBands(textBands(img, thr, clampBox(img, [label[0] + 3, hBox[1], colX[colX.length - 1]! - label[0] - 6, hBox[3]]), hr, 3), 2).slice(-nH);
  let headerBox: Box; let headerY: number[] | undefined;
  if (hb.length) {
    const top = Math.max(hBox[1], hb[0]![0] - 3);
    headerBox = [colX[0]!, top, colX[colX.length - 1]! - colX[0]!, Math.max(4, rowY[0]! - top)];
    if (hb.length > 1) {
      headerY = [top];
      for (let i = 1; i < hb.length; i++) headerY.push(Math.round((hb[i - 1]![1] + hb[i]![0]) / 2));
      headerY.push(rowY[0]!);
    }
  } else {
    headerBox = [colX[0]!, Math.max(ry, rowY[0]! - 30), colX[colX.length - 1]! - colX[0]!, Math.min(30, rowY[0]! - ry) || 4];
    notes.push('no header text found above the first row; header band set to 30 px');
  }

  const firstRow = o.firstRow ?? 0;
  const skip = new Set<number>(o.skip ?? []);
  if (o.keep && o.keep.length) {
    if (labelWords.length === 0) notes.push('--keep needs upright ALTO words in the label column; set skip_rows by hand');
    else {
      const pats = o.keep.map((k) => k.split('|').map((v) => ` ${foldForMatch(v)} `));
      for (let i = 0; i < rowY.length - 1; i++) {
        const text = ` ${foldForMatch(labelWords.filter((w) => w.y + w.h / 2 >= rowY[i]! && w.y + w.h / 2 < rowY[i + 1]!).map((w) => w.text).join(' '))} `;
        if (!pats.some((vs) => vs.some((v) => text.includes(v)))) skip.add(firstRow + i);
      }
    }
  }
  const lastRow = firstRow + rowY.length - 2;
  const panel: Panel = {
    panel: o.panel ?? 'p1',
    page_seq: o.pageSeq,
    table_bbox: region,
    label_bbox: [label[0], rowY[0]!, label[1] - label[0], rowY[rowY.length - 1]! - rowY[0]!],
    header_bbox: headerBox,
    col_x: colX,
    row_y: rowY,
    first_col: o.firstCol ?? 0,
    first_row: firstRow,
    ...(headerY ? { header_y: headerY } : { header_lines: 1 }),
  };
  const sk = [...skip].filter((r) => r >= firstRow && r <= lastRow).sort((a, b) => a - b);
  if (sk.length) panel.skip_rows = sk;
  if (o.footnote) panel.footnote_bbox = [rx, o.footnote[0], rw, o.footnote[1] - o.footnote[0]];
  notes.push(`threshold ${thr}; ${vr.length} vertical rules, ${hr.length} horizontal rules; ${colX.length - 1} columns, ${rowY.length - 1} rows (${keptRows(panel).length} kept)`);
  return { panel, notes };
}

// ---------------------------------------------------------------- files and overlay

export async function loadGray(path: string, deskewDeg = 0): Promise<Gray> {
  let img = sharp(path);
  if (deskewDeg) img = img.rotate(deskewDeg, { background: '#ffffff' });
  const { data, info } = await img.greyscale().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}

/** ALTO words of a page, or null when the library has none or the ALTO is stored rotated. */
export async function altoWords(r: Roots, sourceId: string, seq: number, size: { width: number; height: number }, log: (m: string) => void = () => {}): Promise<Word[] | null> {
  const { library, libraryId } = parseSourceId(sourceId);
  if (library !== 'slub') return null;
  const http = createHttp({ cacheDir: httpCacheDir(r) });
  const alto = sl.parseAlto((await http.get(sl.altoUrl(libraryId, seq), { accept: 'application/xml' })).text());
  if (alto.width && alto.height && (Math.abs(alto.width - size.width) > 4 || Math.abs(alto.height - size.height) > 4)) {
    log(`ALTO of p${seq} is ${alto.width}×${alto.height}, the image ${size.width}×${size.height} (stored rotated): ignored`);
    return null;
  }
  return alto.words.map((w) => ({ text: w.text, x: w.x, y: w.y, w: w.w, h: w.h }));
}

function svgLine(x1: number, y1: number, x2: number, y2: number, color: string, width = 1, dash = ''): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}
const svgRect = (b: Box, color: string, width = 2) => `<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
const svgLabel = (x: number, y: number, t: string, color: string, size = 11) => `<text x="${x}" y="${y}" font-family="DejaVu Sans, sans-serif" font-size="${size}" fill="${color}">${t}</text>`;

/** The panel's grid drawn over its (deskewed) page: columns red, kept rows blue, skipped rows grey, header green, label purple, footnotes orange, column notes cyan. */
export async function overlayPng(pagePath: string, p: Panel, zoom?: Box): Promise<Buffer> {
  let img = sharp(pagePath);
  if (p.deskew_deg) img = img.rotate(p.deskew_deg, { background: '#ffffff' });
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width; const H = info.height;
  const parts: string[] = [];
  const top = p.header_bbox[1]; const bottom = p.row_y[p.row_y.length - 1]!;
  // The label column is usually left of the train columns, but may stand right of them (a table printed both ways).
  const left = Math.min(p.label_bbox[0], p.col_x[0]!); const right = Math.max(p.col_x[p.col_x.length - 1]!, p.label_bbox[0] + p.label_bbox[2]);
  p.col_x.forEach((x, i) => {
    parts.push(svgLine(x, top, x, bottom, '#e00000', 1));
    if (i < p.col_x.length - 1) parts.push(svgLabel(x + 3, top - 4, `c${p.first_col + i}`, '#e00000'));
  });
  p.row_y.forEach((y, i) => {
    const row = p.first_row + i;
    const skipped = i < p.row_y.length - 1 && p.skip_rows?.includes(row);
    parts.push(svgLine(left, y, right, y, '#0050e0', 1));
    if (i < p.row_y.length - 1) parts.push(svgLabel(Math.max(0, left - 34), y + 14, `r${row}`, skipped ? '#888888' : '#0050e0'));
    if (skipped) parts.push(`<rect x="${left}" y="${y}" width="${right - left}" height="${p.row_y[i + 1]! - y}" fill="#808080" opacity="0.25"/>`);
  });
  parts.push(svgRect(p.header_bbox, '#00a000'));
  for (const y of p.header_y ?? []) parts.push(svgLine(p.header_bbox[0], y, p.header_bbox[0] + p.header_bbox[2], y, '#00a000', 1, '4 3'));
  parts.push(svgRect(p.label_bbox, '#9000c0'));
  for (const x of p.label_x ?? []) parts.push(svgLine(x, p.label_bbox[1], x, p.label_bbox[1] + p.label_bbox[3], '#9000c0', 1, '4 3'));
  parts.push(svgRect(p.table_bbox, '#c0c0c0', 1));
  if (p.footnote_bbox) parts.push(svgRect(p.footnote_bbox, '#f08000'));
  if (p.notes_bbox) parts.push(svgRect(p.notes_bbox, '#00a0c0', 1));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join('')}</svg>`;
  let out = sharp(data, { raw: { width: W, height: H, channels: info.channels as 1 | 2 | 3 | 4 } }).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]);
  if (zoom) {
    const z = clampBox({ width: W, height: H, data: new Uint8Array(0) }, zoom);
    const flat = await out.png().toBuffer();
    const s = Math.min(3, 1500 / Math.max(z[2], z[3]));
    return sharp(flat).extract({ left: z[0], top: z[1], width: z[2], height: z[3] }).resize(Math.round(z[2] * s), Math.round(z[3] * s)).png().toBuffer();
  }
  return out.png().toBuffer();
}

export function readLayoutOr(path: string, source: string, table: string): Layout {
  if (!existsSync(path)) return { layout_version: 1, source_id: source, table_ref: table, table_kind: 'timetable', panels: [] };
  return JSON.parse(readFileSync(path, 'utf8')) as Layout;
}

/** Replaces (or appends) a panel by name, keeping panels in page and first_col order. */
export function upsertPanel(l: Layout, p: Panel): Layout {
  const panels = l.panels.filter((x) => x.panel !== p.panel);
  panels.push(p);
  panels.sort((a, b) => a.first_row - b.first_row || a.first_col - b.first_col);
  return { ...l, panels };
}

/** Layout JSON with one line per array of numbers (diff-friendly). */
export function formatLayout(l: Layout): string {
  return JSON.stringify(l, null, 2).replace(/\[\s+(-?\d+(?:\.\d+)?(?:,\s+-?\d+(?:\.\d+)?)*)\s+\]/g, (_, inner: string) => `[${inner.replace(/\s+/g, ' ')}]`) + '\n';
}

const box = (s: string, what: string): Box => {
  const v = s.split(',').map(Number);
  if (v.length !== 4 || v.some((n) => !Number.isFinite(n))) throw new Error(`${what} must be x,y,w,h`);
  return v as Box;
};
const pair = (s: string, what: string): [number, number] => {
  const v = s.split(',').map(Number);
  if (v.length !== 2 || v.some((n) => !Number.isFinite(n)) || v[1]! <= v[0]!) throw new Error(`${what} must be y0,y1 with y1 > y0`);
  return v as [number, number];
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1]!.startsWith('--') && !['--print', '--no-alto'].includes(args[i - 1]!)));
  const r = roots();
  const main = async () => {
    const [cmd, source, table] = pos;
    if (!cmd || !source || !table || !['propose', 'overlay'].includes(cmd)) throw new Error('usage: propose-layout.ts propose|overlay <source_id> <table_ref> … (see the file header)');
    const lPath = layoutJson(r, source, table);
    if (cmd === 'overlay') {
      const l = readLayoutOr(lPath, source, table);
      const names = opt('--panel') ? [opt('--panel')!] : l.panels.map((p) => p.panel);
      for (const name of names) {
        const p = l.panels.find((x) => x.panel === name);
        if (!p) throw new Error(`no panel ${name} in ${lPath}`);
        const out = opt('--out') ?? join(r.build, 'layout', `${source}-${table}-${name}.png`);
        writeTextFile(out, await overlayPng(findPageImage(r, source, p.page_seq), p, opt('--zoom') ? box(opt('--zoom')!, '--zoom') : undefined));
        console.log(out);
      }
      return;
    }
    const seq = Number(opt('--page'));
    if (!Number.isInteger(seq) || seq < 1) throw new Error('--page <seq> is required');
    const pagePath = findPageImage(r, source, seq);
    const meta = await sharp(pagePath).metadata();
    const size = { width: meta.width ?? 0, height: meta.height ?? 0 };
    const turn = Number(opt('--rotate') ?? '0');
    if (![0, 90, 180, 270].includes(turn)) throw new Error('--rotate must be 0, 90, 180 or 270');
    const words = args.includes('--no-alto') || turn ? null : await altoWords(r, source, seq, size, (m) => console.error(m));
    let img = await loadGray(pagePath, turn);
    const o: ProposeOptions = {
      pageSeq: seq,
      ...(opt('--panel') ? { panel: opt('--panel')! } : {}),
      ...(opt('--region') ? { region: box(opt('--region')!, '--region') } : {}),
      ...(opt('--body') ? { body: pair(opt('--body')!, '--body') } : {}),
      ...(opt('--header-lines') ? { headerLines: Number(opt('--header-lines')) } : {}),
      ...(opt('--first-col') ? { firstCol: Number(opt('--first-col')) } : {}),
      ...(opt('--first-row') ? { firstRow: Number(opt('--first-row')) } : {}),
      ...(opt('--keep') ? { keep: opt('--keep')!.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(opt('--skip') ? { skip: parsePageList(opt('--skip')!) } : {}),
      ...(opt('--footnote') ? { footnote: pair(opt('--footnote')!, '--footnote') } : {}),
    };
    const region = o.region ?? [0, 0, img.width, img.height] as Box;
    const skew = estimateSkew(img, Math.min(150, otsu(img, clampBox(img, region))), clampBox(img, [region[0], o.body?.[0] ?? region[1], region[2], (o.body?.[1] ?? region[1] + region[3]) - (o.body?.[0] ?? region[1])]));
    let wordsUsed = words;
    const small = Math.abs(skew) >= 0.1 ? Math.round(skew * 100) / 100 : 0;
    const deskew = turn + small;
    if (small) {
      img = await loadGray(pagePath, deskew);
      wordsUsed = words?.map((w) => { const [x, y] = rotatePoint(w.x, w.y, deskew, size.width, size.height); return { ...w, x: Math.round(x), y: Math.round(y) }; }) ?? null;
    }
    const prop = proposePanel(img, wordsUsed, o);
    if (deskew) prop.panel.deskew_deg = deskew;
    for (const n of prop.notes) console.error(`note: ${n}`);
    if (deskew) console.error(`note: deskew ${deskew}° (page coordinates are after rotation)`);
    if (args.includes('--print')) { console.log(formatLayout({ layout_version: 1, source_id: source, table_ref: table, panels: [prop.panel] })); return; }
    const l = upsertPanel(readLayoutOr(lPath, source, table), prop.panel);
    const errs = validateLayout(l);
    if (errs.length) console.error(`warning: the layout does not validate yet:\n  ${errs.join('\n  ')}`);
    writeTextFile(lPath, formatLayout(l));
    console.log(lPath);
  };
  main().catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
