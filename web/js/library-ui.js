// The library: Mooncart's main menu, laid out like an ordinary file manager. A menu bar (File,
// Edit, Game, View, Help), a toolbar, folders down the side on wide screens, and the games in
// the current folder. Closing it goes back to the console.

import { el, fmtBytes, fmtDuration, fmtWhen, saveKeyFor } from './util.js';
import { MenuBar, showMenu, closeMenus } from './menu.js';
import { modal, prompt, confirm, alertBox, choose, pickFolder, row, select, checkbox, dialogOpen } from './dialogs.js';
import { settings, KEY_CHOICES, DEFAULT_KEYMAP } from './store.js';
import { native } from './native.js';
import { saves, savesSize } from './saves.js';
import { findExternal, packHtml, fetchGetter } from './pack.js';
import { THEMES, THEME_NAMES } from './themes.js';
import { SHAPES } from './layout.js';
import { toast } from './screen.js';

const ORIENTATIONS = [['landscape', 'Sideways (landscape)'], ['portrait', 'Upright (portrait)'], ['auto', 'Turn with the phone']];

export class LibraryView {
  constructor(root, { library, game, onClose, onPlay, version }) {
    this.root = root;
    this.lib = library;
    this.game = game;
    this.onClose = onClose;
    this.onPlay = onPlay;
    this.version = version;
    this.folder = library.root;
    this.sel = new Set();
    this.anchor = null;
    this.query = '';
    this.build();
    library.events.on('change', () => { if (this.isOpen) this.render(); });
  }

  get isOpen() { return !this.root.hidden; }

  open(folderId) {
    if (folderId && this.lib.exists(folderId)) this.folder = folderId;
    if (!this.lib.exists(this.folder)) this.folder = this.lib.root;
    this.root.hidden = false;
    document.body.classList.add('lib-open');
    this.render();
    setTimeout(() => this.listEl.focus({ preventScroll: true }), 30);
  }

  close() {
    closeMenus();
    this.root.hidden = true;
    document.body.classList.remove('lib-open');
    this.onClose(this.folder);
  }

