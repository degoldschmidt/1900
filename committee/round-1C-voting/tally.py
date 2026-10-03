#!/usr/bin/env python3
"""Secretary's tally for Round 1C, implementing the method fixed in the Charter.

Primary:   Borda count — rank r earns (21 - r) points (max 200 across 10 ballots).
Secondary: mean score (0-10).
Tiebreak:  number of first-place ranks; then a recorded coin toss (seeded, logged).

Usage: python3 tally.py ballots/*.md > RESULTS.md
Each ballot is a Markdown table with rows: | rank | C## | score | justification |
Validation: every ballot must rank all 20 candidates (C01..C20) exactly once with ranks 1..20.
"""
import re, sys, glob, random, statistics
from collections import defaultdict

CANDS = [f"C{i:02d}" for i in range(1, 21)]
ROW = re.compile(r"^\|\s*(\d{1,2})\s*\|\s*(C\d{2})\b[^|]*\|\s*(\d{1,2}(?:\.\d+)?)\s*\|\s*(.*?)\s*\|?\s*$")

def parse(path):
    ranks, scores, just = {}, {}, {}
    champion, in_champ = [], False
    for line in open(path, encoding="utf-8"):
        if line.startswith("## "):
            in_champ = "champion" in line.lower()
            continue
        if in_champ and line.strip():
            champion.append(line.strip())
        m = ROW.match(line.rstrip("\n"))
        if not m:
            continue
        r, c, s, j = int(m.group(1)), m.group(2), float(m.group(3)), m.group(4)
        if c in ranks:
            raise SystemExit(f"{path}: {c} appears twice")
        if not (1 <= r <= 20) or not (0 <= s <= 10):
            raise SystemExit(f"{path}: bad rank/score for {c}: {r}/{s}")
        ranks[c], scores[c], just[c] = r, s, j
    missing = [c for c in CANDS if c not in ranks]
    extra = [c for c in ranks if c not in CANDS]
    if missing or extra or sorted(ranks.values()) != list(range(1, 21)):
        raise SystemExit(f"{path}: invalid ballot (missing={missing}, extra={extra}, ranks={sorted(ranks.values())})")
    return ranks, scores, just, " ".join(champion)

def main(paths, json_out=None):
    import json, os
    borda = defaultdict(int); score = defaultdict(list); firsts = defaultdict(int); per_ballot = {}; justs = {}; champs = {}
    for p in sorted(paths):
        ranks, scores, just, champion = parse(p)
        per_ballot[p] = (ranks, scores); justs[p] = just; champs[p] = champion
        for c in CANDS:
            borda[c] += 21 - ranks[c]
            score[c].append(scores[c])
            if ranks[c] == 1:
                firsts[c] += 1
    rng = random.Random(1900)  # seeded, recorded coin toss for exact ties
    toss = {c: rng.random() for c in CANDS}
    order = sorted(CANDS, key=lambda c: (-borda[c], -statistics.mean(score[c]), -firsts[c], toss[c]))
    n = len(paths)
    print(f"# Round 1C — Tally ({n} ballots)\n")
    print("Method (fixed in Charter §6): Borda primary (21 − rank), mean score secondary, first-place count tiebreak, seeded coin toss last.\n")
    print("| Final rank | Candidate | Borda | Mean score | Median score | 1st-place votes | Best rank | Worst rank |")
    print("|---|---|---|---|---|---|---|---|")
    for i, c in enumerate(order, 1):
        rs = [per_ballot[p][0][c] for p in per_ballot]
        print(f"| {i} | {c} | {borda[c]} | {statistics.mean(score[c]):.2f} | {statistics.median(score[c]):.1f} | {firsts[c]} | {min(rs)} | {max(rs)} |")
    print("\n## Rank matrix (rows = candidates in final order, columns = ballots in file order)\n")
    cols = [p.split('/')[-1].replace('.md','') for p in sorted(per_ballot)]
    print("| Candidate | " + " | ".join(cols) + " |")
    print("|---|" + "---|" * len(cols))
    for c in order:
        print(f"| {c} | " + " | ".join(str(per_ballot[p][0][c]) for p in sorted(per_ballot)) + " |")
    ties = [(a, b) for a, b in zip(order, order[1:]) if borda[a] == borda[b]]
    if ties:
        print("\nBorda ties broken by secondary/tiebreak rules: " + ", ".join(f"{a}={b}" for a, b in ties))
    if json_out:
        pan = lambda p: os.path.basename(p)[:3]
        data = {"method": "Borda primary (21 - rank), mean score secondary, first-place count tiebreak, seeded coin toss last",
                "ballots": [pan(p) for p in sorted(per_ballot)],
                "results": [{"rank": i, "id": c, "borda": borda[c], "mean": round(statistics.mean(score[c]), 2),
                             "median": statistics.median(score[c]), "firsts": firsts[c],
                             "best": min(per_ballot[p][0][c] for p in per_ballot), "worst": max(per_ballot[p][0][c] for p in per_ballot),
                             "ranks": {pan(p): per_ballot[p][0][c] for p in sorted(per_ballot)},
                             "scores": {pan(p): per_ballot[p][1][c] for p in sorted(per_ballot)},
                             "justifications": {pan(p): justs[p][c] for p in sorted(per_ballot)}} for i, c in enumerate(order, 1)],
                "champions": {pan(p): {"candidate": next(c for c in CANDS if per_ballot[p][0][c] == 1), "statement": champs[p]} for p in sorted(per_ballot)}}
        json.dump(data, open(json_out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    args = sys.argv[1:]
    json_out = None
    if "--json" in args:
        i = args.index("--json"); json_out = args[i + 1]; args = args[:i] + args[i + 2:]
    main(args or glob.glob("ballots/*.md"), json_out)
