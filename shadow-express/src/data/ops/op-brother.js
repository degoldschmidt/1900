// The Brother (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-brother",
  "act": 2,
  "issue": null,
  "giver": "ilic",
  "side": true,
  "title": "The Brother",
  "brief": "Stub.",
  "steps": [
    {
      "id": "free",
      "kind": "goto",
      "city": "SAR"
    }
  ],
  "twists": [],
  "win": [
    [
      "trust",
      "ilic",
      1
    ]
  ],
  "fail": [
    [
      "trust",
      "ilic",
      -1
    ]
  ],
  "debrief": "Stub."
};
