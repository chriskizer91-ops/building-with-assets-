## Envoi on the Longest Night

**What it is:** a JRPG. Io walks painted night maps traced into walk polygons. Fights are ATB battles (turn gauges that fill over time, ATB = active time battle) between 3D models built in code, set either in front of a flat painting or in a 3D "arena" with the painting behind. Between places she flies the Magpie over a 3D world map. Keepsakes, herbs, chapters, cutscenes, three save slots and a save code.
**Inventoried:** `envoi-on-the-longest-night` @ `origin/claude/send-note-gigdew` (`318bc96`), `final-pass-polish-october-5-2026/Envoi on the Longest Night - final polish.html`. The full file is 18,095,301 bytes, built minified with `node tools/build.mjs --min --offline putting-it-all-together/game.html`. The stripped file is 2,760 KB and 2,211 lines. The stripped source tree is 2,986 KB and 38,383 lines. **Line numbers refer to the stripped source files** (`source/src/...`, `source/putting-it-all-together/game.html`, `source/envoi-final-draft/items/items.js`). Where "full file L…" is written, it means the stripped single file.
**Tech:** three.js r128 (global `THREE`) for the battles, the flight and the models. 2D canvas for the walking maps, the mini-maps and the battle's painting layer. DOM for the menus, the dialogue and the cards. Plain scripts that each define a global (`window.BattleRules`, `Game`, `Field`, `MAPS`…), loaded in order by `game.html` (L16–75). The build concatenates and minifies them, with a `/* src/... */` marker per file (full file L393–2200). Outside libraries: three.js r128 and Google Fonts (IM Fell English, Atkinson Hyperlegible; `game.html` L9–11). The `--offline` build puts both inside the page (README). Inside the full file, full file L7 sets `window.ENVOI_TRY = {"steps":true,"words":true,"door":true,"buy10":true}`.

### Coverage
- **Read fully:** `battle/rules.js` 1–298, `battle/engine.js` 1–643, `battle/sound.js` 1–109, `game/state.js` 1–120, `game/field.js` 1–577, `game/fly.js` 1–226, `game/talk.js` 1–92, `game/goal-arrow.js` 1–35, `game/songs.js` 1–93, `game/story.js` 1–71, `game/world.js` 1–24, `game/stills.js`, `walk/painted-io.js` 1–95, `putting-it-all-together/game.html` 1–85, the repo's `putting-it-all-together/README.md`, `tools/balance.mjs`.
- **Nearly fully:**
  - `game/game.js`: 1–760 and 784–1078. Not read: 760–783, the ending's drawing.
  - `battle/screen.js`: read 1–245, 307–331, 332–372 (UI and keys), 484–570, 1691–1900, 1990–2003, 2138–2172 and 2240–2563. The choreography sections (570–1690, 1900–2137, 2172–2239) were mapped by function name and section header only.
  - `battle/sim.js`: 1–200 and 380–419. The play-style policies (200–380) were skimmed by their comments only.
  - `battle/chain.js`: 1–60. The rest by its comments.
  - `game/fights.js`: 1–180. The rest by grep.
  - `game/keepsakes.js`: 1–110. The rest by function names.
- **Skimmed:**
  - `game/maps.js`: header 1–60, `wickhollow` 62–116 and `cold-moor` 958–991. The other 19 maps by name only (data).
  - `game/script.js`: 1–40 plus its section list (placeholder words).
  - `items.js`: 1–40 and its end (data).
  - `game/thareia-audio.js`: 1–60 read. The rest diffed line by line against the 20-min library (see Shared-code clues).
  - `fx/arena.js`: 1–90, its section headers, 972–1000 and 1100–1143.
  - `fx/battlefield.js`: 1–45 and its pools.
  - `fx/battle-fx.js`: 1–22, 48–66, 93 and its function list. Also diffed against the reference demo.
  - `fx/io-spells.js`: header.
  - `models/witch.js`: 1–40, its section list, 1049–1075, 1173–1185 and 1412–1472.
  - The other 10 game models: headers only. `models/magpie.js`: header, and diffed against 20-min.
  - `stage/arena-river-glade.js`, `arena-eldergrove.js` and `warm-road.js`: read fully. `night-square.js`: header. The other stage files: not opened.
  - `game/sprites.js` (header and looks), `game/footsteps.js` 1–20, and the headers of `walk/pixel-io.js`, `walkers.js`, `painted-folk.js`, `on-foot.js`, `walk-content.js` and `walk-test.js`.
  - `bench/bench.js` 1–25, `battle/balance-page.js` 1–20, `game.css` 1–30 and `screen.css` (by grep).
  - `tools/game-test.mjs` 1–60 plus grep. The first lines of every other tool and of every final-pass check.
- **Diffed** (counts of unique trimmed lines):
  - the reference demo `envoi-ref-wraith/night-square-shadow-wraith.html` against `screen.js`, `battle-fx.js` and `sound.js`;
  - `envoi-ref-halcyon` (read 4251–4310);
  - the repo's `living-battlefields/field.js` against `arena.js`;
  - 20-min's `vendor/thareia-sfx/sounds.js` and `music.js` against `thareia-audio.js`;
  - 20-min's `src/actors/airship.js` against `magpie.js`;
  - Witch Way's `versions/path-polish/game/src/motion.js` and `sprites.js`, `game/src/input.js` and `walker.js` against `field.js` and `painted-io.js`.
- **Skipped:**
  - `models/originals/*` and `models/previous/*` (8,086 lines): headers only. `game.html` doesn't load them.
  - The bodies of `bench/stage-*.js`: bench pages, not loaded.
  - `balance-results.js` and `chain-results.js`: one generated JSON line each.
  - The RLE data line of `world-mask.js`.
  - The two cutscene bundles (full file L1560–2194, minified, 33 long lines). Their sources aren't in the stripped copy. Only 15 lines were peeked: they carry their own depth-of-field and bloom post-process.
  - three.js.

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| `battle/engine.js` | system | headless seeded ATB battle engine | 643 |
| `battle/rules.js` | system + balance data | curve and formulas, heroes, foes, herbs, XP | 298 |
| `battle/sim.js`, `chain.js` | system (tools that also run in the page) | balance simulator (3 play styles, targets); whole-journey simulator | 581 |
| `battle/screen.js` | system + presentation | battle screen: camera director, log playback, choreography, menus, main loop | 2,563 |
| `battle/sound.js` | system | synthesized battle music and sound effects | 109 |
| `game/game.js` | system + content | game shell: title, story flags, events, menus, shop, saves UI, flight, cutscenes | 1,078 |
| `game/field.js` | system | walking engine: polygon collision, tap-to-walk pathing, d-pad, camera, mini-map, encounters | 577 |
| `game/state.js` | system | save state, slots, save code, leveling | 120 |
| `game/fights.js` | system + content | fight configs, foe looks, arenas, keepsakes into the engine | 297 |
| `game/fly.js`, `world.js`, `world-mask.js` | system + data | flying the Magpie over the atlas, band mist | 252 |
| `game/talk.js`, `goal-arrow.js`, `keepsakes.js`, `songs.js`, `footsteps.js`, `sprites.js`, `stills.js` | systems | dialogue box, quest arrow, keepsakes, song streaming, footsteps, pixel townsfolk | 633 |
| `game/thareia-audio.js` | system (vendored) | 100 synthesized sound effects and 9 synthesized pieces | 651 |
| `fx/arena.js`, `battlefield.js`, `battle-fx.js`, `io-spells.js` | systems | living 3D arena, living battlefield over paintings, spell effects | 2,079 |
| `walk/painted-io.js`, `pixel-io.js`, `painted-folk.js` | systems | sprite walkers (painted sheet and code-drawn pixels) | 318 |
| `models/*.js` (11 loaded) | system + art recipes | 3D models built in code (Model Build Spec) | 14,478 |
| `game/maps.js`, `script.js`, `story.js`, `items.js`, `walk/walkers.js`, `stage/*.js` (17) | content | 21 traced maps, words, journey, 20 keepsakes, paper dolls, battle scenes | 2,087 |
| `models/originals`, `previous`; `bench/*`; `walk/on-foot`, `walk-test`, `walk-content`; `battle/balance-page.js`; results | demo and bench code, not loaded by the game | before/after models, bench pages, demo pages | 10,755 |
| `*.css` (5), `game.html` | presentation | styles, script order | 639 |
| **Total** | | | **~38,160** |

