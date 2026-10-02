// What shows on the console's screen when no game is running: the boot intro, the game
// picker, the loading card and the in-game menu. These are ordinary page elements laid over
// the screen hole, sized from the screen's height (--u is 1% of it).

import { el, fmtBytes, fmtDuration, fmtWhen } from './util.js';
import { sfx } from './sound.js';

// ----------------------------------------------------------------------------- boot intro

export function playBoot(layer, name) {
  return new Promise((resolve) => {
    layer.replaceChildren();
    layer.hidden = false;
    const logo = el('div', { class: 'boot-logo' }, el('span', { class: 'boot-moon' }), el('span', { class: 'boot-name', text: titleCase(name) }));
    const sub = el('div', { class: 'boot-sub', text: 'a home for your games' });
    layer.append(el('div', { class: 'boot' }, logo, sub));
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      layer.classList.add('fade');
      setTimeout(() => { layer.hidden = true; layer.classList.remove('fade'); layer.replaceChildren(); resolve(); }, 260);
      removeEventListener('keydown', finish, true);
      layer.removeEventListener('pointerdown', finish);
    };
    requestAnimationFrame(() => requestAnimationFrame(() => logo.classList.add('down')));
    setTimeout(() => { if (!done) { sfx('boot'); sub.classList.add('on'); } }, 1250);
    setTimeout(finish, 2700);
    addEventListener('keydown', finish, true);
    layer.addEventListener('pointerdown', finish);
  });
}

