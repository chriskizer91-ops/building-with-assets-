// Settings and the game library.
//
// The library is a small "file system" kept in library.json: folders and games, each with a
// parent folder. Games are either built in (shipped inside the app, read-only) or added by the
// player (copied into the app's own storage). Moving and renaming only edit library.json, so
// they can't lose a file.

import { native, readTitle } from './native.js';
import { Emitter, debounce, uid, saveKeyFor, cleanName } from './util.js';

export const DEFAULT_KEYMAP = {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  a: 'Enter', b: 'Escape', start: 'KeyM', select: 'KeyH',
};

// Keys a console button can stand for (Properties > Buttons).
export const KEY_CHOICES = [
  ['ArrowUp', 'Up arrow'], ['ArrowDown', 'Down arrow'], ['ArrowLeft', 'Left arrow'], ['ArrowRight', 'Right arrow'],
  ['Enter', 'Enter'], ['Space', 'Space'], ['Escape', 'Escape'], ['Backspace', 'Backspace'], ['Tab', 'Tab'], ['ShiftLeft', 'Shift'],
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => ['Key' + c, c]),
  ...'0123456789'.split('').map((c) => ['Digit' + c, c]),
  ['', '(nothing)'],
];

export const DEFAULT_SETTINGS = {
  theme: 'moonlight',
  name: 'MOONCART',
  frame: true,
  shape: 'fill',
  orientation: 'landscape',
  boot: true,
  sounds: true,
  haptics: true,
  keymap: DEFAULT_KEYMAP,
  sort: 'name',
  view: 'list',
  folder: null,
};

export const settings = {
  data: { ...DEFAULT_SETTINGS },
  events: new Emitter(),
  async load() {
    const raw = await native.readText('settings.json');
    let saved = {};
    try { saved = raw ? JSON.parse(raw) : {}; } catch { saved = {}; }
    this.data = { ...DEFAULT_SETTINGS, ...saved, keymap: { ...DEFAULT_KEYMAP, ...(saved.keymap || {}) } };
    return this.data;
  },
  get(k) { return this.data[k]; },
  set(patch) {
    Object.assign(this.data, patch);
    this.persist();
    this.events.emit('change', patch);
  },
  persist: debounce(function () { native.writeText('settings.json', JSON.stringify(settings.data, null, 1)); }, 300),
};

const ROOT = 'root';

export class Library {
  constructor() {
    this.events = new Emitter();
    this.items = {};
    this.builtinRemoved = [];
    this.builtinFolders = {};
    this.collectionVersion = '';
    this.save = debounce(() => this.write(), 250);
  }

  async load() {
    const raw = await native.readText('library.json');
    let d = null;
    try { d = raw ? JSON.parse(raw) : null; } catch { d = null; }
    if (d && d.items) {
      this.items = d.items;
      this.builtinRemoved = d.builtinRemoved || [];
      this.builtinFolders = d.builtinFolders || {};
      this.collectionVersion = d.collectionVersion || '';
    }
    this.items[ROOT] = { type: 'folder', name: 'Library', ...(this.items[ROOT] || {}), id: ROOT, parent: null };
    await this.mergeCollection();
    this.repair();
    this.write();
    return this;
  }

  write() {
    native.writeText('library.json', JSON.stringify({
      version: 1, items: this.items, builtinRemoved: this.builtinRemoved, builtinFolders: this.builtinFolders,
      collectionVersion: this.collectionVersion,
    }));
  }

  changed() { this.save(); this.events.emit('change'); }

  // Built-in games come from collection.json inside the app. New ones are added, updated ones
  // keep their place, name, plays and saves; ones the player removed stay removed.
  async mergeCollection() {
    const col = await native.collection();
    const games = (col && col.games) || [];
    this.collectionVersion = col.version || '';
    const byKey = {};
    for (const it of Object.values(this.items)) if (it.builtin) byKey[it.builtin] = it;
    const present = new Set();
    for (const g of games) {
      present.add(g.key);
      const have = byKey[g.key];
      if (have) {
        Object.assign(have, { src: 'builtin:' + g.src, size: g.size, title: g.title || have.title, file: g.file, hash: g.hash, from: g.from });
        continue;
      }
      if (this.builtinRemoved.includes(g.key)) continue;
      const parent = this.folderForBuiltin(g.folder || '');
      const id = uid();
      this.items[id] = {
        id, type: 'game', parent, name: g.name || g.title || g.file, title: g.title || '', file: g.file,
        src: 'builtin:' + g.src, builtin: g.key, size: g.size, hash: g.hash, from: g.from,
        saveKey: g.saveKey || saveKeyFor(g.title, g.file), added: Date.now(), order: g.order ?? 0,
      };
      if (g.opts) this.items[id].opts = { ...g.opts };
    }
    // a built-in game whose file is no longer in the app can't be played: drop it
    for (const it of Object.values(this.items)) {
      if (it.builtin && !present.has(it.builtin)) delete this.items[it.id];
    }
  }

