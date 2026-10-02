// Draws the console: a chunky pixel-art handheld, built from rectangles at low resolution and
// scaled up with hard edges. Nothing here is an image file; colours come from themes.js and
// positions from layout.js.

import { glyphPixels, measure, fit } from './fonts.js';

export class Pix {
  constructor(ctx) { this.c = ctx; }
  rect(x, y, w, h, col) {
    if (w <= 0 || h <= 0) return;
    this.c.fillStyle = col;
    this.c.fillRect(x, y, w, h);
  }
  px(x, y, col) { this.rect(x, y, 1, 1, col); }
  // rounded rectangle with pixel-stepped corners; r may be a number or [tl, tr, br, bl]
  rrect(x, y, w, h, r, col) {
    if (w <= 0 || h <= 0) return;
    const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
    this.c.fillStyle = col;
    for (let j = 0; j < h; j++) {
      const li = Math.max(inset(tl, j), inset(bl, h - 1 - j));
      const ri = Math.max(inset(tr, j), inset(br, h - 1 - j));
      if (w - li - ri > 0) this.c.fillRect(x + li, y + j, w - li - ri, 1);
    }
  }
  // filled circle in the d x d box at (x, y)
  circle(x, y, d, col) {
    if (d <= 0) return;
    this.c.fillStyle = col;
    const R = d / 2;
    for (let j = 0; j < d; j++) {
      const dy = j + 0.5 - R;
      const half = Math.sqrt(Math.max(0, R * R - dy * dy));
      const x0 = Math.round(R - half), x1 = Math.round(R + half);
      if (x1 > x0) this.c.fillRect(x + x0, y + j, x1 - x0, 1);
    }
  }
  // checkerboard of col over a rectangle (the classic way to fake a half-tone)
  dither(x, y, w, h, col, phase = 0) {
    this.c.fillStyle = col;
    for (let j = 0; j < h; j++) for (let i = (j + phase) & 1; i < w; i += 2) this.c.fillRect(x + i, y + j, 1, 1);
  }
  text(str, x, y, col, opts = {}) {
    this.c.fillStyle = col;
    glyphPixels(str, x, y, opts, (px, py) => this.c.fillRect(px, py, 1, 1));
  }
  // a surface with an outline, a lit top-left rim and a shaded bottom-right rim
  bevel(x, y, w, h, r, pal, pressed = false) {
    this.rrect(x, y, w, h, r, pal.edge);
    if (pressed) {
      this.rrect(x + 1, y + 1, w - 2, h - 2, Math.max(0, r - 1), pal.lo);
      this.rrect(x + 1, y + 2, w - 2, h - 3, Math.max(0, r - 1), pal.base);
      return;
    }
    this.rrect(x + 1, y + 1, w - 2, h - 2, Math.max(0, r - 1), pal.lo);
    this.rrect(x + 1, y + 1, w - 3, h - 4, Math.max(0, r - 1), pal.hi);
    this.rrect(x + 2, y + 2, w - 4, h - 5, Math.max(0, r - 2), pal.base);
  }
  roundButton(x, y, d, pal, pressed = false) {
    this.circle(x, y, d, pal.edge);
    if (pressed) {
      this.circle(x + 1, y + 1, d - 2, pal.lo);
      this.circle(x + 1, y + 2, d - 3, pal.base);
      return;
    }
    this.circle(x + 1, y + 1, d - 2, pal.lo);
    this.circle(x + 1, y + 1, d - 3, pal.hi);
    this.circle(x + 2, y + 2, d - 5, pal.base);
    if (d >= 9) { this.rect(x + Math.round(d * 0.28), y + Math.round(d * 0.22), 2, 1, pal.hi); }
  }
}

function inset(r, j) {
  if (r <= 0 || j >= r) return 0;
  const dy = r - j - 0.5;
  return r - Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
}

