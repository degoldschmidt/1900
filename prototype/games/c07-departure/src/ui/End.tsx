/**
 * The end of a scenario: the questionnaire (q1–q5, RULES.md 5.11), then the autopsy as a map
 * replay: your route drawn, numbered points where your records were made (filled when the hunting
 * service received one), and where its watchers could have stood.
 */
import { useMemo, useState } from 'preact/hooks';
import { questionnaireView, mapView, type QuestionView, type ReplayViewModel, type MapViewModel } from '../views/index.ts';
import type { Inputs } from './types.ts';
import { Section, T } from './common.tsx';
import { CopyCode } from './Save.tsx';
import { MapCanvas } from './MapCanvas.tsx';

const ENDING_WORD: Record<string, string> = {
  delivered: 'Delivered', partial: 'Out of time', captured: 'Arrested', ruined: 'Ruined', stranded: 'Stranded',
};

function Question({ q, value, set }: { q: QuestionView; value: string | number | undefined; set: (v: string | number) => void }) {
  if (q.kind === 'text') {
    return (
      <div class="q">
        <label for={`${q.id}-text`} class="q-p">{q.prompt}</label>
        <textarea id={`${q.id}-text`} rows={3} value={String(value ?? '')} onInput={(e) => set((e.currentTarget as HTMLTextAreaElement).value)} />
      </div>
    );
  }
  if (q.kind === 'record') {
    return (
      <div class="q">
        <label for={`${q.id}-record`} class="q-p">{q.prompt}</label>
        <select id={`${q.id}-record`} value={value === undefined ? '' : String(value)} onChange={(e) => { const v = (e.currentTarget as HTMLSelectElement).value; if (v) set(Number(v)); }}>
          <option value="">Choose a record</option>
          {q.options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <fieldset class={`q q-${q.kind}`}>
      <legend class="q-p">{q.prompt}</legend>
      <div class="q-opts">
        {q.options.map((o) => (
          <label key={String(o.value)} class="q-opt" for={`${q.id}-${o.value}`}>
            <input type="radio" id={`${q.id}-${o.value}`} name={q.id} value={String(o.value)} checked={value === o.value} onChange={() => set(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Questionnaire({ inp, initial, onDone, ending }: { inp: Inputs; initial: Record<string, string | number>; onDone: (a: Record<string, string | number>) => void; ending: string | null }) {
  const qs = useMemo(() => questionnaireView(inp.p, inp.d), [inp.v]);
  const [a, setA] = useState<Record<string, string | number>>(initial);
  return (
    <main class="page quiz" aria-labelledby="quiz-h">
      <p class="page-kicker">The end of the journey</p>
      <h2 id="quiz-h" class="page-h">{ending ? ENDING_WORD[ending] ?? ending : 'The end'}</h2>
      <p class="page-sub">Before the replay, a few questions about how it felt. Answers go into the save code; skip any you like.</p>
      <form class="qform" onSubmit={(e) => { e.preventDefault(); const clean: Record<string, string | number> = {}; for (const [k, v] of Object.entries(a)) if (v !== '') clean[k] = v; onDone(clean); }}>
        {qs.map((q) => <Question key={q.id} q={q} value={a[q.id]} set={(v) => setA({ ...a, [q.id]: v })} />)}
        <button type="submit" class="btn btn-go" id="q-submit">Hand in, and replay the journey</button>
      </form>
    </main>
  );
}

export function Replay({ rv, inp, code, onAgain }: { rv: ReplayViewModel; inp: Inputs; code: string; onAgain: () => void }) {
  const mv: MapViewModel = useMemo(() => {
    const base = mapView(inp.p, inp.d);
    return { ...base, route: null, goal: null, night: false, cities: base.cities.map((c) => ({ ...c, here: false, goal: false, direct: false, attention: 0 as const })) };
  }, [inp.v]);
  const box = useMemo((): [number, number, number, number] => {
    const xs = [...rv.records.map((r) => r.x), ...rv.watchers.map((w) => w.x)]; const ys = [...rv.records.map((r) => r.y), ...rv.watchers.map((w) => w.y)];
    if (xs.length < 2) return mv.geo.bounds;
    return [Math.min(...xs) - 40, Math.min(...ys) - 50, Math.max(...xs) + 60, Math.max(...ys) + 40];
  }, [rv]);
  const layer = (k: number) => (
    <g class="replay-layer">
      {rv.route.map((r, i) => <path key={i} class={`replay-route${r.mode === 'steamer' ? ' by-water' : ''}`} d={r.d} stroke-width={4 * k} stroke-dasharray={r.mode === 'steamer' ? `${6 * k} ${4 * k}` : undefined} />)}
    </g>
  );
  const marks = (k: number) => (
    <g class="replay-marks">
      {rv.watchers.map((w) => (
        <g key={w.id} class={`watch${w.sighted ? ' watch-saw' : ''}`}>
          {w.base ? <path class="watch-trip" d={`M${w.base.x} ${w.base.y}L${w.x} ${w.y}`} stroke-width={1.5 * k} stroke-dasharray={`${4 * k} ${3 * k}`} /> : null}
          <circle class="watch-ring" cx={w.x} cy={w.y} r={26 * k} stroke-width={1.5 * k} />
        </g>
      ))}
      {rv.records.map((r) => (
        <g key={r.n} class={`rec${r.filed ? ' rec-filed' : ''}${r.named ? ' rec-named' : ''}`}>
          <circle cx={r.x} cy={r.y} r={7.5 * k} stroke-width={1.5 * k} />
          <text x={r.x} y={r.y + 3.4 * k} font-size={9.5 * k} text-anchor="middle">{r.n}</text>
        </g>
      ))}
    </g>
  );
  return (
    <main class="page replay" aria-labelledby="replay-h">
      <p class="page-kicker">The replay</p>
      <h2 id="replay-h" class="page-h">{rv.ending.word}</h2>
      <p class="page-sub">{rv.ending.text} <T c={rv.ending.at} date />. What the {rv.serviceName} could have followed, on the map.</p>
      <div class="replay-map">
        <MapCanvas mv={mv} token={{ x: 0, y: 0 }} showToken={false} label="Your journey replayed" extra={layer} over={marks} fitBox={box} />
        <p class="replay-key" aria-hidden="true"><span class="k-route" /> your route <span class="k-rec" /> a record <span class="k-filed" /> it reached them <span class="k-watch" /> a watch</p>
      </div>
      <ul class="plain replay-sum">{rv.summary.map((s) => <li key={s}>{s}</li>)}</ul>
      <Section title="Where you left paper behind" id="rp-records">
        <ol class="rp-list">
          {rv.records.map((r) => (
            <li key={r.n} value={r.n} class={r.filed ? 'filed' : ''}>
              <T c={r.at} date /> · {r.place}: {r.label}{r.named ? ', in your name' : ''}.{r.filed ? <> Reached them <T c={r.filed} date />.</> : null}
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Where a watcher could have stood" id="rp-watch">
        {rv.watchers.length ? <ul class="plain">{rv.watchers.map((w) => <li key={w.id}>{w.text}</li>)}</ul> : <p class="sheet-note">Nobody was sent to watch for you.</p>}
      </Section>
      <Section title="Save code with your answers" id="final-code" note="If you are playtesting, send this line back.">
        <CopyCode code={code} id="final-code-field" />
      </Section>
      <p><button type="button" class="btn" id="play-again" onClick={onAgain}>Back to the start</button></p>
    </main>
  );
}
