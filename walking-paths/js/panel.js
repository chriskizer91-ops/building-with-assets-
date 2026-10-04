// The panel beside the picture: the tools, what is picked (with its names and notes to fill in),
// the list of maps and the picked map's settings, the layers and the reach check, and the bar
// along the top. Saving and opening files are in files.js.

import { S, map, mapSize, remember, changed, emit, on, canUndo, canRedo } from './state.js';
import { arrivalsInto, mapName, renameMap, resizeMap, deleteMap, wayBack, keepNow } from './project.js';
import { pictureURL } from './pictures.js';
import { reachNow, checkSoon, arrivalFor } from './check.js';
import * as ed from './editor.js';
import { $, el, plural, cap, clamp, isPt, slug } from './util.js';

const TOOL_HELP = {
  select: 'Tap a shape, a point or a dot to pick it, then drag it to move it.',
  walk: 'Ground where feet can go: paths, floors, a bridge, a way up a tree.',
  block: 'A spot cut out of the walk areas: a well, a stall, the foot of a lamp post.',
  front: 'A piece of the picture drawn over anyone who walks behind it: a lamp post, a tree, a wall.',
  exit: 'Drag a box where people walk off this map (at an edge, a door, a gate), or tap for a small one.',
  person: 'Tap where someone stands. People are in the way on a walk, and you can talk to them.',
  thing: 'Tap something to look at: a sign, a well, a chest. On a walk you can read what you write for it.',
  story: 'Drag a box where something should happen when she walks into it.',
};
const HAND_HELP = 'Tap round it point by point, or trace round it with a finger. Tap the gold first point, or Finish shape, to close it.';
const WAND_HELP = 'Tap inside it in the picture: the wand outlines the patch of the same colour round your tap.';

// ---------------------------------------------------------------------------------------------
// the bar along the top, the name plate, the help line

export function renderBar() {
  const m = map();
  $('wp-undo').disabled = !canUndo() && !S.draft;
  $('wp-redo').disabled = !canRedo() || !!S.draft;
  for (const id of ['wp-zoom-in', 'wp-zoom-out', 'wp-fit']) $(id).disabled = !m || S.walking;
  const walk = $('wp-walk');
  walk.disabled = !m;
  walk.setAttribute('aria-pressed', S.walking ? 'true' : 'false');
  walk.textContent = S.walking ? 'Back to editing' : 'Walk it';
  $('wp-plate').hidden = !m || S.walking;
  if (m) {
    $('wp-plate-name').textContent = m.name;
    const chip = $('wp-plate-chip');
    chip.hidden = !m.example && m.pic;
    chip.textContent = !m.pic ? 'no picture' : 'example';
    chip.className = 'wp-chip ' + (!m.pic ? 'is-warn' : 'is-example');
  }
  $('wp-empty').hidden = !!m;
  $('wp-drawbar').hidden = !S.draft || S.walking;
  if (S.draft) $('wp-drawbar-say').textContent = plural(S.draft.length, 'point', 'points');
  $('wp-draw-done').disabled = !S.draft || S.draft.length < 3;
  renderHelp();
}

const touchy = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const kbd = (k) => '<kbd>' + k + '</kbd>';
function renderHelp() {
  let parts;
  if (S.walking) parts = touchy()
    ? ['Walk with the arrows on the picture, or tap where to go, or hold a finger down to steer', 'the gold button talks or looks', '✎ Back to editing when you’re done']
    : [kbd('←') + kbd('↑') + kbd('↓') + kbd('→') + ' or the arrows on the picture to walk', 'click the picture to walk there, or hold to steer', kbd('Enter') + ' talk or look', kbd('Esc') + ' back to editing'];
  else if (S.draft || (ed.isShape(S.tool) && S.drawBy === 'hand')) parts = touchy()
    ? ['Tap to put down points, or trace with a finger', 'tap the gold first point to finish', 'two fingers move and zoom the picture']
    : ['Click to put down points, or drag to trace', 'click the first point or press ' + kbd('Enter') + ' to finish', kbd('Backspace') + ' takes back the last bit', kbd('Esc') + ' cancels', 'hold ' + kbd('Space') + ' and drag, or right-drag, to move round'];
  else if (touchy()) parts = ['Drag empty space to move round', 'two fingers to zoom', 'tap a shape to pick it, drag its points', 'Walk it to try it'];
  else parts = ['Drag a point to move it', 'double-click an edge to add a point', kbd('Delete') + ' removes the picked point or thing', kbd('Wheel') + ' zoom', 'drag empty space or ' + kbd('←') + kbd('↑') + kbd('↓') + kbd('→') + ' to look round', kbd('Shift') + '+arrows nudge', kbd('Ctrl') + kbd('Z') + ' undo', kbd('F2') + ' walk it'];
  $('wp-help').innerHTML = parts.join('<span class="wp-dot">·</span>');
}

