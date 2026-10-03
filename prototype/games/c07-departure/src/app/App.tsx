/**
 * The app shell (Decision P-012): the map is the home screen. A tap on a city opens its sheet over
 * the map; booking and setting off run the clock, event by event, while the token moves along the
 * line and cards stop it for what the rules produce; the pocket is a sheet too. The shell owns the
 * running game (controller.ts) and turns the screens' requests into commands and runs of the clock.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { C07Bundle } from '../rules/data.ts';
import type { C07Command } from '../commands.ts';
import {
  PREVIEW_BANNER, actOutcome, mapView, goalView, citySheetView, purseLine, journeyView, displayClock, isNight, cardsSince, marksOf,
  type EventCard, type CardButton, type Marks,
} from '../views/index.ts';
import { Game, scenarioMenu, storedGame, type RunMode } from './controller.ts';
import type { Ctl, Inputs, Source } from '../ui/types.ts';
import { Banner } from '../ui/common.tsx';
import { Start } from '../ui/Start.tsx';
import { MapCanvas, type Highlight } from '../ui/MapCanvas.tsx';
import { TopBar } from '../ui/TopBar.tsx';
import { CitySheet } from '../ui/CitySheet.tsx';
import { JourneyStrip, Card } from '../ui/Journey.tsx';
import { Pocket } from '../ui/Pocket.tsx';
import { Coach, COACH } from '../ui/Coach.tsx';
import { Questionnaire, Replay } from '../ui/End.tsx';

export interface Holder { game: Game | null }

type Stage = 'play' | 'questions' | 'replay';

interface RunRef { mode: RunMode; t: number; marks: Marks; paceKey: string; rate: number; hurry: boolean }
interface After { open: string | null; act: C07Command[] | null; pocket: boolean }

const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const frame = (f: (t: number) => void): number => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(() => f(Date.now()), 16) as unknown as number);
const unframe = (h: number): void => { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(h); else clearTimeout(h); };
const stageOf = (g: Game): Stage => (g.ended ? (Object.keys(g.answers).length ? 'replay' : 'questions') : 'play');

export function App({ bundle, holder, initial }: { bundle: C07Bundle; holder: Holder; initial: Game | null }) {
  const [game, setGameState] = useState<Game | null>(initial);
  const [stage, setStage] = useState<Stage>(initial ? stageOf(initial) : 'play');
  const [v, setV] = useState(0);
  const [sheet, setSheet] = useState<string | null>(null);
  const [pocket, setPocket] = useState(false);
  const [cls, setCls] = useState<1 | 2 | 3>(2);
  const [coach, setCoach] = useState(-1);
  const [cards, setCards] = useState<EventCard[]>([]);
  const [cardN, setCardN] = useState({ i: 1, of: 1 });
  const [flash, setFlash] = useState<string | null>(null);
  const [running, setRunning] = useState<RunMode | null>(null);
  const [dispT, setDispT] = useState(0);
  const runRef = useRef<RunRef | null>(null);
  const after = useRef<After>({ open: null, act: null, pocket: false });
  const scenarios = useMemo(() => scenarioMenu(), []);
  const [stored, setStored] = useState(() => storedGame());

  const setGame = (g: Game | null) => { holder.game = g; setGameState(g); };
  const bump = () => setV((x) => x + 1);

  const begin = (g: Game, fresh: boolean) => {
    setGame(g);
    g.takeFresh();
    runRef.current = null; setRunning(null);
    setCards([]); setSheet(null); setPocket(false); setFlash(null);
    setStage(stageOf(g));
    setCoach(fresh && g.scenarioId === 'preview-tutorial' && !g.ended ? 0 : -1);
    setDispT(g.sim.now);
    bump();
  };

  const inp: Inputs | null = useMemo(() => (game ? { ...game.inputs(), v } : null), [game, v]);
  const mapVm = useMemo(() => (inp && game && !game.ended ? mapView(inp.p, inp.d) : null), [inp]);

  const applyAfter = (g: Game) => {
    const a = after.current; after.current = { open: null, act: null, pocket: false };
    if (a.act) {
      let err: string | null = null;
      for (const c of a.act) { err = g.command(c); if (err) break; }
      bump();
      if (!err) { startRun(g, { kind: 'act', slot: g.sim.state.diary.nextId }); return; }
      setFlash(err);
    }
    if (a.pocket) setPocket(true);
    if (a.open) { setSheet(a.open); g.markArrival(); }
  };

  const finish = (g: Game, cs: EventCard[]) => {
    const mode = runRef.current?.mode;
    runRef.current = null; setRunning(null);
    g.persist();
    g.takeFresh();
    if (cs.length) { setCards(cs); setCardN({ i: 1, of: cs.length }); return; }
    if (mode?.kind === 'go') { const w = g.sim.state.me.where; if (w.k === 'city') after.current.open = w.city; }
    if (mode?.kind === 'act') { const { p, d } = g.inputs(); setFlash(actOutcome(p, d, mode.slot)); }
    applyAfter(g);
  };

  const startRun = (g: Game, mode: RunMode) => {
    const { p, d } = g.inputs();
    runRef.current = { mode, t: g.sim.now, marks: marksOf(p, d), paceKey: '', rate: 3600, hurry: false };
    setDispT(g.sim.now);
    setFlash(null);
    setRunning(mode);
  };

  // The clock: steps the simulation to the display time each frame; stops for cards.
  useEffect(() => {
    const g = game;
    if (!g || !running || cards.length) return;
    let h = 0; let last = -1;
    const reduce = reducedMotion();
    const tick = (now: number) => {
      const r = runRef.current;
      if (!r) return;
      const dt = last < 0 ? 16 : Math.min(80, now - last); last = now;
      const s = g.sim.state;
      const end = g.paceEnd(r.mode);
      const key = `${s.me.where.k}|${end}`;
      if (key !== r.paceKey) {
        r.paceKey = key;
        const secs = r.mode.kind === 'act' ? 0.9 : s.me.where.k === 'aboard' ? 3.4 : 1.3;
        r.rate = end !== null && end > r.t ? Math.max(1500, (end - r.t) / secs) : 6 * 3600;
      }
      const target = reduce || r.hurry ? Number.MAX_SAFE_INTEGER : r.t + (dt / 1000) * r.rate;
      const res = g.stepTo(target, r.mode);
      if (res === 'reached') { r.t = target; setDispT(target); h = frame(tick); return; }
      r.t = Math.max(r.t, g.sim.now);
      const { p, d } = g.inputs();
      const cs = cardsSince(p, d, r.marks);
      r.marks = marksOf(p, d);
      setDispT(r.t); bump();
      if (res === 'done') { finish(g, cs); return; }
      if (cs.length) { g.persist(); setCards(cs); setCardN({ i: 1, of: cs.length }); return; }
      h = frame(tick);
    };
    h = frame(tick);
    return () => unframe(h);
  }, [game, running, cards.length === 0]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || cards.length) return;
      if (pocket) setPocket(false); else if (sheet) setSheet(null);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [pocket, sheet, cards.length]);

  if (!game || !inp) {
    return (
      <div class="app app-start">
        <Banner text={PREVIEW_BANNER} />
        <Start
          scenarios={scenarios}
          stored={stored}
          onStart={(id, seed) => begin(Game.create(bundle, id, seed), true)}
          onResume={() => {
            const s = storedGame();
            if (!s) { setStored(null); return 'The kept game is gone.'; }
            try { begin(Game.restore(bundle, s.code), false); return null; } catch (e) { return e instanceof Error ? e.message : String(e); }
          }}
          onRestore={(code) => { try { begin(Game.restore(bundle, code), false); return null; } catch (e) { return e instanceof Error ? e.message : String(e); } }}
        />
      </div>
    );
  }

  const toStart = () => { runRef.current = null; setRunning(null); setStored(storedGame()); setGame(null); };

  if (stage !== 'play') {
    const rv = stage === 'replay' ? game.replay() : null;
    return (
      <div class="app app-page">
        <Banner text={PREVIEW_BANNER} />
        <h1 class="vh">The Departure</h1>
        {stage === 'questions' || !rv
          ? <Questionnaire inp={inp} initial={game.answers} ending={inp.p.ending?.kind ?? null} onDone={(a) => { game.setAnswers(a); setStage('replay'); bump(); }} />
          : <Replay rv={rv} inp={inp} code={game.saveCode()} onAgain={toStart} />}
      </div>
    );
  }

  const ctl: Ctl = {
    book: (cmd: C07Command, source: Source) => {
      const err = game.command(cmd, source);
      if (!err) {
        bump(); setFlash('Booked. Set off when you are ready, or use the time in town first.');
        const w = game.sim.state.me.where; if (w.k === 'city') setSheet(w.city);
      }
      return err;
    },
    act: (cmd: C07Command) => {
      if (running) return 'Wait for the clock to stop';
      const err = game.command(cmd);
      if (err) return err;
      bump();
      startRun(game, { kind: 'act', slot: game.sim.state.diary.nextId });
      return null;
    },
    send: (cmd: C07Command) => { const err = game.command(cmd); if (!err) { bump(); setFlash(null); } return err; },
    go: () => { setSheet(null); setPocket(false); startRun(game, { kind: 'go' }); },
    openCity: (city) => { setSheet(city); setPocket(false); setFlash(null); if (coach >= 0) setCoach(-1); },
    openPocket: (open) => { setPocket(open); if (open) setSheet(null); },
  };

  const onCard = (b: CardButton) => {
    const a = b.action;
    if (a.kind === 'end') { setCards([]); runRef.current = null; setRunning(null); game.persist(); setStage('questions'); bump(); return; }
    if (a.kind === 'open') after.current.open = a.city;
    if (a.kind === 'act') {
      if (runRef.current) {
        // Mid-journey (a change): plan them now; the run goes on and they happen before the train.
        for (const c of a.cmds) { const err = game.command(c); if (err) { setFlash(err); break; } }
        bump();
      } else after.current.act = a.cmds;
    }
    if (a.kind === 'pocket') after.current.pocket = true;
    const rest = cards.slice(1);
    setCards(rest);
    setCardN((n) => ({ i: n.i + 1, of: n.of }));
    if (rest.length === 0 && !runRef.current) applyAfter(game);
  };

  const { p, d } = inp;
  const t = running ? Math.max(dispT, d.now) : d.now;
  const mv = mapVm ?? mapView(p, d);
  const jv = journeyView(p, d, t);
  const night = isNight(p, d, t);
  const goal = goalView(p, d);
  const here = p.me.where.k === 'city' ? p.me.where.city : null;
  const sv = sheet ? citySheetView(p, d, sheet, cls) : null;
  const narrow = typeof matchMedia === 'function' && !matchMedia('(min-width: 56rem)').matches;
  const sheetPoint = sheet ? mv.cities.find((c) => c.id === sheet) ?? null : cards.length && narrow ? jv.token : null;
  const highlight: Highlight = coach >= 0 ? COACH[coach]!.target : null;
  const busy = running !== null;
  const bk = p.diary.booking;
  const idle = !running && !sheet && !pocket && cards.length === 0 && coach < 0;

  return (
    <div class="app app-play">
      <Banner text={PREVIEW_BANNER} />
      <h1 class="vh">The Departure</h1>
      <TopBar now={displayClock(p, d, t)} purse={purseLine(p, d)} goal={goal} pocketOpen={pocket}
        onPocket={() => ctl.openPocket(!pocket)} onGoal={goal.city && !busy ? () => ctl.openCity(goal.city) : null} />
      <div class={`stage${sheet || pocket ? ' has-sheet' : ''}`}>
        <MapCanvas mv={{ ...mv, night }} token={jv.token} highlight={highlight} label="Map of the invented railway: tap a town"
          onCity={busy ? undefined : (id) => ctl.openCity(id)} sheetOpen={!!(sheet || pocket)} center={sheetPoint} insetBottom={coach >= 0 ? 215 : cards.length ? 280 : 96} />
        {running ? <JourneyStrip jv={jv} acting={running.kind === 'act'} onSkip={() => { if (runRef.current) runRef.current.hurry = true; }} /> : null}
        {idle && !p.ending ? (
          <div class="actionbar">
            {here && bk && bk.next < bk.legs.length ? (
              <>
                <p class="ab-text">{jv.sub ? `Your train: ${jv.sub.replace(/^the /, '')}` : ''}</p>
                <div class="ab-btns">
                  <button type="button" class="btn btn-quiet" id="open-here" onClick={() => ctl.openCity(here)}>In town</button>
                  <button type="button" class="btn btn-go" id="set-off" onClick={() => ctl.go()}>Set off</button>
                </div>
              </>
            ) : here ? (
              <button type="button" class="btn btn-go btn-wide" id="open-here" onClick={() => ctl.openCity(here)}>{goal.here && goal.status === 'open' ? 'Meet your contact here' : `Departures from ${mv.cities.find((c) => c.id === here)?.name ?? ''}`}</button>
            ) : null}
          </div>
        ) : null}
        {idle && p.ending ? (
          <div class="actionbar"><button type="button" class="btn btn-go btn-wide" id="to-questions" onClick={() => setStage('questions')}>How it went</button></div>
        ) : null}
        {sv && !pocket ? <CitySheet sv={sv} ctl={ctl} cls={cls} setCls={setCls} busy={busy} flash={flash} /> : null}
        {pocket ? <Pocket inp={inp} ctl={ctl} code={game.saveCode()} stored={game.stored} onStartScreen={toStart} /> : null}
        {cards.length ? <Card card={cards[0]!} onButton={onCard} step={cardN.i} steps={cardN.of} /> : null}
        {coach >= 0 ? <Coach step={coach} onNext={() => { if (coach + 1 >= COACH.length) { setCoach(-1); if (here) setSheet(here); } else setCoach(coach + 1); }} onSkip={() => setCoach(-1)} /> : null}
      </div>
    </div>
  );
}
