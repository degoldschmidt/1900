// Odile's Letter (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-letter",
  "act": 2,
  "issue": null,
  "giver": "odile",
  "side": true,
  "title": "Odile's Letter",
  "brief": "Stub.",
  "steps": [
    {
      "id": "deliver",
      "kind": "goto",
      "city": "BRU"
    }
  ],
  "twists": [],
  "win": [
    [
      "trust",
      "odile",
      1
    ]
  ],
  "fail": [
    [
      "trust",
      "odile",
      -1
    ]
  ],
  "debrief": "Stub."
};
