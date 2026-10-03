/**
 * Own trail (RULES.md 9: your records with the readers the public rows allow and when they could
 * hold them), Newspaper (items published where you are) and About (build, data freeze, the
 * invented-world notice, sources and the design values in use).
 */
import { useMemo } from 'preact/hooks';
import { fmtDate } from '#kit/time/format.ts';
import { trailView, newsView, aboutView } from '../views/index.ts';
import type { Inputs } from './types.ts';
import { ScreenHead, Section, Leader, Empty, Cite, T } from './common.tsx';

export function Trail({ inp }: { inp: Inputs }) {
  const rows = useMemo(() => trailView(inp.p, inp.d), [inp.v]);
  return (
    <div class="trail">
      <ScreenHead title="Own trail" sub="Every act that leaves paper behind. Who could hold each record, and from when: ranges only, never certainties." />
      {rows.length ? (
        <ol class="records">
          {rows.slice().reverse().map((r) => (
            <li key={r.rec} class="record">
              <p class="rec-h"><T c={r.at} date /> <b>{r.label}</b> <span class={r.named ? 'named' : 'anon'}>{r.named ? 'in your name' : 'anonymous'}</span></p>
              <p class="rec-m">{r.placeName ? `${r.placeName} · ` : ''}kept by {r.sourceName} · {r.confidence}‰ sure</p>
              {r.readers.length ? (
                <ul class="readers">
                  {r.readers.map((x) => (
                    <li key={x.reader} class={x.already ? 'already' : ''}>{x.name}: {x.minSec === x.maxSec ? <>at <T c={x.earliest} /></> : <><T c={x.earliest} date />–<T c={x.latest} date /></>}{x.already ? ' (could have it now)' : ''}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      ) : <Empty>No records yet. Bank drafts, hotel slips, tickets and telegrams will appear here.</Empty>}
    </div>
  );
}

export function News({ inp }: { inp: Inputs }) {
  const p = inp.p;
  const city = p.me.where.k === 'city' ? p.me.where.city : p.me.cameFrom ?? inp.d.b.gameCities[0]!;
  const nv = useMemo(() => newsView(inp.p, inp.d, city), [inp.v, city]);
  return (
    <div class="news">
      <ScreenHead title={`The ${nv.cityName} papers`} sub={p.me.where.k === 'aboard' ? 'Aboard, no paper reaches you until you arrive.' : 'Morning and evening editions.'} />
      {nv.items.length ? (
        <ol class="items">{nv.items.map((n) => <li key={n.id + n.at.t} class="item"><p class="item-at"><T c={n.at} date /></p><p class="item-t">{n.title} <Cite c={n.citation} /></p></li>)}</ol>
      ) : <Empty>Nothing printed that concerns you.</Empty>}
    </div>
  );
}

export function About({ inp }: { inp: Inputs }) {
  const a = useMemo(() => aboutView(inp.d, __BUILD_ID__, (day) => fmtDate(day, 'greg', false)), []);
  return (
    <div class="about">
      <ScreenHead title="About this preview" />
      {a.banner ? <p class="about-notice"><b>{a.banner}.</b> Every place, train, guide, fare, price and institution on these pages is invented. Nothing here is a historical claim; the rules are the real C07 rules, waiting for transcribed 1914 timetables.</p> : null}
      <Section title="This build" id="build">
        <Leader k="Build">{a.buildId}</Leader>
        <Leader k="Data freeze">{a.freezeTag ?? 'none'}</Leader>
        <Leader k="Data hash">{a.dataHash}</Leader>
        <Leader k="Window">{a.window[0]} to {a.window[1]}</Leader>
      </Section>
      <Section title="Sources (invented)" id="sources">
        <ul class="plain">{a.sources.map((s) => <li key={s.source}>{s.title} <span class="muted">({s.editions.join(', ')})</span></li>)}</ul>
      </Section>
      <Section title="Gaps" id="gaps"><ul class="plain">{a.gaps.map((g) => <li key={g}>{g}</li>)}</ul></Section>
      <Section title="Design values in use" id="dv" note="Rule constants chosen by design, not read from a source; tuned in playtest.">
        <div class="table-scroll" tabIndex={0} role="region" aria-label="Design values">
          <table class="guide dv">
            <thead><tr><th scope="col">Id</th><th scope="col">Value</th><th scope="col">Unit</th><th scope="col">Why</th></tr></thead>
            <tbody>{a.designValues.map((v) => <tr key={v.id}><td class="num">{v.id}</td><td class="val">{v.value}</td><td>{v.unit}</td><td class="why">{v.rationale}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>
      {a.designRows.length ? (
        <Section title="Parameter rows set by design" id="dvrows">
          <ul class="plain">{a.designRows.map((r) => <li key={r.id}>{r.param} <span class="muted">{r.key}</span> {r.dv ? `(${r.dv})` : ''}</li>)}</ul>
        </Section>
      ) : null}
    </div>
  );
}
