/**
 * The map-first preview (Decision P-012): the invented geography agrees with the timetable, and
 * the new view models (map, goal, city sheet, journey, cards, pocket, replay) speak in plain words
 * and hand out only commands the rules accept.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../../../kit/src/sim/sim.ts';
import { module } from '../src/game.ts';
import type { MapLayer } from '../src/rules/data.ts';
import { raw, bundle, newSim, cmd, until, advance, viewInputs, WORLD_JSON } from './helpers.ts';
import * as V from '../src/views/index.ts';
import type { C07Sim } from '../src/session.ts';

type Pt = [number, number];
const map = (): MapLayer => (raw() as unknown as { map: MapLayer }).map;
const dist = (a: Pt, b: Pt): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const length = (l: readonly Pt[]): number => l.reduce((acc, q, i) => (i ? acc + dist(q, l[i - 1]!) : 0), 0);
function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}
const lineDist = (p: Pt, l: readonly Pt[]): number => Math.min(...l.slice(1).map((q, i) => segDist(p, l[i]!, q)));
function inside(p: Pt, poly: readonly Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!; const [xj, yj] = poly[j]!;
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const cityPt = (id: string): Pt => { const c = map().cities.find((x) => x.id === id)!; return [c.x, c.y]; };
const stationPt = (id: string): Pt => { const s = map().stations.find((x) => x.id === id)!; return [s.x, s.y]; };
const segment = (a: string, b: string) => map().segments.find((s) => (s.a === a && s.b === b) || (s.a === b && s.b === a));

/** Every pair of consecutive calls in the timetable, with the fastest scheduled run between them. */
function hops(): Map<string, { a: string; b: string; mode: string; minSec: number }> {
  const b = bundle(); const tt = b.tt; const out = new Map<string, { a: string; b: string; mode: string; minSec: number }>();
  for (const t of tt.trips) {
    for (let j = t.firstStop; j + 1 < t.firstStop + t.nStops; j++) {
      const a = tt.stationIds[tt.stopStation[j]!]!; const z = tt.stationIds[tt.stopStation[j + 1]!]!;
      const run = tt.arrAt(j + 1, 0)! - tt.depAt(j, 0)!;
      const key = a < z ? `${a}|${z}` : `${z}|${a}`;
      const prev = out.get(key);
      if (!prev || run < prev.minSec) out.set(key, { a, b: z, mode: t.mode, minSec: run });
    }
  }
  return out;
}

describe('the map layer agrees with the timetable', () => {
  it('every route segment has a polyline between its stations, drawn from one to the other', () => {
    for (const h of hops().values()) {
      const s = segment(h.a, h.b);
      expect(s, `${h.a}–${h.b}`).toBeDefined();
      expect(s!.mode).toBe(h.mode === 'rail' ? 'rail' : 'steamer');
      const [first, last] = s!.a === h.a ? [s!.line[0]!, s!.line[s!.line.length - 1]!] : [s!.line[s!.line.length - 1]!, s!.line[0]!];
      expect(first).toEqual(stationPt(h.a));
      expect(last).toEqual(stationPt(h.b));
    }
    expect(map().segments.length).toBe(hops().size);
  });

  it('every station sits at its city, every city has a place, and each city lies in its own country', () => {
    const b = bundle();
    for (const st of b.raw.stations) expect(dist(stationPt(st.id), cityPt(st.city)), st.id).toBeLessThanOrEqual(12);
    for (const c of b.raw.cities) {
      const country = map().countries.find((x) => x.id === c.country)!;
      expect(inside(cityPt(c.id), country.poly), `${c.id} in ${c.country}`).toBe(true);
      expect(inside(cityPt(c.id), map().land), `${c.id} on land`).toBe(true);
      for (const w of map().water) expect(inside(cityPt(c.id), w.poly), `${c.id} not in the lake`).toBe(false);
    }
  });

  it('frontier towns stand on their border, one on each side', () => {
    const b = bundle();
    const pairs = new Map<string, string[]>();
    for (const st of b.raw.stations) if (st.frontierPair && b.raw.stations.filter((x) => x.frontierPair === st.frontierPair).every((x) => b.station.get(x.id)!.city !== st.city || x.id === st.id)) pairs.set(st.frontierPair, [...(pairs.get(st.frontierPair) ?? []), st.city]);
    const land = [...pairs.values()].filter((cs) => cs.length === 2 && cs.every((c) => !['SYN_C_PAN', 'SYN_C_SKA', 'SYN_C_EBB'].includes(c)));
    expect(land.length).toBe(2);
    for (const [x, y] of land) {
      const cx = b.city.get(x!)!.country; const cy = b.city.get(y!)!.country;
      expect(cx).not.toBe(cy);
      const border = map().borders.find((m) => (m.a === cx && m.b === cy) || (m.a === cy && m.b === cx))!;
      expect(border, `${cx}/${cy} border`).toBeDefined();
      for (const c of [x!, y!]) expect(lineDist(cityPt(c), border.line), c).toBeLessThanOrEqual(15);
    }
  });

  it('the ports stand on the water', () => {
    const shores = [map().land, ...map().water.map((w) => w.poly)];
    for (const port of ['SYN_C_PAN', 'SYN_C_SKA', 'SYN_C_EBB']) {
      expect(Math.min(...shores.map((s) => lineDist(cityPt(port), [...s, s[0]!]))), port).toBeLessThanOrEqual(14);
    }
  });

  it('distances follow the travel times: rail roughly a unit a minute, the two crossings in proportion', () => {
    const h = [...hops().values()];
    for (const x of h.filter((y) => y.mode === 'rail' && y.minSec >= 30 * 60)) {
      const ratio = length(segment(x.a, x.b)!.line) / (x.minSec / 60);
      expect(ratio, `${x.a}–${x.b}`).toBeGreaterThan(0.7);
      expect(ratio, `${x.a}–${x.b}`).toBeLessThan(1.2);
    }
    const water = h.filter((y) => y.mode !== 'rail').map((x) => length(segment(x.a, x.b)!.line) / (x.minSec / 60));
    expect(water.length).toBe(2);
    expect(Math.max(...water) / Math.min(...water)).toBeLessThan(1.25);
    for (const x of h.filter((y) => y.mode === 'rail' && y.minSec < 30 * 60)) expect(length(segment(x.a, x.b)!.line)).toBeLessThanOrEqual(30);
  });

  it('stays invented and small: no real coastline, under 250 KB with the timetable', () => {
    expect(readFileSync(WORLD_JSON, 'utf8').length).toBeLessThan(250_000);
    expect(map().countries.map((c) => c.name).sort()).toEqual(['Ardesia', 'Corvenia', 'Varnholm']);
  });
});

