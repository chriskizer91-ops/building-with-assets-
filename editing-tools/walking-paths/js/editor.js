// The picture and everything drawn on it. Looking round (drag empty space, the wheel, two fingers),
// picking and dragging points and shapes, drawing new shapes by tapping points or tracing with a
// finger, the magic wand, and putting down ways out, people, things and story areas.

import { S, map, mapSize, remember, dropLast, emit, on, changed } from './state.js';
import { bbox, area, inPoly, inRect, nearestOnEdges, smooth, simplify, simplifyLine, clean, snap, onEdge } from './geom.js';
import { pictureImage } from './pictures.js';
import { arrivalsInto, mapName, isWorld, putOnWorld } from './project.js';
import { reachNow, canStand } from './check.js';
import { wand } from './wand.js';
import { $, clamp, cap, plural } from './util.js';

const cv = $('wp-cv'), g = cv.getContext('2d'), stage = $('wp-stage');
const css = getComputedStyle(document.documentElement);
const C = {};
for (const k of ['walk', 'block', 'front', 'exit', 'arrive', 'people', 'thing', 'story', 'reach', 'island', 'gold', 'deep', 'io', 'problem']) C[k] = css.getPropertyValue('--' + k).trim() || '#ffffff';
const rgba = (hex, a) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
};

export const SHAPES = ['walk', 'block', 'front'];
export const isShape = (k) => SHAPES.includes(k);
export const NOUN = { walk: 'walk area', block: 'block', front: 'front', exit: 'way out', person: 'person', thing: 'thing', story: 'story area', place: 'place' };

// ---------------------------------------------------------------------------------------------
// looking round: view.x, view.y is the map point at the top left, view.z screen pixels per map pixel

export const view = { x: 0, y: 0, z: 0.5 };
let dpr = 1, W = 1, H = 1, sized = false;
const MW = () => mapSize(map())[0], MH = () => mapSize(map())[1];
const fitZ = () => Math.min(W / MW(), H / MH());
const maxZ = () => Math.max(12, fitZ() * 6);

// on a phone the box round the picture is as tall as the map's shape needs (the CSS reads --wp-ratio)
function shapeStage() {
  const m = map();
  if (m) stage.style.setProperty('--wp-ratio', String(MW() / MH()));
}

export function fit() {
  shapeStage();
  if (map()) {
    view.z = fitZ() * 0.97;
    view.x = (MW() - W / view.z) / 2;
    view.y = (MH() - H / view.z) / 2;
  }
  draw();
  emit('view');
}
function bound() {
  const vw = W / view.z, vh = H / view.z;
  view.x = clamp(view.x, -vw * 0.5, MW() - vw * 0.5);
  view.y = clamp(view.y, -vh * 0.5, MH() - vh * 0.5);
}
export function zoomAt(sx, sy, f) {
  const z = clamp(view.z * f, fitZ() * 0.5, maxZ()), x = view.x + sx / view.z, y = view.y + sy / view.z;
  view.z = z;
  view.x = x - sx / z;
  view.y = y - sy / z;
  bound();
  draw();
  emit('view');
}
export const zoomBy = (f) => zoomAt(W / 2, H / 2, f);
export function centreOn(x, y, z) {
  if (z) view.z = clamp(z, fitZ() * 0.5, maxZ());
  view.x = x - W / 2 / view.z;
  view.y = y - H / 2 / view.z;
  bound();
  draw();
}
export const viewCentre = () => [view.x + W / 2 / view.z, view.y + H / 2 / view.z];
export function keepView() { if (S.cur) S.views[S.cur] = { x: view.x, y: view.y, z: view.z }; }
export function showView() {
  shapeStage();
  const v = S.views[S.cur];
  if (v && sized) { Object.assign(view, v); bound(); draw(); emit('view'); } else fit();
}

function resize() {
  const r = stage.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  const [cx, cy] = viewCentre();
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  W = r.width;
  H = r.height;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  if (sized) centreOn(cx, cy);
  else { sized = true; showView(); }
  draw();
}
new ResizeObserver(resize).observe(stage);

function at(e) {
  const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  return { sx, sy, x: view.x + sx / view.z, y: view.y + sy / view.z };
}
const snapPt = (x, y) => snap(x, y, MW(), MH());

// ---------------------------------------------------------------------------------------------
// what is where

export const shapeOf = (m, kind, i) => (kind === 'front' ? m.front[i].pts : m[kind][i]);
export function pointOf(m, s) {
  if (s.kind === 'person') return m.people[s.i].at;
  if (s.kind === 'spot') return m.spots[s.i].at;
  if (s.kind === 'place') return m.places[s.i].at;
  if (s.kind === 'arrival') {
    const a = arrivalsInto(S.cur)[s.i];
    if (!a) return null;
    return a.place != null ? S.maps[a.from].places[a.place].arrive : S.maps[a.from].exits[a.exit].at;
  }
  return m.start;
}
const rectOf = (m, s) => (s.kind === 'exit' ? m.exits[s.i].rect : m.spots[s.i].rect);
export function valid(s) {
  const m = map();
  if (!s || !m) return false;
  if (isShape(s.kind)) return s.i < (s.kind === 'front' ? m.front : m[s.kind]).length && (s.sub == null || s.sub < shapeOf(m, s.kind, s.i).length);
  if (s.kind === 'exit') return s.i < m.exits.length;
  if (s.kind === 'person') return s.i < m.people.length;
  if (s.kind === 'spot') return s.i < m.spots.length;
  if (s.kind === 'arrival') return s.i < arrivalsInto(S.cur).length;
  if (s.kind === 'place') return isWorld(m) && s.i < (m.places || []).length;
  return s.kind === 'start';
}
// the maps a change to `s` touches (an arrival belongs to the map whose way out it is)
const mapsOf = (s) => (s && s.kind === 'arrival' ? [arrivalsInto(S.cur)[s.i].from] : [S.cur]);
const diamondAt = (f) => [bbox(f.pts)[2] + 14 / view.z, f.base];

