#!/usr/bin/env node
// Runs Mooncart in a desktop browser, standing in for the Android app: it serves web/, keeps
// the library's files in a data folder, and gives each game its own address
// (http://<save-slot>.localhost:PORT/), the way the phone does with https://<save-slot>.mooncart.invalid/.
//
//   node tools/dev-server.mjs [--port 8090] [--data .dev-data] [--collection build/collection]
//
// Then open http://localhost:8090/ (add ?noboot to skip the intro).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { writeZip, readZip } from './zip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : '1']] : a), []));
const PORT = Number(args.port || process.env.PORT || 8090);
const DATA = path.resolve(args.data || process.env.MOONCART_DATA || path.join(ROOT, '.dev-data'));
const COLLECTION = path.resolve(args.collection || process.env.MOONCART_COLLECTION || path.join(ROOT, 'build', 'collection'));
const WEB = path.join(ROOT, 'web');
for (const d of ['blobs', 'thumbs', 'backups']) fs.mkdirSync(path.join(DATA, d), { recursive: true });

const MIME = {
  '.html': 'text/html', '.htm': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.wasm': 'application/wasm', '.txt': 'text/plain', '.zip': 'application/zip', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
};
const mime = (f) => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
const registry = new Map(); // save slot -> src
const TEXT_NAME = /^[a-z0-9._-]+\.json$/i;

function inside(base, p) {
  const r = path.resolve(base, p);
  return r === base || r.startsWith(base + path.sep) ? r : null;
}

function srcPath(src) {
  if (!src) return null;
  if (src.startsWith('builtin:')) return inside(COLLECTION, src.slice(8));
  if (src.startsWith('user:')) return /^[a-f0-9]{8,64}$/.test(src.slice(5)) ? path.join(DATA, 'blobs', src.slice(5)) : null;
  return null;
}

function send(res, code, body, type = 'text/plain', extra = {}) {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', ...extra });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function titleOf(buf) {
  const text = buf.subarray(0, 2_000_000).toString('utf8');
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&#(\d+);/g, (a, n) => String.fromCodePoint(+n)).replace(/\s+/g, ' ').trim() : '';
}

// Put the console's helper at the top of a game's page (after <head>, never before the doctype).
function injectHelper(buf) {
  const tag = Buffer.from('<script src="/__mooncart/helper.js"></script>');
  const head = buf.subarray(0, 65536).toString('latin1');
  let at = -1;
  const h = /<head\b[^>]*>/i.exec(head);
  if (h) at = h.index + h[0].length;
  else { const d = /<!doctype[^>]*>/i.exec(head); at = d ? d.index + d[0].length : 0; }
  return Buffer.concat([buf.subarray(0, at), tag, buf.subarray(at)]);
}

function serveFile(res, file, { inject = false } = {}) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'not found');
    // a game's page is always a web page, whatever its stored file is called (added games have no extension)
    const type = inject ? 'text/html' : mime(file);
    if (inject && type === 'text/html') {
      fs.readFile(file, (e, buf) => (e ? send(res, 500, String(e)) : send(res, 200, injectHelper(buf), type)));
      return;
    }
    res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}

