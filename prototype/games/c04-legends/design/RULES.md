# C04 The Legend Portfolio — rules specification (MVP)

Binding scope: `PLAN.md` § "C04 The Legend Portfolio", the C04 pitch and its engine, history and hook audits. Mechanics only. **No historical value here is data:** every date, hour, price, lag, institution name and timetable fact is a parameter or timetable row to be transcribed and cited (`DATA_NEEDS.md`); "e.g. … (to verify)" is orientation only. Rule constants are design values `DV-C04-NNN` (§6). Integers only: per-mille (‰), minor units (GBP farthings, DEM pfennig, NLG cents), seconds (`Instant`). Every random draw is a keyed draw named in §5.

## 1. Purpose

**Question.** If cover identities are separately maintained assets, each writing dated records into one store, and a hunting service joins two names only when *it* holds records of both, finds shared evidence, and cannot rule out one body on the timetable *it* knows, do players plan circuits around that, value the names they build, and play on after losing one?

`module.metrics(sim)` reads state, `sim.trace` and `sim.log` of a replayed save. Questionnaire answers enter state through the `Answer` command. Thresholds are analysis thresholds over the playtest set, not rule constants.

| Hypothesis | Metric id | Definition | Supported if |
|---|---|---|---|
| H04-1 Burning a deep legend hurts; clean retirement preferred | `H04-1.cleanExitShare` | Exits with depth ≥ DV-C04-027: retired ÷ (retired + burnt + vanished). *Vanished*: not retired or burnt, residence got `PoliceQuery{reason:'lapse'}`, no body act for ≥ DV-C04-028. `null` if none | pooled ≥ 0.60 |
| | `H04-1.hurt` | `answers.q1` (1–5) "Losing a legend felt like losing something I had built" | median ≥ 4 where a legend was burnt or vanished |
| H04-2 Hand-overs planned with the indicator green | `H04-2.greenShare` | `handover` traces with `level:'green'` ÷ all (§5.2); `null` if < 2 | pooled ≥ 0.50 |
| | `H04-2.plannedShare` | Hand-overs whose last preceding `Travel` had `plannedWithBand:true` ÷ hand-overs | pooled ≥ 0.60 |
| H04-3 Upkeep reads as planning, not chores | `H04-3.lapseShare` | `tallies.lapsed ÷ tallies.due` | ≤ 0.15 |
| | `H04-3.oppTakeShare` | `tallies.oppTaken ÷ tallies.oppMade` | ≥ 0.40 |
| | `H04-3.chore` | `answers.q2` "Rent days and mail felt like planning rather than chores" | median ≥ 4 |
| H04-4 Players continue after a link or burn | `H04-4.continued` | First loss = earliest `LinkNoticed`, `Burn` or vanish. `true` if afterwards ≥ 3 `Act`/`Travel` commands and ≥ 14 days of sim time (or an ending); `null` if no loss | `true` in ≥ 0.70 of saves with a loss |
| H04-5 Players act on nationality before the regime flips | `H04-5.protectedShare` | Affected (legend, flip) pairs protected before the flip ÷ affected pairs. Flip = a `passport.required`, `exit.permitted`, `internment` or `enemyProperty` row starting in the run. Affected = residence, account or last body presence in the row's jurisdiction (and listed nationality, except the decree). Protected = retired, burnt, account closed or drawn to ≤ 10 % of its level 14 days earlier, body left with the papers, or (decree) valid passport at the next crossing | ≥ 0.50 |
| | `H04-5.assetsLost` | `tallies.assetsLost` (GBP farthings at the day's parity) | descriptive |
| H04-6 Escapes by unknown connections are explicable | `H04-6.escapes` | Count of `escape` traces (§5.6) | descriptive |
| | `H04-6.understood` | `answers.q3` "When my names were kept apart or joined, the autopsy showed me why" | median ≥ 4 where ≥ 1 escape or link |
| | `H04-6.provenanceComplete` | Every link and escape carries records, sig, gate pairs and EA values | 100 % (else a bug) |

## 2. State

Plain JSON, no closures or Maps; lists sorted where order matters.

```ts
type LegendId = 'A' | 'B';                 // S0 uses 'B' only
type SvcId = 'svc.DE' | 'svc.GB';
type AddrId = string;                      // 'addr:res:A' | 'addr:res:B' | 'addr:PR:<city>' | 'addr:cover:<n>'
type PlaceId = string;                     // 'res:A' | 'res:B' | 'bank:A' | 'bank:B' | 'hotel:<city>:<n>' (generic)

interface C04State {
  v: 1;
  scen: { id: string; controlFrom: Instant; ending: Ending | null };
  body: { at: { city: string; station: string | null } | { journey: number; leg: number };
          busyUntil: Instant; cash: { GBP: number; DEM: number; NLG: number };
          carrying: LegendId[]; last: { legend: LegendId; rec: number } | null };
  legends: Record<LegendId, Legend>;
  staff: Record<string, Staff>;
  places: Record<PlaceId, { city: string; kind: 'hotel' | 'residence' | 'bank'; seen: Partial<Record<LegendId, Instant>> }>;
  journeys: Journey[];                     // {id, legend, legs, ticketObj, seqs, status}
  obligations: Record<string, Obligation>; errands: Errand[];   // errand {id, staff, kind, at, amount, seq}
  texture: Record<LegendId, { doneTo: Instant; mail: MailItem[] }>; opportunities: Opportunity[];
  services: Record<SvcId, Service>;        // HIDDEN
  links: LinkProv[]; queries: QueryProv[]; // HIDDEN: {svc, names, at, episodes, gate pairs, EA} / {svc, legend, place, reason, records}
  notices: Notice[];
  tallies: { due: number; lapsed: number; oppMade: number; oppTaken: number; assetsLost: number };
  answers: Record<string, number> | null;
  ids: Record<'journey' | 'obj' | 'search' | 'query' | 'opp' | 'link' | 'errand', number>;
}
interface Legend {
  id: LegendId; state: 'live' | 'retiring' | 'retired' | 'burnt';   // resting derived; linked = linkedBy ≠ []
  nationality: string; passport: { id: string; issued: Instant; validTo: Instant; photo: boolean } | null;
  papersAt: 'body' | PlaceId | 'destroyed';
  residence: { place: PlaceId; city: string; addr: AddrId; kind: 'flat' | 'address'; registeredRec: number | null } | null;
  account: { place: PlaceId; cur: Currency; bal: number; frozen: boolean; closed: boolean } | null;
  keyword: string; cover: AddrId; forwardTo: AddrId | null;
  claims: Record<'residence' | 'finance' | 'work' | 'social' | 'papers', { w: number; fedAt: Instant }>;
  lastActAt: Instant; retire: { forwardTo: AddrId; todo: RetireStep[] } | null;
  linkedBy: SvcId[];                                                  // HIDDEN
  exit: { kind: 'retired' | 'burnt' | 'vanished'; at: Instant; depth: number } | null;
}
interface Staff { id: string; legend: LegendId; place: PlaceId; float: number; knownAddrs: AddrId[];
                  proxyRecs: number[]; unpaid: boolean; lastSawBody: Instant; dismissed: boolean }
interface Obligation { id: string; legend: LegendId; kind: 'rent' | 'wage' | 'addrFee'; cur: Currency; amount: number;
                       nextDue: Instant; instance: number; payer: 'self' | 'staff'; paidThrough: number; dueSeq: number; lapseSeq: number | null }
interface Service {                                                   // HIDDEN; one shape, two rows
  id: SvcId; jurisdictions: string[]; kg: KnownGraph;                 // kit/timetable/knowledge
  view: number[]; discredited: number[];                              // delivered ids; proxy records exposed by testimony
  pairs: Record<string, { status: 'none' | 'apart' | 'candidate' | 'linked'; since: Instant; last: PairEval }>;
  wanted: Partial<Record<LegendId, Instant>>;
}
```

**Hidden:** `services`, `links` (until `LinkNoticed`), `queries`, `linkedBy`, reveal outcomes, and every record with `value.by ∈ {'world','service'}`. The UI imports only `views/`. Views read legends (minus `linkedBy`), body, staff, obligations, errands, texture, opportunities, notices, `params.publicView()`, the timetable, and the **own trail**: `ownTrail(store, legendIds).records` filtered to `value.by ∈ {'body','proxy'}`. `views/autopsy.ts` reads hidden state only after the ending, or for one link after its `LinkNoticed`.

## 3. Commands

Common validation: no ending; `Act`/`Travel` need `now ≥ busyUntil`, body not on a journey, legend `live` (`retiring` for retire steps). Records are emitted at apply with `time = now`, so eager delivery equals lazy `arrival`; state effects land at `ActDone`.

| Command | Payload | Validation | Effect / events | Records | Cost |
|---|---|---|---|---|---|
| `Act` | `{legend, verb, …args}` | verb table; opening hours from `bank.hours`, `police.hours`, `post.hours`, `passport.hours` | `busyUntil = now + DV-029[verb]`; `ActDone`; claims fed (DV-025); `seen[place][legend] = now`; hand-over check | per verb | per verb |
| `Travel` | `{legend, legs:[{trip, day, from, to}], cls, pay:'cash'\|'account', carry: LegendId[], declareAddr?, plannedWithBand}` | truth trips running that day (`truthView` with `service.suspension`); changes respect `minChange` or a transfer; starts in the body's city; `legend ∈ carry`; carried papers at hand; uncarried papers need a residence here; a cited fare row per leg (no design fallback) and funds | pay; stash uncarried papers; schedule `LegDepart`/`LegArrive` per leg and `FrontierCheck` at frontier stops with a `control.active` row | `bank.txn` + `obj:ticket:<n>` if by account; `manifest.entry` at boarding if `ticket.named` | cited fare |
| `Errand` | `{staff, kind:'deposit'\|'payRent', at, amount?}` | staff of a live legend; `now ≤ at ≤ now + DV-037`; inside opening hours; deposit ≤ float; next rent unpaid | `ErrandDone` at `at` | proxy record then | float |
| `Delegate` | `{obligation, payer}` | live legend; staff exists for `'staff'` | set payer (immediate; MVP) | — | — |
| `Forward` | `{legend, to \| null}` | staff or address keeper; own address or poste restante | `forwardTo`; staff `knownAddrs += to` | — | — |
| `SetKeyword` / `SetCover` | `{legend, keyword}` / `{legend, cover}` | `K1…K6` / `addr:cover:1…4` (abstract tokens) | set | — | — |
| `Retire` | `{legend, forwardTo}` | live | `retiring`; `todo` (§5.9) | — | — |
| `Burn` | `{legend}` | live or retiring | burn walk (§5.9) | — | account, depth |
| `WaitUntil` | `{at}` | `at > now` | `kit.Wake` | — | — |
| `DeclareHaven` | `{}` | haven condition (§5.11) | ending `haven` | — | — |
| `Answer` | `{q1, q2, q3}` (1–5) | ending set; once | `answers` | — | — |

| Verb | Where / args | Extra validation | Effect at `ActDone` | Records | Cost |
|---|---|---|---|---|---|
| `lodge` | hotel slot here, `{slot, nights}` | slot ≤ DV-032 | lodged | `hotel.stay`; `reg.hotelSlip` (DE) or `reg.foreigner` (NL) per `reg.coverage` | `price.hotel` × nights |
| `draw` / `deposit` | `bank:<legend>`, `{amount}` | open, not frozen, funds | account ⇄ cash | `bank.txn` | — |
| `exchange` | any, `{from, to, amount}` | parity row for the day | `money.convert` − DV-033 | none (anonymous) | commission |
| `work` | legend's city | once a day | + DV-030 to account | `work.day` | — |
| `attendMail` | residence or `forwardTo` city | — | texture materialised, pile answered | `mail.answered` | postage |
| `pay` | creditor place, `{obligation}` | next instance unpaid | `paidThrough++` | `receipt` (in person) | amount |
| `float` | residence, `{amount}` | staff present | cash → float | — | amount |
| `establish` | `{what: account\|flat\|address\|staff}` | one each | account / residence + rent or fee obligation / staff + wage obligation | `bank.txn` / `lease` / `addr.contract` / — | first instance |
| `register` | police registration office | flat where `reg.coverage.residents`; papers on body | `registeredRec` | `reg.anmeldung` | — |
| `renewPassport` | passport office or consulate | papers on body | new passport, `validTo += passport.validity`, `photo` if `passport.photo` in force | `passport.issued` | `passport.fee` |
| `takeOpportunity` | `{opp}` | unexpired, city | per DV-039 row; `oppTaken++` | `work.day` / `social.intro` | — |
| `report` | any | once per legend a day | + DV-031[city] points | `letter.report`; sampled `censor.copy` | postage |
| `retireStep` | `{step}` at its place | step ∈ `todo` | step done; empty → `retired` | `lease.notice` / `reg.abmeldung` / `bank.txn` / — / `addr.cancel` | rent to notice date; wages to notice |

**Records.** `subject` = legend; `place` = city; `value.by ∈ body|proxy|world|service`; `value.anchor = {city, at}` (content time; differs from `time` only for copies and testimony); `value.trainKey/edition` where a train is named. **Presence-grade** = kind marked P, confidence ≥ DV-004, id not in the reader's `discredited`. Confidences: in person DV-008, proxy DV-009, others DV-010.

| Kind | Predicate | Source | P | Sigs | Read by (rows) |
|---|---|---|---|---|---|
| `reg.anmeldung` / `reg.abmeldung` | registeredAt / deregisteredTo | `DE.<city>.police-reg` | P | `addr:<flat>` / `addr:<forwardTo>`, `pass` | `svc.DE` |
| `reg.hotelSlip` | lodgedAt | `DE.<city>.police-reg` | P | `addr:<declared residence>` | `svc.DE` |
| `reg.foreigner` | lodgedAt | `NL.<city>.police` | P | `addr`, `pass` | design wartime rows → both |
| `hotel.stay`, `work.day`, `social.intro` | lodgedAt / worked | `priv.hotel.<slot>` / `priv.client.<L>` | P | — | none |
| `bank.txn` | drew / paid / opened / closed | `priv.bank.<L>` | P | `acct:<L>`, `obj:ticket:<n>` | none; copied at query |
| `receipt`, `lease`, `addr.contract`, `lease.notice`, `addr.cancel` | paid / contracted / gaveNotice | `priv.landlord.<place>` / `priv.addrkeeper.<place>` | P | `addr:<place>`; cancel `addr:<forwardTo>` | none; copied at query |
| `mail.answered`, `letter.report` | wrote | `priv.post.<city>` | — | `addr:<from>`; report `kw`, `addr:<cover>` | none |
| `censor.copy` | intercepted | `DE.censor` / `GB.censor` | — | the letter's | `svc.DE` / `svc.GB` |
| `passport.issued` | issued | `GB.passport` / `GB.consulate.<city>` | P | `pass`, `desc:body`, `photo:body` (rule) | `svc.GB` (design, retro) |
| `frontier.passport` | crossed | `DE.frontier` | P | `pass`, `desc:body`, `obj:ticket` | `svc.DE` |
| `port.control` | landed / embarked | `GB.ports` | P | `pass`, `desc:body`, `obj:ticket`, `addr:<declareAddr>` (DV-043) | `svc.GB` |
| `manifest.entry` | booked | `priv.operator.<op>` | P | `obj:ticket` | none |
| `search.found` | searched / papersFound | control source, or the querying service | P for the presented legend only | `obj:search:<n>`, `kw`, `pass`; at a residence also `addr:<place>` | that service |
| `copy` | copied | `svc.*` | as original | original's | own service |
| `testimony` | testified | `svc.*` | — | `wit:<place>`, `addr:<knownAddrs>`; `value.discredits` | own service |
| `enemyProp.notice`, `internment.order` | administered / ordered | `DE.enemyProp` / `DE.<city>.police-reg` | — | `acct`, `addr` | `svc.DE` |

## 4. Events

Kit order: (time, priority, seq), lower priority first.

| Type | Prio | Payload | Handler → follow-ons |
|---|---|---|---|
| `kit.World` | 0 | `{id}` | scheduled in `init` (`calendarWindow`, `worldEventInstant`); public `Notice` |
| `kit.ParamChanged` | 1 | `{day, started, ended}` | `regimes.onRows` → `PoliceQuery`, `ArrestAttempt` |
| `c04.EditionIssued` | 2 | `{edition}` | scheduled in `init` at each edition's issue day in the window; `services.addEdition` (with blind entries) |
| `kit.RecordDelivered` | 10 | `{rec, reader}` | `services.onDelivered` → `linkage.onDelivery` → `ArrestAttempt`, `WantedIssued`, `LinkNoticed` |
| `c04.ArrestAttempt` | 11 | `{svc, city, reason}` | body in `city`, not travelling → ending `captured`; else `Notice` of enquiries |
| `c04.ServiceReview` | 12 | `{svc}` | `linkage.review`; next at + DV-012 |
| `c04.WantedIssued` | 13 | `{svc, link}` | `wanted[X] = wanted[Y] = now` |
| `c04.PoliceQuery` | 15 | `{svc, legend, place, reason, qid}` | §5.9 |
| `c04.FrontierCheck` | 20 | `{journey, leg, station}` | §5.3; refusal cancels later seqs |
| `c04.LegArrive` / `c04.LegDepart` | 21 / 22 | `{journey, leg}` | move body; last leg → `upkeep.materialise` for legends resident here |
| `c04.ActDone` / `c04.ErrandDone` | 30 / 31 | `{…}` | verb effect / proxy record, `staff.proxyRecs += id` |
| `c04.ObligationDue` / `c04.ObligationLapse` | 40 / 41 | `{obligation, instance}` | §5.4 |
| `c04.OpportunityExpires` | 60 | `{opp}` | expire |
| `c04.LinkNoticed` | 70 | `{link}` | `Notice` naming the two legends and service; Autopsy entry |
| `c04.ScenarioEnd` | 90 | `{}` | scheduled in `init` at `scenario.end`; §5.11 |
| `kit.Wake` | — | — | no handler |

## 5. Rule modules

`games/c04-legends/src/rules/`. Hypotheses served in each heading.

### 5.1 `legends` — H04-1, H04-4
States `live → retiring → retired`; `live|retiring → burnt`. `resting` is derived (`now − lastActAt ≥ DV-028`), `linked` is `linkedBy ≠ []`. Depth is lazy and integer, computed on query only:
```
decayed(c, t) = c.w >> min(31, floor((t − c.fedAt) / DV-024[kind]))
depth(L, t)   = Σ kinds decayed(L.claims[kind], t)
feed(L, kind, n, t): c.w = min(DV-026, decayed(c, t) + n); c.fedAt = t
```

### 5.2 `acts` (with travel) — H04-2, H04-6
- `recordsFor(stateView, cmd, now)` is pure and returns the records an `Act` or `Travel` would emit; `apply` emits exactly these; ActAs previews with the same call.
- **Hand-over:** when a P record with `by:'body'` is emitted under Y and `body.last.legend = X ≠ Y`, `trace('handover', {from:X, to:Y, level: indicator.level(…), rec})`; then `body.last = {Y, rec}`.
- **Travel:** no delay model; the body follows truth trips at scheduled times. Tickets paid by account write `obj:ticket:<n>` under the payer; named tickets (`ticket.named`, else DV-044) write `manifest.entry` under the presenter with the same sig, so a ticket bought by B and presented by A shares a sig.
- Every act marks its place as having seen the legend (witnesses, §5.9).
- Kit: `plan.itineraries`, `truthView`, `money.convert`, `ctx.emit`. No draws.

### 5.3 `regimes` — H04-5
Reads dated rows only; no date in code.

| Param | Read at | Rule |
|---|---|---|
| `reg.coverage` | `lodge`, `register` | emits slips; whether residents must register and within what lag |
| `control.active` | `FrontierCheck` | control source at this stop; passport check; may search |
| `passport.required` | `FrontierCheck` | presented legend needs `validTo > now`, else refused: `Notice`, journey cancelled, body in the frontier station's city |
| `exit.permitted` | `FrontierCheck` leaving | `false` for the presented nationality → refused and `ArrestAttempt{reason:'internment'}` now |
| `internment` | row start | if DV-042: listed-nationality legends registered there → `wanted[L] = now` in that service, `ArrestAttempt` at the residence city at + DV-014 |
| `enemyProperty` | row start | listed-nationality accounts there frozen (`assetsLost += bal`), `enemyProp.notice`, residence administered → `PoliceQuery{reason:'enemyProperty'}` at + DV-018 |
| `passport.photo` | `renewPassport` | adds `photo:body` |
| `censorship` | `report` | `ctx.chance(DV-023, 'censor', recId, censorSource)` → `censor.copy` |
| `war.state` | derived | which nationalities are enemy (display) |

`FrontierCheck` under a control writes `frontier.passport` or `port.control` for the presented legend (with `trainKey`), then `ctx.chance(DV-022.atControl, 'search', journeyId, leg, station)`; if searched, one `search.found` per legend whose papers are carried, sharing `obj:search:<n>`.

### 5.4 `upkeep` — H04-3
Obligations come from `establish` or setup; rent dates from `rent.terms`, address fees from `addr.terms`, wages monthly. Records of unattended legends are emitted on their dates:
```
ObligationDue(o, i): tallies.due++; schedule ObligationDue(o, i+1)
  if legend not live/retiring or o.paidThrough ≥ i: return
  if o.payer == 'staff' and float ≥ amount:
     float −= amount; emit receipt{by:'proxy'} at due day + DV-036 local; staff.proxyRecs += id; feed(residence, 50)
  else schedule ObligationLapse(o, i) at due + (cited grace ?? DV-035)
ObligationLapse(o, i): if paid return; tallies.lapsed++; if wage: staff.unpaid = true
  if rent of a registered flat in a service's jurisdiction: PoliceQuery{svc, L, place, 'lapse'} at now + DV-018
```
Texture is materialised lazily with keyed draws, so any arrival day yields the same items:
```
materialise(L, now):                     // LegArrive in L's residence city, or attendMail at forwardTo
  for absolute week w in (doneTo, now]: n = ctx.below(DV-038.max + 1, 'mail', L, w); kind j: ctx.pick(cdf, 'mailKind', L, w, j)
  for obligation instance (o, i) due in (doneTo, now]:
     k = ctx.pick(DV-039 cdf, 'opp', L, o.id, i); add Opportunity, oppMade++, OpportunityExpires at + DV-039.expiry
  doneTo = now
```
Every obligation instance yields at least one opportunity. `ErrandDone`: `deposit` (float → account, `bank.txn{by:'proxy'}`) or `payRent` (`receipt{by:'proxy'}`, `paidThrough++`). Errands are how a player places a name somewhere the body is not; each raises the staff reveal chance (§5.9).

### 5.5 `services` — H04-4, H04-6
One code path; the two services differ only in rows: jurisdictions, coop edges, blind operators (DV-011), review cadence. No particle belief (`kit/hunter` is for C07 and C01): the hunt is the rule-based linkage below.
- `init`: `ctx.subscribe(svc, {})`; `kg = newKnownGraph(svc, editions issued ≤ start)`; for each trip whose operator ∈ DV-011[svc], `learn(kg, {trainKey, edition, source:'guide', learnedDay, confidence:0})` (the kit's not-running entry, used as "not known"). `EditionIssued` repeats this for new editions. First `ServiceReview` at start + DV-012.
- `onDelivered(S, rec)`: `view.push`; `discredited += rec.value.discredits`; if `trainKey`, `learn(…, source:'observed', confidence: DV-015)`; if P and `wanted[subject] ≤ now` → `ArrestAttempt{S, anchor.city}` at now + DV-014; `linkage.onDelivery`.
- Kit: `records/delivery` (`subscribe`, `arrival`, `delivered`), `records/readers` (coop rows), `timetable/knowledge`.

### 5.6 `linkage` — H04-2, H04-4, H04-6
Per service, on each delivery, over that service's delivered view only.
```
onDelivery(S, rec): for Y in legendsIn(S.view) sorted, Y ≠ rec.subject: evaluate(S, rec.subject, Y, false)
review(S):          for each pair in S.view: evaluate(S, X, Y, true)
evaluate(S, X, Y, review):
  if S.pairs[X|Y].status == 'linked': return                    // links are permanent
  RX, RY = records of X, Y in S.view
  P      = presence-grade anchors of RX ∪ RY merged by (at, id); cross = consecutive pairs with different subjects
  latest = last(cross)
  for class c in [obj, addr, kw, wit] (+ [photo, desc] if review), for sig σ of c in both RX and RY (sorted):
     (rx, ry) = carriers of σ with minimal |Δat| (ties: lower ids)
     win  = cross pairs with an end within DV-005 of rx.at or ry.at
     veto = first pair in win with alibi.compatible(knownView(S.kg), p, q).ok == false
     if veto and alibi.compatible(publicView, veto).ok: trace('escape', {S, X, Y, σ, veto, ea})
  score  = Σ_c max(DV-006[c] over unvetoed episodes of class c)
  status = score ≥ DV-007 ? 'linked' : !latest ? 'none' : compatible(latest) ? 'candidate' : 'apart'
  store PairEval; trace('pair'); if linked: links.push(provenance); linkedBy += S;
     WantedIssued at + DV-013; LinkNoticed at + DV-016
```
Compatibility is a gate (veto) and never adds score: a pair with no shared sig is at most a `candidate`. No draws.

### 5.7 `alibi` — H04-2, H04-6
Pure; imports only kit `timetable/*` and `time/*`; used by `linkage` (service graph) and `indicator` (public view).
```
compatible(view, p, q):                                   // p.at ≤ q.at
  if p.city == q.city or q.at − p.at ≥ DV-003: ok
  if a day in [p.at, q.at] is outside corridor coverage: ok   // a source gap cannot prove impossibility
  tDep = p.at + DV-001; tNeed = q.at − DV-002; if tNeed < tDep: not ok
  ea = min over s ∈ stationsOfCity(p.city) of cache.earliestAny(view, s, tDep, stationsOfCity(q.city))
  return {ok: ea ≤ tNeed, ea}
```
Earliest arrival on scheduled times with footpaths and per-station minimum change (`ProfileCache`, horizon DV-003); never realised delays, never the body's own itinerary. Services use `knownView(tt, kg)`. The **public view** is a game `GraphView`: `uses(trip, day) = edition.issueDay ≤ day && printedRuns(trip, day)` over every issued edition (stale ones too), a superset of any service's graph; key `pub:<count of issued editions>`. The cache is a memo outside state; EA values stored in state are integers or `null`.

### 5.8 `indicator` — H04-2
Imports only `rules/alibi`, `rules/evidence` (the pure sig/episode code shared with `linkage`), kit `timetable/*`, `PublicParams` and record types — never `records/store`, `rules/services`, `rules/linkage` or `kit/hunter` (static check). Input: the own trail, scheduled own records (pending errands and staff payments within DV-005), prospective records from `acts.recordsFor`, the public view.

`level` runs `evaluate` for the acting legend against each other legend on that input, with all six classes: **red** if any pair reaches DV-007 (a service holding both could link); else **amber** if the latest cross pair is compatible (a candidate at worst); else **green** (incompatible on every issued timetable, so no service can join the names here). Worst case = one service holding every own record and every issued timetable; records are taken as written (the staff reveal risk is shown in the ledger). **Circuit band:** for the other legend's last own presence `r` and the acting legend in city c, acts as the acting legend are incompatible in the open interval `(tRev, tFwd)`: `tFwd` from public EA leaving `r`; `tRev` = latest t with public EA(c, t) ≤ `r.at`, by binary search (EA is monotone in t).

### 5.9 `burnRetire` — H04-1
Dependencies: residence (with staff), account, address keeper, places with `seen[L]`.

**Retire:** `todo` = `notice` (effective at the next `rent.terms` date at least `rent.notice` ahead; rent until then due), `abmelden` (if registered; `reg.abmeldung` with `addr:<forwardTo>`), `closeAccount`, `dismiss` (wages to the cited notice or DV-041), `cancelAddress`, each in person. When done: `retired`, obligations cancelled, no query ever scheduled. The forwarding address is a sig; forwarding to the other legend's address creates `addr` evidence wherever both meet.

**Burn:** `burnt`; `exit` recorded; papers destroyed; account forfeited (`assetsLost`); errands cancelled; obligations unpaid from now (lapses follow); staff `unpaid`. Walk: for each service S with a record of L in `S.view`, and each dependency in S's jurisdictions, `PoliceQuery{S, L, place, 'burn'}` at `min(next lapse, now + DV-019) + DV-018`. An abandoned legend reaches the same queries through its lapses (vanishing).
```
PoliceQuery(S, L, place, reason, qid):        // records: source S, by:'service'
  copy each priv.* record of L held at place (and L's bank.txn if place is its bank), anchor = original
  for staff s at place:
     pm = min(1000, DV-020.base + DV-020.perErrand·|s.proxyRecs| + (s.unpaid ? DV-020.unpaid : 0))
     testimony{L, addr:<s.knownAddrs>, discredits: ctx.chance(pm, 'reveal', s.id, qid) ? s.proxyRecs : []}
  for L2 in place.seen (sorted): if ctx.chance(DV-021, 'recall', place, L2, qid): testimony{L2, wit:<place>, anchor seen[L2]}
  if residence and ctx.chance(DV-022.atQuery, 'search', 'query', qid):
     search.found{L, obj:search:<n>, addr:<place>} and one per L2 with papersAt == place {L2, obj:search:<n>, kw:<L2>, pass}
```

### 5.10 `ledger` — H04-1, H04-3
Per legend: account, float, obligations (next due, payer, lapse date), monthly burn, depth now and per claim, staff errand count, own-trail rows with the services public rows say may read them, noticed links. Net worth via the day's `parity` rows (`money.convert`, BigInt). Material points. No draws.

### 5.11 `endings` — H04-4
| Ending | Condition |
|---|---|
| `captured` | `ArrestAttempt` finds the body in its city |
| `noName` | no legend `live` or `retiring` |
| `haven` | `DeclareHaven`, or at `ScenarioEnd`: body in a DV-045 city and `body.last.legend` live, not linked or wanted by any service whose jurisdictions include that city |
| `atLarge` | `ScenarioEnd` otherwise |

Score shown, no pass mark: depth of retired legends at exit + depth of clean live legends + net worth (GBP) + material points. `ScenarioEnd` = min(design end, last corridor-coverage day + 1); past coverage no truth trip exists, so travel stops and the Circuit shows the source gap.

## 6. Design values

Proposed; none is history. They go to `design/design-values.json` and are listed on About.

| Id | Name | Value | Unit | Range | Rationale | Used by |
|---|---|---|---|---|---|---|
| DV-C04-001 | alibi.egressSec | 1800 | s | 0–3600 | Record place to departure station | alibi |
| DV-C04-002 | alibi.accessSec | 1800 | s | 0–3600 | Arrival station to record place | alibi |
| DV-C04-003 | alibi.horizonSec | 345600 | s | 172800–604800 | Beyond it any corridor pair is reachable; bounds queries | alibi |
| DV-C04-004 | gate.minConfidence | 700 | ‰ | 500–900 | Only confident records place a body | linkage, indicator |
| DV-C04-005 | gate.windowSec | 604800 | s | 86400–2592000 | Alibis count near evidence, not forever | linkage, indicator |
| DV-C04-006 | evidence.weights | {obj:1000, kw:1000, photo:1000, addr:600, wit:600, desc:300} | points | 0–1000 | Object, keyword or photograph suffices; address or witness needs a second class; description never alone | linkage |
| DV-C04-007 | link.threshold | 1000 | points | 800–2000 | Pairs with the weights | linkage, indicator |
| DV-C04-008 | conf.inPerson | 950 | ‰ | 800–1000 | Signed in person | acts |
| DV-C04-009 | conf.proxy | 800 | ‰ | 600–950 | A receipt does not say who paid; keep ≥ DV-004 or errands are no alibi | upkeep |
| DV-C04-010 | conf.other | {letter:500, testimony:600, notice:900} | ‰ | 300–1000 | Non-presence records | acts, burnRetire |
| DV-C04-011 | svc.blindOperators | {svc.DE: steamer operators on Britain–Netherlands routes other than Harwich–Hook (to verify; ids at data freeze), svc.GB: []} | list | any subset | A known-graph gap with a source in data | services |
| DV-C04-012 | svc.reviewCadenceSec | 2419200 | s | 604800–7776000 | Photo and description matching is a filing review | services |
| DV-C04-013 | svc.wantedLagSec | 172800 | s | 0–1209600 | Time to act on a link | linkage |
| DV-C04-014 | svc.arrestResponseSec | 14400 | s | 3600–86400 | A record leads to a call at its place | services, regimes |
| DV-C04-015 | svc.learnConfidence | 1000 | ‰ | 500–1000 | A train seen in a record becomes known | services |
| DV-C04-016 | link.noticeLagSec | 604800 | s | 86400–2592000 | The player hears of enquiries later | linkage |
| DV-C04-017 | coop.design | design reach rows (DATA_NEEDS §2) | rows | — | Reach no source documents | params |
| DV-C04-018 | query.afterLapseSec | 259200 | s | 86400–1209600 | Landlord report to police visit | upkeep, burnRetire |
| DV-C04-019 | burn.absenceNoticeSec | 1209600 | s | 604800–2592000 | An abandoned flat is noticed before the term | burnRetire |
| DV-C04-020 | staff.reveal | {base:200, perErrand:100, unpaid:300} | ‰ | 0–500 / 0–300 / 0–600 | Errands teach the pattern; unpaid staff talk | burnRetire |
| DV-C04-021 | witness.recall | 900 | ‰ | 500–1000 | Places remember names | burnRetire |
| DV-C04-022 | search.permille | {atControl:100, atQuery:1000} | ‰ | 0–1000 | Controls search some; police search an abandoned flat | regimes, burnRetire |
| DV-C04-023 | censor.permille | 200 | ‰ | 0–1000 | Share of reports read | regimes |
| DV-C04-024 | depth.halfLifeSec | {residence:15552000, finance:7776000, work:5184000, social:3888000, papers:31536000} | s | ×0.5–×2 | Slow, legible decay | legends |
| DV-C04-025 | depth.feed | {flat:800 res, address:400 res, register:600 pap + 200 res, payInPerson:100 res, proxyPay:50 res, account:500 fin, txn:100 fin, work:150 wrk, mailLetter:30 soc, lodge:20 soc, passport:600 pap, intro:300 soc} | points | ×0.5–×2 | Acts that build a name | legends |
| DV-C04-026 | depth.cap | 2000 | points/claim | 1000–5000 | Bounds hoarding | legends |
| DV-C04-027 | depth.deep | 3000 | points | 2000–6000 | "Deep" for H04-1 and BurnRetire | ledger, metrics |
| DV-C04-028 | resting.afterSec | 2592000 | s | 1209600–7776000 | Derived resting label | legends, metrics |
| DV-C04-029 | act.durationSec | {lodge:1800, draw:2700, deposit:1800, exchange:900, work:28800, attendMail:1800+600/letter, pay:1800, float:900, account:3600, flat:14400, address:3600, staff:7200, register:3600, renewPassport:7200, report:3600, notice:1800, abmelden:3600, closeAccount:2700, dismiss:1800, cancelAddress:1800} | s | ×0.5–×2 | City-day pacing | acts |
| DV-C04-030 | work.incomeMinor | {A: GBP 960, B: DEM 1500} | minor/day | ×0.5–×2 | Means of support; not a historical wage | acts |
| DV-C04-031 | report.value | {BER:3, ROT:1, LON:1}, 1 per legend a day | points | 0–5 | Why a Berlin name is worth keeping | acts, endings |
| DV-C04-032 | hotel.slotsPerCity | 3 | count | 1–5 | Generic hotels; reuse makes witnesses | acts |
| DV-C04-033 | exchange.commission | 10 | ‰ | 0–30 | Changer's margin | ledger |
| DV-C04-034 | tt.defaultMinChangeSec | 900 | s | 300–1800 | Kit `TimetableOptions` where no row exists | alibi, acts |
| DV-C04-035 | obligation.graceSec | 604800 | s | 0–2592000 | Fallback when no cited grace | upkeep |
| DV-C04-036 | proxy.payLocalSec | 36000 | s after local midnight | 28800–64800 | Time of staff payments | upkeep |
| DV-C04-037 | errand.leadMaxSec | 1209600 | s | 86400–2592000 | Instructions reach two weeks ahead | upkeep |
| DV-C04-038 | mail.rate | {max:3/week; bill:3, invitation:2, business:3} | count, weights | 0–6 | Texture volume | upkeep |
| DV-C04-039 | opportunity.table | {offer w5: work day at 3× income; introduction w4: social +300, 7200 s; tip w3: next report in city ×2}; expiry 604800 s | — | — | ≥ 1 opportunity per obligation | upkeep |
| DV-C04-040 | price.fallback | {rentQuarter: DEM 25000, wageMonth: DEM 3000, addrFeeQuarter: GBP 480, farePerLeg: none (leg refused)} | minor | ×0.5–×2 | Only if no cited row; flagged on About | upkeep, acts |
| DV-C04-041 | staff.noticeSec | 1209600 | s | 0–2592000 | Fallback dismissal notice | burnRetire |
| DV-C04-042 | body.liableToInternment | true | bool | — | Lets internment rows bite | regimes |
| DV-C04-043 | port.recordsDeclaredAddress | true | bool | — | Fallback if no source says so | regimes |
| DV-C04-044 | ticket.namedFallback | {sleeper:true, steamerWartime:true, other:false} | bool | — | Fallback where no source says so | acts |
| DV-C04-045 | haven.jurisdictions | ["GB","NL"] | list | — | Where a clean name ends the campaign | endings |
| DV-C04-046 | setup.funds | {A: account GBP 192000, cash GBP 19200; B: account DEM 300000, cash DEM 20000} | minor | ×0.5–×2 | Runway before income matters | scenarios |
| DV-C04-047 | s0.passDepth | 1500 | points | 1000–3000 | Tutorial pass mark | scenarios |

## 7. Scenarios

Dates are set from data; windows are orientation.

| | S0 "One life" (tutorial) | S1 "Two lives" |
|---|---|---|
| Window | early October → mid-November 1913 | prologue from early October 1913; control from early January 1914; end late February/March 1915 or last coverage day + 1 |
| Setup | Legend B only (British-papered, valid passport), body at a Berlin station with B's papers and DV-046 funds; no residence | A: London accommodation address and account. B: Berlin flat, `reg.anmeldung`, housekeeper (rent delegated, float), Berlin account. Distinct keywords and covers. Body in London as A; B's papers at B's flat. All produced by `scenarios/scripts/s1-prologue.script.json` through ordinary commands, so the store holds their records; the UI replays it before control |
| Goals shown | establish the life (lodge, flat, register within the cited lag, account, staff, delegate), visit Rotterdam and return, keep mail answered | feed both names, plan hand-overs, take each through the July–August 1914 flips, end with a clean name in a haven |
| Win / lose | pass: B live, registered, no lapse, depth ≥ DV-047; Autopsy shows what `svc.DE` holds on B | §5.11 |
| World calendar | edition changes in the window | timetable changes (spring 1914, wartime); July 1914 crisis notices; German passport decree; mobilisations and declarations of war; exit restriction for enemy aliens in Germany; postal censorship (DE, GB); British port control; Aliens Restriction Order; German enemy-property ordinances; internment of British civilian men in Germany; British passport photograph rule; wartime sailing suspensions |

Test fixtures are S1 variants (setup changes and `paramOverrides` with ids `T-C04-*`, design basis); never in the menu.

## 8. Tests

Script → log → golden hash, plus assertions in `test/rules/`. After every test: **I1** each service's `view` equals `delivered(store, svc, now)`; **I2** every link's provenance records have `arrival(rec, svc) ≤ link.at`; **I3** linkage read no id outside `view` (trace audit); **I4** state holds integers only.

| # | Test | Script and overrides | Assertion |
|---|---|---|---|
| T1 | Berlin Tuesday / London Wednesday kept apart; Monday a candidate, no link | S1 spring 1914: body leaves Berlin Monday morning; A draws at the London bank Wednesday 10:00. (a) `Errand payRent` Tuesday afternoon in Berlin; (b) Monday afternoon. Forced reach `T-C04-R1`: `priv.landlord.res:B>svc.DE`, `priv.bank.A>svc.DE`, lag 0. Guard: `compatible(knownView(svc.DE))` is false for (a), true for (b) on the frozen bundle (else move the errand to the last afternoon before the next departure) | (a) `apart`, veto = (receipt, bank.txn), no link. (b) `candidate`, score 0, no link. (c) = (b) plus a shared `addr` sig and `T-C04-W1` (addr weight 1000) → `linked` |
| T2 | Escape by a boat unknown to one service, indicator amber | S1: B draws in Berlin; body crosses by a steamer whose operator is in DV-011[svc.DE]; A draws in London next morning; two days later a forced control searches the body carrying both papers. `T-C04-R2`: both services read both banks and the control; search 1000 | At A's draw `handover.level == 'amber'`. `svc.GB`: linked, episode `obj:search`, gate pair (B draw, A draw) compatible. `svc.DE`: `apart`, `escape` trace naming that pair. Variant: a forced record naming the boat reaches `svc.DE` → its next evaluation links |
| T3 | Unattended rent receipt on its date | S1: body in London from early March; rent delegated, float funded; run past the next Berlin term | `receipt{by:'proxy'}` for B at term day + DV-036, place Berlin, body in London; `readersOf` = its private source only. Arriving in Berlin on d1 (run 1) or d2 (run 2) materialises identical mail and opportunities; ≥ 1 opportunity per instance |
| T4 | Burn cascade vs clean retirement | S1 July 1914, A's papers at B's flat. (a) `Burn B`. (b) `Retire B{addr:PR:ROT}`, all steps | (a) `PoliceQuery` events at the computed instants; copies, testimony with `knownAddrs`, `search.found` for B and A sharing `obj:search` → `svc.DE` links A–B; account forfeited. (b) `reg.abmeldung` with `addr:PR:ROT`; no `PoliceQuery` for B ever; balance in cash; exit `retired` |
| T5 | Link only after delivery | S1 wartime: B lands at a British port carrying A's papers; control search forced (1000) | At the control time t the `search.found` records exist and `svc.GB` has no link; the link appears at their delivery (t + drawn `GB.ports` lag); `delivered(store, svc.GB, t_deliver − 1)` lacks them |
| T6 | German passport decree crossing | B crosses DE→NL on the day before and the first day `passport.required` is in force (expected 1 August 1914, to verify); variant with an expired passport | Before: no `frontier.passport`. On: one record for `svc.DE` with `pass`, `desc:body`, `trainKey`. Expired: refused, body in the frontier city, later legs cancelled, no record |
| T7 | February 1915 photograph review | A and B in Britain renew passports after `passport.photo` starts | No link at either delivery; link of class `photo` at the next `svc.GB` review. Only A renews → no link |
| T8 | Keyword in seized papers | S1 wartime: A and B share `K1`; A reports from London; B lands at a British port and is searched; censor and search permille 1000 | `svc.GB` links with episode `kw:K1`. Distinct keywords → no link |
| T9 | Indicator isolation | Any S1 run; recompute after adding service-only records to a cloned store | Same level and band; static import check of `rules/indicator.ts` |
| T10 | Regime flips | Account of B open at `enemyProperty` start; body in Berlin as B at `internment` start | Account frozen, `assetsLost` = balance; ending `captured`. Body gone before → no capture, `wanted[B]` set |
| T11 | Replay and golden | All scripts above, S0 and S1 playthroughs | Straight run = golden; restore at each monthly snapshot and finish = same hash; `?test=1` Chromium replay = Node hash; save-code round trip; S1 prologue store hash = golden |

## 9. UI screens

Each view is a pure function in `views/` from state + public data + own trail to a view model.

| Screen | View model | Decisions |
|---|---|---|
| `LegendLedger` (central) | One column per legend: state (incl. resting), depth and next halving, papers (validity, photo), residence and registration, account and float, obligations (due, payer, lapse), staff errand count, last own-trail rows with the services public rows say may read them, link notices | delegate, float, forward; which name lives, retires or burns |
| `ActAs` | `acts.recordsFor` preview for (legend, verb, payment); `indicator.level` with pair, sig and EA | which name acts and how it pays; now or later |
| `Circuit` | `itineraries` on `truthView`; per itinerary the band `(tRev, tFwd)` for the target legend; scheduled errands and staff payments; source-gap date | train, arrival time, errand timing; sets `plannedWithBand` |
| `CityDay` | clock, today's opening hours (public rows), hotel slots and which names used them, residences, mail, opportunities, available acts | the day in one city |
| `Calendar` | public world notices so far; own obligations, errands, passport expiries, opportunity expiries | plan around terms and dated flips |
| `BurnRetire` | retire: steps, earliest completion, forwarding choice and the sigs it shares; burn: dependencies, queries and dates that follow, sigs and papers exposed, depth and money lost | retire, burn or leave |
| `Autopsy` | after an ending or a noticed link: per service, records held per name; links with episodes, gate pairs and EA (service and public); escapes; queries | understand; questionnaire follows |
| `About` | build, freeze, sources, design values and fallback flags, coverage and source gaps | — |

## 10. Not in this MVP

Heat; inquiries and verification clocks; watches; mail interception by warrant (only sampled wartime censorship); handwriting and typeface sigs; portrait-parlé beyond `desc`; circles, standing, gossip; donor identities; the notebook; credit by depth; creditors as hunters; selling legends; legends beyond A and B; liaison between services; class matching; the body's tells; a delay model and stale guides for the player; detecting proxies from one name's impossible records; French, Belgian, Russian and Ottoman regimes; rules after March 1915; mail transit for instructions to staff; telegrams.

## 11. Kit gaps

**Status (3 Oct 2026):** gap 1 is closed differently. `readersOf` uses keyed draws (survival, edge pass share), which would leak hidden outcomes into the indicator, and forecasts may not import the readers module. So the kit adds `records/exposure.ts`: `possibleReaders` and `earliestPossibleArrival` are draw-free worst cases over any row source, including `PublicParams` (which now has `rowsFor`). Gap 2 is closed as `Ctx.bundle`. Use it instead of a module-level reference set in `init`, which a game restored from a snapshot never runs. Gap 3 stays a game-side `confidence: 0` convention. The questionnaire can also reach metrics directly (`metrics(sim, answers)`), but the `Answer` command remains the default (open question 4).

1. `PublicParams` lacks `rowsFor`, so `readersOf` cannot run on public rows (ledger "who may read this"). Add `PublicParams.rowsFor(param)` and `readersOfPublic(rec, day, pub)` without survival draws.
2. `Ctx` exposes no bundle or `Timetable`; C04 keeps a module-level reference set in `init` (immutable, replay-safe). Optional: `ctx.bundle`.
3. `KnownGraph` has no "unknown" marker distinct from "known not to run"; C04 uses `confidence: 0` entries. Optional: a `blind` list.

## 12. Open questions for the owner

1. **Forced reach in T1–T2.** No pre-war record path gives one service both a Berlin and a London record. *Default:* keep test-only reach rows; in play, links come from A's footprint in Germany, B's in Britain, wartime Rotterdam, queries, searches and photographs.
2. **Wartime Rotterdam.** Both services read Rotterdam police registers from the outbreak (design reach)? *Default:* yes, labelled design.
3. **B's nationality.** Offer a non-British second passport at S1 setup? *Default:* no.
4. **Questionnaire channel.** `Answer` command rather than `SaveCode.answers`? *Default:* the command, so answers replay.
5. **Gate window.** Alibis veto only evidence within DV-C04-005. *Default:* 7 days; revisit after playtest.
6. **Second service.** Drop `svc.GB` and the photograph rule if wartime British sources stay thin (plan fallback)? *Default:* keep both; decide at G1.