function titleCase(s) {
  return String(s || 'Mooncart').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

// ----------------------------------------------------------------------------- game picker

export class SelectScreen {
  constructor(layer, { library, settings, native, onLaunch, onOpenMenu }) {
    this.layer = layer;
    this.lib = library;
    this.settings = settings;
    this.native = native;
    this.onLaunch = onLaunch;
    this.onOpenMenu = onOpenMenu;
    this.folder = library.root;
    this.index = 0;
    this.items = [];
    this.build();
    setInterval(() => this.tickClock(), 15000);
  }

  build() {
    this.clock = el('span', { class: 'sel-clock' });
    this.pathEl = el('span', { class: 'sel-path' });
    this.list = el('ul', { class: 'sel-list', role: 'listbox' });
    this.card = el('aside', { class: 'sel-card' });
    this.empty = el('div', { class: 'sel-empty', hidden: true });
    this.hints = el('footer', { class: 'sel-hints' });
    this.root = el('div', { class: 'sel' },
      el('header', { class: 'sel-top' }, this.pathEl, this.clock),
      el('div', { class: 'sel-body' }, this.list, this.card, this.empty),
      this.hints);
    this.layer.replaceChildren(this.root);
    this.list.addEventListener('wheel', (e) => { e.stopPropagation(); }, { passive: true });
    this.tickClock();
  }

  tickClock() {
    this.clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  show(folderId) {
    if (folderId && this.lib.exists(folderId)) {
      if (folderId !== this.folder) this.index = 0;
      this.folder = folderId;
    }
    if (!this.lib.exists(this.folder)) { this.folder = this.lib.root; this.index = 0; }
    this.layer.hidden = false;
    this.render();
  }

  hide() { this.layer.hidden = true; }

  pick(id) {
    const i = this.items.findIndex((x) => x.id === id);
    if (i >= 0) { this.index = i; this.refresh(); }
  }
  get visible() { return !this.layer.hidden; }

  render() {
    const lib = this.lib;
    const kids = lib.children(this.folder, this.settings.get('sort'));
    this.items = this.folder === lib.root ? kids : [{ id: '..', type: 'up', name: 'Back' }, ...kids];
    this.index = Math.max(0, Math.min(this.index, this.items.length - 1));
    const crumbs = lib.path(this.folder).map((f) => (f.id === lib.root ? 'Library' : f.name));
    this.pathEl.textContent = crumbs.join(' › ');

    const isEmpty = !kids.length;
    this.empty.hidden = !isEmpty;
    this.list.hidden = isEmpty && this.folder === lib.root;
    this.card.hidden = isEmpty;
    if (isEmpty) {
      this.empty.replaceChildren(
        el('div', { class: 'sel-empty-cart' }),
        el('p', { text: this.folder === lib.root ? 'No games yet.' : 'This folder is empty.' }),
        el('p', { class: 'dim', text: 'Press MENU and choose File › Add games… to load your .html games.' }),
      );
    }

    this.list.replaceChildren(...this.items.map((it, i) => {
      const meta = it.type === 'folder' ? countLabel(lib.countIn(it.id).games) : it.type === 'game' ? (it.lastPlayed ? fmtWhen(it.lastPlayed) : 'New') : '';
      const li = el('li', { class: `sel-item ${it.type}${i === this.index ? ' on' : ''}`, role: 'option', dataset: { i } },
        el('i', { class: 'ico ico-' + it.type }),
        el('span', { class: 'nm', text: it.name }),
        el('span', { class: 'meta', text: meta }));
      li.addEventListener('click', () => {
        if (this.index === i) this.activate();
        else { this.index = i; sfx('move'); this.refresh(); }
      });
      return li;
    }));
    this.refresh();
  }

  refresh() {
    [...this.list.children].forEach((li, i) => li.classList.toggle('on', i === this.index));
    const on = this.list.children[this.index];
    if (on) on.scrollIntoView({ block: 'nearest' });
    this.renderCard();
    const it = this.items[this.index];
    const hint = (k, t) => el('span', {}, el('b', { text: k }), ' ' + t);
    this.hints.replaceChildren(
      it ? hint('A', it.type === 'game' ? 'Play' : 'Open') : '',
      this.folder !== this.lib.root ? hint('B', 'Back') : '',
      hint('MENU', 'Library'),
    );
  }

  renderCard() {
    const it = this.items[this.index];
    if (!it) { this.card.replaceChildren(); return; }
    if (it.type !== 'game') {
      const n = it.type === 'folder' ? this.lib.countIn(it.id).games : 0;
      this.card.replaceChildren(el('div', { class: 'card-folder' + (it.type === 'up' ? ' up' : '') }),
        el('div', { class: 'card-title', text: it.type === 'up' ? 'Back' : it.name }),
        el('div', { class: 'card-line dim', text: it.type === 'up' ? 'Up one folder' : countLabel(n) }));
      return;
    }
    const label = el('div', { class: 'cart-label' });
    if (it.thumb) label.append(el('img', { src: this.native.thumbUrl(it.thumb) + '?v=' + (it.thumbAt || 0), alt: '' }));
    else label.append(el('div', { class: 'cart-art', text: (it.name.match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase(), style: { '--h': String(hue(it.name)) } }));
    label.append(el('div', { class: 'cart-name', text: it.name }));
    const play = el('button', { class: 'card-play', text: '▶ Play', onclick: () => this.activate() });
    this.card.replaceChildren(
      el('div', { class: 'cart' }, el('div', { class: 'cart-grip' }), label),
      el('div', { class: 'card-lines' },
        it.lastPlayed ? el('div', { class: 'card-line' }, el('span', { class: 'dim', text: 'Last played ' }), fmtWhen(it.lastPlayed)) : el('div', { class: 'card-line dim', text: 'Not played yet' }),
        it.playSeconds ? el('div', { class: 'card-line' }, el('span', { class: 'dim', text: 'Time played ' }), fmtDuration(it.playSeconds)) : null,
        el('div', { class: 'card-line dim', text: fmtBytes(it.size) + (it.builtin ? ' · built in' : '') })),
      play);
  }

  move(d) {
    if (!this.items.length) return;
    const n = Math.max(0, Math.min(this.items.length - 1, this.index + d));
    if (n !== this.index) { this.index = n; sfx('move'); this.refresh(); }
  }

  activate() {
    const it = this.items[this.index];
    if (!it) return;
    if (it.type === 'up') return this.back();
    if (it.type === 'folder') { sfx('open'); this.folder = it.id; this.index = 0; this.settings.set({ folder: it.id }); this.render(); return; }
    sfx('select');
    this.onLaunch(it.id);
  }

  back() {
    if (this.folder === this.lib.root) return false;
    const cur = this.lib.get(this.folder);
    const parent = cur ? cur.parent : this.lib.root;
    sfx('back');
    const from = this.folder;
    this.folder = parent || this.lib.root;
    this.settings.set({ folder: this.folder });
    this.index = 0;
    this.render();
    const back = this.items.findIndex((x) => x.id === from);
    if (back >= 0) { this.index = back; this.refresh(); }
    return true;
  }

  // console buttons and keyboard keys while the picker is showing
  input(btn) {
    switch (btn) {
      case 'up': this.move(-1); return true;
      case 'down': this.move(1); return true;
      case 'left': this.move(-5); return true;
      case 'right': this.move(5); return true;
      case 'a': case 'start': this.activate(); return true;
      case 'b': return this.back();
      case 'select': this.settings.set({ sort: this.settings.get('sort') === 'recent' ? 'name' : 'recent' }); this.render(); return true;
      default: return false;
    }
  }
}

function countLabel(n) { return n === 1 ? '1 game' : `${n} games`; }

function hue(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

// ----------------------------------------------------------------------------- loading card

export function showLoading(layer, title) {
  layer.replaceChildren(el('div', { class: 'loading' },
    el('div', { class: 'load-cart' }),
    el('div', { class: 'load-text' }, 'Loading ', el('b', { text: title })),
    el('div', { class: 'load-bar' }, el('i'))));
  layer.hidden = false;
}

export function hideLoading(layer) { layer.hidden = true; layer.replaceChildren(); }

// ----------------------------------------------------------------------------- in-game menu

export class GameMenu {
  constructor(layer) {
    this.layer = layer;
    this.items = [];
    this.index = 0;
    this.resolve = null;
  }
  get open() { return !this.layer.hidden; }

  show(title, items) {
    this.items = items;
    this.index = 0;
    const list = el('ul', { class: 'gm-list' }, ...items.map((it, i) => {
      const li = el('li', { class: 'gm-item' + (i === 0 ? ' on' : ''), text: it.label });
      li.addEventListener('click', () => { this.index = i; this.choose(); });
      return li;
    }));
    this.listEl = list;
    this.layer.replaceChildren(el('div', { class: 'gm' }, el('div', { class: 'gm-title', text: title }), list,
      el('div', { class: 'gm-hint' }, el('b', { text: 'A' }), ' choose  ', el('b', { text: 'B' }), ' back to game')));
    this.layer.hidden = false;
    sfx('open');
    return new Promise((r) => { this.resolve = r; });
  }

  refresh() { [...this.listEl.children].forEach((li, i) => li.classList.toggle('on', i === this.index)); }

  choose() {
    const it = this.items[this.index];
    sfx('select');
    this.close(it ? it.value : null);
  }

  close(v = null) {
    if (this.layer.hidden) return;
    this.layer.hidden = true;
    this.layer.replaceChildren();
    const r = this.resolve;
    this.resolve = null;
    if (r) r(v);
  }

  input(btn) {
    switch (btn) {
      case 'up': this.index = (this.index + this.items.length - 1) % this.items.length; sfx('move'); this.refresh(); return true;
      case 'down': this.index = (this.index + 1) % this.items.length; sfx('move'); this.refresh(); return true;
      case 'a': case 'start': this.choose(); return true;
      case 'b': case 'home': sfx('back'); this.close(null); return true;
      default: return true;
    }
  }
}

// ----------------------------------------------------------------------------- toast

let toastTimer = 0;
export function toast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('on'); setTimeout(() => { t.hidden = true; }, 300); }, ms);
}
