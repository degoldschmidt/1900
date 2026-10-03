# C07 The Departure Is the Turn — rules specification (MVP, 1914)

Mechanics only. Historical values are named parameters, to be transcribed and cited (`DATA_NEEDS.md`); orientation dates carry "(to verify)". Rule constants are design values `DV-C07-NNN` (section 6). Integers only: `Instant` seconds, minor units, ‰. Every draw is keyed: `ctx.draw/below/chance(purpose, ...ids)`, or `pickCdf(cdf, ctx.seed, …)` (K2).

## 1. Purpose

**Question.** If the booked departure is the only clock, and every verb has a duration, opening hours, a cost vector (money, hours, health, trace) and the records it writes, do players fill the slack before the train with deliberate acts? And do the misses, ghost connections and cordons that follow read as consequences of their own plans?

`module.metrics(sim, answers)` reads a replayed save code: `state.stats`, `state.ending`, `sim.log`, `sim.trace`, and the answers via K1. "Supported" is judged on the aggregate over playtest saves (`tools/playtest/analyze.ts`).

| Hyp. | Metric id | Definition | Supported if |
|---|---|---|---|
| H07-1 | `H07-1.verbsPerStay` | Median, over `stats.stays` lasting at least DV-C07-004, of `verbs` (completed slots other than `wait`) | aggregate median ≥ 2 |
| | `H07-1.waitShare` | Σ`waitSec` × 1000 / Σ(`to − from`), same stays. `waitSec` = `wait` slots plus gaps covered by no slot, excluding the boarding margin | < 300 ‰ |
| H07-2 | `H07-2.bufferRatio` | Median `minSlackSec` of multi-leg bookings made after the first `stats.misses` entry × 1000 / median of those made before. Null if either side has fewer than 2 | aggregate median ≥ DV-C07-054 |
| | `H07-2.missesForecast` | ‰ of `stats.misses` with `oddsShown > 0` (odds the Planner showed at booking) | = 1000 (integrity) |
| | `H07-2.blame` | `answers.q1` ∈ {plan, luck, unfair} | ≥ DV-C07-055 of answering saves say `plan` |
| H07-3 | `H07-3.verifyAfterGhost` | ‰ of bookings after the first ghost with `verified` (a `buyGuide`, `askPorter`, `checkBoard` or cable `enquire` finished in the same stay before booking); the before-value is also reported | ≥ DV-C07-056 and above the before-value |
| | `H07-3.repeatGhosts` | `stats.ghosts` more than 86 400 s after the first | aggregate median ≤ 1 |
| | `H07-3.fair` | `answers.q2`, Likert 1–5 | median ≥ 4 |
| H07-4 | `H07-4.stopsAboardNight` | ‰ of `stats.sessions` (from `endSession`, excluding the ending) with `night`: aboard a ride whose scheduled run covers 02:00 local at its boarding station | ≥ DV-C07-057, counting saves with ≥ 2 session ends |
| H07-5 | `H07-5.attribution` | `answers.q3` (a record id picked from the own-trail list on the autopsy) ∈ the causes of the cordons that detected the player. Null without a detection | ≥ DV-C07-058 of non-null saves true |
| | `H07-5.explicable` | `answers.q4`, Likert 1–5 | median ≥ 4 |
| | `H07-5.cordonFeasible` | every `hunt.cordon` trace has `from` = the computed earliest physical start (5.8) | true (integrity) |
| H07-6 | `H07-6.planMs` | Median `ui.sinceArrivalMs` on logged `book` commands (wall-clock ms from the Arrival screen to commit, stamped by the UI) | ≤ 180 000 |
| | `H07-6.defaultShare` | ‰ of `book` commands with `ui.source = 'default'` | informational |

## 2. State

Plain JSON, no Maps or closures. Ids are bundle strings (`TripRow.id`, station, city and institution ids); money is kit `Money`.

```ts
interface C07State {
  scenario: 'S1' | 'S2';
  legend: { id: string; nationality: string; papers: { passport: boolean; visas: string[] } }; // setup (design)
  me: { where: { k: 'city'; city: string; venue: Venue; station: string | null } | { k: 'aboard'; ride: Ride };
        health: number /* 0..1000 */; busyUntil: Instant;
        lodged: { city: string; tier: 'modest' | 'middle' | 'first'; since: Instant; slip: number | null } | null };
  diary: { booking: Booking | null; slots: Slot[]; nextId: number; interrupts: Interrupt[]; stayFrom: Instant };
  knowledge: { kg: KnownGraph; shelf: Array<{ edition: string; at: Instant; city: string }>; drafts: number };
  ledger: { cash: Money[]; credit: Money; correspondents: string[]; unpaid: Money[];
            rent: { amount: Money; nextDue: Instant; arrearsSince: Instant | null } | null;
            bill: { amount: Money; bank: string; maturity: Instant; met: boolean; protested: boolean } | null;
            entries: Array<{ at: Instant; what: string; amount: Money }> };
  commissions: { offers: Offer[] };
  world: { fired: string[]; news: Array<{ id: string; city: string; at: Instant }> };
  hunt: HuntState;                                    // HIDDEN
  stats: Stats; passages: number; ending: Ending | null;
}
type Venue = 'station' | 'bank' | 'post' | 'telegraph' | 'hotel' | 'meeting' | 'street';
interface PlannedLeg { tripId: string; trainKey: string; day: number; from: string; to: string; dep: Instant; arr: Instant }
interface Booking { id: number; legs: PlannedLeg[]; cls: 1 | 2 | 3; sleeper: boolean; madeAt: Instant;
                    minSlackSec: number; missOdds: number; atStationSeq: number | null }
interface Ride { booking: number; leg: number; tripId: string; trainKey: string; day: number; from: string; to: string;
                 cls: 1 | 2 | 3; sleeper: boolean; delaySec: number; shownDelay: number; arriveSeq: number }
interface Slot { id: number; verb: string; args: unknown; venue: Venue; notBefore: Instant | null;
                 start: Instant; end: Instant; seq: number; state: 'planned' | 'running' | 'done' | 'failed' }
interface Interrupt { at: Instant; kind: string; ref: unknown }   // append-only; the UI keeps its own read cursor
interface Offer { id: string; kind: 'chain' | 'errand' | 'away'; pay: Money; revealed: boolean; rival: boolean | null;
                  status: 'open' | 'held' | 'done' | 'lapsed' | 'failed';
                  stages: Array<{ city: string; open: Instant; close: Instant; done: Instant | null }> }
interface HuntState { service: string; subject: string; kg: KnownGraph; belief: Belief | null; file: number[];
  lastFix: { rec: number; t: Instant; city: string } | null; tickSeq: number | null;
  cordons: Array<{ id: number; city: string; from: Instant; to: Instant; via: 'local' | 'train';
                   base: string | null; trainKey: string | null; cause: number[]; sighted: boolean }> }
interface Stats {
  stays: Array<{ city: string; from: Instant; to: Instant; verbs: number; waitSec: number }>;
  bookings: Array<{ id: number; at: Instant; legs: number; minSlackSec: number; oddsShown: number; verified: boolean }>;
  misses: Array<{ booking: number; at: Instant; station: string; slackSec: number; delaySec: number; oddsShown: number }>;
  ghosts: Array<{ at: Instant; trainKey: string; edition: string; status: GhostStatus }>;
  sessions: Array<{ at: Instant; aboard: boolean; night: boolean }>;
  detections: Array<{ at: Instant; cordon: number; noticed: boolean }>;
}
interface Ending { kind: 'delivered' | 'partial' | 'captured' | 'ruined' | 'stranded'; at: Instant;
                   cause: { event: string; recs: number[]; cordon: number | null } }
```

