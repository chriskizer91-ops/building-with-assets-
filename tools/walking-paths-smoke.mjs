#!/usr/bin/env node
/* global WalkingPaths, WalkingPathsEngine */ // (the page's own globals, used inside page.evaluate)
// Checks Walking Paths in Chromium (Playwright): builds it (tools/build-walking-paths.mjs), opens
// Walking-Paths.html straight from disk the way you would, and works through it: the examples,
// drawing by tapping and by tracing, undo, the magic wand on a made-up picture, people, things,
// ways out between maps, walking (and walking through a way out), every file it saves, opening a
// maps file, and that the work is still there after a reload. Then a world map made from four
// pictures at once, walked with the painted Io, the camera and speed sliders, and Picture size.
// Then the artifact page inside a locked-down frame, as the artifact host shows it. Screenshots go
// to build/walking-paths-smoke/.
//
//   node tools/walking-paths-smoke.mjs        (must end with "all good")

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'build', 'walking-paths-smoke');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
execFileSync(process.execPath, [path.join(ROOT, 'tools/build-walking-paths.mjs')], { stdio: 'inherit' });
const BUILT = path.join(ROOT, 'build/walking-paths');

let pw;
try { pw = await import('playwright'); } catch { pw = await import('/opt/node-tools/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch();
const problems = [];
const check = (ok, what) => { console.log((ok ? '  ok   ' : '  FAIL ') + what); if (!ok) problems.push(what); };

async function open(url, viewport, touch, ctxIn) {
  const ctx = ctxIn || await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: touch, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { const t = m.text(); if (/Content Security Policy|Refused to/.test(t) || (m.type() === 'error' && !/Failed to load resource|favicon/.test(t))) errors.push(t.slice(0, 300)); });
  page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' ')));
  await page.goto(url);
  return { ctx, page, errors };
}
const ready = (page) => page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 20000 });
const state = (page, fn, arg) => page.evaluate(fn, arg);
const counts = (page) => state(page, () => { const m = WalkingPaths.S.maps[WalkingPaths.S.cur]; return { walk: m.walk.length, block: m.block.length, front: m.front.length, exits: m.exits.length, people: m.people.length, spots: m.spots.length, maps: WalkingPaths.S.order.length, cur: WalkingPaths.S.cur }; });
// where map point (x, y) is on the screen
const onScreen = (page, x, y) => state(page, ([x, y]) => {
  const r = document.getElementById('wp-cv').getBoundingClientRect(), v = WalkingPaths.ed.view;
  return [r.left + (x - v.x) * v.z, r.top + (y - v.y) * v.z];
}, [x, y]);
async function clickMap(page, x, y, opts) { const [sx, sy] = await onScreen(page, x, y); await page.mouse.click(sx, sy, opts); await page.waitForTimeout(60); }
async function saved(page, button) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click(button)]);
  const file = path.join(OUT, dl.suggestedFilename());
  await dl.saveAs(file);
  return file;
}

// a made-up map picture: a sand-coloured cross of paths on dark grass, a grey well in the middle of
// it, drawn by the browser itself (no image tools needed)
async function testPicture(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 800; c.height = 500;
    const g = c.getContext('2d');
    g.fillStyle = '#1f3a1c'; g.fillRect(0, 0, 800, 500);
    g.fillStyle = '#c9a36a'; g.fillRect(0, 200, 800, 120); g.fillRect(330, 0, 140, 500);
    g.fillStyle = '#5b5f66'; g.beginPath(); g.arc(400, 260, 34, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 2000; i++) { g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect((i * 97) % 800, (i * 61) % 500, 3, 3); }
    return c.toDataURL('image/png').split(',')[1];
  });
  return { name: 'crossroads_test-map.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

// =================================================================================================
console.log('Walking-Paths.html, opened from disk, on a laptop');
const FILE_URL = pathToFileURL(path.join(BUILT, 'Walking-Paths.html')).href;
let { ctx, page, errors } = await open(FILE_URL, { width: 1280, height: 800 }, false);
await ready(page);
await page.waitForTimeout(600);
let c = await counts(page);
check(c.maps === 2 && c.cur === 'wickhollow', 'it starts with the two examples, Wickhollow on screen');
check(c.walk === 9 && c.block === 8 && c.front === 10 && c.exits === 3 && c.people === 3, 'Wickhollow has its walking paths from Envoi');
check(await state(page, () => document.getElementById('wp-plate-name').textContent === 'Wickhollow'), 'the name plate says Wickhollow');
await page.screenshot({ path: path.join(OUT, '01-laptop-examples.png') });

// drawing by clicking points: a walk area in the top left corner of the painting
await page.click('[data-tool="walk"]');
for (const [x, y] of [[60, 60], [200, 60], [200, 160], [60, 160]]) await clickMap(page, x, y);
check((await state(page, () => WalkingPaths.S.draft && WalkingPaths.S.draft.length)) === 4, 'four clicks put down four points');
check(await page.isVisible('#wp-drawbar'), 'the bar for the shape being drawn shows');
await page.click('#wp-draw-done');
c = await counts(page);
check(c.walk === 10, 'Finish shape adds the walk area');
check(await state(page, () => WalkingPaths.S.tool === 'select' && WalkingPaths.S.sel && WalkingPaths.S.sel.kind === 'walk' && WalkingPaths.S.sel.i === 9), 'the new walk area is picked, ready to adjust');

// tracing round a shape with the mouse held down; coming back to the start closes it
await page.click('[data-tool="block"]');
{
  const pts = [[100, 80], [180, 80], [180, 140], [100, 140], [101, 82]];
  const [sx, sy] = await onScreen(page, ...pts[0]);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (const [x, y] of pts.slice(1)) {
    const [a, b] = await onScreen(page, x, y);
    await page.mouse.move(a, b, { steps: 12 });
  }
  await page.mouse.up();
}
c = await counts(page);
check(c.block === 9, 'tracing round and back to the start makes a block');

// undo and redo
await page.click('#wp-undo');
check((await counts(page)).block === 8, 'Undo takes the block away');
await page.click('#wp-redo');
check((await counts(page)).block === 9, 'Redo brings it back');
await page.keyboard.press('Control+z');
await page.keyboard.press('Control+z');
c = await counts(page);
check(c.block === 8 && c.walk === 9, 'Ctrl+Z twice takes back both new shapes');

// a person, named in the panel
await page.click('[data-tool="person"]');
await clickMap(page, 760, 700);
c = await counts(page);
check(c.people === 4, 'a tap with + Person puts someone down');
await page.fill('#wp-picked input[type="text"]', 'Old Tam');
await page.keyboard.press('Tab');
check(await state(page, () => { const p = WalkingPaths.S.maps.wickhollow.people[3]; return p.name === 'Old Tam' && p.id === 'old-tam'; }), 'naming them in the panel sets their name and key');

// a thing to look at
await page.click('[data-tool="thing"]');
await clickMap(page, 900, 720);
await page.fill('#wp-picked input[type="text"]', 'A signpost');
await page.fill('#wp-picked textarea', 'North to the hills, east to the sea.');
await page.keyboard.press('Tab');
check(await state(page, () => { const s = WalkingPaths.S.maps.wickhollow.spots.at(-1); return s.label === 'A signpost' && s.note === 'North to the hills, east to the sea.' && s.kind === 'look'; }), 'a thing gets its name and what she sees');

// a way out to the jetty, pulled out as a box, then pointed at the jetty
await page.click('[data-tool="exit"]');
{
  const [a, b] = await onScreen(page, 1400, 600), [x2, y2] = await onScreen(page, 1460, 660);
  await page.mouse.move(a, b); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 6 }); await page.mouse.up();
}
c = await counts(page);
check(c.exits === 4, 'dragging with + Way out makes a way out');
await page.selectOption('#wp-exit-to', 'jetty');
check(await state(page, () => { const e = WalkingPaths.S.maps.wickhollow.exits[3]; return e.to === 'jetty' && Array.isArray(e.at) && e.label === 'The jetty'; }), 'choosing where it leads sets the place and where she arrives');
await page.screenshot({ path: path.join(OUT, '02-laptop-way-out.png') });

