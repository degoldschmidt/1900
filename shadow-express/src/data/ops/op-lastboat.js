// The Last Boat (owner: Ops). Stub; see docs/CONTRACTS.md §6.

export default {
  "id": "op-lastboat",
  "act": 3,
  "issue": "08-02 09.00",
  "giver": "handler",
  "title": "The Last Boat",
  "brief": "Stub: Ops writes the brief.",
  "steps": [
    {
      "id": "home",
      "kind": "goto",
      "city": "LON",
      "by": "08-05 00.00"
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
