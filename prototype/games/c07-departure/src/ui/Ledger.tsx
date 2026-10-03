/**
 * The pocket's account-book pages: Purse (RULES.md 9: cash, credit, correspondents' hours, rent,
 * bill, debts, parities, entries), Commissions (held, offered and lapsed offers with each window
 * against the earliest arrival you know of), and the Guide shelf (owned and active editions, on
 * sale here, trains learned, ghosts met).
 */
import { useMemo, useState } from 'preact/hooks';
import { purseView, commissionsView, shelfView, actionsView, type OfferView } from '../views/index.ts';
import type { Ctl, Inputs } from './types.ts';
import { ScreenHead, Section, Leader, Cite, Empty, Refusal, T } from './common.tsx';

export function Purse({ inp }: { inp: Inputs }) {
  const pv = useMemo(() => purseView(inp.p, inp.d), [inp.v]);
  return (
    <div class="purse">
      <ScreenHead title="Purse" />
      <Section title="In hand" id="cash">
        {pv.cash.length ? pv.cash.map((c) => <Leader key={c} k="Cash"><span class="amt">{c}</span></Leader>) : <Empty>No cash.</Empty>}
        <Leader k="Letter of credit, left to draw"><span class="amt">{pv.credit}</span></Leader>
        {pv.unpaid.length ? <Leader k="Owed" cls="owed"><span class="amt">{pv.unpaid.join(', ')}</span></Leader> : null}
      </Section>
      {pv.rent || pv.bill ? (
        <Section title="Falling due" id="due">
          {pv.rent ? (
            <div class={`due-row${pv.rent.arrearsSince ? ' owed' : ''}`}>
              <p class="due-k">Rent, {pv.rent.amount}</p>
              <p class="due-v">next due <T c={pv.rent.nextDue} date />{pv.rent.arrearsSince ? <> · in arrears since <T c={pv.rent.arrearsSince} date /></> : null}</p>
            </div>
          ) : null}
          {pv.bill ? (
            <div class={`due-row${pv.bill.protested ? ' owed' : ''}`}>
              <p class="due-k">Bill of {pv.bill.amount} at {pv.bill.bankName}</p>
              <p class="due-v">matures <T c={pv.bill.maturity} date />{pv.bill.met ? ' · met' : pv.bill.protested ? ' · protested' : ''}</p>
            </div>
          ) : null}
        </Section>
      ) : null}
      <Section title="Correspondents" id="banks" note="Banks that honour your letter of credit, and their hours.">
        {pv.correspondents.map((c) => (
          <div key={c.bank} class="bank">
            <p class="bank-name">{c.name}, {c.cityName} <Cite c={c.citation} /></p>
            <ul class="hours">{c.hoursText.map((h) => <li key={h}>{h}</li>)}</ul>
          </div>
        ))}
      </Section>
      <Section title="Rates of exchange" id="fx">
        {pv.parities.map((p) => <Leader key={p.pair} k={<>{p.text.split(' = ')[0]} <Cite c={p.citation} /></>}>{p.text.split(' = ')[1]}</Leader>)}
      </Section>
      <Section title="Account" id="entries">
        {pv.entries.length ? (
          <ol class="account">
            {pv.entries.map((e, i) => <li key={i}><T c={e.at} /><span class="acc-what">{e.what}</span><span class="dots" aria-hidden="true" /><span class="amt">{e.amount}</span></li>)}
          </ol>
        ) : <Empty>Nothing spent or received yet.</Empty>}
      </Section>
    </div>
  );
}

function Offer({ o, ctl }: { o: OfferView; ctl: Ctl }) {
  const [err, setErr] = useState<string | null>(null);
  return (
    <li class={`offer offer-${o.status}`}>
      <p class="offer-h"><span class="offer-name">{o.name.replace(/^(the|an?) /, '')}</span> <span class="amt">{o.pay}</span> <span class="offer-status">{o.status}</span></p>
      {o.rival !== null ? <p class="sec-note">{o.rival ? 'A rival delivered it.' : 'Nobody took it.'}</p> : null}
      <ol class="stages">
        {o.stages.map((st) => (
          <li key={st.index} class={st.done ? 'done' : st.reachable ? '' : 'out'}>
            <span class="st-n">{st.index + 1}</span>
            <span class="st-city">{st.cityName}</span>
            <span class="st-win"><T c={st.open} date />–<T c={st.close} /></span>
            <span class="st-ea">{st.done ? <>done <T c={st.done} /></> : o.status !== 'held' && o.status !== 'open' ? null : st.earliestArrival ? <>earliest there <T c={st.earliestArrival} date /></> : 'no way there you know of'}</span>
          </li>
        ))}
      </ol>
      {o.accept ? (
        <p><button type="button" class="btn btn-small" id={`accept-${o.id}`} disabled={!o.accept.legal} title={o.accept.error ?? undefined} onClick={() => setErr(ctl.send({ type: 'acceptOffer', offerId: o.id }))}>Accept</button>
          {!o.accept.legal && o.accept.error ? <span class="act-why"> {o.accept.error}</span> : null}</p>
      ) : null}
      <Refusal text={err} />
    </li>
  );
}

