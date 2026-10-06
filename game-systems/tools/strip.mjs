// Makes stripped copies of the games listed in game-systems/games.json: the same files with every base64 blob
// (pictures, sounds, fonts, models packed into the page) replaced by a short marker, so the code can be read
// without the art. Nothing else is changed, and no marker spans a line break, so line N of a stripped copy is
// line N of the real file.
//
//   node game-systems/tools/strip.mjs [--repos ..] [--cache /tmp/game-systems-cache] [--only id,id] [--no-source]
//
// Each game is read straight out of git (`git cat-file` on the branch named in games.json) from the sibling
// clones in --repos, so nothing in them is checked out or changed. A game with a 'build' entry has no committed
// single file on its branch: its folders are unpacked with `git archive` into --cache and built there.
// 'source' folders are stripped too, into stripped/<id>/source/.
// Writes stripped/<id>/<file>, stripped/<id>/<file>.long-lines.txt (lines still over 2,000 characters after
// stripping: minified code, inlined libraries, number tables) and stripped/index.json, and prints a table.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOP = path.join(HERE, '..');
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const REPOS = path.resolve(opt('repos', path.join(TOP, '..', '..')));
const CACHE = path.resolve(opt('cache', path.join(os.tmpdir(), 'game-systems-cache')));
const OUT = path.join(TOP, 'stripped');
const ONLY = opt('only', '') ? new Set(opt('only').split(',')) : null;
const WITH_SOURCE = !process.argv.includes('--no-source');
const TEXT = /\.(html?|m?js|jsx|css|json|txt|md|glsl|frag|vert|py)$/i;
const LONG = 2000;

function git(repo, args, opts = {}) {
  const r = spawnSync('git', ['-C', repo, ...args], { maxBuffer: 1 << 30, ...opts });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} in ${repo}: ${String(r.stderr).trim()}`);
  return r.stdout;
}

// --- stripping -------------------------------------------------------------------------------------------------

// The blobs are found by scanning, not with regular expressions: a single blob can be 30 MB, which overflows the
// regular-expression engine's stack.
const B64 = new Uint8Array(128);
for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\\') B64[c.charCodeAt(0)] = 1;
// Z85 (Witch Way's builds pack their pictures this way): no quotes, commas, semicolons, spaces or underscores, which
// any stretch of real code has.
const Z85 = new Uint8Array(128);
for (const c of '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#') Z85[c.charCodeAt(0)] = 1;
const inSet = (set, code) => code < 128 && set[code] === 1;

// A run of letters and digits is a blob only if it uses most of the alphabet; long tile maps and the like don't.
const varied = (s, n) => new Set(s).size >= n;

// Replaces each maximal run of characters from `set` that is at least `min` long (`minAfter` when the text just
// before it ends with `after`) and passes `ok`, with what `label` returns. Runs never contain a line break.
function replaceRuns(text, set, { min, after = null, minAfter = min, ok, label }) {
  const out = [];
  let last = 0, i = 0;
  const n = text.length;
  while (i < n) {
    if (!inSet(set, text.charCodeAt(i))) { i++; continue; }
    const start = i;
    while (i < n && inSet(set, text.charCodeAt(i))) i++;
    let end = i;
    // JSON strings write "/" as "\/" and end in \" : give trailing backslashes back to the text after the blob.
    while (end > start && text.charCodeAt(end - 1) === 92) end--;
    const len = end - start;
    const isAfter = after && text.startsWith(after, start - after.length);
    if (len >= (isAfter ? minAfter : min) && ok(text.slice(start, Math.min(end, start + 4096)), isAfter)) {
      out.push(text.slice(last, start), label(text, start, end, isAfter));
      last = end;
    }
  }
  out.push(text.slice(last));
  return out.join('');
}

export function strip(text) {
  const st = { dataUris: 0, bareRuns: 0, removedChars: 0, kinds: {} };
  const note = (kind, n) => { st.removedChars += n; st.kinds[kind] = (st.kinds[kind] || 0) + 1; };
  text = replaceRuns(text, B64, {
    min: 200, after: 'base64,', minAfter: 16,
    ok: (s, isAfter) => isAfter || varied(s, 24),
    label: (t, a, b, isAfter) => {
      if (isAfter) {
        const head = t.slice(Math.max(0, a - 120), a);
        const m = head.match(/data:([\w.+-]+\/[\w.+-]+)?[^,]*,$/);
        const mime = (m && m[1]) || 'unknown';
        st.dataUris++; note(mime, b - a);
        return `[[stripped ${b - a} chars]]`;
      }
      st.bareRuns++; note('bare base64', b - a);
      return `[[stripped base64 ${b - a} chars, starts ${t.slice(a, a + 12)}]]`;
    },
  });
  text = replaceRuns(text, Z85, {
    min: 2000,
    ok: (s) => varied(s, 60),
    label: (t, a, b) => { st.bareRuns++; note('z85', b - a); return `[[stripped z85 ${b - a} chars]]`; },
  });
  return { text, st };
}

function longLines(text) {
  const out = [];
  let n = 0, maxLen = 0;
  for (const line of text.split('\n')) {
    n++;
    if (line.length > maxLen) maxLen = line.length;
    if (line.length > LONG) out.push(`line ${n}: ${line.length} chars: ${line.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
  return { lines: n, maxLen, list: out };
}

