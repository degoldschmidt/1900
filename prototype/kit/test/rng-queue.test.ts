import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { murmur3String, murmur3Bytes, murmur3Words, mixKey } from '../src/rng/hash.ts';
import { belowN, chancePermille, pickCdf, cdfOf, drawer } from '../src/rng/draw.ts';
import { EventQueue } from '../src/queue/queue.ts';
import { canonicalJson } from '../src/sim/canonical.ts';
import { hash64, stateHash } from '../src/sim/hash.ts';

describe('murmur3', () => {
  it('matches reference vectors', () => {
    expect(murmur3String('', 0)).toBe(0);
    expect(murmur3String('', 1)).toBe(0x514e28b7);
    expect(murmur3String('test', 0)).toBe(0xba6bd213);
    expect(murmur3String('Hello, world!', 1234)).toBe(0xfaf6cdb3);
    expect(murmur3String('The quick brown fox jumps over the lazy dog', 0)).toBe(0x2e4ff723);
  });
  it('hashes words as their little-endian bytes', () => {
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 0xffffffff }), { maxLength: 20 }), fc.integer({ min: 0, max: 0xffffffff }), (ws, seed) => {
      const bytes = new Uint8Array(ws.length * 4);
      ws.forEach((w, i) => { bytes[i * 4] = w & 255; bytes[i * 4 + 1] = (w >>> 8) & 255; bytes[i * 4 + 2] = (w >>> 16) & 255; bytes[i * 4 + 3] = w >>> 24; });
      return murmur3Words(ws, seed) === murmur3Bytes(bytes, seed);
    }));
  });
  it('keys by purpose and type', () => {
    expect(mixKey(1, 'a', 1)).not.toBe(mixKey(1, 'b', 1));
    expect(mixKey(1, 'a', 1)).not.toBe(mixKey(1, 'a', '1'));
    expect(mixKey(1, 'a', 1, 2)).not.toBe(mixKey(1, 'a', 2, 1));
    expect(mixKey(1, 'a', 2 ** 40)).not.toBe(mixKey(1, 'a', 0));
    expect(() => mixKey(1, 'a', 0.5)).toThrow();
  });
});

describe('keyed draws', () => {
  it('stay in range and are deterministic', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 10_000_000 }), fc.integer({ min: 0, max: 1000 }), (n, id) => {
      const a = belowN(n, 42, 'x', id);
      return a >= 0 && a < n && a === belowN(n, 42, 'x', id);
    }));
  });
  it('are roughly uniform', () => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 20_000; i++) counts[belowN(10, 9, 'u', i)]!++;
    for (const c of counts) expect(Math.abs(c - 2000)).toBeLessThan(200);
    let hits = 0;
    for (let i = 0; i < 10_000; i++) if (chancePermille(250, 3, 'c', i)) hits++;
    expect(Math.abs(hits - 2500)).toBeLessThan(150);
  });
  it('pick from integer CDFs', () => {
    const cdf = cdfOf([0, 3, 0, 7]);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(pickCdf(cdf, 1, 'p', i));
    expect([...seen].sort()).toEqual([1, 3]);
    expect(drawer(5).below(7, 'q', 1)).toBe(belowN(7, 5, 'q', 1));
  });
});

describe('event queue', () => {
  it('orders by time, priority, then insertion', () => {
    const q = new EventQueue();
    q.push(10, 5, 'b'); q.push(10, 1, 'a'); q.push(5, 9, 'first'); q.push(10, 5, 'c');
    expect([q.pop()!.type, q.pop()!.type, q.pop()!.type, q.pop()!.type]).toEqual(['first', 'a', 'b', 'c']);
    expect(q.pop()).toBeUndefined();
  });
  it('cancels pending events only', () => {
    const q = new EventQueue();
    const a = q.push(1, 0, 'a'); const b = q.push(2, 0, 'b');
    expect(q.cancel(a)).toBe(true);
    expect(q.cancel(a)).toBe(false);
    expect(q.size).toBe(1);
    expect(q.pop()!.type).toBe('b');
    expect(q.cancel(b)).toBe(false);
  });
  it('matches a sorted reference and survives serialisation mid-run', () => {
    fc.assert(fc.property(fc.array(fc.tuple(fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 3 }), fc.boolean()), { minLength: 1, maxLength: 60 }), (items) => {
      const q = new EventQueue();
      const seqs = items.map(([at, prio], i) => q.push(at, prio, `e${i}`));
      items.forEach(([, , cancel], i) => { if (cancel) q.cancel(seqs[i]!); });
      const ref = items.map(([at, prio, cancel], i) => ({ at, prio, seq: i, cancel }))
        .filter((e) => !e.cancel).sort((a, b) => a.at - b.at || a.prio - b.prio || a.seq - b.seq).map((e) => `e${e.seq}`);
      const half = Math.floor(ref.length / 2);
      const got: string[] = [];
      for (let i = 0; i < half; i++) got.push(q.pop()!.type);
      const q2 = EventQueue.fromJSON(JSON.parse(JSON.stringify(q.toJSON())));
      for (let e = q2.pop(); e; e = q2.pop()) got.push(e.type);
      return JSON.stringify(got) === JSON.stringify(ref);
    }));
  });
});

describe('canonical JSON and hashes', () => {
  it('sorts keys and normalises -0', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: -0, c: 'x' }] })).toBe('{"a":[2,{"c":"x","d":0}],"b":1}');
    expect(stateHash({ b: 1, a: 2 })).toBe(stateHash({ a: 2, b: 1 }));
    expect(hash64('x')).toMatch(/^[0-9a-f]{16}$/);
  });
  it('refuses values that cannot round-trip', () => {
    expect(() => canonicalJson({ a: undefined })).toThrow();
    expect(() => canonicalJson({ a: Number.NaN })).toThrow();
    expect(() => canonicalJson(new Map())).toThrow();
  });
});
