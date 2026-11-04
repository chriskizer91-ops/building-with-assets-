// Page 2: a 480 x 480 ft field to build a forest on, and a walk through it inside a circle of fog.
// Only what can be seen is drawn: walking, that's what's inside the fog circle (near detail close in, the far
// version toward the fog's edge); building, the near version round the middle of the view and the far one beyond.
import { THREE, FT, $, fmt, ft, phone, Q, makeRenderer, makeSky, makeSun, SKY, fogColor, FOGU, groundMesh, tintOf, person, loadModels, hint, sizeRow, scaleFor, plant, fbm, vn } from './common.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import DATA from './data.js';

const AREA = 480 * FT, HALF = AREA / 2, TAU = Math.PI * 2;
const canvas = $('cv'), renderer = makeRenderer(canvas, phone ? 1.5 : 1.25);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, .05, 1400);
const sky = makeSky(scene, renderer); scene.fog = new THREE.Fog(0xd9cfbd, 260, 900);
const sun = makeSun(scene), hemi = new THREE.HemisphereLight(0xd4dad6, 0x3b3124, 0); scene.add(hemi);
const figure = person(); figure.visible = false; scene.add(figure);
const MIST = [.7, .73, .7], MIST_UP = [.78, .8, .78], NEAR_B = phone ? 30 : 50;

// ------------------------------------------------------------------ state
const S = { mode: 'build', tool: 'paint', sel: 'mix:woods', size: 1, vary: true, brush: 20, density: 1, fogFt: 40, ground: 'Forest floor', solid: false, grid: true, ring: true, behind: true };
const KEY = 'field-forest-layout-v1';
let MODELS, AS = [], IDX = {}, MAXHW = 0;
const MIXES = [
  { id: 'woods', name: 'Mixed woods', tree: { tree_spruce: 4, tree_oak: 2.5, tree_aspen: 2.5, tree_ponderosa: 1.5, tree_cottonwood: .6, tree_snag: .35 }, grass: { grass_meadow: 3, grass_dry: 1 }, rate: { tree: 6, grass: 28 } },
  { id: 'conifer', name: 'Pine & spruce', tree: { tree_spruce: 5, tree_ponderosa: 2.5, tree_snag: .4 }, grass: { grass_dry: 1, grass_meadow: 1 }, rate: { tree: 8, grass: 12 } },
  { id: 'aspen', name: 'Aspen grove', tree: { tree_aspen: 9, tree_spruce: .8 }, grass: { grass_meadow: 1 }, rate: { tree: 12, grass: 36 } },
  { id: 'creek', name: 'Creek side', tree: { tree_willow: 2, tree_cottonwood: 1 }, grass: { grass_reeds: 3, grass_meadow: 2 }, rate: { tree: 1.2, grass: 50 } },
  { id: 'dry', name: 'Dry country', tree: { tree_mesquite: 3, tree_snag: .4 }, bush: { bush_sage: 4, bush_pricklypear: 1.5 }, grass: { grass_dry: 3 }, rate: { tree: 1, bush: 7, grass: 22 } },
  { id: 'meadow', name: 'Meadow', grass: { grass_meadow: 3, grass_dry: 1.2 }, bush: { bush_sage: 1 }, rate: { grass: 60, bush: .5 } },
];
const MIX = Object.fromEntries(MIXES.map(m => [m.id, m]));
const RATE1 = { tree: 6, bush: 8, grass: 45, prop: .8 };
const KIND = { Grass: 'grass', Bushes: 'bush', Trees: 'tree', Props: 'prop' };
const SPACE = { grass: [1.1, .8, .6], k: [.8, .55, .4], dk: [.5, 1, 1.8] };
let seed = 12345; const RND = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ------------------------------------------------------------------ the objects, and a grid of 4 m cells to find them by place
const O = []; let needCompact = false, dirty = true;
const HC = 4, HN = Math.ceil(AREA / HC) + 2, cells = new Array(HN * HN);
const cI = v => Math.max(0, Math.min(HN - 1, Math.floor((v + HALF) / HC) + 1));
const hAdd = o => { const k = cI(o.z) * HN + cI(o.x); (cells[k] || (cells[k] = [])).push(o); };
const hDel = o => { const c = cells[cI(o.z) * HN + cI(o.x)]; if (!c) return; const i = c.indexOf(o); if (i >= 0) { c[i] = c[c.length - 1]; c.pop(); } };
function any(x, z, r, pred) { const i0 = cI(x - r), i1 = cI(x + r), j0 = cI(z - r), j1 = cI(z + r);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = cells[j * HN + i]; if (c) for (let k = 0; k < c.length; k++) if (pred(c[k])) return true; } return false; }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();
function mkObj(a, x, z, yaw, s) { _e.set(0, yaw, 0); _q.setFromEuler(_e); _m.compose(_p.set(x, 0, z), _q, _s.set(s, s, s)); const m = new Float32Array(16); _m.toArray(m); return { a, x, z, yaw, s, m, dead: false }; }
function addObj(a, x, z, yaw, s) { const o = mkObj(a, x, z, yaw, s); o.inO = true; O.push(o); hAdd(o); dirty = true; return o; }
function delObj(o) { if (o.dead) return; o.dead = true; hDel(o); dirty = needCompact = true; }
function reAdd(o) { if (!o.dead) return; o.dead = false; if (!o.inO) { O.push(o); o.inO = true; } hAdd(o); dirty = true; }
function clearAll() { for (const o of O) { o.dead = true; o.inO = false; } O.length = 0; cells.fill(undefined); dirty = true; }

