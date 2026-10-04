// The light on a postcard: where the sun stands over this city at this hour and date (true solar elevation, so St
// Petersburg keeps its white nights and Lisbon's evenings run late), what the weather does to it, and the season in
// the leaves. Every ink on the card passes through `inkOf`, so the whole picture is lit in one place.

import { mix, mul, desat, rgb } from './color.js';

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const RAD = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;

/** Solar elevation (degrees) for a campaign moment at a place. t: minutes from 28 June 1914 00.00 CET. */
export function sunAt(t, lon, lat) {
  const doy = 179 + t / 1440;                                     // 28 June is day 179
  const decl = -23.44 * Math.cos((2 * Math.PI / 365) * (doy + 10));
  const solar = ((t % 1440) + 1440) % 1440 / 60 - 1 + lon / 15;     // CET is GMT+1; local solar hour
  const ha = (solar - 12) * 15;
  const s = Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(ha * RAD);
  return { elev: Math.asin(clamp(s, -1, 1)) / RAD, morning: ((solar % 24) + 24) % 24 < 12, solar: ((solar % 24) + 24) % 24 };
}
/** The moon's age as a fraction of a lunation (0 new, .5 full), from a known new moon (6 Jan 2000, 18.14 GMT). */
export function moonAge(t) {
  const days = (Date.UTC(1914, 5, 28) - Date.UTC(2000, 0, 6, 18, 14)) / 864e5 + t / 1440;
  return (((days / 29.530588853) % 1) + 1) % 1;
}

// sky keyframes by solar elevation: [elevation, top, middle, horizon, ambient light, morning tint of the horizon]
const SKY = [
  [-18, '#070d22', '#0c1734', '#16264a', [.3, .35, .55]],
  [-10, '#0d1838', '#1b2b56', '#2f3f6e', [.4, .44, .64]],
  [-5, '#26336a', '#4b4f86', '#8a6f9c', [.6, .57, .74]],
  [-1, '#3f5694', '#8a7aa8', '#ef9a6a', [.82, .7, .7]],
  [3, '#5f84c2', '#b9aeb8', '#f6c27e', [1, .87, .72]],
  [9, '#5a93d0', '#93b9dc', '#ece0be', [1, .96, .88]],
  [25, '#4d8fd2', '#7ab0e0', '#d4e6ee', [1, 1, 1]],
  [60, '#4589cf', '#73abde', '#cfe3ee', [1, 1, 1]],
];
function skyAt(e) {
  let i = 0;
  while (i < SKY.length - 2 && e > SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], t = clamp((e - a[0]) / (b[0] - a[0]));
  return { top: mix(a[1], b[1], t), mid: mix(a[2], b[2], t), low: mix(a[3], b[3], t), amb: a[4].map((x, k) => lerp(x, b[4][k], t)) };
}

const SEASON = {
  spring: { leaf: '#7fb44e', dark: '#4b7d2f', light: '#b5d77c', grass: '#8cc061', bloom: '#f3c3d2' },
  early: { leaf: '#5d9b3f', dark: '#33692a', light: '#94c565', grass: '#79ad4d' },
  late: { leaf: '#6f8d36', dark: '#46622a', light: '#bdb35c', grass: '#a5a556' },
  autumn: { leaf: '#c97b2e', dark: '#8c471d', light: '#e9ad4b', grass: '#a8955a', fall: '#d7a03a' },
  winter: { leaf: null, dark: '#5b5148', light: '#8b8076', grass: '#e9eef2' },
};
/** Summer's progress through the campaign: 0 on 28 June, 1 on 4 August. */
export const summerAt = (t) => clamp(t / (37 * 1440));

/**
 * The sun quantised for caching: fine steps through the twilights (where the light changes quickly), coarse by day,
 * one step for the deep night (with the small hours apart, when fewer windows are lit).
 */
export function sunStep(t, lon, lat) {
  const s = sunAt(t, lon, lat);
  let e;
  if (s.elev < -12) e = -14;
  else if (s.elev < 14) e = Math.round(s.elev / 2) * 2;
  else if (s.elev < 30) e = Math.round(s.elev / 8) * 8;
  else e = Math.min(60, Math.round(s.elev / 15) * 15);
  if (e === -14) { const small = s.solar >= 0.5 && s.solar < 4.5; return { elev: e, morning: false, solar: small ? 2 : 23, key: small ? 'n2' : 'n' }; }
  return { elev: e, morning: s.morning, solar: s.solar, key: `${e}${s.morning ? 'm' : 'e'}` };
}

/**
 * The light for a postcard. hour may be given directly (contact sheets) or as t with lon/lat (in play).
 * weather: clear cloud rain storm fog smoke heat. season: spring summer autumn winter (summer reads `progress`).
 */
