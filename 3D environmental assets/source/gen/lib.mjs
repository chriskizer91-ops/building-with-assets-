// Mesh building + a small GLB writer. Metres, y up, ground at y = 0. Colours are linear RGB.
import * as THREE from 'three';
export { THREE };
const V3 = THREE.Vector3;

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// value noise, 3D
function h3(x, y, z) { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
const sm = t => t * t * (3 - 2 * t);
export function noise(x, y, z = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => h3(xi + i, yi + j, zi + k);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf), l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
}
export function fbm(x, y, z = 0, o = 3) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f, z * f); f *= 2.03; a *= .5; } return s / (1 - Math.pow(.5, o)); }
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const vary = (c, R, amt) => { const k = 1 + (R() - .5) * 2 * amt; return [c[0] * k * (1 + (R() - .5) * amt * .5), c[1] * k, c[2] * k * (1 + (R() - .5) * amt * .5)]; };

export class MB {
  constructor() { this.P = []; this.N = []; this.C = []; this.I = []; }
  get nv() { return this.P.length / 3; }
  get tris() { return this.I.length / 3; }
  v(p, n, c) { this.P.push(p.x ?? p[0], p.y ?? p[1], p.z ?? p[2]); this.N.push(n.x ?? n[0], n.y ?? n[1], n.z ?? n[2]); this.C.push(c[0], c[1], c[2]); return this.nv - 1; }
  tri(a, b, c) { this.I.push(a, b, c); }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  // add a three.js geometry (indexed or not) with a transform and a colour function (p, n) -> rgb
  geo(g, m, colFn) {
    g = g.clone(); if (m) g.applyMatrix4(m); if (!g.attributes.normal) g.computeVertexNormals();
    const P = g.attributes.position, N = g.attributes.normal, base = this.nv, p = new V3(), n = new V3();
    for (let i = 0; i < P.count; i++) { p.fromBufferAttribute(P, i); n.fromBufferAttribute(N, i); this.v(p, n, typeof colFn === 'function' ? colFn(p, n, i) : colFn); }
    if (g.index) for (let i = 0; i < g.index.count; i++) this.I.push(base + g.index.getX(i));
    else for (let i = 0; i < P.count; i++) this.I.push(base + i);
    return this;
  }
  bounds() { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < this.P.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], this.P[i + k]); mx[k] = Math.max(mx[k], this.P[i + k]); } return { mn, mx }; }
}

// a tube along a polyline (parallel-transported rings). radii per point. colFn(t, a, p) -> rgb. bark: radial ridges
export function tube(mb, pts, radii, seg, colFn, o = {}) {
  const n = pts.length, T = [], Nn = [], Bn = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; T.push(new V3().subVectors(b, a).normalize()); }
  let up = Math.abs(T[0].y) < .9 ? new V3(0, 1, 0) : new V3(1, 0, 0);
  let N0 = new V3().crossVectors(T[0], up).normalize();
  for (let i = 0; i < n; i++) {
    if (i > 0) { const ax = new V3().crossVectors(T[i - 1], T[i]); const s = ax.length(); if (s > 1e-6) { ax.normalize(); const ang = Math.asin(Math.min(1, s)); N0 = N0.clone().applyAxisAngle(ax, ang); } }
    Nn.push(N0.clone()); Bn.push(new V3().crossVectors(T[i], N0).normalize());
  }
  const base = mb.nv, L = []; let acc = 0; L.push(0); for (let i = 1; i < n; i++) { acc += pts[i].distanceTo(pts[i - 1]); L.push(acc); }
  const len = acc || 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < seg; j++) {
      const a = j / seg * Math.PI * 2 + (o.twist || 0) * L[i], d = new V3().copy(Nn[i]).multiplyScalar(Math.cos(a)).addScaledVector(Bn[i], Math.sin(a));
      let r = radii[i];
      if (o.bark) r *= 1 + o.bark * (noise(Math.cos(a) * 2.2 + 9, L[i] * (o.barkF || 1.2), Math.sin(a) * 2.2) - .5) * 2;
      const fr = o.furrow ? .5 + .5 * Math.sin(a * o.furrowN + 4 * noise(L[i] * .7, Math.cos(a), Math.sin(a) + 5)) : 1;
      if (o.furrow) r *= 1 - o.furrow * (1 - fr);
      const p = new V3().copy(pts[i]).addScaledVector(d, r);
      mb.v(p, d, colFn(L[i] / len, a, p, i, fr));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const a = base + i * seg + j, b = base + i * seg + (j + 1) % seg, c = base + (i + 1) * seg + (j + 1) % seg, d = base + (i + 1) * seg + j; mb.quad(a, b, c, d); }
  if (o.cap1) { const c = mb.v(pts[n - 1], T[n - 1], colFn(1, 0, pts[n - 1], n - 1)); for (let j = 0; j < seg; j++) mb.tri(base + (n - 1) * seg + j, base + (n - 1) * seg + (j + 1) % seg, c); }
  return { T, Nn, Bn, L };
}

