## Stranded (The Clearing)

**What it is:** Dagr's survival game. One grown-up (or a crew of up to four) is stranded for a year in a North Texas clearing where people never existed. It has real weather, calories and wildlife, a walk around twelve places, quests, hunting and fishing minigames, and robot players that test the balance.
**Inventoried:** `cursed-worlds` @ `origin/claude/jolly-mendel-bqoxiy` (`259f0bc`), `the-clearing-stranded/index.html`: full size 696,403 bytes, stripped 696,403 bytes (680 KB; nothing was stripped because the file has no base64), 8,468 lines, longest line 1,396 chars. The living layer is `the-clearing-stranded/living/` (separate files). The tools are in `the-clearing-stranded/tools/` (read with `git show`).
Line numbers: `index.html:N` refers to the stripped `stranded/index.html`. `living/<file>:N` refers to the stripped `stranded/source/the-clearing-stranded/living/<file>`. Tool lines are the line numbers in `git show origin/claude/jolly-mendel-bqoxiy:the-clearing-stranded/tools/<file>`.
**Tech:**
- **Rendering:**
  - 2D canvas pixel art for the side-view "Look" picture and the top-down "Walk" map.
  - three.js r128 (WebGL, orthographic camera) for the "living" layer drawn over Chris's painted backgrounds. If WebGL is missing, the game falls back to the 2D canvas.
  - The 2D fishing game is plain canvas. The UI and the field map are DOM and SVG.
- **Module style:**
  - index.html has five classic `<script>` IIFEs that share globals: `window.DATA`, `window.Engine`, `window.Scene`/`window.World`, `window.Skill`, and the SCREEN IIFE.
  - It loads 19 `living/*.js` files with `<script src>` (index.html:4309–4329): `vendor/three.r128.min.js`, `trace.js`, `merge.js`, nine `traces/*.js`, `stage.js`, `survivor.js`, `camp.js`, `life.js`, `things.js`, `beasts.js`, `sound.js`, `hunt.js`, `fishing.js`.
  - `walker.js` and `camp-alive.*` are not loaded by the game. They belong to the demo page only.
  - Each living file is a global-defining IIFE (`makeStage`, `makeSurvivor`, `Trace`, `Hunt`, `Fishing`, `GameSound`, …).
  - The paintings are external `art/places/*.webp` files.
  - `tools/build-game.mjs` inlines every living script and every painting (as `window.STRANDED_ART` data URIs) into one offline `Stranded.html`, which is not kept in git.
- **Outside libraries:** three.js r128 (vendored), and Google Fonts (Archivo Narrow, Newsreader), loaded non-blocking with fallbacks (index.html:19–25).

### Coverage
- **Read fully:**
  - index.html:1–25 (head)
  - index.html:26–78 (CSS tokens)
  - index.html:588–760 (DATA, start)
  - index.html:1266–2450 (engine core: RNG, time, weather, body, inventory, ecology, clock, new game, eat/drink/sleep/travel, camp actions)
  - index.html:2764–4307 (foraging, exploring, fishing, hunting, encounters, crafting, action runner, views, advice, quests, planner, save/load, partners)
  - index.html:4330–4720 (scene setup, sky and light, noise, pixel painter)
  - index.html:5613–5720 (View, walk header)
  - index.html:5895–6000 (map generation, routing)
  - index.html:6316–6378, 6411–7189 (walk state, input, movement, partner placement, menus, frame loop, drawing, effects, GB filter, living bridge)
  - index.html:7190–7423 (skill moments)
  - index.html:7424–7960, 8057–8157, 8234–8466 (SCREEN: storage, title, HUD, party clock, hooks, guidance, tabs, journal, results, minigame wiring, input). Some long template lines were cut at 260 chars.
  - living/: `trace.js`, `merge.js`, `stage.js`, `traces/camp.js`, `hunt.js`, `sound.js`
  - `fishing.js` 1–40, 221–512, 620–657
  - `survivor.js` 1–110, 273–300, 345–421
  - `camp.js` 1–40, 120–145, 375–428
  - `life.js` 1–80
  - `walker.js` 1–30
  - `camp-alive.js` 1–40
  - All 11 tools, read fully: `autoplay.mjs`, `engine.mjs`, `build-game.mjs`, `build-living.mjs`, `phone-check.mjs`, `minigames-check.mjs`, `partner-check.mjs`, `places-check.mjs`, `trace-check.mjs`, `living-check.mjs`, `living-tour.mjs`
  - The repo `README.md`, and `living/README.md`
- **Skimmed:**
  - DATA tables index.html:760–1265: counted and sampled (foods, crops, species, game, fish, recipes, guide, achievements, quests).
  - CSS index.html:80–583: selectors outlined.
  - Action definitions index.html:2450–2764: cut to 200 chars, outlined.
  - Side-view painting `paint()` index.html:4722–5520: section headers, materials, `facts()`, and the first ~70 lines of `paint`.
  - `PLACES` index.html:5722–5895: first 3 of 12 places.
  - Craft tab index.html:7959–8056 and sheets index.html:8158–8233: function names.
  - living/`beasts.js`: kinds and animate grep. `things.js` and `life.js`: headers and section outline.
  - `survivor.js` move list (names only, 300–331).
