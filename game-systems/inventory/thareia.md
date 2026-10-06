## Thareia (T2, stage 2, work in progress)

**What it is:** a phone-first pixel JRPG on Chris's Thareia/Aethermoor canon (airships, sunstone, the Ember Line), made by forking the engine of *Aethermoor: Hearth & Heirloom* (M7) and adding an airship layer (2D and three.js 3D), a mini map, a code-made sound and music library, and the Prologue (T1) plus Chapter 1, "The Rot's Roots" (T2).
**Inventoried:** `New-game` @ `origin/claude/tender-babbage-4wiplk` (`146a9ac`, 2026-10-01, "T2 stage 2 (work in progress): integration fixes so far and tools/e2e-t2.mjs"), `thareia/game/dist/thareia.html`. Full size 16,476,655 bytes; stripped 3,698 KB (3,786,957 bytes), 365 lines (line 19 is the 3.27 M-char bundle; line 11 is the 177 K-char CSS). Line numbers refer to the stripped source files under `stripped/thareia/source/thareia/game/src/` (written `src/…`) and `stripped/thareia/source/thareia/sfx/` (written `sfx/…`). The parent is Aethermoor M7 (branch `origin/claude/cool-ptolemy-uc93gg`, commit `49195c1`), stripped at `stripped/aethermoor/source/game/src/`.
**Tech:** DOM screens + 2D canvas (the inherited pixel-art "forge" draws into ImageData; painted WebP maps and backdrops as data URLs) + WebGL through **three.js r186** (npm `three` 0.186.0, `REVISION="186"` in the bundle) for the airship view only, with a 2D fallback. ES modules (ES2023) bundled by esbuild 0.28.2 into one IIFE (identifiers kept; full minify only when over 4 MB). Outside: three.js (bundled), Google Fonts (network `<link>`, inherited). Audio is all WebAudio synthesis (no sound files).

### Coverage
- **Read fully:** `src/core/save.js` (L1–173), `src/core/audio.js` (L1–118), `src/core/rng.js` (L1–28), `src/rules/sky.js` (L1–62), `src/data/thareia/sky.js` (L1–97), `src/ui/screens/sky.js` (L1–534), `src/ui/sky3d/webgl.js` (L1–23), `src/ui/sky3d/motion.js` (L1–49), `src/ui/sky3d/scene.js` (L1–181), `src/ui/world/minimap.js` (L1–109), `src/main.js` (L1–35), `src/art/painted-backdrops.js` (L1–12, blobs stripped), `src/ui/lib/keys.js` L1–30. **Every diff** between the Aethermoor and Thareia trees for the 41 changed files (all of core/, rules/, ui/, art/, root and data/ changes; the data diffs skimmed past the first ~15 lines where they are long content). `sfx/sounds.js` L1–120 and L228–352 (helpers, first three categories, batch-2 samples, exports, `playSfx`, LEVEL markers), `sfx/music.js` L1–90 and L200–266 (instruments, notation, the player), `sfx/entry.js`, `sfx/README.md`, `sfx/tools/build.mjs`, `sfx/tools/level.mjs`. Envoi's `src/game/thareia-audio.js` diffed section by section against `sfx/sounds.js` and `sfx/music.js`; 20-min's `vendor/thareia-sfx/*` (via `git show`) byte-compared and diffed. Repo docs: `thareia/game/ARCHITECTURE.md` (all), `design/10-t2-build.md` (all), `design/00-starting-point.md` (all), `design/09-t2-spec.md` headings plus §0, §3.4–3.5, §6. `tools/build.mjs` diff vs parent; `tools/sim.mjs` diff vs parent (first ~60 added lines); `package.json`.
- **Skimmed:** `src/ui/sky3d/ship.js` (L1–140 read; L140–411 structure only: function and part names), `src/data/thareia/*` (headers, export lines, entry counts), `src/data/thareia/c1-encounters.js` L27–40, `src/data/foes.js` L276–300 (the Hart), map sizes of the 15 new maps, `sfx/page.html` storage lines (L157–180), every test and tool file's header comments and test names (via `git show`), demo/demo2 READMEs, build-script headers, `demo2/tools/build.mjs` L100–112.
- **Skipped:** the 203 identical files (byte-compared only, not re-read: the Aethermoor inventory covers them); painting/cut/backdrop blobs (stripped); three.js inside the bundle; test and e2e bodies beyond their names; `design/01–08`, the lore compendium; `dist/thareia-t1.html`, `thareia-t2.html`.

### The fork: Aethermoor M7 → Thareia (`diff -rq` of the two `src/` trees)

| Folder | Identical | Changed | Only in Thareia | Only in Aethermoor |
|---|---|---|---|---|
| (root) `index.html`, `main.js` | 0 | 2 | 0 | 0 |
| `core/` | 4 (dice, freeze, input, rng) | 2 (audio, save) | 0 | 0 |
| `rules/` | 15 | 4 (cond, gauntlet, story, world) | 1 (`sky.js`) | 0 |
| `data/` (tables) | 19 (incl. `tuning.js`) | 10 (dialogue, encounters, foes, heroes, npcs, quests, relics, shops, skills, world) | 0 | 0 |
| `data/maps/` | 60 | 1 (index) | 15 (`bogmire-docks`, 14 `th-*`) | 0 |
| `data/thareia/` | 0 | 0 | 13 | 0 |
| `art/` | 10 | 4 (hero-looks, item-looks, map-sprites, scenes) | 1 (`painted-backdrops.js`) | 0 |
| `ui/` (top: app.js, css, card.js) | 5 | 3 (battle.css, card.js, world.css) | 1 (`sky.css`) | 0 |
| `ui/assets/` (paint 56/1/4, cuts 4/1/7, atlas-image 1/0/0) | 61 | 2 (the two indexes) | 11 | 0 |
| `ui/battle/` | 10 | 1 (stage.js) | 0 | 0 |
| `ui/lib/` | 7 | 3 (atlas-geo, carry-facts, items) | 0 | 0 |
| `ui/screens/` | 3 (atlas, party, settings) | 7 (aftermath, battle, codex, journal, newgame, title, world) | 1 (`sky.js`) | 0 |
| `ui/sky3d/` (new) | 0 | 0 | 4 | 0 |
| `ui/world/` | 9 | 2 (story-fx, view) | 1 (`minimap.js`) | 0 |
| **Total** | **203** | **41** | **48** | **0** |

Aethermoor has 244 source files, Thareia 292 (plus 5 binary WebP in `ui/assets/sky/`, not stripped). Thareia deletes nothing: it is the whole of Aethermoor M7 plus additions. Changed files add 932 lines and remove 589 (almost all of the removal is the old 511-line audio sequencer). New files hold 4,080 lines, of which ~1,400 are new engine code (sky rules, sky screen, sky3d, minimap) and the rest Thareia content and map data.