// a surface of revolution about y: prof [[r, y], ...] bottom to top. colFn(p, n, k) ; rFn(r, a, y) optional to deform
export function lathe(mb, prof, seg, colFn, m, rFn) {
  const base = mb.nv, np = prof.length, p = new V3(), n = new V3();
  // profile normals
  const pn = prof.map((q, i) => { const a = prof[Math.max(0, i - 1)], b = prof[Math.min(np - 1, i + 1)]; const dr = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dr, dy) || 1; return [dy / l, -dr / l]; });
  for (let i = 0; i < np; i++) for (let j = 0; j < seg; j++) {
    const a = j / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); let r = prof[i][0]; if (rFn) r = rFn(r, a, prof[i][1], i, j);
    p.set(ca * r, prof[i][1], sa * r); n.set(ca * pn[i][0], pn[i][1], sa * pn[i][0]).normalize();
    if (m) { p.applyMatrix4(m); n.transformDirection(m); }
    mb.v(p, n, colFn(p, n, i, j));
  }
  for (let i = 0; i < np - 1; i++) for (let j = 0; j < seg; j++) { const a = base + i * seg + j, b = base + i * seg + (j + 1) % seg, c = base + (i + 1) * seg + (j + 1) % seg, d = base + (i + 1) * seg + j; mb.quad(a, d, c, b); }
}

// a box from 8 corners with flat normals; m: matrix
// duplicate interior points so lathe edges stay hard
export const hard = prof => prof.flatMap((p, i) => i > 0 && i < prof.length - 1 && p[2] ? [[p[0], p[1]], [p[0], p[1]]] : [[p[0], p[1]]]);
export function box(mb, sx, sy, sz, m, col) {
  const g = new THREE.BoxGeometry(sx, sy, sz); mb.geo(g, m, col);
}
export const M = (pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => new THREE.Matrix4().compose(new V3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot, 'YXZ')), new V3(...(typeof scl === 'number' ? [scl, scl, scl] : scl)));

// a leaf card: a diamond in the plane (u, s), facing f; lit with nrm (shading normal)
export function leaf(mb, c, u, s, len, wid, col, nrm, colTip) {
  const a = new V3().copy(c).addScaledVector(u, -len * .5), b = new V3().copy(c).addScaledVector(u, len * .5);
  const l = new V3().copy(c).addScaledVector(u, -len * .1).addScaledVector(s, -wid * .5), r = new V3().copy(c).addScaledVector(u, -len * .1).addScaledVector(s, wid * .5);
  const i0 = mb.v(a, nrm, col), i1 = mb.v(r, nrm, col), i2 = mb.v(b, nrm, colTip || col), i3 = mb.v(l, nrm, col);
  mb.quad(i0, i1, i2, i3);
}
// a low icosahedron blob, displaced by noise, normals pushed toward 'away' from ctr
export function blob(mb, c, rx, ry, rz, detail, colFn, ctr, R, bump = .25) {
  const g = new THREE.IcosahedronGeometry(1, detail); const P = g.attributes.position; const base = mb.nv;
  const seed = R() * 100, map = new Map(), idx = [];
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    if (map.has(key)) { idx.push(map.get(key)); continue; }
    const k = 1 + bump * (noise(x * 1.7 + seed, y * 1.7, z * 1.7) - .5) * 2;
    const p = new V3(c.x + x * rx * k, c.y + y * ry * k, c.z + z * rz * k);
    const nn = new V3(x, y, z).normalize(); if (ctr) nn.lerp(new V3().subVectors(p, ctr).normalize(), .6).normalize();
    const v = mb.v(p, nn, colFn(p, nn)); map.set(key, v); idx.push(v);
  }
  for (let i = 0; i < idx.length; i += 3) mb.tri(idx[i], idx[i + 1], idx[i + 2]);
}
// random unit vector
export function rndDir(R) { const z = R() * 2 - 1, a = R() * Math.PI * 2, r = Math.sqrt(1 - z * z); return new V3(r * Math.cos(a), z, r * Math.sin(a)); }
export function perp(v) { const a = Math.abs(v.y) < .9 ? new V3(0, 1, 0) : new V3(1, 0, 0); return new V3().crossVectors(v, a).normalize(); }