export function Letters({ inp, ctl }: { inp: Inputs; ctl: Ctl }) {
  const cv = useMemo(() => commissionsView(inp.p, inp.d), [inp.v]);
  return (
    <div class="letters">
      <ScreenHead title="Commissions" sub="Each meeting has a window. The earliest arrival is reckoned on the trains you know of." />
      <Section title="Held" id="held">{cv.held.length ? <ol class="offers">{cv.held.map((o) => <Offer key={o.id} o={o} ctl={ctl} />)}</ol> : <Empty>None held.</Empty>}</Section>
      <Section title="Offered" id="open" note="Offers come by post; collect poste restante to read them.">{cv.open.length ? <ol class="offers">{cv.open.map((o) => <Offer key={o.id} o={o} ctl={ctl} />)}</ol> : <Empty>No open offer.</Empty>}</Section>
      {cv.closed.length ? <Section title="Closed" id="closed"><ol class="offers">{cv.closed.map((o) => <Offer key={o.id} o={o} ctl={ctl} />)}</ol></Section> : null}
    </div>
  );
}

const GHOST_WORD: Record<string, string> = { withdrawn: 'withdrawn', retimed: 'retimed', notThatDay: 'not that day', suspended: 'suspended', ok: 'ran' };

export function Shelf({ inp, ctl }: { inp: Inputs; ctl: Ctl }) {
  const sv = useMemo(() => shelfView(inp.p, inp.d), [inp.v]);
  const buy = useMemo(() => actionsView(inp.p, inp.d).filter((a) => a.cmd.type === 'planVerb' && a.cmd.verb === 'buyGuide'), [inp.v]);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div class="shelf">
      <ScreenHead title="Guide shelf" sub="The planner reads the newest edition you own that is in force on each travel day." />
      <Section title="On the shelf" id="owned">
        <ul class="books">
          {sv.owned.map((e) => (
            <li key={e.edition} class={`book${e.inForceToday ? ' in-force' : ''}`}>
              <p class="book-t">{e.label}</p>
              <p class="book-m">valid {e.validFrom}{e.validTo ? ` to ${e.validTo}` : ' onward'}{e.inForceToday ? ' · in force today' : ''}</p>
              <p class="book-m">bought {e.boughtAt}, {e.boughtIn}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="At the bookstall" id="sale">
        {sv.onSale.length ? sv.onSale.map((o) => {
          const act = buy.find((a) => a.cmd.type === 'planVerb' && (a.cmd.args as { edition?: string }).edition === o.edition);
          return (
            <div key={o.edition} class="sale">
              <Leader k={o.label}>{o.price}</Leader>
              {act ? <button type="button" class="btn btn-small" id={`buy-${o.edition}`} disabled={!act.legal} onClick={() => { const e = ctl.send(act.cmd); setErr(e); if (!e) ctl.go('diary'); }}>Buy (enter in the diary)</button> : <span class="act-why">{o.error ?? ''}</span>}
            </div>
          );
        }) : <Empty>No bookstall here, or nothing on sale.</Empty>}
        <Refusal text={err} />
      </Section>
      <Section title="Learned outside the guides" id="learned">
        {sv.learned.length ? (
          <ul class="learned">{sv.learned.map((l, i) => <li key={i}><b>{l.trainNo}</b> · {l.source}, {l.learnedOn} · {l.runs ? `runs (${l.confidence}‰)` : 'does not run'}</li>)}</ul>
        ) : <Empty>Nothing yet. Porters, boards and telegrams teach what guides do not.</Empty>}
      </Section>
      <Section title="Ghosts met" id="ghosts">
        {sv.ghosts.length ? <ul class="learned">{sv.ghosts.map((g, i) => <li key={i}>{g.at}: <b>{g.trainNo}</b> was {GHOST_WORD[g.status] ?? g.status}</li>)}</ul> : <Empty>No train has failed you yet.</Empty>}
      </Section>
    </div>
  );
}