// Seeded random, so the stars stay put between redraws.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function drawBackdrop(p, L, t) {
  const { AW, AH } = L;
  const sky = ['#06050c', '#0a0915', '#0f0d1e', '#151229', '#1b1634'];
  const band = Math.ceil(AH / sky.length);
  for (let i = 0; i < sky.length; i++) {
    p.rect(0, i * band, AW, band, sky[i]);
    if (i + 1 < sky.length) p.dither(0, (i + 1) * band - 2, AW, 2, sky[i + 1], i);
  }
  const r = rng(7);
  const n = Math.round(AW * AH / 260);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * AW), y = Math.floor(r() * AH * 0.9);
    const tw = r();
    const lit = Math.sin(t / 900 + tw * 40) > 0.2;
    p.px(x, y, lit ? (tw > 0.85 ? '#fff6d6' : '#c9c1f2') : '#4d4675');
    if (tw > 0.93 && lit) { p.px(x - 1, y, '#5f5890'); p.px(x + 1, y, '#5f5890'); p.px(x, y - 1, '#5f5890'); p.px(x, y + 1, '#5f5890'); }
  }
  // a moon low in the corner
  const md = Math.max(14, Math.round(Math.min(AW, AH) * 0.16));
  const mx = AW - md - Math.round(md * 0.4), my = Math.round(md * 0.35);
  p.circle(mx - 2, my - 2, md + 4, '#1f1a3a');
  p.circle(mx, my, md, '#efe6c7');
  p.circle(mx + Math.round(md * 0.22), my + Math.round(md * 0.18), Math.round(md * 0.22), '#d8cca3');
  p.circle(mx + Math.round(md * 0.58), my + Math.round(md * 0.5), Math.round(md * 0.16), '#d8cca3');
  p.circle(mx + Math.round(md * 0.3), my + Math.round(md * 0.62), Math.round(md * 0.12), '#d8cca3');
}

export function drawConsole(p, L, T, s) {
  const pressed = s.pressed || {};
  const b = L.body;
  const bodyPal = { edge: T.edge, lo: T.lo, hi: T.hi, base: T.body };

  if (L.shadow) p.dither(b.x + 3, b.y + 4, b.w, b.h, '#000000');
  p.bevel(b.x, b.y, b.w, b.h, b.r, bodyPal);

  drawSlot(p, L, T, s.cart);
  drawLed(p, L, T, s);

  // bezel round the screen
  const z = L.bezel;
  p.rrect(z.x, z.y, z.w, z.h, [4, 4, Math.min(14, Math.round(z.h * 0.12)), 4], T.bezelEdge);
  p.rrect(z.x + 1, z.y + 1, z.w - 2, z.h - 2, [3, 3, Math.min(13, Math.round(z.h * 0.12) - 1), 3], T.bezelLo);
  p.rrect(z.x + 1, z.y + 1, z.w - 3, z.h - 3, [3, 3, Math.min(12, Math.round(z.h * 0.12) - 2), 3], T.bezelHi);
  p.rrect(z.x + 2, z.y + 2, z.w - 4, z.h - 4, [2, 2, Math.min(11, Math.round(z.h * 0.12) - 3), 2], T.bezel);
  drawBezelText(p, L, T);
  const sc = L.screen;
  p.rect(sc.x - 1, sc.y - 1, sc.w + 2, sc.h + 2, T.screenEdge);
  p.rect(sc.x, sc.y, sc.w, sc.h, '#000000');

  drawLogo(p, L, T, s.name);
  drawDpad(p, L, T, pressed);
  drawFace(p, L.b, 'B', T, pressed.b);
  drawFace(p, L.a, 'A', T, pressed.a);
  drawPill(p, L.select, 'SELECT', T, pressed.select);
  drawPill(p, L.start, 'START', T, pressed.start);
  drawRound(p, L.home, 'HOME', T, pressed.home, 'home');
  drawRound(p, L.menu, 'MENU', T, pressed.menu, 'menu');
  if (L.speaker) drawSpeaker(p, L.speaker, T);
}

function drawSlot(p, L, T, cart) {
  const sl = L.slot;
  p.rect(sl.x - 1, sl.y, sl.w + 2, sl.h + 1, T.edge);
  p.rect(sl.x, sl.y, sl.w, sl.h, '#14111d');
  if (!cart) {
    p.rect(sl.x + 2, sl.y + sl.h - 2, sl.w - 4, 1, '#221d30');
    return;
  }
  // the top of the cartridge, slid down into the slot (slide: 0 = just arriving, 1 = seated)
  const sink = Math.round((1 - (cart.slide ?? 1)) * -sl.h);
  const cx = sl.x + 2, cw = sl.w - 4, cy = sl.y + 1 + sink;
  p.rect(cx, cy, cw, sl.h - 1, T.cart);
  p.rect(cx, cy, cw, 1, T.cartHi);
  p.rect(cx + cw - 1, cy, 1, sl.h - 1, T.cartLo);
  // label strip with the game's name
  const lx = cx + 3, lw = cw - 6;
  p.rect(lx, cy + 1, lw, sl.h - 2, T.cartLabel);
  const label = fit(cart.title || 'GAME', lw - 4);
  const tw = measure(label);
  p.text(label, lx + Math.floor((lw - tw) / 2), cy + 1 + Math.max(0, Math.floor((sl.h - 2 - 5) / 2)), T.cartText);
  // tidy the overlap at the top edge of the slot
  p.rect(sl.x - 1, sl.y - 1, sl.w + 2, 1, T.edge);
}

