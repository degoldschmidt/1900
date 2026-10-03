/**
 * The page entry. With a ready data bundle (today only the invented preview world, Decision P-006)
 * it runs the game; while the 1914 data awaits transcription the release page shows what the
 * prototype will test. Boots through the artifact host's hot-reload hooks when present, so a
 * republish keeps a running game (its save code is the snapshot).
 */
import { render } from 'preact';
import '#kit/ui/reset.css';
import './style.css';
import { loadFromDom, isReady } from '#kit/data/bundle.ts';
import type { GameBundle } from '#kit/data/bundle.ts';
import { Sim } from '#kit/sim/sim.ts';
import { installTestHooks } from '#kit/devtools/test-hooks.ts';
import { mountInspector } from '#kit/devtools/inspector.tsx';
import { module } from './game.ts';
import { App, type Holder } from './app/App.tsx';
import { Game } from './app/controller.ts';

const TITLE = 'The Departure';
const HOOK = 'A courier’s journey across a railway map: pick your trains, use the hours in town before them, and mind the paper you leave behind.';
const QUESTIONS: string[] = 'Do players use their time in town for optional acts before departures?;Do missed connections feel like the player’s own planning mistakes?;Does an out-of-date timetable feel fair when a train turns out not to run?;Do sessions end aboard a night train, wanting the next leg?;Can players explain why the police closed a city when they did?'.split(';');

function Placeholder({ bundle }: { bundle: GameBundle }) {
  const waiting = bundle.meta.status === 'awaiting-data';
  return (
    <main class="page">
      <p class="eyebrow">Project 1900 · prototype</p>
      <h1>{TITLE}</h1>
      <p class="hook">{HOOK}</p>
      <section class="status" aria-live="polite">
        <h2>{waiting ? 'Waiting for transcribed data' : 'Data loaded'}</h2>
        <p>
          {waiting
            ? 'This page proves the single-file build. Gameplay is built only after the period timetables for this prototype are transcribed, checked and frozen as ' + (bundle.meta.freezeTag ?? 'a data release') + '.'
            : 'Data release ' + (bundle.meta.freezeTag ?? '') + ' is loaded.'}
        </p>
      </section>
      <section class="questions">
        <h2>What this prototype will test</h2>
        <ul>{QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
      </section>
      <p class="build">Build {__BUILD_ID__}</p>
    </main>
  );
}

function Failure({ message }: { message: string }) {
  return (
    <main class="page">
      <h1>{TITLE}</h1>
      <section class="status status-error" role="alert"><h2>The game data could not be read</h2><p>{message}</p></section>
    </main>
  );
}

/** The artifact host's hot-reload hooks (all optional; absent outside the host). */
interface HotHost {
  ready?: (start: (data: unknown) => void) => void;
  data?: unknown;
  snapshot?: (get: () => unknown) => void;
}
declare global { interface Window { claude?: { hot?: HotHost } } }

/** A save code handed back by the host after a republish: `{save}` or the code itself. */
function savedCode(data: unknown): string | null {
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object' && typeof (data as { save?: unknown }).save === 'string') return (data as { save: string }).save;
  return null;
}

const holder: Holder = { game: null };

function start(data: unknown): void {
  const root = document.getElementById('app');
  if (!root) return;
  try {
    const raw = loadFromDom();
    if (!isReady(raw)) { render(<Placeholder bundle={raw} />, root); return; }
    const bundle = module.bundleFrom(raw);
    let initial: Game | null = null;
    const code = savedCode(data);
    if (code) { try { initial = Game.restore(bundle, code); } catch { initial = null; } }
    holder.game = initial;
    const dataHash = raw.meta.dataHash;
    if (__DEBUG__ || __PREVIEW__) {
      let spare: Game | null = null;
      installTestHooks({
        getSim: () => holder.game?.sim ?? (spare ??= Game.create(bundle, module.scenarioIds[0]!)).sim,
        create: (id, seed) => new Sim(module.game, bundle, module.scenario(bundle, id, seed)),
        buildId: __BUILD_ID__, dataHash,
      });
    }
    try { window.claude?.hot?.snapshot?.(() => ({ save: holder.game?.saveCode() ?? null })); } catch { /* the host refused; nothing to keep */ }
    render(<App bundle={bundle} holder={holder} initial={initial} />, root);
    if (__DEBUG__) {
      mountInspector({ getSim: () => holder.game?.sim ?? Game.create(bundle, module.scenarioIds[0]!).sim, buildId: __BUILD_ID__, dataHash });
    }
  } catch (err) {
    render(<Failure message={err instanceof Error ? err.message : String(err)} />, root);
  }
}

if (window.claude?.hot?.ready) window.claude.hot.ready(start);
else start(window.claude?.hot?.data ?? {});