function hitAt(p, touchy) {
  const m = map(), L = S.layers, r = (touchy ? 14 : 7) / view.z, r2 = r * r;
  const d2 = (q) => (q[0] - p.x) ** 2 + (q[1] - p.y) ** 2;
  const kinds = ['front', 'block', 'walk'].filter((k) => L[k]);
  const sel = S.sel;
  // the picked shape's own points, its base line, the middles of its edges
  if (sel && isShape(sel.kind) && L[sel.kind] && valid(sel)) {
    const pts = shapeOf(m, sel.kind, sel.i);
    let best = -1, bd = r2;
    pts.forEach((q, j) => { const d = d2(q); if (d <= bd) { bd = d; best = j; } });
    if (best >= 0) return { kind: sel.kind, i: sel.i, sub: best, drag: 'vertex' };
    if (sel.kind === 'front' && d2(diamondAt(m.front[sel.i])) <= r2 * 2) return { kind: 'front', i: sel.i, drag: 'base' };
    for (let j = 0; j < pts.length; j++) {
      const a = pts[j], b = pts[(j + 1) % pts.length];
      if (d2([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) <= r2) return { kind: sel.kind, i: sel.i, at: j, drag: 'insert' };
    }
  }
  // any shape's point
  let hit = null, hd = r2;
  for (const k of kinds) (k === 'front' ? m.front : m[k]).forEach((s, i) => shapeOf(m, k, i).forEach((q, j) => {
    const d = d2(q);
    if (d < hd) { hd = d; hit = { kind: k, i, sub: j, drag: 'vertex' }; }
  }));
  if (hit) return hit;
  if (L.front) for (let i = m.front.length - 1; i >= 0; i--) if (d2(diamondAt(m.front[i])) <= r2 * 2) return { kind: 'front', i, drag: 'base' };
  // dots: people, things, where people arrive, where a walk starts
  hit = null;
  hd = (r + 4 / view.z) ** 2;
  const dot = (q, h) => { const d = d2(q); if (d < hd) { hd = d; hit = h; } };
  if (L.people) {
    m.people.forEach((q, i) => dot(q.at, { kind: 'person', i }));
    m.spots.forEach((q, i) => { if (!q.rect) dot(q.at, { kind: 'spot', i }); });
  }
  if (L.exits) {
    if (isWorld(m)) (m.places || []).forEach((q, i) => dot(q.at, { kind: 'place', i }));
    arrivalsInto(S.cur).forEach((a, i) => dot(a.at, { kind: 'arrival', i }));
    dot(m.start, { kind: 'start', i: 0 });
  }
  if (hit) { hit.drag = 'point'; return hit; }
  // corners of ways out and story areas, then inside a way out
  const rects = [];
  if (L.exits) m.exits.forEach((e, i) => rects.push({ kind: 'exit', i, r: e.rect }));
  if (L.people) m.spots.forEach((s, i) => { if (s.rect) rects.push({ kind: 'spot', i, r: s.rect }); });
  for (const q of rects) {
    const c = [[q.r[0], q.r[1]], [q.r[2], q.r[1]], [q.r[2], q.r[3]], [q.r[0], q.r[3]]];
    for (let j = 0; j < 4; j++) if (d2(c[j]) <= r2) return { kind: q.kind, i: q.i, sub: j, drag: 'corner' };
  }
  if (L.exits) for (let i = m.exits.length - 1; i >= 0; i--) if (inRect(m.exits[i].rect, p.x, p.y)) return { kind: 'exit', i, drag: 'rect' };
  // inside shapes: the smallest first, walk areas last
  const under = [];
  for (const k of kinds) (k === 'front' ? m.front : m[k]).forEach((s, i) => {
    const pts = shapeOf(m, k, i);
    if (inPoly(pts, p.x, p.y)) under.push({ kind: k, i, a: area(pts) + (k === 'walk' ? 1e9 : 0) });
  });
  if (L.people) m.spots.forEach((s, i) => { if (s.rect && inRect(s.rect, p.x, p.y)) under.push({ kind: 'spot', i, a: 2e9 + (s.rect[2] - s.rect[0]) * (s.rect[3] - s.rect[1]) }); });
  if (!under.length) return null;
  under.sort((a, b) => a.a - b.a);
  const out = { kind: under[0].kind, i: under[0].i, drag: 'body' };
  const picked = under.find((u) => sel && u.kind === sel.kind && u.i === sel.i);
  if (picked && picked !== under[0]) out.picked = { kind: picked.kind, i: picked.i };
  return out;
}
const sameHit = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.i === b.i && a.sub === b.sub && a.drag === b.drag && a.at === b.at);

export function pick(s) {
  S.sel = s ? { kind: s.kind, i: s.i || 0 } : null;
  if (s && s.sub != null) S.sel.sub = s.sub;
  emit('picked');
  draw();
}

function itemCopy(h) {
  const m = map();
  if (h.kind === 'front') return JSON.parse(JSON.stringify(m.front[h.i]));
  if (isShape(h.kind)) return JSON.parse(JSON.stringify(m[h.kind][h.i]));
  return rectOf(m, h).slice();
}

// ---------------------------------------------------------------------------------------------
// fingers and the mouse

const fingers = new Map();
let act = null, pinch = null, mouse = null, spaceHeld = false, lastFinish = -1e9, lastWand = null, wanding = false;
const marks = []; // where each tap or trace of the shape being drawn began, for "Take back"

cv.addEventListener('pointerdown', (e) => {
  if (S.walking || !map()) return;
  try { cv.focus({ preventScroll: true }); cv.setPointerCapture(e.pointerId); } catch { /* old browsers */ }
  fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const p = at(e);
  mouse = p;
  if (fingers.size === 2) { startPinch(); return; }
  if (fingers.size > 2 || act) return;
  const touchy = e.pointerType === 'touch' || e.pointerType === 'pen';
  if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceHeld)) {
    e.preventDefault();
    act = { type: 'pan', id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    cursor();
    return;
  }
  if (e.button !== 0) return;
  const base = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, start: p, live: false, touchy };
  if (S.tool === 'select') startPick(p, base);
  else if (S.tool === 'place') act = Object.assign(base, { type: 'place' });
  else if (isShape(S.tool)) act = Object.assign(base, { type: S.drawBy === 'wand' ? 'wand' : 'draw', stroke: null });
  else if (S.tool === 'exit' || S.tool === 'story') act = Object.assign(base, { type: 'rect', cur: p });
  else act = Object.assign(base, { type: 'place' });
  cursor();
});

