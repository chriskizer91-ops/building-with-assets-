// The one place that talks to the platform underneath.
//
// On the phone, the Android app gives the page a MooncartNative object (MainActivity.java,
// class Bridge). In a desktop browser, during development and in the tests, the same calls go
// to tools/dev-server.mjs over HTTP. In a plain web browser (the demo page that
// tools/build-demo.mjs makes, or web/index.html opened as a file) everything stays in that
// browser. Everything else in web/ only ever uses `native`.

import { titleFromHtml, uid } from './util.js';

const A = window.MooncartNative;
let seq = 0;
const pending = new Map();
const listeners = new Map();

// Android answers long-running calls (file pickers, saving files) by calling this.
window.mooncartResolve = (id, json) => {
  const done = pending.get(id);
  if (!done) return;
  pending.delete(id);
  let v = null;
  try { v = json == null || json === '' ? null : JSON.parse(json); } catch { v = json; }
  done(v);
};
// ...and sends events (controller buttons, app paused/resumed) through this.
window.mooncartEvent = (name, json) => {
  let v = null;
  try { v = json ? JSON.parse(json) : null; } catch { v = json; }
  for (const fn of listeners.get(name) || []) fn(v);
};

function later(call) {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    try { call(id); } catch (e) { pending.delete(id); console.error(e); resolve(null); }
  });
}

function parse(s, fallback = null) {
  if (s == null) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

const common = {
  on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name).delete(fn);
  },
  online: () => navigator.onLine,
};

