// Nations (owner: World). See docs/CONTRACTS.md §2.
// papers: chance a frontier control asks for papers · search: chance of a customs search of your case
// lagH: hours before a record made here reaches the enemy (the German and Austrian services) · bribe: 0..1
// In 1914 most of western Europe let a gentleman in on his word and his luggage; Russia, the Porte and the
// Balkan kingdoms wanted a passport with a consul's visa. The calendar raises the states; these are the baselines.

export default [
  // Britain asked nothing of cabin passengers in peace; the Aliens Restriction Act came only with the war. German agents here wrote by post.
  { id: 'GB', name: 'the United Kingdom', bloc: 'entente', papers: { peace: 0.03, tension: 0.12, war: 0.9 }, search: { peace: 0.04, tension: 0.1, war: 0.45 }, lagH: { peace: 60, tension: 44, war: 36 }, bribe: 0.05 },
  // France wanted no passport, only the octroi and tobacco duty; the Sûreté watched Germans, and Berlin's informers here were few and slow.
  { id: 'FR', name: 'France', bloc: 'entente', papers: { peace: 0.06, tension: 0.25, war: 1 }, search: { peace: 0.08, tension: 0.2, war: 0.6 }, lagH: { peace: 44, tension: 32, war: 24 }, bribe: 0.15 },
  // No passport at the frontier, but every hotel filled in the police form, and IIIb read them within the day.
  { id: 'DE', name: 'Germany', bloc: 'central', papers: { peace: 0.12, tension: 0.45, war: 1 }, search: { peace: 0.08, tension: 0.3, war: 0.75 }, lagH: { peace: 10, tension: 6, war: 2 }, bribe: 0.06 },
  // The Meldezettel at every hotel and a gendarmerie in every Bosnian village; Galician and Bosnian posts could be squared.
  { id: 'AH', name: 'Austria-Hungary', bloc: 'central', papers: { peace: 0.18, tension: 0.5, war: 1 }, search: { peace: 0.1, tension: 0.35, war: 0.75 }, lagH: { peace: 12, tension: 6, war: 2 }, bribe: 0.25 },
  // Passport and consular visa demanded even in peace; the Okhrana read everything, but shared nothing with Vienna.
  { id: 'RU', name: 'Russia', bloc: 'entente', papers: { peace: 0.9, tension: 0.95, war: 1 }, search: { peace: 0.3, tension: 0.45, war: 0.8 }, lagH: { peace: 48, tension: 36, war: 30 }, bribe: 0.6 },
  // A Triple Alliance partner with no love for Austria: no passports, tobacco and salt searched, the questura polite and leisurely.
  { id: 'IT', name: 'Italy', bloc: 'central', papers: { peace: 0.06, tension: 0.2, war: 0.7 }, search: { peace: 0.12, tension: 0.25, war: 0.5 }, lagH: { peace: 30, tension: 22, war: 18 }, bribe: 0.3 },
  // No papers in peace; the cantonal police kept registers and some lent them to German colleagues. Mobilised at the frontier from 1 August.
  { id: 'CH', name: 'Switzerland', bloc: 'neutral', papers: { peace: 0.03, tension: 0.15, war: 0.6 }, search: { peace: 0.05, tension: 0.15, war: 0.4 }, lagH: { peace: 30, tension: 22, war: 14 }, bribe: 0.05 },
  // The Dutch hardly looked up from the luggage; German consuls in Amsterdam and Rotterdam heard things all the same.
  { id: 'NL', name: 'the Netherlands', bloc: 'neutral', papers: { peace: 0.03, tension: 0.12, war: 0.5 }, search: { peace: 0.06, tension: 0.15, war: 0.4 }, lagH: { peace: 36, tension: 26, war: 16 }, bribe: 0.08 },
  // Guaranteed neutral and careless of strangers until the Germans came; customs at Quévy and Herbesthal looked for lace and tobacco.
  { id: 'BE', name: 'Belgium', bloc: 'neutral', papers: { peace: 0.04, tension: 0.15, war: 0.9 }, search: { peace: 0.08, tension: 0.2, war: 0.6 }, lagH: { peace: 30, tension: 20, war: 10 }, bribe: 0.12 },
  // Copenhagen asked nothing and noticed everything; a German legation listened, but letters went slowly south.
  { id: 'DK', name: 'Denmark', bloc: 'neutral', papers: { peace: 0.03, tension: 0.1, war: 0.45 }, search: { peace: 0.05, tension: 0.12, war: 0.35 }, lagH: { peace: 40, tension: 30, war: 18 }, bribe: 0.05 },
  // Sweden wanted no passport; its officers admired Germany, but the post to Berlin took two days.
  { id: 'SE', name: 'Sweden', bloc: 'neutral', papers: { peace: 0.03, tension: 0.1, war: 0.4 }, search: { peace: 0.05, tension: 0.12, war: 0.3 }, lagH: { peace: 44, tension: 34, war: 20 }, bribe: 0.05 },
  // No passport needed, but Spanish customs were the slowest in Europe and its carabineros could be talked round.
  { id: 'ES', name: 'Spain', bloc: 'neutral', papers: { peace: 0.1, tension: 0.2, war: 0.45 }, search: { peace: 0.2, tension: 0.28, war: 0.4 }, lagH: { peace: 72, tension: 56, war: 40 }, bribe: 0.5 },
  // A young republic nervous of royalist plots: papers looked at more often than in Spain; the old ally's subjects waved through.
  { id: 'PT', name: 'Portugal', bloc: 'neutral', papers: { peace: 0.15, tension: 0.25, war: 0.45 }, search: { peace: 0.15, tension: 0.22, war: 0.35 }, lagH: { peace: 84, tension: 66, war: 48 }, bribe: 0.45 },
  // A passport and visa required, the police fresh from two Balkan wars; Austrian informers thick in Belgrade until the war cut the wires.
  { id: 'RS', name: 'Serbia', bloc: 'entente', papers: { peace: 0.6, tension: 0.85, war: 1 }, search: { peace: 0.2, tension: 0.4, war: 0.8 }, lagH: { peace: 24, tension: 18, war: 30 }, bribe: 0.5 },
  // Secretly bound to Vienna since 1883 and in no hurry to honour it; passports wanted, and the frontier police took tips.
  { id: 'RO', name: 'Romania', bloc: 'neutral', papers: { peace: 0.55, tension: 0.7, war: 0.9 }, search: { peace: 0.2, tension: 0.3, war: 0.5 }, lagH: { peace: 30, tension: 24, war: 18 }, bribe: 0.6 },
  // Victorious in two Balkan wars, watchful at Piraeus; the Queen was the Kaiser's sister, the Prime Minister a friend of England.
  { id: 'GR', name: 'Greece', bloc: 'neutral', papers: { peace: 0.35, tension: 0.55, war: 0.85 }, search: { peace: 0.18, tension: 0.3, war: 0.5 }, lagH: { peace: 60, tension: 44, war: 30 }, bribe: 0.5 },
  // Passport and visa for every Frank; customs read your books; and Liman von Sanders' Germans sat in every ministry.
  { id: 'OT', name: 'the Ottoman Empire', bloc: 'neutral', papers: { peace: 0.95, tension: 1, war: 1 }, search: { peace: 0.35, tension: 0.5, war: 0.75 }, lagH: { peace: 30, tension: 20, war: 10 }, bribe: 0.75 },
  // Beaten in 1913, sore and leaning to Berlin; passports demanded at Tsaribrod and Mustafa Pasha.
  { id: 'BG', name: 'Bulgaria', bloc: 'neutral', papers: { peace: 0.6, tension: 0.8, war: 0.95 }, search: { peace: 0.2, tension: 0.35, war: 0.55 }, lagH: { peace: 30, tension: 20, war: 12 }, bribe: 0.5 },
  // Perpetually neutral since 1867, with German railwaymen running its lines; occupied in a morning on 2 August.
  { id: 'LU', name: 'Luxembourg', bloc: 'neutral', papers: { peace: 0.02, tension: 0.1, war: 1 }, search: { peace: 0.04, tension: 0.12, war: 0.7 }, lagH: { peace: 20, tension: 12, war: 3 }, bribe: 0.1 },
  // An ocean away: American papers were respected everywhere and checked nowhere, and nothing written there reached Berlin in time.
  { id: 'US', name: 'the United States', bloc: 'neutral', papers: { peace: 0.02, tension: 0.05, war: 0.2 }, search: { peace: 0.05, tension: 0.08, war: 0.2 }, lagH: { peace: 150, tension: 120, war: 96 }, bribe: 0.2 },
];