function startPick(p, base) {
  const h = hitAt(p, base.touchy), m = map();
  if (!h) { act = Object.assign(base, { type: 'empty' }); return; }
  if (h.drag === 'vertex') {
    pick(h);
    const v = shapeOf(m, h.kind, h.i)[h.sub];
    act = Object.assign(base, { type: 'vertex', h, off: [v[0] - p.x, v[1] - p.y] });
  } else if (h.drag === 'insert') {
    remember();
    const pts = shapeOf(m, h.kind, h.i), a = pts[h.at], b = pts[(h.at + 1) % pts.length];
    pts.splice(h.at + 1, 0, snapPt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
    const s = { kind: h.kind, i: h.i, sub: h.at + 1 };
    S.rev++;
    pick(s);
    act = Object.assign(base, { type: 'vertex', h: s, off: [0, 0], inserted: true, remembered: true });
    lastFinish = performance.now();
  } else if (h.drag === 'base') {
    pick({ kind: 'front', i: h.i });
    act = Object.assign(base, { type: 'base', h, off: m.front[h.i].base - p.y });
  } else if (h.drag === 'point') {
    pick(h);
    const q = pointOf(m, h);
    act = Object.assign(base, { type: 'point', h, off: [q[0] - p.x, q[1] - p.y] });
  } else if (h.drag === 'corner') {
    pick({ kind: h.kind, i: h.i });
    act = Object.assign(base, { type: 'corner', h, orig: rectOf(m, h).slice() });
  } else if (h.drag === 'rect') {
    pick(h);
    act = Object.assign(base, { type: 'move', h, orig: itemCopy(h) });
  } else if (S.sel && S.sel.kind === h.kind && S.sel.i === h.i) {
    act = Object.assign(base, { type: 'move', h, orig: itemCopy(h), clickSel: h });
  } else act = Object.assign(base, { type: 'maybe', hit: h, picked: h.picked || null });
}

cv.addEventListener('pointermove', (e) => {
  if (S.walking) return;
  if (fingers.has(e.pointerId)) fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const p = at(e);
  mouse = p;
  if (pinch) { movePinch(); return; }
  if (!act) {
    const h = S.tool === 'select' && !spaceHeld && e.pointerType === 'mouse' ? hitAt(p, false) : null;
    if (!sameHit(h, S.hover)) { S.hover = h; draw(); }
    if (S.draft || S.tool !== 'select') draw();
    cursor();
    readout();
    return;
  }
  if (act.id !== e.pointerId || act.type === 'ignore') return;
  if (act.type === 'pan') {
    view.x = act.vx - (e.clientX - act.sx) / view.z;
    view.y = act.vy - (e.clientY - act.sy) / view.z;
    bound();
    draw();
    readout();
    return;
  }
  if (Math.hypot(e.clientX - act.sx, e.clientY - act.sy) <= (act.touchy ? 8 : 3) && !act.live) return;
  if (act.type === 'empty' || act.type === 'place' || act.type === 'wand' || (act.type === 'maybe' && !act.picked)) {
    act = { type: 'pan', id: act.id, sx: act.sx, sy: act.sy, vx: act.vx, vy: act.vy };
    view.x = act.vx - (e.clientX - act.sx) / view.z;
    view.y = act.vy - (e.clientY - act.sy) / view.z;
    bound();
    draw();
    cursor();
    return;
  }
  if (act.type === 'draw') { traceTo(p); return; }
  if (act.type === 'rect') { act.cur = p; act.live = true; draw(); return; }
  if (act.type === 'maybe') { act.type = 'move'; act.h = act.picked; act.orig = itemCopy(act.picked); }
  if (!act.live) {
    act.live = true;
    if (!act.remembered) { remember(mapsOf(act.h)); act.remembered = true; }
  }
  dragTo(act, p);
  S.rev++;
  emit('moving');
  draw();
  readout();
});

function dragTo(a, p) {
  const m = map(), h = a.h, [Wm, Hm] = mapSize(m);
  if (a.type === 'vertex') shapeOf(m, h.kind, h.i)[h.sub] = snapPt(p.x + a.off[0], p.y + a.off[1]);
  else if (a.type === 'point') {
    const q = pointOf(m, h), n = snapPt(p.x + a.off[0], p.y + a.off[1]);
    q[0] = n[0];
    q[1] = n[1];
  } else if (a.type === 'base') m.front[h.i].base = clamp(Math.round(p.y + a.off), 0, Hm);
  else if (a.type === 'corner') {
    const r = rectOf(m, h), o = a.orig, x = clamp(Math.round(p.x), 0, Wm), y = clamp(Math.round(p.y), 0, Hm), c = h.sub;
    if (c === 0 || c === 3) r[0] = Math.min(x, o[2] - 4); else r[2] = Math.max(x, o[0] + 4);
    if (c === 0 || c === 1) r[1] = Math.min(y, o[3] - 4); else r[3] = Math.max(y, o[1] + 4);
  } else if (a.type === 'move') {
    let dx = Math.round(p.x - a.start.x), dy = Math.round(p.y - a.start.y);
    if (isShape(h.kind)) {
      const o = a.orig, pts = h.kind === 'front' ? o.pts : o, b = bbox(pts);
      dx = clamp(dx, -b[0], Wm - b[2]);
      dy = clamp(dy, -b[1], Hm - b[3]);
      const moved = pts.map((q) => [q[0] + dx, q[1] + dy]);
      if (h.kind === 'front') { m.front[h.i].pts = moved; m.front[h.i].base = clamp(o.base + dy, 0, Hm); } else m[h.kind][h.i] = moved;
    } else {
      const o = a.orig;
      dx = clamp(dx, -o[0], Wm - o[2]);
      dy = clamp(dy, -o[1], Hm - o[3]);
      const r = [o[0] + dx, o[1] + dy, o[2] + dx, o[3] + dy];
      if (h.kind === 'exit') m.exits[h.i].rect = r; else m.spots[h.i].rect = r;
    }
  }
}

function up(e) {
  fingers.delete(e.pointerId);
  if (pinch) {
    if (fingers.size < 2) { pinch = null; act = fingers.size ? { type: 'ignore', id: [...fingers.keys()][0] } : null; }
    return;
  }
  if (!act || act.id !== e.pointerId) return;
  const a = act;
  act = null;
  if (S.walking || !map()) return;
  const p = at(e);
  if (e.type === 'pointercancel') { callOff(a); cursor(); draw(); return; }
  switch (a.type) {
    case 'empty': pick(null); break;
    case 'maybe': pick(a.hit); break;
    case 'place': place(S.tool, a.start); break;
    case 'wand': runWand(a.start); break;
    case 'rect': makeRect(S.tool, a.live ? [a.start, a.cur] : null, a.start); break;
    case 'draw': if (a.stroke) endTrace(a, p); else tapPoint(a.start, a.touchy); break;
    case 'pan': case 'ignore': break;
    default:
      if (a.live || a.inserted) changed(a.inserted && !a.live ? 'Point added in the middle of the edge.' : '');
      else if (a.clickSel) pick(a.clickSel);
  }
  if (S.tool === 'select' && e.pointerType === 'mouse') S.hover = hitAt(p, false);
  cursor();
  draw();
  readout();
}
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);
// the pointer was taken away without being let go (the canvas hidden, the window left): call it off
cv.addEventListener('lostpointercapture', (e) => {
  if (!fingers.has(e.pointerId)) return;
  fingers.delete(e.pointerId);
  if (pinch && fingers.size < 2) pinch = null;
  if (act && act.id === e.pointerId) { const a = act; act = null; callOff(a); cursor(); draw(); }
});
cv.addEventListener('pointerleave', (e) => {
  if (!act && e.pointerType === 'mouse') { S.hover = null; mouse = null; readout(); draw(); }
});
cv.addEventListener('contextmenu', (e) => e.preventDefault());

// a second finger calls off whatever the first one started, then the two move and zoom the picture
function callOff(a) {
  if (!a) return;
  if (a.type === 'draw' && a.stroke && S.draft) {
    S.draft.length = a.stroke.from;
    if (marks.length && marks[marks.length - 1] >= S.draft.length) marks.pop();
    if (!S.draft.length) { S.draft = null; marks.length = 0; }
    emit('draft');
  } else if ((a.live || a.inserted) && a.remembered) {
    dropLast();
    S.rev++;
    emit('picked');
    changed('');
  }
}
function startPinch() {
  callOff(act);
  act = null;
  const [a, b] = [...fingers.values()];
  pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, z: view.z, vx: view.x, vy: view.y };
}
function movePinch() {
  const [a, b] = [...fingers.values()];
  if (!a || !b) return;
  const r = cv.getBoundingClientRect(), d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const fx = pinch.vx + (pinch.mx - r.left) / pinch.z, fy = pinch.vy + (pinch.my - r.top) / pinch.z;
  const z = clamp((pinch.z * d) / pinch.d, fitZ() * 0.5, maxZ());
  view.z = z;
  view.x = fx - (mx - r.left) / z;
  view.y = fy - (my - r.top) / z;
  bound();
  draw();
  emit('view');
}

