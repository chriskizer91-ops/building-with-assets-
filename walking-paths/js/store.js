// Keeping the work in this browser (IndexedDB, database "walking-paths"): the maps under "project",
// each picture under "pic:<key>". If the browser won't keep anything (a private window, some
// viewers), everything still works for as long as the page is open, and the page says so.

const DB = 'walking-paths', STORE = 'kv';
let db = null, works = false;

export async function openStore() {
  try {
    db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('blocked'));
      setTimeout(() => reject(new Error('timed out')), 4000);
    });
    // a write that comes back proves it really keeps things
    await put('probe', 1);
    works = (await get('probe')) === 1;
  } catch {
    db = null;
    works = false;
  }
  return works;
}

export const kept = () => works;

function tx(mode, fn) {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('no store')); return; }
    let t;
    try { t = db.transaction(STORE, mode); } catch (e) { reject(e); return; }
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req && req.result);
    t.onerror = () => reject(t.error || new Error('store error'));
    t.onabort = () => reject(t.error || new Error('store aborted'));
  });
}

export async function get(key) {
  try { return await tx('readonly', (s) => s.get(key)); } catch { return undefined; }
}
export async function put(key, value) {
  try { await tx('readwrite', (s) => s.put(value, key)); return true; } catch { return false; }
}
export async function del(key) {
  try { await tx('readwrite', (s) => s.delete(key)); return true; } catch { return false; }
}
export async function keys() {
  try { return (await tx('readonly', (s) => s.getAllKeys())) || []; } catch { return []; }
}
