#!/usr/bin/env python3
"""Build the owner's pitch document for Project 1900.

Inputs (all produced by the committee process):
  pitches/data/candidates.json                       — the 20 final candidates (from CANDIDATES_FINAL.md)
  pitches/data/results.json                          — the Round 1C tally with per-ballot justifications
  committee/round-1C-voting/pitches/C??-*.md         — finalist pitches (Markdown, PITCH_TEMPLATE structure)
  committee/round-1C-voting/pitches/audits/C??-*.md  — audit notes (history / engine / hooks), optional

Outputs:
  pitches/index.html     — standalone document (doctype, head) for the repository
  pitches/artifact.html  — the same page as a fragment (title + style first) for publishing
"""
import json, re, glob, os, html, datetime
import mdlite

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "pitches", "data")
PITCH_DIR = os.path.join(ROOT, "committee", "round-1C-voting", "pitches")
AUDIT_DIR = os.path.join(PITCH_DIR, "audits")

cands = {c["id"]: c for c in json.load(open(os.path.join(DATA, "candidates.json"), encoding="utf-8"))}
res = json.load(open(os.path.join(DATA, "results.json"), encoding="utf-8"))
results = res["results"]
champions = res["champions"]
FINALISTS = [r["id"] for r in results[:5]]

ROLES = {
    "P01": "Core Loop & Systems Designer", "P02": "Simulation Engine Architect", "P03": "Period Historian (1895–1925)",
    "P04": "Travel & Logistics Designer", "P05": "Deception, Conversation & Cryptography Designer",
    "P06": "Economy, Business & Artifacts Designer", "P07": "Politics & Warfare Designer",
    "P08": "Pursuit & Hidden-Information Designer", "P09": "Player Psychology & Retention Designer",
    "P10": "Life-Sim & Character Progression Designer",
}
LENS = {
    "P01": "how the systems interlock into one compulsive loop", "P02": "the event, decision and dependency engine at scale",
    "P03": "historical accuracy as mechanical truth", "P04": "timetables, fares, routes as knowledge",
    "P05": "cover identities, claims, codes and forgery", "P06": "money, trade, debt, items with provenance",
    "P07": "factions, crises and bounded history", "P08": "the hunt: evidence, deduction, cordons, reveals",
    "P09": "why players stay, argued honestly", "P10": "the spy as a whole life over thirty years",
}
LEAD = {"C07": "P01", "C01": "P07", "C04": "P10", "C17": "P08", "C13": "P04"}
AUDIT_KINDS = [("history", "Historian's audit", "P03"), ("engine", "Engine audit", "P02"), ("hooks", "Hook-honesty audit", "P09")]

def esc(s): return html.escape(s, quote=True)
def inl(s): return mdlite.inline(s)
def ordinal(n): return f"{n}{'th' if 10 <= n % 100 <= 20 else {1:'st',2:'nd',3:'rd'}.get(n % 10, 'th')}"

