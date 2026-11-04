// What both pages share: the renderer, sky, light, ground pictures, the figure, the models and the size control.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export { THREE };

export const FT = .3048;
export const $ = id => document.getElementById(id);
export const fmt = n => Math.round(n).toLocaleString('en-US');
export const ft = m => { const f = m / FT; return f < 2.5 ? `${Math.round(f * 12)} in` : `${Math.round(f)} ft`; };
export const phone = matchMedia('(pointer:coarse)').matches;
export const Q = new URLSearchParams(location.search);

export function makeRenderer(canvas, maxDpr) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: Q.has('shot') });
  r.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}

// fog: either the usual (by depth), or a circle round a point on the ground (by flat distance from it)
export const FOGU = { c: { value: new THREE.Vector2() }, mode: { value: 0 } };
const FOG_VERT = `#ifdef USE_FOG
  #ifdef USE_INSTANCING
    vec4 fwp = modelMatrix * instanceMatrix * vec4( transformed, 1.0 );
  #else
    vec4 fwp = modelMatrix * vec4( transformed, 1.0 );
  #endif
  // the circle: flat distance on the ground; height counts for less, so a tree's top fades a little after its trunk
  vFogDepth = uFogMode > .5 ? length( vec3( fwp.x - uFogC.x, ( fwp.y - 1.6 ) * .45, fwp.z - uFogC.y ) ) : - mvPosition.z;
#endif`;
// leaves and grass are lit the same on both faces, the way the game lights its trees; every material gets the fog circle
export function patchMat(m) {
  if (m.userData.ff) return; m.userData.ff = true;
  const two = m.side === THREE.DoubleSide; if (two) m.shadowSide = THREE.DoubleSide;
  m.onBeforeCompile = s => {
    s.uniforms.uFogC = FOGU.c; s.uniforms.uFogMode = FOGU.mode;
    s.vertexShader = 'uniform vec2 uFogC;\nuniform float uFogMode;\n' + s.vertexShader.replace('#include <fog_vertex>', FOG_VERT);
    if (two) s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0'));
  };
  m.customProgramCacheKey = () => two ? 'ff-two' : 'ff-one';
}

// sky and fog colours as they show on screen
export const SKY = { hz: [.84, .8, .73], zn: [.42, .6, .82] };
// (three turns the fog colour into screen colour itself, so it's given here as screen colour)
export const fogColor = (fog, a) => fog.color.setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace);
export function makeSky(scene, renderer) {
  const lin = a => new THREE.Color().setRGB(a[0], a[1], a[2], THREE.LinearSRGBColorSpace);
  const U = { hz: { value: lin(SKY.hz) }, zn: { value: lin(SKY.zn) } };
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 hz,zn;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(hz,zn,pow(clamp(h,0.,1.),.55));c=mix(c,hz*.8,clamp(-h*4.,0.,1.));gl_FragColor=vec4(c,1.);}' });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), mat); sky.frustumCulled = false; scene.add(sky);
  const pm = new THREE.PMREMGenerator(renderer), s2 = new THREE.Scene(); s2.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), mat.clone()));
  const g = new THREE.Mesh(new THREE.CircleGeometry(49, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4a3e2c })); g.position.y = -2; s2.add(g);
  scene.environment = pm.fromScene(s2, .02).texture; scene.environmentIntensity = .6;
  return { mesh: sky, set(hz, zn) { U.hz.value.copy(lin(hz)); U.zn.value.copy(lin(zn)); } };
}

