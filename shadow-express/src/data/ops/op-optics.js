// Coincidence (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-optics",
  "act": 1,
  "issue": "07-03 09.00",
  "giver": "handler",
  "title": "Coincidence",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "reach",
      "kind": "goto",
      "city": "BER",
      "by": "07-08 12.00"
    },
    {
      "id": "photo",
      "kind": "act",
      "city": "BER",
      "venue": "venue:factory",
      "gives": "rangefinder-plates",
      "ways": [
        {
          "id": "visit",
          "label": "A sales call",
          "if": [
            [
              "cover",
              "weiss"
            ]
          ],
          "risk": 0.2,
          "rec": [
            "meeting",
            0.4
          ]
        },
        {
          "id": "bribe",
          "label": "Bribe a draughtsman",
          "cost": {
            "money": 20
          },
          "risk": 0.35,
          "rec": [
            "bribe",
            0.6
          ]
        }
      ]
    },
    {
      "id": "home",
      "kind": "carry",
      "item": "rangefinder-plates",
      "to": "LON",
      "by": "07-12 18.00"
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
