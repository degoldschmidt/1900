/**
 * The pocket, a sheet over the map: money, papers and how you feel, the guides you carry (their
 * printed titles and sources here only), letters, "What they could know about you" (your own
 * trail in sentences), the save code, and About this preview.
 */
import { useMemo, useState } from 'preact/hooks';
import { fmtDate } from '#kit/time/format.ts';
import { pocketView, aboutView } from '../views/index.ts';
import type { Ctl, Inputs } from './types.ts';
import { Section, Cite, Refusal, T } from './common.tsx';
import { CopyCode } from './Save.tsx';

export function Pocket({ inp, ctl, code, stored, onStartScreen }: { inp: Inputs; ctl: Ctl; code: string; stored: boolean; onStartScreen: () => void }) {
  const pv = useMemo(() => pocketView(inp.p, inp.d), [inp.v]);
  const about = useMemo(() => aboutView(inp.d, __BUILD_ID__, (day) => fmtDate(day, 'greg', false)), []);
  const [err, setErr] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const aboard = inp.p.me.where.k === 'aboard';
  return (
    <aside class="sheet pocket" id="pocket" role="dialog" aria-modal="false" aria-labelledby="pocket-h">
      <header class="sheet-head">
        <div><p class="sheet-kicker">What you carry</p><h2 id="pocket-h" class="sheet-city">Pocket</h2></div>
        <button type="button" class="btn-close" id="close-pocket" aria-label="Close the pocket" onClick={() => ctl.openPocket(false)}>Close</button>
      </header>
      <Refusal text={err} />
      <Section title="Money" id="pk-money">
        <ul class="plain money">
          {pv.cash.map((c) => <li key={c.amount}><b>{c.amount}</b> in cash, {c.words}</li>)}
          {pv.cash.length === 0 ? <li>No cash.</li> : null}
          <li><b>{pv.credit.amount}</b> on your letter of credit ({pv.credit.words}), to draw at the banks of {pv.credit.banks.join(' and ')}.</li>
        </ul>
      </Section>
      <Section title="Papers and health" id="pk-papers">
        <ul class="plain">{pv.papers.map((x) => <li key={x}>{x}</li>)}<li>{pv.health}</li>{pv.lodged ? <li>{pv.lodged}</li> : null}</ul>
      </Section>
      <Section title="Guides" id="pk-guides" note="Your railway guide is all you know of the timetable. An out-of-date guide shows trains that no longer run.">
        <ul class="plain guides">
          {pv.guides.map((g) => (
            <li key={g.title}>
              <b>{g.title}</b>, {g.when}.
              <details class="guide-detail"><summary>Title page</summary><p>{g.detail} <Cite c={g.citation} /></p></details>
            </li>
          ))}
        </ul>
      </Section>
      {pv.letters.length ? (
        <Section title="Letters" id="pk-letters">
          <ul class="plain">
            {pv.letters.map((l) => (
              <li key={l.id}>{l.text}, pays {l.pay}.{' '}
                {l.accept ? <button type="button" class="btn btn-small" id={`accept-${l.id}`} disabled={!l.legal} onClick={() => setErr(ctl.send(l.accept!))}>Accept</button> : <span class="muted">Accepted.</span>}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section title="What they could know about you" id="pk-trail" note="Every act that leaves paper behind, and when a police office could hold it. Never what they actually know.">
        {pv.trail.length ? (
          <ol class="trail">
            {pv.trail.map((r, i) => (
              <li key={i} class={r.named ? 'named' : ''}>
                <p class="tr-h"><T c={r.at} date /> · {r.place}</p>
                <p class="tr-t">{r.text} <span class="tr-who">{r.who}</span></p>
              </li>
            ))}
          </ol>
        ) : <p class="sheet-note">Nothing yet. Tickets, hotel slips, frontier registers and telegrams will appear here.</p>}
      </Section>
      <Section title="Save code" id="pk-save" note={stored ? 'This browser also keeps your game and offers to resume it.' : 'This browser would not keep it, so copy it before you leave.'}>
        <CopyCode code={code} />
        <p class="row-btns">
          {closed ? <span class="flash" role="status">The sitting is closed; the code above includes it.</span>
            : <button type="button" class="btn btn-quiet" id="end-session" onClick={() => { const e = ctl.send({ type: 'endSession' }); setErr(e); if (!e) setClosed(true); }}>{aboard ? 'Stop here, aboard' : 'Stop for today'}</button>}
          <button type="button" class="link" id="to-start" onClick={onStartScreen}>Back to the start screen</button>
        </p>
      </Section>
      <Section title="About this preview" id="pk-about">
        <p class="about-notice"><b>{about.banner ?? 'The Departure'}.</b> Every place, train, guide, fare, price and institution here is invented. The rules are the real rules of the game, waiting for transcribed 1914 timetables.</p>
        <details class="about-detail">
          <summary>Build, sources and design values</summary>
          <ul class="plain small">
            <li>Build {about.buildId}; data {about.freezeTag ?? 'none'} ({about.dataHash}); {about.window[0]} to {about.window[1]}.</li>
            {about.sources.map((s) => <li key={s.source}>{s.title}</li>)}
            {about.gaps.map((g) => <li key={g}>{g}</li>)}
          </ul>
          <div class="table-scroll" tabIndex={0} role="region" aria-label="Design values">
            <table class="dv">
              <thead><tr><th scope="col">Id</th><th scope="col">Value</th><th scope="col">Why</th></tr></thead>
              <tbody>{about.designValues.map((v) => <tr key={v.id}><td>{v.id}</td><td class="val">{v.value} {v.unit}</td><td>{v.rationale}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </Section>
    </aside>
  );
}