function android() {
  const host = 'mooncart.invalid';
  // the app starts the page with a secret after the #; every call has to carry it (games never see it)
  const m = /[#&]k=([a-f0-9]+)/.exec(location.hash);
  let secret = m ? m[1] : '';
  try {
    if (secret) sessionStorage.setItem('mooncart-k', secret);
    else secret = sessionStorage.getItem('mooncart-k') || ''; // the page reloaded itself
  } catch { /* storage off */ }
  if (m) history.replaceState(null, '', location.pathname + location.search);
  const call = (method, ...args) => A.call(secret, method, JSON.stringify(args));
  const slow = (method, ...args) => later((id) => A.callAsync(secret, method, JSON.stringify(args), id));
  return {
    ...common,
    platform: 'android',
    info: async () => parse(call('info'), {}),
    readText: async (name) => call('readText', name),
    writeText: async (name, text) => call('writeText', name, text) === 'true',
    collection: async () => parse(call('collection'), { games: [] }),
    pickFiles: () => slow('pickFiles'),
    pickFolder: () => slow('pickFolder'),
    deleteBlob: async (id) => call('deleteBlob', id) === 'true',
    writeBlob: async (id, text) => call('writeBlob', id, text) === 'true',
    register: async (key, src) => call('register', key, src) === 'true',
    gameUrl: (key, file, query = '') => `https://${key}.${host}/${encodeURIComponent(file || 'game.html')}${query || ''}`,
    helperUrl: (key) => `https://${key}.${host}/__mooncart/saves.html`,
    rawUrl: (src) => `https://${host}/~raw/${encodeURIComponent(src)}`,
    thumbUrl: (name) => `https://${host}/~thumb/${encodeURIComponent(name)}`,
    key: (code, down) => call('key', code, !!down),
    setKeymap: () => {},
    setPlaying: (on) => call('setPlaying', !!on),
    setOrientation: (mode) => call('setOrientation', mode),
    vibrate: (ms) => call('vibrate', ms | 0),
    captureThumb: (name, r) => slow('captureThumb', name, r.x, r.y, r.w, r.h),
    saveFile: (name, mime, data, base64 = false) => slow('saveFile', name, mime, data, !!base64),
    exportBackup: (json) => slow('exportBackup', json),
    importBackup: () => slow('importBackup'),
    saveApk: () => slow('saveApk'),
    openExternal: (url) => call('openExternal', url),
    exit: () => call('exit'),
    ready: () => call('ready'),
  };
}

function dev() {
  const api = (path, opts) => fetch('/api/' + path, opts).then((r) => (r.ok ? r : Promise.reject(new Error(r.status + ' ' + path))));
  const json = (path, opts) => api(path, opts).then((r) => r.json());
  let frameForKeys = null;

  async function upload(files, withDirs) {
    const out = [];
    for (const f of files) {
      if (!/\.(html?|xhtml)$/i.test(f.name)) continue;
      const rel = withDirs ? (f.webkitRelativePath || f.name) : f.name;
      const dir = withDirs ? rel.split('/').slice(1, -1).join('/') : '';
      const res = await json('blob?name=' + encodeURIComponent(f.name), { method: 'POST', body: f });
      out.push({ ...res, dir, root: withDirs ? rel.split('/')[0] : '' });
    }
    return out;
  }
  function pick(dirs) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      if (dirs) input.webkitdirectory = true;
      else input.accept = '.html,.htm,text/html';
      input.onchange = async () => resolve(await upload([...input.files], dirs));
      input.oncancel = () => resolve([]);
      input.click();
    });
  }
  const origin = location.origin;
  const port = location.port ? ':' + location.port : '';

  return {
    ...common,
    platform: 'dev',
    info: () => json('info'),
    readText: (name) => api('text/' + encodeURIComponent(name)).then((r) => r.text()).then((t) => t || null).catch(() => null),
    writeText: (name, text) => api('text/' + encodeURIComponent(name), { method: 'PUT', body: text }).then(() => true, () => false),
    collection: () => json('collection').catch(() => ({ games: [] })),
    pickFiles: () => pick(false),
    pickFolder: () => pick(true),
    deleteBlob: (id) => api('blob/' + id, { method: 'DELETE' }).then(() => true, () => false),
    writeBlob: (id, text) => api('blob/' + id, { method: 'PUT', body: text }).then(() => true, () => false),
    register: (key, src) => api('register', { method: 'POST', body: JSON.stringify({ key, src }) }).then(() => true),
    gameUrl: (key, file, query = '') => `${location.protocol}//${key}.localhost${port}/${encodeURIComponent(file || 'game.html')}${query || ''}`,
    helperUrl: (key) => `${location.protocol}//${key}.localhost${port}/__mooncart/saves.html`,
    rawUrl: (src) => `${origin}/raw?src=${encodeURIComponent(src)}`,
    thumbUrl: (name) => `${origin}/thumbs/${encodeURIComponent(name)}`,
    // a desktop browser can't type into another page, so the game's helper does it (game-helper.js)
    key: (code, down) => { if (frameForKeys) frameForKeys.postMessage({ mooncart: 1, op: 'key', code, down: !!down }, '*'); },
    setKeyTarget: (win) => { frameForKeys = win; },
    setKeymap: () => {},
    setPlaying: () => {},
    setOrientation: () => {},
    vibrate: () => {},
    captureThumb: async () => null,
    saveFile: async (name, mime, data, base64 = false) => {
      const bytes = base64 ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0)) : data;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([bytes], { type: mime }));
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      return true;
    },
    exportBackup: async (extra) => {
      const r = await json('backup', { method: 'POST', body: extra });
      if (!r || !r.file) return false;
      const a = document.createElement('a');
      a.href = '/api/backup/' + encodeURIComponent(r.file);
      a.download = r.file;
      a.click();
      return true;
    },
    importBackup: () => new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip,application/zip';
      input.onchange = async () => {
        const f = input.files[0];
        if (!f) return resolve(null);
        resolve(await json('restore', { method: 'POST', body: f }).catch(() => null));
      };
      input.oncancel = () => resolve(null);
      input.click();
    }),
    saveApk: async () => false,
    openExternal: (url) => window.open(url, '_blank', 'noopener'),
    exit: () => {},
    ready: () => {},
  };
}