// ---------------------------------------------------------------------------------------------
// tools

export function renderTools() {
  const has = !!map();
  document.querySelectorAll('[data-tool]').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.tool === S.tool ? 'true' : 'false');
    b.disabled = !has || S.walking;
  });
  document.querySelectorAll('[data-drawby]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.drawby === S.drawBy ? 'true' : 'false'));
  $('wp-wand').hidden = S.drawBy !== 'wand';
  $('wp-spread').value = String(S.spread);
  $('wp-spread-val').textContent = String(S.spread);
  let help = TOOL_HELP[S.tool] || '';
  if (ed.isShape(S.tool)) help += ' ' + (S.drawBy === 'wand' ? WAND_HELP : HAND_HELP);
  $('wp-tool-help').textContent = help;
}

// ---------------------------------------------------------------------------------------------
// what is picked

let formKey = '', formFor = null;
export function forgetForm() { formKey = ''; }

// a text box that changes the maps as you type (one undo step for all the typing)
function textBox(parent, label, value, onInput, opts = {}) {
  const f = el('label', { class: 'wp-field' }, parent);
  el('span', null, f, label);
  const inp = el(opts.area ? 'textarea' : 'input', opts.area ? { rows: 3 } : { type: opts.type || 'text', maxlength: opts.max || 200 }, f);
  if (opts.id) inp.id = opts.id;
  if (opts.list) inp.setAttribute('list', opts.list);
  if (opts.placeholder) inp.placeholder = opts.placeholder;
  inp.value = value == null ? '' : String(value);
  let kept = false;
  inp.addEventListener('focus', () => { kept = false; });
  inp.addEventListener('input', () => {
    if (!kept) { remember(opts.ids ? opts.ids() : [S.cur]); kept = true; }
    onInput(inp.value);
    S.rev++;
    emit('moving');
    ed.draw();
  });
  inp.addEventListener('change', () => { if (kept) changed(''); kept = false; });
  return inp;
}

function pickedKey() {
  if (S.draft) return 'draft';
  if (!S.sel || !ed.valid(S.sel)) return 'none:' + S.tool;
  return S.cur + '|' + S.sel.kind + '|' + S.sel.i;
}

export function renderPicked(force) {
  const box = $('wp-picked'), m = map(), key = pickedKey();
  if (force || key !== formKey) { formKey = key; buildPicked(box, m); }
  else updatePicked(box, m);
  const s = S.sel && ed.valid(S.sel) ? S.sel : null, shape = s && ed.isShape(s.kind);
  $('wp-smooth').disabled = !!S.draft || !shape;
  $('wp-fewer').disabled = !!S.draft || !shape || s.sub != null;
  $('wp-delete').disabled = !S.draft && !(s && s.kind !== 'start' && s.kind !== 'arrival');
  $('wp-delete').textContent = S.draft ? 'Take back' : 'Delete';
}

