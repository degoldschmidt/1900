/**
 * Game data bundles. A bundle is compiled from the canonical CSVs by tools/compile and inlined into
 * each game's HTML as <script type="application/json" id="game-data">. Placeholder builds carry a
 * bundle whose status is "awaiting-data".
 */
export type BundleStatus = 'awaiting-data' | 'ready';

export interface BundleMeta {
  game: string;
  status: BundleStatus;
  /** True only for bundles built from synthetic test fixtures; release builds refuse these. */
  synthetic: boolean;
  dataHash: string;
  freezeTag?: string;
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
