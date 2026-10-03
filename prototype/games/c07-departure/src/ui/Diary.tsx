/**
 * The diary page, the face of the game (RULES.md 9 DiaryPage): today's date and place, the booked
 * departure pinned as a pasteboard ticket with the slack before you must leave, the day's entries
 * (each act with its hours and cost) and what happened while time passed. Advance lives at the
 * bottom, in thumb reach, and first lists what will pass.
 */
import { useMemo, useState } from 'preact/hooks';
import { diaryView, actionsView, type DiaryViewModel, type ActionView } from '../views/index.ts';
import type { Ctl, Inputs } from './types.ts';
import { T, dur, pct, Refusal, ActCard, Section, Leader } from './common.tsx';

const CLASS_WORD = ['', 'First class', 'Second class', 'Third class'];
const VENUE_WORD: Record<string, string> = { station: 'at the station', bank: 'at the bank', post: 'at the post office', telegraph: 'at the telegraph office', hotel: 'at the hotel', meeting: 'at a meeting place', street: 'in the street', train: 'in the train' };

export function Ticket({ dv, ctl }: { dv: DiaryViewModel; ctl: Ctl }) {
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bk = dv.booking;
  const aboard = dv.place.kind === 'aboard' ? dv.place : null;
  if (!bk && !aboard) {
    return (
      <section class="ticket ticket-none" aria-label="Booked departure">
        <p class="tk-none">No departure booked.</p>
        <p class="tk-none-sub">The departure is the turn: book one, then fill the time before it.</p>
        {dv.ended ? null : <button type="button" class="btn" id="ticket-plan" onClick={() => ctl.go('plan')}>Plan a departure</button>}
      </section>
    );
  }
  if (!bk && aboard) {
    return (
      <section class="ticket ticket-c2 punched" aria-label="Your ride">
        <p class="tk-top"><span class="tk-cls">In the train</span><span class="tk-no">{aboard.trainNo}</span></p>
        <p class="tk-route"><span class="tk-to-word">to</span> <span class="tk-city">{aboard.toName}</span></p>
        <p class="tk-train">due <T c={aboard.schedArr} />{aboard.shownDelaySec > 0 ? ` · ${dur(aboard.shownDelaySec)} late so far` : ''}</p>
      </section>
    );
  }
  const b = bk!;
  const first = b.legs[0]!; const last = b.legs[b.legs.length - 1]!;
  const tight = b.slackSec !== null && b.slackSec < 1800;
  const cancel = () => { const e = ctl.send({ type: 'cancelBooking' }); setErr(e); setConfirm(false); };
  return (
    <section class={`ticket ticket-c${b.cls}${aboard ? ' punched' : ''}`} aria-label="Booked departure">
      <p class="tk-top">
        <span class="tk-cls">{CLASS_WORD[b.cls]}{b.sleeper ? ' · berth' : ''}</span>
        <span class="tk-no">No. {String(b.id).padStart(4, '0')}</span>
      </p>
      <p class="tk-route">
        <span class="tk-city">{first.fromName}</span>
        <span class="tk-to-word">to</span>
        <span class="tk-city">{last.toName}</span>
      </p>
      <ol class="tk-legs">
        {b.legs.map((l, i) => (
          <li key={`${l.tripId}-${l.day}-${i}`} class={i < b.next ? 'done' : i === b.next ? 'next' : ''}>
            <span class="tk-train">{l.trainNo}{l.name ? ` ${l.name}` : ''}</span>
            <span class="tk-times"><T c={l.dep} />–<T c={l.arr} /></span>
            {b.legs.length > 1 ? <span class="tk-leg-route">{l.fromName} → {l.toName}</span> : null}
          </li>
        ))}
      </ol>
      {aboard ? (
        <p class="tk-status">In the {aboard.trainNo} to {aboard.toName}, due <T c={aboard.schedArr} />{aboard.shownDelaySec > 0 ? ` · ${dur(aboard.shownDelaySec)} late so far` : ''}</p>
      ) : (
        <div class="tk-slack">
          <p class={`tk-big${tight ? ' tight' : ''}`}>
            <span class="tk-big-k">Slack</span>
            <span class="tk-big-v" id="slack">{b.slackSec === null ? '—' : dur(b.slackSec)}</span>
          </p>
          <p class="tk-leave">Leave by <T c={b.leaveAt} />{b.countdownSec !== null ? <> · in {dur(b.countdownSec)}</> : null}</p>
        </div>
      )}
      <p class="tk-foot">
        <span>dep. <T c={first.dep} date /></span>
        <span class={b.missOdds > 100 ? 'odds-hi' : ''}>miss odds {pct(b.missOdds)}</span>
      </p>
      {!aboard ? (
        confirm
          ? <p class="tk-cancel"><span>Cancel this booking? The fare is not paid until you board.</span>
              <button type="button" class="btn btn-small btn-danger" id="cancel-yes" onClick={cancel}>Cancel it</button>
              <button type="button" class="btn btn-small btn-quiet" id="cancel-no" onClick={() => setConfirm(false)}>Keep it</button></p>
          : <p class="tk-cancel"><button type="button" class="link" id="cancel-booking" onClick={() => setConfirm(true)}>Cancel booking</button></p>
      ) : null}
      <Refusal text={err} />
    </section>
  );
}

