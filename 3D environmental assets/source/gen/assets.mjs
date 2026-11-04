// The fifteen models. Each returns { near: parts, far: parts, collider }.
import { THREE, MB, rng, noise, fbm, clamp, mix, mul, vary, tube, lathe, hard, box, M, leaf, blob, rndDir, perp } from './lib.mjs';
const V3 = THREE.Vector3, UP = new V3(0, 1, 0);

export const MAT = {
  grass: { name: 'grass', rough: .9, double: true, game: 'LEAF' },
  leaf: { name: 'foliage', rough: .85, double: true, game: 'LEAF' },
  bark: { name: 'bark', rough: .95, game: 'WOOD' },
  wood: { name: 'wood', rough: .9, game: 'WOOD' },
  cactus: { name: 'cactus', rough: .7, double: true, game: 'LEAF' },
  paint: { name: 'paint', rough: .5, metal: .05, game: 'COL' },
  metal: { name: 'metal', rough: .42, metal: .8, game: 'METAL' },
  rubber: { name: 'rubber', rough: .92, game: 'COL' },
};
const part = (name, mat, mb) => ({ name, mat, mb });

// ------------------------------------------------------------------ shared pieces
// a branch and its children. lv: one spec per level. returns tips
function limb(ctx, p0, dir, len, r0, depth) {
  const L = ctx.lv[depth], R = ctx.R, pts = [p0.clone()], radii = [r0]; let d = dir.clone(), p = p0.clone();
  const broken = depth > 0 && L.broken && R() < L.broken; if (broken) len *= .35 + R() * .2;
  for (let i = 1; i <= L.segs; i++) {
    d.addScaledVector(rndDir(R), L.gnarl).addScaledVector(UP, L.up || 0);
    if (L.out) { const o = new V3(p.x - ctx.axis.x, 0, p.z - ctx.axis.z); if (o.lengthSq() > 1e-4) d.addScaledVector(o.normalize(), L.out); }
    d.normalize(); p = p.clone().addScaledVector(d, len / L.segs); pts.push(p);
    radii.push(r0 * (1 + (L.taper - 1) * Math.pow(i / L.segs, L.tp || 1)));
  }
  tube(ctx.wood, pts, radii, L.radial, ctx.barkCol, { cap1: true, bark: L.bark || 0, barkF: 2 });
  ctx.segs.push({ pts, radii, depth });
  const C = ctx.lv[depth + 1];
  if (C && !broken) {
    const k = C.n[0] + Math.floor(R() * (C.n[1] - C.n[0] + 1));
    for (let c = 0; c < k; c++) {
      const t = C.at[0] + (C.at[1] - C.at[0]) * (k > 1 ? (c + R() * .8) / k : R()), fi = t * L.segs, i0 = Math.min(L.segs - 1, Math.floor(fi)), f = fi - i0;
      const q = pts[i0].clone().lerp(pts[i0 + 1], f), rr = radii[i0] + (radii[i0 + 1] - radii[i0]) * f;
      const pd = pts[i0 + 1].clone().sub(pts[i0]).normalize(), ax = perp(pd).applyAxisAngle(pd, R() * Math.PI * 2 + c * 2.4);
      const nd = pd.clone().applyAxisAngle(ax, C.angle[0] + R() * (C.angle[1] - C.angle[0]));
      if (C.up0) nd.addScaledVector(UP, C.up0).normalize();
      limb(ctx, q, nd, len * (C.lenK[0] + R() * (C.lenK[1] - C.lenK[0])), Math.min(rr * C.rK, rr * .9), depth + 1);
    }
  }
  if (!C || broken) { if (!broken) ctx.tips.push({ p: pts[pts.length - 1], d, r: radii[radii.length - 1] }); }
  if (L.leafAlong && !broken) for (let i = Math.ceil(L.segs * .5); i < L.segs; i++) if (R() < L.leafAlong) ctx.tips.push({ p: pts[i], d, r: radii[i] });
}

// a clump of leaves: a soft core and a shell of cards round it, lit as part of the whole crown
function cluster(mb, R, c, rad, o) {
  const ctr = o.ctr, CR = o.crownR, sq = o.sq || 1, lc = vary(o.col, R, .1), csq = o.crownSq || 1;
  const ao = p => { const q = p.clone().sub(ctr); const rr = clamp(Math.hypot(q.x, q.y / csq, q.z) / CR, 0, 1.2), vv = clamp(q.y / (CR * csq) * .5 + .5); return clamp(.38 + .36 * rr + .34 * vv, .28, 1.08); };
  const ck = o.coreK ?? .72; if (o.core !== false) blob(mb, c, rad * ck, rad * ck * sq, rad * ck, o.coreD ?? 1, p => mul(mix(lc, o.dark || mul(lc, .5), .35), ao(p) * .78), ctr, R, .22);
  const n = o.cards;
  for (let i = 0; i < n; i++) {
    // spread the cards evenly over the shell (a golden spiral), then jitter
    const y = 1 - 2 * (i + .5) / n, rr = Math.sqrt(1 - y * y), ph = i * 2.39996 + R() * .6;
    const d = new V3(Math.cos(ph) * rr, y, Math.sin(ph) * rr).add(rndDir(R).multiplyScalar(.25)).normalize();
    if (o.under === false && d.y < -.55) continue;
    const p = c.clone().add(new V3(d.x * rad, d.y * rad * sq, d.z * rad).multiplyScalar(.8 + R() * .28));
    const f = d.clone().lerp(UP, .15).add(rndDir(R).multiplyScalar(.35)).normalize();
    let u = perp(f).applyAxisAngle(f, R() * Math.PI * 2); if (o.droop) u.addScaledVector(UP, -o.droop).normalize();
    const s = new V3().crossVectors(u, f).normalize();
    const nrm = p.clone().sub(ctr).normalize().lerp(d, .35).lerp(UP, .25).normalize();
    const k = (.84 + R() * .3) * ao(p), sun = clamp(nrm.y * .8 + nrm.x * .2) * .2;
    const col = mul(mix(lc, o.lite || lc, R() * .55 + sun), k);
    const L = o.len * (.8 + R() * .4);
    leaf(mb, p, u, s, L, L * o.wr, col, nrm, o.tip ? mul(mix(col, o.tip, .5), 1) : null);
  }
}
const crownOf = tips => { const c = new V3(); tips.forEach(t => c.add(t.p)); c.multiplyScalar(1 / tips.length); let r = 0; tips.forEach(t => r = Math.max(r, t.p.distanceTo(c))); return { c, r }; };

function barkColour(dark, light, k = 1, groundDark = .55) {
  return (t, a, p, i, fr = 1) => { const n = fbm(p.x * 2.3 * k, p.y * 4.1 * k, p.z * 2.3 * k, 3), s = noise(Math.cos(a) * 3 + 5, p.y * 7 * k, Math.sin(a) * 3); let c = mix(dark, light, clamp(n * 1.2 - .1)); c = mul(c, (.75 + .45 * s) * (.45 + .55 * fr));
    const g = clamp(p.y / .6); return mul(c, groundDark + (1 - groundDark) * g); };
}

// ------------------------------------------------------------------ GRASS
function blade(mb, R, base, ang, h, w, lean, bend, segs, c0, c1, twist = 0, nOut = .35) {
  const dir = new V3(Math.cos(ang), 0, Math.sin(ang)), side = new V3(-Math.sin(ang + twist), 0, Math.cos(ang + twist));
  let th = lean, p = base.clone(); const lv = [p.clone()];
  for (let i = 1; i <= segs; i++) { th += bend / segs; p = p.clone().addScaledVector(dir, Math.sin(th) * h / segs).addScaledVector(UP, Math.cos(th) * h / segs); lv.push(p); }
  const n = UP.clone().addScaledVector(dir, nOut).normalize(), ids = [];
  for (let i = 0; i < segs; i++) {
    const t = i / segs, ww = w * Math.pow(1 - t, .7) * .5, col = mul(mix(c0, c1, Math.pow(t, .8)), .5 + .5 * t);
    ids.push([mb.v(lv[i].clone().addScaledVector(side, -ww), n, col), mb.v(lv[i].clone().addScaledVector(side, ww), n, col)]);
  }
  const tip = mb.v(lv[segs], n, c1);
  for (let i = 0; i < segs - 1; i++) mb.quad(ids[i][0], ids[i][1], ids[i + 1][1], ids[i + 1][0]);
  mb.tri(ids[segs - 1][0], ids[segs - 1][1], tip);
  return lv;
}
function tuftBlades(mb, R, n, o) {
  for (let i = 0; i < n; i++) {
    const rr = o.r * Math.sqrt(R()), a = R() * Math.PI * 2, base = new V3(Math.cos(a) * rr, -.02, Math.sin(a) * rr);
    const out = rr / o.r, ang = a + (R() - .5) * 1.2;
    const yel = R() < (o.yellow || 0);
    const c0 = vary(o.c0, R, .15), c1 = yel ? vary(o.cy, R, .15) : vary(o.c1, R, .18);
    blade(mb, R, base, ang, o.h[0] + R() * (o.h[1] - o.h[0]) * (1 - out * .3), o.w[0] + R() * (o.w[1] - o.w[0]), o.lean[0] + (o.lean[1] - o.lean[0]) * (out * .7 + R() * .3), o.bend[0] + R() * (o.bend[1] - o.bend[0]), o.segs, c0, c1, (R() - .5) * .8);
  }
}

