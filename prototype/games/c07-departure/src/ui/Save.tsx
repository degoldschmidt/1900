/**
 * The save code: seed, scenario and every command, as one line of text. Copy writes it to the
 * clipboard inside the click; when the clipboard is refused the visible field is selected so it
 * can be copied by hand. Ending a sitting is logged (H07-4 reads where sittings end).
 */
import { useRef, useState } from 'preact/hooks';
import type { Ctl } from './types.ts';
import { ScreenHead, Section, Refusal } from './common.tsx';

export function CopyCode({ code, id = 'save-code' }: { code: string; id?: string }) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const select = (why: string) => {
    const f = field.current;
    if (f) { f.focus(); f.select(); f.setSelectionRange(0, f.value.length); }
    setMsg(why);
  };
  const copy = () => {
    try {
      const clip = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
      if (!clip || typeof clip.writeText !== 'function') { select('Selected. Copy it with your device’s copy command.'); return; }
      clip.writeText(code).then(() => setMsg('Copied to the clipboard.'), () => select('The clipboard was refused; the code is selected, copy it by hand.'));
    } catch {
      select('The clipboard was refused; the code is selected, copy it by hand.');
    }
  };
  return (
    <div class="copy-code">
      <label for={id} class="vh">Save code</label>
      <textarea id={id} class="code" readOnly rows={3} value={code} spellcheck={false} onFocus={(e) => (e.currentTarget as HTMLTextAreaElement).select()} />
      <p class="copy-row">
        <button type="button" class="btn" id={`${id}-copy`} onClick={copy}>Copy save code</button>
        <span class="copy-msg" role="status">{msg ?? ''}</span>
      </p>
    </div>
  );
}

export function Save({ code, stored, ctl, aboard, onEndSession, onStartScreen }: {
  code: string; stored: boolean; ctl: Ctl; aboard: boolean; onEndSession: () => string | null; onStartScreen: () => void;
}) {
  const [closed, setClosed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div class="save">
      <ScreenHead title="Save code" sub="The whole game as one line: the seed and every entry you made. Paste it on the start screen to carry on, here or on another machine." />
      <CopyCode code={code} />
      <p class="sec-note">{stored ? 'This page also keeps it in this browser and offers to resume.' : 'This browser would not keep it, so copy it before you leave.'}</p>
      <Section title="End this sitting" id="sitting" note={aboard ? 'You are in the train: a good place to stop.' : 'Stopping for now is noted in the save code.'}>
        {closed ? <p class="flash" role="status">The sitting is closed in your diary. The code above includes it.</p> : (
          <button type="button" class="btn btn-quiet" id="end-session" onClick={() => { const e = onEndSession(); setErr(e); if (!e) setClosed(true); }}>Close the diary for now</button>
        )}
        <Refusal text={err} />
      </Section>
      <p><button type="button" class="link" id="to-start" onClick={onStartScreen}>Back to the start screen</button> · <button type="button" class="link" onClick={() => ctl.go('diary')}>Back to the diary</button></p>
    </div>
  );
}
