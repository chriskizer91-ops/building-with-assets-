// Page 1: each piece on its own (Look), a 60 x 60 ft plot to place them on (Plot), and a walk round it (Walk)
import { THREE, FT, $, fmt, ft, phone, Q, makeRenderer, makeSky, makeSun, SKY, fogColor, GROUNDS, groundMesh, tintOf, person, loadModels, hint, sizeRow, scaleFor, plant, fbm } from './common.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import DATA from './data.js';

const PLOT = 60 * FT, HALF = PLOT / 2;
const canvas = $('cv'), renderer = makeRenderer(canvas, phone ? 2 : 1.5);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, .05, 900);
makeSky(scene, renderer); scene.fog = new THREE.Fog(0xffffff, 45, 210); fogColor(scene.fog, SKY.hz);
const sun = makeSun(scene);

const outer = groundMesh(renderer, 700, 140, 'Grass', 0, (x, z) => { const a = fbm(x * .02 + 3, z * .02), s = .68 + .3 * a; return [s * (1 + .35 * (a - .4)), s * .95, s * .85]; }); scene.add(outer);
const plotG = new THREE.Group(); scene.add(plotG);
let plotGround = null, groundKind = 'Grass';
function setGround(k) { groundKind = k; if (plotGround) { plotG.remove(plotGround); plotGround.geometry.dispose(); } plotGround = groundMesh(renderer, PLOT, 48, k, .006, tintOf(k)); plotG.add(plotGround); }
setGround('Grass');
{ const chalk = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 1 });
  for (const [x, z, w, d] of [[0, -HALF, PLOT + .06, .06], [0, HALF, PLOT + .06, .06], [-HALF, 0, .06, PLOT], [HALF, 0, .06, PLOT]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, .01, d), chalk); b.position.set(x, .012, z); b.receiveShadow = true; plotG.add(b); }
  const stake = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: .9 }), flag = new THREE.MeshStandardMaterial({ color: 0xff5a14, roughness: .7, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(.05, .5, .05), stake); s.position.set(sx * HALF, .25, sz * HALF); s.castShadow = true; plotG.add(s);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(.18, .07), flag); f.position.set(sx * HALF + .09, .44, sz * HALF); plotG.add(f); }
  const label = (txt, x, z, rot) => { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.fillStyle = 'rgba(240,236,228,.92)'; g.font = '600 54px -apple-system,Segoe UI,Roboto,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .64), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
    m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, .02, z); plotG.add(m); };
  label('60 ft  ·  18.3 m', 0, HALF + .7, 0); label('60 ft  ·  18.3 m', HALF + .7, 0, Math.PI / 2); }
const grid = (() => { const pts = []; for (let i = -3; i <= 3; i++) { const v = i * 10 * FT; pts.push(-HALF, .015, v, HALF, .015, v, v, .015, -HALF, v, .015, HALF); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .16, depthWrite: false })); })();
plotG.add(grid);
const figure = person(); scene.add(figure);

let MODELS = {}; const ORDER = DATA.manifest.assets.map(a => a.id);
const S = { size: 1, vary: true };
let mode = 'look', cur = Q.get('asset') || 'tree_oak', lod = Q.get('lod') === 'far' ? 'far' : 'near', showHit = false, showFig = true, spin = !Q.has('shot');
if (Q.has('size')) S.size = +Q.get('size');
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .09; controls.maxPolarAngle = Math.PI * .495;
controls.addEventListener('start', () => { spin = false; });
const lookG = new THREE.Group(); scene.add(lookG);
const hitMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: .33, depthWrite: false });
const hitGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); hitGeo.translate(0, .5, 0);
const hitG = new THREE.Group(); scene.add(hitG);
const meta = id => MODELS[id].meta, lookScale = () => plant(meta(cur)) ? S.size : 1;

function showLook() {
  lookG.clear(); hitG.clear(); const M = MODELS[cur], A = M.meta, o = M[lod].scene.clone(), k = lookScale(); o.scale.setScalar(k); lookG.add(o);
  const box = new THREE.Box3().setFromObject(o), sz = box.getSize(new THREE.Vector3()), big = Math.max(sz.x, sz.y, sz.z);
  figure.visible = showFig; figure.position.set(-(Math.max(sz.x, sz.z) / 2 + (big < 1.5 ? .9 : .6)), 0, big < 1.5 ? -.7 : 0); figure.rotation.y = .5;
  if (showHit && A.collider) { const h = new THREE.Mesh(hitGeo, hitMat); h.scale.set(A.collider.r * k, A.collider.h * k, A.collider.r * k); hitG.add(h); }
  const ty = Math.max(sz.y * .45, .15), d = Math.max(big * 1.35, 1.1) + (big < 1.5 ? .6 : 2);
  controls.target.set(0, ty, 0); camera.position.set(d * .78, ty + d * .38, d * .9); controls.minDistance = .35; controls.maxDistance = Math.max(30, big * 5); controls.update();
  sun.aim(new THREE.Vector3(0, sz.y / 2, 0), Math.max(big * .85, 3)); plotG.visible = false; inst.visible = false; stats();
}