cv.addEventListener('wheel', (e) => {
  if (S.walking || !map()) return;
  e.preventDefault();
  const p = at(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
  zoomAt(p.sx, p.sy, Math.exp(-clamp(dy, -400, 400) * 0.0015));
}, { passive: false });

// a double click on an edge puts a point there
cv.addEventListener('dblclick', (e) => {
  if (S.walking || !map()) return;
  if (S.draft) { finishDraft(); return; }
  if (S.tool !== 'select' || performance.now() - lastFinish < 700) return;
  const p = at(e), m = map(), L = S.layers;
  let best = null;
  const look = (k, i) => {
    const n = nearestOnEdges(shapeOf(m, k, i), p.x, p.y);
    if (n && n.d < 8 / view.z && (!best || n.d < best.d)) best = { kind: k, i, j: n.j, p: snapPt(n.p[0], n.p[1]), d: n.d };
  };
  if (S.sel && isShape(S.sel.kind) && L[S.sel.kind] && valid(S.sel)) look(S.sel.kind, S.sel.i);
  if (!best) for (const k of ['front', 'block', 'walk']) if (L[k]) (k === 'front' ? m.front : m[k]).forEach((s, i) => look(k, i));
  if (!best) return;
  const pts = shapeOf(m, best.kind, best.i), a = pts[best.j], b = pts[(best.j + 1) % pts.length];
  if ((best.p[0] === a[0] && best.p[1] === a[1]) || (best.p[0] === b[0] && best.p[1] === b[1])) { note('That is already a point. Double-click further along the edge.'); return; }
  remember();
  pts.splice(best.j + 1, 0, best.p);
  pick({ kind: best.kind, i: best.i, sub: best.j + 1 });
  changed('Point added.');
});

export function cursor() {
  let c = 'grab';
  if (S.walking) return;
  if ((act && act.type === 'pan') || (act && act.live) || pinch) c = 'grabbing';
  else if (spaceHeld) c = 'grab';
  else if (S.tool !== 'select') c = 'crosshair';
  else if (S.hover) c = S.hover.drag === 'body' ? (S.sel && S.sel.kind === S.hover.kind && S.sel.i === S.hover.i ? 'move' : 'pointer') : S.hover.drag === 'insert' ? 'copy' : 'move';
  if (cv.style.cursor !== c) cv.style.cursor = c;
}

// ---------------------------------------------------------------------------------------------
// drawing a shape by hand: tap its points, or trace round it with a finger (or both)

function tapPoint(p, touchy) {
  if (!S.draft) S.draft = [];
  if (S.draft.length >= 3) {
    const f = S.draft[0];
    if (Math.hypot((f[0] - p.x) * view.z, (f[1] - p.y) * view.z) <= (touchy ? 16 : 9)) { finishDraft(); return; }
  }
  const q = snapPt(p.x, p.y), l = S.draft[S.draft.length - 1];
  if (!l || l[0] !== q[0] || l[1] !== q[1]) { marks.push(S.draft.length); S.draft.push(q); }
  emit('draft');
  draw();
}
function traceTo(p) {
  const a = act;
  if (!a.stroke) {
    if (!S.draft) S.draft = [];
    a.stroke = { from: S.draft.length };
    marks.push(S.draft.length);
    S.draft.push(snapPt(a.start.x, a.start.y));
  }
  const l = S.draft[S.draft.length - 1];
  if (Math.hypot((p.x - l[0]) * view.z, (p.y - l[1]) * view.z) >= 4) S.draft.push(snapPt(p.x, p.y));
  a.live = true;
  draw();
  emit('draft');
}
function endTrace(a, p) {
  const kept = S.draft.slice(0, a.stroke.from), line = simplifyLine(S.draft.slice(a.stroke.from), 1.4 / view.z);
  S.draft = kept.concat(line);
  // a trace that comes back to where the shape began closes it
  const f = S.draft[0];
  if (S.draft.length >= 4 && Math.hypot((p.x - f[0]) * view.z, (p.y - f[1]) * view.z) <= 18) { finishDraft(); return; }
  emit('draft');
  draw();
}
export function takeBack() {
  if (!S.draft) return;
  const k = marks.length ? marks.pop() : S.draft.length - 1;
  S.draft.length = Math.max(0, k);
  if (!S.draft.length) { S.draft = null; marks.length = 0; }
  note(S.draft ? 'Took back the last bit.' : 'Shape cancelled.');
  emit('draft');
  draw();
}
export function cancelDraft(say) {
  if (!S.draft) return;
  S.draft = null;
  marks.length = 0;
  if (say) note('Shape cancelled.');
  emit('draft');
  draw();
}
export function finishDraft() {
  if (!S.draft) return;
  const pts = clean(S.draft.filter((q, i, a) => i === 0 || Math.hypot((q[0] - a[i - 1][0]) * view.z, (q[1] - a[i - 1][1]) * view.z) > 2));
  S.draft = null;
  marks.length = 0;
  lastFinish = performance.now();
  if (pts.length < 3 || area(pts) < 1) { note('A shape needs at least three points.'); emit('draft'); draw(); return; }
  const m = map(), kind = isShape(S.tool) ? S.tool : 'walk';
  remember();
  if (kind === 'front') m.front.push({ pts, base: Math.max(...pts.map((q) => q[1])) }); else m[kind].push(pts);
  const i = (kind === 'front' ? m.front : m[kind]).length - 1;
  setTool('select');
  S.sel = { kind, i };
  emit('picked');
  changed(cap(NOUN[kind]) + ' added.' + (kind === 'front' ? ' Its base line is at its foot: drag the diamond to move it.' : ''));
}

// ---------------------------------------------------------------------------------------------
// the magic wand

async function runWand(p) {
  const m = map(), id = S.cur, kind = S.tool;
  if (!isShape(kind)) return;
  if (!m.pic) { note('This map has no picture for the wand to look at.'); return; }
  if (wanding) return;
  wanding = true;
  emit('wand', true);
  let res;
  try { res = await wand(m.pic.key, m.size, [p.x, p.y], S.spread, kind === 'walk', m.walker); }
  catch { res = { error: 'The wand couldn’t read this picture.' }; }
  finally { wanding = false; emit('wand', false); }
  if (S.cur !== id || S.walking || S.tool !== kind || !S.maps[id]) return;
  if (res.error) { note(res.error); return; }
  // (undo can have put back a different copy of the map while the wand was looking)
  const now = S.maps[id];
  remember([id]);
  const list = kind === 'front' ? now.front : now[kind];
  list.push(kind === 'front' ? { pts: res.outer, base: bbox(res.outer)[3] } : res.outer);
  let holes = 0;
  if (kind === 'walk') for (const h of res.holes) { now.block.push(h); holes++; }
  S.sel = { kind, i: list.length - 1 };
  emit('picked');
  const big = res.share > 0.55 ? ' It spread over most of the picture: try a smaller spread.' : '';
  changed(cap(NOUN[kind]) + ' outlined (' + res.outer.length + ' points)' + (holes ? ', with ' + plural(holes, 'island', 'islands') + ' in it as blocks' : '') + '.' + big);
  lastWand = { id, kind, at: { x: p.x, y: p.y }, rev: S.rev, holes };
}
// the spread changed: the last wand outline again, wider or narrower, if nothing changed since
export function rewand() {
  if (!lastWand || lastWand.id !== S.cur || lastWand.rev !== S.rev || S.tool !== lastWand.kind || wanding) return false;
  const at = lastWand.at;
  dropLast();
  S.sel = null;
  changed('');
  runWand(at);
  return true;
}
export const wandBusy = () => wanding;
// a finger or the mouse is in the middle of something on the picture
export const busy = () => !!pinch || (!!act && act.type !== 'pan' && act.type !== 'ignore');

// ---------------------------------------------------------------------------------------------
// putting down ways out, story areas, people and things

const freeId = (taken, root) => { let n = taken.length + 1; while (taken.includes(root + '-' + n)) n++; return root + '-' + n; };

function makeRect(kind, drag, p) {
  const m = map(), h = m.walker, [Wm, Hm] = mapSize(m);
  let r;
  if (drag) {
    const [a, b] = drag;
    r = [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)];
  }
  if (!r || r[2] - r[0] < 4 || r[3] - r[1] < 4) r = [p.x - h * 0.6, p.y - h * 0.4, p.x + h * 0.6, p.y + h * 0.4];
  r = [clamp(Math.round(r[0]), 0, Wm - 4), clamp(Math.round(r[1]), 0, Hm - 4), clamp(Math.round(r[2]), 4, Wm), clamp(Math.round(r[3]), 4, Hm)];
  if (r[2] - r[0] < 4) r[2] = r[0] + 4;
  if (r[3] - r[1] < 4) r[3] = r[1] + 4;
  remember();
  if (kind === 'exit') {
    m.exits.push({ rect: r, to: '', at: null, label: '' });
    S.sel = { kind: 'exit', i: m.exits.length - 1 };
  } else {
    const n = m.spots.filter((s) => s.rect).length + 1;
    m.spots.push({ kind: 'event', id: freeId(m.spots.map((s) => s.id || ''), 'story'), label: 'Story area ' + n, rect: r });
    S.sel = { kind: 'spot', i: m.spots.length - 1 };
  }
  setTool('select');
  emit('picked');
  changed(kind === 'exit' ? 'Way out added. Say where it leads, in the panel.' : 'Story area added. Name it in the panel.');
}