- **Skipped:**
  - Walk sprite art (`wart`/`wbake`/`WOBJ`/`WBUILD`/`wPerson`/`WBEAST`, index.html:6001–6315) and `wbuilds` (6380–6410): drawing recipes, names only.
  - `fishing.js` fish drawing (51–220) and `draw()` (526–619).
  - Geometry bodies in `survivor.js` (110–272), `camp.js` (40–375) and `beasts.js` (25–158).
  - The other eight `traces/*.js` (sizes only).
  - `vendor/three.r128.min.js` (library).
  - `camp-alive.css`.
  - `Stranded_Living_Camp.html`: not read line by line. I checked it by diff instead; see Notes.

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| index.html:1–25 | presentation | head, the "five parts" comment, non-blocking font loader | 25 |
| index.html:26–583 | presentation | STYLE: surveyor's-field-book CSS, light/dark tokens, HUD, walk overlay, sheets | 558 |
| index.html:588–1265 | content | DATA (`window.DATA`): climate, starts, levels, places, foods, kits, crew, crops, forage, species, hunt, game, fish, skills, recipes, guide, badges, quests, causes | 678 |
| index.html:1266–2277 | systems | ENGINE core: RNG, time, weather, body, inventory, food lots, skills, ecology, crops, clock, new game, results, eat/drink/sleep/travel | 1,012 |
| index.html:2278–3047 | content + systems | 64 `act()` job definitions (+8 generated `hunt_*`/`fish_*`), foraging, exploring, fishing and hunting resolution | 770 |
| index.html:3049–3433 | systems | encounters/hazards, crafting, action runner | 385 |
| index.html:3435–4038 | systems | view models, advice, quests, planner, progression, save/load | 604 |
| index.html:4039–4305 | systems | partners/crew AI, engine exports and test hooks | 267 |
| index.html:4308–4329 | asset loading | `<script src>` for the living layer | 22 |
| index.html:4330–5704 | systems + presentation | SCENE: sky/light model, noise, pixel painter, side-view `paint()`, `View` | 1,375 |
| index.html:5707–6442 | systems + content | WALK: `PLACES` layouts, map generation, routing, sprite art, beasts | 736 |
| index.html:6443–6936 | systems | walk input, movement, camera, menus, partner placement, drawing, effects, GB filter | 494 |
| index.html:6938–7188 | systems | living bridge (`lv*`), `World`/`Scene` exports | 251 |
| index.html:7190–7423 | systems | SKILL MOMENTS: 5 canvas minigames (`window.Skill`) | 234 |
| index.html:7424–8466 | presentation + systems | SCREEN: storage, title, HUD, party clock, guidance, tabs, journal, sheets, minigame wiring, input | 1,043 |
| living/stage.js | systems | painted stage: locked ortho camera, painting shader, particles, lights, shadows | 447 |
| living/trace.js, traces/*.js (9) | systems + content | painting trace → walk grid, depth map, checks; per-place traces | 137 + 576 |
| living/survivor.js, camp.js, beasts.js, things.js, life.js, merge.js | systems (3D models) | procedural toon models, rig and moves, camp, animals, props, grass and birds, mesh merging | 421+428+158+45+242+32 |
| living/hunt.js | systems | 3D hunting minigame | 376 |
| living/fishing.js | systems | 2D fishing minigame and 16 fish drawn in code | 657 |
| living/sound.js | systems | WebAudio SFX | 45 |
| living/walker.js, camp-alive.{js,html,css} | demo | A* walker and the camp bench page (not in the game) | 85+195+64+63 |
| tools/*.mjs (11) | tests/build | robot players, 7 browser checks, 2 builders, engine loader | 1,150 |
| **Totals** | | index.html 8,468; living source ~3,970 (excluding vendor and the built page); tools 1,150 | **~13,590** |

### Systems

#### 1. Seeded RNG: random numbers
- **Does:** mulberry32. Its state lives in the save (`s.rng`, seeded by `s.seed`), so a saved game keeps its own dice. Helpers on top give chance, uniform range, integer range, pick, a Gaussian (Box–Muller), weighted pick and shuffle. All engine dice go through it.
- **Main pieces:** `rnd(s)` (index.html:1287), `chance/rr/ri/pick` (1288–1291), `gauss` (1292), `wpick` (1296–1303), `shuffle` (1304).
- **Size:** ~18 lines.
- **Depends on:** the state object only.
- **Tangled with content:** clean.
- **Fingerprint:**
  - Engine: mulberry32 (`+0x6D2B79F5`, imul/xorshift), state in `s.rng`, `seed = opt.seed ?? Math.random()*2^32`.
  - Scene: a separate LCG `rng(seed)` (`1664525/1013904223`, seed×2654435761) for stable flowers and clouds (4361). Walk noise table uses an LCG `1103515245/12345` (4457).
  - living/: Park–Miller `seed*16807 % 2147483647` (stage.js:25, camp.js:18, life.js:15).
  - Minigames, beast wandering and skill moments use `Math.random` (not reproducible).

#### 2. Time, calendar and moon: time
- **Does:** Game time `s.t` is in hours from start. The start day of year `doy0` comes from the chosen season. The calendar has 365 days with no leap years. Sunrise and sunset are per-month tables. Dark, evening and twilight are tests against those. The moon phase is real (29.530588-day lunation from Jan 1). There is a 12-hour clock string.
- **Main pieces:** `dayIdx/hourOf/dateOf/today` (index.html:1307–1316), `isDark/isEvening/twilight` (1317–1319), `moonPhase` (1323), `inWin` (1324), `clock` (1329).
- **Size:** ~30 lines.
- **Depends on:** `D.MONTH_DAYS`, `D.SUNRISE`/`SUNSET` (index.html:599, 606–607).
- **Tangled with content:** clean. The sun tables are DFW-specific data.
- **Fingerprint:** dark = before sunrise−0.4 h or after sunset+0.4 h. Evening = from sunset−1.5 h. Twilight = ±1.75 h of sunrise, or sunset−2.25 to +0.75 h.

#### 3. Weather and temperature: simulation and effects
- **Does:** Generates each day from DFW monthly normals:
  - Gaussian highs and lows.
  - Cold fronts ("northers": −10 to −22 °F, 12% chance Nov–Mar).
  - Summer heat bumps.
  - Rain chance from rainy days per month, halved after 25 dry days. Rain amount is exponential in mm; storms happen Mar–Oct; snow or ice when the low is ≤31 °F in Dec–Feb.
  - Wind from monthly means. A norther adds 10–18 mph and a storm adds 6.
  - Temperature follows a cosine curve: low at 6 h, high at 16 h, into the next day's low, −6 °F while raining by day. Wind chill is the NWS formula with shelter and woods factors.
  - Floods after ≥30 mm of rain.
- **Main pieces:** `genWx` (index.html:1338–1363), `windOn` (1366), `feels` (1373–1379), `icy` (1381), `rainNow` (1385), `tempAt` (1391–1399), flood handling in `newDay`/`floodHits` (1876–1878, 1913).
- **Size:** ~65 lines.
- **Depends on:** RNG, time, `D.HI/LO/RAIN_DAYS/WIND`.
- **Tangled with content:** needs some untangling: DFW constants are inline (front months, magnitudes).
- **Fingerprint:**
  - Today and tomorrow are pre-rolled (`s.wx.today/next`), so the camp panel can show tomorrow's forecast.
  - Wind chill applies only at ≤50 °F with wind ≥3 mph: `35.74+0.6215T−35.75v^.16+0.4275Tv^.16`.

#### 4. Body and survival simulation: stats
- **Does:** Four meters:
  - Health 0–100.
  - Hydration 0–100%, with 7.5 L of body water before death.
  - Calorie reserve: `RES_MAX` 30,000 kcal per person.
  - Energy 0–100.
- Water loss per hour depends on work level, heat (worse on harder levels), sickness and protein poisoning. Calorie burn is 70.8 + work offset, plus shivering (cold stress × 3.2, capped at 160).
- Damage sources: dehydration, starvation, hypothermia (cold stress/40 × 0.9 × level damage), heat stroke, illness, venom. Each damage source is tracked with decay so the death cause is the biggest one.
- Insulation comes from work, shelter level, bed, blanket and fire. Wet clothes multiply cold stress by 1+1.4×wet.
- Sleep quality: base 0.42 plus shelter, bed and hut bonuses, minus rain, cold, conditions and hunger.
- Conditions tick down: infection incubation → sickness, venom, rash, sprain, protein poisoning.
- `perf()` multiplies job yields by the meter levels.
- **Main pieces:** `foodPct/perf` (index.html:1481–1493), `yieldM` (1494), `hurt` (1523), `insulation` (1535), `coldStress` (1548), `sleepQ` (1549), `stepBody` (1570–1639), `gainKcal/infect` (2033–2044), `chips` (3441).
- **Size:** ~140 lines.
- **Depends on:** weather, time, difficulty `LV(s)`, camp state.
- **Tangled with content:** needs some untangling: survival constants are inline, but it is all one function.
- **Fingerprint:**
  - Water loss L/h: sleep .045, rest .09, light .11, moderate .15, heavy .22.
  - kcal/h offsets: sleep −10, rest +5, light +25, moderate +60, heavy +110.
  - 15 bars × 150 kcal is the daily maintenance (`D.BAR_KCAL`).
  - Eating cap is 4,500 kcal a day.
  - Healing only when not sick, reserve >55% and hydration >50.

#### 5. Inventory, materials and food lots: inventory and economy
- **Does:** `s.inv` holds materials, `s.gear` holds kit and `s.tools` holds flags and counts. `have/add/missing/consume` handle substitutions: planks for poles, nylon paracord for vine or yucca cord (your own cord is used first).
- Food is a list of lots `{key, kg, kcal, st: fresh|raw|cooked|smoked|dried, exp, rack}`. Lots with the same key and state that expire within 8 h of each other merge.
- Spoil time = days × 24 × a temperature multiplier (0.6 when hot, up to 2.6 when cold).
- The cache and storehouse slow the clock. The drying rack smokes meat (30 h, 20 with salt) or dries fruit in sun hours.
- Water is tracked as clean and raw litres, with a mixed infection risk, capped by container capacity.
- **Main pieces:** `have/add/missing/consume/capacity` (index.html:1412–1445), `spoilMult/cachedFood/lotName/addFood/trimLot` (1449–1477), rack and cache progress in `stepCamp` (1743–1764), `E.foodList` (3503).
- **Size:** ~90 lines.
- **Depends on:** RNG, weather (spoilage), `D.FOODS/MATS/GEAR`.
- **Tangled with content:** needs some untangling: special keys (`snares`, `CORDS`, planks) are hard-coded.
- **Fingerprint:**
  - kcal = kg × 10 × kcal per 100 g.
  - Capacity = bottle 1 L + bags×5 + bowl 3 + pot 6 + rain catcher 20.
  - About 45% of a fish's weight is meat (index.html:2885).

#### 6. World ecology: wildlife evolution and crop ripening (procedural simulation)
- **Does:** Seven species are populations of individuals `[wariness, mutationRate]`.
- Every month: deaths are weighted toward the less wary. Births happen in breeding months with logistic crowding to a cap. "Dagr's rules" apply: each birth has a 10% mutation chance, 25% of mutations are good, and 20% of mutations change the mutation rate itself. Some species gain immigrants.
- Harvesting removes the least wary first (weight 1/w^6). So over-hunting makes a species warier, which lowers catch odds through `aware()`. Density lowers odds through `dens()`.
- Crops ripen daily on a triangular distribution over their season window, with daily decay. Pecan crop size is rolled poor, fair or bumper.
- Bison herds and passenger pigeon flocks arrive by chance. Wood stocks regrow daily. Lean-meat days trigger protein poisoning.
- **Main pieces:** `meanW/dens/aware/harvest` (index.html:1642–1651), `ecoTick` (1652–1683), `seasonTotal/cropDay` (1687–1710), world events in `newDay` (1880–1910), `E.ecoList` (3517).
- **Size:** ~95 lines.
- **Depends on:** RNG, `D.SPECIES/CROPS`.
- **Tangled with content:** clean. All numbers come from tables.
- **Fingerprint:** `dens = clamp((n/start)^0.6, 0, 1.3)`; `aware = (0.8/max(0.3, meanW))^2`. The "evolve" badge needs 10% warier with 3 or more taken.

#### 7. Time-passing pipeline: game loop (simulation)
- **Does:** Every action advances time through `pass(s, hours, work, R, ctx)`. It works in fixed 0.25-hour sub-steps. Each step:
  - crosses midnight with `newDay` (weather roll, crops, stocks, monthly ecology, events);
  - steps the body;
  - steps camp (fire fuel, rain putting out an unsheltered fire, rack, pot drying, rain catcher);
  - steps the night (fish trap and snare catches as Poisson-style odds per 9 h, night raids by raccoon, opossum, coyote, wolves or bear, with protection from the hang, storehouse or crates);
  - checks spoilage;
  - steps the partners.
- In the party game, the screen also calls `E.tick(s, mins)` in real time (system 30).
- **Main pieces:** `pass` (index.html:1713–1729), `stepCamp` (1731), `stepNight` (1778), `trapCatch` (1801), `raidCheck` (1813–1858), `spoilCheck` (1860), `newDay` (1867–1911), `E.tick` (4288).
- **Size:** ~210 lines.
- **Depends on:** systems 3–6, 18.
- **Tangled with content:** needs some untangling: raid animals, their amounts and messages are inline.
- **Fingerprint:** fixed 0.25 h step; night window 20:30–05:30; raids 22:00–05:00 with at most one per night.

#### 8. Action registry and result records: core framework
- **Does:** Jobs are registered with `act({id, loc, name, icon, h, work, dark, wading, haz, show(s), can(s), sub(s), run(s, R)})`.
- `E.actions(s)` lists the jobs available here with ok/why. `E.run(s, id, {skill, play})` checks (dark, venom, exhaustion, `can`), sets the skill score `SK` and minigame result `PLAY`, runs the job, records `did[id]` counts, awards skill points, rolls hazards and calls `finish()`.
- `finish()` gathers messages, guide unlocks, badges, quests and partner news into one result record `R`, plus meter deltas.
- Errors come back as `errR` records ("Not yet").
- `E.pendingView`/`E.choose` resolve two-step choices (hunt, encounter).
- **Main pieces:** `act/AMAP` (index.html:2228–2229), `checkAct` (3383), `E.actions` (3395), `E.run` (3402–3416), `E.pendingView/E.choose` (3417–3433), `newR/errR/finish` (1999–2030), 64 `act()` definitions (2279–2763), plus loop-generated `hunt_<oak|prairie|creek|beaver>` (2494) and `fish_<pond|river|creek|beaver>` (2894).
- **Size:** ~120 lines of framework, plus ~490 lines of job definitions.
- **Depends on:** everything in the engine.
- **Tangled with content:** framework clean, definitions content. Jobs are data plus a `run` closure with inline text and odds.
- **Fingerprint:**
  - Result record shape: `{title, icon, lines[], gains[], notes[], ach[], quests[], opened[], skills[], catches[], mate[], delta, t0, t1, pending, dead}`.
  - `did` counters (`id`, `id+` when food came back) are what quests test.
  - The screen never mutates state except through `Engine.*`. The exceptions are `s.pin`, `s.map` and test hooks.

#### 9. Hazards, encounters and sightings: events
- **Does:** After a job, each hazard rolls `1−(1−ph)^hours`. The table gives place, months, job filters, wading and dusk multipliers, and the level's `haz` scale.
- Wasps and copperheads hit at once. Rattlesnake, cottonmouth, gator, wolves, bear and cougar become a pending choice: back away, kill, or shoot.
- Each resolution has hard-coded odds, scaled by √perf and the skill score.
- Otherwise a one-time wildlife sighting may unlock a field-guide entry.
- **Main pieces:** `ENC` (index.html:3050), `encOpts` (3058), `snakeMeat/snakeBite` (3080–3091), `encResolve` (3092–3152), `HAZ` (3153), `triggerHaz` (3163), `rollHazards` (3174), `SIGHT/sightings` (3198–3226).
- **Size:** ~175 lines.
- **Depends on:** RNG, body (`hurt`), skill score, guide.
- **Tangled with content:** deeply tied: odds and outcomes are per-animal code branches.
- **Fingerprint:** a rattler back-away succeeds 97% of the time; a dry bite is 22%; club kill = 0.88 × √perf × (0.8 + 0.4·SK).

#### 10. Hunting resolution: battle (dice or minigame)
- **Does:** A two-hour hunt rolls an encounter list per place. Each entry's chance is scaled by time of day (×1.6 at twilight, ×0.6 at midday), being spooked (×0.35 for 18 h after a rifle shot), rain, perf, level, the tracking skill, species density and wariness, the deer trail and the lookout.
- Flock birds come in coveys. Legends (Ghost Buck, Old Bull) appear at the lick at dusk once their signs are found.
- Choice: shoot, arrow, wait for bigger game, or pass.
- With no minigame played (robot players, or the old aim moment), the dice decide. Rifle hit = `0.84 × √perf × √aware × skm × perk(hunting)`. Arrow = 0.58 (0.70 with chert points). The result is clamped 0.05–0.97.
- With a flock, extra birds come while `chance(0.3·skm)` holds, up to min(3, n).
- If the 3D minigame was played, its `{shots, hits}` decide instead.
- Bison yield scales with party "hands". A bison kill leaves a carcass that draws wolves for 3 days.
- **Main pieces:** `huntRoll` (index.html:2911), `huntGo` (2931), `legendSigns/legendAt` (2943–2959), `huntFlock` (2961), `SPOT/KILL` texts (2962–2989), `huntView` (2990), `huntResolve` (2998–3047).
- **Size:** ~140 lines.
- **Depends on:** RNG, ecology, skills, the `PLAY`/`SK` from system 8.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** `skm() = 0.55 + 0.9·SK`, so an ordinary try (SK 0.5) = ×1.0; a missed Old Bull charges 50% of the time.

#### 11. Fishing resolution: minigame bridge
- **Does:** `fishPool` builds a bite rate and a weighted species list for the water, month and hour:
  - warm-water fish ×0.35 in winter;
  - night feeders ×2 at dusk or dark;
  - the spawning run ×6 in its months;
  - the River Giant ×20 with the big bait at dusk.
- The bite rate uses √density, √awareness, a dusk ×1.4 bonus, hot midday ×0.7, cold ×0.55, grub bait ×1.4, level and fishing skill.
- One hour: if the minigame was played, its `{fish:[{sp,kg}], lost}` is used, clamped to the fish living there and their weights. Otherwise the dice give 5 tries of `chance(0.32·rate·skm)`. A hooked fish is lost with chance `0.3·fight·(1.6−0.6·skm)`, and weight is `min + range·rnd·rnd`.
- Spear, frog and trap jobs have their own dice (for example, spear 2707–2730).
- **Main pieces:** `fishPool` (index.html:2839–2854), `pickWeighted` (2855), `fishSub` (2856), `fishGo` (2860–2893), `E.fishPool` (2899).
- **Size:** ~60 lines.
- **Depends on:** ecology, `D.FISH`, skill.
- **Tangled with content:** needs some untangling: legend side-quest flags are inline.
- **Fingerprint:** the minigame receives exactly `fishPool()` as its `pool`, so game and dice share one bite model.

#### 12. Crafting, recipes and projects: crafting
- **Does:** 32 data recipes in groups Tools, Shelter, Water, Food, Hunting, Camp and Huts. Each has `need` (materials, gear, tarp m²), `give`, `flag`, `count`/`max`, `shelter` level, `hut`, `special` (pot, firepot, leach), `session` (multi-session projects that reserve materials) and prerequisites (recipe, oneOf, potStage, food, discovery).
- Build time is scaled by the workbench (×0.8 at camp), the workshop hut (×0.85) and the skill level (−3% per level, floor 0.75).
- Special outcomes: firing a pot succeeds `0.55 + 0.1·tries` (cap 0.85); leaching acorns uses 2 L of water.
- **Main pieces:** `RECIPE_PREREQ` (index.html:943), `RMAP/recTotal/recipeBuilt/prerequisiteView/recWhy/recState` (3229–3277), `E.recipes` (3278), `DONE` texts (3292), `complete` (3317), `E.craft` (3356–3380).
- **Size:** ~160 lines, plus 76 lines of recipe data (866–941).
- **Depends on:** inventory, `pass`, skills.
- **Tangled with content:** fairly clean (data driven); the specials are coded.
- **Fingerprint:** a session project consumes its materials on the first session; `s.proj[id] = {done, total}`.

#### 13. Planner (next concrete step): goal and dependency solver
- **Does:** `E.plan(s, recipeId)` returns one actionable step:
  - `{craft}`;
  - `{go, act}` (walk somewhere and do a job);
  - `{wait}` (nothing possible yet);
  - `{done}`;
  - or text only.
- It recurses up to depth 4 through prerequisites and made-ingredients (`D.MAKES`), and maps missing materials to places through `D.SOURCES`/`sourceOf`. It knows about exhausted stocks, firelight, darkness and energy.
- `reach/NEEDS` do the same for a job ("you need a burning fire first" → `fireStep`). So no hint ever points at a button the game would refuse.
- **Main pieces:** `fireStep` (index.html:3856), `stringStep` (3876), `nextHut` (3884), `sourceOf` (3885), `E.plan` (3892–3936), `NEEDS` (3778–3803), `reach` (3804), `plan1` (3769), `foodToRack` (3770).
- **Size:** ~140 lines.
- **Depends on:** crafting, actions (`checkAct`), inventory.
- **Tangled with content:** needs some untangling: place-specific fallbacks such as "Cedar Stand picked clean" are coded.
- **Fingerprint:** step object `{text, go, act, craft, wait, done, via, need, how}`. The same shape is used by advice, quests and the walk's orange marker.

#### 14. Advice ("one voice"): guidance AI
- **Does:** A priority list:
  1. Urgent needs: thirst (with the best water source), nightfall away from camp, exhaustion, early snakebite, hunger.
  2. Goals gathered in order: first aid, evening fire stocking, the first fire (match, then bow drill), shelter, water container, safe water, bed, trap, rack, food goals, roof, hang, snares, cache, wood store, workbench, bow, camp upgrades, walls, firewood, huts, exploring.
- The first goal whose next step is actually doable wins.
- `foodGoals` ranks spoiling catch → rack → traps and snares → acorns → ripe fruit and pecans → bison → fishing and hunting by time of day → spear, crawfish, forage.
- Jobs a partner is already out doing are filtered out.
- **Main pieces:** `foodGoals` (index.html:3542–3586), `waterGoal` (3588), `foodTip` (3602), `adviceGoals` (3607–3661), `lead` (3663), `fireReady` (3665), `doable` (3674), `E.advice` (3682–3723).
- **Size:** ~185 lines.
- **Depends on:** planner, actions, partners.
- **Tangled with content:** deeply tied: the game's whole strategy and its text are inline.
- **Fingerprint:** robot players and the "Next step" card use the same function. autoplay fails a game if the card points at a refused button.

#### 15. Quests: quests and progression
- **Does:** 33 quests: 20 main quests in 5 chapters, and 13 side quests.
- Each step is a declarative condition: `recipe | did (+n) | inv | stat | tool | found | ach | flag | visits | shelter | food | any[]`, with `at: [place, job]` for the map marker and a `hint`.
- Steps are checked against the live state, so anything already done counts. Side quests open when `when` holds (`crop` ripe, `world` event, or any condition) and count only what is done after opening, using a `did` snapshot.
- Some quests are kit-specific (`kit: 'real'`). The player can follow any open quest.
- `stepGuide` turns a step into a doable instruction through the planner.
- **Main pieces:** `D.QUESTS` (index.html:1072–1248), `cond` (3730), `whenOK` (3746), `checkQuests` (3757), `stepGuide` (3815), `questView` (3835), `E.quests/E.quest/E.follow` (3842–3851), `E.progression` milestones (3944–3971).
- **Size:** ~130 lines of code, plus 177 lines of data.
- **Depends on:** planner, state counters.
- **Tangled with content:** clean engine; the data is content.
- **Fingerprint:** quests are checked in `finish()` after every action. `s.quest = {done: {id: day}, open: {id: {day, base}}, follow}`.

#### 16. Skills, XP and collections: stats, leveling and progression
- **Does:** 8 skills: exploring, hunting, tracking, fishing, foraging, fire, building, crafting.
- Points come from jobs mapped by id regex. Repeating the same job more than 3 times in one day teaches nothing. Each level adds +4% to its jobs (`perk`). Titles run from Green to Legend.
- Also: 24 badges (`ach`), a field guide of 58 entries unlocked by first encounters, and a catch log (count and biggest per species).
- **Main pieces:** `lvl/perk/SKILL_OF/skillFor/skillUp` (index.html:1497–1514), `logCatch` (1516), `unlock/ach` (1404–1409), `checkAch` (2004), `E.skills` (4035), `E.catchLog` (4297), `E.guideList/guideCount` (3512–3516).
- **Size:** ~60 lines.
- **Depends on:** action runner.
- **Tangled with content:** clean.
- **Fingerprint:**
  - Stats: the 8 skills. No combat stats.
  - XP curve `D.SKILL_LEVELS = [0,4,10,18,28,40,55,72,92,115]` for levels 1–10 (index.html:862). No formula; the table is roughly quadratic.
  - Partner work earns no XP (`if (MATE) return`).

#### 17. Game setup: difficulty, start season, kits and party (settings and balance)
- **Does:** Three levels scale 15 knobs (Hard = real numbers = 1.0): `dmg, infect, sickLen, yield, catch, snare, hunt, raid, ivy, fire, coals, pot, haz, cold, heat`. Four start dates.
- Two kits:
  - realistic: 3, 4 or 6 days of bars by level, 10 matches, paracord, one tarp, bottle, first aid, multiplied per person;
  - Dagr's first: 2 crates, 2 tarps, 100 bars.
- Party is solo, duo, trio or four. Rations can be "each" or "shared". Everyone eats from the shared pool (`take = per × P`).
- **Main pieces:** `D.STARTS/LEVELS` (index.html:609–629), `D.KITS/PARTY/CREW` (712–727), `LV(s)` (1276), `E.newGame` (1922–1982), `E.intro` (1984).
- **Size:** ~90 lines.
- **Depends on:** all the systems the knobs feed.
- **Tangled with content:** clean.
- **Fingerprint:** Easy `{dmg .6, infect .4, yield 1.15, catch 1.2, snare 1.4, hunt 1.15, fire +.15, cold .6, heat .7}`; Medium uses intermediate values.

#### 18. Partner and crew AI: NPC AI
- **Does:** Each partner runs a day as job records `{k, act, at, say, t0, t1 (arrived), t2 (work done), t3 (back)}` on the game clock.
- `mateJobs` scores candidate jobs from camp needs: water, boiling, fire, wood, builds, missing materials, snares, trap, food by a hunger factor, fishing.
- `mateChoose` adjusts the scores:
  - random 0–10;
  - −10 for repeating the last job;
  - one-person jobs (water, boil, fire, snares, trap) blocked if someone already has them;
  - wood −35, or −8 if cold and low;
  - two can build together (+4);
  - +8 for a crew member's strengths;
  - +12 to stay at camp when two or more are away and the fire is lit;
  - −12 or −6 for long trips in rain or cold.
- It skips jobs that can't finish before dark, and sleeps at night. It writes the plan as dialogue ("June is getting water, so …").
- Jobs run through the same `act.run` code with `MATE = true`: no time passes for you, yield is scaled, and there are no injuries or XP.
- A tally of jobs per partner feeds the robot players' report.
- **Main pieces:** `MATE/MATE_YIELD` (index.html:4047–4051), `newMate/crewName/mateOK` (4052–4063), `mateWater/mateWood/mateNeed` (4069–4098), `mateJobs` (4099–4119), `mateShort` (4123), `mateChoose` (4143–4198), `mateRun` (4201), `mateBuild` (4210), `mateTell` (4219), `mateDeliver` (4237), `mateStep` (4249–4262), `mateNews/mateView` (4263–4286); walk placement in system 26.
- **Size:** ~260 lines.
- **Depends on:** action registry, recipes, `pass`.
- **Tangled with content:** needs some untangling: job list and lines are inline, but the scoring structure is reusable.
- **Fingerprint:** `MATE_YIELD = {2: 0.3, 3: 0.42, 4: 0.39}`, "set by the robot players so a bigger party lasts about as long as one person alone" (index.html:4048–4050). Nobody falls more than 6 hours behind (4258).

#### 19. Save and load: save
- **Does:** `E.save` = `JSON.stringify(state)`. `E.load` rejects anything with `v !== 1` or malformed records. It checks every numeric field, food lot, project, log entry, pending choice, species and crop.
- It also migrates older saves in place: hooks, kit, matches, paracord, chert/salt, secret places, drill fires, saplings, quests, XP, catch log, huts, partners from `s.mate` to `s.mates`, and difficulty `real`→`hard`.
- The screen autosaves to localStorage after every result, 1.5 s after the walk stops, and every 20 party-clock ticks. Death deletes the save and records the best days.
- Save codes are base64 of UTF-8 JSON (export/import sheets).
- **Main pieces:** `E.save/E.load` (index.html:3972–4033), `KEY/store` (7434–7439), `autosave/recordBest/encode/decode` (7629–7641), `exportSheet/importSheet` (8300–8317).
- **Size:** ~85 lines.
- **Depends on:** engine schema.
- **Tangled with content:** needs some untangling: field lists are hard-coded against D tables.
- **Fingerprint:**
  - localStorage keys `clearing.save.v1`, `clearing.best.v1`, `clearing.opt.v1`, `clearing.theme.v1`, `clearing.view.v1`, `clearing.gb.v1`.
  - One slot. Version field `v: 1`; migration is by field backfill, not by version.
  - The save includes the RNG state and walk position `s.map`.

#### 20. Sky, light and season palette: day/night and effects
- **Does:** `light(hud, loc)` keys a 6-stop sky ramp (top, mid, low, land tint, dim, cloud colors, stars, glow) to hours from the horizon, with pinker mornings.
- It places the sun on an arc whose noon height follows DFW's solar elevation by month. It places the moon by phase (rises 12.4 h at a time, high in winter when full).
- Overcast greys the sky. Rain dims and desaturates. Moonlight lifts the dark. Night never drops below 0.43 brightness.
- `seasonPalette(month)` gives land colors per month: spring haze, summer bleach, fall rust, winter brown post oaks. `bloom()` gives the March–May wildflower amount.
- `dayRibbon` makes the HUD's 24-hour gradient.
- **Main pieces:** `SKY/SUN/WINDOW/HORIZON/OVERCAST/noonAmp` (index.html:4373–4387), `light` (4389–4430), `seasonPalette` (4433), `bloom` (4446), `dayRibbon` (5700).
- **Size:** ~80 lines.
- **Depends on:** HUD view (`E.hud`).
- **Tangled with content:** needs some untangling: sun windows are per place.
- **Fingerprint:** colors become shading through `grade(rgb)` (desaturate, dim, tint lerp), which the 2D walk reuses (`wgrade`).

#### 21. Pixel painter, noise and vector helpers: rendering (from "The Hollow Stair")
- **Does:** `Px` is a material and light buffer. Each pixel stores a material index, a light level 0–4 and a shape id. Primitives (ellipse dome, rect slab or cylinder, tapered capsule, polygon) are shaded from pseudo-normals against a light direction, with Bayer dither and procedural textures (fur, grain, bark, cloth, stone, thatch, cellular leaf and needle).
- Seams between shapes are darkened. A one-pixel outline is drawn. Snow settles on up-facing pixels.
- Each material base color becomes a 5-step ramp: shadows hue-shift toward blue (248°), highlights toward gold (52°).
- A painter offers a transform stack (`push/pop`, flips) and an SVG path parser (M L H V Q C Z, absolute and relative), which also supports tapered strokes.
- Also: value noise, fbm, hash, cellular noise, and quadratic curve chains.
- **Main pieces:** `NZ` (index.html:4455–4479), `pathPolys` (4482), `curve` (4508), `Px` (4527–4692: `ramp`, `tex`, `buf`, `put`, `ell`, `rct`, `cap`, `pg`, `outline`, `painter`), `Img` (4695), `scan` (4709).
- **Size:** ~250 lines.
- **Depends on:** none (pure canvas).
- **Tangled with content:** clean; highly reusable.
- **Fingerprint:** light levels `lev(v)` thresholds `.9/.58/.1/−.52`; Bayer 4×4 table ±0.47; "Two changes for The Clearing: the light comes from wherever the real sun or moon is, and … snow" (index.html:4524–4526).

#### 22. Side-view scene ("Look"): rendering
- **Does:** `facts(s, hud)` reduces the game state to the facts the picture shows. These are camp kit, fire, crops, herds, flood, drought, game populations and a scare. The facts are JSON-keyed, so the picture repaints only when they change.
- `paint()` builds the static layers:
  - sky with stars, moon and sun;
  - three Cross Timbers ridges;
  - ground and treeline;
  - everything standing, back to front;
  - foreground banks.
- It also builds "live" sprite lists drawn every frame: clouds, water glints, fire, animals, birds, weather, fireflies.
- `View` owns one canvas per box. It uses about 300 art pixels across at an integer scale, a ResizeObserver, an IntersectionObserver and a visibility pause. It throttles rAF to ≥33 ms, cross-fades over 900 ms on change, and shows one still frame under reduced motion.
- The title screen shows the season you picked.
- **Main pieces:** shapes `RIDGE_A…WATER/BARE/LOBES` (index.html:4723–4744), `MATS/EMIT/NOLINE` (4747–4760), `facts` (4766–4792), helpers (4795–4824), `paint` (4829–5519), figures (5521–5611), `View` (5620–5689), `show` (5692).
- **Size:** ~980 lines (mostly drawing recipes).
- **Depends on:** systems 20 and 21, engine views.
- **Tangled with content:** deeply tied: every place is hand-painted in code.
- **Fingerprint:** 600×260 scene units; `k = round(devW/300)`; `image-rendering: pixelated`; `prefers-reduced-motion` honoured.

#### 23. Walk maps, collision and pathfinding: maps
- **Does:** Each place is a 48×32 tile grid of ground letters:
  - walkable: `g` grass, `G` tallgrass, `f` leaf litter, `t` trail, `s` sand, `m` mud, `H` hidden brush (once found);
  - solid: `F w o c k L h b r`.
- Unpainted places get maps from `pgen`. It paints shapes from `PLACES[k]`, places footprinted objects and spots, carves trails from each exit to the hub with Dijkstra over fbm-wobbled costs, and scatters spaced trees. Painted places get maps from their trace through `lvMap` (system 31).
- Spots are clickable tile sets with jobs (`acts`) and recipes (`makes`). Hidden trails open per secret place.
- Movement routes use Dijkstra on a binary heap, 4-connected, with costs t 1, H 1, g 1.35, m 1.4, f 1.5, G 1.6. Routing can target the tile next to a solid thing. Place-to-place routing is BFS over the exits graph.
- Dynamic blockers include built camp pieces and animals.
- **Main pieces:** `PLACES` (index.html:5722–5894, 12 places), `WSOLID/FOOT` (5896–5899), `pgen` (5901–5972), `wmap` (5975), `wnextHop` (5977), `WCOST/wroute` (5984–5996), `whid/whidOpen/wexitOpen/wground/wopen` (6343–6358).
- **Size:** ~280 lines.
- **Depends on:** NZ noise, trace system.
- **Tangled with content:** map code clean, `PLACES` is content.
- **Fingerprint:** 16-px tiles, 48×32; 4-way Dijkstra; tap paths limited to 120 steps.
- **Also:** `living/walker.js` (8-way A* with string-pulling, costs t 1, g 1.25, f 1.3, s 1.4, m 1.6, G 1.7) is only used by the camp demo.

#### 24. Walk controller: input, movement, camera and use-menus
- **Does:** Tile-by-tile movement with an interpolated step (2D: 5.5 tiles/s manual, 9 auto; living: 2.1/2.7 m/s scaled by tile metres).
- Input:
  - held directions with a key stack;
  - an on-screen D-pad with pointer capture;
  - A and B buttons;
  - tap-to-walk: tapping a thing walks you next to it and opens its menu; tapping an exit walks you off.
- Bumping into something shows its description. A opens what you face, or the "anywhere" menu (rest, sleep, pack crafts). The menu is keyboard-navigable.
- Walking off a trail end calls the engine's `travel` (time and risk charged) and places you at the matching exit of the next place. `World.goTo(k)` auto-walks through intermediate places.
- The position is saved in `s.map`.
- Camera: 2D centres on the player, clamped to map bounds, with no smoothing. Living camera: see system 27.
- **Main pieces:** `WV` state (index.html:6316), `wmount` (6444–6476), `WKEY/wkeydown/wkeyup` (6477–6499), `wsync` (6502), `wplace/wroam/wgo/wtravel` (6531–6566), `wcan/wupdate/wnext/wstep/warrive/wleave/wtap` (6568–6642), `wspotItems/wfacing/wuse/wA/wB/wmenu*` (6739–6791), `wmeasure` and camera in `wdraw` (6806, 6818).
- **Size:** ~230 lines.
- **Depends on:** maps, engine hooks from the SCREEN (`arrive`, `run`, `make`, `actions`, `recipes`).
- **Tangled with content:** fairly clean (hooks-based).
- **Fingerprint:**
  - Keys: arrows/WASD move; Z, Enter or Space = A (Enter/Space only when the page or map has focus); X = B; Escape or X closes the menu. Key repeat on A is ignored.
  - The D-pad is a fixed virtual pad, not a floating joystick. It is shown only on coarse-pointer or no-hover screens; on fine-pointer screens a key hint shows instead (CSS index.html:180–183).
  - Mooncart mapping: arrows yes, Enter = A yes, Escape is only "close" (not B in the field), and there are no M/START or H/SELECT keys.

#### 25. Walk renderer and effects: rendering and effects
- **Does:**
  - The ground is baked once per season/key into one canvas (`wbake`) for code-drawn places. For painted places, the painting is drawn smooth-scaled.
  - Standing objects, camp builds, animals, you and partners are sprites painted with Px, cached by key, with shadows, depth-sorted by y. Tallgrass hides feet.
  - Overlays: smoke puffs, rain and snow streaks (90 drops), storm flashes, hour grading (saturation, multiply, tint composite), radial firelight, summer fireflies, the quest marker (a chevron over the target or an arrow at the screen edge), a fade between places.
  - Optional "Game Boy colors": a 4-green palette with Bayer dither over the whole canvas.
- **Main pieces:** `wart/wspr/wshadow/wdist/wbake` (index.html:6001–6147), `WOBJ/WBUILD/wPerson/WBEAST` (6161–6315, names only), `wpainting` (6364), `wframe/wdraw` (6794–6853), `wwater/wsmoke/wweather/wgrade/wlights/wtarget/wmarker/wchev` (6859–6929), `GBP/gbify/wsetgb` (6930–6936, 7184).
- **Size:** ~450 lines.
- **Depends on:** Px, light model.
- **Tangled with content:** needs some untangling: sprite recipes are content.
- **Fingerprint:**
  - About 240 art px across, `k = devW/240` (non-integer), smoothing off.
  - rAF with variable dt clamped to 0.08 s; idle throttled to ≥45 ms (~20 fps).
  - Paused when hidden, off-screen, or a minigame is open.
  - GB palette `[[15,56,15],[48,98,48],[139,172,15],[155,188,15]]`.

#### 26. Ambient animals and partner placement in the walk: AI and animation
- **Does:** Animals appear from the engine's population fractions and the time of day: bison when a herd is present, deer at dawn and dusk, turkeys and squirrels by day, rabbits, none when spooked. They are placed in per-place boxes with a seeded RNG keyed on day and two-hour block.
- They wander or graze on random timers and flee from the player (deer within 5 tiles, others within 3).
- Partners: the engine's `mateView` (walk out, work, walk back) maps to a tile:
  - on a cached route between the hub and the exit toward the job, in single file;
  - at the spot whose `acts` include their job;
  - at the fire ring or hut by camp role.
- Speech bubbles take turns (one at a time, 3.2 s apart).
- **Main pieces:** `wpop/wbeastKey/wbeasts/wbeastStep` (index.html:6411–6442), `MATE_CAMP/wmateSpot/wmatesAll/wmatePos/wmateHit/wbub/wmateSay` (6648–6721).
- **Size:** ~110 lines.
- **Depends on:** maps, engine `E.mate(s, tNow, i)` (interpolated between clock ticks through the `ahead` hook).
- **Tangled with content:** fairly clean.
- **Fingerprint:** beast movement uses `Math.random` (presentation only, never feeds the engine).

#### 27. Living bridge: 3D layer over the walk (rendering integration)
- **Does:**
  - The walk stays exactly as it was (tiles, spots, menus). Only the drawing changes when WebGL, the three.js globals, a trace and a painting all exist, and GB mode is off.
  - It builds one stage and reuses it, switching paintings by place and season (summer/fall/winter variants for the camp and Cedar Stand). It maps the game sky to stage weather, hour and month.
  - It drives the survivor and up to three partners with crew colors, and maps job ids to animation moves (`LV_MOVES`). Carrying wood is shown.
  - It syncs the camp model to the game state (`camp.set`). It shows the snare, fish trap and seep models placed in the world, and the beasts.
  - Taps convert from screen → painting → ground → tile.
  - The camera follows the survivor with exponential smoothing `k = 1 − e^(−4dt)`, 40 painting px above the hero. View width is `cssW/0.8` on phones (`/0.95` wide), clamped 380–1536.
  - The quest marker becomes a CSS arrow element.
  - `wscene(k)` hands the minigames the place's painting, trace, spot, hour and weather. Secret places borrow a similar painting.
- **Main pieces:** `LV` (index.html:6943), `lvSupported/lvMap/lvArt/lvMount/lvBuild/lvShow/lvReady/lvWeather/lvSky` (6947–7036), `WSTAND/wscene` (7038–7053), `LV_MOVES/lvAct/lvCamp/lvThings/lvBeasts/lvFollow/lvMarker/lvDraw` (7055–7166), `lvMateHit/lvTile/lvClient` (7167–7180), `World` export (7182).
- **Size:** ~245 lines.
- **Depends on:** living/* globals, walk state.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** dt clamp 0.1; figures lerp to their tile at `dt·11`; the painting is loaded from `window.STRANDED_ART[name]` or `art/places/<name>.webp`.

#### 28. Skill moments: minigames
- **Does:** Five short canvas games in a 360-wide space, played by touch, mouse or keys. Each returns performance 0–1, mapped to the engine skill score by `0.1 + 0.85·p`. Skipping (Skip or Escape) = an ordinary try (score 0.5).
  - **drill:** saw strokes build heat (0.18–0.75 s per stroke is ideal), then three timed blows at the coal's glow.
  - **spear / frog:** three strikes when a shadow is under the point.
  - **aim:** hold to steady a breathing sight for 2.6 s, release to fire. This is the fallback when 3D hunting is unavailable.
  - **berries:** tap ripe, avoid red.
  - **strike:** time the snake's pull-back.
- **Main pieces:** `KIND/TITLE` (index.html:7199–7207), `toSkill` (7209), `play` (7212–7256), `GAMES.drill/spear/frog/aim/berries/strike` (7259–7412), `window.Skill` (7414).
- **Size:** ~230 lines.
- **Depends on:** DOM only.
- **Tangled with content:** clean; reusable pattern (step returns a result, draw).
- **Fingerprint:** rAF, but `step` assumes a fixed dt of 1/60 per frame (frame-rate dependent). Keys: Space/Enter = A, arrows L/R, Escape = skip. Smoke particle arrays have no cap.

#### 29. Screen and UI framework: menus, HUD and UI
- **Does:** One delegated click handler dispatches by `data-*` attributes (`data-act`, `data-go`, `data-eat`, `data-tab`, `data-m`, `data-choose`, …).
- Parts:
  - modal "sheets" with a scrim, focus return, Tab focus trap and lockable dialogs;
  - toast queue (3 s);
  - result card from the result record: story lines, gains chips, meter deltas, skill chips, quest done and next, news, partner "Meanwhile", death or encounter block;
  - sticky HUD: day and time, weather with "feels like", a 24-hour daylight track, 4 vitals bars, condition chips;
  - tabs: Here, Pack, Craft (sorted by readiness, with dependency "plans" and pinning), Journal (quests, skills, catch log, log, camp milestones, field guide, wildlife charts in SVG, badges);
  - title screen with option buttons saved to `clearing.opt.v1`;
  - SVG field map with seasonal styling, trails, night wash, rain and snow, and tap-to-travel;
  - theme toggle, GB toggle, help.
- Guidance card: urgent need, then pinned project, then followed or next quest step, then the field book's advice. The orange marker uses the same step.
- **Main pieces:** `esc/$/KEY/store` (index.html:7432–7439), `fmt/durLabel/…` (7451–7486), `G/mapBase/trailPath/campGlyph/mapDyn/weather` (7489–7594), `titleScreen` (7644), `startGame/render/renderHud/renderMate/mateSheet` (7677–7742), `worldHooks` (7802), `fieldMapSheet/renderMap/renderVitals/renderTabs/renderPanel` (7817–7857), `guidance/whereLine/nextCard` (7863–7906), tabs (7909–8156), `openSheet/closeSheet/confirmSheet/toast/showResult/handle/introSheet/menuSheet/helpSheet` (8160–8298), click and keydown handlers (8388–8461).
- **Size:** ~900 lines.
- **Depends on:** Engine API, World, Scene, Skill, Hunt, Fishing.
- **Tangled with content:** needs some untangling: game-specific text throughout.
- **Fingerprint:** dark mode follows `prefers-color-scheme` plus `[data-theme]`; a dialog with `role=dialog aria-modal` traps focus; `aria-live` on chips and the skill moment.

#### 30. Party real-time clock: game loop
- **Does:** With two or more people, the game clock runs while you walk: 1 real second = 1 game minute. It is driven by `setInterval(250 ms)` with dt capped at 1 s. It stops whenever a sheet, menu, skill moment, hunt or fishing game is open, another tab is shown, or the page is hidden.
- It calls `E.tick(s, mins)`, toasts world messages, shows partner speech, re-renders the HUD each tick and the scene every 15 ticks, and autosaves every 20. Solo play has no real-time clock: time moves only through actions.
- **Main pieces:** `clockRuns/clockStep` (index.html:7749–7771), `setInterval(clockStep, 250)` (7772), `mateNewsShow/toastLater` (7774–7781), `E.tick` (4288).
- **Size:** ~35 lines.
- **Depends on:** engine `pass`.
- **Tangled with content:** clean.
- **Fingerprint:** the `ahead` hook passes the fractional minute to the walk so partners move smoothly between ticks.

#### 31. Painting traces: maps and collision (painted walk-mask by polygons)
- **Does:** Each painting (1536×1024) is traced as data:
  - `stand` polygons (woods, tree, rock, ledge, bramble, brush, reeds) with a ground-line `base` y (or `'col'` per column) and `deep`;
  - ground polygons;
  - trail polylines with width (a hidden kind `H`);
  - hub, exits, spots, camp build sites, fire ring, pocket.
- `Trace.grid` samples 4×4 points per tile to make the same 48×32 letter grid the game uses. Trails win at 6 of 16 samples; otherwise a clear majority is needed.
- `Trace.depth` writes, at half resolution, where each painted pixel's object meets the ground (y/4 in a byte). The 3D layer depth-tests against it, so figures go behind boulders and trees.
- `Trace.check` flood-fills for exits off the edge or cut off, and spots that can't be reached.
- **Main pieces:** `living/trace.js:22–43` (`inPoly`, `toLine`, `trailsOf`, `trailAt`), `grid` (46–75), `tileOf` (76), `depth` (80–104), `build` (106–115), `check` (118–134), `living/traces/camp.js:9–65`; 9 traces (camp, cedar, oak, prairie, berry, river, pond, creek, spring); none for the cave, lick or beaver pond.
- **Size:** 137 lines of code, plus 576 lines of trace data.
- **Depends on:** none.
- **Tangled with content:** clean; reusable for any painted top-down/oblique map.
- **Fingerprint:** walk mask is a polygon trace, not a mask image; 32 painting px per tile; WALK set `'gGtfsmH'`.

#### 32. Living stage: three.js rendering, shaders, particles and lights
- **Does:** `makeStage({canvas, painting, trace, K, pitch, month, hour})`:
  - **Camera:** a locked OrthographicCamera pitched 33° at K = 54.5 painting px per metre, so `toWorld(px,py,h)` and `toPaint(v)` are exact.
  - **Backdrop shader:** the painting on a full-frame plane writes `gl_FragDepthEXT` from the trace depth map. A per-pixel mask (computed from the painting's HSV) marks what sways, grass, dirt/flowers and evergreens.
  - **Painting effects:**
    - the season (summer dryness, fall color, winter brown/straw, spring lushness, flower fade) when the painting isn't itself seasonal;
    - wind sway that grows with height, and gust bands;
    - cloud shadows;
    - rain darkening and puddles with ripples;
    - hour tint, desaturation and night;
    - up to 4 glow lights (firelight);
    - low mist and lightning flash.
  - **Weather presets:** clear, breezy, overcast, rain, storm, snow, fog. They blend over 2.5 s. Snow cover builds and melts; wetness dries.
  - **Particles:** two pools, normal 2,600 and additive 700. Each is a ring-buffer `emit()` that recycles the oldest, with 9 motion kinds (leaf, rain, mote/ember, smoke, snow, spark, splash, firefly, dust) and a 2×2 sprite atlas. Rain and snow are emitted by view area. Leaves fall from painted tree pixels.
  - **Lights:** hemisphere and sun lights follow the tint; 2 fire point lights.
  - **Shadows:** soft blob shadows that lengthen away from the fire at night.
- **Main pieces:** `living/stage.js:20–42` (renderer, camera, `toWorld/toPaint`), `makeMaps` (48–71), `NOISE/AIR/GLOW/LOOK` GLSL chunks (75–117), backdrop shader (121–164), lights (167–169), `sky()` (194–233), `glow` (236), `particles/stepParticles/emit` (245–313), `weather` (333–367), `setView/paintAt/groundAt` (370–388), `shadow/stepShadows` (390–409), `update/render` (413–425), API (427–443).
- **Size:** 447 lines.
- **Depends on:** three r128, Trace.
- **Tangled with content:** clean; season tables are DFW-ish but data.
- **Fingerprint:**
  - Pixel ratio ≤2; antialias on.
  - Uses its own sunrise/sunset tables (copies of `D.SUNRISE/SUNSET`, stage.js:173).
  - `onThunder` hook (unused by the game).

#### 33. Procedural 3D models and animation: survivor, camp, beasts, things, life
- **Does:**
  - **`makeSurvivor`:** a rigid-part skeleton of 17 joints. Each joint's parts are merged into one vertex-colored geometry with a 4-step toon gradient and a back-face outline shell (≈30 draw calls).
    - Procedural walk and run cycle by speed, breathing, look-around, tired posture, shiver when cold, carry pose, props (bow drill, stick, knife, rifle, bow, spear, wood).
    - 18 moves: drill, blow, work, kneel, gather, snap, drink, sit, sleep, wave, look, wipe, stretch, aim, draw, spear, warm, hurt. One-shot `play()` and looping `hold()`, keyframed and eased, blended by weight.
    - Partners: no pack; colors, beard or ponytail options.
  - **`makeCamp`:** canvas-painted textures (tarp, bark, planks); fire states (out, coals, lit, big) with additive shader flames, a halo sprite, a glow light, smoke and embers; 3 shelter stages; the bed, blanket, rack, woodpile and other camp builds; 4 huts on plots in build order. Static groups are merged with `mergeMeshes`.
  - **`makeBeast`:** deer and ghost buck, turkey, squirrel, rabbit (hop gait), bison and old bull, quail, dove and duck (wingbeat flight), with graze.
  - **`makeThing`:** snare, fish trap, seep well, water bag.
  - **`makeLife`:** shader grass tufts made from the painting's own colors, which sway with wind and gusts and part round up to 2 walkers (`uPush`); birds with shadows; ground birds that fly off; butterflies; a bolting cottontail; `scare()`.
- **Main pieces:** `living/survivor.js:17` (`makeSurvivor`), shapes (35–64), toon and outline materials (66–74), `add/merge/bake` (78–104), skeleton (106+), moves `MOVES` (273–331), `animate` (350–402), API (413–418); `living/camp.js:14` (`makeCamp`), fire (120–140), `set/update/stoke` (380–426); `living/beasts.js:26` (`makeBeast`), animate (121+); `living/things.js:14`; `living/life.js:13` (`makeLife`), grass (36–80+), update (176), scare (236); `living/merge.js:6` (`mergeMeshes`).
- **Size:** ~1,325 lines.
- **Depends on:** three r128, stage (uniform chunks shared by grass and flames).
- **Tangled with content:** clean API; the models are content.
- **Fingerprint:**
  - Units are metres, +z facing, feet at y = 0.
  - Toon `MeshToonMaterial` with a 3-step (models) or 4-step (survivor) NearestFilter gradient.
  - Outline = normal-pushed BackSide shell: 0.013 survivor, 0.012 beasts, 0.01 things, 0.008 life.

#### 34. Hunting minigame (3D): minigame
- **Does:** A full-screen stage on the place's painting, framed on the most open ground near your spot.
- The animal comes out where cover meets the open and walks to open ground. Quail coveys feed, then flush. Doves, ducks and pigeons fly across. Bison come as a herd of 4.
- Press and hold for the sight. It sways (sum of sines) with breath: steadiest from 0.8 to 3.5 s of holding, then it drifts. Level reduces the sway. Release to fire. Three shots.
- A hit is the animal's projected screen box (shrunk 0.42, with a fingertip minimum) plus a "give" of `(5 + level + 8 if flying)` px.
- A shot spooks every ground animal. Birds flare.
- Stalking: grazing animals look up now and then. Hold "Creep closer" while the head is down to zoom in; moving while it looks for more than 0.4 s makes everything bolt.
- Practice mode loops random animals with no time passing. The test-player handle is `Hunt.current`.
- **Main pieces:** `living/hunt.js:18` (`KIND` table: hit radius, height, view width, speeds, draw scale), `play` (58–361): framing `bestCentre` (84), spawning (136–159), `sway/sightAt` (168–176), `creep/bolt` (189–217), `rectOf/give/fire` (229–271), `flush` (274), `step` (281–327), `frame` (328), `end` (343); `practice` (365); test handle (357).
- **Size:** 376 lines.
- **Depends on:** stage, Trace, beasts, GameSound.
- **Tangled with content:** fairly clean.
- **Fingerprint:**
  - Real time with dt clamp 0.05. Max time 16 s for birds, 40 s stalking, 26 s otherwise.
  - Small game is drawn 1.3–1.8× bigger "so a kid can find it on a phone".
  - Returns `{shots, hits}` to `E.choose(s, 'shoot', {play})`.

#### 35. Fishing minigame (2D): minigame
- **Does:** A cut-away tank: the place's painting above the surface, and water drawn in code below.
- Steps of play:
  1. Hold to charge the cast (power = cosine of time). Choose bait high or on the bottom.
  2. Fish come to the bait at a rate of `0.12·rate·(fit share)·biteK(x)` per second, only if the bait hangs in their feeding zone. Cover (weeds, log) and recent "rises" raise `biteK`.
  3. A fish comes, circles, nibbles 0–4 times, then bites. Tap during the bite window. The hookset chance is per species (gar 0.75).
  4. The fight: tension heads toward a target that depends on reeling, the fish's pull (fight × size × stamina) and runs. Over 1.0 tension for 0.4 s snaps the line and loses a hook (thin-mouthed crappie tear out at 0.88 / 0.3 s). Slack for 3.2 s shakes the hook. Bass jump.
- One game hour = 60 s of play; the clock pauses on catch cards.
- `drawFish` draws 16 species procedurally and is reused by the Journal's catch log.
- Practice pond. Hooks for test bots: `o.bot`, `o.turbo`.
- **Main pieces:** `living/fishing.js:27` (`LOOK` per-species table: shape, colors, zones, nibbles, hookset, paper, jump), `drawFish` (54, skipped), `play` (221–650): state (256), cover and rise (259–265), casting (294–311), arrival (`spawn/fits/pickFrom/weigh`) (314–329), `strike/hookIt` (334–357), `step` (381–424), `stepFish` (425–458), `fight` (462–494), `lose/land/card` (495–525), `finish` (625–646); `practice` (652).
- **Size:** 657 lines.
- **Depends on:** engine `fishPool` (passed in), `D.FISH`, GameSound.
- **Tangled with content:** needs some untangling: species look and behavior are in one table (good); the water presets are content.
- **Fingerprint:** dt clamp 0.05; `Math.random`; returns `{fish:[{sp,kg}], lost, casts}` → `E.run(s, 'fish_x', {play})`.

#### 36. Synthesized SFX: audio
- **Does:** Web Audio sounds with no recordings: filtered noise bursts and swept oscillators with exponential envelopes. Rifle shot, thump, quail whirr, splash(size), plunk, tick, line snap, win jingle, reel clicking (a 70 ms interval).
- The context is lazily created and resumed on the first tap. Master gain 0.55. `mute()` exists but no UI uses it. There is no music. The walking world is silent (the README lists ambient sound as still to do).
- **Main pieces:** `living/sound.js:7` (`ctx`), `noise/env/burst/tone` (15–24), `S` (25–43), `window.GameSound` (44).
- **Size:** 45 lines.
- **Depends on:** Web Audio.
- **Tangled with content:** clean.
- **Fingerprint:** only `hunt.js` and `fishing.js` call it; index.html never does.

#### 37. Robot players: balance simulator
- **Does:** `tools/engine.mjs` (23 lines) extracts the `===== 2. DATA =====` and `===== 3. ENGINE =====` script blocks from index.html and runs them in a Node `vm` context with no DOM.
- `tools/autoplay.mjs` (266 lines) plays N games (default 48) across 4 starts × party sizes × levels, with seeds 1000+g, for up to 365 days or 40,000 moves.
- The player follows the Next step card (`E.advice`/`E.plan`). It drinks below 70% hydration, eats below 75% food (the soonest-spoiling cooked food first), and picks arrow/shoot/wait on hunts.
- Modes:
  - `--quests` follows the quest card with food tips;
  - `--smart` cooks, smokes and boils;
  - `--trial` gives a fixed mid-game camp and no bars, then reports how each season goes;
  - `--mate` reports per-partner jobs/day and kcal/day;
  - `--kit first`.
- Checks:
  - every 5 moves: no NaN or negative numbers; water within capacity; food lots consistent;
  - every 50 moves: all 15 view functions run; no "NaN/undefined" in text; save → load round-trips;
  - the card never points at a refused button and always offers a button;
  - no 30-move stall;
  - no crash.
- Reports: days by start, party and level; deaths per 100 days and hp/kcal change per day by season; causes; secret places and legends found; shelter and huts built; quest completion days. It ends with "all good".
- The robot players use the engine's own dice (no minigames). Comments in fishing and hunting say so (index.html:1281, 2868, 3016).
- **Main pieces:** `tools/autoplay.mjs:30–61` (`checkState/checkViews`), `move` (80–154), `kit` (157), `play` (165–220), driver and report (222–266); `tools/engine.mjs:10–23`.
- **Size:** 289 lines.
- **Depends on:** the engine's `E._t` test hooks (index.html:4302) and `E.*`.
- **Tangled with content:** clean (engine-agnostic checks, plus Stranded-specific state fields).
- **Fingerprint:** `MATE_YIELD` and the level knobs were tuned against this (CLAUDE.md: keep every party size close to the one-person game in days survived).

#### 38. Browser test suite: tests and self-checks
- **Does:** All tests run Playwright Chromium (SwiftShader WebGL) on a 390×844 phone viewport (DPR 2, touch), abort Google Fonts to play offline, fail on page errors, save screenshots to `shots/`, and end with "all good".
  - **`phone-check.mjs`** (118 lines): plays the first quest by tapping (walk down the trail to the river, tap the water's edge, drink). It checks the camp and river are drawn alive, then a bow-drill skill moment (skipped), the field map and every tab.
  - **`minigames-check.mjs`** (209 lines): practice pond (a bot angler casts, strikes, and reels while tension is under 0.8), practice range (a bot shooter creeps and aims), and checks that no game time passed. Then a real hour of bottom fishing at the River Bank (time must advance ≥1 h), a Prairie hunt (creeping must zoom in), and the Journal's 8 skills and ≥15 fish canvases.
  - **`partner-check.mjs`** (165 lines): in a duo game, the partner's bubble appears; the clock runs while walking and stops on a card; you follow him to his job; tapping him shows his line; a result reports "Meanwhile". In a four-person game, no two partners take the same one-person job, a partner explains how their job fits, there are 3 mate lines, and the crew plan sheet works.
  - **`places-check.mjs`** (49 lines): for every traced place, BFS from the hub shows every game spot is reachable, exits match `PLACES` (hidden ones too) and can be walked to.
  - **`trace-check.mjs`** (64 lines): draws one trace's walk grid and depth map over its painting as PNGs and prints `Trace.check` problems ("trace ok").
  - **`living-check.mjs`** (105 lines): on the built camp demo, walks, lights the fire with the bow drill, carries wood to make it big, changes hour, season and weather, builds the walled hut, and reports draw calls and triangles.
  - **`living-tour.mjs`** (75 lines): screenshots of 15 stops (every place, night, seasons, snow, rain) with the season forced through `World._v.F`.
- **Main pieces:** files above. They drive the page through the test handles `World._v`, `World._lv`, `World.client`, `World.goTo`, `World.living`, `World.matePos`, `Hunt.current`, `Fishing.current`, `BENCH`.
- **Size:** 785 lines.
- **Depends on:** the built `Stranded.html` (except places-check, which loads index.html, and living-check, which loads the demo page).
- **Tangled with content:** deeply tied (game-specific scripts).
- **Fingerprint:** the same helpers (`until`, `tapToward`, `goTo`, `useSpot`, `closeSheets`) are copy-pasted in three files.

#### 39. Build and asset bundling: asset loading
- **Does:**
  - `build-game.mjs` (34 lines): replaces each `<script src="living/…">` with an inline script (escaping `</script`). It injects `window.STRANDED_ART = {name: data:image/webp;base64…}` for every `art/places/*.webp` before the first script. `--artifact` strips the document tags for publishing.
  - `build-living.mjs` (42 lines): does the same for `living/camp-alive.html`, inlining its CSS, and only the paintings its traces name.
  - At runtime, `lvArt`/`wpainting` prefer `window.STRANDED_ART[name]` and fall back to `art/places/<name>.webp`. Missing season variants fall back to the base painting.
- **Main pieces:** the two tools; index.html:6361–6376 (`ART_HAVE/ART_FILE/wpainting`), 6974–6982 (`lvArt`).
- **Size:** ~95 lines.
- **Depends on:** Node fs.
- **Tangled with content:** clean.
- **Fingerprint:** artifact output = the page without `<!doctype>/<html>/<head>/<body>`, charset or viewport.

### Content
| What | Where | ~lines |
|---|---|---|
| Climate (DFW normals: hi, lo, rain days, sunrise, sunset, wind), 4 start dates | index.html:597–631 | 35 |
| 3 difficulty levels × 15 knobs | index.html:621–629 | 9 |
| 12 places (9 + 3 secret) with field-map coordinates and descriptions | index.html:633–662 | 30 |
| 41 foods (kcal/100 g, spoil days, cook, lean, meat flags, guide key) | index.html:665–707 | 43 |
| 2 kits; crew Wade, June, Abe (strengths, colors) | index.html:712–727 | 16 |
| 20 materials, 11 gear items | index.html:728–746 | 19 |
| 12 crops (ripening windows, season totals, decay) | index.html:748–761 | 14 |
| Forage tables (oak, prairie, creek), 5 pick crops | index.html:764–795 | 32 |
| 7 species (cap, start, breed months, litter, mortality) | index.html:797–805 | 9 |
| Hunt encounter tables (5 places), 12 game animals incl. 2 legends | index.html:810–836 | 27 |
| 16 fish (where, kg, fight, warm/night/run, legend, facts) | index.html:838–856 | 19 |
| 8 skills, level table, titles | index.html:858–863 | 6 |
| 32 recipes + prerequisites, groups, material sources | index.html:866–975 | 110 |
| Field guide, 58 entries in 5 categories (incl. "Missing": species people brought) | index.html:978–1038 | 61 |
| 24 badges | index.html:1040–1065 | 26 |
| 33 quests (5 chapters + 13 side quests), chapter names, death causes | index.html:1072–1260 | 189 |
| 64 job definitions with flavor text and odds | index.html:2279–2763 | 485 |
| Encounter, kill and spot texts, hazard table, sightings | index.html:2962–2989, 3050–3226 | 200 |
| Advice priorities and text, partner job lines | index.html:3542–3661, 4099–4137 | 160 |
| Side-view drawing recipes for every place, figures and animals | index.html:4722–5611 | 890 |
| `PLACES` walk layouts (paint shapes, exits, things, spots, sites, beasts) | index.html:5722–5894 | 173 |
| Walk sprite recipes (`WOBJ`, `WBUILD`, `wPerson`, `WBEAST`), `WSAY` look-texts | index.html:6149–6333 | 185 |
| Skill-moment titles and how-tos; help, intro and menu text | index.html:7200–7207, 8269–8298 | 40 |
| 9 painting traces (stand polygons, ground, trails, exits, spots, camp sites, hut plots) | living/traces/*.js | 576 |
| Fish looks and behavior (16 species), water presets (pond, river, creek, beaver) | living/fishing.js:27–50, 168–175 | 33 |
| Hunt `KIND` table (12 animals) | living/hunt.js:18–24 | 7 |
| Model sheets as code: survivor and partner colors, camp builds, huts, animals, props | living/survivor.js, camp.js, beasts.js, things.js | ~900 |
| Paintings (external webp, not in the file): 9 places + summer/fall/winter for camp and Cedar Stand | `art/places/` (`ART_HAVE`, index.html:6361) | n/a |

### Presentation
| What | Where | ~lines |
|---|---|---|
| "Surveyor's field book" CSS: map-paper and slate tokens, one loud blaze orange `#e0521b` for "you are here" and the next action; full dark theme | index.html:26–77 | 52 |
| Layout: sticky HUD (when, weather, daylight track, 4 vitals, chips), stage (Walk/Look toggle), tabs, panel; max width 1120 px; safe-area insets | index.html:78–263 | 186 |
| Walk overlay chrome: place tag, say box, partner bubbles, quest line, field button, menu with ▶ selection, D-pad and A/B (D-pad only on touch, via media queries) | index.html:~138–190 | 55 |
| Panel, craft, journal, sheet, skill-moment and title styles | index.html:264–583 | 320 |
| Fonts: Archivo Narrow (UI), Newsreader (text), non-blocking with Arial and Georgia fallbacks | index.html:19–25, 39–40 | 9 |
| Pixel-art look: 5-step blue-shadow/gold-highlight ramps, Bayer dither, 1-px outline, light from the real sun or moon | index.html:4521–4692 | 170 |
| Game Boy 4-green mode (menu toggle) | index.html:6930–6936 | 7 |
| SVG field map: paper, contour lines with elevation labels, tree patterns, river flow, scale bar, north arrow, seasonal classes | index.html:7489–7594 | 106 |
| Living look: toon shading with dark outlines over the painting; painted-shader seasons and weather; firelight | living/stage.js, survivor.js | n/a |
| Minigame overlays (hunt sights, shot pips, creep button, end card; fishing chips, tension bar, depth toggle, catch card) as injected CSS | living/hunt.js:26–55; fishing.js:178–220 | 75 |
| Living camp demo page (bench UI: sky, camp and view tabs) | living/camp-alive.html, .css, .js | 322 |

### Shared-code clues
- index.html:4337 says "It is painted as pixel art, the way The Hollow Stair paints its world."
- index.html:4522 says "The Hollow Stair's painter, adapted." A grep of every repository checked out for this inventory found "Hollow Stair" only in Stranded's own files (index.html and `versions/the-clearing-2026-09-24.html`). So the source game is not in these repos.
- `living/stage.js:8` says "The painting's own shader brings it to life, the way the envoi meadow does (living-battlefields/field.js)". `stage.js:81` says "gusts roll across the ground in bands along the wind (from the envoi meadow)". **Verified** against `envoi-on-the-longest-night` `origin/work/arenas:living-battlefields/field.js` (968 lines, the same file on 8 branches):
  - The GLSL noise lines `float mh/mn/mf` are character-identical (field.js:90–92 vs stage.js:77–79).
  - `gustAt` and `cshade` have the same formulas with different constants (field.js:93, 104 vs stage.js:82–83).
  - Both use the same Park–Miller RNG `(seed*16807)%2147483647` (field.js:28 vs stage.js:25).
  - They share the API names `glow(i, x, y, z, r, color, k)`, `onThunder` and `setDebug`.
  - field.js is a perspective "locked camera" field. stage.js adapts it to an orthographic camera matched to a painting with a trace depth map.
- `living/README.md` names envoi `living-battlefields/sfx.js` as the model for walking-world sound, which is not done yet. It says the vendored three.js r128 is "the same version envoi uses".
- `Stranded_Living_Camp.html` (living/ and `stripped/stranded-living-camp/`, identical md5 `af707d2d…`) is a build of `living/camp-alive.html` by `tools/build-living.mjs`. Each of its 9 inlined scripts is byte-identical to the current source files: page lines 128–264 trace, 268–299 merge, 303–368 traces/camp, 372–818 stage, 822–1242 survivor, 1246–1673 camp, 1677–1918 life, 1922–2006 walker, 2010–2204 camp-alive. Line 117 holds the stripped camp painting. Line 124 is three.js.
- The robot-player tooling `tools/engine.mjs` depends on the `===== 2. DATA =====` and `===== 3. ENGINE =====` markers (engine.mjs:14).
- Save keys are prefixed `clearing.` (not shared with any other game I saw).
- No Mooncart key mapping (M/H).

### Notes
- **Clean architecture for extraction.** The ENGINE has no DOM and is tested headlessly. All randomness goes through the saved mulberry32 stream, and the minigames feed results back as `{skill}` or `{play}` options. So dice and minigames are interchangeable. Robot players get exactly "an ordinary try" (SK 0.5 → ×1.0).
- **Two `LV` identifiers.** `const LV = s => D.LEVELS[...]` is the difficulty getter in the ENGINE IIFE (index.html:1276). `const LV = {...}` is the living-layer state in the SCENE IIFE (6943). Scoping keeps them apart, but merging the files would clash.
- **Dead code:**
  - `renderCallout` (index.html:7827) and `walkOnMap` (7598) are defined but never called (left over from an older map view).
  - `KEY.view` is written (8419) but never read: `view` always starts as `'map'` (7442).
  - `E.hint` (3724) is unused in the page and the tools.
  - `canHunt` always returns true (2902).
  - `GameSound.mute` has no UI.
  - `stage.onThunder` is never set by the game.
- **Duplicated systems:**
  - Three pathfinders: walk Dijkstra 4-way (index.html:5985), `pgen.carve` Dijkstra (5945), and `walker.js` A* 8-way (demo only). Each has its own inline binary heap.
  - Two sun tables: `D.SUNRISE/SUNSET` and the copies in `stage.js:173`.
  - Two sky models: the 2D `light()` and the stage's `sky()`.
  - Toon gradient and outline materials are re-created separately in `survivor.js`, `beasts.js`, `things.js`, `life.js` and `camp.js`.
  - Test helpers are copy-pasted across 3 tools.
- **Frame-rate dependence:** skill moments assume dt = 1/60 per rAF frame (index.html:7276, 7317), so on 120 Hz screens they run fast. The other loops clamp real dt (walk 0.08, living 0.1, hunt and fish 0.05).
- **Saves:** version field `v: 1`, never bumped. Migration is by field backfill inside `E.load`, which rejects bad saves outright rather than repairing them. A failed load means the title screen shows no "Keep playing". One slot only, plus save codes.
- **Party balance hack:** partners' yields are scaled by `MATE_YIELD` (0.3–0.42), so a bigger crew isn't easier. They don't get injured, sick or gain XP (`if (MATE) return` in `hurt`, `pass`, `skillUp`, `ivyCheck`, forage water).
- **Secret places:** the Bluff Cave, Salt Lick and Beaver Pond have no paintings or traces. The walk draws them with the code-generated map, and the minigames borrow similar paintings (`WSTAND`, index.html:7038).
- **Another version exists:** a first version of the game exists at `versions/the-clearing-2026-09-24.html` (stripped id `stranded-first`). It also mentions The Hollow Stair. I did not inventory it.
- **Lineage hints confirmed:** `D.PARTY` (index.html:721), `s.mates` (1980, 4024–4027), `mateChoose` (4143), and "the engine's dice the robot players use" (comments at 1281, 2868, 3016; autoplay never calls the minigames).
