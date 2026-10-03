/**
 * The page's frame: the permanent preview banner and the tab bar (at the bottom on a phone, in
 * thumb reach; along the top of the panel on a wide screen, where the diary stays open beside it).
 */
import type { Screen } from './types.ts';

export function Banner({ text }: { text: string }) {
  return <p class="banner" role="note">{text}</p>;
}

const TABS: Array<[Screen, string, Screen[]]> = [
  ['diary', 'Diary', ['diary', 'arrival', 'questions', 'autopsy']],
  ['plan', 'Plan', ['plan']],
  ['board', 'Board', ['board']],
  ['town', 'Town', ['town']],
  ['pocket', 'Pocket', ['pocket', 'purse', 'letters', 'shelf', 'trail', 'news', 'save', 'about']],
];

export function Tabs({ screen, go, wide }: { screen: Screen; go: (s: Screen) => void; wide: boolean }) {
  return (
    <nav class="tabs" aria-label="Pages">
      <ul>
        {TABS.filter(([s]) => !(wide && s === 'diary')).map(([s, label, owns]) => (
          <li key={s}>
            <button type="button" class="tab" id={`tab-${s}`} aria-current={owns.includes(screen) ? 'page' : undefined} onClick={() => go(s)}>{label}</button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
