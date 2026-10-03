/**
 * The bar over the map: the date and the running clock, your cash with its sterling worth in
 * words, the pocket, and one goal line with its progress (meetings kept, time left).
 */
import type { GoalViewModel, Clock } from '../views/index.ts';

export function TopBar({ now, purse, goal, onPocket, onGoal, pocketOpen }: {
  now: Clock; purse: { cash: string; words: string }; goal: GoalViewModel; onPocket: () => void; onGoal: (() => void) | null; pocketOpen: boolean;
}) {
  const [wd, d, mon] = now.date.split(' ');
  return (
    <header class="topbar">
      <div class="tb-row">
        <p class="tb-when" aria-live="off">
          <span class="tb-date">{wd} {d} {mon}</span>
          <time class="tb-clock t" id="clock">{now.time}</time>
        </p>
        <button type="button" class="tb-pocket" id="open-pocket" aria-expanded={pocketOpen} onClick={onPocket} aria-label={`Pocket: ${purse.cash}, ${purse.words}`}>
          <span class="tb-k">Pocket</span><span class="tb-cash">{purse.cash}</span>
          <span class="tb-words">{purse.words}</span>
        </button>
      </div>
      <div class={`tb-goal goal-${goal.status}`}>
        {onGoal ? (
          <button type="button" class="goal-line" id="goal-line" onClick={onGoal}>{goal.text}</button>
        ) : <p class="goal-line">{goal.text}</p>}
        {goal.total > 0 ? (
          <p class="goal-progress" aria-label={`${goal.done} of ${goal.total} meetings kept${goal.left ? `, ${goal.left}` : ''}`}>
            <span class="pips" aria-hidden="true">{Array.from({ length: goal.total }, (_, i) => <span key={i} class={`pip${i < goal.done ? ' pip-done' : ''}`} />)}</span>
            {goal.left && goal.status === 'open' ? <span class="goal-left">{goal.left}</span> : null}
          </p>
        ) : null}
      </div>
    </header>
  );
}
