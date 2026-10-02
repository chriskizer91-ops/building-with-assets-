#!/usr/bin/env node
// Plays through Mooncart in a desktop Chromium (Playwright) against the test server, the way a
// phone would: picks and plays games with the console buttons, uses the library's menus,
// checks saves and backups, and screenshots each step into build/smoke/.
//
//   node tools/dev-server.mjs --port 8090 --data /tmp/mooncart-smoke &   (fresh data folder)
//   node tools/smoke.mjs [http://localhost:8090]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'http://localhost:8090';
const OUT = path.join(ROOT, 'build', 'smoke');
fs.mkdirSync(OUT, { recursive: true });

let pw;
try { pw = await import('playwright'); } catch { pw = await import('/opt/node-tools/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });

const problems = [];
const check = (ok, what) => { console.log((ok ? '  ok   ' : '  FAIL ') + what); if (!ok) problems.push(what); };

async function phone(width, height, fn, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + '/?noboot');
  await page.waitForFunction(() => window.mooncart && document.querySelector('.sel'));
  try { await fn(page); } finally {
    check(!errors.length, `no page errors (${width}x${height})` + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    await ctx.close();
  }
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name + '.png') });
const tapper = (page) => async (name, dx = 0, dy = 0) => {
  const b = await page.locator('.pad-' + name).boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2 + dx * b.width / 2.6, b.y + b.height / 2 + dy * b.height / 2.6);
};

