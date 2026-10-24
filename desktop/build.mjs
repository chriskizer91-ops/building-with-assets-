#!/usr/bin/env node
// Builds Mooncart for a computer: build/desktop/Mooncart-Windows.zip (unzip it, open Mooncart.exe).
// The built-in games come from build/collection (node tools/collect-games.mjs first).
//
//   cd desktop && npm install && cd ..
//   node desktop/build.mjs              # Windows, 64-bit
//   node desktop/build.mjs --linux      # for trying it on a Linux machine

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const require = createRequire(path.join(HERE, 'package.json'));
const { packager } = require('@electron/packager');
const ResEdit = require('resedit');

const linux = process.argv.includes('--linux');
const platform = linux ? 'linux' : 'win32';
const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const electronVersion = JSON.parse(fs.readFileSync(path.join(HERE, 'package.json'), 'utf8')).devDependencies.electron;
const OUT = path.join(ROOT, 'build', 'desktop');
const STAGE = path.join(OUT, 'app');
const COLLECTION = path.join(ROOT, 'build', 'collection');

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(path.join(STAGE, 'tools'), { recursive: true });
for (const f of ['main.mjs', 'preload.cjs']) fs.copyFileSync(path.join(HERE, f), path.join(STAGE, f));
fs.copyFileSync(path.join(ROOT, 'docs', 'icon.png'), path.join(STAGE, 'icon.png'));
for (const f of ['dev-server.mjs', 'zip.mjs']) fs.copyFileSync(path.join(ROOT, 'tools', f), path.join(STAGE, 'tools', f));
fs.cpSync(path.join(ROOT, 'web'), path.join(STAGE, 'web'), { recursive: true });
fs.writeFileSync(path.join(STAGE, 'package.json'), JSON.stringify({ name: 'mooncart', productName: 'Mooncart', version, main: 'main.mjs', type: 'module', description: 'Mooncart: a game console for your HTML games', author: 'Chris Kizer' }, null, 1));
if (!fs.existsSync(path.join(COLLECTION, 'collection.json'))) console.log('No built-in games (run node tools/collect-games.mjs first); building with an empty library.');

const [dir] = await packager({
  dir: STAGE, out: path.join(OUT, 'out'), overwrite: true, platform, arch: 'x64', electronVersion,
  name: 'Mooncart', executableName: 'Mooncart', appVersion: version, asar: false, prune: false,
  extraResource: fs.existsSync(COLLECTION) ? [COLLECTION] : [],
  appCopyright: 'Chris Kizer',
});

if (!linux) {
  // Mooncart's icon and name on Mooncart.exe (done here so the build needs no Windows tools)
  const exePath = path.join(dir, 'Mooncart.exe');
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);
  // desktop/icon.ico: docs/icon.png at 16 to 256 pixels (Windows icons stop at 256)
  const icon = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(HERE, 'icon.ico')));
  const group = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries)[0];
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, group.id, group.lang, icon.icons.map((i) => i.data));
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
  const lang = vi.getAllLanguagesForStringValues()[0];
  vi.setStringValues(lang, { ProductName: 'Mooncart', FileDescription: 'Mooncart', CompanyName: 'Chris Kizer', OriginalFilename: 'Mooncart.exe', InternalName: 'Mooncart' });
  const [a, b, c] = version.split('.').map(Number);
  vi.setFileVersion(a, b, c, 0, lang.lang); vi.setProductVersion(a, b, c, 0, lang.lang);
  vi.outputToResourceEntries(res.entries);
  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
}

// a short note beside the app
fs.writeFileSync(path.join(dir, 'START HERE.txt'), [
  'Mooncart', '',
  linux ? 'Open the Mooncart file in this folder.' : 'Double-click Mooncart.exe (the moon icon) in this folder.',
  'Keep this whole folder together: the games are inside it (in "resources").', '',
  'The first time, Windows may say it protected your PC (the app isn\'t from the Microsoft Store).',
  'Click "More info", then "Run anyway". It only asks once.', '',
  'Keys: arrow keys move, Enter is A, Escape is B, M is START, H is SELECT.',
  'F11 (or Alt+Enter): full screen. HOME on the console: the game menu. MENU: the library.',
  'Your saves are kept in your Windows user folder (AppData\\Roaming\\Mooncart), so a newer Mooncart keeps them.',
  'Mooncart never uses the internet.', '',
].join('\r\n'));

const zip = path.join(OUT, `Mooncart-${linux ? 'Linux' : 'Windows'}.zip`);
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-q', '-r', '-y', zip, path.basename(dir)], { cwd: path.dirname(dir), stdio: 'inherit' });
console.log(`${dir}\n${zip}  ${(fs.statSync(zip).size / 1048576).toFixed(0)} MB`);
