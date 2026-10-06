# Game systems inventory

An inventory of the game systems in Chris's single-file HTML games, made October 6, 2026. It's for deciding later which
systems to pull into one shared engine. Nothing in any game was changed, and nothing has been extracted.

- **What's here:** Steps 1–4, plus an index of every system found.
- **The detail:** each game's full Step 2 inventory is in [`inventory/`](inventory/). That covers what every system does, its main functions with line numbers, size, what it depends on, its content and presentation, and the clues that it was copied. Put in this one file, those sections would make it about 750 KB, too large for GitHub to show.

## The short version

1. **Most of the newest games live on unmerged side branches.**
   - Ten of the 15 newest versions are on branches no one merged.
   - Aethermoor M7, Thareia, Sunstone Skies, The Ranch, One Moon and The Short Road exist nowhere else.
   - Witch Way's milestone 4, Moonlight's whole-game file, Envoi's final polish and Skies polished are all ahead of their main branches.
   - Mooncart builds the main branches, so it ships older versions or demo pages of these. Any extraction has to start from the side branches.
2. **Three systems are already shared by copy, and the copies have drifted.**
   - **Aethermoor's battle rules** run in Aethermoor, in Moonlight (a vendored copy with 11 changed files) and in Thareia (a whole-tree fork: 203 of Aethermoor's 244 files unchanged).
   - **The Thareia sound library** is in five places, and only Envoi's copy has volume controls.
   - **Moonlight's painted-scene engine** became the three Magpie pages. The newest Magpie page's features have no readable source anywhere.
   - **The airship game** exists three times. The ship builder is still identical; the fights, economy and saves have gone separate ways.
3. **Five systems are ready to come out first: clean, and wanted by many games.** Each is based on the strongest version:
   - random numbers and dice (Aethermoor);
   - the sound and music library (Thareia's, with Envoi's volume controls);
   - the save core (Aethermoor's, with Skies polished's cloud sync);
   - the painted-scene stage (Moonlight);
   - the ship builder (Skies polished).
   The battle rules come next: clean, and already in three games, but balance depends on every line.
4. **Saves are the biggest risk.**
   - Every game has its own keys and format.
   - Several throw away any save whose version they don't know.
   - Some keys already collide: the two airship copies share one save key, and Aethermoor and Thareia save codes load into each other.
   - A shared save layer must keep every game's keys and formats exactly.
5. **Several games don't work with Mooncart's buttons, and the 3D games use two three.js versions.**
   - On Mooncart, Witch Way's A button opens the menu.
   - One Moon and The Short Road mute on START.
   - Moonlight's battle menu can't be driven by the d-pad.
   - The Ranch and Tiny Dominion have no usable keys.
   - The 3D games are split between three.js r128 and r186. One shared input rule, and a choice of three.js version, come before any shared 3D code.

## How this was made

- **Repositories.** All eleven of Chris's repositories in the session were fetched with every branch; `sand` is empty. Only `building-with-assets-` was written to.
- **Reading the games.** `game-systems/tools/strip.mjs` reads each game straight out of git (`git cat-file` on its branch, so nothing was checked out). It replaces every base64 blob, and Witch Way's z85 blobs, with a marker such as `[[stripped 51234 chars]]`, and writes the copy to `game-systems/stripped/`. That folder is not committed; run the script to make it again.
  - Line breaks are never touched, so line N of a stripped copy is line N of the real file.
  - Four games have no built file on their branch (Witch Way M4, One Moon, The Short Road, The Ranch). They were built from their branch in a scratch folder.
- **Line numbers.** For a game that is one readable file (What the Map Forgot, Tiny Dominion, Art Farm, Stranded, the Magpie page, Starfall), they are lines of that file. For a game whose single file is minified or bundled, they are lines of its source files, which is what a later extraction would edit. Each detail file says which.
- **Who read what.** Thirteen readers, one per game or family of games, read the stripped copies under one set of rules:
  - read-only;
  - never load a blob or a giant line;
  - describe only code actually read, never guess from a name;
  - say what was read fully, skimmed or skipped.

  Every detail file has a Coverage section. The cross-game facts behind the recommendations were then checked again directly:
  - the Thareia/Aethermoor file counts;
  - the identical ship builder;
  - the shared airship save key;
  - the identical sound-library copies;
  - Witch Way's Enter key against Mooncart's A button;
  - Moonlight's 11 changed vendor files;
  - the byte-identical Magpie pages.
- **What's left out.** The big drawing-only files (character and foe art recipes, model geometry) and most dialogue and map data were measured and sampled, not read line by line. Each game's Coverage section lists them.

## Step 1: The games

### What counts, and which version

Every repository was fetched with all its branches. In most of them the newest work is not on the main branch but on
side branches that were never merged, and several games exist only there. Following your rule (newest version, and
your answer on October 6: "newest anywhere"), each game below is the newest build on any branch. Earlier builds are
listed after it. Every HTML file in every branch, 319 distinct files, is listed with its size in
[`all-html-files.md`](all-html-files.md).

"Full size" is the real file, pictures and sounds included. "Stripped" is the copy with base64 blobs (and Witch Way's
z85 blobs) replaced by short markers. It has the same line count, so a line number in the stripped copy is the same
line in the real file. "Lines" counts the single file. Where that file is minified or bundled, the code was read in the
game's source folder instead, and the last column gives that folder's size.

### The 15 games inventoried

| # | Game | Repo @ branch (commit, date) | File inventoried | Full size (bytes) | Stripped | Lines | Source read |
|--:|---|---|---|--:|--:|--:|---|
| 1 | **What the Map Forgot**: a story RPG in ten chapters, with pixel characters over painted maps, timing-ring battles and a Mode-7 airship | what_the_map_forgot @ `claude/trusting-gauss-gbuygw` (main; 9369b13, Sep 30) | `what-the-map-forgot.html` | 6,422,161 | 525 KB | 9,338 | the single file (53 source modules, same code) |
| 2 | **Follow Me Down Witch Way** (milestone 4): a cozy moonlit witch game about gathering by moon phase, brewing and helping the living and the dead | follow-me-down-witch-way @ `claude/bold-turing-t225o0` (b95448c, Sep 30) | `Follow_Me_Down_Witch_Way.html`, built from the branch in a scratch folder (the branch has no built file) | 29,083,308 | 1,967 KB | 12,424 | `game/src`, `game/data`: 66 files, 36,253 lines |
| 3 | **One Moon**: Witch Way's art as a 15-minute game of five nights | follow-me-down-witch-way @ `ccr-4b49ab19-vv72q2` (b9d1a99, Sep 30) | `One_Moon.html`, built in scratch | 12,495,376 | 250 KB | 4,803 | `one-moon/src`: 19 files, 4,522 lines |
| 4 | **The Short Road**: Witch Way condensed, with both chapters and every path open | same branch | `The_Short_Road.html`, built in scratch | 29,557,472 | 382 KB | 6,083 | `condensed/`: 24 files, 11,327 lines |
| 5 | **Moonlight in the Aether** (the whole night as one game): FF9-style painted fields with 3D characters, brewing, a swap shop, skiff flight and turn-based battles | 20-min @ `ccr-5afa0fa7-7ojc16` (1fe3222, Oct 1) | `dist/game.html` | 14,778,472 | 1,938 KB | 5,561 | `src/`, `game.html`: 100 files, 30,384 lines |
| 6 | **Sunstone Skies**: the airship game, copied into 20-min and grown on its own (fleets, three charts) | 20-min @ `ccr-c41cdbf6-3p3qws` (843723a, Oct 6) | `sunstone-skies/dist/game.html` | 7,681,797 | 777 KB | 4,804 | `sunstone-skies/src`: 43 files, 6,569 lines |
| 7 | **Skies of Aethermoor, polished**: the airship game (ship-to-ship fights over Aethermoor, a port, raiders) | airship-game-in-aethermoor- @ `claude/laughing-curie-qbp98i` (117a515, Oct 6) | `polished/dist/game.html` | 4,816,651 | 728 KB | 4,711 | `polished/src`: 30 files, 4,989 lines |
| 8 | **Aethermoor: Hearth & Heirloom** (milestone 7): a JRPG with seeded dice, deterministic rules and pixel art forged in code | New-game @ `claude/cool-ptolemy-uc93gg` (49195c1, Sep 30) | `game/dist/aethermoor.html` | 31,841,097 | 2,699 KB | 24 (minified) | `game/src`: 244 files, 52,972 lines |
| 9 | **Thareia** (T2, stage 2, unfinished): a new game on the Thareia canon, forked from Aethermoor's code | New-game @ `claude/tender-babbage-4wiplk` (146a9ac, Oct 1) | `thareia/game/dist/thareia.html` | 16,476,655 | 3,698 KB | 366 (bundled) | `thareia/game/src`, `thareia/sfx`: 300 files, 58,498 lines |
| 10 | **Envoi on the Longest Night** (final polish, October 5): a JRPG with painted walking maps, 3D battles in arenas, keepsakes and herbs | envoi-on-the-longest-night @ `claude/send-note-gigdew` (318bc96, Oct 5) | `final-pass-polish-october-5-2026/Envoi on the Longest Night - final polish.html` | 18,095,301 | 2,760 KB | 2,212 (minified) | `src/`, `putting-it-all-together/`, `envoi-final-draft/items`: 92 files, 38,475 lines |
| 11 | **Stranded (The Clearing)**: Dagr's year-long survival game, with seasons, partners, hunting and fishing, and robot players | cursed-worlds @ `claude/jolly-mendel-bqoxiy` (main; 259f0bc, Oct 5) | `the-clearing-stranded/index.html` (it loads `living/*.js` beside it) | 696,403 | 680 KB | 8,469 | `living/`: 28 files, 6,286 lines |
| 12 | **The Ranch** (working name): a Zebu herd on a painted ranch, with a rancher you give jobs to | cursed-worlds @ `claude/practical-bohr-smpp6z` (2fb8b11, Oct 5) | `The_Ranch.html`, built in scratch (not kept in git) | 2,699,077 | 1,035 KB | 4,089 | `the-ranch/`: 14 files, 3,466 lines |
| 13 | **Tiny Dominion**: a god game where four peoples grow from the Stone Age to the Space Age | different-ideas- @ `ccr-2caac74a-av649o` (main; ca7f11a, Oct 5) | `Tiny_Dominion.html` | 528,254 | 516 KB | 9,173 | the single file (built from `src/js`, 24 files) |
| 14 | **Art Farm**: a scavenger hunt on a paper pop-up farm | farm-project @ `claude/determined-cerf-bua9qu` (main; 13b38dc, Oct 5) | `art-farm/dist/art-farm.html` | 11,571,740 | 765 KB | 2,152 | the single file (built from `art-farm/src`, 10 files) |
| 15 | **The Magpie over Aethermoor**: your reference page, the Magpie in 3D flying over the painted map; it's the ancestor of the airship games | airship-game-in-aethermoor- @ `claude/ship-game-magpie-l8cbdn` (main; 1887984) | `reference/the-magpie-over-aethermoor.html` | 2,564,204 | 807 KB | 4,482 | the single file |
| + | **Starfall**: Mooncart's tiny sample game, read whole as a reference for the Mooncart contract | building-with-assets- (7422f97) | `samples/starfall.html` | 8,679 | 8 KB | 210 | — |