**Hidden:** all of `hunt`; `ride.delaySec` until a timed stop or arrival reveals it (`shownDelay`); whether a trip runs on the ground (never stored; `ghostCheck` only on contact); `Offer.rival` until lapse; the store beyond the own trail. Sightings use the subject `watch:<legend>`, so they never enter the own trail.

**UI access:** the UI imports only `views/`. `views/public.ts` exports `publicState(s)` (no `hunt`, `delaySec` masked). The own trail is `ownTrail(store, [legend, 'anon:' + legend])`, passed in by `main.tsx`. Only `views/autopsy.ts` reads `hunt`, and only once `ending !== null` (T10).

## 3. Commands

Any command may carry `ui?: { sinceArrivalMs?: number; source?: 'default' | 'planner' | 'board' }`, written by the UI, ignored by `validate`/`apply`, read by metrics from `sim.log` (T12). After an ending only `endSession` is accepted. **Cost:** no command costs anything when issued. `book` → the fare, health and trace at `Board` and on the ride (5.3, 5.4); `planVerb` → the verb's cost vector at `VerbStart`/`VerbEnd` (5.2); the others cost nothing.

| Command | Payload | Validation | Effect, events | Records |
|---|---|---|---|---|
| `book` | `{legs: [{tripId, day, from, to}] (1–4), cls, sleeper, dropSlots?}` | Every trip is usable in the **planner view** (5.5) on `day`. Legs chain at one station or via a `transfers` row. Scheduled changes are ≥ min change. `cls` is in every `classMask`; `sleeper` only where the trip has one. In a city, the first dep ≥ now + DV-C07-002 + DV-C07-001. Aboard, the first leg leaves `ride.to` at or after scheduled arrival + min change. Planned slots end by the leave time, or `dropSlots` removes them | Replaces any booking (cancels `AtStation`). Stores `minSlackSec` and `missOdds` (5.9). In a city, schedules `AtStation` at dep₀ − DV-C07-001. Re-flows; pushes `stats.bookings` | sleeper: `berth.reservation` (legend, `reserved`, `{trainKey, day, from, to}`, DV-C07-028.sleeper, sleeping-car company) |
| `cancelBooking` | `{}` | booking exists, first leg not boarded | cancels `AtStation`; `booking = null` | none (the berth record stays) |
| `planVerb` | `{verb, args, notBefore?}` | City verbs in a city; aboard only `rest` and `cable{draft}`. The venue exists in the city. Once re-flowed, the slot starts within 7 days, meets its hours rule, ends by the leave time if booked, and fits the sealed-leg budget aboard. Args valid (amount ≤ credit; offer held; …) | appends a slot; re-flows (5.1) | at `VerbStart`/`VerbEnd` (5.2) |
| `unplanVerb` | `{slotId}` | slot `planned` | removes it; re-flows | — |
| `acceptOffer` | `{offerId}` | `open`, `revealed`, held < DV-C07-044, first stage not closed | `held`; `StageDeadline` per stage | — |
| `alight` | `{station}` | aboard; a timed stop of the trip after boarding and before `ride.to` | `ride.to = station`; reschedules `RideArrive`; later legs void | — (no refund) |
| `endSession` | `{}` | always | `stats.sessions.push({at, aboard, night})` | — |

## 4. Events

Kit priorities are kept (`kit.World` 0, `kit.ParamChanged` 1, `kit.RecordDelivered` 10); lower runs first at equal time. Arrivals precede departures, the hunter reads after the writing act, and an arrest beats a boarding.