function buildPicked(box, m) {
  box.textContent = '';
  formFor = null;
  if (!m) { box.innerHTML = 'No map yet.<small>Add a picture to start.</small>'; return; }
  if (S.draft) {
    const n = S.draft.length;
    box.innerHTML = '<b>Drawing a new ' + ed.NOUN[S.tool] + '</b>: <span data-live="draft">' + plural(n, 'point', 'points') + '</span> so far.<small>Tap the gold first point, or Finish shape, to close it. Take back undoes the last tap or trace; Cancel drops it.</small>';
    return;
  }
  const s = S.sel && ed.valid(S.sel) ? S.sel : null;
  if (!s) {
    box.innerHTML = S.tool === 'select' ? 'Nothing picked.<small>Tap a shape, a point or a dot on the picture.</small>' : '<b>' + cap(ed.NOUN[S.tool]) + '</b><small>' + (ed.isShape(S.tool) && S.drawBy === 'wand' ? 'Tap the picture to outline one.' : 'Tap the picture to put one down.') + '</small>';
    return;
  }
  formFor = s;
  const head = el('div', { 'data-live': 'head' }, box);
  head.innerHTML = headline(m, s);
  if (ed.isShape(s.kind)) return;
  const form = el('div', { class: 'wp-form' }, box);
  if (s.kind === 'exit') exitForm(form, m, s.i);
  else if (s.kind === 'person') personForm(form, m, s.i);
  else if (s.kind === 'spot') spotForm(form, m, s.i);
  else if (s.kind === 'arrival') {
    const a = arrivalsInto(S.cur)[s.i], b = el('button', { type: 'button' }, form, 'Go to that way out on ' + mapName(a.from));
    b.addEventListener('click', () => emit('open-map', { id: a.from, sel: { kind: 'exit', i: a.exit } }));
  }
}

function updatePicked(box, m) {
  const head = box.querySelector('[data-live="head"]');
  if (head && formFor && ed.valid(formFor)) head.innerHTML = headline(m, S.sel || formFor);
  const d = box.querySelector('[data-live="draft"]');
  if (d && S.draft) d.textContent = plural(S.draft.length, 'point', 'points');
}

