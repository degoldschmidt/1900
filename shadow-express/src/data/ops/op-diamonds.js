// Stones for Petersburg (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-diamonds",
  "act": 1,
  "issue": "07-07 09.00",
  "giver": "handler",
  "title": "Stones for Petersburg",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "buy",
      "kind": "act",
      "city": "AMS",
      "venue": "venue:market",
      "gives": "diamonds",
      "ways": [
        {
          "id": "bourse",
          "label": "Buy on the bourse",
          "risk": 0.1,
          "rec": [
            "register",
            0.3
          ]
        },
        {
          "id": "dealer",
          "label": "A dealer in the Jodenbreestraat",
          "cost": {
            "money": 5
          },
          "risk": 0.2,
          "rec": null
        }
      ]
    },
    {
      "id": "carry",
      "kind": "carry",
      "item": "diamonds",
      "to": "SPB",
      "by": "07-15 12.00"
    }
  ],
  "twists": [],
  "win": [
    [
      "standing",
      10
    ],
    [
      "cover",
      "+vessey"
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
