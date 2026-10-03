import { canonicalJson } from './canonical.ts';
import { murmur3String } from '../rng/hash.ts';

const hex8 = (n: number): string => (n >>> 0).toString(16).padStart(8, '0');

/** 64-bit (two independent murmur3 passes) hex hash of a string. */
export function hash64(s: string): string {
  return hex8(murmur3String(s, 0x1900)) + hex8(murmur3String(s, 0x1914));
}

/** Hash of any serialisable value via canonical JSON. */
export function stateHash(value: unknown): string {
  return hash64(canonicalJson(value));
}
