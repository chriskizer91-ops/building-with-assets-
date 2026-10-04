// The set of maps: making a map from a picture, reading maps files, writing them, names, sizes,
// keeping the work in the browser.

import { S, changed, remember, mapSize, emit } from './state.js';
import * as store from './store.js';
import * as pics from './pictures.js';
import { clone, isPt, isRect, slug, niceName, extFor, dataURLToBlob, clamp } from './util.js';
import { bbox, scalePts } from './geom.js';

// the maps file's own fields, in the order they are written
const KNOWN = ['name', 'kind', 'src', 'size', 'walker', 'zoom', 'pace', 'start', 'walk', 'block', 'front', 'exits', 'people', 'spots', 'places'];

// on a walk: how close the camera is (Envoi's numbers, 0.7 is normal) and how fast she walks
// (her own heights a second)
export const ZOOM = 0.7, PACE = 1.7;
const INTERNAL = new Set(['pic', 'example', 'wantPicture']);

// how tall someone walking is, in map pixels: Envoi's Io is 52 on a 1024-pixel-high painting
export const defaultWalker = (w, h) => Math.max(8, Math.round((Math.min(w, h) * 52) / 1024));

// a key for a new map, made from its name ("The Old Mill" -> "the-old-mill", "the-old-mill-2", ...)
export function uniqueId(base, except) {
  const root = slug(base) || 'map';
  let id = root, n = 2;
  while (S.maps[id] && id !== except) id = root + '-' + n++;
  return id;
}

export function mapName(id) {
  if (S.maps[id]) return S.maps[id].name || id;
  return String(id || '');
}

export function blankMap(name, w, h) {
  return {
    name, size: [w, h], walker: defaultWalker(w, h), start: [Math.round(w / 2), Math.round(h * 0.6)],
    walk: [], block: [], front: [], exits: [], people: [], spots: [], pic: null,
  };
}

// ---------------------------------------------------------------------------------------------
// reading a map from a maps file (or a game's MAPS), keeping whatever else it has

export function normalizeMap(raw, size) {
  const [W, H] = size;
  const pt = (p) => [clamp(Math.round(p[0]), 0, W), clamp(Math.round(p[1]), 0, H)];
  const list = (v) => (Array.isArray(v) ? v : []);
  const shape = (a) => (Array.isArray(a) ? a.filter(isPt).map(pt) : []);
  const shapes = (v) => list(v).map(shape).filter((a) => a.length >= 3);
  const m = {};
  for (const k of Object.keys(raw)) if (!KNOWN.includes(k) && !INTERNAL.has(k)) m[k] = clone(raw[k]);
  m.name = String(raw.name || '').slice(0, 80) || 'Map';
  if (raw.kind != null) m.kind = String(raw.kind);
  m.size = [W, H];
  m.walker = Number.isFinite(raw.walker) && raw.walker >= 4 ? Math.round(raw.walker) : defaultWalker(W, H);
  if (Number.isFinite(raw.zoom) && raw.zoom > 0) m.zoom = clamp(raw.zoom, 0.05, 20);
  if (Number.isFinite(raw.pace) && raw.pace > 0) m.pace = clamp(raw.pace, 0.1, 40);
  m.start = isPt(raw.start) ? pt(raw.start) : [Math.round(W / 2), Math.round(H / 2)];
  m.walk = shapes(raw.walk);
  m.block = shapes(raw.block);
  m.front = list(raw.front).map((f) => {
    if (!f || typeof f !== 'object') return null;
    const pts = shape(f.pts);
    if (pts.length < 3) return null;
    return Object.assign(clone(f), { pts, base: Number.isFinite(f.base) ? clamp(Math.round(f.base), 0, H) : bbox(pts)[3] });
  }).filter(Boolean);
  m.exits = list(raw.exits).filter((e) => e && isRect(e.rect)).map((e) => Object.assign(clone(e), {
    rect: [clamp(Math.round(Math.min(e.rect[0], e.rect[2])), 0, W), clamp(Math.round(Math.min(e.rect[1], e.rect[3])), 0, H), clamp(Math.round(Math.max(e.rect[0], e.rect[2])), 0, W), clamp(Math.round(Math.max(e.rect[1], e.rect[3])), 0, H)],
    to: e.to == null ? '' : String(e.to),
    at: isPt(e.at) ? [Math.round(e.at[0]), Math.round(e.at[1])] : e.at == null ? null : clone(e.at),
    label: e.label == null ? '' : String(e.label),
  }));
  m.people = list(raw.people).filter((p) => p && isPt(p.at)).map((p, i) => Object.assign(clone(p), {
    id: String(p.id || slug(p.name) || 'person-' + (i + 1)), name: String(p.name || p.id || 'Someone'), at: pt(p.at),
  }));
  m.spots = list(raw.spots).filter((s) => s && (isRect(s.rect) || isPt(s.at))).map((s) => {
    const o = clone(s);
    o.kind = String(s.kind || (isRect(s.rect) ? 'event' : 'look'));
    if (isRect(s.rect)) { o.rect = [Math.round(s.rect[0]), Math.round(s.rect[1]), Math.round(s.rect[2]), Math.round(s.rect[3])]; delete o.at; }
    else { o.at = pt(s.at); delete o.rect; }
    return o;
  });
  // a world map's places: { id, name, at (here), to (a map), arrive (where she arrives on it) }
  if (Array.isArray(raw.places)) m.places = raw.places.filter((p) => p && isPt(p.at)).map((p, i) => Object.assign(clone(p), {
    id: String(p.id || slug(p.name) || 'place-' + (i + 1)), name: String(p.name || p.id || 'A place'), at: pt(p.at),
    to: p.to == null ? '' : String(p.to), arrive: isPt(p.arrive) ? [Math.round(p.arrive[0]), Math.round(p.arrive[1])] : null,
  }));
  return m;
}

