#!/usr/bin/env python3
"""Parse CANDIDATES_FINAL.md into candidates.json for the pitch document."""
import re, json, sys
src = sys.argv[1] if len(sys.argv) > 1 else "/home/user/1900/committee/round-1B-synthesis/CANDIDATES_FINAL.md"
out = sys.argv[2] if len(sys.argv) > 2 else "/home/user/1900/pitches/data/candidates.json"
txt = open(src, encoding="utf-8").read()
body = txt.split("\n## Candidates", 1)[1]
blocks = re.split(r"\n(?=## C\d\d — )", body)
cands = []
for b in blocks:
    m = re.match(r"## (C\d\d) — (.+)", b.strip())
    if not m: continue
    cid, title = m.group(1), m.group(2).strip()
    fields = {}
    for fm in re.finditer(r"^- \*\*([^*]+):\*\*\s*(.*?)(?=\n- \*\*|\Z)", b, flags=re.S | re.M):
        fields[fm.group(1).strip()] = " ".join(fm.group(2).split())
    sup = fields.get("Support", "")
    sm = re.search(r"(\d+)", sup)
    cands.append({"id": cid, "title": title, "support": int(sm.group(1)) if sm else None, "fields": fields})
json.dump(cands, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(cands)} candidates → {out}")
for c in cands:
    missing = [k for k in ["Type","One-line pitch","Central hook","How it plays","Directive coverage","Why captivating & addictive","Engine implications","Historical grounding","Provenance","Support","Flags addressed","Amendments applied"] if k not in c["fields"]]
    if missing: print("  ", c["id"], "missing", missing)
