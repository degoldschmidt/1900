// Operations: orders arrive by telegram, steps are done in order inside their windows, twists fire, a debrief follows.

import { T } from '../data/time.js';
import { all } from './storylet.js';
import { context, has, note, log, opControl } from './game.js';
import { apply as applyEffects } from './storylet.js';

const cities = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
export const stepCities = (s) => cities(s.city ?? s.to);
export const currentStep = (G, id) => { const o = G.I.op.get(id), st = G.S.ops[id]; return o.steps.find((s) => !st.done[s.id]) ?? null; };
export const activeOps = (G) => G.D.ops.filter((o) => G.S.ops[o.id].status === 'active');

export function checkOps(G) {
  const { S, D } = G;
  G.finishOp ??= finishOp;
  G.afterStep ??= afterStep;
  for (const o of D.ops) {
    const st = S.ops[o.id];
    if (st.status === 'pending' && !o.side && o.issue && T(o.issue) <= S.t) opControl(G, o.id, 'start');
    if (st.status !== 'active') continue;
    const step = currentStep(G, o.id);
    if (!step) { finishOp(G, o.id, true); continue; }
    if (step.by && S.t > T(step.by)) { finishOp(G, o.id, false); continue; }
    const here = S.city && (stepCities(step).includes(S.city) || step.city === '*');
    const early = step.after && S.t < T(step.after);
    const dt = st.last ? S.t - st.last : 0;
    st.last = S.t;
    if (here && early && !st.early?.[step.id]) { (st.early ??= {})[step.id] = true; note(G, 'Too early', `${o.title}: nothing can be done here before ${whenText(step.after)}. Waiting in one place is how agents are noticed.`); }
    if (step.story && here && !st.shown?.[step.id] && !S.queue.length && !early) { (st.shown ??= {})[step.id] = true; S.queue.push({ type: 'story', id: step.story, op: o.id, n: ++S.cardN }); }
    if (!here || early) continue;
    if (step.kind === 'goto') done(G, o.id, step.id);
    if (step.kind === 'carry' && has(G, step.item)) { done(G, o.id, step.id); const it = G.I.item.get(step.item); if (it && ['doc', 'companion'].includes(it.fn)) applyEffects([['item', `-${step.item}`]], context(G, { op: o.id })); }
    if (step.kind === 'wait') { st.waitMin += dt; if (st.waitMin >= step.min) done(G, o.id, step.id); }
    if (step.kind === 'observe') { st.obsMin += dt; if (st.obsMin >= (step.min ?? 60)) done(G, o.id, step.id); }
    // twists
    o.twists.forEach((tw, i) => {
      if (st.twists[i] || S.queue.length) return;
      if (all(tw.if, context(G, { op: o.id }))) { st.twists[i] = S.t; S.queue.push({ type: 'story', id: tw.story, op: o.id, n: ++S.cardN }); }
    });
  }
}
const whenText = (s) => { const [md, hm] = s.split(' '); const [m, d] = md.split('-'); return `${Number(d)} ${m === '06' ? 'June' : m === '07' ? 'July' : 'August'}, ${hm}`; };

function done(G, id, step) { opControl(G, id, `step:${step}`); }

export function afterStep(G, id, stepId) {
  const { S, I } = G;
  const o = I.op.get(id), step = o.steps.find((s) => s.id === stepId);
  if (step?.gives) applyEffects([['item', `+${step.gives}`]], context(G, { op: id }));
  log(G, `${o.title}: ${step?.label ?? stepId} done.`);
  if (o.steps.every((s) => S.ops[id].done[s.id])) finishOp(G, id, true);
}

export function finishOp(G, id, won) {
  const { S, I } = G;
  const st = S.ops[id], o = I.op.get(id);
  if (st.status !== 'active') return;
  st.status = won ? 'won' : 'failed';
  st.ended = S.t;
  S.flags[`${id}-${won ? 'won' : 'failed'}`] = true;
  applyEffects(won ? o.win : o.fail, context(G, { op: id }));
  // the debrief reveals what intel about this operation was true
  for (const e of S.intel) if (e.resolved === null && (e.subj === `op:${id}` || (e.op === id))) resolve(G, e);
  S.queue.push({ type: 'debrief', op: id, won, n: ++S.cardN });
  log(G, `${o.title}: ${won ? 'accomplished' : 'failed'}.`);
  if (id === 'op-lastboat') G.endGame?.(G, won ? 'home' : 'stranded');
}

/** Mark an intel entry resolved and keep the source's track record. */
export function resolve(G, e) {
  const { S } = G;
  if (e.resolved !== null) return;
  e.resolved = e.truth;
  const s = (S.sources[e.src] ??= { right: 0, wrong: 0 });
  if (e.truth) s.right++; else s.wrong++;
}
