// The run report as the player meets it: built from the game, copied from a click, and answered in a few words.
// The About page and the end card both use copyRunReport.

import { reportText } from '../core/report.js';
import { copyText } from './dom.js';

/**
 * Copy the run report to the clipboard (or offer it in a dialog where copying is not allowed).
 * Call it from inside a click handler. Resolves a short line fit for a toast.
 */
export function copyRunReport(G) {
  if (!G?.S) return Promise.resolve('There is no campaign to report on yet.');
  let text;
  try { text = reportText(G); } catch (e) { console.error(e); return Promise.resolve('The report could not be made.'); }
  const running = !G.S.ended;
  return copyText(text, {
    title: 'Run report',
    hint: running ? 'The campaign is still running. This report shows what the other side knows of you; better read afterwards.' : '',
  }).then(
    (how) => (how === 'copied' ? 'Run report copied. Paste it to the developer.' : 'Run report ready: press and hold the text to copy it.'),
    () => 'The report could not be copied.',
  );
}