**How behavior differs, by subsystem** (from the diffs):
- **RNG** (`core/rng.js`, mulberry32 + FNV-1a seed hash, `fork(label)`), **dice** (`core/dice.js`), **battle engine** (`rules/battle.js`, `combat.js`, `ai.js`, `foe.js`), **stats/leveling** (`stats.js`, `progression.js`), **loot** (`loot.js`), **forge/party/gear/codex/autoplay/path/util**, **save migrations** (`migrate.js`, SAVE_VERSION 6), **balance constants** (`data/tuning.js`) and **input** (`core/input.js`, `ui/lib/keys.js`): **byte-identical**. Any battle formula or curve is Aethermoor's.
- **Save** (`core/save.js`): only the ten storage key strings changed, `aethermoor.*` → `thareia.*` (L21–30). Format, version (6), export prefix `AETH6.` (L116–118), import rules (accepts AETH1–6, L159–173) and error text ("That is not an Aethermoor save code", L163) are unchanged.
- **Audio** (`core/audio.js`): the old in-file note sequencer (511 lines, track strings, `freqOf`) is replaced by a 118-line facade over `sfx/sounds.js` and `sfx/music.js` that keeps the same API (`createAudio()` → `unlock/setEnabled/setMusicEnabled/sfx/music/duck`) and maps the old names onto the library (L22–50).
- **Story/conditions** (`rules/story.js`, `cond.js`): new effects (join as guest, leave, cut, note, key, kindle, go), new conditions (`heroLevel`, `key`), Thareia objective line, `dayShown`; old bounties and the Ladder switched off when `game.world === 'thareia'`.
- **Flow** (`rules/gauntlet.js`): `newGame` takes `heroes/at/hearth/origin`; `recruit()` for mid-story joins; guests excluded from `partyLevel`; a variant may hold its own relics.
- **World engine** (`rules/world.js`): story-gated cold Hearthfires (`coldUntil`, `coldTalk`).
- **UI framework**: `ui/app.js`, `ui/lib/dom.js`, `overlay.js`, `anim.js`, `keys.js` identical; changes are confined to screens (`world`, `newgame`, `title`, `battle`, `aftermath`, `journal`, `codex`), day-display gating (`card.js`, `lib/items.js`, `lib/carry-facts.js`) and two CSS blocks.

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| `src/core/` (6 files) | systems | RNG, dice, freeze, input (identical); save (keys renamed); audio facade (new) | 382 |
| `src/rules/` (20) | systems | battle, combat, AI, stats, loot, forge, party, migrate (identical, ~3,980); story/cond/gauntlet/world (changed, ~1,930); `sky.js` (new, 62) | 5,174 |
| `src/data/*.js` (29) | content | Aethermoor's tables with Thareia merges appended (heroes, foes, relics, skills, dialogue, encounters, quests, shops, world) | 8,580 |
| `src/data/maps/` (76) | content | 60 old maps (identical) + 15 Thareia maps (~1,013 lines) + index | 5,592 |
| `src/data/thareia/` (13) | content | Prologue and Chapter 1 scenes, NPCs, fights, quests, keys, objectives, zones, sky data | 1,623 |
| `src/art/` (15) | systems + content | pixel forge, recipes, foe/hero/walker/tile art (identical, ~14,200); hero/item looks, map sprites, scenes (changed); painted backdrops (new) | 18,433 |
| `src/ui/screens/` (11) | systems/presentation | screens; `sky.js` new (534) | 5,154 |
| `src/ui/world/` (12) | systems | world view, controls, dialogue, story FX, minimap (new, 109) | 3,696 |
| `src/ui/battle/` (11) | systems | battle stage, HUD, menus (stage.js changed by 1 line) | 3,087 |
| `src/ui/*.js\|css` (9) | framework/presentation | app shell, card, CSS; `sky.css` new | 3,185 |
| `src/ui/lib/` (10) | framework | DOM, keys, overlay, items text, atlas geometry | 1,170 |
| `src/ui/sky3d/` (4) | systems (new) | three.js scene, ship model, motion spring, WebGL check | 664 |
| `src/ui/assets/` (74) | assets | 60 painted maps (29.4 MB of WebP in src; the build keeps 15), 11 cut stills (1.6 MB), atlas image | 364 |
| `src/main.js`, `index.html` | boot | screen router | 47 |
| **Game total** | | | **~57,150** |
| `sfx/sounds.js`, `music.js`, `entry.js`, `page.html`, `tools/` | systems (new) | sound library (182 sounds), music engine (9 pieces), sound board | 1,048 |

### Systems
31 systems: 9 inherited unchanged, 11 inherited and changed, 11 new.