// nudging: Shift+arrow, undo, Shift+arrow again: the second nudge is its own undo step
{
  const at = () => state(page, () => WalkingPaths.S.maps.wickhollow.people[3].at.slice());
  await page.click('[data-tool="select"]');
  await clickMap(page, 760, 700);
  const p0 = await at();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Control+z');
  await page.keyboard.press('Shift+ArrowDown');
  const p1 = await at();
  await page.keyboard.press('Control+z');
  const p2 = await at();
  check(p1[0] === p0[0] && p1[1] === p0[1] + 1 && p2[0] === p0[0] && p2[1] === p0[1], 'a nudge after an undo is a step of its own (' + p0 + ' → ' + p1 + ' → ' + p2 + ')');
  // Ctrl+Z in the middle of dragging her dot is ignored; the drag is one undo step
  const [sx, sy] = await onScreen(page, ...p0);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 30, sy + 10, { steps: 5 });
  await page.keyboard.press('Control+z');
  await page.mouse.move(sx + 40, sy + 20, { steps: 5 });
  await page.mouse.up();
  const p3 = await at();
  await page.keyboard.press('Control+z');
  const p4 = await at();
  check(p3[0] > p0[0] + 20 && p4[0] === p0[0] && p4[1] === p0[1], 'Ctrl+Z during a drag waits; afterwards it takes back the whole drag');
}

// a shape deleted while the mouse rests on one of its corners
await page.click('[data-tool="walk"]');
for (const [x, y] of [[1300, 80], [1420, 80], [1420, 180], [1300, 180]]) await clickMap(page, x, y);
await page.click('#wp-draw-done');
{ const [sx, sy] = await onScreen(page, 1420, 180); await page.mouse.move(sx, sy); }
await page.waitForTimeout(100);
await page.keyboard.press('Delete');
{ const [sx, sy] = await onScreen(page, 1420, 180); await page.mouse.move(sx + 1, sy); }
await page.waitForTimeout(150);
check(!errors.length && (await counts(page)).walk === 9, 'deleting a shape under the mouse leaves the picture drawing fine');

// the reach check
await page.check('#wp-l-reach');
await page.waitForFunction(() => /reach/.test(document.getElementById('wp-reach').textContent) && !/Checking/.test(document.getElementById('wp-reach').textContent), null, { timeout: 10000 });
const reachSay = await page.textContent('#wp-reach');
check(/can’t reach|can reach everything/.test(reachSay), 'the reach check reports: ' + reachSay.slice(0, 90));
await page.uncheck('#wp-l-reach');

