/**
 * The app shell's hold on one game: it owns the simulation, sends the screens' commands through
 * `sim.command`, lets time pass through `session.advance`, keeps the save code (seed + scenario +
 * log + questionnaire answers) in browser storage after every change, and stamps `book` commands
 * with the UI metrics RULES.md section 1 asks for (`ui.sinceArrivalMs`, `ui.source`). The screens
 * never see this object: they get view models and callbacks.
 */
import { Sim } from '#kit/sim/sim.ts';
import { encodeSave, decodeSave, type SaveCode } from '#kit/sim/savecode.ts';
import { storageGet, storageSet } from '#kit/ui/storage.ts';
import type { Interrupt } from '../rules/types.ts';
import type { C07Bundle } from '../rules/data.ts';
import type { C07Command, UiStamp } from '../commands.ts';
import { module, GAME_ID } from '../game.ts';
import { PREVIEW_SCENARIOS, SCENARIO_IDS } from '../scenarios.ts';
import { viewInputs, advance, type C07Sim } from '../session.ts';
import { autopsyView, type AutopsyViewModel, type PublicState, type ViewData } from '../views/index.ts';

export const SAVE_KEY = `${GAME_ID}${__PREVIEW__ ? '.preview' : ''}.save`;

export type Answers = Record<string, string | number>;

export interface ScenarioInfo { id: string; title: string; note: string; seed: number; recommended: boolean }

const cap = (x: string): string => x.charAt(0).toUpperCase() + x.slice(1);

/** Scenario menu, tutorial first (RULES.md 7 and the preview's two scenarios). */
export function scenarioMenu(): ScenarioInfo[] {
  return SCENARIO_IDS.map((id, i) => {
    const f = PREVIEW_SCENARIOS[id]!;
    return { id, title: cap(f.title.replace(/^Preview:\s*/, '')), note: f.note.replace(/^Mechanics preview on an invented railway, not history\.\s*/, ''), seed: f.seed, recommended: i === 0 };
  });
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : 0);

export class Game {
  readonly sim: C07Sim;
  readonly bundle: C07Bundle;
  answers: Answers;
  /** How far the screens have read the append-only interrupt list. */
  private cursor: number;
  /** Wall-clock mark of the last Arrival screen (or of the game's opening), for `ui.sinceArrivalMs`. */
  private arrivalMark = now();
  /** Whether the last write to browser storage succeeded. */
  stored = false;

  private constructor(bundle: C07Bundle, sim: C07Sim, answers: Answers = {}) {
    this.bundle = bundle;
    this.sim = sim;
    this.answers = { ...answers };
    this.cursor = sim.state.diary.interrupts.length;
  }

  static create(bundle: C07Bundle, scenarioId: string, seed?: number): Game {
    return new Game(bundle, new Sim(module.game, bundle, module.scenario(bundle, scenarioId, seed)));
  }

  /** Rebuilds a game from a save code by replaying its log. Throws a readable error. */
  static restore(bundle: C07Bundle, code: string): Game {
    let save: SaveCode<C07Command>;
    try { save = decodeSave<C07Command>(code.trim()); } catch { throw new Error('That is not a save code (it should be one long line of letters and digits).'); }
    if (save.game !== GAME_ID) throw new Error(`That save code belongs to another game (${save.game}).`);
    if (save.dataHash !== bundle.raw.meta.dataHash) throw new Error('That save code was made with other game data, so it cannot be replayed here.');
    if (!(SCENARIO_IDS as readonly string[]).includes(save.scenario)) throw new Error(`This page has no scenario “${save.scenario}”.`);
    const sim: C07Sim = new Sim(module.game, bundle, module.scenario(bundle, save.scenario, save.seed));
    try { sim.replayLog(save.log, save.processed); } catch (e) { throw new Error(`The save code does not replay: ${e instanceof Error ? e.message : String(e)}`); }
    const g = new Game(bundle, sim, save.answers ?? {});
    g.persist();
    return g;
  }

  get scenarioId(): string { return this.sim.scenario.id; }
  get ended(): boolean { return this.sim.state.ending !== null; }

  inputs(): { p: PublicState; d: ViewData } { return viewInputs(this.sim); }

  /** Sends a command; returns the rules' refusal, or null. Bookings carry the UI stamp. */
  command(cmd: C07Command, source?: UiStamp['source']): string | null {
    const sent: C07Command = cmd.type === 'book'
      ? { ...cmd, ui: { sinceArrivalMs: Math.max(0, Math.round(now() - this.arrivalMark)), source: source ?? 'planner' } }
      : cmd;
    const res = this.sim.command(sent);
    if (!res.ok) return res.error;
    this.persist();
    return null;
  }

  /** Lets time pass to the next interrupt (or the ending). */
  advance(): void {
    advance(this.sim);
    this.persist();
  }

  /** Interrupts the screens have not shown yet; marks them read. */
  takeFresh(): Interrupt[] {
    const list = this.sim.state.diary.interrupts;
    const fresh = list.slice(this.cursor);
    this.cursor = list.length;
    return fresh;
  }

  /** The Arrival screen is showing: planning time starts now (H07-6). */
  markArrival(): void { this.arrivalMark = now(); }

  setAnswers(a: Answers): void {
    this.answers = { ...a };
    this.persist();
  }

  saveCode(): string {
    const sim = this.sim;
    const save: SaveCode<C07Command> = {
      v: 1, game: GAME_ID, buildId: __BUILD_ID__, dataHash: this.bundle.raw.meta.dataHash, scenario: sim.scenario.id, seed: sim.seed,
      processed: sim.processed, log: sim.log.map((e) => ({ k: e.k, cmd: e.cmd })),
    };
    if (Object.keys(this.answers).length) save.answers = { ...this.answers };
    return encodeSave(save);
  }

  /** Keeps the save code in browser storage; storage may be missing or denied, which is fine. */
  persist(): boolean {
    this.stored = storageSet(SAVE_KEY, this.saveCode());
    return this.stored;
  }

  autopsy(): AutopsyViewModel | null {
    if (!this.ended) return null;
    return autopsyView(this.sim.state, viewInputs(this.sim).d);
  }
}

/** What the start screen says about a stored game, without replaying it. */
export function storedGame(): { code: string; scenario: string; title: string; entries: number } | null {
  const code = storageGet(SAVE_KEY);
  if (!code) return null;
  try {
    const s = decodeSave<C07Command>(code);
    if (s.game !== GAME_ID) return null;
    return { code, scenario: s.scenario, title: scenarioMenu().find((x) => x.id === s.scenario)?.title ?? s.scenario, entries: s.log.length };
  } catch { return null; }
}
