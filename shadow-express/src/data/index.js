// All game data in one object. The engine and the tests import this; nothing else reads src/data directly.
import nations from './nations.js';
import cities from './cities.js';
import lines from './lines.js';
import services from './services.js';
import calendar from './calendar.js';
import covers from './covers.js';
import people from './people.js';
import hunters from './hunters.js';
import items from './items.js';
import stories from './stories/index.js';
import ops from './ops/index.js';

export default { nations, cities, lines, services, calendar, covers, people, hunters, items, stories, ops };
