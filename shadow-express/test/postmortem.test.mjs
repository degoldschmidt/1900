// The post-mortem and the run report: whole campaigns played by the bots to their endings, then every line of both
// checked against the state that produced it. Endings the bots do not happen to reach are forced on finished games,
// so all seven are always covered.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { when } from '../src/data/time.js';
import { newGame, makeGame } from '../src/core/game.js';
import { endGame } from '../src/core/sim.js';
import { HEAT } from '../src/core/enemy.js';
import { fullName } from '../src/core/hero.js';
import { postmortem } from '../src/core/postmortem.js';
import { reportText, REPORT_VERSION } from '../src/core/report.js';
import { endText, pmHtml } from '../src/ui/cards.js';
import { play } from './bots/bots.mjs';

const WHYS = ['home', 'stranded', 'time', 'arrested', 'captured', 'exposed', 'recalled'];
const HEADLINE = {
  home: /came home to London/, stranded: /last boat sailed without you/, time: /war overtook you/, arrested: /police arrested you/,
  captured: /took you|you were taken/, exposed: /burned|had you by/, recalled: /Bureau recalled you/,
};

// ---------- the corpus: bots until each ending has been met, or the cap is reached ----------
const run = (policy, i) => { const G = makeGame(D, newGame(D, { seed: i * 7919, sex: i % 2 ? 'm' : 'f' })); play(G, policy); return G; };
const natural = [];
{
  const want = new Set(['recalled', 'exposed', 'captured', 'arrested', 'home']);
  for (let i = 1; i <= 40 && (want.size || natural.length < 8); i++) {
    const G = run(i % 2 ? 'careless' : 'competent', i);
    if (G.S.ended) { natural.push(G); want.delete(G.S.ended.why); }
  }
}
const clone = (G) => makeGame(D, JSON.parse(JSON.stringify(G.S)));
/** The same history, ended another way. */
function reend(G, why) { const H = clone(G); H.S.ended = null; H.S.queue.length = 0; endGame(H, why); return H; }
const forced = WHYS.flatMap((why) => natural.slice(0, 3).map((G) => reend(G, why)));
const fresh = WHYS.map((why) => { const G = makeGame(D, newGame(D, { seed: 5 })); endGame(G, why); return G; });
const running = [makeGame(D, newGame(D, { seed: 5 })), (() => { const G = clone(natural[0]); G.S.ended = null; return G; })()];

