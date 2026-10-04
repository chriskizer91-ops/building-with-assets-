// Walking Paths: starts everything and joins the buttons to what they do.

import { S, map, on, emit, undo, redo, forgetHistory, remember, changed } from './state.js';
import * as store from './store.js';
import { loadKept, addExamples, keepSoon, keepNow, mapsLeadingTo } from './project.js';
import { checkSoon } from './check.js';
import * as ed from './editor.js';
import * as panel from './panel.js';
import * as files from './files.js';
import { toggleWalk, stopWalk, setWalker, setShowPaths, currentField } from './walk.js';
import { $ } from './util.js';

// ---------------------------------------------------------------------------------------------
// keeping the screen up to date

function renderAll(forceForm) {
  panel.renderBar();
  panel.renderTools();
  panel.renderPicked(forceForm);
  panel.renderMaps();
  panel.renderLayers();
  panel.renderKept();
  ed.draw();
}

let mapsShown = '';
on('changed', (say) => {
  if (S.sel && !ed.valid(S.sel)) S.sel = null;
  keepSoon();
  checkSoon();
  panel.renderBar();
  panel.renderPicked();
  // the list is rebuilt when maps come or go or change their names or sizes, the settings only then
  const sig = S.cur + '|' + S.order.map((id) => id + ':' + S.maps[id].name + ':' + S.maps[id].size + ':' + S.maps[id].walk.length + ':' + S.maps[id].exits.length + ':' + !!S.maps[id].pic).join(',');
  if (sig !== mapsShown) { mapsShown = sig; panel.renderMaps(); }
  panel.renderKept();
  if (say) ed.note(say);
});
on('maps', () => { mapsShown = ''; panel.renderMaps(); panel.renderBar(); panel.renderKept(); });
on('moving', () => panel.renderPicked());
on('picked', () => { panel.renderPicked(); panel.renderBar(); });
on('draft', () => { panel.renderPicked(); panel.renderBar(); });
on('tool', () => { panel.renderTools(); panel.renderPicked(); panel.renderBar(); });
on('layers', () => panel.renderLayers());
on('walking', () => { panel.renderBar(); panel.renderTools(); if (!S.walking) { mapsShown = ''; panel.renderMaps(); keepSoon(); } });
const WAND_SAY = $('wp-wand-say').textContent;
on('wand', (busy) => { $('wp-wand-say').textContent = busy ? 'Looking round the picture…' : WAND_SAY; });

// another map on screen (from the list, a way out's "Show it", an arrival's "Go to that way out")
on('open-map', ({ id, sel }) => {
  if (!S.maps[id]) return;
  if (S.walking) stopWalk();
  if (id !== S.cur) {
    ed.keepView();
    S.cur = id;
    S.draft = null;
    S.hover = null;
    if (S.tool !== 'select') ed.setTool('select');
    ed.showView();
  }
  S.sel = sel && ed.valid(sel) ? sel : null;
  if (S.sel) {
    const m = map(), s = S.sel;
    const p = s.kind === 'exit' ? [(m.exits[s.i].rect[0] + m.exits[s.i].rect[2]) / 2, (m.exits[s.i].rect[1] + m.exits[s.i].rect[3]) / 2] : ed.pointOf(m, s);
    if (p) ed.centreOn(p[0], p[1]);
  }
  mapsShown = '';
  renderAll(true);
  checkSoon();
  keepSoon();
});

on('undo', doUndo);
on('redo', doRedo);
on('walk', toggleWalk);
on('replace-picture', () => $('wp-file-replace').click());

function afterHistory(say, was) {
  if (S.sel && !ed.valid(S.sel)) S.sel = null;
  S.draft = null;
  panel.forgetForm();
  if (S.cur !== was) ed.showView();
  changed(say);
  emit('maps');
  renderAll(true);
}
function doUndo() {
  if (S.walking) stopWalk();
  if (S.draft) { ed.takeBack(); return; }
  const was = S.cur;
  if (!undo()) { ed.note('Nothing to undo.'); return; }
  afterHistory('Undone.', was);
}
function doRedo() {
  if (S.walking) stopWalk();
  if (S.draft) return;
  const was = S.cur;
  if (!redo()) { ed.note('Nothing to redo.'); return; }
  afterHistory('Redone.', was);
}

// ---------------------------------------------------------------------------------------------
// the buttons

$('wp-undo').addEventListener('click', doUndo);
$('wp-redo').addEventListener('click', doRedo);
$('wp-zoom-in').addEventListener('click', () => ed.zoomBy(1.25));
$('wp-zoom-out').addEventListener('click', () => ed.zoomBy(0.8));
$('wp-fit').addEventListener('click', () => ed.fit());
$('wp-walk').addEventListener('click', toggleWalk);
$('wp-draw-done').addEventListener('click', () => ed.finishDraft());
$('wp-draw-back').addEventListener('click', () => ed.takeBack());
$('wp-draw-cancel').addEventListener('click', () => ed.cancelDraft(true));

document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => ed.setTool(b.dataset.tool)));
document.querySelectorAll('[data-drawby]').forEach((b) => b.addEventListener('click', () => {
  S.drawBy = b.dataset.drawby;
  if (S.draft && S.drawBy === 'wand') ed.cancelDraft(false);
  // the wand is for shapes: pick one to use it on
  if (!ed.isShape(S.tool)) ed.setTool('walk');
  panel.renderTools();
  panel.renderPicked();
  panel.renderBar();
  keepSoon();
}));
const spread = $('wp-spread');
spread.addEventListener('input', () => { S.spread = Number(spread.value); $('wp-spread-val').textContent = spread.value; });
spread.addEventListener('change', () => {
  S.spread = Number(spread.value);
  keepSoon();
  if (!ed.rewand()) ed.note('Spread set to ' + S.spread + '. Tap the picture to outline with it.');
});

