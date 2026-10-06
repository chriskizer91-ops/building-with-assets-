// Lists every .html file on every fetched branch of Chris's game repositories, for Step 1 of SYSTEMS_INVENTORY.md.
// Read-only: it asks git for each branch's file list (`git ls-tree`), so nothing is checked out.
//
//   node game-systems/tools/list-html.mjs [--repos ..] > game-systems/all-html-files.md
//
// One row per distinct file (same path and same content counts once), with its size, the newest branch that has
// it, and how many branches carry it. Run `git fetch origin '+refs/heads/*:refs/remotes/origin/*'` in each repo
// first so every branch is known.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const REPOS = path.resolve(opt('repos', path.join(HERE, '..', '..', '..')));
const LIST = ['what_the_map_forgot', 'follow-me-down-witch-way', '20-min', 'airship-game-in-aethermoor-', 'New-game',
  'envoi-on-the-longest-night', 'cursed-worlds', 'different-ideas-', 'farm-project', 'building-with-assets-', 'sand'];

const git = (repo, args) => {
  const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  return r.status === 0 ? r.stdout : '';
};

console.log('# Every HTML file in the game repositories\n');
console.log('Made by `game-systems/tools/list-html.mjs` from every fetched branch (October 6, 2026). Sizes are the real');
console.log('files, base64 included. "Newest branch" is the most recently committed branch that has this exact file.\n');
for (const name of LIST) {
  const repo = path.join(REPOS, name);
  const branches = git(repo, ['for-each-ref', '--sort=-committerdate', '--format=%(refname:short) %(committerdate:short)', 'refs/remotes/origin'])
    .trim().split('\n').filter((l) => l && !/HEAD/.test(l) && !/zealous-cerf/.test(l)).map((l) => l.split(' '));
  console.log(`## ${name}\n`);
  if (!branches.length) { console.log('No branches with files (the repository is empty).\n'); continue; }
  const files = new Map();
  for (const [ref, date] of branches) {
    for (const line of git(repo, ['ls-tree', '-r', '-l', ref]).split('\n')) {
      const tab = line.indexOf('\t');
      if (tab < 0) continue;
      const file = line.slice(tab + 1);
      if (!/\.html?$/i.test(file) || /node_modules\//.test(file)) continue;
      const [, , blob, size] = line.slice(0, tab).split(/\s+/);
      const key = file + ' ' + blob;
      if (!files.has(key)) files.set(key, { file, size: +size, ref: ref.replace('origin/', ''), date, n: 0 });
      files.get(key).n++;
    }
  }
  console.log('| File | Size (bytes) | Newest branch | Branches with it |');
  console.log('|---|--:|---|--:|');
  for (const f of [...files.values()].sort((a, b) => a.file.localeCompare(b.file) || b.date.localeCompare(a.date))) {
    console.log(`| \`${f.file}\` | ${f.size.toLocaleString('en-US')} | ${f.ref} (${f.date}) | ${f.n} |`);
  }
  console.log('');
}
