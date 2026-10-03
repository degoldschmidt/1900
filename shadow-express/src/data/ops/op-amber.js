// Amber for Berlin (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-amber",
  "act": 2,
  "issue": null,
  "giver": "kowal",
  "side": true,
  "title": "Amber for Berlin",
  "brief": "Stub.",
  "steps": [
    {
      "id": "deliver",
      "kind": "goto",
      "city": "BER"
    }
  ],
  "twists": [],
  "win": [
    [
      "trust",
      "kowal",
      1
    ]
  ],
  "fail": [
    [
      "trust",
      "kowal",
      -1
    ]
  ],
  "debrief": "Stub."
};
