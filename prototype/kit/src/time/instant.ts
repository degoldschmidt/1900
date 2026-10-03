/**
 * An Instant is an integer number of seconds since 1900-01-01 00:00:00 GMT. Int32 holds it until
 * 1968, beyond this project's period, but plain numbers are used throughout.
 */
import type { DayNumber } from './calendar.ts';

export type Instant = number;

export const SECONDS_PER_DAY = 86_400;
export const SECONDS_PER_HOUR = 3_600;
/** Sentinel for "never" (e.g. a reader that can never read a record). */
export const NEVER: Instant = Number.MAX_SAFE_INTEGER;

export const instantOf = (day: DayNumber, secOfDay: number): Instant => day * SECONDS_PER_DAY + secOfDay;
export const dayOf = (i: Instant): DayNumber => Math.floor(i / SECONDS_PER_DAY);
export const secOfDay = (i: Instant): number => i - dayOf(i) * SECONDS_PER_DAY;
/** Absolute hour bucket (not hour-of-day), used to key routing profiles. */
export const hourBucket = (i: Instant): number => Math.floor(i / SECONDS_PER_HOUR);
export const hm = (h: number, m: number, s = 0): number => h * 3600 + m * 60 + s;
