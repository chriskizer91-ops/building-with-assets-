/* Walking Paths: the walk engine. Walks someone round a set of painted maps the way Envoi on the
   Longest Night's field does (src/game/field.js there): the same rule for where feet can stand,
   the same grid and path finding, the same sliding along walls, and fronts (pieces of the
   painting) drawn over whoever walks behind them. Ways out lead to the other maps of the set.

   A world map (kind "world") has places, each leading into another map; a way out whose `at` is
   a place's id comes out at that place on the world map. A map with no walk areas yet (a world
   map, or a picture just added) can be walked anywhere. Each map can set how close the camera is
   (`zoom`, Envoi's numbers: 0.7 is normal) and how fast she walks (`pace`, her heights a second).

   It is one plain script with nothing to load, so Walking Paths can put a copy of it inside every
   walk-around page it saves. It needs sprites.js (the pixel people) before it, and painted-io.js
   for the painted Io.

     const field = WalkingPathsEngine.create(hostElement, {
       maps,                  // { id: map } in the maps file's shape (see docs/how-it-works.md)
       picture: (id) => url,  // where each map's picture is (default: map.src)
       walker: 'io-painted',  // 'io-painted', 'io' (in pixels) or one of the folk looks
       showPaths: false,      // draw the walk areas, blocks and ways out while walking
       menuLabel, onMenu,     // the button at the top left
       onNote: (text) => {},  // something happened (a way out to nowhere, a story area)
     });
     await field.load(id, [x, y], 's');
     field.stop();

   WalkingPathsEngine.rules has the stand test, the grid and the reach check, which the editor
   uses too, so what the editor says she can reach is what the walk does. */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const isPt = (p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);

  function inPoly(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function bboxOf(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return [x0, y0, x1, y1];
  }
  const inRect = (r, x, y, pad) => x >= r[0] - pad && x <= r[2] + pad && y >= r[1] - pad && y <= r[3] + pad;
  const sizeOf = (map) => (Array.isArray(map.size) ? map.size : [1536, 1024]);

  // ---------------------------------------------------------------------------------------------
  // The rules. Envoi made them for Io 52 pixels tall on a 1536 x 1024 painting; here every length
  // grows or shrinks with the map's walker height, so a map of any size walks the same way.

  const ENVOI_H = 52;
  function sizes(map) {
    const h = map.walker > 0 ? map.walker : ENVOI_H, s = h / ENVOI_H;
    return { h, s, foot: 6 * s, cell: Math.max(3, 12 * s), personW: 11 * s, personH: 7 * s, near: 58 * s, exitPad: 8 * s, side: 14 * s, look: 6 * s };
  }

  // A point is free when it is inside a walk area, outside every block and not where someone
  // stands; she can stand at a point when it and the points a foot to each side are free.
  function standTest(map) {
    const z = sizes(map), [W, H] = sizeOf(map);
    const shapes = (list) => (list || []).filter((p) => Array.isArray(p) && p.length >= 3).map((p) => [bboxOf(p), p]);
    const walk = shapes(map.walk), block = shapes(map.block);
    const people = (map.people || []).filter((p) => p && !p.hidden && isPt(p.at));
    const open = !walk.length; // no walk areas yet: the whole map is ground
    function free(x, y) {
      if (open) { if (x < 0 || y < 0 || x > W || y > H) return false; }
      else {
        let inside = false;
        for (const [b, p] of walk) if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && inPoly(p, x, y)) { inside = true; break; }
        if (!inside) return false;
      }
      for (const [b, p] of block) if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && inPoly(p, x, y)) return false;
      for (const q of people) if (Math.abs(q.at[0] - x) < z.personW && Math.abs(q.at[1] - y) < z.personH) return false;
      return true;
    }
    const stand = (x, y) => free(x, y) && free(x - z.foot, y) && free(x + z.foot, y);
    return { free, stand, sizes: z, open };
  }

  // The map in cells: a cell is open when she can stand at its middle and a little way off it in
  // each direction (Envoi's cells are 12 pixels, checked 5 pixels out).
  function grid(map, test) {
    test = test || standTest(map);
    const z = test.sizes, c = z.cell, [W, H] = sizeOf(map);
    const gw = Math.max(1, Math.ceil(W / c)), gh = Math.max(1, Math.ceil(H / c)), r = (c * 5) / 12;
    const open = new Uint8Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const x = i * c + c / 2, y = j * c + c / 2;
      open[j * gw + i] = test.stand(x, y) && test.stand(x, y - r) && test.stand(x, y + r) && test.stand(x - r, y) && test.stand(x + r, y) ? 1 : 0;
    }
    return { open, gw, gh, c, test, cx: (k) => (k % gw) * c + c / 2, cy: (k) => Math.floor(k / gw) * c + c / 2 };
  }

  // Where she can get to from where a walk starts, and what she can't reach: the editor's check.
  // `maps` is the whole set (for the names of the places ways out lead to), `id` the map.
  function reach(maps, id) {
    const map = maps[id], G = grid(map), { open, gw, gh, cx, cy } = G, n = gw * gh, z = G.test.sizes;
    const seen = new Uint8Array(n);
    const nearestOpen = (x, y) => {
      let best = -1, d = Infinity;
      for (let k = 0; k < n; k++) if (open[k]) { const e = (cx(k) - x) ** 2 + (cy(k) - y) ** 2; if (e < d) { d = e; best = k; } }
      return [best, Math.sqrt(d)];
    };
    let openCount = 0;
    for (let k = 0; k < n; k++) openCount += open[k];
    const start = isPt(map.start) ? map.start : [sizeOf(map)[0] / 2, sizeOf(map)[1] / 2];
    const [s0, sd] = nearestOpen(start[0], start[1]);
    if (s0 >= 0) {
      const q = [s0]; seen[s0] = 1;
      for (let qi = 0; qi < q.length; qi++) {
        const k = q[qi], i = k % gw, j = (k - i) / gw;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = i + di, b = j + dj;
          if (a < 0 || b < 0 || a >= gw || b >= gh) continue;
          const m = b * gw + a;
          if (open[m] && !seen[m]) { seen[m] = 1; q.push(m); }
        }
      }
    }
    let reached = 0;
    for (let k = 0; k < n; k++) reached += seen[k];
    const nearPoint = (x, y, r) => { for (let k = 0; k < n; k++) if (seen[k] && Math.hypot(cx(k) - x, (cy(k) - y) * 1.3) < r) return true; return false; };
    const nearRect = (rc) => { const p = z.side; for (let k = 0; k < n; k++) if (seen[k] && inRect(rc, cx(k), cy(k), p)) return true; return false; };
    const mid = (r) => [Math.round((r[0] + r[2]) / 2), Math.round((r[1] + r[3]) / 2)];
    const placeName = (to) => (maps[to] ? maps[to].name || to : String(to));
    const problems = [];
    const add = (kind, i, at, text) => problems.push({ kind, i, at, text });
    if (s0 < 0) add('start', 0, start, 'There is nowhere on this map she can stand.');
    else if (sd > z.side) add('start', 0, start, 'Where a walk starts is ' + Math.round(sd) + ' px off the walk areas.');
    (map.exits || []).forEach((e, i) => {
      if (Array.isArray(e.rect) && !nearRect(e.rect)) add('exit', i, mid(e.rect), 'She can’t reach the way out to ' + (e.label || placeName(e.to)) + '.');
    });
    (map.people || []).forEach((p, i) => {
      if (isPt(p.at) && !nearPoint(p.at[0], p.at[1], z.near)) add('person', i, p.at, 'She can’t get near enough to talk to ' + (p.name || 'someone') + '.');
    });
    (map.spots || []).forEach((s, i) => {
      if (Array.isArray(s.rect)) { if (!nearRect(s.rect)) add('spot', i, mid(s.rect), 'She can’t reach the story area ' + (s.label || s.id || '') + '.'); }
      else if (isPt(s.at) && !nearPoint(s.at[0], s.at[1], z.near)) add('spot', i, s.at, 'She can’t get near enough to ' + (s.label || s.kind || 'a thing') + '.');
    });
    if (map.kind === 'world') (map.places || []).forEach((p, i) => {
      if (isPt(p.at) && !nearPoint(p.at[0], p.at[1], z.near)) add('place', i, p.at, 'She can’t get near enough to ' + (p.name || p.id || 'a place') + ' on the world map.');
    });
    // where she comes in from the world map's places
    for (const from of Object.keys(maps)) if (maps[from].kind === 'world') (maps[from].places || []).forEach((p, pi) => {
      if (p.to !== id || !isPt(p.arrive)) return;
      const [k, d] = nearestOpen(p.arrive[0], p.arrive[1]), who = 'Coming from the world map, she';
      for (const x of map.exits || []) if (Array.isArray(x.rect) && inRect(x.rect, p.arrive[0], p.arrive[1], z.exitPad)) add('arrival', from + ':p' + pi, p.arrive, who + ' would arrive inside the way out to ' + (x.label || placeName(x.to)) + ', and leave again at once.');
      if (k < 0) add('arrival', from + ':p' + pi, p.arrive, who + ' would arrive where there is no walk area at all.');
      else if (d > z.side) add('arrival', from + ':p' + pi, p.arrive, who + ' would arrive ' + Math.round(d) + ' px off the walk areas.');
      else if (!seen[k]) add('arrival', from + ':p' + pi, p.arrive, who + ' would arrive cut off from the rest of the map.');
    });
    // where she comes in from the other maps' ways out
    for (const from of Object.keys(maps)) (maps[from].exits || []).forEach((e, ei) => {
      if (e.to !== id || !isPt(e.at)) return;
      const who = 'Coming from ' + (maps[from].name || from) + ', she';
      for (const x of map.exits || []) if (Array.isArray(x.rect) && inRect(x.rect, e.at[0], e.at[1], z.exitPad)) add('arrival', from + ':' + ei, e.at, who + ' would arrive inside the way out to ' + (x.label || placeName(x.to)) + ', and leave again at once.');
      const [k, d] = nearestOpen(e.at[0], e.at[1]);
      if (k < 0) add('arrival', from + ':' + ei, e.at, who + ' would arrive where there is no walk area at all.');
      else if (d > z.side) add('arrival', from + ':' + ei, e.at, who + ' would arrive ' + Math.round(d) + ' px off the walk areas.');
      else if (!seen[k]) add('arrival', from + ':' + ei, e.at, who + ' would arrive cut off from the rest of the map.');
    });
    return { grid: G, seen, open: openCount, reached, problems };
  }

  // the way from where she is to (x, y) through open cells, straightened where she can see along it
  function findPath(G, from, to) {
    const { open, gw, gh, c } = G;
    const cell = (x, y) => [clamp(Math.floor(x / c), 0, gw - 1), clamp(Math.floor(y / c), 0, gh - 1)];
    const [si, sj] = cell(from[0], from[1]);
    let [ti, tj] = cell(to[0], to[1]), tx = to[0], ty = to[1];
    if (!open[tj * gw + ti]) {
      let best = null, bd = Infinity;
      for (let r = 1; r < 12 && !best; r++) for (let j = tj - r; j <= tj + r; j++) for (let i = ti - r; i <= ti + r; i++) {
        if (i < 0 || j < 0 || i >= gw || j >= gh || !open[j * gw + i]) continue;
        const d = (i - ti) ** 2 + (j - tj) ** 2;
        if (d < bd) { bd = d; best = [i, j]; }
      }
      if (!best) return null;
      [ti, tj] = best; tx = ti * c + c / 2; ty = tj * c + c / 2;
    }
    const prev = new Int32Array(gw * gh).fill(-1), s = sj * gw + si, t = tj * gw + ti, q = [s];
    prev[s] = s;
    for (let qi = 0; qi < q.length; qi++) {
      const k = q[qi];
      if (k === t) break;
      const i = k % gw, j = (k - i) / gw;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= gw || b >= gh) continue;
        const m = b * gw + a;
        if (prev[m] >= 0 || !open[m]) continue;
        if (di && dj && (!open[j * gw + a] || !open[b * gw + i])) continue; // no cutting corners
        prev[m] = k; q.push(m);
      }
    }
    if (prev[t] < 0) return null;
    const cells = [];
    for (let k = t; k !== s; k = prev[k]) cells.push(k);
    cells.reverse();
    const pts = cells.map((k) => [(k % gw) * c + c / 2, Math.floor(k / gw) * c + c / 2]);
    if (pts.length) pts[pts.length - 1] = [tx, ty];
    // straighten: from each point, go to the furthest one she can walk to in a straight line
    const step = G.test.sizes.foot;
    const clear = (x0, y0, x1, y1) => {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step);
      for (let i = 1; i <= n; i++) if (!G.test.stand(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false;
      return true;
    };
    const out = [];
    let x = from[0], y = from[1];
    for (let i = 0; i < pts.length;) {
      let j = i;
      while (j + 1 < pts.length && clear(x, y, pts[j + 1][0], pts[j + 1][1])) j++;
      out.push(pts[j]); [x, y] = pts[j]; i = j + 1;
    }
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // The look: the game's night, whatever the device's theme.

  const CSS = [
    '.wpe{position:absolute;inset:0;overflow:hidden;background:#05030c;color:#f4f6ff;font:15px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '.wpe-cv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}',
    '.wpe-win{background:linear-gradient(180deg,rgba(70,78,128,.95),rgba(28,32,62,.95));border:2px solid rgba(214,222,255,.92);border-radius:7px;color:#f4f6ff;text-shadow:0 1px 0 rgba(0,0,0,.7)}',
    '.wpe-plate{position:absolute;left:8px;top:8px;max-width:calc(100% - 190px);padding:4px 10px;font:italic 16px/1.25 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;z-index:3;pointer-events:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.wpe button{font:inherit;cursor:pointer;touch-action:manipulation}',
    '.wpe-menu{position:absolute;left:8px;top:44px;z-index:3;appearance:none;border:1px solid rgba(214,222,255,.5);border-radius:18px;background:rgba(18,16,40,.7);color:#f4f6ff;font-size:14px;font-weight:700;min-height:36px;padding:0 14px}',
    '.wpe-act{position:absolute;left:10px;bottom:16px;z-index:3;appearance:none;border:0;border-radius:24px;min-height:48px;max-width:calc(100% - 170px);padding:0 18px;font-size:15.5px;font-weight:700;background:linear-gradient(180deg,#ffe28f,#f0b84a);color:#2a1d05;box-shadow:0 2px 0 rgba(0,0,0,.4),0 0 0 2px rgba(20,12,4,.5);text-align:left;line-height:1.15}',
    '.wpe-pad{position:absolute;right:10px;bottom:10px;width:132px;height:132px;display:grid;grid-template-columns:repeat(3,44px);grid-template-rows:repeat(3,44px);z-index:3;touch-action:none}',
    '.wpe-pad button{appearance:none;border:1px solid rgba(214,222,255,.45);border-radius:10px;background:rgba(18,16,40,.55);color:#f4f6ff;font-size:17px;line-height:1;touch-action:none}',
    '.wpe-pad button.lit,.wpe-pad button:active{background:rgba(255,179,71,.35)}',
    '.wpe-pad .n{grid-column:2;grid-row:1}.wpe-pad .w{grid-column:1;grid-row:2}.wpe-pad .e{grid-column:3;grid-row:2}.wpe-pad .s{grid-column:2;grid-row:3}',
    '.wpe-mini{position:absolute;top:8px;right:8px;width:min(32vw,150px);z-index:3;border:1px solid rgba(214,222,255,.55);border-radius:6px;background:#0b0912;box-shadow:0 2px 10px rgba(0,0,0,.5);cursor:pointer;touch-action:none}',
    '.wpe-mini.big{width:min(70vw,420px)}',
    '.wpe-zoom{position:absolute;right:10px;top:calc(min(32vw,150px) * .75 + 18px);display:flex;flex-direction:column;gap:6px;z-index:3}',
    '.wpe-zoom button{appearance:none;width:40px;height:40px;border-radius:10px;border:1px solid rgba(214,222,255,.45);background:rgba(18,16,40,.6);color:#f4f6ff;font-size:20px;font-weight:700}',
    '.wpe-talk{position:absolute;left:8px;right:8px;bottom:8px;z-index:30;padding:10px 26px 12px 14px;cursor:pointer;max-height:48%;overflow:auto}',
    '.wpe-talk h3{margin:0 0 4px;font:italic 400 19px/1.2 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:#ffd88f}',
    '.wpe-talk p{margin:0;font-size:16px;line-height:1.42;white-space:pre-wrap}',
    '.wpe-talk small{position:absolute;right:8px;bottom:4px;font-size:12px;color:#ffc46e}',
    '.wpe-toast{position:absolute;left:50%;top:52px;transform:translateX(-50%);z-index:40;padding:8px 14px;font-size:14.5px;max-width:calc(100% - 32px);text-align:center;pointer-events:none}',
    '.wpe-fade{position:absolute;inset:0;background:#05030c;opacity:0;pointer-events:none;z-index:50;transition:opacity .3s}',
    '.wpe-fade.on{opacity:1}',
    '.wpe [hidden]{display:none!important}',
    '@media (prefers-reduced-motion:reduce){.wpe-fade{transition:none}}',
  ].join('\n');
  function addStyle() {
    if (document.getElementById('wpe-style')) return;
    const st = document.createElement('style');
    st.id = 'wpe-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function el(tag, attrs, parent, text) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------------------------------------------------------------------------------------------
  // The field: one map at a time, someone walking on it.

  function create(host, opts) {
    opts = opts || {};
    addStyle();
    const maps = opts.maps || {};
    const dpr = () => Math.min(window.devicePixelRatio || 1, 3);
    const box = el('div', { class: 'wpe' }, host);
    const cv = el('canvas', { class: 'wpe-cv', 'aria-hidden': 'true' }, box), g = cv.getContext('2d');
    const plate = el('div', { class: 'wpe-plate wpe-win', role: 'status', 'aria-live': 'polite' }, box);
    const mini = el('canvas', { class: 'wpe-mini', role: 'img', 'aria-label': 'The whole map' }, box), mg = mini.getContext('2d');
    mini.addEventListener('pointerdown', (e) => { e.stopPropagation(); mini.classList.toggle('big'); });
    const menu = el('button', { type: 'button', class: 'wpe-menu' }, box, opts.menuLabel || '☰ Maps');
    menu.hidden = !opts.onMenu;
    menu.addEventListener('click', () => { if (opts.onMenu) opts.onMenu(); });
    const zoomBox = el('div', { class: 'wpe-zoom' }, box);
    let zoomBy = 1;
    el('button', { type: 'button', 'aria-label': 'Closer' }, zoomBox, '+').addEventListener('click', () => { zoomBy = clamp(zoomBy * 1.25, 0.3, 4); });
    el('button', { type: 'button', 'aria-label': 'Further' }, zoomBox, '−').addEventListener('click', () => { zoomBy = clamp(zoomBy / 1.25, 0.3, 4); });
    const act = el('button', { type: 'button', class: 'wpe-act', hidden: '' }, box);
    act.addEventListener('click', () => { if (!talk.hidden) closeTalk(); else useNear(); });
    const talk = el('div', { class: 'wpe-talk wpe-win', hidden: '', role: 'dialog', 'aria-live': 'polite' }, box);
    const talkWho = el('h3', null, talk), talkSaid = el('p', null, talk);
    el('small', null, talk, '▼');
    talk.addEventListener('click', () => closeTalk());
    const toast = el('div', { class: 'wpe-toast wpe-win', role: 'status', 'aria-live': 'polite', hidden: '' }, box);
    const fade = el('div', { class: 'wpe-fade' }, box);

    // the d-pad: press a button, or slide a finger round it for diagonals
    const pad = el('div', { class: 'wpe-pad', role: 'group', 'aria-label': 'Walk' }, box);
    const keys = new Set(), padDirs = new Set(), padBtn = {};
    for (const [d, label, arrow] of [['n', 'Up', '▲'], ['w', 'Left', '◀'], ['e', 'Right', '▶'], ['s', 'Down', '▼']]) padBtn[d] = el('button', { type: 'button', class: d, 'aria-label': label }, pad, arrow);
    const EIGHT = [['e'], ['e', 's'], ['s'], ['s', 'w'], ['w'], ['w', 'n'], ['n'], ['n', 'e']];
    let padPointer = null;
    function padAt(e) {
      const r = pad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      padDirs.clear();
      if (Math.hypot(dx, dy) > r.width * 0.12) for (const d of EIGHT[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8]) padDirs.add(d);
      for (const d in padBtn) padBtn[d].classList.toggle('lit', padDirs.has(d));
      route = null; aim = null;
    }
    const padUp = (e) => { if (e.pointerId === padPointer) { padPointer = null; padDirs.clear(); for (const d in padBtn) padBtn[d].classList.remove('lit'); } };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); if (padPointer === null) { padPointer = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch { /* old browsers */ } padAt(e); } });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === padPointer) padAt(e); });
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(t, padUp);

    const KEYS = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e', w: 'n', s: 's', a: 'w', d: 'e', W: 'n', S: 's', A: 'w', D: 'e' };
    const onKeyDown = (e) => {
      if (stopped || box.hidden || !box.isConnected) return;
      const t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      const d = KEYS[e.key];
      if (d) { if (talk.hidden) { keys.add(d); route = null; } e.preventDefault(); return; }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); if (!talk.hidden) closeTalk(); else useNear(); return; }
      if (e.key === 'Escape') { e.preventDefault(); if (!talk.hidden) closeTalk(); else if (opts.onEscape) opts.onEscape(); return; }
      if ((e.key === 'm' || e.key === 'M') && opts.onMenu) { e.preventDefault(); opts.onMenu(); }
    };
    const onKeyUp = (e) => { const d = KEYS[e.key]; if (d) keys.delete(d); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // who walks: the painted Io (a paper doll), or a pixel sprite (Io, or one of the folk)
    const painted = () => (opts.walker === 'io-painted' ? paintedIo() : null);
    const sheets = {};
    const sheetFor = (look) => {
      if (sheets[look]) return sheets[look];
      let s = null;
      try {
        if (look === 'io' && typeof root.makePixelIo === 'function') s = root.makePixelIo(1);
        else if (typeof root.makeFolk === 'function') s = root.makeFolk(root.FOLK_LOOKS && root.FOLK_LOOKS[look] ? look : 'hooded', 1);
      } catch { s = null; }
      return (sheets[look] = s);
    };
    const me = { x: 0, y: 0, dir: 's', walkT: 0, walk: 0, lean: 0, turn: 0, moving: false, run: 0, vx: 0, vy: 0, blocked: 0 };

    let map = null, mapId = null, pic = null, rules = null, G = null, route = null, aim = null, inExit = null, inStory = null, busy = false, stopped = false;
    let fadeIn = 0, showPaths = !!opts.showPaths;
    const cam = { z: 1, x: 0, y: 0 };
    const tap = { id: null, x: 0, y: 0, x0: 0, y0: 0, t0: 0, steer: false };

    function resize() {
      const r = dpr();
      cv.width = Math.max(1, Math.round(box.clientWidth * r));
      cv.height = Math.max(1, Math.round(box.clientHeight * r));
    }
    const toMap = (cx, cy) => { const r = cv.getBoundingClientRect(); return [cam.x + (cx - r.left) / cam.z, cam.y + (cy - r.top) / cam.z]; };

    cv.addEventListener('pointerdown', (e) => {
      if (busy || !map || tap.id !== null) return;
      if (!talk.hidden) { closeTalk(); return; }
      Object.assign(tap, { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), steer: false });
      try { cv.setPointerCapture(e.pointerId); } catch { /* old browsers */ }
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId !== tap.id) return;
      tap.x = e.clientX; tap.y = e.clientY;
      if (!tap.steer && Math.hypot(tap.x - tap.x0, tap.y - tap.y0) > 12) { tap.steer = true; route = null; aim = null; }
    });
    const tapEnd = (e) => {
      if (e.pointerId !== tap.id) return;
      const wasTap = !tap.steer && e.type === 'pointerup';
      tap.id = null; tap.steer = false;
      if (!wasTap || busy || !map) return;
      const [x, y] = toMap(e.clientX, e.clientY), z = rules.sizes;
      // tapping someone or something walks there and uses it
      const hit = things().find((t) => Math.hypot(t.x - x, t.y - z.h * 0.4 - y) < z.h * 0.6 || Math.hypot(t.x - x, t.y - y) < z.h * 0.5);
      route = findPath(G, [me.x, me.y], [x, y]);
      aim = hit || null;
    };
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(t, tapEnd);

    // people and things she can use when she is near
    function things() {
      const out = [];
      for (const p of map.people || []) if (isPt(p.at) && !p.hidden) out.push({ kind: 'person', ref: p, x: p.at[0], y: p.at[1], label: 'Talk to ' + (p.name || 'them') });
      for (const s of map.spots || []) if (!Array.isArray(s.rect) && isPt(s.at)) out.push({ kind: 'thing', ref: s, x: s.at[0], y: s.at[1], label: s.label ? (s.kind === 'rest' ? 'Rest: ' : 'Look: ') + s.label : s.kind || 'Look' });
      if (map.kind === 'world') for (const p of map.places || []) if (isPt(p.at)) out.push({ kind: 'place', ref: p, x: p.at[0], y: p.at[1], label: 'Go to ' + (p.name || p.id || 'this place') });
      return out;
    }
    function nearest() {
      if (!map) return null;
      let best = null, d = rules.sizes.near;
      for (const t of things()) { const e = Math.hypot(t.x - me.x, (t.y - me.y) * 1.3); if (e < d) { d = e; best = t; } }
      return best;
    }
    function useNear() {
      const t = nearest();
      if (!t || busy) return;
      keys.clear(); padDirs.clear(); route = null; aim = null;
      const dx = t.x - me.x, dy = t.y - me.y;
      me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
      if (t.kind === 'place') { leaveBy({ to: t.ref.to, at: t.ref.arrive, label: t.ref.name || t.ref.id }); return; }
      if (t.kind === 'person') {
        t.ref._face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'w' : 'e') : dy > 0 ? 'n' : 's';
        say(t.ref.name || 'Someone', t.ref.says || t.ref.note || (t.ref.name ? t.ref.name + ' is here.' : 'Someone is here.'));
      } else say(t.ref.label || t.ref.kind || 'Something', t.ref.note || 'Nothing more to see.');
    }
    function say(who, text) {
      talkWho.textContent = who;
      talkSaid.textContent = text;
      talk.hidden = false;
      act.hidden = true;
    }
    function closeTalk() {
      talk.hidden = true;
      for (const p of (map && map.people) || []) delete p._face;
    }
    let toastT = 0;
    function note(text) {
      if (opts.onNote && opts.onNote(text) === true) return;
      toast.textContent = text;
      toast.hidden = false;
      clearTimeout(toastT);
      toastT = setTimeout(() => { toast.hidden = true; }, 3200);
    }

    // a map, and where on it she stands
    function load(id, at, dir) {
      const m = maps[id];
      if (!m) return Promise.reject(new Error('There is no map called ' + id + '.'));
      map = m; mapId = id; pic = null;
      rules = standTest(m); G = grid(m, rules);
      route = null; aim = null; keys.clear(); padDirs.clear(); tap.id = null; inExit = null; inStory = null;
      talk.hidden = true;
      const p = isPt(at) ? at : isPt(m.start) ? m.start : [sizeOf(m)[0] / 2, sizeOf(m)[1] / 2];
      me.x = p[0]; me.y = p[1]; me.dir = dir || 's'; me.vx = me.vy = 0; me.walkT = 0; me.run = 0;
      if (!rules.stand(me.x, me.y)) {
        // not on a walk area: the nearest place she can stand instead
        let best = -1, bd = Infinity;
        for (let k = 0; k < G.open.length; k++) if (G.open[k]) { const d = (G.cx(k) - me.x) ** 2 + (G.cy(k) - me.y) ** 2; if (d < bd) { bd = d; best = k; } }
        if (best >= 0) { me.x = G.cx(best); me.y = G.cy(best); }
      }
      // standing just inside a way out would send her straight back: only a step out of it counts
      for (const e of m.exits || []) if (Array.isArray(e.rect) && inRect(e.rect, me.x, me.y, rules.sizes.exitPad)) inExit = e;
      plate.textContent = m.name || id;
      fadeIn = 1;
      const src = opts.picture ? opts.picture(id) : m.src;
      return new Promise((resolve) => {
        if (!src) { pic = null; resolve(); return; }
        const img = new Image();
        img.onload = () => { if (map === m) pic = img; resolve(); };
        img.onerror = () => { if (map === m) pic = null; resolve(); };
        img.src = src;
      });
    }

    async function leaveBy(e) {
      keys.clear(); padDirs.clear(); route = null; aim = null;
      if (e.to && maps[e.to] && !busy) {
        busy = true;
        fade.classList.add('on');
        await new Promise((r) => setTimeout(r, 320));
        const from = mapId;
        // a way out to the world map names a place there: she comes out at it
        let at = e.at;
        if (typeof at === 'string') { const p = (maps[e.to].places || []).find((q) => q.id === at); at = p && isPt(p.at) ? p.at : null; }
        try { await load(e.to, isPt(at) ? at : null, null); } catch { await load(from, null, null); }
        busy = false;
        fade.classList.remove('on');
        if (opts.onMap) opts.onMap(mapId);
      } else if (!busy) note('The way out to ' + (e.label || e.to || 'somewhere') + (e.to ? '. It leads to “' + e.to + '”, which isn’t one of these maps.' : '. It doesn’t lead anywhere yet.'));
    }

    // a step of the walk
    function step(dt) {
      if (!talk.hidden) { me.vx = me.vy = 0; me.moving = false; return; }
      let dx = 0, dy = 0, last = false;
      if (tap.id !== null && !tap.steer && performance.now() - tap.t0 > 220) { tap.steer = true; route = null; aim = null; }
      const steering = tap.id !== null && tap.steer, dirs = keys.size ? keys : padDirs;
      if (dirs.size) {
        if (dirs.has('e')) dx++;
        if (dirs.has('w')) dx--;
        if (dirs.has('s')) dy++;
        if (dirs.has('n')) dy--;
      } else if (steering) {
        const [x, y] = toMap(tap.x, tap.y);
        dx = x - me.x; dy = y - me.y;
        const d = Math.hypot(dx, dy), h = rules.sizes.h;
        if (d < h * 0.2) dx = dy = 0;
        else if (d < h * 0.8) { dx *= d / (h * 0.8); dy *= d / (h * 0.8); }
      } else if (route && route.length) {
        let [x, y] = route[0];
        dx = x - me.x; dy = y - me.y;
        if (Math.hypot(dx, dy) < 3 * rules.sizes.s) {
          route.shift();
          if (route.length) { [x, y] = route[0]; dx = x - me.x; dy = y - me.y; }
          else {
            route = null; dx = dy = 0;
            if (aim) { const a = aim; aim = null; const t = nearest(); if (t && t.ref === a.ref) useNear(); }
          }
        }
        last = !!route && route.length === 1;
      }
      const want = Math.hypot(dx, dy), h = rules.sizes.h;
      const runBoost = 1 + 0.5 * clamp((me.run - 0.8) / 0.8, 0, 1);
      const speed = (map.pace > 0 ? map.pace : 1.7) * h * runBoost;
      let tvx = 0, tvy = 0;
      if (want > 0) { const v = last ? Math.min(speed, want * 9) : speed; tvx = (dx / want) * v; tvy = (dy / want) * v; }
      const ease = 1 - Math.exp(-dt / ((want > 0 ? 0.12 : 0.1) / 3));
      me.vx += (tvx - me.vx) * ease; me.vy += (tvy - me.vy) * ease;
      if (!want && Math.hypot(me.vx, me.vy) < 2) me.vx = me.vy = 0;
      const mx = me.vx * dt, my = me.vy * dt, ox = me.x, oy = me.y, ok = rules.stand;
      if (mx || my) {
        if (ok(me.x + mx, me.y + my)) { me.x += mx; me.y += my; }
        else if (mx && ok(me.x + mx, me.y)) { me.x += mx; me.vy = 0; }
        else if (my && ok(me.x, me.y + my)) { me.y += my; me.vx = 0; }
        else if (dirs.size || steering) {
          // a corner: step sideways round it, as Envoi's field does
          const u = speed * dt, len = Math.hypot(mx, my) || 1, ux = mx / len, uy = my / len;
          found: for (let off = 2 * rules.sizes.s; off <= rules.sizes.side; off += 2 * rules.sizes.s) for (const sgn of [1, -1]) {
            const px = -uy * sgn, py = ux * sgn;
            if (ok(me.x + px * off + mx, me.y + py * off + my) && ok(me.x + px * u, me.y + py * u)) { me.x += px * u; me.y += py * u; break found; }
          }
        }
      }
      const moved = Math.hypot(me.x - ox, me.y - oy);
      me.moving = moved > 0.02;
      if (want > 0) {
        const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
        if (d !== me.dir) me.turn = dx === 0 ? (d === 'n' ? -1 : 1) : Math.sign(dx);
        me.dir = d;
      }
      me.turn *= Math.exp(-dt / 0.11);
      me.lean = speed > 0 ? clamp(me.vx / speed, -1, 1) : 0;
      if (me.moving) { me.walkT += dt * runBoost; me.walk += moved / h; me.run += dt; me.blocked = 0; }
      else { me.walkT = 0; me.run = 0; if (want > 0) { me.blocked += dt; if (route && me.blocked > 0.25) { route = null; aim = null; } } }
      // ways out, then story areas
      let inside = null;
      for (const e of map.exits || []) if (Array.isArray(e.rect) && inRect(e.rect, me.x, me.y, rules.sizes.exitPad)) { inside = e; break; }
      if (inside) { if (inExit !== inside) { inExit = inside; leaveBy(inside); } return; }
      inExit = null;
      let story = null;
      for (const s of map.spots || []) if (Array.isArray(s.rect) && inRect(s.rect, me.x, me.y, 0)) { story = s; break; }
      if (story && story !== inStory) note((story.label || story.id || 'A story area') + (story.note ? ': ' + story.note : ' starts here.'));
      inStory = story;
    }

    // drawing
    function frame(now) {
      if (stopped) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!map || box.hidden) return;
      if (!busy) step(dt);
      draw(now);
    }
    let last = performance.now();

    function draw(now) {
      const r = dpr(), W = cv.width / r, H = cv.height / r, [MW, MH] = sizeOf(map), z0 = rules.sizes.h;
      cam.z = (0.15 * Math.min(W, H) / z0) * zoomBy * ((map.zoom > 0 ? map.zoom : 0.7) / 0.7);
      cam.z = Math.max(cam.z, W / MW, H / MH);
      const vw = W / cam.z, vh = H / cam.z;
      cam.x = vw >= MW ? (MW - vw) / 2 : clamp(me.x - vw / 2, 0, MW - vw);
      cam.y = vh >= MH ? (MH - vh) / 2 : clamp(me.y - vh * 0.55, 0, MH - vh);
      g.setTransform(r, 0, 0, r, 0, 0);
      g.fillStyle = '#0b0912';
      g.fillRect(0, 0, W, H);
      const sx = (x) => (x - cam.x) * cam.z, sy = (y) => (y - cam.y) * cam.z;
      const k = pic ? pic.naturalWidth / MW : 1, kh = pic ? pic.naturalHeight / MH : 1;
      if (pic) {
        g.imageSmoothingEnabled = cam.z * k < 2.5;
        g.imageSmoothingQuality = 'high';
        g.drawImage(pic, cam.x * k, cam.y * kh, vw * k, vh * kh, 0, 0, W, H);
      } else {
        g.fillStyle = '#16122c';
        g.fillRect(sx(0), sy(0), MW * cam.z, MH * cam.z);
      }
      if (showPaths) drawPaths(sx, sy);
      // a soft glow on things she can use
      const pulse = 0.5 + 0.5 * Math.sin(now / 300);
      for (const t of things()) {
        if (t.kind === 'person') continue;
        const x = sx(t.x), y = sy(t.y) - 6, rad = (6 + pulse * 3) * 2.4;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,240,200,0.8)');
        gr.addColorStop(1, 'rgba(255,240,200,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      }
      // the world map's places (under everyone: she walks in front of their banners)
      if (map.kind === 'world') drawPlaces(sx, sy);
      // people, her and the fronts, back to front
      const scale = (cam.z * z0) / 42;
      const list = [];
      for (const p of map.people || []) if (isPt(p.at) && !p.hidden) list.push({ y: p.at[1], x: p.at[0], sheet: sheetFor(p.look || 'hooded'), dir: p._face || p.face0 || 's', step: 0 });
      const doll = painted();
      if (doll && doll.loaded) list.push({ y: me.y, x: me.x, doll });
      else list.push({ y: me.y, x: me.x, sheet: sheetFor(opts.walker === 'io-painted' ? 'io' : opts.walker || 'io'), dir: me.dir, step: me.moving ? [1, 0, 2, 0][Math.floor(me.walkT / 0.1) % 4] : 0 });
      for (const f of map.front || []) if (f && Array.isArray(f.pts) && f.pts.length >= 3) list.push({ y: Number.isFinite(f.base) ? f.base : bboxOf(f.pts)[3], front: f });
      list.sort((a, b) => a.y - b.y);
      for (const it of list) {
        if (it.front) { drawFront(it.front, k, kh, vw, vh); continue; }
        const x = sx(it.x), y = sy(it.y);
        if (it.doll) {
          it.doll.draw(g, x, y, (cam.z * z0) / it.doll.h, { dir: me.dir, walk: me.walk, moving: me.moving, t: now / 1000, lean: me.lean, turn: me.turn });
          continue;
        }
        g.fillStyle = 'rgba(0,0,0,0.38)';
        g.beginPath(); g.ellipse(x, y - scale, 9 * scale, 2.6 * scale, 0, 0, Math.PI * 2); g.fill();
        if (!it.sheet) continue;
        const [fx, fy] = it.sheet.frame(it.dir, it.step);
        g.imageSmoothingEnabled = false;
        g.drawImage(it.sheet.canvas, fx, fy, it.sheet.w, it.sheet.h, Math.round((x - it.sheet.foot[0] * scale) * r) / r, Math.round((y - (it.sheet.foot[1] + 1) * scale) * r) / r, it.sheet.w * scale, it.sheet.h * scale);
      }
      const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(5,3,14,0)');
      vg.addColorStop(1, 'rgba(5,3,14,0.45)');
      g.fillStyle = vg;
      g.fillRect(0, 0, W, H);
      if (fadeIn > 0) { g.fillStyle = 'rgba(5,3,14,' + fadeIn.toFixed(3) + ')'; g.fillRect(0, 0, W, H); fadeIn = Math.max(0, fadeIn - 0.06); }
      const t = busy || !talk.hidden ? null : nearest();
      if (t) { act.hidden = false; if (act.textContent !== t.label) act.textContent = t.label; } else act.hidden = true;
      drawMini(vw, vh, now);
    }
    function drawFront(f, k, kh, vw, vh) {
      const b = f._bb || (f._bb = bboxOf(f.pts));
      if (b[2] < cam.x || b[0] > cam.x + vw || b[3] < cam.y || b[1] > cam.y + vh || !pic) return;
      g.save();
      g.beginPath();
      f.pts.forEach(([x, y], i) => { const X = (x - cam.x) * cam.z, Y = (y - cam.y) * cam.z; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
      g.closePath();
      g.clip();
      g.imageSmoothingEnabled = cam.z * k < 2.5;
      g.drawImage(pic, b[0] * k, b[1] * kh, (b[2] - b[0]) * k, (b[3] - b[1]) * kh, (b[0] - cam.x) * cam.z, (b[1] - cam.y) * cam.z, (b[2] - b[0]) * cam.z, (b[3] - b[1]) * cam.z);
      g.restore();
    }
    // each place on the world map: a gold mark and its name on a banner under it (gold when she is
    // close), where she doesn't hide it when she stands on the mark
    function drawPlaces(sx, sy) {
      const near = nearest();
      g.font = 'italic 15px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
      for (const p of map.places || []) {
        if (!isPt(p.at)) continue;
        const x = sx(p.at[0]), y = sy(p.at[1]), hot = near && near.ref === p, name = p.name || p.id || '';
        g.fillStyle = '#1a0c1d'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = hot ? '#ffd66e' : '#e2bd67'; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
        const w = g.measureText(name).width + 20, bx = x - w / 2, by = y + 12;
        g.fillStyle = hot ? 'rgba(120,70,20,0.92)' : 'rgba(24,12,30,0.84)';
        g.strokeStyle = hot ? '#ffd66e' : 'rgba(236,220,184,0.75)';
        g.lineWidth = 1;
        g.beginPath();
        if (g.roundRect) g.roundRect(bx, by, w, 24, 12); else g.rect(bx, by, w, 24);
        g.fill(); g.stroke();
        g.fillStyle = '#ffe6b0';
        g.fillText(name, bx + 10, by + 17);
      }
    }
    function drawPaths(sx, sy) {
      const shape = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(sx(x), sy(y)) : g.moveTo(sx(x), sy(y)))); g.closePath(); };
      g.lineWidth = 1.5;
      g.fillStyle = 'rgba(90,255,150,0.2)'; g.strokeStyle = 'rgba(90,255,150,0.85)';
      for (const p of map.walk || []) if (p.length >= 3) { shape(p); g.fill(); g.stroke(); }
      g.fillStyle = 'rgba(255,80,90,0.3)'; g.strokeStyle = 'rgba(255,80,90,0.9)';
      for (const p of map.block || []) if (p.length >= 3) { shape(p); g.fill(); g.stroke(); }
      g.strokeStyle = 'rgba(110,170,255,0.95)'; g.lineWidth = 2;
      for (const e of map.exits || []) if (Array.isArray(e.rect)) { const q = e.rect; g.strokeRect(sx(q[0]), sy(q[1]), (q[2] - q[0]) * cam.z, (q[3] - q[1]) * cam.z); }
    }
    function drawMini(vw, vh, now) {
      const r = dpr(), rc = mini.getBoundingClientRect(), [MW, MH] = sizeOf(map);
      const w = Math.round(rc.width * r), h = Math.round((w * MH) / MW);
      if (!w) return;
      if (mini.width !== w || mini.height !== h) { mini.width = w; mini.height = h; }
      const k = w / MW;
      mg.fillStyle = '#16122c';
      mg.fillRect(0, 0, w, h);
      if (pic) { mg.imageSmoothingEnabled = true; mg.drawImage(pic, 0, 0, pic.naturalWidth, pic.naturalHeight, 0, 0, w, h); }
      mg.fillStyle = 'rgba(5,3,14,0.35)';
      mg.fillRect(0, 0, w, h);
      mg.lineWidth = Math.max(1, r);
      mg.strokeStyle = 'rgba(244,246,255,.85)';
      mg.strokeRect(Math.max(0, cam.x) * k, Math.max(0, cam.y) * k, Math.min(vw, MW) * k, Math.min(vh, MH) * k);
      mg.fillStyle = 'rgba(120,180,255,.9)';
      for (const e of map.exits || []) if (Array.isArray(e.rect)) mg.fillRect(e.rect[0] * k - r, e.rect[1] * k - r, Math.max(3 * r, (e.rect[2] - e.rect[0]) * k), Math.max(3 * r, (e.rect[3] - e.rect[1]) * k));
      mg.fillStyle = '#ffd36e';
      for (const p of map.people || []) if (isPt(p.at)) { mg.beginPath(); mg.arc(p.at[0] * k, p.at[1] * k, 2 * r, 0, Math.PI * 2); mg.fill(); }
      if (map.kind === 'world') for (const p of map.places || []) if (isPt(p.at)) { mg.fillStyle = '#e2bd67'; mg.fillRect(p.at[0] * k - 2.5 * r, p.at[1] * k - 2.5 * r, 5 * r, 5 * r); }
      const pu = 0.5 + 0.5 * Math.sin(now / 180);
      mg.fillStyle = '#1a0c1d';
      mg.beginPath(); mg.arc(me.x * k, me.y * k, (3.4 + pu) * r, 0, Math.PI * 2); mg.fill();
      mg.fillStyle = '#ff5fb2';
      mg.beginPath(); mg.arc(me.x * k, me.y * k, (2.2 + pu) * r, 0, Math.PI * 2); mg.fill();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    requestAnimationFrame(frame);

    return {
      root: box,
      me,
      load,
      get mapId() { return mapId; },
      get map() { return map; },
      get busy() { return busy; },
      get cam() { return { z: cam.z, x: cam.x, y: cam.y }; },
      // who is drawn walking: 'io-painted' once her pictures are in, else the pixel look
      get drawn() { const d = painted(); return d && d.loaded ? 'io-painted' : opts.walker === 'io-painted' ? 'io' : opts.walker || 'io'; },
      setShowPaths(on) { showPaths = !!on; },
      setWalker(look) { opts.walker = look; },
      tune(id, o) { const m = maps[id]; if (!m) return; if (o.zoom !== undefined) m.zoom = o.zoom; if (o.pace !== undefined) m.pace = o.pace; },
      walkTo(x, y) { route = findPath(G, [me.x, me.y], [x, y]); },
      say,
      note,
      stop() {
        stopped = true;
        ro.disconnect();
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        box.remove();
      },
    };
  }

  // A whole walk-around page: the maps, someone to walk them, a list of the maps to jump between.
  function play(host, data) {
    const maps = data.maps || {}, ids = Object.keys(maps);
    if (!ids.length) { host.textContent = 'There are no maps in this page.'; return null; }
    let list = null;
    const field = create(host, {
      maps,
      walker: data.walker || 'io-painted',
      showPaths: !!data.showPaths,
      menuLabel: '☰ Maps',
      onMenu: () => toggleList(),
      onEscape: () => toggleList(false),
    });
    function toggleList(on) {
      if (on === undefined) on = !list;
      if (list) { list.remove(); list = null; }
      if (!on) return;
      list = el('div', { class: 'wpe-talk wpe-win', role: 'dialog', 'aria-label': 'Maps' }, field.root);
      el('h3', null, list, 'Go to a map');
      for (const id of ids) {
        const b = el('button', { type: 'button', style: 'display:block;width:100%;margin:6px 0;min-height:40px;border-radius:8px;border:1px solid rgba(214,222,255,.5);background:rgba(10,12,34,.45);color:#f4f6ff;text-align:left;padding:0 12px' }, list, maps[id].name || id);
        b.addEventListener('click', (e) => { e.stopPropagation(); toggleList(false); field.load(id, null, 's'); });
      }
      list.addEventListener('click', () => toggleList(false));
    }
    field.load(data.first && maps[data.first] ? data.first : ids[0], null, 's');
    return field;
  }

  // the painted Io is made once, and her pictures load while the rest gets ready
  let doll = null;
  const paintedIo = () => {
    if (!doll && typeof root.makePaintedIo === 'function') { try { doll = root.makePaintedIo((u) => u); } catch { doll = null; } }
    return doll;
  };

  root.WalkingPathsEngine = {
    create,
    play,
    rules: { sizes, standTest, grid, reach, findPath, inPoly, bboxOf },
    looks: () => (typeof root.makePaintedIo === 'function' ? ['io-painted'] : []).concat(['io'], Object.keys(root.FOLK_LOOKS || {})),
  };
})(typeof window !== 'undefined' ? window : globalThis);