// may this go here? trees keep apart by their crowns, grass and bushes keep off trunks, and so on
function canPlace(ai, x, z, s, d) {
  if (Math.abs(x) > HALF - .3 || Math.abs(z) > HALF - .3) return false;
  const A = AS[ai], hw = A.hw * s, k = SPACE.k[d], gs = SPACE.grass[d];
  const r = A.kind === 'tree' ? (hw + MAXHW) * k + 1 : A.kind === 'bush' ? hw + 2 : 2;
  return !any(x, z, r, o => { const B = AS[o.a], dd = Math.hypot(o.x - x, o.z - z), hb = B.hw * o.s;
    if (A.kind === 'tree') return B.kind === 'tree' ? dd < Math.max((A.trunk * s + B.trunk * o.s) * 2.2, k * (hw + hb)) : B.kind !== 'grass' && dd < A.trunk * s + hb * .6;
    if (A.kind === 'bush') return B.kind === 'tree' ? dd < B.trunk * o.s + hw * .7 : B.kind !== 'grass' && dd < (hw + hb) * .8 * k + .1;
    if (A.kind === 'grass') return B.kind === 'tree' ? dd < B.trunk * o.s + .15 : B.kind === 'grass' ? dd < gs : B.kind === 'prop' && dd < hb + .1;
    return dd < (hw + hb) * .9 + (B.kind === 'tree' ? B.trunk * o.s : 0); });
}
function pickFrom(tbl) { const ids = Object.keys(tbl); let w = 0; for (const i of ids) w += tbl[i]; let p = RND() * w; for (const i of ids) { p -= tbl[i]; if (p <= 0) return IDX[i]; } return IDX[ids[ids.length - 1]]; }
function spec() { if (S.sel.startsWith('mix:')) return MIX[S.sel.slice(4)]; const k = AS[IDX[S.sel]].kind; return { [k]: { [S.sel]: 1 }, rate: { [k]: RATE1[k] } }; }
// scatter round a point (a dab of the brush) or over a box; returns what it added
function scatter(sp, area, pointAt, out, d = S.density, ok) {
  for (const kind of ['tree', 'bush', 'prop', 'grass']) { const tbl = sp[kind]; if (!tbl || !sp.rate[kind]) continue;
    let n = area / 100 * sp.rate[kind] * SPACE.dk[d]; n = Math.floor(n) + (RND() < n % 1 ? 1 : 0);
    for (let i = 0; i < n; i++) { const [x, z] = pointAt(), ai = pickFrom(tbl), s = scaleFor(AS[ai].meta, S, RND);
      if ((!ok || ok(x, z, AS[ai])) && canPlace(ai, x, z, s, d)) out.push(addObj(ai, x, z, RND() * TAU, s)); } }
}
const disc = (cx, cz, R) => () => { const r = R * Math.sqrt(RND()), a = RND() * TAU; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; };
const rect = () => [(RND() * 2 - 1) * HALF, (RND() * 2 - 1) * HALF];

// ------------------------------------------------------------------ the sample forest: woods, an aspen grove, a creek, a clearing and a path
const creekZ = x => -32 + 15 * Math.sin(x / 26 + .6) + 6 * Math.sin(x / 9.5);
const pathX = z => 6 + 14 * Math.sin(z / 31 + 1.1) + 4 * Math.sin(z / 12);
const CLR = { x: -18, z: 34, r: 17 };
function zoneAt(x, z) { const dc = Math.abs(z - creekZ(x)); if (dc < 2.2) return 'water'; if (dc < 7.5) return 'creek';
  if (Math.hypot(x - CLR.x, z - CLR.z) < CLR.r * (1 + .36 * (vn(x * .12, z * .12) - .5))) return 'meadow';
  const n = fbm(x * .018 + 4, z * .018 - 2); return n < .4 ? 'aspen' : n > .6 ? 'conifer' : 'woods'; }
