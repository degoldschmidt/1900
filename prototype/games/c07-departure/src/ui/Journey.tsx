/**
 * The journey: a strip under the map while the clock runs (what you are on, when it is due, a
 * button to hurry the clock), and the event cards the rules produce on the way, one at a time,
 * each with one or two buttons.
 */
import { useEffect, useRef } from 'preact/hooks';
import type { EventCard, JourneyViewModel, CardButton } from '../views/index.ts';

export function JourneyStrip({ jv, onSkip, acting }: { jv: JourneyViewModel; onSkip: () => void; acting: boolean }) {
  return (
    <div class="strip" role="status" aria-live="polite">
      <div class="strip-text">
        <p class="strip-line">{acting ? 'Time passes in town' : jv.line}</p>
        {jv.sub && !acting ? <p class="strip-sub">{jv.sub}</p> : null}
      </div>
      <button type="button" class="btn btn-quiet" id="skip" onClick={onSkip}>Hurry</button>
    </div>
  );
}

export function Card({ card, onButton, step, steps }: { card: EventCard; onButton: (b: CardButton) => void; step: number; steps: number }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus({ preventScroll: true }); }, [card.id]);
  const ordered = [...card.buttons].sort((a, b) => Number(b.primary) - Number(a.primary));
  return (
    <div class="card-wrap">
      <article class={`card card-${card.tone} card-${card.kind}`} role="alertdialog" aria-modal="false" aria-labelledby="card-h" aria-describedby="card-text">
        <p class="card-k"><time class="t">{card.at.time}</time>{steps > 1 ? <span class="card-n">{step} of {steps}</span> : null}</p>
        <h2 class="card-h" id="card-h">{card.title}</h2>
        <p class="card-text" id="card-text">{card.text}</p>
        <div class="card-btns">
          {ordered.map((b, i) => (
            <button key={b.label} type="button" ref={i === 0 ? first : null} id={i === 0 ? 'card-primary' : 'card-secondary'}
              class={`btn ${i === 0 ? 'btn-go' : 'btn-quiet'}`} onClick={() => onButton(b)}>{b.label}</button>
          ))}
        </div>
      </article>
    </div>
  );
}
