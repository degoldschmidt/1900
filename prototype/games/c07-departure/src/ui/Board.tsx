/**
 * Departure board (RULES.md 9): the departures you know of from a station, set like a guide
 * table, each with where your knowledge comes from (the edition you own, a porter, the board, a
 * telegram), how sure it is and the printed source behind the dagger. Never the truth on the
 * ground. Porters and the board itself can be asked from here.
 */
import { useMemo, useState } from 'preact/hooks';
import { boardView, actionsView, type ActionView } from '../views/index.ts';
import type { Ctl, Inputs } from './types.ts';
import { T, dur, Cite, ScreenHead, Empty, ActCard, Section } from './common.tsx';

const SOURCE_WORD: Record<string, string> = { guide: 'guide', porter: 'porter', board: 'board', cable: 'telegram', observed: 'seen' };
const HORIZONS: Array<[number, string]> = [[10800, 'the next 3 hours'], [43200, 'the next 12 hours'], [86400, 'the next 24 hours']];

export function Board({ inp, ctl, station }: { inp: Inputs; ctl: Ctl; station: string | undefined }) {
  const b = inp.d.b;
  const where = inp.p.me.where;
  const city = where.k === 'city' ? where.city : b.station.get(where.ride.to)?.city ?? '';
  const stations = b.raw.stations.filter((s) => s.city === city).map((s) => s.id);
  const st = station && stations.includes(station) ? station : where.k === 'city' ? (where.station && stations.includes(where.station) ? where.station : stations[0]!) : where.ride.to;
  const [horizon, setHorizon] = useState(43200);
  const bv = useMemo(() => boardView(inp.p, inp.d, st, horizon), [inp.v, st, horizon]);
  const learn = useMemo(() => actionsView(inp.p, inp.d).filter((a) => a.cmd.type === 'planVerb' && (a.cmd.verb === 'checkBoard' || a.cmd.verb === 'askPorter' || (a.cmd.verb === 'cable' && (a.cmd.args as { purpose?: string }).purpose === 'enquire'))), [inp.v]);
  const [err, setErr] = useState<{ id: string; text: string | null } | null>(null);
  /** The furthest town on the train's run where a stay is possible. */
  const planTo = (calls: string[]): string | undefined => calls.map((x) => b.station.get(x)?.city).filter((c): c is string => !!c && c !== city && b.gameCities.includes(c)).at(-1);
  const add = (a: ActionView) => { const e = ctl.send(a.cmd); setErr({ id: a.id, text: e }); if (!e) ctl.go('diary'); };
  return (
    <div class="board">
      <ScreenHead title="Departures" sub={<>{bv.stationName}, from <T c={bv.from} /> to <T c={bv.until} date />. Trains you know of, not the trains that run.</>} />
      <div class="field-row">
        {stations.length > 1 ? (
          <div class="field">
            <label for="board-station">Station</label>
            <select id="board-station" value={st} onChange={(e) => ctl.go('board', { station: (e.currentTarget as HTMLSelectElement).value })}>
              {stations.map((x) => <option key={x} value={x}>{b.station.get(x)?.name ?? x}</option>)}
            </select>
          </div>
        ) : null}
        <div class="field">
          <label for="board-horizon">Show</label>
          <select id="board-horizon" value={String(horizon)} onChange={(e) => setHorizon(Number((e.currentTarget as HTMLSelectElement).value))}>
            {HORIZONS.map(([s, l]) => <option key={s} value={String(s)}>{l}</option>)}
          </select>
        </div>
      </div>
      {bv.rows.length === 0 ? <Empty>No departure you know of in that time.</Empty> : (
        <div class="table-scroll" tabIndex={0} role="region" aria-label="Departures table">
          <table class="guide">
            <thead>
              <tr><th scope="col">dep.</th><th scope="col">Train</th><th scope="col">Calling at</th><th scope="col">Cl.</th><th scope="col">Known from</th><th scope="col"><span class="vh">Plan</span></th></tr>
            </thead>
            <tbody>
              {bv.rows.map((r) => (
                <tr key={`${r.tripId}-${r.day}`}>
                  <td class="num"><T c={r.dep} />{r.learnedDelaySec ? <span class="late"> +{dur(r.learnedDelaySec)}</span> : null}</td>
                  <td><b>{r.trainNo}</b>{r.name ? <i class="tname"> {r.name}</i> : null}{r.sleeper ? <span class="tag">berths</span> : null}</td>
                  <td class="calls">
                    {r.calls.map((c, i) => (
                      <span key={c.station} class={i === r.calls.length - 1 ? 'call last' : 'call'}>{c.name} <T c={c.arr} /></span>
                    ))}
                  </td>
                  <td class="num">{r.classes.join(' ')}</td>
                  <td class="src">{SOURCE_WORD[r.source.kind] ?? r.source.kind} · {r.source.confidence}‰ <Cite c={r.citation} /></td>
                  <td><button type="button" class="btn btn-small btn-quiet" onClick={() => ctl.go('plan', { to: planTo(r.calls.map((c) => c.station)), train: r.trainKey })} aria-label={`Plan with the ${r.trainNo}`}>Plan</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {bv.rows.length ? <p class="sec-note">Times are printed railway times. † opens the source of each line.</p> : null}
      {learn.length ? (
        <Section title="Ask before you trust it" id="learn">
          <ul class="acts">{learn.map((a) => <ActCard key={a.id} a={a} err={err?.id === a.id ? err.text : null} onAdd={add} />)}</ul>
        </Section>
      ) : null}
    </div>
  );
}
