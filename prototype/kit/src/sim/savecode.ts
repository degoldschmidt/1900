/**
 * Save codes: the whole game as seed + scenario + input log, encoded as base64url text the player
 * can copy. The state is not stored; it is rebuilt by replay, so a save code also reproduces any
 * reported anomaly exactly.
 */
import type { InputEntry, Command } from './sim.ts';

export interface SaveCode<C extends Command = Command> {
  v: 1;
  game: string;
  buildId: string;
  dataHash: string;
  scenario: string;
  seed: number;
  processed: number;
  log: Array<InputEntry<C>>;
  /** Optional playtest questionnaire answers. */
  answers?: Record<string, string | number>;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function base64urlEncode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!; const b1 = bytes[i + 1]; const b2 = bytes[i + 2];
    out += ALPHABET[b0 >> 2]!;
    out += ALPHABET[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)]!;
    if (b1 !== undefined) out += ALPHABET[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)]!;
    if (b2 !== undefined) out += ALPHABET[b2 & 63]!;
  }
  return out;
}

export function base64urlDecode(s: string): Uint8Array {
  const clean = s.replace(/\s+/g, '');
  const vals: number[] = [];
  for (const ch of clean) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error(`Invalid character "${ch}" in save code`);
    vals.push(v);
  }
  const out: number[] = [];
  for (let i = 0; i < vals.length; i += 4) {
    const a = vals[i]!; const b = vals[i + 1]; const c = vals[i + 2]; const d = vals[i + 3];
    if (b === undefined) throw new Error('Save code is truncated');
    out.push((a << 2) | (b >> 4));
    if (c !== undefined) out.push(((b & 15) << 4) | (c >> 2));
    if (d !== undefined && c !== undefined) out.push(((c & 3) << 6) | d);
  }
  return Uint8Array.from(out);
}

export function encodeSave<C extends Command>(save: SaveCode<C>): string {
  return base64urlEncode(new TextEncoder().encode(JSON.stringify(save)));
}

export function decodeSave<C extends Command>(code: string): SaveCode<C> {
  const json = new TextDecoder().decode(base64urlDecode(code));
  const s = JSON.parse(json) as SaveCode<C>;
  if (s.v !== 1 || typeof s.game !== 'string' || !Array.isArray(s.log)) throw new Error('Not a save code for this game');
  return s;
}
