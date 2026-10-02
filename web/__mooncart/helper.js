// Mooncart's helper. The console adds this to each game's page when it serves it (and the
// save manager loads it on its own). It does three small jobs and nothing else:
//   1. when a game saves a file it made (an export, a character sheet), it hands the file to
//      the console, which asks where to keep it on the phone;
//   2. reads, restores or clears this game's saved data for the save manager and backups;
//   3. in a desktop or plain web browser only, types the console's button presses into the game.
// In a plain web browser every game shares one address, so it also gives this game's saved
// data its own corner of the browser's storage (window.__mooncartSlot, set just before it).
// Games can check `window.__mooncart` to know they're running on the console.
(function () {
  if (window.__mooncart) return;
  window.__mooncart = { console: 'Mooncart', version: 1 };
  var P = window.parent;
  function post(msg) {
    msg.mooncart = 1;
    try { P.postMessage(msg, '*'); } catch (e) { /* no parent */ }
  }

  // 0. a plain web browser: localStorage, sessionStorage and IndexedDB names get a prefix
  //    made from the game's save slot, before the game's own scripts run
  var slot = window.__mooncartSlot;
  if (slot && typeof Proxy === 'function') {
    var prefix = 'mc:' + slot + ':';
    var wrap = function (real) {
      var own = function () {
        var out = [];
        for (var i = 0; i < real.length; i++) { var k = real.key(i); if (k != null && k.indexOf(prefix) === 0) out.push(k.slice(prefix.length)); }
        return out;
      };
      var api = {
        getItem: function (k) { return real.getItem(prefix + k); },
        setItem: function (k, v) { real.setItem(prefix + k, String(v)); },
        removeItem: function (k) { real.removeItem(prefix + k); },
        clear: function () { own().forEach(function (k) { real.removeItem(prefix + k); }); },
        key: function (i) { var o = own(); return i >= 0 && i < o.length ? o[i] : null; }
      };
      Object.defineProperty(api, 'length', { configurable: true, get: function () { return own().length; } });
      return new Proxy(api, {
        get: function (t, p) { if (typeof p === 'symbol' || p in t) return t[p]; var v = real.getItem(prefix + p); return v === null ? undefined : v; },
        set: function (t, p, v) { if (typeof p === 'symbol' || p in t) return false; real.setItem(prefix + p, String(v)); return true; },
        has: function (t, p) { return p in t || (typeof p === 'string' && real.getItem(prefix + p) !== null); },
        deleteProperty: function (t, p) { if (typeof p === 'string' && !(p in t)) real.removeItem(prefix + p); return true; },
        ownKeys: function () { return own(); },
        getOwnPropertyDescriptor: function (t, p) {
          if (typeof p !== 'string' || p in t) return undefined;
          var v = real.getItem(prefix + p);
          return v === null ? undefined : { value: v, writable: true, enumerable: true, configurable: true };
        }
      });
    };
    ['localStorage', 'sessionStorage'].forEach(function (name) {
      try {
        var store = wrap(window[name]);
        Object.defineProperty(window, name, { configurable: true, enumerable: true, get: function () { return store; } });
      } catch (e) { /* this browser keeps no storage here */ }
    });
    try {
      var F = window.IDBFactory && window.IDBFactory.prototype;
      if (F) {
        var open = F.open, del = F.deleteDatabase, list = F.databases;
        F.open = function (name, v) { return v === undefined ? open.call(this, prefix + name) : open.call(this, prefix + name, v); };
        F.deleteDatabase = function (name) { return del.call(this, prefix + name); };
        if (list) {
          F.databases = function () {
            return list.call(this).then(function (l) {
              return l.filter(function (d) { return d.name.indexOf(prefix) === 0; }).map(function (d) { return { name: d.name.slice(prefix.length), version: d.version }; });
            });
          };
        }
      }
    } catch (e) { /* no IndexedDB */ }
  }
  // the demo page's frame swallows alert() boxes; the console shows them instead
  if (window.__mooncartDemo && P !== window) {
    window.alert = function (msg) { post({ op: 'alert', text: String(msg) }); };
  }

  // 1. files a game "downloads"
  function grab(a) {
    var href = a.href || '';
    if (!/^(blob:|data:)/i.test(href)) return false;
    var name = a.getAttribute('download') || 'download';
    fetch(href).then(function (r) { return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        post({ op: 'download', name: name, mime: b.type || 'application/octet-stream', data: s.slice(s.indexOf(',') + 1) });
      };
      fr.readAsDataURL(b);
    });
    return true;
  }
  if (P !== window) {
    var click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download') && grab(this)) return;
      return click.apply(this, arguments);
    };
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
      if (a && grab(a)) e.preventDefault();
    }, true);
  }

  // 3. keys (desktop or plain web browser)
  var KEYS = {
    ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40], ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39],
    Enter: ['Enter', 13], Space: [' ', 32], Escape: ['Escape', 27], Backspace: ['Backspace', 8], Tab: ['Tab', 9], ShiftLeft: ['Shift', 16]
  };
  function keyInfo(code) {
    if (KEYS[code]) return KEYS[code];
    if (/^Key[A-Z]$/.test(code)) return [code.slice(3).toLowerCase(), code.charCodeAt(3)];
    if (/^Digit[0-9]$/.test(code)) return [code.slice(5), code.charCodeAt(5)];
    return [code, 0];
  }
  function sendKey(code, down) {
    var k = keyInfo(code);
    var target = document.activeElement && document.activeElement !== document.body ? document.activeElement : document.body || document.documentElement;
    var ev = new KeyboardEvent(down ? 'keydown' : 'keyup', { key: k[0], code: code, bubbles: true, cancelable: true, composed: true });
    try {
      Object.defineProperty(ev, 'keyCode', { get: function () { return k[1]; } });
      Object.defineProperty(ev, 'which', { get: function () { return k[1]; } });
    } catch (e) { /* read-only in some engines */ }
    target.dispatchEvent(ev);
  }

  // 2. saved data
  function dump() {
    var local = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      local[k] = localStorage.getItem(k);
    }
    return local;
  }
  function clearAll() {
    try { localStorage.clear(); } catch (e) { /* ignore */ }
    try { sessionStorage.clear(); } catch (e) { /* ignore */ }
    var jobs = [];
    if (indexedDB && indexedDB.databases) {
      jobs.push(indexedDB.databases().then(function (list) {
        return Promise.all(list.map(function (d) {
          return new Promise(function (res) { var r = indexedDB.deleteDatabase(d.name); r.onsuccess = r.onerror = r.onblocked = function () { res(); }; });
        }));
      }).catch(function () {}));
    }
    if (window.caches && caches.keys) jobs.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }).catch(function () {}));
    return Promise.all(jobs);
  }
  function idbNames() {
    if (!indexedDB || !indexedDB.databases) return Promise.resolve([]);
    return indexedDB.databases().then(function (l) { return l.map(function (d) { return d.name; }); }).catch(function () { return []; });
  }

  window.addEventListener('message', function (e) {
    if (e.source !== P) return;
    var m = e.data;
    if (!m || m.mooncart !== 1) return;
    if (m.op === 'key') { sendKey(m.code, m.down); return; }
    var reply = function (ok, data) { post({ op: 'reply', id: m.id, ok: ok, data: data }); };
    try {
      if (m.op === 'saves:dump') idbNames().then(function (names) { reply(true, { local: dump(), indexedDB: names }); });
      else if (m.op === 'saves:restore') {
        if (m.replace) localStorage.clear();
        var items = m.local || {};
        for (var k in items) if (Object.prototype.hasOwnProperty.call(items, k)) localStorage.setItem(k, items[k]);
        reply(true, { count: Object.keys(items).length });
      } else if (m.op === 'saves:clear') clearAll().then(function () { reply(true, null); });
    } catch (err) { reply(false, String(err && err.message || err)); }
  });
})();
