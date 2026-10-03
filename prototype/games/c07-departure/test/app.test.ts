/**
 * The page's app shell (src/app/controller.ts): commands go through the Sim, bookings carry the
 * UI stamp the metrics read (RULES.md 1, H07-6), the save code (seed + log + answers) replays to
 * the same state, and a foreign or broken code is refused in words. Storage is absent in Node,
 * which the controller must tolerate.
 */
import { describe, it, expect } from 'vitest';
import { decodeSave, encodeSave } from '../../../kit/src/sim/savecode.ts';
import { Game, scenarioMenu, storedGame } from '../src/app/controller.ts';
import { viewInputs } from '../src/session.ts';
import { plannerView } from '../src/views/planner.ts';
import type { C07Command } from '../src/commands.ts';
import { bundle } from './helpers.ts';

function bookDefault(g: Game, to: string, source: 'default' | 'planner' | 'board'): string | null {
  const { p, d } = viewInputs(g.sim);
  const pl = plannerView(p, d, to);
  return g.command(pl.options[pl.defaultIndex!]!.classes.find((c) => c.legal)!.cmd, source);
}

describe('app shell', () => {
  it('lists the tutorial first, recommended', () => {
    const m = scenarioMenu();
    expect(m.map((x) => x.id)).toEqual(['preview-tutorial', 'preview-changeover']);
    expect(m[0]!.recommended).toBe(true);
    expect(m[0]!.title).toBe('The first errand');
  });

  it('stamps bookings with the planning time and source, and reads interrupts once', () => {
    const g = Game.create(bundle(), 'preview-tutorial');
    expect(bookDefault(g, 'SYN_C_COR', 'default')).toBeNull();
    const ui = (g.sim.log.at(-1)!.cmd as C07Command & { ui?: { source?: string; sinceArrivalMs?: number } }).ui;
    expect(ui?.source).toBe('default');
    expect(Number.isInteger(ui?.sinceArrivalMs)).toBe(true);
    g.advance();
    expect(g.takeFresh().map((i) => i.kind)).toContain('arrival');
    expect(g.takeFresh()).toEqual([]);
    expect(g.stored).toBe(false);
    expect(storedGame()).toBeNull();
  });

  it('returns the rules’ refusal and logs nothing for an illegal command', () => {
    const g = Game.create(bundle(), 'preview-tutorial');
    expect(g.command({ type: 'cancelBooking' })).toBe('No booking');
    expect(g.sim.log).toEqual([]);
  });

  it('a save code with answers replays to the same state', () => {
    const g = Game.create(bundle(), 'preview-tutorial', 77);
    bookDefault(g, 'SYN_C_COR', 'planner');
    g.advance();
    g.setAnswers({ q4: 3, q5: 'ok' });
    const code = g.saveCode();
    const back = Game.restore(bundle(), code);
    expect(back.sim.hash()).toBe(g.sim.hash());
    expect(back.sim.seed).toBe(77);
    expect(back.answers).toEqual({ q4: 3, q5: 'ok' });
    expect(decodeSave(code).answers).toEqual({ q4: 3, q5: 'ok' });
  });

  it('refuses foreign, broken and mismatched codes in words', () => {
    const g = Game.create(bundle(), 'preview-tutorial');
    const save = decodeSave<C07Command>(g.saveCode());
    expect(() => Game.restore(bundle(), 'not a code!')).toThrow(/not a save code/);
    expect(() => Game.restore(bundle(), encodeSave({ ...save, game: 'c01-masters' }))).toThrow(/another game/);
    expect(() => Game.restore(bundle(), encodeSave({ ...save, dataHash: 'other' }))).toThrow(/other game data/);
    expect(() => Game.restore(bundle(), encodeSave({ ...save, log: [{ k: 0, cmd: { type: 'cancelBooking' } }] }))).toThrow(/does not replay/);
  });
});
