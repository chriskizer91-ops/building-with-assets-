#!/usr/bin/env node
// Gathers the games listed in games.json into build/collection/, ready to go inside the app.
//
// For each source repository it makes a fresh copy (a shallow git clone, or with --local an
// export of a checkout already on this machine), runs the repository's own build if it has
// one, then for every listed page: packs in anything it loads from the internet (so it works
// in airplane mode), works out its title and save slot, and records it in collection.json.
//
//   node tools/collect-games.mjs                 # clone from GitHub (what the build server does)
//   node tools/collect-games.mjs --local ~/repos # use checkouts in ~/repos/<repo-name>
//   options: --out build/collection  --work build/sources  --mirror dir  --only map,aether  --strict

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packHtml, findExternal } from '../web/js/pack.js';
import { saveKeyFor, titleFromHtml, slug } from '../web/js/util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf('--' + name); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : dflt; };
const OUT = path.resolve(opt('out', path.join(ROOT, 'build', 'collection')));
const WORK = path.resolve(opt('work', path.join(ROOT, 'build', 'sources')));
const LOCAL = opt('local', null);
const MIRROR = opt('mirror', null);
const ONLY = opt('only', null);
// a token that can read private game repositories (GitHub secret GAMES_TOKEN); without it they're skipped
const TOKEN = process.env.GAMES_TOKEN || '';
const STRICT = !!opt('strict', false);

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
const only = ONLY ? new Set(String(ONLY).split(',')) : null;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(WORK, { recursive: true });

const sources = {};
const problems = [];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', timeout: 15 * 60 * 1000, ...opts });
  return r.status === 0;
}

