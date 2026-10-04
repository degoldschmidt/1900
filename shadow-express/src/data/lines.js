// Lines with waypoints and frontier stations (owner: World). See docs/CONTRACTS.md §2 and REGISTRY §4.
// via: the 1914 route through its main junctions, a→b, as [lon, lat]. Sea legs go round the coasts.
// frontiers: in a→b order. A station shared by several lines keeps one id and name (AVR, SBG, CON, PIR).

export default [
  // Charing Cross – Tonbridge – Dover; the packet to Calais; the Nord by Boulogne and Amiens.
  { id: 'LON-PAR', a: 'LON', b: 'PAR', mode: 'ferry',
    via: [[0.27, 51.195], [0.873, 51.146], [1.31, 51.125], [1.851, 50.965], [1.61, 50.72], [1.83, 50.105], [2.3, 49.89], [2.47, 49.26]],
    frontiers: [
      { id: 'CAL', name: 'Calais Maritime', ll: [1.851, 50.965], from: 'GB', into: 'FR' }
    ] },
  // Dover and the Belgian State packet to Ostend; Bruges and Ghent to Brussels.
  { id: 'LON-BRU', a: 'LON', b: 'BRU', mode: 'ferry',
    via: [[0.27, 51.195], [0.873, 51.146], [1.31, 51.125], [2.925, 51.232], [3.22, 51.21], [3.71, 51.05]],
    frontiers: [
      { id: 'OST', name: 'Ostend quay', ll: [2.925, 51.232], from: 'GB', into: 'BE' }
    ] },
  // Liverpool Street – Colchester – Parkeston Quay; the Great Eastern night boat to the Hook; by The Hague and Haarlem.
  { id: 'LON-AMS', a: 'LON', b: 'AMS', mode: 'sea',
    via: [[0.9, 51.89], [1.25, 51.945], [2.7, 52], [4.125, 51.978], [4.3, 52.08], [4.49, 52.16], [4.64, 52.39]],
    frontiers: [
      { id: 'HOO', name: 'Hook of Holland', ll: [4.125, 51.978], from: 'GB', into: 'NL' }
    ] },
  // Victoria – Ashford – Folkestone Harbour; the Zeeland Line's boats to Flushing.
  { id: 'LON-FLU', a: 'LON', b: 'FLU', mode: 'ferry',
    via: [[0.27, 51.195], [0.873, 51.146], [1.19, 51.08], [2.3, 51.3]],
    frontiers: [
      { id: 'VLI', name: 'Flushing quay', ll: [3.588, 51.442], from: 'GB', into: 'NL' }
    ] },
  // Down the Thames, across the North Sea outside the Frisian Islands, into the Elbe at Cuxhaven.
  { id: 'LON-HAM', a: 'LON', b: 'HAM', mode: 'sea',
    via: [[0.45, 51.46], [1.5, 51.55], [3.3, 52.6], [5, 53.62], [7, 53.88], [8.15, 54], [8.7, 53.87], [9.14, 53.89], [9.45, 53.7]],
    frontiers: [
      { id: 'CUX', name: 'Cuxhaven', ll: [8.7, 53.87], from: 'GB', into: 'DE' }
    ] },
  // The boat train to Southampton, down Channel, round Ushant and Finisterre to the Tagus.
  { id: 'LON-LIS', a: 'LON', b: 'LIS', mode: 'sea',
    via: [[-1.09, 51.27], [-1.4, 50.9], [-1.65, 50.62], [-3.6, 50], [-5.3, 49.85], [-5.7, 48.4], [-9.6, 43], [-9.7, 41], [-9.6, 39.4], [-9.45, 38.68]],
    frontiers: [
      { id: 'LXQ', name: 'Lisbon quay', ll: [-9.15, 38.705], from: 'GB', into: 'PT' }
    ] },
  // The Nord main line: Creil, Saint-Quentin, Aulnoye, Maubeuge; the Belgian State from Quévy by Mons.
  { id: 'PAR-BRU', a: 'PAR', b: 'BRU', mode: 'rail',
    via: [[2.47, 49.26], [2.82, 49.42], [3.29, 49.85], [3.83, 50.2], [3.97, 50.28], [3.94, 50.355], [3.95, 50.45]],
    frontiers: [
      { id: 'QUE', name: 'Quévy', ll: [3.94, 50.355], from: 'FR', into: 'BE' }
    ] },
  // The PLM: Laroche, Dijon, Lyon, the Rhône valley, Avignon, Arles.
  { id: 'PAR-MAR', a: 'PAR', b: 'MAR', mode: 'rail',
    via: [[2.66, 48.54], [3.52, 47.96], [5.04, 47.32], [4.83, 46.31], [4.83, 45.76], [4.89, 44.93], [4.81, 43.95], [4.63, 43.68], [5, 43.58]],
    frontiers: [] },
  // The Est to Belfort; Delle, Porrentruy and Delémont keep French trains off German rails; Basel and Baden to Zurich.
  { id: 'PAR-ZUR', a: 'PAR', b: 'ZUR', mode: 'rail',
    via: [[4.08, 48.3], [5.14, 48.11], [6.15, 47.62], [6.86, 47.64], [7, 47.508], [7.07, 47.42], [7.34, 47.36], [7.59, 47.55], [8.21, 47.48], [8.31, 47.47]],
    frontiers: [
      { id: 'DLL', name: 'Delle', ll: [7, 47.508], from: 'FR', into: 'CH' }
    ] },
  // The Orient Express road as far as Munich: Châlons, Nancy, Avricourt, Strasbourg, Karlsruhe, Stuttgart, Ulm, Augsburg.
  { id: 'PAR-MUN', a: 'PAR', b: 'MUN', mode: 'rail',
    via: [[4.36, 48.96], [6.18, 48.69], [6.81, 48.65], [7.75, 48.58], [8.4, 49.01], [9.18, 48.78], [9.99, 48.4], [10.9, 48.37]],
    frontiers: [
      { id: 'AVR', name: 'Deutsch-Avricourt', ll: [6.81, 48.65], from: 'FR', into: 'DE' }
    ] },
  // The Orient Express road: on from Munich by Rosenheim, Salzburg, Linz and St Pölten.
  { id: 'PAR-VIE', a: 'PAR', b: 'VIE', mode: 'rail',
    via: [[4.36, 48.96], [6.18, 48.69], [6.81, 48.65], [7.75, 48.58], [9.18, 48.78], [9.99, 48.4], [11.576, 48.137], [12.12, 47.86], [13.046, 47.813], [14.29, 48.31], [15.63, 48.2]],
    frontiers: [
      { id: 'AVR', name: 'Deutsch-Avricourt', ll: [6.81, 48.65], from: 'FR', into: 'DE' },
      { id: 'SBG', name: 'Salzburg', ll: [13.046, 47.813], from: 'DE', into: 'AH' }
    ] },
  // The Orléans and Midi to Bayonne and Irún; the Norte by Vitoria, Burgos, Valladolid and Ávila.
  { id: 'PAR-MAD', a: 'PAR', b: 'MAD', mode: 'rail',
    via: [[1.9, 47.9], [0.69, 47.39], [0.34, 46.58], [0.16, 45.65], [-0.56, 44.84], [-1.47, 43.49], [-1.79, 43.34], [-2.67, 42.85], [-3.7, 42.34], [-4.72, 41.65], [-4.7, 40.66], [-4.13, 40.58]],
    frontiers: [
      { id: 'IRU', name: 'Irún', ll: [-1.79, 43.34], from: 'FR', into: 'ES' }
    ] },
  // Mechelen and Antwerp; Roosendaal; the Moerdijk bridge to Dordrecht and the Holland line.
  { id: 'BRU-AMS', a: 'BRU', b: 'AMS', mode: 'rail',
    via: [[4.48, 51.03], [4.42, 51.22], [4.46, 51.53], [4.67, 51.81], [4.47, 51.92], [4.3, 52.08], [4.49, 52.16], [4.64, 52.39]],
    frontiers: [
      { id: 'RSD', name: 'Roosendaal', ll: [4.46, 51.53], from: 'BE', into: 'NL' }
    ] },
  // Louvain and Liège; Herbesthal, the German customs; Aachen and Düren.
  { id: 'BRU-COL', a: 'BRU', b: 'COL', mode: 'rail',
    via: [[4.7, 50.88], [4.94, 50.81], [5.57, 50.62], [5.86, 50.59], [6.02, 50.66], [6.09, 50.77], [6.48, 50.8]],
    frontiers: [
      { id: 'HER', name: 'Herbesthal', ll: [6.02, 50.66], from: 'BE', into: 'DE' }
    ] },
  // Utrecht, Arnhem, Zevenaar; Emmerich; down the Rhine by Wesel, Oberhausen and Düsseldorf.
  { id: 'AMS-COL', a: 'AMS', b: 'COL', mode: 'rail',
    via: [[5.11, 52.09], [5.9, 51.98], [6.07, 51.93], [6.25, 51.83], [6.62, 51.66], [6.85, 51.47], [6.79, 51.22]],
    frontiers: [
      { id: 'EMM', name: 'Emmerich', ll: [6.25, 51.83], from: 'NL', into: 'DE' }
    ] },
  // Amersfoort, Deventer, Hengelo, Oldenzaal; Bentheim; Rheine, Osnabrück, Bremen.
  { id: 'AMS-HAM', a: 'AMS', b: 'HAM', mode: 'rail',
    via: [[5.39, 52.15], [6.16, 52.26], [6.79, 52.26], [6.93, 52.31], [7.16, 52.3], [7.44, 52.28], [8.05, 52.27], [8.81, 53.08]],
    frontiers: [
      { id: 'BEN', name: 'Bentheim', ll: [7.16, 52.3], from: 'NL', into: 'DE' }
    ] },
  // The boat train: Middelburg, Goes, Bergen op Zoom, Roosendaal, then the Holland line.
  { id: 'FLU-AMS', a: 'FLU', b: 'AMS', mode: 'rail',
    via: [[3.61, 51.5], [3.89, 51.5], [4.29, 51.49], [4.46, 51.53], [4.67, 51.81], [4.47, 51.92], [4.3, 52.08], [4.49, 52.16], [4.64, 52.39]],
    frontiers: [] },
  // Düsseldorf and the Ruhr, Hamm, Minden, Hanover, Stendal, Spandau.
  { id: 'COL-BER', a: 'COL', b: 'BER', mode: 'rail',
    via: [[6.79, 51.22], [7.01, 51.45], [7.47, 51.51], [7.81, 51.68], [8.53, 52.02], [8.92, 52.29], [9.74, 52.38], [11.86, 52.6], [13.2, 52.53]],
    frontiers: [] },
  // Up the Rhine: Bonn, Koblenz, Mainz, Mannheim, Karlsruhe, Offenburg, Freiburg; Basel; Brugg and Baden.
  { id: 'COL-ZUR', a: 'COL', b: 'ZUR', mode: 'rail',
    via: [[7.1, 50.73], [7.59, 50.36], [8.27, 50], [8.47, 49.48], [8.4, 49.01], [7.94, 48.47], [7.84, 47.99], [7.607, 47.567], [8.21, 47.48], [8.31, 47.47]],
    frontiers: [
      { id: 'BAS', name: 'Basel Baden station', ll: [7.607, 47.567], from: 'DE', into: 'CH' }
    ] },
  // The Hamburg–Berlin line: Büchen, Ludwigslust, Wittenberge, Spandau.
  { id: 'HAM-BER', a: 'HAM', b: 'BER', mode: 'rail',
    via: [[10.65, 53.48], [11.5, 53.33], [11.75, 53], [13.2, 52.53]],
    frontiers: [] },
  // Neumünster and Kiel; the night steamer up the Great Belt to Korsør; Zealand by Ringsted and Roskilde.
  { id: 'HAM-CPH', a: 'HAM', b: 'CPH', mode: 'ferry',
    via: [[9.98, 54.07], [10.13, 54.32], [10.25, 54.48], [10.85, 54.62], [11.05, 54.85], [11, 55.1], [11.14, 55.33], [11.35, 55.4], [11.79, 55.44], [12.08, 55.64]],
    frontiers: [
      { id: 'KOR', name: 'Korsør', ll: [11.14, 55.33], from: 'DE', into: 'DK' }
    ] },
  // Neustrelitz and Rostock to Warnemünde; the train ferry to Gedser; Falster and Zealand.
  { id: 'BER-CPH', a: 'BER', b: 'CPH', mode: 'ferry',
    via: [[13.07, 53.36], [12.1, 54.09], [12.08, 54.18], [11.93, 54.575], [11.87, 54.77], [11.91, 55.01], [11.76, 55.23], [12.18, 55.46]],
    frontiers: [
      { id: 'GED', name: 'Gedser', ll: [11.93, 54.575], from: 'DE', into: 'DK' }
    ] },
  // The Sound steamer to Malmö; the Swedish State main line by Hässleholm, Nässjö and Katrineholm.
  { id: 'CPH-STO', a: 'CPH', b: 'STO', mode: 'ferry',
    via: [[12.75, 55.65], [13, 55.61], [13.19, 55.7], [13.77, 56.16], [14.55, 56.9], [14.7, 57.65], [15.13, 58.32], [16.21, 59], [17.62, 59.2]],
    frontiers: [
      { id: 'MAL', name: 'Malmö', ll: [13, 55.61], from: 'DK', into: 'SE' }
    ] },
  // Through the skerries and the Åland Sea to Åbo; the Finnish State railways by Toijala, Riihimäki and Viborg.
  { id: 'STO-SPB', a: 'STO', b: 'SPB', mode: 'sea',
    via: [[18.6, 59.45], [19.3, 59.85], [19.93, 60.07], [21, 60.25], [22.27, 60.45], [23.87, 61.17], [24.77, 60.74], [26.7, 60.87], [28.75, 60.71], [29.7, 60.17]],
    frontiers: [
      { id: 'ABO', name: 'Åbo', ll: [22.27, 60.45], from: 'SE', into: 'RU' }
    ] },
  // Frankfurt on the Oder, Posen, Gnesen, Inowrazlaw, Thorn; Alexandrowo and the Russian gauge; Włocławek, Kutno, Łowicz.
  { id: 'BER-WAR', a: 'BER', b: 'WAR', mode: 'rail',
    via: [[14.55, 52.34], [16.93, 52.41], [17.6, 52.54], [18.26, 52.8], [18.6, 53.01], [18.7, 52.88], [19.07, 52.65], [19.36, 52.23], [19.94, 52.11]],
    frontiers: [
      { id: 'ALX', name: 'Alexandrowo', ll: [18.7, 52.88], from: 'DE', into: 'RU' }
    ] },
  // The Ostbahn: Küstrin, Schneidemühl, Dirschau, Königsberg, Insterburg; Eydtkuhnen and Wirballen; Kovno, Vilna, Dvinsk, Pskov, Luga.
  { id: 'BER-SPB', a: 'BER', b: 'SPB', mode: 'rail',
    via: [[14.64, 52.58], [16.74, 53.15], [18.78, 54.09], [20.51, 54.71], [21.8, 54.63], [22.73, 54.63], [23.9, 54.9], [25.28, 54.68], [26.53, 55.88], [28.33, 57.82], [29.85, 58.74], [30.11, 59.57]],
    frontiers: [
      { id: 'EYD', name: 'Eydtkuhnen', ll: [22.73, 54.63], from: 'DE', into: 'RU' }
    ] },
  // The Anhalt line to Dresden; up the Elbe gorge by Bad Schandau to Bodenbach; Aussig, Lobositz, Kralup.
  { id: 'BER-PRG', a: 'BER', b: 'PRG', mode: 'rail',
    via: [[13.45, 52.22], [13.52, 51.46], [13.73, 51.05], [13.94, 50.96], [14.15, 50.92], [14.21, 50.77], [14.04, 50.66], [14.05, 50.52], [14.31, 50.24]],
    frontiers: [
      { id: 'BOD', name: 'Bodenbach', ll: [14.21, 50.77], from: 'DE', into: 'AH' }
    ] },
  // Wittenberg, Halle, Naumburg, Saalfeld, the Frankenwald, Bamberg, Nuremberg, Ingolstadt.
  { id: 'BER-MUN', a: 'BER', b: 'MUN', mode: 'rail',
    via: [[12.65, 51.87], [11.97, 51.48], [11.81, 51.15], [11.36, 50.65], [11.38, 50.53], [11.06, 50.15], [10.89, 49.89], [11.08, 49.45], [11.43, 48.76]],
    frontiers: [] },
  // The St Petersburg–Warsaw Railway: Białystok, Grodno, Vilna, Dvinsk, Pskov, Luga, Gatchina.
  { id: 'WAR-SPB', a: 'WAR', b: 'SPB', mode: 'rail',
    via: [[23.16, 53.13], [23.83, 53.68], [25.28, 54.68], [26.53, 55.88], [27.33, 56.51], [28.33, 57.82], [29.85, 58.74], [30.11, 59.57]],
    frontiers: [] },
  // The Warsaw–Vienna Railway: Skierniewice, Piotrków, Częstochowa; Granica; the Nordbahn by Oderberg, Prerau and Lundenburg.
  { id: 'WAR-VIE', a: 'WAR', b: 'VIE', mode: 'rail',
    via: [[20.15, 51.96], [19.7, 51.4], [19.12, 50.81], [19.27, 50.26], [19.22, 50.04], [18.95, 49.94], [18.27, 49.89], [17.45, 49.46], [16.88, 48.76], [16.72, 48.34]],
    frontiers: [
      { id: 'GRA', name: 'Granica', ll: [19.27, 50.26], from: 'RU', into: 'AH' }
    ] },
  // The Vistula and South-Western railways: Ivangorod, Lublin, Kovel, Rovno, Kazatin, Zhmerinka, Birzula.
  { id: 'WAR-ODE', a: 'WAR', b: 'ODE', mode: 'rail',
    via: [[21.84, 51.56], [22.57, 51.25], [23.47, 51.13], [24.72, 51.21], [26.25, 50.62], [27.06, 50.18], [28.84, 49.72], [28.11, 49.04], [29.56, 47.75], [30.08, 46.85]],
    frontiers: [] },
  // The State Railway: Kolín, Pardubitz, Böhmisch Trübau, Brünn, Lundenburg.
  { id: 'PRG-VIE', a: 'PRG', b: 'VIE', mode: 'rail',
    via: [[15.2, 50.03], [15.78, 50.04], [16.45, 49.9], [16.61, 49.19], [16.88, 48.76], [16.72, 48.34]],
    frontiers: [] },
  // Rosenheim and Freilassing; Salzburg; the Westbahn by Attnang, Wels, Linz, Amstetten and St Pölten.
  { id: 'MUN-VIE', a: 'MUN', b: 'VIE', mode: 'rail',
    via: [[12.12, 47.86], [12.64, 47.87], [12.98, 47.84], [13.046, 47.813], [13.72, 48.01], [14.03, 48.16], [14.29, 48.31], [14.87, 48.12], [15.63, 48.2]],
    frontiers: [
      { id: 'SBG', name: 'Salzburg', ll: [13.046, 47.813], from: 'DE', into: 'AH' }
    ] },
  // The Allgäu line by Buchloe and Kempten to Lindau; the lake steamer to Romanshorn; Winterthur.
  { id: 'MUN-ZUR', a: 'MUN', b: 'ZUR', mode: 'rail',
    via: [[10.72, 48.03], [10.32, 47.72], [9.68, 47.55], [9.38, 47.565], [8.72, 47.5]],
    frontiers: [
      { id: 'ROS', name: 'Romanshorn', ll: [9.38, 47.565], from: 'DE', into: 'CH' }
    ] },
  // Rosenheim, Kufstein, Innsbruck, the Brenner, Bozen, Trient; Ala; Verona, Vicenza, Padua.
  { id: 'MUN-VEN', a: 'MUN', b: 'VEN', mode: 'rail',
    via: [[12.12, 47.86], [12.17, 47.58], [11.4, 47.26], [11.51, 47], [11.35, 46.5], [11.12, 46.07], [11, 45.76], [10.99, 45.44], [11.55, 45.55], [11.88, 45.41]],
    frontiers: [
      { id: 'KUF', name: 'Kufstein', ll: [12.17, 47.58], from: 'DE', into: 'AH' },
      { id: 'ALA', name: 'Ala', ll: [11, 45.76], from: 'AH', into: 'IT' }
    ] },
  // The Gotthard: Zug, Arth-Goldau, Erstfeld, the great tunnel, Bellinzona, Lugano; Chiasso; Milan, Brescia, Verona, Padua.
  { id: 'ZUR-VEN', a: 'ZUR', b: 'VEN', mode: 'rail',
    via: [[8.52, 47.17], [8.55, 47.05], [8.65, 46.82], [8.59, 46.67], [8.61, 46.53], [9.02, 46.19], [8.95, 46], [9.03, 45.83], [9.19, 45.48], [10.21, 45.54], [10.99, 45.44], [11.88, 45.41]],
    frontiers: [
      { id: 'CHI', name: 'Chiasso', ll: [9.03, 45.83], from: 'CH', into: 'IT' }
    ] },
  // Bruck an der Leitha, Hegyeshalom, Győr, Komárom, Tata.
  { id: 'VIE-BUD', a: 'VIE', b: 'BUD', mode: 'rail',
    via: [[16.78, 48.02], [17.15, 47.91], [17.64, 47.69], [18.12, 47.74], [18.32, 47.65]],
    frontiers: [] },
  // The Südbahn: the Semmering, Graz, Marburg, Cilli, Laibach, Adelsberg, Nabresina.
  { id: 'VIE-TRI', a: 'VIE', b: 'TRI', mode: 'rail',
    via: [[16.24, 47.81], [15.83, 47.63], [15.27, 47.41], [15.44, 47.07], [15.65, 46.56], [15.26, 46.23], [14.51, 46.05], [14.21, 45.78], [13.67, 45.76]],
    frontiers: [] },
  // The Semmering to Bruck; the Rudolfsbahn by Leoben, Judenburg, St Veit and Villach; Tarvis and Pontafel; Udine, Treviso.
  { id: 'VIE-VEN', a: 'VIE', b: 'VEN', mode: 'rail',
    via: [[16.24, 47.81], [15.83, 47.63], [15.27, 47.41], [15.09, 47.38], [14.66, 47.17], [14.36, 46.77], [13.85, 46.61], [13.58, 46.5], [13.31, 46.51], [13.23, 46.06], [12.24, 45.67]],
    frontiers: [
      { id: 'PON', name: 'Pontafel', ll: [13.31, 46.51], from: 'AH', into: 'IT' }
    ] },
  // Kunszentmiklós, Kiskunhalas, Szabadka, Újvidék, India; Semlin; the Sava bridge into Belgrade.
  { id: 'BUD-BEG', a: 'BUD', b: 'BEG', mode: 'rail',
    via: [[19.12, 47.03], [19.49, 46.43], [19.67, 46.1], [19.84, 45.25], [20.08, 45.05], [20.41, 44.84]],
    frontiers: [
      { id: 'SEM', name: 'Semlin', ll: [20.41, 44.84], from: 'AH', into: 'RS' }
    ] },
  // Szolnok, Nagyvárad, Kolozsvár, Tövis, Segesvár, Brassó; Predeal; Sinaia and Ploesti.
  { id: 'BUD-BUC', a: 'BUD', b: 'BUC', mode: 'rail',
    via: [[20.2, 47.18], [21.12, 47.32], [21.93, 47.06], [23.59, 46.77], [23.73, 46.27], [24.35, 46.16], [24.79, 46.22], [25.59, 45.66], [25.58, 45.5], [25.55, 45.35], [26.02, 44.94]],
    frontiers: [
      { id: 'PRE', name: 'Predeal', ll: [25.58, 45.5], from: 'AH', into: 'RO' }
    ] },
  // Dombóvár, Pécs, Villány, Eszék, Vinkovci to Brod; the Bosnian narrow gauge by Doboj, Zenica and Visoko.
  { id: 'BUD-SAR', a: 'BUD', b: 'SAR', mode: 'rail',
    via: [[18.76, 47.14], [18.13, 46.38], [18.23, 46.07], [18.45, 45.87], [18.69, 45.55], [18.8, 45.29], [18.01, 45.16], [18.09, 44.73], [17.91, 44.2], [18.18, 43.99]],
    frontiers: [] },
  // The Orient line: Niš, Pirot; Tsaribrod; Sofia, Philippopolis, Harmanli; Mustafa Pasha; Adrianople, Lüleburgaz, Chataldja.
  { id: 'BEG-IST', a: 'BEG', b: 'IST', mode: 'rail',
    via: [[21.1, 44.18], [21.9, 43.32], [22.59, 43.15], [22.78, 43.01], [23.32, 42.7], [24.75, 42.15], [25.9, 41.93], [26.2, 41.77], [26.55, 41.68], [27.36, 41.4], [28.46, 41.14]],
    frontiers: [
      { id: 'TSA', name: 'Tsaribrod', ll: [22.78, 43.01], from: 'RS', into: 'BG' },
      { id: 'MUS', name: 'Mustafa Pasha', ll: [26.2, 41.77], from: 'BG', into: 'OT' }
    ] },
  // The Valjevo line, then the post road over the hills by Užice to the Drina at Višegrad; the Bosnian Eastern Railway to Sarajevo.
  { id: 'BEG-SAR', a: 'BEG', b: 'SAR', mode: 'road',
    via: [[20.08, 44.65], [19.89, 44.27], [19.85, 43.86], [19.55, 43.79], [19.29, 43.78], [19, 43.8], [18.57, 43.82]],
    frontiers: [
      { id: 'VIS', name: 'Višegrad', ll: [19.29, 43.78], from: 'RS', into: 'AH' }
    ] },
  // Over the Danube on the Cernavodă bridge to Constanța; the Romanian State steamer down the coast and into the Bosporus.
  { id: 'BUC-IST', a: 'BUC', b: 'IST', mode: 'ferry',
    via: [[27.83, 44.38], [28.03, 44.34], [28.65, 44.17], [28.85, 43.5], [29.15, 41.35], [29.06, 41.17]],
    frontiers: [
      { id: 'CON', name: 'Constantinople quay', ll: [28.975, 41.015], from: 'RO', into: 'OT' }
    ] },
  // Buzău, Mărășești, Pașcani, Jassy; Ungheni and the Russian gauge; Kishinev, Bender, Razdelnaya.
  { id: 'BUC-ODE', a: 'BUC', b: 'ODE', mode: 'rail',
    via: [[26.82, 45.15], [27.23, 45.88], [26.72, 47.25], [27.59, 47.16], [27.8, 47.21], [28.86, 47.01], [29.48, 46.83], [30.08, 46.85]],
    frontiers: [
      { id: 'UNG', name: 'Ungheni', ll: [27.8, 47.21], from: 'RO', into: 'RU' }
    ] },
  // Straight down the Black Sea, well off the Romanian and Bulgarian coasts, and into the Bosporus.
  { id: 'ODE-IST', a: 'ODE', b: 'IST', mode: 'sea',
    via: [[30.6, 46.25], [29.9, 44.5], [29.35, 42.2], [29.15, 41.35], [29.06, 41.17]],
    frontiers: [
      { id: 'CON', name: 'Constantinople quay', ll: [28.975, 41.015], from: 'RU', into: 'OT' }
    ] },
  // The Marmara and the Dardanelles; past Lemnos and through the Doro channel; round Sounion to Piraeus.
  { id: 'IST-ATH', a: 'IST', b: 'ATH', mode: 'sea',
    via: [[27.8, 40.85], [26.67, 40.41], [26.15, 39.95], [25.3, 39.3], [24.65, 38.06], [24, 37.58], [23.8, 37.75], [23.64, 37.94]],
    frontiers: [
      { id: 'PIR', name: 'Piraeus', ll: [23.64, 37.94], from: 'OT', into: 'GR' }
    ] },
  // Out of the Gulf of Trieste, across the mouth of the lagoons, in by the Lido port.
  { id: 'TRI-VEN', a: 'TRI', b: 'VEN', mode: 'sea',
    via: [[13.6, 45.62], [12.9, 45.48], [12.43, 45.41], [12.34, 45.43]],
    frontiers: [
      { id: 'VEQ', name: 'Venice quay', ll: [12.34, 45.43], from: 'AH', into: 'IT' }
    ] },
  // The Lloyd's Levant line: round Istria, down the Adriatic, through the Otranto strait, past Corfu, Cephalonia and Cape Malea.
  { id: 'TRI-ATH', a: 'TRI', b: 'ATH', mode: 'sea',
    via: [[13.35, 45.45], [13.55, 44.75], [15.6, 43.2], [17.8, 41.6], [18.9, 40.2], [19.5, 39.5], [20.2, 38.2], [21.1, 37.3], [22.3, 36.3], [23.2, 36.05], [23.75, 37.1], [23.64, 37.94]],
    frontiers: [
      { id: 'PIR', name: 'Piraeus', ll: [23.64, 37.94], from: 'AH', into: 'GR' }
    ] },
  // Padua, Ferrara, Bologna; the Porretta line over the Apennines to Pistoia and Florence; Arezzo, Chiusi, Orvieto, Orte.
  { id: 'VEN-ROM', a: 'VEN', b: 'ROM', mode: 'rail',
    via: [[11.88, 45.41], [11.62, 44.84], [11.34, 44.51], [10.92, 43.93], [11.25, 43.78], [11.88, 43.46], [11.95, 43.02], [12.11, 42.72], [12.38, 42.46]],
    frontiers: [] },
  // The Maremma line by Civitavecchia and Grosseto; Pisa, Spezia, Genoa, the Riviera; Ventimiglia; Nice, Cannes, Toulon.
  { id: 'ROM-MAR', a: 'ROM', b: 'MAR', mode: 'rail',
    via: [[11.8, 42.09], [11.11, 42.76], [10.4, 43.72], [9.82, 44.11], [8.93, 44.41], [8.48, 44.31], [7.78, 43.82], [7.61, 43.79], [7.27, 43.7], [7.02, 43.55], [5.93, 43.12]],
    frontiers: [
      { id: 'VTM', name: 'Ventimiglia', ll: [7.61, 43.79], from: 'IT', into: 'FR' }
    ] },
  // By Caserta, Foggia and Bari to Brindisi; the steamer by Corfu and Ithaca to Patras; the Peloponnese line by Corinth.
  { id: 'ROM-ATH', a: 'ROM', b: 'ATH', mode: 'ferry',
    via: [[14.33, 41.07], [15.55, 41.46], [16.87, 41.12], [17.94, 40.64], [18.9, 40.1], [19.6, 39.4], [20.4, 38.6], [20.95, 38.3], [21.73, 38.25], [22.08, 38.25], [22.93, 37.94], [23.54, 38.04]],
    frontiers: [
      { id: 'PAT', name: 'Patras', ll: [21.73, 38.25], from: 'IT', into: 'GR' }
    ] },
  // Arles, Tarascon, Nîmes, Montpellier, Narbonne, Perpignan; Port-Bou and the Spanish gauge; Figueras and Gerona.
  { id: 'MAR-BAR', a: 'MAR', b: 'BAR', mode: 'rail',
    via: [[4.99, 43.58], [4.63, 43.68], [4.66, 43.81], [4.36, 43.84], [3.88, 43.61], [3.22, 43.34], [3, 43.18], [2.9, 42.7], [3.16, 42.42], [2.96, 42.27], [2.82, 41.98]],
    frontiers: [
      { id: 'PBU', name: 'Port-Bou', ll: [3.16, 42.42], from: 'FR', into: 'ES' }
    ] },
  // Manresa and Lérida to Saragossa; Calatayud, Sigüenza, Guadalajara, Alcalá.
  { id: 'BAR-MAD', a: 'BAR', b: 'MAD', mode: 'rail',
    via: [[1.83, 41.73], [0.62, 41.62], [-0.88, 41.65], [-1.64, 41.35], [-2.64, 41.07], [-3.17, 40.63], [-3.36, 40.48]],
    frontiers: [] },
  // The Madrid–Cáceres–Portugal line: Talavera, Navalmoral, Arroyo; Valencia de Alcántara; Marvão, Abrantes, Entroncamento, Santarém.
  { id: 'MAD-LIS', a: 'MAD', b: 'LIS', mode: 'rail',
    via: [[-4.83, 39.96], [-5.54, 39.89], [-6.52, 39.45], [-7.24, 39.41], [-7.38, 39.42], [-8.2, 39.46], [-8.47, 39.46], [-8.68, 39.24]],
    frontiers: [
      { id: 'VAL', name: 'Valencia de Alcántara', ll: [-7.24, 39.41], from: 'ES', into: 'PT' }
    ] },
  // The Messageries' Levant run: Bonifacio, Messina, round Matapan and Malea to Piraeus, then the Dardanelles.
  { id: 'MAR-IST', a: 'MAR', b: 'IST', mode: 'sea',
    via: [[5.8, 42.95], [9.25, 41.3], [15.62, 38.2], [15.7, 37.85], [22.3, 36.3], [23.2, 36.05], [23.75, 37.1], [23.63, 37.9], [24, 37.58], [24.65, 38.06], [25.3, 39.3], [26.15, 39.95], [26.67, 40.41], [27.8, 40.85]],
    frontiers: [
      { id: 'CON', name: 'Constantinople quay', ll: [28.975, 41.015], from: 'FR', into: 'OT' }
    ] },
];
