// Count the Trains (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-troops",
  "act": 3,
  "issue": "07-31 09.00",
  "giver": "handler",
  "title": "Count the Trains",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "watch",
      "kind": "observe",
      "city": "COL",
      "after": "08-02 06.00",
      "by": "08-03 18.00",
      "min": 480,
      "gives": "troop-tally"
    },
    {
      "id": "out",
      "kind": "carry",
      "item": "troop-tally",
      "to": [
        "LON",
        "FLU",
        "AMS",
        "BRU"
      ],
      "by": "08-04 23.00"
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