// ------------------------------------------------------------------ the console, held sideways
await phone(915, 412, async (page) => {
  const tap = tapper(page);
  console.log('console, sideways');
  const n = await page.evaluate(() => window.mooncart.library.games().length);
  check(n > 0, `built-in games in the library (${n})`);
  await shot(page, '01-game-list');
  // walk the list with the d-pad and open a folder with A
  await page.evaluate(() => window.mooncart.picker.show(window.mooncart.library.root));
  await tap('dpad', 0, 1);
  await tap('a');
  await page.waitForTimeout(200);
  const inFolder = await page.evaluate(() => window.mooncart.picker.folder !== window.mooncart.library.root);
  check(inFolder, 'A opens a folder');
  await tap('b');
  await page.waitForTimeout(200);
  check(await page.evaluate(() => window.mooncart.picker.folder === window.mooncart.library.root), 'B goes back up');

  // play a 3D game, press buttons, open the game menu, quit
  const bog = await page.evaluate(() => window.mooncart.library.games().find((g) => g.name === 'Bogmire')?.id);
  if (bog) {
    await page.evaluate((id) => window.mooncart.launch(id), bog);
    await page.waitForFunction(() => window.mooncart.game.loaded, null, { timeout: 30000 });
    check(true, 'Bogmire loads');
    await page.waitForTimeout(3000);
    await shot(page, '02-bogmire');
    await tap('home');
    await page.waitForTimeout(250);
    check(await page.evaluate(() => !document.getElementById('overlay').hidden), 'HOME opens the game menu');
    await shot(page, '03-game-menu');
    for (let i = 0; i < 4; i++) await tap('dpad', 0, 1);
    await tap('a');
    await page.waitForTimeout(400);
    check(await page.evaluate(() => !window.mooncart.game.playing && !document.getElementById('select').hidden), 'Quit returns to the game list');
    const cur = await page.evaluate(() => window.mooncart.picker.items[window.mooncart.picker.index]?.name);
    check(cur === 'Bogmire', 'the game just played is picked in the list');
  }

  // saves: write, read back, clear, through the save helper
  const r = await page.evaluate(async () => {
    const { saves } = await import('/js/saves.js');
    await saves.restore('smoke-test-slot', { hello: 'moon', n: '3' }, true);
    const a = await saves.dump('smoke-test-slot');
    await saves.clear('smoke-test-slot');
    const b = await saves.dump('smoke-test-slot');
    return { before: a.local, after: b.local };
  });
  check(r.before.hello === 'moon' && r.before.n === '3', 'saves are written and read back');
  check(Object.keys(r.after).length === 0, 'saves can be cleared');

  // a game that saves into its own storage keeps it after a restart
  const wtmf = await page.evaluate(() => window.mooncart.library.games().find((g) => g.name === 'What the Map Forgot'));
  if (wtmf) {
    await page.evaluate((id) => window.mooncart.launch(id), wtmf.id);
    await page.waitForFunction(() => window.mooncart.game.loaded, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot(page, '04-what-the-map-forgot');
    const frameShown = await page.evaluate(() => !document.getElementById('art').hidden);
    check(!frameShown, 'What the Map Forgot starts without the console round it (it draws its own)');
    await page.evaluate(() => window.mooncart.quitToList());
  }
});

// ------------------------------------------------------------------ the library (main menu)
await phone(915, 412, async (page) => {
  console.log('library');
  await page.evaluate(() => window.mooncart.openLibrary());
  await page.waitForTimeout(300);
  await shot(page, '05-library');
  await page.click('.mb-item >> text=File');
  await page.waitForTimeout(150);
  await shot(page, '06-file-menu');
  await page.keyboard.press('Escape');

  // add a game from "the phone" (the dev server stands in for the file picker)
  const before = await page.evaluate(() => window.mooncart.library.games().length);
  const file = path.join(OUT, 'Tiny Test Game.html');
  fs.writeFileSync(file, '<!doctype html><html><head><meta charset="utf-8"><title>Tiny Test Game</title></head><body style="background:#123;color:#fff;font:30px sans-serif"><p id=t>Tiny game</p><script>addEventListener("keydown",e=>{document.getElementById("t").textContent="key: "+e.key;localStorage.setItem("last",e.key)})</script></body></html>');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('.tb >> text=Add games')]);
  await chooser.setFiles(file);
  await page.waitForFunction((n) => window.mooncart.library.games().length > n, before);
  const added = await page.evaluate(() => window.mooncart.library.games().find((g) => g.title === 'Tiny Test Game'));
  check(!!added && added.saveKey === 'tiny-test-game', 'Add games copies a file in, with its title and save slot');

  // new folder, rename, move, remove
  await page.evaluate(() => window.mooncart.lib.go(window.mooncart.library.root));
  const fid = await page.evaluate(() => window.mooncart.library.newFolder(window.mooncart.library.root, 'Smoke folder'));
  check(await page.evaluate((id) => window.mooncart.library.get(id)?.name === 'Smoke folder', fid), 'New folder');
  await page.evaluate(([g, f]) => window.mooncart.library.move([g], f), [added.id, fid]);
  check(await page.evaluate(([g, f]) => window.mooncart.library.get(g).parent === f, [added.id, fid]), 'Move into a folder');
  await page.evaluate((g) => window.mooncart.library.rename(g, 'Renamed Tiny'), added.id);
  check(await page.evaluate((g) => window.mooncart.library.get(g).name === 'Renamed Tiny', added.id), 'Rename');

  // the console's buttons type into the game
  await page.evaluate((g) => { window.mooncart.lib.close(); window.mooncart.launch(g); }, added.id);
  await page.waitForFunction(() => window.mooncart.game.loaded, null, { timeout: 20000 });
  await page.waitForTimeout(300);
  await tapper(page)('a');
  await page.waitForTimeout(300);
  const typed = await page.frames().find((f) => f.url().includes('tiny-test-game')).evaluate(() => document.getElementById('t').textContent);
  check(typed === 'key: Enter', `A presses Enter in the game (${typed})`);
  await page.evaluate(() => window.mooncart.quitToList());

  // backup and restore round trip
  const backupOk = await page.evaluate(async () => {
    const r = await fetch('/api/backup', { method: 'POST', body: JSON.stringify({ app: 'mooncart', kind: 'backup', library: window.mooncart.library.snapshot(), saves: {} }) });
    return r.ok && (await r.json()).file;
  });
  check(!!backupOk, 'a backup file is written');

  // remove the folder (and the game in it)
  await page.evaluate((f) => window.mooncart.library.remove([f]), fid);
  check(await page.evaluate(([g, f]) => !window.mooncart.library.get(g) && !window.mooncart.library.get(f), [added.id, fid]), 'Remove a folder and what is in it');
  await page.evaluate(() => { window.mooncart.openLibrary(); window.mooncart.lib.settingsDialog(); });
  await page.waitForTimeout(250);
  await shot(page, '07-settings');
});

// ------------------------------------------------------------------ held upright, other colours
await phone(412, 915, async (page) => {
  console.log('upright');
  await page.waitForTimeout(200);
  await shot(page, '08-upright');
  const L = await page.evaluate(() => {
    const L = window.mooncart.view.L;
    return { bodyBottom: L.body.y + L.body.h, homeBottom: L.home.y + L.home.d, menuBottom: L.menu.y + L.menu.d, mode: L.mode };
  });
  check(L.mode === 'stack' && L.homeBottom < L.bodyBottom && L.menuBottom < L.bodyBottom, 'upright: every button is on the console');
  for (const t of ['midnight', 'witch']) {
    await page.evaluate((t) => window.mooncart.settings.set({ theme: t }), t);
    await page.waitForTimeout(150);
    await shot(page, '09-upright-' + t);
  }
  await page.evaluate(() => window.mooncart.settings.set({ theme: 'moonlight' }));
});

await phone(1280, 800, async (page) => {
  console.log('big screen');
  await page.waitForTimeout(300);
  await shot(page, '10-desktop');
}, { isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall good');
process.exit(problems.length ? 1 : 0);
