/**
 * C07 state (RULES.md section 2). Plain JSON: no Maps, no closures, no undefined values. Ids are
 * bundle strings; money is kit Money in integer minor units; times are Instants.
 */
import type { Money } from '#kit/money/money.ts';
import type { KnownGraph, GhostStatus, KnowledgeSource } from '#kit/timetable/knowledge.ts';
import type { Belief } from '#kit/hunter/belief.ts';
import type { Instant } from '#kit/time/instant.ts';

export type Venue = 'station' | 'bank' | 'post' | 'telegraph' | 'hotel' | 'meeting' | 'street' | 'train';
export type Cls = 1 | 2 | 3;
export type Tier = 'modest' | 'middle' | 'first';

export interface PlannedLeg { tripId: string; trainKey: string; day: number; from: string; to: string; dep: Instant; arr: Instant }

export interface Booking {
  id: number;
  legs: PlannedLeg[];
  cls: Cls;
  sleeper: boolean;
  madeAt: Instant;
  /** Smallest scheduled slack at a change (after minimum change); 0 for a single leg. */
  minSlackSec: number;
  /** Miss odds (‰) the planner showed for the whole itinerary. */
  missOdds: number;
  /** Queue seq of the pending AtStation event, or null (aboard, or already at the station). */
  atStationSeq: number | null;
  /** Index of the next leg to board. */
  next: number;
}

export interface Ride {
  booking: number; leg: number; tripId: string; trainKey: string; day: number; from: string; to: string;
  cls: Cls; sleeper: boolean;
  /** Hidden: the train's delay at `to`, revealed only on arrival or at a hall. */
  delaySec: number;
  /** The delay the player has seen so far. */
  shownDelay: number;
  arriveSeq: number;
  boardedAt: Instant;
  /** Scheduled arrival at `to` (for the sealed-leg budget). */
  schedArr: Instant;
  /** Remaining frontier-hall dwell before `to`, seconds. */
  hallDwell: number;
  /** Pending FrontierHall events (absolute stop index, queue seq). */
  halls: Array<{ stop: number; seq: number }>;
}

export type Where =
  | { k: 'city'; city: string; venue: Venue; station: string | null }
  | { k: 'aboard'; ride: Ride };

export interface Slot {
  id: number; verb: string; args: VerbArgs; venue: Venue; notBefore: Instant | null;
  start: Instant; end: Instant; seq: number; state: 'planned' | 'running' | 'done' | 'failed';
  /** Travel to the venue before `start` (seconds), set by the last re-flow. */
  travel: number;
  /** City (or 'aboard') the slot was planned in. */
  city: string;
}

export type VerbArgs = Record<string, unknown>;

export interface Interrupt { at: Instant; kind: InterruptKind; ref: unknown }
export type InterruptKind = 'arrival' | 'ghost' | 'missed' | 'verbFailed' | 'news' | 'offer' | 'lapsed' | 'cable' | 'remittance'
  | 'noticed' | 'refused' | 'suspended' | 'papers' | 'cannotPay' | 'collapse' | 'ending';

export interface Stage { city: string; open: Instant; close: Instant; done: Instant | null }
export interface Offer {
  id: string; kind: 'chain' | 'errand' | 'away'; pay: Money; revealed: boolean; rival: boolean | null;
  status: 'open' | 'held' | 'done' | 'lapsed' | 'failed';
  stages: Stage[];
  /** City whose post office holds the letter (null for setup offers). */
  post: string | null;
  arrivedAt: Instant;
}

export interface Cordon {
  id: number; city: string; from: Instant; to: Instant; via: 'local' | 'train';
  base: string | null; trainKey: string | null; cause: number[]; sighted: boolean;
}

export interface HuntState {
  service: string; subject: string; kg: KnownGraph; belief: Belief | null; file: number[];
  lastFix: { rec: number; t: Instant; city: string; cause: number[] } | null;
  tickSeq: number | null;
  cordons: Cordon[];
  nextCordon: number;
  /** When each filed record arrived (for the autopsy). */
  delivered: Array<{ rec: number; at: Instant }>;
  /** Every fix, in order (for the autopsy). */
  fixes: Array<{ rec: number; t: Instant; city: string; at: Instant }>;
}

export interface Stats {
  stays: Array<{ city: string; from: Instant; to: Instant; verbs: number; waitSec: number }>;
  bookings: Array<{ id: number; at: Instant; legs: number; minSlackSec: number; oddsShown: number; verified: boolean }>;
  misses: Array<{ booking: number; at: Instant; station: string; slackSec: number; delaySec: number; oddsShown: number; toCity: string }>;
  ghosts: Array<{ at: Instant; trainKey: string; edition: string; status: GhostStatus; toCity: string }>;
  sessions: Array<{ at: Instant; aboard: boolean; night: boolean }>;
  detections: Array<{ at: Instant; cordon: number; noticed: boolean }>;
}

export interface Ending {
  kind: 'delivered' | 'partial' | 'captured' | 'ruined' | 'stranded';
  at: Instant;
  cause: { event: string; recs: number[]; cordon: number | null };
}

export interface Ticket { fromCity: string; toCities: string[]; cls: Cls; until: Instant }

export interface LearnedDelay { trainKey: string; day: number; station: string; delaySec: number; at: Instant }

export interface C07State {
  scenario: string;
  /** Last instant of the scenario (no event is scheduled beyond it). */
  endsAt: Instant;
  /** S1 analogue: delivered when the chain is done; S2: the commission and the bill. */
  endRule: 'chain' | 'commissionAndBill';
  legend: { id: string; nationality: string; home: string; papers: { passport: boolean; visas: string[] } };
  me: {
    where: Where;
    health: number;
    busyUntil: Instant;
    lodged: { city: string; tier: Tier; since: Instant; slip: number | null } | null;
    /** City of the previous stay (the slip's fromCity). */
    cameFrom: string | null;
  };
  diary: {
    booking: Booking | null; slots: Slot[]; nextId: number; nextBooking: number; interrupts: Interrupt[];
    stayFrom: Instant; inStay: boolean; verifiedInStay: boolean; tickets: Ticket[];
  };
  knowledge: {
    kg: KnownGraph;
    shelf: Array<{ edition: string; at: Instant; city: string }>;
    drafts: number;
    delays: LearnedDelay[];
  };
  ledger: {
    cash: Money[]; credit: Money; correspondents: string[]; unpaid: Money[];
    rent: { amount: Money; nextDue: Instant; everySec: number; arrearsSince: Instant | null } | null;
    bill: { amount: Money; bank: string; maturity: Instant; met: boolean; protested: boolean } | null;
    remitted: Money;
    entries: Array<{ at: Instant; what: string; amount: Money }>;
  };
  commissions: { offers: Offer[] };
  world: { fired: string[]; news: Array<{ id: string; city: string; at: Instant }>; queued: Array<{ id: string; city: string }>; seenUntil: Instant };
  hunt: HuntState;
  stats: Stats;
  passages: number;
  ending: Ending | null;
}

export type { Money, Instant, GhostStatus, KnowledgeSource };