export function meadowTuft() {
  const R = rng(101), near = new MB(), far = new MB();
  const o = { r: .11, h: [.2, .42], w: [.02, .032], lean: [.05, .7], bend: [.2, .9], segs: 4, c0: [.02, .045, .01], c1: [.085, .16, .03], cy: [.17, .17, .06], yellow: .14 };
  tuftBlades(near, R, 40, o);
  tuftBlades(far, rng(102), 12, { ...o, w: [.05, .07], segs: 2 });
  return { near: [part('blades', MAT.grass, near)], far: [part('blades', MAT.grass, far)] };
}

export function dryPrairie() {
  const R = rng(201), near = new MB(), far = new MB();
  const o = { r: .13, h: [.42, .78], w: [.015, .025], lean: [.05, .55], bend: [.4, 1.2], segs: 4, c0: [.1, .085, .03], c1: [.42, .34, .15], cy: [.3, .28, .12], yellow: .3 };
  tuftBlades(near, R, 28, o);
  const heads = (mb, R, n, rad, seg) => { for (let i = 0; i < n; i++) {
    const rr = .06 * Math.sqrt(R()), a = R() * Math.PI * 2, base = new V3(Math.cos(a) * rr, -.02, Math.sin(a) * rr), h = .7 + R() * .28;
    const lv = blade(mb, R, base, a, h, .008, .05 + R() * .25, .2 + R() * .4, 2, [.14, .12, .05], [.38, .32, .15], 0, .2);
    const top = lv[lv.length - 1], d = lv[lv.length - 1].clone().sub(lv[lv.length - 2]).normalize();
    const pts = [], radii = [], L = .1 + R() * .04; for (let k = 0; k <= 3; k++) { pts.push(top.clone().addScaledVector(d, -.02 + L * k / 3)); radii.push(rad * Math.sin(Math.PI * (k + .4) / 3.8)); }
    tube(mb, pts, radii, seg, (t) => mul(mix([.3, .24, .11], [.5, .43, .24], t), .9 + R() * .2), { cap1: true });
  } };
  heads(near, R, 7, .011, 5);
  tuftBlades(far, rng(202), 12, { ...o, w: [.04, .06], segs: 2 }); heads(far, rng(203), 2, .02, 3);
  return { near: [part('blades', MAT.grass, near)], far: [part('blades', MAT.grass, far)] };
}

export function creekReeds() {
  const R = rng(301), near = new MB(), far = new MB();
  const build = (mb, R, nLeaf, nHead, seg, segsL) => {
    for (let i = 0; i < nLeaf; i++) {
      const rr = .14 * Math.sqrt(R()), a = R() * Math.PI * 2, base = new V3(Math.cos(a) * rr, -.03, Math.sin(a) * rr);
      const droop = R() < .25, yel = R() < .3;
      blade(mb, R, base, a + (R() - .5), .9 + R() * .65, .032 + R() * .02, .02 + R() * .15, droop ? 1.1 + R() * .7 : .08 + R() * .35, segsL, vary([.022, .05, .016], R, .15), yel ? vary([.2, .19, .07], R, .1) : vary([.07, .13, .04], R, .15), (R() - .5) * .6, .25);
    }
    for (let i = 0; i < nHead; i++) {
      const rr = .08 * Math.sqrt(R()), a = R() * Math.PI * 2, base = new V3(Math.cos(a) * rr, -.03, Math.sin(a) * rr), h = 1.25 + R() * .45;
      const lean = new V3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(.04 + R() * .05);
      const top = base.clone().add(new V3(lean.x * h, h, lean.z * h)), d = top.clone().sub(base).normalize();
      tube(mb, [base, top], [.006, .004], 3, () => [.06, .09, .035]);
      const hp = [], hr = []; for (let k = 0; k <= 3; k++) { hp.push(top.clone().addScaledVector(d, -.34 + .2 * k / 3)); hr.push(.024 * (k === 0 || k === 3 ? .65 : 1)); }
      tube(mb, hp, hr, seg, (t, an) => mul([.085, .042, .02], .75 + .35 * noise(an * 2, t * 6)), { cap1: true });
      tube(mb, [top.clone(), top.clone().addScaledVector(d, .12)], [.004, .001], 3, () => [.16, .13, .06]);
    }
  };
  build(near, R, 17, 5, 6, 5); build(far, rng(302), 6, 2, 4, 2);
  return { near: [part('reeds', MAT.grass, near)], far: [part('reeds', MAT.grass, far)] };
}

// ------------------------------------------------------------------ BUSHES
export function sagebrush() {
  const R = rng(401), wood = new MB(), lf = new MB();
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol: barkColour([.05, .045, .04], [.16, .15, .13], 3, .7),
    lv: [{ segs: 4, radial: 5, gnarl: .32, up: .02, taper: .55, out: .12 }, { n: [2, 3], at: [.35, 1], angle: [.35, .75], lenK: [.5, .75], rK: .75, segs: 3, radial: 4, gnarl: .3, up: .03, taper: .3, leafAlong: .6 }] };
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + R() * .5, tilt = .25 + R() * .55, d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a)); limb(ctx, new V3(Math.cos(a) * .03, -.05, Math.sin(a) * .03), d, .42 + R() * .22, .026, 0); }
  const cr = crownOf(ctx.tips), ctr = cr.c.clone(); ctr.y *= .85;
  for (const t of ctx.tips) cluster(lf, R, t.p, .15 + R() * .09, { ctr, crownR: cr.r, cards: 22, len: .16, wr: .55, coreD: 0, col: [.1, .12, .08], lite: [.16, .18, .14], dark: [.03, .035, .025], sq: .8 });
  const far = new MB(); for (let i = 0; i < 3; i++) { const a = i * 2.1, c = new V3(Math.cos(a) * .2, .42, Math.sin(a) * .2); blob(far, c, .42, .34, .42, 1, p => mul([.1, .12, .085], .55 + .5 * clamp(p.y / .8)), new V3(0, .2, 0), R); }
  return { near: [part('stems', MAT.bark, wood), part('leaves', MAT.leaf, lf)], far: [part('leaves', MAT.leaf, far)] };
}

export function oleander() {
  const R = rng(501), wood = new MB(), lf = new MB();
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol: barkColour([.04, .05, .03], [.1, .11, .07], 3, .8),
    lv: [{ segs: 6, radial: 5, gnarl: .05, up: .015, taper: .45, out: .05 }, { n: [0, 2], at: [.55, .9], angle: [.3, .6], lenK: [.3, .45], rK: .75, segs: 3, radial: 4, gnarl: .08, up: .04, taper: .4 }] };
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + R() * .4, tilt = .08 + R() * .38, d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a)); limb(ctx, new V3(Math.cos(a) * .06, -.05, Math.sin(a) * .06), d, 1.15 + R() * .5, .02, 0); }
  const cr = crownOf(ctx.tips), ctr = new V3(0, 1.0, 0);
  // inner dark mass so the bush never reads hollow
  for (let i = 0; i < 4; i++) { const a = i * 1.6, c = new V3(Math.cos(a) * .28, .75 + i * .12, Math.sin(a) * .28); blob(lf, c, .3, .38, .3, 1, p => mul([.03, .065, .022], .4 + .4 * clamp(p.y / 1.6)), ctr, R, .35); }
  // leaves in whorls of three along the top of each shoot, pointing up and out
  for (const s of ctx.segs) { const P = s.pts, n = P.length;
    for (let k = 0; k < 10; k++) { const t = .3 + .7 * k / 10, fi = t * (n - 1), i0 = Math.min(n - 2, Math.floor(fi)), q = P[i0].clone().lerp(P[i0 + 1], fi - i0), sd = P[i0 + 1].clone().sub(P[i0]).normalize();
      for (let w = 0; w < 3; w++) { const ax = perp(sd).applyAxisAngle(sd, w * 2.094 + k * .9 + R()), u = sd.clone().applyAxisAngle(ax, .7 + R() * .5).normalize(), f = ax.clone().cross(u).normalize(); if (f.y < 0) f.negate();
        const L = .19 + R() * .06, c = q.clone().addScaledVector(u, L * .5), s2 = new V3().crossVectors(u, f).normalize(), nrm = c.clone().sub(ctr).normalize().lerp(UP, .4).normalize();
        const k2 = .5 + .55 * clamp(c.y / 1.7); leaf(lf, c, u, s2, L, .055, mul(vary([.03, .075, .025], R, .15), k2), nrm, mul([.05, .1, .035], k2)); } } }
  // pink flower heads at the shoot tips
  for (const t of ctx.tips) { if (R() < .3) continue; for (let f = 0; f < 5; f++) {
    const c = t.p.clone().add(rndDir(R).multiplyScalar(.07)); c.y += .02; const fn = c.clone().sub(ctr).normalize().lerp(UP, .6).normalize(), u0 = perp(fn), pc = vary([.7, .16, .27], R, .12);
    const ci = lf.v(c.clone().addScaledVector(fn, .005), fn, [.75, .55, .45]);
    const ring = []; for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2, u = u0.clone().applyAxisAngle(fn, a); ring.push(lf.v(c.clone().addScaledVector(u, .042), fn, pc)); }
    for (let p = 0; p < 5; p++) lf.tri(ci, ring[p], ring[(p + 1) % 5]); } }
  const far = new MB(); for (let i = 0; i < 4; i++) { const a = i * 1.6, c = new V3(Math.cos(a) * .25, .7 + i * .18, Math.sin(a) * .25); blob(far, c, .55, .62, .55, 1, p => mul(mix([.03, .07, .024], [.42, .1, .17], p.y > 1.25 ? clamp((noise(p.x * 6, p.y * 6, p.z * 6) - .62) * 4) * .7 : 0), .5 + .5 * clamp(p.y / 1.7)), ctr, R); }
  return { near: [part('stems', MAT.bark, wood), part('leaves', MAT.leaf, lf)], far: [part('leaves', MAT.leaf, far)] };
}