// a new picture becomes a new map; the magic wand outlines its paths, with the well as a block
await page.setInputFiles('#wp-file-pictures', await testPicture(page));
await page.waitForFunction(() => WalkingPaths.S.order.length === 3, null, { timeout: 10000 });
c = await counts(page);
check(c.cur === 'crossroads-test-map', 'the picture is a new map named from its file (' + c.cur + ')');
check(await state(page, () => { const m = WalkingPaths.S.maps[WalkingPaths.S.cur]; return m.size[0] === 800 && m.size[1] === 500 && m.walker === 25; }), 'its size is the picture’s, and people are a sensible height on it');
await page.click('[data-tool="walk"]');
await page.click('[data-drawby="wand"]');
await clickMap(page, 150, 260);
await page.waitForFunction(() => WalkingPaths.S.maps[WalkingPaths.S.cur].walk.length === 1, null, { timeout: 10000 }).catch(() => {});
c = await counts(page);
check(c.walk === 1, 'one tap of the wand on the sand outlines a walk area');
check(c.block === 1, 'the well inside the cross comes back as a block');
const wandShape = await state(page, () => {
  const m = WalkingPaths.S.maps[WalkingPaths.S.cur], R = WalkingPathsEngine.rules, w = m.walk[0];
  const inside = (x, y) => R.inPoly(w, x, y) && !m.block.some((b) => R.inPoly(b, x, y));
  return { pts: w.length, path: inside(100, 260) && inside(400, 60) && inside(700, 260) && inside(400, 450), grass: !inside(100, 80) && !inside(700, 420), well: !inside(400, 260), edges: w.some((p) => p[0] === 0) && w.some((p) => p[0] === 800) && w.some((p) => p[1] === 0) && w.some((p) => p[1] === 500) };
});
check(wandShape.path && wandShape.grass, 'the outline follows the paths and leaves out the grass (' + wandShape.pts + ' points)');
check(wandShape.well, 'the well is cut out of it');
check(wandShape.edges, 'where the paths run off the picture, the outline reaches the edge exactly');
// a smaller spread redoes the same outline
await page.fill('#wp-spread', '10');
await page.dispatchEvent('#wp-spread', 'change');
await page.waitForTimeout(600);
check((await counts(page)).walk === 1, 'changing the spread redoes the last outline instead of adding another');
await page.click('[data-drawby="hand"]');
await page.screenshot({ path: path.join(OUT, '03-laptop-wand.png') });

// a way out off its right edge to the jetty, and the way back made in one go
await page.click('[data-tool="exit"]');
await clickMap(page, 790, 260);
await page.selectOption('#wp-exit-to', 'jetty');
const across = await state(page, () => WalkingPaths.S.maps['crossroads-test-map'].exits[0].at);
check(across[0] < 768, 'leaving by the right edge, she arrives on the left half of the jetty, where she can stand (' + across + ')');
await page.click('text=Make the way back from The jetty');
const back = await state(page, () => {
  const j = WalkingPaths.S.maps.jetty, e = j.exits.find((x) => x.to === 'crossroads-test-map'), at = WalkingPaths.S.maps['crossroads-test-map'].exits[0].at;
  return e && { rect: e.rect, back: e.at, clear: !(at[0] >= e.rect[0] - 8 && at[0] <= e.rect[2] + 8 && at[1] >= e.rect[1] - 8 && at[1] <= e.rect[3] + 8) };
});
check(!!back, 'Make the way back puts a way out on the jetty leading back');
check(back && back.clear && back.back[0] < 775, 'she arrives clear of it on the jetty, and comes back clear of the way out she left by');

// rename the new map: its key follows its name
await page.fill('#wp-map-name', 'The Crossroads');
await page.keyboard.press('Tab');
check(await state(page, () => WalkingPaths.S.cur === 'the-crossroads' && WalkingPaths.S.maps['the-crossroads'].name === 'The Crossroads'), 'renaming the map renames its key too');
check(await state(page, () => WalkingPaths.S.maps.jetty.exits.some((e) => e.to === 'the-crossroads')), 'and the jetty’s way back follows the new key');
await page.keyboard.press('Control+z');
check(await state(page, () => WalkingPaths.S.cur === 'crossroads-test-map' && !WalkingPaths.S.maps['the-crossroads'] && WalkingPaths.S.maps['crossroads-test-map'].name === 'Crossroads test map'), 'and one undo puts both back');
await page.keyboard.press('Control+y');

// walking: on Wickhollow, through the way out to the jetty
await page.click('.wp-maps li:first-child .wp-map-pick');
check((await counts(page)).cur === 'wickhollow', 'picking Wickhollow in the list shows it');
await state(page, () => { WalkingPaths.S.sel = { kind: 'exit', i: 2 }; WalkingPaths.panel.renderPicked(true); });
check(/Way out/.test(await page.textContent('#wp-picked')), 'Wickhollow’s way out to the jetty is picked before the walk');
await page.click('#wp-walk');
await page.waitForFunction(() => WalkingPaths.field() && WalkingPaths.field().mapId === 'wickhollow', null, { timeout: 10000 });
await page.waitForTimeout(500);
const p0 = await state(page, () => [WalkingPaths.field().me.x, WalkingPaths.field().me.y]);
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(700);
await page.keyboard.up('ArrowDown');
const p1 = await state(page, () => [WalkingPaths.field().me.x, WalkingPaths.field().me.y]);
check(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 20, 'the arrow keys walk her (' + Math.round(Math.hypot(p1[0] - p0[0], p1[1] - p0[1])) + ' px)');
await page.screenshot({ path: path.join(OUT, '04-laptop-walking.png') });
// to the way out on the left (to the jetty), by asking her to walk there
await state(page, () => WalkingPaths.field().walkTo(8, 733));
await page.waitForFunction(() => WalkingPaths.field().mapId === 'jetty', null, { timeout: 20000 }).catch(() => {});
check(await state(page, () => WalkingPaths.field().mapId === 'jetty'), 'walking into the way out takes her to the jetty');
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, '05-laptop-jetty.png') });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check(await state(page, () => !WalkingPaths.S.walking && WalkingPaths.S.cur === 'jetty' && !!WalkingPaths.S.lastWalk.jetty), 'Esc goes back to editing, on the map where she stopped');
check(!/Way out/.test(await page.textContent('#wp-picked')) && (await page.inputValue('#wp-map-name')) === 'The jetty', 'and the panel is about that map, not Wickhollow’s way out');

