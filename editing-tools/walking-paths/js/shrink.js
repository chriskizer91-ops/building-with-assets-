// Picture size: smaller copies of a map's picture (fewer pixels, the same map), compared the way the
// Magpie map's sizes were: each size with its file size, how much of the detail it keeps (SSIM
// against the original, over a few close-up patches) and how much graphics memory it takes.
// The map keeps its size in map pixels, so nothing drawn on it moves.

import { S, remember, changed, emit } from './state.js';
import { whenReady, pictureBlob, addPicture } from './pictures.js';
import { mapName } from './project.js';
import { $, el, plural, sizeText, extFor } from './util.js';

export const SIZES = [100, 83, 75, 67, 50];
// the longest side a big picture keeps when it is made smaller as it is added
export const BIG_SIDE = 3072;

// the best format this browser can write (it can't write AVIF; WebP where it can, else JPEG)
let format = null;
export async function bestFormat() {
  if (format) return format;
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const b = await new Promise((r) => c.toBlob(r, 'image/webp', 0.8));
  format = b && b.type === 'image/webp' ? { type: 'image/webp', name: 'WebP', q: 0.82 } : { type: 'image/jpeg', name: 'JPEG', q: 0.86 };
  return format;
}

const memoryMB = (w, h) => Math.round((w * h * 4 * 4) / 3 / 1e6);

// a copy of `img` at pct% in the best format: { pct, w, h, blob }
export async function makeVersion(img, pct) {
  const f = await bestFormat();
  const w = Math.max(1, Math.round((img.naturalWidth * pct) / 100)), h = Math.max(1, Math.round((img.naturalHeight * pct) / 100));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  const blob = await new Promise((r) => c.toBlob(r, f.type, f.q));
  if (!blob) throw new Error('this browser couldn’t make the smaller picture');
  return { pct, w, h, blob, type: f.type, fmt: f.name };
}

// Detail kept: the mean SSIM of the version (scaled back up) against the original, over the four
// busiest patches of a 4 x 4 grid (busy = the most variation; flat sky says nothing about detail).
const PATCH = 160;
function grey(img, sx, sy, sw, sh, out) {
  const c = document.createElement('canvas');
  c.width = out;
  c.height = out;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, sx, sy, sw, sh, 0, 0, out, out);
  const d = g.getImageData(0, 0, out, out).data, y = new Float32Array(out * out);
  for (let i = 0; i < y.length; i++) y[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  return y;
}
function ssim(a, b, n) {
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2, B = 8;
  let sum = 0, count = 0;
  for (let by = 0; by + B <= n; by += B) for (let bx = 0; bx + B <= n; bx += B) {
    let ma = 0, mb = 0;
    for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) { ma += a[y * n + x]; mb += b[y * n + x]; }
    ma /= B * B; mb /= B * B;
    let va = 0, vb = 0, cov = 0;
    for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) {
      const da = a[y * n + x] - ma, db = b[y * n + x] - mb;
      va += da * da; vb += db * db; cov += da * db;
    }
    va /= B * B - 1; vb /= B * B - 1; cov /= B * B - 1;
    sum += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
    count++;
  }
  return count ? sum / count : 1;
}
function busiest(img) {
  const W = img.naturalWidth, H = img.naturalHeight, side = Math.min(PATCH, W, H), out = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const x = Math.round(((W - side) * (i + 0.5)) / 4), y = Math.round(((H - side) * (j + 0.5)) / 4);
    const p = grey(img, x, y, side, side, 32);
    let m = 0, v = 0;
    for (const q of p) m += q;
    m /= p.length;
    for (const q of p) v += (q - m) ** 2;
    out.push({ x, y, side, v });
  }
  return out.sort((a, b) => b.v - a.v).slice(0, 4);
}
async function detailKept(orig, blob, patches) {
  const url = URL.createObjectURL(blob), img = new Image();
  await new Promise((r) => { img.onload = r; img.onerror = r; img.src = url; });
  let sum = 0;
  for (const p of patches) {
    const n = Math.min(p.side, PATCH);
    const a = grey(orig, p.x, p.y, p.side, p.side, n);
    const k = img.naturalWidth / orig.naturalWidth;
    const b = grey(img, p.x * k, p.y * k, p.side * k, p.side * k, n);
    sum += ssim(a, b, n);
  }
  URL.revokeObjectURL(url);
  return Math.max(0, Math.min(1, sum / patches.length));
}

// ---------------------------------------------------------------------------------------------
// the dialog

const UI = { id: null, img: null, versions: [], pick: 'orig', view: 'whole', hold: false, run: 0 };