// ---------------------------------------------------------------- 1. fetch and build sources
for (const [id, src] of Object.entries(manifest.sources)) {
  if (only && !only.has(id)) continue;
  const dir = path.join(WORK, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const repoName = src.repo.split('/')[1];
  const info = { id, repo: src.repo, ok: false, commit: '', built: null, note: '', private: null };
  sources[id] = info;
  console.log(`\n== ${id}: ${src.repo}`);
  try {
    if (LOCAL) {
      const from = path.join(String(LOCAL), repoName);
      const tar = execFileSync('git', ['-C', from, 'archive', src.ref || 'HEAD'], { maxBuffer: 4 * 1024 ** 3 });
      execFileSync('tar', ['-x', '-C', dir], { input: tar, maxBuffer: 4 * 1024 ** 3 });
      info.commit = execFileSync('git', ['-C', from, 'rev-parse', src.ref || 'HEAD']).toString().trim();
    } else {
      fs.rmSync(dir, { recursive: true, force: true });
      info.private = await isPrivate(src.repo);
      const args = ['-c', 'credential.helper=', '-c', 'core.askPass=true', 'clone', '--depth', '1', '--quiet'];
      if (src.paths) args.push('--filter=blob:none', '--sparse');
      if (src.ref) args.push('--branch', src.ref);
      const auth = TOKEN ? `x-access-token:${TOKEN}@` : '';
      args.push(`https://${auth}github.com/${src.repo}.git`, dir);
      if (!run('git', args, { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })) {
        throw new Error(info.private !== false && !TOKEN ? 'private repository (add a GAMES_TOKEN secret that can read it)' : 'git clone failed');
      }
      // only the files the games need, when the source says which
      if (src.paths && !run('git', ['-C', dir, 'sparse-checkout', 'set', '--no-cone', ...src.paths])) throw new Error('sparse checkout failed');
      info.commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD']).toString().trim();
    }
    info.ok = true;
  } catch (e) {
    info.note = 'could not fetch: ' + e.message;
    problems.push(`${id}: ${info.note}`);
    continue;
  }
  if (src.build) {
    console.log(`   building: ${src.build.join(' ')}`);
    info.built = run(src.build[0], src.build.slice(1), { cwd: dir });
    if (!info.built) { info.note = 'its build failed; using whatever pages it already has'; problems.push(`${id}: build failed`); }
  }
}

// Whether a GitHub repository is private (null if it can't be told).
async function isPrivate(repo) {
  try {
    const headers = { 'user-agent': 'mooncart-collector', accept: 'application/vnd.github+json' };
    if (TOKEN) headers.authorization = 'Bearer ' + TOKEN;
    const r = await fetch('https://api.github.com/repos/' + repo, { headers, signal: AbortSignal.timeout(20000) });
    if (r.status === 404) return true; // invisible without a token: private
    if (!r.ok) return null;
    return !!(await r.json()).private;
  } catch { return null; }
}

// ---------------------------------------------------------------- 2. pack each game
function mirrorPath(url) {
  if (!MIRROR) return null;
  const u = new URL(url);
  const plain = path.join(String(MIRROR), u.host, u.pathname);
  if (fs.existsSync(plain) && fs.statSync(plain).isFile()) return plain;
  const hashed = path.join(String(MIRROR), crypto.createHash('sha1').update(url).digest('hex'));
  return fs.existsSync(hashed) ? hashed : null;
}

const fetched = new Map();
function getter(url) {
  if (!fetched.has(url)) {
    fetched.set(url, (async () => {
      const m = mirrorPath(url);
      if (m) return { bytes: new Uint8Array(fs.readFileSync(m)), type: '' };
      const res = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36' } });
      if (!res.ok) throw new Error(res.status + ' ' + url);
      return { bytes: new Uint8Array(await res.arrayBuffer()), type: res.headers.get('content-type') || '' };
    })());
  }
  return fetched.get(url);
}

function expand(dir, pattern, exclude) {
  const rel = pattern.split('/');
  const base = rel.pop();
  const folder = path.join(dir, ...rel);
  const toRe = (glob) => new RegExp('^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
  if (!base.includes('*')) return fs.existsSync(path.join(folder, base)) ? [[...rel, base].join('/')] : [];
  if (!fs.existsSync(folder)) return [];
  const re = toRe(base), ex = exclude ? toRe(exclude) : null;
  return fs.readdirSync(folder).filter((f) => re.test(f) && !(ex && ex.test(f)) && fs.statSync(path.join(folder, f)).isFile()).sort().map((f) => [...rel, f].join('/'));
}

const games = [];
const usedKeys = new Map();
for (const entry of manifest.games) {
  const info = sources[entry.source];
  if (!info) { if (!only) problems.push(`unknown source "${entry.source}"`); continue; }
  if (!info.ok) continue;
  const dir = path.join(WORK, entry.source);
  const files = expand(dir, entry.file, entry.exclude);
  if (!files.length) { problems.push(`${entry.source}: ${entry.file} not found`); continue; }
  for (const rel of files) {
    let html = fs.readFileSync(path.join(dir, rel), 'utf8');
    const title = titleFromHtml(html.slice(0, 2_000_000));
    const external = findExternal(html).filter((x) => x.kind === 'script' || x.kind === 'style');
    let packed = [], failed = [];
    if (external.length) {
      const r = await packHtml(html, getter);
      html = r.html;
      packed = r.report.inlined;
      failed = r.report.failed;
      for (const f of failed) problems.push(`${entry.source}/${rel}: could not pack ${f}`);
    }
    const buf = Buffer.from(html, 'utf8');
    const outRel = `${entry.source}/${rel.split('/').map((p) => p.replace(/[^A-Za-z0-9._-]/g, '_')).join('/')}`;
    fs.mkdirSync(path.dirname(path.join(OUT, outRel)), { recursive: true });
    fs.writeFileSync(path.join(OUT, outRel), buf);
    let saveKey = entry.saveKey || ((entry.saveKeyPrefix || '') + saveKeyFor(title, path.basename(rel)));
    saveKey = slug(saveKey) || 'game';
    // two different games never share a save slot unless games.json says so
    if (usedKeys.has(saveKey) && !entry.saveKey) { let n = 2; while (usedKeys.has(`${saveKey}-${n}`)) n++; saveKey = `${saveKey}-${n}`; }
    usedKeys.set(saveKey, outRel);
    games.push({
      key: `${entry.source}/${rel}`,
      src: outRel,
      folder: entry.folder || '',
      file: path.basename(rel),
      title,
      name: entry.name || title || path.basename(rel).replace(/\.html?$/i, ''),
      saveKey,
      size: buf.length,
      hash: crypto.createHash('sha1').update(buf).digest('hex'),
      from: `${info.repo} @ ${info.commit.slice(0, 7)} : ${rel}`,
      private: info.private || undefined,
      opts: entry.opts || undefined,
      packed: packed.length ? packed : undefined,
      needsNet: failed.length ? failed : undefined,
    });
    console.log(`   ${(buf.length / 1048576).toFixed(1).padStart(5)} MB  ${title || rel}${packed.length ? `  (+${packed.length} packed)` : ''}${failed.length ? `  (!${failed.length} could not pack)` : ''}`);
  }
}

const total = games.reduce((s, g) => s + g.size, 0);
const collection = {
  about: 'Built-in games for Mooncart, made by tools/collect-games.mjs from games.json.',
  version: new Date().toISOString(),
  sources: Object.values(sources),
  hasPrivate: games.some((g) => g.private),
  games,
};
fs.writeFileSync(path.join(OUT, 'collection.json'), JSON.stringify(collection, null, 1));
console.log(`\n${games.length} games, ${(total / 1048576).toFixed(1)} MB, in ${OUT}`);
if (problems.length) {
  console.log('\nProblems:\n  ' + problems.join('\n  '));
  if (STRICT) process.exit(1);
}
if (!games.length) process.exit(1);
