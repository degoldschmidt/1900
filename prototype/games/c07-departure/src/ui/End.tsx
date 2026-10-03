/**
 * Arrival (RULES.md 9: the ride's end, the delay, made or missed, what happened since boarding and
 * the news revealed on arrival), and at the end of a scenario the questionnaire (q1–q5, RULES.md
 * 5.11) followed by the autopsy: the hunting service's file, its fixes, every cordon and how it was
 * placed, so each one can be traced back to records of your own trail.
 */
import { useMemo, useState } from 'preact/hooks';
import { arrivalView, questionnaireView, commissionsView, type AutopsyViewModel, type QuestionView } from '../views/index.ts';
import type { Ctl, Inputs } from './types.ts';
import { ScreenHead, Section, Empty, Cite, T, dur } from './common.tsx';
import { CopyCode } from './Save.tsx';

export function Arrival({ inp, ctl }: { inp: Inputs; ctl: Ctl }) {
  const av = useMemo(() => arrivalView(inp.p, inp.d), [inp.v]);
  const due = useMemo(() => commissionsView(inp.p, inp.d).held.flatMap((o) => o.stages.filter((st) => st.done === null && st.city === av.city).slice(0, 1)), [inp.v]);
  if (!av.kind) return <div class="arrival"><ScreenHead title="Arrival" /><Empty>No journey has ended yet.</Empty></div>;
  const bad = av.kind !== 'arrival';
  return (
    <div class={`arrival${bad ? ' arrival-bad' : ''}`}>
      <header class="arr-head">
        <p class="arr-kind">{av.label}</p>
        <h2 class="arr-place">{av.stationName ?? ''}</h2>
        <p class="arr-at"><T c={av.at} date /></p>
      </header>
      <p class="arr-text">{av.text}</p>
      <dl class="arr-facts">
        {av.delaySec !== null ? <><dt>Delay</dt><dd>{av.delaySec > 0 ? dur(av.delaySec) : 'none'}</dd></> : null}
        {av.slackSec !== null ? <><dt>Your slack</dt><dd>{dur(av.slackSec)}</dd></> : null}
        {av.made === false ? <><dt>Connection</dt><dd>missed</dd></> : null}
      </dl>
      {due.length && !av.ended ? (
        <Section title="Due here" id="due-here">
          {due.map((st) => <p key={st.index} class="due">Your meeting in {st.cityName}: <T c={st.open} date />–<T c={st.close} />. Enter it in the diary from the town page.</p>)}
          <button type="button" class="btn" id="arr-town" onClick={() => ctl.go('town')}>To the town</button>
        </Section>
      ) : null}
      {av.since.length ? (
        <Section title="Since you boarded" id="since">
          <ol class="notes-list">{av.since.map((x, i) => <li key={i}><T c={x.at} /> {x.text}</li>)}</ol>
        </Section>
      ) : null}
      {av.news.length ? (
        <Section title={`In the ${av.cityName ?? ''} papers`} id="arr-news">
          <ol class="items">{av.news.map((n) => <li key={n.id} class="item"><p class="item-t">{n.title} <Cite c={n.citation} /></p></li>)}</ol>
        </Section>
      ) : null}
      <div class="arr-btns">
        {av.ended
          ? <button type="button" class="btn btn-advance" id="arr-questions" onClick={() => ctl.go('questions')}>The scenario is over: a few questions</button>
          : <>
              <button type="button" class="btn btn-advance" id="arr-plan" onClick={() => ctl.go('plan')}>Plan the next departure</button>
              <button type="button" class="btn btn-quiet" id="arr-diary" onClick={() => ctl.go('diary')}>Open the diary</button>
            </>}
      </div>
    </div>
  );
}

const ENDING_WORD: Record<string, string> = {
  delivered: 'Delivered', partial: 'Partly done', captured: 'Arrested', ruined: 'Ruined', stranded: 'Stranded',
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
    <div class="quiz">
      <ScreenHead title={ending ? ENDING_WORD[ending] ?? ending : 'The end'} sub="Before the autopsy, a few questions about how it felt. Answers go into the save code; skip any you like." />
      <form class="qform" onSubmit={(e) => { e.preventDefault(); const clean: Record<string, string | number> = {}; for (const [k, v] of Object.entries(a)) if (v !== '') clean[k] = v; onDone(clean); }}>
        {qs.map((q) => <Question key={q.id} q={q} value={a[q.id]} set={(v) => setA({ ...a, [q.id]: v })} />)}
        <button type="submit" class="btn btn-advance" id="q-submit">Hand in, and open the autopsy</button>
      </form>
    </div>
  );
}

export function Autopsy({ av, code, onAgain }: { av: AutopsyViewModel; code: string; onAgain: () => void }) {
  return (
    <div class="autopsy">
      <ScreenHead title="Autopsy" sub={<>{ENDING_WORD[av.ending.kind] ?? av.ending.kind} at <T c={av.ending.at} date />. What the {av.serviceName} knew, and when.</>} />
      {av.ending.causes.length ? <p class="arr-text">The ending came from: {av.ending.causes.map((c) => c.label).join(', ')}.</p> : null}
      <Section title="The file" id="file" note="Records of yours that reached the service, and when each arrived.">
        {av.file.length ? (
          <ol class="file">{av.file.map((f, i) => (
            <li key={i}><span class="file-l">{f.label}</span>{f.written ? <> written <T c={f.written} date /></> : null}, arrived <T c={f.arrived} date />{f.ownTrail ? '' : ' (not on your own trail)'}</li>
          ))}</ol>
        ) : <Empty>Nothing of yours reached them.</Empty>}
      </Section>
      <Section title="Fixes" id="fixes" note="Where the service placed you, from which record.">
        {av.fixes.length ? <ol class="file">{av.fixes.map((f, i) => <li key={i}>{f.cityName}: record of <T c={f.recordTime} date />, known <T c={f.at} date /></li>)}</ol> : <Empty>They never fixed your position.</Empty>}
      </Section>
      <Section title="Cordons" id="cordons">
        {av.cordons.length ? (
          <ol class="file">{av.cordons.map((c) => (
            <li key={c.id}>
              <b>{c.cityName}</b>, <T c={c.from} date />–<T c={c.to} date />: {c.via === 'train' ? `watchers sent by train${c.baseName ? ` from ${c.baseName}` : ''}` : 'the local office'}{c.sighted ? ', and they saw you' : ''}
              {c.causes.length ? <span class="muted"> (from records {c.causes.join(', ')})</span> : null}
            </li>
          ))}</ol>
        ) : <Empty>No cordon was placed.</Empty>}
      </Section>
      <Section title="Detections" id="detections">
        {av.detections.length ? <ol class="file">{av.detections.map((x, i) => <li key={i}><T c={x.at} date /> by cordon {x.cordon}{x.noticed ? ', and you noticed' : ''}</li>)}</ol> : <Empty>You were never detected.</Empty>}
      </Section>
      <Section title="Save code with your answers" id="final-code" note="If you are playtesting, send this line back.">
        <CopyCode code={code} id="final-code-field" />
      </Section>
      <p><button type="button" class="btn" id="play-again" onClick={onAgain}>Back to the start</button></p>
    </div>
  );
}