// a map in the maps file's shape; `src` is where its picture is (left out when undefined)
export function fileMap(m, src) {
  const o = { name: m.name };
  if (m.kind !== undefined) o.kind = m.kind;
  if (src !== undefined) o.src = src;
  o.size = m.size.slice();
  o.walker = m.walker;
  if (m.zoom !== undefined) o.zoom = m.zoom;
  if (m.pace !== undefined) o.pace = m.pace;
  o.start = m.start.slice();
  o.walk = clone(m.walk);
  o.block = clone(m.block);
  o.front = clone(m.front);
  o.exits = clone(m.exits);
  o.people = clone(m.people);
  o.spots = clone(m.spots);
  if (m.places) o.places = clone(m.places);
  for (const k of Object.keys(m)) if (!(k in o) && !INTERNAL.has(k)) o[k] = clone(m[k]);
  return o;
}

// the picture's file name in a maps file without pictures inside
export function pictureFileName(id) {
  const m = S.maps[id];
  if (!m || !m.pic) return null;
  return id + '.' + extFor(m.pic.type, m.pic.file);
}

// where people come into map `id`: from the ways out of every map, and from the world map's places
export function arrivalsInto(id) {
  const out = [];
  for (const from of S.order) (S.maps[from].exits || []).forEach((e, exit) => {
    if (e.to === id && isPt(e.at)) out.push({ from, exit, at: e.at });
  });
  for (const from of worldIds()) (S.maps[from].places || []).forEach((p, place) => {
    if (p.to === id && isPt(p.arrive)) out.push({ from, place, at: p.arrive });
  });
  return out;
}

// ---------------------------------------------------------------------------------------------
// the world map: the map of the whole land, whose places lead into the other maps

export const isWorld = (m) => !!m && m.kind === 'world';
export const worldIds = () => S.order.filter((id) => isWorld(S.maps[id]));

// the places on world maps that lead into map `id`
export function placesInto(id) {
  const out = [];
  for (const world of worldIds()) (S.maps[world].places || []).forEach((p, i) => { if (p.to === id) out.push({ world, i, place: p }); });
  return out;
}

// map `id` becomes the world map; its key becomes "world" when that is free, as in Envoi
export function makeWorld(id) {
  const nid = id !== 'world' && !S.maps.world ? 'world' : id;
  remember([...new Set([id, nid, ...mapsLeadingTo(id)])]);
  const m = S.maps[id];
  m.kind = 'world';
  if (!Array.isArray(m.places)) m.places = [];
  return nid === id ? id : rekey(id, nid);
}
export function unmakeWorld(id) {
  const m = S.maps[id];
  remember([id]);
  delete m.kind;
  if (m.places && !m.places.length) delete m.places;
}

const uniquePlaceId = (w, base) => {
  const root = base || 'place', taken = new Set((w.places || []).map((p) => p.id));
  let id = root, n = 2;
  while (taken.has(id)) id = root + '-' + n++;
  return id;
};