// ---------------------------------------------------------------- GLB
// parts: [{ name, mat: { name, rough, metal, double, game }, mb }]
export function glb(id, parts, extras) {
  const bufs = [], accessors = [], views = [], prims = [], materials = []; let off = 0;
  const push = (arr, target, comp, type, count, mm) => {
    const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (b.length % 4)) % 4;
    views.push({ buffer: 0, byteOffset: off, byteLength: b.length, target }); bufs.push(b); if (pad) bufs.push(Buffer.alloc(pad)); off += b.length + pad;
    const acc = { bufferView: views.length - 1, componentType: comp, count, type }; if (mm) { acc.min = mm[0]; acc.max = mm[1]; }
    accessors.push(acc); return accessors.length - 1;
  };
  for (const pt of parts) {
    const mb = pt.mb; if (!mb.tris) continue;
    let mi = materials.findIndex(m => m.name === pt.mat.name);
    if (mi < 0) { materials.push({ name: pt.mat.name, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: pt.mat.metal || 0, roughnessFactor: pt.mat.rough ?? .9 }, doubleSided: !!pt.mat.double, extras: { gameMat: pt.mat.game } }); mi = materials.length - 1; }
    const P = new Float32Array(mb.P), N = new Float32Array(mb.N.length), C = new Float32Array(mb.C.map(v => clamp(v, 0, 1)));
    for (let i = 0; i < mb.N.length; i += 3) { const l = Math.hypot(mb.N[i], mb.N[i + 1], mb.N[i + 2]) || 1; N[i] = mb.N[i] / l; N[i + 1] = mb.N[i + 1] / l; N[i + 2] = mb.N[i + 2] / l; }
    const { mn, mx } = mb.bounds();
    const a = { POSITION: push(P, 34962, 5126, 'VEC3', mb.nv, [mn, mx]), NORMAL: push(N, 34962, 5126, 'VEC3', mb.nv), COLOR_0: push(C, 34962, 5126, 'VEC3', mb.nv) };
    const I = mb.nv < 65536 ? new Uint16Array(mb.I) : new Uint32Array(mb.I);
    const ia = push(I, 34963, mb.nv < 65536 ? 5123 : 5125, 'SCALAR', mb.I.length);
    prims.push({ attributes: a, indices: ia, material: mi, extras: { part: pt.name } });
  }
  const json = { asset: { version: '2.0', generator: 'Field & Forest environment pack (procedural, Claude)' }, scene: 0, scenes: [{ name: id, nodes: [0] }],
    nodes: [{ name: id, mesh: 0, extras }], meshes: [{ name: id, primitives: prims }], materials, accessors, bufferViews: views, buffers: [{ byteLength: off }] };
  let js = Buffer.from(JSON.stringify(json)); const jp = (4 - (js.length % 4)) % 4; if (jp) js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
  const bin = Buffer.concat(bufs);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4E4F534A, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004E4942, 4);
  return Buffer.concat([head, jh, js, bh, bin]);
}
