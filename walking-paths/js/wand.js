// The magic wand: from a tap on the picture, the patch of ground of much the same colour round it,
// as a shape. Gaps of a pixel or two are closed, specks are ignored, and (for a walk area) the
// bigger islands inside it come back as blocks, so a well in a square is cut out by itself.
//
// It works on a smaller copy of the picture (at most WORK pixels across), softened a little so the
// brush strokes in a painting don't stop it.

import { whenReady } from './pictures.js';
import { simplify, clean } from './geom.js';
import { clamp } from './util.js';

const WORK = 1024;
const copies = new Map(); // picture key -> { w, h, rgb }

async function workCopy(key) {
  if (copies.has(key)) return copies.get(key);
  const img = await whenReady(key);
  if (!img) return null;
  const f = Math.min(1, WORK / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * f)), h = Math.max(1, Math.round(img.naturalHeight * f));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  let px;
  try { px = g.getImageData(0, 0, w, h).data; } catch { return null; }
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
    // see-through parts count as black
    const a = px[i + 3] / 255;
    rgb[j] = px[i] * a; rgb[j + 1] = px[i + 1] * a; rgb[j + 2] = px[i + 2] * a;
  }
  // softened twice, so cobbles and brush strokes read as one colour
  blur(rgb, w, h, 3);
  blur(rgb, w, h, 3);
  const c = { w, h, rgb };
  copies.set(key, c);
  return c;
}

// a box blur of radius r, across then down, on each colour
function blur(rgb, w, h, r) {
  const tmp = new Uint8Array(rgb.length), n = 2 * r + 1;
  for (let ch = 0; ch < 3; ch++) {
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += rgb[(y * w + clamp(x, 0, w - 1)) * 3 + ch];
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 3 + ch] = s / n;
        s += rgb[(y * w + Math.min(x + r + 1, w - 1)) * 3 + ch] - rgb[(y * w + Math.max(x - r, 0)) * 3 + ch];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[(clamp(y, 0, h - 1) * w + x) * 3 + ch];
      for (let y = 0; y < h; y++) {
        rgb[(y * w + x) * 3 + ch] = s / n;
        s += tmp[(Math.min(y + r + 1, h - 1) * w + x) * 3 + ch] - tmp[(Math.max(y - r, 0) * w + x) * 3 + ch];
      }
    }
  }
}

// grow (or, with all = true, shrink) a mask by r pixels in every direction, square
function morph(mask, w, h, r, all) {
  const tmp = new Uint8Array(mask.length), out = new Uint8Array(mask.length), need = all ? 2 * r + 1 : 1;
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += x >= 0 && x < w ? mask[y * w + x] : all ? 0 : 0;
    for (let x = 0; x < w; x++) {
      const inside = Math.min(x + r, w - 1) - Math.max(x - r, 0) + 1;
      tmp[y * w + x] = all ? (s >= Math.min(need, inside) ? 1 : 0) : s >= 1 ? 1 : 0;
      if (x + r + 1 < w) s += mask[y * w + x + r + 1];
      if (x - r >= 0) s -= mask[y * w + x - r];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += y >= 0 && y < h ? tmp[y * w + x] : 0;
    for (let y = 0; y < h; y++) {
      const inside = Math.min(y + r, h - 1) - Math.max(y - r, 0) + 1;
      out[y * w + x] = all ? (s >= Math.min(need, inside) ? 1 : 0) : s >= 1 ? 1 : 0;
      if (y + r + 1 < h) s += tmp[(y + r + 1) * w + x];
      if (y - r >= 0) s -= tmp[(y - r) * w + x];
    }
  }
  return out;
}

// the pixels joined to (sx, sy) for which ok(i) is true (4 neighbours)
function fill(w, h, sx, sy, ok) {
  const out = new Uint8Array(w * h), stack = new Int32Array(w * h);
  let top = 0;
  const s = sy * w + sx;
  if (!ok(s)) return out;
  out[s] = 1; stack[top++] = s;
  while (top) {
    const i = stack[--top], x = i % w;
    if (x > 0 && !out[i - 1] && ok(i - 1)) { out[i - 1] = 1; stack[top++] = i - 1; }
    if (x < w - 1 && !out[i + 1] && ok(i + 1)) { out[i + 1] = 1; stack[top++] = i + 1; }
    if (i >= w && !out[i - w] && ok(i - w)) { out[i - w] = 1; stack[top++] = i - w; }
    if (i < w * (h - 1) && !out[i + w] && ok(i + w)) { out[i + w] = 1; stack[top++] = i + w; }
  }
  return out;
}

// the outline of the shape in `mask` that holds pixel `start` (Moore neighbour tracing): the
// pixels round its edge, in order
const DX = [-1, -1, 0, 1, 1, 1, 0, -1], DY = [0, -1, -1, -1, 0, 1, 1, 1];
function outline(mask, w, h, start) {
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  const sx = start % w, sy = (start - sx) / w;
  const pts = [];
  let px = sx, py = sy, bx = sx - 1, by = sy; // `start` is the shape's first pixel row by row, so its left is outside
  let firstStep = null;
  for (let guard = 0; guard < 4 * w * h + 8; guard++) {
    let d = 0;
    for (let k = 0; k < 8; k++) if (px + DX[k] === bx && py + DY[k] === by) { d = k; break; }
    let nx = -1, ny = -1, nbx = 0, nby = 0;
    for (let k = 1; k <= 8; k++) {
      const c = (d + k) % 8;
      if (on(px + DX[c], py + DY[c])) {
        const p = (d + k - 1) % 8;
        nx = px + DX[c]; ny = py + DY[c]; nbx = px + DX[p]; nby = py + DY[p];
        break;
      }
    }
    if (nx < 0) { pts.push([px, py]); break; } // a single pixel
    // round once: back at the start, about to take the first step again
    if (px === sx && py === sy) {
      if (firstStep && nx === firstStep[0] && ny === firstStep[1]) break;
      if (!firstStep) firstStep = [nx, ny];
    }
    pts.push([px, py]);
    bx = nbx; by = nby; px = nx; py = ny;
  }
  return pts;
}

