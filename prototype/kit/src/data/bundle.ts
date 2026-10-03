/**
 * Game data bundles (schema 1). A bundle is compiled from the canonical CSVs by
 * tools/compile/compile-bundles.ts and inlined into each game's HTML as
 * <script type="application/json" id="game-data">. Placeholder builds carry only `meta`
 * with status "awaiting-data".
 */
import type { ParamRow, WorldEventRow, InstitutionRow } from '../params/types.ts';
import type { TimetableData } from '../timetable/types.ts';

export type BundleStatus = 'awaiting-data' | 'ready';

export interface BundleMeta {
  game: string;
  status: BundleStatus;
  /** True only for bundles built from synthetic test fixtures; release builds refuse these. */
  synthetic: boolean;
  dataHash: string;
  freezeTag?: string;
  schema?: 1;
  /** Day-number window the game may simulate: [fromDay, toDay] inclusive. */
  window?: [number, number];
}

/** Where a historical value was read: a page of a source, and the table on it. */
export interface Citation {
  source: string;
  sourceTitle: string;
  edition: string | null;
  pageSeq: number;
  printedPage: string;
  tableRef: string | null;
}

export interface DesignValueRow {
  id: string;
  value: unknown;
  unit: string;
  rationale: string;
}

export interface ReadyBundle extends TimetableData {
  meta: BundleMeta & { status: 'ready'; schema: 1; window: [number, number] };
  citations: Citation[];
  params: ParamRow[];
  calendar: WorldEventRow[];
  institutions: InstitutionRow[];
  designValues: DesignValueRow[];
}

export interface GameBundle {
  meta: BundleMeta;
  [section: string]: unknown;
}

export function decodeBundle(json: string): GameBundle {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || !('meta' in parsed)) {
    throw new Error('Game data is missing its meta section.');
  }
  const bundle = parsed as GameBundle;
  const m = bundle.meta;
  if (typeof m.game !== 'string' || typeof m.synthetic !== 'boolean') {
    throw new Error('Game data meta section is malformed.');
  }
  return bundle;
}

export function isReady(b: GameBundle): b is GameBundle & ReadyBundle {
  return b.meta.status === 'ready';
}

/** Reads the inlined bundle. Release builds reject synthetic data. */
export function loadFromDom(id = 'game-data', doc: Document = document): GameBundle {
  const el = doc.getElementById(id);
  if (!el || !el.textContent) throw new Error(`No element #${id} holds game data.`);
  const bundle = decodeBundle(el.textContent);
  if (bundle.meta.synthetic && !__DEBUG__) {
    throw new Error('This release build contains synthetic test data and cannot run.');
  }
  return bundle;
}
