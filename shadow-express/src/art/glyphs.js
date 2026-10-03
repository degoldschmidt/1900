// Engraved map glyphs (owner: Art C). Stub: one placeholder per key; see docs/ART.md.
import { makeKit } from './kit.js';

const KEYS = ['loco', 'steamer', 'coach', 'walker', 'sentry', 'barrier', 'flood', 'plague', 'strike', 'troops', 'hunter', 'eye', 'compass', 'cartouche',
  'stamp-secret', 'stamp-delivered', 'stamp-burned', 'seal', 'telegram'];
const stub = (uid) => { const k = makeKit({ uid }); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>${k.defs()}</defs>${k.shape('M12 12h40v40h-40Z', 'mid')}</svg>`; };
export default Object.fromEntries(KEYS.map((key) => [key, stub]));