export function lightAt({ t = 12 * 60, lon = 15, lat = 48, weather = 'clear', season = 'summer', progress = null, sun = null } = {}) {
  sun = sun ?? sunAt(t, lon, lat);
  const e = sun.elev;
  const S = skyAt(e);
  let { top, mid, low } = S;
  // a morning sky is a little cooler and rosier than an evening one at the same height
  if (sun.morning && e < 8) { const k = clamp((8 - e) / 12) * clamp((e + 12) / 6) * .35; top = mix(top, '#5a6aa8', k * .4); low = mix(low, '#f2a7a0', k); }
  let amb = S.amb.slice(), dz = 0, cloud = 1, rain = 0, storm = false, wet = false;
  let fog = { color: '#d8d8d2', near: 0, far: 0 }, haze = { color: '#c8b48e', amount: 0 }, heat = false;
  const night = clamp((-2 - e) / 10);  // 0 by day, 1 deep in the night
  if (weather === 'cloud') { top = mix(desat(top, .4), '#a9b6c4', .25); mid = desat(mid, .35); amb = amb.map((x) => x * .95); cloud = 1.8; }
  if (weather === 'rain' || weather === 'storm') {
    const k = weather === 'storm' ? .85 : .7, grey = weather === 'storm' ? ['#3c4450', '#535d6b', '#6f7987'] : ['#7f8a97', '#9aa4ae', '#b9c0c6'];
    top = mix(top, grey[0], k); mid = mix(mid, grey[1], k); low = mix(low, grey[2], k);
    amb = amb.map((x, i) => x * (weather === 'storm' ? [.6, .64, .74][i] : [.8, .84, .9][i]));
    dz = .25; cloud = weather === 'storm' ? 2.6 : 2.2; rain = weather === 'storm' ? 1.3 : 1; storm = weather === 'storm'; wet = true;
  }
  if (weather === 'fog') {
    const fc = mix('#d9dad4', '#2b3350', night * .85);
    top = mix(top, fc, .6); mid = mix(mid, fc, .75); low = mix(low, fc, .85);
    fog = { color: fc, near: .14, far: .55 }; cloud = .2; dz = .15;
  }
  if (weather === 'smoke') { haze = { color: mix('#b9a17c', '#3a3328', night * .8), amount: .28 }; top = mix(top, '#b7a585', .3 * (1 - night)); low = mix(low, '#c9ab7d', .45 * (1 - night)); cloud = 1.2; }
  if (weather === 'heat') { low = mix(low, '#f3ead0', .45); mid = mix(mid, '#cbdcea', .3); haze = { color: '#f2e2bd', amount: .1 }; heat = true; cloud = .4; }

  // windows and lamps: on as the light goes; fewer in the small hours
  const solar = sun.solar;
  const smallHours = solar >= 0.5 && solar < 4.5 ? .45 : 1;
  const windows = e > 6 ? .03 : clamp((6 - e) / 12) * .62 * smallHours + .03;
  const lamps = clamp((2 - e) / 6);

  // the season in the leaves
  let leaf;
  if (season === 'summer') { const p = progress ?? summerAt(t), a = SEASON.early, b = SEASON.late; leaf = { leaf: mix(a.leaf, b.leaf, p), dark: mix(a.dark, b.dark, p), light: mix(a.light, b.light, p), grass: mix(a.grass, b.grass, p) }; }
  else leaf = { ...SEASON[season] };
  leaf.ever = season === 'winter' ? '#3c5a40' : mix('#3f6a3e', leaf.dark, .3); // bay, box, cypress and pine keep their green

  const L = {
    elev: e, morning: sun.morning, solar, night, weather, season,
    phase: e < -6 ? 'night' : e < 0 ? (sun.morning ? 'dawn' : 'dusk') : e < 8 ? (sun.morning ? 'morning' : 'golden') : 'day',
    sky: { top, mid, low },
    sun: { show: e > -1 && weather !== 'rain' && weather !== 'storm' && weather !== 'fog', elev: e, x: sun.morning ? .18 + (1 - clamp(e / 60)) * .1 : .82 - (1 - clamp(e / 60)) * .1, color: e < 6 ? '#ffd38a' : '#fff6d8' },
    moon: { show: e < -3 && weather !== 'rain' && weather !== 'storm' && weather !== 'fog', age: Math.round(moonAge(t) * 16) / 16 },
    stars: weather === 'clear' || weather === 'heat' ? clamp((-6 - e) / 8) : weather === 'cloud' ? clamp((-6 - e) / 8) * .3 : 0,
    cloud, rain, storm, wet, fog, haze, heat,
    cloudInk: {
      body: night > .5 ? mix('#3a4570', '#596389', 1 - night) : e < 4 ? mix('#fbe0c8', '#ffffff', clamp(e / 4)) : weather === 'rain' || weather === 'storm' ? '#9aa3ad' : '#ffffff',
      shade: night > .5 ? '#232c4e' : e < 4 ? '#c99aa0' : weather === 'rain' || weather === 'storm' ? '#6e7883' : '#b9c9dc',
    },
    // winter snow lies north of the Mediterranean shores; Rome, Lisbon, Athens and Constantinople get a grey winter
    amb, desat: clamp(night * .45 + dz), windows, lamps, leaf, snow: season === 'winter' && lat > 43.5,
  };
  return L;
}

/** The ink of a colour under this light. depth: 0 at the front of the scene, 1 at the horizon (fog and haze grow with it). */
export function inkOf(L, c, depth = 0) {
  let x = mul(c, L.amb);
  if (L.desat > 0) x = desat(x, L.desat);
  const fg = L.fog.near + (L.fog.far - L.fog.near) * depth;
  if (fg > 0) x = mix(x, L.fog.color, fg);
  if (L.haze.amount > 0) x = mix(x, L.haze.color, L.haze.amount * (.4 + .6 * depth));
  return x;
}
/** Emissive light (a lit window, a lamp): not darkened by the night, only softened by fog. */
export function glowOf(L, c) { return L.fog.near > 0 ? mix(c, L.fog.color, .3) : c; }
export { rgb };