async function api(req, res, url) {
  const p = url.pathname.slice(5);
  if (p === 'info') return send(res, 200, JSON.stringify({ platform: 'dev', version: '0.1.0', webview: req.headers['user-agent'] }), 'application/json');
  if (p.startsWith('text/')) {
    const name = decodeURIComponent(p.slice(5));
    if (!TEXT_NAME.test(name)) return send(res, 400, 'bad name');
    const f = path.join(DATA, name);
    if (req.method === 'PUT') { fs.writeFileSync(f + '.tmp', await readBody(req)); fs.renameSync(f + '.tmp', f); return send(res, 200, 'ok'); }
    // a file that isn't there yet reads as empty (first run), without a 404 in the browser console
    return send(res, 200, fs.existsSync(f) ? fs.readFileSync(f) : '', 'application/json');
  }
  if (p === 'collection') {
    const f = path.join(COLLECTION, 'collection.json');
    return send(res, 200, fs.existsSync(f) ? fs.readFileSync(f) : '{"games":[]}', 'application/json');
  }
  if (p === 'blob' && req.method === 'POST') {
    const body = await readBody(req);
    const id = crypto.randomBytes(8).toString('hex');
    fs.writeFileSync(path.join(DATA, 'blobs', id), body);
    return send(res, 200, JSON.stringify({ blob: id, name: url.searchParams.get('name') || 'game.html', size: body.length, title: titleOf(body) }), 'application/json');
  }
  if (p.startsWith('blob/')) {
    const id = p.slice(5);
    if (!/^[a-f0-9]{8,64}$/.test(id)) return send(res, 400, 'bad id');
    const f = path.join(DATA, 'blobs', id);
    if (req.method === 'DELETE') { fs.rmSync(f, { force: true }); return send(res, 200, 'ok'); }
    if (req.method === 'PUT') { fs.writeFileSync(f, await readBody(req)); return send(res, 200, 'ok'); }
  }
  if (p === 'register' && req.method === 'POST') {
    const { key, src } = JSON.parse((await readBody(req)).toString());
    if (!/^[a-z0-9-]{1,63}$/.test(key) || !srcPath(src)) return send(res, 400, 'bad');
    registry.set(key, src);
    return send(res, 200, 'ok');
  }
  if (p === 'backup' && req.method === 'POST') {
    const extra = (await readBody(req)).toString();
    const data = JSON.parse(extra);
    const entries = [{ name: 'mooncart-backup.json', data: Buffer.from(extra) }];
    for (const it of Object.values(data.library?.items || {})) {
      if (it.type === 'game' && it.src?.startsWith('user:')) {
        const f = srcPath(it.src);
        if (f && fs.existsSync(f)) entries.push({ name: 'files/' + it.src.slice(5), data: fs.readFileSync(f) });
      }
      if (it.thumb && fs.existsSync(path.join(DATA, 'thumbs', it.thumb))) entries.push({ name: 'thumbs/' + it.thumb, data: fs.readFileSync(path.join(DATA, 'thumbs', it.thumb)) });
    }
    const file = `mooncart-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    fs.writeFileSync(path.join(DATA, 'backups', file), writeZip(entries));
    return send(res, 200, JSON.stringify({ file }), 'application/json');
  }
  if (p.startsWith('backup/')) {
    const f = inside(path.join(DATA, 'backups'), decodeURIComponent(p.slice(7)));
    return f ? serveFile(res, f) : send(res, 404, '');
  }
  if (p === 'restore' && req.method === 'POST') {
    const entries = readZip(await readBody(req));
    let json = null;
    for (const e of entries) {
      if (e.name === 'mooncart-backup.json') json = e.data.toString('utf8');
      else if (/^files\/[a-f0-9]{8,64}$/.test(e.name)) fs.writeFileSync(path.join(DATA, 'blobs', e.name.slice(6)), e.data);
      else if (/^thumbs\/[A-Za-z0-9._-]+$/.test(e.name)) fs.writeFileSync(path.join(DATA, 'thumbs', e.name.slice(7)), e.data);
    }
    return json ? send(res, 200, json, 'application/json') : send(res, 400, 'no backup inside');
  }
  return send(res, 404, 'no such api');
}

const server = http.createServer(async (req, res) => {
  if (args.log) res.on('finish', () => { if (res.statusCode >= 400) console.log(res.statusCode, req.headers.host, req.url.slice(0, 120)); });
  try {
    const host = (req.headers.host || '').split(':')[0].toLowerCase();
    const url = new URL(req.url, 'http://x');
    const sub = host.endsWith('.localhost') ? host.slice(0, -'.localhost'.length) : null;
    if (sub) {
      // a game's own address
      if (url.pathname.startsWith('/__mooncart/')) return serveFile(res, inside(path.join(WEB, '__mooncart'), url.pathname.slice(12)) || '');
      const src = registry.get(sub);
      const file = srcPath(src);
      if (!file) return send(res, 404, 'This game is not running.');
      const rest = decodeURIComponent(url.pathname.slice(1));
      if (!rest || !rest.includes('/') && /\.(x?html?)$/i.test(rest)) return serveFile(res, file, { inject: true });
      // relative files next to a built-in game
      if (src.startsWith('builtin:')) { const f = inside(path.dirname(file), rest); if (f) return serveFile(res, f); }
      return send(res, 404, 'not found');
    }
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname === '/raw') { const f = srcPath(url.searchParams.get('src')); return f ? serveFile(res, f) : send(res, 404, ''); }
    if (url.pathname.startsWith('/thumbs/')) { const f = inside(path.join(DATA, 'thumbs'), decodeURIComponent(url.pathname.slice(8))); return f ? serveFile(res, f) : send(res, 404, ''); }
    const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const f = inside(WEB, rel);
    return f ? serveFile(res, f) : send(res, 404, '');
  } catch (e) {
    console.error(e);
    send(res, 500, String(e && e.stack || e));
  }
});

server.listen(PORT, () => console.log(`Mooncart test server: http://localhost:${PORT}/   data: ${DATA}   built-in games: ${COLLECTION}`));
