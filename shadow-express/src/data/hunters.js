// Hunters (owner: People). See docs/CONTRACTS.md §4 and docs/REGISTRY.md §6.
// voice: three storylets in src/data/stories/hunters.js, fired in order as the hunter closes in
// (a hint that someone is asking, a message that names you, a face-to-face scene without an arrest).

export default [
  { "id": "falk", "name": "Herr Falk", "service": "Abteilung IIIb", "nation": "DE", "ground": [ "DE", "AH" ],
    "look": "a tall man in a grey ulster who never seems to hurry", "start": "BER", "from": "06-28 00.00",
    "portrait": { "seed": 1914, "sex": "m", "hat": "bowler", "hair": "short", "beard": "moustache", "collar": "stiff", "age": "mid" },
    "voice": [ "falk.hint", "falk.letter", "falk.face" ] },
  { "id": "heller", "name": "Hauptmann Heller", "service": "Evidenzbureau", "nation": "AH", "ground": [ "AH", "DE" ],
    "look": "a stout officer in mufti with a duelling scar and an unlit cigar", "start": "VIE", "from": "06-28 00.00",
    "portrait": { "seed": 1867, "sex": "m", "hat": "none", "hair": "bald", "beard": "moustache", "collar": "stiff", "age": "mid" },
    "voice": [ "heller.hint", "heller.letter", "heller.face" ] },
  { "id": "orlova", "name": "Madame Orlova", "service": "freelance, in Austrian pay", "nation": "RU", "ground": [ "AH", "DE" ],
    "look": "a small woman in widow's black with very good gloves", "start": "ZUR", "from": "07-13 00.00",
    "portrait": { "seed": 1905, "sex": "f", "hat": "veil", "hair": "bun", "beard": "none", "collar": "lace", "age": "mid" },
    "voice": [ "orlova.hint", "orlova.letter", "orlova.face" ] },
];
