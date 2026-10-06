## Tiny Dominion

**What it is:** A god game: sculpt and paint a tile world (height, water, climate, sea level, riches). Four peoples (humans, elves, dwarves, orcs) found realms that rise through nine ages from Stone to Space, run by rulers who weigh their options every year. Includes disasters, wars, trade, wonders and rockets.
**Inventoried:** `different-ideas-` @ `origin/ccr-2caac74a-av649o` (`ca7f11a`), `Tiny_Dominion.html`. Full size 528,254 bytes, stripped 515.9 KB (the same bytes: there is no base64 and no line is longer than 342 chars), 9,172 lines. Line numbers refer to the single file `Tiny_Dominion.html`. `tools/build.mjs` builds it from `src/js/NN-*.js`, and each source file starts at a `/* ===== NN-name.js ===== */` marker. Each system below names its source file, but the line numbers are always single-file ones.
**Tech:** Two renderers. WebGL2 is the default ("HD"): a fullscreen terrain fragment shader, instanced sprites from a procedurally drawn atlas, a night light map, and a 3D relief view. The fallback is a "Classic" 2D canvas renderer. A 2D overlay canvas carries labels and effects, and the UI is DOM. All JS sits in one `'use strict'` IIFE (L290–L9169) with module-level globals shared across the concatenated files. There are no outside JS libraries. The only external load is the Google Fonts "Pixelify Sans" stylesheet (L7–L9). Audio is pure Web Audio.

### Coverage
- **Read fully:** L1–L4235 (CSS, HTML, 00-core through 70-render2d, plus the atlas header, colour, primitives and the start of the building kit), L4334–L4400 (atlas packing and helpers, start of houses), L5609–L5720 (atlas people), L5937–L5993 (atlas deposits), L5993–L9172 (72-gl through 90-boot). Also read with `git show`: `tools/build.mjs` (whole) and `README.md` (first 80 of 114 lines).
- **Skimmed:** the atlas art recipes in L4236–L4333 and L4401–L5608 (gable, hip, cone, dome, then houses, tall buildings, halls, temples, civic, misc, wonders, nature) and L5721–L5936 (creatures, vehicles, effects, extras). For these I listed the definitions with awk, grepped the `add('name'…)` frame names (110 `add(` calls) and the `GENS.push` lines, and sampled L5133–L5140, L5268–L5290, L5405–L5410 and L5875–L5880. They are pixel-art drawing recipes (content), not logic.
- **Skipped:** `dist/tiny-dominion.html`, which `tools/build.mjs` builds from the same sources as an "artifact flavour" copy. I didn't compare it. The original version I only grepped, plus three short peeks (original L1545–L1550, L1590–L1600, L1640–L1660). I ignored the side branch `claude/friendly-curie-5h7j1p`, as told.

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| L1–L9, L220, L288–L291, L9169–L9172 | presentation | head, font link, script wrapper | 15 |
| L10–L219 (`src/style.css`) | presentation | CSS tokens (light/dark), HUD, dock, sheets, charts, banner | 210 |
| L221–L287 (`src/body.html`) | presentation | canvases, HUD, sheet, banner, veil, dock sliders | 67 |
| L292–L492 `00-core.js` | content + systems | terrain table, species, prefs, names, rulers, traits, ages, techs, wonders, building costs (~125), settings, state, RNG, noise, helpers (~75) | 201 |
| L493–L769 `10-world.js` | systems | arrays, flood regions, setTile, tile colours, world gen, rivers, seeding | 277 |
| L770–L1259 `20-units.js` | systems | units, spatial grid, movement, flow fields, animal AI, combat, siege, caravans, dragon, nomads, ships | 490 |
| L1260–L1823 `30-civ.js` | systems | kingdoms, villages, buildings, street planning, walls, capture, settlers, wonders, village economy | 564 |
| L1824–L2094 `40-rulers.js` | systems | relations, war, peace, alliance, secession, succession, yearly step, space, bombers, trade fleets, history record | 271 |
| L2095–L2553 `45-mind.js` | systems + content | temperament, memory, goals, utility-scored yearly council, whispers; SAY phrase tables (~60) | 459 |
| L2554–L2674 `47-riches.js` | systems + content | 8 resources: placement, ownership, effects, wants | 121 |
| L2675–L2882 `50-nature.js` | systems | fire, tile ticks, migration, disasters, twisters, towers, scheduler, `step()` | 208 |
| L2883–L3199 `55-terra.js` | systems | height bands, biome rules, sculpt brushes, rivers, sea step, storms, metres readout, water flow, blank worlds | 317 |
| L3200–L3344 `57-climate.js` | systems | carbon, warming, ice melt and growth, sea goal, summits, god climate | 145 |
| L3345–L3489 `60-powers.js` | systems | god-power brushes, strike, blast, stir war or peace, inspect | 145 |
| L3490–L3551 `68-gfx.js` | presentation | canvases, camera clamp, resize, day clock, renderer switch | 62 |
| L3552–L4035 `70-render2d.js` | presentation | classic 2D renderer, vector building and unit drawing, effects, minimap, labels, bubbles | 484 |
| L4036–L5992 `71-atlas.js` | presentation engine (~330) + art recipes (~1,625) | procedural pixel-art atlas: primitives, building kit, shelf packer; recipes for every sprite | 1,957 |
| L5993–L6553 `72-gl.js` | presentation | GLSL shaders (terrain, smog, cloud, dark, sprite, light), GL setup, data textures | 561 |
| L6554–L7074 `73-scene.js` | presentation | sprite lists, season foliage tint, scene collection, `glFrame`, overlay, GL minimap | 521 |
| L7075–L7163 `74-ambient.js` | presentation | birds, fish, whales, fireflies, rain and snow particles | 89 |
| L7164–L7479 `75-relief.js` | presentation | 3D tabletop view: mesh, bake, water, billboards, orbit camera | 316 |
| L7480–L8035 `80-ui.js` | UI + content | toasts, banner, HUD, realm and mind pages, sheets, settings, tool catalogue (~72), input, keys | 556 |
| L8036–L8172 `81-history.js` | UI | history tiles, log-scale population chart, climate chart | 137 |
| L8173–L8263 `82-camera.js` | systems / UI | glide, follow, cinematic director, brush cursor, building names | 91 |
| L8264–L8901 `85-audio.js` | systems | Web Audio graph, ambience beds, 27 sfx recipes, generative music | 638 |
| L8902–L9079 `86-save.js` | systems | IndexedDB slots, snapshot and restore, autosave | 178 |
| L9080–L9168 `90-boot.js` | systems | seed hash, presim, new world, rAF loop, boot, `window.__td` | 90 |
| **Totals** | | simulation ≈ 2,990 · data tables ≈ 205 · render engine ≈ 2,360 · art recipes ≈ 1,625 · UI ≈ 785 · audio ≈ 640 · save + boot ≈ 270 · CSS/HTML ≈ 290 | **9,172** |

### Systems

#### Game loop and fixed-step timing (`90-boot.js`, `50-nature.js`) — core
- **Does:** `frame` runs on rAF and clamps dt to 100 ms. It adds `dt*speed` to an accumulator and runs `step()` once per `TICKMS`=125 ms, at most 10 per frame; on the 10th it drops the leftover time. It passes `acc/TICKMS` to the renderer and camera as the interpolation lerp. `step()` rebuilds the 8×8-tile unit grid, updates units, boats, planes, twisters, towers, fire, tiles, climate, sea, storms and the scheduler, then runs `villagesStep` every 10 ticks and `rulersStep` every `YEAR`=60 ticks.
- **Main pieces:** `frame` (L9119–L9136), `step` (L2862–L2881), `setSpeed` (L7994), `busy` flag (L7993), `presim` (L9094–L9103).
- **Size:** ~45 lines.
- **Depends on:** every sim module, `G` or `render`, `AU`, `hud`.
- **Tangled with content:** clean. The tick order is the only game-specific part.
- **Fingerprint:** requestAnimationFrame; fixed 125 ms step × speed (0/1/3/8/20); max 10 steps per frame; dt clamp 100 ms; speed 0 is pause (Space key); `busy` blocks sim and input while generating or loading. One sim year is 60 ticks, 7.5 s at 1×. Head start runs `step()` in 45 ms chunks behind a veil (`presim`).