function place(kind, p) {
  const m = map(), q = snapPt(p.x, p.y);
  if (kind === 'place') { putPlace(q); return; }
  remember();
  if (kind === 'person') {
    m.people.push({ id: freeId(m.people.map((x) => x.id), 'person'), name: 'Person ' + (m.people.length + 1), at: q, look: 'hooded' });
    S.sel = { kind: 'person', i: m.people.length - 1 };
  } else {
    m.spots.push({ kind: 'look', label: 'Thing ' + (m.spots.filter((s) => !s.rect).length + 1), note: '', at: q });
    S.sel = { kind: 'spot', i: m.spots.length - 1 };
  }
  setTool('select');
  emit('picked');
  changed(kind === 'person' ? 'Person added. Name them in the panel.' : 'Thing added. Say what it is in the panel.');
}

// a place on the world map: for the map picked in the panel's list (with a way back made on that
// map), or a new one to say where it leads
function putPlace(q) {
  const m = map();
  if (!isWorld(m)) return;
  const target = S.placeFor && S.maps[S.placeFor] && S.placeFor !== S.cur ? S.placeFor : null;
  S.placeFor = null;
  if (target) {
    const i = putOnWorld(S.cur, target, q);
    S.sel = { kind: 'place', i };
    setTool('select');
    emit('picked');
    changed(mapName(target) + ' is on the world map. Its way out back here is on ' + mapName(target) + ' (blue): move it to where she should leave.');
    return;
  }
  remember();
  if (!Array.isArray(m.places)) m.places = [];
  const taken = new Set(m.places.map((x) => x.id));
  let n = m.places.length + 1;
  while (taken.has('place-' + n)) n++;
  m.places.push({ id: 'place-' + n, name: 'Place ' + n, at: q, to: '', arrive: null });
  S.sel = { kind: 'place', i: m.places.length - 1 };
  setTool('select');
  emit('picked');
  changed('Place added. Say which map it leads into, in the panel.');
}

// ---------------------------------------------------------------------------------------------
// tools and the picked thing

export function setTool(t) {
  if (S.draft && t !== S.tool) { S.draft = null; marks.length = 0; }
  S.tool = t;
  if (t !== 'place') S.placeFor = null;
  if (t !== 'select') {
    S.sel = null;
    S.hover = null;
    const layer = isShape(t) ? t : t === 'exit' || t === 'place' ? 'exits' : 'people';
    if (!S.layers[layer]) { S.layers[layer] = true; emit('layers'); }
  }
  emit('tool');
  cursor();
  draw();
}

export function deletePicked() {
  const m = map(), s = S.sel;
  if (!s || !valid(s)) { note('Pick a point, a shape or a thing first.'); return; }
  if (s.kind === 'start' || s.kind === 'arrival') { note(s.kind === 'start' ? 'Every map needs a place where a walk starts: drag it instead.' : 'This is where someone arrives from another map. Delete that map’s way out to get rid of it.'); return; }
  if (isShape(s.kind) && s.sub != null) {
    const pts = shapeOf(m, s.kind, s.i);
    if (pts.length <= 3) { note('A shape needs at least three points. To delete the whole shape, tap inside it, then Delete.'); return; }
    remember();
    pts.splice(s.sub, 1);
    pick({ kind: s.kind, i: s.i });
    changed('Point deleted.');
    return;
  }
  remember();
  let what;
  if (isShape(s.kind)) { (s.kind === 'front' ? m.front : m[s.kind]).splice(s.i, 1); what = NOUN[s.kind]; }
  else if (s.kind === 'exit') { m.exits.splice(s.i, 1); what = 'way out'; }
  else if (s.kind === 'person') { what = m.people[s.i].name || 'person'; m.people.splice(s.i, 1); }
  else if (s.kind === 'place') { what = 'the place “' + (m.places[s.i].name || m.places[s.i].id) + '”'; m.places.splice(s.i, 1); }
  else { what = m.spots[s.i].rect ? 'story area' : 'thing'; m.spots.splice(s.i, 1); }
  pick(null);
  changed(cap(what) + ' deleted. Undo brings it back.');
}

export function smoothPicked() {
  const m = map(), s = S.sel;
  if (!s || !isShape(s.kind) || !valid(s)) { note('Pick a walk area, a block or a front first.'); return; }
  const pts = shapeOf(m, s.kind, s.i), only = s.sub != null ? s.sub : -1, [Wm, Hm] = mapSize(m);
  if (only >= 0 && onEdge(pts[only], Wm, Hm)) { note('Points on the picture’s edge stay where they are, so the ways out keep their width.'); return; }
  const out = smooth(pts, only, Wm, Hm);
  if (JSON.stringify(out) === JSON.stringify(pts)) { note('There is nothing to round there.'); return; }
  remember();
  if (s.kind === 'front') m.front[s.i].pts = out; else m[s.kind][s.i] = out;
  if (only >= 0) { pick({ kind: s.kind, i: s.i, sub: Math.min(only + 1, out.length - 1) }); changed('Corner rounded.'); }
  else { pick({ kind: s.kind, i: s.i }); changed('Smoothed: ' + pts.length + ' points became ' + out.length + '.'); }
}

export function fewerPicked() {
  const m = map(), s = S.sel;
  if (!s || !isShape(s.kind) || !valid(s)) { note('Pick a walk area, a block or a front first.'); return; }
  const pts = shapeOf(m, s.kind, s.i), [Wm, Hm] = mapSize(m);
  const out = simplify(pts, Math.max(1.5, m.walker * 0.05), (q) => onEdge(q, Wm, Hm));
  if (out.length >= pts.length) { note('Every point there counts: none came out.'); return; }
  remember();
  if (s.kind === 'front') m.front[s.i].pts = out; else m[s.kind][s.i] = out;
  pick({ kind: s.kind, i: s.i });
  changed(pts.length + ' points became ' + out.length + '.');
}

// Shift + arrows move the picked thing a pixel at a time (one undo step for a run of them)
let nudgeT = 0, nudgeKey = '', nudgeRev = -1;
function nudge(dx, dy) {
  const m = map(), s = S.sel;
  if (!s || !valid(s)) return;
  const [Wm, Hm] = mapSize(m), key = JSON.stringify(s) + S.cur, now = performance.now();
  const fits = (r) => r[0] + dx >= 0 && r[2] + dx <= Wm && r[1] + dy >= 0 && r[3] + dy <= Hm;
  let move;
  if (isShape(s.kind) && s.sub != null) move = () => { const q = shapeOf(m, s.kind, s.i)[s.sub], n = snapPt(q[0] + dx, q[1] + dy); q[0] = n[0]; q[1] = n[1]; };
  else if (isShape(s.kind)) {
    const pts = shapeOf(m, s.kind, s.i);
    if (!fits(bbox(pts))) return;
    move = () => { pts.forEach((q) => { q[0] += dx; q[1] += dy; }); if (s.kind === 'front') m.front[s.i].base = clamp(m.front[s.i].base + dy, 0, Hm); };
  } else if (s.kind === 'exit' || (s.kind === 'spot' && m.spots[s.i].rect)) {
    const r = rectOf(m, s);
    if (!fits(r)) return;
    move = () => { r[0] += dx; r[2] += dx; r[1] += dy; r[3] += dy; };
  } else move = () => { const q = pointOf(m, s), n = snapPt(q[0] + dx, q[1] + dy); q[0] = n[0]; q[1] = n[1]; };
  if (now - nudgeT > 800 || key !== nudgeKey || S.rev !== nudgeRev) remember(mapsOf(s));
  nudgeT = now;
  nudgeKey = key;
  move();
  changed('');
  nudgeRev = S.rev;
}

