/**
 * The debug inspector: a panel over the game page showing the event queue, the record store and
 * each reader's delivered view, parameters in force, the trace, the state hash, replay checks
 * against snapshots, and the save code. Debug builds only; games mount it behind `__DEBUG__`, so
 * release bundles drop this module. Toggle with the backquote key or the corner button.
 *
 * Stepping from the inspector calls `sim.step` only, like the game UI.
 */
import { render } from 'preact';
import { useState } from 'preact/hooks';
import type { Sim, GameDef, Command } from '../sim/sim.ts';
import { dayOf, instantOf } from '../time/instant.ts';
import {
  overview, queueRows, knownReaders, recordRows, paramsInForce, traceRows, checkReplay, saveCodeOf,
  GROUND_TRUTH, type ReplayCheck,
} from './model.ts';

export interface InspectorHost<S, C extends Command, B> {
  getSim(): Sim<S, C, B>;
  buildId: string;
  dataHash: string;
  /** Called after the inspector moves the simulation on, so the game re-renders. */
  onChange?(): void;
}

export interface InspectorHandle { refresh(): void; toggle(open?: boolean): void }

const TABS = ['Overview', 'Queue', 'Records', 'Params', 'Trace', 'Save'] as const;
type Tab = (typeof TABS)[number];

const CSS = `
#kit-inspector{--ki-bg:#fbfaf7;--ki-fg:#1d1b17;--ki-mute:#6b665c;--ki-line:#d9d4c7;--ki-acc:#7a2e1d;--ki-ok:#2f6b3a;--ki-bad:#a3261b;
 position:fixed;z-index:2147483000;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--ki-fg)}
@media (prefers-color-scheme:dark){#kit-inspector{--ki-bg:#1b1a17;--ki-fg:#ebe6da;--ki-mute:#a49d8e;--ki-line:#3a372f;--ki-acc:#e0a26f;--ki-ok:#7cc48a;--ki-bad:#f08a7e}}
#kit-inspector .ki-toggle{position:fixed;right:12px;bottom:12px;border:1px solid var(--ki-line);background:var(--ki-bg);color:var(--ki-fg);border-radius:4px;padding:4px 8px;font:inherit;cursor:pointer}
#kit-inspector .ki-panel{position:fixed;left:0;right:0;bottom:0;height:min(48vh,520px);background:var(--ki-bg);border-top:2px solid var(--ki-acc);display:flex;flex-direction:column;box-shadow:0 -4px 16px rgba(0,0,0,.15)}
#kit-inspector .ki-bar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:6px 12px;border-bottom:1px solid var(--ki-line)}
#kit-inspector .ki-bar b{margin-right:8px;color:var(--ki-acc)}
#kit-inspector button,#kit-inspector select,#kit-inspector input{font:inherit;color:var(--ki-fg);background:transparent;border:1px solid var(--ki-line);border-radius:3px;padding:2px 6px}
#kit-inspector button[aria-pressed=true]{background:var(--ki-acc);color:var(--ki-bg);border-color:var(--ki-acc)}
#kit-inspector .ki-body{overflow:auto;padding:8px 12px;flex:1}
#kit-inspector table{border-collapse:collapse;width:100%}
#kit-inspector th,#kit-inspector td{text-align:left;vertical-align:top;padding:2px 8px 2px 0;border-bottom:1px solid var(--ki-line);white-space:nowrap}
#kit-inspector td.wrap{white-space:normal;word-break:break-all}
#kit-inspector th{color:var(--ki-mute);font-weight:normal;position:sticky;top:0;background:var(--ki-bg)}
#kit-inspector dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px;margin:0 0 8px}
#kit-inspector dt{color:var(--ki-mute)}
#kit-inspector .ok{color:var(--ki-ok)} #kit-inspector .bad{color:var(--ki-bad)}
#kit-inspector textarea{width:100%;min-height:6em;font:inherit;color:var(--ki-fg);background:transparent;border:1px solid var(--ki-line)}
#kit-inspector .ki-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px}
`;

