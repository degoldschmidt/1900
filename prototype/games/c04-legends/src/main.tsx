import { render } from 'preact';
import '#kit/ui/reset.css';
import './style.css';
import { loadFromDom } from '#kit/data/bundle.ts';
import type { GameBundle } from '#kit/data/bundle.ts';

const TITLE = 'The Legend Portfolio';
const HOOK = 'Each cover identity keeps its own flat, account and police file; the hunt advances only by linking two of your names.';
const QUESTIONS: string[] = 'Does burning a well-built identity feel like a real loss without ending the game?;Do players plan the hand-over between names so the timetable keeps them apart?;Does keeping several lives running feel like planning rather than chores?;Do players keep playing after losing a name?;Can players explain an escape made by a connection the police did not know?'.split(';');

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
