// Files in and out: adding pictures, opening maps files, and everything the page can save. In a
// Claude artifact the viewer saves files for the page (its "downloads"); anywhere else a file is
// an ordinary download.

import { S, map, mapSize, changed, remember, emit } from './state.js';
import { fileMap, pictureFileName, readMapsFile, attachPictures, takeMaps, mapFromPicture, addMap, resizeMap, keepNow } from './project.js';
import { pictureBlob, pictureImage, whenReady, measure, addPicture } from './pictures.js';
import { $, prettyJson, blobToDataURL, stamp, plural, sizeText, slug } from './util.js';
import { ask, status } from './panel.js';
import { bbox } from './geom.js';
import * as ed from './editor.js';

export const ABOUT = 'Maps made with Walking Paths. Each map: src is its picture; size is the map in pixels, and every point is [x, y] in those pixels from the top left. ' +
  'walk: shapes where feet can go. block: shapes cut out of them. front: pieces of the picture ({pts, base}) drawn over anyone whose feet are above the base line y. ' +
  'exits: ways out, {rect: [left, top, right, bottom], to: the map they lead to, at: where she arrives there, label}. people: {id, name, at, look, face0 (s, w, e or n), says}. ' +
  'spots: things to look at ({kind, label, note, at}) and story areas ({kind, id, label, note, rect}). start: where a walk starts. ' +
  'walker: how tall people are in pixels. Someone can stand at a point when it, and the points walker x 6/52 to its left and right, are inside a walk area and outside every block. ' +
  'These are the rules of the field in Envoi on the Longest Night (src/game/field.js).';

// ---------------------------------------------------------------------------------------------
// saving

let downloads = null;
export function lookForDownloads() {
  try {
    if (window.claude && typeof window.claude.use === 'function') downloads = window.claude.use('downloads').catch(() => null);
  } catch { downloads = null; }
}
const inViewer = () => !!(window.claude && typeof window.claude.use === 'function');

// { ok } or { ok: false, why }
export async function saveFile(name, data, type) {
  if (inViewer()) {
    const d = downloads ? await downloads : null;
    if (!d) return { ok: false, why: 'This page can’t save files here. Open it from the Walking-Paths.html file instead, or copy the map data.' };
    try { await d.save({ filename: name, data }); return { ok: true }; }
    catch (e) {
      const code = e && e.code;
      if (code === 'declined') return { ok: false, why: 'Not saved.' };
      if (code === 'rate_limited') return { ok: false, why: 'Another save is waiting for an answer. Try again in a moment.' };
      if (code === 'too_large') return { ok: false, why: 'The file is too big to save here.' };
      if (code === 'rejected_extension' || code === 'extension_not_enabled') return { ok: false, why: 'This kind of file can’t be saved here.' };
      return { ok: false, why: 'Saving isn’t working here (' + (code || 'unknown') + ').' };
    }
  }
  const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { ok: true };
}

async function saving(what, make) {
  status(what + '…');
  try {
    const { name, data, type, say } = await make();
    const r = await saveFile(name, data, type);
    if (r.ok) status('Saved ' + name + ' (' + sizeText(data.size || new Blob([data]).size) + ').' + (say ? ' ' + say : ''), 'good');
    else status(r.why, 'bad');
  } catch (e) {
    status('Couldn’t make the file: ' + (e && e.message ? e.message : e), 'bad');
  }
}

// every map, in the maps file's shape; pictures inside as data addresses, or by file name
async function mapsData(withPictures) {
  const maps = {};
  for (const id of S.order) {
    const m = S.maps[id];
    let src = m.wantPicture || '';
    if (m.pic) {
      if (withPictures) { const b = pictureBlob(m.pic.key); src = b ? await blobToDataURL(b) : ''; }
      else src = pictureFileName(id);
    }
    maps[id] = fileMap(m, src);
  }
  return { format: 'walking-paths', version: 1, about: ABOUT, savedAt: new Date().toISOString(), maps };
}

const setName = () => {
  const names = S.order.map((id) => slug(S.maps[id].name)).filter(Boolean);
  return (names.slice(0, 2).join('-') || 'maps') + (names.length > 2 ? '-and-' + (names.length - 2) + '-more' : '');
};

export const saveMapsFile = () => saving('Making the maps file', async () => {
  const text = prettyJson(await mapsData(true)) + '\n';
  return { name: setName() + '-' + stamp() + '.json', data: new Blob([text], { type: 'application/json' }), say: 'Open it here again with “Open a maps file”.' };
});

