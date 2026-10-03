/**
 * Planner (RULES.md 9): itineraries on your own guides from up to six successive departures, each
 * with the slack at every change, the odds of a miss before you commit, the records the journey
 * writes, health, the fare per class and the source of every train. Booking happens here; the
 * planner's suggestion is marked, and choosing it is stamped as such (H07-6).
 */
import { useMemo, useState } from 'preact/hooks';
import { plannerView, commissionsView, type PlannerOption, type C07Command } from '../views/index.ts';
import type { Ctl, Inputs, Source } from './types.ts';
import { T, dur, pct, Cite, Refusal, ScreenHead, Empty } from './common.tsx';

const CLS = ['', '1st', '2nd', '3rd'];
const SOURCE_WORD: Record<string, string> = { guide: 'guide', porter: 'porter', board: 'board', cable: 'telegram', observed: 'seen' };

function Option({ o, ctl, train, fromBoard }: { o: PlannerOption; ctl: Ctl; train: string | null; fromBoard: boolean }) {
  const [err, setErr] = useState<{ text: string; cmd: C07Command } | null>(null);
  const usesPick = train !== null && o.legs.some((l) => l.trainKey === train);
  const source: Source = o.isDefault ? 'default' : fromBoard && usesPick ? 'board' : 'planner';
  const book = (cmd: C07Command) => {
    const e = ctl.send(cmd, source);
    if (e) setErr({ text: e, cmd }); else ctl.go('diary');
  };
  const canDrop = err && err.cmd.type === 'book' && !err.cmd.dropSlots && /Planned acts/.test(err.text);
  return (
    <li class={`opt${o.isDefault ? ' opt-default' : ''}${usesPick ? ' opt-pick' : ''}`}>
      <div class="opt-head">
        <p class="opt-times"><T c={o.dep} /><span class="arrow" aria-hidden="true">→</span><T c={o.arr} /></p>
        <p class="opt-sum">{dur(o.durationSec)} · {o.trains === 1 ? 'direct' : `${o.trains} trains`}</p>
        {o.isDefault ? <p class="badge">Suggested</p> : null}
        {usesPick ? <p class="badge badge-quiet">your train</p> : null}
      </div>
      <ol class="opt-legs">
        {o.legs.map((l, i) => (
          <li key={i}>
            <p class="leg-train"><b>{l.trainNo}</b>{l.name ? <i> {l.name}</i> : null} <span class="leg-op">{l.operatorName}</span></p>
            <p class="leg-run"><T c={l.dep} /> {l.fromName} <span class="arrow" aria-hidden="true">→</span> <T c={l.arr} /> {l.toName}</p>
            <p class="leg-src">
              {SOURCE_WORD[l.source.kind] ?? l.source.kind}: {l.source.editionLabel} · {l.source.confidence}‰ sure <Cite c={l.citation} />
            </p>
            {o.changes[i] ? (
              <p class={`change${o.changes[i]!.odds > 100 ? ' risky' : ''}`}>
                Change at {o.changes[i]!.stationName}{o.changes[i]!.through ? ' (through carriage)' : ''}: slack <b>{dur(o.changes[i]!.slackSec)}</b>, miss odds <b>{pct(o.changes[i]!.odds)}</b>
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      <p class={`opt-odds${o.odds > 100 ? ' risky' : ''}`}>Odds of missing a connection: <b>{pct(o.odds)}</b>{o.trains > 1 ? <> · least slack {dur(o.minSlackSec)}</> : null}</p>
      <p class="opt-trace">Writes: {o.traceLabels.length ? o.traceLabels.map((t, i) => (
        <span key={i} class="trace-item" title={t.readers.length ? `Read by ${t.readers.join(', ')}` : undefined}>{t.label}{t.named ? ' (named)' : ' (anonymous)'}</span>
      )) : 'nothing'}</p>
      <div class="opt-book" role="group" aria-label="Book">
        {o.classes.map((c) => (
          <button key={c.cls} type="button" class="btn btn-fare" id={`book-${o.index}-${c.cls}`} disabled={!c.legal} title={c.error ?? undefined} onClick={() => book(c.cmd)}>
            <span class="fare-cls">Book {CLS[c.cls]}</span>
            <span class="fare-amt">{c.fare.join(' + ')}{c.designFare ? '*' : ''}</span>
            {c.health ? <span class="fare-h">{c.health}‰ health</span> : null}
          </button>
        ))}
        {o.sleeper.available && o.sleeper.cmd ? (
          <button type="button" class="btn btn-fare" id={`book-${o.index}-berth`} disabled={!o.sleeper.legal} title={o.sleeper.error ?? undefined} onClick={() => book(o.sleeper.cmd!)}>
            <span class="fare-cls">Berth</span><span class="fare-amt">{o.sleeper.fare.join(' + ')}</span>
          </button>
        ) : null}
      </div>
      {o.classes.every((c) => !c.legal) && o.classes[0]?.error ? <p class="act-why">{o.classes[0].error}</p> : null}
      {err ? (
        <div class="opt-err">
          <Refusal text={err.text} />
          {canDrop ? <button type="button" class="btn btn-small" id={`book-${o.index}-drop`} onClick={() => book({ ...(err.cmd as Extract<C07Command, { type: 'book' }>), dropSlots: true })}>Book and drop those acts</button> : null}
        </div>
      ) : null}
    </li>
  );
}

export function Planner({ inp, ctl, to, train, fromBoard }: { inp: Inputs; ctl: Ctl; to: string | undefined; train: string | null; fromBoard: boolean }) {
  const b = inp.d.b;
  const here = inp.p.me.where.k === 'city' ? inp.p.me.where.city : null;
  const cities = b.gameCities.filter((c) => c !== here);
  const suggested = useMemo(() => {
    const cv = commissionsView(inp.p, inp.d);
    for (const o of cv.held) { const st = o.stages.find((x) => x.done === null && x.city !== here); if (st) return st.city; }
    return cities[0]!;
  }, [inp.v]);
  const dest = to && cities.includes(to) ? to : suggested;
  const pv = useMemo(() => plannerView(inp.p, inp.d, dest), [inp.v, dest]);
  const days: string[] = [];
  for (const o of pv.options) if (!days.includes(o.dep.date)) days.push(o.dep.date);
  return (
    <div class="planner">
      <ScreenHead title="Planner" sub={<>From {pv.fromName}{pv.earliestStart ? <>, on a platform from <T c={pv.earliestStart} /></> : null}. Only the trains your guides and enquiries know of.</>} />
      <div class="field">
        <label for="plan-to">To</label>
        <select id="plan-to" value={dest} onChange={(e) => ctl.go('plan', { to: (e.currentTarget as HTMLSelectElement).value, train: null })}>
          {cities.map((c) => <option key={c} value={c}>{b.city.get(c)?.name ?? c}{c === suggested ? ' (next meeting)' : ''}</option>)}
        </select>
      </div>
      {inp.p.diary.booking ? <p class="sec-note">Booking here replaces your current booking.</p> : null}
      {pv.note ? <Empty>{pv.note}</Empty> : null}
      {days.map((day) => (
        <section key={day} class="opt-day" aria-label={day}>
          <h3 class="day-rule">{day}</h3>
          <ol class="opts">
            {pv.options.filter((o) => o.dep.date === day).map((o) => <Option key={`${dest}-${o.index}`} o={o} ctl={ctl} train={train} fromBoard={fromBoard} />)}
          </ol>
        </section>
      ))}
      {pv.options.some((o) => o.classes.some((c) => c.designFare)) ? <p class="sec-note">* a stand-in fare (design value, no fare printed).</p> : null}
    </div>
  );
}
