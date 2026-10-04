// Storylets of op-lastboat, The Last Boat (owner: Ops). See docs/CONTRACTS.md §5. The run home.
// Reaching London ends the campaign, so there is no scene there: the run itself is the last act.

const semlinGone = ['intel', { subj: 'line:BUD-BEG', claim: { closed: [null, null] }, src: 'seen', rel: 0.95, truth: 'auto' }];

export default [
  // ---------- twists on the run ----------
  { id: 'op-lastboat.quay', at: 'then', if: [['op', 'op-lastboat'], ['any', ['city', 'FLU'], ['city', 'AMS']]],
    title: 'The last civilian sailing',
    text: "The quay is a wall of trunks and families: English governesses, German waiters going the other way, Americans waving letters of credit that nobody will cash. The next boat's berths were sold out at noon. A steward with a gold tooth is selling places in the crew's mess at ten times the fare. A sailor is signing on deckhands.",
    choices: [
      { label: 'Buy a place from the steward', sub: '£12, and nobody writes your name', cost: { money: 12 },
        ok: [['nerve', 1]] },
      { label: 'Sign on as a deckhand', sub: "Seaman's papers, and a crew list with your name", if: [['item', 'seamans-papers']],
        ok: [['record', 'list', 0.4]] },
      { label: "Join the nuns' party", sub: 'Twelve sisters and a chaplain; one more is nothing', if: [['cover', 'doyle']],
        ok: [['record', 'list', 0.2]] },
      { label: 'Ask the purser for your berth', sub: 'Held in your cover name, by London',
        if: [['any', ['flag', 'op-lastboat-berth'], ['flag', 'op-lastboat-listed'], ['flag', 'op-lastboat-vouched']]],
        ok: [['record', 'list', 0.3], ['nerve', 1]] },
      { label: 'Queue for the morning boat', sub: 'Twelve hours on a trunk', cost: { min: 720 },
        ok: [['nerve', -1]] },
    ] },

  { id: 'op-lastboat.alien', at: 'op',
    title: 'A Hungarian title, this week',
    text: "The British consul's clerk turns the Vészy passport over twice. Austria-Hungary is not at war with Britain, he says, not yet; but every subject of the Dual Monarchy landing in England this week will be questioned by an aliens officer on the quay, and remembered. He hands it back without a word.",
    choices: [
      { label: 'Wire Ashby to vouch for you', sub: '£2; he will, and he will remember', cost: { money: 2 },
        ok: [['record', 'wire', 0.5], ['flag', 'op-lastboat-vouched'], ['standing', -2]] },
      { label: 'Burn the Vészy papers and go plain', sub: 'The Vészys die a second time',
        ok: [['papers', 'vessey', -1], ['nerve', -1]] },
      { label: 'Risk the aliens officer', sub: "A title's manner opens most doors",
        roll: { p: 0.5, mods: [[['skill', 'composure', '>=', 2], 0.2], [['skill', 'charm', '>=', 2], 0.1]] },
        ok: [['nerve', -1]], fail: [['susp', 'vessey', 0.3], ['record', 'frontier', 1]] },
    ] },

  { id: 'op-lastboat.semlin', at: 'then', if: [['any', ['city', 'BEG'], ['city', 'BUD']], ['war', 'AH', 'RS']],
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

  { id: 'op-lastboat.siding', at: 'then',
    if: [['op', 'op-lastboat'], ['mode', 'rail'], ['any', ['nation', 'DE'], ['nation', 'BE'], ['nation', 'NL'], ['nation', 'FR']]],
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