// Where map `id`'s way out to the world goes: on a walk area's edge that runs along the picture's
// edge (the one nearest the bottom middle), or else along the picture's edges from the bottom
// middle outwards; never over a way out the map has already.
function door(id) {
  const m = S.maps[id], [W, H] = mapSize(m), h = m.walker;
  const thick = Math.max(12, Math.round(h * 0.4)), clear = Math.round((h * 8) / 52 + h * 0.6), want = Math.round(h * 2.4);
  const taken = (r) => m.exits.some((e) => r[0] < e.rect[2] + 4 && r[2] > e.rect[0] - 4 && r[1] < e.rect[3] + 4 && r[3] > e.rect[1] - 4);
  // a way out `len` long centred on (x, y) along side `sd` (0 left, 1 right, 2 top, 3 bottom), and where she arrives by it
  const make = (sd, x, y, len) => {
    const half = Math.round(Math.min(len, want) / 2);
    const rect = sd === 3 ? [x - half, H - thick, x + half, H] : sd === 2 ? [x - half, 0, x + half, thick] : sd === 0 ? [0, y - half, thick, y + half] : [W - thick, y - half, W, y + half];
    const arrive = sd === 3 ? [x, H - thick - clear] : sd === 2 ? [x, thick + clear] : sd === 0 ? [thick + clear, y] : [W - thick - clear, y];
    return { rect: [clamp(Math.round(rect[0]), 0, W), clamp(Math.round(rect[1]), 0, H), clamp(Math.round(rect[2]), 0, W), clamp(Math.round(rect[3]), 0, H)], arrive: [clamp(Math.round(arrive[0]), 0, W), clamp(Math.round(arrive[1]), 0, H)] };
  };
  const side = (p) => (p[1] >= H ? 3 : p[1] <= 0 ? 2 : p[0] <= 0 ? 0 : p[0] >= W ? 1 : -1);
  const along = [];
  for (const pts of m.walk) for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], sd = side(a);
    if (sd < 0 || sd !== side(b)) continue;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len >= h * 0.5) along.push({ d: (mid[0] - W / 2) ** 2 + (mid[1] - H) ** 2, door: make(sd, mid[0], mid[1], len) });
  }
  along.sort((a, b) => a.d - b.d);
  for (const c of along) if (!taken(c.door.rect)) return c.door;
  const step = want + 12;
  for (const sd of [3, 2, 0, 1]) {
    const len = sd >= 2 ? W : H;
    for (let k = 0; k <= Math.floor(len / 2 / step); k++) for (const sgn of k ? [1, -1] : [1]) {
      const c = len / 2 + sgn * k * step, d = sd >= 2 ? make(sd, c, 0, want) : make(sd, 0, c, want);
      if (!taken(d.rect)) return d;
    }
  }
  return make(3, W / 2, H, want); // every edge is full of ways out already
}

// Link place `p` on world map `world` to map `id`: she arrives just inside that map's way out to
// the world (made at its edge when it has none of its own yet), which brings her back to `p`.
function linkPlace(world, p, id) {
  const w = S.maps[world], m = S.maps[id], [MW, MH] = mapSize(m);
  p.to = id;
  const claimed = (e) => w.places.some((q) => q !== p && q.id === e.at && q.to === id);
  const back = m.exits.find((e) => e.to === world && e.at === p.id) || m.exits.find((e) => e.to === world && !claimed(e));
  if (back) {
    const r = back.rect, c = [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2], d = [c[0], MW - c[0], c[1], MH - c[1]], sd = d.indexOf(Math.min(...d));
    const clear = Math.round((m.walker * 8) / 52 + m.walker * 0.6);
    const a = sd === 3 ? [c[0], r[1] - clear] : sd === 2 ? [c[0], r[3] + clear] : sd === 0 ? [r[2] + clear, c[1]] : [r[0] - clear, c[1]];
    p.arrive = [clamp(Math.round(a[0]), 0, MW), clamp(Math.round(a[1]), 0, MH)];
    back.at = p.id;
  } else {
    const d = door(id);
    m.exits.push({ rect: d.rect, to: world, at: p.id, label: w.name });
    p.arrive = d.arrive;
  }
}