// ---- the plot: every model drawn instanced, one draw per model per material
const inst = new THREE.Group(); scene.add(inst);
let placed = [], acts = [];
function rebuildPlot() {
  inst.clear(); hitG.clear();
  const by = {}; for (const p of placed) (by[p.id] = by[p.id] || []).push(p);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (const id in by) { const L = by[id], M = MODELS[id][lod];
    for (const pr of M.prims) { const im = new THREE.InstancedMesh(pr.geometry, pr.material, L.length); im.castShadow = im.receiveShadow = true;
      L.forEach((p, i) => { e.set(0, p.yaw, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(p.x, 0, p.z), q, new THREE.Vector3(p.s, p.s, p.s)); im.setMatrixAt(i, m4); });
      im.computeBoundingSphere(); inst.add(im); }
    const C = meta(id).collider; if (showHit && C) for (const p of L) { const h = new THREE.Mesh(hitGeo, hitMat); h.position.set(p.x, 0, p.z); h.scale.set(C.r * p.s, C.h * p.s, C.r * p.s); hitG.add(h); } }
  stats();
}
let seed = 1; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const isGrass = id => meta(id).group === 'Grass';
function placeAt(id, x, z, act, s0) { const A = meta(id), n = isGrass(id) ? 6 : 1, out = [];
  for (let i = 0; i < n; i++) { const a = R() * 6.283, r = i ? .25 + R() * .6 : 0, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (Math.abs(px) > HALF || Math.abs(pz) > HALF) continue;
    out.push({ id, x: px, z: pz, yaw: R() * 6.283, s: s0 ? s0 * (.92 + R() * .16) : scaleFor(A, S, R) }); }
  placed.push(...out); if (act !== false) acts.push(out.length); return out.length; }
function sampleCountry() {
  placed = []; acts = []; seed = 7;
  for (const [id, x, z] of [['tree_cottonwood', -5.4, -4.8], ['tree_ponderosa', 6.2, -6.4], ['tree_mesquite', 4.6, 5.2], ['tree_snag', -6.4, 6.3]]) placeAt(id, x, z, false, 1);
  for (const [id, x, z] of [['bush_sage', 1.8, -1.2], ['bush_sage', -.8, 2.6], ['bush_sage', 7.6, 1.2], ['bush_sage', -2.8, -.6], ['bush_oleander', -8.2, -1.4], ['bush_oleander', -8.1, 1.3], ['bush_pricklypear', 2.6, 7.6], ['bush_pricklypear', 7.8, 3.3], ['bush_pricklypear', 8.3, 7.9]]) placeAt(id, x, z, false, 1);
  for (let i = 0; i < 26; i++) placeAt('grass_meadow', -8.6 + R() * 9, -8.6 + R() * 17, false, 1);
  for (let i = 0; i < 22; i++) placeAt('grass_dry', R() * 8.6, -8.6 + R() * 17, false, 1);
  for (let i = 0; i < 5; i++) placeAt('grass_reeds', -1.5 + R() * 3, -7.6 + R() * 1.8, false, 1);
  for (const [id, x, z, yaw] of [['prop_mailbox', 8.5, -1.6, -Math.PI / 2], ['prop_drum', -2.2, 6.9, 1], ['prop_drum', -1.5, 7.3, 2.1], ['prop_tires', .4, 6.6, .3], ['prop_icechest', -4.4, 8.55, Math.PI], ['prop_hydrant', 8.4, -8.4, -.8]]) placed.push({ id, x, z, yaw, s: 1 });
  rebuildPlot();
}
// the new trees together, at a few sizes (the size control's sizes)
function sampleWoods() {
  placed = []; acts = []; seed = 11;
  for (const [id, x, z, s] of [['tree_spruce', 6.4, -6.6, 1], ['tree_spruce', 8.1, -1.8, .7], ['tree_spruce', 3.2, -8.3, .55], ['tree_oak', -4.6, -4.4, .8],
    ['tree_aspen', -6.8, 4.2, 1], ['tree_aspen', -4.6, 6.4, .9], ['tree_aspen', -7.8, 7.6, 1.1], ['tree_aspen', -3.4, 3.4, .8], ['tree_aspen', -8.4, 1.6, .7], ['tree_willow', 5.4, 5.6, .75], ['tree_snag', 1.3, -1.8, .75]]) placeAt(id, x, z, false, s);
  for (let i = 0; i < 46; i++) { const x = -8.8 + R() * 17.6, z = -8.8 + R() * 17.6; if (Math.hypot(x - 5.4, z - 5.6) < 1.2) continue; placeAt('grass_meadow', x, z, false, 1); }
  for (let i = 0; i < 6; i++) placeAt('grass_reeds', 2.2 + R() * 6, 7.4 + R() * 1.6, false, 1);
  for (let i = 0; i < 6; i++) placeAt('grass_dry', 1 + R() * 7, -4 + R() * 4, false, 1);
  placed.push({ id: 'prop_drum', x: .2, z: -.6, yaw: .7, s: 1 });
  rebuildPlot();
}
function showPlot() { lookG.clear(); plotG.visible = true; inst.visible = true; figure.visible = showFig; figure.position.set(HALF - .9, 0, HALF - .9); figure.rotation.y = -2.4;
  if (!placed.length && !Q.has('empty')) (Q.get('sample') === 'woods' ? sampleWoods : sampleCountry)(); else rebuildPlot();
  const tall = innerHeight > innerWidth * 1.1; controls.target.set(0, tall ? .2 : 1.2, 0); camera.position.set(...(tall ? [16, 22, 24] : [15.5, 11.5, 19])); controls.minDistance = 2; controls.maxDistance = 70; controls.update(); sun.aim(new THREE.Vector3(0, 4, 0), 17); }

