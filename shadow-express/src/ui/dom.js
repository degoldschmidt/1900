// Small DOM helpers.
export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
export const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { window.localStorage.removeItem(k); } catch { /* storage blocked */ } },
};

// ---------- copying text ----------
let copyDialogOpen = null;
export function closeCopyDialog() { if (copyDialogOpen) copyDialogOpen(); }

/**
 * Put text on the clipboard. Call it from inside a click handler: the browser allows the copy only for a gesture.
 * It tries the clipboard API first. Where the page may not use it (a sandboxed frame, an old browser) it shows the
 * text in a small dialog, already selected, and tries the old way (a selected textarea and execCommand). If that
 * fails too, the text stays selected under a "press and hold to copy" caption. Nothing is ever read from the
 * clipboard, and no file is offered. Resolves 'copied', or 'selected' when the reader must finish the job.
 * opts: { title, hint } for the dialog.
 */
export function copyText(text, opts = {}) {
  text = String(text ?? '');
  // a frame that may not write to the clipboard is not asked (the browser would log a violation for the attempt)
  const allowed = () => { try { const p = document.permissionsPolicy ?? document.featurePolicy; return !(p && typeof p.allowsFeature === 'function' && !p.allowsFeature('clipboard-write')); } catch { return true; } };
  const viaApi = () => new Promise((resolve, reject) => {
    try {
      const c = typeof navigator !== 'undefined' ? navigator.clipboard : null;
      if (!c || typeof c.writeText !== 'function' || !allowed()) { reject(new Error('no clipboard')); return; }
      const timer = setTimeout(() => reject(new Error('the clipboard did not answer')), 2500);
      c.writeText(text).then(() => { clearTimeout(timer); resolve('copied'); }, (e) => { clearTimeout(timer); reject(e); });
    } catch (e) { reject(e); }
  });
  return viaApi().catch(() => copyDialog(text, opts));
}

function copyDialog(text, { title = 'Copy this text', hint = '' } = {}) {
  closeCopyDialog();
  const before = document.activeElement;
  const veil = el('div', 'pm-veil');
  veil.setAttribute('role', 'dialog');
  veil.setAttribute('aria-modal', 'true');
  veil.setAttribute('aria-label', title);
  veil.innerHTML = `<div class="pm-dialog"><div class="kick">${esc(title)}</div><textarea class="pm-text" readonly spellcheck="false" autocomplete="off" aria-label="${esc(title)}"></textarea><p class="pm-note" role="status"></p>${hint ? `<p class="pm-hint">${esc(hint)}</p>` : ''}<div class="pm-actions"><button type="button" class="pm-btn" data-copy-again>Copy again</button><button type="button" class="pm-btn" data-copy-close>Close</button></div></div>`;
  const ta = veil.querySelector('textarea'), note = veil.querySelector('.pm-note');
  ta.value = text;
  const attempt = () => {
    ta.focus({ preventScroll: true });
    ta.select();
    try { ta.setSelectionRange(0, text.length); } catch { /* some touch browsers refuse */ }
    let ok = false;
    try { ok = !!document.execCommand('copy'); } catch { ok = false; }
    note.textContent = ok ? 'Copied. The text is here too, should you want it again.' : 'Press and hold the text to copy it.';
    return ok;
  };
  const close = () => {
    copyDialogOpen = null;
    veil.remove();
    try { before?.focus?.({ preventScroll: true }); } catch { /* the opener has gone */ }
  };
  veil.addEventListener('click', (e) => { if (e.target === veil) close(); });
  veil.querySelector('[data-copy-close]').addEventListener('click', close);
  veil.querySelector('[data-copy-again]').addEventListener('click', attempt);
  veil.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...veil.querySelectorAll('textarea, button')];
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  document.body.appendChild(veil);
  copyDialogOpen = close;
  return Promise.resolve(attempt() ? 'copied' : 'selected');
}
