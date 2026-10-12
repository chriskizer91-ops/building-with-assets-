// Read-only. Finds text in a built HTML page that is missing from a set of source files. Used for SOURCES.md.
// Needs the acorn package: run `npm install acorn` in game-systems/tools/ first.
//
//   node gap.mjs --html <page.html> --src <dir-or-file> [--src ...] [--lib <dir-or-file> ...]
//                [--min 6] [--max 400] [--from-line N] [--to-line M] [--json out.json]
//
// "Text" means what survives minifying:
//   - inside <script> blocks: every string literal and template-literal piece, found with a real JavaScript tokenizer
//     (acorn), so regular expressions, comments and division signs can't throw it off. If acorn can't read a block
//     (a JSON or non-JS script, or broken code), that block falls back to a simple quote-matching scan, and the run
//     says how many blocks fell back.
//   - outside scripts: quoted attribute/CSS strings and the visible text between tags.
// JS escapes (—, \x41, \n, \', …) and common HTML entities are decoded on both sides, and runs of whitespace
// are squashed, so "—" in a bundle matches "—" in the source.
// A piece counts as PRESENT when it appears anywhere in the decoded text of the --src files (or the --lib files, for
// libraries such as three.js that live outside the source tree). Everything else is printed as a GAP with its
// position (line@column: 1-based line, 0-based column) and its first 140 characters.
// Base64 markers left by strip.mjs ("[[stripped …]]") are ignored. Never prints more than 140 chars of a piece.
import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';

const argv = process.argv.slice(2);
// a flag takes every value after it up to the next --flag, so `--src a b --src c` means a, b and c
const many = (k) => { const out = []; for (let i = 0; i < argv.length; i++) if (argv[i] === '--' + k) for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j++) out.push(argv[j]); return out; };
const one = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const HTML = one('html');
const SRC = many('src');
const LIB = many('lib');
const MIN = +one('min', 6);
const MAX = +one('max', 400);
const FROM = +one('from-line', 1);
const TO = +one('to-line', Infinity);
const JSON_OUT = one('json', '');
if (!HTML || !SRC.length) { console.error('usage: node gap.mjs --html page.html --src dir [--src …] [--lib …]'); process.exit(2); }

const TEXT = /\.(html?|m?js|cjs|jsx|tsx?|css|json|txt|md|glsl|frag|vert|py|svg)$/i;
function walk(p, out = []) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) { if (e === '.git' || e === 'node_modules') continue; walk(path.join(p, e), out); }
  } else if (TEXT.test(p)) out.push(p);
  return out;
}

const decode = (s) => s
  .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r')
  .replace(/\\(['"`\\/$])/g, '$1');
// HTML entities that bundlers and editors swap freely.
const ent = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&hellip;/g, '…').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
const squash = (s) => s.replace(/\s+/g, ' ');

function corpus(list) {
  const parts = [];
  for (const p of list) for (const f of walk(p)) parts.push(squash(ent(decode(fs.readFileSync(f, 'utf8')))));
  return parts.join('\n');
}
const srcText = corpus(SRC);
const libText = LIB.length ? corpus(LIB) : '';

const page = fs.readFileSync(HTML, 'utf8');
const lineStarts = [0];
for (let i = 0; i < page.length; i++) if (page.charCodeAt(i) === 10) lineStarts.push(i + 1);
function where(off) {
  let lo = 0, hi = lineStarts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= off) lo = mid; else hi = mid - 1; }
  return { ln: lo + 1, col: off - lineStarts[lo] };
}

const pieces = [];
const add = (off, text, kind, cooked = false) => {
  const w = where(off);
  if (w.ln < FROM || w.ln > TO) return;
  pieces.push({ ...w, text, kind, cooked });
};
const STR = /(["'`])((?:\\[\s\S]|(?!\1)[^\\\n])*)\1/g;
function regexScan(text, base, kind) {
  for (const m of text.matchAll(STR)) {
    const parts = m[1] === '`' ? m[2].split(/\$\{[^}]*\}/) : [m[2]];
    for (const part of parts) add(base + m.index, part, kind);
  }
}

// 1. script blocks, tokenized
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const outside = [];
let last = 0, blocks = 0, fellBack = 0;
for (const m of page.matchAll(SCRIPT)) {
  outside.push([last, m.index + m[0].indexOf('>') + 1]);
  last = m.index + m[0].length;
  const code = m[2];
  const base = m.index + m[0].indexOf('>') + 1;
  if (!code.trim()) continue;
  blocks++;
  const found = [];
  let ok = true;
  for (const sourceType of ['script', 'module']) {
    found.length = 0;
    try {
      for (const t of acorn.tokenizer(code, { ecmaVersion: 'latest', sourceType, allowHashBang: true, allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true })) {
        if (t.type.label === 'string') found.push([t.start, t.value]);
        else if (t.type.label === 'template' && t.value) found.push([t.start, t.value]);
      }
      ok = true;
      break;
    } catch (e) { ok = false; }
  }
  if (ok) for (const [s, v] of found) add(base + s, v, 'string', true);
  else { fellBack++; regexScan(code, base, 'string?'); }
}
outside.push([last, page.length]);

// 2. outside scripts: quoted strings (attributes, CSS) and visible text between tags (not inside <style>)
for (const [a, b] of outside) {
  const chunk = page.slice(a, b);
  regexScan(chunk, a, 'attr');
  const noStyle = chunk.replace(/<style\b[\s\S]*?<\/style\s*>/gi, (s) => ' '.repeat(s.length));
  for (const m of noStyle.matchAll(/>([^<]+)</g)) if (/[A-Za-z]/.test(m[1])) add(a + m.index + 1, m[1], 'html-text');
}

const seen = new Set();
const gaps = [];
let checked = 0;
for (const p of pieces) {
  const t = squash(ent(p.cooked ? p.text : decode(p.text))).trim();
  if (t.length < MIN || !/[A-Za-z]{2}/.test(t) || t.includes('[[stripped')) continue;
  if (seen.has(t)) continue;
  seen.add(t);
  checked++;
  if (srcText.includes(t) || (libText && libText.includes(t))) continue;
  gaps.push({ at: `L${p.ln}@${p.col}`, kind: p.kind, len: t.length, text: t.slice(0, 140) });
}
console.log(`checked ${checked} distinct pieces (min ${MIN} chars) from ${path.basename(HTML)} lines ${FROM}-${TO === Infinity ? lineStarts.length : TO}; ` +
  `${blocks} script blocks tokenized${fellBack ? `, ${fellBack} FELL BACK to quote scanning (kind "string?")` : ''}; ` +
  `source corpus ${srcText.length.toLocaleString('en-US')} chars${libText ? `, lib ${libText.length.toLocaleString('en-US')}` : ''}; GAPS: ${gaps.length}`);
for (const g of gaps.slice(0, MAX)) console.log(`${g.at} [${g.kind}] (${g.len}) ${JSON.stringify(g.text)}`);
if (gaps.length > MAX) console.log(`… ${gaps.length - MAX} more (use --max or --json)`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(gaps, null, 1));
