/**
 * Small display pieces shared by the screens: guide-style times (p.m. in heavy type, as the
 * period guides printed them), citation daggers that open on hover or tap, dotted-leader rows,
 * odds and durations. Display only.
 */
import type { ComponentChildren } from 'preact';
import { useState, useId } from 'preact/hooks';
import { fmtDuration } from '#kit/time/format.ts';
import type { Clock, CitationView, ActionView } from '../views/index.ts';

/** A railway time as the kit formats it ("14.05"); afternoon and night hours in heavy type. */
export function T({ c, date }: { c: Clock | null | undefined; date?: boolean }) {
  if (!c) return <span class="t">—</span>;
  const h = Number(c.time.slice(0, 2));
  return <time class={`t${h >= 12 ? ' pm' : ''}`} title={c.text}>{date ? <span class="td">{c.date} </span> : null}{c.time}</time>;
}

export const dur = (sec: number | null | undefined): string => (sec === null || sec === undefined ? '—' : fmtDuration(Math.max(0, sec)));

/** Odds in per mille as a percentage with one decimal. */
export const pct = (permille: number): string => `${(permille / 10).toFixed(permille % 10 === 0 ? 0 : 1)} %`;

/** The citation dagger: the source on hover, focus or tap. */
export function Cite({ c }: { c: CitationView | null | undefined }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!c) return null;
  return (
    <span class={`cite${open ? ' open' : ''}`}>
      <button type="button" class="dagger" aria-expanded={open} aria-describedby={id} onClick={() => setOpen(!open)} aria-label={`Source: ${c.text}`}>†</button>
      <span role="tooltip" id={id} class="cite-pop">{c.text}</span>
    </span>
  );
}

/** A guide row: label, dotted leader, value. */
export function Leader({ k, children, cls }: { k: ComponentChildren; children: ComponentChildren; cls?: string }) {
  return <div class={`leader${cls ? ` ${cls}` : ''}`}><span class="lk">{k}</span><span class="dots" aria-hidden="true" /><span class="lv">{children}</span></div>;
}

export function Section({ title, children, id, note }: { title: string; children: ComponentChildren; id?: string; note?: ComponentChildren }) {
  return (
    <section class="sec" aria-labelledby={id ? `${id}-h` : undefined}>
      <h3 class="sec-h" id={id ? `${id}-h` : undefined}>{title}</h3>
      {note ? <p class="sec-note">{note}</p> : null}
      {children}
    </section>
  );
}

export function ScreenHead({ title, sub }: { title: string; sub?: ComponentChildren }) {
  return (
    <header class="screen-h">
      <h2>{title}</h2>
      {sub ? <p class="screen-sub">{sub}</p> : null}
    </header>
  );
}

export function Empty({ children }: { children: ComponentChildren }) {
  return <p class="empty">{children}</p>;
}

/** The refusal the rules gave, in the page's own voice. */
export function Refusal({ text }: { text: string | null | undefined }) {
  return text ? <p class="refusal" role="alert">{text}</p> : null;
}

/** One possible act with its preview: when, how long, the cost vector and the records it writes. */
export function ActCard({ a, onAdd, err }: { a: ActionView; onAdd: (a: ActionView) => void; err?: string | null }) {
  const pv = a.preview;
  return (
    <li class={`act${a.legal ? '' : ' act-no'}`}>
      <div class="act-main">
        <p class="act-label">{a.label}</p>
        {pv ? (
          <p class="act-when">
            {pv.start && pv.end ? <><T c={pv.start} />–<T c={pv.end} /></> : null}
            <span class="act-dur">{dur(pv.durationSec)}</span>
          </p>
        ) : null}
        {pv ? (
          <ul class="costs" aria-label="Cost">
            {pv.cost.length ? pv.cost.map((m) => <li key={m} class="cost-money">{m}</li>) : <li class="cost-none">no money</li>}
            {pv.health !== 0 ? <li class={pv.health < 0 ? 'cost-health' : 'cost-gain'}>{pv.health > 0 ? '+' : ''}{pv.health}‰ health</li> : null}
            {pv.records.length ? pv.records.map((r) => (
              <li key={r.kind} class="cost-trace" title={r.readers.map((x) => x.name).join(', ')}>
                writes: {r.label}{r.named ? ' (named)' : ''}
              </li>
            )) : <li class="cost-none">no record</li>}
          </ul>
        ) : null}
        {!a.legal && a.error ? <p class="act-why">{a.error}</p> : null}
        <Refusal text={err} />
      </div>
      <button type="button" class="btn btn-small" id={`do-${a.id}`} disabled={!a.legal} onClick={() => onAdd(a)}>
        {a.cmd.type === 'planVerb' ? 'Add' : 'Do'}
      </button>
    </li>
  );
}
