// Everything the page knows, in one place, and the undo history.
//
// A map, as kept here (the maps file's shape plus three things of the page's own):
//   { name, size: [w, h], walker, start, walk, block, front, exits, people, spots,
//     pic: { key, type, file, w, h } | null,   the picture, kept in the store under pic:<key>
//     example: true,                           one of the example maps
//     ...anything else a maps file had (a game's own fields are kept as they were) }
// Points are whole map pixels from the top left; size is the map's size in those pixels.

export const S = {
  maps: {},              // id -> map
  order: [],             // map ids, in the list's order
  cur: null,             // the map on screen
  tool: 'select',        // select | walk | block | front | exit | person | thing | story
  drawBy: 'hand',        // hand | wand
  spread: 40,            // how far the magic wand spreads
  sel: null,             // what is picked: { kind, i, sub? }
  hover: null,
  draft: null,           // the shape being drawn: [[x, y], ...]
  layers: { walk: true, block: true, front: true, exits: true, people: true, reach: false },
  walker: 'io',
  showPaths: false,
  walking: false,
  rev: 0,                // goes up with every change to the maps
  views: {},             // id -> { x, y, z }, where each map was last looked at
  lastWalk: {},          // id -> [x, y], where she stood when a walk ended
};

const handlers = {};
export function on(name, fn) { (handlers[name] || (handlers[name] = [])).push(fn); }
export function emit(name, arg) { for (const fn of handlers[name] || []) fn(arg); }

export const map = () => (S.cur ? S.maps[S.cur] : null);
export const mapSize = (m) => (m && Array.isArray(m.size) ? m.size : [1536, 1024]);

// the maps' data changed: everything that shows it redraws, and it is kept
export function changed(say) {
  S.rev++;
  emit('changed', say);
}

// ---------------------------------------------------------------------------------------------
// Undo: each step keeps, as text, the maps it is about to change (null for a map that doesn't
// exist yet), the list's order and the map on screen. Undoing puts them back.

const undos = [], redos = [];
const LIMIT = 200;

function snapshot(ids) {
  const maps = {};
  for (const id of ids) maps[id] = S.maps[id] ? JSON.stringify(S.maps[id]) : null;
  return { maps, order: S.order.slice(), cur: S.cur };
}

// call before changing the maps `ids` (the current map when left out)
export function remember(ids) {
  ids = ids || [S.cur];
  undos.push(snapshot(ids.filter(Boolean)));
  if (undos.length > LIMIT) undos.shift();
  redos.length = 0;
}

function restore(step) {
  for (const id of Object.keys(step.maps)) {
    if (step.maps[id] === null) delete S.maps[id];
    else S.maps[id] = JSON.parse(step.maps[id]);
  }
  S.order = step.order.filter((id) => S.maps[id]);
  for (const id of Object.keys(S.maps)) if (!S.order.includes(id)) S.order.push(id);
  if (step.cur && S.maps[step.cur]) S.cur = step.cur;
  else if (!S.maps[S.cur]) S.cur = S.order[0] || null;
}

export function undo() {
  const step = undos.pop();
  if (!step) return false;
  redos.push(snapshot(Object.keys(step.maps)));
  restore(step);
  return true;
}
export function redo() {
  const step = redos.pop();
  if (!step) return false;
  undos.push(snapshot(Object.keys(step.maps)));
  restore(step);
  return true;
}
// take back the last step without keeping it for redo (the wand's spread slider redoing a fill)
export function dropLast() {
  const step = undos.pop();
  if (step) restore(step);
  return !!step;
}
export const canUndo = () => undos.length > 0;
export const canRedo = () => redos.length > 0;
export const undoDepth = () => undos.length;
export function forgetHistory() { undos.length = 0; redos.length = 0; }