const WATER = { grass: { grass_reeds: 1 }, rate: { grass: 70 } };
function sampleForest() {
  const out = []; seed = 2468; const keep = { size: S.size, vary: S.vary }; S.size = 1; S.vary = true;
  const zmix = z => z === 'water' ? WATER : MIX[z];
  const MAX = { tree: 16, bush: 7, grass: 80, prop: 0 }, DEN = { tree: 2, bush: 1, grass: 1 };
  for (const kind of ['tree', 'bush', 'grass']) { const n = AREA * AREA / 100 * MAX[kind] * (kind === 'tree' ? 1.6 : 1);
    for (let i = 0; i < n; i++) { const [x, z] = rect(), m = zmix(zoneAt(x, z)); if (!m[kind] || !m.rate[kind] || RND() > m.rate[kind] / MAX[kind]) continue;
      const dp = Math.abs(x - pathX(z)); if (dp < (kind === 'grass' ? 1.1 : kind === 'bush' ? 2 : 2.6)) continue;
      const ai = pickFrom(m[kind]), s = scaleFor(AS[ai].meta, S, RND); if (canPlace(ai, x, z, s, DEN[kind])) out.push(addObj(ai, x, z, RND() * TAU, s)); } }
  // a few things left in the woods
  for (const [id, x, z, yaw] of [['prop_drum', CLR.x + 4, CLR.z - 6, .4], ['prop_drum', CLR.x + 4.7, CLR.z - 5.4, 1.9], ['prop_tires', CLR.x - 6, CLR.z + 3, .2], ['prop_mailbox', pathX(HALF - 3) + 1.6, HALF - 3, Math.PI / 2]])
    if (Math.abs(x) < HALF && Math.abs(z) < HALF) out.push(addObj(IDX[id], x, z, yaw, 1));
  S.size = keep.size; S.vary = keep.vary; return out;
}

// ------------------------------------------------------------------ the ground, its grid and edge
let ground = null, marks = false;
function groundTint(x, z) { const c = tintOf(S.ground === 'Forest floor' ? 'Dirt' : S.ground)(x, z); if (!marks) return c;
  const p = 1 - Math.min(1, Math.max(0, (Math.abs(x - pathX(z)) - .8) / .9)), w = 1 - Math.min(1, Math.max(0, (Math.abs(z - creekZ(x)) - 1.2) / 2.4));
  return [c[0] * (1 + .75 * p) * (1 - .55 * w), c[1] * (1 + .6 * p) * (1 - .5 * w), c[2] * (1 + .45 * p) * (1 - .45 * w)]; }
function setGround() { if (ground) { scene.remove(ground); ground.geometry.dispose(); } ground = groundMesh(renderer, AREA, 146, S.ground, 0, groundTint); scene.add(ground); }
const outer = groundMesh(renderer, 1200, 60, 'Grass', -.02, (x, z) => { const a = fbm(x * .02 + 3, z * .02), s = .55 + .25 * a; return [s, s * .95, s * .85]; }); scene.add(outer);
const edgeG = new THREE.Group(); scene.add(edgeG);
{ const chalk = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 1 });
  for (const [x, z, w, d] of [[0, -HALF, AREA + .1, .1], [0, HALF, AREA + .1, .1], [-HALF, 0, .1, AREA], [HALF, 0, .1, AREA]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, .02, d), chalk); b.position.set(x, .02, z); edgeG.add(b); }
  const label = (txt, x, z, rot) => { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.fillStyle = 'rgba(240,236,228,.95)'; g.font = '600 54px -apple-system,Segoe UI,Roboto,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 3), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, fog: false })); m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, .05, z); edgeG.add(m); };
  label('480 ft  ·  146 m', 0, HALF + 3, 0); label('480 ft  ·  146 m', HALF + 3, 0, Math.PI / 2); }
const grid = (() => { const pts = [], n = 12; for (let i = 1; i < n; i++) { const v = -HALF + i * AREA / n; pts.push(-HALF, .04, v, HALF, .04, v, v, .04, -HALF, v, .04, HALF); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .14, depthWrite: false })); })();
scene.add(grid);
const flatRing = (col, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 128).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, fog: false, toneMapped: false })); m.renderOrder = 2; scene.add(m); return m; };
const fogRing = flatRing(0xffffff, .7), brushRing = flatRing(0xff8a2a, .9); brushRing.visible = false;

// ------------------------------------------------------------------ drawing: one instanced draw a model a version a material, refilled when the view moves
const LAYERS = []; let drawn = { obj: 0, tris: 0, draws: 0 };
function layer(ai, l) { const L = LAYERS[ai * 2 + l]; if (L) return L; return LAYERS[ai * 2 + l] = { ai, l, cap: 0, n: 0, arr: null, attr: null, meshes: [], tris: 0 }; }
function ensure(L, n) { if (n <= L.cap) return; let cap = Math.max(32, L.cap); while (cap < n) cap *= 2;
  for (const m of L.meshes) { scene.remove(m); m.dispose(); }
  L.cap = cap; L.arr = new Float32Array(cap * 16); L.attr = new THREE.InstancedBufferAttribute(L.arr, 16); L.attr.setUsage(THREE.DynamicDrawUsage);
  const A = AS[L.ai], M = MODELS[A.id][L.l ? 'far' : 'near']; L.tris = M.tris;
  L.meshes = M.prims.map(p => { const im = new THREE.InstancedMesh(p.geometry, p.material, cap); im.instanceMatrix = L.attr; im.frustumCulled = false; im.castShadow = L.l === 0 && A.kind !== 'grass'; im.receiveShadow = true; im.count = 0; scene.add(im); return im; }); }
const hitMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: .35, depthWrite: false });
const hitGeo = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true); hitGeo.translate(0, .5, 0);
let hitIM = null;
const focus = new THREE.Vector2(), lastF = new THREE.Vector2(1e9, 1e9);
let pick = new Int8Array(0);
function rebuild() {
  if (needCompact) { let j = 0; for (let i = 0; i < O.length; i++) { if (!O[i].dead) O[j++] = O[i]; else O[i].inO = false; } O.length = j; needCompact = false; }
  const walk = S.mode === 'walk', R = S.fogFt * FT, fx = focus.x, fz = focus.y, cnt = new Int32Array(AS.length * 2);
  if (pick.length < O.length) pick = new Int8Array(O.length * 2);
  let solid = 0;
  for (let i = 0; i < O.length; i++) { const o = O[i], A = AS[o.a], hw = A.hw * o.s, dx = o.x - fx, dz = o.z - fz, d = Math.sqrt(dx * dx + dz * dz); let l = -1;
    if (walk) { if (d < R + hw + .5) l = A.kind === 'grass' ? (d < R * .6 ? 0 : 1) : (d < R * .9 + hw * .5 ? 0 : 1); }
    else if (A.kind === 'grass') { if (d < 42) l = d < 24 ? 0 : 1; } else l = d < NEAR_B + hw ? 0 : 1;
    pick[i] = l; if (l >= 0) cnt[o.a * 2 + l]++; if (S.solid && A.kind === 'tree' && d < (walk ? R + 2 : 40)) solid++; }
  for (let k = 0; k < cnt.length; k++) { if (cnt[k] || LAYERS[k]) { const L = layer(k >> 1, k & 1); ensure(L, cnt[k]); L.n = 0; } }
  for (let i = 0; i < O.length; i++) { const l = pick[i]; if (l < 0) continue; const o = O[i], L = LAYERS[o.a * 2 + l]; L.arr.set(o.m, L.n * 16); L.n++; }
  drawn = { obj: 0, tris: 0, draws: 0 };
  for (const L of LAYERS) { if (!L) continue; for (const m of L.meshes) m.count = L.n; if (L.attr) { L.attr.clearUpdateRanges(); L.attr.addUpdateRange(0, Math.max(16, L.n * 16)); L.attr.needsUpdate = true; }
    if (L.n) { drawn.obj += L.n; drawn.tris += L.n * L.tris; drawn.draws += L.meshes.length; } }
  // the trees' solid parts, when shown
  if (hitIM && (!S.solid || hitIM.userData.cap < solid)) { scene.remove(hitIM); hitIM.dispose(); hitIM = null; }
  if (S.solid) { if (!hitIM) { const cap = Math.max(64, solid * 2); hitIM = new THREE.InstancedMesh(hitGeo, hitMat, cap); hitIM.userData.cap = cap; hitIM.frustumCulled = false; scene.add(hitIM); }
    let n = 0; for (const o of O) { const A = AS[o.a]; if (A.kind !== 'tree') continue; const d = Math.hypot(o.x - fx, o.z - fz); if (d > (walk ? R + 2 : 40)) continue;
      _m.compose(_p.set(o.x, 0, o.z), _q.identity(), _s.set(A.trunk * o.s, A.meta.collider.h * o.s, A.trunk * o.s)); hitIM.setMatrixAt(n++, _m); }
    hitIM.count = n; hitIM.instanceMatrix.needsUpdate = true; }
  lastF.copy(focus); dirty = false;
}