| Event | Prio | Payload | Handler (module) | Follow-ons |
|---|---|---|---|---|
| `kit.World` | 0 | `{id}` | world: push to `world.fired`; queue the item for each city's next edition | — |
| `kit.ParamChanged` | 1 | `{day, started, ended}` | world: a started `service.suspension`/`frontier.papers` touching the booking → interrupt; closures re-flow slots | — |
| `c07.RideArrive` | 2 | `{booking, leg}` | travel: reveal delay; hall if flagged; detection; connection test or start of a stay; publish held news | `Board` or interrupt `missed`/`arrival` |
| `c07.FrontierHall` | 3 | `{station}` | travel: papers, records, detection | interrupt `refused` |
| `c07.VerbEnd` | 4 | `{slot}` | verbs: effects, end records | `CableReply`, `Remittance` |
| `c07.CordonStart` / `End` | 5 | `{cordon}` | hunt: activate / negative observation | — |
| `c07.ArrestAttempt` | 6 | `{cordon, rec}` | hunt: capture if the player is still in the city | ending `captured` |
| `c07.AtStation` | 7 | `{booking}` | travel/knowledge: `ghostCheck` leg 0; detection | `Board` or interrupt `ghost` |
| `c07.Board` | 8 | `{booking, leg}` | travel: fare, ticket record, ride start | `RideArrive`, `FrontierHall` × n |
| `c07.VerbStart` | 9 | `{slot}` | verbs: recheck hours, closures, place; start records; else interrupt `verbFailed` and re-flow | `VerbEnd` |
| `kit.RecordDelivered` | 10 | `{rec, reader}` | hunt: `onDelivered` | cordons |
| `c07.HuntTick` | 11 | `{}` | hunt: propagate, resample, decide cordons | `HuntTick`, cordons |
| `c07.CableReply` | 12 | `{slot}` | knowledge: learn the answer | interrupt `cable` |
| `c07.Remittance` | 12 | `{slot, purpose}` | ledger: credit +, or meet the bill | interrupt |
| `c07.EditionIssued` | 13 | `{edition}` | knowledge: on sale after DV-C07-013; hunter graph after DV-C07-030 | — |
| `c07.OfferBatch` | 14 | `{city, day}` | commissions: offers into poste-restante mail | `OfferLapse`, next batch |
| `c07.Newspaper` | 15 | `{city}` | world: publish queued items (not to a player aboard) | next edition |
| `c07.OfferLapse` | 16 | `{offer}` | commissions: rival draw, report | interrupt `lapsed` |
| `c07.StageDeadline` | 17 | `{offer, stage}` | commissions: a held stage undone → `failed` | ending check |
| `c07.RentDue` | 18 | `{}` | ledger | next `RentDue` |
| `c07.BillMaturity` | 19 | `{}` | ledger: protest if unmet; a moratorium row defers it | ending `ruined` |
| `c07.ScenarioEnd` | 99 | `{}` | endings | — |

## 5. Rule modules

### 5.1 `diary` (H07-1, H07-6)
Owns the booked departure, the slots, opening hours and re-planning.

```
leaveAt = (booking && in a city) ? dep0 − DV-C07-001 − DV-C07-002 : +∞
flow():                       // after any command, interrupt or hours change
  t = max(now, me.busyUntil); at = me.where.venue
  for s in planned slots, in order:
    t += s.venue = at ? 0 : (station ∈ {s.venue, at} ? DV-C07-002 : DV-C07-003)
    t = max(t, s.notBefore ?? t)
    s.start = nextWindow(s, t); s.end = s.start + dur(s); t = s.end; at = s.venue
    cancel(s.seq); s.seq = schedule(s.start, 9, 'c07.VerbStart', {slot: s.id})
  slack = leaveAt − t
dur(s) = floor(base × (1000 + (health < DV-C07-025.threshold ? DV-C07-025.penalty : 0)) / 1000)
```

- `nextWindow` reads the venue's hours row on the local day (`toLocal` with the city's civil offset). It skips days closed by `bank.closed` or `bank.moratorium`, and searches at most 7 days ahead; beyond that the slot is infeasible.
- Hours rules: `within` (start ≥ open, end ≤ close) or `start` (start within the hours).
- Interrupt kinds: arrival, ghost, missed, verbFailed, news, offer, lapsed, cable, remittance, noticed, refused, suspended, papers, cannotPay, collapse, ending. The UI's Advance runs `sim.advanceUntil(s => s.diary.interrupts.length > cursor || s.ending !== null)`. Planned slots survive an interrupt and are re-flowed.
- A stay opens when a ride ends other than at a made connection, and closes at `Board`; its `verbs` and `waitSec` are counted at closing.

### 5.2 `verbs` (H07-1)
One declaration per verb, read by the rules and by the forecast. All durations are DV-C07-005.