function Entries({ dv, ctl }: { dv: DiaryViewModel; ctl: Ctl }) {
  const [err, setErr] = useState<string | null>(null);
  if (dv.slots.length === 0) return <p class="empty">Nothing entered. {dv.place.kind === 'city' ? 'Add acts from the town page; each takes time and leaves records.' : ''}</p>;
  return (
    <>
      <ol class="entries">
        {dv.slots.map((s) => (
          <li key={s.id} class={`entry st-${s.state}${s.ok ? '' : ' bad'}`}>
            <span class="e-time"><T c={s.start} /><span class="e-end">–<T c={s.end} /></span></span>
            <div class="e-body">
              <p class="e-label">{s.label} <span class="e-venue">{VENUE_WORD[s.venue] ?? s.venue}</span></p>
              <p class="e-meta">
                <span>{s.hours}</span>
                {s.travelSec > 0 ? <span>{dur(s.travelSec)} to get there</span> : null}
                {s.cost.map((c) => <span key={c} class="e-cost">{c}</span>)}
                {s.health !== 0 ? <span>{s.health > 0 ? '+' : ''}{s.health}‰ health</span> : null}
                {s.records.map((r) => <span key={r} class="e-trace">writes: {r}</span>)}
              </p>
              {!s.ok && s.reason ? <p class="act-why">{s.reason}</p> : null}
              <p class="e-state">{s.state === 'planned' ? null : s.state === 'running' ? 'under way' : s.state === 'done' ? 'done' : 'failed'}</p>
            </div>
            {s.state === 'planned'
              ? <button type="button" class="btn btn-small btn-quiet" id={`unplan-${s.id}`} onClick={() => setErr(ctl.send({ type: 'unplanVerb', slotId: s.id }))} aria-label={`Drop ${s.label}`}>Drop</button>
              : null}
          </li>
        ))}
      </ol>
      <Refusal text={err} />
    </>
  );
}

function AboardActs({ acts, ctl }: { acts: ActionView[]; ctl: Ctl }) {
  const [err, setErr] = useState<{ id: string; text: string | null } | null>(null);
  return (
    <ul class="acts">
      {acts.map((a) => <ActCard key={a.id} a={a} err={err?.id === a.id ? err.text : null} onAdd={(x) => setErr({ id: x.id, text: ctl.send(x.cmd) })} />)}
    </ul>
  );
}

export function Diary({ inp, ctl, noteFrom }: { inp: Inputs; ctl: Ctl; noteFrom: number }) {
  const dv = useMemo(() => diaryView(inp.p, inp.d), [inp.v]);
  const acts = useMemo(() => (dv.place.kind === 'aboard' ? actionsView(inp.p, inp.d).filter((a) => a.cmd.type === 'planVerb' || a.cmd.type === 'alight') : []), [inp.v]);
  const notes = dv.interrupts.filter((i) => i.index >= noteFrom);
  const [weekday, ...rest] = dv.now.date.split(' ');
  return (
    <article class="diary" aria-labelledby="diary-date">
      <header class="day-head">
        <h2 id="diary-date" class="day-date"><span class="day-wd">{weekday}</span> {rest.join(' ')}</h2>
        <p class="day-now"><T c={dv.now} /></p>
        <p class="day-place">
          {dv.place.kind === 'city'
            ? <>{dv.place.cityName}, {VENUE_WORD[dv.place.venue] ?? dv.place.venue}{dv.place.stationName && dv.place.venue === 'station' ? ` (${dv.place.stationName})` : ''}</>
            : <>Aboard the {dv.place.trainNo}{dv.place.sleeper ? ', in a berth' : ''}</>}
        </p>
      </header>

      <Ticket dv={dv} ctl={ctl} />

      {notes.length ? (
        <section class="notes" aria-label="While time passed" aria-live="polite">
          <h3 class="sec-h">While time passed</h3>
          <ol>{notes.map((n) => <li key={n.index} class={`note note-${n.kind}`}><T c={n.at} /> <span>{n.text}</span></li>)}</ol>
        </section>
      ) : null}

      <Section title="Entries" id="entries">
        <Entries dv={dv} ctl={ctl} />
        {dv.place.kind === 'city' && !dv.ended ? <button type="button" class="btn btn-quiet btn-wide" id="add-act" onClick={() => ctl.go('town')}>Add an act…</button> : null}
      </Section>

      {acts.length ? <Section title="In the train" id="aboard"><AboardActs acts={acts} ctl={ctl} /></Section> : null}

      <Section title="Yourself" id="self">
        <Leader k="Health"><meter min={0} max={1000} low={300} optimum={1000} value={dv.health} aria-label="Health">{dv.health}</meter> {dv.health}‰</Leader>
        {dv.busyUntil ? <Leader k="Busy until"><T c={dv.busyUntil} /></Leader> : null}
        <Leader k="Room">{dv.lodged ? <>{dv.lodged.tier}, {dv.lodged.cityName}, since <T c={dv.lodged.since} /></> : 'none taken'}</Leader>
      </Section>
    </article>
  );
}