// ------------------------------------------------------------------ the camera, building and walking
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .1; controls.maxPolarAngle = Math.PI * .49; controls.minDistance = 3; controls.maxDistance = 380;
controls.screenSpacePanning = false;
const walk = { x: 0, z: 0, yaw: 0, pitch: -.05, keys: {}, joy: [0, 0] };
function setLook(mode) {
  const w = mode === 'walk', R = S.fogFt * FT;
  FOGU.mode.value = w ? 1 : 0;
  if (w) { fogColor(scene.fog, MIST); scene.fog.near = R * .3; scene.fog.far = R; sky.set(MIST, MIST_UP); sun.intensity = 1.5; hemi.intensity = .95; scene.environmentIntensity = .45; renderer.toneMappingExposure = 1.1; }
  else { fogColor(scene.fog, SKY.hz); scene.fog.near = 260; scene.fog.far = 900; sky.set(SKY.hz, SKY.zn); sun.intensity = 2.9; hemi.intensity = 0; scene.environmentIntensity = .6; renderer.toneMappingExposure = 1.05; }
  outer.visible = edgeG.visible = !w; grid.visible = !w && S.grid; fogRing.visible = !w && S.ring; brushRing.visible = false;
}
function setMode(m) {
  const from = S.mode; closePops(); S.mode = m; document.body.dataset.mode = m; $('modeb').textContent = m === 'walk' ? 'Build' : 'Walk'; $('joy').hidden = !(m === 'walk' && phone);
  if (m === 'walk') { const t = controls.target, dx = t.x - camera.position.x, dz = t.z - camera.position.z;
    walk.x = Math.max(-HALF + 1, Math.min(HALF - 1, t.x)); walk.z = Math.max(-HALF + 1, Math.min(HALF - 1, t.z)); walk.yaw = Math.atan2(-dx, -dz); walk.pitch = -.06;
    controls.enabled = false; figure.visible = S.behind; stepWalk(0);
    hint(`Fog circle: ${S.fogFt} ft. ` + (phone ? 'Left thumb walks (push to the edge to jog); drag to look.' : 'W A S D walk, Shift jogs, drag to look.'), 5000); }
  else { if (from === 'walk') { const sy = Math.sin(walk.yaw), cy = Math.cos(walk.yaw); controls.target.set(walk.x, 0, walk.z); camera.position.set(walk.x + sy * 26, 30, walk.z + cy * 26); } controls.enabled = true; figure.visible = false; controls.update(); }
  setLook(m); dirty = true; stats();
}
function stepWalk(dt) {
  const k = walk.keys; let f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - walk.joy[1], s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + walk.joy[0];
  if (k.ArrowLeft) walk.yaw += dt * 1.8; if (k.ArrowRight) walk.yaw -= dt * 1.8;
  const mag = Math.hypot(f, s); if (mag > 1) { f /= mag; s /= mag; }
  const jm = Math.hypot(walk.joy[0], walk.joy[1]), run = k.ShiftLeft || k.ShiftRight || jm > .92;
  const sp = (run ? 4 : 1.7) * dt, sy = Math.sin(walk.yaw), cy = Math.cos(walk.yaw);
  let nx = walk.x + (-sy * f + cy * s) * sp, nz = walk.z + (-cy * f - sy * s) * sp, hit = null;
  for (let it = 0; it < 3; it++) any(nx, nz, 2.4, o => { const A = AS[o.a]; if (A.kind !== 'tree') return false; const rr = A.trunk * o.s + .3, dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz);
    if (d < rr && d > 1e-6) { nx = o.x + dx / d * rr; nz = o.z + dz / d * rr; hit = A; } return false; });
  walk.x = Math.max(-HALF + .3, Math.min(HALF - .3, nx)); walk.z = Math.max(-HALF + .3, Math.min(HALF - .3, nz));
  if (hit && (f || s)) hint(`Blocked: ${hit.meta.name} is solid`, 1200);
  if (S.behind) { figure.visible = true; figure.position.set(walk.x, 0, walk.z); figure.rotation.y = walk.yaw;
    const back = 3.4, cp = Math.cos(walk.pitch * .6 - .32), sp2 = Math.sin(walk.pitch * .6 - .32);
    camera.position.set(walk.x + sy * back * cp, 1.5 - sp2 * back, walk.z + cy * back * cp); camera.lookAt(walk.x - sy * 1.2, 1.15 + walk.pitch * 1.5, walk.z - cy * 1.2); }
  else { figure.visible = false; camera.position.set(walk.x, 1.62, walk.z); camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ'); }
  focus.set(walk.x, walk.z); FOGU.c.value.copy(focus);
}

// ------------------------------------------------------------------ undo, saving, loading
const undoStack = []; let saveT = 0;
function pushUndo(act) { if (!act.add.length && !act.del.length) return; undoStack.push(act); if (undoStack.length > 60) undoStack.shift(); saveSoon(); }
function undo() { const a = undoStack.pop(); if (!a) { hint('Nothing to undo'); return; } for (const o of a.add) delObj(o); for (const o of a.del) reAdd(o); saveSoon(); stats(); }
function layoutJSON() { const ids = AS.map(a => a.id), r2 = v => Math.round(v * 100) / 100;
  return JSON.stringify({ app: 'Field & Forest', v: 1, area_ft: 480, units: 'm', origin: 'the centre of the square, y up, x east, z south', marks, ground: S.ground, ids, objects: O.filter(o => !o.dead).map(o => [o.a, r2(o.x), r2(o.z), r2(o.yaw), r2(o.s)]) }); }
function saveSoon() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, layoutJSON()); } catch (e) { } }, 1200); }
function applyLayout(txt) { const L = JSON.parse(txt); if (!L || !Array.isArray(L.objects) || !Array.isArray(L.ids)) throw new Error('not a layout');
  const map = L.ids.map(id => IDX[id]), del = O.filter(o => !o.dead); clearAll(); const add = [];
  for (const r of L.objects) { const ai = map[r[0]]; if (ai === undefined || !isFinite(r[1]) || !isFinite(r[2])) continue; add.push(addObj(ai, Math.max(-HALF, Math.min(HALF, r[1])), Math.max(-HALF, Math.min(HALF, r[2])), +r[3] || 0, +r[4] || 1)); }
  marks = !!L.marks; if (L.ground && ['Forest floor', 'Grass', 'Dirt'].includes(L.ground)) S.ground = L.ground; setGround(); return { add, del }; }
function dialog(title, text, buttons) { $('dlgt').textContent = title; const x = $('dlgx'); x.value = text; x.readOnly = !buttons.some(b => b.load); const bb = $('dlgb'); bb.innerHTML = '';
  for (const b of buttons) { const e = document.createElement('button'); e.textContent = b.t; if (b.on) e.classList.add('on'); e.onclick = () => { if (b.fn(x.value) !== false) $('dlg').hidden = true; }; bb.appendChild(e); }
  $('dlg').hidden = false; if (!x.readOnly) x.focus(); else { x.focus(); x.select(); } }

