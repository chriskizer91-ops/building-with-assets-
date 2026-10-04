// The maps' pictures: kept as they came (the file's own bytes), shown through object addresses.

import * as store from './store.js';
import { newKey } from './util.js';

const cache = new Map(); // key -> { blob, url, img }

export async function addPicture(blob) {
  const key = newKey('p');
  cache.set(key, { blob, url: null, img: null });
  await store.put('pic:' + key, blob);
  return key;
}

// a picture kept from before (true when it was there)
export async function loadPicture(key) {
  if (cache.has(key)) return true;
  const blob = await store.get('pic:' + key);
  if (!(blob instanceof Blob)) return false;
  cache.set(key, { blob, url: null, img: null });
  return true;
}

export const hasPicture = (key) => !!key && cache.has(key);
export const pictureBlob = (key) => (cache.get(key) || {}).blob || null;

export function pictureURL(key) {
  const c = cache.get(key);
  if (!c) return null;
  if (!c.url) c.url = URL.createObjectURL(c.blob);
  return c.url;
}

// the picture as an <img> (it may still be loading: check img.complete && img.naturalWidth)
export function pictureImage(key, onload) {
  const c = cache.get(key);
  if (!c) return null;
  if (!c.img) {
    c.img = new Image();
    c.img.decoding = 'async';
    c.img.onload = () => { if (onload) onload(); };
    c.img.onerror = () => { c.img.failed = true; if (onload) onload(); };
    c.img.src = pictureURL(key);
  }
  return c.img;
}

export const pictureReady = (key) => {
  const img = pictureImage(key);
  return !!(img && img.complete && img.naturalWidth);
};

export function whenReady(key) {
  return new Promise((resolve) => {
    const img = pictureImage(key);
    if (!img) { resolve(null); return; }
    if (img.complete && (img.naturalWidth || img.failed)) { resolve(img.naturalWidth ? img : null); return; }
    img.addEventListener('load', () => resolve(img), { once: true });
    img.addEventListener('error', () => resolve(null), { once: true });
  });
}

// how big a picture file is, in pixels (null when it isn't a picture this browser can show)
export function measure(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) { w = 1536; h = 1024; } // an SVG without a size
      URL.revokeObjectURL(url);
      resolve({ w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// forget pictures no map uses any more (only at start, so undo can still bring a deleted map back)
export async function tidy(usedKeys) {
  const used = new Set(usedKeys);
  for (const k of await store.keys()) if (typeof k === 'string' && k.startsWith('pic:') && !used.has(k.slice(4))) await store.del(k);
}
