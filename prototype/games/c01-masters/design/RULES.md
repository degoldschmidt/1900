# C01 Several Masters, One Truth — rules specification (MVP)

Binding scope: the C01 section of `PLAN.md`. Every constant is a design value `DV-C01-NNN` (section 6). No historical value is stated here: a rule that needs one names a parameter, and `DATA_NEEDS.md` says where it is to be transcribed and cited. Dates are orientation only, "(to verify)".

The paymasters are institutions with mechanics, never characters:

| Id | Institution (by function) | City | Currency | After a flip |
|---|---|---|---|---|
| `GB_SSB_FS` | Foreign Section of the British Secret Service Bureau | London | GBP | hunts |
| `FR_DB2` | Deuxième Bureau of the French army staff | Paris | FRF | hunts |
| `BE_HOUSE` | A representative Belgian commission house (design row; no real firm named) | Brussels | BEF | terminates |

Cities: London, Paris, Brussels, Vienna, Berlin, Rotterdam. Topics (document classes, design): `deploy.AT`, `deploy.DE`, `naval.DE`, `orders.BALKAN`, `shipping.NL`.

---

## 1. Purpose

**Question.** If each paymaster's knowledge of the player is only a delivered view of one record store, compared with other views only on dated occasions (audits, and cooperation rows such as the August 1914 fusion), do players feel dread and relief that they trace to their own reports, and can they keep three masters live through July 1914 without the bookkeeping swamping play?

`module.metrics(sim)` reads a replayed save code: `sim.state` (visible and hidden), `sim.trace`, `sim.log`. Only play after `state.playFromK` (end of setup or prologue) counts. Questionnaire answers (`q.*`) are in the save code; reading them in `metrics` needs kit gap K2.

