// Drop-down menus: the File / Edit / Game / View / Help bar of the library, and the menu that
// opens on a right-click or a long press.

import { el } from './util.js';

let root = null; // the open top-level menu

export function closeMenus() {
  if (root) root.close();
}

// items: [{ label, accel, action, disabled, checked, danger, submenu: items | () => items, sep }]
export function showMenu(items, opts = {}) {
  if (!opts.parent) closeMenus();
  return new Menu(items, opts);
}

class Menu {
  constructor(items, { x = 0, y = 0, anchor = null, altX = null, onClose = null, parent = null, onArrow = null } = {}) {
    this.parent = parent;
    this.onClose = onClose;
    this.onArrow = onArrow;
    this.child = null;
    this.index = -1;
    this.buttons = [];
    this.box = el('div', { class: 'dropdown', role: 'menu' });
    const list = typeof items === 'function' ? items() : items;
    for (const it of list) {
      if (!it) continue;
      if (it.sep) { this.box.append(el('div', { class: 'mi-sep' })); continue; }
      const btn = el('button', { class: 'mi' + (it.disabled ? ' off' : '') + (it.danger ? ' danger' : ''), role: 'menuitem', type: 'button' },
        el('span', { class: 'mi-check', text: it.checked ? '✓' : '' }),
        el('span', { class: 'mi-label', text: it.label }),
        el('span', { class: 'mi-accel', text: it.submenu ? '▸' : it.accel || '' }));
      const entry = { btn, it };
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.activate(entry); });
      btn.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        this.focusAt(this.buttons.indexOf(entry));
        if (it.submenu && !it.disabled) this.activate(entry);
        else this.closeChild();
      });
      this.buttons.push(entry);
      this.box.append(btn);
    }
    document.body.append(this.box);
    this.place(x, y, anchor, altX);
    if (!parent) {
      root = this;
      this.outside = (e) => {
        for (let n = e.target; n; n = n.parentNode) if (n.classList && n.classList.contains('dropdown')) return;
        if (anchor && anchor.contains(e.target)) return;
        this.close();
      };
      this.keys = (e) => this.deepest().key(e);
      setTimeout(() => {
        if (root !== this) return;
        addEventListener('pointerdown', this.outside, true);
        addEventListener('keydown', this.keys, true);
      }, 0);
    }
  }

  place(x, y, anchor, altX) {
    const vw = innerWidth, vh = innerHeight;
    const r = this.box.getBoundingClientRect();
    let left = x, top = y;
    if (anchor) { const a = anchor.getBoundingClientRect(); left = a.left; top = a.bottom; }
    if (left + r.width > vw - 4) left = altX != null ? altX - r.width + 2 : vw - r.width - 4;
    if (top + r.height > vh - 4) top = vh - r.height - 4;
    this.box.style.left = Math.max(4, left) + 'px';
    this.box.style.top = Math.max(4, top) + 'px';
    this.box.style.maxHeight = (vh - 8) + 'px';
  }

  deepest() { let m = this; while (m.child) m = m.child; return m; }

  focusAt(i) {
    this.index = i;
    this.buttons.forEach((b, j) => b.btn.classList.toggle('hot', j === i));
    if (this.buttons[i]) this.buttons[i].btn.focus({ preventScroll: true });
  }

  focusFirst() { this.focusAt(this.buttons.findIndex((b) => !b.it.disabled)); }

  closeChild() { if (this.child) { this.child.close(false); this.child = null; } }

  activate(entry) {
    const { it, btn } = entry;
    if (it.disabled) return;
    if (it.submenu) {
      this.closeChild();
      const r = btn.getBoundingClientRect();
      this.child = new Menu(it.submenu, { x: r.right - 2, y: r.top - 4, altX: r.left, parent: this });
      return;
    }
    this.close(true);
    if (it.action) setTimeout(() => it.action(), 0);
  }

  // close(true) closes the whole chain; close(false) only this menu and its children
  close(all = true) {
    this.closeChild();
    this.box.remove();
    if (this.parent) {
      if (this.parent.child === this) this.parent.child = null;
      if (all) this.parent.close(true);
      return;
    }
    removeEventListener('pointerdown', this.outside, true);
    removeEventListener('keydown', this.keys, true);
    if (root === this) root = null;
    if (this.onClose) this.onClose();
  }

  key(e) {
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    const n = this.buttons.length;
    switch (e.key) {
      case 'Escape': stop(); if (this.parent) this.close(false); else this.close(); break;
      case 'ArrowDown': case 'ArrowUp': {
        stop();
        if (!n) break;
        let i = this.index;
        for (let k = 0; k < n; k++) { i = (i + (e.key === 'ArrowDown' ? 1 : n - 1) + n) % n; if (!this.buttons[i].it.disabled) break; }
        this.focusAt(i);
        break;
      }
      case 'Enter': case ' ': stop(); if (this.buttons[this.index]) this.activate(this.buttons[this.index]); break;
      case 'ArrowRight': {
        stop();
        const cur = this.buttons[this.index];
        if (cur && cur.it.submenu) { this.activate(cur); this.child && this.child.focusFirst(); } else this.rootMenu().onArrow?.(1);
        break;
      }
      case 'ArrowLeft': stop(); if (this.parent) this.close(false); else this.onArrow?.(-1); break;
      default: break;
    }
  }

  rootMenu() { let m = this; while (m.parent) m = m.parent; return m; }
}

export class MenuBar {
  constructor(container, menus) {
    this.container = container;
    this.menus = menus; // () => [{ label, items }]
    this.current = -1;
    this.render();
  }

  render() {
    this.container.replaceChildren();
    this.buttons = this.menus().map((m, i) => {
      const b = el('button', { class: 'mb-item', type: 'button', text: m.label });
      b.addEventListener('click', () => (this.current === i ? this.close() : this.open(i)));
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && this.current >= 0 && this.current !== i) this.open(i); });
      this.container.append(b);
      return b;
    });
  }

  open(i, focusFirst = false) {
    const menus = this.menus();
    const n = menus.length;
    i = ((i % n) + n) % n;
    this.current = i;
    this.buttons.forEach((b, j) => b.classList.toggle('on', j === i));
    const m = showMenu(menus[i].items, {
      anchor: this.buttons[i],
      onArrow: (d) => this.open(i + d, true),
      onClose: () => {
        if (this.current === i) { this.current = -1; this.buttons.forEach((b) => b.classList.remove('on')); }
      },
    });
    if (focusFirst) m.focusFirst();
    return m;
  }

  close() { closeMenus(); this.current = -1; }
}
