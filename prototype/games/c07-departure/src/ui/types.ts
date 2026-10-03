/**
 * What every screen receives from the app shell: the public view inputs (screens call the view
 * functions on them; they never compute rules) and the shell's callbacks. Commands go back through
 * `send`, which returns the rules' refusal or null.
 */
import type { PublicState, ViewData, C07Command } from '../views/index.ts';

export type Screen =
  | 'diary' | 'plan' | 'board' | 'town' | 'pocket'
  | 'purse' | 'letters' | 'shelf' | 'trail' | 'news' | 'save' | 'about'
  | 'arrival' | 'questions' | 'autopsy';

export type Source = 'default' | 'planner' | 'board';

export interface Inputs { p: PublicState; d: ViewData; /** Bumps on every change, for memoised views. */ v: number }

export interface GoOptions { to?: string | undefined; train?: string | null | undefined; station?: string | undefined }

export interface Ctl {
  send(cmd: C07Command, source?: Source): string | null;
  go(screen: Screen, opt?: GoOptions): void;
  openAdvance(): void;
}

export const SCREEN_TITLE: Record<Screen, string> = {
  diary: 'Diary', plan: 'Planner', board: 'Departures', town: 'Town', pocket: 'Pocket',
  purse: 'Purse', letters: 'Commissions', shelf: 'Guide shelf', trail: 'Own trail', news: 'Newspaper', save: 'Save code', about: 'About',
  arrival: 'Arrival', questions: 'Questions', autopsy: 'Autopsy',
};
