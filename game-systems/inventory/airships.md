## Airship games: Skies of Aethermoor (polished), the main copy, and Sunstone Skies

**What it is:** a third-person airship combat game over Chris's painted Aethermoor map. You pick a difficulty ("skies"), buy and upgrade ships with Crystal Shards in a port, and fight waves of raiders whose six ship classes are all built in code by one procedural recipe. Written once, copied twice, and the three copies have drifted apart.

**Inventoried:**
- **Polished (primary):** `airship-game-in-aethermoor-` @ `origin/claude/laughing-curie-qbp98i` (`117a515`), `polished/dist/game.html`. Full size 4,816,651 bytes; stripped 728 KB, 4,711 lines, 15 long lines. Source: `polished/src/`, 29 JS files, 4,947 lines. **Line numbers refer to the stripped source files** (`source/polished/src/<path>`), because the single file is a minified esbuild bundle.
- **Main copy:** same repo @ `origin/claude/ship-game-magpie-l8cbdn` (`1887984`), `dist/game.html`. 4,795,251 bytes, 4,679 lines. Source `src/`: 25 files, 3,572 lines. Polished was copied from it at `1887984` (commit `9f0c571`).
- **Sunstone Skies:** `20-min` @ `origin/ccr-c41cdbf6-3p3qws` (`843723a`), `sunstone-skies/dist/game.html`. 7,681,797 bytes, 4,804 lines. Source `sunstone-skies/src/`: 43 files, 6,526 lines. It was copied from the airship repo at `a8124d5`, before the port, wind and Surge existed (commit `bd3d007`). Later it took `src/ships/*`, `src/ship/*` and the Galleon/Man-o'-war unchanged from `1887984` (commit `ae6f2ba`). Since `f2cac7a` it has been "its own game from here on".

**Tech:** three.js **0.186.1** (r186, not r128), WebGL with ACES tone mapping and PCF shadows. ES modules bundled by esbuild into one IIFE (`polished/tools/build.mjs` L17–25). Images (webp/avif) are inlined as data URLs, and two woff fonts are put into the HTML template. HUD and menus are DOM/CSS, and the minimap is a 2D canvas. No other libraries. In the single file: CSS is L7–266, the DOM shell L268–380, and the script L381–4708 (three.js, then the minified game code in the last long lines, about L4600–4707).

