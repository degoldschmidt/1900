/**
 * The start screen: the scenarios (the tutorial first, recommended), the seed each runs on,
 * Resume when this browser kept a game, and a field to paste a save code.
 */
import { useState } from 'preact/hooks';
import { Refusal } from './common.tsx';

export interface ScenarioCard { id: string; title: string; note: string; seed: number; recommended: boolean }
export interface StoredCard { title: string; entries: number }

export function Start({ scenarios, stored, onStart, onResume, onRestore }: {
  scenarios: ScenarioCard[]; stored: StoredCard | null;
  onStart: (id: string, seed?: number) => void; onResume: () => string | null; onRestore: (code: string) => string | null;
}) {
  const [seed, setSeed] = useState('');
  const [paste, setPaste] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [resumeErr, setResumeErr] = useState<string | null>(null);
  const seedNum = /^\d{1,9}$/.test(seed.trim()) ? Number(seed.trim()) : undefined;
  return (
    <main class="start" aria-labelledby="start-h">
      <header class="start-head">
        <p class="start-kicker">A travelling agent’s pocket diary, spring 1914</p>
        <h1 id="start-h">The Departure</h1>
        <p class="start-hook">Every act takes time, keeps hours, costs money and health, and leaves paper behind. The train you booked leaves without you. Fill the slack before it, or don’t.</p>
      </header>

      {stored ? (
        <section class="resume" aria-label="Resume">
          <p>This browser kept a game: <b>{stored.title}</b>, {stored.entries} {stored.entries === 1 ? 'entry' : 'entries'}.</p>
          <button type="button" class="btn btn-advance" id="resume" onClick={() => setResumeErr(onResume())}>Resume</button>
          <Refusal text={resumeErr} />
        </section>
      ) : null}

      <section class="scenarios" aria-labelledby="sc-h">
        <h2 id="sc-h" class="sec-h">Choose a journey</h2>
        <ol>
          {scenarios.map((s) => (
            <li key={s.id} class={`scenario${s.recommended ? ' rec' : ''}`}>
              {s.recommended ? <p class="badge">Recommended first</p> : null}
              <h3 class="sc-t">{s.title}</h3>
              <p class="sc-n">{s.note}</p>
              <p class="sc-seed">Seed <span class="t">{seedNum ?? s.seed}</span></p>
              <button type="button" class={`btn${s.recommended ? ' btn-advance' : ''}`} id={`start-${s.id}`} onClick={() => onStart(s.id, seedNum)}>Begin “{s.title}”</button>
            </li>
          ))}
        </ol>
        <div class="field field-inline">
          <label for="start-seed">Another seed (optional)</label>
          <input id="start-seed" inputMode="numeric" autocomplete="off" placeholder="the scenario’s own" value={seed} onInput={(e) => setSeed((e.currentTarget as HTMLInputElement).value)} />
        </div>
      </section>

      <section class="paste" aria-labelledby="paste-h">
        <h2 id="paste-h" class="sec-h">Paste a save code</h2>
        <label for="paste-code" class="vh">Save code</label>
        <textarea id="paste-code" rows={3} spellcheck={false} placeholder="eyJ2IjoxLCJnYW1lIjoi…" value={paste} onInput={(e) => setPaste((e.currentTarget as HTMLTextAreaElement).value)} />
        <button type="button" class="btn" id="paste-restore" disabled={!paste.trim()} onClick={() => setErr(onRestore(paste))}>Restore</button>
        <Refusal text={err} />
      </section>
    </main>
  );
}