/** Every string in a value. */
const strings = (x, out = []) => { if (typeof x === 'string') out.push(x); else if (x && typeof x === 'object') for (const v of Object.values(x)) strings(v, out); return out; };
const BAD = /\bundefined\b|\bNaN\b|\[object|\bnull\b|\bInfinity\b/;

/** Everything the post-mortem and report promise, for one game. */
function check(G, label) {
  const S = G.S;
  const before = JSON.stringify(S);
  const pm = postmortem(G);
  assert.deepEqual(postmortem(G), pm, `${label}: deterministic`);
  assert.equal(JSON.stringify(S), before, `${label}: the state is not changed`);
  assert.equal(pm.why, S.ended?.why ?? null, `${label}: why`);
  assert.equal(typeof pm.headline, 'string');
  if (pm.why) assert.match(pm.headline, HEADLINE[pm.why], `${label}: headline for ${pm.why}: ${pm.headline}`);
  else assert.match(pm.headline, /still running/);
  // the records that gave a name away are real, belong to the name, were in the enemy's hands before it was posted, and are in weight order
  for (const c of pm.covers) {
    assert.ok(c.because.length <= 4, `${label}: at most four reasons`);
    for (const b of c.because) {
      const r = S.records.find((x) => x.id === b.id);
      assert.ok(r, `${label}: record ${b.id} of ${c.cover} exists`);
      assert.equal(r.cover, c.cover);
      assert.deepEqual([r.kind, r.city, r.t, r.fid], [b.kind, b.city, b.t, b.fid]);
      assert.ok(b.label && !BAD.test(b.label), `${label}: label ${b.label}`);
      if (c.postedAt !== null) assert.ok(r.arrives <= c.postedAt, `${label}: ${c.cover} record arrived before the name was posted`);
    }
    for (let i = 1; i < c.because.length; i++) assert.ok(c.because[i - 1].weight >= c.because[i].weight, `${label}: heaviest first`);
    assert.equal(c.posted, !!S.enemy.dossiers[c.cover]?.name, `${label}: ${c.cover} posted`);
    if (c.posted) assert.notEqual(c.postedAt, null, `${label}: when ${c.cover} was posted is known`);
    assert.equal(c.burned, !!S.covers[c.cover]?.burned);
  }
  // the tips that were not so are tips the player held
  for (const t of pm.falseTips) {
    const e = S.intel.find((x) => x.id === t.id);
    assert.ok(e, `${label}: intel ${t.id} exists`);
    assert.ok(e.truth === false || e.resolved === false);
    assert.equal(t.subj, e.subj); assert.deepEqual(t.claim, e.claim); assert.equal(t.src, e.src); assert.equal(t.learned, e.learned);
  }
  assert.ok(pm.costliest.length <= 3);
  assert.equal(pm.nearMisses, S.stats.nearMisses);
  if (!S.ended) assert.deepEqual(pm.truths, [], `${label}: nothing is revealed while the campaign runs`);
  // no stray tokens in any line
  for (const s of strings(pm)) assert.doesNotMatch(s, BAD, `${label}: "${s}"`);
  // at most one hunter is nearest, and he is one of the hunters
  assert.ok(pm.hunters.filter((h) => h.nearest).length <= 1);
  if (pm.nearest) assert.ok(D.hunters.some((h) => h.id === pm.nearest));

  // the run report
  const txt = reportText(G);
  assert.equal(reportText(G), txt, `${label}: report deterministic`);
  assert.ok(Buffer.byteLength(txt) < 8 * 1024, `${label}: ${Buffer.byteLength(txt)} bytes`);
  assert.ok(txt.startsWith(`SHADOW EXPRESS RUN REPORT ${REPORT_VERSION}`));
  assert.ok(txt.includes(`seed ${S.seed}`), `${label}: seed`);
  assert.ok(txt.includes(fullName(S.hero)), `${label}: hero`);
  assert.ok(txt.includes(S.ended ? `ending ${S.ended.why}` : 'ending none'), `${label}: ending`);
  assert.doesNotMatch(txt, BAD, `${label}: report tokens`);
  const lastLog = S.log.at(-1);
  if (lastLog) assert.ok(txt.includes(when(lastLog.t)), `${label}: the log is dated`);
  if (S.ended) assert.ok(txt.includes(when(S.ended.t)), `${label}: the ending is dated`);
  return { pm, txt };
}

test('the bots reached endings to examine', () => {
  assert.ok(natural.length >= 5, `only ${natural.length} campaigns ended`);
  assert.ok(new Set(natural.map((G) => G.S.ended.why)).size >= 3, `endings: ${[...new Set(natural.map((G) => G.S.ended.why))]}`);
});

test('every campaign the bots played to an ending: real records, real tips, the right headline, a short report', () => {
  for (const G of natural) check(G, `${G.S.seed}/${G.S.ended.why}`);
});

test('all seven endings, forced on finished campaigns', () => {
  assert.equal(forced.length, WHYS.length * Math.min(3, natural.length));
  for (const G of forced) check(G, `forced ${G.S.seed}/${G.S.ended.why}`);
});

test('all seven endings, on a campaign with no history at all', () => {
  for (const G of fresh) { const { pm } = check(G, `fresh ${G.S.ended.why}`); assert.deepEqual(pm.falseTips, []); }
});

test('a campaign still running can be reported on, and keeps its secrets', () => {
  for (const G of running) {
    const { pm, txt } = check(G, 'running');
    assert.equal(pm.why, null);
    assert.match(txt, /ending none/);
    assert.doesNotMatch(txt, /\ntruths\n/);
  }
});

test('the post-mortem uses no chance', () => {
  const real = Math.random;
  Math.random = () => { throw new Error('Math.random called'); };
  try { for (const G of natural.slice(0, 3)) { postmortem(G); reportText(G); } } finally { Math.random = real; }
});

test('a posted name is explained by the records that reached the enemy before it, in the enemy\'s own terms', () => {
  let explained = 0;
  for (const G of natural) for (const c of postmortem(G).covers) {
    if (!c.posted || c.postedBy === 'talk') continue;
    explained++;
    assert.ok(c.because.length >= 1, `${G.S.seed}: ${c.cover} was posted by ${c.postedBy} with nothing to show for it`);
    assert.ok(c.because.reduce((a, b) => a + b.weight, 0) > 0);
  }
  assert.ok(explained > 0, 'no posted name in the whole corpus');
});

test('a name posted on its records is accounted for by them, and a legend that failed by the suspicion that provoked the check', () => {
  let n = 0;
  for (const G of natural) for (const c of postmortem(G).covers) {
    if (!c.posted || !['records', 'legend'].includes(c.postedBy)) continue;
    const total = G.S.records.filter((r) => r.cover === c.cover && r.kind !== 'calm' && !r.planted && r.arrives <= c.postedAt).reduce((a, r) => a + (r.heat ?? HEAT[r.kind] ?? 0) * r.fid, 0);
    assert.ok(total >= (c.postedBy === 'records' ? .4 : .25), `${G.S.seed}: ${c.cover} posted by ${c.postedBy} on only ${total.toFixed(2)} of weight`);
    n++;
  }
  assert.ok(n > 0);
});

test('the lies and the moles: the hidden loyalties are told, and the cable follows the rule of its stories', () => {
  for (const G of natural.filter((x) => x.S.ended)) {
    const mole = D.people.find((p) => String(G.S.people[p.id].loyal).startsWith('enemy:'));
    const t = postmortem(G).truths.join(' ');
    assert.ok(t.includes(mole.name), `${G.S.seed}: the mole ${mole.name} is named`);
    if (G.S.ops['op-cable'].done.meet) assert.match(t, G.S.people.amsler.loyal === 'enemy:orlova' ? /cable was genuine/ : /cable was a forgery/);
  }
  // false trails: what the enemy did with each is told
  const trails = natural.filter((x) => x.S.enemy.planted.length);
  for (const G of trails) assert.match(postmortem(G).truths.join(' '), /false trail/);
  const H = reend(natural[0], 'captured');
  H.S.enemy.planted = [{ id: 1, cover: 'hale', city: 'VIE', t: 100, via: 'platt', accepted: true, exposed: false }, { id: 2, cover: 'hale', city: 'PRG', t: 200, via: 'platt', accepted: true, exposed: true }, { id: 3, cover: 'hale', city: 'BUD', t: 300, via: 'platt', accepted: false, exposed: false }];
  assert.match(postmortem(H).truths.join(' '), /You laid 3 false trails: 1 believed to the end, 1 seen through, 1 not believed\. Each one made the next harder to believe\./);
  // the rule the post-mortem relies on is still the rule of the cable's own twists: genuine when Amsler is Orlova's man
  const buyback = D.ops.find((o) => o.id === 'op-cable').twists.find((tw) => tw.story === 'op-cable.buyback');
  assert.ok(JSON.stringify(buyback.if).includes('["loyal","amsler","enemy:orlova"]'), 'op-cable no longer tests Amsler for a genuine cable: update truthLines in postmortem.js');
});

test('a worst case still makes a short report: a full log, a long name, every record kind', () => {
  const G = clone(natural[0]);
  G.S.hero.first = 'Bartholomew-Maximilian'; G.S.hero.last = 'Featherstonehaugh-Cholmondeley-Smythe';
  G.S.log = Array.from({ length: 200 }, (_, i) => ({ t: 1000 + i * 90, text: `Entry ${i}: ${'a long line of the journey, with places and trains and names. '.repeat(4)}` }));
  G.S.intel = Array.from({ length: 150 }, (_, i) => ({ id: i + 1, subj: 'hunter:falk', claim: { at: 'VIE' }, src: 'rumour', rel: .3, truth: false, planted: false, about: 100, learned: 100 + i, resolved: null }));
  const { txt } = check(G, 'worst');
  assert.ok(txt.includes('Bartholomew-Maximilian'));
  assert.ok(txt.split('\n').filter((l) => /^\w{3} \d+ \w{3} \d\d\.\d\d {2}Entry/.test(l)).length >= 25, 'a screenful of the log survives');
});

test('an older save without a hero, or a hunter that was never placed, does not break either', () => {
  const G = clone(natural[0]);
  delete G.S.hero;
  assert.doesNotThrow(() => { postmortem(G); reportText(G); });
  const H = clone(natural[0]);
  H.S.enemy.hunters = {};
  assert.doesNotThrow(() => { postmortem(H); reportText(H); });
});

test('the end card: the file on you is there, escaped, with the button that copies the report', () => {
  for (const G of [...natural.slice(0, 4), ...forced.slice(0, 7)]) {
    const html = endText(G, { why: G.S.ended.why, n: 1 });
    assert.ok(html.includes('<details open class="pm">') && html.includes('<summary>Their file on you</summary>'), 'the file');
    assert.ok(html.includes('data-copy-report') && html.includes('Copy run report'), 'the button');
    assert.doesNotMatch(html, /\bundefined\b|\bNaN\b|\[object/);
    assert.equal((html.match(/<details/g) ?? []).length, (html.match(/<\/details>/g) ?? []).length, 'details are closed');
  }
  const G = reend(natural[0], 'recalled');
  G.S.hero.first = '<img src=x onerror=alert(1)>';
  const html = endText(G, { why: 'recalled', n: 1 });
  assert.ok(!html.includes('<img src=x'), 'a name is escaped');
  assert.ok(pmHtml(postmortem(G)).includes('&lt;img src=x'));
});