#### Inherited unchanged (identical to Aethermoor M7's `src/…`; see the Aethermoor inventory)
| System | Files (identical) |
|---|---|
| Seeded RNG (mulberry32) | `src/core/rng.js` (L10–27: `createRng`, `fork`, `getState/setState`) |
| Dice | `src/core/dice.js` |
| Battle engine, AI, statuses | `src/rules/battle.js`, `combat.js`, `ai.js`, `foe.js`, `data/statuses.js`, `data/tuning.js` |
| Stats, leveling, gear, party, forge, Codex | `src/rules/stats.js`, `progression.js`, `gear.js`, `party.js`, `forge.js`, `codex.js` |
| Loot | `src/rules/loot.js`, `data/rarity.js`, `affixes.js`, `items.js` |
| Auto-battle policy | `src/rules/autoplay.js` |
| Save migrations (v1→v6) | `src/rules/migrate.js` |
| Input (keyboard map, focus nav, overlays' key traps) | `src/core/input.js`, `src/ui/lib/keys.js` (KEYMAP L9–14: arrows/WASD move; Enter/Space/Z confirm; Esc/X/Backspace back; M menu; F fast. Mooncart arrows, Enter=A, Esc=B, M=START work; H=SELECT is not mapped) |
| Pixel renderer, world view parts, battle UI | `src/art/forge.js`, `recipes.js`, `foes.js`, `heroes.js`, `walkers.js`, `tiles.js`, `icons.js`; `src/ui/world/actors.js`, `camera.js`, `controls.js`, `dialogue.js`, `hud.js`, `loop.js`, `session.js`, `sheets.js`; `src/ui/battle/*` except `stage.js`; `src/ui/app.js`, `ui/lib/dom.js`, `overlay.js`, `anim.js` |

Fingerprints carried over unchanged (from `ARCHITECTURE.md`, which is byte-identical to Aethermoor's; code not re-read here): d20 + attack bonus vs Guard, nat 20 = Legend Strike (damage dice doubled), nat 1 = fumble, graze = miss by ≤3 for half damage, advantage/disadvantage 2d20; Initiative Ribbon by delay from DEX and weapon weight; foe intent die d6/d8/d12/d20 by tier; stats STR DEX CON INT WIS CHA; wipe = wake at last Hearthfire, lose 10% gold.

#### Save and load — save (changed)
- **Does:** guarded `localStorage` save of the whole game as JSON, with a backup slot, a "started" marker, read-only "earlier milestone" keys tried newest-first when no live save exists, settings, and copy/paste export codes (`AETH<version>.` + base64 UTF-8 JSON) with a `scrub()` that strips `<>` from every pasted key and value.
- **Main pieces:** keys L21–30; `loadGame` (L47–59), `saveGame` (L61–66), `backupGame/restoreBackup` (L73–87), `hasV1…readM6` (L89–100), `loadSettings/saveSettings` (L104–107), `exportCode` (L116–118), `export*Code` (L121–144), `scrub` (L149–154), `importCode` (L159–173).
- **Size:** 173 lines (`src/core/save.js`).
- **Depends on:** `localStorage`, `TextEncoder/Decoder`, `btoa/atob`; migration injected from `rules/migrate.js`.
- **Tangled with content:** clean (imports nothing game-specific).
- **Fingerprint:** keys `thareia.save.m7` (live), `thareia.save.m7.bak`, `thareia.m7.started`, `thareia.settings.v1`; read-only legacy keys `thareia.save.m6`, `.m5`, `.m4.5`, `.m4`, `.v2`, `.v1`. Save `version: 6` (written by `newGame`, `src/rules/gauntlet.js` L89), one live slot + one backup, saved on rests and after the world's first step (world.js; not re-read). Codes `AETH6.`; `importCode` refuses AETH>6 (L161). **Does it reuse Aethermoor's key? No:** every key was renamed (`aethermoor.save.m7` → `thareia.save.m7` etc.), so the two games' live saves do not collide in one browser or Mooncart origin. But the **code prefix is still `AETH6.`** and the version is still 6, so a Thareia code imports into Aethermoor M7 and an Aethermoor code into Thareia, with no check of which game made it (what happens then was not checked). Thareia's new state (`world: 'thareia'`, `roster[id].guest`, `flags.keys`, `flags.docks`, `flags.hired`) rides in version 6 with no migration step.

#### Audio facade — audio (changed)
- **Does:** keeps the old screens' audio API but plays the Thareia library: old sound names map to library ids (`OLD_SFX`, L36–43), old track names to the nine pieces (`OLD_TRACKS`, L24–27); any library id also plays directly. Silent until `unlock()` from a gesture; remembers the wanted track; fades music in over 0.9 s; ducks music to 35% for 2.2 s under `reveal-primal/heirloom`, `levelup`, `victory`; suspends the AudioContext while the page is hidden.
- **Main pieces:** `soundFor` (L46–50, rarity tier → reveal sound), `createAudio` (L53–118), `duck` (L61–68), `sync` (L69–77), visibility listener (L79–86), `blip` typewriter voices (`VOICES` L45, square tone L104).
- **Size:** 118 lines (`src/core/audio.js`), replacing Aethermoor's 511.
- **Depends on:** `sfx/sounds.js` (`SFX, sfxInit, sfxContext, playSfx, tone`), `sfx/music.js` (`MUSIC, musicPlay, musicStop, musicPlaying, musicGain`), imported by relative path `../../../sfx/` (outside `game/`).
- **Tangled with content:** clean.
- **Fingerprint:** music level 0.6 (L51); settings are on/off for effects and music only (no volume sliders); `TRACK_NAMES` = 9 pieces + 12 old names; `badNotes()` now always `[]` (L32).

#### Story effects and conditions — quests/story (changed)
- **Does:** adds Thareia effects to the dialogue runner: `{ join, guest }` (a guest joins at the top non-guest level + `HEROES[id].guestLevel`; a plain `join` on a guest makes her a member with XP raised to the hero's), `{ leave }` (the guest leaves with the gear she wears removed from inventory), `{ cut }` (painted still), `{ note }` (toast), `{ key }` (key item in `flags.keys`), `{ kindle }` (lights a fire), `{ go: {map, anchor} }` (move after the scene). `nextObjective` reads `TH_OBJECTIVES` first in a Thareia game; `dayShown` hides the day after flag `c1-pulse`; old bounties/Ladder return `[]` for Thareia. Conditions gain `{ heroLevel: n }` (the hero's own level) and `{ key: id }`.
- **Main pieces:** `src/rules/story.js` effect branches L200–211, `joinInto` (L217–234), `leaveFrom` (L236–244), `nextObjective` (L314–321), `dayShown` (L324), bounty guards (L358, L363); `src/rules/cond.js` L110–111, known-keys list L152.
- **Size:** ~80 added lines over 393 + 193.
- **Depends on:** `gauntlet.recruit`, `progression.grantXp`, `data/thareia/objectives.js`, `data/world.js` HEARTHS.
- **Tangled with content:** needs some untangling: `game.world === 'thareia'` checks and the `c1-pulse` flag name are hard-coded in engine code.
- **Fingerprint:** guests excluded from level checks; key items separate from inventory items.

#### Game flow: new game, recruits, guests — progression (changed)
- **Does:** `newGame` can start a different world: a starting line (`THAREIA_START = ['warden']`), position (`TH_START_AT`: `bogmire-docks` 24,17), first fire (`docks-lantern`), provenance text; it sets `world: 'thareia'` whenever the start position is not the old Great Hall. `recruit()` builds a joining hero at a level by granting XP. `partyLevel` skips guests. Spawned variants may carry their own relic list.
- **Main pieces:** `src/rules/gauntlet.js` `recruit` (L69–75), `newGame` (L80–102), `partyLevel` guest filter (L124), `healAll` exported for the e2e (L140), variant relics (L165).
- **Size:** ~25 changed lines of 578.
- **Depends on:** `data/heroes.js`, `data/world.js`, `progression.js`.
- **Tangled with content:** clean (content passed as parameters).
- **Fingerprint:** the world discriminator is inferred from `at !== START_AT` (L102), not an explicit option.

#### World engine: story-gated fires — maps/world (changed)
- **Does:** a Hearthfire with `coldUntil` stays cold while its condition fails and cannot be lit by a lock key; `coldTalk` opens a scene instead of the lock prompt.
- **Main pieces:** `src/rules/world.js` `entityState` L120–121, `interact` L387–391, `openLock` guard L495.
- **Size:** ~8 lines of 769.
- **Depends on:** `cond.check`, `data/encounters.js`.
- **Tangled with content:** clean.
- **Fingerprint:** the rest of the world engine (A* 4-way pathing, roamers, 400 ms idle tick, locks, fog/dark radius) is Aethermoor's unchanged.

#### World screen additions — walking/input (changed)
- **Does:** **corner slip**: when a held direction bumps a plain wall, the walker steps one tile sideways if that tile and the one beyond it in the held direction are open (prefers the side it slipped to last), so a diagonal boardwalk traced as a staircase walks with one key. Hands off to the airship on `open: 'sky:<flight>'` or `'sky:hire@<dock>'`; plays `go`, `key`, `cut`, `note`, `join/leave` events; shows a chest's paper (`note`); rest toast without the day; mounts the minimap; an e2e `train(level)` seam.
- **Main pieces:** `src/ui/screens/world.js` minimap mount L188–189, update L375 and L620, corner slip L567–576 and `slipDir` L597–607, event loop additions L749–774, sky hand-off L792–794, chest note L852–853, rest toast L888, `train` L1217–1233.
- **Size:** ~75 added lines of 1,255.
- **Depends on:** `rules/world.js` (`canWalk`, `move`), `story-fx.showCut`, `minimap.js`, `data/thareia/c1-keys.js`.
- **Tangled with content:** some (key-item names from `C1_KEYS`).
- **Fingerprint:** slip only when every event was a `turn` or a wall `bump` with no entity (L569).

#### Painted battle backdrops — rendering (changed + new data)
- **Does:** a backdrop key with a painting fills the whole battle screen as a CSS background (`.bt-painted`, see-through bands), and the stage canvas draws only the scene's ambient particles over a clear canvas (`paintedDrift`).
- **Main pieces:** `src/art/painted-backdrops.js` (L5–12: six keys, 960×720 WebP), `src/ui/screens/battle.js` L109 and L520, `src/ui/battle/stage.js` L417, `src/art/scenes.js` `paintedDrift` (L2132–2142), `renderBackdrop` hook L2144, `fawnrest-node` scene falls back to the Heartroot painter (L2066), `src/ui/battle.css` L645–652.
- **Size:** ~45 lines + 6 images (~1.1 MB base64).
- **Depends on:** `scenes.ambient`, `tools/backdrop-import.mjs` (writes the module).
- **Tangled with content:** clean.
- **Fingerprint:** painted keys: bogmire, eldergrove, fawnrest, fawnrest-node, mosswatch, verdant-wood.

#### Painted-map view additions — rendering (changed)
- **Does:** a map may draw another map's painting (`paint: '<old id>'`), so `th-*` copies reuse the old Verdant paintings; a `prop: 'node'` entity draws as the crystal node (white until `c1-node-cooled`, then gold; only its glow over a painted map); a sign with `prop: 'deer'` draws a grazing deer. Map sprites add NPC looks (Yara, Taela, Sedrin, Merryn, Aldric), the 48×64 `nodeProp` and `open-slab`, and nine hearth looks.
- **Main pieces:** `src/ui/world/view.js` L174, L184, L213–214, L238, L517; `src/art/map-sprites.js` NPC looks L45–53, object lists L1509–1558, `nodeProp` L2444–2480.
- **Size:** ~80 lines.
- **Tangled with content:** some (story flag name in the view, L213).
- **Fingerprint:** paintings at 32 px per tile, `PAINT_DENSITY` 2 (inherited).

#### Cut-scene and chapter cards — cutscenes (changed)
- **Does:** `showCut` shows a painted still (from `CUTS`) under a line with an "Onward" button, falling back to a drawn backdrop; adds the Prologue and Chapter 1 "To be continued" cards; region cards count only Codex relics.
- **Main pieces:** `src/ui/world/story-fx.js` `showCut` (L233–254), chapter-card branches (L299–315).
- **Size:** ~45 lines of 591.
- **Tangled with content:** deeply (card text inline).
- **Fingerprint:** 7 Thareia stills: crate-cracks, grove-pulse, guardian-wakes, node-cools, node-overheats, shard-glows, title-thareia.

#### Day and Codex display gates — UI (changed)
- **Does:** every day display (item provenance, deed rows, carry-over line, aftermath headers, rest toast, chapter card) checks `dayShown`; relics flagged `thareia: true` (Codex Nos. 75–78) are left out of the relic totals and show "No. 075" without "/ total". The Journal lists key items; the Codex has riddles and holder lines for the four new relics.
- **Main pieces:** `src/ui/card.js` (L126, L166, L177, L600), `src/ui/lib/items.js` (L48–50, `provenanceText` L190–199), `src/ui/lib/carry-facts.js` (L18–30), `src/ui/screens/aftermath.js` (L79, L86), `src/ui/screens/journal.js` (L340–349), `src/ui/screens/codex.js` (L116–148), `src/ui/lib/atlas-geo.js` (L169–172).
- **Size:** ~40 lines.
- **Tangled with content:** some.

#### Build pipeline — tooling (changed)
- **Does:** bundles `src/main.js` with esbuild, inlines CSS and JS into `src/index.html`, writes `thareia.html`, `thareia.artifact.html` and the delivery `thareia-t2.html`. A plugin rewrites `ui/assets/paint/index.js` at build time to include only the 15 Thareia paintings that exist; the size check counts paintings, cuts, sky art and painted backdrops apart from the game code.
- **Main pieces:** repo `thareia/game/tools/build.mjs` (123 lines): `TH_PAINT_LIST`/`onlyThareia` plugin, `WARN = 3.6 MB`, `FAIL = 4 MB`, `PAINT_FAIL = 32 MB`, `PAGE = 16 MB`, automatic fall-back to full minification.
- **Depends on:** esbuild, Node.
- **Fingerprint:** frozen list `['thareia-t1.html']`; the old game's other 45 paintings stay in `src/` but are not bundled (their maps draw from tiles).

#### Airship rules and sky data — airship/progression (new)
- **Does:** pure rules for who may land where and fly over what. `dockState` returns `{ ok, why }` with `why` one of story/from/route/licence/level/unknown: a story flight (`free: false`) lands only at its `to`; a hire flight needs flag `c1-skiff-rented` and may always land back at its own hire post; then the dock's `if`, its `license` list, its level (via `{ heroLevel }`), and on the world map whether the dock is known (`flags.docks`). `regionOpen` does the same for region paintings. `refusalLine` picks the flight's line for a refusal. The data maps each 1536×1024 region painting to a 512×512 square of the 1536×1024 continent painting.
- **Main pieces:** `src/rules/sky.js` `levelFor` (L21–25), `dockState` (L30–47), `regionOpen` (L49–58), `refusalLine` (L61–62); `src/data/thareia/sky.js` `SKY_REGIONS` (L27–31), `DOCKS` (L33–46), `SKY_MARKS` (L49–51), `FLIGHTS` (L53–70), `HIRE_FLIGHT` (L73–87), `toWorld`/`toRegion` (L89–97).
- **Size:** 159 lines.
- **Depends on:** `rules/cond.js` (`check`, `storyOf`, `flagsOf`).
- **Tangled with content:** clean rules; the flag `c1-skiff-rented` is hard-coded in `dockState` (L38).
- **Fingerprint:** licences `ticket | hire | own`; regions `verdant` (col 0,row 0, level 1) and `gloomfen` (col 0,row 1, level 36 for hire/own); five docks (bogmire, thornhollow, eldergrove, mosswatch, fawnrest); hire fee 10 gp, paid in dialogue (`{ pay: { gold: 10 } }` then `open: 'sky:hire@<dock>'`, `src/data/thareia/c1-dialogue.js` L25–26), the first flight prepaid by flag `c1-hire-ticket`. `toWorld = [col*512 + x/3, row*512 + y/2]`.

#### Airship flight screen — airship/rendering/input (new)
- **Does:** two travel layers. **Region at 1×**: the region painting under the ship, one painting px per CSS px; steer by holding a point (pointer) or arrows/WASD; turn rate capped, speed eases up and down; crossing a painting edge moves onto the neighbour region if `regionOpen`, else the ship is turned back with the flight's `edge` line; Land appears within 70 px of a landable dock. **World map**: the continent painting fitted to the screen; tapping a known, allowed dock auto-flies there (eased path with an arc) and lands. Docks draw lit, grey with a padlock and "Lv N", or grey "no licence". Landing writes `progress.pos`, `flags.docks`, `flags.hired` on a cloned game and returns to the world. The 3D scene draws the region when available; docks, target ring, motes, clouds and the off-screen arrow stay on a 2D canvas placed with `project()`; any 3D error or context loss drops to the 2D sprite (whose crystal glow mask and shadow are computed from the sprite's pixels).
- **Main pieces:** `src/ui/screens/sky.js` constants (L34–36), `flightFor` (L42–49), `mount` (L51–534): 3D/2D choice (L82–96), `buildShip` 2D sprite masks (L111–128), `dockNear`/`heading`/`camera`/`toScreen` (L132–170), captain lines (L173–187), input (L190–227), `setMode`/`pickDock`/`land`/`arrive` (L230–273), `update` (L280–326), `leanStep` (L328–338), `drawShipAt` (L340–353), `drawDock` (L357–377), `drawArrow` (L378–391), `drawRegionOverlay` (L393–424), `neighbours` (L426–435), `draw` (L436–485), `hud` (L487–497), test seam `window.__sky` (L500–511), loop (L513–524).
- **Size:** 534 lines + `src/ui/sky.css` 26.
- **Depends on:** `rules/sky.js`, `data/thareia/sky.js`, `data/maps` `anchor`, `sky3d/*`, five WebP imports (`ui/assets/sky/`), `ctx.audio` (`flight` music; `ship-takeoff`, `ship-land`, `sails`, `new-area`, `map-open`, `ui-error`).
- **Tangled with content:** clean (all lines from flight data).
- **Fingerprint:** rAF loop, variable dt clamped to 0.05 s (L516); HUD refresh every 0.2 s; `FLY_SPEED` 150 px/s, `AUTO_SPEED` 90 world px/s, `LAND_R` 70, `TAP_R` 26 CSS px; turn ≤2.4 rad/s, accel 140, decel 120 px/s²; camera clamped to the painting (L160–163); DPR ≤3 for the 2D canvas; keys arrows/WASD steer, Enter/Space land, M toggles world map; reduced motion removes bob, sway and motes; motes are an unpooled array (~30/s spawn chance, 1.4 s life, `Math.random`).

#### 3D sky scene — rendering (new)
- **Does:** the region painting as a textured ground plane (1 unit = 1 painting px), a perspective camera at FOV 30° tilted 15° from straight down, at the distance where 1 painting px = 1 CSS px at the look point, clamped by what the tilted view sees (the clamp opens on a side where a neighbour painting lies, for a seamless crossing). Up to three planes (current + neighbours), a soft radial shadow sprite offset from a north-west light by height, `project/unproject` for the 2D overlay, full disposal, context-loss callback. `webgl.js` probes WebGL2/1 once and honours `?sky=2d`.
- **Main pieces:** `src/ui/sky3d/scene.js` constants (L23–26), `createSkyScene` (L28–181): textures (L39–52), planes (L53–62), shadow (L65–74), `resize` (L87–95), `aimAt` (L98–112), `project/unproject` (L115–124), `setRegion` (L127–140), `frame` (L142–157), `dispose` (L169–178); `src/ui/sky3d/webgl.js` `hasWebGL` (L6–17), `skyMode` (L23).
- **Size:** 204 lines.
- **Depends on:** three.js r186 (WebGLRenderer, PerspectiveCamera, MeshBasicMaterial, Raycaster…), `ship.js`.
- **Tangled with content:** clean.
- **Fingerprint:** `SHIP_HEIGHT` 60, ship size 86 painting px, pixel ratio ≤2, `powerPreference: 'low-power'`, sRGB output, mipmaps + max anisotropy, clear colour `#0a1214`, no shadow maps.

#### 3D airship built in code — 3D models (new)
- **Does:** builds the skiff procedurally: the hull lofted from side and top outline tables measured on the turnaround sheet (`SIDE`, `TOP`), vertex-coloured planks and livery band, deck, rails, transom, a lathe furnace with four lathe crystals (emissive amber + additive glow sprites), two triangular wing sails bellied by barycentric weight with patches, fins, rudder, pennant. Toon shading with a 3-step gradient map and ink outlines by an inverted back-face hull pushed out along normals in a small shader. Two liveries. `update()` leans the `tilt` group, turns the rudder, fills sails and pulses crystals.
- **Main pieces:** `src/ui/sky3d/ship.js` outlines (L23–38), `section` (L53), `LIVERIES` (L56–65), `makeKit` (L68–140: `toon`, `ink` shader L83–94, `glow` sprites, `part`, tapered `tube`, `dispose`), `hullSide` (L144–172), `deckGeometry` (L175–192), `planks` (L195–204), `transomGeometry` (L207–214), `sailGeometry` (L217–245), `buildShip` (L247–411; not read past ~L305).
- **Size:** 411 lines.
- **Depends on:** three.js r186 only.
- **Tangled with content:** clean (livery colours as data).
- **Fingerprint:** model units: stern z −2.4 to bow z 2.7; ink colour `#12091a`; gradient steps 70/160/255; crystal glow `#ffc45a`/`#ffe39a`. Header L1–2: "a readable port of the ship builder in the player's page art-in/airship/the-magpie-3d.html (three.js r186)"; no crew on deck.

#### Ship lean spring — animation (new)
- **Does:** pure, node-testable damped spring (`Spring(k, d)`, integrated in fixed 1/120 s sub-steps) driving bank from turn rate and pitch from acceleration, plus a slow bob in level flight.
- **Main pieces:** `src/ui/sky3d/motion.js` constants (L34–37), `Spring` (L39–51), `createMotion` (L55–72).
- **Size:** 49 lines.
- **Depends on:** nothing.
- **Tangled with content:** clean; a good candidate for a shared engine.
- **Fingerprint:** bank spring k 60 d 8, pitch spring k 40 d 9; bank 0.55 rad per rad/s of turn, scaled by speed (0.35 + v/150), capped 25° (8° reduced motion); pitch −0.0012·accel capped 6°; bob `sin(1.3t)·3 + sin(0.7t)·1.5` px.

#### Mini map — minimap (new)
- **Does:** a corner button with a canvas showing the current tile map: walkable ground, stairs, water, solid, a thin edge line along paths, exits (green open / red sealed), NPCs, fires, unopened chests, encounters (red diamonds), signs, roamers, the objective (a gold star on its entity, or on the exit toward its map) and the player. Tap toggles a large centred view.
- **Main pieces:** `src/ui/world/minimap.js` `COL` (L10–13), `createMinimap` (L15–109), `draw` (L34–96), `star` (L97–102); CSS `src/ui/world.css` L397–408.
- **Size:** 109 + 12 lines.
- **Depends on:** `data/tiles.js` `tileOf`, `data/maps`, `rules/world.js` `present`; called from the world screen.
- **Tangled with content:** clean.
- **Fingerprint:** small view ≤150×110 CSS px at ≤4 px per tile, large ≤720×520 at ≤14; DPR ≤3; pixelated. The header says "press M" closes it, but no M binding was found (M is `menu` in `keys.js`).

#### Thareia sound library — synthesized audio (new)
- **Does:** 182 sound effects, each a small function of WebAudio voices: `tone` (oscillator with glide, vibrato, tremolo, filter sweep), `noise` (a shared 2 s noise buffer through a filter), `fm` (two-operator bell/metal), plus helpers (arp, bells, chord, thump, click, crackle, creak, whoosh, rumble, formant `voice`). Master chain: compressor (−16 dB, 4:1) and a convolution reverb from a code-generated 2.4 s impulse. `playSfx` plays a sound on its own gain bus scaled by a measured per-sound `LEVEL` table.
- **Main pieces:** `sfx/sounds.js` `hz` (L6–11), `sfxInit` (L15–26), `route` (L30–37), `envelope` (L39–50), `filter` (L52–59), `tone` (L61–69), `noise` (L71–75), `fm` (L77–84), helpers (L85–93, `voice` L231), categories (L98–332), `SFX` (L333), exports `tone, noise, fm, hz, rnd`, `withBus`, `sfxNodes` (L336–338), `playSfx` (L341–347), generated `LEVEL` (L351).
- **Size:** 352 lines.
- **Depends on:** WebAudio only; `Math.random` for variation.
- **Tangled with content:** clean (a catalogue: `{ id, cat, name, desc, play(t) }`).
- **Fingerprint:** categories and counts: Menus 10 (ui-cursor, ui-confirm, ui-back, ui-error, ui-open, ui-close, ui-page, ui-blip, ui-save, ui-buy), Battle striking 14, Battle statuses 12, Magic/aspects 12 (ember frost storm stone verdant tide radiant blight, heal, revive, surge-charge, surge-release), Loot and relics 10, Walking 10, Airship 10 (ship-takeoff, ship-land, sails, wind, crystal-flare, recharge, aether-storm, rope-creak, spyglass, serpent), Creatures 10, Music cues and places 12 (victory, defeat, boss, flee, quest, new-area, rain, thunder, campfire, river, bell, auros); batch 2: Weapons 10, Sunstone/Ember Line 10, Airship more 8 (crystal-cannon, hull-hit, deck-alarm, dock-clamp, grapple…), Towns 10, Nature 10, Creatures more 10, Battle more 10, Menus more 6, Story moments 8 (secret, chapter, nightfall, dawn, sedrin, lira…). The header (L1) and README still say "100 sound effects".

#### Thareia music engine — music (new)
- **Does:** pieces written as note strings (`"B4:1 D5:1 G5:2 r:1"`, `+` chords, `!` accents), chord-progression pattern builders (pads, arpeggios, bass, driving bass, stabs) and 16-step drum grids, played live by 25 code instruments built on the sound library's voices (strings, stab, pad, harp, flute, brass, choir, bell, glock, bass, pbass, kick, snare, hat, shaker, taiko, tom, crash, wind, heart, doum, tek, frog, reed). A lookahead scheduler queues notes; sections loop from `loop`. Each piece gets its own gain bus, reverb send and a tempo-synced echo.
- **Main pieces:** `sfx/music.js` `INST` (L9–48), `melody` (L52–60), `CH` chords (L61–65), pattern builders (L66–80), `PIECES` (L86–217), `MUSIC` (L219), `musicStop` (L223–228), `musicPlaying` (L229), `musicGain` (L231), `musicPlay` (L234–266).
- **Size:** 266 lines.
- **Depends on:** `sounds.js` (`sfxInit, tone, noise, fm, hz, withBus, sfxNodes`).
- **Tangled with content:** the engine and the nine scores share one file; easy to split.
- **Fingerprint:** nine pieces: travel "Over the Wilds" (92 bpm, G), battle "Break the Grip" (E minor), flight "Sunstone Wind" (D Lydian), title "Thareia (main theme)" (D), boss "The Holder Wakes" (C minor), town "Market Day" (F), ruins "Beneath the Stone" (A minor), marsh "Gloomfen Drift" (D Dorian), desert "Sunscorch Road" (96 bpm, Hijaz on D). Scheduler `setInterval` 60 ms with 0.3 s lookahead; echo 0.75 beat, feedback 0.38, low-pass 2.6 kHz; bus gain 0.9; stop fades 0.8 s. With an `OfflineAudioContext` (`o.ctx`, `o.until`) it renders in one pass for checking.

#### Sound board and level tool — tooling (new)
- **Does:** `sfx/page.html` (built to `sfx/dist/sound-board.html` by `sfx/tools/build.mjs` with esbuild borrowed from `../demo2/node_modules`) plays every sound and piece and records yes/no votes in `localStorage` key `thareia-sfx-votes` (L157, L170) and in the artifact's shared store through `window.claude.use('db')` (L173). `sfx/tools/level.mjs` renders each sound offline in Chromium (Playwright), measures the peak, writes `LEVEL` back into `sounds.js` between `// LEVEL: GENERATED` markers (targets: menus 0.22, walking 0.26, cues 0.34, default 0.32, loud set 0.5, quiet set ≤0.16; level clamped 0.4–16), then re-renders to report peaks outside 0.1–0.9.
- **Size:** 183 + 12 + 40 lines.

#### Chapter 1 balance sim route — balance simulator (changed tool)
- **Does:** `tools/sim.mjs --route=thareia-c1 [--early]` plays Chapter 1's main path on Auto from the T1 end state (fight route: dock fights won with Yara, hero level 2 with 63 XP; early route: level 1 alone) across seeds: one roaming pack per roaming map, rests at fires, retreat below half HP, Taela joining as the scenes do, three wipes then a grind level; prints the hero's level at five checkpoints against targets (Eldergrove 4/3, Heartroot 6, Mosswatch 7, before boss 9, after boss 10), the early grove-circle win rate and the boss's first-try wipe rate; exits non-zero on a missed target.
- **Main pieces:** repo `thareia/game/tools/sim.mjs` (+200 lines over the inherited 873-line sim): `C1_ROUTE`, `C1_POINTS`, `C1_GRIND`, `t1End`.
- **Depends on:** `rules/autoplay.js`, `gauntlet`, `story`, data.

#### Tests and end-to-end checks — tests (new + inherited)
- **Does:** `node --test` unit tests over rules and data (no DOM), plus Playwright e2e scripts that drive the built page at phone size and screenshot every step. Thareia added a guard file `test/old-world.mjs` so the inherited tests count only the old game's content. See the Tests and tools list below.

### Content
| What | Where | ~lines |
|---|---|---|
| Prologue scenes (26 nodes) and Chapter 1 scenes (101 nodes), after-fight and rest lines | `src/data/thareia/dialogue.js`, `c1-dialogue.js` | 1,029 |
| People: 34 NPC entries (Yara, Sedrin, Merryn, Aldric, Ranger Dael, Taela…) | `src/data/thareia/npcs.js`, `c1-npcs.js` | 113 |
| Fights: Prologue 5 entries; Chapter 1 26 fights, 9 fires, patrols; the Hart of Fawnrest (rotstag variant `guardian`, champion, 3 phases, relics rotwood-circlet + fawnrest-heartstone) | `src/data/thareia/encounters.js`, `c1-encounters.js`, `src/data/foes.js` (+145, Hart at L279–293) | 388 |
| Side quests S1–S4, S6–S9; 3 shops (consumables and gems only); key items; objective lines; zones and fire stands | `src/data/thareia/c1-quests.js`, `c1-shops.js`, `c1-keys.js`, `objectives.js`, `c1-objectives.js`, `c1-world.js` | 141 |
| Heroes Yara Dustwind (guest, airship captain) and Taela Greenmantle (half-elf druid, guest then member); `THAREIA_START` | `src/data/heroes.js` L96–148 | 51 |
| Taela's skills (root-snare, draw-the-rot, greenmantle…) | `src/data/skills.js` (+29) | 29 |
| Four relics, Codex Nos. 75–78, `thareia: true` (fawnrest-heartstone, th-crateknife, th-lightfingers, th-thornwreath) with item looks | `src/data/relics.js` L1379–1450, `src/art/item-looks.js` L286–293 | 81 |
| Sky regions, docks, flights | `src/data/thareia/sky.js` | 97 |
| 15 maps: `bogmire-docks` (48×32), traced `th-landing`, `th-fawnrest-node`, `th-fjords-cove` (48×32 each); 11 `th-*` copies keeping old rows and drawing old paintings (`th-thornway` 30×56 … `th-mosswatch-2` 12×12) | `src/data/maps/` | 1,013 |
| Paintings bundled: 15 map paintings (4 new), 7 new cut stills, 6 battle backdrops, 5 sky WebP (continent, verdant, gloomfen, skiff-top, skiff-rented) | `src/ui/assets/`, `src/art/painted-backdrops.js` | data |
| Inherited Aethermoor content, still bundled unchanged: 60 maps (45 of their paintings filtered out of the build, so those maps draw from tiles), all old foes, the old relics (Codex Nos. up to 74), old dialogue, quests, bounties | `src/data/*`, `src/data/maps/*` | ~13,000 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Title: "Thareia · Above Aethermoor", tag line, title painting with continent fallback, party sprites from the save; tag still reads "T1 · The Prologue" | `src/ui/screens/title.js` (TAG L21, L41–45, L89–98) | 15 changed |
| New game: "name your hero", "what you carry" (three starter weapons with new blurbs), the Bogmire opening lines over the docks painting | `src/ui/screens/newgame.js` (CARRY L27–30, LINES L293–296) | ~40 changed |
| Airship screen layout (full-bleed stage, top bar, captain line, buttons) | `src/ui/sky.css` | 26 |
| Painted battle background rules; minimap box | `src/ui/battle.css` L645–652, `src/ui/world.css` L397–408 | 20 |
| Theme, fonts (Alegreya Sans, Cormorant… from Google Fonts), palettes, card CSS | inherited unchanged (`theme.css`, `screens.css`, `card.css`, `forge.css`) | — |
| Ship liveries (first: wine/gold pennant; rented: blue-and-white band) | `src/ui/sky3d/ship.js` L56–65 | 10 |

### Tests and tools (repo `thareia/game/`, read by header and test names)
Unit tests (`npm test`), state vs Aethermoor's `game/test/`:
- New: `c1-art.test.mjs` (traced maps' rows/anchors/reachability, imported art), `c1-fights.test.mjs` (every Chapter 1 fight's XP, backdrop, flags; Taela; the boss), `c1-maps.test.mjs` (the `th-*` copies keep old rows, every spec id placed, in bounds, reachable), `c1-sky.test.mjs` (docks table, flights, `dockState`/`regionOpen` cases, the lean spring: right turn banks right, 25°/8° caps, settling), `c1-story.test.mjs` (every talk/speaker/flag real, line length, the chapter played through the rules from both Prologue ends), `thareia.test.mjs` (T1 maps, docks reachability, people, sky mapping, the Prologue through the rules; T2 cross-package items 7.1: maps, reachability, references, main path both routes, guest levels, sky, hire fee 0 then 10 gp, fights, a language guard), `old-world.mjs` (helper: the old content without Thareia's).
- Changed (to use `old-world.mjs` or new totals): `art-below`, `art-gloomfen`, `art-keys` (pinned art hashes), `data`, `frozen` (now `FROZEN = {}`: no file is pinned), `maps` (60-map checks), `migrate`, `paint`, `shell`, `story-data`, `ui-m6`, `ui-m7`, `world-art`.
- Identical: `battle`, `combat`, `core`, `forge`, `gauntlet`, `loot`, `m7-rules`, `party`, `rivals`, `road`, `statuses`, `story`, `toll`, `walk` (bot walks newGame → act1-complete per starter), `world`, `zip`, `helpers.mjs`, `fixtures/` (M2 v1 save fixtures and codes).

Tools:
- New: `e2e-t1.mjs` (the Prologue at 390×844, screenshots, can write a T2 start fixture), `e2e-t2.mjs` (Chapter 1 main path from `tools/fixtures/t2-start*.json` via the `__aethTest` seam, trains the party, rents and flies the skiff, refuses the Fjords, reaches the Chapter 2 card; fails on any console error), `e2e-sky3d.mjs` (3D view draws, ship visible by pixel diff, a right turn banks >5°, Gloomfen edge turn-back, world-map flight to Eldergrove; then `?sky=2d`), `backdrop-import.mjs` (paintings → `art/painted-backdrops.js`), `sky-assets.mjs` (sky paintings → WebP), `fixtures/t2-start.json`, `t2-start-early.json`.
- Changed: `build.mjs` (above), `sim.mjs` (Chapter 1 route, above).
- Identical: `e2e-battle`, `e2e-codes` (pastes every old save code), `e2e-flow`, `e2e-world` (fails on any `[audio]` warning), `dev-battle`(+entry), `gallery`(+entry/foes/items/below), `make-atlas`, `make-v1-fixtures`, `map-draft` (ASCII/PNG map lint), `map-shots`(+entry), `paint-import`, `paint-prompts`, `paint-refs`, `paint-sheet`, `zip`.

Demos (built before the game, one file each):
- `thareia/demo/` → `dist/thareia-walk-test.html` (4.5 MB): walk or fly the top-down skiff over the Gloomfen painting at several zooms, the hero rig at 1×/2×/3× (Aethermoor `49195c1`'s hero renderer copied and patched for scale), and the battle song "Herbal Decay" as an AAC file played with `new Audio()` (`demo/src/main.js` L255): the only recorded audio in the Thareia tree.
- `thareia/demo2/` → `dist/thareia-demo-2.html` (4.3 MB): Aethermoor `49195c1` patched by `tools/build.mjs` (each patch checked): the 16×24 party in a hand-traced 45×34 town-square painting, one fight in front of a full-screen painted backdrop, a level-12 start and "a save slot of its own".

### The sfx library in other repos
| Copy | Relation to `thareia/sfx/` @ 146a9ac |
|---|---|
| 20-min `origin/ccr-5afa0fa7-7ojc16` `vendor/thareia-sfx/` (commit `9ee829b`, 2026-09-30) | `sounds.js`, `page.html`, `entry.js`, `README.md`, `tools/*` byte-identical. `music.js` lacks `musicGain()` (Thareia added it later for its music ducking). Adds `NOTE.md`: "Copied unchanged from the New-game repo, branch `claude/tender-babbage-4wiplk`, folder `thareia/sfx/`". |
| Envoi `src/game/thareia-audio.js` (651 lines; stripped copy diffed) | Both files joined into one IIFE (no import/export) exposing `window.ThareiaAudio` (L650). Same 182 sounds, same LEVEL table, same 9 pieces; based on the 20-min copy (no `musicGain`). Additions: `VOL = {music, sfx, amb}` (L26) and `setVolume(music, effects, surroundings)` (L635–638: 0–1, 0.75 = library level, live music follows); `playSfx(sound, t, gain, bus)` (L356) with an `'amb'` bus on the surroundings volume; `FIX.noise` (L30, off by default: loop the noise buffer so long noisy sounds are not cut at 0.5–2 s); `sfxInit` does not resume while the page is hidden; a visibility listener (L643–) that suspends and resumes only what it stopped and skips offline contexts. Music buses start at `.9 * VOL.music`. |

### Shared-code clues
- `src/core/save.js` L27: `const KEY_LIVE = 'thareia.save.m7';` (Aethermoor: `'aethermoor.save.m7'`), and the milestone history kept verbatim in L8–19 ("the M2 page still plays from it").
- `src/core/save.js` L163: `'That is not an Aethermoor save code. Codes start with AETH and a number, like AETH6.'`; `src/rules/migrate.js` L34: `'Not an Aethermoor save'`.
- `src/main.js` L33 and `src/ui/screens/sky.js` L500: the test hook is still `globalThis.__aethTest`.
- `src/core/audio.js` L1–2: "Thareia's sound library (../../../sfx/sounds.js, 182 sounds made in code) and its music (../../../sfx/music.js, 9 pieces made in code) live behind them."
- `src/ui/sky3d/ship.js` L1–2: "a readable port of the ship builder in the player's page art-in/airship/the-magpie-3d.html (three.js r186)". The airship-game repo's CLAUDE.md (session context, not read here) names the Magpie as the model its ships are built from, with hulls from side and top outlines, the same method as `SIDE`/`TOP` here (L23–34).
- Repo `thareia/game/package.json`: `"description": "Thareia, a browser airship JRPG … (forked from Aethermoor: Hearth & Heirloom)."`; fork commit `cd1f7dc` "fork the Aethermoor game engine into thareia/game … Own name, title, save keys (thareia.*)".
- `thareia/game/ARCHITECTURE.md` is byte-identical to Aethermoor's (git blob `c9816e7`): title "Aethermoor: Hearth & Heirloom — Architecture", save table of `aethermoor.save.*` keys.
- Envoi `src/game/thareia-audio.js` L1: "Chris's sound library and music from the 20-min repo (vendor/thareia-sfx/sounds.js and music.js, read-only), joined unchanged into one plain script".
- `thareia/demo2/tools/build.mjs` L105: `["const KEY_LIVE = 'aethermoor.save.m7';", "const KEY_LIVE = 'thareia.demo2.save';"]`; demo READMEs: art "taken from commit `49195c1` (branch `claude/cool-ptolemy-uc93gg`)".
- `sfx/tools/build.mjs` L3: imports esbuild from `../../demo2/node_modules/`.

### Notes
- **A full fork, not a module split.** Thareia keeps all 244 Aethermoor files and every old content table, and adds its content by merging `data/thareia/*` into the old tables. Engine fixes in either game must be copied by hand: 203 files are still byte-identical today.
- **Save keys do not collide with Aethermoor, but the codes do.** The live key and settings key are `thareia.*`. The `AETH6.` code prefix and version 6 are shared, so a code from either game loads in the other with no game check. The six read-only legacy keys (`thareia.save.m6` … `thareia.save.v1`) were never written by any Thareia build, so the "carry over an earlier save" path is dead code. The world tag `world: 'thareia'` is inferred from the start position (`gauntlet.js` L102).
- **Demo 2 shares two Aethermoor keys.** Its patch renames only `KEY_LIVE` and `KEY_BAK`, so `aethermoor.m7.started` and `aethermoor.settings.v1` stay Aethermoor's. A demo-2 save sets Aethermoor M7's "started" marker in the same browser, and the two share settings (inferred from the patch lines and the M7 `save.js` key list in the diff; not run).
- **Size:** the page is 16.48 MB, over the 16 MB claude.ai page limit; `10-t2-build.md` says the game code is ~3.9 MB, near the 4 MB build limit (three.js r186 added ~0.5–0.7 MB). This is three.js r186, not the r128 inlined in Chris's other three.js games.
- **Stale labels:** title tag "T1 · The Prologue" in the T2 build; `sounds.js` header and README say 100 sounds (there are 182); the minimap header promises an M key that is not bound; `frozen.test.mjs` pins no file although `build.mjs` lists `thareia-t1.html` as frozen.
- **Hard-coded story flags in engine code:** `c1-skiff-rented` (`rules/sky.js` L38), `c1-pulse` (`rules/story.js` L324), `c1-node-cooled` (`ui/world/view.js` L213).
- **Determinism is kept:** the new rules (`rules/sky.js`) are pure; `Math.random` appears only in UI effects (sky motes) and in the audio library's sound variation.
- **Known open issues from `10-t2-build.md`:** solo fights won 71–92% first try; the boss's first-try wipe rate is ~30%; 2–5% of sim runs never beat it in eight tries; gear shops missing (the engine sells only consumables and gems).