// A plain web browser: the library and added games stay in this browser (IndexedDB), and the
// built-in games, if any, sit next to the page (collection/). Each game runs in a frame made
// from its own text with the helper added in front; the helper keeps each game's saves apart,
// since here every game shares the page's address.
function web() {
  const cfg = window.__MOONCART_WEB__ || {};
  const base = cfg.collection || 'collection/';
  const inside = cfg.games || null; // { collection, files } when the games are inside the page itself
  const mem = { text: new Map(), blobs: new Map() }; // when the browser keeps no storage
  let opened = null;
  const db = () => opened || (opened = new Promise((resolve) => {
    try {
      const r = indexedDB.open('mooncart', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('text'); r.result.createObjectStore('blobs'); };
      r.onsuccess = () => resolve(r.result);
      r.onerror = r.onblocked = () => resolve(null);
    } catch { resolve(null); }
  }));
  const kv = {
    async get(store, key) {
      const d = await db();
      if (!d) return mem[store].get(key);
      return new Promise((resolve) => {
        try { const r = d.transaction(store).objectStore(store).get(key); r.onsuccess = () => resolve(r.result); r.onerror = () => resolve(undefined); } catch { resolve(undefined); }
      });
    },
    async put(store, key, value) {
      const d = await db();
      if (!d) { mem[store].set(key, value); return true; }
      return new Promise((resolve) => {
        try { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).put(value, key); tx.oncomplete = () => resolve(true); tx.onerror = tx.onabort = () => resolve(false); } catch { resolve(false); }
      });
    },
    async del(store, key) {
      const d = await db();
      if (!d) return mem[store].delete(key);
      return new Promise((resolve) => {
        try { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = () => resolve(true); tx.onerror = tx.onabort = () => resolve(false); } catch { resolve(false); }
      });
    },
  };
  const builtinUrl = (path) => base + path.split('/').map(encodeURIComponent).join('/');
  async function readRaw(src) {
    if (src.startsWith('builtin:')) {
      if (inside) {
        if (inside.files[src.slice(8)] == null) throw new Error('This game is missing from the page');
        return inside.files[src.slice(8)];
      }
      const r = await fetch(builtinUrl(src.slice(8)));
      if (!r.ok) throw new Error('This game is missing from the page (' + r.status + ')');
      return r.text();
    }
    if (src.startsWith('user:')) {
      const b = await kv.get('blobs', src.slice(5));
      if (b == null) throw new Error('This game is no longer stored in this browser');
      return typeof b === 'string' ? b : b.text();
    }
    throw new Error('Unknown game file');
  }

  async function keep(files, withDirs) {
    const out = [];
    for (const f of files) {
      if (!/\.(html?|xhtml)$/i.test(f.name)) continue;
      const rel = withDirs ? (f.webkitRelativePath || f.name) : f.name;
      const id = uid();
      if (!(await kv.put('blobs', id, f))) continue;
      const head = await f.slice(0, 2_000_000).text().catch(() => '');
      out.push({ blob: id, name: f.name, size: f.size, title: titleFromHtml(head), dir: withDirs ? rel.split('/').slice(1, -1).join('/') : '', root: withDirs ? rel.split('/')[0] : '' });
    }
    return out;
  }
  function pick(dirs) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      if (dirs) input.webkitdirectory = true;
      else input.accept = '.html,.htm,.xhtml,text/html';
      input.hidden = true;
      document.body.append(input);
      const done = (v) => { input.remove(); resolve(v); };
      input.onchange = async () => done(await keep([...input.files], dirs));
      input.oncancel = () => done([]);
      input.click();
    });
  }
  function download(name, mime, bytes) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: mime }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  // the helper goes in front of the game's own scripts (as Server.withHelper does on the phone)
  let helper = cfg.helper || null;
  const helperText = async () => helper || (helper = await fetch('__mooncart/helper.js').then((r) => r.text()).catch(() => ''));
  async function page(html, key) {
    const tag = `<script>window.__mooncartSlot=${JSON.stringify(key)};window.__mooncartDemo=${cfg.demo ? 'true' : 'false'};</script>` +
      `<script>${(await helperText()).replace(/<\/script/gi, '<\\/script')}</script>`;
    const head = /<head\b[^>]*>/i.exec(html.slice(0, 65536));
    const doctype = /<!doctype[^>]*>/i.exec(html.slice(0, 65536));
    const at = head ? head.index + head[0].length : doctype ? doctype.index + doctype[0].length : 0;
    return html.slice(0, at) + tag + html.slice(at);
  }
  const failed = (msg) => `<!doctype html><meta charset="utf-8"><body style="margin:0;display:grid;place-items:center;height:100vh;background:#0b0a16;color:#ece6ff;font:15px/1.5 system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box"><p>${String(msg).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</p>`;
  const ready = new Map(); // save slot -> the game's page, made by register() for loadFrame()
  let frameForKeys = null;

  return {
    ...common,
    platform: 'web',
    demo: !!cfg.demo,
    info: async () => ({ platform: 'web', demo: !!cfg.demo, browser: navigator.userAgent }),
    readText: async (name) => { const v = await kv.get('text', name); return v == null ? null : v; },
    writeText: (name, text) => kv.put('text', name, text),
    collection: async () => (inside ? inside.collection : fetch(base + 'collection.json').then((r) => (r.ok ? r.json() : { games: [] })).catch(() => ({ games: [] }))),
    pickFiles: () => pick(false),
    pickFolder: () => pick(true),
    deleteBlob: (id) => kv.del('blobs', id),
    writeBlob: (id, text) => kv.put('blobs', id, new Blob([text], { type: 'text/html' })),
    readHead: async (src) => (await readRaw(src)).slice(0, 2_000_000),
    register: async (key, src) => {
      try { ready.set(key, await page(await readRaw(src), key)); return true; } catch (e) { ready.set(key, failed(e.message)); return false; }
    },
    loadFrame: (frame, key) => { frame.srcdoc = ready.get(key) || failed('This game could not be read.'); ready.delete(key); },
    gameUrl: () => 'about:blank',
    helperUrl: () => 'about:blank',
    rawUrl: (src) => (src.startsWith('builtin:') ? builtinUrl(src.slice(8)) : 'about:blank'),
    thumbUrl: () => '',
    key: (code, down) => { if (frameForKeys) frameForKeys.postMessage({ mooncart: 1, op: 'key', code, down: !!down }, '*'); },
    setKeyTarget: (win) => { frameForKeys = win; },
    setKeymap: () => {},
    setPlaying: () => {},
    setOrientation: () => {},
    vibrate: (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* not on this device */ } },
    captureThumb: async () => null,
    // the demo page can't hand files to the browser; a page opened on its own can
    saveFile: async (name, mime, data, base64 = false) => {
      if (cfg.demo) return false;
      download(name, mime, base64 ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0)) : data);
      return true;
    },
    exportBackup: async () => false,
    importBackup: async () => null,
    saveApk: async () => false,
    openExternal: (url) => window.open(url, '_blank', 'noopener'),
    exit: () => {},
    ready: () => {},
  };
}

export const native = A ? android() : window.__MOONCART_WEB__ || location.protocol === 'file:' ? web() : dev();

// Reads just enough of a stored game to find its <title>.
export async function readTitle(src) {
  if (native.readHead) return native.readHead(src).then(titleFromHtml, () => '');
  try {
    const res = await fetch(native.rawUrl(src));
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let text = '';
    while (text.length < 2_000_000) {
      const { value, done } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      const t = titleFromHtml(text);
      if (t) { reader.cancel(); return t; }
      if (/<\/head>|<body[\s>]/i.test(text)) break;
    }
    reader.cancel();
    return titleFromHtml(text);
  } catch { return ''; }
}
