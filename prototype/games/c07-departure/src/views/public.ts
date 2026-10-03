/**
 * What the player may see of the state (RULES.md 2): everything except the hunt, with the train's
 * hidden delay masked by the delay shown so far. Every view but the autopsy works from this.
 */
import type { C07State, Ride, HuntState, Where } from '../rules/types.ts';
import type { C07Bundle, Rows } from '../rules/data.ts';
import type { RecordTuple } from '#kit/records/tuple.ts';
import type { Instant } from '#kit/time/instant.ts';

export type PublicRide = Omit<Ride, 'delaySec'>;
export type CityWhere = Extract<Where, { k: 'city' }>;
export type PublicState = Omit<C07State, 'hunt' | 'me'> & {
  me: Omit<C07State['me'], 'where'> & { where: CityWhere | { k: 'aboard'; ride: PublicRide } };
};

/** A copy of the player's own records (kit `ownTrail`), with no handle on the store. */
export interface OwnTrail { readonly records: readonly RecordTuple[] }

/** Static and public inputs of every view (RULES 9: timetable, public rows, citations, own trail, design values). */
export interface ViewData {
  b: C07Bundle;
  /** The public parameter rows only (`params.publicView()`). */
  params: Rows;
  trail: OwnTrail;
  now: Instant;
}

export function publicState(s: C07State): PublicState {
  const { hunt: _hidden, ...rest } = s;
  void _hidden;
  const copy = JSON.parse(JSON.stringify(rest)) as PublicState & { me: { where: { ride?: Ride } } };
  if (copy.me.where.k === 'aboard') {
    const r = copy.me.where.ride as Partial<Ride>;
    delete r.delaySec;
  }
  return copy as PublicState;
}

const HIDDEN = new Proxy({}, { get(_t, key) { if (key === 'toJSON') return undefined; throw new Error(`A view read the hidden hunt state (${String(key)})`); } }) as HuntState;

/**
 * The public state shaped as rules state, for calling the shared rule functions (flow, costs,
 * validation). Its hunt throws on any read, and the ride's delay reads as the shown delay, so a
 * view can never compute from hidden state.
 */
export function asRules(p: PublicState): C07State {
  const where = p.me.where.k === 'aboard' ? { k: 'aboard' as const, ride: { ...p.me.where.ride, delaySec: p.me.where.ride.shownDelay } } : p.me.where;
  return { ...p, me: { ...p.me, where }, hunt: HIDDEN } as C07State;
}
