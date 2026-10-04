// Storylets of op-optics, Coincidence (owner: Ops). See docs/CONTRACTS.md §5.

const photo = ['op', 'op-optics', 'step:photo'];

export default [
  // ---------- step ----------
  { id: 'op-optics.reach', at: 'op', if: [['city', 'BER']],
    title: 'Friedenau, behind the lilacs',
    text: "The works stands among villas in Friedenau: a long brick block with frosted windows on the top floor, where the drawing office is. A watchman's box at the gate. Across the road, a beer garden full of draughtsmen at noon. A man in a grey ulster waits at the tram stop longer than any tram requires.",
    choices: [
      { label: 'Watch the gate for a day', sub: 'A day lost; the ulster may watch you back', cost: { min: 480 },
        ok: [['flag', 'op-optics-scouted'], ['record', 'sighting', 0.4],
          ['intel', { subj: 'op:op-optics', claim: { note: 'The watchman sleeps from two till four; the drawing office key hangs in his box.' }, src: 'seen', rel: 0.7, truth: true }]] },
      { label: 'Watch it through field glasses', sub: 'From a church tower, unseen', cost: { min: 240 }, if: [['item', 'field-glasses']],
        ok: [['flag', 'op-optics-scouted'],
          ['intel', { subj: 'op:op-optics', claim: { note: 'The watchman sleeps from two till four; the drawing office key hangs in his box.' }, src: 'seen', rel: 0.8, truth: true }]] },
      { label: 'Drink with the draughtsmen', sub: '£2 in beer and shop talk', cost: { money: 2 },
        ok: [['flag', 'op-optics-lenz'], ['record', 'meeting', 0.3],
          ['intel', { subj: 'op:op-optics', claim: { note: "A draughtsman called Lenz owes a bookmaker more than a year's wages." }, src: 'rumour', rel: 0.7, truth: true }]] },
      { label: 'Go straight to work', sub: 'No time lost, nothing learned',
        ok: [['nerve', 1]] },
    ] },

  // ---------- ways ----------
  { id: 'op-optics.visit', at: 'op',
    title: 'A sales call in Friedenau',
    text: 'The works manager receives you between a cabinet of prisms and a portrait of the Kaiser. He is glad of a Swiss traveller: Zurich glass is good and cheap. He shows you the trials room himself. On a drafting table under the skylight lies a sheet stamped GEHEIM, and in the next office his telephone begins to ring.',
    choices: [
      { label: 'Photograph it while he answers', sub: 'Six exposures, one string, a thin door', if: [['item', 'vest-camera']],
        roll: { p: 0.7, mods: [[['flag', 'op-optics-scouted'], 0.1]] },
        ok: [photo, ['record', 'register', 0.4]], fail: [['record', 'register', 1], ['nerve', -2]] },
      { label: 'Memorise it and sketch it later', sub: 'London will get a sketch, not a photograph',
        roll: { p: 0.6, mods: [[['aff', 'topic:technical', '>=', 1], 0.15]] },
        ok: [photo, ['standing', -3], ['record', 'register', 0.4], ['debrief', 'London got a sketch of the rangefinder from memory, not photographs.']],
        fail: [['record', 'register', 0.7], ['nerve', -1]] },
      { label: 'Take an order and leave politely', sub: 'A real commission; come back another way',
        ok: [['money', 4], ['record', 'register', 0.3]] },
    ] },

  { id: 'op-optics.sauer', at: 'op', speaker: 'sauer',
    title: 'An umbrella in the Tiergarten',
    text: "Sauer meets you in the Tiergarten under an umbrella, though it is not raining. The drawings came to the trials office this morning; she types its reports. 'Tonight I take them home to finish,' she says. 'Bring your camera to my friend's flat. If anyone asks, you are a cousin from Hamburg.' Her gloved hands are perfectly steady.",
    choices: [
      { label: 'Photograph them at the flat', sub: 'An hour, and her name on the risk', if: [['item', 'vest-camera']],
        ok: [photo, ['expose', 'sauer', 0.25], ['flag', 'op-optics-sauer'], ['record', 'meeting', 0.3]] },
      { label: 'Let her trace them herself', sub: 'Slower, and her hand on every sheet', cost: { min: 360 },
        ok: [photo, ['expose', 'sauer', 0.4], ['flag', 'op-optics-sauer'],
          ['debrief', 'Fräulein Sauer traced the drawings herself, at her own kitchen table.']] },
      { label: 'Spare her this; find another way', sub: 'She will be relieved, and a little hurt',
        ok: [['trust', 'sauer', 1], ['nerve', -1]] },
    ] },

  { id: 'op-optics.draughtsman', at: 'op',
    title: 'Herr Lenz and his bookmaker',
    text: "The draughtsman is called Lenz. He has a wife, three children and a bookmaker, and the bookmaker is the most pressing. He looks at your banknotes for a long time. 'The drawings leave the office at six,' he says at last. 'I can lend them to you for one hour. One. And I never saw your face.'",
    choices: [
      { label: 'Photograph them in the hour', sub: 'Six plates; enough if your hands are steady', if: [['item', 'vest-camera']],
        roll: { p: 0.75, mods: [[['flag', 'op-optics-lenz'], 0.1]] },
        ok: [photo, ['record', 'bribe', 0.4]], fail: [['record', 'bribe', 1], ['nerve', -2]] },
      { label: 'Trace what you can in an hour', sub: 'Hurried tracings; London will notice',
        roll: { p: 0.6, mods: [[['flag', 'op-optics-lenz'], 0.1]] },
        ok: [photo, ['standing', -2], ['record', 'bribe', 0.4], ['debrief', "Lenz's drawings came home as hurried tracings."]],
        fail: [['record', 'bribe', 1], ['nerve', -1]] },
      { label: 'Pay him to copy them himself', sub: '£10 more, and he takes the risk', cost: { money: 10 },
        roll: { p: 0.6 },
        ok: [photo, ['record', 'bribe', 0.6], ['later', 20, 'op-optics.lenz']],
        fail: [['record', 'bribe', 1], ['later', 6, 'op-optics.lenz']] },
    ] },

  { id: 'op-optics.night', at: 'op',
    title: 'The drawing office at night',
    text: 'The side door yields to the third key. Inside: varnish, cold radiators, moonlight on the drafting tables. The rangefinder drawings lie in an unlocked plan chest; somebody trusts the watchman. His lantern passes the frosted glass every forty minutes. There is time to do this one way, and only one.',
    choices: [
      { label: 'Photograph them by the dark lantern', sub: 'A slow exposure between his rounds', if: [['item', 'vest-camera']],
        roll: { p: 0.6, mods: [[['flag', 'op-optics-scouted'], 0.15]] },
        ok: [photo, ['record', 'sighting', 0.3]], fail: [['record', 'sighting', 1], ['nerve', -2]] },
      { label: 'Take the sheets; return them by dawn', sub: 'Copy them at leisure; pray nobody counts',
        roll: { p: 0.55, mods: [[['flag', 'op-optics-scouted'], 0.15]] },
        ok: [photo, ['record', 'sighting', 0.4], ['later', 14, 'op-optics.missing']],
        fail: [['record', 'sighting', 1], ['nerve', -2]] },
      { label: 'Trace them where they lie', sub: "Three hours, and the watchman's rounds", cost: { min: 180 },
        roll: { p: 0.45, mods: [[['flag', 'op-optics-scouted'], 0.2]] },
        ok: [photo, ['standing', -2], ['debrief', "Your tracings were made by moonlight, between the watchman's rounds."]],
        fail: [['record', 'sighting', 1], ['nerve', -1]] },
    ] },

  // ---------- twists ----------
  { id: 'op-optics.buyer', at: 'op',
    title: 'A gentleman from the Neva',
    text: "A man with a Petersburg accent and a very new bowler sits down at your table uninvited. He knows what you carry, or guesses well. 'London will thank you. We will pay you,' he says, and names forty pounds. 'Copies would do. Nobody need know.' He leaves a card with a hotel room number on it.",
    choices: [
      { label: 'Sell him the plates', sub: '£40, and London gets nothing',
        ok: [['money', 40], ['item', '-rangefinder-plates'], ['op', 'op-optics', 'fail'],
          ['debrief', 'You sold the plates to the Russians. They were grateful; London was not.']] },
      { label: 'Sell him prints, keep the plates', sub: 'Four hours in a darkroom; Ashby may hear', cost: { min: 240 },
        ok: [['money', 25], ['record', 'meeting', 0.5], ['later', 36, 'op-optics.ashby-hears']] },
      { label: 'Refuse him', sub: 'He will not forget the insult',
        ok: [['record', 'sighting', 0.4]] },
    ] },

  { id: 'op-optics.kessel', at: 'op', speaker: 'kessel',
    title: 'The Rittmeister never forgets',
    text: "'But we have met!' Rittmeister von Kessel crosses the Potsdamer Platz with both hands out. He insists on a beer. He talks of horses, of the manoeuvres, of a cousin at an optical works who says the new instrument will win the next war by itself. He studies your face with frank, friendly, perfectly retentive eyes.",
    choices: [
      { label: 'Let him talk about the cousin', sub: 'An hour and a half of horses first', cost: { min: 90 },
        ok: [['trust', 'kessel', 1], ['record', 'meeting', 0.4], ['flag', 'op-optics-scouted'],
          ['intel', { subj: 'op:op-optics', claim: { note: 'Kessel: the works night watchman is an old trooper who drinks on duty.' }, src: 'person:kessel', rel: 0.6, truth: true }]] },
      { label: 'Plead an appointment and go', sub: 'He will wonder what kind',
        ok: [['trust', 'kessel', -1], ['record', 'sighting', 0.3]] },
      { label: 'Ask him to dine at the Adlon', sub: '£3, and he will remember the evening', cost: { money: 3 },
        ok: [['trust', 'kessel', 2], ['record', 'meeting', 0.6]] },
    ] },

  // ---------- aftermath ----------
  { id: 'op-optics.lenz', at: 'then',
    title: 'Lenz has no courage',
    text: 'A newsboy calls it out in the street: a draughtsman arrested at the Friedenau optical works. Lenz is not a brave man. He will tell them everything he knows, and the only question is how well he saw your face across a beer-cellar table.',
    choices: [
      { label: 'Change your hat, coat and hotel', sub: '£4, and an afternoon', cost: { money: 4 },
        ok: [['record', 'sighting', 0.3]] },
      { label: 'Trust that he never really saw you', sub: 'Draughtsmen look at paper, not faces',
        ok: [['susp', 'active', 0.2], ['record', 'sighting', 0.6]] },
    ] },

  { id: 'op-optics.missing', at: 'then',
    title: 'A sheet out of order',
    text: 'The sheets went back into the plan chest in the wrong order. By noon the works manager has noticed; by two, a man in a grey ulster is questioning the watchman. The watchman, ashamed of his sleep, invents a burglar, and by bad luck invents one rather like you.',
    choices: [
      { label: 'Lie low for a day', sub: 'A day against the clock', cost: { min: 720 },
        ok: [['nerve', 1]] },
      { label: 'Carry on as you were', sub: 'Invented burglars are seldom caught',
        ok: [['record', 'sighting', 0.6]] },
    ] },

  { id: 'op-optics.ashby-hears', at: 'then', speaker: 'ashby',
    title: 'Ashby has heard about Petersburg',
    text: 'A telegram, very short: PETERSBURG FRIENDS THANK US FOR RANGEFINDER PRINTS STOP INTERESTING THEY HAD THEM BEFORE I DID STOP EXPLAIN. It is the longest message Commander Ashby has ever sent you.',
    choices: [
      { label: 'Send him the money', sub: '£25, and a contrite letter', cost: { money: 25 },
        ok: [['standing', -1]] },
      { label: 'Explain nothing', sub: 'He will draw his own conclusions',
        ok: [['standing', -5]] },
    ] },
];
