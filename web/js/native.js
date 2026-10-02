// The one place that talks to the platform underneath.
//
// On the phone, the Android app gives the page a MooncartNative object (MainActivity.java,
// class Bridge). In a desktop browser, during development and in the tests, the same calls go
// to tools/dev-server.mjs over HTTP. Everything else in web/ only ever uses `native`.

import { titleFromHtml } from './util.js';

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
  const secret = m ? m[1] : '';
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

export const native = A ? android() : dev();

// Reads just enough of a stored game to find its <title>.
export async function readTitle(src) {
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
