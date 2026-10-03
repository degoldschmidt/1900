#!/usr/bin/env python3
"""Secretary's mechanical tally of Round 1B-1 reviews.

Reads reviews/P??-review.md, extracts nomination rows (| n | P##.## | title | rationale |),
merge proposals (### M-P##-k — title, with a **Members:** line) and flags (table rows whose
first cell is a proposal ID). Checks compliance: exactly 10 nominations, <=3 self-nominations.
Prints a support table (distinct nominating panelists per proposal) and a cluster view.
"""
import re, glob, os, sys
from collections import defaultdict, OrderedDict

root = os.path.dirname(os.path.abspath(__file__))
files = sorted(glob.glob(os.path.join(root, "reviews", "P*-review.md")))
NOM = re.compile(r"^\|\s*(\d{1,2})\s*\|\s*(P\d\d\.\d\d)\s*\|([^|]*)\|([^|]*)\|?\s*$")
MERGE_HEAD = re.compile(r"^###\s*(M-P\d\d-\d+)\s*[—–-]+\s*(.+)$")
MEMBERS = re.compile(r"\*\*Members:\*\*\s*(.+)")
FLAG = re.compile(r"^\|\s*(P\d\d\.\d\d)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|?\s*$")
IDRE = re.compile(r"P\d\d\.\d\d")

support = defaultdict(set); titles = {}; merges = []; flags = defaultdict(list); problems = []
for f in files:
    pan = os.path.basename(f)[:3]
    txt = open(f, encoding="utf-8").read().splitlines()
    noms = []; section = None; cur = None
    for line in txt:
        if line.startswith("## "):
            section = line.lower()
        m = NOM.match(line)
        if m and section and "nomination" in section:
            pid = m.group(2); noms.append(pid); titles.setdefault(pid, m.group(3).strip())
        mh = MERGE_HEAD.match(line)
        if mh:
            cur = {"id": mh.group(1), "title": mh.group(2).strip(), "by": pan, "members": []}
            merges.append(cur)
        mm = MEMBERS.search(line)
        if mm and cur is not None:
            cur["members"] = IDRE.findall(mm.group(1))
        fl = FLAG.match(line)
        if fl and section and "flag" in section:
            flags[fl.group(1)].append((pan, fl.group(2).strip(), fl.group(3).strip(), fl.group(4).strip()))
    own = [n for n in noms if n.startswith(pan)]
    if len(noms) != 10: problems.append(f"{pan}: {len(noms)} nominations (must be 10)")
    if len(own) > 3: problems.append(f"{pan}: {len(own)} self-nominations (max 3)")
    if len(set(noms)) != len(noms): problems.append(f"{pan}: duplicate nominations")
    for n in noms: support[n].add(pan)
    print(f"{pan}: {len(noms)} nominations ({len(own)} own), {sum(1 for m in merges if m['by']==pan)} merges, {sum(1 for v in flags.values() for x in v if x[0]==pan)} flags")

print("\n== Compliance ==")
print("\n".join(problems) if problems else "all reviews compliant")

print("\n== Support per proposal (distinct nominating panelists) ==")
rows = sorted(support.items(), key=lambda kv: (-len(kv[1]), kv[0]))
print("| Proposal | Support | Nominated by | Title (as written by first nominator) |")
print("|---|---|---|---|")
for pid, pans in rows:
    print(f"| {pid} | {len(pans)} | {', '.join(sorted(pans))} | {titles.get(pid,'')} |")
print(f"\n{len(support)} distinct proposals nominated; {sum(len(v) for v in support.values())} nominations total.")

print("\n== Merge proposals ==")
for m in merges:
    sup = set().union(*[support.get(x, set()) for x in m["members"]]) if m["members"] else set()
    print(f"- {m['id']} ({m['by']}) — {m['title']}: members {', '.join(m['members'])}; cluster support = {len(sup)} ({', '.join(sorted(sup))})")

# union-find clusters of proposals that co-occur in any merge proposal
parent = {}
def find(x):
    parent.setdefault(x, x)
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]
    return x
def union(a, b): parent[find(a)] = find(b)
for m in merges:
    for a in m["members"]:
        for b in m["members"]: union(a, b)
clusters = defaultdict(set)
for x in list(parent): clusters[find(x)].add(x)
print("\n== Connected merge clusters (union of overlapping merge proposals) ==")
for k, mem in sorted(clusters.items(), key=lambda kv: -len(set().union(*[support.get(x,set()) for x in kv[1]]))):
    sup = set().union(*[support.get(x, set()) for x in mem])
    print(f"- cluster support {len(sup)} ({', '.join(sorted(sup))}): {', '.join(sorted(mem))}")

print("\n== Flags ==")
for pid, lst in sorted(flags.items()):
    for pan, typ, reason, remedy in lst:
        print(f"- {pid} flagged by {pan} [{typ}]: {reason} → {remedy}")
