/**
 * The commands the player can issue now, each with its legality (the rules' own validation, on
 * public rows) and a preview: duration, when it would run, the cost vector (money, health) and the
 * records it would write with their readers. The UI never computes rules. Bookings come from
 * `plannerView`, whose options carry their own `book` commands and previews.
 */
import { dayOf } from '#kit/time/instant.ts';
import { dv, cityOfStation } from '../rules/data.ts';
import { computeFlow } from '../rules/diary.ts';
import { costOf, traceScore } from '../rules/costs.ts';
import { TIERS, guidePrice, type VerbName } from '../rules/verbs.ts';
import type { VerbArgs } from '../rules/types.ts';
import { stopOf } from '../rules/travel.ts';
import { checkCommand, draftSlot, type C07Command } from '../commands.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { clock, money, verbLabel, recordLabel, instName, stationName, offerName, type Clock } from './format.ts';

export interface RecordPreview { kind: string; label: string; named: boolean; confidence: number; readers: Array<{ reader: string; name: string; minSec: number; maxSec: number }> }
export interface ActionPreview { durationSec: number; start: Clock | null; end: Clock | null; cost: string[]; health: number; records: RecordPreview[]; traceScore: number }
export interface ActionView { id: string; label: string; cmd: C07Command; legal: boolean; error: string | null; preview: ActionPreview | null }

const NO_PREVIEW = null;

function verbCandidates(p: PublicState, d: ViewData): Array<{ label: string; verb: VerbName; args: VerbArgs }> {
  const b = d.b; const out: Array<{ label: string; verb: VerbName; args: VerbArgs }> = [];
  if (p.me.where.k === 'aboard') {
    out.push({ label: 'Rest for an hour', verb: 'rest', args: { sec: 3600 } }, { label: 'Rest for three hours', verb: 'rest', args: { sec: 10800 } });
    out.push({ label: 'Draft a telegram asking for funds', verb: 'cable', args: { mode: 'draft', purpose: 'funds', words: 12 } });
    return out;
  }
  const city = p.me.where.city;
  const gbp = (n: number): number => Math.min(n, p.ledger.credit.minor);
  for (const amount of [...new Set([gbp(2400), gbp(4800), gbp(9600)])].filter((x) => x > 0)) out.push({ label: `Draw ${money(b, { cur: p.ledger.credit.cur, minor: amount })}`, verb: 'drawCredit', args: { amount } });
  if (p.ledger.bill && !p.ledger.bill.met) out.push({ label: `Meet the bill (${money(b, p.ledger.bill.amount)})`, verb: 'drawCredit', args: { amount: 0, meetBill: true } });
  out.push({ label: 'Collect poste restante', verb: 'posteRestante', args: {} });
  for (const o of p.commissions.offers.filter((x) => x.status === 'held')) {
    const i = o.stages.findIndex((st) => st.done === null);
    if (i >= 0 && o.stages[i]!.city === city) out.push({ label: `Meeting for ${offerName(o.kind)} (stage ${i + 1} of ${o.stages.length})`, verb: 'meet', args: { offer: o.id, stage: i } });
  }
  const bk = p.diary.booking;
  if (bk && bk.next < bk.legs.length) {
    const leg = bk.legs[bk.next]!;
    out.push({ label: `Telegraph the railway: does the ${b.tt.trips[b.tt.trip(leg.tripId)]!.trainNo} run?`, verb: 'cable', args: { mode: 'send', purpose: 'enquire', trainKey: leg.trainKey, day: leg.day, words: 12 } });
    const keys = [...new Set(bk.legs.slice(bk.next).filter((l) => cityOfStation(b, l.from) === city).map((l) => l.trainKey))].slice(0, 3);
    if (keys.length) out.push({ label: 'Ask a porter about your trains', verb: 'askPorter', args: { trainKeys: keys } });
  }
  out.push({ label: 'Telegraph home for funds', verb: 'cable', args: { mode: 'send', purpose: 'funds', words: 12 } });
  if (p.ledger.bill && !p.ledger.bill.met) out.push({ label: 'Telegraph home to meet the bill', verb: 'cable', args: { mode: 'send', purpose: 'remit', words: 14 } });
  out.push({ label: 'Draft a telegram (to send later)', verb: 'cable', args: { mode: 'draft', purpose: 'funds', words: 12 } });
  for (const ed of b.raw.editions) {
    if (p.knowledge.kg.editions.includes(ed.id) || !guidePrice({ b, params: d.params, now: d.now }, ed.id, city)) continue;
    if (dayOf(d.now) < ed.issueDay + dv<number>(b, 'DV-C07-013')) continue;
    out.push({ label: `Buy “${ed.label}”`, verb: 'buyGuide', args: { edition: ed.id } });
  }
  out.push({ label: 'Read the departure board', verb: 'checkBoard', args: {} });
  for (const tier of TIERS) out.push({ label: `Take a ${tier} room`, verb: 'lodge', args: { tier } });
  out.push({ label: 'Wait half an hour', verb: 'wait', args: { sec: 1800 } }, { label: 'Wait an hour', verb: 'wait', args: { sec: 3600 } });
  out.push({ label: 'Rest for an hour', verb: 'rest', args: { sec: 3600 } }, { label: 'Rest for three hours', verb: 'rest', args: { sec: 10800 } });
  return out;
}

