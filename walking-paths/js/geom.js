// Shapes: points are [x, y] in map pixels, a shape is a list of points (closed by itself).

import { clamp } from './util.js';

export function inPoly(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}

export function area(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
}

export const centre = (r) => [Math.round((r[0] + r[2]) / 2), Math.round((r[1] + r[3]) / 2)];
export const inRect = (r, x, y, pad = 0) => x >= r[0] - pad && x <= r[2] + pad && y >= r[1] - pad && y <= r[3] + pad;
export const onEdge = (p, W, H) => p[0] <= 0 || p[0] >= W || p[1] <= 0 || p[1] >= H;
export const snap = (x, y, W, H) => [clamp(Math.round(x), 0, W), clamp(Math.round(y), 0, H)];

// drop repeated points and the end that repeats the start; with `straight`, points in the middle of a straight run too
export function clean(pts, straight) {
  const out = [];
  for (const p of pts) { const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); }
  while (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
  if (straight) for (let i = 0; i < out.length && out.length > 3; i++) {
    const n = out.length, a = out[(i + n - 1) % n], b = out[i], c = out[(i + 1) % n];
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const dot = (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
    if (cross === 0 && dot > 0) { out.splice(i, 1); i = Math.max(-1, i - 2); }
  }
  return out;
}

// Round corners (Envoi's "Smooth"): every corner, or only corner `only`, becomes two or three points
// a quarter of the way along its edges. Points on the picture's edge stay put, so ways out keep their width.
export function smooth(pts, only, W, H) {
  const n = pts.length, out = [];
  if (only == null) only = -1;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    if ((only >= 0 && i !== only) || onEdge(p, W, H)) { out.push(p.slice()); continue; }
    const a = pts[(i + n - 1) % n], c = pts[(i + 1) % n];
    const u = [p[0] + (a[0] - p[0]) * 0.25, p[1] + (a[1] - p[1]) * 0.25], v = [p[0] + (c[0] - p[0]) * 0.25, p[1] + (c[1] - p[1]) * 0.25];
    out.push(u);
    if (only >= 0) out.push([u[0] * 0.25 + p[0] * 0.5 + v[0] * 0.25, u[1] * 0.25 + p[1] * 0.5 + v[1] * 0.25]);
    out.push(v);
  }
  const done = clean(out.map((p) => snap(p[0], p[1], W, H)), only < 0);
  return done.length >= 3 ? done : pts.map((p) => p.slice());
}

// Fewer points (Douglas–Peucker round a closed shape): drop points closer than `eps` to the line
// their neighbours make. Points for which keep(p) is true always stay.
export function simplify(pts, eps, keep) {
  const n = pts.length;
  if (n <= 4) return pts.map((p) => p.slice());
  let anchors = [];
  if (keep) for (let i = 0; i < n; i++) if (keep(pts[i])) anchors.push(i);
  if (anchors.length < 2) {
    const a = anchors.length ? anchors[0] : 0;
    let far = a, fd = -1;
    for (let i = 0; i < n; i++) { const d = (pts[i][0] - pts[a][0]) ** 2 + (pts[i][1] - pts[a][1]) ** 2; if (d > fd) { fd = d; far = i; } }
    anchors = far === a ? [a, (a + Math.floor(n / 2)) % n] : [a, far];
    anchors.sort((x, y) => x - y);
  }
  const kept = new Uint8Array(n);
  for (const i of anchors) kept[i] = 1;
  const segDist = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    if (!L) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L, 0, 1);
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  for (let k = 0; k < anchors.length; k++) {
    const i0 = anchors[k], i1 = anchors[(k + 1) % anchors.length];
    const chain = [];
    for (let i = i0; ; i = (i + 1) % n) { chain.push(i); if (i === i1 && chain.length > 1) break; if (chain.length > n + 1) break; }
    const stack = [[0, chain.length - 1]];
    while (stack.length) {
      const [s, e] = stack.pop();
      if (e - s < 2) continue;
      let best = -1, bd = -1;
      for (let j = s + 1; j < e; j++) { const d = segDist(pts[chain[j]], pts[chain[s]], pts[chain[e]]); if (d > bd) { bd = d; best = j; } }
      if (bd > eps) { kept[chain[best]] = 1; stack.push([s, best], [best, e]); }
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (kept[i]) out.push(pts[i].slice());
  return out.length >= 3 ? out : pts.map((p) => p.slice());
}

// an open line (a finger's trace) with fewer points
export function simplifyLine(pts, eps) {
  if (pts.length <= 2) return pts.slice();
  const kept = new Uint8Array(pts.length);
  kept[0] = kept[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    if (e - s < 2) continue;
    const a = pts[s], b = pts[e], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    let best = -1, bd = -1;
    for (let j = s + 1; j < e; j++) { const d = Math.abs(dy * (pts[j][0] - a[0]) - dx * (pts[j][1] - a[1])) / L; if (d > bd) { bd = d; best = j; } }
    if (bd > eps) { kept[best] = 1; stack.push([s, best], [best, e]); }
  }
  return pts.filter((p, i) => kept[i]);
}

function segsCross(a, b, c, d) {
  const side = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}
export function crossesItself(pts) {
  const n = pts.length;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (segsCross(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return true;
  }
  return false;
}

// the point on a shape's edges nearest to (x, y): { j (edge from point j to j+1), p, d }
export function nearestOnEdges(pts, x, y) {
  let best = null;
  for (let j = 0; j < pts.length; j++) {
    const a = pts[j], b = pts[(j + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    const t = L ? clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L, 0, 1) : 0;
    const p = [a[0] + dx * t, a[1] + dy * t], d = Math.hypot(p[0] - x, p[1] - y);
    if (!best || d < best.d) best = { j, p, d };
  }
  return best;
}

export const scalePts = (pts, kx, ky) => pts.map(([x, y]) => [Math.round(x * kx), Math.round(y * ky)]);