export function pricklyPear() {
  const R = rng(601), mb = new MB(), far = new MB(), pads = [];
  const pad = (mbx, c, yaw, tilt, w, h, segW, segH, spines) => {
    const m = M([c.x, c.y, c.z], [tilt, yaw, 0]), g = new THREE.SphereGeometry(1, segW, segH); g.scale(w / 2, h / 2, .022);
    const base = vary([.055, .11, .035], R, .12);
    mbx.geo(g, m, (p, n) => { const lp = p.clone().sub(c); const rim = clamp(1 - Math.abs(n.dot(new V3(0, 0, 1).applyMatrix4(new THREE.Matrix4().extractRotation(m))))); return mul(mix(base, [.13, .15, .05], rim * .6), .6 + .4 * clamp(p.y / .9 + .2)); });
    if (spines) { const fw = new V3(0, 0, 1).applyMatrix4(new THREE.Matrix4().extractRotation(m)), up = new V3(0, 1, 0).applyMatrix4(new THREE.Matrix4().extractRotation(m)), sd = new V3(1, 0, 0).applyMatrix4(new THREE.Matrix4().extractRotation(m));
      for (const side of [1, -1]) for (let i = 0; i < 9; i++) { const u = (R() - .5) * 1.5, v = (R() - .5) * 1.5; if (u * u + v * v > .8) continue;
        const p = c.clone().addScaledVector(sd, u * w / 2).addScaledVector(up, v * h / 2).addScaledVector(fw, side * .02 * Math.sqrt(1 - u * u - v * v) + side * .004);
        const a = rndDir(R).multiplyScalar(.012), b = rndDir(R).multiplyScalar(.012), n = fw.clone().multiplyScalar(side), cc = [.55, .5, .3];
        const i0 = mbx.v(p.clone().sub(a), n, cc), i1 = mbx.v(p.clone().add(a), n, cc), i2 = mbx.v(p.clone().sub(b), n, cc), i3 = mbx.v(p.clone().add(b), n, cc); mbx.tri(i0, i2, i1); mbx.tri(i1, i3, i0); } }
    pads.push({ c, yaw, tilt, w, h });
  };
  const grow = (c, yaw, tilt, w, h, depth) => {
    pad(mb, c, yaw, tilt, w, h, 9, 6, true);
    if (depth >= 2) { if (R() < .7) { const top = c.clone().add(new V3(Math.sin(yaw) * Math.sin(tilt) * 0, h * .5 * Math.cos(tilt), 0)); for (let f = 0; f < 2; f++) { const fp = top.clone().add(new V3((R() - .5) * w * .7, .02, 0).applyAxisAngle(UP, yaw)); mb.geo(new THREE.SphereGeometry(1, 6, 5).scale(.022, .032, .022), M([fp.x, fp.y, fp.z]), (p, n) => mul([.3, .02, .07], .7 + .4 * clamp(n.y))); } } return; }
    const k = depth === 0 ? 2 : 1 + (R() < .45 ? 1 : 0);
    for (let i = 0; i < k; i++) { const off = (i - (k - 1) / 2) * .9 + (R() - .5) * .5, ny = yaw + (R() - .5) * 1.4, nt = clamp(tilt * .5 + off * .7, -1, 1);
      const nw = w * (.85 + R() * .2), nh = h * (.85 + R() * .2), dir = new V3(Math.sin(nt), Math.cos(nt), 0).applyAxisAngle(UP, -ny);
      const top = c.clone().add(new V3(Math.sin(tilt), Math.cos(tilt), 0).applyAxisAngle(UP, -yaw).multiplyScalar(h * .42));
      grow(top.clone().addScaledVector(dir, nh * .42), ny, nt, nw, nh, depth + 1); }
  };
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + R() * .5, t = (R() - .5) * .6; grow(new V3(Math.cos(a) * .14, .16, Math.sin(a) * .14), a, t, .28, .34, 0); }
  for (const p of pads) { const g = new THREE.SphereGeometry(1, 5, 3); g.scale(p.w / 2, p.h / 2, .03); far.geo(g, M([p.c.x, p.c.y, p.c.z], [p.tilt, p.yaw, 0]), mul([.06, .11, .04], .6 + .4 * clamp(p.c.y))); }
  return { near: [part('pads', MAT.cactus, mb)], far: [part('pads', MAT.cactus, far)] };
}

// ------------------------------------------------------------------ TREES
function trunkPts(R, h, r0, r1, n, sway, flare = .45) { const pts = [], radii = []; const sx = (R() - .5) * sway, sz = (R() - .5) * sway;
  for (let i = 0; i <= n; i++) { const t = i / n, y = -.3 + (h + .3) * t; pts.push(new V3(sx * t * t + (R() - .5) * .03, y, sz * t * t + (R() - .5) * .03)); radii.push((r0 + (r1 - r0) * t) * (1 + flare * Math.exp(-Math.max(0, y) * 3.5))); } return { pts, radii }; }

export function cottonwood() {
  const R = rng(701), wood = new MB(), lf = new MB();
  const barkCol = barkColour([.04, .035, .03], [.17, .155, .13], .9, .6);
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol,
    lv: [null, { n: [3, 4], at: [.88, 1], angle: [.42, .7], lenK: [1.25, 1.5], rK: .68, segs: 6, radial: 8, gnarl: .08, up: .0, taper: .42, out: .06, bark: .08 },
      { n: [3, 4], at: [.25, 1], angle: [.55, .9], lenK: [.45, .6], rK: .62, segs: 4, radial: 5, gnarl: .13, up: .03, taper: .3, out: .08, leafAlong: .3 }] };
  const T = trunkPts(R, 4.2, .45, .32, 16, .3, .5); tube(wood, T.pts, T.radii, 18, barkCol, { bark: .1, barkF: 1.5, furrow: .09, furrowN: 9 });
  const top = T.pts[T.pts.length - 1]; const kids = 3 + (R() < .5 ? 1 : 0);
  for (let i = 0; i < kids; i++) { const a = i / kids * Math.PI * 2 + R() * .6, tilt = .38 + R() * .28, d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a));
    limb(ctx, top.clone().addScaledVector(UP, -.4), d, 5.4 + R() * 1.2, .26, 1); }
  const cr = crownOf(ctx.tips);
  for (const t of ctx.tips) cluster(lf, R, t.p, 1.55 + R() * .45, { ctr: cr.c, crownR: cr.r, cards: 62, len: .72, wr: .78, col: [.05, .1, .022], lite: [.09, .155, .035], dark: [.02, .045, .012], sq: .85 });
  const far = new MB(), fw = new MB(); tube(fw, [T.pts[0], top], [.5, .3], 6, barkCol);
  const fc = ctx.tips.filter((_, i) => i % 4 === 0).slice(0, 7);
  for (const t of fc) blob(far, t.p, 2.5, 2.1, 2.5, 0, p => mul([.045, .09, .02], clamp(.45 + .55 * (p.y - cr.c.y + cr.r) / (2 * cr.r))), cr.c, R, .3);
  return { near: [part('bark', MAT.bark, wood), part('leaves', MAT.leaf, lf)], far: [part('bark', MAT.bark, fw), part('leaves', MAT.leaf, far)], collider: { type: 'cylinder', r: .52, h: 4.2 } };
}

