// Storylets of op-lastboat, The Last Boat (owner: Ops). See docs/CONTRACTS.md §5. The run home.

const semlinGone = ['intel', { subj: 'line:BUD-BEG', claim: { closed: [null, null] }, src: 'seen', rel: 0.95, truth: 'auto' }];

export default [
  // ---------- home ----------
  { id: 'op-lastboat.home', at: 'op', speaker: 'ashby', if: [['city', 'LON']],
    title: 'Whitehall, in the crowd',
    text: 'Whitehall is full of people who do not know why they have come: clerks, shopgirls, a man selling little flags. They sing, fall silent, and sing again. Ashby is waiting at the hotel with a kettle on a spirit lamp and a list of everything you were sent to fetch. He reads it aloud, item by item.',
    choices: [
      { label: 'Hand over everything you carry', sub: 'Whatever survived the journey',
        ok: [['standing', 2], ['debrief', 'You came home with what you carried, and handed it all over.']] },
      { label: 'Ask what becomes of your people', sub: 'Some of them will not live through this',
        ok: [['nerve', -1], ['debrief', 'Ashby promised to try for Sauer, Jovan and the rest. He meant it, and could do little.']] },
      { label: 'Ask for the next posting', sub: 'There will be one, and soon',
        ok: [['standing', 3], ['nerve', -2]] },
      { label: 'Thank him for vouching at the quay', sub: 'He did not enjoy it', if: [['flag', 'op-lastboat-vouched']],
        ok: [['trust', 'ashby', 1], ['standing', -1]] },
    ] },

  // ---------- twists on the run ----------
  { id: 'op-lastboat.quay', at: 'op',
    title: 'The last civilian sailing',
    text: "The quay is a wall of trunks and families: English governesses, German waiters going the other way, Americans waving letters of credit that nobody will cash. The next boat's berths were sold out at noon. A steward with a gold tooth is selling places in the crew's mess at ten times the fare. A sailor is signing on deckhands.",
    choices: [
      { label: 'Buy a place from the steward', sub: '£12, and nobody writes your name', cost: { money: 12 },
        ok: [['nerve', 1]] },
      { label: 'Sign on as a deckhand', sub: "Seaman's papers, and a crew list with your name", if: [['item', 'seamans-papers']],
        ok: [['record', 'list', 0.4]] },
      { label: "Join the nuns' party", sub: 'Twelve sisters and a chaplain; one more is nothing', if: [['cover', 'doyle']],
        ok: [['record', 'list', 0.2]] },
      { label: 'Queue for the morning boat', sub: 'Twelve hours on a trunk', cost: { min: 720 },
        ok: [['nerve', -1]] },
    ] },

  { id: 'op-lastboat.alien', at: 'op',
    title: 'A Hungarian title, this week',
    text: "The British consul's clerk turns the Vészy passport over twice. Austria-Hungary is not at war with Britain, he says, not yet; but every subject of the Dual Monarchy landing in England this week will be questioned by an aliens officer on the quay, and remembered. He hands it back without a word.",
    choices: [
      { label: 'Wire Ashby to vouch for you', sub: '£2; he will, and he will remember', cost: { money: 2 },
        ok: [['record', 'wire', 0.5], ['flag', 'op-lastboat-vouched'], ['standing', -2]] },
      { label: 'Burn the Vészy papers and go plain', sub: 'The count dies a second time',
        ok: [['papers', 'vessey', -1], ['nerve', -1]] },
      { label: 'Risk the aliens officer', sub: "A count's manner opens most doors",
        roll: { p: 0.5, mods: [[['skill', 'composure', '>=', 2], 0.2], [['skill', 'charm', '>=', 2], 0.1]] },
        ok: [['nerve', -1]], fail: [['susp', 'vessey', 0.3], ['record', 'frontier', 1]] },
    ] },

  { id: 'op-lastboat.semlin', at: 'op',
    title: 'The bridge at Semlin is gone',
    text: 'The Sava railway bridge went up at half past one in the morning, and the Austrian monitors on the Danube have been shelling Belgrade since. Nothing will cross at Semlin again this year. The way home lies south and east, through Nish and Sofia to Constantinople, and then by sea.',
    choices: [
      { label: 'Take the eastern line tonight', sub: 'Troop trains first; you may wait days',
        ok: [semlinGone, ['nerve', -1]] },
      { label: "Cross the Drina by Ilić's path", sub: 'Into Austria at war, by night', if: [['flag', 'ilic-path']],
        ok: [semlinGone, ['nerve', -2]] },
      { label: 'Wait for news at the legation', sub: 'A day, and the legation is packing', cost: { min: 1440 },
        ok: [semlinGone, ['intel', { subj: 'city:BEG', claim: { note: 'The legation says the Constantinople line still runs, slowly, behind the troop trains.' }, src: 'bureau', rel: 0.7, truth: true }]] },
    ] },

  { id: 'op-lastboat.siding', at: 'op',
    title: 'Shunted for the troop trains',
    text: 'Twenty minutes out, your train stops in a siding and stays there. Every half hour a troop train thunders past the other way, garlanded and singing. The guard says the military timetable has precedence over everything, including you. Your connection leaves in four hours, from a station forty miles on.',
    choices: [
      { label: 'Wait, and pray', sub: 'The siding may hold you for hours',
        ok: [['delay', 240], ['nerve', -1]] },
      { label: 'Walk to the village for a cart', sub: '£3, ten miles of dust, a better chance', cost: { money: 3 },
        roll: { p: 0.5, mods: [[['skill', 'streetwise', '>=', 2], 0.2], [['skill', 'german', '>=', 1], 0.1]] },
        ok: [['delay', 60]], fail: [['delay', 360]] },
      { label: 'Tip the guard for the truth', sub: '£1; guards always know', cost: { money: 1 },
        ok: [['delay', 180],
          ['intel', { subj: 'city:LON', claim: { note: 'The guard says the civilian Channel boats stop the moment war is declared.' }, src: 'porter', rel: 0.6, truth: true }]] },
    ] },
];