// every file it saves
const mapsFile = await saved(page, '#wp-save');
const data = JSON.parse(fs.readFileSync(mapsFile, 'utf8'));
check(data.format === 'walking-paths' && Object.keys(data.maps).length === 3, 'the maps file has all three maps (' + path.basename(mapsFile) + ')');
check(Object.values(data.maps).every((m) => /^data:image\//.test(m.src)), 'with their pictures inside');
const w = data.maps.wickhollow;
check(w.walk.length === 9 && w.people.some((p) => p.name === 'Old Tam') && w.exits[3].to === 'jetty' && w.band === 1 && w.music === 'town', 'and everything on them, Envoi’s own fields too');
const dataFile = await saved(page, '#wp-save-data');
const data2 = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
check(data2.maps.jetty.src === 'jetty.avif' && !/data:/.test(fs.readFileSync(dataFile, 'utf8')), 'the map data on its own names the pictures instead');
const pic = await saved(page, '#wp-save-picture');
check(fs.readFileSync(pic).subarray(1, 4).toString() === 'PNG' && fs.statSync(pic).size > 50000, 'a picture of the map with the paths on it (' + path.basename(pic) + ')');
const mask = await saved(page, '#wp-save-mask');
check(fs.readFileSync(mask).subarray(1, 4).toString() === 'PNG', 'its walk mask (' + path.basename(mask) + ')');
await page.evaluate(() => navigator.clipboard && navigator.clipboard.writeText && 0);
await page.click('#wp-copy');
await page.waitForTimeout(300);
const copySay = await page.textContent('#wp-status');
check(/Copied|already picked/.test(copySay), 'Copy the map data copies it, or shows it ready to copy');
const walkPage = await saved(page, '#wp-save-page');
check(/\.html$/.test(walkPage), 'a walk-around page (' + path.basename(walkPage) + ', ' + Math.round(fs.statSync(walkPage).size / 1024) + ' KB)');
await page.screenshot({ path: path.join(OUT, '06-laptop-saved.png') });
check(!errors.length, 'no errors on the page' + (errors.length ? ': ' + errors.join(' | ') : ''));

// the walk-around page on its own
{
  const w2 = await open(pathToFileURL(walkPage).href, { width: 900, height: 600 }, false, ctx);
  await w2.page.waitForTimeout(1200);
  const before = await w2.page.evaluate(() => document.querySelector('.wpe-plate') && document.querySelector('.wpe-plate').textContent);
  check(before === 'The jetty', 'the walk-around page starts on the map that was on screen (' + before + ')');
  await w2.page.keyboard.down('ArrowUp');
  await w2.page.waitForTimeout(500);
  await w2.page.keyboard.up('ArrowUp');
  await w2.page.keyboard.press('m');
  await w2.page.waitForTimeout(300);
  check(await w2.page.isVisible('text=Go to a map'), 'M lists the maps to jump between');
  await w2.page.screenshot({ path: path.join(OUT, '07-walk-around-page.png') });
  check(!w2.errors.length, 'no errors on the walk-around page' + (w2.errors.length ? ': ' + w2.errors.join(' | ') : ''));
  await w2.page.close();
}

// the work is still there after closing and opening the page again
await page.reload();
await ready(page);
c = await counts(page);
check(c.maps === 3 && c.cur === 'jetty', 'after a reload the three maps are still there, the jetty on screen (' + c.maps + ', ' + c.cur + ')');
check(await state(page, () => WalkingPaths.S.maps.wickhollow.people.some((p) => p.name === 'Old Tam')), 'with the changes made to them');
await page.waitForTimeout(500);
check(await state(page, () => { const i = document.querySelector('.wp-maps img'); return !!i && i.complete && i.naturalWidth > 0; }), 'and their pictures');

// opening the maps file again, beside what is there
await page.setInputFiles('#wp-file-open', mapsFile);
await page.waitForSelector('#wp-dialog:not([hidden])');
await page.click('#wp-dialog-buttons button:first-child');
await page.waitForFunction(() => WalkingPaths.S.order.length === 6, null, { timeout: 10000 }).catch(() => {});
c = await counts(page);
check(c.maps === 6, 'opening the maps file beside them adds its three maps (keys made different)');
check(await state(page, () => WalkingPaths.S.maps['wickhollow-2'] && WalkingPaths.S.maps['wickhollow-2'].exits[2].to === 'jetty-2'), 'and their ways out lead to each other, not to the old ones');
await page.setInputFiles('#wp-file-open', mapsFile);
await page.waitForSelector('#wp-dialog:not([hidden])');
await page.click('#wp-dialog-buttons button:nth-child(2)');
await page.waitForFunction(() => WalkingPaths.S.order.length === 3, null, { timeout: 10000 }).catch(() => {});
check((await counts(page)).maps === 3, 'or instead of them');
check(await state(page, () => WalkingPaths.S.order.every((id) => /^[\w.-]{1,60}$/.test(WalkingPaths.S.maps[id].pic.file))), 'pictures that came inside the file are named after their maps');
{
  const town = (name) => ({ name: name + '.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ maps: { town: { name, size: [300, 200], walk: [[[0, 0], [300, 0], [300, 200], [0, 200]]], exits: [{ rect: [0, 0, 10, 10], to: 'town', at: [150, 100] }] } } })) });
  await page.setInputFiles('#wp-file-open', [town('Town A'), town('Town B')]);
  await page.waitForSelector('#wp-dialog:not([hidden])');
  await page.click('#wp-dialog-buttons button:first-child');
  await page.waitForFunction(() => WalkingPaths.S.order.length === 5, null, { timeout: 10000 }).catch(() => {});
  const towns = await state(page, () => WalkingPaths.S.order.filter((id) => /^town/.test(id)).map((id) => [id, WalkingPaths.S.maps[id].name, WalkingPaths.S.maps[id].exits[0].to]));
  check(towns.length === 2 && towns[0][1] !== towns[1][1] && towns.every(([id, , to]) => id === to), 'two files that both have a map called “town” open as two maps, each leading to itself (' + JSON.stringify(towns) + ')');
  await page.keyboard.press('Control+z');
}
await page.click('.wp-maps li:nth-child(2) .wp-map-pick');
await page.click('#wp-mapset .wp-danger');
await page.click('.wp-maps li:nth-child(1) .wp-map-pick');
await page.click('#wp-mapset .wp-danger');
check((await counts(page)).maps === 3 && /Sure/.test(await page.textContent('#wp-mapset .wp-danger')), '“Delete this map” asks again on another map before deleting it');
await page.fill('#wp-map-w', '');
check(await page.isDisabled('#wp-mapset button:has-text("Use this size")'), 'an empty width can’t be used as a size');
// a walk stopped at once, on a map with nowhere to stand
await page.setInputFiles('#wp-file-pictures', { name: 'blank.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') });
await page.waitForFunction(() => WalkingPaths.S.order.length === 4, null, { timeout: 10000 }).catch(() => {});
await page.keyboard.press('F2');
await page.keyboard.press('F2');
await page.waitForTimeout(500);
check(!errors.length, 'starting and stopping a walk at once is fine' + (errors.length ? ': ' + errors.join(' | ') : ''));
check(!errors.length, 'still no errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await ctx.close();

// =================================================================================================
console.log('A world map from four pictures, walked with the painted Io');
({ ctx, page, errors } = await open(FILE_URL, { width: 1280, height: 800 }, false));
await ready(page);
{
  // a big world map (an island with crossing roads) and three smaller places
  const pics = await page.evaluate(() => {
    const make = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c.toDataURL('image/png').split(',')[1]; };
    const world = make(3600, 2400, (g, w, h) => {
      g.fillStyle = '#1c3550'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5c7a3a'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.4, h * 0.38, 0, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 4000; i++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect((i * 997) % w, (i * 613) % h, 6, 6); }
      g.strokeStyle = '#c9a36a'; g.lineWidth = 30; g.beginPath(); g.moveTo(w * 0.2, h * 0.5); g.lineTo(w * 0.8, h * 0.5); g.moveTo(w / 2, h * 0.2); g.lineTo(w / 2, h * 0.8); g.stroke();
    });
    const place = (col) => make(900, 600, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a36a'; g.fillRect(0, 250, w, 100); g.fillRect(400, 0, 100, h); for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect((i * 97) % w, (i * 61) % h, 4, 4); } });
    return { world, town: place('#3a2f4a'), forest: place('#1f3a1c'), harbour: place('#1c2f3a') };
  });
  const png = (name, b64) => ({ name, mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.setInputFiles('#wp-file-pictures', [png('world-map.png', pics.world), png('town.png', pics.town), png('forest.png', pics.forest), png('harbour.png', pics.harbour)]);
  await page.waitForSelector('#wp-dialog:not([hidden])', { timeout: 20000 });
  const asked = await page.$$eval('#wp-dialog-more input', (a) => a.map((i) => [i.type, i.value, i.checked]));
  check(asked.filter((a) => a[0] === 'radio').length === 5 && asked.some((a) => a[1] === 'world-map' && a[2]), 'adding four pictures asks which is the world map (the one called world map is picked already)');
  check(asked.some((a) => a[0] === 'checkbox' && a[2]), 'and offers to make the big one smaller');
  await page.screenshot({ path: path.join(OUT, '30-world-question.png') });
  await page.click('#wp-dialog-buttons button');
  await page.waitForFunction(() => WalkingPaths.S.cur === 'world', null, { timeout: 30000 }).catch(() => {});
  // (the world map is joined up at once; the big picture is made smaller after that)
  await page.waitForFunction(() => !/smaller…/.test(document.getElementById('wp-status').textContent), null, { timeout: 30000 }).catch(() => {});
  const w = await state(page, () => {
    const S = WalkingPaths.S, world = S.maps.world;
    if (!world) return null;
    return {
      kind: world.kind, size: world.size, pic: world.pic,
      places: (world.places || []).map((p) => [p.id, p.to, p.at, p.arrive]),
      backs: ['town', 'forest', 'harbour'].map((k) => S.maps[k].exits.filter((e) => e.to === 'world').map((e) => [e.at, e.rect])),
      sizes: ['town', 'forest', 'harbour'].map((k) => S.maps[k].size),
    };
  });
  check(!!w && w.kind === 'world', 'the picked picture becomes the world map, its key “world” as in Envoi');
  check(!!w && w.places.length === 3 && ['town', 'forest', 'harbour'].every((k) => w.places.some((p) => p[1] === k && Array.isArray(p[3]))), 'the other three are places on it, each leading into its map');
  check(!!w && w.backs.every((b, i) => b.length === 1 && b[0][0] === w.places.find((p) => p[1] === ['town', 'forest', 'harbour'][i])[0]), 'and each of them has a way back out to its own place on the world map');
  check(!!w && w.pic.w <= 3072 && w.pic.type === 'image/webp' && w.size[0] === 3600 && w.size[1] === 2400, 'the world map’s picture is smaller now (' + (w && w.pic.w + ' × ' + w.pic.h + ' ' + w.pic.type) + '), the map still 3600 × 2400');
  await page.screenshot({ path: path.join(OUT, '31-world-map.png') });

  // walking: to the town's flag, into the town, out of its way back, onto the world map again
  await page.click('#wp-walk');
  await page.waitForFunction(() => WalkingPaths.field() && WalkingPaths.field().mapId === 'world', null, { timeout: 10000 });
  await page.waitForFunction(() => WalkingPaths.field().drawn === 'io-painted', null, { timeout: 10000 }).catch(() => {});
  check(await state(page, () => WalkingPaths.field().drawn === 'io-painted'), 'the painted Io from Envoi walks (the paper doll)');
  const town = w.places.find((p) => p[1] === 'town');
  await state(page, (at) => WalkingPaths.field().walkTo(at[0], at[1]), town[2]);
  await page.waitForFunction(() => /Go to Town/.test(document.querySelector('.wpe-act').textContent) && !document.querySelector('.wpe-act').hidden, null, { timeout: 20000 }).catch(() => {});
  check(await page.isVisible('.wpe-act:has-text("Go to Town")'), 'at the town’s flag the gold button says Go to Town');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '32-world-walk.png') });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => WalkingPaths.field().mapId === 'town', null, { timeout: 10000 }).catch(() => {});
  const inTown = await state(page, () => ({ id: WalkingPaths.field().mapId, cur: WalkingPaths.S.cur, at: [WalkingPaths.field().me.x, WalkingPaths.field().me.y] }));
  check(inTown.id === 'town' && Math.hypot(inTown.at[0] - town[3][0], inTown.at[1] - town[3][1]) < 2, 'Enter takes her into the town, where the place says she arrives');
  check(inTown.cur === 'town' && (await page.inputValue('#wp-map-name')) === 'Town', 'and the panel follows her to the town');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '33-town-walk.png') });
  const door = w.backs[0][0][1];
  await state(page, (r) => WalkingPaths.field().walkTo((r[0] + r[2]) / 2, (r[1] + r[3]) / 2), door);
  await page.waitForFunction(() => WalkingPaths.field().mapId === 'world', null, { timeout: 15000 }).catch(() => {});
  const back = await state(page, () => ({ id: WalkingPaths.field().mapId, at: [WalkingPaths.field().me.x, WalkingPaths.field().me.y] }));
  check(back.id === 'world' && Math.hypot(back.at[0] - town[2][0], back.at[1] - town[2][1]) < 2, 'its way out (a map with no walk areas yet is all ground) brings her back to the town’s flag');

  // how close the camera is and how fast she walks, changed while she walks
  await page.waitForTimeout(400);
  const z0 = await state(page, () => WalkingPaths.field().cam.z);
  await page.fill('#wp-map-zoom', '2');
  await page.dispatchEvent('#wp-map-zoom', 'input');
  await page.dispatchEvent('#wp-map-zoom', 'change');
  await page.waitForTimeout(200);
  const z1 = await state(page, () => WalkingPaths.field().cam.z);
  check(Math.abs(z1 / z0 - 2) < 0.05 && (await state(page, () => WalkingPaths.S.maps.world.zoom)) === 1.4, 'the camera slider brings the camera twice as close at once (' + z0.toFixed(2) + ' → ' + z1.toFixed(2) + ')');
  await page.fill('#wp-map-pace', '4');
  await page.dispatchEvent('#wp-map-pace', 'input');
  await page.dispatchEvent('#wp-map-pace', 'change');
  await page.dispatchEvent('#wp-map-pace', 'pointerup');
  check(await state(page, () => WalkingPaths.S.maps.world.pace === 4 && WalkingPaths.field().map.pace === 4), 'and the speed slider makes her walk faster');
  await page.waitForTimeout(50);
  check(await state(page, () => document.activeElement.id !== 'wp-map-pace'), 'letting go of a slider gives the keys back to the walk');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(await state(page, () => !WalkingPaths.S.walking && WalkingPaths.S.cur === 'world'), 'Esc goes back to editing the world map');

  // picture size, on the town
  await page.click('.wp-maps li:has-text("Town") .wp-map-pick');
  await page.click('#wp-picture-size');
  await page.waitForFunction(() => document.querySelectorAll('#wp-shrink-options button.wp-size').length === 6, null, { timeout: 30000 }).catch(() => {});
  const cards = await page.$$eval('#wp-shrink-options button.wp-size', (a) => a.map((b) => b.textContent));
  check(cards.length === 6 && cards.every((t) => /\d+ × \d+/.test(t) && /(KB|MB|bytes)/.test(t) && /Detail kept\d+%/.test(t) && /Memory\d+ MB/.test(t)), 'Picture size shows the original and five smaller sizes, each with its file size, detail kept and memory');
  await page.click('#wp-shrink-options button[data-size="50"]');
  await page.dispatchEvent('#wp-shrink-hold', 'pointerdown', { pointerId: 5 });
  check(/Original.*holding/.test(await page.textContent('#wp-shrink-label')), 'holding the button shows the original');
  await page.dispatchEvent('#wp-shrink-hold', 'pointerup', { pointerId: 5 });
  check(/^50%/.test(await page.textContent('#wp-shrink-label')), 'letting go shows the size picked again');
  await page.click('#wp-shrink-close-up');
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(OUT, '34-picture-size.png') });
  await page.click('#wp-shrink-use');
  await page.waitForSelector('#wp-shrink', { state: 'hidden', timeout: 20000 }).catch(() => {});
  const shrunk = await state(page, () => { const m = WalkingPaths.S.maps.town; return { w: m.pic.w, h: m.pic.h, type: m.pic.type, size: m.size, exit: m.exits[0].rect }; });
  check(shrunk.w === 450 && shrunk.h === 300 && shrunk.size[0] === 900 && shrunk.size[1] === 600 && shrunk.exit[0] === w.backs[0][0][1][0], 'Use this size: the town’s picture is half as wide, the map and everything on it unchanged');
  await page.keyboard.press('Control+z');
  check(await state(page, () => WalkingPaths.S.maps.town.pic.w === 900), 'and Undo puts the old picture back');

  // the maps file keeps the world map, and the walk-around page has the painted Io
  const file = JSON.parse(fs.readFileSync(await saved(page, '#wp-save'), 'utf8'));
  check(file.maps.world.kind === 'world' && file.maps.world.places.length === 3 && file.maps.world.zoom === 1.4 && file.maps.world.pace === 4 && file.maps.town.exits[0].to === 'world' && typeof file.maps.town.exits[0].at === 'string', 'the maps file keeps the world map, its places, its camera and speed, and the ways back');
  const walkFile = await saved(page, '#wp-save-page');
  check(/makePaintedIo/.test(fs.readFileSync(walkFile, 'utf8')), 'the walk-around page has the painted Io in it');
  const w2 = await open(pathToFileURL(walkFile).href, { width: 900, height: 600 }, false, ctx);
  await w2.page.waitForTimeout(1500);
  check(!w2.errors.length && (await w2.page.textContent('.wpe-plate')) === 'Town', 'and it walks' + (w2.errors.length ? ': ' + w2.errors.join(' | ') : ''));
  await w2.page.close();

  // changing the town's size moves where she arrives from the world map, and Undo puts it back
  const arrive = () => state(page, () => WalkingPaths.S.maps.world.places.find((p) => p.to === 'town').arrive.slice());
  const a0 = await arrive();
  await page.fill('#wp-map-w', '1800');
  await page.click('#wp-mapset button:has-text("Use this size")');
  const a1 = await arrive();
  await page.keyboard.press('Control+z');
  const a2 = await arrive();
  check(a1[0] === a0[0] * 2 && a2[0] === a0[0] && a2[1] === a0[1] && (await state(page, () => WalkingPaths.S.maps.town.size[0])) === 900, 'a new size for the town moves where she arrives from the world map, and Undo moves it back (' + a0 + ' → ' + a1 + ' → ' + a2 + ')');

  // on the world map: deleting a flag shows the town as not on it any more; Undo brings it back
  await page.click('.wp-maps li:has-text("World map") .wp-map-pick');
  const townAt = await state(page, () => WalkingPaths.S.maps.world.places.find((p) => p.to === 'town').at);
  await clickMap(page, townAt[0], townAt[1]);
  check(await state(page, () => WalkingPaths.S.sel && WalkingPaths.S.sel.kind === 'place'), 'tapping a gold flag picks it');
  await page.uncheck('#wp-l-exits');
  check(await state(page, () => !WalkingPaths.S.sel), 'hiding “Ways out, places…” lets go of the picked flag');
  await page.check('#wp-l-exits');
  await clickMap(page, townAt[0], townAt[1]);
  await page.keyboard.press('Delete');
  check(await page.isVisible('#wp-mapset button[data-put="town"]'), 'deleting the town’s flag lists the town as not on the world map, with Put it on');
  await page.keyboard.press('Control+z');
  check(await page.isHidden('#wp-mapset button[data-put="town"]') && (await state(page, () => WalkingPaths.S.maps.world.places.length)) === 3, 'and Undo puts the flag back');

  // a second flag leading into the town gets a way back of its own
  await page.click('[data-tool="place"]');
  await clickMap(page, 900, 900);
  await page.selectOption('#wp-place-to', 'town');
  const doors = await state(page, () => {
    const t = WalkingPaths.S.maps.town, w = WalkingPaths.S.maps.world;
    const backs = t.exits.filter((e) => e.to === 'world');
    const apart = backs.length === 2 && !(backs[0].rect[0] < backs[1].rect[2] && backs[1].rect[0] < backs[0].rect[2] && backs[0].rect[1] < backs[1].rect[3] && backs[1].rect[1] < backs[0].rect[3]);
    const own = w.places.filter((p) => p.to === 'town').every((p) => backs.some((e) => e.at === p.id));
    return { apart, own, n: backs.length };
  });
  check(doors.apart && doors.own, 'a second flag into the town gets its own way back, apart from the first (' + doors.n + ' ways back)');
  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+z');
  check(await state(page, () => WalkingPaths.S.maps.world.places.length === 3 && WalkingPaths.S.maps.town.exits.length === 1), 'and two undos take the flag and its way back away');

  // a picture added later is put on the world map away from the flags there
  await page.setInputFiles('#wp-file-pictures', png('cave.png', pics.town));
  await page.waitForSelector('#wp-dialog:not([hidden])', { timeout: 20000 });
  check(await page.isChecked('#wp-add-join'), 'adding one more picture offers to put it on the world map');
  await page.click('#wp-dialog-buttons button');
  await page.waitForFunction(() => WalkingPaths.S.maps.world.places.some((p) => p.to === 'cave'), null, { timeout: 10000 }).catch(() => {});
  const gap = await state(page, () => {
    const pl = WalkingPaths.S.maps.world.places, cave = pl.find((p) => p.to === 'cave');
    return cave ? Math.min(...pl.filter((p) => p !== cave).map((p) => Math.hypot(p.at[0] - cave.at[0], p.at[1] - cave.at[1]))) : 0;
  });
  check(gap > 400, 'its flag goes on a free spot, away from the others (' + Math.round(gap) + ' px from the nearest)');

  // Undo pressed while a big picture is still being made smaller: nothing breaks
  await page.setInputFiles('#wp-file-pictures', png('meadow.png', pics.world));
  await page.waitForSelector('#wp-dialog:not([hidden])', { timeout: 20000 });
  await page.evaluate(() => {
    document.querySelector('#wp-dialog-buttons button').click();
    const t = setInterval(() => {
      if (/smaller…/.test(document.getElementById('wp-status').textContent)) { clearInterval(t); document.getElementById('wp-undo').click(); document.getElementById('wp-undo').click(); }
    }, 5);
  });
  await page.waitForFunction(() => !/smaller…/.test(document.getElementById('wp-status').textContent), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(300);
  check(!errors.length && !/smaller…/.test(await page.textContent('#wp-status')) && (await state(page, () => !WalkingPaths.S.maps.meadow)), 'Undo while a big picture is being made smaller takes the picture away, and nothing breaks');

  // Picture size for every map, cancelled while it works: nothing changes
  await page.click('.wp-maps li:has-text("Forest") .wp-map-pick');
  const before = await state(page, () => WalkingPaths.S.order.map((k) => WalkingPaths.S.maps[k].pic && WalkingPaths.S.maps[k].pic.key).join());
  await page.click('#wp-picture-size');
  await page.waitForFunction(() => document.querySelectorAll('#wp-shrink-options button.wp-size').length === 6, null, { timeout: 30000 }).catch(() => {});
  await page.click('#wp-shrink-options button[data-size="50"]');
  await page.check('#wp-shrink-all');
  await page.evaluate(() => {
    document.getElementById('wp-shrink-use').click();
    setTimeout(() => { document.getElementById('wp-shrink-cancel').click(); setTimeout(() => document.getElementById('wp-picture-size').click(), 10); }, 10);
  });
  await page.waitForTimeout(4000);
  const after = await state(page, () => WalkingPaths.S.order.map((k) => WalkingPaths.S.maps[k].pic && WalkingPaths.S.maps[k].pic.key).join());
  check(after === before && (await page.isVisible('#wp-shrink')), 'Cancel while it works changes nothing, and Picture size opened again stays open');
  await page.click('#wp-shrink-close');
  check(!errors.length, 'no errors with the world map' + (errors.length ? ': ' + errors.join(' | ') : ''));
}
await ctx.close();