export function makeSun(scene) {
  const sun = new THREE.DirectionalLight(0xfff0da, 2.9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0003; sun.shadow.normalBias = .025;
  scene.add(sun, sun.target);
  const DIR = new THREE.Vector3(.55, .78, .32).normalize();
  sun.aim = (ctr, rad) => { sun.position.copy(ctr).addScaledVector(DIR, rad * 2 + 10); sun.target.position.copy(ctr); const c = sun.shadow.camera; c.left = c.bottom = -rad; c.right = c.top = rad; c.near = .5; c.far = rad * 4 + 30; c.updateProjectionMatrix(); };
  return sun;
}

// ---- noise for the ground pictures and tints
const fr = x => x - Math.floor(x);
export const h2 = (x, y) => fr(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
export function vn(x, y) { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g); return (h2(i, j) * (1 - u) + h2(i + 1, j) * u) * (1 - v) + (h2(i, j + 1) * (1 - u) + h2(i + 1, j + 1) * u) * v; }
export function fbm(x, y) { return (vn(x, y) * .5 + vn(x * 2.03, y * 2.03) * .25 + vn(x * 4.1, y * 4.1) * .125) / .875; }
function hp(i, j, P) { i = ((i % P) + P) % P; j = ((j % P) + P) % P; return h2(i, j); }
function tvn(x, y, P) { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g); return (hp(i, j, P) * (1 - u) + hp(i + 1, j, P) * u) * (1 - v) + (hp(i, j + 1, P) * (1 - u) + hp(i + 1, j + 1, P) * u) * v; }
const toS = l => Math.round(255 * (l <= .0031308 ? 12.92 * l : 1.055 * Math.pow(Math.max(0, l), 1 / 2.4) - .055));

// a tiling picture for each ground, made in the page (the grass and dirt in the game's own colours)
export const GROUNDS = ['Grass', 'Dirt', 'Forest floor', 'Sidewalk'];
const TILE_M = { Grass: 4, Dirt: 4, 'Forest floor': 3, Sidewalk: 5 * FT };
function tile(kind, aniso) { const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N), D = im.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N, v = y / N; let r, gg, b;
    const n1 = tvn(u * 8, v * 8, 8), n2 = tvn(u * 32, v * 32, 32), n3 = tvn(u * 128, v * 128, 128), n4 = tvn(u * 256, v * 256, 256);
    if (kind === 'Grass') { const dry = Math.min(1, Math.max(0, (n1 - .35) * 1.6)) * .55, k = .5 + .55 * n3 * n4 + .35 * n2; r = (.06 + .14 * dry) * k; gg = (.105 + .065 * dry) * k; b = (.022 + .038 * dry) * k;
      if (n4 > .86) { r *= 1.5; gg *= 1.45; b *= 1.2; } if (n3 < .14) { r = r * .5 + .03; gg = gg * .5 + .015; b = b * .5 + .0075; } }
    else if (kind === 'Dirt') { const k = .78 + .3 * n2 + .22 * (n4 - .5); r = (.21 + .13 * n1) * k; gg = (.1 + .09 * n1) * k; b = (.05 + .05 * n1) * k; if (n3 > .8 && n4 > .5) { r *= 1.35; gg *= 1.3; b *= 1.3; } if (n3 < .18) { r *= .7; gg *= .7; b *= .7; } }
    else if (kind === 'Forest floor') { const k = .7 + .35 * n2 + .25 * (n4 - .5); r = (.085 + .05 * n1) * k; gg = (.058 + .03 * n1) * k; b = (.032 + .015 * n1) * k;
      if (n4 > .76 && n3 > .4) { r *= 1.75; gg *= 1.5; b *= 1.25; } if (n4 < .2) { r *= .6; gg *= .6; b *= .6; }
      const moss = Math.max(0, tvn(u * 12 + 3, v * 12, 12) - .6) * 2.4; r = r * (1 - moss) + .04 * moss; gg = gg * (1 - moss) + .07 * moss; b = b * (1 - moss) + .02 * moss; }
    else { const k = .88 + .1 * n2 + .1 * (n4 - .5) + .06 * n1, j = Math.min(u, 1 - u, v, 1 - v) < .006 ? .5 : 1; r = .34 * k * j; gg = .33 * k * j; b = .31 * k * j; if (n4 > .9) { r *= .8; gg *= .8; b *= .8; } }
    const o = (y * N + x) * 4; D[o] = toS(r); D[o + 1] = toS(gg); D[o + 2] = toS(b); D[o + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; return t; }
