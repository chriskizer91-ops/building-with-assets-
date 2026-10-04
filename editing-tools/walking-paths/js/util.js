// Small helpers used all over the page.

export const $ = (id) => document.getElementById(id);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clone = (v) => JSON.parse(JSON.stringify(v));
export const isPt = (p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);
export const isRect = (r) => Array.isArray(r) && r.length === 4 && r.every(Number.isFinite);
export const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
export const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

export function el(tag, attrs, parent, text) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

// a name a game's code can use: "The Old Mill!" -> "the-old-mill"
export const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

// "old_mill-map.final.png" -> "Old mill map final"
export function niceName(fileName) {
  const base = String(fileName || '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base || /^(image|blob|clipboard|pasted( image)?( \d+)?|screenshot.*|untitled|img \d+|dsc\w* ?\d+|photo( \d+)?)$/i.test(base)) return '';
  return cap(base).slice(0, 60);
}

export const newKey = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
}

export const clockTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function sizeText(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// JSON a person can read: every [x, y] and every short list of numbers on one line
export function prettyJson(value) {
  const atom = '(?:-?\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?|null|true|false|"[^"\\\\\\n]*")';
  return JSON.stringify(value, null, 2)
    .replace(new RegExp('\\[\\s+(' + atom + '(?:,\\s+' + atom + ')*)\\s+\\]', 'g'), (m, inner) => '[' + inner.split(/,\s+/).join(', ') + ']')
    .replace(/\[\s+(\[-?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?\](?:,\s+\[-?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?\])*)\s+\]/g, (m, inner) => '[' + inner.split(/,\s+(?=\[)/).join(', ') + ']');
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error('could not read the file'));
    r.readAsDataURL(blob);
  });
}

export function dataURLToBlob(url) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(url);
  if (!m) throw new Error('not a data address');
  const type = m[1] || 'application/octet-stream';
  if (!m[2]) return new Blob([decodeURIComponent(m[3])], { type });
  const bin = atob(m[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export const extFor = (type, fallbackName) => {
  const t = String(type || '').toLowerCase();
  const known = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/bmp': 'bmp' };
  if (known[t]) return known[t];
  const m = /\.([a-z0-9]{2,5})$/i.exec(fallbackName || '');
  return m ? m[1].toLowerCase() : 'png';
};

export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
