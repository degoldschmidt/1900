// Storylets with ilic (owner: People). Stub.

export default [
  { "id": "ilic.meet", "at": "person", "speaker": "ilic", "title": "A stub storylet", "text": "Stub text, to be replaced by its owner.", "choices": [
  { "label": "Spend a little", "sub": "£1", "cost": { "money": 1 }, "ok": [ [ "nerve", 1 ], [ "unlock", "flag:ilic-path" ] ] },
  { "label": "Walk away", "ok": [ [ "nerve", -1 ] ] } ] },
];