export function ponderosa() {
  const R = rng(801), wood = new MB(), lf = new MB(), H = 17;
  const barkCol = (t, a, p) => { const n = noise(Math.cos(a) * 2.4 + 3, p.y * 1.3, Math.sin(a) * 2.4), plate = clamp((n - .36) * 6); const c = mix([.035, .02, .014], mix([.2, .085, .04], [.3, .15, .08], noise(p.y * 3, a * 2)), plate); return mul(c, .6 + .4 * clamp(p.y / 1.5)); };
  const pts = [], radii = []; for (let i = 0; i <= 26; i++) { const t = i / 26, y = -.3 + (H + .3) * t; pts.push(new V3(.18 * Math.sin(y * .23), y, .1 * Math.sin(y * .17 + 1))); radii.push((.36 * Math.pow(1 - t, .9) + .02) * (1 + .4 * Math.exp(-Math.max(0, y) * 3))); }
  tube(wood, pts, radii, 12, barkCol, { cap1: true });
  const at = y => { const t = (y + .3) / (H + .3), fi = t * 26, i0 = Math.min(25, Math.floor(fi)); return { p: pts[i0].clone().lerp(pts[i0 + 1], fi - i0), r: radii[i0] + (radii[i0 + 1] - radii[i0]) * (fi - i0) }; };
  const greyBark = barkColour([.05, .045, .04], [.12, .1, .08]);
  for (let i = 0; i < 5; i++) { const y = 2.6 + R() * 2.4, q = at(y), a = R() * 6.28, d = new V3(Math.cos(a), -.1, Math.sin(a)).normalize(); tube(wood, [q.p, q.p.clone().addScaledVector(d, .3 + R() * .4)], [.035, .012], 4, greyBark, { cap1: true }); }
  const ctr = new V3(0, 10.5, 0), tufts = [];
  let y = 5.2, w = 0;
  while (y < H - .4) { const q = at(y), t = (y - 5.2) / (H - 5.6), Lw = (3.4 * (1 - t) + .6) * (.85 + R() * .3), nb = t > .85 ? 2 : 3 + (R() < .35 ? 1 : 0);
    for (let b = 0; b < nb; b++) { const a = b / nb * Math.PI * 2 + w * 1.3 + R() * .6, dir = new V3(Math.cos(a), .12 - .1 * t, Math.sin(a)).normalize(), bp = [q.p.clone()], br = [];
      let p = q.p.clone(), d = dir.clone(); for (let k = 1; k <= 4; k++) { d.y += k < 3 ? -.12 : .22; d.normalize(); p = p.clone().addScaledVector(d, Lw / 4); bp.push(p); }
      for (let k = 0; k <= 4; k++) br.push(.065 * (Lw / 3.6 + .25) * (1 - .75 * k / 4));
      tube(wood, bp, br, 4, barkCol, { cap1: true });
      const nt = Math.max(1, Math.round(Lw / .95)); for (let k = 0; k < nt; k++) { const tt = 1 - k / nt * .62, fi = tt * 4, i0 = Math.min(3, Math.floor(fi)); tufts.push({ p: bp[i0].clone().lerp(bp[i0 + 1], fi - i0), d: bp[4].clone().sub(bp[0]).normalize(), s: .75 + .25 * (1 - t) }); } }
    y += .9 + R() * .3; w++; }
  tufts.push({ p: at(H - .3).p, d: UP.clone(), s: .7 }, { p: at(H - 1.1).p, d: UP.clone(), s: .8 });
  const crownR = 6.5;
  for (const t of tufts) {
    const rad = .85 * t.s, c = t.p.clone().addScaledVector(UP, .1);
    const ao = p => clamp(.4 + .35 * clamp(Math.hypot(p.x - ctr.x, p.z - ctr.z) / 3.5) + .35 * clamp((p.y - 4) / 13), .3, 1.05);
    blob(lf, c, rad * .7, rad * .5, rad * .7, 0, p => mul([.018, .035, .015], ao(p) * .8), ctr, R, .3);
    for (let i = 0; i < 17; i++) { const f = rndDir(R); f.y = Math.abs(f.y) * .8 + .25; f.normalize(); const u = f.clone().lerp(t.d, .3).normalize().add(rndDir(R).multiplyScalar(.3)).normalize();
      const sv = perp(u).applyAxisAngle(u, R() * 6.28), ff = new V3().crossVectors(sv, u).normalize(), L = (.85 + R() * .35) * t.s, p = c.clone().addScaledVector(u, L * .36);
      const nrm = p.clone().sub(ctr).normalize().lerp(UP, .45).normalize(), k = (.8 + R() * .4) * ao(p);
      leaf(lf, p, u, new V3().crossVectors(u, ff).normalize(), L, L * .4, mul(vary([.035, .065, .025], R, .12), k), nrm, mul([.06, .1, .035], k)); } }
  const far = new MB(), fw = new MB(); tube(fw, [pts[0], at(5).p, at(H).p], [.45, .28, .03], 5, barkCol);
  for (let i = 0; i < 4; i++) { const y0 = 4.6 + i * 2.9, r = 3.3 * (1 - i * .22), g = new THREE.ConeGeometry(r, 3.8, 7, 1, false); far.geo(g, M([(R() - .5) * .3, y0 + 1.9, (R() - .5) * .3], [0, R() * 3, 0]), (p, n) => mul([.03, .058, .022], .45 + .55 * clamp((p.y - 4) / 13) + .1 * n.y)); }
  return { near: [part('bark', MAT.bark, wood), part('needles', MAT.leaf, lf)], far: [part('bark', MAT.bark, fw), part('needles', MAT.leaf, far)], collider: { type: 'cylinder', r: .45, h: 5 } };
}

export function mesquite() {
  const R = rng(901), wood = new MB(), lf = new MB();
  const barkCol = barkColour([.025, .018, .014], [.09, .07, .055], 2, .6);
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol,
    lv: [{ segs: 6, radial: 8, gnarl: .16, up: -.01, taper: .6, out: .08, bark: .12 },
      { n: [2, 3], at: [.6, 1], angle: [.3, .6], lenK: [1.0, 1.2], rK: .7, segs: 5, radial: 6, gnarl: .16, up: .07, taper: .4, out: .02, bark: .08 },
      { n: [2, 3], at: [.3, 1], angle: [.45, .9], lenK: [.5, .65], rK: .6, segs: 3, radial: 4, gnarl: .22, up: .05, taper: .2, out: .03, leafAlong: .45 }] };
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + R() * .5, tilt = .22 + R() * .18, d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a)); limb(ctx, new V3(Math.cos(a) * .08, -.3, Math.sin(a) * .08), d, 2.3 + R() * .4, .17, 0); }
  const cr = crownOf(ctx.tips); const ctr = cr.c.clone();
  for (const t of ctx.tips) cluster(lf, R, t.p, .85 + R() * .3, { ctr, crownR: cr.r, crownSq: .7, sq: .6, cards: 44, len: .4, wr: .42, coreK: .38, coreD: 0, col: [.07, .11, .03], lite: [.12, .16, .05], dark: [.02, .03, .01], droop: .3 });
  const far = new MB(), fw = new MB(); for (const s of ctx.segs.filter(s => s.depth === 0)) tube(fw, [s.pts[0], s.pts[s.pts.length - 1]], [.16, .08], 5, barkCol);
  const fc = ctx.tips.filter((_, i) => i % 4 === 0).slice(0, 6); for (const t of fc) blob(far, t.p, 1.9, .9, 1.9, 0, p => mul([.07, .105, .03], .5 + .5 * clamp((p.y - 3) / 3)), ctr, R, .3);
  return { near: [part('bark', MAT.bark, wood), part('leaves', MAT.leaf, lf)], far: [part('bark', MAT.bark, fw), part('leaves', MAT.leaf, far)], collider: { type: 'cylinder', r: .42, h: 2 } };
}