  // ------------------------------------------------------------------ layout
  build() {
    const bar = el('div', { class: 'mb' });
    this.menubar = new MenuBar(bar, () => this.menus());
    const closeBtn = el('button', { class: 'lib-close', type: 'button', title: 'Back to the console (Esc)' }, el('i', { class: 'ico ico-console' }), el('span', { text: 'Console' }));
    closeBtn.addEventListener('click', () => this.close());

    const tool = (icon, label, fn, title) => {
      const b = el('button', { class: 'tb', type: 'button', title: title || label }, el('i', { class: 'ico ico-' + icon }), el('span', { text: label }));
      b.addEventListener('click', fn);
      return b;
    };
    this.tbPlay = tool('play', 'Play', () => this.playSelected());
    this.tbRename = tool('rename', 'Rename', () => this.renameSelected());
    this.tbMove = tool('move', 'Move', () => this.moveSelected());
    this.tbRemove = tool('trash', 'Remove', () => this.removeSelected());
    this.tbInfo = tool('info', 'Info', () => this.properties());
    this.search = el('input', { class: 'search', type: 'search', placeholder: 'Find a game', spellcheck: 'false' });
    this.search.addEventListener('input', () => { this.query = this.search.value.trim().toLowerCase(); this.render(); });
    const toolbar = el('div', { class: 'lib-tools' },
      tool('add', 'Add games', () => this.addGames()),
      tool('newfolder', 'New folder', () => this.newFolder()),
      el('span', { class: 'tb-gap' }),
      this.tbPlay, this.tbRename, this.tbMove, this.tbRemove, this.tbInfo,
      el('span', { class: 'tb-grow' }), this.search);

    this.tree = el('nav', { class: 'tree lib-tree', 'aria-label': 'Folders' });
    this.crumbs = el('div', { class: 'crumbs' });
    this.head = el('div', { class: 'lrow lhead' },
      el('span', { class: 'c-name', text: 'Name' }), el('span', { class: 'c-size', text: 'Size' }),
      el('span', { class: 'c-played', text: 'Last played' }), el('span', { class: 'c-time', text: 'Time played' }));
    this.listEl = el('div', { class: 'llist', tabindex: '0', role: 'listbox', 'aria-multiselectable': 'true' });
    this.status = el('div', { class: 'lib-status' });
    this.root.replaceChildren(
      el('div', { class: 'lib-bar' }, el('span', { class: 'lib-brand' }, el('i', { class: 'ico ico-moon' }), el('b', { text: 'Mooncart' })), bar, el('span', { class: 'tb-grow' }), closeBtn),
      toolbar,
      el('div', { class: 'lib-main' }, this.tree, el('section', { class: 'lib-content' }, this.crumbs, this.head, this.listEl)),
      this.status);

    this.listEl.addEventListener('keydown', (e) => this.onKey(e));
    this.listEl.addEventListener('click', (e) => { if (e.target === this.listEl) { this.sel.clear(); this.paintSel(); } });
    this.listEl.addEventListener('contextmenu', (e) => { if (e.target === this.listEl) { e.preventDefault(); this.contextMenu(e.clientX, e.clientY, null); } });
    this.root.addEventListener('keydown', (e) => this.onGlobalKey(e));
    // files dropped from the computer (desktop testing)
    this.root.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); this.root.classList.add('drop'); } });
    this.root.addEventListener('dragleave', (e) => { if (e.target === this.root) this.root.classList.remove('drop'); });
    this.root.addEventListener('drop', (e) => this.onDropFiles(e));
  }

  // ------------------------------------------------------------------ menus
  menus() {
    const one = this.single();
    const hasSel = this.sel.size > 0;
    const game = one && one.type === 'game' ? one : null;
    const sort = settings.get('sort');
    const view = settings.get('view');
    return [
      {
        label: 'File', items: [
          { label: 'Add games…', accel: 'Ctrl+O', action: () => this.addGames() },
          { label: 'Add a folder of games…', action: () => this.addFolder() },
          { label: 'New folder', accel: 'Ctrl+Shift+N', action: () => this.newFolder() },
          { sep: true },
          { label: 'Back up everything…', action: () => this.backup() },
          { label: 'Restore from a backup…', action: () => this.restore() },
          { label: 'Save a copy of Mooncart…', disabled: native.platform !== 'android', action: () => this.saveApk() },
          { sep: true },
          { label: 'Close menu', accel: 'Esc', action: () => this.close() },
          { label: 'Quit Mooncart', disabled: native.platform !== 'android', action: () => native.exit() },
        ],
      },
      {
        label: 'Edit', items: [
          { label: 'Rename…', accel: 'F2', disabled: !one, action: () => this.renameSelected() },
          { label: 'Move to…', disabled: !hasSel, action: () => this.moveSelected() },
          { label: 'Remove…', accel: 'Del', disabled: !hasSel, danger: true, action: () => this.removeSelected() },
          { sep: true },
          { label: 'Select all', accel: 'Ctrl+A', action: () => this.selectAll() },
          { label: 'Select none', disabled: !hasSel, action: () => { this.sel.clear(); this.paintSel(); } },
        ],
      },
      {
        label: 'Game', items: [
          { label: one && one.type === 'folder' ? 'Open folder' : 'Play', accel: 'Enter', disabled: !one, action: () => this.playSelected() },
          { label: 'Properties…', accel: 'Alt+Enter', disabled: !one, action: () => this.properties() },
          { sep: true },
          { label: 'Replace with a newer file…', disabled: !game, action: () => this.replaceFile(game) },
          { label: 'Make it work offline', disabled: !game || !game.src.startsWith('user:'), action: () => this.packGame(game, true) },
          { sep: true },
          { label: 'Export saves…', disabled: !game, action: () => this.exportSave(game) },
          { label: 'Import saves…', disabled: !game, action: () => this.importSave(game) },
          { label: 'Delete saved data…', disabled: !game, danger: true, action: () => this.deleteSaves(game) },
        ],
      },
      {
        label: 'View', items: [
          { label: 'List', checked: view !== 'grid', action: () => { settings.set({ view: 'list' }); this.render(); } },
          { label: 'Cartridges', checked: view === 'grid', action: () => { settings.set({ view: 'grid' }); this.render(); } },
          { sep: true },
          { label: 'Sort by name', checked: sort !== 'recent', action: () => { settings.set({ sort: 'name' }); this.render(); } },
          { label: 'Sort by last played', checked: sort === 'recent', action: () => { settings.set({ sort: 'recent' }); this.render(); } },
          { sep: true },
          { label: 'Console colour', submenu: () => THEME_NAMES.map((t) => ({ label: THEMES[t].title, checked: settings.get('theme') === t, action: () => settings.set({ theme: t }) })) },
          { label: 'Screen shape', submenu: () => Object.entries(SHAPES).map(([k, s]) => ({ label: s.label, checked: settings.get('shape') === k, action: () => settings.set({ shape: k }) })) },
          { label: 'Hold the phone', submenu: () => ORIENTATIONS.map(([k, label]) => ({ label, checked: settings.get('orientation') === k, action: () => settings.set({ orientation: k }) })) },
          { label: 'Show the console', checked: settings.get('frame'), action: () => settings.set({ frame: !settings.get('frame') }) },
          { sep: true },
          { label: 'Settings…', action: () => this.settingsDialog() },
        ],
      },
      {
        label: 'Help', items: [
          { label: 'How to use Mooncart', action: () => this.help() },
          { label: 'Buttons and keys', action: () => this.controlsHelp() },
          { label: 'Keeping your games for years', action: () => this.longevityHelp() },
          { sep: true },
          { label: 'About Mooncart', action: () => this.about() },
        ],
      },
    ];
  }

  contextMenu(x, y, item) {
    if (item && !this.sel.has(item.id)) { this.sel = new Set([item.id]); this.anchor = item.id; this.paintSel(); }
    const one = this.single();
    const items = !item ? [
      { label: 'Add games…', action: () => this.addGames() },
      { label: 'New folder', action: () => this.newFolder() },
      { label: 'Select all', action: () => this.selectAll() },
    ] : [
      { label: item.type === 'folder' ? 'Open' : 'Play', disabled: !one, action: () => this.playSelected() },
      { label: 'Rename…', disabled: !one, action: () => this.renameSelected() },
      { label: 'Move to…', action: () => this.moveSelected() },
      { sep: true },
      { label: 'Properties…', disabled: !one, action: () => this.properties() },
      { sep: true },
      { label: 'Remove…', danger: true, action: () => this.removeSelected() },
    ];
    showMenu(items, { x, y });
  }

  // ------------------------------------------------------------------ drawing
  visibleItems() {
    if (this.query) {
      return this.lib.games().filter((g) => (g.name + ' ' + (g.title || '') + ' ' + (g.file || '')).toLowerCase().includes(this.query))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return this.lib.children(this.folder, settings.get('sort'));
  }

  render() {
    if (!this.lib.exists(this.folder)) this.folder = this.lib.root;
    const items = this.visibleItems();
    for (const id of [...this.sel]) if (!items.some((i) => i.id === id)) this.sel.delete(id);
    this.renderCrumbs();
    this.renderTree();
    const grid = settings.get('view') === 'grid';
    this.listEl.classList.toggle('grid', grid);
    this.head.hidden = grid;
    this.listEl.replaceChildren(...items.map((it) => this.renderItem(it, grid)));
    if (!items.length) {
      this.listEl.append(el('div', { class: 'lempty' },
        el('p', { text: this.query ? 'No games match “' + this.query + '”.' : this.folder === this.lib.root ? 'Your library is empty.' : 'This folder is empty.' }),
        this.query ? null : el('button', { class: 'btn primary', type: 'button', text: 'Add games…', onclick: () => this.addGames() })));
    }
    const all = this.lib.games();
    const total = all.reduce((s, g) => s + (g.size || 0), 0);
    const here = this.lib.countIn(this.folder);
    this.status.textContent = this.query
      ? `${items.length} found · ${all.length} games in the library · ${fmtBytes(total)}`
      : `${items.length} item${items.length === 1 ? '' : 's'} here · ${here.games} game${here.games === 1 ? '' : 's'} in this folder · ${all.length} in the library · ${fmtBytes(total)}`;
    this.paintSel();
  }

  renderCrumbs() {
    this.crumbs.replaceChildren();
    if (this.query) { this.crumbs.append(el('span', { class: 'crumb on', text: 'Search results' })); return; }
    const path = this.lib.path(this.folder);
    path.forEach((f, i) => {
      if (i) this.crumbs.append(el('span', { class: 'crumb-sep', text: '›' }));
      const c = el('button', { class: 'crumb' + (i === path.length - 1 ? ' on' : ''), type: 'button', text: f.id === this.lib.root ? 'Library' : f.name });
      c.addEventListener('click', () => this.go(f.id));
      this.dropTarget(c, f.id);
      this.crumbs.append(c);
    });
    if (this.folder !== this.lib.root) {
      const up = el('button', { class: 'crumb-up', type: 'button', title: 'Up one folder (Backspace)' }, el('i', { class: 'ico ico-up' }));
      up.addEventListener('click', () => this.up());
      this.crumbs.prepend(up);
    }
  }

  renderTree() {
    this.tree.replaceChildren();
    const walk = (id, depth) => {
      const f = this.lib.get(id);
      const kids = this.lib.children(id).filter((c) => c.type === 'folder');
      const r = el('button', { type: 'button', class: 'tree-row' + (id === this.folder && !this.query ? ' on' : ''), style: { paddingLeft: 8 + depth * 14 + 'px' } },
        el('i', { class: 'ico ico-' + (id === this.lib.root ? 'home' : 'folder') }),
        el('span', { class: 'tree-name', text: id === this.lib.root ? 'Library' : f.name }),
        el('span', { class: 'tree-n', text: String(this.lib.countIn(id).games) }));
      r.addEventListener('click', () => this.go(id));
      this.dropTarget(r, id);
      this.tree.append(r);
      for (const k of kids) walk(k.id, depth + 1);
    };
    walk(this.lib.root, 0);
  }

  renderItem(it, grid) {
    const isGame = it.type === 'game';
    let node;
    if (grid) {
      const art = isGame && it.thumb ? el('img', { src: native.thumbUrl(it.thumb) + '?v=' + (it.thumbAt || 0), alt: '', loading: 'lazy' }) : el('div', { class: 'gart' + (isGame ? '' : ' folder'), text: isGame ? (it.name.match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase() : '' });
      node = el('div', { class: 'gitem ' + it.type, role: 'option', draggable: 'true', dataset: { id: it.id } },
        el('div', { class: 'gcart' }, art), el('div', { class: 'gname', text: it.name }),
        el('div', { class: 'gmeta', text: isGame ? fmtBytes(it.size) : this.lib.countIn(it.id).games + ' games' }));
    } else {
      node = el('div', { class: 'lrow ' + it.type, role: 'option', draggable: 'true', dataset: { id: it.id } },
        el('span', { class: 'c-name' }, el('i', { class: 'ico ico-' + (isGame ? 'cart' : 'folder') }), el('span', { class: 'nm', text: it.name }),
          isGame && it.builtin ? el('span', { class: 'tag', text: 'built in' }) : null,
          this.query && isGame ? el('span', { class: 'where', text: this.lib.path(it.parent).map((f) => (f.id === this.lib.root ? 'Library' : f.name)).join(' › ') }) : null),
        el('span', { class: 'c-size', text: isGame ? fmtBytes(it.size) : `${this.lib.countIn(it.id).games} games` }),
        el('span', { class: 'c-played', text: isGame ? fmtWhen(it.lastPlayed) || '—' : '' }),
        el('span', { class: 'c-time', text: isGame ? fmtDuration(it.playSeconds) || '—' : '' }));
    }
    this.wireItem(node, it);
    if (it.type === 'folder') this.dropTarget(node, it.id);
    return node;
  }

  wireItem(node, it) {
    let press = null;
    let longPressed = false;
    node.addEventListener('pointerdown', (e) => {
      longPressed = false;
      if (e.pointerType === 'mouse') return;
      press = { x: e.clientX, y: e.clientY, t: setTimeout(() => { press = null; longPressed = true; native.vibrate(15); this.contextMenu(e.clientX, e.clientY, it); }, 520) };
    });
    const cancel = () => { if (press) { clearTimeout(press.t); press = null; } };
    node.addEventListener('pointermove', (e) => { if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) cancel(); });
    node.addEventListener('pointercancel', cancel);
    node.addEventListener('click', (e) => {
      const touch = press !== null || (e.pointerType && e.pointerType !== 'mouse');
      cancel();
      if (longPressed) { longPressed = false; return; }
      if (touch && !e.ctrlKey && !e.shiftKey) { this.sel = new Set([it.id]); this.paintSel(); this.openItem(it); return; }
      this.clickSelect(it, e);
    });
    node.addEventListener('dblclick', () => this.openItem(it));
    node.addEventListener('contextmenu', (e) => { e.preventDefault(); cancel(); if (e.pointerType === 'mouse' || e.button === 2) this.contextMenu(e.clientX, e.clientY, it); });
    node.addEventListener('dragstart', (e) => {
      if (!this.sel.has(it.id)) { this.sel = new Set([it.id]); this.paintSel(); }
      e.dataTransfer.setData('application/x-mooncart', JSON.stringify([...this.sel]));
      e.dataTransfer.effectAllowed = 'move';
    });
  }

  dropTarget(node, folderId) {
    node.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('application/x-mooncart')) { e.preventDefault(); node.classList.add('dropon'); } });
    node.addEventListener('dragleave', () => node.classList.remove('dropon'));
    node.addEventListener('drop', (e) => {
      node.classList.remove('dropon');
      const raw = e.dataTransfer.getData('application/x-mooncart');
      if (!raw) return;
      e.preventDefault();
      e.stopPropagation();
      const ids = JSON.parse(raw).filter((id) => id !== folderId);
      const n = this.lib.move(ids, folderId);
      if (n) toast(`Moved ${n} item${n === 1 ? '' : 's'}`);
    });
  }

  clickSelect(it, e) {
    const ids = this.visibleItems().map((i) => i.id);
    if (e.shiftKey && this.anchor && ids.includes(this.anchor)) {
      const a = ids.indexOf(this.anchor), b = ids.indexOf(it.id);
      const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1);
      this.sel = new Set(e.ctrlKey || e.metaKey ? [...this.sel, ...range] : range);
    } else if (e.ctrlKey || e.metaKey) {
      if (this.sel.has(it.id)) this.sel.delete(it.id); else this.sel.add(it.id);
      this.anchor = it.id;
    } else {
      this.sel = new Set([it.id]);
      this.anchor = it.id;
    }
    this.paintSel();
  }

  paintSel() {
    for (const n of this.listEl.querySelectorAll('[data-id]')) n.classList.toggle('sel', this.sel.has(n.dataset.id));
    const one = this.single();
    const any = this.sel.size > 0;
    this.tbPlay.disabled = !one;
    this.tbPlay.querySelector('span').textContent = one && one.type === 'folder' ? 'Open' : 'Play';
    this.tbRename.disabled = !one;
    this.tbMove.disabled = !any;
    this.tbRemove.disabled = !any;
    this.tbInfo.disabled = !one;
  }

  single() {
    if (this.sel.size !== 1) return null;
    return this.lib.get([...this.sel][0]) || null;
  }

  selected() { return [...this.sel].map((id) => this.lib.get(id)).filter(Boolean); }

  selectAll() { this.sel = new Set(this.visibleItems().map((i) => i.id)); this.paintSel(); }

  go(folderId) {
    this.query = '';
    this.search.value = '';
    this.folder = folderId;
    this.sel.clear();
    settings.set({ folder: folderId });
    this.render();
  }

  up() {
    if (this.folder === this.lib.root) return;
    const from = this.folder;
    this.go(this.lib.get(this.folder).parent || this.lib.root);
    this.sel = new Set([from]);
    this.anchor = from;
    this.paintSel();
  }

  openItem(it) {
    if (it.type === 'folder') return this.go(it.id);
    this.onPlay(it.id);
  }

  // ------------------------------------------------------------------ keys
  onKey(e) {
    if (dialogOpen()) return;
    const items = this.visibleItems();
    const ids = items.map((i) => i.id);
    const cur = this.anchor && ids.includes(this.anchor) ? ids.indexOf(this.anchor) : -1;
    const grid = settings.get('view') === 'grid';
    const perRow = grid ? Math.max(1, Math.floor(this.listEl.clientWidth / 150)) : 1;
    const moveTo = (i) => {
      i = Math.max(0, Math.min(ids.length - 1, i));
      if (!ids.length) return;
      if (e.shiftKey && this.anchor) this.clickSelect(items[i], { shiftKey: true });
      else { this.sel = new Set([ids[i]]); this.anchor = ids[i]; this.paintSel(); }
      if (!e.shiftKey) this.anchor = ids[i];
      this.listEl.querySelector(`[data-id="${ids[i]}"]`)?.scrollIntoView({ block: 'nearest' });
    };
    const k = e.key;
    if (k === 'ArrowDown') { e.preventDefault(); moveTo(cur + perRow); }
    else if (k === 'ArrowUp') { e.preventDefault(); moveTo(cur < 0 ? 0 : cur - perRow); }
    else if (k === 'ArrowRight' && grid) { e.preventDefault(); moveTo(cur + 1); }
    else if (k === 'ArrowLeft' && grid) { e.preventDefault(); moveTo(cur - 1); }
    else if (k === 'Home') { e.preventDefault(); moveTo(0); }
    else if (k === 'End') { e.preventDefault(); moveTo(ids.length - 1); }
    else if (k === 'Enter' && e.altKey) { e.preventDefault(); this.properties(); }
    else if (k === 'Enter') { e.preventDefault(); this.playSelected(); }
    else if (k === 'Backspace') { e.preventDefault(); this.up(); }
    else if (k === 'F2') { e.preventDefault(); this.renameSelected(); }
    else if (k === 'Delete') { e.preventDefault(); this.removeSelected(); }
    else if ((k === 'a' || k === 'A') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.selectAll(); }
  }

  onGlobalKey(e) {
    if (dialogOpen()) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (e.key === 'o' || e.key === 'O')) { e.preventDefault(); this.addGames(); }
    else if (ctrl && e.shiftKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); this.newFolder(); }
    else if (ctrl && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); this.search.focus(); }
    else if (e.key === 'Escape' && !e.defaultPrevented) {
      e.preventDefault();
      if (document.activeElement === this.search && this.search.value) { this.search.value = ''; this.query = ''; this.render(); }
      else if (this.sel.size) { this.sel.clear(); this.paintSel(); }
      else this.close();
    }
  }

  // Android back button
  back() {
    if (this.query) { this.search.value = ''; this.query = ''; this.render(); return true; }
    if (this.folder !== this.lib.root) { this.up(); return true; }
    this.close();
    return true;
  }

  // ------------------------------------------------------------------ actions
  playSelected() {
    const one = this.single();
    if (one) this.openItem(one);
  }

  async addGames() {
    const picked = await native.pickFiles();
    await this.finishAdding(picked);
  }

  async addFolder() {
    const picked = await native.pickFolder();
    await this.finishAdding(picked);
  }

  async finishAdding(picked) {
    if (!picked || !picked.length) return;
    const added = await this.lib.addPicked(picked, this.folder);
    this.sel = new Set(added.filter((a) => a.parent === this.folder).map((a) => a.id));
    this.render();
    toast(`Added ${added.length} game${added.length === 1 ? '' : 's'}`);
    // games that load parts of themselves from the internet get those parts packed in now
    for (const g of added) await this.packGame(g, false);
  }

  async packGame(g, loud) {
    if (!g || !g.src.startsWith('user:')) return;
    if (g.size > 25 * 1048576) { if (loud) alertBox('Make it work offline', 'This game is big enough that it almost certainly has everything inside it already.'); return; }
    let html;
    try { html = await (await fetch(native.rawUrl(g.src))).text(); } catch { return; }
    const ext = findExternal(html).filter((x) => x.kind === 'script' || x.kind === 'style');
    if (!ext.length) { if (loud) alertBox('Make it work offline', `“${g.name}” already has everything inside it. It works without the internet.`); return; }
    if (!native.online()) {
      this.lib.setField(g.id, { needsNet: ext.map((x) => x.url) });
      alertBox('This game needs the internet once', `“${g.name}” loads ${ext.length} part${ext.length === 1 ? '' : 's'} from the internet (${hostList(ext)}).\n\nConnect to Wi-Fi once and choose Game › Make it work offline, and Mooncart will pack them into the game so it works in airplane mode for good.`);
      return;
    }
    const { html: out, report } = await packHtml(html, fetchGetter());
    if (report.inlined.length && await native.writeBlob(g.src.slice(5), out)) {
      this.lib.setField(g.id, { size: new Blob([out]).size, packed: report.inlined.length, needsNet: report.failed.length ? report.failed : undefined });
      toast(`“${g.name}” now works offline`);
    }
    if (report.failed.length) alertBox('Some parts could not be packed', `These parts of “${g.name}” could not be downloaded, so it may not work offline:\n\n${report.failed.join('\n')}`);
  }

  async newFolder() {
    const name = await prompt('New folder', { label: 'Folder name', value: 'New folder', ok: 'Create' });
    if (!name) return;
    const id = this.lib.newFolder(this.folder, name);
    this.sel = new Set([id]);
    this.anchor = id;
    this.render();
  }

  async renameSelected() {
    const it = this.single();
    if (!it) return;
    const name = await prompt(it.type === 'folder' ? 'Rename folder' : 'Rename game', { label: 'New name', value: it.name, ok: 'Rename' });
    if (name && name !== it.name) this.lib.rename(it.id, name);
  }

  async moveSelected() {
    const ids = [...this.sel];
    if (!ids.length) return;
    const folders = ids.filter((id) => this.lib.get(id)?.type === 'folder');
    const dest = await pickFolder(this.lib, { title: `Move ${ids.length === 1 ? '“' + this.lib.get(ids[0]).name + '”' : ids.length + ' items'} to`, exclude: folders, current: this.folder });
    if (!dest) return;
    const n = this.lib.move(ids, dest);
    toast(n ? `Moved ${n} item${n === 1 ? '' : 's'}` : 'Nothing to move');
  }

  async removeSelected() {
    const items = this.selected();
    if (!items.length) return;
    const games = new Set();
    for (const it of items) {
      if (it.type === 'game') games.add(it);
      else for (const g of this.lib.games()) if (this.lib.isInside(g.id, it.id)) games.add(g);
    }
    const builtins = [...games].filter((g) => g.builtin).length;
    const what = items.length === 1 ? `“${items[0].name}”` : `${items.length} items`;
    let msg = `Remove ${what}${items.some((i) => i.type === 'folder') ? ' and everything in it' : ''}?`;
    if (games.size) msg += `\n\n${games.size} game${games.size === 1 ? '' : 's'} will leave the library. Saved progress stays on the phone, so adding the same game again picks up where you left off.`;
    if (builtins) msg += `\n\nBuilt-in games can be brought back from View › Settings.`;
    if (!(await confirm('Remove', msg, { ok: 'Remove', danger: true }))) return;
    if (this.game.playing && games.has(this.game.playing)) await this.game.quit({ thumb: false });
    const n = await this.lib.remove(items.map((i) => i.id));
    this.sel.clear();
    toast(`Removed ${n} item${n === 1 ? '' : 's'}`);
  }

  async replaceFile(g) {
    if (!g) return;
    const ok = await confirm('Replace with a newer file', `Pick the new version of “${g.name}”. It keeps its name, folder, play time and saved progress.`, { ok: 'Choose file…' });
    if (!ok) return;
    const picked = await native.pickFiles();
    if (!picked || !picked.length) return;
    if (this.game.playing && this.game.playing.id === g.id) await this.game.quit({ thumb: false });
    for (const extra of picked.slice(1)) await native.deleteBlob(extra.blob);
    await this.lib.replaceFile(g.id, picked[0]);
    toast(`“${g.name}” updated`);
    await this.packGame(this.lib.get(g.id), false);
  }

  // ------------------------------------------------------------------ saves
  async exportSave(g) {
    try {
      const d = await saves.dump(g.saveKey);
      const n = Object.keys(d.local || {}).length;
      if (!n) return alertBox('Export saves', `“${g.name}” has no saved data yet.`);
      const file = { app: 'mooncart', kind: 'saves', saveKey: g.saveKey, game: g.name, exportedAt: new Date().toISOString(), local: d.local };
      const ok = await native.saveFile(`${g.saveKey}-saves.json`, 'application/json', JSON.stringify(file, null, 1));
      if (ok) toast('Saves exported');
    } catch (e) { alertBox('Export saves', 'Could not read the saves: ' + e.message); }
  }

  async importSave(g) {
    const picked = await pickJsonFile();
    if (!picked) return;
    let data;
    try { data = JSON.parse(picked); } catch { return alertBox('Import saves', 'That file is not a Mooncart saves file.'); }
    const local = data.local || (data.saves && data.saves[g.saveKey]);
    if (!local) return alertBox('Import saves', 'That file has no saves in it.');
    const ok = await confirm('Import saves', `Replace the saved progress of “${g.name}” with the one from ${data.game ? '“' + data.game + '”' : 'the file'}${data.exportedAt ? ' (' + new Date(data.exportedAt).toLocaleString() + ')' : ''}?`, { ok: 'Replace', danger: true });
    if (!ok) return;
    if (this.game.playing && this.game.playing.saveKey === g.saveKey) await this.game.quit({ thumb: false });
    await saves.restore(g.saveKey, local, true);
    toast('Saves imported');
  }

  async deleteSaves(g) {
    const sharing = this.lib.games().filter((x) => x.saveKey === g.saveKey && x.id !== g.id);
    let msg = `Delete all saved progress for “${g.name}”? This can't be undone.`;
    if (sharing.length) msg += `\n\nThese games share the same saves and will lose them too: ${sharing.map((s) => s.name).join(', ')}.`;
    if (!(await confirm('Delete saved data', msg, { ok: 'Delete', danger: true }))) return;
    if (this.game.playing && this.game.playing.saveKey === g.saveKey) await this.game.quit({ thumb: false });
    try { await saves.clear(g.saveKey); toast('Saved data deleted'); } catch (e) { alertBox('Delete saved data', 'Could not delete: ' + e.message); }
  }

  // ------------------------------------------------------------------ backup
  async backup() {
    toast('Gathering saves…', 8000);
    const keys = this.lib.games().map((g) => g.saveKey);
    const allSaves = await saves.dumpAll(keys);
    const payload = { app: 'mooncart', kind: 'backup', version: this.version, exportedAt: new Date().toISOString(), library: this.lib.snapshot(), settings: settings.data, saves: allSaves };
    const ok = await native.exportBackup(JSON.stringify(payload));
    toast(ok ? 'Backup saved' : 'Backup cancelled');
  }

  async restore() {
    const data = await native.importBackup();
    if (!data) return;
    if (data.app !== 'mooncart' || data.kind !== 'backup') return alertBox('Restore', 'That file is not a Mooncart backup.');
    const games = Object.values(data.library?.items || {}).filter((i) => i.type === 'game').length;
    const nSaves = Object.keys(data.saves || {}).length;
    const ok = await confirm('Restore from a backup', `This backup is from ${new Date(data.exportedAt).toLocaleString()}: ${games} games and saved progress for ${nSaves}.\n\nGames and folders from the backup are added back, and the saves in it replace the ones on this phone.`, { ok: 'Restore' });
    if (!ok) return;
    if (this.game.playing) await this.game.quit({ thumb: false });
    const merged = { ...data.library, items: { ...this.lib.items, ...data.library.items } };
    await this.lib.restoreSnapshot(merged);
    let restored = 0;
    for (const [key, local] of Object.entries(data.saves || {})) {
      try { await saves.restore(key, local, true); restored++; } catch (e) { console.warn(e); }
    }
    if (data.settings) settings.set({ theme: data.settings.theme, name: data.settings.name, keymap: data.settings.keymap || settings.get('keymap') });
    this.render();
    alertBox('Restored', `The library is back, with saved progress for ${restored} game${restored === 1 ? '' : 's'}.`);
  }

  async saveApk() {
    const ok = await native.saveApk();
    if (ok) toast('Mooncart installer saved');
  }

  // ------------------------------------------------------------------ properties
  async properties() {
    const it = this.single();
    if (!it) return;
    if (it.type === 'folder') return this.folderProps(it);
    const g = it;
    const opts = g.opts || {};
    const nameIn = el('input', { class: 'field', type: 'text', value: g.name });
    const shapeSel = select([['', 'Same as the console'], ...Object.entries(SHAPES).map(([k, s]) => [k, s.label])], opts.shape || '');
    const orientSel = select([['', 'Same as the console'], ...ORIENTATIONS], opts.orientation || '');
    const queryIn = el('input', { class: 'field', type: 'text', value: opts.query || '', placeholder: 'e.g. ?debug', spellcheck: 'false' });
    const keyRows = {};
    const keymap = { ...DEFAULT_KEYMAP, ...settings.get('keymap'), ...(opts.keymap || {}) };
    const keysBox = el('div', { class: 'keys' });
    for (const b of ['a', 'b', 'start', 'select']) {
      keyRows[b] = select(KEY_CHOICES, keymap[b]);
      keysBox.append(el('label', { class: 'keyrow' }, el('b', { text: b.toUpperCase() }), keyRows[b]));
    }
    const savesLine = el('span', { class: 'dim', text: 'checking…' });
    saves.dump(g.saveKey).then((d) => {
      const n = Object.keys(d.local || {}).length;
      savesLine.textContent = n ? `${fmtBytes(savesSize(d.local))} in ${n} entr${n === 1 ? 'y' : 'ies'}` : 'nothing saved yet';
    }).catch(() => { savesLine.textContent = 'could not read'; });
    const sharing = this.lib.games().filter((x) => x.saveKey === g.saveKey && x.id !== g.id);
    const info = el('dl', { class: 'facts' },
      ...fact('Title in the file', g.title || '—'),
      ...fact('File', g.file || '—'),
      ...fact('Size', fmtBytes(g.size)),
      ...fact('Kind', g.builtin ? 'Built into this copy of Mooncart' : 'Added by you'),
      ...(g.from ? fact('Comes from', g.from) : []),
      ...fact('Added', g.added ? new Date(g.added).toLocaleString() : '—'),
      ...fact('Last played', g.lastPlayed ? fmtWhen(g.lastPlayed) : 'never'),
      ...fact('Played', `${g.plays || 0} time${g.plays === 1 ? '' : 's'}, ${fmtDuration(g.playSeconds) || '0s'} in all`),
      ...fact('Save slot', g.saveKey + (sharing.length ? ` (shared with ${sharing.map((s) => s.name).join(', ')})` : '')),
      el('dt', { text: 'Saved data' }), el('dd', {}, savesLine),
      ...(g.needsNet ? fact('Needs the internet for', g.needsNet.join(', ')) : []),
      ...(g.packed ? fact('Packed for offline', `${g.packed} part${g.packed === 1 ? '' : 's'}`) : []));
    const body = el('div', { class: 'form props' },
      row('Name', nameIn),
      info,
      el('h4', { text: 'How it plays' }),
      row('Screen shape', shapeSel),
      row('Hold the phone', orientSel),
      row('Buttons', keysBox, 'Which key each console button presses in this game. The d-pad is always the arrow keys.'),
      row('Start-up options', queryIn, 'Added to the game’s address when it starts. Leave empty unless the game asks for it.'),
      el('div', { class: 'prop-actions' },
        el('button', { class: 'btn', type: 'button', text: 'Export saves…', onclick: () => this.exportSave(g) }),
        el('button', { class: 'btn', type: 'button', text: 'Import saves…', onclick: () => this.importSave(g) }),
        el('button', { class: 'btn danger', type: 'button', text: 'Delete saved data…', onclick: () => this.deleteSaves(g) })));
    const ok = await modal({ title: 'Properties', body, className: 'wide', buttons: [{ label: 'Cancel', value: false }, { label: 'Save', value: true, primary: true }] });
    if (!ok) return;
    if (nameIn.value.trim() && nameIn.value.trim() !== g.name) this.lib.rename(g.id, nameIn.value.trim());
    const km = {};
    const base = { ...DEFAULT_KEYMAP, ...settings.get('keymap') };
    for (const b of Object.keys(keyRows)) if (keyRows[b].value !== base[b]) km[b] = keyRows[b].value;
    this.lib.setOpts(g.id, { shape: shapeSel.value || null, orientation: orientSel.value || null, query: queryIn.value.trim() || null, keymap: Object.keys(km).length ? km : null });
    if (this.game.playing && this.game.playing.id === g.id) toast('Changes apply the next time it starts');
  }

  async folderProps(f) {
    const c = this.lib.countIn(f.id);
    const nameIn = el('input', { class: 'field', type: 'text', value: f.name });
    const body = el('div', { class: 'form props' }, row('Name', nameIn),
      el('dl', { class: 'facts' }, ...fact('Games inside', String(c.games)), ...fact('Size', fmtBytes(c.size)), ...fact('Created', f.created ? new Date(f.created).toLocaleString() : '—')));
    const ok = await modal({ title: 'Folder properties', body, buttons: [{ label: 'Cancel', value: false }, { label: 'Save', value: true, primary: true }] });
    if (ok && nameIn.value.trim() && nameIn.value.trim() !== f.name) this.lib.rename(f.id, nameIn.value.trim());
  }

  // ------------------------------------------------------------------ settings
  async settingsDialog() {
    const s = settings.data;
    const nameIn = el('input', { class: 'field', type: 'text', value: s.name, maxlength: '12', spellcheck: 'false' });
    const themeSel = select(THEME_NAMES.map((t) => [t, THEMES[t].title]), s.theme);
    const shapeSel = select(Object.entries(SHAPES).map(([k, v]) => [k, v.label]), s.shape);
    const orientSel = select(ORIENTATIONS, s.orientation);
    const frame = checkbox('Show the console around the game', s.frame);
    const boot = checkbox('Play the start-up intro', s.boot);
    const sounds = checkbox('Menu sounds', s.sounds);
    const haptics = checkbox('Buzz when a button is pressed', s.haptics);
    const keyRows = {};
    const keysBox = el('div', { class: 'keys' });
    for (const b of ['a', 'b', 'start', 'select']) {
      keyRows[b] = select(KEY_CHOICES, s.keymap[b]);
      keysBox.append(el('label', { class: 'keyrow' }, el('b', { text: b.toUpperCase() }), keyRows[b]));
    }
    const removed = this.lib.builtinRemoved.length;
    const restoreBtn = el('button', { class: 'btn', type: 'button', text: removed ? `Bring back ${removed} built-in game${removed === 1 ? '' : 's'}` : 'All built-in games are in the library', disabled: removed ? null : true });
    restoreBtn.addEventListener('click', async () => {
      const n = await this.lib.restoreBuiltins();
      restoreBtn.textContent = `Brought back ${n} game${n === 1 ? '' : 's'}`;
      restoreBtn.disabled = true;
    });
    const body = el('div', { class: 'form props' },
      el('h4', { text: 'Console' }),
      row('Name on the console', nameIn),
      row('Colour', themeSel),
      row('Screen shape', shapeSel),
      row('Hold the phone', orientSel),
      el('div', { class: 'checks' }, frame.el, boot.el, sounds.el, haptics.el),
      el('h4', { text: 'Buttons' }),
      row('Keys', keysBox, 'Which key each console button presses. Each game can change these in its Properties.'),
      el('h4', { text: 'Library' }),
      el('div', { class: 'prop-actions' }, restoreBtn,
        el('button', { class: 'btn', type: 'button', text: 'Back up everything…', onclick: () => this.backup() })));
    const ok = await modal({ title: 'Settings', body, className: 'wide', buttons: [{ label: 'Cancel', value: false }, { label: 'Save', value: true, primary: true }] });
    if (!ok) return;
    const km = { ...s.keymap };
    for (const b of Object.keys(keyRows)) km[b] = keyRows[b].value;
    settings.set({
      name: (nameIn.value.trim() || 'MOONCART').toUpperCase().slice(0, 12), theme: themeSel.value, shape: shapeSel.value, orientation: orientSel.value,
      frame: frame.input.checked, boot: boot.input.checked, sounds: sounds.input.checked, haptics: haptics.input.checked, keymap: km,
    });
  }

  // ------------------------------------------------------------------ help
  help() {
    return alertBox('How to use Mooncart',
      'Pick a game on the console with the d-pad and press A, or tap it twice.\n\n' +
      'MENU (or the phone’s Back button on the game list) opens this library. Here you can add games, make folders, rename, move and remove things, the way you would on a computer. Close it to go back to the console.\n\n' +
      'While a game is running, HOME or the phone’s Back button opens the game menu: keep playing, restart, hide the console so the game fills the screen, or quit to the game list.\n\n' +
      'Games are single .html files. Add them with File › Add games… from the phone’s Downloads, a memory card or a USB stick.');
  }

  controlsHelp() {
    const k = settings.get('keymap');
    const name = (code) => (KEY_CHOICES.find(([c]) => c === code) || [code, code])[1];
    return alertBox('Buttons and keys',
      `D-pad: the arrow keys.\nA: ${name(k.a)}.  B: ${name(k.b)}.\nSTART: ${name(k.start)}.  SELECT: ${name(k.select)}.\n\n` +
      'HOME opens the game menu; MENU opens the library.\n\n' +
      'You can tap the game screen too: games made for phones work by touch as usual.\n\n' +
      'A controller connected by Bluetooth or USB works like the console buttons.\n\n' +
      'With a keyboard: F1 library, F4 game menu, F5 restart, F11 hide the console.');
  }

  longevityHelp() {
    return alertBox('Keeping your games for years',
      'Mooncart never uses the internet. Everything it needs is inside the app, and your games and saves stay on the phone, so airplane mode is fine forever.\n\n' +
      '1. Keep a copy of the installer: File › Save a copy of Mooncart… writes it to a memory card or to Downloads. That file can reinstall Mooncart on this phone or another Android phone, with no internet.\n\n' +
      '2. Back up now and then: File › Back up everything… makes one file with your added games, folders and saved progress. Keep it on a memory card or a computer too.\n\n' +
      '3. Turn off automatic updates for the phone and its apps if you want everything to stay exactly as it is.\n\n' +
      '4. On a new phone: install Mooncart from the saved installer, then File › Restore from a backup….');
  }

  about() {
    return native.info().then((i) => alertBox('About Mooncart',
      `Mooncart ${this.version}\nA retro console for single-file HTML games.\n\n` +
      `Running on: ${i.platform === 'android' ? `Android ${i.android || ''}${i.model ? ' (' + i.model + ')' : ''}` : 'a desktop browser (test mode)'}\n` +
      (i.webview ? `Web engine: ${i.webview}\n` : '') +
      `\nFonts: Pixelify Sans and Jacquard 12, under the SIL Open Font License.`));
  }
}

function fact(k, v) { return [el('dt', { text: k }), el('dd', { text: v })]; }

function hostList(ext) {
  return [...new Set(ext.map((x) => { try { return new URL(x.url).host; } catch { return x.url; } }))].join(', ');
}

// Ask for a .json file (saves) using the page's own file picker; works on Android too.
function pickJsonFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return resolve(null);
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsText(f);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export { saveKeyFor };
