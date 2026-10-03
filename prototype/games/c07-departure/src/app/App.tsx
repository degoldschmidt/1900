/**
 * The app shell: owns the running game (controller.ts), routes between the screens and turns
 * their requests into commands and Advance. On a phone one screen shows at a time with the tabs
 * at the bottom; on a wide screen the diary page stays open on the left and the other screens
 * open beside it.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { C07Bundle } from '../rules/data.ts';
import type { C07Command } from '../commands.ts';
import { PREVIEW_BANNER } from '../views/index.ts';
import { Game, scenarioMenu, storedGame } from './controller.ts';
import type { Screen, Ctl, Inputs, GoOptions, Source } from '../ui/types.ts';
import { SCREEN_TITLE } from '../ui/types.ts';
import { Banner, Tabs } from '../ui/Chrome.tsx';
import { Start } from '../ui/Start.tsx';
import { Diary } from '../ui/Diary.tsx';
import { AdvanceBar, AdvanceSheet } from '../ui/Advance.tsx';
import { Planner } from '../ui/Planner.tsx';
import { Board } from '../ui/Board.tsx';
import { Town } from '../ui/Town.tsx';
import { Pocket } from '../ui/Pocket.tsx';
import { Purse, Letters, Shelf } from '../ui/Ledger.tsx';
import { Trail, News, About } from '../ui/Pages.tsx';
import { Save } from '../ui/Save.tsx';
import { Arrival, Questionnaire, Autopsy } from '../ui/End.tsx';

const RIDE_END = ['arrival', 'missed', 'ghost', 'refused'];
const WIDE = '(min-width: 60rem)';

function useWide(): boolean {
  const mq = typeof matchMedia === 'function' ? matchMedia(WIDE) : null;
  const [wide, setWide] = useState(mq?.matches ?? false);
  useEffect(() => {
    if (!mq) return;
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

export interface Holder { game: Game | null }

export function App({ bundle, holder, initial }: { bundle: C07Bundle; holder: Holder; initial: Game | null }) {
  const [game, setGameState] = useState<Game | null>(initial);
  const [screen, setScreen] = useState<Screen>('diary');
  const [panel, setPanel] = useState<Screen>('plan');
  const [opt, setOpt] = useState<GoOptions & { fromBoard: boolean }>({ fromBoard: false });
  const [v, setV] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [noteFrom, setNoteFrom] = useState(Number.MAX_SAFE_INTEGER);
  const wide = useWide();
  const panelRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  const scenarios = useMemo(() => scenarioMenu(), []);
  const [stored, setStored] = useState(() => storedGame());

  const setGame = (g: Game | null) => { holder.game = g; setGameState(g); };

  const show = (s: Screen) => {
    if (s === 'arrival') game?.markArrival();
    setScreen(s);
    if (s !== 'diary') setPanel(s);
  };

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!wide && typeof scrollTo === 'function') scrollTo(0, 0);
    panelRef.current?.focus({ preventScroll: true });
  }, [screen]);

  /** After a command or Advance: read the new interrupts and turn to the screen they call for. */
  const settle = (g: Game, fromAdvance: boolean) => {
    const fresh = g.takeFresh();
    setV((x) => x + 1);
    if (fresh.some((i) => RIDE_END.includes(i.kind))) { g.markArrival(); setScreen('arrival'); setPanel('arrival'); return; }
    if (g.ended && fresh.some((i) => i.kind === 'ending')) { setScreen('questions'); setPanel('questions'); return; }
    if (fromAdvance) setScreen('diary');
  };

  const begin = (g: Game) => {
    setGame(g);
    g.takeFresh();
    setNoteFrom(Number.MAX_SAFE_INTEGER);
    setV((x) => x + 1);
    setScreen(g.ended ? (Object.keys(g.answers).length ? 'autopsy' : 'questions') : 'diary');
    setPanel(g.ended ? 'questions' : 'plan');
  };

  const ctl: Ctl = {
    send: (cmd: C07Command, source?: Source) => {
      if (!game) return 'No game is running';
      const err = game.command(cmd, source);
      if (!err) settle(game, false);
      return err;
    },
    go: (s, o) => {
      if (s === 'plan') setOpt({ to: o?.to ?? opt.to, train: o?.train ?? null, fromBoard: !!o?.train, station: opt.station });
      else if (s === 'board' && o?.station) setOpt({ ...opt, station: o.station });
      show(s);
    },
    openAdvance: () => setSheet(true),
  };

  if (!game) {
    return (
      <div class="app app-start">
        <Banner text={PREVIEW_BANNER} />
        <Start
          scenarios={scenarios}
          stored={stored}
          onStart={(id, seed) => begin(Game.create(bundle, id, seed))}
          onResume={() => {
            const s = storedGame();
            if (!s) { setStored(null); return 'The kept game is gone.'; }
            try { begin(Game.restore(bundle, s.code)); return null; } catch (e) { return e instanceof Error ? e.message : String(e); }
          }}
          onRestore={(code) => { try { begin(Game.restore(bundle, code)); return null; } catch (e) { return e instanceof Error ? e.message : String(e); } }}
        />
      </div>
    );
  }

  const inp: Inputs = { ...game.inputs(), v };
  const doAdvance = () => {
    setSheet(false);
    setNoteFrom(game.sim.state.diary.interrupts.length);
    game.advance();
    settle(game, true);
  };
  const right: Screen = wide ? (screen === 'diary' ? panel : screen) : screen;
  const autopsy = right === 'autopsy' ? game.autopsy() : null;

  const body = (s: Screen) => {
    switch (s) {
      case 'diary': return <Diary inp={inp} ctl={ctl} noteFrom={noteFrom} />;
      case 'plan': return <Planner inp={inp} ctl={ctl} to={opt.to} train={opt.train ?? null} fromBoard={opt.fromBoard} />;
      case 'board': return <Board inp={inp} ctl={ctl} station={opt.station} />;
      case 'town': return <Town inp={inp} ctl={ctl} />;
      case 'pocket': return <Pocket ctl={ctl} />;
      case 'purse': return <Purse inp={inp} />;
      case 'letters': return <Letters inp={inp} ctl={ctl} />;
      case 'shelf': return <Shelf inp={inp} ctl={ctl} />;
      case 'trail': return <Trail inp={inp} />;
      case 'news': return <News inp={inp} />;
      case 'about': return <About inp={inp} />;
      case 'save': return (
        <Save code={game.saveCode()} stored={game.stored} ctl={ctl} aboard={inp.p.me.where.k === 'aboard'}
          onEndSession={() => ctl.send({ type: 'endSession' })}
          onStartScreen={() => { setStored(storedGame()); setGame(null); }} />
      );
      case 'arrival': return <Arrival inp={inp} ctl={ctl} />;
      case 'questions': return <Questionnaire inp={inp} initial={game.answers} ending={inp.p.ending?.kind ?? null} onDone={(a) => { game.setAnswers(a); show('autopsy'); }} />;
      case 'autopsy': return autopsy ? <Autopsy av={autopsy} code={game.saveCode()} onAgain={() => { setStored(storedGame()); setGame(null); }} /> : null;
    }
  };

  const answered = Object.keys(game.answers).length > 0;
  const bar = <AdvanceBar inp={inp} ended={game.ended} answered={answered} onOpen={() => setSheet(true)} onEnd={() => show(answered ? 'autopsy' : 'questions')} />;

  return (
    <div class={`app${wide ? ' app-wide' : ''}`}>
      <Banner text={PREVIEW_BANNER} />
      <header class="mast">
        <h1 class="mast-t">The Departure</h1>
        <p class="mast-s">{scenarios.find((s) => s.id === game.scenarioId)?.title ?? ''}</p>
      </header>
      {wide ? (
        <div class="frame">
          <div class="diary-col">
            <Diary inp={inp} ctl={ctl} noteFrom={noteFrom} />
            {bar}
          </div>
          <div class="panel-col">
            <Tabs screen={right} go={(s) => ctl.go(s)} wide />
            <main class="panel" ref={panelRef} tabIndex={-1} aria-label={SCREEN_TITLE[right]}>{body(right)}</main>
          </div>
        </div>
      ) : (
        <>
          <main class={`panel panel-${screen}`} ref={panelRef} tabIndex={-1} aria-label={SCREEN_TITLE[screen]}>{body(screen)}</main>
          {screen === 'diary' ? bar : null}
          <Tabs screen={screen} go={(s) => ctl.go(s)} wide={false} />
        </>
      )}
      {sheet ? <AdvanceSheet inp={inp} onGo={doAdvance} onClose={() => setSheet(false)} /> : null}
    </div>
  );
}