export async function openShrink(id) {
  const m = S.maps[id];
  if (!m || !m.pic) return;
  UI.id = id;
  UI.versions = [];
  UI.pick = 'orig';
  UI.view = 'whole';
  UI.hold = false;
  const run = ++UI.run;
  $('wp-shrink-title').textContent = 'Picture size: ' + m.name;
  $('wp-shrink-all').checked = false;
  $('wp-shrink-all').parentElement.hidden = S.order.filter((k) => S.maps[k].pic).length < 2;
  $('wp-shrink-status').textContent = '';
  $('wp-shrink').hidden = false;
  const img = await whenReady(m.pic.key);
  if (run !== UI.run) return;
  if (!img) { $('wp-shrink-status').textContent = 'This picture won’t open in this browser.'; return; }
  UI.img = img;
  const blob = pictureBlob(m.pic.key);
  UI.versions.push({ key: 'orig', name: 'Original', w: img.naturalWidth, h: img.naturalHeight, bytes: blob ? blob.size : 0, fmt: (extFor(m.pic.type, m.pic.file) || '').toUpperCase(), detail: 1, img });
  cards();
  paint();
  // the smaller sizes, one after the other (each shows as soon as it is ready)
  const f = await bestFormat();
  const patches = busiest(img);
  for (const pct of SIZES) {
    if (run !== UI.run) return;
    $('wp-shrink-status').textContent = 'Making the ' + pct + '% size (' + f.name + ')…';
    await new Promise((r) => setTimeout(r, 0));
    try {
      const v = await makeVersion(img, pct);
      const detail = await detailKept(img, v.blob, patches);
      const vimg = new Image();
      vimg.src = URL.createObjectURL(v.blob);
      await new Promise((r) => { vimg.onload = r; vimg.onerror = r; });
      if (run !== UI.run) { URL.revokeObjectURL(vimg.src); return; }
      UI.versions.push({ key: String(pct), name: pct + '%', pct, w: v.w, h: v.h, bytes: v.blob.size, fmt: v.fmt, detail, blob: v.blob, type: v.type, img: vimg });
      // a good start: 67%, when that saves a good part of the file
      if (pct === 67 && UI.pick === 'orig' && v.blob.size < UI.versions[0].bytes * 0.75) UI.pick = '67';
      cards();
      paint();
    } catch (e) {
      $('wp-shrink-status').textContent = 'Couldn’t make the ' + pct + '% size: ' + (e && e.message ? e.message : e);
      return;
    }
  }
  if (run !== UI.run) return;
  const orig = UI.versions[0].bytes, least = Math.min(...UI.versions.slice(1).map((v) => v.bytes));
  $('wp-shrink-status').textContent = least >= orig ? 'This picture is already small: none of these sizes would save anything.'
    : least > orig * 0.75 ? 'This picture is already packed small (' + UI.versions[0].fmt + '): the smaller sizes save little.' : 'Pick a size.';
}

function cards() {
  const box = $('wp-shrink-options'), orig = UI.versions[0];
  box.textContent = '';
  for (const v of UI.versions) {
    const b = el('button', { type: 'button', class: 'wp-size', 'aria-pressed': v.key === UI.pick ? 'true' : 'false', 'data-size': v.key }, box);
    el('b', null, b, v.name);
    el('span', { class: 'wp-small', style: 'margin:0' }, b, v.w + ' × ' + v.h + ' · ' + v.fmt);
    el('span', { class: 'mb' }, b, sizeText(v.bytes));
    const meter = el('span', { class: 'meter', 'aria-hidden': 'true' }, b);
    el('i', { style: 'width:' + Math.min(100, (v.bytes / Math.max(1, orig.bytes)) * 100).toFixed(1) + '%' }, meter);
    // (the label's second word goes on a phone, where the cards are narrow)
    const row = (a, c) => { const r = el('small', null, b), l = el('span', null, r, [].concat(a)[0]); if (Array.isArray(a)) el('i', { class: 'wide' }, l, a[1]); el('span', null, r, c); };
    row(['Detail', ' kept'], Math.round(v.detail * 100) + '%');
    row('Memory', memoryMB(v.w, v.h) + ' MB');
    b.addEventListener('click', () => { UI.pick = v.key; cards(); paint(); });
  }
  const left = SIZES.length - (UI.versions.length - 1);
  for (let i = 0; i < left; i++) el('div', { class: 'wp-size', 'aria-hidden': 'true', style: 'opacity:.35' }, box, '…');
  $('wp-shrink-use').disabled = UI.pick === 'orig';
}

function paint() {
  const cv = $('wp-shrink-cv'), r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  const g = cv.getContext('2d');
  g.fillStyle = '#05030a';
  g.fillRect(0, 0, cv.width, cv.height);
  const orig = UI.versions[0];
  if (!orig) return;
  const v = UI.hold ? orig : UI.versions.find((x) => x.key === UI.pick) || orig;
  const W = orig.w, H = orig.h, k = v.img.naturalWidth / W;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  if (UI.view === 'whole') {
    const z = Math.min(cv.width / W, cv.height / H), dw = W * z, dh = H * z;
    g.drawImage(v.img, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh);
  } else {
    // close up: round where a walk starts, the original's pixels twice as big as the screen's
    const m = S.maps[UI.id], [MW, MH] = m.size, z = 2 * dpr;
    const cx = (m.start[0] / MW) * W, cy = (m.start[1] / MH) * H, sw = cv.width / z, sh = cv.height / z;
    const x0 = Math.max(0, Math.min(W - sw, cx - sw / 2)), y0 = Math.max(0, Math.min(H - sh, cy - sh / 2));
    g.drawImage(v.img, x0 * k, y0 * k, sw * k, sh * k, 0, 0, cv.width, cv.height);
  }
  $('wp-shrink-label').innerHTML = '<b>' + v.name + '</b> · ' + v.w + ' × ' + v.h + ' · ' + v.fmt + ' · ' + sizeText(v.bytes) + (UI.hold ? ' (holding)' : '');
}

