// Storylets of op-cable, The Sarajevo Cable (owner: Ops). See docs/CONTRACTS.md §5.
// Truth: the cable is forged unless Amsler is Orlova's man (then Heller had no forger's errand to run).
// Each way of judging ends in op-cable.verdict; the way it is sent home decides when op-cable.reply arrives.

const FORGED = ['not', ['loyal', 'amsler', 'enemy:orlova']];
const GENUINE = ['loyal', 'amsler', 'enemy:orlova'];
const note = (text, src, rel, truth) => ['intel', { subj: 'op:op-cable', claim: { note: text }, src, rel, truth }];
const lost = [['item', '-sarajevo-cable'], ['record', 'frontier', 1], ['susp', 'active', 0.3], ['op', 'op-cable', 'fail']];
const brod = ['later', 20, 'op-cable.brod'];
const search = ['later', 1, 'op-cable.search'];
const met = ['op', 'op-cable', 'step:meet'];

export default [
  // ---------- taking up the post ----------
  { id: 'op-cable.post', at: 'op', if: [['city', 'VIE']],
    title: 'A room in Vienna',
    text: 'Vienna takes its time with strangers. Within three days of arriving you must fill in a Meldezettel for the police: name, faith, profession, last address. The hall porter will read it before the police do. Where you live will decide who you meet, and who meets you.',
    choices: [
      { label: 'Rooms at the Hotel Sacher', sub: '£6; officers, diplomats, and their eyes', cost: { money: 6 },
        ok: [['legend', 0.2], ['watch', 0.1], ['record', 'register', 0.5], brod] },
      { label: 'A furnished room in the Josefstadt', sub: '£2; a landlady who notices everything', cost: { money: 2 },
        ok: [['legend', 0.15], ['record', 'register', 0.3], brod] },
      { label: 'A pension by the Südbahnhof', sub: 'Cheap, anonymous, full of travellers', cost: { money: 1 },
        ok: [['legend', 0.05], ['record', 'register', 0.2], brod] },
      { label: 'Fill in a false Meldezettel', sub: 'No true trace of you; a crime if caught',
        roll: { p: 0.55, mods: [[['skill', 'paperwork', '>=', 2], 0.25], [['skill', 'german', '>=', 2], 0.1]] },
        ok: [['watch', -0.1], brod], fail: [['watch', 0.3], ['record', 'register', 1], brod] },
    ] },

  // ---------- the run to Sarajevo ----------
  { id: 'op-cable.brod', at: 'then', if: [['mode', 'rail'], ['op', 'op-cable', 'reach'], ['not', ['op', 'op-cable', 'meet']], ['nation', 'AH']],
    title: 'Gendarmes at Bosanski Brod',
    text: 'At Bosanski Brod, where the narrow gauge begins, gendarmes board the Sarajevo train and work down the corridor with lanterns. Since the shots, nobody enters Bosnia without a reason the gendarmes believe. The sergeant reads papers slowly, moving his lips, and asks every foreigner the same question: what business can anyone have in Sarajevo this week?',
    choices: [
      { label: 'Give the reason your legend gives', sub: 'Plausible, or not, depending on who you are',
        roll: { p: 0.5, mods: [[['skill', 'german', '>=', 1], 0.15], [['aff', 'topic:trade', '>=', 1], 0.1], [['aff', 'topic:religion', '>=', 1], 0.2]] },
        ok: [['record', 'frontier', 0.3]], fail: [['record', 'frontier', 0.9], ['delay', 120]] },
      { label: 'Say you are a journalist, and why', sub: 'Every paper in Europe wants Sarajevo', if: [['aff', 'venue:press', '>=', 1]],
        roll: { p: 0.7 }, ok: [['record', 'frontier', 0.4]], fail: [['record', 'frontier', 1], ['delay', 180]] },
      { label: 'Slip the sergeant a crown', sub: 'A crown, folded small', cost: { money: 1 },
        roll: { p: 0.6 }, ok: [['record', 'bribe', 0.3]], fail: [['record', 'bribe', 0.9], ['delay', 240]] },
      { label: 'Pretend to sleep', sub: 'Sergeants respect a first-class snore',
        roll: { p: 0.35, mods: [[['class', 1], 0.2]] }, ok: [['nerve', 1]], fail: [['record', 'frontier', 1], ['nerve', -1]] },
    ] },

  { id: 'op-cable.sarajevo', at: 'op', if: [['city', 'SAR']],
    title: 'Sarajevo in mourning',
    text: "Black flags hang from the Konak. Serb shops along the Ferhadija have no windows left, and the Hotel Europe's are boarded. Gendarmes march students past in pairs, roped at the wrist. Jovan Marić is said to be hiding, and so is everyone who ever knew him. Where will you lay your head?",
    choices: [
      { label: 'Take a room at the Hotel Europe', sub: 'A clerk copies the register for the police', tag: 'venue:hotel',
        ok: [['record', 'register', 0.7],
          ['intel', { subj: 'person:jovan', claim: { note: 'The hall porter says the police want a law student named Marić, alive.' }, src: 'porter', rel: 0.7, truth: true }]] },
      { label: 'A room above a coffee-house', sub: '£2, and nobody writes anything down', cost: { money: 2 },
        ok: [['record', 'register', 0.15], ['flag', 'op-cable-lead'],
          ['intel', { subj: 'person:jovan', claim: { note: 'The coffee-house keeper says a bookbinder off the Ferhadija hides students.' }, src: 'rumour', rel: 0.6, truth: true }]] },
      { label: 'Ask the Franciscans for a cell', sub: 'They feed the poor and know everyone', tag: 'topic:religion',
        if: [['aff', 'topic:religion', '>=', 1]],
        ok: [['record', 'register', 0.05], ['flag', 'op-cable-lead']] },
      { label: 'Sleep in the station waiting room', sub: 'No register, little sleep, many gendarmes',
        ok: [['nerve', -2], ['record', 'sighting', 0.3]] },
    ] },

  { id: 'op-cable.shadow', at: 'op',
    title: 'A patient reader',
    text: "The same man has been reading the same Bosnische Post on the bench across the street for an hour. He has not turned a page. He wears a fez and European boots, and when you stop at a shop window, so does he. Jovan's hiding place is ten minutes' walk away.",
    choices: [
      { label: 'Lose him in the Baščaršija', sub: 'A maze of stalls, and you a stranger',
        roll: { p: 0.45, mods: [[['aff', 'venue:bazaar', '>=', 1], 0.15], [['skill', 'tradecraft', '>=', 2], 0.2]] },
        ok: [['nerve', -1]], fail: [['record', 'sighting', 0.8], ['expose', 'jovan', 0.3]] },
      { label: "Use the bookbinder's back lane", sub: 'The way the students use', if: [['flag', 'op-cable-lead']],
        roll: { p: 0.75 }, ok: [['nerve', 1]], fail: [['expose', 'jovan', 0.3]] },
      { label: 'Lead him to the wrong house', sub: 'Three hours of walking in the heat', cost: { min: 180 },
        ok: [['record', 'sighting', 0.4]] },
      { label: 'Go to Jovan anyway', sub: 'He may follow you to the door',
        ok: [['expose', 'jovan', 0.6], ['record', 'meeting', 0.6]] },
    ] },

  { id: 'op-cable.jovan', at: 'op', speaker: 'jovan',
    title: "The bookbinder's back room",
    text: "Jovan is younger than you expected, with ink on his cuffs and a fever-bright stare. Two of his friends were taken last night. The cable is sewn into the spine of a law book. 'It came from a man at the Belgrade telegraph office,' he says. 'Take it to people who will read it. What are you giving in return?'",
    choices: [
      { label: 'Promise to get him out', sub: 'He will hold you to it',
        ok: [met, search, ['record', 'meeting', 0.4], ['trust', 'jovan', 2], ['flag', 'op-cable-promise'],
          ['debrief', 'You promised Jovan Marić a way out when the time came.']] },
      { label: "Pay him, for his friends' families", sub: '£5', cost: { money: 5 },
        ok: [met, search, ['record', 'meeting', 0.4], ['trust', 'jovan', 1]] },
      { label: 'Ask who else knows of it', sub: 'Names cost him; he gives them anyway',
        ok: [met, search, ['record', 'meeting', 0.4], ['trust', 'jovan', -1],
          ['intel', { subj: 'person:ilic', claim: { note: 'Jovan says Lieutenant Ilić told half of Belgrade the cable existed.' }, src: 'person:jovan', rel: 0.7, truth: true }]] },
      { label: 'Take it and go at once', sub: 'He will remember how you left',
        ok: [met, search, ['record', 'meeting', 0.2], ['trust', 'jovan', -2], ['later', 30, 'op-cable.taken']] },
    ] },

  { id: 'op-cable.search', at: 'then', if: [['mode', 'rail'], ['item', 'sarajevo-cable']],
    title: 'A search on the Bosnian line',
    text: 'Two hours out of Sarajevo the train halts in a cutting. Soldiers this time, not gendarmes, with a lieutenant who has orders to find letters going to Serbia. They are opening every case in your carriage, one by one, and reading whatever paper they find. The cable is in yours.',
    choices: [
      { label: 'Trust the valise lining', sub: 'One forbidden thing under your shirts', if: [['item', 'lined-valise']],
        roll: { p: 0.85 }, ok: [['nerve', -1]], fail: lost },
      { label: 'Read the law book openly', sub: 'Nobody searches what is held in plain sight',
        roll: { p: 0.45, mods: [[['skill', 'composure', '>=', 2], 0.2], [['skill', 'german', '>=', 1], 0.1]] },
        ok: [['nerve', -1]], fail: lost },
      { label: 'Bribe the lieutenant', sub: '£5, and he looks offended first', cost: { money: 5 },
        roll: { p: 0.45 }, ok: [['record', 'bribe', 0.6]], fail: [...lost, ['record', 'bribe', 1]] },
      { label: 'Drop it from the window', sub: 'Lose the cable, keep your liberty',
        ok: [['debrief', 'You threw the Sarajevo cable into a Bosnian cutting rather than be found with it.'], ['item', '-sarajevo-cable'], ['op', 'op-cable', 'fail']] },
    ] },

  // ---------- ways of judging the cable in Vienna ----------
  { id: 'op-cable.brandl', at: 'op', speaker: 'brandl',
    title: 'Dr Brandl reads a telegram',
    text: "Brandl reads the cable twice, then a third time with his spectacles off, as though it were a patient. 'The officers who come to me for their nerves would give a great deal for this,' he says lightly. 'Whether it is true is another question.' He taps the form against his knee and tells you what he thinks.",
    choices: [
      { label: 'Hear his verdict', if: [['loyal', 'brandl', 'enemy:heller']], next: 'op-cable.verdict',
        ok: [note('Brandl calls it genuine: Belgrade phrasing, Belgrade forms, a Belgrade cipher.', 'person:brandl', 0.75, false),
          ['record', 'meeting', 0.7]] },
      { label: 'Hear his verdict', if: [['loyal', 'ilic', 'enemy:heller']], next: 'op-cable.verdict',
        ok: [note('Brandl doubts it: the phrasing is Viennese officialese, not Belgrade Serbian.', 'person:brandl', 0.75, true),
          ['record', 'meeting', 0.3]] },
      { label: 'Hear his verdict', if: [GENUINE], next: 'op-cable.verdict',
        ok: [note('Brandl calls it genuine: Belgrade phrasing, Belgrade forms, a Belgrade cipher.', 'person:brandl', 0.75, true),
          ['record', 'meeting', 0.3]] },
      { label: 'Take it back before he says more', sub: 'He has seen it; that cannot be undone',
        ok: [['trust', 'brandl', -1], ['record', 'meeting', 0.3]] },
    ] },

  { id: 'op-cable.novak', at: 'op', speaker: 'novak',
    title: 'Novák holds it to the lamp',
    text: 'Novák wipes his spectacles and holds the form to the gas mantle. He takes a Belgrade form of his own from his travelling case, lays the two side by side and bends over them with a glass. For a long minute the only sound is a tram grinding past in the street below. Then he grunts.',
    choices: [
      { label: 'Hear his verdict', if: [FORGED], next: 'op-cable.verdict',
        ok: [note('Novák: right paper, but the punch holes were made by hand. A forgery.', 'person:novak', 0.85, true), ['trust', 'novak', 1]] },
      { label: 'Hear his verdict', if: [GENUINE], next: 'op-cable.verdict',
        ok: [note('Novák: Belgrade paper, Belgrade punch, Belgrade ink. He would stake his press on it.', 'person:novak', 0.85, true), ['trust', 'novak', 1]] },
      { label: 'Pay him to mark every flaw', sub: '£3 for an hour of his eyes', cost: { money: 3 }, if: [FORGED], next: 'op-cable.verdict',
        ok: [note('Novák lists the flaws: hand punching, a wrong cipher group, ink a week old.', 'person:novak', 0.95, true)] },
      { label: 'Pay him to mark every flaw', sub: '£3 for an hour of his eyes', cost: { money: 3 }, if: [GENUINE], next: 'op-cable.verdict',
        ok: [note('Novák looked for flaws for an hour and found none at all.', 'person:novak', 0.95, true)] },
    ] },

  { id: 'op-cable.clerk', at: 'op',
    title: 'The telegraph transit register',
    text: "The clerk pockets your money and fetches the June transit register. Every telegram from Belgrade to Sarajevo passed through the Empire's wires and was logged, by date, hour and word count. He runs a nicotine-stained finger down the column, glancing at the door. You can let him take his time, or hurry him and hope.",
    choices: [
      { label: 'Let him take his time', sub: 'An hour, and he will remember you', cost: { min: 60 }, if: [FORGED], next: 'op-cable.verdict',
        ok: [note('No telegram of that length passed from Belgrade to Sarajevo on that date.', 'paper', 0.75, true), ['record', 'bribe', 0.5]] },
      { label: 'Let him take his time', sub: 'An hour, and he will remember you', cost: { min: 60 }, if: [GENUINE], next: 'op-cable.verdict',
        ok: [note('The register shows a telegram of exactly that length, Belgrade to Sarajevo, that day.', 'paper', 0.75, true), ['record', 'bribe', 0.5]] },
      { label: 'Hurry him', sub: 'Quicker, and less certain', if: [FORGED], next: 'op-cable.verdict',
        ok: [note('The hurried clerk thinks no such telegram was logged.', 'paper', 0.45, true), ['record', 'bribe', 0.2]] },
      { label: 'Hurry him', sub: 'Quicker, and less certain', if: [GENUINE], next: 'op-cable.verdict',
        ok: [note('The hurried clerk thinks a telegram like it was logged.', 'paper', 0.45, true), ['record', 'bribe', 0.2]] },
    ] },

  { id: 'op-cable.lens', at: 'op',
    title: 'Under the loupe',
    text: "Curtains drawn, you screw the jeweller's loupe into your eye. Paper and ink are an optician's business, and so are the perforations a telegraph office punches into every form it issues. A machine punches clean circles. A man with an awl, however careful, does not. You count the holes one by one.",
    choices: [
      { label: 'Trust your eye', sub: 'Two slow hours', cost: { min: 120 }, if: [FORGED], next: 'op-cable.verdict',
        ok: [note('Under the loupe the perforations are ragged: punched by hand, not by machine.', 'seen', 0.65, true)] },
      { label: 'Trust your eye', sub: 'Two slow hours', cost: { min: 120 }, if: [GENUINE], next: 'op-cable.verdict',
        ok: [note('Under the loupe the perforations are clean machine circles.', 'seen', 0.65, true)] },
      { label: 'Photograph the holes and compare', sub: 'Plates of a real form beside it', if: [['item', 'vest-camera'], FORGED], next: 'op-cable.verdict',
        ok: [note('Your photographs show hand-punched perforations beside machine-punched ones.', 'seen', 0.85, true), ['min', 180]] },
      { label: 'Photograph the holes and compare', sub: 'Plates of a real form beside it', if: [['item', 'vest-camera'], GENUINE], next: 'op-cable.verdict',
        ok: [note('Your photographs show the same clean machine perforations on both forms.', 'seen', 0.85, true), ['min', 180]] },
    ] },

  { id: 'op-cable.verdict', at: 'then',
    title: 'What will you tell London?',
    text: "You have the cable, an opinion, and a night to think. London will act on what you write: if genuine, the Foreign Office must believe that Belgrade's officers armed the assassins; if forged, that Vienna is manufacturing a case for war. Ashby wants one word, and your reasons.",
    choices: [
      { label: 'Genuine', sub: "Belgrade's officers sent it",
        ok: [['flag', 'op-cable-said-genuine'], ['op', 'op-cable', 'step:judge']] },
      { label: 'A forgery', sub: 'Someone wants Belgrade blamed',
        ok: [['flag', 'op-cable-said-forged'], ['op', 'op-cable', 'step:judge']] },
      { label: 'You cannot tell', sub: 'Ashby dislikes a shrug',
        ok: [['standing', -1], ['op', 'op-cable', 'step:judge']] },
    ] },

  // ---------- twists in Vienna ----------
  { id: 'op-cable.forged', at: 'op',
    title: 'The same words in print',
    text: "The Reichspost has it on page two: 'A Belgrade telegram found in Sarajevo', and beneath it, word for word, the text sewn into Jovan's law book. Either the police have a copy, or whoever wrote it has been posting it to newspapers. Genuine secrets are not usually so generous with themselves.",
    choices: [
      { label: 'Wire Ashby a warning', sub: '£2, and the censor reads it too', cost: { money: 2 },
        ok: [['record', 'wire', 0.5], note('The Reichspost printed your cable word for word: someone wants it believed.', 'paper', 0.7, true)] },
      { label: 'Cut it out and say nothing', sub: 'Keep your own counsel, and the cutting',
        ok: [note('The Reichspost printed your cable word for word: someone wants it believed.', 'paper', 0.7, true), ['nerve', -1]] },
      { label: 'Ask at the Reichspost who brought it', sub: 'A good question, and a dangerous one',
        roll: { p: 0.45, mods: [[['aff', 'venue:press', '>=', 1], 0.3], [['skill', 'charm', '>=', 2], 0.1]] },
        ok: [note('The Reichspost had the text from a captain of the Evidenzbureau.', 'rumour', 0.8, true)],
        fail: [['record', 'sighting', 0.7], ['watch', 0.2]] },
    ] },

  { id: 'op-cable.buyback', at: 'op',
    title: 'A colonel without a uniform',
    text: "He is too straight-backed for his civilian suit and too polite for a policeman. He speaks Serbian to the waiter and excellent German to you. 'You have a paper that belongs to my friends in Belgrade,' he says. 'They would like it back, and they are grateful people.' He lays thirty pounds in gold on the tablecloth.",
    choices: [
      { label: 'Sell it back to him', sub: '£30, and London gets nothing',
        ok: [['money', 30], ['item', '-sarajevo-cable'], ['op', 'op-cable', 'fail'],
          ['debrief', 'You sold the cable back to the Belgrade officers who had sent it.']] },
      { label: 'Refuse him', sub: 'He will remember your face',
        ok: [['record', 'sighting', 0.5], note('Belgrade officers want the cable back badly. That suggests it is genuine.', 'seen', 0.75, true)] },
      { label: 'Refuse, then follow him', sub: 'He may lead you to his friends',
        roll: { p: 0.45, mods: [[['skill', 'tradecraft', '>=', 2], 0.2]] },
        ok: [['record', 'sighting', 0.4], note('The colonel went straight to a house used by Serbian officers. The cable is theirs.', 'seen', 0.9, true)],
        fail: [['record', 'sighting', 0.9], ['nerve', -1]] },
    ] },

  // ---------- aftermath ----------
  { id: 'op-cable.reply', at: 'then', speaker: 'ashby',
    title: "Ashby's reply",
    text: "A reply in the Bureau's commercial code, decoded at the hotel desk with a pencil and a dictionary of wine prices. Ashby has had the cable examined by people who examine such things for a living, and has compared it with what else he knows. His telegram is, for him, almost talkative.",
    choices: [
      { label: 'CONFIRMED GENUINE STOP WELL DONE', if: [['flag', 'op-cable-said-genuine'], GENUINE],
        ok: [['standing', 6], ['debrief', 'The cable was genuine: Belgrade officers had sent it, and you said so.']] },
      { label: 'FORGERY STOP YOU WERE DECEIVED', if: [['flag', 'op-cable-said-genuine'], FORGED],
        ok: [['standing', -8], ['debrief', 'You called the cable genuine. It was an Evidenzbureau forgery, made to be found.']] },
      { label: 'CONFIRMED FORGERY STOP WELL DONE', if: [['flag', 'op-cable-said-forged'], FORGED],
        ok: [['standing', 6], ['debrief', "The cable was a forgery from Heller's office, and you saw through it."]] },
      { label: 'GENUINE STOP YOUR CAUTION COST US', if: [['flag', 'op-cable-said-forged'], GENUINE],
        ok: [['standing', -8], ['debrief', "You called a genuine cable forged. Belgrade's officers had sent it after all."]] },
      { label: 'NO VERDICT STOP DISAPPOINTED', if: [['not', ['flag', 'op-cable-said-genuine']], ['not', ['flag', 'op-cable-said-forged']]],
        ok: [['standing', -2], ['debrief', 'You would not call the cable either way. Ashby forwarded it with a shrug.']] },
    ] },

  { id: 'op-cable.taken', at: 'then',
    title: 'A note in bad French',
    text: "A note finds you, forwarded twice, in Serbian and bad French. Jovan's friends know a foreigner took the cable and gave nothing for it. One of them has been talking in a cell, and he talks about you. The note does not threaten. It simply describes your coat, your hat and your hotel.",
    choices: [
      { label: 'Burn it and change your coat', sub: '£3 for a new one', cost: { money: 3 },
        ok: [['expose', 'jovan', 0.3]] },
      { label: 'Send money for the prisoners', sub: "£5 by a friar's hand", cost: { money: 5 },
        ok: [['trust', 'jovan', 1], ['expose', 'jovan', 0.15]] },
      { label: 'Ignore it', sub: 'Notes are only paper',
        ok: [['expose', 'jovan', 0.4], ['record', 'sighting', 0.4]] },
    ] },
];
