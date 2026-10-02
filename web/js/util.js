// Small helpers shared by the views.

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) e.style.setProperty(sk, sv); else e.style[sk] = sv; }
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return e;
}

export function fmtBytes(n) {
  if (n == null || isNaN(n)) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' MB';
  return (n / 1073741824).toFixed(1) + ' GB';
}

export function fmtDuration(sec) {
  sec = Math.round(sec || 0);
  if (sec < 60) return sec ? sec + 's' : '';
  const m = Math.floor(sec / 60), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}

export function fmtWhen(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date();
  const day = 86400000;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const hm = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (ts >= startToday) return 'Today ' + hm;
  if (ts >= startToday - day) return 'Yesterday';
  if (ts >= startToday - 6 * day) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function debounce(fn, ms) {
  let t = 0;
  const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  f.flush = (...a) => { clearTimeout(t); fn(...a); };
  return f;
}

export class Emitter {
  constructor() { this.h = new Map(); }
  on(ev, fn) { if (!this.h.has(ev)) this.h.set(ev, new Set()); this.h.get(ev).add(fn); return () => this.h.get(ev).delete(fn); }
  emit(ev, ...a) { for (const fn of this.h.get(ev) || []) { try { fn(...a); } catch (e) { console.error(e); } } }
}

// A web address can't hold every name, so each game's save slot is a slug of its title.
export function slug(s) {
  const t = String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
  return t;
}

export function saveKeyFor(title, file) {
  let k = slug(title) || slug(String(file || '').replace(/\.[a-z0-9]+$/i, '')) || 'game';
  if (/^\d+$/.test(k) || ['www', 'mooncart', 'shell', 'localhost'].includes(k)) k = 'game-' + k;
  return k;
}

export function uid() {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function decodeEntities(s) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', copy: '©' };
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isNaN(n) ? m : String.fromCodePoint(n); }
    return named[e.toLowerCase()] ?? m;
  });
}

export function titleFromHtml(text) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : '';
}

export function cleanName(name) {
  return String(name || '').replace(/[\u0000-\u001f<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
