// The Mole (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-mole",
  "act": 2,
  "issue": "07-13 09.00",
  "giver": "handler",
  "title": "The Mole",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "feed",
      "kind": "meet",
      "person": "brandl",
      "by": "07-16 12.00"
    },
    {
      "id": "watch",
      "kind": "wait",
      "city": "VIE",
      "min": 240,
      "by": "07-18 12.00"
    },
    {
      "id": "name",
      "kind": "goto",
      "city": "LON",
      "by": "07-20 18.00"
    }
  ],
  "twists": [],
  "win": [
    [
      "standing",
      10
    ]
  ],
  "fail": [
    [
      "standing",
      -15
    ]
  ],
  "debrief": "Stub."
};
