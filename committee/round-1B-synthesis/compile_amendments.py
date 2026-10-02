#!/usr/bin/env python3
"""Secretary: compile Round 1B-3 ratification verdicts and amendments into AMENDMENTS.md for seconding."""
import re, glob, os
root = os.path.dirname(os.path.abspath(__file__))
files = sorted(glob.glob(os.path.join(root, "ratification", "P*-ratification.md")))
verdicts = {}; amendments = []
HEAD = re.compile(r"^###\s*(A-P\d\d-\d+)\s*[—–-]+\s*(.+)$")
for f in files:
    pan = os.path.basename(f)[:3]
    lines = open(f, encoding="utf-8").read().splitlines()
    sec = None; cur = None
    for i, line in enumerate(lines):
        if line.startswith("## "): sec = line.lower()
        if sec and "verdict" in sec and re.search(r"\b(RATIFY|AMEND)\b", line) and not line.startswith("#"):
            verdicts.setdefault(pan, "AMEND" if "AMEND" in line else "RATIFY")
        m = HEAD.match(line)
        if m:
            cur = {"id": m.group(1), "title": m.group(2).strip(), "by": pan, "change": "", "reason": ""}
            amendments.append(cur)
        elif cur is not None:
            if "**Change:**" in line: cur["change"] = line.split("**Change:**",1)[1].strip()
            elif "**Reason:**" in line: cur["reason"] = line.split("**Reason:**",1)[1].strip()
            elif line.startswith("## "): cur = None
print("# Round 1B-3 — Compiled amendments for seconding\n")
print("| Panelist | Verdict |\n|---|---|")
for p in sorted(verdicts): print(f"| {p} | {verdicts[p]} |")
print(f"\n{sum(1 for v in verdicts.values() if v=='RATIFY')} RATIFY, {sum(1 for v in verdicts.values() if v=='AMEND')} AMEND; {len(amendments)} amendments proposed.\n")
print("## Amendments\n")
for a in amendments:
    print(f"### {a['id']} (by {a['by']}) — {a['title']}\n- **Change:** {a['change']}\n- **Reason:** {a['reason']}\n")
