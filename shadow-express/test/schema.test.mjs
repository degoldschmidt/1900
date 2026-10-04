// The validator catches what the contracts forbid. Each case breaks one thing in otherwise valid data.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { validate, words } from '../src/core/schema.js';

const clone = () => structuredClone(D);
const errs = (d) => validate(d).errors;
const has = (d, re) => { const e = errs(d); assert.ok(e.some((m) => re.test(m)), `expected ${re} in:\n${e.slice(0, 8).join('\n')}`); };

test('the shipped data validates', () => assert.deepEqual(errs(clone()), []));
test('words counts a template as one word', () => assert.equal(words('Good evening, {sir|madam}.'), 3));
test('unknown references are caught', () => {
  const d = clone();
  d.stories.push({ id: 'x.a', at: 'city', title: 'T', text: 'Some text.', choices: [
    { label: 'Go', ok: [['trust', 'nobody', 1]] }, { label: 'Stay', ok: [['item', '+unobtainium']] }] });
  has(d, /no person nobody/); has(d, /item delta/);
});
test('a choice without stakes is rejected', () => {
  const d = clone();
  d.stories.push({ id: 'x.b', at: 'city', title: 'T', text: 'Text.', choices: [{ label: 'Wait', ok: [['min', 30]] }, { label: 'Pay', cost: { money: 2 }, ok: [] }] });
  has(d, /no effect beyond time passing/);
});
test('style limits and anachronisms', () => {
  const d = clone();
  d.stories.push({ id: 'x.c', at: 'city', title: 'Okay then', text: 'word '.repeat(71), choices: [{ label: 'One two three four five six seven eight', ok: [['money', -1]] }, { label: 'b', ok: [['nerve', 1]] }] });
  has(d, /text has 71 words/); has(d, /label has 8 words/); has(d, /anachronism/);
});
test('flags read but never set', () => {
  const d = clone();
  d.stories.push({ id: 'x.d', at: 'city', if: [['flag', 'ghost-flag']], title: 'T', text: 'Text.', choices: [{ label: 'a', ok: [['money', -1]] }, { label: 'b', ok: [['nerve', 1]] }] });
  has(d, /reads flag ghost-flag/);
});
test('continuations must be reachable and dialogue must end', () => {
  const d = clone();
  d.stories.push({ id: 'x.e', at: 'then', title: 'T', text: 'Text.', choices: [{ label: 'a', ok: [['money', -1]] }] });
  d.stories.push({ id: 'x.f', at: 'city', title: 'T', text: 'Text.', choices: [{ label: 'a', next: 'x.g', ok: [] }, { label: 'b', next: 'x.g', ok: [] }] });
  d.stories.push({ id: 'x.g', at: 'then', title: 'T', text: 'Text.', choices: [{ label: 'a', next: 'x.f', ok: [['money', -1]] }] });
  has(d, /x\.e.*nothing leads here/); has(d, /x\.f: every path loops/);
});
test('frontier chains and geometry', () => {
  const d = clone();
  const l = d.lines.find((x) => x.id === 'PAR-MUN');
  l.frontiers[0].into = 'CH';
  has(d, /frontiers lead into CH/);
  const d2 = clone();
  const l2 = d2.lines.find((x) => x.id === 'PAR-MUN');
  l2.frontiers[0].ll = [20, 60]; l2.via = [];
  has(d2, /km off the line/);
});
test('op steps: windows, ways, covers', () => {
  const d = clone();
  const op = d.ops.find((o) => o.steps.some((s) => s.kind === 'act' && (s.ways?.length ?? 0) >= 2 && s.key !== false));
  const step = op.steps.find((s) => s.kind === 'act' && (s.ways?.length ?? 0) >= 2 && s.key !== false);
  step.ways = [step.ways[0]];
  has(d, /at least two ways/);
  step.ways = [{ id: 'a', label: 'Only Weiss', if: [['cover', 'weiss']], risk: .1 }, { id: 'b', label: 'Only Hale', if: [['cover', 'hale']], risk: .1 }];
  has(d, /no way is open to at least three covers/);
  const d2 = clone();
  d2.ops.find((o) => o.id === 'op-cable').steps[1].by = '06-27 10.00';
  has(d2, /bad by|by comes before/);
});
test('people need two places and valid portraits', () => {
  const d = clone();
  const p = d.people.find((x) => x.id === 'kowal');
  p.places = ['WAR']; p.portrait.hat = 'helmet';
  has(d, /at least two places/); has(d, /portrait.hat/);
});
test('calendar facts must be certain', () => {
  const d = clone();
  d.calendar[0].p = .5;
  has(d, /a fact happens/);
});
