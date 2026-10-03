/**
 * The pocket: everything carried besides the diary. Purse, letters (commissions), the guide
 * shelf, the trail you leave, the newspaper, the save code and the About page.
 */
import type { Ctl, Screen } from './types.ts';
import { ScreenHead } from './common.tsx';

const ITEMS: Array<[Screen, string, string]> = [
  ['letters', 'Commissions', 'held, offered and lapsed; each window against your earliest arrival'],
  ['purse', 'Purse', 'cash in each currency, the letter of credit, rent and bills'],
  ['shelf', 'Guide shelf', 'the editions you own, what is on sale, trains learned, ghosts met'],
  ['trail', 'Own trail', 'the records your acts have written and who could read them when'],
  ['news', 'Newspaper', 'what the local papers have printed'],
  ['save', 'Save code', 'copy it, keep it, paste it on another day; end a sitting'],
  ['about', 'About', 'this build, its invented data and the design values in use'],
];

export function Pocket({ ctl }: { ctl: Ctl }) {
  return (
    <div class="pocket">
      <ScreenHead title="Pocket" />
      <ul class="pocket-list">
        {ITEMS.map(([s, t, d]) => (
          <li key={s}>
            <button type="button" class="pocket-item" id={`pocket-${s}`} onClick={() => ctl.go(s)}>
              <span class="pi-t">{t}</span><span class="pi-d">{d}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
