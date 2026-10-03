import { render } from 'preact';
import '#kit/ui/reset.css';
import './style.css';
import { loadFromDom } from '#kit/data/bundle.ts';
import type { GameBundle } from '#kit/data/bundle.ts';

const TITLE = 'Several Masters';
const HOOK = 'Several services pay you at once, each holding its own picture of you; the game is to retire before those pictures are compared.';
const QUESTIONS: string[] = 'Can players say which report raised a service’s suspicion?;Do players settle a lie before the audit that would test it?;Does the moment a patron turns hunter feel earned rather than sudden?;Do players see that their own successes paid for the hunters?;Can three masters be kept at once without the bookkeeping drowning the play?'.split(';');

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