// ------------------------------------------------------------------ painting and placing
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gp = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hp = new THREE.Vector3();
function groundAt(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); return ray.ray.intersectPlane(gp, hp) ? [hp.x, hp.z] : null; }
let stroke = null, pend = null, down = null; const ptrs = new Set(), look = { id: null, x: 0, y: 0 };
const brushR = () => S.brush * FT;
function dab(x, z) { if (!stroke) return; const R = brushR();
  if (S.tool === 'erase') any(x, z, R + .1, o => { if (Math.hypot(o.x - x, o.z - z) < R) { delObj(o); stroke.del.push(o); } return false; });
  else scatter(spec(), Math.PI * R * R, disc(x, z, R), stroke.add);
  stroke.last = [x, z]; }
function begin(p) { stroke = { add: [], del: [], last: null }; if (p) dab(p[0], p[1]); }
function end() { if (stroke) { pushUndo(stroke); stroke = null; stats(); } }
function placeOne(p) { const sp = spec(), act = { add: [], del: [] }; let ai;
  if (S.sel.startsWith('mix:')) ai = pickFrom(sp.tree || sp.bush || sp.grass); else ai = IDX[S.sel];
  const A = AS[ai], n = A.kind === 'grass' ? 6 : 1;
  for (let i = 0; i < n; i++) { const a = RND() * TAU, r = i ? .25 + RND() * .6 : 0, x = p[0] + Math.cos(a) * r, z = p[1] + Math.sin(a) * r; if (Math.abs(x) > HALF || Math.abs(z) > HALF) continue;
    act.add.push(addObj(ai, x, z, RND() * TAU, scaleFor(A.meta, S, RND))); }
  pushUndo(act); stats(); }