export function deadSnag() {
  const R = rng(1001), wood = new MB();
  const barkCol = (t, a, p) => { const n = fbm(p.x * 1.5, p.y * 6, p.z * 1.5, 3), s = noise(Math.cos(a) * 4 + 1, p.y * 9, Math.sin(a) * 4); let c = mix([.07, .065, .06], [.27, .26, .24], clamp(n * 1.3 - .15)); c = mul(c, .7 + .45 * s);
    if (p.y < 1.6 && noise(a * 3, p.y * 2.5) > .55) c = mix(c, [.06, .035, .02], .8); return mul(c, .55 + .45 * clamp(p.y / .8)); };
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol,
    lv: [null, { n: [5, 6], at: [.3, .95], angle: [.5, .9], lenK: [.42, .6], rK: .55, segs: 6, radial: 6, gnarl: .2, up: .07, taper: .3, out: .04, broken: .3, bark: .1 },
      { n: [2, 3], at: [.3, 1], angle: [.4, .85], lenK: [.4, .55], rK: .55, segs: 4, radial: 5, gnarl: .24, up: .08, taper: .15, broken: .15 },
      { n: [1, 3], at: [.35, 1], angle: [.4, .9], lenK: [.4, .6], rK: .5, segs: 3, radial: 4, gnarl: .28, up: .1, taper: .05 }] };
  const T = trunkPts(R, 6.3, .36, .14, 14, .9, .55); for (let i = 3; i < T.pts.length; i++) { T.pts[i].x += .12 * Math.sin(i * 1.3); T.pts[i].z += .1 * Math.cos(i * .9); }
  tube(wood, T.pts, T.radii, 14, barkCol, { bark: .16, barkF: 1.2, furrow: .06, furrowN: 6 });
  // the broken top: a jagged crown of splinters
  const top = T.pts[T.pts.length - 1], rt = T.radii[T.radii.length - 1] * .94; const ci = wood.v(top.clone().add(new V3(0, -.05, 0)), UP, [.18, .16, .13]);
  const ring = []; for (let j = 0; j < 10; j++) { const a = j / 10 * Math.PI * 2, h = (j % 2 ? .05 : .22 + R() * .35); ring.push(wood.v(new V3(top.x + Math.cos(a) * rt * .9, top.y + h, top.z + Math.sin(a) * rt * .9), new V3(Math.cos(a), .6, Math.sin(a)).normalize(), [.2, .18, .15])); }
  for (let j = 0; j < 10; j++) wood.tri(ring[(j + 1) % 10], ring[j], ci);
  const L = ctx.lv[1], kids = 5 + (R() < .5 ? 1 : 0);
  for (let c = 0; c < kids; c++) { const t = .32 + .62 * (c + R() * .7) / kids, fi = t * 14, i0 = Math.min(13, Math.floor(fi)), q = T.pts[i0].clone().lerp(T.pts[i0 + 1], fi - i0), rr = T.radii[i0];
    const a = c * 2.4 + R() * .7, tilt = .6 + R() * .5, d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a));
    limb(ctx, q, d, 3 * (.85 + R() * .4) * (1 - t * .4), rr * .5, 1); }
  const fw = new MB(); tube(fw, [T.pts[0], T.pts[7], T.pts[14]], [.42, .25, .15], 6, barkCol);
  for (const s of ctx.segs.filter(s => s.depth === 1)) tube(fw, [s.pts[0], s.pts[3], s.pts[s.pts.length - 1]], [s.radii[0], s.radii[3], .02], 4, barkCol, { cap1: true });
  return { near: [part('wood', MAT.bark, wood)], far: [part('wood', MAT.bark, fw)], collider: { type: 'cylinder', r: .42, h: 4 } };
}

const TAU = Math.PI * 2;
// a flat strip along a path: side(i) the strip's width direction, nrm(i) its shading normal
function ribbon(mb, pts, widths, side, nrm, colFn) {
  const ids = [];
  for (let i = 0; i < pts.length; i++) { const sd = side(i), n = nrm(i), c = colFn(i / (pts.length - 1), pts[i]), w = widths[i] / 2;
    ids.push([mb.v(pts[i].clone().addScaledVector(sd, -w), n, c), mb.v(pts[i].clone().addScaledVector(sd, w), n, c)]); }
  for (let i = 0; i < pts.length - 1; i++) mb.quad(ids[i][0], ids[i][1], ids[i + 1][1], ids[i + 1][0]);
}

export function burOak() {
  const R = rng(1101), wood = new MB(), lf = new MB();
  const barkCol = barkColour([.028, .025, .02], [.14, .125, .1], 1.1, .6);
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol,
    lv: [null, { segs: 7, radial: 8, gnarl: .1, up: .05, taper: .42, out: .04, bark: .1 },
      { n: [3, 4], at: [.25, 1], angle: [.5, .9], lenK: [.42, .55], rK: .6, segs: 4, radial: 5, gnarl: .17, up: .03, taper: .3, out: .06, leafAlong: .35 },
      { n: [1, 2], at: [.4, 1], angle: [.5, .95], lenK: [.45, .6], rK: .6, segs: 3, radial: 4, gnarl: .22, up: .05, taper: .2 }] };
  const T = trunkPts(R, 2.8, .58, .44, 14, .35, .55); tube(wood, T.pts, T.radii, 18, barkCol, { bark: .12, barkF: 1.4, furrow: .13, furrowN: 13 });
  const top = T.pts[T.pts.length - 1], kids = 4 + (R() < .6 ? 1 : 0);
  for (let i = 0; i < kids; i++) { const a = i / kids * TAU + R() * .6, tilt = .78 + R() * .3, d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a));
    limb(ctx, top.clone().addScaledVector(UP, -.35), d, 5.6 + R() * 1.2, .3, 1); }
  const cr = crownOf(ctx.tips);
  for (const t of ctx.tips) cluster(lf, R, t.p, 1.35 + R() * .4, { ctr: cr.c, crownR: cr.r, crownSq: .7, cards: 44, len: .5, wr: .72, col: [.034, .068, .02], lite: [.065, .11, .028], dark: [.012, .03, .008], sq: .8, coreD: 0 });
  const far = new MB(), fw = new MB(); tube(fw, [T.pts[0], top], [.62, .44], 6, barkCol);
  for (const s of ctx.segs.filter(s => s.depth === 1)) tube(fw, [s.pts[0], s.pts[s.pts.length - 1]], [.28, .1], 3, barkCol);
  for (const t of ctx.tips.filter((_, i) => i % 4 === 0).slice(0, 8)) blob(far, t.p, 2.9, 2.2, 2.9, 0, p => mul([.034, .07, .02], clamp(.42 + .55 * (p.y - cr.c.y + cr.r * .7) / (1.4 * cr.r))), cr.c, R, .3);
  return { near: [part('bark', MAT.bark, wood), part('leaves', MAT.leaf, lf)], far: [part('bark', MAT.bark, fw), part('leaves', MAT.leaf, far)], collider: { type: 'cylinder', r: .62, h: 2.8 } };
}

export function aspen() {
  const R = rng(1201), wood = new MB(), lf = new MB(), H = 12.5;
  const barkCol = (t, a, p) => { const y = p.y; let c = mix([.5, .52, .46], [.64, .65, .58], noise(Math.cos(a) * 2, y * 1.5, Math.sin(a) * 2));
    const eye = noise(Math.cos(a) * 1.6 + 11, y * .9, Math.sin(a) * 1.6); if (eye > .68) c = mix(c, [.025, .025, .025], clamp((eye - .68) * 7));
    const ln = noise(Math.cos(a) * 3 + 3, y * 9, Math.sin(a) * 3); if (ln > .78) c = mix(c, [.1, .1, .085], clamp((ln - .78) * 6) * .7);
    c = mix([.055, .05, .045], c, clamp((y - .25) / 1.5)); return mul(c, .82 + .22 * noise(a * 7, y * 15)); };
  const pts = [], radii = []; const sx = (R() - .5) * .5, sz = (R() - .5) * .5;
  for (let i = 0; i <= 20; i++) { const t = i / 20, y = -.3 + (H + .3) * t; pts.push(new V3(sx * t * t + (R() - .5) * .02, y, sz * t * t + (R() - .5) * .02)); radii.push((.17 - .14 * Math.pow(t, 1.1)) * (1 + .4 * Math.exp(-Math.max(0, y) * 3))); }
  tube(wood, pts, radii, 10, barkCol, { cap1: true });
  const at = y => { const fi = (y + .3) / (H + .3) * 20, i0 = Math.min(19, Math.floor(fi)); return { p: pts[i0].clone().lerp(pts[i0 + 1], fi - i0), r: radii[i0] }; };
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol: barkColour([.25, .25, .22], [.45, .45, .4], 3, 1),
    lv: [{ segs: 4, radial: 4, gnarl: .14, up: .06, taper: .25, leafAlong: .55 },
      { n: [1, 2], at: [.4, 1], angle: [.4, .8], lenK: [.4, .6], rK: .6, segs: 2, radial: 3, gnarl: .2, up: .05, taper: .2 }] };
  const nb = 14;
  for (let k = 0; k < nb; k++) { const y = 5.6 + (H - 6.3) * k / (nb - 1) + (R() - .5) * .3, q = at(y), a = k * 2.4 + R() * .6, tilt = .55 + R() * .4;
    const d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a)); limb(ctx, q.p, d, (2.2 - 1.1 * k / nb) * (.85 + R() * .3), q.r * .45, 0); }
  ctx.tips.push({ p: pts[20].clone() }, { p: at(H - .9).p });
  const ctr = new V3(0, 9.4, 0);
  for (const t of ctx.tips) cluster(lf, R, t.p, .7 + R() * .25, { ctr, crownR: 3.6, crownSq: 1.1, cards: 30, len: .22, wr: .9, col: R() < .15 ? [.17, .17, .035] : [.08, .15, .03], lite: [.17, .23, .06], dark: [.03, .06, .012], coreD: 0, coreK: .55 });
  const far = new MB(), fw = new MB(); tube(fw, [pts[0], pts[10], pts[20]], [.2, .1, .03], 5, barkCol);
  for (let k = 0; k < 3; k++) blob(far, new V3(sx * .7, 7.6 + k * 1.8, sz * .7), 1.7 - k * .2, 1.5, 1.7 - k * .2, 0, p => mul([.08, .15, .03], .45 + .5 * clamp((p.y - 6) / 7)), ctr, R, .3);
  return { near: [part('bark', MAT.bark, wood), part('leaves', MAT.leaf, lf)], far: [part('bark', MAT.bark, fw), part('leaves', MAT.leaf, far)], collider: { type: 'cylinder', r: .22, h: 4 } };
}