function headline(m, s) {
  const xy = (p) => 'x ' + p[0] + ', y ' + p[1];
  if (ed.isShape(s.kind)) {
    const pts = ed.shapeOf(m, s.kind, s.i), n = (s.kind === 'front' ? m.front : m[s.kind]).length;
    let h = '<b>' + cap(ed.NOUN[s.kind]) + ' ' + (s.i + 1) + '</b> of ' + n + ' · ' + plural(pts.length, 'point', 'points');
    if (s.sub != null && pts[s.sub]) h += '<small>Point ' + (s.sub + 1) + ' at ' + xy(pts[s.sub]) + '. Drag it to move it; Delete takes it out; Smooth rounds this corner.</small>';
    else h += '<small>Drag inside it to move it. Drag the dot in the middle of an edge (or double-click an edge) to add a point. Smooth rounds every corner.</small>';
    if (s.kind === 'front') h += '<small>Base line at y ' + m.front[s.i].base + ': people are drawn behind this piece when their feet are above the line. Drag the diamond to move it.</small>';
    return h;
  }
  if (s.kind === 'exit') {
    const r = m.exits[s.i].rect;
    return '<b>Way out</b> · x ' + r[0] + '–' + r[2] + ', y ' + r[1] + '–' + r[3] + '<small>She leaves the map when she walks into it. Drag it to move it, or a corner to resize it.</small>';
  }
  if (s.kind === 'person') return '<b>' + esc(m.people[s.i].name || 'Someone') + '</b> stands at ' + xy(m.people[s.i].at) + '<small>Drag the dot to move where they stand. People are in the way: she walks round them.</small>';
  if (s.kind === 'spot') {
    const sp = m.spots[s.i];
    if (sp.rect) return '<b>Story area</b> · x ' + sp.rect[0] + '–' + sp.rect[2] + ', y ' + sp.rect[1] + '–' + sp.rect[3] + '<small>Something happens when she walks into it. Drag inside it to move it, or a corner to resize it.</small>';
    return '<b>' + esc(sp.label || sp.kind) + '</b> at ' + xy(sp.at) + '<small>She can look at it when she stands close by. Drag the dot to move it.</small>';
  }
  if (s.kind === 'arrival') {
    const a = arrivalsInto(S.cur)[s.i];
    return '<b>Where she arrives from ' + esc(mapName(a.from)) + '</b> · ' + xy(a.at) + '<small>Drag it to move it. Keep it on a walk area and out of the ways out, or she leaves again at once.</small>';
  }
  return '<b>Where a walk starts</b> · ' + xy(m.start) + '<small>Drag it to move it. The little figure shows how tall people are on this map. “Where she can reach” checks from here.</small>';
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function exitForm(form, m, i) {
  const e = m.exits[i], cur = S.cur;
  const f = el('label', { class: 'wp-field' }, form);
  el('span', null, f, 'Leads to');
  const sel = el('select', { id: 'wp-exit-to' }, f);
  el('option', { value: '' }, sel, '(nowhere yet)');
  for (const id of S.order) el('option', { value: id }, sel, mapName(id) + (id === cur ? ' (this map)' : ''));
  el('option', { value: '\u0000other' }, sel, 'Somewhere not in these maps…');
  const elsewhere = e.to && !S.maps[e.to];
  sel.value = elsewhere ? '\u0000other' : e.to || '';
  const otherBox = el('div', null, form);
  const other = textBox(otherBox, 'Its key in your game (the map it leads to)', elsewhere ? e.to : '', (v) => { e.to = v.trim(); }, { placeholder: 'thornwood' });
  otherBox.hidden = !elsewhere;
  textBox(form, 'Name of the place (shown on the map)', e.label, (v) => { e.label = v; }, { placeholder: S.maps[e.to] ? mapName(e.to) : 'The jetty' });
  const arrive = el('div', { class: 'wp-field-row' }, form);
  const say = el('p', { class: 'wp-small', style: 'margin:0' }, arrive);
  const go = el('button', { type: 'button' }, arrive, 'Show it');
  const show = () => {
    const t = e.to && S.maps[e.to];
    arrive.hidden = !t;
    if (t) say.textContent = isPt(e.at) ? 'She arrives on ' + mapName(e.to) + ' at x ' + e.at[0] + ', y ' + e.at[1] + ' (the pink ring there).' : 'She arrives where a walk starts on ' + mapName(e.to) + '.';
  };
  show();
  sel.addEventListener('change', () => {
    remember([cur]);
    if (sel.value === '\u0000other') { e.to = other.value.trim(); otherBox.hidden = false; other.focus(); }
    else {
      otherBox.hidden = true;
      const was = e.to;
      e.to = sel.value;
      const t = S.maps[e.to];
      // she arrives across from where she left, until that pink ring is dragged somewhere better
      if (t && e.to !== was) e.at = arrivalFor(cur, i, e.to);
      if (t && (!e.label || (S.maps[was] && e.label === S.maps[was].name))) e.label = t.name;
    }
    show();
    changed('');
    forgetForm();
    renderPicked();
  });
  go.addEventListener('click', () => {
    const ai = arrivalsInto(e.to).findIndex((a) => a.from === cur && a.exit === i);
    emit('open-map', { id: e.to, sel: ai >= 0 ? { kind: 'arrival', i: ai } : null });
  });
  // the same way back, made in one go
  const t = e.to && S.maps[e.to];
  if (t && e.to !== cur && !t.exits.some((x) => x.to === cur)) {
    const back = el('button', { type: 'button' }, form, 'Make the way back from ' + mapName(e.to));
    back.addEventListener('click', () => {
      const made = wayBack(cur, i);
      if (!made) return;
      changed('Made a way out on ' + mapName(made.on) + ' back to ' + mapName(cur) + ', where she arrives there. She comes back here beside this way out.');
      emit('maps');
      forgetForm();
      renderPicked();
    });
  }
}

function personForm(form, m, i) {
  const p = m.people[i];
  textBox(form, 'Name', p.name, (v) => {
    // a key that came from the name follows it
    const follows = /^person-\d+$/.test(p.id) || p.id === slug(p.name);
    p.name = v;
    const id = slug(v);
    if (follows && id && !m.people.some((q, k) => k !== i && q.id === id)) p.id = id;
    const key = form.querySelector('[data-live="key"]');
    if (key) key.textContent = 'Key in the maps file: ' + p.id;
  }, { max: 80 });
  const looks = window.WalkingPathsEngine ? window.WalkingPathsEngine.looks().filter((l) => l !== 'io') : [];
  const f = el('label', { class: 'wp-field' }, form);
  el('span', null, f, 'Looks like (on a walk)');
  const sel = el('select', null, f);
  for (const l of looks) el('option', { value: l }, sel, LOOK_NAMES[l] || l);
  if (p.look && !looks.includes(p.look)) el('option', { value: p.look }, sel, p.look);
  sel.value = p.look || 'hooded';
  sel.addEventListener('change', () => { remember(); p.look = sel.value; changed(''); });
  const faces = el('div', { class: 'wp-field' }, form);
  el('span', null, faces, 'Faces');
  const row = el('div', { class: 'wp-faces' }, faces);
  for (const [d, t] of [['s', '↓ down'], ['w', '← left'], ['e', '→ right'], ['n', '↑ up']]) {
    const b = el('button', { type: 'button', 'aria-pressed': (p.face0 || 's') === d ? 'true' : 'false' }, row, t);
    b.addEventListener('click', () => {
      remember();
      if (d === 's') delete p.face0; else p.face0 = d;
      row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      changed('');
    });
  }
  textBox(form, 'What they say (on a walk)', p.says, (v) => { if (v) p.says = v; else delete p.says; }, { area: true, max: 2000 });
  el('p', { class: 'wp-small', style: 'margin:0', 'data-live': 'key' }, form, 'Key in the maps file: ' + p.id);
}
const LOOK_NAMES = { hooded: 'Someone hooded', witch2: 'A witch', smith: 'A smith', elder: 'An elder', sailor: 'A sailor', child: 'A child', aurosi: 'An Aurosi', gnome: 'A gnome', sol: 'Sol', halcyon: 'Halcyon' };

function spotForm(form, m, i) {
  const s = m.spots[i];
  if (s.rect) {
    textBox(form, 'Name', s.label, (v) => {
      const follows = !s.id || /^story-\d+$/.test(s.id) || s.id === slug(s.label);
      s.label = v;
      const id = slug(v);
      if (follows && id && !m.spots.some((q, k) => k !== i && q.id === id)) s.id = id;
      const key = form.querySelector('[data-live="key"]');
      if (key) key.textContent = 'Key in the maps file: ' + (s.id || '(none)');
    }, { max: 80 });
    textBox(form, 'What happens (a note for you, or shown on a walk)', s.note, (v) => { if (v) s.note = v; else delete s.note; }, { area: true, max: 2000 });
    el('p', { class: 'wp-small', style: 'margin:0', 'data-live': 'key' }, form, 'Key in the maps file: ' + (s.id || '(none)'));
    return;
  }
  textBox(form, 'Name', s.label, (v) => { s.label = v; }, { max: 80 });
  textBox(form, 'What she sees (shown on a walk)', s.note, (v) => { s.note = v; }, { area: true, max: 2000 });
  textBox(form, 'Kind (for your game)', s.kind, (v) => { s.kind = v.trim() || 'look'; }, { list: 'wp-kinds', max: 40 });
  if (!$('wp-kinds')) {
    const dl = el('datalist', { id: 'wp-kinds' }, document.body);
    for (const k of ['look', 'rest', 'sign', 'chest', 'door', 'well', 'shop']) el('option', { value: k }, dl);
  }
}

// ---------------------------------------------------------------------------------------------
// the maps

export function renderMaps() {
  const list = $('wp-maps');
  list.textContent = '';
  for (const id of S.order) {
    const m = S.maps[id], li = el('li', { class: id === S.cur ? 'is-current' : '' }, list);
    const url = m.pic ? pictureURL(m.pic.key) : null;
    if (url) el('img', { src: url, alt: '', decoding: 'async' }, li);
    else el('span', { class: 'wp-nothumb' }, li);
    const b = el('button', { type: 'button', class: 'wp-map-pick', 'aria-current': id === S.cur ? 'true' : 'false' }, li);
    b.append(document.createTextNode(m.name));
    const [w, h] = mapSize(m), parts = [w + ' × ' + h];
    if (m.walk.length) parts.push(plural(m.walk.length, 'walk area', 'walk areas'));
    if (m.exits.length) parts.push(plural(m.exits.length, 'way out', 'ways out'));
    el('small', null, b, parts.join(' · '));
    b.addEventListener('click', () => emit('open-map', { id }));
    const chip = el('span', { class: 'wp-chip' }, li);
    if (!m.pic) { chip.textContent = 'no picture'; chip.classList.add('is-warn'); }
    else if (m.example) { chip.textContent = 'example'; chip.classList.add('is-example'); }
    else chip.hidden = true;
  }
  $('wp-remove-examples').hidden = !S.order.some((id) => S.maps[id].example);
  renderMapSettings();
}

let armedDelete = 0;
export function renderMapSettings() {
  const box = $('wp-mapset'), m = map();
  box.textContent = '';
  box.hidden = !m;
  if (!m) return;
  const id = S.cur;
  el('h3', null, box, 'This map');
  // its name: typed straight onto the map; a key made from the old name follows the new one
  const nf = el('label', { class: 'wp-field' }, box);
  el('span', null, nf, 'Name');
  const name = el('input', { type: 'text', maxlength: 80, id: 'wp-map-name' }, nf);
  name.value = m.name;
  let before = m.name, typing = false;
  name.addEventListener('focus', () => { before = m.name; typing = false; });
  name.addEventListener('input', () => {
    if (!typing) { remember([id]); typing = true; }
    m.name = name.value;
    S.rev++;
    $('wp-plate-name').textContent = m.name;
    ed.draw();
  });
  name.addEventListener('change', () => {
    if (!S.maps[id]) return;
    const v = name.value.trim() || before;
    m.name = before;
    const leading = S.order.filter((k) => S.maps[k].exits.some((e) => e.to === id));
    const nid = renameMap(id, v, (newId) => remember([id, newId, ...leading]));
    if (nid !== id) S.cur = nid;
    typing = false;
    changed('');
    emit('maps');
  });
  // the picture
  const pic = el('div', { class: 'wp-field-row' }, box);
  const say = el('p', { class: 'wp-small' }, pic);
  if (m.pic) say.textContent = 'Picture: ' + (m.pic.file || 'pasted') + ' · ' + m.pic.w + ' × ' + m.pic.h;
  else say.textContent = m.wantPicture ? 'Its picture (' + m.wantPicture + ') wasn’t with the maps file.' : 'No picture yet.';
  const rep = el('button', { type: 'button' }, pic, m.pic ? 'Replace…' : 'Add its picture…');
  rep.addEventListener('click', () => emit('replace-picture'));
  // size and people's height
  const [w, h] = mapSize(m);
  const sizeRow = el('div', { class: 'wp-field-row' }, box);
  const wb = el('label', { class: 'wp-field' }, sizeRow);
  el('span', null, wb, 'Width');
  const wi = el('input', { type: 'number', min: 16, max: 20000, step: 1, value: w, id: 'wp-map-w' }, wb);
  const hb = el('label', { class: 'wp-field' }, sizeRow);
  el('span', null, hb, 'Height');
  const hi = el('input', { type: 'number', min: 16, max: 20000, step: 1, value: h, id: 'wp-map-h' }, hb);
  const apply = el('button', { type: 'button', disabled: true }, sizeRow, 'Use this size');
  const keepRatio = m.pic ? m.pic.h / m.pic.w : h / w;
  wi.addEventListener('input', () => { hi.value = String(Math.round(Number(wi.value) * keepRatio) || ''); apply.disabled = Number(wi.value) === w && Number(hi.value) === h; });
  hi.addEventListener('input', () => { apply.disabled = Number(wi.value) === w && Number(hi.value) === h; });
  apply.addEventListener('click', () => {
    const nw = clamp(Math.round(Number(wi.value)), 16, 20000), nh = clamp(Math.round(Number(hi.value)), 16, 20000);
    if (!nw || !nh) return;
    remember([id, ...S.order.filter((k) => S.maps[k].exits.some((e) => e.to === id))]);
    resizeMap(id, nw, nh);
    changed('Map size now ' + nw + ' × ' + nh + ': everything on it stretched to match.');
    emit('maps');
    ed.fit();
  });
  el('p', { class: 'wp-small' }, box, 'Points are counted in these pixels (Envoi’s maps are 1536 × 1024). A new size stretches everything drawn on the map to match.');
  const tf = el('label', { class: 'wp-field' }, box);
  el('span', null, tf, 'How tall people are, in pixels');
  const tall = el('input', { type: 'number', min: 4, max: 2000, step: 1, id: 'wp-map-walker' }, tf);
  tall.value = m.walker;
  tall.addEventListener('change', () => {
    const v = clamp(Math.round(Number(tall.value)), 4, 2000);
    if (!v || v === m.walker) { tall.value = m.walker; return; }
    remember([id]);
    m.walker = v;
    changed('People are now ' + v + ' pixels tall on this map. The little figure at the start shows it.');
  });
  el('p', { class: 'wp-small' }, box, 'It sets how wide a path must be to walk along, and how big people look on a walk.');
  // deleting it (twice, to be sure)
  const del = el('button', { type: 'button', class: 'wp-danger' }, box, 'Delete this map');
  del.addEventListener('click', () => {
    if (!armedDelete) {
      del.textContent = 'Sure? Tap again to delete ' + m.name;
      del.classList.add('is-armed');
      armedDelete = setTimeout(() => { armedDelete = 0; del.textContent = 'Delete this map'; del.classList.remove('is-armed'); }, 4000);
      return;
    }
    clearTimeout(armedDelete);
    armedDelete = 0;
    const was = m.name;
    deleteMap(id);
    changed(was + ' deleted. Undo brings it back.');
    emit('maps');
    ed.showView();
  });
}

// ---------------------------------------------------------------------------------------------
// layers, and what she can't reach

export function renderLayers() {
  for (const k of Object.keys(S.layers)) { const c = $('wp-l-' + k); if (c) c.checked = !!S.layers[k]; }
  $('wp-showpaths').checked = !!S.showPaths;
  const w = $('wp-walker');
  if (!w.options.length && window.WalkingPathsEngine) {
    for (const l of window.WalkingPathsEngine.looks()) el('option', { value: l }, w, l === 'io' ? 'Io' : LOOK_NAMES[l] || l);
  }
  w.value = S.walker;
  renderReach();
}

export function renderReach() {
  const box = $('wp-reach');
  box.className = 'wp-reach';
  if (!map()) { box.textContent = ''; return; }
  if (!S.layers.reach) { box.textContent = 'Turn on “Where she can reach” to check she can get to every way out, person, thing and story area from where a walk starts.'; return; }
  const r = reachNow();
  if (!r) { box.textContent = 'Checking where she can reach…'; return; }
  const islands = r.open > r.reached;
  if (!r.problems.length) {
    box.classList.add('is-good');
    box.textContent = 'She can reach everything on this map.' + (islands ? ' Orange marks walk area she can’t get to.' : '');
    return;
  }
  box.textContent = '';
  el('span', null, box, (r.problems.length === 1 ? 'One thing' : r.problems.length + ' things') + ' she can’t reach (tap one to see it):');
  const ul = el('ul', null, box);
  for (const p of r.problems) {
    el('button', { type: 'button' }, el('li', null, ul), p.text).addEventListener('click', () => ed.centreOn(p.at[0], p.at[1], Math.max(ed.view.z, 1)));
  }
  if (islands) el('span', null, box, ' Orange marks walk area she can’t get to.');
}

// ---------------------------------------------------------------------------------------------
// a question asked in the page (the artifact viewer shows no confirm boxes)

export function ask(title, text, buttons) {
  return new Promise((resolve) => {
    const d = $('wp-dialog'), row = $('wp-dialog-buttons');
    $('wp-dialog-title').textContent = title;
    $('wp-dialog-text').textContent = text;
    row.textContent = '';
    const done = (v) => { d.hidden = true; document.removeEventListener('keydown', onKey, true); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(null); } };
    buttons.forEach((b, i) => {
      const btn = el('button', { type: 'button', class: i === 0 ? 'wp-primary' : '' }, row, b.label);
      btn.addEventListener('click', () => done(b.value));
    });
    document.addEventListener('keydown', onKey, true);
    d.hidden = false;
    row.querySelector('button').focus();
  });
}

// ---------------------------------------------------------------------------------------------
// saving status

export function status(text, kind) {
  const s = $('wp-status');
  s.textContent = text;
  s.className = 'wp-status' + (kind ? ' is-' + kind : '');
}
let keptOk = true;
export function renderKept(ok) {
  if (ok !== undefined) keptOk = ok;
  const n = S.order.length;
  $('wp-kept').textContent = !keptOk
    ? 'This browser isn’t keeping your work (a private window does that). Save the maps file before you close the page.'
    : n ? 'Your ' + plural(n, 'map is', 'maps are') + ' kept in this browser as you work. Save the maps file to keep them for good, or to move them to another computer or phone.' : 'Maps you add are kept in this browser as you work.';
  for (const id of ['wp-save', 'wp-copy', 'wp-save-data', 'wp-save-page']) $(id).disabled = !n;
  for (const id of ['wp-save-picture', 'wp-save-mask']) $(id).disabled = !map();
}

on('kept', (ok) => renderKept(ok));
on('reach', () => renderReach());
export { keepNow, checkSoon };
