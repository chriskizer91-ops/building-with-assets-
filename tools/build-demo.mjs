#!/usr/bin/env node
// Builds Mooncart for a plain web browser: the whole console in one HTML page (its scripts,
// styles and fonts inside it) that keeps the library and any games you add in that browser.
//
//   node tools/build-demo.mjs                 the demo page published as a Claude artifact:
//                                              build/demo/mooncart.html with the sample games
//                                              from samples/ next to it in collection/, and
//                                              build/demo/test.html to try it locally
//   node tools/build-demo.mjs --standalone    build/web/Mooncart.html: one file to keep on a
//                                              laptop and open in its web browser, the sample
//                                              games inside it
//   --games bogmire,sol-the-last-ember-warden  built-in games from build/collection instead of
//                                              the samples (for testing; never publish these)
//   --out <dir>                                somewhere else
//
// Needs esbuild (npm install).

import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const STANDALONE = args.includes('--standalone');
const OUT = path.resolve(ROOT, opt('out', STANDALONE ? 'build/web' : 'build/demo'));
const PICK = (opt('games', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// text going inside a <script> element must not end it early (and "<!--" there changes how the
// browser reads the rest, so the build stops if the code ever has one)
const scriptSafe = (s) => {
  if (s.includes('<!--')) throw new Error('A script for the page contains "<!--"; it would break the page');
  return s.replace(/<\/script/gi, '<\\/script');
};

// 1. the console's scripts, as one script
const bundle = (await build({
  entryPoints: [path.join(ROOT, 'web/js/main.js')],
  bundle: true, format: 'iife', write: false, charset: 'utf8', legalComments: 'none',
})).outputFiles[0].text;

// 2. its styles, with the two pixel fonts inside
const css = read('web/css/app.css').replace(/url\((['"]?)\.\.\/fonts\/([^'")]+)\1\)/g, (m, q, file) =>
  `url(data:font/ttf;base64,${fs.readFileSync(path.join(ROOT, 'web/fonts', file)).toString('base64')})`);

// 3. the games that come with it: the samples, or (for testing) some built-in games
let games, from;
if (PICK.length) {
  const colFile = path.join(ROOT, 'build/collection/collection.json');
  if (!fs.existsSync(colFile)) throw new Error('No games in build/collection: run node tools/collect-games.mjs first');
  const col = JSON.parse(fs.readFileSync(colFile, 'utf8'));
  games = PICK.map((key) => {
    const g = col.games.find((x) => x.saveKey === key);
    if (!g) throw new Error('No built-in game with the save slot ' + key);
    return g;
  });
  from = path.join(ROOT, 'build/collection');
} else {
  from = path.join(ROOT, 'samples');
  games = fs.readdirSync(from).filter((f) => f.endsWith('.html')).sort().map((file) => {
    const text = fs.readFileSync(path.join(from, file), 'utf8');
    const title = /<title>([^<]*)<\/title>/i.exec(text)[1].trim();
    const saveKey = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { key: 'samples/' + file, src: file, folder: '', file, title, name: title, saveKey, size: Buffer.byteLength(text), order: file === 'starfall.html' ? 0 : 1 };
  });
}
const collection = { about: 'The games that come with Mooncart in a web browser.', version: new Date().toISOString(), games };

// 4. the page: index.html's body, the settings for the browser bridge, the scripts
const index = read('web/index.html');
const body = /<body>([\s\S]*?)<script type="module"/i.exec(index)[1].trim();
const tooOld = /<script>\s*\/\/ If the phone's web engine is too old[\s\S]*?<\/script>/i.exec(index)[0];
const config = { demo: !STANDALONE, collection: 'collection/', helper: read('web/__mooncart/helper.js') };
if (STANDALONE) config.games = { collection, files: Object.fromEntries(games.map((g) => [g.src, fs.readFileSync(path.join(from, g.src), 'utf8')])) };
// "<!--" can only be inside the JSON's strings, where ! spells the same "!"
const configJson = JSON.stringify(config).replace(/<!--/g, '<\\u0021--');
const page = [
  '<title>Mooncart</title>',
  `<style>\n:root { color-scheme: dark; }\n${css}</style>`,
  body,
  `<script>window.__MOONCART_WEB__ = ${scriptSafe(configJson)};</script>`,
  `<script>\n${scriptSafe(bundle)}</script>`,
  tooOld,
  '',
].join('\n');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const kb = (n) => Math.round(n / 1024) + ' KB';
if (STANDALONE) {
  const icon = fs.readFileSync(path.join(ROOT, 'web/icon.png')).toString('base64');
  const html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n' +
    '<meta name="color-scheme" content="dark">\n<meta name="theme-color" content="#0b0a16">\n' +
    `<link rel="icon" href="data:image/png;base64,${icon}">\n` +
    page.replace(/\n<canvas id="art"/, '\n</head>\n<body>\n<canvas id="art"') + '</body>\n</html>\n';
  fs.writeFileSync(path.join(OUT, 'Mooncart.html'), html);
  console.log(`one-file Mooncart: ${path.relative(ROOT, path.join(OUT, 'Mooncart.html'))} (${kb(Buffer.byteLength(html))})`);
} else {
  for (const g of games) {
    const to = path.join(OUT, 'collection', g.src);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(from, g.src), to);
  }
  fs.writeFileSync(path.join(OUT, 'collection/collection.json'), JSON.stringify(collection, null, 1));
  fs.writeFileSync(path.join(OUT, 'mooncart.html'), page);
  fs.writeFileSync(path.join(OUT, 'test.html'),
    '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#f7f7f4}img{max-width:100%}[hidden]{display:none!important}</style>\n' +
    '</head><body>\n' + page + '</body></html>\n');
  console.log(`demo page: ${path.relative(ROOT, path.join(OUT, 'mooncart.html'))} (${kb(Buffer.byteLength(page))})`);
}
for (const g of games) console.log(`  with: ${g.name} (${kb(g.size)})`);
