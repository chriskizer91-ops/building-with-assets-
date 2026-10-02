// Runs one game at a time on the console's screen, in its own frame and at its own web address,
// so each game keeps its own saves and can't touch the console or other games.

import { native } from './native.js';
import { settings, DEFAULT_KEYMAP } from './store.js';
import { showLoading, hideLoading, toast } from './screen.js';
import { sfx } from './sound.js';
import { Emitter } from './util.js';

export class GameHost {
  constructor({ stage, loading, flash, library }) {
    this.stage = stage;
    this.loadingLayer = loading;
    this.flash = flash;
    this.lib = library;
    this.events = new Emitter();
    this.frame = null;
    this.item = null;
    this.loaded = false;
    this.secs = 0;
    this.unsaved = 0;
    this.hidden = false;
    setInterval(() => this.tick(), 1000);
    addEventListener('message', (e) => this.onMessage(e));
  }

  get playing() { return this.item; }

  keymap() {
    const own = (this.item && this.item.opts && this.item.opts.keymap) || {};
    return { ...DEFAULT_KEYMAP, ...settings.get('keymap'), ...own };
  }

  async launch(id) {
    const item = this.lib.get(id);
    if (!item || item.type !== 'game') return false;
    if (this.item) await this.quit({ thumb: true });
    this.item = item;
    this.loaded = false;
    this.secs = 0;
    this.unsaved = 0;
    this.events.emit('starting', item);
    console.info(`[mooncart] starting ${item.saveKey}`);
    showLoading(this.loadingLayer, item.name);
    await native.register(item.saveKey, item.src);
    const query = (item.opts && item.opts.query) || '';
    const url = native.gameUrl(item.saveKey, item.file, query && /^[?#]/.test(query) ? query : query ? '?' + query : '');

    const f = document.createElement('iframe');
    f.className = 'game';
    f.setAttribute('allow', 'autoplay; fullscreen; gamepad; clipboard-read; clipboard-write; screen-wake-lock; accelerometer; gyroscope');
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-downloads allow-orientation-lock');
    f.title = item.name;
    const started = performance.now();
    f.addEventListener('load', () => {
      if (this.frame !== f) return;
      this.loaded = true;
      hideLoading(this.loadingLayer);
      this.powerOn();
      this.focus();
      const ms = performance.now() - started;
      console.info(`[mooncart] loaded ${item.saveKey} in ${Math.round(ms)} ms`);
      this.events.emit('loaded', item, ms);
    }, { once: true });
    // a very big game can take a while to read; let the player see it as soon as it draws
    setTimeout(() => {
      if (this.frame !== f || this.loaded) return;
      console.info(`[mooncart] ${item.saveKey} still loading after 25 s`);
      hideLoading(this.loadingLayer);
    }, 25000);
    f.src = url;
    this.frame = f;
    this.stage.replaceChildren(f);
    if (native.setKeyTarget) native.setKeyTarget(f.contentWindow);
    native.setKeymap(this.keymap());
    native.setPlaying(true);
    const orient = (item.opts && item.opts.orientation) || settings.get('orientation');
    native.setOrientation(orient);
    this.lib.touchPlayed(item.id);
    // a picture for the cartridge label, once the game has had time to draw something
    clearTimeout(this.thumbTimer);
    this.thumbTimer = setTimeout(() => this.snap(), 30000);
    return true;
  }

  powerOn() {
    const fl = this.flash;
    fl.classList.remove('on', 'off');
    void fl.offsetWidth;
    fl.classList.add('on');
  }

  focus() {
    const f = this.frame;
    if (!f) return;
    try { f.focus(); f.contentWindow && f.contentWindow.focus(); } catch { /* cross-origin focus is allowed; ignore odd engines */ }
  }

  // hide while the library is open (the game keeps its place)
  setHidden(on) {
    this.hidden = on;
    if (this.frame) this.frame.style.visibility = on ? 'hidden' : '';
  }

  async snap() {
    const it = this.item;
    if (!it || !this.loaded || this.hidden || document.hidden) return;
    const r = this.getRect ? this.getRect() : null;
    if (!r) return;
    const dpr = window.devicePixelRatio || 1;
    const name = await native.captureThumb(it.id + '.jpg', { x: Math.round(r.x * dpr), y: Math.round(r.y * dpr), w: Math.round(r.w * dpr), h: Math.round(r.h * dpr) });
    if (name && this.lib.exists(it.id)) this.lib.setField(it.id, { thumb: name, thumbAt: Date.now() });
  }

  async quit({ thumb = true } = {}) {
    const it = this.item;
    if (!it) return;
    clearTimeout(this.thumbTimer);
    // the cartridge picture never holds up quitting for long
    if (thumb && this.secs >= 5) await Promise.race([this.snap(), new Promise((r) => setTimeout(r, 3000))]);
    this.flushTime();
    this.item = null;
    this.loaded = false;
    if (this.frame) {
      try { this.frame.src = 'about:blank'; } catch { /* ignore */ }
      this.frame.remove();
    }
    this.frame = null;
    if (native.setKeyTarget) native.setKeyTarget(null);
    hideLoading(this.loadingLayer);
    native.setPlaying(false);
    native.setOrientation(settings.get('orientation'));
    this.events.emit('stopped', it);
  }

  async restart() {
    const it = this.item;
    if (!it) return;
    await this.quit({ thumb: false });
    await this.launch(it.id);
  }

  tick() {
    if (!this.item || !this.loaded || this.hidden || document.hidden) return;
    this.secs++;
    this.unsaved++;
    if (this.unsaved >= 60) this.flushTime();
  }

  flushTime() {
    if (this.item && this.unsaved > 0) this.lib.addPlayTime(this.item.id, this.unsaved);
    this.unsaved = 0;
  }

  // a console button while playing: press the key it stands for
  button(btn, down) {
    const code = this.keymap()[btn];
    if (!code) return;
    if (down) this.focus();
    native.key(code, down);
  }

  onMessage(e) {
    if (!this.frame || e.source !== this.frame.contentWindow) return;
    const m = e.data;
    if (!m || m.mooncart !== 1) return;
    if (m.op === 'download' && typeof m.data === 'string') {
      native.saveFile(String(m.name || 'download').slice(0, 120), String(m.mime || 'application/octet-stream'), m.data, true)
        .then((ok) => { if (ok) { sfx('select'); toast('Saved ' + (m.name || 'the file')); } });
    }
  }
}

export { DEFAULT_KEYMAP };
