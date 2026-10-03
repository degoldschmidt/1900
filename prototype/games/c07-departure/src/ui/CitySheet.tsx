/**
 * The city sheet over the map: your own city's departures, your booked train with its countdown
 * and the things to do in town before it; or, for another city, the best journeys there. Rows in
 * plain words, one Book button each.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { CitySheetViewModel, DepartureRow, C07Command } from '../views/index.ts';
import type { Ctl, Source } from './types.ts';
import { Refusal } from './common.tsx';

const CLASSES: Array<[1 | 2 | 3, string]> = [[1, '1st'], [2, '2nd'], [3, '3rd']];

function Row({ r, i, busy, onBook }: { r: DepartureRow; i: number; busy: boolean; onBook: (cmd: C07Command, source: Source) => void }) {
  const [time, ...rest] = r.head.split(' ');
  return (
    <li class={`dep${r.goal ? ' dep-goal' : ''}${r.legal ? '' : ' dep-no'}`}>
      <div class="dep-main">
        <p class="dep-head"><time class="t dep-t">{time}</time> {rest.join(' ')}</p>
        <p class="dep-sub">{r.times} · {r.train}</p>
        <p class="dep-meta">
          <span class="rel">{r.reliability}</span>
          {r.notes.map((n) => <span key={n} class="note">{n}</span>)}
        </p>
        {!r.legal && r.error ? <p class="dep-why">{r.error}</p> : null}
      </div>
      <div class="dep-side">
        <p class="dep-fare">{r.fare}</p>
        <button type="button" class="btn btn-book" id={`book-${i}`} disabled={!r.legal || busy} onClick={() => onBook(r.cmd, r.source)}>Book</button>
        {r.berth ? <button type="button" class="btn btn-quiet btn-berth" id={`berth-${i}`} disabled={!r.berth.legal || busy} onClick={() => onBook(r.berth!.cmd, r.source)}>With a berth, {r.berth.fare}</button> : null}
      </div>
    </li>
  );
}

export function CitySheet({ sv, ctl, cls, setCls, busy, flash }: {
  sv: CitySheetViewModel; ctl: Ctl; cls: 1 | 2 | 3; setCls: (c: 1 | 2 | 3) => void; busy: boolean; flash: string | null;
}) {
  const [err, setErr] = useState<string | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const box = useRef<HTMLElement>(null);
  useEffect(() => { setErr(null); if (box.current) box.current.scrollTop = 0; head.current?.focus({ preventScroll: true }); }, [sv.city]);
  useEffect(() => { if (flash && box.current) box.current.scrollTop = 0; }, [flash]);
  const book = (cmd: C07Command, source: Source) => setErr(ctl.book(cmd, source));
  const showDeps = sv.departures.length > 0 || (!sv.booking && sv.note);
  const meetHere = sv.choices.some((c) => c.kind === 'meet');
  const townBlock = sv.here && sv.choices.length ? (
        <section class="town" aria-labelledby="town-h">
          <h3 class="sheet-h3" id="town-h">{sv.booking ? 'Before your train' : 'In town'}</h3>
          <ul class="choices">
            {sv.choices.map((c, i) => (
              <li key={c.id}>
                <button type="button" class="choice" id={sv.choices.findIndex((x) => x.kind === c.kind) === i ? `do-${c.kind}` : `do-${c.kind}-${i}`} disabled={!c.legal || busy} onClick={() => setErr(ctl.act(c.cmd))}>
                  <span class="choice-l">{c.label}</span>
                  <span class="choice-t">{c.time}</span>
                  <span class="choice-e">{c.legal ? c.effect : c.error}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null;
  return (
    <aside class="sheet city-sheet" id="sheet" role="dialog" aria-modal="false" aria-labelledby="sheet-h" ref={box}>
      <header class="sheet-head">
        <div>
          <p class="sheet-kicker">{sv.country}{sv.here ? ' · you are here' : ''}</p>
          <h2 id="sheet-h" class="sheet-city" tabIndex={-1} ref={head}>{sv.cityName}</h2>
        </div>
        <button type="button" class="btn-close" id="sheet-close" aria-label="Close" onClick={() => ctl.openCity(null)}>Close</button>
      </header>
      {sv.goalNote ? <p class="sheet-goal">{sv.goalNote}</p> : null}
      {flash ? <p class="flash" role="status">{flash}</p> : null}
      <Refusal text={err} id="sheet-refusal" />
      {sv.booking ? (
        <section class="ticket" aria-labelledby="ticket-h">
          <p class="ticket-k" id="ticket-h">Your train</p>
          <p class="ticket-head">{sv.booking.head}</p>
          <p class="ticket-sub">{sv.booking.times}</p>
          <p class="countdown" id="countdown">Your train leaves in <b>{sv.booking.leavesIn}</b>. Leave for the station by {sv.booking.leaveBy}.</p>
          <div class="ticket-btns">
            <button type="button" class="btn btn-go" id="set-off" disabled={busy} onClick={() => ctl.go()}>Set off</button>
            {sv.booking.cancelLegal ? <button type="button" class="link" id="cancel-booking" disabled={busy} onClick={() => setErr(ctl.send(sv.booking!.cancel))}>Cancel the booking</button> : null}
          </div>
        </section>
      ) : null}
      {sv.booking || meetHere ? townBlock : null}
      {showDeps ? (
        <section class="deps" aria-labelledby="deps-h">
          <div class="deps-head">
            <h3 class="sheet-h3" id="deps-h">{sv.here ? 'Departures' : `Journeys to ${sv.cityName}`}</h3>
            <fieldset class="cls">
              <legend class="vh">Class</legend>
              {CLASSES.map(([c, l]) => (
                <label key={c} class={`cls-opt${cls === c ? ' on' : ''}`} for={`cls-${c}`}>
                  <input type="radio" name="cls" id={`cls-${c}`} value={String(c)} checked={cls === c} onChange={() => setCls(c)} />{l}
                </label>
              ))}
            </fieldset>
          </div>
          {sv.departures.length ? <ol class="dep-list">{sv.departures.map((r, i) => <Row key={r.id} r={r} i={i} busy={busy} onBook={book} />)}</ol> : null}
          {sv.note ? <p class="sheet-note">{sv.note}</p> : null}
        </section>
      ) : null}
      {sv.booking || meetHere ? null : townBlock}
    </aside>
  );
}
