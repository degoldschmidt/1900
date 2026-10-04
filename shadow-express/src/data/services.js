// Services (owner: World). See docs/CONTRACTS.md §2.
// Each departure board should offer a trade-off between speed, safety, plausibility and money:
//   express — fast, first and second class, dearer; keeps a passenger list; a commissioner checks papers on the train.
//   mail    — all classes, daily, about a third slower; controls on the frontier platform; no list.
//   night   — sleeping cars; the attendant keeps the berth book and holds your passport while you sleep.
//   slow    — second and third, cheap, slow, stops everywhere, writes nothing down.
//   steamer — weekly or a few times a week, slow and often late; the purser's passenger list.
//   coach, path — the road over the hills, and the two smugglers' ways that a contact must open.
// hours is the journey either way; dep lists departures from each end; days are the weekdays it runs (0 = Sunday).
// Punctuality: Prussian, Dutch and Swiss lines about .9; Austrian about .8; Italian about .7;
// Russian, Spanish and Balkan lines .5–.65 with delays of hours; steamers about .7 and long.

export default [
  // LON-PAR. Four ways to Paris: the fast boat express with a commissaire aboard; the Boulogne mail checked on the quay;
  // the night mail, whose cabin steward keeps the passenger book; the cheap tidal boat, slow and at the mercy of the tide.
  { id: 'lon-par-day', line: 'LON-PAR', kind: 'express', name: 'the Calais day express', dep: { LON: ['09.00'], PAR: ['09.50'] }, days: '*', hours: 7.75, fare: { 1: 5, 2: 4 }, sleeper: false, records: ['list'], punct: 0.88, maxDelay: 90, check: 'onboard' },
  { id: 'lon-par-boulogne', line: 'LON-PAR', kind: 'mail', name: 'the Folkestone–Boulogne mail', dep: { LON: ['11.00', '14.20'], PAR: ['12.00', '16.00'] }, days: '*', hours: 9.5, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.85, maxDelay: 120, check: 'station' },
  { id: 'lon-par-night', line: 'LON-PAR', kind: 'night', name: 'the Calais night mail', dep: { LON: ['21.00'], PAR: ['21.20'] }, days: '*', hours: 9, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.85, maxDelay: 120, check: 'onboard' },
  { id: 'lon-par-tidal', line: 'LON-PAR', kind: 'slow', name: 'the third-class tidal boat', dep: { LON: ['07.45'], PAR: ['07.15'] }, days: '*', hours: 11.5, fare: { 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.75, maxDelay: 180, check: 'station' },

  // LON-BRU. The Belgian State packets: a day boat, a night boat with cabins, and an afternoon mail for third-class passengers.
  { id: 'lon-bru-day', line: 'LON-BRU', kind: 'express', name: 'the Ostend day packet', dep: { LON: ['10.00'], BRU: ['08.40'] }, days: '*', hours: 7.25, fare: { 1: 4, 2: 3 }, sleeper: false, records: ['list'], punct: 0.88, maxDelay: 90, check: 'onboard' },
  { id: 'lon-bru-mail', line: 'LON-BRU', kind: 'mail', name: 'the Ostend afternoon mail', dep: { LON: ['14.00'], BRU: ['13.30'] }, days: '*', hours: 8.5, fare: { 1: 3, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.85, maxDelay: 120, check: 'station' },
  { id: 'lon-bru-night', line: 'LON-BRU', kind: 'night', name: 'the Ostend night mail', dep: { LON: ['21.00'], BRU: ['20.30'] }, days: '*', hours: 9.75, fare: { 1: 5, 2: 3 }, sleeper: true, records: ['berth'], punct: 0.85, maxDelay: 120, check: 'onboard' },

  // LON-AMS. The Great Eastern's nightly boat, or a twice-weekly cargo boat that takes a day and asks few questions.
  { id: 'hook-night', line: 'LON-AMS', kind: 'steamer', name: 'the Harwich–Hook night boat', dep: { LON: ['20.30'], AMS: ['19.45'] }, days: '*', hours: 12, fare: { 1: 4, 2: 3 }, sleeper: true, records: ['list', 'berth'], punct: 0.8, maxDelay: 180, check: 'station' },
  { id: 'ams-cargo-boat', line: 'LON-AMS', kind: 'steamer', name: 'the Amsterdam cargo boat', dep: { LON: ['11.00'], AMS: ['10.00'] }, days: '25', hours: 26, fare: { 2: 2, 3: 1 }, sleeper: false, records: ['list'], punct: 0.65, maxDelay: 480, check: 'station' },

  // LON-FLU. The Zeeland Line's day and night boats; or a Dutch eel boat from Billingsgate, weekly, slow, and with no passenger book at all.
  { id: 'zeeland-day', line: 'LON-FLU', kind: 'mail', name: 'the Zeeland day boat', dep: { LON: ['10.00'], FLU: ['10.15'] }, days: '*', hours: 8.5, fare: { 1: 3, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.85, maxDelay: 120, check: 'station' },
  { id: 'zeeland-night', line: 'LON-FLU', kind: 'night', name: 'the Zeeland night boat', dep: { LON: ['20.30'], FLU: ['22.30'] }, days: '*', hours: 9.5, fare: { 1: 4, 2: 3 }, sleeper: true, records: ['berth'], punct: 0.85, maxDelay: 120, check: 'onboard' },
  { id: 'eel-boat', line: 'LON-FLU', kind: 'slow', name: 'a Dutch eel boat from Billingsgate', dep: { LON: ['05.00'], FLU: ['18.00'] }, days: '3', hours: 30, fare: { 3: 1 }, sleeper: false, records: [], punct: 0.5, maxDelay: 720, check: 'station' },

  // LON-HAM. No train goes to Hamburg from London: a London boat twice a week, or the Great Eastern packet from Harwich, quicker and dearer.
  { id: 'gsn-hamburg', line: 'LON-HAM', kind: 'steamer', name: 'the General Steam Navigation boat', dep: { LON: ['11.00'], HAM: ['10.00'] }, days: '36', hours: 34, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: ['list'], punct: 0.7, maxDelay: 480, check: 'station' },
  { id: 'ger-hamburg', line: 'LON-HAM', kind: 'steamer', name: 'the Great Eastern packet by Harwich', dep: { LON: ['18.00'], HAM: ['17.30'] }, days: '25', hours: 24, fare: { 1: 5, 2: 3 }, sleeper: true, records: ['list', 'berth'], punct: 0.75, maxDelay: 300, check: 'onboard' },

  // LON-LIS. The Royal Mail packet sails from Southampton on Fridays; a fruit steamer leaves Tilbury on Tuesdays and takes its time.
  { id: 'rmsp-lisbon', line: 'LON-LIS', kind: 'steamer', name: 'the Royal Mail packet by Southampton', dep: { LON: ['09.30'], LIS: ['16.00'] }, days: '5', hours: 74, fare: { 1: 12, 2: 8, 3: 4 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 600, check: 'station' },
  { id: 'lisbon-trader', line: 'LON-LIS', kind: 'steamer', name: 'a Lisbon fruit steamer from Tilbury', dep: { LON: ['14.00'], LIS: ['10.00'] }, days: '2', hours: 110, fare: { 2: 5, 3: 3 }, sleeper: false, records: ['list'], punct: 0.6, maxDelay: 900, check: 'station' },

  // PAR-BRU. Odile's line: the Nord rapide with an inspector aboard, the Belgian mail, and the early omnibus that stops everywhere.
  { id: 'par-bru-rapide', line: 'PAR-BRU', kind: 'express', name: 'the Brussels rapide', dep: { PAR: ['08.20', '18.00'], BRU: ['08.00', '17.55'] }, days: '*', hours: 4, fare: { 1: 2, 2: 1 }, sleeper: false, records: ['list'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'par-bru-mail', line: 'PAR-BRU', kind: 'mail', name: 'the Belgian mail', dep: { PAR: ['07.30', '12.40', '22.10'], BRU: ['07.20', '12.10', '22.30'] }, days: '*', hours: 5.25, fare: { 1: 2, 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.88, maxDelay: 90, check: 'station' },
  { id: 'par-bru-omnibus', line: 'PAR-BRU', kind: 'slow', name: 'the Maubeuge omnibus', dep: { PAR: ['06.10'], BRU: ['06.40'] }, days: '*', hours: 7.5, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.85, maxDelay: 120, check: 'station' },

  // PAR-MAR. No frontier, but the sleeping-car attendant still writes your name in his book.
  { id: 'plm-rapide', line: 'PAR-MAR', kind: 'express', name: 'the PLM day rapide', dep: { PAR: ['08.55'], MAR: ['08.30'] }, days: '*', hours: 12.5, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.88, maxDelay: 90, check: 'none' },
  { id: 'plm-night', line: 'PAR-MAR', kind: 'night', name: 'the Marseille sleeping-car rapide', dep: { PAR: ['19.40'], MAR: ['19.15'] }, days: '*', hours: 13.5, fare: { 1: 7, 2: 5 }, sleeper: true, records: ['berth'], punct: 0.88, maxDelay: 90, check: 'none' },
  { id: 'plm-mail', line: 'PAR-MAR', kind: 'mail', name: 'the Lyon and Marseille mail', dep: { PAR: ['07.15', '21.05'], MAR: ['07.00', '20.30'] }, days: '*', hours: 16.5, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.85, maxDelay: 120, check: 'none' },

  // PAR-ZUR. Amsler's line, by Delle so as never to touch German rails.
  { id: 'par-zur-express', line: 'PAR-ZUR', kind: 'express', name: 'the Zurich express by Delle', dep: { PAR: ['08.35'], ZUR: ['07.50'] }, days: '*', hours: 10.5, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'par-zur-night', line: 'PAR-ZUR', kind: 'night', name: 'the Belfort night train', dep: { PAR: ['21.30'], ZUR: ['20.45'] }, days: '*', hours: 12, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.88, maxDelay: 90, check: 'onboard' },
  { id: 'par-zur-mail', line: 'PAR-ZUR', kind: 'mail', name: 'the Swiss mail by Delle', dep: { PAR: ['07.00'], ZUR: ['06.40'] }, days: '*', hours: 13.5, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.88, maxDelay: 90, check: 'station' },

  // PAR-MUN. Through Lorraine into the Reichsland at Avricourt, where German customs do not hurry.
  { id: 'par-mun-express', line: 'PAR-MUN', kind: 'express', name: 'the Munich express by Strasbourg', dep: { PAR: ['08.05'], MUN: ['07.40'] }, days: '*', hours: 15, fare: { 1: 7, 2: 5 }, sleeper: false, records: ['list'], punct: 0.88, maxDelay: 75, check: 'onboard' },
  { id: 'par-mun-night', line: 'PAR-MUN', kind: 'night', name: 'the Stuttgart sleeping-car train', dep: { PAR: ['21.00'], MUN: ['19.30'] }, days: '*', hours: 15.5, fare: { 1: 8, 2: 6 }, sleeper: true, records: ['berth'], punct: 0.88, maxDelay: 90, check: 'onboard' },
  { id: 'par-mun-mail', line: 'PAR-MUN', kind: 'mail', name: 'the Strasbourg mail', dep: { PAR: ['07.30', '20.20'], MUN: ['06.45', '21.10'] }, days: '*', hours: 19, fare: { 1: 6, 2: 4, 3: 2 }, sleeper: false, records: [], punct: 0.85, maxDelay: 120, check: 'station' },

  // PAR-VIE. The Orient-Express: first class only, a Wagons-Lits conductor who keeps your passport overnight and a list of everyone aboard.
  // Or the through mail, all classes and two frontiers on the platform; or a day and a half of slow trains for a few shillings.
  { id: 'orient-w', line: 'PAR-VIE', kind: 'express', name: 'the Orient-Express', dep: { PAR: ['19.30'], VIE: ['09.40'] }, days: '*', hours: 24, fare: { 1: 13 }, sleeper: true, records: ['berth', 'list'], punct: 0.85, maxDelay: 120, check: 'onboard' },
  { id: 'par-vie-mail', line: 'PAR-VIE', kind: 'mail', name: 'the Vienna through mail', dep: { PAR: ['07.40', '21.15'], VIE: ['07.15', '20.50'] }, days: '*', hours: 31, fare: { 1: 10, 2: 7, 3: 4 }, sleeper: false, records: [], punct: 0.82, maxDelay: 150, check: 'station' },
  { id: 'par-vie-slow', line: 'PAR-VIE', kind: 'slow', name: 'the Strasbourg and Linz omnibus trains', dep: { PAR: ['06.20'], VIE: ['05.55'] }, days: '*', hours: 40, fare: { 2: 6, 3: 3 }, sleeper: false, records: [], punct: 0.8, maxDelay: 180, check: 'station' },

  // PAR-MAD. The Sud-Express runs three days a week; otherwise a sleeping car to the frontier, or the mail with a change of gauge at Irún.
  { id: 'sud-express', line: 'PAR-MAD', kind: 'express', name: 'the Sud-Express', dep: { PAR: ['13.20'], MAD: ['11.00'] }, days: '135', hours: 25, fare: { 1: 13 }, sleeper: true, records: ['berth', 'list'], punct: 0.7, maxDelay: 180, check: 'onboard' },
  { id: 'par-mad-night', line: 'PAR-MAD', kind: 'night', name: 'the Irún sleeping-car express', dep: { PAR: ['20.15'], MAD: ['19.40'] }, days: '*', hours: 30, fare: { 1: 12, 2: 8 }, sleeper: true, records: ['berth'], punct: 0.65, maxDelay: 240, check: 'onboard' },
  { id: 'par-mad-mail', line: 'PAR-MAD', kind: 'mail', name: 'the Irún mail', dep: { PAR: ['09.30'], MAD: ['08.15'] }, days: '*', hours: 36, fare: { 1: 10, 2: 7, 3: 4 }, sleeper: false, records: [], punct: 0.6, maxDelay: 300, check: 'station' },

  // BRU-AMS. Across the Moerdijk bridge into Holland.
  { id: 'bru-ams-express', line: 'BRU-AMS', kind: 'express', name: 'the Amsterdam express', dep: { BRU: ['08.30', '17.15'], AMS: ['08.10', '16.40'] }, days: '*', hours: 4, fare: { 1: 2, 2: 1 }, sleeper: false, records: ['list'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'bru-ams-mail', line: 'BRU-AMS', kind: 'mail', name: 'the Antwerp and Roosendaal mail', dep: { BRU: ['06.50', '13.05', '19.20'], AMS: ['06.30', '12.50', '19.00'] }, days: '*', hours: 5.25, fare: { 1: 2, 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.9, maxDelay: 60, check: 'station' },
  { id: 'bru-ams-slow', line: 'BRU-AMS', kind: 'slow', name: 'the Moerdijk omnibus', dep: { BRU: ['05.45'], AMS: ['05.30'] }, days: '*', hours: 7, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.88, maxDelay: 90, check: 'station' },

  // BRU-COL. Two great expresses pass through Brussels each evening, both first class and both keeping lists; the mail and the omnibus do not.
  { id: 'nord-express-bc', line: 'BRU-COL', kind: 'express', name: 'the Nord-Express', dep: { BRU: ['18.40'], COL: ['07.05'] }, days: '*', hours: 3.75, fare: { 1: 4 }, sleeper: true, records: ['berth', 'list'], punct: 0.92, maxDelay: 45, check: 'onboard' },
  { id: 'ostend-vienna', line: 'BRU-COL', kind: 'express', name: 'the Ostend-Vienna Express', dep: { BRU: ['20.05'], COL: ['05.30'] }, days: '*', hours: 4, fare: { 1: 4, 2: 3 }, sleeper: true, records: ['berth', 'list'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'bru-col-mail', line: 'BRU-COL', kind: 'mail', name: 'the Liège mail', dep: { BRU: ['07.20', '13.40'], COL: ['07.50', '14.10'] }, days: '*', hours: 5, fare: { 1: 2, 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.9, maxDelay: 60, check: 'station' },
  { id: 'bru-col-slow', line: 'BRU-COL', kind: 'slow', name: 'the Verviers omnibus', dep: { BRU: ['06.00'], COL: ['06.15'] }, days: '*', hours: 7.25, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.88, maxDelay: 90, check: 'station' },

  // AMS-COL. Down the Rhine through Emmerich.
  { id: 'ams-col-express', line: 'AMS-COL', kind: 'express', name: 'the Rhine express by Emmerich', dep: { AMS: ['08.45', '16.10'], COL: ['08.20', '15.30'] }, days: '*', hours: 5, fare: { 1: 3, 2: 2 }, sleeper: false, records: ['list'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'ams-col-mail', line: 'AMS-COL', kind: 'mail', name: 'the Arnhem mail', dep: { AMS: ['07.05', '13.20', '22.40'], COL: ['06.50', '12.45', '22.20'] }, days: '*', hours: 6.5, fare: { 1: 2, 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.9, maxDelay: 60, check: 'station' },
  { id: 'ams-col-slow', line: 'AMS-COL', kind: 'slow', name: 'the Zevenaar omnibus', dep: { AMS: ['06.05'], COL: ['06.30'] }, days: '*', hours: 8.5, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.88, maxDelay: 90, check: 'station' },

  // AMS-HAM. By Bentheim and Bremen.
  { id: 'ams-ham-express', line: 'AMS-HAM', kind: 'express', name: 'the Hamburg express by Bentheim', dep: { AMS: ['09.20'], HAM: ['09.05'] }, days: '*', hours: 8.5, fare: { 1: 4, 2: 3 }, sleeper: false, records: ['list'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'ams-ham-night', line: 'AMS-HAM', kind: 'night', name: 'the Bremen sleeping-car train', dep: { AMS: ['21.50'], HAM: ['21.35'] }, days: '*', hours: 10, fare: { 1: 5, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'ams-ham-mail', line: 'AMS-HAM', kind: 'mail', name: 'the Oldenzaal mail', dep: { AMS: ['07.00', '13.30'], HAM: ['06.40', '13.10'] }, days: '*', hours: 11, fare: { 1: 4, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.88, maxDelay: 90, check: 'station' },

  // FLU-AMS. The boat trains meet the Zeeland boats; the mail stops at every polder town.
  { id: 'flu-ams-boat', line: 'FLU-AMS', kind: 'express', name: 'the Zeeland boat train', dep: { FLU: ['06.30', '19.40'], AMS: ['05.40', '17.30'] }, days: '*', hours: 4, fare: { 1: 2, 2: 1 }, sleeper: false, records: ['list'], punct: 0.92, maxDelay: 45, check: 'none' },
  { id: 'flu-ams-mail', line: 'FLU-AMS', kind: 'mail', name: 'the Middelburg and Rotterdam mail', dep: { FLU: ['08.00', '13.15'], AMS: ['08.20', '13.00'] }, days: '*', hours: 5, fare: { 1: 1, 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.9, maxDelay: 60, check: 'none' },

  // COL-BER. Kessel's line: the Nord-Express by night, the Berlin D-train by day, a sleeping-car train, and an omnibus for the frugal.
  { id: 'nord-express-cb', line: 'COL-BER', kind: 'express', name: 'the Nord-Express', dep: { COL: ['22.55'], BER: ['21.50'] }, days: '*', hours: 8.5, fare: { 1: 6 }, sleeper: true, records: ['berth', 'list'], punct: 0.92, maxDelay: 45, check: 'none' },
  { id: 'col-ber-d', line: 'COL-BER', kind: 'express', name: 'the Berlin D-train', dep: { COL: ['08.10', '13.05', '17.45'], BER: ['08.00', '13.20', '17.10'] }, days: '*', hours: 9, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.92, maxDelay: 45, check: 'none' },
  { id: 'col-ber-night', line: 'COL-BER', kind: 'night', name: 'the Ruhr sleeping-car train', dep: { COL: ['23.35'], BER: ['22.40'] }, days: '*', hours: 10, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.9, maxDelay: 60, check: 'none' },
  { id: 'col-ber-slow', line: 'COL-BER', kind: 'slow', name: 'the Hanover omnibus', dep: { COL: ['06.15', '11.30'], BER: ['06.05', '12.10'] }, days: '*', hours: 14.5, fare: { 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.9, maxDelay: 90, check: 'none' },

  // COL-ZUR. Up the Rhine to Basel, where the German customs sit inside a Swiss city.
  { id: 'col-zur-express', line: 'COL-ZUR', kind: 'express', name: 'the Basel express up the Rhine', dep: { COL: ['07.55'], ZUR: ['07.35'] }, days: '*', hours: 10, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'col-zur-night', line: 'COL-ZUR', kind: 'night', name: 'the Rhine night express', dep: { COL: ['21.20'], ZUR: ['20.50'] }, days: '*', hours: 11, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'col-zur-mail', line: 'COL-ZUR', kind: 'mail', name: 'the Mainz and Freiburg mail', dep: { COL: ['06.40'], ZUR: ['06.10'] }, days: '*', hours: 13, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.9, maxDelay: 60, check: 'station' },

  // HAM-BER. Sauer's line: fast, frequent and Prussian.
  { id: 'ham-ber-d', line: 'HAM-BER', kind: 'express', name: 'the Hamburg D-train', dep: { HAM: ['08.00', '17.10'], BER: ['08.15', '17.30'] }, days: '*', hours: 3.5, fare: { 1: 2, 2: 1 }, sleeper: false, records: ['list'], punct: 0.93, maxDelay: 30, check: 'none' },
  { id: 'ham-ber-mail', line: 'HAM-BER', kind: 'mail', name: 'the Wittenberge mail', dep: { HAM: ['06.30', '12.20', '23.15'], BER: ['06.45', '12.40', '23.30'] }, days: '*', hours: 4.75, fare: { 1: 2, 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.92, maxDelay: 45, check: 'none' },
  { id: 'ham-ber-slow', line: 'HAM-BER', kind: 'slow', name: 'the Ludwigslust omnibus', dep: { HAM: ['05.40'], BER: ['05.55'] }, days: '*', hours: 7, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.9, maxDelay: 60, check: 'none' },

  // HAM-CPH. By Kiel and the Great Belt: a night boat with cabins, or the day steamer with Danish customs on the quay at Korsør.
  { id: 'kiel-korsor-night', line: 'HAM-CPH', kind: 'night', name: 'the Kiel–Korsør night boat', dep: { HAM: ['20.10'], CPH: ['20.30'] }, days: '*', hours: 10.5, fare: { 1: 4, 2: 3 }, sleeper: true, records: ['berth'], punct: 0.85, maxDelay: 120, check: 'onboard' },
  { id: 'kiel-korsor-day', line: 'HAM-CPH', kind: 'mail', name: 'the Kiel day steamer', dep: { HAM: ['07.30'], CPH: ['08.00'] }, days: '*', hours: 11.5, fare: { 1: 3, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.85, maxDelay: 120, check: 'station' },

  // BER-CPH. The train ferry from Warnemünde to Gedser carries whole sleeping cars across the Baltic.
  { id: 'ber-cph-express', line: 'BER-CPH', kind: 'express', name: 'the Copenhagen express by Gedser', dep: { BER: ['08.50'], CPH: ['08.25'] }, days: '*', hours: 9.5, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.88, maxDelay: 90, check: 'onboard' },
  { id: 'ber-cph-night', line: 'BER-CPH', kind: 'night', name: 'the Warnemünde sleeping cars', dep: { BER: ['22.25'], CPH: ['21.30'] }, days: '*', hours: 10.5, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.88, maxDelay: 90, check: 'onboard' },
  { id: 'ber-cph-mail', line: 'BER-CPH', kind: 'mail', name: 'the Rostock mail and ferry', dep: { BER: ['06.55'], CPH: ['06.40'] }, days: '*', hours: 12, fare: { 1: 4, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.86, maxDelay: 120, check: 'station' },

  // CPH-STO. Across the Sound to Malmö, then the long Swedish night.
  { id: 'cph-sto-night', line: 'CPH-STO', kind: 'night', name: 'the Malmö boat and the Stockholm night express', dep: { CPH: ['18.30'], STO: ['19.10'] }, days: '*', hours: 14, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.9, maxDelay: 60, check: 'onboard' },
  { id: 'cph-sto-day', line: 'CPH-STO', kind: 'mail', name: 'the Sound steamer and the day mail', dep: { CPH: ['07.00'], STO: ['07.30'] }, days: '*', hours: 15, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.9, maxDelay: 60, check: 'station' },

  // STO-SPB. The nightly Åbo boat and the Finland train, or the weekly through steamer to Petersburg.
  { id: 'bore-abo', line: 'STO-SPB', kind: 'steamer', name: 'the Åbo night boat and the Finland train', dep: { STO: ['18.00'], SPB: ['17.30'] }, days: '*', hours: 30, fare: { 1: 6, 2: 4, 3: 2 }, sleeper: true, records: ['list', 'berth'], punct: 0.75, maxDelay: 300, check: 'station' },
  { id: 'fsc-petersburg', line: 'STO-SPB', kind: 'steamer', name: 'the Finland Steamship Company\'s Petersburg boat', dep: { STO: ['16.00'], SPB: ['14.00'] }, days: '4', hours: 42, fare: { 1: 7, 2: 4, 3: 2 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 480, check: 'station' },

  // BER-WAR. Kowal's line. At Alexandrowo the gauge changes and so does the empire: Russian gendarmes want a visa'd passport.
  // The express keeps a list, the night train a berth book, the omnibus nothing; Kowal's path skirts the post altogether.
  { id: 'ber-war-express', line: 'BER-WAR', kind: 'express', name: 'the Alexandrowo express', dep: { BER: ['08.15'], WAR: ['08.05'] }, days: '*', hours: 11.5, fare: { 1: 6, 2: 4 }, sleeper: false, records: ['list'], punct: 0.8, maxDelay: 120, check: 'onboard' },
  { id: 'ber-war-night', line: 'BER-WAR', kind: 'night', name: 'the Warsaw sleeping-car train', dep: { BER: ['20.40'], WAR: ['20.10'] }, days: '*', hours: 13, fare: { 1: 7, 2: 5 }, sleeper: true, records: ['berth'], punct: 0.8, maxDelay: 150, check: 'onboard' },
  { id: 'ber-war-slow', line: 'BER-WAR', kind: 'slow', name: 'the Thorn omnibus', dep: { BER: ['06.30'], WAR: ['06.00'] }, days: '*', hours: 18.5, fare: { 2: 3, 3: 1 }, sleeper: false, records: [], punct: 0.75, maxDelay: 240, check: 'station' },
  { id: 'kowal-path', line: 'BER-WAR', kind: 'path', name: 'Kowal\'s path by Thorn', dep: { BER: ['22.00'], WAR: ['22.00'] }, days: '*', hours: 20, fare: { 3: 6 }, sleeper: false, records: [], punct: 0.6, maxDelay: 480, check: 'none', unlock: 'flag:kowal-path' },

  // BER-SPB. The Nord-Express goes on to Petersburg three days a week; the sleeping-car express and the mail go daily, and slower.
  { id: 'nord-express-bs', line: 'BER-SPB', kind: 'express', name: 'the Nord-Express', dep: { BER: ['08.20'], SPB: ['17.30'] }, days: '246', hours: 28, fare: { 1: 14 }, sleeper: true, records: ['berth', 'list'], punct: 0.82, maxDelay: 120, check: 'onboard' },
  { id: 'ber-spb-night', line: 'BER-SPB', kind: 'night', name: 'the Petersburg sleeping-car express', dep: { BER: ['17.45'], SPB: ['19.10'] }, days: '*', hours: 31, fare: { 1: 12, 2: 8 }, sleeper: true, records: ['berth'], punct: 0.75, maxDelay: 180, check: 'onboard' },
  { id: 'ber-spb-mail', line: 'BER-SPB', kind: 'mail', name: 'the Königsberg and Vilna mail', dep: { BER: ['07.05'], SPB: ['08.30'] }, days: '*', hours: 37, fare: { 1: 10, 2: 7, 3: 4 }, sleeper: false, records: [], punct: 0.65, maxDelay: 300, check: 'station' },

  // BER-PRG. The first half of Berlin to Vienna: up the Elbe gorge to the Austrian customs at Bodenbach.
  { id: 'ber-prg-express', line: 'BER-PRG', kind: 'express', name: 'the Vienna express by Dresden', dep: { BER: ['08.05', '14.20'], PRG: ['08.30', '13.45'] }, days: '*', hours: 6.25, fare: { 1: 3, 2: 2 }, sleeper: false, records: ['list'], punct: 0.88, maxDelay: 60, check: 'onboard' },
  { id: 'ber-prg-night', line: 'BER-PRG', kind: 'night', name: 'the Bohemian night train', dep: { BER: ['22.30'], PRG: ['22.05'] }, days: '*', hours: 7.5, fare: { 1: 4, 2: 3 }, sleeper: true, records: ['berth'], punct: 0.85, maxDelay: 90, check: 'onboard' },
  { id: 'ber-prg-mail', line: 'BER-PRG', kind: 'mail', name: 'the Elbe valley mail', dep: { BER: ['07.10', '15.30'], PRG: ['07.00', '15.05'] }, days: '*', hours: 8.5, fare: { 1: 3, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.85, maxDelay: 90, check: 'station' },
  { id: 'ber-prg-slow', line: 'BER-PRG', kind: 'slow', name: 'the Dresden and Aussig omnibus', dep: { BER: ['05.50'], PRG: ['06.20'] }, days: '*', hours: 10.5, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.82, maxDelay: 120, check: 'station' },

  // BER-MUN. Kessel's other line, through the Frankenwald.
  { id: 'ber-mun-d', line: 'BER-MUN', kind: 'express', name: 'the Munich D-train', dep: { BER: ['08.35'], MUN: ['08.20'] }, days: '*', hours: 10.5, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.9, maxDelay: 60, check: 'none' },
  { id: 'ber-mun-night', line: 'BER-MUN', kind: 'night', name: 'the Munich sleeping-car express', dep: { BER: ['20.50'], MUN: ['20.35'] }, days: '*', hours: 11.5, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.9, maxDelay: 60, check: 'none' },
  { id: 'ber-mun-mail', line: 'BER-MUN', kind: 'mail', name: 'the Saalfeld mail', dep: { BER: ['07.20'], MUN: ['06.50'] }, days: '*', hours: 13.5, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.88, maxDelay: 90, check: 'none' },

  // WAR-SPB. Russian time: an express with sleeping cars, or the mail, a day and more and frequently late.
  { id: 'war-spb-express', line: 'WAR-SPB', kind: 'express', name: 'the Petersburg express', dep: { WAR: ['18.30'], SPB: ['19.30'] }, days: '*', hours: 20, fare: { 1: 8, 2: 5 }, sleeper: true, records: ['list', 'berth'], punct: 0.65, maxDelay: 240, check: 'none' },
  { id: 'war-spb-mail', line: 'WAR-SPB', kind: 'mail', name: 'the Vilna mail', dep: { WAR: ['09.10'], SPB: ['10.00'] }, days: '*', hours: 26, fare: { 1: 7, 2: 4, 3: 2 }, sleeper: false, records: [], punct: 0.6, maxDelay: 300, check: 'none' },

  // WAR-VIE. Into Galicia at Granica, where Austrian and Russian gendarmes eye each other across the tracks.
  { id: 'war-vie-express', line: 'WAR-VIE', kind: 'express', name: 'the Warsaw–Vienna express', dep: { WAR: ['19.55'], VIE: ['20.20'] }, days: '*', hours: 13, fare: { 1: 7, 2: 5 }, sleeper: true, records: ['list', 'berth'], punct: 0.75, maxDelay: 150, check: 'onboard' },
  { id: 'war-vie-mail', line: 'WAR-VIE', kind: 'mail', name: 'the Granica mail', dep: { WAR: ['08.10'], VIE: ['07.45'] }, days: '*', hours: 17, fare: { 1: 6, 2: 4, 3: 2 }, sleeper: false, records: [], punct: 0.7, maxDelay: 180, check: 'station' },

  // WAR-ODE. Across the black earth by Kovel and Kazatin.
  { id: 'war-ode-express', line: 'WAR-ODE', kind: 'express', name: 'the Odessa express', dep: { WAR: ['16.40'], ODE: ['17.20'] }, days: '*', hours: 30, fare: { 1: 9, 2: 6 }, sleeper: true, records: ['list', 'berth'], punct: 0.62, maxDelay: 300, check: 'none' },
  { id: 'war-ode-mail', line: 'WAR-ODE', kind: 'mail', name: 'the Kovel and Kazatin mail', dep: { WAR: ['08.20'], ODE: ['07.50'] }, days: '*', hours: 39, fare: { 1: 8, 2: 5, 3: 3 }, sleeper: false, records: [], punct: 0.55, maxDelay: 360, check: 'none' },

  // PRG-VIE. Novák's line, and the second half of Berlin to Vienna. No frontier, but the Austrian police read the berth books.
  { id: 'prg-vie-express', line: 'PRG-VIE', kind: 'express', name: 'the Brünn express', dep: { PRG: ['06.50', '15.05'], VIE: ['07.20', '14.40'] }, days: '*', hours: 6.5, fare: { 1: 3, 2: 2 }, sleeper: false, records: ['list'], punct: 0.82, maxDelay: 90, check: 'none' },
  { id: 'prg-vie-night', line: 'PRG-VIE', kind: 'night', name: 'the Vienna night train', dep: { PRG: ['22.45'], VIE: ['22.15'] }, days: '*', hours: 8, fare: { 1: 4, 2: 3 }, sleeper: true, records: ['berth'], punct: 0.8, maxDelay: 120, check: 'none' },
  { id: 'prg-vie-mail', line: 'PRG-VIE', kind: 'mail', name: 'the Bohemian mail', dep: { PRG: ['08.30', '13.10'], VIE: ['08.00', '13.35'] }, days: '*', hours: 8.5, fare: { 1: 3, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.8, maxDelay: 120, check: 'none' },
  { id: 'prg-vie-slow', line: 'PRG-VIE', kind: 'slow', name: 'the Kolín omnibus', dep: { PRG: ['05.50'], VIE: ['06.05'] }, days: '*', hours: 11.5, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.78, maxDelay: 150, check: 'none' },

  // MUN-VIE. The Orient-Express calls at Munich in the morning; a night train and the Westbahn mail do the rest.
  { id: 'orient-mv', line: 'MUN-VIE', kind: 'express', name: 'the Orient-Express', dep: { MUN: ['10.40'], VIE: ['09.40'] }, days: '*', hours: 8.75, fare: { 1: 6 }, sleeper: true, records: ['berth', 'list'], punct: 0.85, maxDelay: 120, check: 'onboard' },
  { id: 'mun-vie-night', line: 'MUN-VIE', kind: 'night', name: 'the Salzburg night train', dep: { MUN: ['22.30'], VIE: ['21.50'] }, days: '*', hours: 10, fare: { 1: 5, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.82, maxDelay: 120, check: 'onboard' },
  { id: 'mun-vie-mail', line: 'MUN-VIE', kind: 'mail', name: 'the Westbahn mail', dep: { MUN: ['07.10', '13.25'], VIE: ['07.05', '13.00'] }, days: '*', hours: 10.5, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.8, maxDelay: 120, check: 'station' },
  { id: 'mun-vie-slow', line: 'MUN-VIE', kind: 'slow', name: 'the Westbahn omnibus trains', dep: { MUN: ['05.45'], VIE: ['05.30'] }, days: '*', hours: 13.5, fare: { 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.78, maxDelay: 150, check: 'station' },

  // MUN-ZUR. By Lindau and the lake steamer to Romanshorn: Swiss soil without a Swiss frontier station in sight until the far shore.
  { id: 'mun-zur-express', line: 'MUN-ZUR', kind: 'express', name: 'the Lindau express and lake steamer', dep: { MUN: ['07.35', '14.50'], ZUR: ['07.20', '14.05'] }, days: '*', hours: 6.5, fare: { 1: 3, 2: 2 }, sleeper: false, records: ['list'], punct: 0.88, maxDelay: 60, check: 'onboard' },
  { id: 'mun-zur-mail', line: 'MUN-ZUR', kind: 'mail', name: 'the Allgäu mail and the Romanshorn ferry', dep: { MUN: ['06.20'], ZUR: ['06.05'] }, days: '*', hours: 8.5, fare: { 1: 3, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.88, maxDelay: 75, check: 'station' },

  // MUN-VEN. Agathe's line over the Brenner: two frontiers, Kufstein and Ala, and an Austrian Tyrol between them.
  { id: 'mun-ven-express', line: 'MUN-VEN', kind: 'express', name: 'the Brenner express', dep: { MUN: ['08.25'], VEN: ['08.05'] }, days: '*', hours: 12.5, fare: { 1: 6, 2: 4 }, sleeper: false, records: ['list'], punct: 0.8, maxDelay: 120, check: 'onboard' },
  { id: 'mun-ven-night', line: 'MUN-VEN', kind: 'night', name: 'the Verona sleeping-car train', dep: { MUN: ['21.40'], VEN: ['20.55'] }, days: '*', hours: 13.5, fare: { 1: 7, 2: 5 }, sleeper: true, records: ['berth'], punct: 0.78, maxDelay: 150, check: 'onboard' },
  { id: 'mun-ven-mail', line: 'MUN-VEN', kind: 'mail', name: 'the Innsbruck and Trient mail', dep: { MUN: ['06.45'], VEN: ['06.20'] }, days: '*', hours: 16, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.75, maxDelay: 180, check: 'station' },

  // ZUR-VEN. The Gotthard, neutral all the way to Chiasso: an express, a sleeping-car train, the Ticino mail, and the cheapest way to Italy.
  { id: 'gotthard-express', line: 'ZUR-VEN', kind: 'express', name: 'the Gotthard express', dep: { ZUR: ['08.10'], VEN: ['07.55'] }, days: '*', hours: 11, fare: { 1: 6, 2: 4 }, sleeper: false, records: ['list'], punct: 0.85, maxDelay: 90, check: 'onboard' },
  { id: 'gotthard-night', line: 'ZUR-VEN', kind: 'night', name: 'the Milan sleeping-car train', dep: { ZUR: ['21.15'], VEN: ['20.30'] }, days: '*', hours: 12.5, fare: { 1: 7, 2: 5 }, sleeper: true, records: ['berth'], punct: 0.8, maxDelay: 120, check: 'onboard' },
  { id: 'gotthard-mail', line: 'ZUR-VEN', kind: 'mail', name: 'the Ticino mail', dep: { ZUR: ['06.30', '12.40'], VEN: ['06.00', '12.15'] }, days: '*', hours: 14.5, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.75, maxDelay: 150, check: 'station' },
  { id: 'gotthard-slow', line: 'ZUR-VEN', kind: 'slow', name: 'the Bellinzona omnibus and the Lombard slow train', dep: { ZUR: ['05.20'], VEN: ['05.10'] }, days: '*', hours: 19, fare: { 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.7, maxDelay: 180, check: 'station' },

  // VIE-BUD. Brandl's line. The Orient-Express goes on three evenings a week; the Budapest express, the Győr mail and the Danube steamer go daily.
  { id: 'orient-vb', line: 'VIE-BUD', kind: 'express', name: 'the Orient-Express', dep: { VIE: ['19.55'], BUD: ['01.45'] }, days: '135', hours: 4, fare: { 1: 3 }, sleeper: true, records: ['berth', 'list'], punct: 0.82, maxDelay: 120, check: 'none' },
  { id: 'vie-bud-express', line: 'VIE-BUD', kind: 'express', name: 'the Budapest express', dep: { VIE: ['07.30', '13.55'], BUD: ['07.40', '14.10'] }, days: '*', hours: 4.25, fare: { 1: 2, 2: 1 }, sleeper: false, records: ['list'], punct: 0.82, maxDelay: 90, check: 'none' },
  { id: 'vie-bud-mail', line: 'VIE-BUD', kind: 'mail', name: 'the Győr mail', dep: { VIE: ['06.15', '11.40', '23.20'], BUD: ['06.30', '12.00', '23.05'] }, days: '*', hours: 5.5, fare: { 1: 2, 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.8, maxDelay: 120, check: 'none' },
  { id: 'danube-steamer', line: 'VIE-BUD', kind: 'steamer', name: 'the Danube steamer', dep: { VIE: ['07.00'], BUD: ['07.30'] }, days: '*', hours: 13, fare: { 1: 2, 2: 1 }, sleeper: false, records: ['list'], punct: 0.7, maxDelay: 240, check: 'none' },

  // VIE-TRI. The Südbahn over the Semmering to the sea.
  { id: 'sudbahn-express', line: 'VIE-TRI', kind: 'express', name: 'the Südbahn express', dep: { VIE: ['07.10'], TRI: ['07.40'] }, days: '*', hours: 11, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.8, maxDelay: 120, check: 'none' },
  { id: 'sudbahn-night', line: 'VIE-TRI', kind: 'night', name: 'the Trieste sleeping-car train', dep: { VIE: ['21.00'], TRI: ['20.15'] }, days: '*', hours: 12.5, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.8, maxDelay: 120, check: 'none' },
  { id: 'sudbahn-mail', line: 'VIE-TRI', kind: 'mail', name: 'the Laibach mail', dep: { VIE: ['08.20'], TRI: ['08.00'] }, days: '*', hours: 14.5, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.78, maxDelay: 150, check: 'none' },

  // VIE-VEN. By the Rudolfsbahn and the Pontebba pass into Italy.
  { id: 'pontebba-express', line: 'VIE-VEN', kind: 'express', name: 'the Pontebba express', dep: { VIE: ['08.50'], VEN: ['08.40'] }, days: '*', hours: 12, fare: { 1: 6, 2: 4 }, sleeper: false, records: ['list'], punct: 0.8, maxDelay: 120, check: 'onboard' },
  { id: 'pontebba-night', line: 'VIE-VEN', kind: 'night', name: 'the Venice sleeping-car express', dep: { VIE: ['20.20'], VEN: ['19.50'] }, days: '*', hours: 13, fare: { 1: 7, 2: 5 }, sleeper: true, records: ['berth'], punct: 0.78, maxDelay: 150, check: 'onboard' },
  { id: 'pontebba-mail', line: 'VIE-VEN', kind: 'mail', name: 'the Pontebba mail', dep: { VIE: ['07.25'], VEN: ['07.00'] }, days: '*', hours: 15.5, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.75, maxDelay: 180, check: 'station' },
  { id: 'pontebba-slow', line: 'VIE-VEN', kind: 'slow', name: 'the Villach and Udine slow trains', dep: { VIE: ['06.10'], VEN: ['05.50'] }, days: '*', hours: 20, fare: { 2: 3, 3: 1 }, sleeper: false, records: [], punct: 0.72, maxDelay: 180, check: 'station' },

  // BUD-BEG. Ilić's line, over the Sava bridge at Semlin. The Orient-Express three nights a week; otherwise a sleeping car,
  // the mail with Serbian police on the platform at Semlin, or the slow train that stops at every Banat village.
  { id: 'orient-bb', line: 'BUD-BEG', kind: 'express', name: 'the Orient-Express', dep: { BUD: ['00.20'], BEG: ['17.40'] }, days: '246', hours: 8.5, fare: { 1: 5 }, sleeper: true, records: ['berth', 'list'], punct: 0.7, maxDelay: 180, check: 'onboard' },
  { id: 'bud-beg-night', line: 'BUD-BEG', kind: 'night', name: 'the Belgrade sleeping car', dep: { BUD: ['22.10'], BEG: ['21.40'] }, days: '*', hours: 9.5, fare: { 1: 4, 2: 3 }, sleeper: true, records: ['berth'], punct: 0.65, maxDelay: 240, check: 'onboard' },
  { id: 'bud-beg-mail', line: 'BUD-BEG', kind: 'mail', name: 'the Szabadka mail', dep: { BUD: ['07.45', '13.40', '19.30'], BEG: ['07.10', '12.30', '20.15'] }, days: '*', hours: 11, fare: { 1: 3, 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.65, maxDelay: 240, check: 'station' },
  { id: 'bud-beg-slow', line: 'BUD-BEG', kind: 'slow', name: 'the Neusatz slow train', dep: { BUD: ['05.30'], BEG: ['05.45'] }, days: '*', hours: 14.5, fare: { 2: 1, 3: 1 }, sleeper: false, records: [], punct: 0.6, maxDelay: 300, check: 'station' },

  // BUD-BUC. Over the Carpathians at Predeal.
  { id: 'bud-buc-express', line: 'BUD-BUC', kind: 'express', name: 'the Predeal express', dep: { BUD: ['14.10'], BUC: ['13.40'] }, days: '*', hours: 20, fare: { 1: 9, 2: 6 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 240, check: 'onboard' },
  { id: 'bud-buc-mail', line: 'BUD-BUC', kind: 'mail', name: 'the Transylvanian mail', dep: { BUD: ['07.55'], BUC: ['07.30'] }, days: '*', hours: 26, fare: { 1: 7, 2: 5, 3: 3 }, sleeper: false, records: [], punct: 0.62, maxDelay: 300, check: 'station' },

  // BUD-SAR. To Brod, then the Bosnian narrow gauge through the gorges: no frontier, but every halt has a gendarme.
  // The express keeps a list and the sleeping car a berth book; the mail and the slow trains write nothing.
  { id: 'bud-sar-express', line: 'BUD-SAR', kind: 'express', name: 'the Bosnian express', dep: { BUD: ['08.15'], SAR: ['07.50'] }, days: '*', hours: 16, fare: { 1: 6, 2: 4 }, sleeper: false, records: ['list'], punct: 0.72, maxDelay: 180, check: 'none' },
  { id: 'bud-sar-mail', line: 'BUD-SAR', kind: 'mail', name: 'the Brod mail and the narrow gauge', dep: { BUD: ['06.50', '20.30'], SAR: ['09.10', '18.40'] }, days: '*', hours: 20, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.65, maxDelay: 240, check: 'none' },
  { id: 'bud-sar-night', line: 'BUD-SAR', kind: 'night', name: 'the Bosnian sleeping car', dep: { BUD: ['22.15'], SAR: ['20.05'] }, days: '*', hours: 17, fare: { 1: 7, 2: 5 }, sleeper: true, records: ['berth'], punct: 0.7, maxDelay: 180, check: 'none' },
  { id: 'bud-sar-slow', line: 'BUD-SAR', kind: 'slow', name: 'the Slavonian and Bosnian slow trains', dep: { BUD: ['05.40'], SAR: ['05.20'] }, days: '*', hours: 27, fare: { 2: 2, 3: 1 }, sleeper: false, records: [], punct: 0.6, maxDelay: 300, check: 'none' },

  // BEG-IST. The Balkan line, late half the time: three frontiers' worth of officials and two of them Bulgarian.
  { id: 'orient-bi', line: 'BEG-IST', kind: 'express', name: 'the Orient-Express', dep: { BEG: ['09.25'], IST: ['13.00'] }, days: '246', hours: 28, fare: { 1: 11 }, sleeper: true, records: ['berth', 'list'], punct: 0.6, maxDelay: 300, check: 'onboard' },
  { id: 'beg-ist-express', line: 'BEG-IST', kind: 'express', name: 'the Sofia express', dep: { BEG: ['14.50'], IST: ['15.40'] }, days: '*', hours: 31, fare: { 1: 10, 2: 7 }, sleeper: true, records: ['list', 'berth'], punct: 0.55, maxDelay: 360, check: 'onboard' },
  { id: 'beg-ist-mail', line: 'BEG-IST', kind: 'mail', name: 'the Constantinople mail by Sofia', dep: { BEG: ['21.10'], IST: ['20.30'] }, days: '*', hours: 38, fare: { 1: 9, 2: 6, 3: 3 }, sleeper: false, records: [], punct: 0.55, maxDelay: 360, check: 'station' },
  { id: 'beg-ist-slow', line: 'BEG-IST', kind: 'slow', name: 'the Niš and Philippopolis slow trains', dep: { BEG: ['06.40'], IST: ['07.10'] }, days: '*', hours: 52, fare: { 2: 4, 3: 2 }, sleeper: false, records: [], punct: 0.5, maxDelay: 420, check: 'station' },

  // BEG-SAR. Jovan's road: the Valjevo train and the Užice post coach to the Drina, then the Bosnian Eastern Railway; or Ilić's path by night.
  { id: 'drina-coach', line: 'BEG-SAR', kind: 'coach', name: 'the Užice post coach and the Višegrad train', dep: { BEG: ['06.00'], SAR: ['06.30'] }, days: '135', hours: 26, fare: { 2: 2, 3: 1 }, sleeper: false, records: ['list'], punct: 0.6, maxDelay: 360, check: 'station' },
  { id: 'ilic-path', line: 'BEG-SAR', kind: 'path', name: 'The Drina by night', dep: { BEG: ['20.00'], SAR: ['20.00'] }, days: '*', hours: 22, fare: { 3: 4 }, sleeper: false, records: [], punct: 0.6, maxDelay: 480, check: 'none', unlock: 'flag:ilic-path' },

  // BUC-IST. The boat train to Constanța and the Romanian State's fast steamers, or a coaster that calls at Varna and Burgas.
  { id: 'smr-constanta', line: 'BUC-IST', kind: 'steamer', name: 'the Constanța boat train and Romanian mail steamer', dep: { BUC: ['08.30'], IST: ['16.00'] }, days: '146', hours: 18, fare: { 1: 6, 2: 4, 3: 2 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 300, check: 'station' },
  { id: 'buc-ist-coaster', line: 'BUC-IST', kind: 'steamer', name: 'the Varna and Burgas coaster', dep: { BUC: ['07.00'], IST: ['09.00'] }, days: '3', hours: 32, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: ['list'], punct: 0.6, maxDelay: 600, check: 'station' },

  // BUC-ODE. Into Bessarabia at Ungheni, and the Russian gauge.
  { id: 'buc-ode-express', line: 'BUC-ODE', kind: 'express', name: 'the Jassy express', dep: { BUC: ['18.40'], ODE: ['19.10'] }, days: '*', hours: 22, fare: { 1: 8, 2: 5 }, sleeper: true, records: ['list', 'berth'], punct: 0.6, maxDelay: 300, check: 'onboard' },
  { id: 'buc-ode-mail', line: 'BUC-ODE', kind: 'mail', name: 'the Ungheni mail', dep: { BUC: ['07.30'], ODE: ['08.00'] }, days: '*', hours: 28, fare: { 1: 6, 2: 4, 3: 2 }, sleeper: false, records: [], punct: 0.55, maxDelay: 360, check: 'station' },

  // ODE-IST. Twice a week the Russian mail steamer; on Sundays a pilgrim boat bound for Jaffa, slow and crowded.
  { id: 'ropit-mail', line: 'ODE-IST', kind: 'steamer', name: 'the Russian Company\'s mail steamer', dep: { ODE: ['16.00'], IST: ['16.00'] }, days: '25', hours: 30, fare: { 1: 6, 2: 4, 3: 2 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 480, check: 'station' },
  { id: 'ode-ist-pilgrim', line: 'ODE-IST', kind: 'steamer', name: 'a pilgrim steamer for Jaffa', dep: { ODE: ['12.00'], IST: ['10.00'] }, days: '0', hours: 44, fare: { 2: 3, 3: 1 }, sleeper: false, records: ['list'], punct: 0.55, maxDelay: 720, check: 'station' },

  // IST-ATH. Out by the Dardanelles: the French mail boat on Wednesdays, or a Greek steamer that calls at every island.
  { id: 'mm-levant-ia', line: 'IST-ATH', kind: 'steamer', name: 'the Messageries Maritimes Levant boat', dep: { IST: ['10.00'], ATH: ['16.00'] }, days: '3', hours: 38, fare: { 1: 7, 2: 5, 3: 2 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 480, check: 'station' },
  { id: 'ist-ath-greek', line: 'IST-ATH', kind: 'steamer', name: 'a Greek island steamer', dep: { IST: ['17.00'], ATH: ['12.00'] }, days: '15', hours: 52, fare: { 1: 5, 2: 3, 3: 1 }, sleeper: false, records: ['list'], punct: 0.6, maxDelay: 720, check: 'station' },

  // TRI-VEN. The Austrian Lloyd crosses daily by day and by night; the Italian customs meet both at the Riva.
  { id: 'lloyd-venice-day', line: 'TRI-VEN', kind: 'steamer', name: 'the Lloyd day steamer', dep: { TRI: ['08.00'], VEN: ['08.30'] }, days: '*', hours: 5.5, fare: { 1: 2, 2: 1, 3: 1 }, sleeper: false, records: ['list'], punct: 0.8, maxDelay: 120, check: 'station' },
  { id: 'lloyd-venice-night', line: 'TRI-VEN', kind: 'steamer', name: 'the Lloyd night boat', dep: { TRI: ['23.00'], VEN: ['23.30'] }, days: '*', hours: 7, fare: { 1: 2, 2: 1 }, sleeper: true, records: ['list', 'berth'], punct: 0.8, maxDelay: 120, check: 'onboard' },

  // TRI-ATH. The Lloyd's Levant express sails on Fridays; the Dalmatian coaster on Tuesdays, calling everywhere.
  { id: 'lloyd-levant', line: 'TRI-ATH', kind: 'steamer', name: 'the Austrian Lloyd\'s Levant express', dep: { TRI: ['13.00'], ATH: ['11.00'] }, days: '5', hours: 76, fare: { 1: 10, 2: 7, 3: 3 }, sleeper: true, records: ['list', 'berth'], punct: 0.75, maxDelay: 480, check: 'station' },
  { id: 'lloyd-dalmatian', line: 'TRI-ATH', kind: 'steamer', name: 'the Lloyd\'s Dalmatian and Corfu coaster', dep: { TRI: ['09.00'], ATH: ['08.00'] }, days: '2', hours: 112, fare: { 2: 5, 3: 2 }, sleeper: false, records: ['list'], punct: 0.6, maxDelay: 900, check: 'station' },

  // VEN-ROM. Over the Apennines by Bologna and Florence.
  { id: 'ven-rom-express', line: 'VEN-ROM', kind: 'express', name: 'the Florence direttissimo', dep: { VEN: ['08.40'], ROM: ['08.15'] }, days: '*', hours: 11, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.72, maxDelay: 150, check: 'none' },
  { id: 'ven-rom-night', line: 'VEN-ROM', kind: 'night', name: 'the Rome sleeping-car train', dep: { VEN: ['21.25'], ROM: ['20.50'] }, days: '*', hours: 12, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.72, maxDelay: 150, check: 'none' },
  { id: 'ven-rom-mail', line: 'VEN-ROM', kind: 'mail', name: 'the Apennine mail', dep: { VEN: ['06.50', '13.30'], ROM: ['06.30', '13.10'] }, days: '*', hours: 14.5, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.65, maxDelay: 180, check: 'none' },

  // ROM-MAR. Morel's line along the Riviera, into France at Ventimiglia.
  { id: 'rom-mar-express', line: 'ROM-MAR', kind: 'express', name: 'the Riviera express', dep: { ROM: ['19.20'], MAR: ['18.40'] }, days: '*', hours: 21, fare: { 1: 9, 2: 6 }, sleeper: true, records: ['list', 'berth'], punct: 0.72, maxDelay: 150, check: 'onboard' },
  { id: 'rom-mar-mail', line: 'ROM-MAR', kind: 'mail', name: 'the Genoa and Ventimiglia mail', dep: { ROM: ['08.05'], MAR: ['07.45'] }, days: '*', hours: 27, fare: { 1: 8, 2: 5, 3: 3 }, sleeper: false, records: [], punct: 0.65, maxDelay: 180, check: 'station' },

  // ROM-ATH. By Brindisi and the Patras boat: a sleeping-car express on the steamer days, or the mail on the others.
  { id: 'brindisi-express', line: 'ROM-ATH', kind: 'express', name: 'the Brindisi express and the Greek mail boat', dep: { ROM: ['21.10'], ATH: ['18.30'] }, days: '246', hours: 40, fare: { 1: 11, 2: 7 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 300, check: 'onboard' },
  { id: 'brindisi-mail', line: 'ROM-ATH', kind: 'mail', name: 'the Brindisi mail and the Patras boat', dep: { ROM: ['09.30'], ATH: ['07.00'] }, days: '135', hours: 46, fare: { 1: 9, 2: 6, 3: 3 }, sleeper: false, records: ['list'], punct: 0.65, maxDelay: 360, check: 'station' },

  // MAR-BAR. To Port-Bou and the change of gauge.
  { id: 'mar-bar-express', line: 'MAR-BAR', kind: 'express', name: 'the Port-Bou express', dep: { MAR: ['07.25'], BAR: ['08.10'] }, days: '*', hours: 12, fare: { 1: 5, 2: 3 }, sleeper: false, records: ['list'], punct: 0.78, maxDelay: 120, check: 'onboard' },
  { id: 'mar-bar-mail', line: 'MAR-BAR', kind: 'mail', name: 'the Narbonne and Perpignan mail', dep: { MAR: ['20.15'], BAR: ['19.35'] }, days: '*', hours: 15.5, fare: { 1: 4, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.7, maxDelay: 180, check: 'station' },

  // BAR-MAD. Across Aragon by Saragossa.
  { id: 'bar-mad-night', line: 'BAR-MAD', kind: 'night', name: 'the Madrid sleeping-car express', dep: { BAR: ['19.05'], MAD: ['18.30'] }, days: '*', hours: 15, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['berth'], punct: 0.6, maxDelay: 240, check: 'none' },
  { id: 'bar-mad-mail', line: 'BAR-MAD', kind: 'mail', name: 'the Saragossa mail', dep: { BAR: ['08.15'], MAD: ['07.50'] }, days: '*', hours: 18, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.55, maxDelay: 300, check: 'none' },

  // MAD-LIS. By Cáceres and Valencia de Alcántara.
  { id: 'mad-lis-express', line: 'MAD-LIS', kind: 'express', name: 'the Lisbon express by Cáceres', dep: { MAD: ['20.10'], LIS: ['19.30'] }, days: '*', hours: 15, fare: { 1: 6, 2: 4 }, sleeper: true, records: ['list', 'berth'], punct: 0.6, maxDelay: 240, check: 'onboard' },
  { id: 'mad-lis-mail', line: 'MAD-LIS', kind: 'mail', name: 'the Valencia de Alcántara mail', dep: { MAD: ['08.30'], LIS: ['08.00'] }, days: '*', hours: 19, fare: { 1: 5, 2: 3, 3: 2 }, sleeper: false, records: [], punct: 0.55, maxDelay: 300, check: 'station' },

  // MAR-IST. Four and a half days by sea: the Messageries' mail boat on Thursdays, a Fraissinet coaster on Mondays.
  { id: 'mm-levant', line: 'MAR-IST', kind: 'steamer', name: 'the Messageries Maritimes Levant mail', dep: { MAR: ['16.00'], IST: ['10.00'] }, days: '4', hours: 110, fare: { 1: 13, 2: 9, 3: 4 }, sleeper: true, records: ['list', 'berth'], punct: 0.7, maxDelay: 600, check: 'station' },
  { id: 'fraissinet-levant', line: 'MAR-IST', kind: 'steamer', name: 'a Fraissinet coaster', dep: { MAR: ['18.00'], IST: ['14.00'] }, days: '1', hours: 118, fare: { 2: 7, 3: 3 }, sleeper: false, records: ['list'], punct: 0.6, maxDelay: 900, check: 'station' },
];