export const saveDataOnly = () => saving('Making the map data', async () => {
  const text = prettyJson(await mapsData(false)) + '\n';
  const pics = S.order.map(pictureFileName).filter(Boolean);
  return { name: setName() + '-data-' + stamp() + '.json', data: new Blob([text], { type: 'application/json' }), say: pics.length ? 'The pictures aren’t inside: keep them beside it named ' + pics.join(', ') + '.' : '' };
});

export async function copyData() {
  const text = prettyJson(await mapsData(false)) + '\n', box = $('wp-copybox');
  const fallback = () => {
    box.hidden = false;
    box.value = text;
    box.focus();
    box.select();
    status('This page can’t copy by itself here. The map data is in the box below, already picked: press Ctrl+C (⌘C on a Mac) to copy it.');
  };
  try {
    await navigator.clipboard.writeText(text);
    box.hidden = true;
    status('Copied the map data of ' + plural(S.order.length, 'map', 'maps') + ' (without the pictures). Paste it to Claude.', 'good');
  } catch { fallback(); }
}

// a picture of the map with everything drawn on it, as big as the picture
export const savePicture = () => saving('Drawing the picture', async () => {
  const id = S.cur, m = map(), [W, H] = mapSize(m);
  const img = m.pic ? await whenReady(m.pic.key) : null;
  const k = img ? Math.min(img.naturalWidth / W, 4096 / W) : Math.min(1, 2048 / W);
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * k);
  cv.height = Math.round(H * k);
  const g = cv.getContext('2d'), u = Math.max(1, Math.min(cv.width, cv.height) / 700);
  g.fillStyle = '#16122c';
  g.fillRect(0, 0, cv.width, cv.height);
  if (img) g.drawImage(img, 0, 0, cv.width, cv.height);
  g.scale(k, k);
  const lw = u / k;
  const path = (pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  const paint = (list, fill, line, dash) => { for (const pts of list) { path(pts); g.fillStyle = fill; g.fill(); g.setLineDash(dash ? [6 * lw, 4 * lw] : []); g.lineWidth = 1.6 * lw; g.strokeStyle = line; g.stroke(); } g.setLineDash([]); };
  paint(m.walk, 'rgba(90,255,150,0.16)', 'rgba(90,255,150,0.95)');
  paint(m.block, 'rgba(255,90,100,0.28)', 'rgba(255,90,100,0.95)');
  paint(m.front.map((f) => f.pts), 'rgba(196,140,255,0.12)', 'rgba(196,140,255,0.95)', true);
  for (const f of m.front) { const b = bbox(f.pts); g.strokeStyle = 'rgba(196,140,255,0.95)'; g.lineWidth = 1.4 * lw; g.beginPath(); g.moveTo(b[0], f.base); g.lineTo(b[2] + 8 * lw, f.base); g.stroke(); }
  const labels = [];
  for (const e of m.exits) {
    const r = e.rect;
    g.fillStyle = 'rgba(110,170,255,0.3)'; g.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    g.lineWidth = 2 * lw; g.strokeStyle = '#6eaaff'; g.strokeRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    labels.push(['→ ' + (e.label || (S.maps[e.to] ? S.maps[e.to].name : e.to) || 'nowhere yet'), r[0], r[3] + 4 * lw, '#6eaaff']);
  }
  for (const s of m.spots) if (s.rect) {
    const r = s.rect;
    g.setLineDash([7 * lw, 5 * lw]); g.lineWidth = 1.6 * lw; g.strokeStyle = '#fff1a8'; g.strokeRect(r[0], r[1], r[2] - r[0], r[3] - r[1]); g.setLineDash([]);
    labels.push(['story: ' + (s.label || s.id || ''), r[0] + 4 * lw, r[1] + 4 * lw, '#fff1a8']);
  }
  const dot = (p, col, square) => {
    g.fillStyle = '#000'; g.beginPath(); if (square) g.rect(p[0] - 7 * lw, p[1] - 7 * lw, 14 * lw, 14 * lw); else g.arc(p[0], p[1], 7 * lw, 0, Math.PI * 2); g.fill();
    g.fillStyle = col; g.beginPath(); if (square) g.rect(p[0] - 5.5 * lw, p[1] - 5.5 * lw, 11 * lw, 11 * lw); else g.arc(p[0], p[1], 5.5 * lw, 0, Math.PI * 2); g.fill();
  };
  for (const p of m.people) { dot(p.at, '#ffd36e'); labels.push([p.name, p.at[0] + 10 * lw, p.at[1] - 8 * lw, '#ffd36e']); }
  for (const s of m.spots) if (!s.rect) { dot(s.at, '#ffb25e', true); labels.push([s.label || s.kind, s.at[0] + 10 * lw, s.at[1] - 8 * lw, '#ffb25e']); }
  g.lineWidth = 3 * lw; g.strokeStyle = '#000'; g.beginPath(); g.arc(m.start[0], m.start[1], 7 * lw, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2 * lw; g.strokeStyle = '#fff'; g.stroke();
  labels.push(['a walk starts here', m.start[0] + 10 * lw, m.start[1] - 8 * lw, '#ffffff']);
  g.font = '600 ' + 13 * lw + 'px system-ui, sans-serif';
  for (const [t, x, y, col] of labels) {
    if (!t) continue;
    const w = g.measureText(t).width;
    g.fillStyle = 'rgba(8,6,20,0.8)'; g.fillRect(x - 3 * lw, y - 1 * lw, w + 6 * lw, 17 * lw);
    g.fillStyle = col; g.fillText(t, x, y + 12 * lw);
  }
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  if (!blob) throw new Error('the picture was too big to draw');
  return { name: id + '-paths.png', data: blob };
});

// white where feet can go, black where they can't, the map's own size
export const saveMask = () => saving('Drawing the walk mask', async () => {
  const id = S.cur, m = map(), [W, H] = mapSize(m), cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  const fill = (list, col) => { g.fillStyle = col; for (const pts of list) { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); } };
  fill(m.walk, '#fff');
  fill(m.block, '#000');
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  if (!blob) throw new Error('the map was too big to draw');
  return { name: id + '-walk-mask.png', data: blob, say: 'White is where feet can go, black where they can’t, one pixel for every map pixel.' };
});