Second builds of an inventoried game that were also looked at: *What the Map Forgot in 3D* (`wren-3d/dist/game-3d.html`,
8,143,598 bytes, branch `ccr-9c545e56-4m3vqr`: the whole 2D game with a 3D layer added), the airship game's main-folder
copy (`dist/game.html`, 4,795,251 bytes, the copy *polished* started from), the Sunstone shipyard page
(`sunstone-skies/dist/shipyard.html`, 1,012,852 bytes), the Stranded living-camp page
(`living/Stranded_Living_Camp.html`, 1,511,062 bytes) and envoi's copy of the Magpie page
(`reference/demos/the-magpie.html`, 2,921,504 bytes).

### Older versions (measured, not inventoried)

| Game | Older file | Full size | Stripped | Lines |
|---|---|--:|--:|--:|
| Witch Way | `materials/Follow_Me_Down_Witch_Way.html` (the first upload) | 18,601,976 | 450 KB | 8,332 |
| Witch Way | `materials/Witch-Way-Bundle/Game/Witch_Way_-_Path_Polish_-_2026-09-27.html` | 34,904,573 | 131 KB | 504 |
| Witch Way | the main branch's `game/` (`claude/bold-brahmagupta-amnclm`, before milestone 4); no built file | — | — | — |
| Moonlight | the eleven demo pages in `dist/` (title, wickhollow, …); for example `dist/hollow-battle.html` | 5,185,123 | 1,455 KB | 4,554 |
| Envoi | `envoi-final-draft/Envoi-on-the-Longest-Night.html` (October 4) | 17,097,153 | 1,765 KB | 1,347 |
| Envoi | `final-pass-polish-october-5-2026/from-chris/Envoi_on_the_Longest_Night-1.html` (the file Chris sent) | 18,088,918 | 2,754 KB | 2,175 |
| Envoi | `living-battlefields/Colossus_Fight.html` (Colossus in the Meadow) | 614,293 | 600 KB | 7,631 |
| Envoi | `reference/demos/halcyon-in-the-night-square.html` (one of Chris's demos the game started from) | 1,175,455 | 334 KB | 4,429 |
| Envoi | `reference/demos/night-square-shadow-wraith.html` | 1,087,658 | 248 KB | 3,393 |
| Envoi | `reference/demos/bramble-colossus-battle.html` | 1,429,523 | 1,396 KB | 11,101 |
| Envoi | main branch (`claude/admiring-hawking-p7m87n`): eight small model bench pages in `demos/`, plus Chris's reference demos; not the game | — | — | — |
| Aethermoor | `game/dist/aethermoor-m6.html` (and m2–m5) | 31,297,950 | 2,168 KB | 24 |
| Thareia | `thareia/game/dist/thareia-t1.html` | 12,151,011 | 2,850 KB | 24 |
| Stranded | `versions/the-clearing-2026-09-24.html` | 475,880 | 465 KB | 6,064 |
| The Ranch | `the-ranch/versions/the-ranch-2026-10-04.html` | 2,454,194 | 796 KB | 1,219 |
| Tiny Dominion | `original/Tiny_Dominion_original.html` | 136,713 | 134 KB | 2,825 |
| Art Farm | `art-farm/versions/v1-cel-shaded.html` | 3,059,931 | 766 KB | 2,287 |
| Airship game | main-folder `dist/game.html` (the copy polished started from) | 4,795,251 | 707 KB | 4,679 |

### Not games (listed only)

| Page | Where | Full size | Why not a game |
|---|---|--:|---|
| Aethermoor interactive map | New-game main, `aethermoor-interactive-image-map-polished.html` | 4,831,194 | a D&D map viewer (search, filters) |
| Aethermoor character sheet 4 | New-game main, `aethermoor-character-sheet-4.html` | 102,563 | a D&D character ledger |
| Thareia sound board | New-game `tender-babbage`, `thareia/sfx/dist/sound-board.html` | 64,913 | a page that plays the shared sound library (the library itself is inventoried with Thareia) |
| Envoi Sound Check | envoi `send-note-gigdew`, `final-pass-polish-october-5-2026/Envoi Sound Check.html` | 2,234,790 | every Envoi sound, played as the game plays it |
| Envoi players' guides | envoi `hopeful-lovelace` / `bold-carson` | 8,009,064 / 9,152,176 | documents |
| 3D model benches and studies | envoi `3d-model-*`, `demos/*.html`, `3d-cutscenes/`; 20-min `witch-hd/` | 0.1–0.7 MB each | model viewers and test benches, not games |
| Mooncart console, Walking Paths editor | building-with-assets- `web/`, `editing-tools/walking-paths/` (branch `gifted-wozniak`) | — | the console and an editor, not games |
| Rain Check | different-ideas- `friendly-curie`, `rain-check/rain-check.html` | — | a plant-watering app |
| `sand` | — | — | the repository is empty |

### Making the stripped copies again

```
node game-systems/tools/strip.mjs --cache <a scratch folder>   # reads games.json, writes game-systems/stripped/
node game-systems/tools/list-html.mjs > game-systems/all-html-files.md
```

Both scripts read the sibling clones next to this repository (`--repos` changes where), and need each repository's
branches fetched first (`git fetch origin '+refs/heads/*:refs/remotes/origin/*'`). The list of games, their branches and
their source folders is [`games.json`](games.json).

## Step 2: What each game is made of

Each game's full inventory is in its own file in [`inventory/`](inventory/). Every file has the same parts:
- what the game is and what was inventoried;
- **Coverage** (what was read fully, skimmed or skipped);
- a **Code map** sorting every line range into systems, content or presentation, with totals;
- **Systems**, each with what it does, main functions or objects with line numbers, size, what it depends on, how tangled it is with the game's content, and a "fingerprint" of the facts needed to compare versions;
- **Content** and **Presentation** tables;
- **Shared-code clues** (evidence of copying, quoted with line numbers);
- **Notes** (dead code, duplicates, risky globals, save details).

| File | Game(s) | Systems |
|---|---|--:|
| [what-the-map-forgot.md](inventory/what-the-map-forgot.md) | What the Map Forgot (and a short look at its 3D copy) | 37 |
| [witch-way.md](inventory/witch-way.md) | Follow Me Down Witch Way, milestone 4 | 28 |
| [witch-spinoffs.md](inventory/witch-spinoffs.md) | One Moon; The Short Road | 18; 20 |
| [moonlight.md](inventory/moonlight.md) | Moonlight in the Aether | 27 |
| [airships.md](inventory/airships.md) | Skies of Aethermoor polished, its main copy and Sunstone Skies, with a module-by-module drift table | 28 |
| [aethermoor.md](inventory/aethermoor.md) | Aethermoor: Hearth & Heirloom, M7 | 36 |
| [thareia.md](inventory/thareia.md) | Thareia T2, with a file-by-file comparison against Aethermoor | 31 |
| [envoi.md](inventory/envoi.md) | Envoi on the Longest Night, final polish | 22 |
| [stranded.md](inventory/stranded.md) | Stranded | 39 |
| [the-ranch.md](inventory/the-ranch.md) | The Ranch | 22 |
| [tiny-dominion.md](inventory/tiny-dominion.md) | Tiny Dominion | 39 |
| [art-farm-starfall.md](inventory/art-farm-starfall.md) | Art Farm; Starfall | 23; 8 |
| [magpie.md](inventory/magpie.md) | The Magpie over Aethermoor, its copies and descendants | 24 |

### Index of every system

How tangled each system is with its game's content, in the readers' words:
- **clean:** no content inside, or content passed in as data;
- **some untangling:** a few content names or texts are built in;
- **deeply tied:** the system is mostly this game's content.

"—" means no rating was given. That's usually for tools, tests and small utilities; see the detail file. Sizes are as each reader measured them: lines, or characters for the minified Magpie page.

#### Aethermoor: Hearth & Heirloom (Milestone 7)

Full detail: [inventory/aethermoor.md](inventory/aethermoor.md)

| System | Size | Tangled with content |
|---|---|---|
| Seeded RNG — random numbers | 28 lines | clean |
| Dice notation — random numbers | ~70 lines | clean |
| Keyboard input — input | ~100 lines | clean |
| Touch controls (world) — input | ~260 lines | clean |
| Save, load and export codes — save | 173 lines | clean |
| Save migration and validation — save | 141 lines | some untangling |
| WebAudio synth and step sequencer — audio | 511 lines (~145 of them track data) | some untangling |
| Hero stats and item profiles — stats | 278 lines | some untangling |
| XP and leveling — stats/leveling | 75 lines | clean |
| Battle engine and Initiative Ribbon — battles | 623 lines | some untangling |
| Attacks, damage and saves (the effect interpreter) — battles | ~350 of 548 lines | clean |
| Status effects — battles | ~280 lines | some untangling |
| Foe intent dice and move tables — enemy AI | 181 lines | clean |
| Grip & Claim — battles/loot | ~80 lines | clean |
| Legend Surge — battles | ~40 lines | clean |
| Foe building, the Waking and Omens — enemy scaling | 213 lines | some untangling |
| Loot generation — gear/loot | 234 lines | clean |
| Equipment, compare and shops — inventory/shop | 166 lines | clean |
| Forge crafting — economy | 345 lines | some untangling |
| Codex, deeds and relic stages — collection | ~195 lines | clean |
| Game flow: battles in and out, wipes, Grudges, Brands — progression | 563 lines | deeply tied |
| Overworld engine: maps, collision, roamers — maps/collision/AI | 763 + 52 lines | some untangling |
| Condition evaluator — quests/story flags | 189 lines | clean |
| Story runner: dialogue, checks, quests — dialogue/quests | 331 lines | clean |
| Scripted battle policy (Auto) — AI/balance | 126 lines | some untangling |
| Pixel Forge (vector-to-pixel renderer) — rendering | 315 lines | clean |
| Item art: recipes and procedural looks — rendering/procgen | ~2.8k lines | some untangling |
| Character rigs: heroes, walkers, NPCs, foes — rendering/animation | ~8.6k lines | deeply tied |
| Backdrops, tile atlases, icons — rendering/effects | ~6.6k lines | deeply tied |
| App shell, router and UI framework — menus/UI | ~450 lines | clean |
| Battle screen and event player — battles (presentation) | ~3.7k lines | some untangling |
| World screen, view, camera and loop — rendering/camera/game loop | ~4.7k lines | some untangling |
| Dialogue box, item card, settings UI — UI | ~1.3k lines | clean |
| Balance simulator — test tools | 873 lines | deeply tied |
| Tests and dev tools — tests/debug | — | — |
| Misc utilities | — | — |

#### Airship games: Skies of Aethermoor (polished), the main copy, and Sunstone Skies

Full detail: [inventory/airships.md](inventory/airships.md)

| System | Size | Tangled with content |
|---|---|---|
| Game loop and voyage state machine — game loop | about 200 lines of `main.js` | deeply tied |
| Input — input | 137 lines | clean |
| Chase camera, aiming and lock-on — camera | about 45 lines | clean |
| Flight model — physics | 119 lines | clean |
| Gunnery and volleys — battle | about 175 lines | some untangling |
| Bolts (projectiles) — battle / rendering | about 60 lines | clean |
| Hit zones and shot collision — collision | 82 lines | some untangling |
| Raider AI and spawning — enemy AI | about 230 lines | some untangling |
| Waves and difficulty — progression / balance | about 70 lines | deeply tied |
| Economy: shards, pickups, prices, upgrades — shops / economy | about 140 lines | some untangling |
| Save and cross-device sync — save/load | about 150 lines | some untangling |
| Port and title screens, ship showroom — menus / UI | 243 lines | some untangling |
| Event bus — architecture | 89 lines | clean |
| Effects engine (sparks and glows, camera trauma and kick, haptics) — effects | 211 lines | clean |
| Smoke — effects | 84 lines | clean |
| World: sky, map, clouds, regions — rendering / environment | 209 lines | some untangling |
| Procedural ship builder — 3D models built in code | about 1,050 lines of code, plus 286 lines of recipes | some untangling |
| Ship materials from painted sheets — rendering / asset processing | 117 lines | clean |
| HUD — UI | about 160 lines | deeply tied |
| Hangar demo page — demo / presentation | 323 lines | some untangling |
| Audio (vendored, unused) — audio | 616 lines | clean |
| Tests, balance tools and the build — self-checks | — | — |
| RNG and misc utilities — misc | — | — |

#### Art Farm

Full detail: [inventory/art-farm-starfall.md](inventory/art-farm-starfall.md)

| System | Size | Tangled with content |
|---|---|---|
| 1. Boot and asset loading — asset loading | about 30 lines | clean |
| 2. Game loop, game clock and tweens — game loop / timing | about 45 lines | clean |
| 3. Input: thumb stick, drag-look, tap and keys — input | about 70 lines | some untangling |
| 4. Walking movement — walking | about 30 lines | clean |
| 5. Collision world — maps and collision | about 45 lines | some untangling |
| 6. Terrain height — procedural generation / maps | about 12 lines | some untangling |
| 7. Paper pop-up engine — rendering / animation (core) | about 190 lines (L543–700, L755–775) | clean |
| 8. Instanced billboard cards — rendering | about 50 lines | clean |
| 9. Building generator — 3D models built in code | about 230 lines | some untangling |
| 10. Nature and props generator — 3D models built in code / procedural generation | about 280 lines | deeply tied |
| 11. Sign and mural canvas atlas — rendering / text layout | about 100 lines (the mural is about 45 of them) | clean |
| 12. Ground: the flat map that becomes terrain — rendering / effects | about 95 lines | some untangling |
| 13. Water, sky dome and light — rendering / effects | about 50 lines | clean |
| 14. Critters: wandering cows and a turning walker — enemy/ambient AI / animation | about 85 lines | clean |
| 15. Camera rig — camera | about 45 lines | clean |
| 16. Pop-up and fold sequences — transitions | about 30 lines | clean |
| 17. Scavenger hunt — quests / progression | about 50 lines | clean |
| 18. Postcards and snapshots — UI / rendering | about 70 lines | some untangling |
| 19. HUD, sheets and toasts — menus / UI framework | about 30 lines, plus CSS and markup | some untangling |
| 20. Map pins overlay — minimap | about 35 lines | clean |
| 21. Save and load — save | about 8 lines | clean |
| 22. Test hooks, reachability check and the phone check — tests / debug tools | about 40 lines in the page, plus `tools/check.mjs` (115 lines) | clean |
| 23. Misc utilities and random numbers — utilities / RNG | about 20 lines | clean |

#### Starfall

Full detail: [inventory/art-farm-starfall.md](inventory/art-farm-starfall.md)

| System | Size | Tangled with content |
|---|---|---|
| 1. Game loop and state machine — game loop / timing | about 25 lines | clean |
| 2. Integer-scaled pixel canvas — rendering | about 20 lines | clean |
| 3. Input: keys, touch halves, click — input | about 25 lines | clean |
| 4. Falling objects: spawner, difficulty ramp, collision — gameplay / balance | about 30 lines | some untangling |
| 5. Synth beeps — synthesized audio | about 14 lines | clean |
| 6. Best-score save — save | about 5 lines | clean |
| 7. Code-drawn pixel sprites and starfield — rendering / presentation | about 30 lines | content (the art) |
| 8. HUD and overlay screens — menus / UI | about 20 lines | some untangling |

#### Envoi on the Longest Night

Full detail: [inventory/envoi.md](inventory/envoi.md)

| System | Size | Tangled with content |
|---|---|---|
| Battle engine (headless, seeded ATB) — battles | 643 lines | some untangling |
| Battle rules and progression tables — stats/leveling, balance data | 298 lines | deeply tied |
| Balance simulator and journey simulator — balance tools (in the page and in Node) | 581 lines (plus `balance-page.js`, 322, the demo page's UI) | deeply tied |
| Battle screen (playback, camera director, choreography) — battles, rendering, camera, UI | 2,563 lines | deeply tied |
| Game shell, story flags and progression — quests/story, menus, shops | 1,078 lines | deeply tied |
| Save and load — save | 120 lines (plus the saves UI, game.js L882–946) | some untangling |
| Field: walking, collision, pathing, camera, encounters — maps/collision, walking/pathfinding, input, camera, minimap | 577 lines | clean |
| Map data format and tracing — maps (content-shaped system) | 1,105 lines (traced data) | clean |
| Sprite walkers (painted sheet, paper dolls, pixel stand-ins) — rendering, animation | 318 lines loaded, plus 149 for sprites.js | clean |
| Flying map (the Magpie) — rendering (three.js), input, camera, minimap | 226 lines (plus `world.js` `bandAt` 24, and world-mask data) | clean |
| Dialogue box — dialogue | 92 lines | clean |
| Quest goal arrow — UI/progression | 35 lines | clean |
| Keepsakes (equipment) — gear/inventory | 196 lines, plus `items.js` 218 (data) | some untangling |
| Synthesized audio, three engines plus streamed songs — audio | 109 + 651 + 93 + 56 lines | clean |
| Spell effects and the living battlefield — effects | 334 + 373 + 229 lines | some untangling |
| Arena (3D ground in front, painting behind) — rendering, effects, weather, camera | 1,143 lines, plus 8 arena places × ≈22 lines | clean |
| 3D models built in code (Model Build Spec) — 3D models, animation | 11 loaded models, 14,478 lines: witch 1,472, sol 1,768, halcyon 1,6… | clean |
| Battle scenes (flat paintings) — rendering data | ~210 lines | content (data) |
| Fight configs — battles glue | 297 lines | deeply tied |
| Misc utilities | — | — |
| Tests and tools beside it (repo `tools/`, `final-pass-polish-october-5-2026/checks/`) — self-checks | — | — |

#### The Magpie over Aethermoor

Full detail: [inventory/magpie.md](inventory/magpie.md)

| System | Size | Tangled with content |
|---|---|---|
| Boot, game loop and timing — core | ~2.5 K chars | clean |
| Painted-map stage renderer (`lh`, the "Stage") — rendering | ~12 K chars | clean |
| Paint camera (`oh`) — rendering / camera math | ~1.1 K chars | clean |
| Cutout cards with actor-depth occlusion (`Q0`) — rendering | ~3.5 K chars | clean |
| World FX shader (cloud shadows, sea, lamps, sharpening) — effects | ~4 K chars | some untangling |
| Flight model, landing and docking — movement | ~3.5 K chars | some untangling |
| Follow camera and zoom — camera | ~1.2 K chars | clean |
| Input: keys, taps, pinch, wheel, minimap — input | ~2.5 K chars | clean |
| HUD: labels, place card, Nearby list, Land button — menus/UI | ~3 K chars | some untangling |
| Region lookup and banner — map logic | ~0.8 K chars | clean |
| Minimap — UI | ~1.4 K chars | clean |
| Intro and reduced motion — presentation flow | ~0.6 K chars | clean |
| Ambient world: drifting lights, clouds, glow, moonlight — effects | ~2.5 K chars | some untangling |
| The Magpie skiff model (`cp` + recipe `Us`) — 3D model built in code | ~11.5 K chars | clean |
| Toon material kit, ink outlines and model helpers — rendering kit | ~9 K chars | clean |
| Witch actor (`Sp`) — 3D model and animation | ~21 K chars | clean |
| Inkblot actor (`Ep`/`Tp`) — 3D model and animation (skimmed) | ~22 K chars | — |
| Nettie actor (`Fp`) — 3D model and animation (skimmed) | ~40 K chars | — |
| Aethermoor synth (`Ad`) — audio | ~23 K chars including songs | clean |
| Thareia sound studio (sfx) — audio | ~40 K chars (34 K of it catalogue) | clean |
| Thareia music player — audio | ~14 K chars | clean |
| Sound router (`Xd`, "createSound") — audio | ~0.6 K chars | clean |
| Asset loading — assets | ~0.8 K chars | — |
| Test hook — debug/tests | — | — |
| Misc utilities | — | — |

#### Moonlight in the Aether (the whole night)

Full detail: [inventory/moonlight.md](inventory/moonlight.md)

| System | Size | Tangled with content |
|---|---|---|
| Painter's camera — rendering / camera math | 74 | clean |
| Walkmesh, sliding collision, A* tap-to-walk — collision / pathfinding | 297 | clean |
| Cut-out layers (FF9 walk-behinds) — rendering | 102 | clean |
| Stage compositor and camera — rendering / camera / effects | 325 | clean |
| Screen builder, lights and walking — rendering / walking | 203 | clean |
| Field (people, talk, gather, bag, exits) — dialogue / interaction / inventory | ~676 | some untangling |
| Town (screens joined by doors, followers) — maps / transitions / party | 376 | clean |
| Area/host framework — quests / story flags | 142 + 21 | deeply tied |
| Game flow and screen manager — game loop / menus / transitions | 645 | deeply tied |
| Night record and save — save / load / stats | 233 | some untangling |
| Battle rules (vendored Aethermoor M7) — battles / AI / loot / RNG | rules 5,043 + core 775 + data | clean |
| Encounters, party builder, level curve — battles / stats / balance | 255 | some untangling |
| Battle director and battle screen — battles / UI / animation | 979 | some untangling |
| Skiff flight over the painted map — airship / camera | 555 | some untangling |
| Audio facade, synth, Thareia studio — audio | 596 + 616 vendored | clean |
| Brewing (Pick Your Poison) — crafting | 1,586 | clean |
| Quill's swap shop — shop / economy (no gold) | 1,471 | clean |
| Items catalogue — inventory | 33 | clean |
| Title screen and cut-scene player — cutscenes / menus | 1,306 | clean |
| Hag-Sight, fog and the low path — field mechanic / effects | ~330 | some untangling |
| Repainting the painting — effects | ~200 | some untangling |
| 3D actor toolkit and model interface — 3D models in code / animation | 15,928 (44 files; 20 bestiary models plus props) | clean |
| Input — input | 78 | clean |
| Build and asset pipeline — asset loading / tools | ~450 tool lines | clean |
| Balance simulator and tests — tests / tools | — | — |
| Debug and teaching views — debug tools | — | — |
| Misc utilities | — | — |

#### Stranded (The Clearing)

Full detail: [inventory/stranded.md](inventory/stranded.md)

| System | Size | Tangled with content |
|---|---|---|
| 1. Seeded RNG: random numbers | ~18 lines | clean |
| 2. Time, calendar and moon: time | ~30 lines | clean |
| 3. Weather and temperature: simulation and effects | ~65 lines | some untangling |
| 4. Body and survival simulation: stats | ~140 lines | some untangling |
| 5. Inventory, materials and food lots: inventory and economy | ~90 lines | some untangling |
| 6. World ecology: wildlife evolution and crop ripening (procedural simulation) | ~95 lines | clean |
| 7. Time-passing pipeline: game loop (simulation) | ~210 lines | some untangling |
| 8. Action registry and result records: core framework | ~120 lines of framework, plus ~490 lines of job definitions | clean |
| 9. Hazards, encounters and sightings: events | ~175 lines | deeply tied |
| 10. Hunting resolution: battle (dice or minigame) | ~140 lines | some untangling |
| 11. Fishing resolution: minigame bridge | ~60 lines | some untangling |
| 12. Crafting, recipes and projects: crafting | ~160 lines, plus 76 lines of recipe data (866–941) | clean |
| 13. Planner (next concrete step): goal and dependency solver | ~140 lines | some untangling |
| 14. Advice ("one voice"): guidance AI | ~185 lines | deeply tied |
| 15. Quests: quests and progression | ~130 lines of code, plus 177 lines of data | clean |
| 16. Skills, XP and collections: stats, leveling and progression | ~60 lines | clean |
| 17. Game setup: difficulty, start season, kits and party (settings and balance) | ~90 lines | clean |
| 18. Partner and crew AI: NPC AI | ~260 lines | some untangling |
| 19. Save and load: save | ~85 lines | some untangling |
| 20. Sky, light and season palette: day/night and effects | ~80 lines | some untangling |
| 21. Pixel painter, noise and vector helpers: rendering (from "The Hollow Stair") | ~250 lines | clean |
| 22. Side-view scene ("Look"): rendering | ~980 lines (mostly drawing recipes) | deeply tied |
| 23. Walk maps, collision and pathfinding: maps | ~280 lines | clean |
| 24. Walk controller: input, movement, camera and use-menus | ~230 lines | clean |
| 25. Walk renderer and effects: rendering and effects | ~450 lines | some untangling |
| 26. Ambient animals and partner placement in the walk: AI and animation | ~110 lines | clean |
| 27. Living bridge: 3D layer over the walk (rendering integration) | ~245 lines | some untangling |
| 28. Skill moments: minigames | ~230 lines | clean |
| 29. Screen and UI framework: menus, HUD and UI | ~900 lines | some untangling |
| 30. Party real-time clock: game loop | ~35 lines | clean |
| 31. Painting traces: maps and collision (painted walk-mask by polygons) | 137 lines of code, plus 576 lines of trace data | clean |
| 32. Living stage: three.js rendering, shaders, particles and lights | 447 lines | clean |
| 33. Procedural 3D models and animation: survivor, camp, beasts, things, life | ~1,325 lines | clean |
| 34. Hunting minigame (3D): minigame | 376 lines | clean |
| 35. Fishing minigame (2D): minigame | 657 lines | some untangling |
| 36. Synthesized SFX: audio | 45 lines | clean |
| 37. Robot players: balance simulator | 289 lines | clean |
| 38. Browser test suite: tests and self-checks | 785 lines | deeply tied |
| 39. Build and asset bundling: asset loading | ~95 lines | clean |

#### Thareia (T2, stage 2, work in progress)

Full detail: [inventory/thareia.md](inventory/thareia.md)

| System | Size | Tangled with content |
|---|---|---|
| Inherited unchanged: RNG, dice, battle engine and AI, stats, loot, save migrations, input, pixel renderer (identical to Aethermoor M7; see its rows) | (Aethermoor's sizes) | as in Aethermoor |
| Save and load — save (changed) | 173 lines (`src/core/save.js`) | clean |
| Audio facade — audio (changed) | 118 lines (`src/core/audio.js`), replacing Aethermoor's 511 | clean |
| Story effects and conditions — quests/story (changed) | ~80 added lines over 393 + 193 | some untangling |
| Game flow: new game, recruits, guests — progression (changed) | ~25 changed lines of 578 | clean |
| World engine: story-gated fires — maps/world (changed) | ~8 lines of 769 | clean |
| World screen additions — walking/input (changed) | ~75 added lines of 1,255 | some untangling |
| Painted battle backdrops — rendering (changed + new data) | ~45 lines + 6 images (~1.1 MB base64) | clean |
| Painted-map view additions — rendering (changed) | ~80 lines | some untangling |
| Cut-scene and chapter cards — cutscenes (changed) | ~45 lines of 591 | deeply tied |
| Day and Codex display gates — UI (changed) | ~40 lines | some untangling |
| Build pipeline — tooling (changed) | — | — |
| Airship rules and sky data — airship/progression (new) | 159 lines | clean |
| Airship flight screen — airship/rendering/input (new) | 534 lines + `src/ui/sky.css` 26 | clean |
| 3D sky scene — rendering (new) | 204 lines | clean |
| 3D airship built in code — 3D models (new) | 411 lines | clean |
| Ship lean spring — animation (new) | 49 lines | clean |
| Mini map — minimap (new) | 109 + 12 lines | clean |
| Thareia sound library — synthesized audio (new) | 352 lines | clean |
| Thareia music engine — music (new) | 266 lines | clean |
| Sound board and level tool — tooling (new) | 183 + 12 + 40 lines | — |
| Chapter 1 balance sim route — balance simulator (changed tool) | — | — |
| Tests and end-to-end checks — tests (new + inherited) | — | — |

#### The Ranch (working name)

Full detail: [inventory/the-ranch.md](inventory/the-ranch.md)

| System | Size | Tangled with content |
|---|---|---|
| Frame loop, time scale and adaptive quality — game loop | ~60 lines | some untangling |
| Camera: top-down map that tips into an orbit — camera | ~25 lines | clean |
| Touch and mouse gestures, tap picking — input | ~30 lines | clean |
| Pop-up props and trees — effects / presentation | ~40 lines | clean |
| Grid A* pathfinding (herd and crew) — walking / pathfinding | ~50 lines | clean |
| Herd behaviour (leader, follow, hay, water, fidgets) — enemy/NPC AI | ~100 lines | some untangling |
| Chickens — NPC AI (tiny) | ~40 lines | clean |
| Rancher job queue and step planner — quests / NPC AI | ~200 + ~55 lines | clean |
| Rancher, tractor and yard props built in code — 3D models + procedural animation | ~265 lines | clean |
| Painted-map ground and paint mask — rendering | ~150 lines | some untangling |
| Procedural grass rings round the focus — rendering / procedural generation | ~40 lines | clean |
| Instanced 3D trees from the painting — rendering / procedural generation | ~110 lines | clean |
| Buildings, fences, railroad and work props — 3D models built in code | ~180 lines | some untangling |
| Sun, shadows, fog and film per frame — rendering / effects | ~35 lines | clean |
| Land kit (borrowed: `animal-3d-models/viewer/land-kit.js`, single L2044–2446) — rendering / effects | ~400 lines | clean |
| Film camera (borrowed: `animal-3d-models/viewer/cinema.js`, single L126–292) — rendering / post-processing | ~165 lines | clean |
| Cartoon Zebu cattle (borrowed: `animal-3d-models/zebu-cattle/zebu-hd.js` + `zebu-moves.js`, single L797–2043) — 3D models built in code + animation | ~1,245 lines | clean |
| zebu.js (borrowed: `animal-3d-models/zebu-cattle/zebu.js`, single L293–796) — content + dead code | — | — |
| Assets, tracing and the Walking Paths bridge — asset loading / map tools | ~135 lines (tool) + 5 lines (data) | some untangling |
| Tests and checks (tools beside the page) — self-checks | — | — |
| UI: Today checklist, world signs, bottom sheet — menus and UI | ~115 lines | some untangling |
| Random numbers — RNG | — | — |
| Save, audio, settings — not present | — | — |

#### Tiny Dominion

Full detail: [inventory/tiny-dominion.md](inventory/tiny-dominion.md)

| System | Size | Tangled with content |
|---|---|---|
| Game loop and fixed-step timing (`90-boot.js`, `50-nature.js`) — core | ~45 lines | clean |
| Settings store and settings sheet (`00-core.js`, `80-ui.js`) — settings | ~50 lines | clean |
| RNG, noise and hashing (`00-core.js`, `55-terra.js`, `74-ambient.js`, `90-boot.js`, `71-atlas.js`) — random numbers / procgen | ~30 lines | clean |
| Terrain data model and tile table (`00-core.js`, `10-world.js`) — maps | ~110 lines | some untangling |
| World generation (`10-world.js`, `47-riches.js`, `55-terra.js`) — procedural generation | ~170 lines | some untangling |
| Regions and reachability (`10-world.js`) — maps / pathfinding support | ~40 lines | clean |
| Units, spatial grid and movement (`20-units.js`) — entities / walking | ~90 lines | some untangling |
| Pathfinding: flow fields and sea routes (`20-units.js`) — pathfinding | ~85 lines | clean |
| Wildlife and monster AI (`20-units.js`, `50-nature.js`) — enemy AI | ~80 lines | some untangling |
| Real-time combat (`20-units.js`, `50-nature.js`, `40-rulers.js`) — battles | ~170 lines | some untangling |
| Ships: settlers, raids and trade fleets (`20-units.js`, `30-civ.js`, `40-rulers.js`) — naval | ~85 lines | some untangling |
| Settlements, buildings and town planning (`30-civ.js`) — economy / procedural layout | ~270 lines | deeply tied |
| Village economy, growth and trade (`30-civ.js`) — economy | ~170 lines | deeply tied |
| Kingdom lifecycle: founding, capture, secession, succession (`30-civ.js`, `40-rulers.js`) — progression | ~90 lines | some untangling |
| Ages, technology, wonders and the space programme (`00-core.js`, `40-rulers.js`, `30-civ.js`) — progression / stats | ~60 lines | some untangling |
| Diplomacy, wars and peace (`40-rulers.js`, `45-mind.js`) — AI / progression | ~150 lines | some untangling |
| Ruler minds: utility-scored yearly council (`45-mind.js`) — AI | ~400 lines of logic (+60 phrase tables) | some untangling |
| Riches of the earth (resources) (`47-riches.js`) — economy | ~120 lines | clean |
| Fire, nature ticks and disasters (`50-nature.js`, `60-powers.js`) — effects / world sim | ~150 lines | some untangling |
| Weather: drifting storms (`55-terra.js`) — weather | ~35 lines (+ render) | clean |
| Terraforming, sculpting and water flow (`55-terra.js`) — procedural / editor tools | ~250 lines | clean |
| Climate: smoke, warming, ice and seas (`57-climate.js`) — world sim | ~140 lines | clean |
| God powers and tool dispatch (`60-powers.js`, `80-ui.js`) — editor / interaction | ~230 lines | deeply tied |
| Chronicle, speech bubbles, toasts and banners (`40-rulers.js`, `80-ui.js`) — UI / event log | ~35 lines | clean |
| Classic 2D canvas renderer (`70-render2d.js`, `68-gfx.js`) — rendering | ~480 lines | deeply tied |
| Procedural pixel-art sprite atlas (`71-atlas.js`) — 3D/2D art built in code | ~330 lines of engine + ~1,625 of recipes | clean |
| WebGL2 renderer: terrain shader, instanced sprites, lighting (`72-gl.js`, `73-scene.js`) — rendering | ~1,080 lines | some untangling |
| Day/night and seasons (`68-gfx.js`, `73-scene.js`) — effects | ~40 lines | clean |
| Ambient life particles (`74-ambient.js`) — effects | ~85 lines | clean |
| 3D relief tabletop view (`75-relief.js`) — 3D / camera | ~315 lines | clean |
| Camera: pan, zoom, glide, follow, cinematic director (`68-gfx.js`, `82-camera.js`) — camera | ~70 lines | clean |
| Input: pointer, touch, wheel and keys (`80-ui.js`) — input | ~110 lines | clean |
| UI framework: HUD, dock, sheets and realm pages (`80-ui.js`) — menus and UI | ~270 lines | deeply tied |
| History and charts (`40-rulers.js`, `81-history.js`) — UI / data viz | ~150 lines | clean |
| Minimap (`68-gfx.js`, `70-render2d.js`, `73-scene.js`) — minimap | ~45 lines | clean |
| Procedural audio: sfx, ambience beds, generative music (`85-audio.js`) — audio | ~640 lines | clean |
| Save and load (`86-save.js`, `90-boot.js`) — save/load | ~190 lines | deeply tied |
| Boot, new world and head start (`90-boot.js`) — progression / app shell | ~60 lines | clean |
| Debug and test hooks; build tool (`90-boot.js`, `tools/build.mjs`) — debug / tools | ~15 lines in the page | n/a |

#### What the Map Forgot

Full detail: [inventory/what-the-map-forgot.md](inventory/what-the-map-forgot.md)

| System | Size | Tangled with content |
|---|---|---|
| Registry and core utilities — infrastructure | ~80 lines (L106–L184) | clean |
| Random numbers — RNG | spread out; ~10 lines of helpers | clean |
| Game-clock waits and tweens — timing | ~18 lines | clean |
| Main loop, scenes and screen effects — game loop | ~115 lines | some untangling |
| Display fit and resolution scaling — rendering | ~35 lines | clean |
| Input — input | ~75 lines | clean |
| Pixel sprites from letter grids — rendering / animation | ~75 lines | clean |
| Bitmap font and text layout — text | ~70 lines of code plus 85 of data | clean |
| Drawing primitives and UI chrome — rendering / UI | ~60 lines | clean |
| Particles — effects | ~33 lines | clean |
| Chiptune music and SFX synth — audio | ~195 lines | clean |
| Map loading, story layers and collision — maps and collision | ~90 lines | clean |
| Procedural ground painter and the Blank's edge — procedural rendering | ~100 lines of engine plus ~120 of ground data | clean |
| Lighting and day/night — effects | ~70 lines | clean |
| Painted-map overlay and alignment — rendering / asset loading | ~545 lines | some untangling |
| Map objects ("things") — maps / art in code | ~20 lines of engine; content ~1,000 lines spread over props and cha… | clean |
| Field: grid walking, followers, NPCs and events — walking | ~200 lines | some untangling |
| Tap-to-walk pathfinding — pathfinding | ~40 lines | clean |
| Camera — camera | ~12 lines | clean |
| Exploration ink (fog of war) and sketch reveal — exploration / minimap | ~35 lines | some untangling |
| Warden stealth (patrol and vision cone) — enemy AI | ~45 lines | some untangling |
| Roaming field enemies — enemy AI / encounters | ~25 lines | clean |
| Modal UI stack, dialogue and menus — UI / dialogue | ~400 lines | some untangling |
| Items, gear, shops and inn — inventory / economy | ~75 lines | clean |
| Story script interpreter — quests / cutscenes | ~150 lines | clean |
| Party, stats and leveling — stats | ~40 lines | clean |
| Battle — battle | ~460 lines | some untangling |
| Scribble enemy art (creatures drawn in code) — art in code / animation | ~45 lines per creature; ~20 lines of engine | clean |
| Save and load — save | ~55 lines | clean |
| Title screen — UI / procedural art | ~95 lines | deeply tied |
| Journal and objectives — quests / progression | ~130 lines of engine plus 258 of data | some untangling |
| Vigil (lamp defence) — minigame | ~60 lines | some untangling |
| Sky: Mode-7 airship flight — rendering / vehicle | ~170 lines | clean |
| Ending: epilogue map pages and credits — cutscenes | ~80 lines | clean |
| The Heart: a map built from the save — procedural generation | ~55 lines | deeply tied |
| Debug mode (`?debug`) — debug tools | ~135 lines | some untangling |
| Repo tools beside the game (not in the page) — tests / build | check.js 284 lines; the tools total ~1,920 lines (from `wc`) | clean |

#### One Moon (Witch Way spin-off)

Full detail: [inventory/witch-spinoffs.md](inventory/witch-spinoffs.md)

| System | Size | Tangled with content |
|---|---|---|
| Game loop and screen manager (system) | ~200 lines | clean |
| Screen scaling and input (system) | 180 lines | clean |
| Asset loading (system) | 57 lines | clean |
| Text rendering (system) | 110 lines | — |
| UI kit and tap registry (system) | 174 lines | — |
| Overlays and dialogue (system) | 364 lines | some untangling |
| Brewing rule (system) | ~40 lines | clean |
| Requests, rewards and progression rules (system) | ~300 lines | some untangling |
| Moon timer (system, new to this game) | ~60 lines | clean |
| Moonlight gathering (system) | ~500 lines of logic, ~280 of drawing | some untangling |
| Inkblot the thief (enemy AI, small) | ~75 lines | some untangling |
| Cottage, cauldron and visitor queue (system) | ~350 lines of logic, ~450 of drawing | some untangling |
| Witch Way map (presentation + small system) | 195 lines | — |
| Witch sprite and dud looks (animation) | 64 lines | — |
| Particles and floating words (effects) | 89 lines | clean |
| Sound (audio) | 215 lines | — |
| Save and load (system) | 28 lines | — |
| Tests and build tools (balance and self-checks) | — | — |

#### The Short Road (Witch Way, condensed)

Full detail: [inventory/witch-spinoffs.md](inventory/witch-spinoffs.md)

| System | Size | Tangled with content |
|---|---|---|
| Catalogue (system, new) | ~30 lines | clean |
| Brewing rule, two chapters (system) | ~70 lines | some untangling |
| Favours, rewards and endings (system) | ~150 lines | some untangling |
| Nights and sleep events (system) | ~110 lines | — |
| Walk mask and A* pathfinding (system, new) | 218 lines | clean |
| Walking scene: movement, camera, interaction, exits (system) | ~450 lines of logic in a 1,404-line file | some untangling |
| Place mechanics (system) | ~400 lines | deeply tied |
| People and dialogue lookup (system) | 70 lines | some untangling |
| Witch sprite (animation) | — | — |
| Brewing screen (system + presentation) | 485 lines | some untangling |
| Map and telescope (presentation + small system) | 232 lines | — |
| Sound (audio) | 301 lines | — |
| Save and load (system) | 25 lines | — |
| Tests and build tools (balance and self-checks) | — | — |

#### Follow Me Down Witch Way (milestone 4)

Full detail: [inventory/witch-way.md](inventory/witch-way.md)

| System | Size | Tangled with content |
|---|---|---|
| Game loop, screens and fades — core | ~270 lines | clean |
| Integer-scale canvas — rendering | 110 lines | clean |
| Crisp text and the UI kit — rendering/UI | 243 lines | clean |
| Input — input | 321 lines | clean |
| Assets, bundle and painted-art scaling — assets | 244 lines | some untangling |
| Region packs and region art streaming — content framework | ~150 lines | clean |
| Polygon walk mask and exits — collision | 67 lines | clean |
| Walker — walking / animation | 157 lines | some untangling |
| Map screen: camera, exits, overlay stack — scene management | 762 lines | deeply tied |
| Actions: tap, hold, Moonlight, places, sitting still — interaction | 626 lines | some untangling |
| Depth-sorted standees — rendering | 165 lines | some untangling |
| Moon phases, clouds, night reset — day/night | ~170 lines | clean |
| Herb spots, basket — gathering / inventory | ~150 lines | some untangling |
| Brewing — crafting | 264 lines | some untangling |
| Cauldron screen — crafting UI | 574 lines | some untangling |
| Friends, trades, charms, letters — quests/NPCs | 408 lines | deeply tied |
| Dialogue box, letters, swaps — dialogue | 346 lines | some untangling |
| Gates and the ending — progression | 113 lines | some untangling |
| Story flags and small-story state machines — progression | ~600 lines | deeply tied |
| Night pipeline, rooms and rest — progression | ~400 lines with its views | some untangling |
| Collection, Found-it queue, lore text — collection/UI | ~720 lines | some untangling |
| Save and load with repair — save | ~240 lines | some untangling |
| Audio — audio | 235 lines | clean |
| Ambience and effects — effects | ~1,100 lines (mostly not read line by line) | deeply tied |
| Minimaps — minimap | 258 lines | some untangling |
| Region mechanics: Fells and Deep — content-tied mechanics | 785 lines | deeply tied |
| Scene editor (F2), play-test seeding, RNG — debug / RNG | ~980 lines | some untangling |
| Build, tests and self-checks (repo) — tests/tools | — | — |

## Step 3: Across the games

### The table

`·` = absent, `✓` = present, `★` = present, and the strongest version (the one to build a shared module from; why is in the last column).

Games: **MF** What the Map Forgot · **WW** Witch Way (milestone 4) · **1M** One Moon · **SR** The Short Road · **ML** Moonlight in the Aether · **SS** Sunstone Skies · **SK** Skies of Aethermoor, polished · **AE** Aethermoor M7 · **TH** Thareia · **EN** Envoi · **ST** Stranded · **RA** The Ranch · **TD** Tiny Dominion · **AF** Art Farm · **MP** The Magpie page · **SF** Starfall

| System | MF | WW | 1M | SR | ML | SS | SK | AE | TH | EN | ST | RA | TD | AF | MP | SF | Strongest version, and why |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Game loop and timing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | TD: fixed 125 ms step with an accumulator, interpolation, speeds 0–20×, pause, and a time-sliced head start. Everyone else uses a variable step clamped to 0.05–0.1 s. SK adds pause-when-hidden, WebGL context-loss recovery and a headless `step()` for tests |
| Waits and tweens on a game clock | ✓ | · | · | · | ✓ | · | · | ✓ | ✓ | ★ | · | · | · | ✓ | · | · | EN: awaitable `wait`/`until`, hit-stop, slow motion and turbo on one battle clock |
| Keyboard mapping | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | · | ✓ | ✓ | ✓ | ✓ | AE: actions instead of keys, focus moving between buttons, key traps for overlays |
| Touch d-pad and buttons (2D) | ✓ | ✓ | · | · | · | · | · | ★ | ✓ | ✓ | ✓ | · | · | · | · | ✓ | AE: dead zone with hysteresis, a buffered direction so a tap mid-step isn't lost, A/B with hold-to-run, hold-to-inspect |
| Touch thumb-stick and look-drag (3D) | · | · | · | · | · | ✓ | ★ | · | · | · | · | ✓ | · | ✓ | · | · | SK: a stick that appears under the thumb, aim-drag, Fire/Surge buttons with pointer capture, slide off Fire and keep aiming. RA has gestures only (pan, pinch, twist) |
| Tap or click to walk there | ✓ | · | · | ✓ | ✓ | · | · | ✓ | ✓ | ★ | ✓ | · | · | ✓ | · | · | EN: tap walks, hold steers, tapping a person or thing walks there and uses it, and a fine search finds narrow ways |
| Pathfinding (any) | ✓ | · | · | ✓ | ★ | · | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | · | ML: A* on a grid over a triangulated walk floor, no corner cutting, straightened by line of sight. TD's flow fields are the one to use for crowds of units |
| 2D canvas pixel-art screen | ★ | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | ✓ | ✓ | ✓ | · | ✓ | · | · | ✓ | MF: 240×160 game pixels on a backing store 2–4 device pixels per game pixel, so pixel art stays sharp while paintings keep their detail |
| 2D painted scenes (painting, walk mask, sprites in front and behind) | ★ | ✓ | ✓ | ✓ | · | · | · | ✓ | ✓ | ✓ | ✓ | · | · | · | · | · | MF: occluders cut out of the painting, a check that finds objects painted off their spot, and story changes drawn over the painting |
| 3D actors over a painting | · | · | · | · | ★ | · | · | · | · | ✓ | ✓ | ✓ | · | ✓ | ✓ | · | ML: the painter's camera rebuilt from three numbers, cut-out cards tested against the actors' depth, a compositor, doors between screens. Clean and holds no game data; the Magpie pages are later builds of it |
| 3D rendering (three.js or WebGL) | · | · | · | · | ✓ | ✓ | ✓ | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | No single best: the games are split between two three.js versions (table below) |
| 2D sprites and animation | ✓ | ✓ | ✓ | ✓ | · | · | · | ✓ | ✓ | ★ | ✓ | · | ✓ | · | · | ✓ | EN: Io's painted walk sheet with a rippling cape, lean, breath and frames paced by distance (from Witch Way's Path Polish) |
| 2D art drawn in code | ✓ | · | · | · | · | · | · | ★ | ✓ | · | ✓ | · | ✓ | · | · | ✓ | AE: the Pixel Forge, which turns shapes into lit, dithered pixel art. Its output is pinned pixel for pixel by tests |
| 3D models built in code, with animation | · | · | · | · | ✓ | ✓ | ✓ | · | ✓ | ★ | ✓ | ✓ | · | ✓ | ✓ | · | EN: skinned skeletons, spring physics, keyframed actions with hit and cue times, and one interface (`ACTIONS`, `anchor`, `play`) that the battle screen relies on |
| Ship builder (hull from outlines, parts from a picture sheet) | · | · | · | · | ✓ | ✓ | ★ | · | ✓ | ✓ | · | · | · | · | ✓ | · | SK: `ship/` is identical in all three airship copies. Polished adds the heel. It has three detail levels and about a dozen draw calls. SS's `fleet/` builds on it with moving parts |
| Walk collision | ✓ | ✓ | · | ✓ | ★ | · | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | ML: a triangulated walk floor with heights for stairs, round obstacles and sliding along walls |
| Camera | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | AE: dead zone, smoothing, clamped to the map, small maps centred, snaps on entering a map. EN's battle "camera director" is the one to take for battles |
| Turn-based or ATB battle engine | ✓ | · | · | · | ✓ | · | · | ★ | ✓ | ✓ | · | · | · | · | · | · | AE: pure and seeded; each turn returns the new state plus a list of events; data-driven effects; already runs in three games (AE, ML, TH) |
| Real-time combat | · | · | · | · | · | ✓ | ★ | · | · | · | · | · | ✓ | · | · | · | SK: guns placed from the model, rippling volleys, hit zones read from the model, pooled shots |
| Enemy AI | ✓ | · | ✓ | · | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | AE: intent dice per tier, move tables, boss phases, and roamers that spot you by line of sight, chase, give up or flee |
| Helpers and planners that act on their own | · | · | · | · | ✓ | · | · | ✓ | ✓ | · | ★ | ✓ | ✓ | · | · | · | ST: partners score jobs from what camp needs, never double up, share builds and explain their plan. Its robot players tune it. RA's job queue and TD's ruler minds are smaller or different in kind |
| Stats and leveling | ✓ | · | · | · | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | · | ✓ | · | · | · | AE: six D&D abilities, XP to next = 30 × L^1.55, hit-die rolls, ability raises every 4 levels |
| Gear and inventory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | · | · | · | · | · | AE: 8 slots, loot by rarity with affixes, compare and equip, item art from each item's seed |
| Shops and economy | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | · | · | ✓ | · | · | · | AE: shops, gem shop, and a forge for temper, reroll, sockets and salvage |
| Crafting and brewing | · | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | ✓ | · | ★ | · | · | · | · | · | ST: 32 recipes as data, with prerequisites, projects over several sessions, and a planner that turns any goal into the next doable step. For brewing alone, WW's virtue brewing is the richest |
| Quests, story flags and conditions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | ★ | ✓ | ✓ | ✓ | ✓ | · | ✓ | · | · | AE: one condition language (with validators) decides gates, talk, quests, bounties and shops |
| Story scripting and cutscenes | ★ | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | ✓ | ✓ | · | · | · | · | · | · | MF: every story event is a list of 49 awaitable commands, kept out of the engine. For stills with captions and voiced lines, ML's cut-scene player |
| Dialogue box | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | ★ | ✓ | ✓ | · | · | · | · | · | · | AE: typewriter with a voice per speaker, choices showing their odds, skill checks rolled in the open |
| Save and load | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | · | ✓ | ✓ | · | ✓ | AE: every access guarded, a backup slot, older saves read but never written over |
| Save versions and upgrading old saves | · | ✓ | · | · | · | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | · | ✓ | · | · | · | AE: a tested upgrade chain v1→v6 against 18 real old saves |
| Saves in the claude.ai account (cloud) | ✓ | · | · | · | · | · | ★ | · | · | · | · | · | · | · | · | · | SK: newest save wins, live updates, retries, and a test with two pretend devices |
| Save codes (copy and paste) | · | · | · | · | · | · | · | ★ | ✓ | ✓ | ✓ | · | · | · | · | · | AE: `AETH<n>.` codes, markup stripped on import, newer versions refused by name. EN adds a checksum |
| Synthesized sound effects | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | ★ | ✓ | ✓ | · | ✓ | · | ✓ | ✓ | TH: the sound library (182 sounds, a measured loudness per sound, reverb), already copied into four other places |
| Music | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | ★ | ✓ | · | · | ✓ | · | ✓ | · | TH: 9 pieces played live by 25 code instruments. TD's generative music and its mixer (voice caps, ambience beds) are the best engineered |
| Settings and accessibility | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | ✓ | ★ | ✓ | · | ✓ | · | ✓ | · | EN: word speed, larger text, music/effects/surroundings volumes, battle sharpness, reduced motion |
| Menus and UI framework | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AE: an app shell with a screen router, screens that mount and unmount, overlays that make the page underneath inert and trap focus |
| Transitions and screen effects | ✓ | ✓ | ✓ | ✓ | ✓ | · | ★ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | SK: camera shake from "trauma", spring kicks, phone vibration, slow-motion dial, all scaled down for reduced motion |
| Particles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | · | ✓ | · | ✓ | · | EN: pooled ring buffers plus a library of spell effects (ring, burst, slash, beam, sigil…). ST's stage pools (9 kinds of motion) for weather and air |
| Weather, day and night, seasons | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | · | · | ✓ | ★ | ✓ | ✓ | · | ✓ | · | ST: a real weather model (DFW normals, fronts, rain, wind chill), seasons, sun and moon placed by date and hour, and seven blended weather looks |
| Seeded random numbers | · | ✓ | · | · | ✓ | ✓ | · | ★ | ✓ | ✓ | ✓ | · | ✓ | · | · | · | AE: mulberry32 that can be saved and resumed, named sub-streams, and rules that never touch `Math.random` |
| Procedural generation | ✓ | · | · | · | · | · | · | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | · | · | TD: whole worlds (height, climate, rivers, lakes by priority flood) and towns laid out on street grids |
| Balance simulators | · | · | · | · | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | · | · | · | · | · | EN: `balance.mjs` plays 40+ win-rate targets 1,000 times with fixed seeds and fails on a miss. ST's robot players are the model for simulating a whole game |
| Automated tests and headless checks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | ✓ | ✓ | · | ✓ | · | · | AE: 31 test files, real old-save fixtures, older builds pinned by SHA-256, end-to-end runs |
| Debug tools and editors | ✓ | ★ | · | · | ✓ | · | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | WW: the F2 scene editor (walk polygons, exits, spots, lights, undo) that writes `scenes.json`. Mooncart's own Walking Paths editor (a side branch of this repo) follows Envoi's walking rules |
| Minimap or map screen | ✓ | ✓ | ✓ | ✓ | · | ✓ | ✓ | ✓ | ★ | ✓ | ✓ | · | ✓ | ✓ | ✓ | · | TH: drawn from the map data, with the objective starred, and tap to enlarge; 109 lines |
| Packing assets into one file | ✓ | ★ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | WW: Z85 packing, turned into blob URLs on first use, paintings loaded and released per region, and an unbundle tool with a round-trip check |
| Airship flight | ✓ | · | · | · | ✓ | ✓ | ✓ | · | ★ | ✓ | · | · | · | · | ✓ | · | TH, for travel: landing rules (story, licence, level), region and world map, 3D with a 2D fallback, a tested lean spring. SK's flight model is the one to take for fighting |
| Paper pop-up effect | ✓ | · | · | · | · | · | · | · | · | · | · | ✓ | · | ★ | · | · | AF: hinged cards with a wave that speeds up with distance. MF's is in its 3D copy only (`wren-3d`). RA's pop-up uses its own springs |

How many of the 16 have each:
- **All 16:** the game loop, menus and UI.
- **15:** keyboard input (not The Ranch), packing assets into one file (not Starfall) and a camera (not Starfall).
- **14:** save and load (not The Ranch or the Magpie page).
- **13:** particles and automated checks.
- **12:** synthesized sound, quests and flags, and painted scenes of one kind or another (2D or with 3D actors).
- **10:** music.

These are the systems a shared engine would serve most widely.

### Three renderers

| Kind | Games |
|---|---|
| 2D canvas only | What the Map Forgot, Witch Way, One Moon, The Short Road, Aethermoor, Starfall |
| three.js **r128**, global `THREE`, plain scripts | Envoi, Stranded (living layer), The Ranch, Art Farm, What the Map Forgot's 3D copy, Envoi's Colossus demo |
| three.js **r186** (npm 0.186), ES modules bundled by esbuild | Moonlight, the Magpie pages, Skies (all three copies), Thareia (airship view only) |
| raw WebGL2, no library | Tiny Dominion |

Shader code differs between the two three.js versions: r128 hooks `output_fragment`, r186 hooks `opaque_fragment` and `colorspace_fragment`. Envoi's `models/magpie.js` shows the port work needed to take an r186 model to r128.

### Mooncart's buttons in each game

Mooncart presses arrows for the d-pad, Enter for A, Escape for B, M for START and H for SELECT (`web/js/store.js`).

| Game | Works | Doesn't |
|---|---|---|
| What the Map Forgot, Aethermoor, Thareia, Envoi, the Magpie page, Art Farm, Starfall | arrows, A, B, START | SELECT does nothing (fine) |
| **Witch Way** | arrows, B, START | **A opens the menu**: the game reads Enter as Menu, and gathering, talking and using places only answer Space or Z |
| **One Moon, The Short Road** | arrows, A | **START mutes the sound** (M = mute). In The Short Road B opens the menu |
| **Moonlight** | arrows, A, B, START; SELECT is Hag-Sight | **the battle command menu has no arrow keys**, so the d-pad can only pick the first command |
| Stranded | arrows, A (when the page has focus) | B only closes; no START or SELECT |
| Skies (polished, main copy), Sunstone Skies | some keys happen to fit | no button fires the guns (F or the mouse), so it can't be played on the console |
| **The Ranch** | — | no keyboard at all (touch gestures only) |
| **Tiny Dominion** | — | no Enter, M or H, and no arrow panning |

Of these, Mooncart's `games.json` lists only What the Map Forgot, Witch Way (built from its main branch, which is before milestone 4), Moonlight's 11 demo pages (not the whole game), the Aethermoor map and sheet, and Envoi's main branch (model benches and reference demos, not the game).

### What was copied where

```
New-game  Loot Forge prototype ─► Aethermoor (M2…M7) ─┬─► Thareia (whole-tree fork, Oct 1)
                                                      └─► Moonlight: vendor/aethermoor (rules) + audio/synth.js
New-game  thareia/sfx (sound library) ─► 20-min vendor/thareia-sfx ─┬─► Moonlight (with a router to the Aethermoor synth)
                                                                     ├─► Envoi src/game/thareia-audio.js (+ volumes)
                                                                     ├─► Skies polished audio/thareia (copied, never used)
                                                                     └─► bundled in every Magpie page
20-min    Moonlight (stage, painter's camera, walk floor, actors, airship page)
              ├─► the Magpie pages: Thareia's art-in copy (Sep 30), envoi's (Oct 2), the airship repo's newer one (Oct 6)
              ├─► Envoi models/magpie.js (model copied, ported to r128) and game/fly.js (flight rewritten)
              └─► airship game ship/hull.js (the Magpie's recipe, reimplemented in metres)
airship   main folder ─┬─► polished/ (Oct 6, at 1887984)
                       └─► 20-min sunstone-skies (taken at a8124d5, ships again at 1887984)
Witch Way first upload ─► milestone 4 ─► One Moon ─► The Short Road
          Path Polish ─► Envoi src/walk/painted-io.js (walk, cape, motion constants)
          lore, lines, brewing ideas ─► Moonlight (rewritten)
Envoi     Night Square demo ─► battle-fx.js, sound.js, the camera director (engine rewritten)
          living-battlefields/field.js ─┬─► Envoi fx/arena.js
                                        ├─► Stranded living/stage.js (adapted to a painting)
                                        └─► cursed-worlds land-kit.js ─► The Ranch
          io/cinema.js (film camera) ─► The Ranch (byte for byte)
          model method (sol.js) ─► What the Map Forgot's 3D Wren
WTMF      wren-3d farwick-3d.js (popK, popAt) ─► Art Farm paper.js (+ hinges)
Stranded  living/walker.js A* ◄─► The Ranch route() (same shape)
```

### Copies that have drifted apart

**1. Aethermoor's battle rules: three copies.**
- **Aethermoor M7** (`New-game` @ `cool-ptolemy`, `game/src/rules`) is the original.
- **Moonlight** vendors it (`vendor/aethermoor`). 11 files differ: two new data files (`witch.js`, `moonlight-foes.js`), and nine changed, each line tagged `// ADDED for the 20-min game`.
  - `combat.js` gains an Omen's own weakness (×1.5), `struck`, and `breakOmens`/`cleanse.omens`.
  - `battle.js` gains an `ally-any` target.
  - Moonlight also builds its heroes with its own `makeHero`, which uses a different gear seed and level handling from the unused copy in `battle/engine.js`.
- **Thareia** forked the whole tree:
  - 203 files are byte-identical, 41 changed, about 48 new, none removed.
  - The rules, RNG, dice, balance numbers and save upgrades are unchanged.
  - The game flow and story gain guests, key items, `heroLevel` conditions and story-gated fires.
  - The world screen gains corner slip.
  - The 511-line sequencer is replaced by a facade over the Thareia library.
- **Behaviour today:**
  - The same battle plays the same in Aethermoor and Thareia.
  - In Moonlight, foes with an Omen take ×1.5 from their weakness and can have Omens broken or cleansed.
  - A bug fixed in one copy is not fixed in the others.

**2. The Thareia sound library: five copies.**
- **Thareia** (`thareia/sfx`) is the only copy with `musicGain()`.
- **20-min's `vendor/thareia-sfx`** is byte-identical to Thareia's at `7e15822`, before `musicGain`.
- **Envoi's `thareia-audio.js`** is the 20-min copy joined into one script. It adds:
  - separate music, effects and surroundings volumes (`setVolume`, 0.75 = library level), with a separate bus for background sounds;
  - an optional fix that loops the noise buffer so long sounds aren't cut short;
  - pausing only what it paused when the page is hidden.
- **Skies polished** has the older `music.js` and never imports either file, so that game is silent.
- **The Magpie page** bundles both this library and the Aethermoor synth.
- **Behaviour today:**
  - The same sound id plays the same everywhere: the loudness table is identical.
  - Only Envoi lets the player set volumes.
  - Only Thareia can duck its music.
  - Every header still says "100 sounds"; there are 182.

**3. The Aethermoor synth: three copies.** Aethermoor's `core/audio.js` ("ported from the Loot Forge prototype") went to:
- **Moonlight's `audio/synth.js`**: exactly 34 lines more, the Wickhollow lullaby plus anvil, kraa and flap.
- **The Magpie page**: bundled.
- **Thareia**: removed and replaced.

Moonlight and the Magpie page each run **two AudioContexts** at once, one per engine.

**4. The airship game: three copies.**
- **Identical in all three:** the ship builder (`ship/hull.js`, `kit.js`, `materials.js`, `parts.js`) and all six recipes, about 1,370 lines.
- **Polished** = the main copy, plus:
  - an event bus;
  - pooled sparks and smoke;
  - camera trauma and spring kicks;
  - broadsides that ripple down the side gun by gun;
  - a glow on raider gun ports before they fire;
  - an update loop that allocates nothing;
  - bug fixes: in the main copy the next wave carries into the next voyage, and the last ship can be left hanging in the sky.
- **Sunstone** forked earlier, so it has no wind, no Surge and no per-class gun weight (every class hits for 28/55). In their place it built a campaign:
  - three charts with danger levels;
  - waves seeded so a voyage plays the same each time;
  - 10 parts with 5 marks each, four abilities, renown levels;
  - a strength rating fitted to 75 measurements.
- **Saves:**
  - The main copy and polished both use `skies-of-aethermoor/save-1`, so in one browser they read and overwrite each other.
  - The main copy's cloud push can overwrite newer progress from a stale tab.
  - Sunstone uses `sunstone-skies:captain:1`, version 2, with an upgrade from version 1 and no cloud.
- **Balance tools:**
  - `sim-fight.mjs` is identical in the main copy and polished; Sunstone keeps an older one.
  - Polished re-measured "How hard it is" after adding the gun-port warning: Skiff 4 waves → "usually four (now and then three)", Brig 7–8 → 6–7.

**5. Moonlight's painted-scene engine and airship page: four builds.** The Magpie pages are builds of Moonlight's modules at different times:
- **Envoi's `the-magpie.html`** and **Thareia's `art-in/airship/the-magpie-3d.html`**: Gloomfen only.
  - Cruise 4.5 m/s, turn 1.5 rad/s, no full sail.
  - Thareia's adds a time-of-day button.
- **The airship repo's page** (byte-identical to envoi's `the-magpie-over-aethermoor.html`): all of Aethermoor.
  - Cruise 9 m/s, full sail ×1.8, turn 1.6.
  - A minimap, region banners, an intro, cloud shadows, sea and lamp effects, sharpening.
  - **None of these newer features is in any source tree we could see.**
- **Envoi's `fly.js`** rewrote the flight on r128. It mixes both pages: the newer map frame (4608×3072, 12 px per m, pitch 52) with the older speeds.

**6. Witch Way and its spin-offs.**
- **One Moon** was written fresh in the main game's style. It copied two pieces:
  - the synth core and 7 sound recipes;
  - the Chapter 1 brewing rule (`brewing.js` L27–42).
- **The Short Road** came from One Moon, not from the main game:
  - three files are identical, seven changed a little;
  - it added the only A* in the family.
- **Chapter Two was built twice:**
  - The Short Road uses fixed two-herb recipes.
  - Milestone 4 uses virtue-based brewing.
- **The same item does different things in each game:**

  | Charm | Main game (the kit) | One Moon | The Short Road |
  |---|---|---|---|
  | Horseshoe | +4 basket slots | 35% chance of picking 2 | 35% chance of picking 2 |
  | Moth | walks a quarter faster | +20 s of moon | walks a quarter faster (×1.25) |

- **Controls:**
  - Enter is Menu in the main game and Confirm in the spin-offs.
  - M is Menu in the main game and Mute in the spin-offs.
- **Walking:** 66 px/s at 10 frames a second in the main game; 124 px/s at 17 in The Short Road.
- **Saves:** `follow-me-down-witch-way.save.v2` (+ 3 slots), `one-moon.save.v1`, `witch-way-short-road.save.v1`. None of them upgrades another's.

**7. Envoi's living battlefield: three descendants.** From `living-battlefields/field.js`:
- **Envoi's `fx/arena.js`** shares 310 lines.
- **Stranded's `living/stage.js`** keeps the same noise, gust and cloud-shadow GLSL, with different constants, adapted to an orthographic camera over a painting.
- **The Ranch** (through cursed-worlds' `land-kit.js`) has 87 lines verbatim:
  - the push ring is 4.5 m instead of 19 m, and fades faster (2.4 instead of 1.25);
  - it adds the animal's body pushing grass aside, day and dusk palettes, an inverse film curve and sky reflections.
- **Bug found in the land kit:** it ignores the sun direction it's given, so The Ranch is lit from the north-east instead of the north-west in the painting. This was found by reading the code, not by looking at it rendered.

**8. The paper pop-up: two descendants.**
- **What the Map Forgot's 3D copy** (`wren-3d/src/farwick-3d.js`, `popK`/`popAt`) is the source.
- **Art Farm's `paper.js`** took that wave:
  - It speeds the wave up with distance (`arrive(d)`).
  - It adds hinges and a fold.
  - Its speed is 34 m/s, against 220 px/s in What the Map Forgot (v1 of Art Farm used 38).
- **The Ranch** credits the idea but uses its own springs.

**9. Smaller ones.**
- **The Night Square demo → Envoi:**
  - Envoi's battle effects took 245 of the demo's 251 effect lines; its battle sound took 54 of 60.
  - The battle engine was rewritten: headless and seeded instead of inline, damage swing ±25% instead of ±7%.
- **mulberry32 random numbers** turn up in seven games with different wrappers:
  - Aethermoor: saved and forkable.
  - Stranded: state kept in the save.
  - Witch Way: written out twice.
  - Envoi: the battle engine only.
  - Tiny Dominion: world generation only.
- **The toon look** is re-created again and again: a 3-step ramp 70/160/255, a rim light and an ink shell 0.016 thick. Moonlight alone has three copies of it; it also appears in the Magpie page, Thareia's ship and Stranded.
- **Small helpers** (`el()`, `clamp`, `lerp`, `inPoly`) are copied into many files of the same game. Envoi has `el()` in about 8 files.
## Step 4: Recommendations

Nothing has been extracted. These are recommendations for you to decide on.

### Extract first

These are ordered by how many games would use them and how cleanly they come out. The first five are clean today: they hold no game's content and touch no game's screens.

| # | System | Games that would use it | Base it on | Why that version | What to fold in from the others |
|--:|---|---|---|---|---|
| 1 | **Seeded random numbers and dice** | Aethermoor, Thareia and Moonlight now (identical copies); Witch Way, Envoi, Stranded and Tiny Dominion each have their own mulberry32 | Aethermoor `game/src/core/rng.js` (28 lines) and `core/dice.js`, with `rollTerms`/`parseDice` from `rules/util.js` | It's the only one that can be saved and resumed (`getState`/`setState`). It has named sub-streams (`fork`), dice notation, advantage and disadvantage, and tests. Three games already run it unchanged | Stranded's Gaussian and weighted pick (`gauss`, `wpick`) as extras |
| 2 | **Sound effects and music library** | Thareia, Moonlight, Envoi, the Magpie pages; Skies has a copy but no sound yet. 12 games make sounds in code | New-game `thareia/sfx/sounds.js` and `music.js` (618 lines) | It's the source of the other four copies and the only one with `musicGain()`. It comes with a sound board and a loudness tool | From Envoi's `thareia-audio.js`: the music, effects and surroundings volumes, the background bus, the noise-loop fix and the hidden-page handling. From Tiny Dominion's `85-audio.js` (optional): voice limits, priorities and ambience beds. From Moonlight's `audio/sound.js`: the router to the Aethermoor synth, for games that keep their synth songs |
| 3 | **The save core** (not the save formats) | 14 games save | Aethermoor `game/src/core/save.js` (173 lines) | Every access is guarded, there's a backup slot, older saves are read and never written over, the upgrade step is passed in from outside, and save codes are cleaned on import | The cloud adapter from Skies polished `game/progress.js` (newest wins, two-device test in `tools/check.mjs`). The checksummed save code from Envoi `game/state.js`. Each game keeps its own key names and formats: the shared part only does the storing |
| 4 | **Painted-scene stage** (3D actors over a painting) | Moonlight and the three Magpie builds now; Envoi, Stranded, The Ranch and Art Farm each have their own way | Moonlight `src/paint.js`, `walkmesh.js`, `layers.js`, `stage.js`, `screen.js`, `town.js` (about 1,500 lines) | Clean and holds no game data. The camera is rebuilt from three numbers per painting. Cut-outs are tested against the actors' depth, the walk floor has heights for stairs, and doors join the screens | The newer Magpie page's `WORLD_FX`: cloud shadows, sea glints, lamp flicker and sharpening. Its readable source wasn't in any branch, so it would have to be recovered from the page or rewritten |
| 5 | **Ship builder** | Skies polished, its main copy and Sunstone (identical); Thareia, Envoi and the Magpie pages have older skiff builders | airship repo `polished/src/ship/` and `polished/src/ships/` (about 1,450 lines) | Byte-identical in three copies. It has a recipe format, three detail levels, about a dozen draw calls per ship, and turns paint into textures | Sunstone's `fleet/` as an optional layer (moving parts, damage, garage fittings), since it already builds on `ship/` |
| 6 | **Turn-based battle rules** | Aethermoor, Thareia, Moonlight | Aethermoor `game/src/rules/` (battle, combat, ai, foe, stats, progression, loot) and `data/statuses.js`, `aspects.js`, `tuning.js` | Pure, seeded and data-driven. Each turn returns a new state plus a list of events. 43 battle tests and a simulator back it. It's already copied three times, so making it one module removes triple upkeep | Moonlight's nine `// ADDED for the 20-min game` changes (Omen weakness, `struck`, breaking and cleansing Omens, `ally-any`), as switches off by default so Aethermoor and Thareia play the same |
| 7 | **Input, with the Mooncart buttons** | every game | 2D: Aethermoor `core/input.js`, `ui/lib/keys.js`, `ui/world/controls.js`. 3D: Skies polished `game/input.js` | The most complete of each kind (see the Step 3 table) | One shared rule for Mooncart: arrows, Enter = confirm, Escape = back, M = menu, H = select. Each game can override it. That fixes Witch Way, One Moon, The Short Road and Moonlight's battle menu without changing them by hand |
| 8 | **Game loop and clock** | every game | Tiny Dominion `90-boot.js` `frame` (fixed step), with the waits and tweens of What the Map Forgot (`G.wait`/`G.until`/`G.tween`, single file L188–L203) and Envoi (`battle/screen.js` clock) | A fixed step makes simulations and tests repeatable | Skies polished's pause-when-hidden, context-loss recovery and headless `step()`. Art Farm's `?manual` clock. A variable-step mode for games that rely on it (see the risks) |
| 9 | **Effects** | most games | 3D: Skies polished `game/fx.js` and `effects.js` (pools, trauma shake, spring kicks, vibration). Battles: Envoi `fx/battle-fx.js` (pooled spell effects) | Pooled, capped, reduced-motion aware | Stranded `living/stage.js` particle pools for weather and air |
| 10 | **Walk floors and tap-to-walk for painted 2D scenes** | Witch Way family, Envoi, Stranded, The Ranch | The Short Road `condensed/src/world.js` (`Walkmap`: rasterised walk mask, A*, path smoothing; 218 lines) | Clean; reads any `walkable`/`blocked` polygons | Envoi `game/field.js`'s corner slip and fine search on narrow ways. Mooncart's Walking Paths editor (branch `claude/gifted-wozniak-v579gl` of this repo) already writes a shared map format that The Ranch reads |

After these, the next candidates are:
- **The 3D model kit:** Moonlight's `actors/kit.js` toon materials and springs, plus Envoi's model interface (`ACTIONS`, `anchor`, `play`).
- **The dialogue box:** Aethermoor's.
- **The test kit:** headless `step` hooks, a Playwright check that ends in "all good", and Stranded's `tools/engine.mjs`, which runs a game's engine block in Node.

### Which version to base each on

The Step 3 table names the strongest version for every system, and the "Base it on" column above gives the file. In short:

- **Aethermoor** is the base for the core: random numbers, battle rules, saves, input, camera, menus, stats, loot, dialogue and tests. Its rules layer is the most disciplined code in any of the games: pure, seeded, data-driven and tested.
- **Thareia's sound library** is the base for audio, with Envoi's volume work added.
- **Moonlight** is the base for painted 3D scenes.
- **Skies polished** is the base for ships, real-time combat, effects and cloud saves.
- **Envoi** is the base for 3D characters, battle effects, settings and balance checks.
- **Stranded** is the base for crafting, weather, planners and whole-game robot players.
- **Tiny Dominion** is the base for the fixed-step loop and procedural worlds.

### Keep inside their own game

| System | Game | Why |
|---|---|---|
| The civilization simulation: villages, rulers' minds, wars, climate, terraforming, both renderers | Tiny Dominion | Deeply tied to its own tile arrays and unit types, and no other game shares the genre. Its audio mixer, sprite-atlas packer and line-chart drawer are the only general pieces |
| The survival simulation: body, DFW weather, ecology, hunting and fishing games, advice | Stranded | Clean, but every number is this game's. Partners and the planner could inspire others, not be shared as they are |
| Brewing, trades, moon nights, gates | Witch Way, One Moon, The Short Road | Shared within the Witch Way family only. Even there the same charm means different things, so decide that first |
| The ATB battle engine and its 1,000+ lines of choreography per character; keepsakes | Envoi | A different battle design from Aethermoor's, pinned by its own balance targets |
| Painting alignment, the Heart map built from the save, the Vigil, the Mode-7 flight | What the Map Forgot | Built around this game's story and grid |
| Airship combat: raider AI, waves and charts | the airship copies | Only these games fight ships |
| The paper pop-up engine | Art Farm (and What the Map Forgot's 3D copy) | Two users, both read-only to each other. Revisit when a third wants it |
| Herd behaviour and the rancher's job queue | The Ranch | Small. The job queue (`ranch-orders.js`) is clean and has no three.js in it, so it can be shared later if needed |
| All story, dialogue, maps, foes, items and art | every game | Content |

### Risks

**Balance.**
- **Aethermoor's numbers.** Aethermoor and Thareia take every number from `data/tuning.js` and the formulas in `rules/combat.js` and `battle.js`. These targets are tuned against them, so any change to a formula or to the order in which random numbers are drawn moves them:
  - Aethermoor's `tools/sim.mjs` targets (champions 30–40% first-try wipes and others);
  - Moonlight's `tests/balance.test.mjs` win-rate bands;
  - Thareia's Chapter 1 route targets.
- **Envoi's targets.** Envoi's `tools/balance.mjs` checks 40+ targets with fixed seeds and fails on a miss. Moving its engine onto a shared random-number module would change every seeded fight unless the draws happen in exactly the same order.
- **Tuned constants:**
  - Stranded's `MATE_YIELD` and difficulty knobs were tuned by its robot players.
  - Sunstone's strength rating was fitted to 75 measurements.
  - The airship copies' "How hard it is" notes came from `sim-fight.mjs`.

  Each must be re-run after any change that touches its game.
- **Fixed versus variable timestep.** A switch changes how things feel. Stranded's skill games already assume 1/60 s per frame, so they run fast on 120 Hz screens. Flight and walking eases tuned with `exp(−k·dt)` would change slightly.
- **The safe way:** extract with no change in behaviour first. Run each game's existing checks, and compare simulator output with the same seeds before and after.

**Saves.**
- **Never rename a save key or change a saved format.** Mooncart keeps each game's saves under that game's slot, and the game's own keys live inside the slot. The Mooncart rules already say never to change how slots are named. A shared save module must read and write each game's current keys and formats exactly:
  - `wtmf.save.v1`;
  - `follow-me-down-witch-way.save.v2` and its three other slots;
  - `aethermoor.save.m7`;
  - `envoi.save.v1` …;
  - `clearing.save.v1`;
  - `skies-of-aethermoor/save-1`;
  - IndexedDB `tinydominion`;
  - the rest listed in each game's detail file.
- **Versions.** Several games throw away a save whose version they don't recognise:
  - Envoi, Moonlight, One Moon and The Short Road refuse any `v` but 1;
  - Tiny Dominion refuses any version but 1.

  A shared layer that adds a field and bumps a version would silently wipe those saves.
- **Collisions that exist today:**
  - The airship game's main copy and polished share `skies-of-aethermoor/save-1`.
  - Aethermoor and Thareia save codes are both `AETH6.`, so a code from either loads into the other with no check.
  - Thareia's demo 2 still writes Aethermoor's `aethermoor.m7.started` and `aethermoor.settings.v1`. That was worked out from its patch lines and not run.
  - Starfall saves under the bare key `best`, which is safe only inside Mooncart's slot.
- **Cloud copies.** Saves in the claude.ai account sit at `data/users/<id>/wtmf_save` (What the Map Forgot) and `data/users/<id>/save` (the airship game). Published pages depend on those paths.
- **Upgrades that run on load:**
  - Aethermoor's v1→v6 chain;
  - Envoi's moves off the old world map;
  - Sunstone's v1→v2;
  - Witch Way's repair;
  - Stranded's backfill.

  These must keep running in the same order.

**Technical.**
- **Two three.js versions.** r128 globals (Envoi, Stranded, The Ranch, Art Farm) and r186 modules (Moonlight, Magpie, Skies, Thareia's airship view). A shared 3D module has to pick one, or keep two builds. Shader hooks differ between them.
- **Patches that reach outside the game:**
  - Witch Way patches `drawImage` for every canvas on the page and redefines `width`/`height` on images.
  - Envoi swaps `window.AudioContext` while a cutscene plays.
  - Moonlight and the Magpie page run two AudioContexts.

  These can't live alongside shared modules as they are.
- **File size:**
  - Aethermoor is 31.8 MB.
  - The Short Road is 29.6 MB and Witch Way is 29.1 MB, near the 30 MB send limit.
  - Thareia is 16.5 MB, over the 16 MB page limit.
  - Shared code bundled into each game adds to every one.
- **Offline.** Tiny Dominion, Aethermoor, Thareia and Stranded load Google Fonts from the internet, so a shared engine for Mooncart has to carry its own fonts. Mooncart already packs fonts into built-in games at build time.
- **The newest code is on unmerged side branches.** Extraction work done on main branches would land on old code. Mooncart builds the main branches, so today it ships:
  - Witch Way from before milestone 4;
  - Moonlight's demo pages, not the whole game;
  - Envoi's model benches, not the game.
- **Lore.** The Magpie and Moonlight place data includes Mother's Hollow, which Envoi's rules retire. Code can be shared; that content shouldn't go into Envoi.
