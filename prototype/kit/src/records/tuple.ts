/**
 * One record (C17): world records (a hotel slip, a cable copy) and asserted claims (a report
 * token, a forged field) are the same tuple type, differing only in authorship. The tuple stores
 * its source institution, never a list of readers; readers are derived at query time.
 */
import type { Instant } from '../time/instant.ts';

export type Authorship = 'world' | 'claim';

export interface RecordTuple {
  /** Assigned by the store: 1, 2, 3, … in append order. */
  id: number;
  /** What sort of record this is, e.g. "registration.slip", "cable.copy", "report.claim". */
  kind: string;
  /** Whom or what it is about, e.g. a legend id. */
  subject: string;
  predicate: string;
  value: unknown;
  /** 0–1000. */
  confidence: number;
  /** The institution whose ledger holds it first. */
  source: string;
  time: Instant;
  authorship: Authorship;
  /** For claims: who asserted it (e.g. the legend that signed the report). */
  author?: string;
  /** Station or city id where it was written. */
  place?: string;
  /** Signatures that can link records: "kw:<keyword>", "mark:<docId>", "hand:<id>", "obj:<id>". */
  sigs?: string[];
}

export type NewRecord = Omit<RecordTuple, 'id'>;
