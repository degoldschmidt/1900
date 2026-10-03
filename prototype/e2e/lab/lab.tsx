/**
 * The kit lab: a debug-only page that runs the synthetic toy game with the inspector and the
 * ?test=1 hooks, and exposes the kit digest. It is built into build/lab/ for the lab E2E only and
 * is never shipped (it holds SYN_ fixtures).
 */
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { Sim } from '#kit/sim/sim.ts';
import { mountInspector } from '#kit/devtools/inspector.tsx';
import { installTestHooks } from '#kit/devtools/test-hooks.ts';
import { toyModule, toyRaw } from '../../kit/test/fixtures/toy-module.ts';
import type { ToyState, ToyCmd, ToyBundle } from '../../kit/test/fixtures/toy-game.ts';
import { kitDigest } from './digest.ts';

const bundle = toyModule.bundleFrom(toyRaw);
const create = (id: string, seed: number) => new Sim<ToyState, ToyCmd, ToyBundle>(toyModule.game, bundle, toyModule.scenario(bundle, id, seed));
let sim = create('toy-1', 7);

function Lab({ version, onMove }: { version: number; onMove: () => void }) {
  const [msg, setMsg] = useState('');
  const send = (cmd: ToyCmd) => { const r = sim.command(cmd); setMsg(r.ok ? `${cmd.type} ok` : r.error); onMove(); };
  return (
    <main data-version={version}>
      <h1>Kit lab</h1>
      <p>Synthetic toy game for kit tests. Courier at <b id="at">{sim.state.at}</b>; {sim.processed} events processed.</p>
      <p>
        <button type="button" onClick={() => send({ type: 'subscribe', reader: 'SYN_hunter' })}>Subscribe hunter</button>{' '}
        <button type="button" onClick={() => send({ type: 'move', to: 'SYN_B', hours: 5 })}>Move to B</button>{' '}
        <button type="button" onClick={() => { for (let i = 0; i < 25 && sim.step(); i++); onMove(); }}>Run 25 events</button>
      </p>
      <p id="msg">{msg}</p>
    </main>
  );
}

const root = document.getElementById('app')!;
let version = 0;
const draw = () => render(<Lab version={version} onMove={() => { version++; draw(); inspector.refresh(); }} />, root);
const inspector = mountInspector({ getSim: () => sim, buildId: 'lab', dataHash: toyRaw.meta.dataHash, onChange: () => { version++; draw(); } });
installTestHooks({ getSim: () => sim, create, buildId: 'lab', dataHash: toyRaw.meta.dataHash });
(window as unknown as { __lab: unknown }).__lab = { kitDigest, reset: () => { sim = create('toy-1', 7); version++; draw(); } };
draw();