export function spruce() {
  const R = rng(1301), wood = new MB(), lf = new MB(), H = 15.5;
  const barkCol = barkColour([.035, .022, .016], [.13, .08, .05], 1.4, .65);
  const pts = [], radii = []; for (let i = 0; i <= 14; i++) { const t = i / 14, y = -.3 + (H + .3) * t; pts.push(new V3((R() - .5) * .04, y, (R() - .5) * .04)); radii.push((.3 * Math.pow(1 - t, .9) + .015) * (1 + .35 * Math.exp(-Math.max(0, y) * 3))); }
  tube(wood, pts, radii, 9, barkCol, { cap1: true });
  const rAt = y => .3 * Math.max(0, 1 - y / H) + .015;
  // a dark core so you never see through to the sky
  lathe(lf, [[1.9, .7], [2.05, 1.5], [1.8, 3.6], [1.4, 6.5], [1, 9.4], [.58, 12.1], [.22, 14.3], [0, H - .3]], 11, p => mul([.018, .036, .028], .5 + .45 * clamp(p.y / H)), null,
    (r, a, y) => r * (1 + .22 * (noise(Math.cos(a) * 2 + 5, y * .8, Math.sin(a) * 2) - .5) * 2));
  let y = .7, w = 0;
  while (y < H - .5) {
    const t = (y - .7) / (H - 1.2), L = .5 + 3.1 * Math.pow(1 - t, 1.15), nb = t > .85 ? 5 : 8;
    for (let b = 0; b < nb; b++) {
      const a = b / nb * TAU + w * 2.4 + R() * .5, o = new V3(Math.cos(a), 0, Math.sin(a)), sd = new V3(-Math.sin(a), 0, Math.cos(a));
      const bp = [new V3(0, y, 0).addScaledVector(o, rAt(y))]; let p = bp[0].clone(), ang = .14 + R() * .1;
      for (let k = 1; k <= 3; k++) { ang -= .17 + R() * .08; const d = o.clone().multiplyScalar(Math.cos(ang)).addScaledVector(UP, Math.sin(ang)); p = p.clone().addScaledVector(d, L / 3); bp.push(p); }
      bp.push(bp[3].clone().addScaledVector(o, L * .12).addScaledVector(UP, L * .05));
      if (y < 4.5) tube(wood, [bp[0], bp[2]], [.035 * L + .01, .012], 3, barkCol);
      const ao = k => clamp(.48 + .36 * k + .25 * t, .3, 1.08), base = vary([.028, .058, .045], R, .1), lite = [.058, .1, .078], nr = o.clone().lerp(UP, .55).normalize();
      ribbon(lf, bp, bp.map((_, k) => (.3 + .6 * L / 3) * (k === 0 ? .35 : 1 - .4 * k / 4)), () => sd, () => nr, tt => mul(mix(base, lite, tt * .6), ao(tt)));
      for (let k = 0; k < 5; k++) { const tt = .2 + .75 * k / 5, fi = tt * 4, i0 = Math.min(3, Math.floor(fi)), q = bp[i0].clone().lerp(bp[i0 + 1], fi - i0), sg = k % 2 ? 1 : -1;
        const u = o.clone().multiplyScalar(.55).addScaledVector(sd, sg * .75).addScaledVector(UP, -.35).normalize(), s2 = new V3().crossVectors(u, UP).normalize();
        const Ls = (.45 + .4 * L / 3) * (1 - tt * .3), c = q.clone().addScaledVector(u, Ls * .45);
        leaf(lf, c, u, s2, Ls, Ls * .62, mul(mix(base, lite, R() * .5), ao(tt) * (.9 + R() * .2)), nr, mul(lite, ao(1))); }
    }
    y += .5 + R() * .14; w++;
  }
  lathe(lf, [[.28, H - 1.4], [.13, H - .5], [0, H + .35]], 6, p => mul([.04, .075, .055], .95));
  const far = new MB(), fw = new MB(); tube(fw, [pts[0], pts[6]], [.32, .2], 5, barkCol);
  lathe(far, [[3.1, .55], [3.3, 1.6], [2.6, 4.2], [1.85, 7.4], [1.15, 10.4], [.5, 13.2], [0, H + .2]], 8, (p, n) => mul([.024, .05, .04], .4 + .55 * clamp(p.y / H) + .1 * n.y));
  return { near: [part('bark', MAT.bark, wood), part('needles', MAT.leaf, lf)], far: [part('bark', MAT.bark, fw), part('needles', MAT.leaf, far)], collider: { type: 'cylinder', r: .45, h: 3 } };
}

export function willow() {
  const R = rng(1401), wood = new MB(), lf = new MB();
  const barkCol = barkColour([.035, .03, .024], [.14, .12, .095], 1.2, .6);
  const ctx = { R, wood, tips: [], segs: [], axis: new V3(), barkCol,
    lv: [null, { segs: 6, radial: 7, gnarl: .09, up: .03, taper: .45, out: .05, bark: .08 },
      { n: [3, 4], at: [.3, 1], angle: [.55, .95], lenK: [.5, .62], rK: .55, segs: 4, radial: 4, gnarl: .14, up: 0, taper: .3, out: .09, leafAlong: .7 }] };
  const T = trunkPts(R, 3.3, .5, .38, 12, .6, .5); tube(wood, T.pts, T.radii, 14, barkCol, { bark: .12, barkF: 1.3, furrow: .1, furrowN: 10 });
  const top = T.pts[T.pts.length - 1], kids = 5;
  for (let i = 0; i < kids; i++) { const a = i / kids * TAU + R() * .5, tilt = .5 + R() * .2, d = new V3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a));
    limb(ctx, top.clone().addScaledVector(UP, -.3), d, 4.4 + R() * .8, .27, 1); }
  const cr = crownOf(ctx.tips), ctr = new V3(0, cr.c.y - 1, 0);
  for (const t of ctx.tips) cluster(lf, R, t.p, .95 + R() * .3, { ctr, crownR: cr.r, cards: 26, len: .42, wr: .36, col: [.07, .115, .035], lite: [.12, .16, .05], dark: [.03, .05, .015], coreD: 0, coreK: .5, droop: .6 });
  for (const t of ctx.tips) for (let k = 0; k < 7; k++) {
    const s = t.p.clone().add(new V3((R() - .5) * 1.6, (R() - .5) * .4, (R() - .5) * 1.6)), o = new V3(s.x, 0, s.z), rr = o.length(); o.normalize();
    const tw = (R() - .5) * 1.2, sd = new V3(-o.z, 0, o.x).applyAxisAngle(UP, tw), yEnd = .3 + R() * R() * 3.4 + (rr < 2.5 ? 1.2 : 0), drop = s.y - yEnd; if (drop < 1) continue;
    const pp = [], n = 6; for (let j = 0; j <= n; j++) { const tt = j / n; pp.push(s.clone().addScaledVector(o, .95 * Math.sin(tt * 1.5) + .15 * tt).addScaledVector(UP, -drop * Math.pow(tt, 1.05)).addScaledVector(sd, .15 * Math.sin(tt * 5 + k))); }
    const base = vary([.07, .115, .035], R, .12), nr = o.clone().lerp(UP, .3).normalize(), lit = clamp(.45 + .45 * clamp(rr / cr.r));
    ribbon(lf, pp, pp.map((_, j) => (j % 2 ? .12 : .34) * (1 - .4 * j / n)), () => sd, () => nr, tt => mul(mix(base, [.13, .17, .055], tt * .7), (lit + .12 * (1 - tt)) * (.88 + R() * .24)));
  }
  const far = new MB(), fw = new MB(); tube(fw, [T.pts[0], top], [.52, .38], 6, barkCol);
  const tp = cr.c.y + cr.r * .5;
  lathe(far, [[5.5, 1], [5.6, tp - 5.6], [5.3, tp - 3.4], [4.4, tp - 1.6], [2.6, tp - .4], [.2, tp]], 10, p => mul([.08, .12, .038], .45 + .5 * clamp((p.y - 1) / (tp - 1))));
  return { near: [part('bark', MAT.bark, wood), part('leaves', MAT.leaf, lf)], far: [part('bark', MAT.bark, fw), part('leaves', MAT.leaf, far)], collider: { type: 'cylinder', r: .55, h: 3.3 } };
}