// Put map `id` on world map `world` at `at`: a place there that leads into it, linked as above.
// Returns the place's index. With `quiet` the caller keeps the undo step.
export function putOnWorld(world, id, at, quiet) {
  const w = S.maps[world], m = S.maps[id];
  if (!quiet) remember([world, id]);
  if (!Array.isArray(w.places)) w.places = [];
  const [WW, WH] = mapSize(w);
  const p = { id: uniquePlaceId(w, slug(m.name) || slug(id)), name: m.name, at: [clamp(Math.round(at[0]), 0, WW), clamp(Math.round(at[1]), 0, WH)], to: id, arrive: null };
  w.places.push(p);
  linkPlace(world, p, id);
  return w.places.length - 1;
}
// an existing place now leads into map `id`
export function linkPlaceTo(world, i, id, quiet) {
  if (!quiet) remember([world, id]);
  linkPlace(world, S.maps[world].places[i], id);
}

// the place on world map `world` that leads into map `id` (one is made in the middle when there
// is none), for a way out of `id` that goes to the world
export function placeFor(world, id) {
  const w = S.maps[world];
  const i = (w.places || []).findIndex((p) => p.to === id);
  if (i >= 0) return i;
  const [WW, WH] = mapSize(w), n = (w.places || []).length;
  return putOnWorld(world, id, [WW / 2 + ((n % 5) - 2) * WW * 0.08, WH / 2 + (Math.floor(n / 5) % 3) * WH * 0.08], true);
}

// several maps on the world map at once (just added, say), to be dragged where they belong: round
// its middle, or, when it has flags already, on the free spots furthest from them
export function connectAll(world, ids) {
  const w = S.maps[world], [WW, WH] = mapSize(w);
  ids = ids.filter((id) => id !== world && S.maps[id] && !(w.places || []).some((p) => p.to === id));
  if (!ids.length) return;
  remember([world, ...ids]);
  const ring = (k, n, r) => { const a = -Math.PI / 2 + (k / n) * Math.PI * 2; return [WW / 2 + Math.cos(a) * WW * 0.3 * r, WH / 2 + Math.sin(a) * WH * 0.28 * r]; };
  const flags = (w.places || []).map((p) => p.at), first = !flags.length;
  ids.forEach((id, i) => {
    let at = ring(i, ids.length, 1);
    if (!first) {
      let best = -1;
      for (const r of [1, 0.6]) for (let k = 0; k < 12; k++) {
        const p = ring(k + (r < 1 ? 0.5 : 0), 12, r), d = Math.min(...flags.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])));
        if (d > best) { best = d; at = p; }
      }
    }
    const pi = putOnWorld(world, id, at, true);
    flags.push(w.places[pi].at);
  });
}

// ---------------------------------------------------------------------------------------------
// changing the set

export async function mapFromPicture(file, name) {
  const size = await pics.measure(file);
  if (!size) return null;
  const key = await pics.addPicture(file);
  const n = niceName(name || file.name) || 'Map ' + (S.order.length + 1);
  const m = blankMap(n, size.w, size.h);
  m.pic = { key, type: file.type || '', file: file.name || '', w: size.w, h: size.h };
  return m;
}

export function addMap(m, id) {
  id = uniqueId(id || m.name);
  remember([id]);
  S.maps[id] = m;
  S.order.push(id);
  return id;
}

// a new name; a map whose key was made from its old name gets a key made from the new one, and the
// ways out that lead to it follow
export function keyAfterRename(id, name) {
  const m = S.maps[id];
  if (!m) return id;
  const made = slug(m.name);
  const auto = /^map(-\d+)?$/.test(id) || (made && (id === made || new RegExp('^' + made + '-\\d+$').test(id)));
  if (!auto || !slug(name)) return id;
  return uniqueId(name, id);
}
export function renameMap(id, name) {
  const m = S.maps[id];
  if (!m) return id;
  const nid = keyAfterRename(id, name);
  m.name = name;
  return nid === id ? id : rekey(id, nid);
}

export function rekey(id, nid) {
  const m = S.maps[id];
  delete S.maps[id];
  S.maps[nid] = m;
  S.order = S.order.map((x) => (x === id ? nid : x));
  for (const k of S.order) for (const e of S.maps[k].exits || []) if (e.to === id) e.to = nid;
  for (const k of S.order) for (const p of S.maps[k].places || []) if (p.to === id) p.to = nid;
  if (S.cur === id) S.cur = nid;
  if (S.views[id]) { S.views[nid] = S.views[id]; delete S.views[id]; }
  if (S.lastWalk[id]) { S.lastWalk[nid] = S.lastWalk[id]; delete S.lastWalk[id]; }
  return nid;
}

