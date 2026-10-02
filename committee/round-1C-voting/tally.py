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
    for line in open(path, encoding="utf-8"):
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
    return ranks, scores, just

def main(paths):
    borda = defaultdict(int); score = defaultdict(list); firsts = defaultdict(int); per_ballot = {}
    for p in sorted(paths):
        ranks, scores, just = parse(p)
        per_ballot[p] = (ranks, scores)
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

if __name__ == "__main__":
    main(sys.argv[1:] or glob.glob("ballots/*.md"))
