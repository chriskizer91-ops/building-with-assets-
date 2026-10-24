#!/usr/bin/env node
// Opens the desktop app (Electron, on a screen or under xvfb-run), checks the library, and plays games.
//   xvfb-run -a node desktop/try.mjs [--app build/desktop/out/Mooncart-linux-x64/Mooncart] [--all] [--out build/desktop-test]
// Every game it opens gets a screenshot; page errors and anything that reaches for the internet are listed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const require = createRequire(path.join(HERE, 'package.json'));
const { _electron } = require(require.resolve('playwright', { paths: [ROOT, '/usr/lib/node_modules', '/usr/local/lib/node_modules'] }));
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const OUT = path.resolve(opt('out', path.join(ROOT, 'build', 'desktop-test')));
const only = opt('only', null);
fs.mkdirSync(OUT, { recursive: true });

const appExe = opt('app', null);
const data = fs.mkdtempSync('/tmp/mooncart-desktop-');
const launch = appExe
  ? { executablePath: path.resolve(appExe), args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--user-data-dir=' + data] }
  : { executablePath: require('electron'), args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--user-data-dir=' + data, path.join(HERE, 'main.mjs')] };
const app = await _electron.launch({ ...launch, env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' } });
const blocked = [];
app.process().stdout.on('data', (d) => { for (const l of String(d).split('\n')) if (l.includes('internet blocked')) blocked.push(l.trim()); });

const page = await app.firstWindow();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
await page.waitForFunction(() => window.mooncart && window.mooncart.library && window.mooncart.library.games().length >= 0, null, { timeout: 60000 });
await page.waitForTimeout(4000);
const games = await page.evaluate(() => window.mooncart.library.games().map((g) => ({ id: g.id, name: g.name, slot: g.saveKey || '' })));
console.log(`desktop app open, ${games.length} games in the library`);
await page.screenshot({ path: path.join(OUT, '00-library.png') });
console.log('quit button on:', await page.evaluate(() => !!window.mooncartDesktop));

const results = [];
const list = opt('all', false) ? games : games.filter((g) => !only || String(only).split(',').some((s) => g.name.toLowerCase().includes(s.toLowerCase()))).slice(0, only ? 999 : 3);
let n = 0;
for (const g of list) {
  n++;
  const before = errors.length, b0 = blocked.length, t0 = Date.now();
  let ok = true, note = '';
  try {
    await page.evaluate((id) => window.mooncart.launch(id), g.id);
    await page.waitForFunction(() => window.mooncart.game.loaded, null, { timeout: 60000 });
    await page.waitForTimeout(2500);
  } catch (e) { ok = false; note = 'did not finish loading'; }
  const file = `${String(n).padStart(3, '0')}-${g.name.replace(/[^A-Za-z0-9]+/g, '-').slice(0, 50)}.png`;
  await page.screenshot({ path: path.join(OUT, file) }).catch(() => {});
  const errs = errors.slice(before), net = blocked.slice(b0);
  results.push({ name: g.name, ok, ms: Date.now() - t0, errors: errs, internet: net, shot: file, note });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${g.name}  ${((Date.now() - t0) / 1000).toFixed(1)}s${errs.length ? '  errors: ' + errs.slice(0, 2).join(' | ').slice(0, 200) : ''}${net.length ? '  INTERNET: ' + net.length : ''}${note ? '  ' + note : ''}`);
  await page.evaluate(() => window.mooncart.quitToList()).catch(() => {});
  await page.waitForTimeout(300);
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ games: games.length, results, blocked }, null, 1));
await app.close();
console.log(`${results.filter((r) => r.ok).length}/${results.length} games opened; internet attempts: ${blocked.length}`);
