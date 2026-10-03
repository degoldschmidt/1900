/**
 * MurmurHash3 (x86, 32-bit), used for keyed draws and state hashes. Integer-only arithmetic
 * (Math.imul, shifts), so every JavaScript engine produces identical results.
 */
const C1 = 0xcc9e2d51;
const C2 = 0x1b873593;

function mixK(k: number): number {
  k = Math.imul(k, C1);
  k = (k << 15) | (k >>> 17);
  return Math.imul(k, C2);
}

function mixH(h: number, k: number): number {
  h ^= mixK(k);
  h = (h << 13) | (h >>> 19);
  return (Math.imul(h, 5) + 0xe6546b64) | 0;
}

function fmix(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Murmur3 over bytes. */
export function murmur3Bytes(bytes: Uint8Array, seed = 0): number {
  let h = seed | 0;
  const n = bytes.length;
  const blocks = n - (n % 4);
  for (let i = 0; i < blocks; i += 4) {
    const k = bytes[i]! | (bytes[i + 1]! << 8) | (bytes[i + 2]! << 16) | (bytes[i + 3]! << 24);
    h = mixH(h, k);
  }
  const tail = n & 3;
  if (tail > 0) {
    let k = 0;
    if (tail === 3) k ^= bytes[blocks + 2]! << 16;
    if (tail >= 2) k ^= bytes[blocks + 1]! << 8;
    k ^= bytes[blocks]!;
    h ^= mixK(k);
  }
  h ^= n;
  return fmix(h);
}

const encoder = new TextEncoder();

/** Murmur3 over the UTF-8 encoding of a string. */
export function murmur3String(s: string, seed = 0): number {
  return murmur3Bytes(encoder.encode(s), seed);
}

/** Murmur3 over 32-bit words (equal to murmur3Bytes over their little-endian bytes). */
export function murmur3Words(words: readonly number[], seed = 0): number {
  let h = seed | 0;
  for (const w of words) h = mixH(h, w | 0);
  h ^= words.length * 4;
  return fmix(h);
}

const TWO32 = 4294967296;

export type KeyPart = number | string;

/**
 * Hashes (seed, purpose, ...ids) to a uint32. Numbers must be integers (safe range); strings are
 * hashed by content. Each part is tagged by type so 1 and "1" never collide.
 */
export function mixKey(seed: number, purpose: string, ...ids: KeyPart[]): number {
  const words: number[] = [murmur3String(purpose, 0x5eed)];
  for (const id of ids) {
    if (typeof id === 'number') {
      if (!Number.isSafeInteger(id)) throw new Error(`Key part ${id} is not a safe integer`);
      const hi = Math.floor(id / TWO32);
      const lo = id - hi * TWO32;
      words.push(1, lo >>> 0, hi | 0);
    } else {
      words.push(2, murmur3String(id));
    }
  }
  return murmur3Words(words, seed >>> 0);
}