// --- reading the games -------------------------------------------------------------------------------------------

function refInfo(repo, ref) {
  const [sha, date] = String(git(repo, ['log', '-1', '--format=%h %cs', ref])).trim().split(' ');
  return { sha, date };
}

function readBuilt(g, repo, info) {
  const dir = path.join(CACHE, g.id);
  const stamp = path.join(dir, 'built-from.txt');
  const out = path.join(dir, path.basename(g.file));
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8').trim() === info.sha && fs.existsSync(out)) return fs.readFileSync(out);
  fs.rmSync(dir, { recursive: true, force: true });
  const tree = path.join(dir, 'tree');
  fs.mkdirSync(tree, { recursive: true });
  const tar = git(repo, ['archive', '--format=tar', g.ref, ...g.build.paths]);
  const x = spawnSync('tar', ['-x', '-C', tree], { input: tar, maxBuffer: 1 << 30 });
  if (x.status !== 0) throw new Error(`tar for ${g.id}: ${x.stderr}`);
  const [cmd, ...args] = g.build.cmd.map((a) => a.replace('{out}', out));
  const r = spawnSync(cmd, args, { cwd: tree, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`build for ${g.id} failed: ${r.stderr || r.stdout}`);
  fs.writeFileSync(stamp, info.sha + '\n');
  return fs.readFileSync(out);
}

function writeStripped(dest, text) {
  const { text: s, st } = strip(text);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, s);
  const ll = longLines(s);
  if (ll.list.length) fs.writeFileSync(dest + '.long-lines.txt', ll.list.join('\n') + '\n');
  return { strippedBytes: Buffer.byteLength(s), lines: ll.lines, longestLine: ll.maxLen, longLines: ll.list.length, ...st };
}

function stripSource(g, repo) {
  const files = String(git(repo, ['ls-tree', '-r', '-l', g.ref, '--', ...g.source])).trim().split('\n').filter(Boolean)
    .map((l) => { const [meta, name] = l.split('\t'); return { name, size: +meta.split(/\s+/)[3] }; })
    .filter((f) => TEXT.test(f.name));
  let lines = 0, bytes = 0, stripped = 0;
  for (const f of files) {
    const text = String(git(repo, ['cat-file', '-p', `${g.ref}:${f.name}`]));
    const r = writeStripped(path.join(OUT, g.id, 'source', f.name), text);
    lines += r.lines; bytes += f.size; stripped += r.strippedBytes;
  }
  return { files: files.length, bytes, strippedBytes: stripped, lines };
}

// --- main ----------------------------------------------------------------------------------------------------

const list = JSON.parse(fs.readFileSync(path.join(TOP, 'games.json'), 'utf8')).games;
const index = fs.existsSync(path.join(OUT, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8')) : {};
for (const g of list) {
  if (ONLY && !ONLY.has(g.id)) continue;
  const repo = path.join(REPOS, g.repo);
  const info = refInfo(repo, g.ref);
  process.stderr.write(`${g.id} (${g.repo} ${g.ref} ${info.sha}) ... `);
  const raw = g.build ? readBuilt(g, repo, info) : git(repo, ['cat-file', '-p', `${g.ref}:${g.file}`]);
  const r = writeStripped(path.join(OUT, g.id, path.basename(g.file)), raw.toString('utf8'));
  const entry = { id: g.id, kind: g.kind, title: g.title, repo: g.repo, ref: g.ref, commit: info.sha, date: info.date, file: g.file, built: !!g.build, bytes: raw.length, ...r };
  if (WITH_SOURCE && g.source) entry.source = stripSource(g, repo);
  index[g.id] = entry;
  process.stderr.write(`${(raw.length / 1048576).toFixed(2)} MB -> ${(r.strippedBytes / 1024).toFixed(0)} KB, ${r.lines} lines\n`);
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');

const kb = (n) => (n / 1024).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
console.log('| id | kind | full size (bytes) | stripped (KB) | lines | blobs removed | lines > 2,000 chars | longest line |');
console.log('|---|---|--:|--:|--:|--:|--:|--:|');
for (const e of Object.values(index)) {
  console.log(`| ${e.id} | ${e.kind} | ${e.bytes.toLocaleString('en-US')} | ${kb(e.strippedBytes)} | ${e.lines.toLocaleString('en-US')} | ${e.dataUris + e.bareRuns} | ${e.longLines} | ${e.longestLine.toLocaleString('en-US')} |`);
}