const TILES = {};
export function groundMesh(renderer, size, n, kind, y, tint) {
  const g = new THREE.PlaneGeometry(size, size, n, n).rotateX(-Math.PI / 2), P = g.attributes.position, C = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) C.set(tint(P.getX(i), P.getZ(i)), i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  const t = (TILES[kind] = TILES[kind] || tile(kind, renderer.capabilities.getMaxAnisotropy())).clone(); t.needsUpdate = true; t.repeat.set(size / TILE_M[kind], size / TILE_M[kind]);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: t }); patchMat(mat);
  const m = new THREE.Mesh(g, mat); m.position.y = y; m.receiveShadow = true; return m;
}
export const tintOf = k => (x, z) => { const a = fbm(x * .05 + 3, z * .05), b = vn(x * .4, z * .4); if (k === 'Sidewalk') { const s = .92 + .1 * b; return [s, s, s]; }
  const s = .78 + .3 * a + .12 * b; return k === 'Grass' ? [s * (1 + .25 * (a - .5)), s, s * (1 - .1 * (a - .5))] : [s, s, s]; };

// a 5 ft 10 in figure for scale
export function person() { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8c949e, roughness: .7 }); patchMat(m);
  const add = (geo, x, y, z, rz = 0) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.rotation.z = rz; k.castShadow = k.receiveShadow = true; g.add(k); };
  add(new THREE.CapsuleGeometry(.075, .72, 4, 10), -.1, .44, 0); add(new THREE.CapsuleGeometry(.075, .72, 4, 10), .1, .44, 0);
  add(new THREE.CapsuleGeometry(.17, .42, 4, 12), 0, 1.16, 0); add(new THREE.SphereGeometry(.115, 16, 12), 0, 1.66, 0);
  add(new THREE.CapsuleGeometry(.05, .58, 4, 8), -.25, 1.12, 0, .12); add(new THREE.CapsuleGeometry(.05, .58, 4, 8), .25, 1.12, 0, -.12); return g; }

// the models, read from the .glb files carried in the page
export async function loadModels(DATA) {
  const loader = new GLTFLoader(), MODELS = {};
  const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  for (const a of DATA.manifest.assets) {
    const out = { meta: a };
    for (const lod of ['near', 'far']) { const g = await new Promise((ok, no) => loader.parse(b64(DATA.files[a.files[lod]]), '', ok, no)); const prims = [];
      g.scene.traverse(o => { if (o.isMesh) { patchMat(o.material); o.castShadow = o.receiveShadow = true; prims.push({ geometry: o.geometry, material: o.material, tris: (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 }); } });
      out[lod] = { scene: g.scene, prims, tris: prims.reduce((s, p) => s + p.tris, 0) }; }
    MODELS[a.id] = out;
  }
  return MODELS;
}

let hintT = 0;
export function hint(t, ms = 3500) { const h = $('hint'); h.textContent = t; h.classList.remove('gone'); clearTimeout(hintT); hintT = setTimeout(() => h.classList.add('gone'), ms); }

// the size row at the top of the model list: a slider and "Vary sizes"
export const plant = A => A.group !== 'Props';
export function sizeRow(pop, S, label, onChange) {
  const row = document.createElement('div'); row.className = 'sizerow';
  row.innerHTML = `<span class="lab">Size</span><input type="range" min="40" max="160" step="5" value="${Math.round(S.size * 100)}"><span class="val"></span><button class="vary">Vary sizes</button>`;
  const inp = row.querySelector('input'), val = row.querySelector('.val'), vb = row.querySelector('.vary');
  const show = () => { val.textContent = label(); vb.classList.toggle('on', S.vary); };
  inp.oninput = () => { S.size = +inp.value / 100; show(); onChange(); };
  vb.onclick = () => { S.vary = !S.vary; show(); onChange(); };
  pop.appendChild(row); show(); return { show, set disabled(v) { inp.disabled = v; row.classList.toggle('off', v); } };
}
export const scaleFor = (A, S, R) => plant(A) ? S.size * (S.vary ? .86 + R() * .28 : 1) : 1;