### Systems

#### Battle engine (headless, seeded ATB) — battles
- **Does:** Runs a fight between 1–2 heroes and 1–3 foes with no graphics. Each turn returns a log of events (`hit`, `heal`, `charge`, `trance`, `summon`…) for a screen to play back. Turn gauges fill in "wait mode": they stop while anyone acts or chooses. A queue of full gauges always serves heroes before foes. It carries the hero kits (Io's MP spells and summons, Sol's Heat and Sunburn), Trance, statuses (Bind, Sunder, Frost, Defend/Guard, Severed, Lured, Charmed), telegraphed charge moves, desperation moves, boss phases (Wrath, an open heart), retreats, fleeing, herbs and keepsake multipliers.
- **Main pieces:**
  - `rng` mulberry32 (L21–29), `create` (L31)
  - building units (L44–78), `hitFoe` (L120–148), `hitHero` (L153–175), `heal`/`healPct` (L176–192)
  - `rate`/`advance` (L195–223), `checkEnd` (L232–243)
  - `pickFoeMove` (L246–272), `targetFor` (L277–288), `useFoeMove` (L289–354), `foeTurn` (L355–381)
  - `options` (L387–443), `strike` (L447–465), `heroAct` (L477–535), `summonStrike` (L538–556), `heroTurnStart`/`afterHero` (L557–591)
  - public `turn`/`choose`/`tick`/`result` (L600–638)