export function actionsView(p: PublicState, d: ViewData): ActionView[] {
  const b = d.b; const s = asRules(p);
  const e = { b, params: d.params, now: d.now };
  const city = p.me.where.k === 'city' ? p.me.where.city : cityOfStation(b, p.me.where.ride.to);
  const check = (cmd: C07Command): string | null => checkCommand(s, b, d.params, d.params, d.now, null, cmd);
  const out: ActionView[] = [];
  if (!p.ending) {
    verbCandidates(p, d).forEach((c, i) => {
      const cmd: C07Command = { type: 'planVerb', verb: c.verb, args: c.args };
      const error = check(cmd);
      const slot = draftSlot(s, { verb: c.verb, args: c.args }, d.now);
      const f = computeFlow(s, e, [...p.diary.slots, slot]).slots.find((x) => x.id === slot.id);
      const cost = costOf({ type: 'planVerb', verb: c.verb, args: c.args }, s, e);
      out.push({
        id: `verb-${i}`, label: c.label || verbLabel(c.verb), cmd, legal: error === null, error,
        preview: {
          durationSec: cost.sec, start: f ? clock(b, city, f.start) : null, end: f ? clock(b, city, f.end) : null,
          cost: cost.money.map((m) => money(b, m)), health: cost.health,
          records: cost.trace.map((t) => ({ kind: t.kind, label: recordLabel(t.kind), named: t.named, confidence: t.confidence, readers: t.reach.map((r) => ({ ...r, name: instName(b, r.reader) })) })),
          traceScore: traceScore(cost.trace),
        },
      });
    });
    for (const x of p.diary.slots.filter((y) => y.state === 'planned')) {
      const cmd: C07Command = { type: 'unplanVerb', slotId: x.id };
      out.push({ id: `unplan-${x.id}`, label: `Drop: ${verbLabel(x.verb)}`, cmd, legal: check(cmd) === null, error: check(cmd), preview: NO_PREVIEW });
    }
    if (p.diary.booking) {
      const cmd: C07Command = { type: 'cancelBooking' };
      out.push({ id: 'cancel', label: 'Cancel the booking', cmd, legal: check(cmd) === null, error: check(cmd), preview: NO_PREVIEW });
    }
    for (const o of p.commissions.offers.filter((x) => x.status === 'open' && x.revealed)) {
      const cmd: C07Command = { type: 'acceptOffer', offerId: o.id };
      out.push({ id: `accept-${o.id}`, label: `Accept ${offerName(o.kind)} (${money(b, o.pay)})`, cmd, legal: check(cmd) === null, error: check(cmd), preview: NO_PREVIEW });
    }
    if (p.me.where.k === 'aboard') {
      const r = p.me.where.ride; const trip = b.tt.trip(r.tripId); const t = b.tt.trips[trip]!;
      const a = stopOf(b, trip, r.from)!; const z = stopOf(b, trip, r.to, a)!;
      for (let j = a + 1; j < z; j++) {
        const st = b.tt.stationIds[b.tt.stopStation[j]!]!;
        const cmd: C07Command = { type: 'alight', station: st };
        const err = check(cmd);
        out.push({ id: `alight-${st}`, label: `Get off at ${stationName(b, st)}`, cmd, legal: err === null, error: err, preview: NO_PREVIEW });
      }
      void t;
    }
  }
  out.push({ id: 'endSession', label: 'End this session', cmd: { type: 'endSession' }, legal: true, error: null, preview: NO_PREVIEW });
  return out;
}