### Coverage
- **Read fully (polished):** all 14 `game/*.js`; `ship/build.js`, `hull.js`, `kit.js`, `materials.js`; `ships/index.js`, `brig.js`; `audio/thareia/NOTE.md`.
- **Skimmed (polished):** `ship/parts.js` (L1–30, 203–260, 300–330, 398–425, function list); the other five recipes (headers, data); `demo/hangar.js` (L1–20, 100–323, diff vs main); `music.js` (L1–60, function list); `sounds.js` (L1–25, exports; long line L351 not read); `game.html` L1–40 plus DOM ids by grep.
- **Main copy:** every changed file read as a `diff` against polished (`damage`, `flight`, `build`, `pickups`, `input`, `port`, `world`, `progress` in full; removed lines of `guns`, `raiders`, `main.js`); `main.js` L75–115 and L200–235 directly; `effects.js` fully.
- **Sunstone:** read fully `game/progress.js`, `main.js`, `voyage.js`, `abilities.js`, `raiders.js`; diffs vs main for `guns`, `flight`, `input`, `effects`, `world`; partly `garage.js` (L1–60, functions), `fleet/build.js` (L6–39, 165–200), `fleet/guns.js` (L1–12), `demo/shipyard.js` (L1–30); headers and exports of the other `fleet/*`, `sunset.js`, `hangar.js`.
- **Docs and tools (`git show`):** main `docs/game.md` (headings, L21–32, L140–180) plus its full diff vs polished; `docs/ships.md` L5–36 plus diff; Sunstone `docs/balance.md` (L1–30, L171–233, headings) and `docs/ships.md` (L1–12, headings); `sim-fight.mjs` in full plus the Sunstone diff; `check.mjs` headers (polished L1–25 and L46–80, main L1–14, Sunstone L1–20); `sim-voyage.mjs` L1–48 plus mode markers; test names in `tests/progress.test.mjs`; polished `build.mjs` L1–40.
- **Skipped:** three.js in the bundle; the bodies of Sunstone `fleet/*` (about 2,250 lines of model code); `shipyard.html` beyond its title and shell ids; `ship-art`, `map-art`, `closeups`, `check-shipyard`, `counts` and the shots tools; the Magpie page (another agent's subject; greps only).

### Code map (polished `polished/src/`)
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| `game/main.js` | systems + presentation | loop, voyage/wave state machine, chase camera, lock-on, hit routing, HUD, minimap, test hooks | 584 |
| `game/flight.js` | systems | flight model shared by player and raiders, wind, Surge, damage effects, sinking, heel spring | 119 |
| `game/guns.js` | systems | gun placement from model, batteries, arcs, intercept, pooled bolts, rippling volleys | 239 |
| `game/raiders.js` | systems + content | raider AI, spawning, broadside warning, LOD swap, wave table | 295 |
| `game/damage.js` | systems | per-class hit zones from the model; segment-vs-ship test | 82 |
| `game/progress.js` | systems + content | save + claude.ai cross-device sync, SKIES table, ship PRICES | 153 |
| `game/mods.js` | systems + content | 4 upgrades × 3 steps, crystal power, `loadout()` | 38 |
| `game/port.js` | presentation + systems | title/port screens, ship showroom scene, buy/upgrade UI, stat bars | 243 |
| `game/pickups.js` | systems | Crystal Shard pickups (instanced, magnet) | 68 |
| `game/events.js` | systems | typed event bus with preallocated payloads | 89 |
| `game/fx.js` | systems | sparks/glows pool, camera trauma + kick springs, haptics, time dial | 211 |
| `game/effects.js` | systems | pooled smoke puffs, damage smoke | 84 |
| `game/input.js` | systems | keyboard/mouse/pointer-lock + touch stick/aim/buttons | 137 |
| `game/world.js` | presentation + content | sky shader, 9 map tiles, baked cloud noise, cloud deck, cloud billboards, region grid | 209 |
| `ship/build.js`, `hull.js`, `kit.js`, `parts.js`, `materials.js` | systems | procedural ship builder (LOD, batching, glows, embers, materials from painted sheets) | 1,171 |
| `ships/*.js` (7) | content | six ship recipes (outlines, guns, masts…) + STATS | 286 |
| `demo/hangar.js` | presentation | separate showroom page (`dist/hangar.html`) | 323 |
| `audio/thareia/music.js`, `sounds.js` | systems (vendored, unused) | Thareia's synth music + 100 SFX | 616 |
| **Total** | | 25 game/ship/ships files + hangar + 3 audio files | **4,947 JS** |

### Systems (polished)

#### Game loop and voyage state machine — game loop
- **Does:**
  - `requestAnimationFrame`, with the step clamped to `min(0.05 s)` and then scaled by `fx.timeScale` (L556–561).
  - Two modes. In `voyage` it ticks the game and renders it; otherwise it calls `port.update` and `port.render`.
  - The wave director `W` (L83, L244–301) moves through `calm` (a 5 s timer, then 4 s), `fight`, `choose` (25 s countdown, auto sail-on) and `sunk`. While going down, `W.lost` runs a 4 s timer.
  - It pauses when the page is hidden (L325) and when the WebGL context is lost (L78–79). On restore it redraws the PMREM sky light and the cloud bake.
  - `window.__game.step(seconds, controls)` (L573–577) runs fixed 1/60 ticks headless, for the tests.
- **Main pieces:** `main` (L39), `enter` (L85), `resetVoyage` (L93), `sail` (L100), `endVoyage` (L130), `waves` (L244), `sailOn` (L302), `pause` (L308), `tick` (L513–555), `frame` (L556), `__game` (L566).
- **Size:** about 200 lines of `main.js`.
- **Depends on:** almost every module, and the DOM ids in `game.html`.
- **Tangled with content:** deeply tied. The banner texts, the shard rules and the wave titles are written inline.
- **Fingerprint:**
  - Variable timestep with a 0.05 s clamp, and a slow-motion dial (`fx.slowmo`, never called).
  - Repair between fights: `player.repair(dt*0.12)` (L269).
  - A cleared wave pays `round(20*n*skies.shards)` (L284).
  - Going down or quitting mid-fight keeps ×0.5 of the voyage's shards; going home between waves keeps ×1 (L324).

#### Input — input
- **Does:** keyboard, mouse and touch are merged every frame into one reused `out` object. Input is only live while `active`, that is, at sea and not paused (L118–135).
- **Laptop:**
  - Click locks the pointer. Where the browser refuses the lock, the game falls back to drag-to-aim plus click-to-fire (`noLock`, L31–38).
  - The wheel zooms. Trackpad scrolls are scaled down, a mouse notch counts as about one step (L62–65).
- **Phone:**
  - A floating stick appears wherever the thumb lands in the left 42% of the screen, radius 56 px (L70–85).
  - A drag on the right aims, at ×1.6 (L91).
  - Fire, Surge and Sail± buttons use pointer capture (L96–113).
  - You can slide your thumb off Fire to keep aiming while it fires (L104–110).
- **Main pieces:** `makeInput` (L7), `noLock` (L31), `hold` (L96), `s.read` (L118).
- **Size:** 137 lines.
- **Depends on:** the DOM (`#stick`, `#btn-fire`, `#btn-surge`, `#btn-sail-up/down`, `#lock-hint`).
- **Tangled with content:** clean. Only the element ids are game-specific.
- **Fingerprint:**
  - Keys: W/S sail up/down; A/D or ←/→ turn; Space/E/↑ climb; Shift/Q/↓ dive; F or left click fire. One-off actions (`main.js` L516–523): R Surge, C re-centre, M map, H help, P pause, Enter sail on.
  - Mooncart: not explicitly supported. Arrows, Enter (sail on), M and H happen to work; Escape only releases the mouse lock.
  - Mouse sensitivity is 0.0026 when locked and 0.005 on a drag; touch is 0.0042.

#### Chase camera, aiming and lock-on — camera
- **Does:**
  - The camera orbits behind the ship at distance `L*1.35+16`, times a zoom of 0.55–2.6 (×1.12 per wheel step). Pitch is clamped to −0.35…1.25.
  - After 3.5 s with no look input (and no mouse lock) it eases back behind the ship: `k=1-exp(-1.2dt)`.
  - It locks onto the raider nearest the crosshair within `max(0.05, atan(0.8L/along))`.
  - The aim point leads that raider through `intercept`, and the battery facing the camera's yaw fires.
  - The FOV is 55°, or 68° in portrait, plus 7° during a Surge, plus the kick spring's FOV.
- **Main pieces:** `cam` (L148), `camDistFor` (L150), `placeCamera` (L153–182), `aimFor` (L183–191), FOV easing (L545–547).
- **Size:** about 45 lines.
- **Depends on:** `fx.applyCamera`, `guns.intercept` and `batteryFor`, and the raider list.
- **Tangled with content:** clean.
- **Fingerprint:** the target point is the ship's position plus `L*0.42+2` up; the aim point sits 800 m along the look direction when nothing is locked.

#### Flight model — physics
- **Does:**
  - The same arcade model flies the player and the raiders.
  - Stats map to handling (L16–18): `vmax = 14+3.2·speed` m/s, `turn = 0.06+0.028·turning` rad/s, `climb = 3+2.1·climbing` m/s.
  - Speed is scaled by `pace × (0.3+0.7·sailFrac) × (1+windHelp) × (1.6 while surging)`.
  - Turning is scaled by `T.turn × (0.45+0.55·sf)` and by grip `0.35+0.65·min(1, speed/(0.3vmax))`. Climbing is scaled by `(0.25+0.75·crystalFrac)`.
  - Lift fades towards a ceiling `200+(2400−200)(0.3+0.7cf)`. Cracked crystals (below 0.5) sink the ship at `(0.5−cf)·10` m/s. The floor is 60 m.
  - Going down has three styles: `hull` rolls over and falls, `crystals` sinks upright, `struck` (a Galleon striking her colours) drifts down slowly.
  - A heel spring (`heelV += (−6h−1.6v)dt`) is kicked by the recoil of each broadside gun.
- **Main pieces:** `handling` (L16), `WIND`/`windHelp` (L23–24), `SURGE = {boost .6, time 3, recharge 15}` (L26), `makeFlyer` (L29), `s.hit` (L54–60), `s.update` (L63–90), `sink` (L94–106), `move` (L107).
- **Size:** 119 lines.
- **Depends on:** `THINNING` from `world.js`, and `ship.update` from the builder.
- **Tangled with content:** clean. The stat names come from `docs/ships.md`.
- **Fingerprint:**
  - Exponential easing: accelerate `1−exp(−dt·0.35·accel)` (1.6 while surging), decelerate 0.6.
  - Controls are eased at rates 3 (turn) and 2.5 (climb).
  - Wind is 0.06–0.14 of top speed from a random direction, re-rolled each wave (`main.js` L141).
  - Ships start a voyage at 45% of vmax.

#### Gunnery and volleys — battle
- **Does:**
  - Guns come from where they really are on the model: bow chasers, swivels and stern guns from the recipe, broadside ports from the hull outline normals (`gunsOf` L21–35).
  - The camera's yaw relative to the bow picks the battery: bow if |a|<0.87 rad, stern if |a|>2.27, otherwise port or starboard (L38–43).
  - Each shot is clamped to its gun's yaw and pitch arc (L60–68).
  - Volleys ripple bow-first: a 55 ms step, the whole side within 0.55 s, chaser pairs 80 ms apart. Up to 32 guns can be waiting per ship, and each emits a `fire` event (L145–239). The reload starts on the first gun.
  - `intercept` leads the target over three iterations and adds the bolt's drop (L51–57).
- **Main pieces:** `GUN_WEIGHT` (L13), `KINDS` (L15–18), `gunsOf` (L21), `batteryFor` (L38), `intercept` (L51), `clampToArc` (L60), `RIPPLE` (L145), `makeGunnery` (L147–239: `shot` L171, `update` L189, `muzzle` L207, `reaches` L214, `fire` L221).
- **Size:** about 175 lines.
- **Depends on:** `events.js`, a built ship (`recipe`, `hull.at/normal/tAt`), and the flyer (for heel).
- **Tangled with content:** needs some untangling. The gun data come from the recipes.
- **Fingerprint:**
  - Real-time combat, no dice.

    | Gun | Speed | Damage | Reload | Swing / tilt | Spread | Life | Size |
    |---|---|---|---|---|---|---|---|
    | Chaser | 430 m/s | 28 | 1.1 s | 0.62 / 0.26 rad | 0.002 | 3.2 s | 1 |
    | Broadside | 320 m/s | 55 | 2.6 s | 0.75 / 0.16 rad | 0.012 | 2.6 s | 1.35 |

  - Damage per hit is `KIND.damage × GUN_WEIGHT[class] × damage multiplier`. `GUN_WEIGHT`: Skiff .8, Cutter .9, Brig 1, Frigate 1.1, Galleon 1.15, Man-o'-war 1.25.
  - The reload is `KIND.reload × slow`.
  - Range check: `dist < speed·life·0.92`, and inside the arc to within 0.02 rad.
  - Recoil heel per broadside gun: `0.012·weight·25/L`.

#### Bolts (projectiles) — battle / rendering
- **Does:**
  - Up to 400 pooled bolts with a free list, drawn as one `InstancedMesh` of tapered cylinders.
  - The alpha fades along the tail; the tail is at most 36 m × size, grown from the muzzle.
  - Gravity is `9.8·0.15`. Each bolt inherits the shooter's velocity.
  - Each step is a segment test through a callback (`hit(b, prev, p)`). A bolt that expires bursts into 3 sparks.
  - The heads are `fx.glowAt` points. The Captain's bolts are gold `0xffb347`, the raiders' red `0xff4636`.
- **Main pieces:** `makeBolts` (L85–138), `upload` (partial GPU buffer updates, L72–75).
- **Size:** about 60 lines.
- **Depends on:** `fx.js`.
- **Tangled with content:** clean.
- **Fingerprint:** pool of 400; the only allocation is when the pool is exhausted.

#### Hit zones and shot collision — collision
- **Does:**
  - Each class gets hit zones read once from its own model (L9–49):
    - one sail box per mast, from the `canvas` mesh vertices split by the nearest mast;
    - one crystal box per cluster, from the furnace column plus the `gem` vertices;
    - the hull as an analytic inside test against the side and top outline curves, up to the rail or quarterdeck, with the ram included;
    - a bounding sphere around everything.
  - `firstHit` (L62–82) works in three steps:
    1. reject the shot by the sphere in world space;
    2. transform the segment to local space and test it against the crystal and sail boxes;
    3. step through the hull box at 0.2 m until `inHull` is true.
  - It returns the nearest part.
- **Main pieces:** `hitZones` (L9), `tryBox` (L55), `firstHit` (L62).
- **Size:** 82 lines.
- **Depends on:** `kit.curve`, and the recipe fields `hull.half/rim/keel`, `masts`, `clusters`, `quarterdeck`, `ram`.
- **Tangled with content:** needs some untangling. It assumes the recipe schema.
- **Fingerprint:** three targetable parts (hull, sails, crystals); priority goes to the smallest `t`; the aim point is `(0, hullBox.min.y·0.4, 0)`.

#### Raider AI and spawning — enemy AI
- **Does:**
  - Each class keeps one middle and one far template. Each raider clones them and swaps level of detail by screen size (`size < 0.06` means far) (L80–99, L271–272).
  - Raiders are recoloured with rust sails, darker planks and crimson pennants; captains get black sails and gold pennants (L58–77).
  - Three roles (L166–207):
    - *chaser* (Skiff, Cutter): attack runs at a lead point, breaking side-on when closer than `70+4L` or after 10–15 s;
    - *broadside* (Brig, Frigate, Man-o'-war): orbit abeam at `260+4L` m;
    - *prize* (Galleon): sails across your path until she's chased (closer than 1 km or damaged), then flees weaving. She strikes her colours with no sails or at 25% hull, and escapes past 3.6 km.
  - Separation keeps raiders `(L+L')·3+40` apart.
  - Firing (L212–242): they hold fire until the target is within 0.7 of their range. The aim error is `dist·aim+1.5` m.
  - Broadsides of three guns or more first glow at the ports (0.5 s, or 0.65 s for ships of 50 m and up) and are re-checked six times a second. The glow time is refunded from the next reload.
- **Main pieces:** `RAIDER {slow 1.5, aim .02}` (L25), `WARN` (L28), `CAPTAIN {toughness 2, damage 1.2, reload .9, bounty 4}` (L29), `HEAVY` (L31), `ROLE` (L34), `raiderShip` (L80), `makeRaiders` (L102), `spawn` (L118), `spawnWave` (L153), `steer` (L166), `shoot` (L218), `glowPorts` (L245), `update` (L254), `hitBy` (L279), `prepare` (L293).
- **Size:** about 230 lines.
- **Depends on:** the flight model, gunnery, damage, the builder, the skies settings and `fx`.
- **Tangled with content:** needs some untangling. The roles are keyed by ship id.
- **Fingerprint:**
  - Spawn 1.5–1.9 km ahead (a Galleon at 1.1–1.35 km), at the player's altitude ±80 m.
  - Chasers vary altitude by ±25 m (±35 m on a break).
  - Wrecks are removed after 16 s, or once 150 m below where they went down (L268–270).

#### Waves and difficulty — progression / balance
- **Does:**
  - A fixed table of 15 waves (`WAVES`, L35–38). After it, 3 to 6 ships drawn at random from a pool, with at most one Man-o'-war (L42–52).
  - Every fifth wave is led by a captain in the biggest ship that isn't a Man-o'-war.
  - Maelstrom adds `extra` Skiffs or Cutters from wave 3.
  - The next wave is chosen at the card, and a captain's model is built ahead (`main.js` L289–292).
  - Skies multipliers (`progress.js` L5–9):

    | Skies | aim | reload | damage | toughness | pace | extra | shards |
    |---|---|---|---|---|---|---|---|
    | Fair Winds | 1.8 | 1.35 | 0.6 | 0.8 | 0.88 | 0 | ×1 |
    | Crosswinds | 1 | 1 | 1 | 1 | 0.92 | 0 | ×1.25 |
    | Maelstrom | 0.8 | 0.92 | 1.15 | 1.15 | 0.96 | 1 | ×1.6 |
- **Main pieces:** `WAVES`, `SIZE`, `waveAt` (`raiders.js` L35–52), `SKIES` (`progress.js` L5), `waves()` (`main.js` L244).
- **Size:** about 70 lines.
- **Depends on:** the raider spawner.
- **Tangled with content:** deeply tied. The tables are the content.
- **Fingerprint:** the endless part uses `Math.random()` with no seed; raider stats are `STATS × skies.toughness × (captain 2)`.

#### Economy: shards, pickups, prices, upgrades — shops / economy
- **Does:**
  - A downed raider spills `bounty × skies.shards × (1+0.1·waveN)` as 4–14 pieces (`main.js` L248; `pickups.js` L27–33).
  - Pieces drift down, are pulled in within 140 m at 120 m/s, are collected within `0.6L+8` m, and expire after 30 s (`pickups.js` L6, L35–64).
  - Ships cost Skiff 0, Cutter 300, Brig 900, Frigate 2200 (`progress.js` L10).
  - Four upgrades with three steps each (`mods.js` L6–15). A step costs `round(STEP_COST[step]·CLASS/5)·5`, with `STEP_COST=[60,140,280]` and `CLASS` = Skiff 1, Cutter 1.6, Brig 2.6, Frigate 4.
  - Crystal power runs from −2 to +2 (`mods.js` L19–37).
  - `loadout` (L21–38):
    - armour: +20% hull, −4% speed and −10% acceleration per step;
    - canvas: +20% sails, +4% speed;
    - drill: −10% reload;
    - crystals: +20% crystals, +12% climb;
    - power per notch: −8% reload, +6% shot damage, −6% speed and acceleration.
- **Main pieces:** `makePickups` (`pickups.js` L7), `MODS`, `modCost`, `POWER`, `loadout` (`mods.js`), buying (`port.js` L130–154), `BOUNTY` (`raiders.js` L33).
- **Size:** about 140 lines.
- **Depends on:** `STATS`, `progress`.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** bounty Skiff 15, Cutter 30, Brig 60, Frigate 100, Galleon 300, Man-o'-war 400; a captain pays ×4; the pickup pool holds 200.

#### Save and cross-device sync — save/load
- **Does:**
  - The save lives in `localStorage` key **`skies-of-aethermoor/save-1`**.
  - On claude.ai the page also uses `window.claude.use('db')` and `use('user')`. The doc is **`data/users/${id}/save`** (L69–81), so the page is published with `capabilities {db, user}`.
  - The newest save wins, by the `saved` stamp against `synced`.
  - Live updates arrive through `onSnapshot`, with exponential backoff up to 5 retries (L83–93). The page looks again when it becomes visible, and once more just before each write (L95–128).
  - Voyages won on this device are kept by id in `banked`, and the store remembers the last 100 ids in `got`. `adopt()` adds lost shards back onto a newer save (L55–68).
  - The stamp never goes backwards: `saved = max(now, synced+1, saved+1)` (L130–135).
  - `STOP` error codes drop the remote store for good (L15).
- **Main pieces:** `KEY` (L12), `fresh` (L22), `merge` (L30), `makeProgress` (L40), `adopt` (L55), `connect` (L69), `listen` (L83), `look` (L95), `push` (L103), `save` (L130), `bank` (L141), `reset` (L151).
- **Size:** about 150 lines.
- **Depends on:** `localStorage`, `window.claude`, the DOM `visibilitychange`.
- **Tangled with content:** needs some untangling. `fresh()` holds the game's fields; the sync engine itself is generic.
- **Fingerprint:**
  - One slot. Version field `v:1`, never bumped. Old saves are upgraded by `merge` filling in missing fields; there are no explicit migrations.
  - Saved at every port action and every bank; no autosave mid-voyage.
  - Format: `{v, saved, synced, skies, shards, flying, best{fair,cross,mael}, ships{id:{owned, power, mods{armour,canvas,drill,crystals}}}, got[], banked[{id,n,sent,at}]}`.
  - `HELD` is 10 minutes.

#### Port and title screens, ship showroom — menus / UI
- **Does:**
  - A separate three.js scene: a starfield void shader, a stone berth with a brass rim and warm glow, key and rim lights (L17–62).
  - The ship turns slowly and can be dragged with inertia (L95–100, L232–239); the camera frames it with a view offset so it stays clear of the panels (L83–93).
  - Skies radio buttons with the best wave (L103–113); ship buttons, buy, an upgrade row per mod, a power slider (L118–155); stat bars comparing the ship as built with her upgraded figures, against the best possible (L158–210). Emits `port:*` events.
- **Main pieces:** `makeVoid` (L17), `makeBerth` (L37), `makePort` (L53), `show` (L67), `place` (L83), `figures` (L159), `refresh` (L179), `setMode` (L225).
- **Size:** 243 lines. **Depends on:** `progress`, `mods`, `flight.handling`, `guns.KINDS`, the shared `shipFor` cache. **Tangled with content:** needs some untangling.
- **Fingerprint:** firepower figure = `(bow·28/1.1 + side·55/2.6)·GUN_WEIGHT·damage/reload`.

#### Event bus — architecture
- **Does:**
  - 22 named events, each with one preallocated payload (Vector3 fields made once), filled in and emitted to listeners synchronously.
  - An unknown name throws. `on` returns an unsubscribe function. There is a `listeners(name)` counter for tests.
  - The header documents every payload (L10–44).
- **Main pieces:** `PAYLOAD` (L49–72), `on`, `off`, `payload`, `emit` (L78–87).
- **Size:** 89 lines.
- **Depends on:** three's `Vector3` only.
- **Tangled with content:** clean apart from the event list. **Reusable as is.**
- **Fingerprint:** only `fx.js` subscribes, to `fire`, `volley`, `hit`, `nearMiss`, `raider:down`, `blast` and `surge`. The `port:*`, `wave:*`, `shards:*`, `mode`, `pause` and `voyage:*` events have no listener yet; they are reserved for sound and a guide.

#### Effects engine (sparks and glows, camera trauma and kick, haptics) — effects
- **Does:**
  - Sparks live in a struct-of-arrays pool (1,100 on a laptop, 700 on a phone; when full the oldest is overwritten and counted in `dropped`), drawn with 720 per-frame glow points as one additive `Points` batch (L35–66).
  - Camera shake is trauma² on sine noise (`SHAKE pos .5, yaw .07, pitch .06, roll .08`, L23, L99–106), plus four critically damped kick springs (back, pitch, side, fov; `K=130`, `C=2·0.9·√K`, L24, L174).
  - Android phones buzz through `navigator.vibrate` (L121–126). Reduced motion keeps 0.3 of the shake and kick and turns the buzz off. There is a slow-motion dial (L109–118).
  - It answers bus events: muzzle flame and smoke, hit bursts by part, near-miss sparks, a blast when a raider goes down, shake for blasts within 250 m (L131–167).
- **Main pieces:** `makeFx` (L30), `spark` (L58), `burst` (L70), `glowAt` (L81), `kick` (L93), `applyCamera` (L99), `timeScale` (L112), `buzz` (L123), `update` (L170), `clear` (L199), `stats` (L208).
- **Size:** 211 lines. **Depends on:** `events.js`, `effects.makeSmoke`, `guns.upload` and `KINDS`. **Tangled with content:** mostly clean.
- **Fingerprint:** hit bursts hull `0xffa040` × 30, sails `0xf5e6c8` × 18, crystals `0xffe08a` × 40 (×0.6 on touch); trauma decays 1.6/s; point size capped at 420 px (260 on touch).

#### Smoke — effects
- **Does:**
  - One `Points` batch of soft puffs in a struct-of-arrays pool: 900 on a laptop, 600 on touch. The oldest is reused when full (L12–67).
  - Two growth modes: square-root (pouring smoke) and cubic ease-out (gunsmoke).
  - `smokeFrom` gives a ship smoke below 50% hull, getting darker and denser; below 25% it adds fire sparks (L72–84).
- **Main pieces:** `makeSmoke` (L12), `emit` (L41), `smokeFrom` (L72).
- **Size:** 84 lines.
- **Depends on:** `fx`.
- **Tangled with content:** clean.
- **Fingerprint:** drag 0.6/s; rise 1.5 m/s²; points capped at 700 px (420 on touch).

#### World: sky, map, clouds, regions — rendering / environment
- **Does:**
  - The sky is a gradient shader dome with a low sun in the west, `SUN (−.55, .52, .25)` (L28–53).
  - Nine AVIF tiles make a 23,040 × 15,360 m flat map at 5 m per pixel, with a sea plane drawn beneath (L104–133).
  - The cloud pattern is two layers of 5-octave value noise, **baked once** into a tiling 1024² RG16 render target (L60–95).
  - That pattern drives both the cloud deck at y=430 and the cloud shadows on the ground, patched into `MeshBasicMaterial` with `onBeforeCompile` (L114–123, L136–155).
  - 110 billboard cumulus clouds are instanced and wrap around the ship within a 14 km span. Their canvas texture is seeded with Park–Miller (`seed·16807 % 2³¹−1`) (L165–209).
  - A 12×8 grid of letters gives the region names (L20–26).
- **Main pieces:** `MAP` (L15), `SUN`, `CLOUD_Y=430`, `THINNING=2400` (L17), `regionAt` (L22), `makeSky` (L39), `makeCloudBake` (L67), `makeWorld` (L104), `cloudTexture` (L165), `makePuffs` (L179).
- **Size:** 209 lines.
- **Depends on:** the tile assets.
- **Tangled with content:** needs some untangling. The map, the grid and the region names are content.
- **Fingerprint:** fog 4,000–34,000 m; camera far plane 70,000 m; the cloud bake is redrawn when the context is restored.

#### Procedural ship builder — 3D models built in code
- **Does:**
  - Builds a ship from a recipe at three levels of detail: `full` (about 100k triangles), `middle` (about a fifth of that) and `far` (a few thousand) (`build.js` L10–33). `FINE` tunes the full level per class.
  - **The hull comes from two outlines.** Side curves `rim` and `keel` and a top curve `half` are monotone cubic interpolations (`kit.curve` L9–28). Each section is a wall with tumblehome down to the wale, then a bowl to the keel (`hull.js` L9–49).
  - **Parts come from one picture sheet.** Everything is pushed into a per-material `Batch` and merged into about a dozen draw calls (`kit.js` L35–65): brass bands, rails, gun ports and lids, furnace clusters with crystals, masts and wing sails, fins, the rudder, the bow ram or bowsprit, lanterns and deck works (`parts.js`).
  - Glows and embers are shader `Points` (`build.js` L36–98).
  - `shipMotion` sways the ship, leans it into turns, pitches it on climbs, and applies heel and rudder (L102–113).
- **Main pieces:** `LEVELS` (L10), `FINE` (L21), `detailFor` (L23), `emberPoints` (L36), `glowPoints` (L67), `shipMotion` (L102), `buildShip` (L115–167); `makeHull`, `buildHull`, `hullBand`, `hullStrap`, `rivetRow`, `hullDecal` (`hull.js`); `curve`, `Batch`, `place`, `frame`, `lathe`, `tube`, `rod`, `box`, `toRect`, `polygon`, `walls`, `sheet` (`kit.js`); `commonShapes`, `brasswork`, `rails`, `guns`, `clusters`, `masts`, `sail`, `fins`, `rudder`, `bow`, `lanterns`, `deckworks` (`parts.js`).
- **Size:** about 1,050 lines of code, plus 286 lines of recipes.
- **Depends on:** three's `mergeGeometries`, and `materials.js`.
- **Tangled with content:** needs some untangling. The schema is generic; the art rects come from `parts.json`.
- **Fingerprint:**
  - `FINE` per class: Skiff 2.0, Cutter 1.62, Brig 1.14, Frigate .74, Galleon .56, Man-o'-war .31.
  - Embers: 14 per crystal at full, 5 at middle.
  - Point lights at full detail only.

#### Ship materials from painted sheets — rendering / asset processing
- **Does:**
  - Loads the planks, plates, deck, band and parts pictures.
  - Derives normal maps from luminance (`normalFrom`, L31–43).
  - Classifies brass, wood and lamplight by hue and saturation to build roughness/metalness maps and a glow map (`surfaceFrom`, L47–63).
  - Builds 14 `MeshStandardMaterial`s (L82–101). The sails ripple and the pennants flap through vertex `onBeforeCompile` patches driven by a `billow` attribute (L103–115).
- **Main pieces:** `loadShipArt` (L65).
- **Size:** 117 lines.
- **Depends on:** the asset files and `parts.json`.
- **Tangled with content:** clean. A reusable "paint to PBR" step.
- **Fingerprint:** brass is hue 28–58° with saturation >0.38; lamplight is value >0.88 with saturation >0.5.

#### HUD — UI
- **Does:**
  - DOM writes are throttled: per-frame items every frame, the rest at 10 Hz, and only when a value has changed (`setText`, `setStyle`, `setWidth`, L359–364).
  - Health bars have a lagging "chip" (L363–364).
  - Each raider has a tag projected over it, pinned to the screen edge with an arrow when off screen, and stacked so tags don't overlap (L406–445).
  - Hit marks on the crosshair are coloured by part, and a kill shows an X and a ring, using WAAPI animations (L374–385).
  - Up to four reused incoming-damage arcs point at the shooter (L391–403).
  - Also a compass, a wind arrow, warnings, a region banner, and a minimap canvas sized to its CSS box (L446–507).
- **Main pieces:** `hud` (L446), `tags` (L406), `hitMark` (L376), `incoming` (L394), `banner`, `toast` (L357–358).
- **Size:** about 160 lines.
- **Depends on:** the DOM in `game.html` L306–380.
- **Tangled with content:** deeply tied to the markup.
- **Fingerprint:** hit colours hull `#e2bd67`, sails `#ecdcb8`, crystals `#ff9f45`, kill `#ff4636`.

#### Hangar demo page — demo / presentation
- **Does:** a separate page (`dist/hangar.html`) showing all six ships, one at a time or together, over a sunset sky, cloud sea and peaks. Drag to orbit, pinch or wheel to zoom, view presets (side, front, back, top, deck), a detail switch and a stats card.
- **Main pieces:** `makeSky`, `makeClouds`, `makePeaks` (L26–104), `main` (L106), `VIEWS` (L196), `window.__hangar` (L311).
- **Size:** 323 lines. **Depends on:** the builder. **Tangled with content:** needs some untangling.
- **Fingerprint:** differs from main's copy only in the shadow type and in redrawing the PMREM light when the context is restored (10 changed lines).

#### Audio (vendored, unused) — audio
- **Does:**
  - `audio/thareia/music.js` is a note-string sequencer: `melody("B4:1 D5:1…")`, 24 synth instruments (`INST` L9–49), and pieces such as travel, battle, flight ("Sunstone Wind"), title, boss and town, played through `musicPlay` and `musicStop`.
  - `sounds.js` holds about 100 Web Audio SFX with a compressor and a generated-convolution reverb (L1–25; exports `sfxInit`, `SFX`, `tone`, `noise`, `fm`, `hz`, `withBus`, `playSfx`).
  - **Nothing imports them.** No game module references `audio/`, and the built `game.html` contains no `AudioContext`, so the polished game is silent.
- **Main pieces:** `musicPlay` (`music.js` L232), `MUSIC` (L219), `sfxInit` (`sounds.js` L15).
- **Size:** 616 lines.
- **Depends on:** nothing (Web Audio).
- **Tangled with content:** clean.
- **Fingerprint:** identical to Thareia's `thareia/sfx/sounds.js` (md5 `017b30b5`); `music.js` is identical apart from 2 lines (see Shared-code clues).

#### Tests, balance tools and the build — self-checks
- **`tools/sim-fight.mjs`** (40 lines, the same in main and polished): Playwright with SwiftShader drives `__game.step(0.25)`. A bot points at the nearest raider (abeam in broadside ships), fires, and sails on once the card's countdown is below 15. It reports seconds per wave, lowest hull, kills and shards. Arguments: `ship waves skies firstWave`.
- **`tools/check.mjs`** (710 lines; main's has 309):
  - A two-device sync test: `progress.js` loaded into `node:vm` twice, with separate fake `localStorage`s, one shared fake claude store, failing writes, dead streams and slow clocks (L46–137).
  - Hangar triangle budgets (L138–158).
  - The game at laptop and phone sizes: buying, flying each ship, every battery hitting, a whole voyage, controls, context loss, and fight-feel checks (all events emitted, ripple timing, heel, kick, spark budgets).
  - Must end with "all good"; `--quick` plays only the game at laptop size.
- **`tools/build.mjs`:** esbuild bundle into `game.html`, `hangar.html` and head-stripped `.artifact.html` copies (L1–40).
- **Fingerprint:** test hooks `window.__game` (`main.js` L566) and `window.__hangar`.

#### RNG and misc utilities — misc
- `Math.random()` everywhere in `game/` (31 call sites, unseeded). A Park–Miller LCG with seeds 3 and 9 is used only for cloud art (`world.js` L168, L183), plus a `hash` in the GLSL.
- Small helpers repeated across files: `clamp`, `wrap` (angle), `lerp`, `smooth` (`kit.js` L30–32).

### Content (polished)
| What | Where | ~lines |
|---|---|---|
| Six ship recipes (measured outlines, ports, guns, clusters, masts, fins, lanterns, cargo) | `ships/skiff,cutter,brig,frigate,galleon,manowar.js` | 260 |
| Ship stats + blurbs (hull/sails/crystals/speed/turning/climbing/guns/crew) | `ships/index.js` L13–26 | 14 |
| Wave table (15) + endless pool | `raiders.js` L35–52 | 18 |
| Skies (3 difficulties), prices | `progress.js` L5–10 | 6 |
| Upgrades text and costs | `mods.js` L6–19 | 14 |
| Raider constants (RAIDER, WARN, CAPTAIN, HEAVY, BOUNTY, ROLE) | `raiders.js` L25–34 | 10 |
| Region grid and names | `world.js` L20–21 | 2 |
| Banner and toast strings | `main.js` (inline) | ~30 |
| Assets: 9 map tiles (avif), minimap, planks/plates/deck/band/parts sheets + `parts.json` | `assets/` (stripped) | — |

### Presentation (polished)
| What | Where | ~lines |
|---|---|---|
| CSS: plum panels with cream edge, gold names; tokens `--night #0e1626`, `--plum #3a1631`, `--cream #ecdcb8`, `--gold #e2bd67`; fonts Jacquard 12 (display) + Pixelify Sans (body); safe-area insets; `@media (max-width:700px)`; reduced-motion | `game.html` L7–266 | 260 |
| DOM shell: `#title`, `#port`, `#hud` (ship panel, compass/wind, minimap, score, tags, hurt, incoming arcs, banner, SVG crosshair, battery bar, touch stick/buttons), `#help`, `#calm` card, `#paused` | `game.html` L268–380 | 113 |
| Port void and berth look | `port.js` L17–51 | 35 |
| Sky, cloud deck, puffs | `world.js` | ~150 |
| (Cinzel and Fira Sans woff2 were added to the assets in `220eb7b` but are "not used by the pages yet") | commit msg | — |

### Shared-code clues
- **Thareia audio:**
  - `audio/thareia/NOTE.md` L7–10: "Copied from `chriskizer91-ops/20-min`, branch `claude/amazing-hamilton-h3g6sg` (commit ce83e0f), folder `vendor/thareia-sfx/`… came unchanged from `chriskizer91-ops/New-game`, branch `claude/tender-babbage-4wiplk`, folder `thareia/sfx/`".
  - Verified: `sounds.js` is byte-identical to `stripped/thareia/source/thareia/sfx/sounds.js`.
  - `music.js` differs only by Thareia's newer two lines at L230–231: `export function musicGain() { return cur ? cur.bus.gain : null; }`. Polished's copy is the older version.
- **Fonts:** the two embedded woff fonts are byte-identical (md5 `40b7431e01`/29,344 chars and `b86b947c53`/20,944 chars) in polished, Sunstone and `reference/the-magpie-over-aethermoor.html`.
- **Magpie lineage, from comments in this code:**
  - `hull.js` L1: "a ship's hull, shaped the Magpie's way from outlines measured off its pictures".
  - `build.js` L35: "Embers: sparks of sunstone light drifting up off every crystal, as on the Magpie".
  - `world.js` L19: "names from the Magpie page".
  - `docs/ships.md` L9: "built the Magpie's way… but in much more detail".
  - The Magpie page itself is minified, so none of this game's function names (`curve`, `tumblehome`, `emberPoints`, `shipMotion`, `hullBand`) appear in it: 0 matches.
  - Region names do appear in it (Hearthsea ×1, Gloomfen ×2, Verdant Wilds ×1, Ironspire ×1). So does a sound library with Thareia's `NOTE_I` note table (`zp={C:0,D:2,E:4,F:5,G:7,A:9,B:11}`, line 155) and airship SFX ("ship-takeoff", "crystal-flare").
- **The claude.ai store pattern** `window.claude.use('db')` → `db.doc('data/users/${id}/save')` (`progress.js` L72–75) is the same key shape the repo CLAUDE.md prescribes. Worth comparing with other published games.
- **Sunstone:**
  - `fleet/brig.js` L6 and the other recipes: `import base from '../ships/brig.js'`, so the levelled-up ships extend the shared recipes.
  - `fleet/build.js` L13–15 imports `LEVELS`, `shipMotion`, `commonShapes`, `bow`, `clamp`, `lerp` from `ship/`.
  - `world.js` L1–3 and L75–78 credit "the version of the game Chris sent on October 6" (a ChatGPT version, kept in `reference/gpt-version/` per commit `843723a`).
  - Its commit messages list the files copied from `airship-game-in-aethermoor-` at `a8124d5` and `1887984`.

### Notes (polished)
- **Silent game:** the music was "brought in" (`220eb7b`) but never wired up. The event bus is ready for it.
- **Dead code:** `fx.slowmo` is never called. Most bus events have no listener.
- **Bugs that polished fixed and the main copy still has** (commit `aa513de`):
  - In main, the next wave `W.next` survives across voyages. `sail` resets `W` without `next` (main `main.js` L93) and `endVoyage` doesn't clear it (L103–111), so leaving from the card makes the next voyage start at the wave after the one you beat.
  - Main's `sail` (L76–86) and `endVoyage` never remove the last ship from the sea scene. Polished adds L106 ("never leave the last ship hanging in the sky") and L134. The port re-parents only the ship it is showing, so the other one can stay behind.
  - Main's save sync can overwrite newer cloud progress from a stale tab: `push` just calls `set` (main `progress.js` L53–60).
- **Save versioning:** `v:1` was never bumped although polished added `synced`, `got` and `banked`. It relies on `merge`. Polished and main use the **same key** `skies-of-aethermoor/save-1`, so they would share and upgrade each other's saves in one browser.
- Polished's per-frame path is written to avoid allocation: reused vectors, pools, the kept `out` and `wish` objects. Main allocates (`clone()`, new objects every frame).

### Drift between the three copies

Trees compared: `M` = main `skies/source/src`, `P` = polished `skies-polished/source/polished/src`, `S` = Sunstone `sunstone-skies/source/sunstone-skies/src`. Made with `diff -rq` on each pair, and `diff` counting changed lines (`<`/`>`).

| Module | M lines | P lines | S lines | M↔P | M↔S | P↔S |
|---|---|---|---|---|---|---|
| `ship/hull.js`, `kit.js`, `materials.js`, `parts.js` | 121/168/117/598 | same | same | identical | identical | identical |
| `ships/*.js` (7 files) | 286 | 286 | 286 | identical | identical | identical |
| `ship/build.js` | 166 | 167 | 166 | changed (7: heel, lamp loop) | identical | changed (7) |
| `game/mods.js` | 38 | 38 | — | identical | only in M/P | only in P |
| `game/damage.js` | 81 | 82 | 81 | changed (33: allocation-free) | identical | changed (33) |
| `game/flight.js` | 109 | 119 | 105 | changed (20) | changed (58) | changed (76) |
| `game/guns.js` | 169 | 239 | 178 | changed (240, rewrite) | changed (45) | changed (263) |
| `game/raiders.js` | 246 | 295 | 210 | changed (109) | changed (238) | changed (333) |
| `game/main.js` | 437 | 584 | 464 | changed (343) | changed (397) | changed (666) |
| `game/progress.js` | 69 | 153 | 428 | changed (122) | changed (483, replaced) | changed (567) |
| `game/effects.js` | 64 | 84 | 97 | changed (78) | changed (33: +ward) | changed (111) |
| `game/input.js` | 112 | 137 | 105 | changed (47) | changed (17) | changed (60) |
| `game/world.js` | 174 | 209 | 201 | changed (55: cloud bake) | changed (49: tiles/detail) | changed (104) |
| `game/pickups.js` | 64 | 68 | — | changed (22) | only in M/P | only in P |
| `game/port.js` | 232 | 243 | — | changed (25) | only in M/P | only in P |
| `demo/hangar.js` | 321 | 323 | 226 | changed (10) | changed (113) | changed (123) |
| `game/events.js`, `game/fx.js` | — | 89, 211 | — | only in P | — | only in P |
| `audio/thareia/` (music, sounds, NOTE) | — | 628 | — | only in P | — | only in P |
| `game/voyage.js`, `garage.js`, `abilities.js` | — | — | 146, 144, 46 | — | only in S | only in S |
| `demo/shipyard.js`, `demo/sunset.js` | — | — | 293, 100 | — | only in S | only in S |
| `fleet/` (15 files: build, hull, rig, rigging, fittings, guns, crystals, shaders, materials, index, 6 recipes) | — | — | 2,246 | — | only in S | only in S |

**What's shared by all three, unchanged:** the procedural ship builder (`ship/` except `build.js`) and all six recipes and stats. This is the cleanest extraction candidate. The flight, gunnery, collision and raider-steering cores are recognisably one codebase but have drifted in each copy.

#### Flight model
- **Main** (`flight.js` L15–106):
  - Base formula as in polished (`handling` L15).
  - Wind (`WIND` L22) and Surge (`SURGE` L25: +60% for 3 s, 15 s recharge).
  - `tune` scales speed, acceleration, turn and climb.
  - Galleon `strikes` (sails gone or hull ≤25%).
  - No heel. It allocates `aimAt()` and `velocity`.
- **Polished** (L12–119): main plus a recoil heel spring (L40–44, L87–89) and the zero-allocation `aimAt` and `move` (L46–47, L108). `shipMotion` adds `opts.heel` to the roll (`build.js` L108).
- **Sunstone** (`flight.js` L13–103):
  - **No wind and no Surge** (it forked before them).
  - Instead `makeFlyer(ship, stats, start, pace, mods)`. `s.setMods` (L34–43) rescales `H` and the full health while keeping each part's fraction.
  - `s.boost {speed, turn, accel}`, set by abilities: Crystal Surge is ×1.45 speed, ×1.3 turn, ×3.5 acceleration (`abilities.js` L31).
  - `s.shield` multiplies the damage taken (Ward, L50).
  - No `struck` state.

#### Firing and damage
- **Main** (`guns.js` L8–169):
  - Every gun of a battery fires in the same frame.
  - Sparks and bursts live inside `makeBolts` (GMAX 900, arrays of objects with `splice`).
  - Tails are at most 14 m.
  - Damage is `KIND.damage × GUN_WEIGHT × damage` (L8, L134).
- **Polished:**
  - Rippling volleys with a queue of pending guns (`RIPPLE` L145, `update` L189–202), with `fire` and `volley` events.
  - Tapered comet tails up to 36 m (L84–135) and a pooled free list.
  - The sparks moved out to `fx.js`.
  - The same `KINDS` and `GUN_WEIGHT`.
  - `damage.js` gives identical results but allocates nothing (polished L53–82 vs main L51–80).
- **Sunstone:**
  - **No `GUN_WEIGHT`**: every class fires the same 28/55 damage before parts.
  - `kindsFor(m, size)` (L130–135) makes per-ship gun kinds from part and skill multipliers: damage, reload, range (as bolt speed), pitch, swing, size.
  - `makeGunnery(ship, slow, mods, size)` (L140) has a `haste` multiplier (Double Shot, L150).
  - Hits read `b.K.damage` (`main.js` L152, L159).
  - `makeBolts` has no `clear()`.
  - `damage.js` is identical to main.

#### Raider AI
- **Main = polished** for `steer`: chaser runs with the 10–15 s break timer, broadside abeam orbit, prize flight, separation (main L153, polished L166).
- **Polished adds:**
  - The broadside warning glow (`WARN`, `charge`, `glowPorts`, L28, L139–142, L218–250).
  - Lead worked out again for each gun as it fires (`r.lead`, L145).
  - Downed raiders' pending guns cancelled (L265).
  - Wrecks low down removed sooner (L268–270).
  - `prepare()` builds a model before its wave.
- **Sunstone** (`raiders.js` L76–210):
  - No prize role: the Galleon fights broadside (L26).
  - Chasers break only on proximity, with no run timer (L140).
  - Wider altitude spread: chasers ±45 m, break ±70 m (L109, L142).
  - Three-level LOD: full detail when `size > 0.32`, but the Galleon and Man-o'-war stay at middle at most (L28, L191).
  - Each raider owns its own fleet-ship instances, so its working parts and damage show (`raiderShip` L46–74).
  - Captains carry garage parts worked out through the player's own `effects()` (L94–98).
  - Class models are built lazily through getters and warmed up in port (L79–85).

#### Waves and difficulty
- **Main = polished:** the 15-wave table, `waveAt` and `SKIES` are identical (`raiders.js` main L30–37 = polished L35–52; `progress.js` L5–9 in both). Polished only builds the captain's model ahead (L292).
- **Sunstone** replaces all of it with a campaign (`progress.js`):
  - Three **charts** (L93–100): Fair Winds, Rough Air, Black Sky.

    | Chart | danger offset | pace | slow | aim | pay | hold kept on going down | mercy |
    |---|---|---|---|---|---|---|---|
    | Fair Winds | 0 | .88 | 1.75 | .026 | ×1.2 | half | yes |
    | Rough Air | 2 | .92 | 1.5 | .02 | ×1.3 | none | yes |
    | Black Sky | 5 | .97 | 1.3 | .016 | ×1.4 | none | no |

  - Each voyage has a danger `D = voyage + offset`.
  - A 15-row `DANGERS` table holds threat budgets, group size, ship pool, and the boss class plus escort (L120–136).
  - `wavesIn(v) = min(10, 4+v)` (L142).
  - `raiderLevel(D)` sets health, damage, slow and aim (L147–151).
  - `waveOf` fills a threat budget (`THREAT` Skiff 1 … Man-o'-war 8) using a **seeded LCG** `s = s·1664525+1013904223` (L154–157, L164–193), so a voyage's waves are the same every time.
  - Reinforcements arrive when the live threat falls to 35% or less (`voyage.js` L81).
  - Mercy: a wave lost again comes back at `max(0.45, 1−0.15·tries)` strength (L163).
  - Seven named captains (L194) with `captainMark` and `captainHealth` (L197–198).
  - "Free flight" keeps a 10-wave version of the old ladder (`raiders.js` L30–38), which has no `extra`.

#### Economy and prices
- **Main = polished:**
  - Ships 0/300/900/2200 (Galleon and Man-o'-war can't be bought).
  - 4 mods × 3 steps.
  - A crystal power slider from −2 to +2.
  - Bounty ×`skies.shards` ×(1+0.1n). Captain ×4, Galleon 300, Man-o'-war 400.
  - Wave bonus `20·n·shards`.
  - Losing keeps half.
  - Polished only adds the shard `taken`/`worth` counts for events (`pickups.js` L24, L44).
- **Sunstone:**
  - No pickups at all: shards go straight into the `hold` when a raider dies (`main.js` L178–179).
  - Ships 0/250/700/**2500/8000/15000**; all six can be bought; slots run from 1 to 6 (L23–24).
  - **10 parts × 5 marks**, each with a gain and a cost (`PARTS` L35–56; `GAIN`/`COST` L28). Mk IV is sold from a beaten danger 4 voyage, Mk V from danger 6.
  - Three-way power tuning: sails, guns, lift (`setPower` L262, `effects` L281–297).
  - Bounty Skiff 15, Cutter 30, Brig 60, Frigate **110**, Galleon **160**, Man-o'-war **240**, × `(1+0.04(D−1))` × chart pay, ½ for a crystal kill, ×3 for a captain (L83, L307–310).
  - Hold bonus `min(1.5, 1+0.1·streak)` (L311). A finished voyage is banked ×1.25 (L325–330).
  - Renown and levels: `levelCost(n)=50+120(n−1)`, max 25 (L74–80). Four skills of six ranks unlock four abilities (L61–70; `abilities.js`).
  - A **strength rating** on the danger scale, worked out from a log₂ power model (`dangerPower`, `kitFactor`, `BASE`, `UPGRADE=2.4`, L351–406), fitted with `sim-voyage.mjs rate`.

#### Save keys and format
- **Main** (`progress.js` L12, L39–60):
  - `localStorage['skies-of-aethermoor/save-1']`, plus the claude store `data/users/${id}/save`.
  - `v:1`.
  - On connect: take the remote save if it's newer by `saved`, otherwise push. `push` is a blind `set`.
- **Polished:** the same key and doc path, with a robust newest-wins sync. Added fields: `synced`, `got`, `banked` (see the Save system above).
- **Sunstone** (`progress.js` L408–428):
  - `localStorage['sunstone-skies:captain:1']` only. **No claude.ai store.**
  - `version: 2`, with an explicit migration from v1 (`fromSave` L416–427: the old difficulty/voyage/wave become the Fair Winds chart).
  - Free-flight captains are never saved.
  - Format: `{version, shards, hold, streak, renown, ships[], ship, parts{id:mark}, fitted{ship:[ids]}, power{sails,guns,lift}, ranks{helm,gunnery,crew,crystals}, chart, charts{fair|rough|black:{voyage,wave,tries}}, best}`.
  - It saves at every garage change, every wave beaten, every loss and every finished voyage.

#### Audio
- Main has none, Sunstone has none.
- Polished vendors the Thareia music and SFX but never imports them. All three ship silent.

#### Controls
- **Main:** polished's set without slide-off-Fire aiming, the window-level pointer release, the `active` gating of drags and looks, or trackpad wheel scaling (wheel = `sign(deltaY)`, main `input.js` L57).
- **Polished:** as described in Input above.
- **Sunstone** (`input.js`):
  - No `active` gating, no R Surge, no Surge button, no pause screen.
  - Keys handled in `main.js` L377–390: 1–6 change ship (in port or free flight), Z/X/V/B for abilities, G garage, Enter fly on or set sail, P put in to port, C, M, H.
  - Touch detection is simpler (`main.js` L26), and it is laptop-first: `check.mjs` L1 says "Sunstone Skies is a laptop game", with a 4096 shadow map (`main.js` L57).

#### Effects and rendering
- **Main:** `effects.js` smoke only, as an array of objects with `shift`/`splice` (L5–48); camera shake is a random jitter (`main.js` L137).
- **Polished:** the pooled `fx.js` engine (trauma, springs, haptics) and pooled smoke with gunsmoke.
- **Sunstone:**
  - Main's smoke plus `makeWard`, a golden Fresnel shell for the Sunstone Ward (`effects.js` L68–97).
  - New top-down tiles at 4 m per pixel with a 16 px border (`world.js` L16, L66), and near-ground grain and water ripple (`DETAIL_GLSL` L79–94, from the ChatGPT version). Cloud noise is still per pixel, not baked.
  - Ships drawn with `fleet/`'s working parts: a rig vertex shader pivoting sails, lids, guns, rudder and fins on 40 channels (`fleet/rig.js` L15), hole and scorch damage shaders (`fleet/shaders.js`), and garage fittings on the model (`fleet/build.js` L40, L165+).
  - The garage is an overlay with the ship at anchor, not a separate scene (`main.js` L392–404).
  - No context-loss handling, and it **never pauses when the page is hidden** (no `visibilitychange`).

#### Docs and balance tools
- **`docs/game.md` "How hard it is"** (main L171–179 vs polished L189–197). The same sim-fight method, re-measured in polished after the broadside warning:
  - Skiff: main says "four waves… ◆ 420"; polished says "usually four (now and then three)… ◆ 400".
  - Brig: main "seven or eight waves", polished "six or seven".
  - Frigate on Maelstrom: polished adds "usually seven".
  - Polished adds the "How a fight feels" section (L118–128).
- **`docs/ships.md`:** one line differs. Polished says broadsides "ripple down the side".
- **`tools/sim-fight.mjs`:** byte-identical in main and polished. Sunstone keeps the older pre-port version: no skies or first-wave arguments, it tracks `g.waves.lost` (diff above), and it wasn't run here.
- **`tools/check.mjs`:**
  - Main (309 lines): port, flight, guns, voyage, reload persistence.
  - Polished (710 lines): adds the vm two-device sync test, context loss and the fight-feel checks.
  - Sunstone (271 lines): six ships flown, batteries, raiders, going down and coming back, controls. Its triangle budget is full 80k–125k for the old four (L17–18).
- **Sunstone only:**
  - **`tools/sim-voyage.mjs`** (308 lines) has five modes:
    - `campaign`: a bot shops, picks the hardest chart its strength allows, and plays all three charts;
    - `wave`: one wave with a given ship and kit;
    - `waves`: a kit grid;
    - `ladder`: bigger and bigger groups of one class;
    - `rate`: fits the strength rating's `BASE` and `UPGRADE`.

    It plays the real game at `DT = 1/30` through `__game.step` (L1–48).
  - **`tests/progress.test.mjs`** (241 lines, `node --test`) runs 14 pure-logic tests against `progress.js`: level costs, parts and slots, marks, skills, tuning, charts opening, wave growth and groups, shards and hold, strength monotonicity and chart needs, and v1→v2 save migration.
  - **`docs/balance.md`** (294 lines) documents the charts, danger, strength (fitted to 75 measurements), parts, skills and the bot's campaign: about 5 hours from the Skiff to Black Sky voyage 10.

#### Sunstone-only systems (no counterpart in the airship repo)

| System | Where | What it does |
|---|---|---|
| Voyage director | `voyage.js` L15–146 | campaign/free modes; states `calm`/`fight`/`after`/`port`; groups with reinforcements; `lose`, `flyOn`, `putIn`, `toPort`, `setSail` with warm-up of the raider models |
| Captain progression | `progress.js` L201–343 | `newCaptain`, `freeCaptain`, `buyShip`, `buyPart`, `fitPart` (canvas exclusivity, slots), `rankUp`, `setPower`, `effects`, `looks`, `bank`, `voyageDone`, `wentDown`, `nextWave` |
| Abilities | `abilities.js` L9–46 | cooldown and duration timers. Surge (35 s cooldown), Double Shot (45 s), Damage Control (60 s; heals 30–45% of what's missing over its duration), Ward (50 s; damage ×½ or ×⅓) |
| Garage UI | `garage.js` L21–144 | five tabs (Charts, Ships, Parts, Tuning, Captain) rendered as HTML strings, with delegated click and input handlers |
| Levelled-up fleet builder | `fleet/*` (2,246 lines) | builds on `ship/` and `ships/`; working parts (`RigBatch`, 40 channels), damage and strake shaders, garage fittings, two gun decks, iron plates, castles; about 195k triangles (Galleon) and 213k (Man-o'-war) at full detail (commit `ae6f2ba`) |

**`sunstone-skies/dist/shipyard.html`** (1,012,852 bytes; stripped 4,593 lines; title "Sunstone Shipyard"). A demo page with no game loop, built from `demo/shipyard.js` (293 lines) and `demo/sunset.js` (the hangar's sunset sky, cloud sea and peaks, moved out "unchanged", 100 lines).
- It floats one of the six levelled-up ships over the sunset clouds.
- Its panel works the ship's moving parts: sail, helm, climb, battle stations and firing.
- It shows damage on hull, sails and crystals, fits the game's ten garage parts (one to four slots shown), and splits the crystal power between sails, guns and lift.
- "Old" and "Both" show the `ship/` version beside the `fleet/` version (`shipyard.js` L1–16).
- It reuses `game/guns.js`, `effects.js` and `progress.js` (`PARTS`, `SLOTS`).
- `tools/check-shipyard.mjs` tests it (157 lines, not read).
