// Storylets with kowal (owner: People). Stub.

export default [
  { "id": "kowal.meet", "at": "person", "speaker": "kowal", "title": "A stub storylet", "text": "Stub text, to be replaced by its owner.", "choices": [
  { "label": "Spend a little", "sub": "£1", "cost": { "money": 1 }, "ok": [ [ "nerve", 1 ], [ "unlock", "flag:kowal-path" ] ] },
  { "label": "Walk away", "ok": [ [ "nerve", -1 ] ] } ] },
];
