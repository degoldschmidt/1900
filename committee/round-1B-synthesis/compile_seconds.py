#!/usr/bin/env python3
"""Secretary: tally Round 1B-3 seconding positions per amendment and report which carry (>=2 supporters)."""
import re, glob, os
from collections import defaultdict
root = os.path.dirname(os.path.abspath(__file__))
files = sorted(glob.glob(os.path.join(root, "ratification", "P*-seconds.md")))
ROW = re.compile(r"^\|\s*(A-P\d\d-\d+)\s*\|\s*(SECOND|OBJECT|ABSTAIN|PROPOSER)\b[^|]*\|\s*(.*?)\s*\|?\s*$", re.I)
pos = defaultdict(dict); reasons = defaultdict(dict)
for f in files:
    pan = os.path.basename(f)[:3]
    for line in open(f, encoding="utf-8"):
        m = ROW.match(line.rstrip("\n"))
        if m:
            pos[m.group(1)][pan] = m.group(2).upper(); reasons[m.group(1)][pan] = m.group(3)
print(f"# Round 1B-3 — Seconding tally ({len(files)} panelists responded)\n")
print("| Amendment | Proposer | Seconds | Objections | Abstain | Supporters (proposer+seconds) | Carries by count? |")
print("|---|---|---|---|---|---|---|")
for a in sorted(pos, key=lambda x: (int(x[3:5]), int(x.split('-')[-1]))):
    prop = a[2:5]
    sec = sorted(p for p, v in pos[a].items() if v == "SECOND")
    obj = sorted(p for p, v in pos[a].items() if v == "OBJECT")
    abs_ = sorted(p for p, v in pos[a].items() if v == "ABSTAIN")
    supporters = 1 + len(sec)
    print(f"| {a} | {prop} | {', '.join(sec) or '—'} | {', '.join(obj) or '—'} | {', '.join(abs_) or '—'} | {supporters} | {'YES' if supporters >= 2 else 'no (unless it corrects a violation/factual error)'} |")
print("\n## Objection reasons\n")
for a in sorted(pos, key=lambda x: (int(x[3:5]), int(x.split('-')[-1]))):
    for p, v in sorted(pos[a].items()):
        if v == "OBJECT":
            print(f"- {a} — {p}: {reasons[a][p]}")
