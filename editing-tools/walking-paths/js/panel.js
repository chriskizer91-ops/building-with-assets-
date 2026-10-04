// The panel beside the picture: the tools, what is picked (with its names and notes to fill in),
// the list of maps and the picked map's settings, the layers and the reach check, and the bar
// along the top. Saving and opening files are in files.js.

import { S, map, mapSize, remember, changed, emit, on, canUndo, canRedo } from './state.js';
import { arrivalsInto, mapName, renameMap, keyAfterRename, resizeMap, deleteMap, wayBack, keepNow, isWorld, worldIds, placeFor, makeWorld, unmakeWorld, linkPlaceTo, mapsLeadingTo, ZOOM, PACE } from './project.js';
import { pictureURL, pictureBlob } from './pictures.js';
import { reachNow, checkSoon, arrivalFor } from './check.js';
import * as ed from './editor.js';
import { $, el, plural, cap, clamp, isPt, slug, sizeText } from './util.js';

const TOOL_HELP = {
  select: 'Tap a shape, a point or a dot to pick it, then drag it to move it.',
  walk: 'Ground where feet can go: paths, floors, a bridge, a way up a tree.',
  block: 'A spot cut out of the walk areas: a well, a stall, the foot of a lamp post.',
  front: 'A piece of the picture drawn over anyone who walks behind it: a lamp post, a tree, a wall.',
  exit: 'Drag a box where people walk off this map (at an edge, a door, a gate), or tap for a small one.',
  person: 'Tap where someone stands. People are in the way on a walk, and you can talk to them.',
  thing: 'Tap something to look at: a sign, a well, a chest. On a walk you can read what you write for it.',
  story: 'Drag a box where something should happen when she walks into it.',
  place: 'Tap where a place is on the world map: a town, a cave, the end of a road. On a walk she can go into it from there.',
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
  $('wp-tool-place').hidden = !isWorld(map());
  document.querySelectorAll('[data-drawby]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.drawby === S.drawBy ? 'true' : 'false'));
  $('wp-wand').hidden = S.drawBy !== 'wand';
  $('wp-spread').value = String(S.spread);
  $('wp-spread-val').textContent = String(S.spread);
  let help = TOOL_HELP[S.tool] || '';
  if (ed.isShape(S.tool)) help += ' ' + (S.drawBy === 'wand' ? WAND_HELP : HAND_HELP);
  if (S.tool === 'place' && S.placeFor && S.maps[S.placeFor]) help = 'Tap the world map where ' + mapName(S.placeFor) + ' is.';
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
  const owner = S.cur;
  let kept = false;
  inp.addEventListener('focus', () => { kept = false; });
  inp.addEventListener('input', () => {
    if (!kept) { remember(opts.ids ? opts.ids() : [owner]); kept = true; }
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
  else if (s.kind === 'place') placeForm(form, m, s.i);
  else if (s.kind === 'arrival') {
    const a = arrivalsInto(S.cur)[s.i];
    const b = el('button', { type: 'button' }, form, a.place != null ? 'Go to that place on the world map' : 'Go to that way out on ' + mapName(a.from));
    b.addEventListener('click', () => emit('open-map', { id: a.from, sel: a.place != null ? { kind: 'place', i: a.place } : { kind: 'exit', i: a.exit } }));
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
    const from = a.place != null ? 'the world map (' + S.maps[a.from].places[a.place].name + ')' : mapName(a.from);
    return '<b>Where she arrives from ' + esc(from) + '</b> · ' + xy(a.at) + '<small>Drag it to move it. Keep it on a walk area and out of the ways out, or she leaves again at once.</small>';
  }
  if (s.kind === 'place') {
    const q = m.places[s.i];
    return '<b>' + esc(q.name) + '</b> on the world map · ' + xy(q.at) + '<small>On a walk she can go into ' + (q.to && S.maps[q.to] ? esc(mapName(q.to)) : 'the map it leads to') + ' from here. Drag the flag to where the place is.</small>';
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
  for (const id of worldIds()) if (id !== cur) el('option', { value: id }, sel, 'The world map (' + mapName(id) + ')');
  for (const id of S.order) if (!isWorld(S.maps[id])) el('option', { value: id }, sel, mapName(id) + (id === cur ? ' (this map)' : ''));
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
    if (!t) return;
    if (isWorld(t)) {
      const q = (t.places || []).find((x) => x.id === e.at);
      say.textContent = q ? 'She comes out on the world map at ' + q.name + ' (its gold flag).' : 'She comes out on the world map where a walk starts there.';
    } else say.textContent = isPt(e.at) ? 'She arrives on ' + mapName(e.to) + ' at x ' + e.at[0] + ', y ' + e.at[1] + ' (the pink ring there).' : 'She arrives where a walk starts on ' + mapName(e.to) + '.';
  };
  show();
  sel.addEventListener('change', () => {
    const toWorld = isWorld(S.maps[sel.value]);
    remember(toWorld ? [cur, sel.value] : [cur]);
    if (sel.value === '\u0000other') { e.to = other.value.trim(); otherBox.hidden = false; other.focus(); }
    else {
      otherBox.hidden = true;
      const was = e.to;
      e.to = sel.value;
      const t = S.maps[e.to];
      if (toWorld) {
        // she comes out at this map's place on the world map (one is made in its middle if there is none)
        const pi = placeFor(e.to, cur);
        e.at = t.places[pi].id;
        if (!e.label || (S.maps[was] && e.label === S.maps[was].name)) e.label = t.name;
      } else {
        // she arrives across from where she left, until that pink ring is dragged somewhere better
        if (t && e.to !== was) e.at = arrivalFor(cur, i, e.to);
        if (t && (!e.label || (S.maps[was] && e.label === S.maps[was].name))) e.label = t.name;
      }
    }
    show();
    changed('');
    emit('maps');
    forgetForm();
    renderPicked();
  });
  go.addEventListener('click', () => {
    const t = S.maps[e.to];
    if (isWorld(t)) {
      const pi = (t.places || []).findIndex((x) => x.id === e.at);
      emit('open-map', { id: e.to, sel: pi >= 0 ? { kind: 'place', i: pi } : null });
      return;
    }
    const ai = arrivalsInto(e.to).findIndex((a) => a.from === cur && a.exit === i);
    emit('open-map', { id: e.to, sel: ai >= 0 ? { kind: 'arrival', i: ai } : null });
  });
  // the same way back, made in one go
  const t = e.to && S.maps[e.to];
  if (t && !isWorld(t) && e.to !== cur && !t.exits.some((x) => x.to === cur)) {
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

function placeForm(form, m, i) {
  const q = m.places[i], world = S.cur;
  textBox(form, 'Name (on its banner)', q.name, (v) => { q.name = v; }, { max: 80 });
  const f = el('label', { class: 'wp-field' }, form);
  el('span', null, f, 'Leads into');
  const sel = el('select', { id: 'wp-place-to' }, f);
  el('option', { value: '' }, sel, '(nowhere yet)');
  for (const id of S.order) if (!isWorld(S.maps[id])) el('option', { value: id }, sel, mapName(id));
  if (q.to && !S.maps[q.to]) el('option', { value: q.to }, sel, q.to + ' (not here)');
  sel.value = q.to || '';
  sel.addEventListener('change', () => {
    const id = sel.value;
    if (!id || !S.maps[id]) { remember([world]); q.to = id; changed(''); forgetForm(); renderPicked(); return; }
    // linked as if it had been put on the world map from the list: a way back is made on that map
    remember([world, id]);
    linkPlaceTo(world, i, id, true);
    if (/^Place \d+$/.test(q.name)) q.name = mapName(id);
    changed(mapName(id) + ' is linked: its way out back to the world map is the blue box at its edge.');
    emit('maps');
    forgetForm();
    renderPicked();
  });
  const row = el('div', { class: 'wp-field-row' }, form);
  const say = el('p', { class: 'wp-small', style: 'margin:0' }, row);
  if (q.to && S.maps[q.to]) {
    say.textContent = isPt(q.arrive) ? 'She arrives on ' + mapName(q.to) + ' at x ' + q.arrive[0] + ', y ' + q.arrive[1] + ' (the pink ring there).' : 'She arrives where a walk starts on ' + mapName(q.to) + '.';
    el('button', { type: 'button' }, row, 'Show it').addEventListener('click', () => {
      const ai = arrivalsInto(q.to).findIndex((a) => a.from === world && a.place === i);
      emit('open-map', { id: q.to, sel: ai >= 0 ? { kind: 'arrival', i: ai } : null });
    });
  } else say.textContent = 'Pick the map she goes into from here.';
  el('p', { class: 'wp-small', style: 'margin:0' }, form, 'Key in the maps file: ' + q.id + '. A way out to the world map from ' + (q.to && S.maps[q.to] ? mapName(q.to) : 'that map') + ' brings her back here.');
}

function personForm(form, m, i) {
  const p = m.people[i], owner = S.cur;
  textBox(form, 'Name', p.name, (v) => {
    // a key that came from the name follows it
    const follows = /^person-\d+$/.test(p.id) || p.id === slug(p.name);
    p.name = v;
    const id = slug(v);
    if (follows && id && !m.people.some((q, k) => k !== i && q.id === id)) p.id = id;
    const key = form.querySelector('[data-live="key"]');
    if (key) key.textContent = 'Key in the maps file: ' + p.id;
  }, { max: 80 });
  const looks = window.WalkingPathsEngine ? window.WalkingPathsEngine.looks().filter((l) => !/^io/.test(l)) : [];
  const f = el('label', { class: 'wp-field' }, form);
  el('span', null, f, 'Looks like (on a walk)');
  const sel = el('select', null, f);
  for (const l of looks) el('option', { value: l }, sel, LOOK_NAMES[l] || l);
  if (p.look && !looks.includes(p.look)) el('option', { value: p.look }, sel, p.look);
  sel.value = p.look || 'hooded';
  sel.addEventListener('change', () => { remember([owner]); p.look = sel.value; changed(''); });
  const faces = el('div', { class: 'wp-field' }, form);
  el('span', null, faces, 'Faces');
  const row = el('div', { class: 'wp-faces' }, faces);
  for (const [d, t] of [['s', '↓ down'], ['w', '← left'], ['e', '→ right'], ['n', '↑ up']]) {
    const b = el('button', { type: 'button', 'aria-pressed': (p.face0 || 's') === d ? 'true' : 'false' }, row, t);
    b.addEventListener('click', () => {
      remember([owner]);
      if (d === 's') delete p.face0; else p.face0 = d;
      row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      changed('');
    });
  }
  textBox(form, 'What they say (on a walk)', p.says, (v) => { if (v) p.says = v; else delete p.says; }, { area: true, max: 2000 });
  el('p', { class: 'wp-small', style: 'margin:0', 'data-live': 'key' }, form, 'Key in the maps file: ' + p.id);
}
const WALKER_NAMES = { 'io-painted': 'Io, painted (the paper doll from Envoi)', io: 'Io, in pixels' };
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

let armed = null; // { id, timer }: "Delete this map" was tapped once
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
  // (shown as you type; kept, with one undo step for the name and the key, when you leave the box)
  let before = m.name;
  name.addEventListener('focus', () => { before = m.name; });
  name.addEventListener('input', () => {
    m.name = name.value;
    S.rev++;
    $('wp-plate-name').textContent = m.name;
    ed.draw();
  });
  name.addEventListener('change', () => {
    if (S.maps[id] !== m) return;
    const v = name.value.trim() || before;
    m.name = before;
    if (v === before) { name.value = v; S.rev++; return; }
    const nid = keyAfterRename(id, v), leading = mapsLeadingTo(id);
    remember([...new Set([id, nid, ...leading])]);
    if (renameMap(id, v) !== id) S.cur = nid;
    changed('');
    emit('maps');
  });
  // the world map: the map of the whole land, whose places lead into the others
  const wl = el('label', { class: 'wp-check' }, box);
  const wc = el('input', { type: 'checkbox', id: 'wp-map-world' }, wl);
  wc.checked = isWorld(m);
  wl.append(document.createTextNode('This is the world map'));
  el('p', { class: 'wp-small' }, box, isWorld(m)
    ? 'Its gold flags are places that lead into the other maps, and their ways out to the world map bring her back. With no walk areas drawn she can go anywhere on it.'
    : 'Tick it for the map of the whole land: its places lead into the other maps.');
  wc.addEventListener('change', () => {
    if (wc.checked) {
      const nid = makeWorld(id);
      S.cur = nid;
      changed('This is the world map now. Put the other maps on it with the list below.');
    } else { unmakeWorld(id); changed('This is no longer the world map.'); }
    emit('maps');
    emit('tool');
  });
  if (isWorld(m)) placesList(box, id, m);
  // the picture
  const pic = el('div', { class: 'wp-field-row' }, box);
  const say = el('p', { class: 'wp-small' }, pic);
  const blob = m.pic && pictureBlob(m.pic.key);
  if (m.pic) say.textContent = 'Picture: ' + (m.pic.file || 'pasted') + ' · ' + m.pic.w + ' × ' + m.pic.h + (blob ? ' · ' + sizeText(blob.size) : '');
  else say.textContent = m.wantPicture ? 'Its picture (' + m.wantPicture + ') wasn’t with the maps file.' : 'No picture yet.';
  const picBtns = el('div', { class: 'wp-row' }, box);
  if (m.pic) el('button', { type: 'button', id: 'wp-picture-size', class: blob && blob.size > 1048576 ? 'wp-primary' : '' }, picBtns, 'Picture size…').addEventListener('click', () => emit('shrink'));
  const rep = el('button', { type: 'button' }, picBtns, m.pic ? 'Replace the picture…' : 'Add its picture…');
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
  const sizeOk = () => {
    const a = Number(wi.value), b = Number(hi.value);
    return wi.value !== '' && hi.value !== '' && a >= 16 && b >= 16 && a <= 20000 && b <= 20000 && !(Math.round(a) === w && Math.round(b) === h);
  };
  wi.addEventListener('input', () => { if (wi.value !== '') hi.value = String(Math.round(Number(wi.value) * keepRatio)); apply.disabled = !sizeOk(); });
  hi.addEventListener('input', () => { apply.disabled = !sizeOk(); });
  apply.addEventListener('click', () => {
    if (!sizeOk()) return;
    const nw = Math.round(Number(wi.value)), nh = Math.round(Number(hi.value));
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
    const v = tall.value === '' ? NaN : clamp(Math.round(Number(tall.value)), 4, 2000);
    if (!Number.isFinite(v) || v === m.walker || S.maps[id] !== m) { tall.value = m.walker; return; }
    remember([id]);
    m.walker = v;
    changed('People are now ' + v + ' pixels tall on this map. The little figure at the start shows it.');
  });
  el('p', { class: 'wp-small' }, box, 'It sets how wide a path must be to walk along, and how big people look on a walk.');
  walkSliders(box, id, m);
  // deleting it (twice, to be sure)
  const del = el('button', { type: 'button', class: 'wp-danger' }, box, 'Delete this map');
  if (armed && armed.id === id) { del.textContent = 'Sure? Tap again to delete ' + m.name; del.classList.add('is-armed'); }
  del.addEventListener('click', () => {
    if (!armed || armed.id !== id || S.maps[id] !== m) {
      if (armed) clearTimeout(armed.timer);
      del.textContent = 'Sure? Tap again to delete ' + m.name;
      del.classList.add('is-armed');
      armed = { id, timer: setTimeout(() => { armed = null; del.textContent = 'Delete this map'; del.classList.remove('is-armed'); }, 4000) };
      return;
    }
    clearTimeout(armed.timer);
    armed = null;
    const was = m.name;
    deleteMap(id);
    changed(was + ' deleted. Undo brings it back.');
    emit('maps');
    ed.showView();
  });
}

// the world map's list of the other maps: on it already, or a button to put it on
function placesList(box, world, w) {
  const others = S.order.filter((k) => k !== world && !isWorld(S.maps[k]));
  el('h3', null, box, 'Places on the world map');
  if (!others.length) { el('p', { class: 'wp-small' }, box, 'Add the pictures of the other maps, then put each one on the world map here.'); return; }
  const ul = el('ul', { class: 'wp-places' }, box);
  for (const k of others) {
    const li = el('li', null, ul), i = (w.places || []).findIndex((q) => q.to === k);
    el('span', null, li, mapName(k));
    if (i >= 0) {
      el('small', null, li, 'on the map');
      el('button', { type: 'button' }, li, 'Show').addEventListener('click', () => emit('open-map', { id: world, sel: { kind: 'place', i } }));
    } else {
      const b = el('button', { type: 'button', class: 'wp-primary', 'data-put': k }, li, 'Put it on');
      b.addEventListener('click', () => {
        ed.setTool('place');
        S.placeFor = k;
        emit('tool');
        ed.note('Tap the world map where ' + mapName(k) + ' is.');
      });
    }
  }
}

// on a walk: how close the camera is and how fast she walks, on this map (live while walking)
function walkSliders(box, id, m) {
  el('h3', null, box, 'On a walk');
  const slider = (label, idName, min, max, step, value, show, set) => {
    const f = el('label', { class: 'wp-field wp-slider' }, box);
    const top = el('span', null, f, label + ' ');
    const b = el('b', null, top, show(value));
    const inp = el('input', { type: 'range', min, max, step, id: idName }, f);
    inp.value = String(value);
    let kept = false;
    inp.addEventListener('pointerdown', () => { kept = false; });
    inp.addEventListener('input', () => {
      if (!kept) { remember([id]); kept = true; }
      const v = Number(inp.value);
      b.textContent = show(v);
      set(v);
      S.rev++;
      emit('tuned', id);
    });
    inp.addEventListener('change', () => { if (kept) changed(''); kept = false; });
  };
  slider('How close the camera is', 'wp-map-zoom', 0.4, 3, 0.1, Math.round(((m.zoom || ZOOM) / ZOOM) * 10) / 10, (v) => v.toFixed(1) + '×', (v) => { m.zoom = Math.round(v * ZOOM * 1000) / 1000; });
  slider('Walking speed', 'wp-map-pace', 0.5, 6, 0.1, m.pace || PACE, (v) => (Math.abs(v - PACE) < 0.05 ? 'normal' : v < PACE ? 'slower' : 'faster') + ' (' + v.toFixed(1) + ')', (v) => { m.pace = Math.round(v * 100) / 100; });
  el('p', { class: 'wp-small' }, box, 'Speed is in her own heights a second. Try them while you walk: they change at once.');
}

// ---------------------------------------------------------------------------------------------
// layers, and what she can't reach

export function renderLayers() {
  for (const k of Object.keys(S.layers)) { const c = $('wp-l-' + k); if (c) c.checked = !!S.layers[k]; }
  $('wp-showpaths').checked = !!S.showPaths;
  const w = $('wp-walker');
  if (!w.options.length && window.WalkingPathsEngine) {
    for (const l of window.WalkingPathsEngine.looks()) el('option', { value: l }, w, WALKER_NAMES[l] || LOOK_NAMES[l] || l);
  }
  if (w.options.length && ![...w.options].some((o) => o.value === S.walker)) S.walker = w.options[0].value;
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

// (`more`: anything else to show under the text, like a list to pick from)
export function ask(title, text, buttons, more) {
  return new Promise((resolve) => {
    const d = $('wp-dialog'), row = $('wp-dialog-buttons'), extra = $('wp-dialog-more');
    $('wp-dialog-title').textContent = title;
    $('wp-dialog-text').textContent = text;
    row.textContent = '';
    extra.textContent = '';
    if (more) extra.appendChild(more);
    const done = (v) => { d.hidden = true; extra.textContent = ''; document.removeEventListener('keydown', onKey, true); resolve(v); };
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