def ramp_step(rank):  # 1..20 -> 6 (strongest) .. 1 (lightest); six validated steps per theme
    return 6 - min(5, (rank - 1) * 6 // 20)

# ---------- pitch files ----------
def load_pitch(cid):
    files = glob.glob(os.path.join(PITCH_DIR, f"{cid}-*.md"))
    if not files: return None
    md = open(files[0], encoding="utf-8").read()
    md = re.sub(r"^# .*\n", "", md, count=1)  # title rendered by the page
    return mdlite.convert(md, shift=1)

def load_audit(cid, kind):
    p = os.path.join(AUDIT_DIR, f"{cid}-{kind}.md")
    if not os.path.exists(p): return None
    md = open(p, encoding="utf-8").read()
    md = re.sub(r"^# .*\n", "", md, count=1)
    return mdlite.convert(md, shift=2)

# ---------- sections ----------
def masthead():
    return f"""
<header class="masthead">
  <p class="eyebrow">Game design committee · Decision round 1 · {datetime.date.today().strftime('%-d %B %Y')}</p>
  <h1>Project 1900</h1>
  <p class="dek">A spy's life, 1895–1925. Ten panelists, 120 proposals, twenty candidate games, one secret ballot, five pitches.</p>
  <p class="meta">Every idea here is a mechanic, not a story. The committee was bound by five directives and one prohibition; the record of how it reached this page is in the decision log.</p>
</header>"""

def toc():
    items = [("verdict", "The verdict"), ("brief", "The brief"), ("process", "How the panel decided"), ("panel", "The panel"),
             ("results", "The vote"), ("finalists", "Five pitches"), ("field", "The field"), ("record", "The record")]
    return '<nav class="toc" aria-label="Contents"><p class="toc-label">Contents</p><ol>' + "".join(
        f'<li><a href="#{a}">{t}</a></li>' for a, t in items) + "</ol></nav>"

def verdict():
    rows = []
    for r in results[:5]:
        c = cands[r["id"]]
        firsts = f"{r['firsts']} first-place" + ("" if r["firsts"] == 1 else "") if r["firsts"] else "no first-place"
        rows.append(f"""
      <li class="board-row">
        <span class="board-rank">{r['rank']}</span>
        <span class="board-main"><a href="#{r['id']}" class="board-title">{esc(c['title'])}</a><span class="board-pitch">{inl(c['fields'].get('One-line pitch',''))}</span></span>
        <span class="board-stats"><span class="stat"><span class="stat-v">{r['borda']}</span><span class="stat-k">Borda / 200</span></span><span class="stat"><span class="stat-v">{r['mean']:.2f}</span><span class="stat-k">mean score</span></span><span class="stat"><span class="stat-v">{r['firsts']}</span><span class="stat-k">1st-place votes</span></span></span>
      </li>""")
    return f"""
<section id="verdict" class="section section-verdict">
  <h2 class="section-title"><span class="section-no">Departures</span>The verdict</h2>
  <p class="lede">The panel converged on a spine: the railway timetable as the game's clock. Around it sit two identity systems that generate the drama and two record systems that make the hunt fair. The five finalists below are not rivals so much as the layers of one game; each pitch says how the others arrange around it.</p>
  <ol class="board">{''.join(rows)}
  </ol>
  <p class="board-foot">Borda count on complete rankings by ten panelists (first place earns 20 points, twentieth earns 1; maximum 200). Method fixed in the charter before any proposal existed.</p>
</section>"""

def brief():
    directives = [
        ("1", "Historically accurate", "set between 1895 and 1925."),
        ("2", "A life sim / RPG of a spy", "the career, business and private life of a freelance agent as one interlocking resource system (<em>Reilly, Ace of Spies</em>)."),
        ("3", "Incredibly deep systems", "travel (<em>Bradshaw's Guide</em>, <em>80 Days</em>), deception / conversation / coding, items / artifacts, economy / business, politics / warfare."),
        ("4", "Pressure", "time-sensitive events in a world that moves without the player, and hidden movement: the player is hunted, as in <em>Scotland Yard</em>."),
        ("5", "An engine", "efficient and scalable, for dynamic events, decisions, actions and dependencies."),
    ]
    cards = "".join(f'<li class="directive"><span class="directive-no">{n}</span><div><strong>{t}</strong> <span>{d}</span></div></li>' for n, t, d in directives)
    return f"""
<section id="brief" class="section">
  <h2 class="section-title"><span class="section-no">Orders</span>The brief</h2>
  <p>The owner gave the committee five base directives and asked it to be as creative as possible inside them.</p>
  <ol class="directives">{cards}</ol>
  <aside class="prohibition"><p class="label">The prohibition</p><p>No proposal may be about persons, story, graphics or style. Every idea must be gameplay and systems mechanics, with an argument for why the game would be captivating and addictive to play. Historical institutions, technologies and macro-events may be used as inputs to mechanics; characters, plots, scenes and art direction may not.</p></aside>
</section>"""

def process():
    stages = [
        ("1A", "Fan-out", "Ten panelists each wrote 10–12 proposals independently.", "120 proposals · 10 files · 39,630 words"),
        ("1B-1", "Review and nominate", "Each read the whole pool; 10 nominations (at most 3 of their own), up to 5 merges and 5 flags, plus a role-lens audit.", "100 nominations over 67 proposals · 50 merge proposals · 46 flags"),
        ("1B-2", "Synthesis", "A non-voting Rapporteur clustered the merges, applied every flag, and drafted twenty candidates with full provenance.", "20 candidates · 0 flags rejected · 5 recorded breadth adjustments"),
        ("1B-3", "Ratification", "Every panelist proposed three amendments; every amendment was then seconded by all nine others.", "30 amendments · 30 carried · 0 objections"),
        ("1C", "Secret ballot", "Complete rankings and 0–10 scores from all ten; Borda tally with no ties.", "10 ballots · top 5 to full pitches"),
        ("Pitches", "Writing and audit", "Lead authors by provenance; the Historian, the Engine Architect and the Psychologist audited every finalist.", "5 pitches · 3 audits each"),
    ]
    items = "".join(f"""<li class="stage"><span class="stage-code">{c}</span><div class="stage-body"><h3>{t}</h3><p>{d}</p><p class="stage-stat">{s}</p></div></li>""" for c, t, d, s in stages)
    return f"""
<section id="process" class="section">
  <h2 class="section-title"><span class="section-no">Timetable</span>How the panel decided</h2>
  <p>The process ran as a line with six stations. Rules of order and the voting method were fixed in the charter before a single proposal existed, so no method could be chosen to suit a result.</p>
  <ol class="line">{items}</ol>
  <p class="note">Full chronological record: <code>committee/DECISION_LOG.md</code>. Every proposal, review, amendment, seconding table and ballot is in the repository under <code>committee/</code>.</p>
</section>"""

def panel():
    rows = "".join(f'<li class="member"><span class="member-id">{p}</span><div><strong>{esc(ROLES[p])}</strong><span class="member-lens">{esc(LENS[p])}</span></div></li>' for p in ROLES)
    return f"""
<section id="panel" class="section">
  <h2 class="section-title"><span class="section-no">Roster</span>The panel</h2>
  <p>Ten voting panelists, each an independent agent with a distinct role. A Secretary ran the process and kept the record; a Rapporteur drafted the synthesis. Neither proposed ideas or voted.</p>
  <ul class="members">{rows}</ul>
</section>"""

def results_section():
    # bar chart
    bars = []
    for r in results:
        c = cands[r["id"]]
        pct = r["borda"] / 200 * 100
        cls = "bar finalist" if r["id"] in FINALISTS else "bar"
        tip = f"{c['title']} — Borda {r['borda']} of 200 · mean score {r['mean']:.2f} · median {r['median']:g} · {r['firsts']} first-place vote{'s' if r['firsts']!=1 else ''} · best rank {r['best']}, worst {r['worst']}"
        bars.append(f"""<li class="bar-row" tabindex="0" data-tip="{esc(tip)}" aria-label="{esc(tip)}">
        <span class="bar-label"><span class="bar-rank">{r['rank']}</span><span class="bar-id">{r['id']}</span><a href="#{r['id']}">{esc(c['title'])}</a></span>
        <span class="bar-track"><span class="{cls}" style="width:{pct:.1f}%"></span></span>
        <span class="bar-value">{r['borda']}</span></li>""")
    # rank matrix
    head = "".join(f'<th scope="col" title="{esc(ROLES[p])}">{p}</th>' for p in res["ballots"])
    body = []
    for r in results:
        c = cands[r["id"]]
        cells = []
        for p in res["ballots"]:
            rk = r["ranks"][p]; sc = r["scores"][p]; j = r["justifications"].get(p, "")
            step = ramp_step(rk)
            tip = f"{p} ({ROLES[p]}) ranked {c['title']} {ordinal(rk)}, score {sc:g}: {j}"
            cells.append(f'<td class="cell s{step}" tabindex="0" data-tip="{esc(tip)}" aria-label="{esc(tip)}">{rk}</td>')
        body.append(f'<tr><th scope="row"><span class="bar-id">{r["id"]}</span> {esc(c["title"])}</th>{"".join(cells)}<td class="cell-sum">{r["borda"]}</td></tr>')
    champs = []
    for p in res["ballots"]:
        ch = champions[p]
        champs.append(f'<li><span class="member-id">{p}</span> <strong>{esc(cands[ch["candidate"]]["title"])}</strong> <span class="muted">({ch["candidate"]})</span></li>')
    return f"""
<section id="results" class="section section-wide">
  <h2 class="section-title"><span class="section-no">Returns</span>The vote</h2>
  <p>Each panelist ranked all twenty candidates and scored each from 0 to 10. The question put to them: if the owner could build only one of these as the game's defining concept, the spine around which the other systems are arranged, which should it be?</p>
  <figure class="chart">
    <figcaption><strong>Borda points by candidate</strong> <span class="muted">· finalists in full ink · hover or focus a row for the detail</span></figcaption>
    <div class="axis"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span></div>
    <ol class="bars">{''.join(bars)}</ol>
  </figure>
  <figure class="chart">
    <figcaption><strong>How each panelist ranked each candidate</strong> <span class="muted">· darker is higher · hover or focus a cell for that panelist's one-line reason</span></figcaption>
    <div class="matrix-wrap"><table class="matrix"><thead><tr><th scope="col">Candidate</th>{head}<th scope="col">Borda</th></tr></thead><tbody>{''.join(body)}</tbody></table></div>
  </figure>
  <div class="champions"><p class="label">Each panelist's champion</p><ul>{''.join(champs)}</ul></div>
</section>"""

def panel_said(cid):
    r = next(x for x in results if x["id"] == cid)
    items = []
    for p in res["ballots"]:
        items.append(f'<li><span class="said-who"><span class="member-id">{p}</span> ranked {ordinal(r["ranks"][p])}, scored {r["scores"][p]:g}</span><span class="said-what">{inl(r["justifications"].get(p,""))}</span></li>')
    return f'<details class="said"><summary>What the panel said <span class="muted">· ten one-line justifications</span></summary><ul>{"".join(items)}</ul></details>'

def finalists():
    arts = []
    for r in results[:5]:
        cid = r["id"]; c = cands[cid]
        body = load_pitch(cid)
        if body is None:
            body = '<p class="pending">The full pitch is being written by the panel and will appear here.</p>'
        ch = [p for p in res["ballots"] if champions[p]["candidate"] == cid]
        champ_html = ""
        if ch:
            champ_html = '<div class="champ-statements"><p class="label">Champion statements</p>' + "".join(
                f'<blockquote><p>{inl(champions[p]["statement"])}</p><footer><span class="member-id">{p}</span> {esc(ROLES[p])}</footer></blockquote>' for p in ch) + "</div>"
        audits = []
        for kind, label, who in AUDIT_KINDS:
            a = load_audit(cid, kind)
            if a: audits.append(f'<div class="audit"><p class="label">{label} <span class="muted">· {who}</span></p>{a}</div>')
        audit_html = f'<div class="audits">{"".join(audits)}</div>' if audits else ""
        arts.append(f"""
  <article class="pitch" id="{cid}">
    <header class="pitch-head">
      <span class="pitch-rank">{r['rank']}</span>
      <div>
        <p class="eyebrow">{cid} · {esc(c['fields'].get('Type',''))} · lead author {LEAD.get(cid,'')} ({esc(ROLES.get(LEAD.get(cid,''),''))})</p>
        <h3>{esc(c['title'])}</h3>
        <p class="pitch-one">{inl(c['fields'].get('One-line pitch',''))}</p>
        <p class="pitch-stats"><span>Borda <strong>{r['borda']}</strong>/200</span><span>mean <strong>{r['mean']:.2f}</strong></span><span>first-place votes <strong>{r['firsts']}</strong></span><span>ranked between <strong>{ordinal(r['best'])}</strong> and <strong>{ordinal(r['worst'])}</strong></span></p>
      </div>
    </header>
    <div class="pitch-body">{body}</div>
    {champ_html}
    {audit_html}
    {panel_said(cid)}
    <p class="provenance"><span class="label">Provenance</span> {inl(c['fields'].get('Provenance',''))}</p>
  </article>""")
    return f"""
<section id="finalists" class="section">
  <h2 class="section-title"><span class="section-no">Pitches</span>Five pitches</h2>
  <p>Each finalist was written up by the panelist who authored its lead proposal (or, for the fifth, by the designer who co-authored a member proposal, because the lead author served as engine auditor). Three auditors then read every pitch: the Historian for accuracy, the Engine Architect for feasibility, and the Psychologist for the honesty of the addiction argument. Their notes follow each pitch, and the lead authors applied the corrections.</p>
  {''.join(arts)}
</section>"""

FIELD_ORDER = ["Central hook", "How it plays", "Directive coverage", "Why captivating & addictive", "Engine implications", "Historical grounding", "Support", "Amendments applied", "Provenance"]

def field():
    cards = []
    for r in results[5:]:
        cid = r["id"]; c = cands[cid]; f = c["fields"]
        rows = "".join(f'<div class="kv"><dt>{esc(k)}</dt><dd>{inl(f[k])}</dd></div>' for k in FIELD_ORDER if k in f)
        cards.append(f"""
  <article class="card" id="{cid}">
    <header class="card-head"><span class="card-rank">{r['rank']}</span><div><p class="eyebrow">{cid} · {esc(f.get('Type',''))} · Borda {r['borda']} · mean {r['mean']:.2f}</p><h3>{esc(c['title'])}</h3><p class="card-one">{inl(f.get('One-line pitch',''))}</p></div></header>
    <details><summary>Full candidate text</summary><dl class="kvs">{rows}</dl></details>
    {panel_said(cid)}
  </article>""")
    return f"""
<section id="field" class="section">
  <h2 class="section-title"><span class="section-no">Field</span>The field</h2>
  <p>The fifteen candidates ranked sixth to twentieth, in the panel's order, with their final text as ratified. Most are systems the finalists already presume; the vote ranked spines, not worth. <em>Thirty Winters</em> missed the final five by four Borda points.</p>
  {''.join(cards)}
</section>"""

def record():
    return """
<section id="record" class="section">
  <h2 class="section-title"><span class="section-no">Archive</span>The record</h2>
  <div class="record-grid">
    <div><p class="label">Identifiers</p><p><code>P04.07</code> is panelist P04's seventh proposal; <code>C07</code> is the seventh candidate on the ratified list (identifiers were fixed before the vote, so they are not ranks); <code>M-P03-2</code> is P03's second merge proposal; <code>A-P10-1</code> is P10's first amendment.</p></div>
    <div><p class="label">Method</p><p>Nominations capped at ten per panelist with at most three self-nominations. A cluster's support is the number of distinct panelists who nominated any member, never a sum. Amendments carried with two supporters or on a factual correction; all thirty carried with ten. The ballot was secret; the tally is Borda first, mean score second, first-place count third.</p></div>
    <div><p class="label">Files</p><ul class="files">
      <li><code>committee/CHARTER.md</code> brief, roster, rules of order, errata</li>
      <li><code>committee/DECISION_LOG.md</code> every decision and event, timestamped</li>
      <li><code>committee/round-1A-proposals/</code> 120 proposals</li>
      <li><code>committee/round-1B-synthesis/</code> pool, reviews, tally, draft, amendments, seconding, final list</li>
      <li><code>committee/round-1C-voting/</code> ballots, results, finalist pitches and audits</li>
    </ul></div>
    <div><p class="label">Touchstones, as mechanics</p><p><em>Reilly, Ace of Spies</em>: commerce, espionage and private life as one resource system that ends in a hunt. <em>Bradshaw's Guide</em>: a dense, time-stamped network of departures and fares. <em>80 Days</em>: routes as discovered knowledge under a global clock. <em>Scotland Yard</em>: asymmetric information, trace evidence by mode of travel, periodic reveals, cordons.</p></div>
  </div>
</section>"""

CSS = r"""
/* Layout: a bound committee report. Left index rail on wide screens, a 68ch reading column for the pitches,
   full-width data sections for the vote; one bold moment, the departures board of finalists. */
:root{
  --paper:#eef1f6; --surface:#ffffff; --surface-2:#f6f7fb; --ink:#141a2e; --ink-2:#464c63; --muted:#7b8196;
  --hair:#d6dbe6; --rule:#aeb6c8; --accent:#2f3f9e; --accent-strong:#1f2b73; --accent-soft:#e3e7f8;
  --wax:#a8322a; --wax-soft:#f6e4e2; --on-strong:#ffffff;
  --r1:#9aa6e3; --r2:#7a88d6; --r3:#5e6ec9; --r4:#4555b8; --r5:#303fa0; --r6:#1f2b73; --bar-rest:#9aa6e3;
  --font-display:"Bodoni Moda","Didot","Bodoni MT",Georgia,serif;
  --font-body:"Source Serif 4",Georgia,"Times New Roman",serif;
  --font-mono:"IBM Plex Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --measure:68ch;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --paper:#0f1320; --surface:#171c2c; --surface-2:#1d2334; --ink:#e9ebf3; --ink-2:#b7bccb; --muted:#8089a0;
  --hair:#2b3246; --rule:#444d66; --accent:#8d9bf0; --accent-strong:#b3bef7; --accent-soft:#232b48;
  --wax:#e38a82; --wax-soft:#3a2426; --on-strong:#0f1320;
  --r1:#4a589a; --r2:#6474bd; --r3:#7f8fd9; --r4:#9aa8ee; --r5:#b6c0f7; --r6:#d3dafc; --bar-rest:#4a589a;
  color-scheme:dark } }
:root[data-theme="dark"]{
  --paper:#0f1320; --surface:#171c2c; --surface-2:#1d2334; --ink:#e9ebf3; --ink-2:#b7bccb; --muted:#8089a0;
  --hair:#2b3246; --rule:#444d66; --accent:#8d9bf0; --accent-strong:#b3bef7; --accent-soft:#232b48;
  --wax:#e38a82; --wax-soft:#3a2426; --on-strong:#0f1320;
  --r1:#4a589a; --r2:#6474bd; --r3:#7f8fd9; --r4:#9aa8ee; --r5:#b6c0f7; --r6:#d3dafc; --bar-rest:#4a589a;
  color-scheme:dark }

*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font-body);font-size:17px;line-height:1.55;
  -webkit-font-smoothing:antialiased;padding-inline:16px;padding-block:0 4rem}
a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:2px}
a:hover{color:var(--accent-strong)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
code{font-family:var(--font-mono);font-size:.85em;background:var(--surface-2);padding:.05em .35em;border-radius:3px}
h1,h2,h3,h4{font-family:var(--font-display);font-weight:500;line-height:1.1;text-wrap:balance;margin:0}
p{margin:0}
.muted{color:var(--muted)}
.label,.eyebrow,.toc-label,.stat-k,.stage-code,.member-id,.bar-id,.section-no{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}

.page{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:0 3rem}
@media (min-width:1000px){.page{grid-template-columns:200px minmax(0,1fr)} .toc{position:sticky;top:calc(env(safe-area-inset-top,0px) + 1.5rem);align-self:start} .masthead{grid-column:1/-1}}
.masthead{padding-block:3.5rem 2.5rem;border-bottom:1px solid var(--rule);margin-bottom:2rem}
.masthead h1{font-size:clamp(3rem,8vw,6rem);font-weight:400;letter-spacing:-.01em;margin-block:.4rem .9rem;color:var(--ink)}
.masthead .dek{font-size:clamp(1.15rem,2vw,1.5rem);max-width:40ch;line-height:1.3;font-family:var(--font-display);font-weight:400;color:var(--ink)}
.masthead .meta{max-width:var(--measure);margin-top:1rem;color:var(--ink-2)}

.toc ol{list-style:none;padding:0;margin:.6rem 0 2rem;display:flex;flex-wrap:wrap;gap:.35rem 1.1rem}
@media (min-width:1000px){.toc ol{flex-direction:column;gap:.45rem}}
.toc a{color:var(--ink-2);text-decoration:none;font-size:.95rem}
.toc a:hover{color:var(--accent)}
main{min-width:0}
.section{padding-block:1.5rem 2.5rem;border-bottom:1px solid var(--hair)}
.section > p, .section .lede, .section .note{max-width:var(--measure);color:var(--ink-2)}
.section > p + p{margin-top:.75rem}
.section-title{font-size:clamp(1.8rem,3.5vw,2.4rem);margin-bottom:1rem;display:flex;flex-direction:column;gap:.35rem}
.lede{font-size:1.1rem;color:var(--ink)}

/* departures board */
.board{list-style:none;padding:0;margin:1.75rem 0 .75rem;border-top:2px solid var(--ink);background:var(--surface)}
.board-row{display:grid;grid-template-columns:3.2rem minmax(0,1fr);gap:.25rem 1rem;padding:1rem .75rem;border-bottom:1px solid var(--hair);align-items:start}
@media (min-width:760px){.board-row{grid-template-columns:4rem minmax(0,1fr) auto}}
.board-rank{font-family:var(--font-display);font-size:2.6rem;line-height:1;color:var(--accent);font-weight:400;grid-row:span 2}
@media (min-width:760px){.board-rank{grid-row:auto}}
.board-main{display:flex;flex-direction:column;gap:.25rem;min-width:0}
.board-title{font-family:var(--font-display);font-size:1.45rem;line-height:1.15;color:var(--ink);text-decoration:none}
.board-title:hover{color:var(--accent)}
.board-pitch{color:var(--ink-2);max-width:60ch}
.board-stats{display:flex;gap:1.25rem;grid-column:2;flex-wrap:wrap}
@media (min-width:760px){.board-stats{grid-column:auto;justify-self:end;text-align:right}}
.stat{display:flex;flex-direction:column;gap:.15rem}
.stat-v{font-family:var(--font-mono);font-size:1.15rem;color:var(--ink)}
.board-foot{font-size:.9rem;color:var(--muted);max-width:var(--measure)}

/* brief */
.directives{list-style:none;padding:0;margin:1.25rem 0;display:grid;gap:.75rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.directive{display:flex;gap:.9rem;padding:1rem;background:var(--surface);border:1px solid var(--hair)}
.directive-no{font-family:var(--font-display);font-size:1.9rem;line-height:1;color:var(--accent)}
.directive strong{display:block;font-family:var(--font-display);font-size:1.15rem;font-weight:500;margin-bottom:.25rem}
.directive span{color:var(--ink-2)}
.prohibition{max-width:var(--measure);margin-top:1.25rem;padding:1rem 1.1rem;border-left:3px solid var(--wax);background:var(--wax-soft);color:var(--ink)}
.prohibition .label{color:var(--wax);margin-bottom:.35rem}

/* line diagram */
.line{list-style:none;padding:0;margin:1.5rem 0 1.25rem;position:relative;max-width:760px}
.line::before{content:"";position:absolute;left:4.2rem;top:.9rem;bottom:.9rem;width:2px;background:var(--rule)}
.stage{display:grid;grid-template-columns:3.4rem minmax(0,1fr);gap:1.6rem;padding-block:.6rem;position:relative}
.stage::before{content:"";position:absolute;left:calc(4.2rem - 6px);top:1.05rem;width:14px;height:14px;border-radius:50%;background:var(--surface);border:3px solid var(--accent)}
.stage-code{color:var(--accent);align-self:start;padding-top:.45rem;text-align:right}
.stage-body h3{font-size:1.2rem;margin-bottom:.2rem}
.stage-body p{color:var(--ink-2)}
.stage-stat{font-family:var(--font-mono);font-size:.8rem;color:var(--muted);margin-top:.25rem}

/* panel */
.members{list-style:none;padding:0;margin:1.25rem 0 0;display:grid;gap:.6rem .75rem;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.member{display:flex;gap:.9rem;align-items:baseline;padding:.65rem .8rem;border-top:1px solid var(--hair)}
.member strong{display:block;font-weight:600}
.member-lens{color:var(--muted);font-size:.92rem}
.member .member-id{color:var(--accent)}

/* charts */
.chart{margin:1.75rem 0 0;background:var(--surface);border:1px solid var(--hair);padding:1rem;overflow:hidden}
.chart figcaption{margin-bottom:.9rem;color:var(--ink)}
.axis{display:grid;grid-template-columns:minmax(0,1fr) 3.2rem;margin-bottom:.35rem}
.axis span{display:none}
@media (min-width:720px){.axis{grid-template-columns:17rem minmax(0,1fr) 3.2rem} .axis span{display:block}}
.axis{position:relative;font-family:var(--font-mono);font-size:.72rem;color:var(--muted)}
@media (min-width:720px){.axis::before{content:"";grid-column:2;display:flex} .axis span{position:absolute;transform:translateX(-50%)} .axis span:nth-child(1){left:17rem} .axis span:nth-child(2){left:calc(17rem + (100% - 17rem - 3.2rem)*.25)} .axis span:nth-child(3){left:calc(17rem + (100% - 17rem - 3.2rem)*.5)} .axis span:nth-child(4){left:calc(17rem + (100% - 17rem - 3.2rem)*.75)} .axis span:nth-child(5){left:calc(100% - 3.2rem)}}
.bars{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}
.bar-row{display:grid;grid-template-columns:minmax(0,1fr) 3.2rem;gap:.15rem .75rem;align-items:center;padding:.2rem .25rem;border-radius:3px;cursor:default}
@media (min-width:720px){.bar-row{grid-template-columns:17rem minmax(0,1fr) 3.2rem}}
.bar-row:hover,.bar-row:focus-visible{background:var(--surface-2)}
.bar-label{display:flex;gap:.5rem;align-items:baseline;min-width:0;font-size:.92rem}
.bar-label a{color:var(--ink);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar-rank{font-family:var(--font-mono);font-size:.78rem;color:var(--muted);width:1.4rem;flex:none;text-align:right}
.bar-track{position:relative;height:14px;background:transparent;grid-column:1;border-left:1px solid var(--rule)}
@media (min-width:720px){.bar-track{grid-column:auto}}
.bar{display:block;height:100%;background:var(--bar-rest);border-radius:0 4px 4px 0}
.bar.finalist{background:var(--accent)}
.bar-value{font-family:var(--font-mono);font-size:.85rem;text-align:right;font-variant-numeric:tabular-nums;grid-column:2;grid-row:1}
@media (min-width:720px){.bar-value{grid-column:auto;grid-row:auto}}
.matrix-wrap{overflow-x:auto}
.matrix{border-collapse:separate;border-spacing:2px;font-size:.85rem;min-width:720px;width:100%}
.matrix th{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.04em;color:var(--muted);text-align:left;font-weight:500;padding:.2rem .35rem;white-space:nowrap}
.matrix thead th{text-align:center}
.matrix tbody th{max-width:17rem;overflow:hidden;text-overflow:ellipsis;font-family:var(--font-body);font-size:.9rem;color:var(--ink);letter-spacing:0;text-transform:none}
.cell{text-align:center;font-family:var(--font-mono);font-variant-numeric:tabular-nums;width:2.6rem;height:1.9rem;border-radius:3px;color:var(--ink);cursor:default}
.cell:hover,.cell:focus-visible{outline:2px solid var(--ink);outline-offset:-2px}
.s1{background:var(--r1)} .s2{background:var(--r2)} .s3{background:var(--r3);color:var(--on-strong)} .s4{background:var(--r4);color:var(--on-strong)} .s5{background:var(--r5);color:var(--on-strong)} .s6{background:var(--r6);color:var(--on-strong)}
.cell-sum{text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums;color:var(--ink-2);padding-left:.5rem}
.champions{margin-top:1.5rem;max-width:var(--measure)}
.champions ul{list-style:none;padding:0;margin:.5rem 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.3rem 1rem}
.champions li{padding:.3rem 0;border-top:1px solid var(--hair);font-size:.95rem}
.tooltip{position:fixed;z-index:10;max-width:min(380px,calc(100vw - 32px));background:var(--ink);color:var(--paper);padding:.6rem .75rem;font-size:.85rem;line-height:1.4;border-radius:4px;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.18)}
.tooltip[hidden]{display:none}

/* finalist pitches */
.pitch{margin-top:2.5rem;padding-top:1.5rem;border-top:2px solid var(--ink)}
.pitch-head{display:grid;grid-template-columns:auto minmax(0,1fr);gap:1.25rem;align-items:start;margin-bottom:1.5rem}
.pitch-rank{font-family:var(--font-display);font-size:clamp(3.5rem,8vw,5.5rem);line-height:.9;color:var(--accent);font-weight:400}
.pitch-head h3{font-size:clamp(1.7rem,3.5vw,2.4rem);margin-block:.3rem .6rem}
.pitch-one{font-size:1.15rem;color:var(--ink);max-width:var(--measure);font-family:var(--font-display);font-weight:400;line-height:1.3}
.pitch-stats{display:flex;flex-wrap:wrap;gap:.4rem 1.25rem;margin-top:.75rem;font-family:var(--font-mono);font-size:.78rem;color:var(--muted)}
.pitch-stats strong{color:var(--ink);font-weight:500}
.pitch-body{max-width:var(--measure)}
.pitch-body > *+*{margin-top:.9rem}
.pitch-body h3{font-size:1.35rem;margin-top:2rem;padding-top:.75rem;border-top:1px solid var(--hair)}
.pitch-body h3:first-child{border-top:0;margin-top:0;padding-top:0}
.pitch-body h4{font-size:1.1rem;margin-top:1.25rem}
.pitch-body ul,.pitch-body ol{padding-left:1.25rem}
.pitch-body li{margin-top:.35rem}
.pitch-body em:first-child{color:var(--ink-2)}
.pitch-body table{border-collapse:collapse;font-size:.92rem;display:block;overflow-x:auto;max-width:100%}
.pitch-body th,.pitch-body td{border-bottom:1px solid var(--hair);padding:.35rem .6rem;text-align:left;vertical-align:top}
.pitch-body hr{border:0;border-top:1px solid var(--hair)}
.pending{color:var(--muted);font-style:italic}
.champ-statements{max-width:var(--measure);margin-top:2rem}
.champ-statements blockquote{margin:.75rem 0 0;padding:1rem 1.1rem;background:var(--surface);border-left:3px solid var(--accent)}
.champ-statements footer{margin-top:.5rem;font-size:.85rem;color:var(--muted)}
.audits{display:grid;gap:.75rem;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin-top:2rem}
.audit{padding:1rem 1.1rem;background:var(--surface-2);border:1px solid var(--hair);font-size:.95rem;min-width:0}
.audit .label{margin-bottom:.5rem;color:var(--accent)}
.audit > *+*{margin-top:.6rem}
.audit h4{font-size:1rem;margin-top:.8rem}
.audit ul,.audit ol{padding-left:1.1rem}
.said{max-width:var(--measure);margin-top:1.5rem}
.said summary{cursor:pointer;font-weight:600}
.said ul{list-style:none;padding:0;margin:.6rem 0 0}
.said li{display:grid;grid-template-columns:1fr;gap:.1rem .9rem;padding:.5rem 0;border-top:1px solid var(--hair);font-size:.95rem}
@media (min-width:640px){.said li{grid-template-columns:13rem minmax(0,1fr)}}
.said-who{font-family:var(--font-mono);font-size:.75rem;color:var(--muted);letter-spacing:.02em}
.provenance{margin-top:1.25rem;font-size:.9rem;color:var(--ink-2);max-width:var(--measure)}
.provenance .label{display:inline;margin-right:.4rem}

/* field cards */
.card{margin-top:1.75rem;padding:1.25rem 1.25rem 1rem;background:var(--surface);border:1px solid var(--hair)}
.card-head{display:grid;grid-template-columns:auto minmax(0,1fr);gap:1rem;align-items:start}
.card-rank{font-family:var(--font-display);font-size:2.4rem;line-height:1;color:var(--muted);font-weight:400;min-width:2.2rem}
.card-head h3{font-size:1.45rem;margin-block:.25rem .4rem}
.card-one{color:var(--ink-2);max-width:var(--measure)}
.card details{margin-top:.9rem;max-width:var(--measure)}
.card summary{cursor:pointer;color:var(--accent)}
.kvs{margin:.75rem 0 0;display:flex;flex-direction:column;gap:.7rem}
.kv dt{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.15rem}
.kv dd{margin:0;color:var(--ink)}

/* record */
.record-grid{display:grid;gap:1.25rem 2rem;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin-top:1.25rem}
.record-grid p{color:var(--ink-2)}
.record-grid .label{margin-bottom:.35rem;color:var(--accent)}
.files{list-style:none;padding:0;margin:0;color:var(--ink-2)}
.files li{padding:.25rem 0;border-top:1px solid var(--hair)}
.files code{margin-right:.4rem}
footer.colophon{max-width:var(--measure);margin-top:2rem;color:var(--muted);font-size:.88rem}
@media (prefers-reduced-motion: no-preference){ .bar{transition:width .4s ease} }
"""

JS = r"""
(function(){
  var tip=document.createElement('div');tip.className='tooltip';tip.hidden=true;tip.setAttribute('role','status');document.body.appendChild(tip);
  function show(el,x,y){tip.textContent=el.getAttribute('data-tip');tip.hidden=false;var w=tip.offsetWidth,h=tip.offsetHeight;var left=Math.min(Math.max(8,x+14),window.innerWidth-w-8);var top=y+18;if(top+h>window.innerHeight-8)top=y-h-12;tip.style.left=left+'px';tip.style.top=top+'px';}
  function hide(){tip.hidden=true}
  document.querySelectorAll('[data-tip]').forEach(function(el){
    el.addEventListener('mousemove',function(e){show(el,e.clientX,e.clientY)});
    el.addEventListener('mouseleave',hide);
    el.addEventListener('focus',function(){var r=el.getBoundingClientRect();show(el,r.left+r.width/2,r.top+r.height/2)});
    el.addEventListener('blur',hide);
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')hide()});
})();
"""

def fragment():
    return f"""<title>Project 1900 Pitches</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>{CSS}</style>
<div class="page">
{masthead()}
{toc()}
<main>
{verdict()}
{brief()}
{process()}
{panel()}
{results_section()}
{finalists()}
{field()}
{record()}
<footer class="colophon"><p>Compiled by the committee Secretary from the committee's own files on {datetime.date.today().strftime('%-d %B %Y')}. Nothing on this page was written outside the process recorded in the decision log.</p></footer>
</main>
</div>
<script>{JS}</script>
"""

if __name__ == "__main__":
    frag = fragment()
    open(os.path.join(ROOT, "pitches", "artifact.html"), "w", encoding="utf-8").write(frag)
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + frag.split("</style>", 1)[0] + "</style>\n</head>\n<body>\n" + frag.split("</style>", 1)[1] + "</body>\n</html>\n")
    open(os.path.join(ROOT, "pitches", "index.html"), "w", encoding="utf-8").write(full)
    have = [c for c in FINALISTS if load_pitch(c)]
    print(f"built index.html ({len(full)//1024} KB) and artifact.html; finalist pitches present: {have or 'none yet'}")