$('wp-smooth').addEventListener('click', () => ed.smoothPicked());
$('wp-fewer').addEventListener('click', () => ed.fewerPicked());
$('wp-delete').addEventListener('click', () => (S.draft ? ed.takeBack() : ed.deletePicked()));

$('wp-add').addEventListener('click', () => $('wp-file-pictures').click());
$('wp-empty-add').addEventListener('click', () => $('wp-file-pictures').click());
$('wp-open').addEventListener('click', () => $('wp-file-open').click());
$('wp-empty-open').addEventListener('click', () => $('wp-file-open').click());
$('wp-empty-examples').addEventListener('click', async () => {
  const ids = await addExamples();
  if (!ids.length) { ed.note('The examples aren’t in this copy of the page.'); return; }
  ed.showView();
  changed('The two examples are back: Wickhollow and its jetty, from Envoi on the Longest Night.');
  emit('maps');
});
$('wp-remove-examples').addEventListener('click', () => {
  const ex = S.order.filter((id) => S.maps[id].example);
  if (!ex.length) return;
  const touched = new Set(ex);
  for (const id of ex) for (const k of mapsLeadingTo(id)) touched.add(k);
  remember([...touched]);
  for (const id of ex) delete S.maps[id];
  S.order = S.order.filter((id) => S.maps[id]);
  if (!S.maps[S.cur]) { S.cur = S.order[0] || null; S.sel = null; S.draft = null; ed.showView(); }
  changed('Examples removed. Undo brings them back.');
  emit('maps');
  renderAll(true);
});

const takeFiles = (input, fn) => input.addEventListener('change', async () => {
  const list = [...input.files];
  input.value = '';
  if (list.length) await fn(list);
  renderAll(true);
});
takeFiles($('wp-file-pictures'), files.addPictures);
takeFiles($('wp-file-open'), files.openFiles);
takeFiles($('wp-file-replace'), (l) => files.replacePicture(l[0]));

$('wp-save').addEventListener('click', files.saveMapsFile);
$('wp-save-data').addEventListener('click', files.saveDataOnly);
$('wp-copy').addEventListener('click', files.copyData);
$('wp-save-picture').addEventListener('click', files.savePicture);
$('wp-save-mask').addEventListener('click', files.saveMask);
$('wp-save-page').addEventListener('click', files.saveWalkPage);

for (const k of Object.keys(S.layers)) {
  const c = $('wp-l-' + k);
  c.addEventListener('change', () => {
    S.layers[k] = c.checked;
    const s = S.sel;
    if (s && !c.checked && (s.kind === k || (k === 'exits' && /^(exit|arrival|start)$/.test(s.kind)) || (k === 'people' && /^(person|spot)$/.test(s.kind)))) S.sel = null;
    S.hover = null;
    if (k === 'reach') checkSoon();
    panel.renderPicked();
    panel.renderReach();
    ed.draw();
    keepSoon();
    c.blur();
  });
}
$('wp-walker').addEventListener('change', (e) => { S.walker = e.target.value; setWalker(S.walker); keepSoon(); });
$('wp-showpaths').addEventListener('change', (e) => { S.showPaths = e.target.checked; setShowPaths(S.showPaths); keepSoon(); });

// buttons shouldn't keep the keyboard after a tap (Space and Enter belong to the picture)
document.addEventListener('pointerup', (e) => {
  const b = e.target && e.target.closest ? e.target.closest('.wp-bar button, .wp-panel button, .wp-drawbar button') : null;
  if (b) setTimeout(() => b.blur(), 0);
});

// pictures dropped on the page, or pasted
let dragDepth = 0;
const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
window.addEventListener('dragenter', (e) => { if (!hasFiles(e) || S.walking) return; e.preventDefault(); dragDepth++; $('wp-drop').hidden = false; });
window.addEventListener('dragover', (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('wp-drop').hidden = true; });
window.addEventListener('drop', async (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  $('wp-drop').hidden = true;
  if (S.walking) return;
  await files.openFiles(e.dataTransfer.files);
  renderAll(true);
});
document.addEventListener('paste', async (e) => {
  const t = e.target && e.target.tagName;
  if (t === 'INPUT' || t === 'TEXTAREA' || S.walking || !e.clipboardData) return;
  const list = [...(e.clipboardData.files || [])].filter((f) => /^image\//.test(f.type));
  if (!list.length) return;
  e.preventDefault();
  await files.addPictures(list.map((f, i) => (f.name && f.name !== 'image.png' ? f : new File([f], 'pasted-' + (i + 1) + '.' + (f.type.split('/')[1] || 'png'), { type: f.type }))));
  renderAll(true);
});

window.addEventListener('pagehide', () => keepNow());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') keepNow(); });

// ---------------------------------------------------------------------------------------------
// starting

async function start() {
  const kept = await store.openStore();
  let had = false;
  if (kept) {
    try { had = await loadKept(); } catch { had = false; }
  }
  if (!had) await addExamples();
  forgetHistory();
  if (!S.cur) S.cur = S.order[0] || null;
  panel.renderKept(kept);
  mapsShown = '';
  renderAll(true);
  ed.showView();
  checkSoon();
  files.lookForDownloads();
  if (kept && !had) keepNow();
  // for tools/walking-paths-smoke.mjs, and anyone curious in the browser's console
  window.WalkingPaths = { S, ed, files, panel, field: currentField, ready: true };
  document.documentElement.dataset.ready = '1';
}
start();
