// The July Crisis calendar (owner: World). Stub rows; see docs/CONTRACTS.md §3.

export default [
  { "id": "sarajevo", "at": "06-28 10.50", "p": 1, "fact": true, "rumourLeadH": 0, "news": "ARCHDUKE AND DUCHESS SHOT DEAD IN SARAJEVO", "text": "Stub: the World agent writes the report.", "fx": [ [ "state", "AH", "tension" ] ] },
  { "id": "ultimatum", "at": "07-23 18.00", "p": 1, "fact": true, "rumourLeadH": 24, "news": "AUSTRIA-HUNGARY DELIVERS NOTE TO SERBIA", "text": "Stub.", "fx": [ [ "state", "RS", "tension" ], [ "control", "frontier:SEM", 0.5 ] ] },
  { "id": "orlova-active", "at": "07-13 00.00", "p": 1, "fact": false, "rumourLeadH": 0, "news": "A NEW FACE IN ZURICH", "text": "Stub: game event, not history.", "fx": [ [ "hunter", "orlova", true ] ] },
];