// =================================================================================================
console.log('On a phone (390 x 844, touch)');
({ ctx, page, errors } = await open(FILE_URL, { width: 390, height: 844 }, true));
await ready(page);
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, '10-phone-start.png') });
await page.screenshot({ path: path.join(OUT, '11-phone-panel.png'), fullPage: true });
const wide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
check(wide, 'nothing is wider than the phone');
// a tap with + Walk area, a tap of the gold first point to close
await page.tap('[data-tool="walk"]');
for (const [x, y] of [[60, 60], [300, 60], [300, 200]]) { const [sx, sy] = await onScreen(page, x, y); await page.touchscreen.tap(sx, sy); await page.waitForTimeout(80); }
{ const [sx, sy] = await onScreen(page, 60, 60); await page.touchscreen.tap(sx, sy); }
await page.waitForTimeout(200);
check((await counts(page)).walk === 10, 'tapping three points and then the first one makes a walk area');
// two fingers spread apart zoom in, even with + Walk area on (the second finger calls off the trace
// the first one started)
await page.tap('[data-tool="walk"]');
const pinched = await state(page, () => {
  const cv = document.getElementById('wp-cv'), r = cv.getBoundingClientRect(), z0 = WalkingPaths.ed.view.z;
  const ev = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 11, clientX: r.left + x, clientY: r.top + y, bubbles: true, button: 0, buttons: 1 }));
  ev('pointerdown', 11, 150, 150); ev('pointerdown', 12, 200, 150);
  for (let k = 1; k <= 10; k++) { ev('pointermove', 11, 150 - k * 6, 150); ev('pointermove', 12, 200 + k * 6, 150); }
  ev('pointerup', 11, 90, 150); ev('pointerup', 12, 260, 150);
  return { z0, z1: WalkingPaths.ed.view.z, walk: WalkingPaths.S.maps.wickhollow.walk.length, draft: WalkingPaths.S.draft };
});
check(pinched.z1 > pinched.z0 * 1.5 && pinched.walk === 10 && !pinched.draft, 'two fingers spread apart zoom in, and draw nothing (' + pinched.z0.toFixed(2) + ' → ' + pinched.z1.toFixed(2) + ')');
await page.tap('#wp-walk');
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '12-phone-walking.png') });
const pad = await page.$('.wpe-pad .w');
const q0 = await state(page, () => WalkingPaths.field().me.x);
const box = await pad.boundingBox();
await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
await page.dispatchEvent('.wpe-pad', 'pointerdown', { pointerId: 7, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, isPrimary: true });
await page.waitForTimeout(600);
await page.dispatchEvent('.wpe-pad', 'pointerup', { pointerId: 7 });
const q1 = await state(page, () => WalkingPaths.field().me.x);
check(q1 < q0 - 10, 'holding the d-pad’s left arrow walks her left');
await page.tap('.wpe-menu');
await page.waitForTimeout(300);
check(await state(page, () => !WalkingPaths.S.walking), '“Back to editing” ends the walk');
// picture size fits a phone too
await page.tap('#wp-picture-size');
await page.waitForFunction(() => document.querySelectorAll('#wp-shrink-options button.wp-size').length === 6, null, { timeout: 30000 }).catch(() => {});
await page.screenshot({ path: path.join(OUT, '13-phone-picture-size.png') });
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.querySelector('.wp-shrink-card').getBoundingClientRect().right <= window.innerWidth), 'Picture size fits on the phone');
await page.tap('#wp-shrink-cancel');
check(!errors.length, 'no errors on the phone' + (errors.length ? ': ' + errors.join(' | ') : ''));
await ctx.close();

