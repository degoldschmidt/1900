// Two kinds of chance. The action stream (S.rng) decides what follows the player's choices and advances with each use.
// World facts (delays, disruptions, which loyalties are true) come from hash(seed, …parts): fixed per campaign,
// identical for the board, the hunters and a replay, whatever the player does.

/** One step of mulberry32 on a state; returns [value 0..1, next state]. */
export function step(a) {
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** Draws from S.rng and advances it. */
export function rand(S) {
  const [v, a] = step(S.rng);
  S.rng = a;
  return v;
}

/** A fixed value 0..1 for (seed, parts…). */
export function hash(seed, ...parts) {
  let h = 2166136261 ^ (seed >>> 0);
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return step(h >>> 0)[0];
}

/** Weighted choice from [[value, weight], …] with a 0..1 draw. */
export function weighted(pairs, u) {
  const total = pairs.reduce((a, [, w]) => a + w, 0);
  let r = u * total;
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
  return pairs[pairs.length - 1]?.[0];
}
