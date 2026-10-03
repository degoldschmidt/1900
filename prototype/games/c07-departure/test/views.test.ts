/**
 * Views (RULES.md 9) and T10: every view is a function of the public state and public data only.
 * Replacing the hidden hunt leaves every view but the autopsy byte-identical; the autopsy refuses
 * to open before the ending. The views import nothing that reaches the hunter or the store.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Sim } from '../../../kit/src/sim/sim.ts';
import { importsOf } from '../../../tools/check/import-boundaries.ts';
import { module } from '../src/game.ts';
import { bundle, scenario, cmd, until, HERE, viewInputs, randomWalk } from './helpers.ts';
import * as V from '../src/views/index.ts';
import type { C07Sim } from '../src/session.ts';
import { fmtDate } from '../../../kit/src/time/format.ts';

function allViews(sim: C07Sim): string {
  const { p, d } = viewInputs(sim);
  const here = p.me.where.k === 'city' ? p.me.where.city : 'SYN_C_TOL';
  const station = p.me.where.k === 'city' ? (p.me.where.station ?? 'SYN_S_AUBN') : p.me.where.ride.to;
  return JSON.stringify({
    diary: V.diaryView(p, d), upcoming: V.upcomingView(p, d), board: V.boardView(p, d, station), planner: V.plannerView(p, d, 'SYN_C_TOL'),
    city: V.cityView(p, d), shelf: V.shelfView(p, d), purse: V.purseView(p, d), commissions: V.commissionsView(p, d), trail: V.trailView(p, d),
    news: V.newsView(p, d, here), arrival: V.arrivalView(p, d), actions: V.actionsView(p, d), questions: V.questionnaireView(p, d),
    about: V.aboutView(d, 'test', (day) => fmtDate(day)),
  });
}

describe('views', () => {
  it('render at every interrupt of a walk, with legal commands the rules accept', () => {
    const sim: C07Sim = new Sim(module.game, bundle(), scenario('preview-changeover', { seed: 7 }));
    for (let i = 0; i < 12 && !sim.state.ending; i++) {
      expect(() => allViews(sim)).not.toThrow();
      const { p, d } = viewInputs(sim);
      for (const a of V.actionsView(p, d).filter((x) => x.legal && x.cmd.type !== 'endSession').slice(0, 6)) {
        const probe = new Sim(module.game, bundle(), sim.scenario);
        probe.replayLog(sim.log, sim.processed);
        expect(probe.command(a.cmd)).toEqual({ ok: true });
      }
      randomWalk(sim, 100 + i, 1);
    }
  });

  it('T10: replacing the hunt changes no view but the autopsy, which needs an ending', () => {
    const sim: C07Sim = new Sim(module.game, bundle(), scenario('preview-changeover', { seed: 9 }));
    randomWalk(sim, 9, 6);
    const before = allViews(sim);
    const saved = sim.state.hunt;
    sim.state.hunt = { ...saved, file: [999], cordons: [], belief: null, lastFix: null, delivered: [], fixes: [] };
    expect(allViews(sim)).toBe(before);
    sim.state.hunt = saved;
    const { d } = viewInputs(sim);
    if (sim.state.ending === null) expect(() => V.autopsyView(sim.state, d)).toThrow(/after the ending/);
  });

  it('the autopsy traces the ending to the hunt once the game is over', () => {
    const sim: C07Sim = new Sim(module.game, bundle(), scenario('preview-changeover', { seed: 3 }));
    randomWalk(sim, 3, 40);
    while (!sim.state.ending && sim.step());
    const { d } = viewInputs(sim);
    const a = V.autopsyView(sim.state, d);
    expect(a.ending.kind).toBe(sim.state.ending!.kind);
    expect(a.cordons.length).toBe(sim.state.hunt.cordons.length);
    expect(a.file.length).toBe(sim.state.hunt.delivered.length);
  });

  it('the planner offers the default pick, fares in the local currency and the trace of each choice', () => {
    const sim: C07Sim = new Sim(module.game, bundle(), scenario('preview-changeover'));
    const { p, d } = viewInputs(sim);
    const pl = V.plannerView(p, d, 'SYN_C_QUE');
    expect(pl.options.length).toBeGreaterThan(1);
    expect(pl.options.length).toBeLessThanOrEqual(12);
    expect(pl.defaultIndex).not.toBeNull();
    const o = pl.options[pl.defaultIndex!]!;
    expect(o.odds).toBeLessThanOrEqual(100);
    expect(o.classes[0]!.fare.join(' ')).toMatch(/cv\./);
    expect(o.trace.map((t) => t.kind)).toContain('frontier.passport');
    expect(o.legs[0]!.citation?.title).toMatch(/Preview guide \(invented\)/);
    cmd(sim, o.classes.find((c) => c.legal)!.cmd);
    expect(until(sim, ['arrival', 'missed', 'ghost'])).toBeTruthy();
  });

  it('the About screen carries the permanent preview banner and the design values', () => {
    const { d } = viewInputs(new Sim(module.game, bundle(), scenario('preview-tutorial')));
    const a = V.aboutView(d, 'test', (day) => fmtDate(day));
    expect(a.banner).toBe('Mechanics preview: an invented railway, not history');
    expect(a.designValues.some((v) => v.id === 'DV-C07-001')).toBe(true);
    expect(a.sources.every((s) => /\(invented\)/.test(s.title))).toBe(true);
  });

  it('views import nothing that reaches the hunter, the store or other institutions’ views', () => {
    const dir = join(HERE, '..', 'src', 'views');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const imports = importsOf(readFileSync(join(dir, f), 'utf8'));
      for (const spec of imports) {
        expect(spec, `${f} imports ${spec}`).not.toMatch(/hunter\/|records\/store|records\/delivery|records\/readers/);
        if (f !== 'autopsy.ts') expect(spec, `${f} imports ${spec}`).not.toMatch(/rules\/hunt/);
      }
    }
  });
});
