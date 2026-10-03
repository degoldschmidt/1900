/**
 * endings (RULES.md 5.11; H07-5): delivered, partial, captured, ruined and stranded, plus the
 * questionnaire the autopsy asks. After an ending only `endSession` is accepted and every handler
 * stands still (game.ts).
 */
import type { C07State, Ending } from './types.ts';
import { dv } from './data.ts';
import { type C, interrupt } from './diary.ts';

export const PRIO_END = 99;

export function endGame(s: C07State, ctx: C, kind: Ending['kind'], cause: Ending['cause']): void {
  if (s.ending) return;
  s.ending = { kind, at: ctx.now, cause: { event: cause.event, recs: [...cause.recs].sort((a, b) => a - b), cordon: cause.cordon } };
  interrupt(s, ctx, 'ending', { kind });
  ctx.trace('ending', { kind, cause: s.ending.cause });
}

const chainOffers = (s: C07State) => s.commissions.offers.filter((o) => o.kind === 'chain');

/** Arrears older than DV-C07-052 count against the ending. */
function inArrears(s: C07State, ctx: C): boolean {
  const r = s.ledger.rent;
  return !!r && r.arrearsSince !== null && ctx.now - r.arrearsSince > dv<number>(ctx.bundle, 'DV-C07-052');
}

/** Called after a stage completes or fails, and after a bill is met. */
export function checkEndings(s: C07State, ctx: C): void {
  if (s.ending) return;
  const chain = chainOffers(s);
  if (chain.length === 0) return;
  const done = chain.every((o) => o.status === 'done');
  const billOk = s.endRule !== 'commissionAndBill' || (s.ledger.bill?.met ?? true);
  if (done && billOk) {
    if (inArrears(s, ctx)) endGame(s, ctx, 'partial', { event: 'arrears', recs: [], cordon: null });
    else endGame(s, ctx, 'delivered', { event: 'delivered', recs: [], cordon: null });
  }
}

export function onScenarioEnd(s: C07State, _p: unknown, ctx: C): void {
  if (s.ending) return;
  checkEndings(s, ctx);
  if (s.ending) return;
  const undone = chainOffers(s).flatMap((o) => o.stages.filter((st) => st.done === null).map((st) => st.city));
  const last = [...s.stats.ghosts.map((g) => ({ at: g.at, toCity: g.toCity })), ...s.stats.misses.map((m) => ({ at: m.at, toCity: m.toCity }))]
    .sort((a, b) => a.at - b.at).at(-1);
  if (undone.length && last && undone.includes(last.toCity)) endGame(s, ctx, 'stranded', { event: 'stranded', recs: [], cordon: null });
  else endGame(s, ctx, 'partial', { event: 'scenarioEnd', recs: [], cordon: null });
}

/** Which questionnaire questions apply (RULES 5.11). */
export function questionsFor(s: Pick<C07State, 'stats' | 'ending'>): Array<{ id: string; kind: 'choice' | 'likert' | 'record' | 'text'; prompt: string; options?: string[] }> {
  const q: Array<{ id: string; kind: 'choice' | 'likert' | 'record' | 'text'; prompt: string; options?: string[] }> = [];
  if (s.stats.misses.length) q.push({ id: 'q1', kind: 'choice', prompt: 'Your missed connection was mostly down to…', options: ['plan', 'luck', 'unfair'] });
  if (s.stats.ghosts.length) q.push({ id: 'q2', kind: 'likert', prompt: 'The train that was not there felt fair (1 = not at all, 5 = entirely).' });
  if (s.stats.detections.length) q.push({ id: 'q3', kind: 'record', prompt: 'Which of your own records do you think gave you away?' });
  q.push({ id: 'q4', kind: 'likert', prompt: 'Where the police watched for you, it was clear why (1 = not at all, 5 = entirely).' });
  q.push({ id: 'q5', kind: 'text', prompt: 'Anything else?' });
  return q;
}
