/**
 * The one append-only record store of a simulation. There is no update or delete. Indices are
 * derived from the array and rebuilt on load. Subscriptions (readers that receive eager
 * delivery events) are part of the store's serialised state.
 */
import type { RecordTuple, NewRecord } from './tuple.ts';
import type { Instant } from '../time/instant.ts';

export interface SubscriptionFilter {
  kinds?: string[];
  subjects?: string[];
  sources?: string[];
}

export interface Subscription {
  reader: string;
  filter: SubscriptionFilter;
  from: Instant;
  /** Record ids whose delivery to this reader has been scheduled. */
  scheduled: number[];
}

export interface StoreJSON {
  records: RecordTuple[];
  subscriptions: Subscription[];
}

export function matches(f: SubscriptionFilter, r: RecordTuple): boolean {
  return (!f.kinds || f.kinds.includes(r.kind)) &&
    (!f.subjects || f.subjects.includes(r.subject)) &&
    (!f.sources || f.sources.includes(r.source));
}

function validate(r: NewRecord): void {
  if (!Number.isSafeInteger(r.time)) throw new Error('Record time must be an integer Instant');
  if (!Number.isInteger(r.confidence) || r.confidence < 0 || r.confidence > 1000) throw new Error('Record confidence must be an integer 0–1000');
  if (!r.kind || !r.subject || !r.source) throw new Error('Records need kind, subject and source');
}

export class RecordStore {
  private readonly list: RecordTuple[] = [];
  private readonly idx = { subject: new Map<string, number[]>(), source: new Map<string, number[]>(), kind: new Map<string, number[]>(), sig: new Map<string, number[]>() };
  readonly subscriptions: Subscription[] = [];

  append(r: NewRecord): RecordTuple {
    validate(r);
    const rec: RecordTuple = { ...r, id: this.list.length + 1 };
    if (r.sigs) rec.sigs = [...r.sigs];
    if (__DEBUG__) Object.freeze(rec);
    this.list.push(rec);
    this.index(rec);
    return rec;
  }

  get size(): number { return this.list.length; }
  get(id: number): RecordTuple | undefined { return this.list[id - 1]; }
  all(): readonly RecordTuple[] { return this.list; }

  bySubject(s: string): RecordTuple[] { return this.lookup(this.idx.subject, s); }
  bySource(s: string): RecordTuple[] { return this.lookup(this.idx.source, s); }
  byKind(k: string): RecordTuple[] { return this.lookup(this.idx.kind, k); }
  bySig(sig: string): RecordTuple[] { return this.lookup(this.idx.sig, sig); }

  subscribe(reader: string, filter: SubscriptionFilter, from: Instant): Subscription {
    if (this.subscriptions.some((s) => s.reader === reader)) throw new Error(`${reader} is already subscribed`);
    const sub: Subscription = { reader, filter, from, scheduled: [] };
    this.subscriptions.push(sub);
    return sub;
  }

  subscription(reader: string): Subscription | undefined {
    return this.subscriptions.find((s) => s.reader === reader);
  }

  toJSON(): StoreJSON {
    return {
      records: this.list.map((r) => ({ ...r })),
      subscriptions: this.subscriptions.map((s) => ({ ...s, filter: { ...s.filter }, scheduled: [...s.scheduled].sort((a, b) => a - b) })),
    };
  }

  static fromJSON(j: StoreJSON): RecordStore {
    const st = new RecordStore();
    j.records.forEach((r, i) => {
      if (r.id !== i + 1) throw new Error(`Record ids must be consecutive (found ${r.id} at ${i + 1})`);
      const rec = { ...r };
      if (__DEBUG__) Object.freeze(rec);
      st.list.push(rec);
      st.index(rec);
    });
    for (const s of j.subscriptions) st.subscriptions.push({ ...s, filter: { ...s.filter }, scheduled: [...s.scheduled] });
    return st;
  }

  private index(r: RecordTuple): void {
    const put = (m: Map<string, number[]>, k: string) => (m.get(k) ?? m.set(k, []).get(k)!).push(r.id);
    put(this.idx.subject, r.subject);
    put(this.idx.source, r.source);
    put(this.idx.kind, r.kind);
    for (const s of r.sigs ?? []) put(this.idx.sig, s);
  }

  private lookup(m: Map<string, number[]>, k: string): RecordTuple[] {
    return (m.get(k) ?? []).map((id) => this.list[id - 1]!);
  }
}