// ---- walking: trees stop you, everything else lets you through
const walk = { x: 0, z: HALF - 1, yaw: 0, pitch: -.05, keys: {}, joy: [0, 0], behind: true };
function showWalk() { lookG.clear(); plotG.visible = true; inst.visible = true; if (!placed.length) sampleCountry(); else rebuildPlot(); sun.aim(new THREE.Vector3(0, 4, 0), 17); }
function stepWalk(dt) {
  const k = walk.keys; let f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - walk.joy[1], s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + walk.joy[0];
  if (k.ArrowLeft) walk.yaw += dt * 1.8; if (k.ArrowRight) walk.yaw -= dt * 1.8;
  const l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
  const sp = (k.ShiftLeft || k.ShiftRight ? 4.5 : 1.7) * dt, sy = Math.sin(walk.yaw), cy = Math.cos(walk.yaw);
  let nx = walk.x + (-sy * f + cy * s) * sp, nz = walk.z + (-cy * f - sy * s) * sp, hit = null, through = null;
  for (let it = 0; it < 3; it++) for (const p of placed) { const A = meta(p.id), dx = nx - p.x, dz = nz - p.z, d = Math.hypot(dx, dz);
    if (A.collider) { const rr = A.collider.r * p.s + .3; if (d < rr && d > 1e-6) { nx = p.x + dx / d * rr; nz = p.z + dz / d * rr; hit = A; } }
    else if (it === 0 && d < Math.max(.35, Math.max(A.size_m[0], A.size_m[2]) * p.s * .35) && (!through || A.size_m[1] > through.size_m[1])) through = A; }
  const LIM = HALF + 2.5; walk.x = Math.max(-LIM, Math.min(LIM, nx)); walk.z = Math.max(-LIM, Math.min(LIM, nz));
  const msg = hit ? `Blocked: ${hit.name} is solid` : through ? `Walking through ${through.name}: it passes through` : ''; if (msg) hint(msg, 1400);
  placeCam();
}
function placeCam() { const sy = Math.sin(walk.yaw), cy = Math.cos(walk.yaw);
  if (walk.behind) { figure.visible = true; figure.position.set(walk.x, 0, walk.z); figure.rotation.y = walk.yaw;
    const back = 3.4, cp = Math.cos(walk.pitch * .6 - .32), sp2 = Math.sin(walk.pitch * .6 - .32);
    camera.position.set(walk.x + sy * back * cp, 1.5 - sp2 * back, walk.z + cy * back * cp); camera.lookAt(walk.x - sy * 1.2, 1.15 + walk.pitch * 1.5, walk.z - cy * 1.2); }
  else { figure.visible = false; camera.position.set(walk.x, 1.62, walk.z); camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ'); } }

function stats() {
  const el = $('stats');
  if (mode === 'look') { const M = MODELS[cur], A = M.meta, L = M[lod], k = lookScale(), s = A.size_m;
    el.innerHTML = `<b>${A.name}</b> · ${A.solid ? '<span class="solid">solid</span>' : 'passes through'}<br>${ft(s[1] * k)} tall, ${ft(Math.max(s[0], s[2]) * k)} wide · <b>${fmt(L.tris)}</b> tris · ${L.prims.length} draw${L.prims.length > 1 ? 's' : ''}${lod === 'far' ? ' · far' : ''}`; }
  else if (mode === 'plot') { let tris = 0, draws = 0; inst.children.forEach(m => { tris += m.count * (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; draws++; });
    el.innerHTML = `<b>${fmt(placed.length)}</b> objects · <b>${fmt(tris)}</b> tris · <b>${draws}</b> draws<br>Placing: ${meta(cur).name}${plant(meta(cur)) ? ` at ${Math.round(S.size * 100)}%` : ''}${lod === 'far' ? ' (far)' : ''}`; }
  else el.innerHTML = `<b>Walking</b> · trees are solid<br>grass, bushes and props pass through`;
}
function btnLabel() { const A = meta(cur); $('assetb').textContent = A.name + (plant(A) && Math.abs(S.size - 1) > .001 ? ` ${Math.round(S.size * 100)}%` : ''); }

// ---- the bar
function setMode(m) { mode = m; document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); closePops();
  document.body.dataset.mode = m; controls.enabled = m !== 'walk'; $('joy').hidden = !(m === 'walk' && phone);
  if (m === 'look') { spin = false; showLook(); } else if (m === 'plot') { showPlot(); hint('Tap the ground to place ' + meta(cur).name + (isGrass(cur) ? ' (grass goes down as a patch)' : '')); }
  else { showWalk(); walk.x = 0; walk.z = HALF + 1.5; walk.yaw = 0; walk.pitch = -.08; placeCam(); hint(phone ? 'Left thumb walks, drag anywhere else to look' : 'W A S D or the arrows walk, Shift runs, drag to look'); }
  stats(); }
let sizeUI = null;
function setAsset(id) { cur = id; btnLabel(); closePops(); if (mode === 'look') showLook(); else hint((mode === 'plot' ? 'Tap to place. ' : '') + meta(id).where, 4500); stats(); }
function closePops() { document.querySelectorAll('.pop').forEach(p => p.hidden = true); $('assetb').classList.remove('on'); $('more').classList.remove('on'); }
const sizeLabel = () => { const A = meta(cur); return plant(A) ? `${Math.round(S.size * 100)}% · ${ft(A.size_m[1] * S.size)} tall` : 'props stay real size'; };
function fillAssets() { const ap = $('assets'); ap.innerHTML = '';
  sizeUI = sizeRow(ap, S, sizeLabel, () => { btnLabel(); if (mode === 'look') showLook(); stats(); }); sizeUI.disabled = !plant(meta(cur));
  let g0 = ''; for (const id of ORDER) { const A = meta(id); if (A.group !== g0) { g0 = A.group; const h = document.createElement('div'); h.className = 'grp'; h.textContent = A.group + (A.group === 'Trees' ? ' · solid' : ''); ap.appendChild(h); }
    const b = document.createElement('button'); b.textContent = A.name; b.dataset.id = id; b.classList.toggle('on', id === cur); b.onclick = () => setAsset(id); ap.appendChild(b); } }
function buildUI() {
  $('assetb').onclick = () => { const was = !$('assets').hidden; closePops(); if (!was) { fillAssets(); $('assets').hidden = false; $('assetb').classList.add('on'); } };
  $('more').onclick = () => { const was = !$('morep').hidden; closePops(); if (!was) { fillMore(); $('morep').hidden = false; $('more').classList.add('on'); } };
  document.querySelectorAll('#modes button').forEach(b => b.onclick = () => setMode(b.dataset.m));
  $('undo').onclick = () => { const n = acts.pop(); if (n) { placed.splice(placed.length - n, n); rebuildPlot(); } else hint('Nothing to undo'); };
}
function fillMore() { const p = $('morep'); p.innerHTML = ''; const add = (t, on, fn, cls) => { const b = document.createElement('button'); b.textContent = t; if (on) b.classList.add('on'); if (cls) b.className += ' ' + cls; b.onclick = () => { fn(); fillMore(); }; p.appendChild(b); };
  const grp = t => { const h = document.createElement('div'); h.className = 'grp'; h.textContent = t; p.appendChild(h); };
  if (mode === 'walk') { grp('View'); add('Behind', walk.behind, () => { walk.behind = true; placeCam(); }); add('Eyes', !walk.behind, () => { walk.behind = false; placeCam(); }); }
  grp('Version'); add('Near', lod === 'near', () => { lod = 'near'; refresh(); }); add('Far', lod === 'far', () => { lod = 'far'; refresh(); });
  grp('Show'); add('Solid part', showHit, () => { showHit = !showHit; refresh(); }); if (mode !== 'walk') add('5′10″ person', showFig, () => { showFig = !showFig; figure.visible = showFig; });
  if (mode === 'look') add('Turn', spin, () => { spin = !spin; });
  if (mode !== 'look') { add('10 ft grid', grid.visible, () => { grid.visible = !grid.visible; });
    grp('Ground'); for (const k of GROUNDS) add(k, groundKind === k, () => setGround(k));
    grp('Plot'); add('Scatter 10 ' + meta(cur).name, false, () => { let n = 0; for (let i = 0; i < 10; i++) n += placeAt(cur, (R() * 2 - 1) * (HALF - .4), (R() * 2 - 1) * (HALF - .4), false); acts.push(n); rebuildPlot(); });
    add('Country sample', false, () => sampleCountry()); add('Woods sample', false, () => sampleWoods()); add('Clear', false, () => { placed = []; acts = []; rebuildPlot(); }, 'warn'); }
}
function refresh() { if (mode === 'look') showLook(); else rebuildPlot(); stats(); }

// ---- input: a tap on the plot places; walking takes the joystick, keys and drags
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gp = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();
let down = null, lookDrag = null;
canvas.addEventListener('pointerdown', e => { closePops(); down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (mode === 'walk') { lookDrag = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); } });
canvas.addEventListener('pointermove', e => { if (mode === 'walk' && lookDrag && lookDrag.id === e.pointerId) { walk.yaw -= (e.clientX - lookDrag.x) * .0055; walk.pitch = Math.max(-1.2, Math.min(1.2, walk.pitch - (e.clientY - lookDrag.y) * .0045)); lookDrag.x = e.clientX; lookDrag.y = e.clientY; } });
canvas.addEventListener('pointerup', e => { lookDrag = null; if (!down || mode !== 'plot') return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null; if (moved > 9 || dt > 450) return;
  const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(gp, hitP)) return; if (Math.abs(hitP.x) > HALF || Math.abs(hitP.z) > HALF) { hint('Tap inside the 60 ft square'); return; }
  placeAt(cur, hitP.x, hitP.z); rebuildPlot(); });
