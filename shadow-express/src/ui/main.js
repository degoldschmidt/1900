// Boot. Placeholder until the UI lands: shows London at the current hour to prove the build.
import vignettes from '../art/vignettes/index.js';
import { renderScene } from '../art/frame.js';
import { longDate } from '../data/time.js';

const app = document.getElementById('app');
const lon = vignettes.find((v) => v.id === 'LON');
const svg = renderScene(lon, { hour: new Date().getHours(), uid: 'boot' });
const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
app.innerHTML = `<h1>Shadow Express</h1><p>${longDate(17 * 60)}. Work in progress.</p><img alt="London" src="${url}">`;