#### Settings store and settings sheet (`00-core.js`, `80-ui.js`) — settings
- **Does:** `DEF` holds 29 typed defaults. `S` is loaded from localStorage, and a stored key is accepted only if its type matches the default's. `optRow` builds button groups bound to `S` keys, and the click handler writes `S`, saves it and applies side effects (renderer switch, sound, quality, minimap).
- **Main pieces:** `DEF`, `S` (L425–L432), `saveSettings` (L432), `optRow` (L7588–L7591), the settings branch of `buildSheet` (L7624–L7650), `.opts button` handler (L7729–L7742).
- **Size:** ~50 lines.
- **Depends on:** DOM, localStorage.
- **Tangled with content:** clean pattern; the keys themselves are game-specific.
- **Fingerprint:** localStorage key `tinydominion.settings`, JSON, no version field (type-checked per key instead). Sound is off by default (`sound:false`), music on.

#### RNG, noise and hashing (`00-core.js`, `55-terra.js`, `74-ambient.js`, `90-boot.js`, `71-atlas.js`) — random numbers / procgen
- **Does:** Provides a seeded mulberry32, value noise from a shuffled 256-entry permutation, fbm, an integer hash `hsh` (also behind `vnoise`), a second hash `h1`, and FNV-1a `hashStr` that turns the seed word into a seed. The atlas has its own private mulberry32 `rnd` with a fixed seed.
- **Main pieces:** `mulberry` (L449), `mkNoise` (L450–L460), `fbm` (L461), `hsh` (L462), `vnoise` (L3093–L3097), `h1` (L7078), `hashStr` (L9082), atlas `rnd` (L4146–L4148), GPU noise texture `mulberry(1234567)` (L6440–L6442).
- **Size:** ~30 lines.
- **Depends on:** nothing.
- **Tangled with content:** clean.
- **Fingerprint:** mulberry32 (`0x6D2B79F5`) seeds world gen only. The seed comes from `hashStr(seed word)`, or `Math.random()*2147483647` if there is no word (L9105–L9106). All live simulation uses `Math.random`, so a seed word reproduces the starting terrain and peoples, not what happens later. The atlas uses seed `0x5eed`, the noise texture 1234567.

#### Terrain data model and tile table (`00-core.js`, `10-world.js`) — maps
- **Does:** 18 terrain types, each with name, colour, shade variance, walkable, buildable, fertility, burn time, fire spread and tree flags, unpacked into typed lookup arrays. The world is a set of per-tile typed arrays: tile, soil, ore, temp, moist, elev, fire, road, owner, two region maps, shade, colour and a building map. `setTile` keeps soil, elevation, buildings, fire, region dirtiness and the renderer in sync.
- **Main pieces:** `TD` (L299–L318), lookup arrays (L319–L320), `BIOME_COL` with 4 seasons per terrain (L322–L332), `ELEV0` (L342), `alloc` (L495–L504), `setTile` (L542–L560), `touch`/`touchRows` (L609–L610), `colorOf` (L569–L602).
- **Size:** ~110 lines.
- **Depends on:** renderer `G.touch`, `destroyBld`.
- **Tangled with content:** needs some untangling. The tile IDs are hardcoded constants used everywhere.
- **Fingerprint:** grid of tiles. Sizes: cozy 224×144, grand 416×240, colossal 640×352 (L425). Elevation is 0–255 with sea level `SL`=100. Height bands above sea: <58 lowland, <88 hills, <118 mountains, otherwise peaks (`bandOf` L2886). `metres()` maps those bands to 900 / 2,200 / 4,200 / 8,000 m, and one step below sea is 60 m (the sea-level slider also uses 60 m per step).

#### World generation (`10-world.js`, `47-riches.js`, `55-terra.js`) — procedural generation
- **Does:** Uses 4 fbm fields (height, ridges, moisture, temperature) with an edge falloff. Sea level is set by quantile to the chosen land fraction, and mountains, hills and peaks by quantiles of a land "mountain value". Temperature comes from latitude, noise and a polar band in the top 20%, then biomes are classified. Ice is settled, and about N/4,600 rivers run by greedy descent from hills (pooling into lakes if stuck). Deposits are placed and tribes and herds are seeded at the best-scoring spots. Flat-plain and empty-ocean starts use `blankWorld`.
- **Main pieces:** `genWorld` (L625–L731), `seedLife` (L732–L768), `blankWorld` (L3188–L3198), `placeDeposits` (L2581–L2592), `settleIce` (L3223–L3230).
- **Size:** ~170 lines.
- **Depends on:** RNG/noise, terrain table, `PREF`, `spawn`, climate reset.
- **Tangled with content:** needs some untangling. The thresholds and biome rules are inline.
- **Fingerprint:** land fraction islands .28 / continents .43 / pangea .6. Climate base cold −.06 / temperate .17 / hot .36. Hill, mountain and peak quantiles .8 / .9 / .972. Tribes = max(4, N/8,500), or N/4,200 for "many", placed in order H,O,E,D,H,E,O,D. Herds N/2,600, wolf packs N/11,000, bears N/14,000.

#### Regions and reachability (`10-world.js`) — maps / pathfinding support
- **Does:** 8-connected flood fill labels land regions and water regions (with sizes). After a terrain change it keeps each village's cached flow field unless a dirtied tile falls within its ±96 window.
- **Main pieces:** `flood` (L505–L523), `computeRegions` (L524–L540), `dirtyWalk`/`dirtyOver` (L440, L557).
- **Size:** ~40 lines.
- **Depends on:** `WALK`, `vById` flow fields.
- **Tangled with content:** clean.
- **Fingerprint:** Uint16 region ids (max 65,534); dirty list capped at 300 tiles before a full invalidation.

