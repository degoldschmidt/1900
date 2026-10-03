// The Ultimatum (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-ultimatum",
  "act": 2,
  "issue": "07-18 09.00",
  "giver": "handler",
  "title": "The Ultimatum",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "reach",
      "kind": "goto",
      "city": "VIE",
      "by": "07-21 12.00"
    },
    {
      "id": "copy",
      "kind": "act",
      "city": "VIE",
      "venue": "venue:ministry",
      "gives": "ultimatum-copy",
      "ways": [
        {
          "id": "porter",
          "label": "Bribe the night porter",
          "cost": {
            "money": 25
          },
          "risk": 0.35,
          "rec": [
            "bribe",
            0.6
          ]
        },
        {
          "id": "patient",
          "label": "Through Brandl's patient",
          "if": [
            [
              "st",
              "brandl",
              "recruited"
            ]
          ],
          "risk": 0.15,
          "rec": [
            "meeting",
            0.3
          ]
        }
      ]
    },
    {
      "id": "wire",
      "kind": "carry",
      "item": "ultimatum-copy",
      "to": [
        "ZUR",
        "VEN",
        "LON",
        "ROM"
      ],
      "by": "07-23 18.00"
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