const NUMBERS = /‰|per mille|SYN_|DV-C07|cost vector/;
const text = (x: unknown): string => JSON.stringify(x, (k, v) => (k === 'cmd' || k === 'cancel' || k === 'action' || k === 'id' || k === 'city' || k === 'toCity' ? undefined : v));

function tutorial(): C07Sim { return newSim('preview-tutorial'); }

describe('the map screens speak in plain words', () => {
  it('the map marks you, the goal, the towns one train away, and night', () => {
    const sim = tutorial(); const { p, d } = viewInputs(sim);
    const mv = V.mapView(p, d);
    expect(mv.cities.find((c) => c.here)?.id).toBe('SYN_C_AUB');
    expect(mv.goal).toMatchObject({ city: 'SYN_C_COR', label: 'Tue 19.00' });
    expect(mv.cities.filter((c) => c.direct).map((c) => c.id)).toEqual(expect.arrayContaining(['SYN_C_COR', 'SYN_C_PAN', 'SYN_C_QUE']));
    expect(mv.night).toBe(false);
    expect(mv.geo.segments.length).toBe(map().segments.length);
    expect(V.isNight(p, d, d.now + 14 * 3600)).toBe(true);
  });

  it('one goal line with deadline, pay and progress', () => {
    const sim = tutorial(); const { p, d } = viewInputs(sim);
    const g = V.goalView(p, d);
    expect(g.text).toBe('Take the letter to Corlaine by Tuesday 19.00 — pays £5');
    expect(g).toMatchObject({ status: 'open', done: 0, total: 2, left: '11 h left' });
  });

  it('departures are plain rows whose Book the rules accept; things to do in town too', () => {
    const sim = tutorial(); const { p, d } = viewInputs(sim);
    const sv = V.citySheetView(p, d, 'SYN_C_AUB');
    expect(sv.here).toBe(true);
    const first = sv.departures[0]!;
    expect(first).toMatchObject({ head: '12.20 to Corlaine', times: 'arrives 14.20 · 2 h', fare: '2nd class 6.70 cv.', reliability: 'usually on time', goal: true });
    expect(sv.departures.some((r) => r.notes.includes('a frontier: your name goes into the register'))).toBe(true);
    expect(sv.choices.length).toBeGreaterThanOrEqual(2);
    expect(sv.choices.length).toBeLessThanOrEqual(4);
    expect(text(sv)).not.toMatch(NUMBERS);
    for (const r of [...sv.departures.slice(0, 3), ...sv.choices.filter((c) => c.legal)]) {
      const probe = new Sim(module.game, bundle(), sim.scenario);
      expect(probe.command(r.cmd)).toEqual({ ok: true });
    }
    const far = V.citySheetView(p, d, 'SYN_C_PAN');
    expect(far.here).toBe(false);
    expect(far.departures.length).toBeGreaterThan(0);
    expect(text(far)).not.toMatch(NUMBERS);
  });

  it('journeys with a change say it in words; a booked train counts down', () => {
    const sim = tutorial();
    cmd(sim, V.citySheetView(viewInputs(sim).p, viewInputs(sim).d, 'SYN_C_COR').departures[0]!.cmd);
    until(sim, ['arrival']);
    const { p, d } = viewInputs(sim);
    const pan = V.citySheetView(p, d, 'SYN_C_PAN');
    expect(pan.departures.some((r) => /at Aubrevaux, across town/.test(r.reliability))).toBe(true);
    cmd(sim, pan.departures[0]!.cmd);
    const here = V.citySheetView(viewInputs(sim).p, viewInputs(sim).d, 'SYN_C_COR');
    expect(here.booking?.leavesIn).toMatch(/^\d+ (min|h)/);
    expect(here.departures).toEqual([]);
  });

  it('the token runs along the line during a ride, and stops short of a late train’s station', () => {
    const sim = tutorial();
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D15', day: 5223, from: 'SYN_S_AUBN', to: 'SYN_S_COR' }] });
    sim.advanceUntil((s) => s.me.where.k === 'aboard');
    const { p, d } = viewInputs(sim);
    const cor = cityPt('SYN_C_COR');
    const at = (t: number) => { const j = V.journeyView(p, d, t); return dist([j.token.x, j.token.y], cor); };
    const ds = [0, 1800, 3600, 5400].map((s) => at(d.now + s));
    for (let i = 1; i < ds.length; i++) expect(ds[i]!).toBeLessThan(ds[i - 1]!);
    expect(V.journeyView(p, d, d.now).phase).toBe('aboard');
    expect(V.journeyView(p, d, d.now).line).toBe('Aboard the Corvenian Mail to Corlaine');
    expect(at(d.now + 6 * 3600)).toBeGreaterThan(0);
  });

  it('cards: arrival with a step out; a frontier register; a ghost with its remedy', () => {
    const sim = tutorial();
    let { p, d } = viewInputs(sim);
    let m = V.marksOf(p, d);
    cmd(sim, V.citySheetView(p, d, 'SYN_C_AUB').departures.find((r) => r.toCity === 'SYN_C_QUE')!.cmd);
    until(sim, ['arrival']);
    ({ p, d } = viewInputs(sim));
    const cs = V.cardsSince(p, d, m);
    expect(cs.map((c) => c.kind)).toEqual(['frontier', 'arrival']);
    expect(cs[0]!.text).toMatch(/your name goes into the frontier register/);
    expect(cs[1]!.buttons[0]).toMatchObject({ label: 'Step out', action: { kind: 'open', city: 'SYN_C_QUE' } });
    for (const c of cs) { expect(text(c)).not.toMatch(NUMBERS); expect(c.buttons.length).toBeGreaterThanOrEqual(1); expect(c.buttons.length).toBeLessThanOrEqual(2); }

    const ch = newSim('preview-changeover');
    ({ p, d } = viewInputs(ch)); m = V.marksOf(p, d);
    cmd(ch, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D11', day: 5234, from: 'SYN_S_AUBN', to: 'SYN_S_TOLW' }] });
    expect(until(ch, ['ghost', 'arrival'], 200)).toBe('ghost');
    ({ p, d } = viewInputs(ch));
    const ghost = V.cardsSince(p, d, m).find((c) => c.kind === 'ghost')!;
    expect(ghost.text).toMatch(/your guide is out of date/);
    const remedy = ghost.buttons.find((b) => b.action.kind === 'act')!;
    expect(remedy.label).toMatch(/^Buy the new guide/);
    const probe = new Sim(module.game, bundle(), ch.scenario); probe.replayLog(ch.log, ch.processed);
    for (const c of (remedy.action as { cmds: V.C07Command[] }).cmds) expect(probe.command(c)).toEqual({ ok: true });
  });

  it('the pocket tells your own trail in sentences, with who could hold it', () => {
    const sim = tutorial();
    cmd(sim, { type: 'planVerb', verb: 'lodge', args: { tier: 'modest' } });
    advance(sim);
    const { p, d } = viewInputs(sim);
    const pv = V.pocketView(p, d);
    expect(pv.trail[0]).toMatchObject({ text: 'The hotel wrote your name on a police slip.', named: true });
    expect(pv.trail[0]!.who).toMatch(/^The Corvenian Public Safety Office could have it/);
    expect(pv.cash[0]!.words).toMatch(/^about /);
    expect(text({ ...pv, guides: pv.guides.map((g) => ({ ...g, detail: '', citation: null })) })).not.toMatch(NUMBERS);
  });

  it('the replay opens only after the end: route, numbered records, watchers', () => {
    const sim = tutorial();
    const { d } = viewInputs(sim);
    expect(() => V.replayView(sim.state, d)).toThrow(/after the ending/);
    const log = JSON.parse(readFileSync(new URL('../scenarios/scripts/tutorial-delivered.script.json', import.meta.url), 'utf8')) as { steps: Array<{ wait?: { untilTrace: string }; cmd: V.C07Command }> };
    for (const s of log.steps) {
      if (s.wait) sim.advanceUntil(() => sim.trace.at(-1)?.kind === s.wait!.untilTrace);
      cmd(sim, s.cmd);
    }
    while (!sim.state.ending && sim.step());
    const rv = V.replayView(sim.state, viewInputs(sim).d);
    expect(rv.ending.word).toBe('Delivered');
    expect(rv.route.length).toBeGreaterThanOrEqual(3);
    expect(rv.records.map((r) => r.n)).toEqual(rv.records.map((_, i) => i + 1));
    expect(rv.summary[0]).toMatch(/^You made \d+ records/);
  });
});
