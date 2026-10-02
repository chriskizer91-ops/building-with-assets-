#!/usr/bin/env node
/* global mooncart */ // (the console page's own global, used inside page.evaluate)
// Checks Mooncart in a plain web browser (Chromium, Playwright): builds the demo page and the
// one-file Mooncart.html (tools/build-demo.mjs), serves the demo the way the artifact host does
// (inside a locked-down frame, with a strict content security policy and no eval), then opens
// Mooncart.html straight from disk. Plays the samples, adds a game, checks that its saves are
// kept apart and that everything is still there after a reload. Screenshots go to build/web-smoke/.
//
//   node tools/web-smoke.mjs        (must end with "all good")

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'build', 'web-smoke');
fs.mkdirSync(OUT, { recursive: true });
for (const extra of [[], ['--standalone']]) execFileSync(process.execPath, [path.join(ROOT, 'tools/build-demo.mjs'), ...extra], { stdio: 'inherit' });

// a game that saves, says hello with alert() and shows the keys it gets
const KEYTEST = path.join(OUT, 'keytest.html');
fs.writeFileSync(KEYTEST, `<!doctype html><html><head><meta charset="utf-8"><title>Key Test</title></head>
<body style="background:#123;color:#fff;font:20px sans-serif"><p id="out">no key yet</p><p id="saved"></p>
<script>
  localStorage.setItem('visits', String(Number(localStorage.getItem('visits') || 0) + 1));
  localStorage.shared = 'from key test';
  document.getElementById('saved').textContent = 'visits ' + localStorage.getItem('visits') + ', keys ' + Object.keys(localStorage).join(',');
  document.addEventListener('keydown', function (e) { document.getElementById('out').textContent = 'key ' + e.key + ' ' + e.keyCode; });
  alert('hello from Key Test');
</script></body></html>`);