// The way back for way out `i` of map `from`: a way out on the map it leads to, at the edge nearest
// to where she arrives there, leading back; she comes back just inside the way out she left by.
export function wayBack(from, i) {
  const a = S.maps[from], e = a && a.exits[i], to = e && e.to, b = to && S.maps[to];
  if (!b || to === from) return null;
  const [AW, AH] = mapSize(a), [BW, BH] = mapSize(b), hb = b.walker, ha = a.walker;
  const at = isPt(e.at) ? e.at.slice() : b.start.slice();
  const nearestSide = (p, W, H) => { const d = [p[0], W - p[0], p[1], H - p[1]]; return d.indexOf(Math.min(...d)); };
  // the new way out, along B's edge nearest to where she arrives
  const side = nearestSide(at, BW, BH), thick = Math.max(12, Math.round(hb * 0.4)), half = Math.round(hb * 1.2);
  let rect = side === 0 ? [0, at[1] - half, thick, at[1] + half] : side === 1 ? [BW - thick, at[1] - half, BW, at[1] + half]
    : side === 2 ? [at[0] - half, 0, at[0] + half, thick] : [at[0] - half, BH - thick, at[0] + half, BH];
  rect = [clamp(rect[0], 0, BW - 4), clamp(rect[1], 0, BH - 4), clamp(rect[2], 4, BW), clamp(rect[3], 4, BH)].map(Math.round);
  // she must arrive clear of it, or she would leave again at once
  const clear = Math.round((hb * 8) / 52 + hb * 0.4);
  if (side === 0) at[0] = Math.max(at[0], rect[2] + clear);
  else if (side === 1) at[0] = Math.min(at[0], rect[0] - clear);
  else if (side === 2) at[1] = Math.max(at[1], rect[3] + clear);
  else at[1] = Math.min(at[1], rect[1] - clear);
  // where she comes back: in front of the way out she left by, on the side away from A's edge
  const r = e.rect, c = [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2], sa = nearestSide(c, AW, AH), off = Math.round((ha * 8) / 52 + ha * 0.6);
  let back = sa === 0 ? [r[2] + off, c[1]] : sa === 1 ? [r[0] - off, c[1]] : sa === 2 ? [c[0], r[3] + off] : [c[0], r[1] - off];
  back = [clamp(Math.round(back[0]), 0, AW), clamp(Math.round(back[1]), 0, AH)];
  remember([from, to]);
  e.at = [clamp(Math.round(at[0]), 0, BW), clamp(Math.round(at[1]), 0, BH)];
  b.exits.push({ rect, to: from, at: back, label: a.name });
  return { on: to, exit: b.exits.length - 1 };
}

// the maps whose ways out lead to `id`
export const mapsLeadingTo = (id) => S.order.filter((k) => (S.maps[k].exits || []).some((e) => e.to === id) || (S.maps[k].places || []).some((p) => p.to === id));

export function deleteMap(id) {
  remember([id, ...mapsLeadingTo(id)]);
  const i = S.order.indexOf(id);
  delete S.maps[id];
  S.order = S.order.filter((x) => x !== id);
  if (S.cur === id) S.cur = S.order[Math.min(i, S.order.length - 1)] || null;
  S.sel = null;
  S.draft = null;
}

// a new size for the map: everything on it stretches with it
export function resizeMap(id, w, h) {
  const m = S.maps[id], [W, H] = mapSize(m), kx = w / W, ky = h / H;
  m.size = [w, h];
  m.start = [Math.round(m.start[0] * kx), Math.round(m.start[1] * ky)];
  m.walk = m.walk.map((p) => scalePts(p, kx, ky));
  m.block = m.block.map((p) => scalePts(p, kx, ky));
  m.front = m.front.map((f) => Object.assign(f, { pts: scalePts(f.pts, kx, ky), base: Math.round(f.base * ky) }));
  m.exits.forEach((e) => { e.rect = [Math.round(e.rect[0] * kx), Math.round(e.rect[1] * ky), Math.round(e.rect[2] * kx), Math.round(e.rect[3] * ky)]; });
  m.people.forEach((p) => { p.at = [Math.round(p.at[0] * kx), Math.round(p.at[1] * ky)]; });
  m.spots.forEach((s) => {
    if (s.rect) s.rect = [Math.round(s.rect[0] * kx), Math.round(s.rect[1] * ky), Math.round(s.rect[2] * kx), Math.round(s.rect[3] * ky)];
    else s.at = [Math.round(s.at[0] * kx), Math.round(s.at[1] * ky)];
  });
  m.walker = Math.max(4, Math.round(m.walker * Math.sqrt(kx * ky)));
  if (m.places) m.places.forEach((p) => { p.at = [Math.round(p.at[0] * kx), Math.round(p.at[1] * ky)]; });
  // and where people arrive from other maps
  for (const k of S.order) for (const e of S.maps[k].exits || []) if (e.to === id && isPt(e.at)) e.at = [Math.round(e.at[0] * kx), Math.round(e.at[1] * ky)];
  for (const k of S.order) for (const p of S.maps[k].places || []) if (p.to === id && isPt(p.arrive)) p.arrive = [Math.round(p.arrive[0] * kx), Math.round(p.arrive[1] * ky)];
  delete S.views[id];
}

