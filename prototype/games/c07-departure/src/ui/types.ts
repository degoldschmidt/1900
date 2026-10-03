/**
 * What the screens receive from the app shell: the public view inputs (screens call the view
 * functions on them; they never compute rules) and the shell's callbacks. Commands go back through
 * `send`, which returns the rules' refusal or null.
 */
import type { PublicState, ViewData, C07Command } from '../views/index.ts';

export type Source = 'default' | 'planner' | 'board';

export interface Inputs { p: PublicState; d: ViewData; /** Bumps on every change, for memoised views. */ v: number }

export interface Ctl {
  /** Books a journey (stamped with where it was chosen). */
  book(cmd: C07Command, source: Source): string | null;
  /** Does something in town now: the clock runs until it is done. */
  act(cmd: C07Command): string | null;
  /** Any other command (cancel a booking, accept an offer, end a sitting). */
  send(cmd: C07Command): string | null;
  /** Sets off: the clock runs through the booked journey. */
  go(): void;
  openCity(city: string | null): void;
  openPocket(open: boolean): void;
}
