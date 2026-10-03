/**
 * Small display pieces shared by the screens: the preview banner, railway times in figures, the
 * citation dagger (only in the pocket's guide detail), refusals. Display only.
 */
import type { ComponentChildren } from 'preact';
import { useState, useId } from 'preact/hooks';
import type { Clock, CitationView } from '../views/index.ts';

export function Banner({ text }: { text: string }) {
  return <p class="banner" role="note">{text}</p>;
}

/** A railway time as the kit formats it ("14.05"). */
export function T({ c, date }: { c: Clock | null | undefined; date?: boolean }) {
  if (!c) return <span class="t">—</span>;
  return <time class="t" title={c.text}>{date ? <span class="td">{c.date.split(' ').slice(0, 3).join(' ')} </span> : null}{c.time}</time>;
}

/** The citation dagger: the source on tap or focus. */
export function Cite({ c }: { c: CitationView | null | undefined }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!c) return null;
  return (
    <span class={`cite${open ? ' open' : ''}`}>
      <button type="button" class="dagger" id={`cite-${id}`} aria-expanded={open} aria-describedby={id} onClick={() => setOpen(!open)} aria-label={`Source: ${c.text}`}>†</button>
      <span role="tooltip" id={id} class="cite-pop">{c.text}</span>
    </span>
  );
}

export function Section({ title, children, id, note }: { title: string; children: ComponentChildren; id: string; note?: ComponentChildren }) {
  return (
    <section class="sec" aria-labelledby={`${id}-h`}>
      <h3 class="sec-h" id={`${id}-h`}>{title}</h3>
      {note ? <p class="sec-note">{note}</p> : null}
      {children}
    </section>
  );
}

/** The refusal the rules gave, in the page's own voice. */
export function Refusal({ text, id }: { text: string | null | undefined; id?: string }) {
  return text ? <p class="refusal" role="alert" id={id}>{text}</p> : null;
}
