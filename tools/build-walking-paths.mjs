#!/usr/bin/env node
// Builds Walking Paths (editing-tools/walking-paths/) into one page with everything inside it: its styles, its
// scripts, the walk engine with the painted Io, and the two example maps with their pictures. Nothing is loaded from
// the internet.
//
//   node tools/build-walking-paths.mjs     build/walking-paths/Walking-Paths.html   one file to keep and open
//                                           build/walking-paths/walking-paths.html   the same page to publish as
//                                                                                     a Claude artifact (no <head>:
//                                                                                     the artifact host adds one)
//                                           build/walking-paths/test.html            that page in a stand-in for
//                                                                                     the artifact host's wrapper
//   --out <dir>                             somewhere else
//
// Needs esbuild (npm install).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'editing-tools', 'walking-paths');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const OUT = path.resolve(ROOT, opt('out', 'build/walking-paths'));
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
// text going inside a <script> element must not end it early, and "<!--" there changes how the
// browser reads the rest, so the build stops if the code ever has one
const scriptSafe = (s, what) => {
  if (s.includes('<!--')) throw new Error(what + ' contains "<!--"; it would break the page');
  return s.replace(/<\/script/gi, '<\\/script');
};

// 1. the page's own scripts, as one
const app = (await build({
  entryPoints: [path.join(SRC, 'js/main.js')],
  bundle: true, format: 'iife', write: false, charset: 'utf8', legalComments: 'none', target: ['es2020'],
})).outputFiles[0].text;

// 2. the walk engine, kept as it is written (the page copies it into the walk-around pages it saves)
const sprites = read('engine/sprites.js'), painted = read('engine/painted-io.js'), engine = read('engine/engine.js');

// 3. the examples, their pictures inside
const examples = JSON.parse(read('examples/examples.json'));
for (const m of Object.values(examples.maps)) {
  const file = path.join(SRC, 'examples', m.src);
  const type = { avif: 'image/avif', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' }[path.extname(file).slice(1)];
  m.src = 'data:' + type + ';base64,' + fs.readFileSync(file).toString('base64');
}
// "<!--" can only be inside the JSON's strings, where ! spells the same "!"
const examplesJson = JSON.stringify(examples).replace(/<!--/g, '<\\u0021--');

// 4. the page: index.html's body, then the scripts
const index = read('index.html');
const title = /<title>([^<]*)<\/title>/i.exec(index)[1].trim();
const body = /<body>([\s\S]*?)<script/i.exec(index)[1].trim();
const css = read('walking-paths.css');
const page = [
  `<title>${title}</title>`,
  `<style>\n${css}</style>`,
  body,
  `<script id="wp-engine-sprites">\n${scriptSafe(sprites, 'sprites.js')}</script>`,
  `<script id="wp-engine-painted">\n${scriptSafe(painted, 'painted-io.js')}</script>`,
  `<script id="wp-engine">\n${scriptSafe(engine, 'engine.js')}</script>`,
  `<script>window.WP_EXAMPLES = ${scriptSafe(examplesJson, 'the examples')};</script>`,
  `<script>\n${scriptSafe(app, 'the page’s scripts')}</script>`,
  '',
].join('\n');

const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#110e22"/>' +
  '<path d="M12 50 C 22 40, 18 28, 30 26 S 44 14, 52 12" fill="none" stroke="#ffd66e" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>' +
  '<circle cx="52" cy="12" r="5" fill="#ff5fb2"/><circle cx="12" cy="50" r="5" fill="#5aff96"/></svg>');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const standalone = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="color-scheme" content="dark">\n<meta name="theme-color" content="#07050f">\n' +
  `<link rel="icon" href="${icon}">\n` +
  page.replace(/\n<div class="wp" id="wp">/, '\n</head>\n<body>\n<div class="wp" id="wp">') + '</body>\n</html>\n';
fs.writeFileSync(path.join(OUT, 'Walking-Paths.html'), standalone);
fs.writeFileSync(path.join(OUT, 'walking-paths.html'), page);
// roughly what the artifact host wraps a page in
fs.writeFileSync(path.join(OUT, 'test.html'),
  '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n' +
  page + '</body></html>\n');
const kb = (n) => Math.round(n / 1024) + ' KB';
console.log(`Walking Paths: ${path.relative(ROOT, path.join(OUT, 'Walking-Paths.html'))} (${kb(Buffer.byteLength(standalone))}), and the artifact page ${path.relative(ROOT, path.join(OUT, 'walking-paths.html'))}`);