#### Units, spatial grid and movement (`20-units.js`) — entities / walking
- **Does:** One flat `units` array for 11 kinds, with per-kind caps scaled from the map size. `nearest` searches 8×8-tile grid cells with a predicate. `tryMove` respects walkability, solid buildings (a realm's own walls let its people through) and fire (blocks 90%). `stepTo` tries the direct step, then axis steps, then a random detour of 4–11 steps. HP regenerates 1 per 20 ticks.
- **Main pieces:** `SPEC` (L348–L360), `spawn` (L772–L790), `kill`/`hit`/`sweepUnits` (L791–L800), `nearest` (L801–L813), `blocks`/`tryMove`/`wander`/`stepTo` (L815–L835), `updUnit` (L910–L935).
- **Size:** ~90 lines.
- **Depends on:** terrain arrays, `bmap`, `grid`.
- **Tangled with content:** needs some untangling. The switch on unit type hardcodes the behaviours.
- **Fingerprint:** grid movement one tile per step, gated by `Math.random()<move`. Caps: civilians `POPCAP` 1,200 / 2,200 / 3,600 × size factor (cozy .7, colossal 1.3), at most 42% per race. Animals use `animCap` = N/250 clamped to 150–700. Zombies 260, dragons 6, siege 120, caravans 160.

#### Pathfinding: flow fields and sea routes (`20-units.js`) — pathfinding
- **Does:** Each village (and settler group) lazily builds a 193×193 Uint16 BFS distance field around itself over walkable tiles. Units descend it, trying the 8 directions from a random start and skipping solid buildings, and fall back to `stepTo` outside the window. Boats get a full-map BFS over water within one water region. Landings are picked from the target's flow field next to coastal water.
- **Main pieces:** `FR`=96, `flowOf`, `flowAt`, `stepFlow` (L837–L875), `seaPath` (L1161–L1179), `coastWater` (L1228–L1235), `findLanding` (L1236–L1245), `buildRoad` (L1353–L1367, roads follow the flow field).
- **Size:** ~85 lines.
- **Depends on:** regions, `WALK`, `bmap`.
- **Tangled with content:** clean. It is a reusable local flow-field pathfinder.
- **Fingerprint:** 8-connected BFS, window radius 96, cache invalidated by `regionStamp`. Sea BFS reuses the shared `bfsQ`/`prevA` arrays.

#### Wildlife and monster AI (`20-units.js`, `50-nature.js`) — enemy AI
- **Does:** Sheep wander and breed on grass. Wolves and bears gain hunger, hunt sheep (and people once hungry enough), roam and starve; bears gain hunger more slowly under trees. Zombies chase the nearest person, and people they kill rise as zombies. Dragons fly to random villages, setting fires and hitting nearby units. `migrate` restocks animals when numbers fall.
- **Main pieces:** `updPredator` (L936–L962), `updZombie` (L963–L973), `updDragon` (L1024–L1045), sheep case (L925–L928), `migrate` (L2725–L2738), `risen` (L795, L2868).
- **Size:** ~80 lines.
- **Depends on:** units, `nearest`, `ignite`.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** wolves starve above hunger 1,100 and bears above 1,600. Wolves hunt people once hunger passes 260, bears past 140. Sheep breed at .004 per tick when the grid cell holds fewer than 14 units.

#### Real-time combat (`20-units.js`, `50-nature.js`, `40-rulers.js`) — battles
- **Does:** Adults look for a hostile within 7 tiles (every 3 ticks at war, every 9 in peace) and strike when adjacent or in range, otherwise step closer. Hostility comes from wars, plus orcs against other unaligned peoples and zombies against everyone. Soldiers defend a rally point, march on the target village by flow field or sail from a port, and damage enemy buildings; taking a hall captures the village. Siege engines shell buildings with a 3-tick delay, towers shoot, and bombers drop scheduled bombs.
- **Main pieces:** `hostile` (L880–L890), `rangeOf` (L892), `strikeFoe` (L893–L909), `updCiv` (L1116–L1158), `soldierMove` (L1101–L1115), `updSiege`/`enemyBldNear` (L975–L1007), `damageBld` (L1541–L1547), `updTowers` (L2821–L2830), `runSched` (L2831–L2859), `airRaid`/`updPlanes` (L2046–L2065), `keepMuster` (L1719–L1727).
- **Size:** ~170 lines.
- **Depends on:** units, flow fields, kingdoms, wars, effects, sound.
- **Tangled with content:** needs some untangling. It uses age thresholds and species stats directly.
- **Fingerprint:** real time; no turn order or dice. Melee happens when d²≤2, ranged when d²≤range². Range is the species value (elves 4), 4 from age 5 (Renaissance) and 5 from age 6. Cooldown is 3 for melee, 5 ranged. **Damage = atk × (0.6 + rand×0.8) × k.pow × 1.25 (on own land) × 0.65 (melee against an elf standing in trees).** `k.pow` = (1 + .15×age) × 1.2 (has barracks) × 1.1 (conqueror) × 0.85 (broke) × resPow. Siege does atk×pow×(1.6 at tier ≥4), cooldown 14 / 10 / 7 by age. A bomb does 55 to buildings (a hall never drops below 25%) and 30 to units within r²≤2.3. Towers do 6×pow every 5 ticks out to 6 tiles. War score is +1 per kill and +25 per capture.

#### Ships: settlers, raids and trade fleets (`20-units.js`, `30-civ.js`, `40-rulers.js`) — naval
- **Does:** Boats carry stowed units along a precomputed water path and unload them at a landing (or beach on the nearest land). Modes are raid (5–14 soldiers from the port), settle (3–5 settlers to new shores) and trade (gold to the destination realm, plus relations).
- **Main pieces:** `launchBoat`/`unloadBoat`/`beach`/`updBoats` (L1180–L1227), `dispatchRaid` (L1246–L1258), sea branch of `sendSettlers` (L1643–L1665), `tradeFleet` (L2067–L2079).
- **Size:** ~85 lines.
- **Depends on:** sea BFS, docks, kingdoms.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** one tile per tick along the path; raid cooldown 25 ticks. Trade fleet gold = (8 + len×.06) × (1 + tier×.4) × 1.4 when it goes to another realm.

#### Settlements, buildings and town planning (`30-civ.js`) — economy / procedural layout
- **Does:** A village is founded with a hall and claims land in a radius. Streets grow from the hall as a grid (orcs turn randomly, dwarves branch more often) and houses must sit beside a street. 2×2 sites for arenas, launch pads and wonders are searched in rings. Docks and lighthouses need a coast; mines need hills or an adjacent mountain; elves grow groves. A wall ring is laid 3 tiles at a time, with towers at the corners. Buildings rise over time, and destroying a hall ruins the village.
- **Main pieces:** `foundVillage` (L1379–L1399), `claim` (L1290–L1297), `addBuilding` (L1330–L1352), `recalc` (L1303–L1329), `layStreet`/`initStreets`/`growStreets`/`placeTown` (L1406–L1449), `placeBig` (L1451–L1467), `placeBld` (L1468–L1508), `buildWalls` (L1510–L1529), `destroyBld`/`ruinVillage` (L1530–L1564), `raiseStep` (L1733–L1754), `upgradeRoads` (L1369–L1378).
- **Size:** ~270 lines.
- **Depends on:** terrain, flow fields, kingdoms, chronicle.
- **Tangled with content:** deeply tied. Building kinds are string literals throughout.
- **Fingerprint:** minimum village spacing `MINVD`=16. Village radius = 3 + √(buildings)×1.5. Building times come from `BUILD_T` in progress per 10 ticks (house .34 … arena .05). Wonders progress at 1/(yrs×6). Hall HP = 160 × (1 + .3×age) × 1.25 for dwarves.

#### Village economy, growth and trade (`30-civ.js`) — economy
- **Does:** Every 10 ticks each village earns resources (`res`), gold and lore. Food comes from farms, docks and windmills (elves from trees), scaled by a seasonal crop factor. A birth roll depends on food, and the village then picks what to build: houses, farms, walls, a wonder, or the focus-ordered civic list. It also sends settlers when big enough and dispatches caravans and siege engines. At war a realm pays soldier upkeep, can go broke, and buys reinforcements.
- **Main pieces:** `villagesStep` (L1767–L1822), `villageBuild` (L1670–L1718), `sendSettlers` (L1607–L1642), `sendCaravan` (L1756–L1766), `updCaravan` (L1009–L1023), `chop` (L1597–L1602).
- **Size:** ~170 lines.
- **Depends on:** settlements, riches (`resLore`, `siteRiches`), rulers' focus.
- **Tangled with content:** deeply tied. Many inline balance constants.
- **Fingerprint:** pop cap = 6 + houses×(5+age). Birth chance = .22 × species birth × clamp(food×crop/(pop×.45+2), .1, 1.2) × 1.2 under the grow focus. Crop factor by season .8 / 1.15 / .6. Gold rate = (pop×.005 + market(.2+pop×.008) + mines×.1 + factories×.3 + dock .04 + wonder) × 1.5 under the wealth focus × (1 + age×.06). Building gold costs come from `GCOST` (dock 10 … launchpad 400). Caravan cargo = (3 + dist×.12) × 1.5 (foreign) × (1 + tier×.4). Soldier upkeep is .015 gold per soldier per 10 ticks.

#### Kingdom lifecycle: founding, capture, secession, succession (`30-civ.js`, `40-rulers.js`) — progression
- **Does:** A new realm gets a colour, a name and a ruler rolled from its culture. Capturing a village moves it to the conqueror, and people of a different race leave. A realm with no villages falls and every war against it ends. Successors keep the old trait with 30% odds, inherit 30% of the temperament and take regnal numbers. A succession can trigger a breakaway when the realm has 4 or more towns, and a large realm at peace can also secede at random.
- **Main pieces:** `newKingdom` (L1268–L1281), `newRuler` (L1263–L1267), `captureVillage` (L1578–L1596), `killKingdom` (L1565–L1577), `cedeVillage` (L2515–L2521), `secede` (L1937–L1949), `succession` (L1951–L1963).
- **Size:** ~90 lines.
- **Depends on:** mind (temperament, culture), chronicle.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** a reign lasts 16–46 years. Secession odds are 25% on a succession (4+ towns) and .03×(1.3−honour) per year (6+ towns, at peace).

#### Ages, technology, wonders and the space programme (`00-core.js`, `40-rulers.js`, `30-civ.js`) — progression / stats
- **Does:** Lore accumulates into 27 techs, three per age, evenly spaced between the age thresholds. Crossing a threshold advances the age, raises power, restores hall HP, upgrades roads and shows a banner the first time any realm reaches that age. Each of the nine wonders can exist once in the world, as the earliest unclaimed one a rich town can afford. At age 8 a realm with a launch pad launches rockets, and a colony ship once every tech is known.
- **Main pieces:** `AGES`/`AGE_T`/`TECHS`/`PPL`/`WONDERS`/`TIER` (L341, L396–L416), `TECH_LORE` (L2026–L2027), age-up in `rulersStep` (L1991–L2003), `wonderFor` (L1669), wonder branch of `villageBuild` (L1683–L1693), `spaceProgram` (L2031–L2044).
- **Size:** ~60 lines.
- **Depends on:** economy, riches (uranium speeds launches).
- **Tangled with content:** needs some untangling. Tables and code are separate, but age indices are hardcoded elsewhere (≥5 guns, ≥6 smoke, ≥7 bombers, 8 rockets).
- **Fingerprint:** 9 ages; lore thresholds `AGE_T`=[70, 240, 640, 1350, 2800, 5400, 9600, 15500], `STAR_LORE`=20500. Each figure stands for `PPL`=[6, 10, 16, 28, 50, 90, 200, 480, 1000] people by age. There are 5 visual tiers (`TIER`=[0,0,1,1,2,2,3,4,4]). Lore rate = (pop×.0025 + houses×.0015 + temple .06 + academy(.3+.12×tier) + lighthouse .03 + wonder) × 1.6 under the lore focus × 1.3 for a scholar × (1 + age×.1) × resLore. Launch chance per year is .16 (.32 with uranium).

#### Diplomacy, wars and peace (`40-rulers.js`, `45-mind.js`) — AI / progression
- **Does:** Pairwise relations sit in a Map keyed `id×8192+id`, starting from race affinity, trait and nature, drifting back toward that base each year and pushed by wars, alliances and proximity. Declaring war betrays any alliance, breaks truces, drops relations to at most −60, picks targets, and asks each ally whether it will join (`answerCall`). Peace sets a 12–22-year truce and settles terms. A 30-year war ends from exhaustion.
- **Main pieces:** `baseRel`/`rel`/`setRel`/`relWord` (L1826–L1838), `declareWar` (L1889–L1917), `makePeace` (L1918–L1930), `makeAlliance` (L1931–L1936), `pickTarget` (L1864–L1888), `rulersStep` (L1964–L2024), `peaceTerms` (L2501–L2513), `answerCall` (L2523–L2527).
- **Size:** ~150 lines.
- **Depends on:** mind, kingdoms, chronicle, sound.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** neighbours are realms within 150 tiles. Relations are clamped to ±100 and drift 5% per year toward the base. Peace terms by war-score margin: <15 nothing; ≥45 with 2+ towns, cede the nearest town within 80 tiles; otherwise reparations of 20% (or 40% when the margin is over 30) of the loser's gold. An ally joins when its score is above .45 (offence) or .12 (defence).

#### Ruler minds: utility-scored yearly council (`45-mind.js`) — AI
- **Does:** Each ruler has 8 temperament values from trait, race and national culture, with 30% inherited from the previous ruler. They also keep per-realm grudge and debt memories that fade, a reputation, per-kind cooldowns, and a long-term goal held with hysteresis. Once a year they score every option per neighbour from named factors (war, peace, alliance, tribute, gift, pact, marriage) plus festival, clean power and patronage. They act on the best option if it beats a temperament-dependent bar, and the other party evaluates offers with the same functions. The god can whisper war, peace or learning, which the ruler may refuse.
- **Main pieces:** `TEMPER`/`TRAIT_TM`/`RACE_TM`/`NAT_SHIFT`/`NAT_TRAITW` (L2101–L2119), `rollCulture`/`rollTemper`/`pickTrait` (L2121–L2143), `remember`/`fadeMemory` (L2148–L2166), `fearOf`/`covet` (L2173–L2187), `chooseGoal` (L2232–L2256), `weighWar`…`weighMarriage` (L2260–L2347), `rulerThink` (L2348–L2395), `weighClean` (L2397–L2407), `act` (L2411–L2499), `whisper` (L2529–L2547), `SAY` lines (L2196–L2222).
- **Size:** ~400 lines of logic (+60 phrase tables).
- **Depends on:** diplomacy, riches (`resWant`, `freeRiches`), climate (`degWarm`), chronicle, bubbles.
- **Tangled with content:** needs some untangling. The scoring framework (list of [reason, weight], sum, bar) is generic; the factors are game-specific.
- **Fingerprint:** score = Σ factor weights. **Bar = .28 + caution×.15 − aggression×.08**, and the ruler acts with probability min(.85, (u−bar)×2.4 + .15). Grudge is 0–150 and fades ×.965 per year (×.985 for betrayals); debt is 0–100 and fades ×.95. Reputation starts at 50 and recovers +.4 per year. A goal is replaced only by a better one scoring more than 1.25× it, or after 40 years. Up to 5 options are shown on the realm page. Cooldowns run 2–15 years by kind.

#### Riches of the earth (resources) (`47-riches.js`) — economy
- **Does:** Eight deposit types sit on single tiles, placed per terrain at "1 in N" odds and at least 4 tiles apart. A realm works a deposit when the tile is in one of its towns' lands and it has reached the resource's age; allies and pact partners share it at half value. Resources change power, lore, gold, wonder speed, bomber odds and launch odds, and drive rulers' wants, settler site choice and goals.
- **Main pieces:** `RES` (L2562–L2570), `ORE_ON` (L2572–L2580), `placeDeposits` (L2581–L2592), `riches` (L2600–L2622), `hasRes` (L2626–L2629), `resPow`/`resLore` (L2630–L2631), `resWant`/`freeRiches`/`siteRiches`/`richesNear` (L2633–L2673), `placeOre` (L8013–L8022).
- **Size:** ~120 lines.
- **Depends on:** terrain, village ownership.
- **Tangled with content:** clean-ish. Effects are data in `RES`, with a few hardcoded hooks.
- **Fingerprint:** copper, iron, horses, gold, marble, coal, oil, uranium, usable from ages 1/2/1/0/3/6/7/8. resPow = 1 + .08 copper (age ≤3) + .15 iron + .1 horses + .25 oil. Gold pays min(4, count) × (4 + age×2) per year.

#### Fire, nature ticks and disasters (`50-nature.js`, `60-powers.js`) — effects / world sim
- **Does:** Fire burns down a per-tile counter, spreads by terrain spread chance, damages buildings and leaves ash. Random tile ticks heal ash, cool lava (igniting its neighbours) and let forest creep into grass. Disasters fire at a chance per year: thunderstorm, volcano, plague, tornado, meteor, dragon or zombies. Twisters wander, smashing buildings and throwing units. `blast` craters an area, turns the middle to lava and shakes the screen.
- **Main pieces:** `ignite`/`fireStep` (L2677–L2698), `tileTicks` (L2699–L2720), `disasters` (L2744–L2779), `erupt` (L2780–L2790), `updTwisters` (L2791–L2820), `strike` (L3414–L3420), `blast` (L3421–L3437), plague spread in `updCiv` (L1118–L1126).
- **Size:** ~150 lines.
- **Depends on:** terrain, units, buildings, scheduler, effects.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** disaster chance per year: off 0 / rare .09 / wild .4. Split .3 storm, .18 volcano, .16 plague, .16 tornado, .1 meteor, .06 dragon, .04 zombies. Tile ticks touch N/85 tiles per tick. Plague lasts 200 ticks at −2 HP every 10 ticks and spreads within 2 tiles at .3.

#### Weather: drifting storms (`55-terra.js`) — weather
- **Does:** Once a year a storm may spawn on land (.55 odds, at most 6 at once). Storms drift with a fixed wind plus sine wobble. They douse fires, heal ash, cool lava, and when thundery throw lightning. Their strength ramps in and out over 120 ticks, and the renderers shade and darken clouds under them.
- **Main pieces:** `WIND`, `stormsStep` (L3017–L3044), `stormAmt` (L3045), shader `stormAt` (L6011), rain and snow particles (L7149–L7161).
- **Size:** ~35 lines (+ render).
- **Depends on:** terrain, `strike`.
- **Tangled with content:** clean.
- **Fingerprint:** max 6 storms; radius 6–15; lasts 5–14 years; wind (.035, .008) tiles per tick.

#### Terraforming, sculpting and water flow (`55-terra.js`) — procedural / editor tools
- **Does:** Brushes raise or lower land (snapping to sea level when raising from water), smooth, flatten to the height under the stroke's start, add ridges or valleys, terrace in 9-step bands, roughen, erode (moving height to the lowest neighbour) and paint climate. After a change, `reclass` picks the tile type from height band and climate. `makeRiver` traces a river downhill from a tap. `letWaterFlow` clears old rivers, runs a bucketed priority flood to fill depressions into lakes, accumulates rainfall along flow parents, and turns the top 1.3% of land accumulation into rivers.
- **Main pieces:** `bandOf`/`tBase`/`tEff`/`iceAt`/`biomeFor`/`reclass` (L2886–L2918), `terraBrush` (L2919–L2926), `raiseLand` (L2927–L2936), `climateBrush`/`plantTrees` (L2942–L2967), `makeRiver` (L2969–L2996), `sculpt` (L3098–L3127), `letWaterFlow` (L3129–L3186), `seaStep` (L2998–L3015).
- **Size:** ~250 lines.
- **Depends on:** terrain table, `setTile`, buildings.
- **Tangled with content:** clean-ish. Biome thresholds are inline.
- **Fingerprint:** brush radius `brush`+.5 (slider 1–8) with linear falloff; strength 1–10. Priority flood uses 512 elevation buckets. A lake needs at least 4 tiles and depth 3. The river threshold is max(40, the 1.3% quantile). The sea moves 1 step every 5 ticks, rescanning only shore tiles.

#### Climate: smoke, warming, ice and seas (`57-climate.js`) — world sim
- **Does:** From age 6, towns emit smog from factories and houses (cut by clean power, scaled by the pollution setting). Carbon decays and accumulates yearly, and warming eases toward a carbon-based target, plus the god's own offset. A few rows per tick melt or grow ice against the current temperature, shift biomes and move snow lines. Melted ice raises the sea goal. Summits gather modern realms to pledge clean power.
- **Main pieces:** `POLLUTE`/`C_DEG`/`CARBON_DEG` (L3206–L3208), `updSea` (L3213–L3216), `climateStep`/`climateRow` (L3233–L3269), `climateYear` (L3272–L3298), `summit` (L3302–L3321), `setGodWarm`/`climateKick`/`meltCaps` (L3325–L3337), `climateText` (L3339–L3343).
- **Size:** ~140 lines.
- **Depends on:** terrain, biomes, mind (`weighClean`), chronicle.
- **Tangled with content:** clean-ish.
- **Fingerprint:** carbon = carbon×.993 + emissions×.01 per year. Target warming = min(9, carbon/75) °C, eased at .06 per year. One °C = .025 temperature units. Sea goal = seaBase + clamp(round(melt/iceUnit), ±12), clamped to 64–136. Rows per tick = ⌈H/120⌉. Summits need ≥1.5 °C, 35 years since the last one, and 3+ realms at age ≥7.

#### God powers and tool dispatch (`60-powers.js`, `80-ui.js`) — editor / interaction
- **Does:** The `CATS` tool catalogue defines 6 tabs (World, Shape, Paint, Riches, Life, Powers), each tool with a mode of pan, tap, brush, spawn, slider or action. `applyBrush` routes brush tools (terrain paint, sculpt, climate, plant, fire, rain, smite, plague, bless). `tapAt` routes tap tools (spring, storm, inspect, bolt, bomb, meteor, tornado, volcano, war, peace, ores) and `spawnBrush` drops creatures. `inspect` builds the info card for a unit, town or tile.
- **Main pieces:** `forBrush` (L3348–L3354), `applyBrush` (L3367–L3404), `spawnBrush` (L3405–L3413), `stirWar`/`calmRealm` (L3438–L3458), `inspect` (L3460–L3488), `CATS` (L7762–L7831), `buildTabs`/`buildTools` (L7833–L7875), `paintAt`/`holdBrush`/`tapAt` (L7881–L7919).
- **Size:** ~230 lines.
- **Depends on:** all sim modules, DOM.
- **Tangled with content:** deeply tied (tool list).
- **Fingerprint:** brush strokes are interpolated between tiles. Holding a brush repeats it every 120 ms for the tools in `AGAIN`. A tap counts when the pointer moved under 12 px.

#### Chronicle, speech bubbles, toasts and banners (`40-rulers.js`, `80-ui.js`) — UI / event log
- **Does:** `chron` appends a typed, located event (kept to 300), records `lastEvent` for the camera director, and toasts unless quiet. Bubbles show ruler speech over capitals (max 8, 9 s). Toasts keep 2 lines, and the banner is a 5.2 s title card.
- **Main pieces:** `chron` (L1855–L1863), `bubble` (L1849–L1854), `toast` (L7482–L7489), `banner` (L7492–L7496), chronicle sheet (L7703–L7710).
- **Size:** ~35 lines.
- **Depends on:** DOM, camera.
- **Tangled with content:** clean.
- **Fingerprint:** event types war, peace, disaster, tech, age, ruler, ruin, found. `quiet` mutes during presim.

#### Classic 2D canvas renderer (`70-render2d.js`, `68-gfx.js`) — rendering
- **Does:** Tile colours go into a W×H ImageData in an offscreen canvas, which is drawn scaled by zoom with only the visible rows refreshed and a full refresh every 24 frames. A background sweep re-colours a few rows per frame. On top: hand-coded rectangle detail sprites for terrain (at zoom ≥5.5), buildings, units, dragon, boats, twisters, effects, 2D clouds, a multiply night overlay with window lights and fire glow, names and bubbles.
- **Main pieces:** `allocRender` (L3558–L3564), `drawDetail` (L3567–L3654), `drawHouse`/`drawBld` (L3660–L3741), `drawUnit`/`drawDragon`/`drawBoat`/`drawTwister` (L3745–L3807), `drawClouds` (L3833–L3851), `drawEffects` (L3862–L3904), `render` (L3916–L3998), `drawNames` (L4000–L4034).
- **Size:** ~480 lines.
- **Depends on:** world arrays, camera, `ctx`.
- **Tangled with content:** deeply tied. The art is inline rectangles.
- **Fingerprint:** 1 px per tile offscreen, scaled by `cam.z`×dpr; `imageSmoothingEnabled` only when zoom <1; CSS `image-rendering:pixelated`. Screen shake decays ×.88. Night is a multiply fill.

#### Procedural pixel-art sprite atlas (`71-atlas.js`) — 3D/2D art built in code
- **Does:** Draws every sprite in code into Uint32 mini-canvases, using primitives (pixel, rectangle, line, ellipse, scanline polygon, sphere shading with Bayer dither) and a building kit (textured walls, cylinders, windows, doors, flags, gable and hip roofs, cones, domes). It auto-outlines each sprite and trims it to a frame with an anchor, then shelf-packs all frames into a 2048-wide power-of-two atlas. Special alpha values mark team-colour, foliage, window and emissive pixels, which the shader recolours.
- **Main pieces:** `buildAtlas`/`atlBuild` (L4046–L4047), `MT` material ramps (L4056–L4086), primitives (L4095–L4148), `outline`/`add` (L4152–L4177), building kit (L4180–L4333, skimmed), `pack` (L4336–L4350), generators `house` (L4368), `tall` (L4672), `hall` (L4831), `temple` (L4991), `civic` (L5133), `misc` (L5280), `wonders` (L5405), `nature` (L5531), `people` (L5693–L5716), `creatures` (L5719), `vehicles` (L5778), `effects` (L5875), `extras` (L5912), `depositArt` (L5938–L5988).
- **Size:** ~330 lines of engine + ~1,625 of recipes.
- **Depends on:** nothing outside itself. Only `buildAtlas` and `atlBuild` are top level.
- **Tangled with content:** clean engine (the primitives, outline and packer are reusable); the recipes are content.
- **Fingerprint:** 16 art px per tile. Light comes from the top left, with a 1 px sel-out outline and 5-colour material ramps (the header comment says 3-tone). Alpha markers: 255 normal, 254 team, 253 foliage, 252 window, 251 emissive. Atlas width 2048, height the next power of two. Seed `0x5eed`. Frame names look like `house_<race>_<tier>_<v>` and `<race>_sol<tier>_<frame>`, with races `h e d o`. Counted generators give 4×5×2 houses, 4×2×3 tall buildings, 20 halls, 20 temples, 29 civic buildings and 92 people frames; the total frame count isn't known because the atlas wasn't run.

#### WebGL2 renderer: terrain shader, instanced sprites, lighting (`72-gl.js`, `73-scene.js`) — rendering
- **Does:** Three RGBA8 data textures (type and flags, smooth land/elevation/tree/river, owner/tier/ore) are updated by dirty rows. One fullscreen fragment shader draws pixel-art terrain. It quantises to 16 px per tile at zoom ≥9 and 8 px at zoom ≥4.5 (none below) and draws animated water with foam and depth bands, seasonal biome colours, crops, roads that change with tier, crags, ice, lava, sun hill-shading with dithered banding, borders, cloud shadows, storms, and a topographic map mode with contours. Sprites are collected each frame into instanced lists (shadow, main, post, sky, light), depth-sorted by y. Night renders a half-resolution additive light map, multiplies the scene by ambient light plus that map, then draws emissive windows. Smog and cloud passes follow, then a 2D overlay.
- **Main pieces:** shaders `SH_TERRAIN_FS` (L6014–L6288), `SH_SMOG_FS`, `SH_CLOUD_FS`, `SH_DARK_FS`, `SH_SPRITE_VS/FS`, `SH_LIGHT_VS/FS` (L6291–L6404), `glCreate` (L6406–L6532), `glTileData` (L6534–L6545), `mkList`/`put`/`light` (L6556–L6569), `FI` frame lookup with fallbacks (L6579–L6590), `folTint` (L6603–L6609), `sceneNature`/`sceneRiches`/`sceneBuildings`/`sceneUnits`/`sceneEffects` (L6615–L6870), `glFrame` (L6900–L7005), `glOverlay` (L7008–L7049).
- **Size:** ~1,080 lines.
- **Depends on:** atlas, world arrays, camera, day/season state.
- **Tangled with content:** needs some untangling. The shader hardcodes terrain IDs (`ty==3`, `ty==16`…).
- **Fingerprint:** the canvas backing scale `gdpr` = min(dpr, quality 1 / 1.5 / 2.5). Sprite instance stride is 40 bytes (pos, frame, depth, alpha, flags, crop, scale, team RGBA, tint RGBA); flags 1 flip, 4 airborne, 8 shadow, seed<<4. depth = .985 − y-fraction×.97. Light map is half resolution. The context-lost event is handled with a toast. If WebGL2 fails it falls back to the 2D renderer (`initGfx` L3539–L3550).

#### Day/night and seasons (`68-gfx.js`, `73-scene.js`) — effects
- **Does:** A 150-second real-time day clock gives a night factor (fading in at p .56–.66, full until .9, fading out after) and a sun direction used for shading and shadows. Seasons come from `tick % YEAR`, and the seasonal amplitude fades as speed rises. Season drives the biome palette, autumn foliage tints, bare winter oaks, snow on pines and frozen shallows.
- **Main pieces:** `updDay` (L3523–L3533), season block in `glFrame` (L6910–L6914), `FOL`/`AUT`/`folTint`/`snowAt` (L6594–L6613).
- **Size:** ~40 lines.
- **Depends on:** settings `night` and `seasons`.
- **Tangled with content:** clean.
- **Fingerprint:** day = 150 s of real time, not tied to sim years. Seasonal amplitude is 1 at 1×, .75 at 3×, .3 at 8× and 0 at 20×. The season phase is offset by .875, so tick 0 falls in late winter (L1779, L7502).

#### Ambient life particles (`74-ambient.js`) — effects
- **Does:** Purely visual sprites, all frame-time driven. Bird flocks in V formation (with shadows) fly by day. Fish leap in the shallows and whales surface in deep water. Fireflies appear on summer nights. Rain or snow falls inside storms, up to 500 drops.
- **Main pieces:** `sceneAmbient` (L7079–L7162).
- **Size:** ~85 lines.
- **Depends on:** sprite lists, terrain.
- **Tangled with content:** clean.
- **Fingerprint:** at most 4 flocks, 6 fish leaps and 2 whales at a time; 70 firefly slots reseeded every 3 s by hash.

#### 3D relief tabletop view (`75-relief.js`) — 3D / camera
- **Does:** Bakes the terrain shader for the whole world into one mipmapped texture, at 2–8 px per tile up to 4,096 px (2,048 on small screens). It drapes that over a height-grid mesh with earth-banded skirts and a fresnel/specular water plane with fog and a sky gradient. Atlas sprites near the camera stand as camera-facing billboards. The camera orbits with yaw, pitch and distance, pans, and has a relief slider. Realm names are projected to 2D.
- **Main pieces:** shaders (L7169–L7253), `V3` (L7256), matrix helpers (L7258–L7265), `setView3d` (L7268–L7280), `rel3dMesh` (L7282–L7313), `rel3dBake` (L7315–L7366), `rel3dFrame` (L7367–L7422), `rel3dSprites` (L7423–L7452), `rel3dOverlay` (L7454–L7469), `rel3dDrag`/`rel3dZoom` (L7471–L7478).
- **Size:** ~315 lines.
- **Depends on:** GL renderer, scene collectors.
- **Tangled with content:** clean.
- **Fingerprint:** mesh step 2 when W×H >120k. Height scale .075×relief (relief 0.4–4.0); underwater depth ×.55. FOV .72 rad. Pitch is clamped to .14–1.45 and distance to 12–1.6×max(W,H). The bake refreshes every 2.5 s (6 s when paused).

#### Camera: pan, zoom, glide, follow, cinematic director (`68-gfx.js`, `82-camera.js`) — camera
- **Does:** `cam` stores the top-left corner in tiles and `z` in screen pixels per tile. Zoom is clamped between fitting the world ×.85 and 40, and the camera can run half a screen past the world's edge. `camTo` glides with ease-in-out and dips the zoom on long hops. Follow mode eases the view toward an interpolated unit. In watch mode the director picks a weighted target every 9–14 s: a fresh event, rocket, wonder, battle, dragon, plane, storm, the biggest city or a random town.
- **Main pieces:** `cam`/`clampZ`/`clampCam`/`centerOn`/`resize` (L3496–L3521), `camTo` (L8177–L8180), `updCamera` (L8182–L8199), `setWatch` (L8200–L8204), `director` (L8206–L8227).
- **Size:** ~70 lines.
- **Depends on:** units, effects, `lastEvent`.
- **Tangled with content:** clean-ish (the director's target list).
- **Fingerprint:** no deadzone. Follow smoothing k = min(1, dt/250). Glide uses easeInOutQuad, lasting 900 ms by default (1,200 from sheets, 2,600 in watch mode), with a zoom dip of up to 45% on hops over 40 tiles. Glides respect reduced motion. Clamping allows half a screen of overscroll.

#### Input: pointer, touch, wheel and keys (`80-ui.js`) — input
- **Does:** Mouse, touch and pen all use pointer events. One pointer either paints with the current brush or pans the map; two pointers pinch-zoom around their midpoint and pan. The wheel zooms at the cursor. In 3D view, a drag orbits, a right/middle or shift drag pans, and pinch or wheel zooms. Dragging on the minimap jumps the view. Keys set speed and toggle modes.
- **Main pieces:** `pos`/`toTile` (L7879–L7880), pointer handlers (L7920–L7978), wheel (L7979–L7984), minimap drag (L7985–L7990), keydown (L8023–L8032).
- **Size:** ~110 lines.
- **Depends on:** camera, tools, 3D view.
- **Tangled with content:** clean-ish.
- **Fingerprint:** keys: Space toggles pause/1×; 1–4 set 1×/3×/8×/20×; W watch; V 3D; T topo map; Escape closes sheets and exits watch or 3D. No arrow-key panning, no gamepad, and no Mooncart mapping (Enter, M and H aren't bound; Escape only closes). Touch has no virtual pad: you pick a tool from the dock, then drag or tap on the map. Pinch zoom works, and panning is a one-finger drag with the Move tool or a two-finger drag.

#### UI framework: HUD, dock, sheets and realm pages (`80-ui.js`) — menus and UI
- **Does:** The HUD shows era, year with a season icon, population, realm count and speed buttons. The bottom dock holds tool tabs and a horizontally scrolling tool row, plus contextual sliders (brush, strength, relief, sea level, temperature, climate buttons). The side sheet has modes realms, realm, chronicle, history and settings, rebuilt with `innerHTML` and refreshed every 1.2 s. The realm page shows the ruler's mind (temperament meters against the people's marks, goal, this year's weighed options with factor chips and a bar marker, memories), whisper buttons, research, wonders, towns, riches and relations. "New world" asks for a second tap. The veil covers loading.
- **Main pieces:** `hud` (L7501–L7511), `veil` (L7512–L7516), `richesHtml` (L7519–L7533), `mindHtml` (L7541–L7574), `openSheet`/`closeSheet`/`buildSheet`/`refreshSheet` (L7578–L7711), sheet click delegation (L7721–L7757).
- **Size:** ~270 lines.
- **Depends on:** DOM, every sim module.
- **Tangled with content:** deeply tied.
- **Fingerprint:** 44 px touch targets, `aria-pressed`/`aria-live`/`aria-expanded`, safe-area insets, layout breakpoints at 440 px and 700 px.

#### History and charts (`40-rulers.js`, `81-history.js`) — UI / data viz
- **Does:** Every year it records each realm's population (up to 1,200 points per realm) and world totals (3,000) into history arrays. The page shows stat tiles, a log₁₀ population chart of the six largest-ever realms (cased lines, end labels nudged apart with leader lines, hover crosshair and tooltip), a two-panel temperature and sea-level chart, a leaders table and a wonders list.
- **Main pieces:** `recordHistory` (L2081–L2092), `histSeries` (L8039–L8043), `drawClimChart` (L8052–L8091), `histPanels` (L8092–L8109), `drawHistChart` (L8110–L8165), hover listeners (L8166–L8171).
- **Size:** ~150 lines.
- **Depends on:** canvas, CSS tokens (`--viz-warm`, `--viz-sea`, `--ink`).
- **Tangled with content:** clean-ish. It is a reusable small line-chart drawer.
- **Fingerprint:** chart colours read from CSS custom properties, so dark mode follows.

#### Minimap (`68-gfx.js`, `70-render2d.js`, `73-scene.js`) — minimap
- **Does:** In 2D mode it draws the offscreen tile canvas every 4 frames. In GL mode it samples tile colours per minimap pixel every 30 frames, tinted by owner. Both add capital squares and a viewport rectangle, and tap or drag recentres the view.
- **Main pieces:** `sizeMini` (L3501–L3505), `drawMini` (L3905–L3915), `drawMiniGL` (L7050–L7073), `miniGo` (L7986).
- **Size:** ~45 lines.
- **Depends on:** world arrays, camera.
- **Tangled with content:** clean.
- **Fingerprint:** 112 or 128 px wide (128 when W ≥600); aspect follows the world.

#### Procedural audio: sfx, ambience beds, generative music (`85-audio.js`) — audio
- **Does:** Web Audio graph: per-voice nodes into sfx, ambience and music buses, then master, a compressor and a trim, with a 4-comb stereo delay "reverb" and a long echo. Noise buffers (white, brown) and a Karplus-Strong pluck are made once. 30 one-shot recipes each carry a minimum gap, a concurrency cap and flags, and are panned and attenuated by screen position. Eight looping ambience beds (surf, hiss, wind, rain, town, fire, lava, crickets) are steered by a low-discrepancy sample of visible tiles and storms. Generative phrases drift key and change scale and instrument by era group, switch to minor modes with drums during a nearby war, and thin out at night.
- **Main pieces:** `auVox`/`auO`/`auNz`/`auF`/`auE` (L8279–L8301), `auPrune` (L8302), `auNoise`/`auMkKS` (L8310–L8333), `auInit` (L8336–L8370), `auBeds`/`auBedLvl` (L8396–L8439), `auScan`/`auMood`/`auBedsSet`/`auEvents` (L8444–L8521), `AU_FX` (L8525–L8708), `auPos` (L8710–L8720), music `AU_SC`…`auMusic` (L8723–L8842), `AU` API (L8845–L8900), hook `snd` (L482).
- **Size:** ~640 lines.
- **Depends on:** camera, `tile`, `bmap`, `storms`, `kingdoms` (read-only), `S`.
- **Tangled with content:** clean. It is self-contained behind `AU.sfx/update/setOn/setMusic/unlock` and could be lifted almost as is.
- **Fingerprint:** synthesis only, no audio files. Master gain .42, music .5. Caps: 12 sfx voices (+3 for priority sounds) and 9 music voices. Compressor −12 dB, ratio 5. Scale sets pent/mpent, dor/aeo, mix/aeo, ion/aeo, ion/aeo, lyd/aeo for 6 era groups; the root starts at MIDI 52–63 and drifts by ±5/7/2 semitones every 6–13 phrases. Instruments: flute, KS pluck, piano, FM electric piano, "space" with echo. The audio context unlocks on the first gesture (iOS one-sample trick) and suspends when the page is hidden. On/off only, no volume slider.

#### Save and load (`86-save.js`, `90-boot.js`) — save/load
- **Does:** Snapshots the whole world into plain data: typed arrays sliced, objects turned into ids, buildings into tuples, flow-field settler groups into indices, Maps into entry arrays. Stores it in IndexedDB with meta (year, people, realms, era, date, size). Restore rebuilds every object graph and recomputes derived state. Autosave runs on a timer and when the page is hidden, and boot offers "Continue / New world" if an autosave exists.
- **Main pieces:** `idb`/`idbDo`/`saveGet`/`savePut`/`saveMetaAll` (L8906–L8926), `snapshot` (L8929–L8961), `restore` (L8963–L9040), `worldMeta`/`saveWorld`/`loadWorld` (L9043–L9068), `autosave` (L9069–L9071), `savesHtml` (L9072–L9078), `bootStart` (L9139–L9153).
- **Size:** ~190 lines.
- **Depends on:** every sim structure (tightly coupled to their field names).
- **Tangled with content:** deeply tied. Every field is listed by hand.
- **Fingerprint:** IndexedDB database `tinydominion` v1, store `worlds`, keys `auto`, `slot1`, `slot2`, `slot3` (3 slots + autosave). The record is `{meta, data}` with `data.v` = `SAVE_V` = 1. Load rejects any other version (no migration step), but `restore` falls back to defaults for fields added later (`d.clim`, `d.ore`, `o.nat`, `o.culture`…). Autosave runs every 150 s and when the page is hidden, only once tick > 2 years and `S.autosave` is on. Chronicle is capped at 300 entries and climate history at 1,500 in the save. There is no compression.

#### Boot, new world and head start (`90-boot.js`) — progression / app shell
- **Does:** Starts a world from the seed word (FNV-1a) or a random seed, centres on the first tribe and optionally pre-simulates 60 / 150 / 300 years in time-sliced chunks behind the veil. After 1.8 s with no autosave answer it starts a new world.
- **Main pieces:** `hashStr`, `ready`, `presim`, `startWorld` (L9082–L9117), `bootStart` (L9139–L9153).
- **Size:** ~60 lines.
- **Depends on:** world gen, save.
- **Tangled with content:** clean.
- **Fingerprint:** presim runs 45 ms slices via `setTimeout(0)`.

#### Debug and test hooks; build tool (`90-boot.js`, `tools/build.mjs`) — debug / tools
- **Does:** `window.__td` exposes `step`, settings, camera, spawning, a state getter, `setDay`, `dbg`…`dbg4` resource and ice probes, climate controls, `whisper`, `use(id,x,y)` ("test hook: use any tool at a tile"), save/load, and the gfx, watch and 3D toggles. The GL renderer keeps perf probes `R.tScene` and `R.nSpr` (L6917). `tools/build.mjs` concatenates `src/js/*.js` in sorted order, adding the file markers, into one IIFE, syntax-checks the result with `node --check`, and writes `Tiny_Dominion.html` plus an artifact-flavoured `dist/tiny-dominion.html` (only title, links, style, body and script). `EXCLUDE=` can drop modules.
- **Main pieces:** `window.__td` (L9155–L9167); `tools/build.mjs` (whole, 2,256 bytes).
- **Size:** ~15 lines in the page.
- **Depends on:** everything.
- **Tangled with content:** n/a.
- **Fingerprint:** the repo has no test files; the hooks suggest an outside harness, which isn't in the branch.

### Content
| What | Where | ~lines |
|---|---|---|
| Terrain types (18), seasonal biome palette, canopy colours, elevation per type | L298–L342 | 45 |
| Species stats (11), habitat preferences per race, race affinity matrix, realm colours (14) | L346–L369 | 25 |
| Realm-name syllables, ruler names and titles per race, 6 traits | L370–L395 | 26 |
| Ages (9), techs (27), people per figure, 9 wonders, focus words, gold costs, building HP, build times | L396–L422 | 27 |
| Age-up sayings | L2028–L2029 | 2 |
| Temperaments, trait and race temperament tables, nature shifts, army words | L2101–L2119 | 19 |
| Ruler speech lines (`SAY`, 26 categories), goal names, war reasons | L2196–L2226, L2408–L2409 | 35 |
| Resources (8) and where they lie | L2560–L2580 | 21 |
| Settlement words, building names by tier | L1287, L8242–L8262 | 22 |
| Tool catalogue (6 tabs, 75 tools) | L7760–L7831 | 72 |
| Settings, how-to-play text and options | L7625–L7648 | 24 |
| Pixel-art recipes: houses, tall buildings, halls, temples, civic, misc (piers, windmills…), 9 wonders, nature, people (4 races × 5 tiers of soldiers), creatures, vehicles, effects, extras, deposits | L4367–L5991 | ~1,625 |
| Sound recipes (30) and music scales | L8525–L8708, L8723–L8726 | ~190 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| CSS design tokens with light/dark (`--sea`, `--panel`, `--ink`, `--sun`, `--viz-*`), plate boxes with 3 px drop shadows, pixel font | L11–L36 | 26 |
| HUD, dock, tabs, tool buttons, sheets, realm/mind page styles, chronicle types, charts, banner, phone/wide breakpoints | L38–L218 | 180 |
| HTML shell: two canvases + minimap, HUD, sheet, banner, veil, dock sliders | L221–L287 | 67 |
| Font: Google Fonts "Pixelify Sans" 400/600/700, falling back to ui-monospace | L7–L9, L27, L3498 | 4 |
| Classic 2D art drawn as rectangles (buildings, units, detail) | L3567–L3807 | 240 |
| GLSL terrain look (water bands, foam, crops, roads, crags, ice, lava, topo hypsometric colours) | L6014–L6288 | 275 |
| Labels with dark stroke, speech bubbles, brush cursor ring | L3808–L3832, L4000–L4034, L8229–L8241 | 70 |
| Emoji tool icons and season icons | L7500, L7762–L7831 | — |

### Shared-code clues
- None of the code or comments name another of Chris's games or repos. I searched for claude, witch, mooncart, envoi, aethermoor, stranded and chris, and found nothing in the current file.
- `function mulberry(a){…0x6D2B79F5…}` (L449) and an identical copy in the atlas, `function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;…}` (L4147): standard mulberry32. It's worth matching against other games' RNG helpers.
- Save and settings keys: `localStorage.getItem('tinydominion.settings')` (L431), `indexedDB.open('tinydominion',1)` (L8910). The debug global is `window.__td` (L9155).
- The CSS theme follows the claude.ai artifact contract: `:root:not([data-theme="light"])` and `:root[data-theme="dark"]` (L19–L21). `tools/build.mjs` writes an "artifact flavour" page: `// artifact flavour: the host wraps the page in its own document, so ship only title, fonts, style, body and script`.
- History: the original file had an LLM "Claude as the rulers" council using `window.claude.use('sample')` (original L1545, L1647). Commit `19df2f3` "Replace the Claude council with built-in ruler minds" replaced it with the current `45-mind.js`.

### Notes
- **Dead code:** the `tapAt` cases `'flood'` and `'ebb'` (L7906–L7907) and the check in `drawCursor` (L8233) refer to tools that no longer exist in `CATS`. `setWatch` looks for a `#watchBtn` element that doesn't exist (L8202). `flattenLand` (L2937) and `stopCam` (L8181) are never called, and `R.noSprites` (L6874) is never set. `rel3dBake` sets `cam.z=8` and restores it on the next line (L7335–L7337); its sprite pass (L7349–L7361) never runs because the lists were just cleared. `drawClouds` makes an unused `r` (L3838, L3849). `saveMetaAll` runs a `getAll()` and throws the result away (L8926).
- **Not reproducible:** the seed word only fixes the starting world. All simulation and growth after generation uses `Math.random`.
- **Coupling across source files:** the files share globals through one IIFE. `worldAge` is declared in 80-ui (L7491) but reset in 10-world (L631) and used in 40-rulers (L2000). `hoverP` is declared in 82-camera (L8175) and read in 55-terra (L3081). `brush` lives in 60-powers but is used by 55-terra `terraBrush` (L2920). `speed` from 80-ui is read in 73-scene, 75-relief and 85-audio. Pulling any module out will need these untangled.
- **Name shadowing in the atlas:** inside `atlBuild` the local names `cv`, `banner`, `effects`, `rnd`, `seed`, `W`, `H` (L4095, L4256, L4336–L4339, L5875) shadow globals. It's safe today because of the closure, but it's a trap when moving code.
- **Duplicated systems inside the game:**
  - two full renderers (classic 2D and WebGL2), so each building and unit is drawn twice in different styles
  - two minimap paths
  - two brush shapes: `forBrush` with radius brush−1 and `terraBrush` with radius brush+.5
  - two value-noise generators (`mkNoise`, `vnoise`) and three hashes (`hsh`, `h1`, `hashStr`)
  - two shader-compile helpers (L6410–L6421 and L7371–L7374)
  - two peace chronicle paths (L1929 and L2427)
  - two near-duplicate chart drawers (L8052 and L8110)
- **Full-map scans in hot paths:** `ruinVillage` (L1558), `upgradeRoads` (L1371), `seaStep` (every 5 ticks while the sea moves, L3003), the yearly ice count every 4 years (L3288) and the 3D base-height scan every frame (L7403, every 7th tile).
- **Save versioning:** there is one version (1) and an exact-match check. Compatibility depends on `||` defaults in `restore`.
- **Offline:** the page loads Google Fonts from the network (L7–L9) and falls back to monospace without it. Mooncart's offline rule would need the font inlined or dropped.
- **Time bases:** the day/night cycle runs on real time (150 s) while seasons run on sim ticks, so at 20× the seasons fly past while the days stay slow (season tinting is faded out at high speed).
- **Original version** (`original/Tiny_Dominion_original.html`, 2,824 lines, 136,713 bytes; grep only). It already had mulberry/value-noise world gen, the creature sim with flow fields (`flowOf`), sea BFS (`seaPath`) and boats, villages and kingdoms, rulers with the same 6 traits, wars, alliances, secession and succession, fire and disasters (volcano, tornado, meteor, plague, dragon, zombies), the 2D canvas renderer and minimap, localStorage settings, the `presim` head start and the `__td` hook. It had 5 ages (`'Tribal','Bronze','Iron','Castle','Golden'`) and the `window.claude` council. Not found in the original: WebGL, IndexedDB saves, Web Audio, wonders, caravans, siege, planes, rockets, carbon/climate, sculpting and the 3D relief view.