// ------------------------------------------------------------------ PROPS
const dirt = (c, y, h = .15, k = .55) => mix([.07, .05, .035], c, clamp(.35 + .65 * (y / h)) * k + (1 - k));

export function fireHydrant() {
  const mb = new MB(), far = new MB(), red = [.42, .022, .016], white = [.72, .71, .66], silver = [.32, .32, .31];
  const col = (c) => (p, n) => { const g = noise(p.x * 30, p.y * 25, p.z * 30); return mul(dirt(c, p.y, .14, .6), .88 + .2 * g); };
  lathe(mb, hard([[0, 0], [.16, 0, 1], [.16, .035, 1], [.128, .048], [.116, .07], [.112, .3], [.11, .52, 1], [.142, .53, 1], [.142, .575, 1], [.122, .592]]), 22, col(red));
  lathe(mb, [[.122, .592], [.118, .63], [.104, .685], [.078, .735], [.04, .765], [0, .775]], 22, col(white));
  lathe(mb, hard([[0, .76], [.03, .76, 1], [.03, .805, 1], [0, .805]]), 5, col(silver));
  const nozzle = (m, k) => { lathe(mb, hard([[0, 0], [.05 * k, 0, 1], [.05 * k, .05, 1], [.06 * k, .05, 1], [.06 * k, .085, 1], [.05 * k, .1, 1], [0, .1]]), 12, col(white), m);
    lathe(mb, hard([[0, .095], [.024 * k, .095, 1], [.024 * k, .125, 1], [0, .125]]), 5, col(silver), m); };
  nozzle(M([.085, .43, 0], [0, 0, -Math.PI / 2]), 1); nozzle(M([-.085, .43, 0], [0, 0, Math.PI / 2]), 1); nozzle(M([0, .38, .085], [Math.PI / 2, 0, 0]), 1.35);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3; lathe(mb, hard([[0, .035], [.013, .035, 1], [.013, .055, 1], [0, .055]]), 6, col(silver), M([Math.cos(a) * .14, 0, Math.sin(a) * .14])); }
  lathe(far, [[.16, 0], [.115, .06], [.11, .55], [.14, .56], [.12, .62], [.07, .74], [0, .78]], 8, (p) => p.y > .59 ? white : mul(red, p.y < .1 ? .6 : 1));
  far.geo(new THREE.CylinderGeometry(.06, .06, .3, 6, 1).rotateZ(Math.PI / 2), M([0, .43, 0]), white); far.geo(new THREE.CylinderGeometry(.075, .075, .14, 6, 1).rotateX(Math.PI / 2), M([0, .38, .1]), white);
  return { near: [part('body', MAT.paint, mb)], far: [part('body', MAT.paint, far)] };
}

export function iceChest() {
  const mb = new MB(), far = new MB(), W = 1.45, H = 1.26, D = .76, white = [.74, .75, .76], blue = [.012, .08, .38], grey = [.32, .33, .34], dark = [.035, .035, .04];
  const c = k => (p, n) => mul(dirt(k, p.y, .35, .45), (.9 + .08 * noise(p.x * 9, p.y * 9, p.z * 9)) * (n.y < -.5 ? .4 : 1));
  const B = (sx, sy, sz, x, y, z, k, m = mb) => box(m, sx, sy, sz, M([x, y, z]), c(k));
  B(W - .06, .09, D - .06, 0, .045, 0, dark); B(W, H - .14, D, 0, .09 + (H - .14) / 2, 0, white); B(W + .03, .05, D + .03, 0, H - .025, 0, [.66, .67, .68]);
  B(W + .004, .09, D + .004, 0, .16, 0, blue);
  const dh = H - .44, dy = .24 + dh / 2;
  for (const s of [-1, 1]) { B(W / 2 - .07, dh, .02, s * W / 4, dy, D / 2 + .01, [.8, .81, .83]); B(.03, .2, .035, s * .07, .4, D / 2 + .035, grey); B(.03, .03, .02, s * .07, .49, D / 2 + .025, grey); B(.03, .03, .02, s * .07, .31, D / 2 + .025, grey); }
  B(.016, dh + .02, .022, 0, dy, D / 2 + .011, dark); B(.06, .07, .03, 0, .56, D / 2 + .03, [.25, .22, .12]);
  // the word ICE across the doors
  const lh = .34, st = .07, z = D / 2 + .028, y0 = dy + .17; let x = -.37;
  const L = (sx, sy, cx, cy) => B(sx, sy, .016, x + cx, y0 + cy, z, blue);
  L(st, lh, st / 2, 0); x += st + .09;
  L(st, lh, st / 2, 0); L(.25, st, .125, lh / 2 - st / 2); L(.25, st, .125, -lh / 2 + st / 2); x += .25 + .09;
  L(st, lh, st / 2, 0); L(.21, st, .105, lh / 2 - st / 2); L(.16, st, .08, 0); L(.21, st, .105, -lh / 2 + st / 2);
  for (let i = 0; i < 6; i++) B(.012, .03, .42, W / 2 + .006, .3 + i * .055, 0, dark);
  // a frost-blue band of snowflake marks under the word
  for (let i = 0; i < 5; i++) { const fx = -.5 + i * .25, fy = dy - .05; if (i === 2) continue; for (let r = 0; r < 3; r++) box(mb, .1, .012, .012, M([fx, fy, z], [0, 0, r * Math.PI / 3]), c([.15, .35, .7])); }
  B(W, H - .05, D, 0, (H - .05) / 2, 0, white, far); B(.75, .34, .02, 0, dy + .14, D / 2 + .01, blue, far); B(W + .004, .09, D + .004, 0, .16, 0, blue, far);
  return { near: [part('body', MAT.paint, mb)], far: [part('body', MAT.paint, far)] };
}

export function tireStack() {
  const mb = new MB(), far = new MB(), R = rng(1301), ri = .2, ro = .335, hw = .105;
  const prof = [[ri + .01, -hw * .78], [ri + .05, -hw * .95], [ri + .1, -hw - .006], [ro - .035, -hw + .004], [ro - .006, -hw + .028], [ro, -hw * .45], [ro - .012, 0], [ro, hw * .45], [ro - .006, hw - .028], [ro - .035, hw - .004], [ri + .1, hw + .006], [ri + .05, hw * .95], [ri + .01, hw * .78], [ri - .005, 0], [ri + .01, -hw * .78]];
  const tread = new Set([5, 7]);
  const tire = (mbx, m, seg, top, p2) => lathe(mbx, p2 || prof, seg, (p, n, i) => { const side = i < 3 || i > 9 ? 1.25 : 1; let k = mul([.016, .016, .018], side * (.8 + .4 * noise(p.x * 14, p.y * 14, p.z * 14)));
    if (top && n.y > .3) k = mix(k, [.085, .075, .062], clamp(n.y) * .7 * noise(p.x * 6, p.z * 6, 3)); if (i === 13) k = mul(k, .5); return k; }, m, (r, a, y, i, j) => tread.has(i) && j % 2 ? r - .009 : r);
  let y = hw;
  for (let i = 0; i < 4; i++) { const m = M([(R() - .5) * .06, y, (R() - .5) * .06], [(R() - .5) * .05, R() * 3, (R() - .5) * .05]); tire(mb, m, 24, i === 3); y += 2 * hw - .004; }
  const lean = M([.56, ro - .01, .05], [0, .35, 1.32]); tire(mb, lean, 24, true);
  const fp = [[ri, -hw * .8], [ro - .02, -hw], [ro, 0], [ro - .02, hw], [ri, hw * .8], [ri, -hw * .8]];
  y = hw; for (let i = 0; i < 4; i++) { lathe(far, fp, 10, () => [.02, .02, .022], M([0, y, 0])); y += 2 * hw - .004; } lathe(far, fp, 10, () => [.02, .02, .022], lean);
  return { near: [part('tyres', MAT.rubber, mb)], far: [part('tyres', MAT.rubber, far)] };
}

