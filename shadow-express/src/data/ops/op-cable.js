// The Sarajevo Cable (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-cable",
  "act": 1,
  "issue": "06-28 17.00",
  "giver": "handler",
  "title": "The Sarajevo Cable",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "reach",
      "kind": "goto",
      "city": "SAR",
      "by": "07-02 12.00"
    },
    {
      "id": "meet",
      "kind": "meet",
      "person": "jovan",
      "by": "07-02 20.00",
      "gives": "sarajevo-cable"
    },
    {
      "id": "judge",
      "kind": "meet",
      "person": "brandl",
      "by": "07-06 18.00"
    },
    {
      "id": "home",
      "kind": "carry",
      "item": "sarajevo-cable",
      "to": "LON",
      "by": "07-09 12.00"
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
