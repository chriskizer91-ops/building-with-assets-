// "Walk it": the walk engine over the picture, on these maps as they are now. She starts where you
// were looking (or as near as she can stand), and the ways out take her between the maps.

import { S, map, emit } from './state.js';
import { pictureURL } from './pictures.js';
import { engineMaps, nearestStand } from './check.js';
import * as ed from './editor.js';
import { $ } from './util.js';

let field = null;

export async function startWalk() {
  if (S.walking || !map() || !window.WalkingPathsEngine || ed.busy()) return;
  ed.cancelDraft(false);
  const id = S.cur, [cx, cy] = ed.viewCentre();
  const at = nearestStand(id, cx, cy) || map().start;
  S.walking = true;
  S.hover = null;
  const host = $('wp-walk-host');
  host.hidden = false;
  $('wp-cv').hidden = true;
  $('wp-readout').hidden = true;
  $('wp-note').hidden = true;
  $('wp-stage').classList.add('is-walking');
  emit('walking');
  let left = false;
  field = window.WalkingPathsEngine.create(host, {
    maps: engineMaps(),
    picture: (k) => (S.maps[k] && S.maps[k].pic ? pictureURL(S.maps[k].pic.key) : null),
    walker: S.walker,
    showPaths: S.showPaths,
    menuLabel: '✎ Back to editing',
    onMenu: stopWalk,
    onEscape: stopWalk,
    // through a way out: the panel shows the map she is on now, so its sliders tune that one
    onMap: (k) => {
      if (!S.walking || !S.maps[k] || k === S.cur) return;
      if (!left) { ed.keepView(); left = true; }
      S.cur = k;
      S.sel = null;
      emit('maps');
    },
  });
  const f = field;
  try {
    await f.load(id, at, 's');
    if (field === f && !nearestStand(id, at[0], at[1])) f.note('There is nowhere on this map she can stand yet: draw a walk area first.');
  } catch (e) {
    if (field !== f) return;
    stopWalk();
    ed.note('Walking couldn’t start: ' + (e && e.message ? e.message : e));
  }
}

export function stopWalk() {
  if (!S.walking) return;
  if (field) {
    const k = field.mapId;
    if (k && S.maps[k]) {
      S.lastWalk[k] = [Math.round(field.me.x), Math.round(field.me.y)];
      if (k !== S.cur) { ed.keepView(); S.cur = k; S.sel = null; }
    }
    field.stop();
    field = null;
  }
  S.walking = false;
  $('wp-walk-host').hidden = true;
  $('wp-stage').classList.remove('is-walking');
  $('wp-cv').hidden = false;
  emit('walking');
  ed.showView();
  const io = S.lastWalk[S.cur];
  if (io) ed.centreOn(io[0], io[1]);
  try { $('wp-cv').focus({ preventScroll: true }); } catch { /* fine */ }
}

export const toggleWalk = () => (S.walking ? stopWalk() : startWalk());
export const currentField = () => field;
export function setWalker(look) { if (field) field.setWalker(look); }
export function setShowPaths(on) { if (field) field.setShowPaths(on); }