function Table<T extends object>({ rows, cols, wrap = [] }: { rows: T[]; cols: Array<keyof T & string>; wrap?: string[] }) {
  if (rows.length === 0) return <p>Nothing to show.</p>;
  return (
    <table>
      <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{cols.map((c) => <td key={c} class={wrap.includes(c) ? 'wrap' : undefined}>{String(r[c] ?? '')}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

function Panel<S, C extends Command, B>({ host, onClose, onStep }: { host: InspectorHost<S, C, B>; onClose: () => void; onStep: () => void }) {
  const [tab, setTab] = useState<Tab>('Overview');
  const [reader, setReader] = useState(GROUND_TRUTH);
  const [filter, setFilter] = useState('');
  const [hash, setHash] = useState<string | null>(null);
  const [checks, setChecks] = useState<ReplayCheck[]>([]);
  const [version, setVersion] = useState(0);
  const sim = host.getSim();
  const o = overview(sim);

  const moved = () => { setHash(null); setChecks([]); setVersion(version + 1); onStep(); };
  const step = (n: number) => { for (let i = 0; i < n && sim.step(); i++); moved(); };
  const nextDay = () => { sim.advanceTo(instantOf(dayOf(sim.now) + 1, 0) - 1); moved(); };
  const runChecks = () => {
    const expected = sim.hash();
    setHash(expected);
    const def = sim.def as GameDef<S, C, B>;
    const out = [checkReplay(def, sim.bundle, sim.scenario, sim.log, sim.processed, expected)];
    for (const snap of sim.snapshots.slice(-3)) out.push(checkReplay(def, sim.bundle, sim.scenario, sim.log, sim.processed, expected, snap));
    setChecks(out);
  };

  return (
    <div class="ki-panel" role="dialog" aria-label="Simulation inspector">
      <div class="ki-bar">
        <b>Inspector</b>
        {TABS.map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
        <span style="flex:1" />
        <button type="button" onClick={() => step(1)}>Step</button>
        <button type="button" onClick={() => step(10)}>Step 10</button>
        <button type="button" onClick={nextDay}>To next day</button>
        <button type="button" onClick={onClose} aria-label="Close inspector">Close</button>
      </div>
      <div class="ki-body">
        {tab === 'Overview' && (
          <div>
            <dl>
              <dt>game</dt><dd>{o.game} · build {host.buildId} · data {host.dataHash}</dd>
              <dt>scenario</dt><dd>{o.scenario} · seed {sim.seed}</dd>
              <dt>now</dt><dd>{o.now}</dd>
              <dt>next</dt><dd>{o.next}</dd>
              <dt>events</dt><dd>{o.processed} processed · {o.pending} pending</dd>
              <dt>records</dt><dd>{o.records}</dd>
              <dt>commands</dt><dd>{o.commands} logged · {o.snapshots} monthly snapshots</dd>
              <dt>hash</dt><dd>{hash ?? '—'}</dd>
            </dl>
            <div class="ki-row"><button type="button" onClick={runChecks}>Hash and check replay</button></div>
            {checks.length > 0 && (
              <ul>{checks.map((c, i) => (
                <li key={i} class={c.ok ? 'ok' : 'bad'}>{c.ok ? 'match' : 'MISMATCH'} — replay from {c.from}{c.error ? `: ${c.error}` : c.ok ? '' : ` gave ${c.got}`}</li>
              ))}</ul>
            )}
          </div>
        )}
        {tab === 'Queue' && <Table rows={queueRows(sim)} cols={['seq', 'at', 'prio', 'type', 'payload']} wrap={['payload']} />}
        {tab === 'Records' && (
          <div>
            <div class="ki-row">
              <label>View <select value={reader} onChange={(e) => setReader((e.target as HTMLSelectElement).value)}>
                {[GROUND_TRUTH, ...knownReaders(sim)].map((r) => <option key={r} value={r}>{r}</option>)}
              </select></label>
              <input type="search" placeholder="filter" value={filter} onInput={(e) => setFilter((e.target as HTMLInputElement).value)} />
            </div>
            <Table rows={recordRows(sim, reader, filter)} cols={reader === GROUND_TRUTH
              ? ['id', 'time', 'kind', 'subject', 'predicate', 'value', 'confidence', 'source', 'authorship']
              : ['id', 'time', 'arrives', 'kind', 'subject', 'predicate', 'value', 'confidence', 'source']} wrap={['value']} />
          </div>
        )}
        {tab === 'Params' && (
          <div>
            <div class="ki-row"><input type="search" placeholder="filter" value={filter} onInput={(e) => setFilter((e.target as HTMLInputElement).value)} /></div>
            <Table rows={paramsInForce(sim, filter)} cols={['param', 'key', 'value', 'from', 'to', 'basis', 'ref', 'public', 'id']} wrap={['value']} />
          </div>
        )}
        {tab === 'Trace' && <Table rows={traceRows(sim)} cols={['k', 'at', 'kind', 'data']} wrap={['data']} />}
        {tab === 'Save' && (
          <div>
            <p>Save code for this exact game (scenario, seed and every command). Pasting it into a debug build reproduces the state.</p>
            <textarea readOnly value={saveCodeOf(sim, host.buildId, host.dataHash)} onFocus={(e) => (e.target as HTMLTextAreaElement).select()} />
          </div>
        )}
      </div>
    </div>
  );
}

function Root<S, C extends Command, B>({ host, open, setOpen }: { host: InspectorHost<S, C, B>; open: boolean; setOpen: (v: boolean) => void }) {
  if (!open) return <button type="button" class="ki-toggle" onClick={() => setOpen(true)}>Inspector</button>;
  return <Panel host={host} onClose={() => setOpen(false)} onStep={() => host.onChange?.()} />;
}

export function mountInspector<S, C extends Command, B>(host: InspectorHost<S, C, B>, doc: Document = document): InspectorHandle {
  if (!doc.getElementById('kit-inspector-style')) {
    const style = doc.createElement('style');
    style.id = 'kit-inspector-style';
    style.textContent = CSS;
    doc.head.appendChild(style);
  }
  const el = doc.createElement('div');
  el.id = 'kit-inspector';
  doc.body.appendChild(el);
  let open = false;
  const draw = () => render(<Root host={host} open={open} setOpen={(v) => { open = v; draw(); }} />, el);
  doc.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (e.key === '`' && !(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) { open = !open; draw(); }
  });
  draw();
  return { refresh: draw, toggle: (v) => { open = v ?? !open; draw(); } };
}
