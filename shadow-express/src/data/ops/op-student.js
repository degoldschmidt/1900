// Get Jovan Out (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-student",
  "act": 2,
  "issue": "07-21 09.00",
  "giver": "handler",
  "title": "Get Jovan Out",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "find",
      "kind": "meet",
      "person": "jovan",
      "by": "07-25 12.00",
      "gives": "companion-jovan"
    },
    {
      "id": "out",
      "kind": "carry",
      "item": "companion-jovan",
      "to": [
        "VEN",
        "ROM",
        "ZUR",
        "LON"
      ],
      "by": "07-28 00.00"
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