// ---------------------------------------------------------------------------------------------
// maps files: reading one in

// A maps file: { maps: { id: map } } (Walking Paths' own), or just { id: map } (a game's MAPS).
// Returns [{ id, map, src }] with each map in the page's shape, or throws with a plain reason.
export function readMapsFile(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('it isn’t a maps file (it isn’t JSON)'); }
  const holder = data && typeof data === 'object' && data.maps && typeof data.maps === 'object' ? data.maps : data;
  if (!holder || typeof holder !== 'object') throw new Error('there are no maps in it');
  const entries = Array.isArray(holder) ? holder.map((m, i) => [m && m.id ? m.id : 'map-' + (i + 1), m]) : Object.entries(holder);
  const out = [];
  for (const [id, raw] of entries) {
    if (!raw || typeof raw !== 'object' || (!Array.isArray(raw.walk) && !raw.src && !raw.name)) continue;
    let size = Array.isArray(raw.size) && raw.size.length === 2 && raw.size.every((v) => Number.isFinite(v) && v > 0) ? raw.size.map(Math.round) : null;
    if (!size) {
      // a game's map with no size: the furthest point decides between Envoi's 1536 x 1024 and bigger
      let x1 = 0, y1 = 0;
      const see = (p) => { if (isPt(p)) { x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } };
      for (const a of [].concat(raw.walk || [], raw.block || [])) if (Array.isArray(a)) a.forEach(see);
      size = x1 > 1536 || y1 > 1024 ? [Math.ceil(x1), Math.ceil(y1)] : [1536, 1024];
    }
    out.push({ id: String(id), map: normalizeMap(raw, size), src: typeof raw.src === 'string' ? raw.src : '' });
  }
  if (!out.length) throw new Error('there are no maps in it');
  return out;
}

// the pictures for maps read from a file: inside it, or among the other files picked with it
export async function attachPictures(entries, files) {
  const byName = new Map();
  for (const f of files || []) byName.set(f.name.toLowerCase(), f);
  let missing = 0;
  const used = new Set();
  for (const e of entries) {
    let blob = null;
    if (e.src.startsWith('data:')) { try { blob = dataURLToBlob(e.src); } catch { blob = null; } }
    else if (e.src) {
      const base = e.src.split(/[\\/]/).pop().toLowerCase();
      blob = byName.get(base) || null;
      if (blob) used.add(blob);
    }
    if (blob) {
      const size = await pics.measure(blob);
      if (size) {
        const key = await pics.addPicture(blob);
        e.map.pic = { key, type: blob.type || '', file: blob.name || (e.src.startsWith('data:') ? e.id + '.' + extFor(blob.type) : e.src.split(/[\\/]/).pop()), w: size.w, h: size.h };
        continue;
      }
    }
    e.map.pic = null;
    if (e.src) e.map.wantPicture = e.src.startsWith('data:') ? '' : e.src.split(/[\\/]/).pop();
    missing++;
  }
  return { missing, used };
}

