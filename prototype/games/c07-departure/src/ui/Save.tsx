/**
 * The save code: seed, scenario and every command, as one line of text. Copy writes it to the
 * clipboard inside the click; when the clipboard is refused the visible field is selected so it
 * can be copied by hand.
 */
import { useRef, useState } from 'preact/hooks';

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