export function closeShrink() {
  UI.run++;
  $('wp-shrink').hidden = true;
  for (const v of UI.versions) if (v.blob && v.img) URL.revokeObjectURL(v.img.src);
  UI.versions = [];
}

// swap a map's picture for a smaller one (its map size stays; the caller keeps the undo step),
// ready to draw when this returns
async function swapPicture(id, blob, type, w, h) {
  const m = S.maps[id], key = await addPicture(blob);
  m.pic = { key, type, file: id + '.' + extFor(type), w, h };
  delete m.wantPicture;
  await whenReady(key);
}

async function useIt() {
  const pick = UI.versions.find((v) => v.key === UI.pick);
  if (!pick || pick.key === 'orig') return;
  const all = $('wp-shrink-all').checked, id = UI.id, mapNow = S.maps[id];
  const ids = all ? S.order.filter((k) => S.maps[k].pic) : [id];
  $('wp-shrink-use').disabled = true;
  // the other maps' pictures are made first (nothing changes until they are all ready)
  const made = [[id, { blob: pick.blob, type: pick.type, w: pick.w, h: pick.h }]];
  try {
    for (const k of ids) {
      if (k === id) continue;
      const m = S.maps[k], before = pictureBlob(m.pic.key);
      $('wp-shrink-status').textContent = 'Making ' + mapName(k) + '’s picture ' + pick.pct + '%…';
      const img = await whenReady(m.pic.key);
      if (!img || !UI.versions.length) continue;
      const v = await makeVersion(img, pick.pct);
      if (before && v.blob.size >= before.size) continue; // no smaller: left as it was
      made.push([k, v]);
    }
  } catch (e) {
    $('wp-shrink-status').textContent = 'Couldn’t make the smaller pictures: ' + (e && e.message ? e.message : e);
    $('wp-shrink-use').disabled = false;
    return;
  }
  if (!UI.versions.length || S.maps[id] !== mapNow) return; // closed, or the map went, meanwhile
  remember(made.map(([k]) => k));
  let saved = 0;
  for (const [k, v] of made) {
    const before = pictureBlob(S.maps[k].pic.key);
    await swapPicture(k, v.blob, v.type, v.w, v.h);
    saved += (before ? before.size : 0) - v.blob.size;
  }
  closeShrink();
  changed((made.length === 1 ? 'The picture is ' : plural(made.length, 'picture is', 'pictures are') + ' ') + pick.name + ' now, ' + sizeText(Math.max(0, saved)) + ' smaller. Undo puts it back.');
  emit('maps');
}

// When pictures are added: the big ones made smaller (no more than BIG_SIDE pixels across) when
// that saves something. One undo step for them all. Returns how many were changed.
export async function shrinkBig(ids) {
  const made = [];
  for (const k of ids) {
    const m = S.maps[k];
    if (!m || !m.pic) continue;
    const img = await whenReady(m.pic.key), before = pictureBlob(m.pic.key);
    if (!img || !before) continue;
    const pct = Math.min(100, Math.floor((BIG_SIDE / Math.max(img.naturalWidth, img.naturalHeight)) * 100));
    const v = await makeVersion(img, pct);
    if (v.blob.size > before.size * 0.8) continue;
    made.push([k, v]);
  }
  if (!made.length) return 0;
  remember(made.map(([k]) => k));
  for (const [k, v] of made) await swapPicture(k, v.blob, v.type, v.w, v.h);
  return made.length;
}

// the dialog's buttons
$('wp-shrink-close').addEventListener('click', closeShrink);
$('wp-shrink-cancel').addEventListener('click', closeShrink);
$('wp-shrink-use').addEventListener('click', useIt);
$('wp-shrink-whole').addEventListener('click', () => { UI.view = 'whole'; $('wp-shrink-whole').setAttribute('aria-pressed', 'true'); $('wp-shrink-close-up').setAttribute('aria-pressed', 'false'); paint(); });
$('wp-shrink-close-up').addEventListener('click', () => { UI.view = 'close'; $('wp-shrink-whole').setAttribute('aria-pressed', 'false'); $('wp-shrink-close-up').setAttribute('aria-pressed', 'true'); paint(); });
const hold = $('wp-shrink-hold');
const peek = (on) => { if (UI.hold === on) return; UI.hold = on; hold.classList.toggle('on', on); paint(); };
hold.addEventListener('pointerdown', (e) => { e.preventDefault(); try { hold.setPointerCapture(e.pointerId); } catch { /* fine */ } peek(true); });
for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) hold.addEventListener(t, () => peek(false));
hold.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  if ($('wp-shrink').hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); closeShrink(); }
});
window.addEventListener('resize', () => { if (!$('wp-shrink').hidden) paint(); });