// put read maps into the set, beside what is there or instead of it
export function takeMaps(entries, replace) {
  // a file's own keys stay as they are (a game's code uses them); a key that is taken gets -2, -3...
  // and the ways out between the new maps follow
  // (entries carry `group`: the file they came from; keys are only matched within one file)
  const taken = new Set(replace ? [] : Object.keys(S.maps)), renames = new Map();
  for (const e of entries) {
    const root = String(e.id).trim() || 'map';
    let nid = root, n = 2;
    while (taken.has(nid)) nid = root + '-' + n++;
    taken.add(nid);
    e.newId = nid;
    if (!renames.has(e.group)) renames.set(e.group, {});
    renames.get(e.group)[e.id] = nid;
  }
  const ids = entries.map((e) => e.newId);
  remember(replace ? [...S.order, ...ids] : ids);
  if (replace) { S.maps = {}; S.order = []; }
  for (const e of entries) {
    S.maps[e.newId] = e.map;
    S.order.push(e.newId);
  }
  for (const e of entries) {
    const rename = renames.get(e.group);
    for (const x of e.map.exits) if (Object.prototype.hasOwnProperty.call(rename, x.to)) x.to = rename[x.to];
    for (const x of e.map.places || []) if (Object.prototype.hasOwnProperty.call(rename, x.to)) x.to = rename[x.to];
  }
  S.cur = ids[0];
  S.sel = null;
  S.draft = null;
  return ids;
}

// ---------------------------------------------------------------------------------------------
// the two example maps (Envoi's Wickhollow and its jetty)

async function examplesData() {
  if (window.WP_EXAMPLES) return { data: window.WP_EXAMPLES, base: '' };
  try {
    const r = await fetch('examples/examples.json');
    if (r.ok) return { data: await r.json(), base: 'examples/' };
  } catch { /* no examples when the page runs some other way */ }
  return null;
}

export async function addExamples() {
  const got = await examplesData();
  if (!got) return [];
  const entries = [];
  for (const [id, raw] of Object.entries(got.data.maps || {})) {
    const e = { id, map: normalizeMap(raw, raw.size || [1536, 1024]), src: raw.src };
    let blob = null;
    try {
      blob = e.src.startsWith('data:') ? dataURLToBlob(e.src) : await (await fetch(got.base + e.src)).blob();
    } catch { blob = null; }
    if (blob) {
      const key = await pics.addPicture(blob);
      e.map.pic = { key, type: blob.type || 'image/avif', file: e.src.startsWith('data:') ? id + '.avif' : e.src, w: e.map.size[0], h: e.map.size[1] };
    } else e.map.pic = null;
    e.map.example = true;
    entries.push(e);
  }
  if (!entries.length) return [];
  return takeMaps(entries, false);
}

// ---------------------------------------------------------------------------------------------
// keeping the work in this browser

let timer = 0, saving = Promise.resolve();
export function keepSoon() {
  clearTimeout(timer);
  timer = setTimeout(keepNow, 400);
}
export function keepNow() {
  clearTimeout(timer);
  const record = {
    version: 1,
    maps: S.maps,
    order: S.order,
    cur: S.cur,
    prefs: { layers: S.layers, walker: S.walker, walkerChosen: S.walkerChosen, showPaths: S.showPaths, drawBy: S.drawBy, spread: S.spread },
  };
  saving = saving.then(() => store.put('project', record)).then((ok) => emit('kept', ok));
  return saving;
}

export async function loadKept() {
  const rec = await store.get('project');
  if (!rec || typeof rec !== 'object' || !rec.maps || !Array.isArray(rec.order)) return false;
  S.maps = rec.maps;
  S.order = rec.order.filter((id) => S.maps[id]);
  S.cur = S.maps[rec.cur] ? rec.cur : S.order[0] || null;
  const p = rec.prefs || {};
  if (p.layers && typeof p.layers === 'object') Object.assign(S.layers, p.layers);
  // (a walker kept by an older page: its default, Io in pixels, gives way to the painted Io; any
  // other was picked)
  if (typeof p.walker === 'string' && (p.walkerChosen || p.walker !== 'io')) { S.walker = p.walker; S.walkerChosen = true; }
  S.showPaths = !!p.showPaths;
  if (p.drawBy === 'hand' || p.drawBy === 'wand') S.drawBy = p.drawBy;
  if (Number.isFinite(p.spread)) S.spread = clamp(Math.round(p.spread), 1, 100);
  const keys = [];
  for (const id of S.order) {
    const m = S.maps[id];
    if (m.pic && m.pic.key) {
      keys.push(m.pic.key);
      if (!(await pics.loadPicture(m.pic.key))) { m.wantPicture = m.pic.file || ''; m.pic = null; }
    }
  }
  pics.tidy(keys);
  return S.order.length > 0 || rec.order.length === 0;
}

export function touch(say) {
  changed(say);
  keepSoon();
}
