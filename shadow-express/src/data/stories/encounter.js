// encounter storylets (owner: Events). Stub.

export default [
  { "id": "ev.encounter.stub", "at": "encounter", "title": "A stub storylet", "text": "Stub text, to be replaced by its owner.", "choices": [
  { "label": "Spend a little", "sub": "£1", "cost": { "money": 1 }, "ok": [ [ "nerve", 1 ] ] },
  { "label": "Walk away", "ok": [ [ "nerve", -1 ] ] } ] },
];
