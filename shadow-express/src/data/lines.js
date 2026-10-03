// Lines with waypoints and frontier stations (owner: World). Stub rows; see docs/CONTRACTS.md §2.

export default [
  { "id": "LON-PAR", "a": "LON", "b": "PAR", "mode": "ferry", "via": [ [ 1.85, 50.95 ] ], "frontiers": [
  { "id": "CAL", "name": "Calais", "ll": [ 1.85, 50.95 ], "from": "GB", "into": "FR" } ] },
  { "id": "LON-BRU", "a": "LON", "b": "BRU", "mode": "ferry", "via": [ [ 2.92, 51.23 ] ], "frontiers": [
  { "id": "OST", "name": "Ostend", "ll": [ 2.92, 51.23 ], "from": "GB", "into": "BE" } ] },
  { "id": "LON-AMS", "a": "LON", "b": "AMS", "mode": "sea", "via": [ [ 4.13, 51.98 ] ], "frontiers": [
  { "id": "HOO", "name": "Hook of Holland", "ll": [ 4.13, 51.98 ], "from": "GB", "into": "NL" } ] },
  { "id": "LON-FLU", "a": "LON", "b": "FLU", "mode": "ferry", "via": [ [ 3.57, 51.44 ] ], "frontiers": [
  { "id": "VLI", "name": "Flushing quay", "ll": [ 3.57, 51.44 ], "from": "GB", "into": "NL" } ] },
  { "id": "LON-HAM", "a": "LON", "b": "HAM", "mode": "sea", "via": [ [ 8.7, 53.87 ] ], "frontiers": [
  { "id": "CUX", "name": "Cuxhaven", "ll": [ 8.7, 53.87 ], "from": "GB", "into": "DE" } ] },
  { "id": "LON-LIS", "a": "LON", "b": "LIS", "mode": "sea", "via": [ [ -9.14, 38.7 ] ], "frontiers": [
  { "id": "LXQ", "name": "Lisbon quay", "ll": [ -9.14, 38.7 ], "from": "GB", "into": "PT" } ] },
  { "id": "PAR-BRU", "a": "PAR", "b": "BRU", "mode": "rail", "via": [ [ 3.94, 50.36 ] ], "frontiers": [
  { "id": "QUE", "name": "Quévy", "ll": [ 3.94, 50.36 ], "from": "FR", "into": "BE" } ] },
  { "id": "PAR-MAR", "a": "PAR", "b": "MAR", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "PAR-ZUR", "a": "PAR", "b": "ZUR", "mode": "rail", "via": [ [ 7, 47.51 ] ], "frontiers": [
  { "id": "DLL", "name": "Delle", "ll": [ 7, 47.51 ], "from": "FR", "into": "CH" } ] },
  { "id": "PAR-MUN", "a": "PAR", "b": "MUN", "mode": "rail", "via": [ [ 6.81, 48.65 ] ], "frontiers": [
  { "id": "AVR", "name": "Avricourt", "ll": [ 6.81, 48.65 ], "from": "FR", "into": "DE" } ] },
  { "id": "PAR-VIE", "a": "PAR", "b": "VIE", "mode": "rail", "via": [ [ 6.81, 48.65 ], [ 13.04, 47.81 ] ], "frontiers": [
  { "id": "AVR", "name": "Avricourt", "ll": [ 6.81, 48.65 ], "from": "FR", "into": "DE" },
  { "id": "SBG", "name": "Salzburg", "ll": [ 13.04, 47.81 ], "from": "DE", "into": "AH" } ] },
  { "id": "PAR-MAD", "a": "PAR", "b": "MAD", "mode": "rail", "via": [ [ -1.79, 43.34 ] ], "frontiers": [
  { "id": "IRU", "name": "Irún", "ll": [ -1.79, 43.34 ], "from": "FR", "into": "ES" } ] },
  { "id": "BRU-AMS", "a": "BRU", "b": "AMS", "mode": "rail", "via": [ [ 4.46, 51.53 ] ], "frontiers": [
  { "id": "RSD", "name": "Roosendaal", "ll": [ 4.46, 51.53 ], "from": "BE", "into": "NL" } ] },
  { "id": "BRU-COL", "a": "BRU", "b": "COL", "mode": "rail", "via": [ [ 6.02, 50.66 ] ], "frontiers": [
  { "id": "HER", "name": "Herbesthal", "ll": [ 6.02, 50.66 ], "from": "BE", "into": "DE" } ] },
  { "id": "AMS-COL", "a": "AMS", "b": "COL", "mode": "rail", "via": [ [ 6.25, 51.83 ] ], "frontiers": [
  { "id": "EMM", "name": "Emmerich", "ll": [ 6.25, 51.83 ], "from": "NL", "into": "DE" } ] },
  { "id": "AMS-HAM", "a": "AMS", "b": "HAM", "mode": "rail", "via": [ [ 7.16, 52.3 ] ], "frontiers": [
  { "id": "BEN", "name": "Bentheim", "ll": [ 7.16, 52.3 ], "from": "NL", "into": "DE" } ] },
  { "id": "FLU-AMS", "a": "FLU", "b": "AMS", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "COL-BER", "a": "COL", "b": "BER", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "COL-ZUR", "a": "COL", "b": "ZUR", "mode": "rail", "via": [ [ 7.59, 47.56 ] ], "frontiers": [
  { "id": "BAS", "name": "Basel", "ll": [ 7.59, 47.56 ], "from": "DE", "into": "CH" } ] },
  { "id": "HAM-BER", "a": "HAM", "b": "BER", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "HAM-CPH", "a": "HAM", "b": "CPH", "mode": "ferry", "via": [ [ 11.14, 55.33 ] ], "frontiers": [
  { "id": "KOR", "name": "Korsør", "ll": [ 11.14, 55.33 ], "from": "DE", "into": "DK" } ] },
  { "id": "BER-CPH", "a": "BER", "b": "CPH", "mode": "ferry", "via": [ [ 11.93, 54.57 ] ], "frontiers": [
  { "id": "GED", "name": "Gedser", "ll": [ 11.93, 54.57 ], "from": "DE", "into": "DK" } ] },
  { "id": "CPH-STO", "a": "CPH", "b": "STO", "mode": "ferry", "via": [ [ 13, 55.61 ] ], "frontiers": [
  { "id": "MAL", "name": "Malmö", "ll": [ 13, 55.61 ], "from": "DK", "into": "SE" } ] },
  { "id": "STO-SPB", "a": "STO", "b": "SPB", "mode": "sea", "via": [ [ 22.27, 60.45 ] ], "frontiers": [
  { "id": "ABO", "name": "Åbo", "ll": [ 22.27, 60.45 ], "from": "SE", "into": "RU" } ] },
  { "id": "BER-WAR", "a": "BER", "b": "WAR", "mode": "rail", "via": [ [ 18.7, 52.88 ] ], "frontiers": [
  { "id": "ALX", "name": "Alexandrowo", "ll": [ 18.7, 52.88 ], "from": "DE", "into": "RU" } ] },
  { "id": "BER-SPB", "a": "BER", "b": "SPB", "mode": "rail", "via": [ [ 22.73, 54.63 ] ], "frontiers": [
  { "id": "EYD", "name": "Eydtkuhnen", "ll": [ 22.73, 54.63 ], "from": "DE", "into": "RU" } ] },
  { "id": "BER-PRG", "a": "BER", "b": "PRG", "mode": "rail", "via": [ [ 14.21, 50.77 ] ], "frontiers": [
  { "id": "BOD", "name": "Bodenbach", "ll": [ 14.21, 50.77 ], "from": "DE", "into": "AH" } ] },
  { "id": "BER-MUN", "a": "BER", "b": "MUN", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "WAR-SPB", "a": "WAR", "b": "SPB", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "WAR-VIE", "a": "WAR", "b": "VIE", "mode": "rail", "via": [ [ 19.27, 50.26 ] ], "frontiers": [
  { "id": "GRA", "name": "Granica", "ll": [ 19.27, 50.26 ], "from": "RU", "into": "AH" } ] },
  { "id": "WAR-ODE", "a": "WAR", "b": "ODE", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "PRG-VIE", "a": "PRG", "b": "VIE", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "MUN-VIE", "a": "MUN", "b": "VIE", "mode": "rail", "via": [ [ 13.04, 47.81 ] ], "frontiers": [
  { "id": "SBG", "name": "Salzburg", "ll": [ 13.04, 47.81 ], "from": "DE", "into": "AH" } ] },
  { "id": "MUN-ZUR", "a": "MUN", "b": "ZUR", "mode": "rail", "via": [ [ 9.38, 47.57 ] ], "frontiers": [
  { "id": "ROS", "name": "Romanshorn", "ll": [ 9.38, 47.57 ], "from": "DE", "into": "CH" } ] },
  { "id": "MUN-VEN", "a": "MUN", "b": "VEN", "mode": "rail", "via": [ [ 12.17, 47.58 ], [ 11, 45.76 ] ], "frontiers": [
  { "id": "KUF", "name": "Kufstein", "ll": [ 12.17, 47.58 ], "from": "DE", "into": "AH" },
  { "id": "ALA", "name": "Ala", "ll": [ 11, 45.76 ], "from": "AH", "into": "IT" } ] },
  { "id": "ZUR-VEN", "a": "ZUR", "b": "VEN", "mode": "rail", "via": [ [ 9.03, 45.83 ] ], "frontiers": [
  { "id": "CHI", "name": "Chiasso", "ll": [ 9.03, 45.83 ], "from": "CH", "into": "IT" } ] },
  { "id": "VIE-BUD", "a": "VIE", "b": "BUD", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "VIE-TRI", "a": "VIE", "b": "TRI", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "VIE-VEN", "a": "VIE", "b": "VEN", "mode": "rail", "via": [ [ 13.31, 46.51 ] ], "frontiers": [
  { "id": "PON", "name": "Pontafel", "ll": [ 13.31, 46.51 ], "from": "AH", "into": "IT" } ] },
  { "id": "BUD-BEG", "a": "BUD", "b": "BEG", "mode": "rail", "via": [ [ 20.41, 44.84 ] ], "frontiers": [
  { "id": "SEM", "name": "Semlin", "ll": [ 20.41, 44.84 ], "from": "AH", "into": "RS" } ] },
  { "id": "BUD-BUC", "a": "BUD", "b": "BUC", "mode": "rail", "via": [ [ 25.58, 45.5 ] ], "frontiers": [
  { "id": "PRE", "name": "Predeal", "ll": [ 25.58, 45.5 ], "from": "AH", "into": "RO" } ] },
  { "id": "BUD-SAR", "a": "BUD", "b": "SAR", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "BEG-IST", "a": "BEG", "b": "IST", "mode": "rail", "via": [ [ 22.78, 43.01 ], [ 26.2, 41.77 ] ], "frontiers": [
  { "id": "TSA", "name": "Tsaribrod", "ll": [ 22.78, 43.01 ], "from": "RS", "into": "BG" },
  { "id": "MUS", "name": "Mustafa Pasha", "ll": [ 26.2, 41.77 ], "from": "BG", "into": "OT" } ] },
  { "id": "BEG-SAR", "a": "BEG", "b": "SAR", "mode": "road", "via": [ [ 19.29, 43.78 ] ], "frontiers": [
  { "id": "VIS", "name": "Višegrad", "ll": [ 19.29, 43.78 ], "from": "RS", "into": "AH" } ] },
  { "id": "BUC-IST", "a": "BUC", "b": "IST", "mode": "ferry", "via": [ [ 28.97, 41.02 ] ], "frontiers": [
  { "id": "CON", "name": "Constantinople quay", "ll": [ 28.97, 41.02 ], "from": "RO", "into": "OT" } ] },
  { "id": "BUC-ODE", "a": "BUC", "b": "ODE", "mode": "rail", "via": [ [ 27.8, 47.21 ] ], "frontiers": [
  { "id": "UNG", "name": "Ungheni", "ll": [ 27.8, 47.21 ], "from": "RO", "into": "RU" } ] },
  { "id": "ODE-IST", "a": "ODE", "b": "IST", "mode": "sea", "via": [ [ 28.97, 41.02 ] ], "frontiers": [
  { "id": "CON", "name": "Constantinople quay", "ll": [ 28.97, 41.02 ], "from": "RU", "into": "OT" } ] },
  { "id": "IST-ATH", "a": "IST", "b": "ATH", "mode": "sea", "via": [ [ 23.64, 37.94 ] ], "frontiers": [
  { "id": "PIR", "name": "Piraeus", "ll": [ 23.64, 37.94 ], "from": "OT", "into": "GR" } ] },
  { "id": "TRI-VEN", "a": "TRI", "b": "VEN", "mode": "sea", "via": [ [ 12.34, 45.43 ] ], "frontiers": [
  { "id": "VEQ", "name": "Venice quay", "ll": [ 12.34, 45.43 ], "from": "AH", "into": "IT" } ] },
  { "id": "TRI-ATH", "a": "TRI", "b": "ATH", "mode": "sea", "via": [ [ 23.64, 37.94 ] ], "frontiers": [
  { "id": "PIR", "name": "Piraeus", "ll": [ 23.64, 37.94 ], "from": "AH", "into": "GR" } ] },
  { "id": "VEN-ROM", "a": "VEN", "b": "ROM", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "ROM-MAR", "a": "ROM", "b": "MAR", "mode": "rail", "via": [ [ 7.61, 43.79 ] ], "frontiers": [
  { "id": "VTM", "name": "Ventimiglia", "ll": [ 7.61, 43.79 ], "from": "IT", "into": "FR" } ] },
  { "id": "ROM-ATH", "a": "ROM", "b": "ATH", "mode": "ferry", "via": [ [ 21.73, 38.25 ] ], "frontiers": [
  { "id": "PAT", "name": "Patras", "ll": [ 21.73, 38.25 ], "from": "IT", "into": "GR" } ] },
  { "id": "MAR-BAR", "a": "MAR", "b": "BAR", "mode": "rail", "via": [ [ 3.13, 42.42 ] ], "frontiers": [
  { "id": "PBU", "name": "Port-Bou", "ll": [ 3.13, 42.42 ], "from": "FR", "into": "ES" } ] },
  { "id": "BAR-MAD", "a": "BAR", "b": "MAD", "mode": "rail", "via": [], "frontiers": [] },
  { "id": "MAD-LIS", "a": "MAD", "b": "LIS", "mode": "rail", "via": [ [ -7.24, 39.41 ] ], "frontiers": [
  { "id": "VAL", "name": "Valencia de Alcántara", "ll": [ -7.24, 39.41 ], "from": "ES", "into": "PT" } ] },
  { "id": "MAR-IST", "a": "MAR", "b": "IST", "mode": "sea", "via": [ [ 28.97, 41.02 ] ], "frontiers": [
  { "id": "CON", "name": "Constantinople quay", "ll": [ 28.97, 41.02 ], "from": "FR", "into": "OT" } ] },
];