// one page that walks round every map, with nothing to load (it works in Mooncart too)
async function engineSource() {
  const parts = [];
  for (const id of ['wp-engine-sprites', 'wp-engine']) {
    const s = $(id);
    if (!s) throw new Error('the walk engine isn’t in this page');
    if (s.textContent.trim()) parts.push(s.textContent);
    else parts.push(await (await fetch(s.src)).text());
  }
  return parts.join('\n');
}
// (written so that this page's own script never holds the characters that open an HTML comment)
const COMMENT = String.fromCharCode(60, 33, 45, 45), OPEN_COMMENT = new RegExp(COMMENT, 'g');
const scriptSafe = (t) => t.replace(/<\/(script)/gi, '<\\/$1').replace(OPEN_COMMENT, '<\\u0021--');

export const saveWalkPage = () => saving('Making the walk-around page', async () => {
  const data = await mapsData(true);
  const first = S.maps[S.cur] ? S.cur : S.order[0];
  const names = S.order.map((id) => S.maps[id].name);
  const title = names[0] + (names.length > 1 ? ' and ' + plural(names.length - 1, 'more map', 'more maps') : '') + ' (a walk)';
  const play = { maps: data.maps, first, walker: S.walker, showPaths: false };
  const html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="color-scheme" content="dark">\n' +
    '<title>' + title.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;')) + '</title>\n' +
    '<style>html,body{margin:0;height:100%;background:#05030c}#walk{position:fixed;inset:0}</style>\n</head>\n<body>\n<div id="walk"></div>\n' +
    COMMENT + ' Made with Walking Paths: walk with the arrow keys, WASD or the arrows on the screen; Enter talks or looks; M lists the maps. --' + '>\n' +
    '<script>\n' + scriptSafe(await engineSource()) + '\n</script>\n' +
    '<script>\nWalkingPathsEngine.play(document.getElementById("walk"), ' + scriptSafe(JSON.stringify(play)) + ');\n</script>\n</body>\n</html>\n';
  return { name: slug(title) + '.html', data: new Blob([html], { type: 'text/html' }), say: 'Open it in a web browser, or add it to Mooncart, to walk round.' };
});

// ---------------------------------------------------------------------------------------------
// files coming in: pictures become maps, maps files are opened

const isPicture = (f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp|avif|gif|bmp|svg)$/i.test(f.name);
const isJson = (f) => /json/.test(f.type) || /\.json$/i.test(f.name);