// ---------------------------------------------------------------------------------------------
// keys

const held = new Set(), ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
window.addEventListener('keydown', (e) => {
  if ($('wp-dialog').hidden === false || $('wp-shrink').hidden === false) return; // a question is open
  if (e.key === 'F2') { e.preventDefault(); emit('walk'); return; }
  if (S.walking) return;
  const t = e.target && e.target.tagName;
  if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
  const ctrl = e.ctrlKey || e.metaKey, k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (busy() && (ctrl || k === 'Delete' || k === 'Backspace' || k === 'Enter' || (e.shiftKey && ARROWS[k]))) { e.preventDefault(); return; }
  if (ctrl && k === 'z') { e.preventDefault(); emit(e.shiftKey ? 'redo' : 'undo'); return; }
  if (ctrl && k === 'y') { e.preventDefault(); emit('redo'); return; }
  if (ctrl || e.altKey || !map()) return;
  if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); if (S.draft) takeBack(); else deletePicked(); return; }
  if (k === 'Enter') { if (S.draft) { e.preventDefault(); finishDraft(); } return; }
  if (k === 'Escape') {
    e.preventDefault();
    if (S.draft) cancelDraft(true);
    else if (S.tool !== 'select') setTool('select');
    else if (S.sel) pick(null);
    return;
  }
  if (k === ' ') {
    if (t === 'BUTTON' || t === 'A') return;
    e.preventDefault();
    if (!spaceHeld) { spaceHeld = true; S.hover = null; cursor(); }
    return;
  }
  if (ARROWS[k]) {
    e.preventDefault();
    if (e.shiftKey && S.sel) nudge(ARROWS[k][0], ARROWS[k][1]);
    else { held.add(k); glide(); }
    return;
  }
  if (k === '+' || k === '=') zoomBy(1.25);
  else if (k === '-' || k === '_') zoomBy(0.8);
  else if (k === '0') fit();
});
window.addEventListener('keyup', (e) => {
  if (e.key === ' ') { spaceHeld = false; cursor(); }
  held.delete(e.key);
});
window.addEventListener('blur', () => { held.clear(); spaceHeld = false; });
let gliding = false;
function glide() {
  if (gliding) return;
  gliding = true;
  let last = performance.now();
  requestAnimationFrame(function step(now) {
    if (!held.size || S.walking) { gliding = false; return; }
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    let dx = 0, dy = 0;
    for (const k of held) { dx += ARROWS[k][0]; dy += ARROWS[k][1]; }
    view.x += (dx * 720 * dt) / view.z;
    view.y += (dy * 720 * dt) / view.z;
    bound();
    draw();
    readout();
    requestAnimationFrame(step);
  });
}

// ---------------------------------------------------------------------------------------------
// the line at the bottom of the picture: where the pointer is, and whether she could stand there

export function readout() {
  const box = $('wp-readout'), m = map();
  if (S.walking || !m || !mouse || mouse.x < 0 || mouse.y < 0 || mouse.x > MW() || mouse.y > MH()) { box.hidden = true; return; }
  const x = Math.round(mouse.x), y = Math.round(mouse.y), ok = canStand(x, y);
  box.hidden = false;
  box.innerHTML = 'x <b>' + x + '</b> · y <b>' + y + '</b> · ' + (ok ? '<span class="ok">she can stand here</span>' : '<span class="no">she can’t stand here</span>') + ' · ' + Math.round(view.z * 100) + '%';
}

let noteT = 0;
export function note(text) {
  if (!text) return;
  const n = $('wp-note');
  n.textContent = text;
  n.hidden = false;
  clearTimeout(noteT);
  noteT = setTimeout(() => { n.hidden = true; }, 3200);
}

// ---------------------------------------------------------------------------------------------
// drawing it all

let queued = false;
export function draw() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(paint);
}

let ioSheet = null;
const walkerSheet = () => {
  if (ioSheet === null) { try { ioSheet = window.makePixelIo ? window.makePixelIo(1) : false; } catch { ioSheet = false; } }
  return ioSheet;
};

