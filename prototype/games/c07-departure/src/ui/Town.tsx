/**
 * Town (RULES.md 9 CityPanel): the places of the town with today's hours, how hotels register
 * guests, the rooms and their prices, and every act possible now with its preview: when it would
 * run, how long, what it costs in money and health, and the records it would write.
 */
import { useMemo, useState } from 'preact/hooks';
import { cityView, actionsView, type ActionView } from '../views/index.ts';
import type { Ctl, Inputs } from './types.ts';
import { ScreenHead, Section, Leader, Cite, ActCard, Empty, T } from './common.tsx';

const GROUPS: Array<[string, (a: ActionView) => boolean]> = [
  ['Business', (a) => a.cmd.type === 'planVerb' && (a.cmd.verb === 'meet' || a.cmd.verb === 'posteRestante')],
  ['Money', (a) => a.cmd.type === 'planVerb' && a.cmd.verb === 'drawCredit'],
  ['Telegrams', (a) => a.cmd.type === 'planVerb' && a.cmd.verb === 'cable'],
  ['Trains and guides', (a) => a.cmd.type === 'planVerb' && (a.cmd.verb === 'buyGuide' || a.cmd.verb === 'askPorter' || a.cmd.verb === 'checkBoard')],
  ['Rooms and rest', (a) => a.cmd.type === 'planVerb' && (a.cmd.verb === 'lodge' || a.cmd.verb === 'rest' || a.cmd.verb === 'wait')],
];

export function Town({ inp, ctl }: { inp: Inputs; ctl: Ctl }) {
  const cv = useMemo(() => cityView(inp.p, inp.d), [inp.v]);
  const aboardActs = useMemo(() => (cv ? [] : actionsView(inp.p, inp.d).filter((a) => a.cmd.type === 'planVerb' || a.cmd.type === 'alight')), [inp.v]);
  const [err, setErr] = useState<{ id: string; text: string | null } | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const add = (a: ActionView) => {
    const e = ctl.send(a.cmd);
    setErr({ id: a.id, text: e });
    setAdded(e ? null : a.label);
  };
  if (!cv) {
    return (
      <div class="town">
        <ScreenHead title="Town" sub="You are in the train. Only rest, a telegram draft, or getting off early." />
        {aboardActs.length ? <ul class="acts">{aboardActs.map((a) => <ActCard key={a.id} a={a} err={err?.id === a.id ? err.text : null} onAdd={add} />)}</ul> : <Empty>Nothing to do aboard.</Empty>}
      </div>
    );
  }
  const ended = inp.p.ending !== null;
  return (
    <div class="town">
      <ScreenHead title={cv.cityName} sub={<>{cv.date.date}, <T c={cv.date} /></>} />
      {added ? <p class="flash" role="status">Entered in the diary: {added}. <button type="button" class="link" onClick={() => ctl.go('diary')}>See the day</button></p> : null}
      {!ended ? GROUPS.map(([title, test]) => {
        // Meetings first: they are what the journey is for.
        const acts = cv.acts.filter(test).sort((x, y) => Number(y.cmd.type === 'planVerb' && y.cmd.verb === 'meet') - Number(x.cmd.type === 'planVerb' && x.cmd.verb === 'meet'));
        if (!acts.length) return null;
        return (
          <Section key={title} title={title} id={`acts-${title.split(' ')[0]!.toLowerCase()}`}>
            <ul class="acts">{acts.map((a) => <ActCard key={a.id} a={a} err={err?.id === a.id ? err.text : null} onAdd={add} />)}</ul>
          </Section>
        );
      }) : <Empty>The scenario is over.</Empty>}
      <Section title="Places and hours today" id="venues">
        <ul class="venues">
          {cv.venues.map((v) => (
            <li key={v.venue + v.name} class={v.openNow ? 'v-open-now' : 'v-shut'}>
              <span class="v-name">{v.name} <Cite c={v.citation} />{v.openNow ? <span class="v-open">open now</span> : <span class="vh">, closed now</span>}</span>
              <span class="v-hours">{v.hoursToday}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Hotels" id="hotels" note={<>{cv.registration.text}{cv.registration.authority ? ` (${cv.registration.authority})` : ''} <Cite c={cv.registration.citation} /></>}>
        {cv.lodging.map((l) => <Leader key={l.tier} k={<>{l.tier} room <Cite c={l.citation} /></>}>{l.price} <span class="muted">({l.range})</span></Leader>)}
        {cv.lodged ? <p class="sec-note">You have a {cv.lodged.tier} room here since <T c={cv.lodged.since} />.</p> : null}
      </Section>
    </div>
  );
}