function drawLed(p, L, T, s) {
  const { x, y } = L.led;
  const on = s.led !== 'off' && !(s.led === 'blink' && Math.floor(s.t / 220) % 2);
  if (on) {
    p.rect(x - 1, y, 5, 3, T.ledGlow + '55');
    p.rect(x, y - 1, 3, 5, T.ledGlow + '55');
  }
  p.rect(x, y, 3, 3, T.edge);
  p.rect(x, y, 3, 3, on ? T.led : T.ledOff);
  if (on) p.px(x, y, T.ledGlow);
  p.text('POWER', x + 6, y - 1, T.label);
}

function drawBezelText(p, L, T) {
  const bt = L.bezelText;
  const long = 'HYPERTEXT DISPLAY WITH STEREO SOUND';
  const short = 'STEREO SOUND';
  let text = measure(long) + 24 <= bt.w ? long : measure(short) + 16 <= bt.w ? short : '';
  const tw = text ? measure(text) : 0;
  const tx = bt.x + Math.floor((bt.w - tw) / 2);
  const ly = bt.y + 2;
  if (text) p.text(text, tx, bt.y, T.bezelText);
  const gap = text ? 4 : 0;
  const leftEnd = text ? tx - gap : bt.x + bt.w;
  if (leftEnd - bt.x > 4) {
    p.rect(bt.x + 2, ly - 1, leftEnd - bt.x - 2, 1, T.stripes[0]);
    p.rect(bt.x + 2, ly + 1, leftEnd - bt.x - 2, 1, T.stripes[1]);
  }
  if (text) {
    const rx = tx + tw + gap;
    if (bt.x + bt.w - rx > 4) {
      p.rect(rx, ly - 1, bt.x + bt.w - 2 - rx, 1, T.stripes[0]);
      p.rect(rx, ly + 1, bt.x + bt.w - 2 - rx, 1, T.stripes[1]);
    }
  }
}

function drawLogo(p, L, T, name) {
  const lg = L.logo;
  const label = fit(name || 'MOONCART', lg.w - 14, 'big', true);
  const w = measure(label, 'big', true) + 3;
  const moonD = 9;
  const total = moonD + 4 + w;
  const x0 = L.mode === 'stack' ? lg.x + 1 : lg.x + Math.floor((lg.w - total) / 2);
  const y0 = lg.y;
  // crescent moon
  p.circle(x0, y0 - 1, moonD, T.logo);
  p.circle(x0 + 3, y0 - 2, moonD - 1, T.body);
  p.text(label, x0 + moonD + 4, y0 + 1, T.logoHi, { font: 'big', bold: true, italic: true });
  p.text(label, x0 + moonD + 4, y0, T.logo, { font: 'big', bold: true, italic: true });
}

function drawDpad(p, L, T, pressed) {
  const { x, y, s } = L.dpad;
  const arm = Math.max(9, Math.round(s * 0.34));
  const off = Math.floor((s - arm) / 2);
  // round recess the cross sits in
  p.circle(x - 3, y - 3, s + 6, T.lo);
  p.circle(x - 2, y - 2, s + 4, T.recess);
  const pal = { edge: T.dpadEdge, lo: T.dpadLo, hi: T.dpadHi, base: T.dpad };
  const hx = x, hy = y + off, vx = x + off, vy = y;
  // outline both arms first, then fill both, so the join has no seam
  p.rrect(hx, hy, s, arm, 2, pal.edge);
  p.rrect(vx, vy, arm, s, 2, pal.edge);
  p.rrect(hx + 1, hy + 1, s - 2, arm - 2, 1, pal.lo);
  p.rrect(vx + 1, vy + 1, arm - 2, s - 2, 1, pal.lo);
  p.rrect(hx + 1, hy + 1, s - 3, arm - 4, 1, pal.hi);
  p.rrect(vx + 1, vy + 1, arm - 3, s - 4, 1, pal.hi);
  p.rrect(hx + 2, hy + 2, s - 4, arm - 5, 1, pal.base);
  p.rrect(vx + 2, vy + 2, arm - 4, s - 5, 1, pal.base);
  // pressed arm sinks
  const sink = { up: [vx + 1, vy + 1, arm - 2, off], down: [vx + 1, y + off + arm, arm - 2, s - off - arm - 1], left: [hx + 1, hy + 1, off, arm - 2], right: [x + off + arm, hy + 1, s - off - arm - 1, arm - 2] };
  for (const d of ['up', 'down', 'left', 'right']) if (pressed[d]) { const r = sink[d]; p.rect(r[0], r[1], r[2], r[3], pal.lo); }
  // embossed arrows
  const c = x + Math.floor(s / 2), m = y + Math.floor(s / 2);
  const tri = Math.max(2, Math.round(arm * 0.22));
  const inset = Math.max(2, Math.round(off * 0.35));
  for (let i = 0; i < tri; i++) {
    const col = (d) => (pressed[d] ? T.dpadHi : T.dpadLo);
    p.rect(c - i, y + inset + i, i * 2 + 1, 1, col('up'));
    p.rect(c - i, y + s - 1 - inset - i, i * 2 + 1, 1, col('down'));
    p.rect(x + inset + i, m - i, 1, i * 2 + 1, col('left'));
    p.rect(x + s - 1 - inset - i, m - i, 1, i * 2 + 1, col('right'));
  }
  // centre dimple
  const dd = Math.max(3, Math.round(arm * 0.45));
  p.circle(c - Math.floor(dd / 2), m - Math.floor(dd / 2), dd, pal.lo);
  p.circle(c - Math.floor(dd / 2), m - Math.floor(dd / 2) + 1, dd - 1, pal.base);
}