- **Size:** 643 lines.
- **Depends on:** `BattleRules` (rules.js) only. No DOM.
- **Tangled with content:** needs some untangling. The generic gauge loop, damage pipeline and foe AI are clean, but hero-specific branches are hard-coded (`h.id === 'io'`/`'sol'`, Kestrel, Halcyon/Blackout, the Colossus's heart and canes in L130–146, L310–316 and L392–427).
- **Fingerprint:**
  - Turn order: real-time gauges, each fills at `1/atb` per second (Io 2.4 s, Sol 2.2, wisp 2.8, wraith 3.2, Noctara 2.8). Foes start at `rand()*0.25`; an ambush starts at 1. Bind ×0.5, Frost ×0.6, Charm ×0.5, Lured = 0. Heroes before foes (`nextReady` L594–599).
  - Hero hit: `n = base × 1.2^(L−1) × (1 ± U·0.25) × weak[el] × resist[el] × (Sunburn 1.35) × (Sunder 1.25) × (1+might) × keepsakeDmg × (open heart ×2) × tune`, then rounded, minimum 1 (L120–132).
  - Foe hit: `n = base × 1.2^(Lfoe−1) × swing × (Oath 0.7) × mul × dmgMul × dmgSolo × (1 + rage·turnsActed) × tune × (1 − 0.08·canesLost)`, then ×0.5 for Defend/Guard, ×0.6 while Lunara's Embrace is on, × the keepsake's `warnedMul` (L161–165).
  - Heal: `base × 1.2^(L−1) × swing` (L179).
  - **No dice** (rules.js L2). Trance fills by `damageTaken/maxHp × 1.35` and `+0.02` per hit dealt, and lasts 4 turns.
  - Foe AI: a weighted random pick. It never repeats a move three times running, honours `noRepeat`, `cooldown`, `hurt` thresholds and `minLevel`, and uses `below`+`once` desperation moves first.
  - Stalemate after 900 turns. Results: `win`/`lose`/`fled`/`retreat`/`stalemate`.

#### Battle rules and progression tables — stats/leveling, balance data
- **Does:** Holds every number as data, plus the curve helpers: `scale(L)=1.2^(L−1)`, `mpScale(L)=1.06^(L−1)`, `xpNeed`, `grows`, `herbPrice`. It defines the party's kits, the summons, 12 foe entries (with move `weight`, `charge`, `below`, `drain`, `frost`…), statuses, Trance, herbs, the Magpie upgrades and the wild reward.
- **Main pieces:** `HEROES` (L19–75), `TRANCE` (L81), `SUMMONS` (L84–91), `BRAMBLE_MOVES`/`COLOSSUS_MOVES` (L95–129), `FOES` (L136–241), `STATUS` (L243–248), `CARRY`/`HERBS` (L258–265), `xpNeed` (L278), `MAGPIE` (L283–287), `WILD_REWARD`/`BIG_BLOW` (L292, L295).
- **Size:** 298 lines.
- **Depends on:** nothing.
- **Tangled with content:** deeply tied. It is the content, but it is shaped as data an engine reads.
- **Fingerprint:**
  - Constants: `CURVE 1.2, SWING 0.25, MAX_LEVEL 20`; `TRANCE {taken 1.35, dealt 0.02, turns 4}`; `CARRY 99, START_HERBS 3, BATTLE_USE 1`; `WILD_REWARD 1.75`; `BIG_BLOW 450`.
  - Stats: HP, MP (Io only), Heat 0–100 (Sol: +20 per Attack, +10 per hit taken; Sunburn at 70 deals ×1.35 and burns 6% of max HP), the Trance gauge, and level 1–20.
  - XP curve: `xpNeed(L) = round(200 × 1.2^(L−1) × (L≤5 ? 0.8 : 1) × 1.02^max(0,L−3) × (L≥16 ? 2.7 : 1))`.
  - Magpie upgrades: 650, 2,300 and 4,500 shards at levels 5, 10 and 15.

#### Balance simulator and journey simulator — balance tools (in the page and in Node)
- **Does:**
  - `sim.js` plays any fight through the engine with three scripted play styles (`careless`, `sensible`, `expert`). It reports win, loss and flee rates, the fight's minutes (p10, median, p90), how often a fight runs close, and the foe HP a loss leaves. It checks 40+ `TARGETS` (win-rate ranges, and median minutes for the wild packs). It also defines the wild encounter tables (`BAND_PACKS`, `BAND_LEVELS`, the Colossus at 1 in 12 after 3 fights), which the game itself uses.
  - `chain.js` plays the whole journey (`story.js` PATH) carrying HP, MP, herbs, XP and shards. It models grinding, rests and lost gates.
- **Main pieces:** `BAND_PACKS` (sim L25–30), `wildPack` (L39–42), `BAGS` (L45–49), `FIGHTS` (L57–115), `TARGETS` (L119–156), `check` (L157–164), `economy` (L169–187), `POLICIES` (L238–380), `playOne`/`run` (L383–416). Chain: `run` (L13–), `runMany` (L147).
- **Size:** 581 lines (plus `balance-page.js`, 322, the demo page's UI).
- **Depends on:** rules, engine, story.js.
- **Tangled with content:** deeply tied. The targets and policies name specific foes and moves.
- **Fingerprint:**
  - `THINK 1.5` seconds of menu time per choice; `FLEE_LOW 0.42`.
  - Seeds: `seed*2654435761+97` per fight (sim), and `seed*7919+13` (chain).
  - `tools/balance.mjs` runs every target at n=1000 with fixed seeds, exits 1 on any miss, and can write `balance-results.js` and a report, so **it pins the balance numbers**. `tools/chain.mjs` prints the journey.

#### Battle screen (playback, camera director, choreography) — battles, rendering, camera, UI
- **Does:** Drives the engine one turn at a time and plays each turn's log. It splits the log into parts at `move`, `strike`, `trance`, `herb`, `charge` and `frostEnds`. Each part plays bespoke choreography (Io's moves, Sol's, Lunara's, Envoi's, or the wraith, wisp, Halcyon, Noctara, Bramble and Colossus tables). A model without its own choreography plays generically through `anyMove`, which lands the engine's blows at the model's `ACTIONS.hits` times.
  - A "camera director" frames each shot as a point on the painting plus a zoom.
  - The flat mode draws the painting into a 2D canvas behind a transparent WebGL canvas. The arena mode uses `makeArenaField`'s locked camera, and a shot is a crop of its frame.
  - It also handles menus with sub-menus and targets, a frame-rate cap, a sharpness setting, intros and endings, the end card with the XP bar and level-up, and test hooks (`window.__battle`).
- **Main pieces:**
  - camera math (L76–108), arena hookup and constants `ZK/ZMAX/BELOW` (L126–130), director `shot`/`shotAt`/`shotBoth`/`shotFit`/`shotField`/`applyCam` (L132–238)
  - `UI` (L333–483), clock (L484–492)
  - `newEngine`/`events`/`apply` (L534–652)
  - choreography (L653–1690), `anyMove` (L1695–1717), `chargeTurn` (L1729–1737), `playLog` (L1745–1783)
  - menus and `chooseCommand` (L1786–1852), `runTurn`/`updateBattle` (L1853–1880)
  - `intro` (L1885–), `showEnd` (L2138–2170), `arenaField` (L2244–2273), `frame` (L2279–2353), `pace` (L2355–2370), `init` (L2410–2521), `stop`/`sharpness`/`markup` (L2523–2560)
- **Size:** 2,563 lines.
- **Depends on:** engine, rules, sim (auto-play), `makeBattleFX`, `makeIoSpells`, `makeBattleSound`, `makeBattlefield` or `makeArenaField`, `window.SCENES` and `ARENAS`, the model factories through `cfg`, the DOM markup from `markup()`, and localStorage (`envoi.sharp`, `envoi.fps`).
- **Tangled with content:** deeply tied for the choreography (more than 1,000 lines per character). The director, clock, log playback, menus and `anyMove` are reusable.
- **Fingerprint:**
  - Loop: `requestAnimationFrame`, variable dt clamped to 0.05 s. A game clock adds hit-stop (`clock.stop`), slow motion (`scale`/`slowT`), `turbo`, and awaitable `wait`/`until`/`untilP(model, u)`.
  - Frame cap 30 fps by default (`PACE.cap`), with options 60, 45 or the screen's rate. It detects the refresh rate from the median frame delta.
  - Camera: smoothing `k = 1−e^(−rdt·cam.k)`, cam.k 3 by default (instant under reduced motion). Shake decays by `e^(−7·rdt)`. The view is clamped to the painting; in an arena the zoom is capped at ×1.5 of the widest (`ZMAX`), with a 14% mirrored strip below the painting.
  - Rendering: renderer pixel ratio = `min(DPR,2) × SHARP`, with SHARP 0.75 by default (1, 0.75 or 0.5). Additive materials are converted to light-only custom blending (`lightOnly` L24–33). Painting frame 1448×1086.
  - Keys: ↑/↓ move, Enter or Space picks, Escape or Backspace goes back (L367–372).

#### Game shell, story flags and progression — quests/story, menus, shops
- **Does:**
  - Story and travel:
    - Joins title → prologue → field ↔ battle ↔ flight.
    - The story runs on `st.flags` (party, magpie, lights, refit, envoi, charge, stoop, shipyard, upgrade2, ending) and `st.done` (events, `visit:`, `camp:`, `well:`).
    - `nextStep` derives the next quest goal from flags, and `wayOut` finds the exit toward it by breadth-first search over map exits (this feeds the golden arrow).
    - A scene player (`stagePlay`) mixes dialogue lines with stage directions: add, walk, face, focus, remove.
    - It runs set-fight events, wake-after-loss, wells, keepsakes, gifts, Ember Line nodes, rests (heal and save), Magpie upgrades and boarding.
    - It runs the cutscenes and hands each fight over to them: it monkey-patches `AudioContext` while one plays, to pause its sound when the page is hidden.
  - Menus and screens:
    - The menu tabs: Party, Herbs, Items, Moonlore, Saves, Settings.
    - The herb shop, with band-scaled prices and the keepsake discount.
    - The title screen: Continue, New, Chapters, Load and a pasted save code.
  - Sound: per-place ambience timers.
- **Main pieces:**
  - `OLD_WORLD` (L25–38), `LANDINGS` (L44–52), `CHAPTERS`/`chapterState` (L60–88), `UPGRADES` (L92–96), `AMBIENCE`/`MUSIC` (L99–126), `arenaFor` (L135–143), settings (L155–170)
  - `nextStep`/`wayOut`/`goalOn` (L282–334), `keepMagpieNear` (L341–350), `fromWorld` (L353–366)
  - `act` (L371–374), `scene`/`stagePlay` (L379–417), `goField`/`arrive`/`onExit`/`stepBack` (L422–470), `onEvent`/`wake` (L473–523), `onTalk`/`onSpot` (L526–561)
  - keepsakes (L564–609), `rest`/`upgrade` (L611–628), `board`/`flyNow` (L631–657), cutscenes (L671–710), `battle`/`wild` (L711–751)
  - `menu` (L784–809), the tabs (L812–880), saves UI (L886–946), `shop` (L949–983), title (L987–1067)
- **Size:** 1,078 lines.
- **Depends on:** almost every global: `GameState`, `GameFights`, `BattleScreen`, `Field`, `Fly`, `Talk`, `Keepsakes`, `MAPS`, `SCRIPT`, `ThareiaAudio`, `Songs`, `makeBattleSound`, `World`, `CUTSCENES`.
- **Tangled with content:** deeply tied. Story ids, flags and place ids are literal throughout. The `act()` lock, `stagePlay`, `wayOut`, the menu, shop and save UIs, and the ambience scheduler are reusable patterns.
- **Fingerprint:**
  - Time played: +1 per second via `setInterval`, skipped on the title and while hidden.
  - Autosave on every map change (`goField` L428), at rests, after every battle (L740) and at story points.
  - The four "polish to try" switches come from `window.ENVOI_TRY`.
  - Chapters: 5 starts (the start, gates 5, 10 and 15, the finale's foot).

#### Save and load — save
- **Does:**
  - Keeps three localStorage slots of JSON state and remembers the slot in use. The saved state holds level, XP, shards, HP and MP (null = full), herbs, flags, done, band, `where`, `rest`, landings, items, time, fights, wins, `seen`, `wilds`, `magpie` and `letters`.
  - Exports a checksummed text save code.
  - Owns the level-up (`gain`), `applyBattle`, `restore` and `fit`, plus out-of-battle healing and herb use.
- **Main pieces:** `KEY`/`keyOf` (L15–16), `fresh` (L22–28), `load`/`save`/`use`/`list`/`latest` (L29–37), `sum`/`code`/`fromCode` (L40–46), `maxHp`/`maxMp` (L51–52), `gain` (L56–67), `fit` (L71–74), `applyBattle` (L78–93), `healOutside` (L95–104), `useHerb` (L106–118).
- **Size:** 120 lines (plus the saves UI, game.js L882–946).
- **Depends on:** `BattleRules`, `Keepsakes.gear`.
- **Tangled with content:** needs some untangling. The slot and code machinery is generic; `fresh()` and the heal rules are this game's.
- **Fingerprint:**
  - Keys: `envoi.save.v1` (slot 1, kept from the single-save era), `envoi.save.v1.2`, `envoi.save.v1.3`; `envoi.slot`; settings in `envoi.settings`; battle `envoi.fps` and `envoi.sharp`.
  - Format: JSON with `v: 1`. `load` returns null for any other `v`.
  - Save code: `'ENVOI1:' + btoa(UTF-8 JSON) + ':' + base36(h)`, where `h=7; h=(h*31+charCode)>>>0`. Import strips whitespace and needs `v===1`, `flags` and `where` (L40–46). game.js refuses a code that names a map this copy lacks (L936).
  - Migration is shape-based, not by version:
    - `Keepsakes.migrate` turns an old `keepsakes:{io,sol}` into `items`.
    - `fromWorld`/`fromWorldAt` (game.js L353–366) move a save whose `where` or `rest` has `mode:'world'` to the nearest `OLD_WORLD` place open to that save (a camp's fire for a rest). It runs in `begin` (L1056) and `wake` (L519), and `whereOf` uses it for the title line.
    - Settings: the old `sound` value becomes music and sfx; `amb` defaults to `sfx` (L159–161).
  - Mooncart (`building-with-assets-/games.json` L8, L32–33): builds this repo with `node tools/build.mjs` into `dist/*.html`, and gives `reference/demos/*.html` the save prefix `envoi-ref-`. The game itself writes the `envoi.*` keys above.

#### Field: walking, collision, pathing, camera, encounters — maps/collision, walking/pathfinding, input, camera, minimap
- **Does:**
  - Walking: Io walks a 1536×1024-coordinate painting. She can stand where a point is inside any walk polygon, outside every block polygon and clear of people's 11×7 boxes, checked at x and x±6 (`canStand`). She slides along walls, steps over slivers up to 4 px, and slips round corners up to 14 px. Her speed eases as Path Polish's motion does, and her pace builds to a run (+50%).
  - Input: keys; a press held over 220 ms or moved over 12 px steers her toward the pointer; a tap walks her by BFS on a 12 px grid with a "pulled-straight" path, or by an A* search in 4 px steps on narrow ways. Tapping a person or a thing walks there and uses it. An 8-way one-thumb d-pad.
  - Story actors walk on scripted paths with camera focus.
  - Pieces of the painting ("fronts") are drawn over figures by base line, as y-sorted depth.
  - Exits, event rectangles, and random encounters from a map-px step counter that carries across maps.
- **Main pieces:** `freeAt`/`canStand` (L108–116), `buildGrid` (L118–123), `fineWay` A* (L129–159), `findRoute` (L162–193), `clearLine`/`straighten` (L195–209), pointer (L213–233), pad (L65–80), keys (L81–90), `things`/`near`/`useNear` (L237–260), `load` (L263–290), `gapNow` (L294–297), `step` (L314–396), stage actors (L398–434), `draw` (L436–518), `drawFront` (L520–529), `drawMini` (L541–557).
- **Size:** 577 lines.
- **Depends on:** `makePixelIo`, `makeFolk`, `opts.paintedIo`/`paintedFolk`, `GoalArrow`, map data shaped `{walk, block, front, exits, people, spots, wild, zoom}`, and the DOM.
- **Tangled with content:** clean. Everything arrives through `opts` callbacks and map data.
- **Fingerprint:**
  - Loop: `requestAnimationFrame`, dt clamped to 0.05.
  - Collision: union of polygons minus blocks. Grid `CELL 12` (128×86). Fine A* `FINE 4`, `FINE_MAX 20000`, 8 directions, no corner cutting. `REACH 58`, `SLIP 14`.
  - Encounter gap: `max(min, mean·(0.55 + roll·0.9)) / map.wild.rate`, with mean `770/settings.rate` and min `440/settings.rate` px (game.js L243). The roll is redrawn only after a fight or event.
  - Camera: hard follow with Io at 55% of the height, clamped to the painting; zoom = `ioScreen(0.15)·min(W,H)/ioH(52)·map.zoom/0.7`. A scene's focus eases with `1−e^(−3.2t)`.
  - Rendering: 2D canvas, DPR up to 3, the painting with smoothing off, then a vignette.
  - Keys: arrows or WASD move; Enter, Space or Z uses; Escape or M opens the menu.
  - Mooncart: arrows ✓, Enter=A ✓, Escape=B opens the menu (and is Back in battle and menus), M=START ✓ menu, H=SELECT unused. No gamepad.

#### Map data format and tracing — maps (content-shaped system)
- **Does:** Each of 21 maps is `{name, src, band, kind: town|wild|camp, start, walk:[poly], block:[poly], front:[{pts, base}], exits:[{rect, to, at, dir, label|say}], people:[{id, at, look, talk, role: shop|inn}], spots:[rest|well|event|look|magpie|node], land, wild:{band, scene, rate}}`. Helpers `ring`, `arc` and `lamp` (a block foot plus a front post).
- **Main pieces:** helpers (L32–38), lamp sets (L40–60), `MAPS` (L62–1103).
- **Size:** 1,105 lines (traced data).
- **Depends on:** nothing. Read by field.js, game.js and the tools.
- **Tangled with content:** it is content. The schema is reusable.
- **Fingerprint:** painting space 1536×1024 whatever size the image ships at; `to: 'world'` exits turn Io back with a line. Checked by `tools/check-maps.mjs` (reachability on field.js's own rule) and `tools/trace-overlay.mjs` (draws the tracing).

#### Sprite walkers (painted sheet, paper dolls, pixel stand-ins) — rendering, animation
- **Does:**
  - `makePaintedIo`: draws Io from a 6-frame × 4-direction painted sheet. Frames advance with distance walked (6.4 frames per body height). The cape ripples in 18 bands composed on an offscreen canvas. She breathes while standing, leans into the walk and into turns, and blends in and out of kneel and cast poses over the first and last 18%.
  - `makePaintedFolk`: the same style for the paper-doll sheets listed in `walkers.js`.
  - `makePixelIo` and `makeFolk`: 28×42 pixel figures drawn in code, 3 frames × 4 directions with west mirrored. They are stand-ins until the art loads, and the source of portrait heads.
- **Main pieces:** painted-io `ROWS` (L21), `walkPose` (L42–68), `draw` (L71–91). `sprites.js` `LOOKS` (L12–37), `makeFolk` (L38–).
- **Size:** 318 lines loaded, plus 149 for sprites.js.
- **Depends on:** a canvas 2D context and the image paths.
- **Tangled with content:** clean (art paths and row windows are constants).
- **Fingerprint:** breath `|sin(phase)|·0.25` while walking and `sin(2t)·0.35` while standing; cape window v 0.36–0.85, ripple 0.4 walking / 0.15 standing; lean rotation `lean·0.014 + turn·0.008` rad. Sheet 1536×1024 with 256 px cells, shipped at 3/4 size.

#### Flying map (the Magpie) — rendering (three.js), input, camera, minimap
- **Does:** Flies a 3D ship over a textured plane of the atlas (12 atlas px per metre, 384×256 m). It has a follow camera at 52° pitch and zoom, tap-to-fly and steering, a cold mist over closed bands (a canvas texture rebuilt when the open bands change), 26 drifting cloud sprites, landing banners, a "land here" card within 9 m of a stop, take-off and landing, and an RLE land-mask mini-map.
- **Main pieces:** constants (L13–14), `build` (L47–78), `fly` (L109–119), `step` (L125–166), `render` (L171–195), `drawMist` (L196–202), `drawMini` (L204–218).
- **Size:** 226 lines (plus `world.js` `bandAt` 24, and world-mask data).
- **Depends on:** `makeMagpie`, `World.bandAt`, `WORLD_MASK`, game.js callbacks.
- **Tangled with content:** clean.
- **Fingerprint:** cruise 4.5 m/s, altitude 7 m, turn 1.5 rad/s, ship scale 1.6. Speed eases by `dt·1.6`; dt clamp 0.05. Fog 120–260, rescaled to the camera distance. Keys: ↑ faster, ↓ slower, ←/→ turn, Enter or Space lands.

#### Dialogue box — dialogue
- **Does:** Typewriter text (2 characters every 18 ms × the speed setting; 0 = all at once). A portrait from a painted image or a pixel sprite's head scaled up ×4. Narration lines. Choice buttons (`ask` resolves an index). An optional auto-advance that waits `(1200 + 45·length)/√speed` ms.
- **Main pieces:** `setFace` (L27–42), `show` (L44–49), `shown` (L54–62), `tap` (L63–66), `say` (L70–78), `ask` (L79–88).
- **Size:** 92 lines.
- **Depends on:** `makeFolk` and the DOM.
- **Tangled with content:** clean.
- **Fingerprint:** a line is `[who, text]` or a plain string. Advance by tap, Enter, Space or Z. Reduced motion shows everything at once.

#### Quest goal arrow — UI/progression
- **Does:** Draws a bobbing golden arrow over the goal when it is on screen (over a person, over a place, or inside an exit pointing out). Otherwise the arrow orbits Io, pointing the way. The mini-map rings the goal.
- **Main pieces:** `arrow` (L15–22), `draw` (L23–33). The goal comes from game.js `goalOn` (L327–334).
- **Size:** 35 lines.
- **Depends on:** a canvas.
- **Tangled with content:** clean.
- **Fingerprint:** colour `#ffd36e`; the goal counts as in view when 28 px inside the edge; bob `sin(t/230)`.

#### Keepsakes (equipment) — gear/inventory
- **Does:** Twenty items, each with a main help and an "also" help, given as percentages (heal, hp, might, trance, heat, herbHeal, mp, mpBack, hpBack, regen, sunder, stoop, shards, herbPrice, glint, flee, bigBlows, frost). Each is worn by Io, Sol, or either.
  - `gear()` sums a hero's worn items; `party()` sums the party-wide helps.
  - fights.js `wearing` (L108–123) turns them into engine multipliers.
  - It draws the found card and the Items page, which never counts what is left.
- **Main pieces:** `migrate` (L19–25), `give`/`wear` (L32–43), `gear` (L50–55), `party` (L58–61), `card` (L99–), `show`/`showFound` (L120–153), `page` (L158–194).
- **Size:** 196 lines, plus `items.js` 218 (data).
- **Depends on:** `window.LOOT`, the DOM.
- **Tangled with content:** needs some untangling. The keys are generic; the word helpers are this game's.
- **Fingerprint:** save shape `st.items = {id: 'io'|'sol'|''}`. "The balance never counts on them" (rules.js L268–272).

#### Synthesized audio, three engines plus streamed songs — audio
- **Does:**
  - `sound.js`: a battle theme in D minor at 132 BPM (i–VI–VII–V, look-ahead scheduler of 0.12 s), plus 18 synthesized effects. Buses: master 0.6 through a compressor, sfx 0.9, music 0.3.
  - `thareia-audio.js`: the Thareia library. 100 effects (`SFX`, played by id with per-sound `LEVEL` normalisation), a convolver reverb from generated noise, and 9 note-sequenced pieces (`musicPlay`).
  - `songs.js`: loops Chris's two `.webm` songs through `<audio>`. They fade, keep their place, fall back to `fetch` and a blob, and are routed through Web Audio gain on iPhones.
  - `footsteps.js`: noise footfalls tinted by the ground underfoot (behind `ENVOI_TRY.steps`).
  - All of them suspend while the page is hidden.
- **Main pieces:**
  - sound.js: `init` (L15–23), `tone`/`noise` (L26–34), `S` (L35–66), `schedule` (L72–84), `setVolumes` (L93–98).
  - thareia-audio: `sfxInit` (L31–42), `route`/`envelope` (L46–), `playSfx`, `MUSIC`/`musicPlay`/`setVolume` (L370–650).
  - songs: `SONGS` (L18–21), `create` (L26–91).
- **Size:** 109 + 651 + 93 + 56 lines.
- **Depends on:** WebAudio and `<audio>`.
- **Tangled with content:** clean (the battle theme is hard-coded notes).
- **Fingerprint:** volumes run 0–1, with 0.75 = Normal (Music, Effects, Surroundings). Song levels: town 0.37, wilds 0.41. Fade 0.8 s.

#### Spell effects and the living battlefield — effects
- **Does:**
  - `battle-fx.js`: additive point pools in ring buffers, 3 pooled point lights, and a set of spell effects: ring, burst, slash, projectile (quadratic Bézier), blades, beam, sigil, tendrils, black sun, briars, spiral, geyser, converge, moonfall, shield.
  - `io-spells.js`: Io's newer heals built on it.
  - `battlefield.js`: per-painting air in front of a flat painting (mist sprites, fireflies, snow, sparks). Big blows send shockwaves and throw debris; roars put up birds or bats; a Wrath brings a red storm with rain and lightning.
- **Main pieces:** battle-fx `Pool` (L53–), pools (L93), `flashLight` (L97), `update` (L316), return (L333). battlefield `AIR` (L18–28), `pool` (L44–), pools (L67–124).
- **Size:** 334 + 373 + 229 lines.
- **Depends on:** THREE. battlefield takes `g(u, v)`, which maps a painting pixel to the floor.
- **Tangled with content:** needs some untangling (per-painting tables keyed by scene id).
- **Fingerprint:** battle-fx pools: sparks 480, embers 480, puffs 140, each a ring buffer (`next=(next+1)%n`). battlefield pools: debris 160, glows 140, fireflies set per painting, snow `480×snow`, rain 220 lines. `Math.random` throughout.

#### Arena (3D ground in front, painting behind) — rendering, effects, weather, camera
- **Does:** Builds a place from `ARENAS[id]` under one locked camera (frame 1448×1086 = the painting's size).
  - A shader "sheet" over the painting knows sky, far things and ground from the traced `sky` and `ground` lines. On the painting it drifts clouds, darkens it with rain and puddles, lights it with lightning, turns it red in a Wrath, cracks and scorches it with decals, and lets lamps go dark and come back.
  - A live layer in front: grass, heather or frost tufts with full-cover mipmaps; a framing tree; a Bogmire boardwalk over mirrored water; mist; fireflies; rain and snow; sky and ground bolts; birds and bats that roost and are startled.
  - Thrown debris has physics. Impacts, ripples, a vortex and glows are lit through shared shader uniforms.
  - `makeArenaField.view` gives the camera's numbers without building the arena, for the cutscene hand-off.
- **Main pieces:** seeded `rnd` (L29–30), camera (L55–91), air, glow and decal uniforms (L101–138), night colours (L140–153), textures (L155–), `grassMat`/`tufts` (L417–465), trees (L490–), boardwalk (L572–), mist (L678–), lights (L697–), rain (L735–), snow (L753–), lightning (L774–816), birds (L817–), particles (L845–867), debris (L868–894), `impact`/`roar`/`ripple`/`decal`/`glow`/`strike` (L914–965), `update` (L972–), api (≈L1090–1131), `view` (L1139–1143).
- **Size:** 1,143 lines, plus 8 arena places × ≈22 lines.
- **Depends on:** THREE and a place object. screen.js `arenaField` adapts its API (L2244–2273).
- **Tangled with content:** clean. Places are data, and the "shape of a place" is documented in arena-river-glade.js L3–15.
- **Fingerprint:**
  - Default camera `{h:2, z:18, pitch:4.2, fov:38}`; `ppm = FH/(2·dist·tan(fov/2))`.
  - The moon sits at 31%/17% of the frame.
  - Weather 'clear', 'rain' or 'storm' eases by `1−e^(−0.45dt)`. Lightning every 3–8 s in a storm.
  - Particle counts: drifting particles NPT 1100, debris NDB 140, rain 3,200, snow 2,200, birds 28.
  - RNG: a Lehmer LCG `seed*16807 % 2147483647`, seeded by a hash of the place id starting at 610091, so a place grows the same way every time.

#### 3D models built in code (Model Build Spec) — 3D models, animation
- **Does:** Each `make<Name>(opts)` builds a skinned three.js r128 character procedurally. Textures are painted on canvases with a seeded Lehmer RNG. Geometry is built from lathes, sheets and surfaces, merged into one skinned mesh per material. Skeletons are code-built (Io has 51 bones), with spring physics for hair, skirt, coat and hat.
- **Animation:** keyframed actions `ACTS` with smoothstep `kf` tracks per channel, sub-stepped at 1/120 s.
- **The common interface ("Model Build Spec"):** `{root, fx, animate(phase, wb, t, dt), play(name, force), ACTIONS (frozen {dur, hits[], cues[], hold, interrupt}), anchor(name, out), state, setFade, busy, action, progress, dash, guard()}`. A `detail` option of 0.5–1 scales segment counts.
- **Main pieces (witch.js):** textures (L26–), geometry helpers (L204–), merging (L270–), skeleton (L397–), skin weights (L436–), body parts (L483–880), bind (L881–907), effects (L909–), Trance (L977–), motion `ACTS` (L1049–1172), `play` (L1173–1178), `animate` (L1180–), `TIMES`/`ACTIONS`/`anchor`/`state`/`setFade` (L1412–1451), API (L1453–1471).
- **Size:** 11 loaded models, 14,478 lines: witch 1,472, sol 1,768, halcyon 1,651, colossus 1,480, envoi 1,379, bramble 1,310, noctara 1,301, wisp 1,266, wraith 1,158, lunara 1,137, magpie 556. Plus 8,086 lines of originals and previous versions, not loaded.
- **Depends on:** THREE only.
- **Tangled with content:** each model is its own art recipe. The interface is shared and cleanly separated: screen.js only uses `ACTIONS`, `anchor` and `play`.
- **Fingerprint:** Lehmer seeds per model (witch `hs=90210`; the originals of wraith 31337 and lunara 4711). Hit and cue times sit as fractions of each action. The game reads `ACTIONS[act].hits` through `anyMove`.

#### Battle scenes (flat paintings) — rendering data
- **Does:** `window.SCENES[id] = {image, width 1448, height 1086, fov, pitch, ppm 54, lamps, layout:{lights, occ (cutout polygons that write depth only), start}, summon, envoiAt}`. screen.js builds a matched perspective camera from them, point lights at the painted lamps, and depth-only cutouts (L77–103, L2421–2423).
- **Main pieces:** 9 scene files (`night-square.js` and others, ≈25 lines each).
- **Size:** ~210 lines.
- **Depends on:** screen.js.
- **Tangled with content:** data.
- **Fingerprint:** camera distance `DIST = (IH/2)/(PXM·tan(FOV/2))`. The Night square uses fov 12 and pitch 24.

#### Fight configs — battles glue
- **Does:** Turns a story kind ('first', 'wild', 'greatWraith', 'dawnroost', 'halcyon', 'finale') plus the party state into a battle-screen config:
  - where everyone stands (`PLACES`, or `ARENA_AT` in metres) and foe looks (`FOE_LOOK`);
  - the model factory `makeFoe`, and the party with keepsake multipliers;
  - a bag of at most one of each herb (`bagOf`);
  - the wild pack and level rolled through `BattleSim.wildPack`;
  - the arena place (`ARENA_OF`) and a random weather roll.
- **Main pieces:** `PLACES` (L18–25), `FOE_LOOK` (L31–42), `ARENA = true` (L56), `ARENA_OF`/`ARENA_AT` (L58–71), `inArena` (L75–81), `makeFoe` (L82–91), `partyOf`/`wearing` (L95–123), `config` (L142–), `colossus` (L278–), `WILD_SCENE` (L295).
- **Size:** 297 lines.
- **Depends on:** rules, sim, the models, `ARENAS`, `Keepsakes`.
- **Tangled with content:** deeply tied.
- **Fingerprint:** the pack, levels and weather are rolled with **`Math.random`** (L79, L149), not the engine's seed.

#### Misc utilities
- `el(tag, attrs, parent, text)` is copied into ≈8 files (screen, game, field, fly, talk, keepsakes, bench, balance-page).
- `inPoly` appears in both field.js L41 and world.js L12; `clamp`, `lerp` and `sm`/smoothstep are copied per file.
- `radialTex` and `canvasTex` canvas-texture helpers (screen L104, battle-fx L12–15).

#### Tests and tools beside it (repo `tools/`, `final-pass-polish-october-5-2026/checks/`) — self-checks
| Tool | Checks or simulates |
|---|---|
| `balance.mjs` | every `sim.js` TARGET at n=1000 with fixed seeds; exits 1 on a miss (pins the balance) |
| `chain.mjs` | the whole journey per play style: level, shards, grinding and losses per step |
| `game-test.mjs` (89 KB) | plays the built game headless (Chromium + SwiftShader) through steps: title, new, walk, controls, world, wilds, menu, saves (save code, slots, old world-map saves), scenes, save, wild, colossus, finale, keepsakes, songs, chapters. Functional only; it plays fights but pins no balance numbers |
| `arena-test.mjs` | the arena demo's fights headless, with weather and seed options |
| `check-maps.mjs` | every exit, person, spot, keepsake and arrival can be reached on field.js's own rule (grid, then fine search) |
| `trace-overlay.mjs` | draws walk areas, blocks, fronts, exits and people over a painting, for checking by eye |
| `walks.mjs` | measures each wild walk's length and fights against story.js `fights` |
| `try-test.mjs` | the four "polish to try" ideas (`ENVOI_TRY`) each work |
| `check.mjs`, `perf.mjs` | screenshot a model bench page; measure `animate()` cost and draw budget |
| `build.mjs` | concatenates, inlines `art/` paths as data URIs, `--min`, `--offline` (three.js and fonts inside), `--split`, keeps folders "beside" |
| `make-demos.mjs`, `make-try.mjs` | chapter demo pages; the try page |
| `compress.mjs`, `cut-sheet.mjs`, `walkers-index.mjs`, `keepsake-pictures.mjs`, `world-mask.mjs`, `import-models.mjs`, `art-page.mjs` | art pipeline: AVIF/WebP squeeze, paper-doll sheet cutter, walker index, keepsake thumbnails, atlas land mask RLE, model import from the reference demos, art-request phone page |
| `checks/battles/*` (13) | layout fits on 5 screen sizes, damage numbers don't overlap, the Kestrel Stoop framing, Lunara's spot, the expert play style never attacks into Warden's Vow, the level-up card with keepsakes, the frame-rate line, endings |
| `checks/game/*` (11) | chapter starts and rests, cutscene and hidden-page audio, Esc closes, keepsake refill, Moonlore when everyone is full, old world-map saves (crossroads, facing), set-fight flags saved before scenes, short screens, the title fits |
| `checks/walking/*` (3), `checks/tools/*` (7), `full-pass.sh` | arrivals face into the map, field fixes, no freeze when walking to the current spot; the build's guards, planted faults the game test must catch; runs the whole pass |

### Content
| What | Where | ~lines |
|---|---|---|
| Heroes' kits (Io: 15 moves, Sol: 15), summons, statuses, Trance | `battle/rules.js` L19–91, L243–248 | 80 |
| Foes: wraith, wisp, frost wisp, great wraith, 4 Bramble forms, Colossus, Halcyon, Noctara | `battle/rules.js` L95–241 | 150 |
| Herbs (5), the Magpie upgrades, XP curve | `battle/rules.js` L258–292 | 35 |
| Wild packs per band, band levels, fight setups, 40+ balance targets | `battle/sim.js` L25–156 | 130 |
| 21 traced walking maps (13 town and gate maps, 8 wilderness scenes) | `game/maps.js` L62–1103 | 1,040 |
| Journey (places, path, walk fight counts) | `game/story.js` L19–69 | 50 |
| Words: cast, townsfolk lines by flag, wells, keepsake words, gifts, scenes with stage directions (placeholders) | `game/script.js` L12–258 | 250 |
| 20 keepsakes with places and helps | `envoi-final-draft/items/items.js` L37–~213 | 180 |
| Chapters, landings, old world positions, upgrades, ambience and music per map, regions | `game/game.js` L25–128 | 100 |
| Fight placements, foe looks, arena assignments | `game/fights.js` L18–71, L295 | 60 |
| Battle scenes (9 flat) and arena places (8) | `src/stage/*.js` | 405 |
| Paper-doll index (19), pixel looks (11) | `walk/walkers.js`, `game/sprites.js` L12–37 | 55 |
| Air per painting; ground per map | `fx/battlefield.js` L18–28, `game/footsteps.js` L12 | 15 |
| Model action tables (keyframes, hit and cue times) | inside each `models/*.js` (e.g. witch L1070–1172, L1418–1423) | ~1,500 |
| Generated balance and chain results | `battle/balance-results.js`, `chain-results.js` | 4 |
| Synthesized music scores (9 pieces) and battle theme | `game/thareia-audio.js` ≈L500–640, `battle/sound.js` L70–84 | 160 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Battle stage CSS: light and dark tokens on `:root`, windows `--w1/--w2`, gold `#ffd66e`, IM Fell English for headings, Atkinson Hyperlegible for text | `battle/screen.css` | 165 |
| Game CSS: dark night `#05030c`, 3×44 px d-pad grid, mini-map (tap to enlarge), dialogue box, menus, shop, title, flight, Items page, large-text mode | `game/game.css` | 194 |
| Battle markup (canvases, windows, end card with XP and level-up) | `battle/screen.js` L2544–2560 | 17 |
| Battle windows: party status bars, gauges, banner, floating numbers, marker arrow, frost edge, red-storm sky | `battle/screen.js` L333–483, L239–306, L2388–2408 | 230 |
| Title, prologue card, ending stars, menus and shop UI | `game/game.js` L784–1067 | 280 |
| Keepsake card and Items page | `game/keepsakes.js` L96–194 | 100 |
| Mini-maps (field and flight), vignette, glints, goal arrow | `field.js` L467–557, `fly.js` L204–218, `goal-arrow.js` | 120 |
| Balance page, bench page and walk-test CSS | `battle/balance.css`, `bench/bench.css`, `walk/walk.css` | 195 |

### Shared-code clues
- **Path Polish (Witch Way), verified.** `walk/painted-io.js:1–2`: "Io walking the ground maps as Chris's Path Polish paints her (follow-me-down-witch-way, versions/path-polish/game: art/witch-walk-hd-v1.png, src/sprites.js and src/motion.js)". Compared with `follow-me-down-witch-way@origin/claude/bold-brahmagupta-amnclm:versions/path-polish/game/src/`:
  - Taken from `sprites.js`: the breath `.25/.35`, 18 bands, cape window `.36–.85`, ripple `.4/.15` and `gatherWeight`. painted-io L38, L46, L56–60.
  - Taken from `motion.js`: acceleration 0.12 and deceleration 0.10 with `tau = /3`, `turn *= exp(−dt/0.11)`, `lean = vx/speed`. field.js L337–344, L369–373.
  - Drift: Envoi composes the bands on an offscreen buffer to avoid seams; its easing is a single-step `1−e^(−dt/τ)` with no sub-slices or exact displacement integral.
- **Witch Way pad and walker, verified as reworked rather than copied.**
  - `game/field.js:63–64`: "(Witch Way's pad, follow-me-down-witch-way game/src/input.js)". The same pointer-capture pattern with lit arrows. The direction rule differs: Envoi takes an octant from `atan2` with a 12% deadzone; Witch Way uses a per-axis 0.38 threshold and `CONFIG.PAD_DEADZONE`.
  - `field.js:357`: "(Witch Way's walker.js, slide)". Witch Way slides on one axis only, 1 px steps up to `CORNER_SLIDE_PX`; Envoi slides in any direction, 2 px steps up to `SLIP 14`.
- **Path Polish footsteps.** `game/footsteps.js:3–4`: "Soft steps are Path Polish's footsteps (follow-me-down-witch-way, versions/path-polish/game/src/sound.js)". Not diffed.
- **Thareia sound library, verified.** `game/thareia-audio.js:1–3`: "Chris's sound library and music from the 20-min repo (vendor/thareia-sfx/sounds.js and music.js, read-only), joined unchanged into one plain script". Also `game.js:4`: "his library from 20-min everywhere else".
  - Diff: L12–368 equal 20-min `vendor/thareia-sfx/sounds.js` (352 lines) with these changes only: `export` removed; `VOL`, `FIX` and `playSfx(sound, t, gain, bus)` added; the hidden-page check added.
  - L370–651 equal `music.js` with the `import`/`export` removed, plus `VOL.music`, `setVolume` and visibility handling.
  - 20-min's `sounds.js` is identical to `New-game@origin/claude/tender-babbage-4wiplk:thareia/sfx/sounds.js`. So the "New-game Thareia sfx" lineage holds through the same file, though the header names 20-min.
- **Magpie model, verified.** `models/magpie.js:1–3`: "Chris's model from the 20-min repo (branch ccr-5afa0fa7-7ojc16, src/actors/airship.js … unchanged in shape and paint". 344 of 355 unique lines of `airship.js` appear in magpie.js. `game/fly.js:1`: "after Chris's world travel demo (reference/demos/the-magpie-over-aethermoor.html)". `fly.js:66`: "the painted night clouds (Chris's, from 20-min)".
- **Aethermoor (New-game).**
  - `walk/pixel-io.js:9–10`: "The layout follows the Aethermoor walkers (New-game, claude/cool-ptolemy-uc93gg, game/src/art/walkers.js) … The drawing itself is new."
  - `items.js:14–15`: "Several looks still borrow from Chris's Aethermoor relics (chriskizer91-ops/New-game, game/src/data/relics.js …)".
  - `models/originals/sol.js:4` and `models/originals/halcyon.js:4`: "Code-built three.js r128 model for Moonlight in the Aether". `models/noctara.js:1`: "Noctara the Starless, final boss of Moonlight in the Aether".
  - **Battle rules: no lineage found.** No d20, intent dice or turn ribbon anywhere in the battle code; rules.js L2 says "No dice". New-game's `game/src/rules/ai.js` rolls an "intent die"; Envoi's foes pick moves by weighted random and telegraph with `charge` instead.
  - Both use mulberry32 with the same constants (engine.js L20–29; New-game `game/src/core/rng.js:13` `0x6D2B79F5`). That is a standard algorithm, not proof of copying.
- **Reference demo `night-square-shadow-wraith.html`, verified.**
  - `battle/screen.js:1`: "The Night square demo's battle … rebuilt on the finished models". `battle/rules.js:3–4`: "Level 1 is the Night square demo's numbers".
  - Diff: 245 of the demo FX module's 251 unique lines (demo L2423–2737) are in `fx/battle-fx.js` ("Imported unchanged", L2–3). 54 of the 60 SND lines (demo L2739–2803) are in `battle/sound.js` (L1–2 "Imported unchanged … (its SND module)").
  - Only 185 of the demo battle block's 897 unique lines (L2316–3390) are in screen.js. What is shared: the game clock (demo L2890–2897 ≡ screen L485–491), the camera director's `shot`/`shotAt`/`shotBoth`/`shotFit`/`applyCam` core (demo L2388–2419, extended in screen L144–238 with arena ZK/ZMAX/BELOW and canvas painting instead of a CSS transform), UI menu rendering, and the loop's dt clamp of 0.05.
  - **The battle engine was not copied.** The demo keeps state inline (`B.w`/`B.e` L2923–2928), randomises damage by `rnd(0.93,1.07)` (±7%) with `Math.random`, and fills gauges by `dt/2.4` and `dt/3.2` inside the frame loop (L3230–3236). rules.js kept those numbers (Io 1400 HP, 120 MP, atb 2.4; wraith 4200 HP solo, atb 3.2, move weights 0.4/0.35/0.25, Eclipse below 35%, Trance 1.35/0.02).
  - The engine is new: headless, mulberry32-seeded, ±25% swing, a ×1.2 level curve, 2v3 fights, log events.
  - The Halcyon reference (`envoi-ref-halcyon`) is a model bench, not a battle. Its `applyCam` (L4266–4276) is a simpler variant with a fixed k=5 and a CSS transform.
  - Models: `models/witch.js:1` "Imported from reference/demos/night-square-shadow-wraith.html"; the originals say "Imported unchanged from reference/demos/…" (L1 of each).
- **Night square scene.** `stage/night-square.js:2–3`: "Imported from reference/demos/night-square-shadow-wraith.html, with the well's lantern traced …". Its layout starts with the same points as the demo's `LAYOUT` (demo L2316: `{"walk":[[70,615],[128,612],…`).
- **Living battlefields, verified.** `fx/arena.js:2`: "living-battlefields/field.js, which this is made from". 310 of arena.js's 980 unique lines are identical to the repo's `living-battlefields/field.js` (`makeLivingField`). Shared: `shows`, `groundBox`, `blade`, `tufts`, `boltMesh`, `emit`, `throwDebris`, `impact`, `roar`, `decal`, `glow`, `strike` and `cloudAtMoon`. field.js bakes a code-painted far view (`bake(renderer)`, its L464); arena.js uses Chris's painting with the live sheet. `fx/battlefield.js:2` cites `3d-model-new-character-ideas/bramble-horror/meadow.js` (not diffed).
- **Creature folders.** `models/bramble.js:1`: "From Chris's Bramble Horror bench … unchanged". `models/colossus.js:1`: "From 3d-model-new-character-ideas/bramble-colossus/colossus.js … keep the two alike".
- **Mooncart.** `building-with-assets-/games.json:8,32–33` builds this repo and adds `saveKeyPrefix: "envoi-ref-"` for the reference demos. The game's own keys are `envoi.save.v1*` and `envoi.*`.

### Notes
- **Chris's kept file isn't the default build.** Full file L7 switches on all four "polish to try" ideas (`ENVOI_TRY`: footsteps, auto-advancing words, a door sound, Buy 10). `game.html` leaves them off, and game.js reads them at L168–170.
- **Code that ships in the source tree but isn't in the game:** `src/bench/*` (2,027 lines), `models/originals` and `previous` (8,086), `walk/on-foot.js`, `walk-test.js`, `walk-content.js`, `battle/balance-page.js`. game.html doesn't load them. `sim.js` does ship in the page: the game uses `wildPack`, `formOf` and `wildLevel`, and screen.js auto-play uses `POLICIES`.
- **Duplicated systems:**
  - Level-up is done three times: `state.js gain` L56–67, `chain.js gain` L26–36 (the same logic) and `screen.js showEnd` L2150–2151, which replays `xpNeed` for the card and hard-codes Flame Bolt's 330 at L2164.
  - The `GROUND` tables are copied in footsteps.js and on-foot.js.
  - The battle's framing math is duplicated in the cutscenes' `player.js` (screen.js L121–125 says to change both).
  - Three separate rAF loops (field, fly, battle), each with its own dt clamp.
- **RNG is split.** The engine is seeded (`cfg.seed` or a random seed), but fights.js rolls packs, levels and weather with `Math.random` (L79, L149), and the encounter roll (field.js L282, L393–395) and all effects use `Math.random`. So a game fight can't be replayed from the engine seed alone. Arenas and models are deterministic through their own Lehmer seeds.
- **Saves have `v: 1`, but `load()` drops anything else, so there is no version upgrade path.** The migrations are shape-based (`Keepsakes.migrate`, `fromWorld`, settings). `OLD_WORLD` (game.js L25–38) and `fromWorldAt` exist only to migrate saves from before the wilderness scenes.
- **Risky globals.** Every module is a `window` global. The game's `playCut` swaps `window.AudioContext` while a cutscene plays (game.js L694–696). The test hooks `window.__battle` (screen.js L2493–2515) and `window.__game` (game.js L1074) ship in the page.
- **Leftovers.** maps.js says its scenes' `music` field "is read by nothing" (L25–26). The world mask and `World` are kept only for the flight's mist and mini-map (world.js L1–7).
- **Halcyon's retreat clamp.** The engine keeps a retreating foe at 1 HP (L135), and `checkEnd` ends the fight as `retreat` at a threshold (L236–239).