| Hyp. | Metric id | Definition | Supported if |
|---|---|---|---|
| H01-1 suspicion attributed to the right report | `H01-1.noteRate` | ‰ of warnings answered by `NoteCause` (an empty list = "don't know") | ≥ 500 |
| | `H01-1.correctShare` | ‰ of notes naming a report in `causeReports(warning)` (5.6), among notes naming any report | ≥ 700, with ≥ 3 such notes, in ≥ 60% of saves |
| H01-2 debts serviced before audits | `H01-2.attendedBeforeAudit` | Over closed audits of master m: Σ handled / Σ (handled + exposed). Handled = debts to m acted on (`Service`, `RollOver`, `BuyBack`, `Answer`≠stand) in [open − DV-C01-069b, close]; exposed = debts to m open at `AuditOpen` and not handled | ≥ 600 ‰ over ≥ 3 audits with debts |
| | `H01-2.serviceShare` | ‰ of handled debts closed by `Service` or `BuyBack` | reported |
| H01-3 flip preceded by noticed warnings, feels fair | `H01-3.warningsBeforeFlip` | Minimum over flips of that master's warnings in the 60 days before | ≥ 2 |
| | `H01-3.respondedShare` | ‰ of flips preceded within 60 days by a responsive command toward that master (`Service`, `RollOver`, `BuyBack`, `Answer`≠stand, `NoteCause` on its warning, `Retire`) | ≥ 800 |
| | `q.flipFair` | Questionnaire 1–5 | median ≥ 4 |
| H01-4 reports composed varied and quickly | `H01-4.composeSecMedian` | Median `uiSec` of `Deliver` commands in `sim.log` | ≤ 120 s |
| | `H01-4.distinctMixShare` | ‰ distinct signatures (master, sorted item kinds with fabrication distance) per `Deliver` | ≥ 400 |
| | `H01-4.fabShare` | ‰ of delivered items that are fabrications | 100–600 |
| H01-5 successes seen to fund the hunters | `H01-5.fundedWatchers` | Σ over `FiscalYear` events of W − W0 (watchers with and without the player's boost) | ≥ 1 in ≥ 70% of S1/S2 saves |
| | `H01-5.fundedCatches` | Catches whose draw r satisfied p(W0) ≤ r < p(W) (r and both chances are traced) | reported |
| | `q.fundedHunters` | "What paid for the watchers?" | ≥ 60% choose "my credited successes" |
| H01-6 three masters live into July 1914 | `H01-6.liveOn1July1914` | Masters `live` at the first instant of 1 July 1914 | = 3 in ≥ 50% of S1/S2 saves reaching it |
| | `H01-6.meanLivePm` | Mean live masters × 1000 per day, `playFrom` to min(end, 1 July 1914), from `liveSpans` | ≥ 2000 |

---

## 2. State

Plain JSON, hashed by the kit; no Maps, no closures.

```ts
type LegendId = 'A' | 'B' | 'C';
type MasterId = 'GB_SSB_FS' | 'FR_DB2' | 'BE_HOUSE';
type Topic = 'deploy.AT' | 'deploy.DE' | 'naval.DE' | 'orders.BALKAN' | 'shipping.NL';

interface C01State {
  v: 1; dataHash: string; scenario: string;
  phase: 'setup' | 'prologue' | 'play' | 'ended'; playFromK: number | null;
  world: { fired: string[]; atWar: string[] };
  clock: { slot: 'am' | 'pm' | 'night'; day: number; start: Instant; end: Instant; used: boolean; seq: number | null };
  player: { city: string | null; papers: LegendId; purse: Record<string, number>;
            act: null | { kind: 'meeting' | 'acquire' | 'copy' | 'observe'; master?: MasterId; topic?: Topic; token?: number; seq: number };
            journey: null | Journey; negativeSince: Instant | null };
  legends: Record<LegendId, { label: string; papers: string; keyword: string; kwFrom: Array<[string, Instant]>; master: MasterId | null; expelledFrom: string[] }>;
  masters: Record<MasterId, Master>;
  tokens: Array<{ id: number; kind: 'orig' | 'copy' | 'obs'; topic: Topic; doc: number | null; at: Instant; consumed: boolean; soldTo: MasterId[] }>;
  reports: Array<{ id: number; master: MasterId; legend: LegendId; at: Instant; items: Item[]; recs: number[]; kw: string; uiSec: number }>;
  debts: Debt[];
  requirements: Array<{ id: number; master: MasterId; topic: Topic; city: string; from: Instant; to: Instant; filled: boolean }>;
  warnings: Array<{ id: number; master: MasterId; kind: WarningKind; at: Instant; ref: number | null }>;
  notes: Array<{ warning: number; reports: number[]; at: Instant }>;     // metrics only; rules never read
  news: Array<{ at: Instant; kind: string; ref: string }>;
  counters: Record<'token' | 'doc' | 'report' | 'debt' | 'req' | 'warning' | 'journey' | 'question', number>;
  hunters: Hunter[];                                                     // HIDDEN
  ending: null | { kind: 'retired' | 'captured' | 'ruined' | 'survived'; at: Instant; score: number | null; by: MasterId | null };
}
type Item = { kind: 'orig' | 'copy' | 'obs'; token: number } | { kind: 'fab'; topic: Topic; d: 0 | 1 | 2; debt: number };
type WarningKind = 'reversal' | 'unconfirmed' | 'retainerCut' | 'summons' | 'pointedQuestion' | 'standingDrop' | 'expelled' | 'terminated';
interface Journey { id: number; to: string; cls: '1' | '2' | '3'; legs: Array<{ trip: string; day: number; from: string; to: string; dep: Instant; arr: Instant }>;
  crossings: Array<{ station: string; jur: string; at: Instant; control: boolean }>; dep: Instant; arr: Instant; fare: { cur: string; minor: number }; seqs: number[]; departed: boolean }
interface Debt { id: number; master: MasterId; legend: LegendId; topic: Topic; dist: number; claims: number[]; conf: number /* HIDDEN */;
  dueAt: Instant; dueTitle: string; seq: number; rolls: number; paid: number;
  state: 'open' | 'serviced' | 'rolled' | 'boughtBack' | 'passed' | 'failed'; handledAt: Instant | null }
interface Master {
  status: 'open' | 'live' | 'dormant' | 'lapsed' | 'flipped' | 'cutoff'; legend: LegendId | null; liveSpans: Array<[Instant, Instant | null]>;
  credit: number; retainer: 'full' | 'cut' | 'suspended'; lastDelivery: Instant | null;
  payments: Array<{ at: Instant; minor: number; kind: 'retainer' | 'report' | 'reversal' | 'collected'; report: number | null }>;
  audit: null | { no: number; extraordinary: boolean; summonsAt: Instant; opensAt: Instant; closesAt: Instant;
                  questions: Array<{ id: number; topic: Topic; debt: number | null; response: string | null }>; attended: boolean; seqs: number[] };
  audits: Array<{ no: number; at: Instant; exposed: number[]; handled: number[]; absent: boolean }>;
  fy: { id: string; credited: number; base: number; vote: number; scalePm: number; watchers: number; watchers0: number };
  // HIDDEN:
  trust: number; suspicion: number; noticeAt: Instant | null;
  ledger: Array<{ at: Instant; delta: number; cause: 'test' | 'verify' | 'audit' | 'doubleSale' | 'resale' | 'linkage'; recs: number[]; debt: number | null }>;
  evidence: Record<string, { sigs: string[]; score: number; linked: boolean; recs: number[] }>;   // key "A|B"
  reconciled: string[];                                                                          // "sig|lowRec|highRec"
}
interface Hunter { master: MasterId; jur: string; legends: LegendId[]; kg: KnownGraph; belief: Belief; tick: number; seenRecs: number[] }
```

**Hidden:** `Master.trust`, `suspicion`, `noticeAt`, `ledger`, `evidence`, `reconciled`; `Debt.conf`; `hunters` (kit `Belief`, `KnownGraph`); the record store, including what each master holds (`delivered(store, master, t)`); private parameter rows (`public: false`, e.g. pre-war cooperation edges).

**UI access:** only through `src/views/*.ts`, which project hidden fields as the standing band (not trust), warnings (not suspicion) and the player's own claims with `confidence` stripped. `views/autopsy.ts` may read a master's hidden fields once it has flipped or terminated, and all of them once `ending` is set. `src/ui/` imports only `views/` (import-boundary check).

---

## 3. Commands

*Usable slot:* `clock.slot` is `am`/`pm`, not `used`, the player is in a city and `act` is null. *Meeting slot:* a usable slot on a DV-C01-004 weekday in the master's city. *Meeting open:* `act.kind = 'meeting'`. Money is integer minor units; a cost in a currency the purse lacks is exchanged automatically at the cited parity plus DV-C01-010.

| # | Command | Payload | Validation | Effect and events | Records | Cost |
|---|---|---|---|---|---|---|
| 1 | `CreateLegend` | `{legend, label, papers, keyword}` | `phase = setup`; unused id; `papers` ∈ DV-C01-014; keyword 4–12 letters A–Z; label 1–24 chars typed by the player (the game never proposes names) | Adds the legend | — | — |
| 2 | `BeginPlay` | `{}` | setup or prologue; three legends | `phase = play`; `playFromK`; first `Slot` | — | — |
| 3 | `Approach` | `{master, legend}` | Meeting slot; master `open`, not `cutoff`; legend unbound | Binds; `live`; opens meeting (`ActDone` at slot end); schedules first `AuditSummons` (DV-C01-067), `Requirements` now, `Retainer` on the 1st | `meeting` (world; src master; subject legend; conf 1000; place city) | slot |
| 4 | `Meet` | `{master}` | Meeting slot; `live` or `dormant` | Opens meeting; `dormant → live`; collects positive `credit` | `meeting`; `payment` if collected | slot |
| 5 | `Deliver` | `{items: Array<{token} \| {fab:{topic, d}}>, uiSec}` | Meeting open; 1..DV-C01-032 distinct items; tokens held, unconsumed; each topic's curve > 0 for this master (5.9); `uiSec` 0–3600 (UI-measured, ignored by rules) | Per item a claim; consumes originals and copies; a fabrication creates a `Debt` and schedules `Mature` at `maturity(topic)`; `Verify` at now + DV-C01-055; fills a requirement; `lastDelivery`; a suspended retainer resumes | `report.claim` per item (claim; src master; author legend; subject topic; value `{item, dist, report, debt?}`; conf = trust; sigs `kw:<keyword>`, plus `mark:<doc>` for originals and copies) | — |
| 6 | `Service` | `{debt, token}` | Meeting open with `debt.master`; debt open; true token on `debt.topic` | Debt `serviced`; cancels `Mature`; token delivered as in 5 | `report.claim` | token |
| 7 | `RollOver` | `{debt}` | as 6, no token | `dist := min(1000, dist × DV-C01-052 / 1000)`; new fabricated claim; `Mature` moved to `maturity(topic)` after the old `dueAt`; `rolls++` | `report.claim` (`rollOf`) | — |
| 8 | `BuyBack` | `{debt}` | as 7 | Debt `boughtBack`; cancels `Mature` and unpaid `Verify`s; reverses `debt.paid`; trust −= dist × DV-C01-024 / 1000 | `report.retraction` | trust, pay |
| 9 | `Answer` | `{question, response, token?}` | Meeting open with a master whose audit is open; unanswered; non-`stand` responses only if `question.debt` | `stand` on a debt: `audit-catch` (5.7); `stand` without: trust += DV-C01-025; `service`/`rollover`/`retract` run 6/7/8; all answered ⇒ `attended` | `audit.answer` (claim) + those of 6/7/8 | — |
| 10 | `Rekey` | `{keyword}` | Meeting open; valid, different | Bound legend's keyword changes for future claims; old signatures stay | — | — |
| 11 | `Acquire` | `{topic}` | Usable slot; city in DV-C01-092 acquire list; purse covers DV-C01-041 | Pays; `ActDone` at slot end: original token (new doc id) or nothing | — | slot, money |
| 12 | `Copy` | `{token}` | Usable slot; held original | Pays DV-C01-042; `ActDone`: copy with the same doc id | — | slot, money |
| 13 | `Observe` | `{topic}` | Usable slot; city in DV-C01-092 observe list | `ActDone`: observation token | — | slot |
| 14 | `Travel` | `{to, leaveAfter, pick, cls, papers}` | In a city; no journey or meeting; `leaveAfter ≥ now`; recomputed itineraries contain `pick` (5.2); first departure ≥ act end + DV-C01-005; class on every ride; each crossing allowed for the papers on its date; legend not expelled from an entered jurisdiction; fare found and affordable | Pays; `papers := legend`; schedules `Depart`, `FrontierPass` per crossing, `Arrive`; slots en route are `used` | `frontier.pass` at controlled crossings | money, time |
| 15 | `CancelJourney` | `{}` | Booked, not departed | Refund × DV-C01-015 / 1000; cancels events | — | money |
| 16 | `Papers` | `{legend}` | In a city, no journey | Carried papers change | — | — |
| 17 | `NoteCause` | `{warning, reports}` | Warning unnoted; the player's reports (any master) | Stores the note | — | — |
| 18 | `Retire` | `{}` | City's jurisdiction has `haven.status` true (DV-C01-120 fallback); carried legend not bound to, nor linked at, a flipped master | `ending = retired`; score DV-C01-121 | — | ends |

---

## 4. Events

Ordered by (time, priority, insertion). Kit priorities: `kit.World` 0, `kit.ParamChanged` 1, `kit.RecordDelivered` 10. The game defines 15 event types and handles the three kit ones.

| Event | Prio | Payload | Handler | Follow-on |
|---|---|---|---|---|
| `kit.World` | 0 | `WorldEventRow` (scheduled by `init` via `calendarWindow`) | News item; `war-declaration` kinds extend `world.atWar` | — |
| `kit.ParamChanged` | 1 | `{day, started, ended}` | Public rows become news; requirements on a zero curve lapse; a new `audit.cadence` reschedules the next ordinary audit; `inst.reachable` false sets that master `cutoff` | `AuditSummons` |
| `FiscalYear` | 5 | `{master, fy}` | Budget (5.10) | next `FiscalYear` |
| `kit.RecordDelivered` | 10 | `{rec, reader}` | Liaison reconciliation (5.8); feeds a hunter | extraordinary `AuditSummons` |
| `Mature` | 20 | `{debt}` | `testDebt` (5.6) | warnings, `AuditSummons` |
| `Verify` | 30 | `{report, idx}` | Verification and pay (5.5) | warnings |
| `AuditSummons` | 40 | `{master, no, extraordinary}` | Sets `audit`; extraordinary ⇒ warning `summons`, `noticeAt = now` | `AuditOpen` |
| `AuditOpen` | 41 | `{master, no}` | Re-scan, questions, `exposed` (5.7) | `AuditClose` |
| `AuditClose` | 42 | `{master, no}` | Absence, flip check, `handled` | next audit; `HuntTick` on flip |
| `Requirements` | 50 | `{master, month}` | Fill (5.3) | next |
| `Retainer` | 60 | `{master, month}` | Credit; lapse, dormancy (5.3) | next |
| `HuntTick` | 70 | `{master, n}` | Hunter step (5.11) | next; ending |
| `Depart` / `FrontierPass` / `Arrive` | 75 / 76 / 77 | `{journey, i?}` | City null / `frontier.pass` if controlled / city = destination, slot `used`; each a sighting draw | `Slot` |
| `ActDone` | 80 | `{seq}` | Resolves the act; closes a meeting | — |
| `Slot` | 90 | `{slot, day}` | Rolls the clock in the player's civil zone; `night`: lodging, meals, registration, ruin check | next `Slot` |
| `ScenarioEnd` | 95 | `{}` at `scenario.end` | `ending = survived` | — |

---

## 5. Rule modules

Build order for one engineer: days, journey → tokens, reports, factions → debt, valuecurves → audits → liaison → budget → flip → forecast, endings. In pseudo-code and test overrides a bare `NNN` (with an optional letter) means `DV-C01-NNN`.

### 5.1 `days` (H01-6)
- Slots start at DV-C01-001/002/003 in the city's civil zone (`CityRow.civilZone`, `ZoneTable.offset`); one pending `Slot` (`clock.seq`), rescheduled by `Arrive`.
- `night` in a city: pay `city.lodging` (bracket DV-C01-012; fallback DV-C01-013) and `city.meals`; if `reg.coverage` for the jurisdiction covers the carried papers that day, emit `registration.slip` (world; src the jurisdiction's police institution; subject carried legend; conf DV-C01-088; place city). Nights aboard cost only the fare.
- Ruin: purse negative at parity sets `negativeSince`; `ruined` after DV-C01-011 with no `live` master.
- Kit: `ZoneTable`, `money.convert`. Draws: none.

### 5.2 `journey` (H01-6, H01-2)
- `itineraries(tt, truthView(tt, suspended), stationsOfCity(from), leaveAfter, stationsOfCity(to), {horizonSec: DV-C01-006, maxTrains: DV-C01-007})`; `suspended` reads `rail.suspension` rows. Validation recomputes the list from the payload, so replay is exact; legs are stored by trip and station ids.
- Crossings: stops flagged customs or passport where the jurisdiction changes; `control` when `frontier.papers` requires a passport there that day; `frontier.entry` (`<jur>|<nationality>`, fallback DV-C01-016) may bar entry.
- Fare: the through `FareRow` of the edition in force, else per-ride rows, plus sleeper rows; without a row the itinerary is not offered. No delays or stale guides (C07's subject).
- Kit: `Timetable`, `truthView`, `itineraries`, `FareRow`, `EditionRow`. Draws: none.

### 5.3 `factions` (H01-6, H01-3)
- Status: `open → live` (Approach); `live → dormant` after DV-C01-030b without delivery (free; store kept); `dormant → live` (Meet); `→ flipped` (hunting master) or `lapsed` (house) at 5.7's flip check; `→ cutoff` on occupation.
- Trust 0–1000 (start DV-C01-020) sets each new claim's confidence and the price factor DV-C01-027, so it raises pay and exposure together. The standing band (DV-C01-026) is shown; a band drop warns `standingDrop`.
- `Retainer` on the 1st: `credit += DV-C01-028 × {full 1000, cut DV-C01-029, suspended 0} / 1000`; suspended after DV-C01-030a without delivery; cut while suspicion ≥ DV-C01-060 (`retainerCut` on first cut).
- `Requirements`: while open < DV-C01-031a, `pickCdf` over topics with curve ≥ DV-C01-031c keyed `('req-pick', master, monthKey, i)`; city = first acquire city; window DV-C01-031b. A guard adds one for any acquisition city with none open.

### 5.4 `tokens` (H01-4)
- `Acquire`: `chance(DV-C01-040, 'acquire', topic, dayOf(now), clock.slot, act.seq)` → `{kind:'orig', doc: ++counters.doc}`.
- `Copy` → `{kind:'copy', doc}`, any number. Delivered originals and copies both carry `mark:<doc>` (the copy shows the original's mark); marks and `soldTo` are shown before every sale.
- Observations are true, unmarked, reusable. Fabrications exist only as delivered items and debts.

### 5.5 `reports` (H01-4, H01-1)
- Price, by successive `mulPm(x, pm) = floor(x × pm / 1000)`: DV-C01-028 → kind (DV-C01-043; fabrication DV-C01-044) → `curve(M, topic, today)` → novelty (1000 if no claim on the topic is in M's used view since the segment began, else DV-C01-045) → requirement (DV-C01-031d for the first filling item) → trust factor → `fy.scalePm`.
- `Verify` at delivery + DV-C01-055:
  ```
  true item:   credit += price; fy.credited++; trust += 021; suspicion = max(0, suspicion − 063)
  fabrication: p  = min(056cap, 056base + fy.watchers × 056per) × dist / 1000      (p0 with watchers0)
               r  = ctx.below(1000, 'verify-catch', debt.id, claimRec); trace('catch', {r, p, p0})
               r < p ? testDebt(debt, DV-C01-057, 'verify')         // no pay; warning 'unconfirmed'
                     : credit += price; debt.paid += price; fy.credited++   // provisional
  ```
- A `Verify` whose debt is already `failed` or `boughtBack` does nothing; the catch draw applies only to `open` debts.
- Reversal on failure: `credit −= debt.paid` (credit may go negative, netted at collection), a `reversal` line, `fy.credited −= 1` within the same fiscal year.

### 5.6 `debt` (H01-2, H01-1)
- `maturity(topic)`: first `from` of a `value.segment` row for the topic with historical date basis after today + DV-C01-053a, else now + DV-C01-053b; at `instantOf(day, 0) + DV-C01-054`. `dueTitle` = the Tier-0 event behind that row (public).
- `Mature` lives on the one queue (`ctx.schedule(dueAt, 20, …)`); its seq lets `Service`, `RollOver`, `BuyBack` cancel it.
- Integer test, suspicion from the product of confidences:
  ```
  testDebt(d, confTest, cause):
    ctx.cancel(d.seq)                                   // no-op when called by Mature itself
    excess = max(0, d.dist − DV-C01-050)
    out = emit world.outcome {src d.master; subject d.topic; value {debt, claim}; conf confTest}
    if excess == 0: d.state = 'passed'; return
    addSuspicion(d.master, floor(excess × d.conf × confTest / 1_000_000), cause, [last(d.claims), out.id], d.id)
    reverse(d); trust −= floor(excess × DV-C01-022 / 1000); d.state = 'failed'
    warning d.paid > 0 ? 'reversal' : 'unconfirmed'
  ```
  `Mature` calls `testDebt(d, DV-C01-051, 'test')`.
- `addSuspicion` appends to `ledger`; crossing DV-C01-060 cuts the retainer; crossing DV-C01-061 issues an extraordinary summons (audit after DV-C01-068) unless an audit opens sooner. It never flips.
- `causeReports(w)`: for `reversal`, `unconfirmed` and `pointedQuestion`, the reports of the debt in `w.ref`; otherwise the ledger entries of `w.master` since its previous warning, mapped from record ids to report ids (a double sale maps to two reports, possibly at two masters). Warnings with an empty cause set are left out of H01-1.

### 5.7 `audits` (H01-2, H01-3)
- Ordinary audits every `audit.cadence` (DV-C01-066; halved by wartime rows), first at DV-C01-067; summons DV-C01-068 before opening (shown on the Desk); close DV-C01-069a after.
- `AuditOpen`: the liaison re-scan (5.8) over M's used view, plus same-author resale of one `mark` to M (`resale`, Δ as a double sale). Then questions from the store's top subjects:
  ```
  w[topic] = Σ claim.confidence over claims in used(M, now) on that topic; × DV-C01-071/1000 if the ledger cites one
  for i < DV-C01-070 (+1 at warn band): pickCdf(w minus picked) keyed ('audit-q', M, no, i)
  question.debt = the player's open debt to M on that topic ⇒ warning 'pointedQuestion'
  emit audit.question (world; src M; subject legend; value {topic})
  ```
- `Answer stand` on a debt: `p = min(072cap, 072base + W × 072per) × dist / 1000`, `r = below(1000, 'audit-catch', M, no, debt)`; caught ⇒ `testDebt(d, DV-C01-073, 'audit')`.
- `AuditClose`: absent ⇒ trust −= DV-C01-023 and every question on a debt stands. Flip if `suspicion ≥ DV-C01-062` and `noticeAt ≤ now − DV-C01-064`; over threshold without notice ⇒ extraordinary summons instead. Every flip therefore follows a visible summons.

### 5.8 `liaison` (H01-1, H01-3)
- Each master subscribes at `init`: `ctx.subscribe(M, {sources: every institution except M})`. Records cross only on `coop.edge` rows (`SOURCE>READER`): `arrival = max(emit + sourceLag, open) + edgeLag`; `retro` rows (the August 1914 fusion) open records written before them. Records never change; readers are derived at query time.
- Partial edges, until kit gap K3: `liaisonUsed(rec, R)` = `rec.source == R` or `chance(fidelityPm, 'liaison-use', rec.id, R)`, `fidelityPm` being an extra field of the row in force on the arrival day. `used(R, t)` = `delivered(store, R, t)` filtered by it.
- On `kit.RecordDelivered {x, R}` with `x.source ≠ R` and `liaisonUsed`:
  ```
  if x.kind == 'report.claim':
    for sig in x.sigs, y in store.bySig(sig): y a claim in used(R, now), y.id ≠ x.id, y.author ≠ x.author:
      key = sig|min(x.id,y.id)|max(…); skip if reconciled; record key
      e = evidence[sorted(x.author, y.author)]
      if sig ∉ e.sigs: add it; e.score += sig is kw ? 081a : 081b
      if sig is mark: addSuspicion(R, floor(DV-C01-080 × x.confidence × y.confidence / 1e6), 'doubleSale', [x.id, y.id])
      if !e.linked and e.score ≥ DV-C01-082:
        e.linked = true; L = emit linkage {world; src R; subject R's legend; value {other, sigs}}
        addSuspicion(R, atWar ? 083b : 083a, 'linkage', [L.id, …e.recs])
  if R has a hunter and x.place: hunter.seenRecs.push(x.id)
  ```
  Cost is linear in shared signatures; the audit re-scan runs the same body. A link makes R treat both legends as one person (hunter, `Retire`).

### 5.9 `valuecurves` (H01-4, H01-2)
- `curve(M, topic, day) = floor(DV-C01-090[M][topic] × segment(topic, day) / 1000)`. `value.segment` rows (key topic) start on Tier-0 event days (date basis historical, cited via the event) with design values DV-C01-091 (public):

| Topic | before E1 | E1–E2 | E2–E4 | E4–E5 | E5–E6 | E6–E7 | after E7 |
|---|---|---|---|---|---|---|---|
| `deploy.AT` | 400 | 900 | 0 from E3* | 500 | 300 | 1000 | 600 |
| `deploy.DE` | 500 | 600 | 600 | 600 | 500 | 1000 | 200 |
| `naval.DE` | 700 | 700 | 700 | 700 | 700 | 1000 | 600 |
| `orders.BALKAN` | 300 | 1000 | 600 | 900 | 300 | 300 | 0 |
| `shipping.NL` | 200 | 200 | 200 | 200 | 200 | 500 | 900 |

E1 First Balkan War outbreak; E2 Treaty of London; E3 the late-May 1913 supersession of Austro-Hungarian plans; E4 Second Balkan War outbreak; E5 Treaty of Bucharest; E6 the Austro-Hungarian ultimatum; E7 British declaration of war (all to be transcribed). *`deploy.AT` stays 900 until E3, whichever side of E2 it falls, then 0 until E4.
- A zero segment (supersession) makes held tokens worthless and is a maturity date.

### 5.10 `budget` (H01-5)
```
FiscalYear(M):                                   // at budget.fyStart of M's jurisdiction; house DV-C01-104
  base  = budget.vote(M, fy).amountMinor         // cited; DV-C01-104 fallback, flagged design
  boost = min(DV-C01-101, prev.credited × DV-C01-100)
  vote  = floor(base × (1000 + boost) / 1000)
  W     = floor(vote × DV-C01-102 / (1000 × DV-C01-103[M]));  W0 = same with base
  fy = {credited: 0, base, vote, scalePm: 1000 + boost, watchers: W, watchers0: W0}; trace('vote', …)
```
The house has no watchers; its boost scales prices only. `init` computes the first year with `prev.credited = 0`. Watchers feed verify catch, audit catch, and after a flip particles and sightings. The Masters screen shows "credited successes → funds +boost ‰ → watchers W (W0 without you)".

### 5.11 `flip` (H01-3, H01-5)
- A hunting master flips: `flipped`; credit forfeited; pay stops; `flip` record. The house instead `lapsed`, `termination` record, warning `terminated`.
- Seeded from the store: the last DV-C01-117 placed records about M's legend or legends linked in `evidence`, from `used(M)`, weighted 5..1 by repetition; `seedBelief(M, 'player', stations, now, clamp(W × 110a, 110b, 110c))`. `KnownGraph` = editions valid that day; later editions added by `addEdition` at ticks.
- `HuntTick` (DV-C01-111): `propagate(belief, now, tt, knownView(tt, kg), seed, DV-C01-112)`; `observe` each new placed record (DV-C01-114); `resample`.
- Sightings at `Depart`/`FrontierPass`/`Arrive` in M's jurisdiction: `chance(min(113cap, W × 113per), 'sighting', M, journey, i, phase)` emits `watch.sighting`.
- Powers: `params.get('hunt.powers', jur + '|' + (papers == jur ? 'national' : 'alien'), today)?.power ?? 'watch'` (DV-C01-116). With the player in a city of M's jurisdiction and `mass ≥ DV-C01-115a`: `arrest` ⇒ `chance(115b, 'arrest', M, n)` ends `captured`; `expel` ⇒ carried legend added to `expelledFrom`, warning `expelled`; `watch` ⇒ nothing. Traces cite the power row id.

### 5.12 `forecast` (H01-2, H01-3)
- `rules/forecast.ts`, import-banned from store, delivery, readers and hunter. Its input, built in `views/forecastInput.ts`: `ownTrail(store, legends)` filtered to the player's claims and witnessed kinds (`meeting`, `payment`, `audit.question`), confidence removed; own debts, warnings, bands; `params.publicView()`; public calendar.
- Output: per open debt `estDelta = floor(max(0, dist − 050) × bandMid × 051 / 1e6)` (DV-C01-026 midpoints) with `dueAt` and `dueTitle`; per master the sum due before the next announced audit closes; per signature shared across two masters, the first public `coop.edge` opening and whether its weights reach DV-C01-082.

### 5.13 `endings` (H01-3, H01-6)
- `retired` (command 18), `captured`, `ruined`, `survived`.
- Autopsy (`views/autopsy.ts`): flip or arrest → audit or tick (with the power row) → ledger entries → per record: report and items, or the `coop.edge` row in force on its arrival day and arrival instant, or the linkage and its signatures → budget chain (W, W0, boost, last year's credited reports).

---

## 6. Design values

Rules hold times as integer seconds; values written in days (d) or hours (h) are stored × 86400 or × 3600. Money in minor units, probabilities in ‰. All design, never history.

| Id | Name | Value | Unit | Range | Rationale | Used by |
|---|---|---|---|---|---|---|
| DV-C01-001 | Morning slot start | 28800 (08:00) | s local | 25200–32400 | Half-day acts | days |
| DV-C01-002 | Afternoon slot start | 46800 (13:00) | s | 43200–50400 | Two acts a day | days |
| DV-C01-003 | Night start | 68400 (19:00) | s | 64800–75600 | Evening trains still usable | days |
| DV-C01-004 | Meeting weekdays | 63 (Mon–Sat) | mask | 31–127 | Not an office-hours claim | factions |
| DV-C01-005 | Station margin | 1800 | s | 900–3600 | Time to reach the train | journey |
| DV-C01-006 | Itinerary horizon | 172800 (2 d) | s | 1–3 d | Night trains plus a day | journey |
| DV-C01-007 | Max trains | 4 | trains | 3–6 | Paris–Vienna needs several | journey |
| DV-C01-008 | Default minimum change | 1200 | s | 600–1800 | Where no row exists | journey |
| DV-C01-009 | S1 starting cash | 28800 | farthings | 9600–57600 | About a month | scenarios |
| DV-C01-010 | Exchange commission | 20 | ‰ | 5–40 | No banks in MVP | days |
| DV-C01-011 | Ruin grace | 604800 (7 d) | s | 3–14 d | Time to reach a master | days |
| DV-C01-012 | Lodging bracket | lower bound of middle cited bracket | rule | — | Picks from a cited range | days |
| DV-C01-013 | Lodging+meals fallback | 2400/day | farthings equiv. | 1200–4800 | Only without a row; flagged | days |
| DV-C01-014 | Papers allowed | jurisdictions with power or entry rows | list | — | Choices must matter | legends |
| DV-C01-015 | Cancellation refund | 900 | ‰ | 500–1000 | Forgives misclicks | journey |
| DV-C01-016 | Entry without a `frontier.entry` row | barred if the papers' country and the destination are at war by cited declarations, else allowed | rule | — | Conservative; derived from cited rows | journey |
| DV-C01-020 | Initial trust | 500 | ‰ | 300–700 | New source | factions |
| DV-C01-021 | Trust per verified true item | +30 | ‰ | 10–60 | High after about a year | reports |
| DV-C01-022 | Trust loss per failed test | 300 × excess/1000 | ‰ | 100–500 | Bigger lies cost more | debt |
| DV-C01-023 | Trust loss for absence | 80 | ‰ | 40–150 | Worse than a small lie | audits |
| DV-C01-024 | Trust loss for buy-back | 200 × dist/1000 | ‰ | 100–400 | Cheaper than failing | debt |
| DV-C01-025 | Trust per truthful answer | +10 | ‰ | 0–30 | Rewards attending | audits |
| DV-C01-026 | Bands (midpoints) | <350 low (175); <700 fair (525); ≥700 high (850) | ‰ | cuts ±100 | Coarse and legible | factions, forecast |
| DV-C01-027 | Price trust factor | 500 + trust/2 | ‰ | floor 300–700 | Pay and exposure rise together | reports |
| DV-C01-028 | Monthly retainer GB / FR / BE | 7680 farthings / 20000 c. / 15000 c. | minor | ×0.5–2.5 | Half a month's living; recalibrate on cited prices | factions, reports |
| DV-C01-029 | Retainer when cut | 500 | ‰ | 0–750 | Readable cost | factions |
| DV-C01-030 | Suspended (a) / dormant (b) without delivery | 90 d / 180 d | s | 60–120 / 120–240 d | Dormancy free and reversible | factions |
| DV-C01-031 | Open requirements (a), window (b), eligibility (c), fill bonus (d) | 2; 45 d; curve ≥ 300; 1500 | count; s; ‰; ‰ | 1–4; 30–90 d; 200–500; 1200–2000 | No capital quiet | factions, reports |
| DV-C01-032 | Items per delivery | 4 | items | 2–6 | Quick composition | reports |
| DV-C01-040 | Acquire success | 600 | ‰ | 300–900 | Uncertain, worth trying | tokens |
| DV-C01-041 | Acquire cost | 5 × city day's lodging+meals | money | 3–10 × | Real cost | tokens |
| DV-C01-042 | Copy cost | 1 × same | money | 0.5–2 × | The mark is the real price | tokens |
| DV-C01-043 | Kind ‰ of retainer: original / copy / observation | 2000 / 1400 / 500 | ‰ | 1500–3000 / 50–80% / 300–700 | Real documents pay most | reports |
| DV-C01-044 | Fabrication price | obs × (1000 + 2 × dist)/1000 | ‰ | factor 1–3 | Bigger lies pay more, below originals | reports |
| DV-C01-045 | Novelty repeat | 400 | ‰ | 200–700 | Rewards acquisition | reports |
| DV-C01-046 | Distances small / medium / large | 200 / 450 / 750 | ‰ | ±100 | Three legible choices | reports, debt |
| DV-C01-050 | Truth tolerance | 150 | ‰ | 100–250 | Small embellishments pass | debt, forecast |
| DV-C01-051 | Maturity test confidence | 800 | ‰ | 600–950 | Public events reveal | debt, forecast |
| DV-C01-052 | Roll-over compounding | 1250 | ‰ of dist | 1100–1500 | A supporting lie widens the gap | debt |
| DV-C01-053 | Minimum (a) / default (b) maturity horizon | 14 d / 56 d | s | 7–28 / 28–90 d | Every lie has a date | debt |
| DV-C01-054 | Test instant | 43200 (noon GMT) | s | 3600–64800 | After that day's world events | debt |
| DV-C01-055 | Verification lag GB / FR / BE | 21 d / 14 d / 30 d | s | 7–45 d | Delayed, legible relief | reports |
| DV-C01-056 | Verify catch base + per watcher, cap | 50 + 10/W, 400 | ‰ | 0–100; 5–20; 200–600 | Funded checking | reports |
| DV-C01-057 | Verify confidence | 600 | ‰ | 400–800 | Early checks are weaker | reports |
| DV-C01-060 | Warn band | 400 | units | 300–500 | First warning | debt, audits |
| DV-C01-061 | Summons band | 700 | units | 600–850 | Extraordinary audit | debt |
| DV-C01-062 | Flip threshold | 1000 | units | fixed | Scale anchor | audits |
| DV-C01-063 | Relief per verified truth | 20 | units | 0–50 | Buying back with truth | reports |
| DV-C01-064 | Notice before a flip | 7 d | s | 3–14 d | A ramp, not a cliff | audits |
| DV-C01-066 | Audit cadence GB / FR / BE (wartime ×½) | 91 / 61 / 91 d | s | 30–120 d | Learnable, distinct rhythms | audits |
| DV-C01-067 | First audit after Approach GB / FR / BE | 30 / 45 / 60 d | s | 15–90 d | Staggered | audits |
| DV-C01-068 | Summons notice | 10 d | s | 5–21 d | One round trip | audits |
| DV-C01-069 | Attendance window (a); H01-2 handled window (b) | 5 d; 14 d | s | 2–10; 7–28 d | Presence is routing | audits, metrics |
| DV-C01-070 | Questions per audit | 2 (+1 at warn) | count | 1–4 | Questions leak the store | audits |
| DV-C01-071 | Suspect-topic boost | 2000 | ‰ | 1000–4000 | Suspicion shows | audits |
| DV-C01-072 | Audit catch base + per watcher, cap | 100 + 20/W, 600 | ‰ | 50–200; 10–40; 400–800 | Standing is a gamble | audits |
| DV-C01-073 | Audit confidence | 700 | ‰ | 500–900 | Between verify and maturity | audits |
| DV-C01-080 | Double-sale base | 500 | units | 300–800 | One mark, two stores | liaison |
| DV-C01-081 | Link evidence: keyword (a) / mark (b) | 600 / 500 | points | 400–800 / 300–700 | Neither alone links | liaison |
| DV-C01-082 | Link threshold | 1000 | points | 800–1200 | Keyword plus mark links | liaison, forecast |
| DV-C01-083 | Linkage suspicion pre-war (a) / wartime (b) | 250 / 500 | units | 150–400 / 300–800 | Worse in war | liaison |
| DV-C01-084 | Wartime fusion edges GB↔FR | lag 3–21 d, retro, fidelity 1000 | s, ‰ | lag 1–60 d | Dense but late | liaison |
| DV-C01-085 | Pre-war partial edges GB↔FR | lag 30–120 d, not retro, fidelity 300 | s, ‰ | 0–500 | Partial; existence is design unless cited | liaison |
| DV-C01-086 | Police → master edges | lag 1–7 d, fidelity 500 | s, ‰ | 0–1000 | Slow paper | liaison, flip |
| DV-C01-087 | Master's own source lag | 0 | s | 0 | Claims held at once | liaison |
| DV-C01-088 | Confidence: registration / frontier / sighting | 900 / 950 / 700 | ‰ | 500–1000 | Paper beats sight | days, journey, flip |
| DV-C01-090 | Interest (deploy.AT, deploy.DE, naval.DE, orders.BALKAN, shipping.NL) | GB 500/600/1000/0/200; FR 800/1000/300/300/0; BE 0/0/0/1000/700 | ‰ | 0–1000 | Masters want different things | valuecurves |
| DV-C01-091 | Segment multipliers | table in 5.9 | ‰ | 0–1000 | Worth peaks at crises | valuecurves |
| DV-C01-092 | Topic places acquire / observe | deploy.AT Vienna; deploy.DE, naval.DE Berlin; orders.BALKAN Vienna, Berlin (+ Brussels to observe); shipping.NL Rotterdam (+ London to observe) | cities | — | Acquisition away from masters | tokens, factions |
| DV-C01-100 | Boost per credited success | 50 | ‰ | 20–100 | Success funds hunters | budget |
| DV-C01-101 | Boost cap | 300 | ‰ | 150–500 | Bounded feedback | budget |
| DV-C01-102 | Watcher share of funds | 200 | ‰ | 50–300 | Part reaches checking | budget |
| DV-C01-103 | Watcher annual cost GB / FR | 96000 farthings / 250000 c. | minor | ×0.5–2 | A few watchers | budget |
| DV-C01-104 | Fallback base funds; house fiscal year | flagged amount; 1 January | minor; date | — | Never shown as history | budget |
| DV-C01-110 | Particles per watcher (a), min (b), max (c) | 40, 40, 400 | count | 20–80; —; 200–800 | Funds buy search width | flip |
| DV-C01-111 | Hunt tick | 6 h | s | 3–12 h | Cheap, fine enough | flip |
| DV-C01-112 | Stay / max rides / fanout | 500 / 2 / 3 | ‰, n, n | 300–800; 1–3; 2–5 | Kit options | flip |
| DV-C01-113 | Sighting per watcher, cap | 30, 500 | ‰ | 10–60; 300–700 | Station watchers | flip |
| DV-C01-114 | Observe hit / miss | 1000 / 100 | ‰ | miss 0–300 | Kit weights | flip |
| DV-C01-115 | Arrest mass (a) / chance (b) | 600 / 500 | ‰ | 400–800 / 200–800 | Belief and power needed | flip |
| DV-C01-116 | No power row ⇒ `watch` | rule | — | — | No invented law | flip |
| DV-C01-117 | Seed records | 5 (weights 5..1) | count | 3–10 | Newest first | flip |
| DV-C01-120 | Haven fallback | none (no `Retire`) unless a cited row exists | rule | or NL, flagged | Retirement must rest on law | endings |
| DV-C01-121 | Retirement score | wealth at cited parity, GBP farthings | rule | — | One comparable number | endings |

---

## 7. Scenarios

Exact dates come from the frozen data. Prologues are mechanical scripts logged before `BeginPlay`, so late starts inherit an honest history; the player's legend choices fill their `CreateLegend` commands.

| Id | Start / end | Setup | Endings | World calendar needed |
|---|---|---|---|---|
| S1 Full run | 1 October 1912 / 30 September 1914 (to verify against the data window) | London; DV-C01-009; three legends; all masters `open` (tutorial: London first) | retired, captured, ruined, or survived with ledgers; autopsy after every flip | E1–E7; GB and FR fiscal-year starts; July–August 1914 (mobilisations, declarations, passport decrees, rail suspensions, state of siege, Aliens Restriction Act, Defence of the Realm Act); occupation of Brussels |
| S2 Between the wars | prologue from 1 October 1912; hand-over early March 1913 / 30 September 1914 | Three masters live; an original `deploy.AT` held in Vienna; an open fabrication to London maturing at E2 or E3 | as S1 | as S1 from March 1913, with the spring 1913 GB fiscal year |
| S3 The fusion | prologue from the first day of the 1914 data (spring 1914); hand-over early July 1914 / 30 September 1914 or last transcribed date | Three masters live; a `deploy.DE` original sold to Paris and its copy to London; a fabrication to London maturing at E6; keywords as chosen | as S1 | E6, E7, July–August 1914, occupation of Brussels; 1914 data only |

---

## 8. Tests

Vitest in `test/rules/` on the frozen bundle. Overrides touch only design rows or DV constants; cited values are read from the bundle. Scripts → `scenarios/logs/` → `scenarios/golden/`.

| # | Test | Scenario and script | Overrides | Assertion |
|---|---|---|---|---|
| T01 | Fabrication matures | S3: `Meet GB`; `Deliver` fab `deploy.DE` d=1; run past `dueAt` | 056 = 0 | One `Mature`; Δ = floor(300 × c × 800 / 1e6), c = the claim record's confidence; ledger cites [claim, outcome]; debt `failed`; credit −= `paid` |
| T02 | … serviced instead | As T01, then `Observe deploy.DE`, `Meet GB`, `Service` before `dueAt` | same | `isPending(seq)` false; no ledger entry for it; `serviced` |
| T03 | Double sale of a marked copy | S3, distinct keywords: Berlin `Acquire`, `Copy`; Paris `Deliver` original; London `Deliver` copy; run 30 days past the fusion opening | 040 = 1000; 084 lag [1 d, 1 d] | None before the opening; then one `doubleSale` each at GB and FR, Δ = floor(500 × cA × cB / 1e6); GB evidence 500, not linked |
| T04 | Shared keyword: link, flip, autopsy | T03 with A and B sharing a keyword; run to end | as T03; 083b = 1000 | Linkage record at GB; summons ≥ 7 d before the `flip` record; hunter exists; autopsy = flip → audit → [linkage, doubleSale] → both reports → `coop.edge` row id and arrival instants |
| T05 | … distinct keywords | T03 run to end | as T04 | No linkage; precondition s0 + Δdouble < 1000; GB not flipped |
| T06 | Readers at query time | T03 | as T03 | Store prefix before the opening is byte-identical after; `readersOf(copyClaim)` = [GB] the day before, includes FR after; `delivered(FR)` likewise |
| T07 | Backfill arrival | S3: one claim to GB before the opening, one after | 084 lag [L, L]; 087 = 0 | Delivery times `open + L` and `emit + L`, each equal to `arrival()` |
| T08 | Budget loop exact watchers | Unit, `SYN_` layer: base 960000, 102 = 200, 103 = 48000, 100 = 50, 101 = 300. Scenario: S2, n true deliveries to GB verified before the GB fiscal-year start | — | Unit: credited 0 → W = 4; 6 → 5; 10 → 5. Scenario: W = floor(floor(base × (1000 + min(300, 50n)) / 1000) × 200 / (1000 × 96000)), base from the cited row |
| T09 | Payment reversal | S3: `Deliver` fab d=2 to FR; run past `Verify` and `dueAt` | 056 = 0 | credit += exact 5.5 price, then −= it; trust −= 180; warning `reversal` |
| T10 | Powers follow nationality | T04 set-up; legend A on GB papers vs FR papers; player stays in London | 115a = 0; 115b = 1000 | Captured at the first tick on or after the start of the cited `hunt.powers` row saying `arrest` for (GB, national) or (GB, alien) respectively, never before; the trace cites that row; no row ⇒ never captured |
| T11 | Forecast isolation | any S3 state | — | Forecast output byte-identical after randomising every hidden field and changing private rows; static import check passes |
| T12 | Ramp invariant (property) | 200 seeds, S3, a bot choosing legal commands by keyed draws | — | Every flip has a same-master `summons` ≥ DV-C01-064 earlier and ≥ 1 warning in the 60 days before |
| T13 | Replay | every script | — | Golden hash; monthly snapshot → restore → same hash; Chromium `?test=1` = Node; save code with prologue round-trips |

---

## 9. UI screens

| Screen | View function | View data | Decisions |
|---|---|---|---|
| `Desk` | `deskView(state, pub, cal, today)` | 7 days: location, slots left, meeting days, announced audits, own maturities with `dueTitle`, expiring requirements, public world events and public liaison rows "as printed" | Where to be when; whom to visit; when to travel |
| `Composer` | `composerView(state, master, forecast)` | Held tokens (topic, kind, mark, `soldTo`, trend, price band); per topic three fabrication distances with price, maturity, `estDelta`; keyword and legends sharing it; marks that would reach two masters; requirements | What to whom; whether and how much to lie; whether to accept a signature |
| `Debts` | `debtsView(state, forecast)` | Open debts: master, topic, distance, due, test title, rolls, `estDelta`, where and when each action is possible, servicing tokens | Service, roll, buy back, plan travel |
| `Masters` | `mastersView(state, pub)` | Status, band, retainer, credit, payments and reversals, all questions asked, warnings (with `NoteCause`), fiscal year (credited, boost, W, W0); never store contents | Feed or let lapse; read warnings |
| `Journey` | `journeyView(state, tt, to, leaveAfter)` | Itineraries: times as printed with citations, changes and slack, nights aboard, classes, fares, crossings, papers allowed | Train, class, papers |
| `Newspaper` | `newspaperView(state, pub, cal)` | Fired Tier-0 events; public parameter changes (votes, statutes, suspensions) | Reading the reckonings |
| `Autopsy` | `autopsyView(state, store, params)` after a flip, termination or ending | Chain of 5.13 | Which report did it |
| `Setup`, `About`, `Questionnaire` | `setupView`, `aboutView`, `questionnaireView` | Legend form; build, freeze, sources, DVs in use; questions | Papers, keywords; answers |

---

## 10. Not in this MVP

Postal or telegraphic reports; provenance or whereabouts lies; households, accounts, name-bound instruments; commercial cover and two-book laundering; sequestration of the house's books; enemy services as hunters (Vienna and Berlin records are emitted where rows exist but unread); turning, death, succession, ageing, health; more than three masters; Russia; anything after September 1914; delays, missed connections, stale guides, porters (C07); cryptanalysis and handwriting signatures; audit dialogue beyond four responses; price negotiation; banks, bank hours, the 1914 moratoria; neutral hubs other than Rotterdam; a separate British home-section hunter.

---

## 11. Kit gaps

| # | Gap | Proposed API | Game fallback |
|---|---|---|---|
| K1 | Handlers and `validate` cannot reach the bundle (timetable, calendar); a restored `Sim` never runs `init` | `Ctx.bundle: Readonly<B>` | Singleton set by `bundleFrom`, checked against `state.dataHash` |
| K2 | `metrics(sim)` cannot read questionnaire answers | `metrics?(sim, answers?)`; `analyze.ts` passes `save.answers` | Analyst reads the answers columns |
| K3 | Cooperation edges lack fidelity and kind filters; `arrival` does not name the delivering row | `CoopEdge.permille?`, `CoopEdge.kinds?` in `arrival`/`readersOf`, draw `('liaison-pass', rec, reader, row)`; `arrivalVia() → {at, rowId}` | `liaisonUsed` (5.8); autopsy shows the row in force on the arrival day |
| K4 | `ParamRow.keyKind` has no `city` or `topic` | add both | `global` keyed by id |
| K5 | Prologue logs | `Scenario.prologue?: InputEntry[]` | Game helper for UI, tests, scripts |
| K6 | Tooling parses design ids as `DV-<digits>` (`tools/schema/design-values.ts`, V02) | accept `DV-[A-Z]\d{2}-\d{3,}` | Game DVs only in `design/design-values.json` |

Optional: `faresFor(data, edition, from, to, cls)`; otherwise in `rules/journey.ts`.

---

## 12. Open questions for the owner

1. **Should distinct keywords cost something**, making reuse tempting? Default: no; reuse is a measured setup choice.
2. **Pre-war flips without a cited power row.** Default: they stop pay and watch only (DV-C01-116).
3. **The commission house as a design row** rather than a named firm. Default: yes, labelled design; its legal environment stays cited.
4. **August–September 1914 timetables** for London–Paris and London–Rotterdam. Default: close segments at cited suspension dates, show the source gap, keep the 30 September end.
5. **Fusion opening date** if no source dates the start of liaison. Default: the cited British declaration of war, date basis `design`, stated on About.
6. **Kit gaps K1 and K2.** Default: accept both before P01 starts.
