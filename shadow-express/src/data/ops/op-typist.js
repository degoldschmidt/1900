// Fräulein Sauer (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-typist",
  "act": 3,
  "issue": "07-27 09.00",
  "giver": "handler",
  "title": "Fräulein Sauer",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "meet",
      "kind": "meet",
      "person": "sauer",
      "by": "07-31 12.00",
      "gives": "companion-sauer"
    },
    {
      "id": "out",
      "kind": "carry",
      "item": "companion-sauer",
      "to": [
        "CPH",
        "AMS",
        "FLU",
        "ZUR",
        "STO"
      ],
      "by": "08-02 18.00"
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