function showBrush(p) { if (!p || S.tool === 'place' || S.mode !== 'build') { brushRing.visible = false; return; } brushRing.visible = true; brushRing.position.set(p[0], .08, p[1]); brushRing.scale.setScalar(brushR()); brushRing.material.color.set(S.tool === 'erase' ? 0xff3b2f : 0xff8a2a); }
canvas.addEventListener('pointerdown', e => { closePops(); ptrs.add(e.pointerId);
  if (S.mode === 'walk') { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; canvas.setPointerCapture(e.pointerId); return; }
  if (ptrs.size > 1) { if (pend) { clearTimeout(pend.t); pend = null; } end(); brushRing.visible = false; return; }
  if (e.button !== 0) return;
  if (S.tool === 'place') { down = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
  const p0 = groundAt(e); if (!p0) return;
  pend = { x: e.clientX, y: e.clientY, p: p0, t: setTimeout(() => { if (pend) { begin(pend.p); showBrush(pend.p); pend = null; } }, e.pointerType === 'touch' ? 120 : 0) }; });
canvas.addEventListener('pointermove', e => {
  if (S.mode === 'walk') { if (look.id === e.pointerId) { walk.yaw -= (e.clientX - look.x) * .0055; walk.pitch = Math.max(-1.2, Math.min(1.2, walk.pitch - (e.clientY - look.y) * .0045)); look.x = e.clientX; look.y = e.clientY; } return; }
  if (ptrs.size > 1) return;
  const p = groundAt(e); if (e.pointerType === 'mouse' || stroke) showBrush(p);
  if (pend && Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > 6) { clearTimeout(pend.t); begin(pend.p); pend = null; }
  if (stroke && p && (!stroke.last || Math.hypot(p[0] - stroke.last[0], p[1] - stroke.last[1]) > brushR() * .45)) dab(p[0], p[1]); });
const up = e => { ptrs.delete(e.pointerId); if (look.id === e.pointerId) look.id = null;
  if (pend) { clearTimeout(pend.t); begin(pend.p); pend = null; } end(); if (e.pointerType !== 'mouse') brushRing.visible = false;
  if (down && S.mode === 'build' && S.tool === 'place') { const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (moved < 9 && dt < 450 && ptrs.size === 0) { const p = groundAt(e); if (p && Math.abs(p[0]) <= HALF && Math.abs(p[1]) <= HALF) placeOne(p); else hint('Tap inside the 480 ft square'); } } };
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') brushRing.visible = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); undo(); return; } walk.keys[e.code] = true; });
addEventListener('keyup', e => { walk.keys[e.code] = false; });
{ const J = $('joy'), K = $('knob'); let jid = null, c = null;
  J.addEventListener('pointerdown', e => { jid = e.pointerId; J.setPointerCapture(jid); const r = J.getBoundingClientRect(); c = [r.left + r.width / 2, r.top + r.height / 2]; mv(e); e.stopPropagation(); });
  const mv = e => { if (e.pointerId !== jid) return; let dx = e.clientX - c[0], dy = e.clientY - c[1]; const l = Math.hypot(dx, dy), mx = 46; if (l > mx) { dx *= mx / l; dy *= mx / l; } K.style.transform = `translate(${dx}px,${dy}px)`; walk.joy = [dx / mx, dy / mx]; };
  J.addEventListener('pointermove', mv); const u = e => { if (e.pointerId !== jid) return; jid = null; walk.joy = [0, 0]; K.style.transform = ''; }; J.addEventListener('pointerup', u); J.addEventListener('pointercancel', u); }

// ------------------------------------------------------------------ the bar and its lists
const fmtK = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : fmt(n);
let fps = 60;
function stats() { const el = $('stats'), live = O.length - (needCompact ? O.filter(o => o.dead).length : 0);
  let trees = 0; for (const o of O) if (!o.dead && AS[o.a].kind === 'tree') trees++;
  const line2 = `<b>${fmtK(drawn.tris)}</b> tris · ${drawn.draws} draws · <b>${Math.round(fps)}</b> fps`;
  el.innerHTML = S.mode === 'walk' ? `In the ${S.fogFt} ft fog circle: <b>${fmt(drawn.obj)}</b> of ${fmt(live)} objects<br>${line2}`
    : `<b>${fmt(live)}</b> objects · ${fmt(trees)} trees · ${fmt(drawn.obj)} drawn<br>${line2}`; }
const selName = () => S.sel.startsWith('mix:') ? MIX[S.sel.slice(4)].name : AS[IDX[S.sel]].meta.name;
const selPlant = () => S.sel.startsWith('mix:') || plant(AS[IDX[S.sel]].meta);
function btnLabels() { $('assetb').textContent = selName() + (selPlant() && Math.abs(S.size - 1) > .001 ? ` ${Math.round(S.size * 100)}%` : ''); $('toolb').textContent = { place: 'Place', paint: 'Paint', erase: 'Erase' }[S.tool]; }
function closePops() { document.querySelectorAll('.pop').forEach(p => p.hidden = true); ['assetb', 'toolb', 'more'].forEach(i => $(i).classList.remove('on')); }
function openPop(btn, pop, fill) { const was = !$(pop).hidden; closePops(); if (was) return; fill(); $(pop).hidden = false; $(btn).classList.add('on'); }
const P = (pop) => { const p = $(pop); p.innerHTML = ''; return { grp: t => { const h = document.createElement('div'); h.className = 'grp'; h.textContent = t; p.appendChild(h); },
  btn: (t, on, fn, cls) => { const b = document.createElement('button'); b.textContent = t; if (on) b.classList.add('on'); if (cls) b.className += ' ' + cls; b.onclick = fn; p.appendChild(b); return b; },
  slider: (lab, min, max, step, v, show, set) => { const r = document.createElement('div'); r.className = 'slrow'; r.innerHTML = `<span class="lab">${lab}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val"></span>`;
    const i = r.querySelector('input'), o = r.querySelector('.val'); o.textContent = show(v); i.oninput = () => { set(+i.value); o.textContent = show(+i.value); }; p.appendChild(r); },
  el: p }; };
function fillAssets() { const p = P('assets');
  const lab = () => { if (!selPlant()) return 'props stay real size'; if (S.sel.startsWith('mix:')) return `${Math.round(S.size * 100)}% of each plant`; const A = AS[IDX[S.sel]].meta; return `${Math.round(S.size * 100)}% · ${ft(A.size_m[1] * S.size)} tall`; };
  sizeRow(p.el, S, lab, btnLabels).disabled = !selPlant();
  p.grp('Mixes');
  for (const m of MIXES) p.btn(m.name, S.sel === 'mix:' + m.id, () => { S.sel = 'mix:' + m.id; btnLabels(); closePops(); hint(`${m.name}: paint it on with the brush`); });
  let g0 = ''; for (const A of AS) { const g = A.meta.group; if (g !== g0) { g0 = g; p.grp(g + (g === 'Trees' ? ' · solid' : '')); }
    p.btn(A.meta.name, S.sel === A.id, () => { S.sel = A.id; btnLabels(); closePops(); hint(A.meta.where, 4000); }); } }
function fillTool() { const p = P('toolp'); p.grp('Tool');
  for (const [k, t] of [['place', 'Place'], ['paint', 'Paint'], ['erase', 'Erase']]) p.btn(t, S.tool === k, () => { S.tool = k; controls.enableRotate = k === 'place'; btnLabels(); fillTool(); });
  p.grp(S.tool === 'place' ? 'Tap to place one (grass goes down as a patch)' : S.tool === 'erase' ? 'Drag to erase everything under the brush' : 'Drag to paint; two fingers (or the right button) move the map');
  if (S.tool !== 'place') { p.slider('Brush', 5, 80, 5, S.brush, v => `${v * 2} ft across`, v => { S.brush = v; });
    if (S.tool === 'paint') { p.grp('Density'); ['Sparse', 'Normal', 'Thick'].forEach((t, i) => p.btn(t, S.density === i, () => { S.density = i; fillTool(); })); } } }
function fillMore() { const p = P('morep'), again = () => fillMore();
  if (S.mode === 'walk') { p.grp('View'); p.btn('Behind', S.behind, () => { S.behind = true; again(); }); p.btn('Eyes', !S.behind, () => { S.behind = false; again(); }); }
  p.slider('Fog', 20, 160, 5, S.fogFt, v => `${v} ft circle`, v => { S.fogFt = v; fogRing.scale.setScalar(v * FT); setLook(S.mode); dirty = true; });
  p.grp('Show'); p.btn('Solid parts', S.solid, () => { S.solid = !S.solid; dirty = true; again(); });
  if (S.mode === 'build') { p.btn('40 ft grid', S.grid, () => { S.grid = !S.grid; grid.visible = S.grid; again(); }); p.btn('Fog circle', S.ring, () => { S.ring = !S.ring; fogRing.visible = S.ring; again(); });
    p.grp('Ground'); for (const g of ['Forest floor', 'Grass', 'Dirt']) p.btn(g, S.ground === g, () => { S.ground = g; setGround(); saveSoon(); again(); });
    p.grp('Layout');
    p.btn('Sample forest', false, () => { closePops(); const del = O.filter(o => !o.dead); clearAll(); marks = true; setGround(); pushUndo({ add: sampleForest(), del }); stats(); hint('The sample forest: woods, an aspen grove, a creek, a clearing and a path'); });
    p.btn('Fill all with ' + selName(), false, () => { closePops(); const act = { add: [], del: [] }; seed = (Date.now() % 100000) + 7; scatter(spec(), AREA * AREA, rect, act.add); pushUndo(act); stats(); hint(`Added ${fmt(act.add.length)} objects`); });
    p.btn('Copy layout', false, () => { const j = layoutJSON(); closePops();
      const fall = () => dialog('The layout (select it all and copy)', j, [{ t: 'Done', on: true, fn: () => { } }]);
      try { navigator.clipboard.writeText(j).then(() => hint(`Copied: ${fmt(O.length)} objects, ${Math.round(j.length / 1024)} KB of text`), fall); } catch (e) { fall(); } });
    p.btn('Load layout', false, () => { closePops(); dialog('Paste a layout here', '', [{ t: 'Cancel', fn: () => { } }, { t: 'Load', on: true, load: true, fn: v => { try { const act = applyLayout(v); pushUndo(act); stats(); hint(`Loaded ${fmt(act.add.length)} objects`); } catch (e) { hint('That isn’t a layout from this page'); return false; } } }]); });
    p.btn('Clear', false, () => { closePops(); const del = O.filter(o => !o.dead); clearAll(); marks = false; setGround(); pushUndo({ add: [], del }); stats(); hint('Cleared. Undo brings it back.'); }, 'warn'); } }
function buildUI() {
  $('modeb').onclick = () => setMode(S.mode === 'walk' ? 'build' : 'walk');
  $('assetb').onclick = () => openPop('assetb', 'assets', fillAssets);
  $('toolb').onclick = () => openPop('toolb', 'toolp', fillTool);
  $('more').onclick = () => openPop('more', 'morep', fillMore);
  $('undo').onclick = () => undo();
  btnLabels(); controls.enableRotate = S.tool === 'place';
}

// ------------------------------------------------------------------ loop
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 64 : 55; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
let last = performance.now(), fpsT = 0, fpsN = 0;
function frame(t) { const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (S.mode === 'walk') stepWalk(dt); else { controls.update(); focus.set(controls.target.x, controls.target.z); fogRing.position.set(focus.x, .07, focus.y); }
  if (dirty || focus.distanceTo(lastF) > (S.mode === 'walk' ? .6 : 3)) { rebuild(); stats(); }
  sun.aim(new THREE.Vector3(focus.x, 0, focus.y), S.mode === 'walk' ? 24 : 46);
  renderer.render(scene, camera);
  fpsN++; fpsT += dt; if (fpsT > .6) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; stats(); }
  requestAnimationFrame(frame); }

