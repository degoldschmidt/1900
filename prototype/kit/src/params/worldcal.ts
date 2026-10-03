/**
 * Tier-0 world calendar: events happen on their dates whatever the player does. Each becomes a
 * queue event of type "kit.World" at its time; an event known only to the day fires at local
 * midnight of its zone (or 00:00 GMT when no zone is given).
 */
import type { WorldEventRow } from './types.ts';
import type { Instant } from '../time/instant.ts';
import { instantOf } from '../time/instant.ts';

export const WORLD_EVENT = 'kit.World';
export const PRIO_WORLD = 0;

export function worldEventInstant(ev: WorldEventRow, zoneOffsetSec: (zone: string, day: number) => number): Instant {
  const offset = ev.zone ? zoneOffsetSec(ev.zone, ev.day) : 0;
  return instantOf(ev.day, ev.timeLocal ?? 0) - offset;
}

/** Events within [fromDay, toDay], sorted by time then id. */
export function calendarWindow(events: readonly WorldEventRow[], fromDay: number, toDay: number): WorldEventRow[] {
  return events
    .filter((e) => e.day >= fromDay && e.day <= toDay)
    .sort((a, b) => a.day - b.day || (a.timeLocal ?? 0) - (b.timeLocal ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