// the artifact host, roughly: the page in a sandboxed frame, scripts only inline or from itself
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; frame-src 'self'; worker-src 'self' blob:";
const DEMO = path.join(ROOT, 'build/demo');
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%;display:block}</style>' +
      '<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock" src="/test.html"></iframe>');
  }
  const f = path.join(DEMO, decodeURIComponent(u.pathname));
  if (!f.startsWith(DEMO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': f.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8', 'content-security-policy': CSP, 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const HOST = `http://localhost:${server.address().port}/`;

let pw;
try { pw = await import('playwright'); } catch { pw = await import('/opt/node-tools/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch();
const problems = [];
const check = (ok, what) => { console.log((ok ? '  ok   ' : '  FAIL ') + what); if (!ok) problems.push(what); };

async function open(url, viewport, touch) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: touch, acceptDownloads: true });
  const page = await ctx.newPage();
  const logs = [], errors = [];
  page.on('console', (m) => {
    const t = m.text();
    if (t.startsWith('[mooncart]')) logs.push(t);
    else if (/Content Security Policy|Refused to/.test(t) || (m.type() === 'error' && !/permissions policy|Failed to load resource/.test(t))) errors.push(t.slice(0, 200));
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.dismiss());
  await page.goto(url);
  const until = async (re, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (logs.some((l) => re.test(l))) return true; await page.waitForTimeout(150); } return false; };
  return { ctx, page, logs, errors, until };
}
// the console's own document (inside the host's frame for the demo)
async function consoleFrame(page) {
  for (let i = 0; i < 100; i++) {
    const f = page.frames().find((x) => /\/test\.html$|Mooncart\.html$/.test(x.url()));
    if (f) return f;
    await page.waitForTimeout(100);
  }
  throw new Error('the console page did not open');
}
const launch = (f, key) => f.evaluate((k) => { const g = mooncart.library.games().find((x) => x.saveKey === k || x.name === k); mooncart.launch(g.id); }, key);
async function addKeyTest(t, f) {
  await f.evaluate(() => { mooncart.quitToList(); mooncart.openLibrary(); });
  await t.page.waitForTimeout(400);
  await f.click('.mb-item:has-text("File")');
  const [fc] = await Promise.all([t.page.waitForEvent('filechooser'), f.click('.dropdown .mi:has-text("Add games")')]);
  await fc.setFiles(KEYTEST);
  await t.page.waitForTimeout(800);
  return f.evaluate(() => mooncart.library.games().find((g) => g.name === 'Key Test'));
}

// ------------------------------------------------------------------ the demo page
for (const [w, h, touch] of [[915, 412, true], [412, 915, true], [1280, 800, false]]) {
  console.log(`demo page, ${w}x${h}`);
  const t = await open(HOST, { width: w, height: h }, touch);
  let f = await consoleFrame(t.page);
  check(await t.until(/ready: 2 games/), 'starts with the 2 sample games');
  await launch(f, 'starfall');
  check(await t.until(/loaded starfall in/), 'Starfall plays');
  await f.evaluate(() => { mooncart.game.button('a', true); mooncart.game.button('a', false); });
  await t.page.waitForTimeout(1500);
  await t.page.screenshot({ path: path.join(OUT, `demo-${w}x${h}-starfall.png`) });
  await launch(f, 'button-check');
  check(await t.until(/loaded button-check in/), 'Button Check plays');
  await f.evaluate(() => mooncart.game.button('start', true));
  await t.page.waitForTimeout(250);
  check(await f.childFrames()[0].evaluate(() => [...document.querySelectorAll('.b.on b')].map((b) => b.textContent).join()) === 'START', 'START lights its box in Button Check');
  await f.evaluate(() => mooncart.game.button('start', false));
  if (w === 915) {
    await f.evaluate(() => { mooncart.quitToList(); mooncart.openLibrary(); });
    await f.click('.mb-item:has-text("File")');
    const off = await f.evaluate(() => [...document.querySelectorAll('.dropdown .mi.off')].map((m) => m.textContent.trim()).join(' | '));
    check(/Back up/.test(off) && /Restore/.test(off), 'backups are off in the demo');
    await f.evaluate(() => mooncart.lib.close());
    const added = await addKeyTest(t, f);
    check(added && added.src.startsWith('user:') && added.saveKey === 'key-test', 'Add games… puts a game from this computer in the library');
    await f.evaluate((id) => { mooncart.lib.close(); mooncart.launch(id); }, added.id);
    check(await t.until(/loaded key-test in/), 'the added game plays');
    await t.page.waitForTimeout(700);
    check(/hello from Key Test/.test(await f.evaluate(() => document.querySelector('#modal-root').textContent)), 'its alert() shows on the console');
    await f.evaluate(() => document.querySelector('#modal-root button')?.click());
    await f.evaluate(() => { mooncart.game.button('a', true); mooncart.game.button('a', false); });
    await t.page.waitForTimeout(300);
    check(/key Enter 13/.test(await f.childFrames()[0].evaluate(() => document.getElementById('out').textContent)), 'A presses Enter in the game');
    check((await f.evaluate(() => Object.keys(localStorage).sort().join())) === 'mc:key-test:shared,mc:key-test:visits', 'its saves have their own slot');
    await t.page.reload();
    t.logs.length = 0;
    f = await consoleFrame(t.page);
    check(await t.until(/ready: 3 games/), 'after a reload the added game is still there');
    await launch(f, 'Key Test');
    await t.until(/loaded key-test in/);
    await t.page.waitForTimeout(500);
    check(/visits 2/.test(await f.childFrames()[0].evaluate(() => document.getElementById('saved').textContent)), 'and so are its saves');
  }
  check(!t.errors.length, 'no errors or blocked loads' + (t.errors.length ? ': ' + [...new Set(t.errors)].slice(0, 4).join(' | ') : ''));
  await t.ctx.close();
}

// ------------------------------------------------------------------ Mooncart.html from disk
console.log('Mooncart.html, opened from disk');
{
  const t = await open(pathToFileURL(path.join(ROOT, 'build/web/Mooncart.html')).href, { width: 1280, height: 800 }, false);
  const f = await consoleFrame(t.page);
  check(await t.until(/ready: 2 games/), 'starts, with the samples inside the file');
  await launch(f, 'starfall');
  check(await t.until(/loaded starfall in/), 'Starfall plays');
  const added = await addKeyTest(t, f);
  check(!!added, 'Add games… works');
  await f.evaluate((id) => { mooncart.lib.close(); mooncart.launch(id); }, added.id);
  check(await t.until(/loaded key-test in/), 'the added game plays');
  await t.page.waitForTimeout(500);
  await f.evaluate(() => { mooncart.quitToList(); mooncart.openLibrary(); });
  const [dl] = await Promise.all([t.page.waitForEvent('download', { timeout: 8000 }).catch(() => null), f.evaluate((id) => mooncart.lib.exportSave(mooncart.library.get(id)), added.id)]);
  check(dl && dl.suggestedFilename() === 'key-test-saves.json', 'Export saves… hands the browser a file');
  await t.page.reload();
  t.logs.length = 0;
  check(await t.until(/ready: 3 games/), 'after reopening, the added game is still there');
  check(!t.errors.length, 'no errors' + (t.errors.length ? ': ' + [...new Set(t.errors)].slice(0, 4).join(' | ') : ''));
  await t.ctx.close();
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall good');
process.exit(problems.length ? 1 : 0);