function drawFace(p, btn, letter, T, isDown) {
  const { x, y, d } = btn;
  p.circle(x - 2, y - 2, d + 4, T.lo);
  p.circle(x - 1, y - 1, d + 2, T.recess);
  p.roundButton(x, y, d, { edge: T.btnEdge, lo: T.btnLo, hi: T.btnHi, base: T.btn }, isDown);
  const lw = measure(letter, 'big', true);
  p.text(letter, x + Math.floor((d - lw) / 2), y + d + 4, T.label, { font: 'big', bold: true });
}

function drawPill(p, r, label, T, isDown) {
  p.rrect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 3, T.lo);
  p.bevel(r.x, r.y, r.w, r.h, 2, { edge: T.smallEdge, lo: T.smallLo, hi: T.smallHi, base: T.small }, isDown);
  const tw = measure(label);
  p.text(label, r.x + Math.floor((r.w - tw) / 2), r.y + r.h + 3, T.label);
}

const ICONS = {
  home: ['..#..', '.###.', '#####', '.#.#.', '.###.'],
  menu: ['#####', '.....', '#####', '.....', '#####'],
};

function drawRound(p, r, label, T, isDown, icon) {
  p.circle(r.x - 1, r.y - 1, r.d + 2, T.lo);
  p.roundButton(r.x, r.y, r.d, { edge: T.smallEdge, lo: T.smallLo, hi: T.smallHi, base: T.small }, isDown);
  const rows = ICONS[icon];
  const ix = r.x + Math.floor((r.d - 5) / 2), iy = r.y + Math.floor((r.d - 5) / 2) + (isDown ? 1 : 0);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (rows[j][i] === '#') p.px(ix + i, iy + j, T.smallIcon);
  const tw = measure(label);
  p.text(label, r.x + Math.floor((r.d - tw) / 2), r.y + r.d + 2, T.label);
}

function drawSpeaker(p, r, T) {
  for (let i = 0; i < 6; i++) {
    const x0 = r.x + i * 4;
    for (let k = 0; k < r.h; k++) {
      const x = x0 + Math.floor(k / 2), y = r.y + r.h - 1 - k;
      p.px(x, y, T.speaker);
      p.px(x + 1, y, T.speaker);
      p.px(x + 1, y + 1, T.hi);
    }
  }
}

// Touch targets for each control, a little bigger than the drawn button.
export function hitAreas(L) {
  const grow = (r, g) => ({ x: r.x - g, y: r.y - g, w: (r.w ?? r.d ?? r.s) + 2 * g, h: (r.h ?? r.d ?? r.s) + 2 * g });
  const g = Math.max(2, Math.round((L.dpad.s || 30) * 0.08));
  return {
    dpad: grow({ x: L.dpad.x, y: L.dpad.y, s: L.dpad.s }, g * 2),
    a: grow(L.a, g * 2), b: grow(L.b, g * 2),
    start: grow({ ...L.start, h: L.start.h + 6 }, g), select: grow({ ...L.select, h: L.select.h + 6 }, g),
    home: grow(L.home, g), menu: grow(L.menu, g),
  };
}
