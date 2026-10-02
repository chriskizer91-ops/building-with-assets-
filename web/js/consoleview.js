// The console itself: draws the pixel-art body on a low-resolution canvas (scaled up with hard
// edges), puts the game screen in the hole, and turns touches on the drawn buttons into
// button presses.

import { layoutConsole } from './layout.js';
import { drawBackdrop, drawConsole, hitAreas, Pix } from './art.js';
import { theme } from './themes.js';
import { Emitter } from './util.js';

const BUTTONS = ['dpad', 'a', 'b', 'start', 'select', 'home', 'menu'];

export class ConsoleView {
  constructor({ canvas, screen, pads }) {
    this.canvas = canvas;
    this.screen = screen;
    this.pads = pads;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.pix = new Pix(this.ctx);
    this.events = new Emitter();
    this.opts = { theme: 'moonlight', shape: 'fill', frame: true, name: 'MOONCART', fill: true, touch: true };
    this.pressed = {};
    this.cart = null;
    this.led = 'on';
    this.L = null;
    this.anim = 0;
    this.makePads();
    addEventListener('resize', () => this.resize());
    if (window.visualViewport) visualViewport.addEventListener('resize', () => this.resize());
    setInterval(() => { if (this.L && !this.L.fill && this.L.mode !== 'bare' && !this.busy) this.draw(); }, 700);
  }

  configure(o) {
    Object.assign(this.opts, o);
    this.resize();
  }

  resize() {
    const w = document.documentElement.clientWidth || innerWidth;
    const h = document.documentElement.clientHeight || innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const o = this.opts;
    this.L = o.frame ? layoutConsole({ cssW: w, cssH: h, dpr, shape: o.shape, touch: o.touch, fill: o.fill }) : { mode: 'bare', screenCss: { x: 0, y: 0, w, h } };
    const L = this.L;
    const bare = L.mode === 'bare';
    document.body.classList.toggle('bare', bare);
    this.canvas.hidden = bare;
    this.pads.hidden = bare;
    const s = L.screenCss;
    Object.assign(this.screen.style, { left: s.x + 'px', top: s.y + 'px', width: s.w + 'px', height: s.h + 'px' });
    this.screen.style.setProperty('--u', (Math.min(s.h, s.w * 0.75) / 100).toFixed(3) + 'px');
    this.screen.classList.toggle('tall', s.h > s.w * 0.9);
    if (!bare) {
      this.canvas.width = L.AW;
      this.canvas.height = L.AH;
      const k = L.P / L.dpr;
      Object.assign(this.canvas.style, { width: L.AW * k + 'px', height: L.AH * k + 'px' });
      const hits = hitAreas(L);
      for (const name of BUTTONS) {
        const r = L.toCss(hits[name]);
        Object.assign(this.padEls[name].style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      }
      this.draw();
    }
    this.events.emit('layout', L);
  }

  get screenRect() { return this.L ? this.L.screenCss : null; }

  draw() {
    const L = this.L;
    if (!L || L.mode === 'bare') return;
    const T = theme(this.opts.theme);
    const p = this.pix;
    const now = performance.now();
    if (L.fill) p.rect(0, 0, L.AW, L.AH, '#000000');
    else drawBackdrop(p, L, now);
    drawConsole(p, L, T, { pressed: this.pressed, cart: this.cart, led: this.led, t: now, name: this.opts.name });
  }

  // animate for a little while (cart sliding in, LED blinking)
  animate(ms) {
    const until = performance.now() + ms;
    this.animUntil = Math.max(this.animUntil || 0, until);
    if (this.anim) return;
    const tick = () => {
      const now = performance.now();
      if (this.cart && this.cart.slide < 1) this.cart.slide = Math.min(1, this.cart.slide + 0.12);
      this.draw();
      this.anim = now < this.animUntil ? requestAnimationFrame(tick) : 0;
    };
    this.anim = requestAnimationFrame(tick);
  }

  setCart(title, slideIn = true) {
    this.cart = title ? { title, slide: slideIn ? 0 : 1 } : null;
    if (slideIn && title) this.animate(400);
    else this.draw();
  }

  setLed(mode) {
    this.led = mode;
    if (mode === 'blink') this.animate(1e9);
    else { this.animUntil = 0; this.draw(); }
  }

  setPressed(btn, down) {
    if (!!this.pressed[btn] === !!down) return;
    this.pressed[btn] = !!down;
    this.draw();
  }

  makePads() {
    this.padEls = {};
    for (const name of BUTTONS) {
      const e = document.createElement('div');
      e.className = 'pad pad-' + name;
      e.dataset.btn = name;
      this.pads.append(e);
      this.padEls[name] = e;
    }
    // d-pad: the thumb can slide between directions, and diagonals press two arrows
    const pad = this.padEls.dpad;
    let dirs = new Set();
    let pid = null;
    const aim = (ev) => {
      const r = pad.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const next = new Set();
      if (Math.hypot(dx, dy) > 0.18) {
        const t = 0.38 * Math.max(Math.abs(dx), Math.abs(dy));
        if (dx > t) next.add('right');
        if (dx < -t) next.add('left');
        if (dy > t) next.add('down');
        if (dy < -t) next.add('up');
      }
      for (const d of dirs) if (!next.has(d)) this.press(d, false, 'touch');
      for (const d of next) if (!dirs.has(d)) this.press(d, true, 'touch');
      dirs = next;
    };
    const release = () => { for (const d of dirs) this.press(d, false, 'touch'); dirs = new Set(); pid = null; };
    pad.addEventListener('pointerdown', (ev) => { ev.preventDefault(); pid = ev.pointerId; pad.setPointerCapture(pid); aim(ev); });
    pad.addEventListener('pointermove', (ev) => { if (ev.pointerId === pid) aim(ev); });
    pad.addEventListener('pointerup', (ev) => { if (ev.pointerId === pid) release(); });
    pad.addEventListener('pointercancel', (ev) => { if (ev.pointerId === pid) release(); });

    for (const name of BUTTONS.slice(1)) {
      const e = this.padEls[name];
      let id = null;
      e.addEventListener('pointerdown', (ev) => { ev.preventDefault(); id = ev.pointerId; e.setPointerCapture(id); this.press(name, true, 'touch'); });
      const up = (ev) => { if (ev.pointerId !== id) return; id = null; this.press(name, false, 'touch'); };
      e.addEventListener('pointerup', up);
      e.addEventListener('pointercancel', up);
    }
    this.pads.addEventListener('contextmenu', (ev) => ev.preventDefault());
    // no "click" after a tap on a console button: it would land on whatever the press just opened
    this.pads.addEventListener('touchstart', (ev) => ev.preventDefault(), { passive: false });
    this.pads.addEventListener('touchend', (ev) => ev.preventDefault(), { passive: false });
    this.canvas.addEventListener('pointerdown', (ev) => ev.preventDefault());
  }

  press(btn, down, source) {
    this.setPressed(btn, down);
    this.events.emit('button', btn, down, source);
  }
}
