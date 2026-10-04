// "Where she can reach" and "can she stand here": the walk engine's own rules, so the editor
// and the walk always agree.

import { S, emit, mapSize } from './state.js';
import { fileMap } from './project.js';

const rules = () => window.WalkingPathsEngine.rules;

// every map in the maps file's shape (no pictures), for the engine
export function engineMaps() {
  const out = {};
  for (const id of S.order) out[id] = fileMap(S.maps[id]);
  return out;
}

let found = null, foundRev = -1, foundMap = null, timer = 0;
export function checkSoon() {
  clearTimeout(timer);
  if (!S.layers.reach || !S.cur) { emit('reach'); return; }
  emit('reach');
  timer = setTimeout(() => {
    if (!S.layers.reach || !S.cur) return;
    found = rules().reach(engineMaps(), S.cur);
    foundRev = S.rev;
    foundMap = S.cur;
    emit('reach');
  }, 160);
}
export const reachNow = () => (found && foundRev === S.rev && foundMap === S.cur ? found : null);

let test = null, testRev = -1, testMap = null;
export function canStand(x, y) {
  if (!S.cur) return false;
  if (!test || testRev !== S.rev || testMap !== S.cur) {
    test = rules().standTest(fileMap(S.maps[S.cur]));
    testRev = S.rev;
    testMap = S.cur;
  }
  return test.stand(x, y);
}

// the nearest place she can stand to (x, y) on map `id` (for starting a walk where you are looking)
export function nearestStand(id, x, y) {
  const m = fileMap(S.maps[id]), t = rules().standTest(m);
  if (t.stand(x, y)) return [Math.round(x), Math.round(y)];
  const G = rules().grid(m, t);
  let best = null, bd = Infinity;
  for (let k = 0; k < G.open.length; k++) if (G.open[k]) { const d = (G.cx(k) - x) ** 2 + (G.cy(k) - y) ** 2; if (d < bd) { bd = d; best = [Math.round(G.cx(k)), Math.round(G.cy(k))]; } }
  return best;
}

// Where she should arrive on map `to` through way out `i` of map `from`: across from where she
// left (leaving by the right edge she comes in at the left, as far down), a little way in, on
// ground she can stand on if the map has any yet.
export function arrivalFor(from, i, to) {
  const a = S.maps[from], b = S.maps[to], r = a.exits[i].rect, [AW, AH] = mapSize(a), [BW, BH] = mapSize(b), h = b.walker;
  const c = [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2], d = [c[0], AW - c[0], c[1], AH - c[1]], side = d.indexOf(Math.min(...d));
  const inset = Math.round((h * 8) / 52 + h * 0.6 + Math.max(12, h * 0.4));
  const p = side === 0 ? [BW - inset, (c[1] / AH) * BH] : side === 1 ? [inset, (c[1] / AH) * BH] : side === 2 ? [(c[0] / AW) * BW, BH - inset] : [(c[0] / AW) * BW, inset];
  const x = Math.round(Math.min(Math.max(p[0], 0), BW)), y = Math.round(Math.min(Math.max(p[1], 0), BH));
  return (b.walk.length && nearestStand(to, x, y)) || [x, y];
}