export function oilDrum() {
  const mb = new MB(), far = new MB(), paint = [.018, .065, .2], rust = [.15, .045, .014], rust2 = [.06, .02, .008];
  const col = (p, n) => { const a = Math.atan2(p.z, p.x), y = p.y; let m = clamp((fbm(a * 1.6 + 4, y * 3.2, 1, 3) - .5) * 4) * .9;
    m = Math.max(m, clamp((.1 - y) * 10) * .8, clamp((y - .84) * 25) * .55 * noise(a * 5, 2)); const streak = clamp((noise(a * 7, y * .7, 9) - .55) * 5) * clamp((.9 - y) * 2);
    let c = mix(paint, mix(rust, rust2, noise(a * 9, y * 12)), clamp(m + streak * .5)); if (n.y > .8 && y > .8) c = mix(c, [.1, .085, .07], .45); return mul(c, .85 + .25 * noise(a * 20, y * 30)); };
  const rows = []; const add = (r, y, h) => rows.push([r, y, h]);
  add(0, 0); add(.283, 0, 1); add(.29, .01, 1); add(.29, .024, 1); add(.284, .032);
  for (let y = .06; y < .28; y += .055) add(.284, y); add(.284, .283); add(.293, .292, 1); add(.293, .305, 1); add(.284, .314);
  for (let y = .34; y < .58; y += .055) add(.284, y); add(.284, .583); add(.293, .592, 1); add(.293, .605, 1); add(.284, .614);
  for (let y = .64; y < .85; y += .055) add(.284, y); add(.284, .852); add(.29, .86, 1); add(.29, .876, 1); add(.276, .882, 1); add(.272, .868, 1); add(.268, .864, 1); add(0, .864);
  const dent = (r, a, y) => r > .2 && y > .05 && y < .85 ? r * (1 - .018 * clamp((noise(Math.cos(a) * 2 + 7, y * 3, Math.sin(a) * 2) - .55) * 5)) : r;
  lathe(mb, hard(rows), 32, col, null, dent);
  for (const [x, z, r] of [[.17, .05, .03], [-.19, -.02, .022]]) lathe(mb, hard([[r, .862], [r, .878, 1], [r * .75, .884, 1], [0, .884]]), 8, (p) => mul([.06, .06, .06], 1), M([x, 0, z]));
  lathe(far, [[0, 0], [.29, 0], [.29, .3], [.29, .6], [.29, .88], [0, .88]], 10, col);
  return { near: [part('drum', MAT.paint, mb)], far: [part('drum', MAT.paint, far)] };
}

export function ruralMailbox() {
  const wood = new MB(), metal = new MB(), far = new MB(), R = rng(1501), w = [.15, .105, .07];
  const wc = (p, n) => mul(mix([.06, .045, .03], w, .5 + .5 * noise(p.x * 3, p.y * 14, p.z * 3)), dirt([1, 1, 1], p.y, .25, .5)[0] * (n.y > .5 ? .8 : 1));
  box(wood, .09, 1.29, .09, M([0, .445, 0], [0, 0, .015]), wc); box(wood, .13, .04, .52, M([0, 1.078, .12]), wc); box(wood, .04, .04, .32, M([0, .98, -.02], [-.7, 0, 0]), wc);
  const sh = new THREE.Shape(), bw = .085, bh = .11; sh.moveTo(-bw, 0); sh.lineTo(bw, 0); sh.lineTo(bw, bh); sh.absarc(0, bh, bw, 0, Math.PI, false); sh.lineTo(-bw, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: .47, bevelEnabled: false, curveSegments: 10 });
  const gal = (p, n) => mul([.36, .36, .35], .8 + .3 * noise(p.x * 20, p.y * 20, p.z * 8) * (n.y > .4 ? 1.15 : 1));
  metal.geo(g, M([0, 1.098, -.1]), gal);
  const dsh = new THREE.Shape(), ow = bw + .006; dsh.moveTo(-ow, -.006); dsh.lineTo(ow, -.006); dsh.lineTo(ow, bh); dsh.absarc(0, bh, ow, 0, Math.PI, false); dsh.lineTo(-ow, -.006);
  metal.geo(new THREE.ExtrudeGeometry(dsh, { depth: .012, bevelEnabled: false, curveSegments: 10 }), M([0, 1.098, .37]), (p, n) => mul(gal(p, n), .92));
  box(metal, .03, .02, .02, M([0, 1.098 + bh + bw - .02, .39]), [.2, .2, .2]);
  const red = [.48, .02, .014];
  box(metal, .008, .24, .025, M([bw + .006, 1.098 + .13, .02]), red); box(metal, .008, .07, .1, M([bw + .006, 1.098 + .215, -.02]), red);
  box(metal, .012, .02, .02, M([bw + .002, 1.098 + .03, .02]), [.15, .15, .15]);
  box(far, .09, 1.29, .09, M([0, .445, 0]), wc); far.geo(new THREE.ExtrudeGeometry(sh, { depth: .47, bevelEnabled: false, curveSegments: 3 }), M([0, 1.098, -.1]), [.36, .36, .35]); box(far, .008, .07, .1, M([bw + .006, 1.098 + .215, -.02]), red);
  return { near: [part('post', MAT.wood, wood), part('box', MAT.metal, metal)], far: [part('all', MAT.paint, far)] };
}

export const ASSETS = [
  { id: 'grass_meadow', name: 'Meadow Tuft', group: 'Grass', fn: meadowTuft, where: 'Lawns, parks, yards, meadows and the floor of open woods; scatter thick.' },
  { id: 'grass_dry', name: 'Dry Prairie Grass', group: 'Grass', fn: dryPrairie, where: 'Road shoulders, fence lines, dry country and the sunny edges of woods.' },
  { id: 'grass_reeds', name: 'Creek Reeds', group: 'Grass', fn: creekReeds, where: 'Creek banks, ponds, standing water and roadside ditches.' },
  { id: 'bush_sage', name: 'Sagebrush', group: 'Bushes', fn: sagebrush, where: 'Anywhere dry: open country, hills, empty lots, the edge of a salt flat.' },
  { id: 'bush_oleander', name: 'Oleander', group: 'Bushes', fn: oleander, where: 'Town landscaping: in front of houses, along a boulevard, round a diner or a gas station.' },
  { id: 'bush_pricklypear', name: 'Prickly Pear', group: 'Bushes', fn: pricklyPear, where: 'Rocky ground, roadside desert, dry yards, the sunny side of a ranch.' },
  { id: 'tree_cottonwood', name: 'Cottonwood', group: 'Trees', fn: cottonwood, where: 'Along creeks, round farms (windbreaks, shade by the house), parks.' },
  { id: 'tree_ponderosa', name: 'Ponderosa Pine', group: 'Trees', fn: ponderosa, where: 'Hills and higher ground in loose stands; open pine woods.' },
  { id: 'tree_mesquite', name: 'Mesquite', group: 'Trees', fn: mesquite, where: 'Dry country and pasture, alone or in twos; shade beside a dirt road.' },
  { id: 'tree_snag', name: 'Dead Snag', group: 'Trees', fn: deadSnag, where: 'One at a time: an old pasture, a burn, deep woods, beside a dirt track.' },
  { id: 'tree_oak', name: 'Bur Oak', group: 'Trees', fn: burOak, where: 'Open woods and pasture edges; one big one alone in a clearing.' },
  { id: 'tree_aspen', name: 'Quaking Aspen', group: 'Trees', fn: aspen, where: 'Groves of a dozen or more, close together, on hillsides and at the edges of conifer woods.' },
  { id: 'tree_spruce', name: 'Spruce', group: 'Trees', fn: spruce, where: 'Thick conifer woods and north slopes; close enough together to wall in a path.' },
  { id: 'tree_willow', name: 'Weeping Willow', group: 'Trees', fn: willow, where: 'Beside creeks and ponds and on wet ground; one beside a farmhouse.' },
  { id: 'prop_hydrant', name: 'Fire Hydrant', group: 'Props', fn: fireHydrant, where: 'Town sidewalks, about one a block, at the kerb near corners.' },
  { id: 'prop_icechest', name: 'Ice Chest', group: 'Props', fn: iceChest, where: 'Against the wall of a gas station or corner store; one a store.' },
  { id: 'prop_tires', name: 'Tire Stack', group: 'Props', fn: tireStack, where: 'A garage, behind a gas station, a farm yard, a race paddock.' },
  { id: 'prop_drum', name: 'Oil Drum', group: 'Props', fn: oilDrum, where: 'Anywhere work happens: a garage, farm yards, a paddock, a lone one out in a field or the woods.' },
  { id: 'prop_mailbox', name: 'Rural Mailbox', group: 'Props', fn: ruralMailbox, where: 'At the end of a farm or cabin drive on a country road.' },
];