  folderForBuiltin(path) {
    if (!path) return ROOT;
    let parent = ROOT;
    let sofar = '';
    for (const part of path.split('/').filter(Boolean)) {
      sofar = sofar ? sofar + '/' + part : part;
      const known = this.builtinFolders[sofar];
      if (known && this.items[known] && this.items[known].type === 'folder') { parent = known; continue; }
      const id = uid();
      this.items[id] = { id, type: 'folder', name: part, parent, created: Date.now() };
      this.builtinFolders[sofar] = id;
      parent = id;
    }
    return parent;
  }

  // anything whose folder went missing comes back to the top
  repair() {
    for (const it of Object.values(this.items)) {
      if (it.id === ROOT) continue;
      if (!it.parent || !this.items[it.parent] || this.items[it.parent].type !== 'folder') it.parent = ROOT;
      let p = it.parent, hops = 0;
      while (p && p !== ROOT && hops++ < 64) p = this.items[p]?.parent;
      if (p !== ROOT) it.parent = ROOT;
    }
  }

  get root() { return ROOT; }
  get(id) { return this.items[id]; }
  exists(id) { return !!this.items[id]; }

  children(folderId, sort = 'name') {
    const kids = Object.values(this.items).filter((it) => it.parent === folderId && it.id !== ROOT);
    const name = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    return kids.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      if (sort === 'recent' && a.type === 'game') return (b.lastPlayed || 0) - (a.lastPlayed || 0) || name(a, b);
      return name(a, b);
    });
  }

  path(id) {
    const out = [];
    let cur = this.items[id];
    while (cur) { out.unshift(cur); cur = cur.parent ? this.items[cur.parent] : null; }
    return out;
  }

  games() { return Object.values(this.items).filter((it) => it.type === 'game'); }
  folders() { return Object.values(this.items).filter((it) => it.type === 'folder'); }

  countIn(folderId) {
    let n = 0, size = 0;
    const walk = (id) => {
      for (const it of Object.values(this.items)) {
        if (it.parent !== id) continue;
        if (it.type === 'game') { n++; size += it.size || 0; } else walk(it.id);
      }
    };
    walk(folderId);
    return { games: n, size };
  }

  isInside(id, folderId) {
    let cur = this.items[id];
    let hops = 0;
    while (cur && hops++ < 64) { if (cur.id === folderId) return true; cur = this.items[cur.parent]; }
    return false;
  }

  uniqueName(parent, name, exceptId) {
    const taken = new Set(this.children(parent).filter((c) => c.id !== exceptId).map((c) => c.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;
    for (let i = 2; i < 999; i++) { const n = `${name} (${i})`; if (!taken.has(n.toLowerCase())) return n; }
    return name + ' ' + uid().slice(0, 4);
  }

  newFolder(parent, name = 'New folder') {
    const id = uid();
    this.items[id] = { id, type: 'folder', name: this.uniqueName(parent, cleanName(name) || 'New folder'), parent, created: Date.now() };
    this.changed();
    return id;
  }

  rename(id, name) {
    const it = this.items[id];
    const clean = cleanName(name);
    if (!it || id === ROOT || !clean) return false;
    it.name = this.uniqueName(it.parent, clean, id);
    this.changed();
    return true;
  }

  move(ids, folderId) {
    const dest = this.items[folderId];
    if (!dest || dest.type !== 'folder') return 0;
    let n = 0;
    for (const id of ids) {
      const it = this.items[id];
      if (!it || id === ROOT || it.parent === folderId) continue;
      if (it.type === 'folder' && this.isInside(folderId, id)) continue; // not into itself
      it.parent = folderId;
      it.name = this.uniqueName(folderId, it.name, id);
      n++;
    }
    if (n) this.changed();
    return n;
  }

  // Removes games and folders (with everything in them). Files the player added are deleted;
  // built-in games are only hidden and can be brought back from Settings.
  async remove(ids) {
    const all = new Set();
    const collect = (id) => {
      all.add(id);
      for (const it of Object.values(this.items)) if (it.parent === id) collect(it.id);
    };
    for (const id of ids) if (this.items[id] && id !== ROOT) collect(id);
    for (const id of all) {
      const it = this.items[id];
      if (!it) continue;
      if (it.type === 'game') {
        if (it.builtin) { if (!this.builtinRemoved.includes(it.builtin)) this.builtinRemoved.push(it.builtin); }
        else if (it.src?.startsWith('user:')) await native.deleteBlob(it.src.slice(5));
      }
      delete this.items[id];
    }
    for (const [path, fid] of Object.entries(this.builtinFolders)) if (!this.items[fid]) delete this.builtinFolders[path];
    this.changed();
    return all.size;
  }

  async restoreBuiltins() {
    const before = this.games().length;
    this.builtinRemoved = [];
    await this.mergeCollection();
    this.repair();
    this.changed();
    return this.games().length - before;
  }

  // Files the native side has already copied into storage: [{blob, name, size, title, dir}]
  async addPicked(picked, folderId) {
    const added = [];
    const dirFolders = {};
    for (const p of picked || []) {
      if (!p || !p.blob) continue;
      let parent = folderId;
      const dirPath = [p.root, p.dir].filter(Boolean).join('/');
      if (dirPath) {
        let cur = folderId, sofar = '';
        for (const part of dirPath.split('/').filter(Boolean)) {
          sofar += '/' + part;
          if (!dirFolders[sofar]) {
            const existing = this.children(cur).find((c) => c.type === 'folder' && c.name.toLowerCase() === part.toLowerCase());
            dirFolders[sofar] = existing ? existing.id : this.newFolder(cur, part);
          }
          cur = dirFolders[sofar];
        }
        parent = cur;
      }
      const src = 'user:' + p.blob;
      const title = p.title || (await readTitle(src)) || '';
      const id = uid();
      const display = title || String(p.name).replace(/\.(html?|xhtml)$/i, '');
      this.items[id] = {
        id, type: 'game', parent, name: this.uniqueName(parent, cleanName(display) || 'Game'), title, file: p.name,
        src, size: p.size, saveKey: saveKeyFor(title, p.name), added: Date.now(),
      };
      added.push(this.items[id]);
    }
    if (added.length) this.changed();
    return added;
  }

  // Swap a game's file for a newer one, keeping its place, name, plays and saves.
  async replaceFile(id, picked) {
    const it = this.items[id];
    if (!it || !picked || !picked.blob) return false;
    if (it.src?.startsWith('user:')) await native.deleteBlob(it.src.slice(5));
    if (it.builtin) { this.builtinRemoved.push(it.builtin); delete it.builtin; }
    it.src = 'user:' + picked.blob;
    it.size = picked.size;
    it.file = picked.name;
    it.title = picked.title || (await readTitle(it.src)) || it.title;
    it.replaced = Date.now();
    delete it.thumb;
    this.changed();
    return true;
  }

  touchPlayed(id) {
    const it = this.items[id];
    if (!it) return;
    it.lastPlayed = Date.now();
    it.plays = (it.plays || 0) + 1;
    this.changed();
  }

  addPlayTime(id, seconds) {
    const it = this.items[id];
    if (!it || !(seconds > 0)) return;
    it.playSeconds = (it.playSeconds || 0) + seconds;
    this.changed();
  }

  setOpts(id, patch) {
    const it = this.items[id];
    if (!it) return;
    it.opts = { ...(it.opts || {}), ...patch };
    for (const [k, v] of Object.entries(it.opts)) if (v == null || v === '') delete it.opts[k];
    this.changed();
  }

  setField(id, patch) {
    const it = this.items[id];
    if (!it) return;
    Object.assign(it, patch);
    this.changed();
  }

  // Everything needed to rebuild the library on another phone (the files travel separately).
  snapshot() {
    return { version: 1, items: this.items, builtinRemoved: this.builtinRemoved, builtinFolders: this.builtinFolders };
  }

  async restoreSnapshot(snap) {
    if (!snap || !snap.items) return false;
    this.items = snap.items;
    this.builtinRemoved = snap.builtinRemoved || [];
    this.builtinFolders = snap.builtinFolders || {};
    this.items[ROOT] = { id: ROOT, type: 'folder', name: 'Library', parent: null };
    await this.mergeCollection();
    this.repair();
    this.changed();
    return true;
  }
}

export const library = new Library();