// Returns { outer, holes } in map pixels, or { error } in plain words.
//   key: the picture, size: the map's [w, h], at: the tap [x, y], spread: 1..100,
//   withHoles: islands inside come back as holes, walker: how tall people are on the map
export async function wand(key, size, at, spread, withHoles, walker) {
  const c = await workCopy(key);
  if (!c) return { error: 'The picture isn’t ready yet. Try again in a moment.' };
  const { w, h, rgb } = c, [MW, MH] = size, kx = MW / w, ky = MH / h;
  const sx = clamp(Math.floor(at[0] / kx), 0, w - 1), sy = clamp(Math.floor(at[1] / ky), 0, h - 1);
  // the colour under the finger: the middle of a 5 x 5 patch
  let r0 = 0, g0 = 0, b0 = 0, n0 = 0;
  for (let y = sy - 2; y <= sy + 2; y++) for (let x = sx - 2; x <= sx + 2; x++) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const j = (y * w + x) * 3;
    r0 += rgb[j]; g0 += rgb[j + 1]; b0 += rgb[j + 2]; n0++;
  }
  r0 /= n0; g0 /= n0; b0 /= n0;
  // how different a colour may be (a "redmean" distance, closer to what eyes see than plain RGB)
  const t = 6 + spread * 1.3, t2 = t * t;
  const diff = (i) => {
    const j = i * 3, rm = (rgb[j] + r0) / 2, dr = rgb[j] - r0, dg = rgb[j + 1] - g0, db = rgb[j + 2] - b0;
    return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
  };
  let mask = fill(w, h, sx, sy, (i) => diff(i) <= t2);
  // close cracks a pixel wide; then cut every thread narrower than her feet (she couldn't walk
  // along it anyway, and that is how a patch leaks into the next one); keep the part joined to the tap
  const k = Math.max(kx, ky), foot = Math.max(1, Math.min(6, Math.round(((walker || 52) * 6) / 52 / k)));
  mask = morph(morph(mask, w, h, 1, false), w, h, 1, true);
  mask = morph(morph(mask, w, h, foot, true), w, h, foot, false);
  const seed = sy * w + sx;
  if (!mask[seed]) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < mask.length; i++) if (mask[i]) { const x = i % w, y = (i - x) / w, d = (x - sx) ** 2 + (y - sy) ** 2; if (d < bd) { bd = d; best = i; } }
    if (best < 0) return { error: 'Nothing there to outline. Try further in, or let it spread further.' };
    mask = fill(w, h, best % w, Math.floor(best / w), (i) => mask[i] === 1);
  } else mask = fill(w, h, sx, sy, (i) => mask[i] === 1);
  let count = 0;
  for (let i = 0; i < mask.length; i++) count += mask[i];
  if (count < 12) return { error: 'That patch is too small to outline. Let it spread further, or tap the middle of the ground.' };
  // islands: what isn't the patch and can't be reached from the picture's edge without crossing it
  const outside = new Uint8Array(w * h), stack = new Int32Array(w * h);
  let top = 0;
  const push = (i) => { if (!mask[i] && !outside[i]) { outside[i] = 1; stack[top++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (top) {
    const i = stack[--top], x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  // an island is kept (as a block) when it is big enough to matter and mostly not the ground's
  // colour; a lamp's pool of light on the cobbles, or a patch of moss, is filled in
  const holes = [], minPx = Math.max(16, ((walker || 52) * 0.5) ** 2 / (kx * ky)), loose = (t * 1.7) ** 2;
  const seen = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] || outside[i] || seen[i]) continue;
    const part = fill(w, h, i % w, Math.floor(i / w), (q) => !mask[q] && !outside[q]);
    let n = 0, ground = 0, first = -1;
    for (let q = 0; q < part.length; q++) if (part[q]) { seen[q] = 1; n++; if (diff(q) <= loose) ground++; if (first < 0) first = q; }
    if (withHoles && n >= minPx && ground / n < 0.5) holes.push({ part, first });
    else for (let q = 0; q < part.length; q++) if (part[q]) mask[q] = 1;
  }
  // outlines, in map pixels, with fewer points; anything at the picture's edge sits on it exactly
  const toMap = (pts) => clean(pts.map(([x, y]) => [
    x <= 0 ? 0 : x >= w - 1 ? MW : Math.round((x + 0.5) * kx),
    y <= 0 ? 0 : y >= h - 1 ? MH : Math.round((y + 0.5) * ky),
  ]));
  const fewer = (pts) => {
    let eps = Math.max(kx, ky) * 1.1, out = simplify(pts, eps);
    while (out.length > 260) { eps *= 1.5; out = simplify(pts, eps); }
    return out;
  };
  let first = -1;
  for (let i = 0; i < mask.length; i++) if (mask[i]) { first = i; break; }
  const outer = fewer(toMap(outline(mask, w, h, first)));
  if (outer.length < 3) return { error: 'That patch is too thin to outline. Let it spread further.' };
  const holeShapes = holes.map((hl) => fewer(toMap(outline(hl.part, w, h, hl.first)))).filter((p) => p.length >= 3);
  return { outer, holes: holeShapes, share: count / (w * h) };
}

export function forgetCopies() { copies.clear(); }

// for tools/walking-paths-smoke.mjs
export const _inside = { outline, morph, fill };