(async () => {
  resize(); MODELS = await loadModels(DATA);
  DATA.manifest.assets.forEach((a, i) => { IDX[a.id] = i; const kind = KIND[a.group]; AS.push({ id: a.id, meta: a, kind, hw: Math.max(a.size_m[0], a.size_m[2]) / 2, trunk: a.collider ? a.collider.r : 0 }); });
  MAXHW = Math.max(...AS.filter(a => a.kind === 'tree').map(a => a.hw)) * 1.6;
  let loaded = false; if (!Q.has('fresh')) try { const j = localStorage.getItem(KEY); if (j) { applyLayout(j); loaded = O.length > 0; } } catch (e) { }
  if (!loaded) { marks = true; setGround(); sampleForest(); }
  if (Q.has('fog')) S.fogFt = +Q.get('fog'); fogRing.scale.setScalar(S.fogFt * FT);
  const tall = innerHeight > innerWidth * 1.1, tz = 18, tx = pathX(tz);
  controls.target.set(tx, 0, tz); camera.position.set(tx + (tall ? 70 : 62), tall ? 120 : 82, tz + (tall ? 115 : 96)); controls.update();
  $('loading').hidden = true; buildUI(); setMode(Q.get('mode') === 'walk' ? 'walk' : 'build');
  if (!Q.has('shot')) hint(loaded ? 'Your last forest, as you left it' : 'A sample forest to start with. Drag to paint Mixed woods; ••• › Clear to start from nothing.', 6000);
  window.__api = { S, O, walk, setMode, stepWalk, rebuild, stats, controls, camera, sampleForest, fillTool, fillMore, fillAssets, get drawn() { return drawn; }, AS, IDX, any, scatter, spec, disc, layoutJSON, applyLayout, undo, setGround, get fps() { return fps; }, pathX, creekZ, begin, dab, end };
  requestAnimationFrame(frame); window.__ready = true;
})();