function paint() {
  queued = false;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = C.deep;
  g.fillRect(0, 0, W, H);
  const m = map();
  if (!m || S.walking) return;
  const z = view.z, L = S.layers, sx = (x) => (x - view.x) * z, sy = (y) => (y - view.y) * z, [Wm, Hm] = mapSize(m);
  // the picture
  const img = m.pic ? pictureImage(m.pic.key, draw) : null;
  if (img && img.complete && img.naturalWidth) {
    g.imageSmoothingEnabled = (z * Wm) / img.naturalWidth < 2.5;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, sx(0), sy(0), Wm * z, Hm * z);
  } else {
    g.fillStyle = '#16122c';
    g.fillRect(sx(0), sy(0), Wm * z, Hm * z);
    g.strokeStyle = 'rgba(214,222,255,0.07)';
    g.lineWidth = 1;
    const step = Math.max(16, 64 * z);
    for (let x = sx(0); x < sx(Wm); x += step) { g.beginPath(); g.moveTo(x, sy(0)); g.lineTo(x, sy(Hm)); g.stroke(); }
    for (let y = sy(0); y < sy(Hm); y += step) { g.beginPath(); g.moveTo(sx(0), y); g.lineTo(sx(Wm), y); g.stroke(); }
    text(img && img.failed ? 'This picture won’t show in this browser.' : m.pic ? 'The picture is loading…' : 'No picture yet: add one under Maps.', sx(Wm / 2) - 110, sy(Hm / 2), '#eeedfb');
  }
  g.strokeStyle = 'rgba(214,222,255,0.28)';
  g.lineWidth = 1;
  g.strokeRect(sx(0) - 0.5, sy(0) - 0.5, Wm * z + 1, Hm * z + 1);

  const reach = L.reach ? reachNow() : null;
  if (reach) paintReach(reach, sx, sy, z);
  const labels = [];
  const path = (pts) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(sx(q[0]), sy(q[1])) : g.moveTo(sx(q[0]), sy(q[1])))); g.closePath(); };
  const isSel = (k, i) => !!S.sel && S.sel.kind === k && S.sel.i === i;
  const isHov = (k, i) => !!S.hover && S.hover.kind === k && S.hover.i === i;
  const shape = (pts, col, a, k, i, dashed) => {
    path(pts);
    g.fillStyle = rgba(col, isSel(k, i) ? a + 0.12 : isHov(k, i) ? a + 0.07 : a);
    g.fill();
    g.setLineDash(dashed ? [6, 4] : []);
    if (isSel(k, i)) {
      g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.stroke();
      g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.stroke();
    } else { g.lineWidth = isHov(k, i) ? 2.4 : 1.4; g.strokeStyle = rgba(col, 0.92); g.stroke(); }
    g.setLineDash([]);
  };
  if (L.walk) m.walk.forEach((pts, i) => shape(pts, C.walk, reach ? 0.05 : 0.14, 'walk', i));
  if (L.block) m.block.forEach((pts, i) => shape(pts, C.block, 0.26, 'block', i));
  if (L.front) m.front.forEach((f, i) => {
    shape(f.pts, C.front, 0.1, 'front', i, true);
    const b = bbox(f.pts), y = sy(f.base), d = diamondAt(f), hot = isSel('front', i) || (S.hover && S.hover.kind === 'front' && S.hover.i === i && S.hover.drag === 'base');
    g.strokeStyle = rgba(C.front, 0.95);
    g.lineWidth = hot ? 2.2 : 1.3;
    g.beginPath(); g.moveTo(sx(b[0]) - 4, y); g.lineTo(sx(d[0]), y); g.stroke();
    diamond(sx(d[0]), y, hot ? 6.5 : 4.5, hot ? '#ffffff' : C.front);
  });
  if (L.exits) m.exits.forEach((e, i) => {
    const r = e.rect, on = isSel('exit', i), hv = isHov('exit', i);
    g.fillStyle = rgba(C.exit, on ? 0.42 : hv ? 0.34 : 0.26);
    g.fillRect(sx(r[0]), sy(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
    g.lineWidth = on ? 2.2 : 1.6;
    g.strokeStyle = on ? '#ffffff' : C.exit;
    g.strokeRect(sx(r[0]), sy(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
    if (on) handles(r, sx, sy);
    const x0 = sx(r[0]), y0 = sy(r[1]), x1 = sx(r[2]), y1 = sy(r[3]);
    let where = e.to ? (S.maps[e.to] ? mapName(e.to) : e.to + ' (not here)') : 'nowhere yet';
    if (isWorld(S.maps[e.to])) { const pl = (S.maps[e.to].places || []).find((x) => x.id === e.at); where = mapName(e.to) + (pl ? ' (' + pl.name + ')' : ''); }
    else if (e.label && S.maps[e.to]) where = e.label;
    labels.push({ text: '→ ' + where, color: C.exit, pri: on || hv ? 0 : 2, ax: (x0 + x1) / 2, ay: (y0 + y1) / 2,
      cands: (w) => [[x0, y1 + 3], [x0, y0 - 19], [x1 - w, y1 + 3], [x1 - w, y0 - 19], [x0 - w - 4, y0], [x1 + 4, y0], [x0 + 3, y0 + 3]] });
  });
  if (L.people) m.spots.forEach((s, i) => {
    if (!s.rect) return;
    const r = s.rect, on = isSel('spot', i);
    g.setLineDash([7, 5]);
    g.lineWidth = on ? 2.2 : 1.4;
    g.strokeStyle = on ? '#ffffff' : rgba(C.story, 0.9);
    g.fillStyle = rgba(C.story, on ? 0.12 : 0.05);
    g.fillRect(sx(r[0]), sy(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
    g.strokeRect(sx(r[0]), sy(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
    g.setLineDash([]);
    if (on) handles(r, sx, sy);
    const x0 = sx(r[0]), y0 = sy(r[1]), y1 = sy(r[3]);
    labels.push({ text: 'story: ' + (s.label || s.id || ''), color: C.story, pri: on ? 0 : 4, ax: x0, ay: y0, cands: () => [[x0 + 6, y0 + 6], [x0 + 6, y1 - 22], [x0, y0 - 19], [x0, y1 + 3]] });
  });
  // every shape's points, small, when close enough to see them
  if (z >= 0.42) for (const k of SHAPES) if (L[k]) (k === 'front' ? m.front : m[k]).forEach((s, i) => {
    if (isSel(k, i)) return;
    for (const q of shapeOf(m, k, i)) {
      const x = sx(q[0]), y = sy(q[1]);
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x - 2.5, y - 2.5, 5, 5);
      g.fillStyle = C[k]; g.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  });
  // the picked shape: its points, and the middles of its edges to pull new points from
  if (S.sel && isShape(S.sel.kind) && L[S.sel.kind] && valid(S.sel)) {
    const pts = shapeOf(m, S.sel.kind, S.sel.i);
    pts.forEach((q, j) => {
      const n = pts[(j + 1) % pts.length], hot = S.hover && S.hover.drag === 'insert' && S.hover.at === j;
      g.fillStyle = hot ? C.gold : 'rgba(255,255,255,0.8)';
      g.beginPath(); g.arc(sx((q[0] + n[0]) / 2), sy((q[1] + n[1]) / 2), hot ? 4 : 2.6, 0, Math.PI * 2); g.fill();
    });
    pts.forEach((q, j) => {
      const on = S.sel.sub === j, hot = S.hover && S.hover.drag === 'vertex' && S.hover.kind === S.sel.kind && S.hover.i === S.sel.i && S.hover.sub === j, s = on ? 10 : hot ? 9 : 7;
      g.fillStyle = '#000000'; g.fillRect(sx(q[0]) - s / 2 - 1, sy(q[1]) - s / 2 - 1, s + 2, s + 2);
      g.fillStyle = on ? C.gold : '#ffffff'; g.fillRect(sx(q[0]) - s / 2, sy(q[1]) - s / 2, s, s);
    });
  }
  if (S.hover && S.hover.drag === 'vertex' && valid(S.hover) && !(S.sel && S.sel.kind === S.hover.kind && S.sel.i === S.hover.i)) {
    const q = shapeOf(m, S.hover.kind, S.hover.i)[S.hover.sub];
    if (q) { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(sx(q[0]) - 5, sy(q[1]) - 5, 10, 10); }
  }
  // where people arrive, and where a walk starts (with someone standing there, to show how big people are)
  if (L.exits && isWorld(m)) (m.places || []).forEach((q, i) => flag(q, isSel('place', i), isHov('place', i), sx, sy, labels));
  if (L.exits) {
    arrivalsInto(S.cur).forEach((a, i) => ring(a.at, C.arrive, isSel('arrival', i), isHov('arrival', i), z >= 0.5 || isSel('arrival', i) || isHov('arrival', i) ? (a.place != null ? 'from the world map' : 'from ' + mapName(a.from)) : '', sx, sy, labels));
    const sheet = walkerSheet(), st = m.start;
    if (sheet) {
      const k = (m.walker * z) / 42, [fx, fy] = sheet.frame('s', 0);
      g.globalAlpha = 0.9;
      g.imageSmoothingEnabled = false;
      g.drawImage(sheet.canvas, fx, fy, sheet.w, sheet.h, sx(st[0]) - sheet.foot[0] * k, sy(st[1]) - (sheet.foot[1] + 1) * k, sheet.w * k, sheet.h * k);
      g.globalAlpha = 1;
    }
    ring(st, '#ffffff', isSel('start', 0), isHov('start', 0), z >= 0.5 || isSel('start', 0) || isHov('start', 0) ? 'a walk starts here' : '', sx, sy, labels);
  }
  if (L.people) {
    m.people.forEach((p, i) => dot(p.at, isSel('person', i), isHov('person', i), p.name || 'someone', false, sx, sy, labels));
    m.spots.forEach((s, i) => { if (!s.rect) dot(s.at, isSel('spot', i), isHov('spot', i), s.label || s.kind, true, sx, sy, labels); });
  }
  // the shape being drawn
  if (S.draft) {
    const col = C[S.tool] || '#ffffff';
    g.strokeStyle = col;
    g.lineWidth = 2;
    g.beginPath();
    S.draft.forEach((q, i) => (i ? g.lineTo(sx(q[0]), sy(q[1])) : g.moveTo(sx(q[0]), sy(q[1]))));
    if (mouse && !(act && act.stroke)) g.lineTo(mouse.sx, mouse.sy);
    g.stroke();
    const few = S.draft.length < 80;
    S.draft.forEach((q, i) => {
      const first = i === 0 && S.draft.length >= 3, s = first ? 11 : 7;
      if (!first && !few && i !== S.draft.length - 1) return;
      g.fillStyle = '#000000'; g.fillRect(sx(q[0]) - s / 2 - 1, sy(q[1]) - s / 2 - 1, s + 2, s + 2);
      g.fillStyle = first ? C.gold : col; g.fillRect(sx(q[0]) - s / 2, sy(q[1]) - s / 2, s, s);
    });
  }
  // a way out or story area being pulled out
  if (act && act.type === 'rect' && act.live) {
    const a = act.start, b = act.cur, col = S.tool === 'exit' ? C.exit : C.story;
    g.setLineDash([6, 4]);
    g.strokeStyle = col;
    g.lineWidth = 2;
    g.strokeRect(sx(Math.min(a.x, b.x)), sy(Math.min(a.y, b.y)), Math.abs(b.x - a.x) * z, Math.abs(b.y - a.y) * z);
    g.setLineDash([]);
  }
  // where she stood when the last walk on this map ended
  const io = S.lastWalk[S.cur];
  if (io) {
    const x = sx(io[0]), y = sy(io[1]);
    g.fillStyle = '#1a0c1d'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.io; g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill();
    labels.push({ text: 'she stopped here', color: C.io, pri: 1, ax: x, ay: y, dot: true, cands: around(x, y) });
  }
  if (reach) for (const pr of reach.problems) {
    g.strokeStyle = '#000000'; g.lineWidth = 5;
    g.beginPath(); g.arc(sx(pr.at[0]), sy(pr.at[1]), 15, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = C.problem; g.lineWidth = 2.5; g.stroke();
  }
  placeLabels(labels);
}

function paintReach(R, sx, sy, z) {
  const G = R.grid, c = G.c, s = c * z;
  for (let k = 0; k < G.open.length; k++) {
    if (!G.open[k]) continue;
    const x = sx((k % G.gw) * c), y = sy(Math.floor(k / G.gw) * c);
    if (x > W || y > H || x + s < 0 || y + s < 0) continue;
    if (R.seen[k]) { g.fillStyle = rgba(C.reach, 0.55); g.fillRect(x + s / 2 - 1, y + s / 2 - 1, 2, 2); }
    else { g.fillStyle = rgba(C.island, 0.72); g.fillRect(x + 0.5, y + 0.5, Math.max(1, s - 1), Math.max(1, s - 1)); }
  }
}

const FONT = '600 12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const around = (x, y) => (w) => [[x + 11, y - 8], [x - 11 - w, y - 8], [x + 11, y + 6], [x - 11 - w, y + 6], [x + 11, y - 22], [x - 11 - w, y - 22], [x - w / 2, y + 10], [x - w / 2, y - 26]];
// names beside things, kept from covering each other (the nearest free place of a few tried)
function placeLabels(list) {
  g.font = FONT;
  const merged = [];
  for (const l of list) {
    const same = l.dot && merged.find((o) => o.dot && Math.abs(o.ax - l.ax) < 3 && Math.abs(o.ay - l.ay) < 3);
    if (same) { same.parts.push({ text: l.text, color: l.color }); same.pri = Math.min(same.pri, l.pri); }
    else merged.push(Object.assign({}, l, { parts: [{ text: l.text, color: l.color }] }));
  }
  merged.sort((a, b) => a.pri - b.pri);
  const used = [], free = (r) => !used.some((u) => r[0] < u[0] + u[2] && r[0] + r[2] > u[0] && r[1] < u[1] + u[3] && r[1] + r[3] > u[1]);
  const sep = ' · ', sw = g.measureText(sep).width;
  for (const l of merged) {
    if (l.ax < -40 || l.ay < -40 || l.ax > W + 40 || l.ay > H + 40) continue;
    const ws = l.parts.map((p) => g.measureText(p.text).width), w = ws.reduce((a, b) => a + b, 0) + sw * (l.parts.length - 1) + 6, cands = l.cands(w);
    let box = null;
    for (const [x, y] of cands) { const r = [x, y, w, 16]; if (x >= 2 && y >= 2 && x + w <= W - 2 && y + 16 <= H - 2 && free(r)) { box = r; break; } }
    if (!box) box = [clamp(cands[0][0], 2, Math.max(2, W - w - 2)), clamp(cands[0][1], 2, Math.max(2, H - 18)), w, 16];
    used.push(box);
    g.fillStyle = 'rgba(8,6,20,0.8)';
    g.fillRect(box[0], box[1], box[2], box[3]);
    let x = box[0] + 3;
    l.parts.forEach((p, i) => {
      if (i) { g.fillStyle = 'rgba(214,222,255,0.55)'; g.fillText(sep, x, box[1] + 12); x += sw; }
      g.fillStyle = p.color;
      g.fillText(p.text, x, box[1] + 12);
      x += ws[i];
    });
  }
}
function text(t, x, y, col) {
  g.font = FONT;
  const w = g.measureText(t).width;
  g.fillStyle = 'rgba(8,6,20,0.78)';
  g.fillRect(x - 3, y - 12, w + 6, 16);
  g.fillStyle = col;
  g.fillText(t, x, y);
}
function diamond(x, y, s, col) {
  g.beginPath(); g.moveTo(x, y - s - 1.5); g.lineTo(x + s + 1.5, y); g.lineTo(x, y + s + 1.5); g.lineTo(x - s - 1.5, y); g.closePath();
  g.fillStyle = '#000000'; g.fill();
  g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath();
  g.fillStyle = col; g.fill();
}
function handles(r, sx, sy) {
  for (const [x, y] of [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]) {
    g.fillStyle = '#000000'; g.fillRect(sx(x) - 5, sy(y) - 5, 10, 10);
    g.fillStyle = '#ffffff'; g.fillRect(sx(x) - 4, sy(y) - 4, 8, 8);
  }
}
// a place on the world map: a gold flag, its name, and where it leads
function flag(q, on, hov, sx, sy, labels) {
  const x = sx(q.at[0]), y = sy(q.at[1]), s = on || hov ? 1.25 : 1;
  g.lineWidth = 2;
  g.strokeStyle = '#000000';
  g.fillStyle = on ? '#ffffff' : C.gold;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 26 * s); g.stroke();
  g.beginPath(); g.moveTo(x, y - 26 * s); g.lineTo(x + 16 * s, y - 20 * s); g.lineTo(x, y - 14 * s); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.arc(x, y, 4 * s, 0, Math.PI * 2); g.fill(); g.stroke();
  const to = q.to && S.maps[q.to] ? '' : q.to ? ' (' + q.to + ', not here)' : ' (leads nowhere yet)';
  labels.push({ text: q.name + to, color: C.gold, pri: on || hov ? 0 : 1, ax: x, ay: y, dot: true, cands: around(x + 8, y - 18) });
}
function ring(p, col, on, hov, label, sx, sy, labels) {
  const x = sx(p[0]), y = sy(p[1]);
  g.lineWidth = 4.5; g.strokeStyle = '#000000';
  g.beginPath(); g.arc(x, y, on || hov ? 8 : 6.5, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2.5; g.strokeStyle = on ? '#ffffff' : col; g.stroke();
  g.fillStyle = on ? '#ffffff' : col;
  g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill();
  if (label) labels.push({ text: label, color: col, pri: on || hov ? 0 : 3, ax: x, ay: y, dot: true, cands: around(x, y) });
}
function dot(p, on, hov, label, square, sx, sy, labels) {
  const x = sx(p[0]), y = sy(p[1]), s = on || hov ? 7 : 5.5, col = square ? C.thing : C.people;
  g.fillStyle = '#000000';
  g.beginPath();
  if (square) g.rect(x - s - 1.5, y - s - 1.5, 2 * s + 3, 2 * s + 3); else g.arc(x, y, s + 1.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = on ? '#ffffff' : col;
  g.beginPath();
  if (square) g.rect(x - s, y - s, 2 * s, 2 * s); else g.arc(x, y, s, 0, Math.PI * 2);
  g.fill();
  labels.push({ text: label, color: col, pri: on || hov ? 0 : 1, ax: x, ay: y, dot: true, cands: around(x, y) });
}

on('changed', () => draw());
on('reach', () => draw());
