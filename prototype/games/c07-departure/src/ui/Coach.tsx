/**
 * Onboarding for the tutorial: three short coach marks on the map (this is you; this is your
 * goal; tap your city to see departures). The map rings what each one names.
 */
import { useEffect, useRef } from 'preact/hooks';

export const COACH: Array<{ target: 'me' | 'goal' | 'here'; title: string; text: string }> = [
  { target: 'me', title: 'This is you', text: 'The red marker is you, in Aubrevaux. It moves when your train moves.' },
  { target: 'goal', title: 'This is your goal', text: 'The flag is where your letter must go, and by when. The line at the top says it too.' },
  { target: 'here', title: 'Tap your city', text: 'Tap Aubrevaux to see the trains leaving from here, and what you can do in town before yours.' },
];

export function Coach({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus({ preventScroll: true }); }, [step]);
  const c = COACH[step];
  if (!c) return null;
  const last = step === COACH.length - 1;
  return (
    <div class={`coach coach-${c.target}`} role="dialog" aria-modal="false" aria-labelledby="coach-h">
      <p class="coach-n">{step + 1} of {COACH.length}</p>
      <h2 class="coach-h" id="coach-h">{c.title}</h2>
      <p class="coach-t">{c.text}</p>
      <div class="coach-btns">
        <button type="button" class="btn btn-go" id="coach-next" ref={btn} onClick={onNext}>{last ? 'Show me' : 'Next'}</button>
        {!last ? <button type="button" class="link" id="coach-skip" onClick={onSkip}>Skip</button> : null}
      </div>
    </div>
  );
}