export async function addPictures(files) {
  files = [...files].filter(isPicture);
  if (!files.length) return [];
  const ids = [], bad = [];
  status('Adding ' + plural(files.length, 'picture', 'pictures') + '…');
  for (const f of files) {
    const m = await mapFromPicture(f, f.name);
    if (!m) { bad.push(f.name || 'a picture'); continue; }
    ids.push(addMap(m));
  }
  if (ids.length) {
    ed.keepView();
    S.cur = ids[ids.length - 1];
    S.sel = null;
    S.draft = null;
    changed(ids.length === 1 ? 'Added ' + S.maps[S.cur].name + '. Now draw where feet can go: + Walk area.' : 'Added ' + ids.length + ' maps.');
    emit('maps');
    ed.showView();
  }
  status(bad.length ? 'This browser can’t show ' + bad.join(', ') + '.' : ids.length ? 'Added ' + plural(ids.length, 'map', 'maps') + '. They are kept in this browser; save the maps file to keep them for good.' : '', bad.length ? 'bad' : 'good');
  return ids;
}

export async function openFiles(files) {
  files = [...files];
  const jsons = files.filter(isJson), pictures = files.filter(isPicture);
  if (!jsons.length) return addPictures(pictures);
  let entries = [];
  for (const f of jsons) {
    try { entries = entries.concat(readMapsFile(await f.text())); }
    catch (e) { status('Couldn’t open ' + f.name + ': ' + e.message + '.', 'bad'); return []; }
  }
  status('Opening ' + plural(entries.length, 'map', 'maps') + '…');
  const { missing, used } = await attachPictures(entries, pictures);
  const onlyExamples = S.order.every((id) => S.maps[id].example);
  let replace = onlyExamples;
  if (!onlyExamples) {
    const n = S.order.length;
    const choice = await ask('Open ' + plural(entries.length, 'map', 'maps'),
      'You have ' + plural(n, 'map', 'maps') + ' here already. Put the ones from the file beside them, or open only the file’s maps? (Undo brings the ones here back.)',
      [{ label: 'Put them beside these', value: 'add' }, { label: 'Only the file’s maps', value: 'replace' }, { label: 'Cancel', value: null }]);
    if (!choice) { status('Nothing opened.'); return []; }
    replace = choice === 'replace';
  }
  ed.keepView();
  const ids = takeMaps(entries, replace);
  changed('Opened ' + plural(ids.length, 'map', 'maps') + '.');
  emit('maps');
  ed.showView();
  const rest = pictures.filter((p) => !used.has(p));
  if (rest.length) await addPictures(rest);
  status('Opened ' + plural(ids.length, 'map', 'maps') + '.' + (missing ? ' ' + plural(missing, 'picture wasn’t', 'pictures weren’t') + ' with the file: pick the map, then Add its picture.' : ''), missing ? 'bad' : 'good');
  keepNow();
  return ids;
}

// a new picture for the current map
export async function replacePicture(file) {
  const id = S.cur, m = map();
  if (!m || !file) return;
  const size = await measure(file);
  if (!size) { status('This browser can’t show ' + file.name + '.', 'bad'); return; }
  const [W, H] = mapSize(m), same = Math.abs(size.w / size.h - W / H) < 0.02;
  let stretch = false;
  if (!same && (m.walk.length || m.block.length || m.front.length || m.exits.length)) {
    const c = await ask('A different shape of picture', 'The new picture is ' + size.w + ' × ' + size.h + ' and the map is ' + W + ' × ' + H + '. Stretch everything drawn on the map to the new picture’s shape, or leave it where it is (the picture is stretched to the map)?',
      [{ label: 'Stretch what is drawn', value: 'stretch' }, { label: 'Leave it where it is', value: 'leave' }, { label: 'Cancel', value: null }]);
    if (!c) return;
    stretch = c === 'stretch';
  } else if (!same) stretch = true;
  const key = await addPicture(file);
  remember([id, ...S.order.filter((k) => S.maps[k].exits.some((e) => e.to === id))]);
  m.pic = { key, type: file.type || '', file: file.name || '', w: size.w, h: size.h };
  delete m.wantPicture;
  if (stretch) resizeMap(id, W, Math.round((W * size.h) / size.w));
  pictureImage(key, ed.draw);
  changed('New picture for ' + m.name + '.');
  emit('maps');
  if (stretch) ed.fit();
}
