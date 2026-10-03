/**
 * C07 player commands (RULES.md section 3). No command costs anything when issued; costs fall at
 * Board, VerbStart and VerbEnd. Any command may carry `ui` (written by the UI, ignored here, read by
 * the metrics from the log). After an ending only `endSession` is accepted.
 */
import type { Instant } from '#kit/time/instant.ts';
import type { C07State, Cls, Slot, VerbArgs } from './rules/types.ts';
import type { C } from './rules/diary.ts';
import { computeFlow, reflow } from './rules/diary.ts';
import { type Env, type VerbName, isVerb, checkArgs, venueOf, cityNow } from './rules/verbs.ts';
import { checkBook, applyBook, cancelBooking, checkAlight, applyAlight, alightPassed, coversTwoAm, publicOf, type BookCmd } from './rules/travel.ts';
import { checkAccept, applyAccept } from './rules/commissions.ts';
import type { C07Bundle, Rows } from './rules/data.ts';

export interface UiStamp { sinceArrivalMs?: number; source?: 'default' | 'planner' | 'board' }

export type C07Command = (
  | BookCmd
  | { type: 'cancelBooking' }
  | { type: 'planVerb'; verb: VerbName; args: VerbArgs; notBefore?: Instant }
  | { type: 'unplanVerb'; slotId: number }
  | { type: 'acceptOffer'; offerId: string }
  | { type: 'alight'; station: string }
  | { type: 'endSession' }
) & { ui?: UiStamp };

export const COMMAND_TYPES = ['book', 'cancelBooking', 'planVerb', 'unplanVerb', 'acceptOffer', 'alight', 'endSession'] as const;

/** The slot a planVerb would add (venue and times are set by the flow). */
export function draftSlot(s: C07State, cmd: { verb: VerbName; args: VerbArgs; notBefore?: Instant }, now: Instant): Slot {
  return {
    id: s.diary.nextId + 1, verb: cmd.verb, args: JSON.parse(JSON.stringify(cmd.args ?? {})) as VerbArgs, venue: 'street',
    notBefore: cmd.notBefore ?? null, start: now, end: now, seq: -1, state: 'planned', travel: 0, city: cityNow(s) ?? 'aboard',
  };
}

/** Validation with explicit rows (the views call it with the public rows; the game with the full layer). */
export function checkCommand(s: C07State, b: C07Bundle, params: Rows, pub: Rows, now: Instant, seed: number | null, cmd: C07Command): string | null {
  if (!cmd || typeof cmd !== 'object' || !(COMMAND_TYPES as readonly string[]).includes((cmd as { type: string }).type)) return 'Unknown command';
  if (s.ending && cmd.type !== 'endSession') return 'The game has ended';
  const e: Env = { b, params, now };
  switch (cmd.type) {
    case 'book': return checkBook(s, e, pub, cmd).error;
    case 'cancelBooking': {
      const bk = s.diary.booking;
      if (!bk) return 'No booking';
      if (bk.next > 0 || s.me.where.k === 'aboard' && s.me.where.ride.booking === bk.id) return 'Already travelling on it';
      return null;
    }
    case 'planVerb': {
      if (!isVerb(cmd.verb)) return 'Unknown act';
      if (cmd.notBefore !== undefined && !Number.isSafeInteger(cmd.notBefore)) return 'Bad time';
      const aboard = s.me.where.k === 'aboard';
      if (aboard && !(cmd.verb === 'rest' || (cmd.verb === 'cable' && cmd.args?.mode === 'draft'))) return 'Aboard you can only rest or draft a cable';
      const args = (cmd.args ?? {}) as VerbArgs;
      const err = checkArgs(cmd.verb, args, s, e, cityNow(s));
      if (err) return err;
      const at = s.me.where.k === 'city' ? s.me.where.venue : 'train';
      if (venueOf(cmd.verb, args, s, e, at) === null) return 'There is no such place here';
      const slot = draftSlot(s, cmd, now);
      const f = computeFlow(s, e, [...s.diary.slots, slot]).slots.find((x) => x.id === slot.id);
      if (!f || !f.ok) return f?.reason ?? 'It does not fit';
      return null;
    }
    case 'unplanVerb': return s.diary.slots.some((x) => x.id === cmd.slotId && x.state === 'planned') ? null : 'No such planned act';
    case 'acceptOffer': return checkAccept(s, b, now, cmd.offerId);
    case 'alight': {
      const err = checkAlight(s, b, cmd.station);
      if (err) return err;
      return alightPassed(s, b, params, seed, now, cmd.station) ? 'That stop is already behind the train' : null;
    }
    case 'endSession': return null;
  }
}

export function validate(s: C07State, cmd: C07Command, ctx: C): string | null {
  return checkCommand(s, ctx.bundle, ctx.params, publicOf(ctx.params), ctx.now, ctx.seed, cmd);
}

export function apply(s: C07State, cmd: C07Command, ctx: C): void {
  switch (cmd.type) {
    case 'book': applyBook(s, ctx, cmd); return;
    case 'cancelBooking': cancelBooking(s, ctx); return;
    case 'planVerb': {
      const slot = draftSlot(s, cmd, ctx.now);
      s.diary.nextId = slot.id;
      s.diary.slots.push(slot);
      reflow(s, ctx);
      return;
    }
    case 'unplanVerb': {
      const slot = s.diary.slots.find((x) => x.id === cmd.slotId)!;
      if (slot.seq >= 0) ctx.cancel(slot.seq);
      s.diary.slots = s.diary.slots.filter((x) => x.id !== cmd.slotId);
      reflow(s, ctx);
      return;
    }
    case 'acceptOffer': applyAccept(s, ctx, cmd.offerId); return;
    case 'alight': applyAlight(s, ctx, cmd.station); return;
    case 'endSession': {
      const aboard = s.me.where.k === 'aboard';
      s.stats.sessions.push({ at: ctx.now, aboard, night: s.me.where.k === 'aboard' && coversTwoAm(ctx.bundle, s.me.where.ride) });
      return;
    }
  }
}

export type { Cls };