addEventListener('keydown', e => { walk.keys[e.code] = true; }); addEventListener('keyup', e => { walk.keys[e.code] = false; });
{ const J = $('joy'), K = $('knob'); let jid = null, c = null;
  J.addEventListener('pointerdown', e => { jid = e.pointerId; J.setPointerCapture(jid); const r = J.getBoundingClientRect(); c = [r.left + r.width / 2, r.top + r.height / 2]; mv(e); e.stopPropagation(); });
  const mv = e => { if (e.pointerId !== jid) return; let dx = e.clientX - c[0], dy = e.clientY - c[1]; const l = Math.hypot(dx, dy), mx = 46; if (l > mx) { dx *= mx / l; dy *= mx / l; } K.style.transform = `translate(${dx}px,${dy}px)`; walk.joy = [dx / mx, dy / mx]; };
  J.addEventListener('pointermove', mv); const up = e => { if (e.pointerId !== jid) return; jid = null; walk.joy = [0, 0]; K.style.transform = ''; }; J.addEventListener('pointerup', up); J.addEventListener('pointercancel', up); }

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 62 : 50; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
let last = performance.now();
function frame(t) { const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (mode === 'walk') stepWalk(dt); else { if (spin && mode === 'look') { const o = camera.position.clone().sub(controls.target); o.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * .25); camera.position.copy(controls.target).add(o); } controls.update(); }
  renderer.render(scene, camera); requestAnimationFrame(frame); }

(async () => {
  resize(); MODELS = await loadModels(DATA); $('loading').hidden = true; buildUI(); btnLabel();
  setMode(Q.get('mode') || 'look');
  window.__api = { setMode, setAsset, sampleCountry, sampleWoods, walk, placed: () => placed, rebuildPlot, MODELS, stepWalk, S, set lod(v) { lod = v; refresh(); }, set hit(v) { showHit = v; refresh(); }, setGround, showLook };
  requestAnimationFrame(frame); window.__ready = true;
})();
