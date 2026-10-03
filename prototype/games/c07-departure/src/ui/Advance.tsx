/**
 * Advance: time moves only here. The button first opens a sheet listing what will pass, in order,
 * up to the next point where the game stops for you (RULES.md 5.1 and 9); only then does the
 * shell let the time pass. A sheet, never a browser dialog.
 */
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { upcomingView, diaryView } from '../views/index.ts';
import type { Inputs } from './types.ts';
import { T } from './common.tsx';

export function AdvanceBar({ inp, onOpen, onEnd, ended, answered }: { inp: Inputs; onOpen: () => void; onEnd: () => void; ended: boolean; answered: boolean }) {
  const up = useMemo(() => upcomingView(inp.p, inp.d), [inp.v]);
  const today = useMemo(() => diaryView(inp.p, inp.d).now.date, [inp.v]);
  const stop = up.find((u) => u.interrupts) ?? up[up.length - 1];
  if (ended) {
    return (
      <div class="advance-bar">
        <button type="button" class="btn btn-advance" id="to-questions" onClick={onEnd}>{answered ? 'The scenario is over: the autopsy' : 'The scenario is over: a few questions'}</button>
      </div>
    );
  }
  return (
    <div class="advance-bar">
      <button type="button" class="btn btn-advance" id="advance" onClick={onOpen} aria-haspopup="dialog">
        <span class="adv-word">Advance</span>
        {stop ? <span class="adv-to">to {stop.at.date !== today ? <span class="td">{stop.at.date.split(' ')[0]} </span> : null}<T c={stop.at} /></span> : null}
      </button>
    </div>
  );
}

export function AdvanceSheet({ inp, onGo, onClose }: { inp: Inputs; onGo: () => void; onClose: () => void }) {
  const up = useMemo(() => upcomingView(inp.p, inp.d), [inp.v]);
  const goRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    goRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return (
    <div class="sheet-wrap" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h">
        <h2 id="sheet-h" class="sheet-h">Before the next stop</h2>
        <p class="sheet-note">Times are as you believe them; delays show only when they happen.</p>
        <ol class="upcoming">
          {up.map((u, i) => (
            <li key={i} class={u.interrupts ? 'stop' : ''}>
              <T c={u.at} />
              <span class="up-what">{u.what}</span>
              {u.interrupts ? <span class="up-stop">the diary stops here</span> : null}
            </li>
          ))}
        </ol>
        <div class="sheet-btns">
          <button type="button" class="btn btn-advance" id="advance-go" ref={goRef} onClick={onGo}>Let the time pass</button>
          <button type="button" class="btn btn-quiet" id="advance-cancel" onClick={onClose}>Not yet</button>
        </div>
      </div>
    </div>
  );
}
