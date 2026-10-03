/**
 * The one scheduler of a simulation: a binary heap of events ordered by (at, prio, seq). `seq` is
 * the insertion counter, so ties resolve in insertion order and the order is total. Events are
 * data (type + JSON payload); handlers live in the game's registry, never in the queue.
 */
import type { Instant } from '../time/instant.ts';

export interface QueuedEvent {
  at: Instant;
  prio: number;
  seq: number;
  type: string;
  payload: unknown;
}

export interface QueueJSON {
  nextSeq: number;
  events: QueuedEvent[];
}

const before = (a: QueuedEvent, b: QueuedEvent): boolean =>
  a.at !== b.at ? a.at < b.at : a.prio !== b.prio ? a.prio < b.prio : a.seq < b.seq;

export class EventQueue {
  private heap: QueuedEvent[] = [];
  private live = new Set<number>();
  private nextSeq = 0;

  push(at: Instant, prio: number, type: string, payload: unknown = null): number {
    if (!Number.isSafeInteger(at)) throw new Error(`Event time must be an integer, got ${at}`);
    const ev: QueuedEvent = { at, prio, seq: this.nextSeq++, type, payload };
    this.heap.push(ev);
    this.live.add(ev.seq);
    this.siftUp(this.heap.length - 1);
    return ev.seq;
  }

  /** Cancels a pending event. Returns false if it already ran, was cancelled, or never existed. */
  cancel(seq: number): boolean {
    return this.live.delete(seq);
  }

  isPending(seq: number): boolean {
    return this.live.has(seq);
  }

  get size(): number {
    return this.live.size;
  }

  peek(): QueuedEvent | undefined {
    this.dropCancelled();
    return this.heap[0];
  }

  pop(): QueuedEvent | undefined {
    this.dropCancelled();
    const top = this.heap[0];
    if (!top) return undefined;
    this.removeTop();
    this.live.delete(top.seq);
    return top;
  }

  /** Pending events in pop order (canonical, independent of heap layout). */
  pending(): QueuedEvent[] {
    return this.heap.filter((e) => this.live.has(e.seq)).sort((a, b) => (before(a, b) ? -1 : 1));
  }

  toJSON(): QueueJSON {
    return { nextSeq: this.nextSeq, events: this.pending().map((e) => ({ ...e })) };
  }

  static fromJSON(j: QueueJSON): EventQueue {
    const q = new EventQueue();
    q.nextSeq = j.nextSeq;
    for (const e of j.events) {
      q.heap.push({ ...e });
      q.live.add(e.seq);
    }
    for (let i = (q.heap.length >> 1) - 1; i >= 0; i--) q.siftDown(i);
    return q;
  }

  private dropCancelled(): void {
    while (this.heap.length > 0 && !this.live.has(this.heap[0]!.seq)) this.removeTop();
  }

  private removeTop(): void {
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
  }

  private siftUp(i: number): void {
    const h = this.heap;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!before(h[i]!, h[p]!)) break;
      [h[i], h[p]] = [h[p]!, h[i]!];
      i = p;
    }
  }

  private siftDown(i: number): void {
    const h = this.heap;
    for (;;) {
      const l = 2 * i + 1; const r = l + 1;
      let m = i;
      if (l < h.length && before(h[l]!, h[m]!)) m = l;
      if (r < h.length && before(h[r]!, h[m]!)) m = r;
      if (m === i) return;
      [h[i], h[m]] = [h[m]!, h[i]!];
      i = m;
    }
  }
}