// =================================================================================================
console.log('The artifact page, in a locked-down frame (roughly the artifact viewer)');
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; frame-src 'self'; worker-src 'self' blob:";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%;display:block}</style>' +
      '<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock" src="/test.html"></iframe>');
  }
  const f = path.join(BUILT, decodeURIComponent(u.pathname));
  if (!f.startsWith(BUILT) || !fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': CSP, 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
({ ctx, page, errors } = await open(`http://localhost:${server.address().port}/`, { width: 1200, height: 780 }, false));
let frame = null;
for (let i = 0; i < 100 && !frame; i++) { frame = page.frames().find((f) => /\/test\.html$/.test(f.url())); if (!frame) await page.waitForTimeout(100); }
await frame.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 20000 });
await page.waitForTimeout(800);
check(await frame.evaluate(() => WalkingPaths.S.order.length === 2), 'it starts with the examples there too');
await frame.click('#wp-walk');
await page.waitForTimeout(1200);
check(await frame.evaluate(() => !!WalkingPaths.field() && WalkingPaths.field().mapId === 'wickhollow'), 'walking works there');
await page.screenshot({ path: path.join(OUT, '20-artifact.png') });
check(!errors.length, 'no errors or blocked loads in the frame' + (errors.length ? ': ' + errors.join(' | ') : ''));
await ctx.close();
server.close();

await browser.close();
console.log(problems.length ? '\n' + problems.length + ' problem(s):\n  ' + problems.join('\n  ') : '\nall good');
process.exit(problems.length ? 1 : 0);