| Verb | Venue; hours (rule) | Money | Health | Records written (when) | Effect |
|---|---|---|---|---|---|
| `drawCredit {amount, meetBill?}` | correspondent bank; `bank.hours` (within) | DV-C07-011.commission; `fx.parity` | 0 | `bank.draw` (legend, `drew`, `{amount, cur}`, 1000, bank) (end); `bill.met` likewise when it meets the bill | credit −, cash +; meets the bill at its domicile |
| `posteRestante` | main post office; `post.hours` (within) | `post.restanteFee` if a row exists | 0 | `post.collect` (legend, `collected`, `{n}`, 1000, post administration) (end) | reveals offers and mail held here |
| `meet {offer, stage}` | meeting place (design venue); stage window (within) | 0 | 0 | `meet.witness` (legend, `met`, `{city}`, DV-C07-028.witness, `VENUE-<city>`; no reader) (end) | stage done; the last stage pays credit (chain/away) or cash (errand) |
| `cable {mode: draft\|send, purpose: enquire\|funds\|remit, trainKey?, day?, words}` | draft: anywhere, aboard included; send: telegraph office, `telegraph.hours` (start) | `telegraph.tariff` × max(words, minimum) | 0 | send: `cable.copy` (legend, `sent`, `{toJur, purpose, words}`, 1000, the jurisdiction's telegraph administration) (start) | send costs compose + hand-in, or hand-in alone with a draft. enquire → `CableReply` +DV-C07-009; funds → `Remittance` +DV-C07-010, capped; remit → `Remittance` toward the bill. Invalid while `telegraph.private.suspended` covers the destination |
| `buyGuide {edition}` | station bookstall; DV-C07-008 (start) | `guide.price` | 0 | none | shelf +; the active edition of its family (5.5) |
| `askPorter {trainKeys ≤ 3}` | station; DV-C07-008 (start) | `porter.tip` | 0 | none | `ghostCheck` of each train's next day calling here within DV-C07-006; learn |
| `checkBoard` | station; always | 0 | 0 | none | learn the truth departures here within DV-C07-007, and the announced delays of trains due within 3 600 s |
| `lodge {tier}` | hotel; none | `lodging.price` point (DV-C07-059) × nights, at check-out | 0 | where `registration.regime` requires it: `registration.slip` (legend, `lodged`, `{city, tier, fromCity}`, DV-C07-028.slip, the city's registration authority) (start) | `me.lodged` |
| `wait {sec}` | any | 0 | 0 | none | counted as waiting |
| `rest {sec}` | hotel if lodged, else waiting room; aboard | 0 | + DV-C07-024 by place | none | — |

No draws in this module.

### 5.3 `costs` (H07-1, H07-2)
`costOf(action, publicState, publicParams) → {money: Money[], sec, health, trace: TraceItem[]}` serves both previews and charges, so they agree whenever the same rows apply.

- **Fare:** the `fares` row for the truth trip's edition (from, to, class, single), plus the `sleeper` row. Without a row, DV-C07-017 × scheduled hours, shown as "design fare".
- **Paying in X:** cash X, then other cash in DV-C07-012 order via `convert()` at `fx.parity` less DV-C07-011.spread; still short → interrupt `cannotPay`, the action fails.
- **Health:** per ride second `−DV-C07-023[cls|sleeper] × (night ? 2 : 1)` (night is 22:00–06:00 local), plus DV-C07-024 when `rest` is planned aboard. Each charge is `floor(perHour × sec / 3600)`. At 0, a `rest` of DV-C07-026 is inserted and interrupt `collapse` raised.
- **Trace:** `TraceItem = {kind, source, named, confidence, reach: [{reader, minSec, maxSec}]}`, with `reach` from the forecast; `traceScore = Σ confidence / 100` over named items with non-empty reach.

### 5.4 `travel` (H07-2, H07-4)
Booking, boarding, the shared delay, connections, the frontier hall and the sealed leg.

```
category(trip) = trip.mode ≠ rail ? 'boat' : (trip.sleeper || trip.name) ? 'express' : 'ordinary'
delayOf(trainKey, day):                 // one draw per train per service day
  row = params.row('c07.delay', category, day)          // design rows; crisis rows dated
  b = pickCdf(cdfOf(row.value.w), seed, 'delay', trainKey, day); lo = edges[b]; hi = edges[b+1]
  return lo + (hi > lo ? ctx.below(hi − lo, 'delay-in', trainKey, day) : 0)
delayAt(trip, day, stop) = floor(delayOf × (sched(stop) − sched(first)) / (sched(last) − sched(first)))
actualDep(stop) = schedDep + (stop = first ? 0 : delayAt);   actualArr(stop) = schedArr + delayAt
```

The draw is keyed by (trainKey, service day), so every passenger of one train shares its delay, the hunter's watchers included (5.8). No train leaves early.

- **AtStation:** `ghostCheck(tt, trip, station, day, suspended)`. `ok` → `Board` at `actualDep`. Retimed later → the booking takes the truth time. Retimed earlier and gone, `withdrawn`, `notThatDay` or `suspended` → booking void, `stats.ghosts`. Any ghost raises interrupt `ghost` and runs the 5.5 learning.
- **Board:** pay the fare (5.3); check out of lodging (5.7); write `ticket.sale` (`anon:<legend>`, `travelled`, `{mode, from, dir}`, DV-C07-028.ticket[cls], railway administration; no reader in the MVP); store `delaySec`; schedule `FrontierHall` at `actualArr` of each customs/passport-flagged stop before `to`, and `RideArrive` at `actualArr(to)`.
- **RideArrive at a change:** `ghostCheck` the next leg. `ready = actualArr + minChange` (or + the `transfers` row). The connection is made if `ready ≤ actualDep(next)`; a `throughLinks` carriage is always made. Missed → interrupt `missed`, `stats.misses {slackSec (scheduled), delaySec, oddsShown}`, booking void. The ticket stays valid as DV-C07-016 says.
- **FrontierHall:** read `frontier.papers` for edge `A>B` in the direction of travel. Required papers missing → the ride ends here (interrupt `refused`). `recordsName` → `frontier.passport` (legend, `crossed`, `{station, dir, trainKey, day}`, 1000, the inspecting post). Always `frontier.customs` (`anon:<legend>`, `inspected`, `{station}`, DV-C07-028.customs, customs). Update `shownDelay`; run detection.
- **Sealed leg:** aboard, only `rest` and `cable{draft}`. The budget is the remaining scheduled ride time minus hall dwell. News is held until arrival (5.10).

Draws: `delay`, `delay-in` (trainKey, day).

### 5.5 `knowledge` (H07-3)
- **Editions.** `kg` (kit `KnownGraph`) holds one active edition per family: the latest owned. `buyGuide` → `addEdition`, and the older edition of that family is dropped (the shelf keeps the history). An edition is on sale from issue + DV-C07-013; only transcribed editions exist.
- **Planner view** = `knownView(tt, kg)` minus trips under a `service.suspension` row whose announcing calendar event is in `world.fired`. View key: `kg.version` and `world.fired.length`.
- **Learning** (`learn(kg, {trainKey, edition, source, learnedDay, confidence})`):
  - a train that runs on the ground → its truth edition at the source's confidence (porter DV-C07-015.porter, board 1000, cable DV-C07-015.cable);
  - a train that does not → confidence 0 on the believed edition;
  - every ghost also learns confidence 0, with `source: 'observed'`.
- `ghostCheck` runs only at `AtStation`, at changes, in `askPorter`, in `checkBoard` and in `CableReply`.

### 5.6 `commissions` (H07-1, H07-2)
- **Chain and S2 offers** come from scenario setup (design data) and are `held` from the start.
- **OfferBatch** runs at DV-C07-047 local, daily, in the player's city (aboard: the next stage's city). Offers land in poste-restante mail, making them claimants on the slack; `posteRestante` reveals them.
- **Errands:** `n = pickCdf(DV-C07-045, seed, 'errand-n', city, day)`. Each errand has one stage here: open at DV-C07-047 + 3 600 + 900 × `below(32, 'errand-open', city, day, i)`, length DV-C07-046, pay from DV-C07-048 by `below(…, 'errand-pay', city, day, i)`.
- **Away offer** (chance DV-C07-049, `'away', city, day`): destination `below(nCities − 1, 'away-dest', city, day)`; window from `EA_truth(city → dest, now + 7 200)` for DV-C07-050; kept only if feasible alone and **infeasible with the next held stage** (`EA_truth(dest, open + meet → stage.city) > stage.close`): exclusivity by travel time (`ProfileCache.earliestAny` on `truthView`).
- **OfferLapse** at the last close, if undone: `rival = chance(DV-C07-051, 'rival', offerId)`, then interrupt `lapsed`.

### 5.7 `ledger` (H07-1)
- **Accounts:** cash per currency, and credit (a letter of credit in GBP) drawable only at `correspondents` in bank hours.
- **Lodging:** charged at check-out (`Board` or a new `lodge`) at price × local midnights spanned (minimum 1). A shortfall goes to `unpaid` and writes `hotel.complaint` (legend, `unpaid`, `{amount}`, 1000, the registration authority).
- **Rent** (`RentDue`, setup cadence): debit credit, otherwise record `unpaid` and `arrearsSince`. Arrears older than DV-C07-052 count against the ending.
- **Bill** (`BillMaturity`, at the domicile bank's close on maturity + DV-C07-053): a `bill.moratorium` row in force defers it. Unmet → `bill.protest` (legend, `protested`, `{amount}`, 1000, a court/notary institution; published as news) → ending `ruined`.
- **Remittance:** `funds` adds DV-C07-010.amount to credit; `remit` meets the bill if it lands before the close.

### 5.8 `hunt` (H07-5)
One service, `hunt.service` (the Prussian political police; its name as period to be transcribed and cited).

**Init and views:**
- `ctx.subscribe(service, {kinds: ['registration.slip', 'frontier.passport', 'hotel.complaint'], subjects: [legend]})`. Records arrive only by `records.lag` and `coop.edge` rows (kit `arrival`).
- `hunt.kg` = the editions on issue at start. Trips outside DV-C07-031 are excluded (K3).
- **Hunter view** = `knownView(tt, hunt.kg)` minus every suspension in force.

```
onDelivered(rec):
  file.push(rec); r = records.get(rec)
  if !r.place or (lastFix and r.time ≤ lastFix.t): return
  fix(rec, r.time, cityOf(r.place))
fix(rec, t, city):
  lastFix = {rec, t, city}; belief = seedBelief(service, legend, stationsOf(city), t, DV-C07-032.n)
  propagate(belief, now, tt, hunterView, seed, DV-C07-032); trace('hunt.fix'); decide([rec]); tick ≥ now + DV-C07-033
HuntTick: propagate(belief, now, …); resample(belief, seed); decide([lastFix.rec])
decide(cause):
  for city in DV-C07-034, by mass(belief, stationsOf(city)) desc, then id:
    if mass < DV-C07-035 or cordons with to > now ≥ DV-C07-036.max: stop
    if city has a cordon with to > now: continue
    tLocal = police institution in city with a coop row to service
             ? nextOpen(its office hours or DV-C07-060, now + DV-C07-037) : +∞
    tTrain = min over bases (DV-C07-038):
             legs = journey(earliestArrival(tt, connections(hunterView, now + DV-C07-039, now + DV-C07-041), base))
             last ride: arr + delayAt(trip, day, stop) + DV-C07-040.post     // shared train delay
    from = min(tLocal, tTrain); if from > now + DV-C07-041: continue
    add cordon {city, from, to: from + DV-C07-036.dur, via, base, trainKey, cause}
    schedule CordonStart/End; trace('hunt.cordon', {city, from, earliest: from})
```

**Detection** runs at each player passage (`AtStation`, `RideArrive`, `FrontierHall`) in a city with a cordon in force:
1. `passages++`.
2. `p` = DV-C07-042.frontier where a named frontier record is written at that moment; otherwise DV-C07-042.station + the class modifier.
3. If `chance(p, 'cordon-detect', cordonId, passages)`: emit `watch.sighting` (`watch:<legend>`, `seen`, `{station}`, DV-C07-028.sighting, source = service, lag 0) and run `fix` directly. If the city is in DV-C07-034, schedule `ArrestAttempt` at now + DV-C07-040.arrest.
4. If `chance(DV-C07-043, 'notice', cordonId, passages)`: interrupt `noticed`.

**ArrestAttempt:** if the player is in that city (a train still standing there counts), ending `captured`, cause = `cordon.cause` + the sighting. Causes are transitive: a fix from a sighting inherits the detecting cordon's `cause`, so every chain ends in records of the player's own trail.

**CordonEnd** with nothing sighted: `observe(belief, stations, now, DV-C07-032.missWatched, 1000)`, then `resample`.

**Kit:** `subscribe`, `seedBelief`, `propagate`, `observe`, `resample`, `mass`, `knownView`, `connections`, `earliestArrival`, `journey`, `ProfileCache`. **Draws:** kit `hunt-stay/dep/alight/resample`; `cordon-detect`, `notice` (cordon, passage). **Never read:** the player's itinerary, trips outside the hunter view, realised delays other than the watchers' own train.

### 5.9 `forecast` (H07-2, H07-5)
File `rules/forecast.ts`; the import check bars the store, delivery, readers and the hunter. Inputs: an `OwnTrail` copy, `params.publicView()`, the timetable, the player's `kg` and the verb declarations. It is pure; `book` calls it to store the odds it showed.

- **Miss odds at a change** with slack `s` (scheduled, after min change), on the incoming trip:
  - `e = sched(stop) − sched(first)`, `E = sched(last) − sched(first)`, `Dmin = ceil((s + 1) × E / e)`.
  - `p = Σ_b floor(w_b × |[max(Dmin, lo_b), hi_b)| / (hi_b − lo_b))` from the public `c07.delay` row; a zero-width bucket counts `w_b` when `lo_b ≥ Dmin`.
  - Itinerary: `1000 − Π(1000 − p_i) / 1000^(n−1)`, floored at each step.
  - Conservative: the onward train is taken to leave on time.
- **Trace reach:** for each record kind an action would write, and for each own-trail record, the readers are the source plus the public `coop.edge` rows from it. Arrival range = `records.lag` min/max + edge `lagSec` min/max, gated by public office hours. Ranges only, never draws.

### 5.10 `world` (H07-2, H07-3)
- `init` schedules each calendar row in the window: `ctx.schedule(worldEventInstant(ev, zoneOffset), 0, 'kit.World', {id})`; rows up to 2 days before the start are published in the first edition.
- `Newspaper` runs at DV-C07-014 in each scope city. Aboard, nothing is seen until `RideArrive` publishes everything due since boarding (the reveal).
- Suspensions, papers, closures, moratoria and registration changes are param rows the other modules read; this module only announces them and interrupts.

### 5.11 `endings` (H07-5; questionnaire for all)
- **delivered:** S1 when all chain stages are done; S2 when the commission is done and the bill met.
- **ruined:** the bill was protested. **captured:** an arrest succeeded.
- **At `ScenarioEnd`:** `stranded` if the held commission's last stage is undone and the last ghost or miss touched it; otherwise `partial`.
- **Autopsy:** `hunt.file` with arrival times, fixes, each cordon (`via`, base, watcher train, `from`), detections.
- **Questionnaire:** q1 blame (after a miss), q2 ghost fairness (after a ghost), q3 record pick (after a detection), q4 cordon clarity, q5 free text.

## 6. Design values

In `games/c07-departure/design/design-values.json` and the register. The `c07.delay` rows are param rows (`valueBasis: design`, `public: true`, `dv`), so tests can override them. Scenario amounts (cash, credit, rent, bill, pay, windows) are listed in each scenario file with their own ids.

| Id | Name | Value | Unit | Range | Rationale | Used by |
|---|---|---|---|---|---|---|
| DV-C07-001 | board margin | 900 | s | 300–1800 | on the platform before departure | diary, travel |
| DV-C07-002 | venue↔station | 1800 | s | 900–3600 | cab or walk in a capital | diary |
| DV-C07-003 | venue↔venue | 1200 | s | 600–2700 | same city | diary |
| DV-C07-004 | min stay for H07-1 | 7200 | s | 3600–14400 | excludes bare changes | metrics |
| DV-C07-005 | verb durations | {draw 2700, post 1200, meet 3600, compose 1800, handIn 900, guide 600, porter 600, board 300, lodge 1200} | s | ×0.5–×2 | counter times; tune in playtest | verbs |
| DV-C07-006 | porter horizon | 172800 | s | 86400–259200 | knows two days of his station | knowledge |
| DV-C07-007 | board horizon | 10800 | s | 3600–21600 | a board shows hours, not days | knowledge |
| DV-C07-008 | bookstall/porter hours | 06:00–23:00 | local | ±2 h | no source planned | verbs |
| DV-C07-009 | cable reply lag | 14400 | s | 3600–43200 | same-day answer | verbs |
| DV-C07-010 | remittance lag; funds amount; cap | 86400; £20; £60 | s; GBP | 6–72 h; £5–50; £20–200 | money by wire takes a day | ledger |
| DV-C07-011 | bank commission; change spread | 5; 30 | ‰ | 0–15; 10–60 | instruments cost money | costs |
| DV-C07-012 | auto-change order | GBP, FRF, BEF, DEM, RUB | — | — | deterministic | costs |
| DV-C07-013 | guide distribution lag | 1 | day | 0–7 | issue reaches bookstalls | knowledge |
| DV-C07-014 | newspaper editions | 07:00, 17:00 | local | 1–3/day | morning and evening papers | world |
| DV-C07-015 | confidences {porter, cable} | 900, 950 | ‰ | 700–1000 | hearsay vs written answer | knowledge |
| DV-C07-016 | ticket validity after a miss | to end of next day | — | 0–2 days | stand-in until a cited rule | travel |
| DV-C07-017 | design fare per hour | {1: 120, 2: 80, 3: 48, sleeper: 160} | GBP farthings | ×0.5–×2 | only where no fare is transcribed; labelled | costs |
| DV-C07-018 | delay CDF express | edges [0, 1, 600, 1800, 3600, 7200]; w [600, 250, 100, 35, 15] | s; ‰ | ±50% per w | rare long delays | travel, forecast |
| DV-C07-019 | delay CDF ordinary | same edges; [500, 300, 140, 45, 15] | ‰ | ±50% | slower trains lose more | travel, forecast |
| DV-C07-020 | delay CDF boat | same edges; [550, 250, 120, 50, 30] | ‰ | ±50% | weather tail | travel, forecast |
| DV-C07-021 | delay CDF crisis | same edges; [200, 250, 250, 180, 120] | ‰ | ±50% | dated from S2 crisis rows | travel, forecast |
| DV-C07-022 | default min change; gauge transfer | 900; 2700 | s | 300–1800; 1800–5400 | only where no cited row | travel |
| DV-C07-023 | ride health cost | {sleeper 2, 1: 4, 2: 6, 3: 10} | ‰/h | ×0.5–×2 | cheap nights wear | costs |
| DV-C07-024 | rest gain | {lodged 40, berth 35, seat1 10, seat2 6, seat3 0, waitingRoom 5} | ‰/h | ×0.5–×2 | rest competes for slack | verbs, costs |
| DV-C07-025 | low health {threshold, penalty} | 300, 250 | ‰ | 200–500; 100–500 | tired agents are slow | diary |
| DV-C07-026 | collapse rest | 86400 | s | 43200–172800 | health 0 costs a day | costs |
| DV-C07-027 | starting health | 800 | ‰ | 600–1000 | room to spend | setup |
| DV-C07-028 | record confidences | {slip 950, ticket {1: 400, 2: 250, 3: 100}, sleeper 900, customs 200, witness 300, sighting 800} | ‰ | ±200 | named ≫ anonymous | verbs, travel, hunt |
| DV-C07-029 | coop lag, local police → service (fallback) | [43200, 129600] | s | 1–72 h | only if no cited row | param row |
| DV-C07-030 | hunter edition lag | 0 | day | 0–14 | police hold the official issue | hunt |
| DV-C07-031 | hunter-known modes/operators | rail on German state railways and the sleeping-car company | list | — | makes unknown escapes possible | hunt |
| DV-C07-032 | particles | {n 64, stay 600, maxRides 3, fanout 4, missWatched 300} | —/‰ | n 32–256 | cheap, stable | hunt |
| DV-C07-033 | hunt tick | 7200 | s | 3600–21600 | re-plan cadence | hunt |
| DV-C07-034 | hunter jurisdiction | scope cities whose `jur_id` is Prussia (data), with their frontier posts | list | — | where it may watch and arrest | hunt |
| DV-C07-035 | cordon mass threshold | 250 | ‰ | 100–500 | acts on a likely city only | hunt |
| DV-C07-036 | cordons {max, dur} | 3, 172800 | —, s | 1–6; 12–120 h | watchers are scarce | hunt |
| DV-C07-037 | notice by wire | 3600 | s | 1800–14400 | notices move by cable | hunt |
| DV-C07-038 | watcher bases | [Berlin] | — | — | headquarters | hunt |
| DV-C07-039 | watcher dispatch | 3600 | s | 1800–10800 | men leave within the hour | hunt |
| DV-C07-040 | {post, arrest} delay | 1800, 1800 | s | 900–3600; 900–7200 | leaves a window to escape | hunt |
| DV-C07-041 | cordon horizon | 259200 | s | 1–5 days | belief decays beyond it | hunt |
| DV-C07-042 | detect {station, class mod, frontier} | 350, {1: +100, 2: 0, 3: −100}, 900 | ‰ | 100–700; —; 700–1000 | passports make frontiers sharp | hunt |
| DV-C07-043 | player notices watcher | 500 | ‰ | 200–800 | a warning before the arrest | hunt |
| DV-C07-044 | max held offers | 2 | — | 1–3 | forces choice | commissions |
| DV-C07-045 | errands per city-day | w [300, 500, 200] for 0/1/2 | ‰ | — | a claimant most days | commissions |
| DV-C07-046 | errand window | 10800 | s | 1–6 h | fits one stay | commissions |
| DV-C07-047 | offer batch time | 08:00 | local | 06–10 | morning post | commissions |
| DV-C07-048 | errand pay | 5s–£1 local equivalent | GBP | — | small but real | commissions |
| DV-C07-049 | away offer chance | 400 | ‰ | 200–700 | a tempting alternative | commissions |
| DV-C07-050 | away window | 21600 | s | 3–12 h | tight enough to exclude | commissions |
| DV-C07-051 | rival delivered | 600 | ‰ | 300–900 | lapses have consequences | commissions |
| DV-C07-052 | rent arrears grace | 604800 | s | 0–14 days | one week | ledger |
| DV-C07-053 | bill grace | 0 | day | 0–3 | stand-in until a cited rule | ledger |
| DV-C07-054 | buffer-growth threshold | 1250 | ‰ | 1100–2000 | analysis only | metrics |
| DV-C07-055 | blame "plan" share | 600 | ‰ | — | analysis only | metrics |
| DV-C07-056 | verify-after-ghost share | 500 | ‰ | — | analysis only | metrics |
| DV-C07-057 | stops aboard night share | 400 | ‰ | — | analysis only | metrics |
| DV-C07-058 | correct attribution share | 600 | ‰ | — | analysis only | metrics |
| DV-C07-059 | lodging point in a cited range; tier map | 500 (midpoint); Baedeker groupings → modest/middle/first | ‰ | 0–1000 | sources give ranges, rules need one price | verbs, costs |
| DV-C07-060 | police office hours (fallback) | 08:00–20:00 | local | ±2 h | only if no cited row | hunt |

## 7. Scenarios

**S1 "Changeover"** (`s1.scenario.json`)
- **Window:** late April 1914, a few days before the first day of the summer service on the corridor (from `editions`/`segment_sources`; to verify), to early May 1914 (about 12 days).
- **Setup:** Paris, 09:00 local, not lodged; owns the last pre-changeover issue; cash FRF; credit GBP with a correspondent per chain city; rent monthly. Holds a chain Paris → Brussels → Cologne → Berlin whose Cologne and Berlin windows fall after the changeover. Hunter subscribed from the start; its first fix needs a record with a coop route to it.
- **Endings:** delivered / captured / partial / stranded.
- **Data:** both editions; a cross-edition diff (V06) with at least one withdrawn or retimed train on the chain corridor; `bank.closed` days in the window. No political Tier-0 rows.

**S2 "The Last Week"** (`s2.scenario.json`)
- **Window:** 24 July – 5 August 1914 (set by the plan; start hour design).
- **Setup:** start in Berlin, lodged since the previous evening. Setup emits a `registration.slip` dated then, so the first fix arrives by its lag. Owns the June/July 1914 anchor. Commission: a meeting in Berlin on day 1, delivery in Petersburg within a design window. Bill at the Petersburg correspondent, maturing on a design day before 5 August. Cash in DEM, credit in GBP. Dual dates in Russia.
- **Endings:** delivered / ruined / captured / stranded / partial.
- **Calendar rows** (dates to verify):
  - the Austro-Hungarian ultimatum and its expiry;
  - declarations of war in the window;
  - Russian and German mobilisation steps, and the German state of imminent war;
  - the German passport decree (→ `frontier.papers`);
  - civilian suspensions and frontier closures on the Berlin–Petersburg corridors (→ `service.suspension`);
  - bank closures and moratoria (→ `bank.moratorium`, `bill.moratorium`);
  - private-telegraph restrictions (→ `telegraph.private.suspended`).

  The crisis delay rows are design rows dated by these events.

## 8. Tests

Scripts → logs → golden hashes on frozen data. Each test has a synthetic twin on a `SYN_` network that runs before the freeze. Delays are forced only through `Scenario.paramOverrides` on `c07.delay` rows.

| # | Scen. | Script (in words) | Overrides | Assertion |
|---|---|---|---|---|
| T1a | S1 | At Brussels, book a two-leg itinerary whose change slack is below the forced `delayAt` of the change stop; advance | all `c07.delay`: edges [1200, 1200], w [1000] | trace `missed` at the change; one `stats.misses` with `oddsShown = 1000`; booking null; player at the change station |
| T1b | S1 | Same, but the next itinerary with slack ≥ 2 400 s | same | no `missed`; arrival = scheduled + `delayAt` of the final stop |
| T2a | S1 | With the winter issue, book (for a day after the changeover) the first corridor train that V06 lists as withdrawn or retimed earlier; advance | — | at `AtStation`: trace `ghost` with that status; booking void; `kg` learns confidence 0; one ghost |
| T2b | S1 | `buyGuide` (summer) first, then book the planner's first itinerary | — | the ghost trip is absent from the planner view; no `ghost`; boards |
| T3 | S1 | In Paris, `drawCredit` with `notBefore` = close − dur + 60; then with `notBefore` = close − dur | — | first: re-flowed to the next opening (rejected if a booking leaves earlier); second: `VerbEnd` at exactly close, credit −, cash +, one `bank.draw` |
| T4 | S2 | Advance from the start | — | for the setup slip `r`: delivery event time A = `arrival(r, service, params, seed)`, within the lag + coop ranges; `delivered(store, service, A − 1)` excludes `r` and `delivered(…, A)` includes it; `hunt.fix` at A |
| T5a | S2 | Before the announcing event, book the latest Berlin → Petersburg departure falling on or after the suspension's first day | — | interrupt `suspended`; no `Board`; ending `stranded` |
| T5b | S2 | Book a departure arriving before the suspension, with a fallback over another cited route if the data has one | — | reaches Petersburg; stage done; every boarded leg has a `cite` index |
| T6a | S2/SYN | Get a fix in X; leave by a trip outside the hunter view before the cordon `from` | coop lag row [0, 0] | no detection; no later cordon at the destination; `mass(belief, dest) = 0` at every tick until a new record |
| T6b | same | Leave by a known train | same | a cordon at the destination with `from` = hunter-view earliest arrival + final-leg `delayAt` + DV-C07-040.post, exactly |
| T7 | all scripts | Replay | — | straight = golden; each monthly snapshot (S1 crosses into May) restored and finished = golden; Chromium `?test=1` replay = Node hash; save code round-trips |
| T8 | SYN | A watcher and the player on one train instance | edges [1800, 1800], w [1000] | equal arrival delays; forecast odds = brute-force enumeration over the CDF for 200 random slacks |
| T9 | S1 | `endSession` once aboard a night train and once in a city | — | `H07-4.stopsAboardNight = 500` |
| T10 | all | Replace `state.hunt` before calling the views | — | every view except autopsy is byte-identical; autopsy throws without an ending |
| T11 | SYN × 200 seeds | Random walks | — | every `hunt.cordon` has `from` = min(local notice, watcher arrival) |
| T12 | S1 | T1b with different `ui.sinceArrivalMs` | — | same hash; `H07-6.planMs` follows the values |
| T13 | S1, S2 | Golden playthroughs | — | `metrics()` equals the stored object |

## 9. UI screens

Every view is `f(publicState, publicData) → model` (publicData: timetable, `publicView()`, citations, own trail, design values).

| Screen | View → model | Decisions |
|---|---|---|
| DiaryPage | `diaryView`: pinned booking, leave time, slack countdown, slots with hours and cost; `upcomingView`: what will pass before the next interrupt | plan/unplan; Advance; end session |
| DepartureBoard | `boardView(station)`: known departures with source (edition, porter, board, cable), confidence, date learned, citation; learned delays | pick a train; porter; board |
| Planner | `plannerView(to)`: `itineraries()` on the planner view from up to 6 successive departures: fare per class, slack per change, miss odds, trace, health, citations; default pick = earliest arrival with odds ≤ 100 ‰ | book class, sleeper |
| CityPanel | `cityView`: venues with today's hours (dual dates in Russia), registration regime, lodging tiers and prices, verbs possible now | lodge; choose verbs |
| GuideShelf | `shelfView`: owned and active editions, what is on sale here, learned edges, ghost log | buy a guide |
| Purse | `purseView`: cash, credit, correspondents' hours, rent, bill, unpaid, public parities | draw; meet the bill; remit |
| Commissions | `commissionsView`: held, revealed and lapsed offers (rival outcome), windows against known-view earliest arrival | accept |
| OwnTrail | `trailView`: own records with forecast readers and arrival ranges | weigh trace |
| Newspaper | `newsView(city)`: published items, with citations for Tier-0 rows | re-plan |
| Arrival | `arrivalView`: delay, made or missed, news since boarding, lapses; at an ending `autopsyView` and the questionnaire | next plan; answer |
| About | `aboutView`: build, freeze, sources, design values in use, source gaps | — |

## 10. Not in this MVP

Several legends and linkage; conversation, ciphers, forgery, bribery; luggage; skills, ageing, the year-end audit; a second commission type; Vienna (unless cheap); airships and cabs; strikes, ice and other disruptions beyond Tier-0 and delay rows; wartime timetables after 5 August; Russian exit permits; foreign police liaison beyond data rows (none by default); a second hunter; the press reading records; watchers missing their own connections; Tier-1 jitter.

## 11. Kit gaps

| Id | Gap | Proposed API | Fallback |
|---|---|---|---|
| K1 | Metrics cannot see questionnaire answers | `GameModule.metrics?(sim, answers?: SaveCode['answers'])`; `analyze.ts` passes `save.answers` | an `answer` command that writes them to state |
| K2 | `Ctx` has no CDF draw | `Ctx.pick(cdf, purpose, ...ids)` (the Drawer already has `pick`) | `pickCdf(cdf, ctx.seed, …)` |
| K3 | A `KnownGraph` cannot exclude modes or operators | `KnownGraph.exclude?: {modes?: Mode[]; operators?: string[]}`, honoured by `knownView` and part of its key | a confidence-0 `learn` per excluded (trainKey, edition) at init |
| K4 | `ParamRow.keyKind` has no city (lodging prices per city and tier) | add `'city'` to the kit union and to `KEY_KINDS` in `tools/schema/canonical.ts` | `global` with key `<city>\|<tier>` |
| T-1 | Tooling (not kit): `tools/schema/citation.ts` `DV_RE` and `design-values.ts` `HEAD_RE` accept only `DV-\d{3,}` | accept `DV-(C07\|C01\|C04)-\d{3}` | none, because game-prefixed ids are mandated |

## 12. Open questions for the owner

1. **Changeover truth.** If no May 1914 issue is transcribed, may the June/July anchor count as the truth from the changeover date its own preliminary pages print? *Default: yes, if printed and cited; otherwise S1 moves to the first transcribed summer issue.*
2. **Warsaw** (a tier-B corridor). *Default: in scope only if Berlin–Alexandrowo–Warsaw–Petersburg is transcribed.*
3. **Arrest.** One detection plus DV-C07-040.arrest to get away. *Default: keep; switch to two detections if playtests find it harsh.*
4. **Hunter in S1.** *Default: present, so there is one code path.*
5. **Questionnaire channel.** *Default: K1.*
6. **DV id format.** *Default: extend the regex (T-1).*
