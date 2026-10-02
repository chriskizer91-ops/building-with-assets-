// Mooncart's helper. The console adds this to each game's page when it serves it (and the
// save manager loads it on its own). It does three small jobs and nothing else:
//   1. when a game saves a file it made (an export, a character sheet), it hands the file to
//      the console, which asks where to keep it on the phone;
//   2. reads, restores or clears this game's saved data for the save manager and backups;
//   3. in the desktop test harness only, types the console's button presses into the game.
// Games can check `window.__mooncart` to know they're running on the console.
(function () {
  if (window.__mooncart) return;
  window.__mooncart = { console: 'Mooncart', version: 1 };
  var P = window.parent;
  function post(msg) {
    msg.mooncart = 1;
    try { P.postMessage(msg, '*'); } catch (e) { /* no parent */ }
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

  // 3. keys (desktop test harness)
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
