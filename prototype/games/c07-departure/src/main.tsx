import { render } from 'preact';
import '#kit/ui/reset.css';
import './style.css';
import { loadFromDom } from '#kit/data/bundle.ts';
import type { GameBundle } from '#kit/data/bundle.ts';

const TITLE = 'The Departure';
const HOOK = 'A spy’s life played as an itinerary: every action has to fit into the slack before a train that leaves without you.';
const QUESTIONS: string[] = 'Do players use the slack before a departure instead of simply waiting?;Do missed connections feel like the player’s own planning mistakes?;Does an out-of-date timetable feel fair when a train turns out not to run?;Do sessions end aboard a night train, wanting the next leg?;Can players explain why the police closed a city when they did?'.split(';');

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

const root = document.getElementById('app');
if (root) {
  try {
    render(<Placeholder bundle={loadFromDom()} />, root);
  } catch (err) {
    render(<Failure message={err instanceof Error ? err.message : String(err)} />, root);
  }
}
