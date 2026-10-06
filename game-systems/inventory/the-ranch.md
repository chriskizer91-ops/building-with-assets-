## The Ranch (working name)

**What it is:** a phone-first 3D toy of Chris's real Zebu cattle ranch in Bardwell, Texas: his painted map lies flat as the ground, real-looking trees/buildings/fences pop up out of it as you zoom in, six cartoon cattle graze along cow trails behind Henry, seven chickens, and a cartoon rancher works a queue of jobs you give him (tractor bale to the hay ring, troughs, chickens, look the herd over, salt, fence walk). No win/lose, no save, no sound.
**Inventoried:** `cursed-worlds` @ `origin/claude/practical-bohr-smpp6z` (`2fb8b11`, 2026-10-05), `the-ranch/` built with `node the-ranch/tools/build.mjs` into a scratch `The_Ranch.html` (not committed): full size 2,699,077 bytes, stripped 1,060,255 bytes (~1,035 KB), 4,088 lines (2 long lines: three.js r128 at L123, 603,352 chars; the trace data at L2449, 117,988 chars). Line numbers for the ranch's own code refer to the stripped source files `source/the-ranch/<file>` (`game-systems/stripped/the-ranch/source/the-ranch/`). Borrowed scripts are cited as `single L…` in the stripped single file `The_Ranch.html`, with their source path named.
**Tech:** three.js r128 (WebGL2 used when there: MSAA render target, alpha-to-coverage), with a full post-process "film camera" (`cinema.js`). DOM overlay for UI (signs, chips, bottom sheet). Plain classic scripts: each file is an IIFE that sets a global factory on `window` (`makeRanchLand`, `makeRancher`, `makeOrders`, `makeLandKit`, `makeCinema`, `makeZebuHD`...). `build.mjs` inlines the CSS, then each `<script src>` in page order, plus `window.RANCH_ART` (six webp map tiles as data URIs). No other libraries. Node tools use Playwright + ImageMagick `convert`.

Inlined script order (single file): `RANCH_ART` L116 · three.r128 L117–125 · `animal-3d-models/viewer/cinema.js` L126–292 · `animal-3d-models/zebu-cattle/zebu.js` L293–796 · `zebu-moves.js` L797–1232 · `zebu-hd.js` L1233–2043 · `animal-3d-models/viewer/land-kit.js` L2044–2446 · `the-ranch/map/trace.js` L2447–2451 · `ranch-land.js` L2452–3035 · `ranch-crew.js` L3036–3305 · `ranch-orders.js` L3306–3509 · `ranch.js` L3510–4086. Source line N maps to single line N+2452 (ranch-land), N+3036 (crew), N+3306 (orders), N+3510 (ranch.js). No `the-clearing-stranded/living/` script is included.

### Coverage
- Read fully: `ranch.js` 1–574; `ranch-orders.js` 1–201; `ranch-crew.js` 1–267; `ranch-land.js` 1–581; `ranch.html` 1–45; `ranch.css` 1–82 (lines cut at 200 chars); `README.md` (identical to `git show …:the-ranch/README.md`); `tools/build.mjs` 1–28, `tools/make-trace.mjs` 1–134 (L109 cut at 420 chars), `tools/trace-check.mjs` 1–52, `tools/ranch-check.mjs` 1–121; `land-kit.js` single L2045–2444 (the few lines over 500 chars cut).
- Skimmed: `cinema.js` single L126–291 (all JS lines; the GLSL string lines skipped), and diffed whole against envoi's copy; `zebu.js` single L294–330, section headings L330–760, L760–794; `zebu-moves.js` header L798–840, section headings, `kf` L945–951, springs + update L1185–1213; `zebu-hd.js` header L1234–1345, section headings, rig + API L2020–2043; first version `versions/the-ranch-2026-10-04.html` L630–660, 712–717, all section headings L630–1215, L1150–1215; Colossus stripped copy L5636–5685 plus greps and a line-set comparison against land-kit; Stranded `living/walker.js` L1–60, `living/trace.js` L1–20, `living/beasts.js` L1–12, `living/traces/camp.js` first 400 chars; Walking Paths `js/files.js` L1–30 plus a grep (via `git show`).
- Data, measured or peeked only: `map/trace.js` L2 (parsed with Python for keys and counts, never printed); `map/ranch-walking-paths.json` (first 400 and last 600 chars, key counts).
- Skipped: three.js (L123); `RANCH_ART` (stripped base64); zebu body geometry (`zebu.js` L470–760, `zebu-hd.js` L1346–2003); zebu-moves `MOVES` table L870–944 and internals L953–1180 (names only); the GLSL of cinema.js's DoF, bloom and grade passes; Stranded beyond the lines above (this branch's Stranded changes ignored, as told).

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| ranch.js 1–22 | systems | header, map↔world conversions (1 map px = 0.3 m), helpers | 22 |
| ranch.js 24–44 | systems | renderer, scene, land hookup, six ground tiles, blob shadows | 21 |
| ranch.js 46–85 | systems | pop-up spring for props; tree pop-up and occluder hiding | 40 |
| ranch.js 87–111 | content | buildings/fences/rail from trace, hay ring, troughs, salt, chickens placed | 25 |
| ranch.js 113–160 | systems | grid A* (herd and crew grids), flood fill, crew blocking | 48 |
| ranch.js 162–265 | systems+content | herd AI, cow blurbs (`ABOUT`) | 104 |
| ranch.js 267–284 | systems | chicken wander and peck | 18 |
| ranch.js 286–341 | systems | wiring the rancher, tractor and job planner into the world | 56 |
| ranch.js 343–394 | systems | camera (top-down to oblique), touch/mouse gestures, tap picking | 52 |
| ranch.js 396–510 | presentation | world-anchored signs, Today checklist, bottom sheets, top bar | 115 |
| ranch.js 512–574 | systems | frame loop, time scale, adaptive quality, `window.RANCH` test hooks | 63 |
| ranch-land.js 1–144 | systems | kit/lights/film camera, paint mask, painted-ground shader | 144 |
| ranch-land.js 146–294 | systems | procedural grass rings; instanced 3D trees (3 kinds × 2 LOD) | 149 |
| ranch-land.js 296–494 | 3D models in code | buildings, fences, railroad, hay ring, stock tank, salt, chickens; canvas textures | 199 |
| ranch-land.js 496–581 | systems | read the painting's colours, per-frame shadows/grass/fog, render, env map, API | 86 |
| ranch-crew.js 1–264 | 3D models + animation | rancher (procedural poses), tractor (loader, wheels), tap and hose | 264 |
| ranch-orders.js 1–201 | systems | job queue + step planner, walking/driving steering | 201 |
| ranch.css 1–82, ranch.html 1–45 | presentation | dark panels, hay-gold accent, chips, sheet, signs | 127 |
| tools/*.mjs | tools | build 28, make-trace 134, trace-check 52, ranch-check 121 | 335 |
| single L117–125 | library | three.js r128 | 9 (603 KB) |
| single L126–292 | borrowed system | `cinema.js` film camera (from envoi) | 166 |
| single L293–796 | borrowed content+dead code | `zebu.js`: `LOOKS` L391–420, `STORYBOOK` L422–428 used; `makeZebu` L429–791 unused here | 503 |
| single L797–2043 | borrowed system | `zebu-moves.js` + `zebu-hd.js` skinned cartoon cattle | 1,245 |
| single L2044–2446 | borrowed system | `land-kit.js` (sky, light, wind, grass material, textures) | 402 |
| single L2447–2451 | data | `RANCH_TRACE` (grid, 1,357 trees, places, buildings, fences, pond, pasture, rail) | 5 (118 KB) |
| **Totals** | | ranch's own JS 1,623 · CSS/HTML 127 · tools 335 · borrowed JS ~2,316 (+three.js) | ~4,400 |

### Systems

#### Frame loop, time scale and adaptive quality — game loop
- **Does:** `requestAnimationFrame` with variable dt. Real dt is clamped to 0.1 s. `tick(real)` advances the world by `real*timeScale` (the 1×/4× chip) and keeps two clocks: `clock` (game time, for cattle) and `wall` (real time, for crew animation and speech). Rendering goes through `land.render` (the film camera). `keepUp` measures the average frame time every 3 s after 40 frames. Over 42 ms it first drops the pixel ratio to 1, then calls `land.lighter()` (film at 0.75 scale, far grass ring off). It is skipped under `navigator.webdriver` or when the page is hidden. `skip(seconds, fps=30)` runs `tick` with no drawing, for tests.
- **Main pieces:** `tick` (ranch.js 517–538), `keepUp`/`perf` (540–547), `frame` (548–557), `resize` (514), `skip` (569).
- **Size:** ~60 lines.
- **Depends on:** every step function; `land.render`; DOM `#loading`.
- **Tangled with content:** needs some untangling. `tick` calls each ranch subsystem by name.
- **Fingerprint:** rAF, variable step, dt clamp 0.1 s; land-kit clamps its own dt to 0.05 (single L2418); time scale 1 or 4; no pause (no visibilitychange handler; rAF simply stops when the tab is hidden); `window.READY` is set on frame 3; adaptive level 0→1 (`setPixelRatio(1)`)→2 (`lighter`) at >42 ms average; base pixel ratio min(1.5, dpr).

#### Camera: top-down map that tips into an orbit — camera
- **Does:** the view is `{x, z, d, yaw, follow}`. Pitch depends on distance. Over the map it goes from 0.72 rad when close to 1.5 rad (straight down) at 75% of FAR. When following an animal it goes from 0.32 rad to 0.95 rad between d=5 and d=45. FAR is computed to fit the whole map on screen (`fitAll`, ×1.06). `flyTo` eases over 1.3 s, interpolating distance in log space and yaw the short way round. A followed target is tracked with exponential smoothing. The view is clamped to the map rectangle. While following, a 16% vertical view offset leaves room for the sheet.
- **Main pieces:** `view`, `pitchFor`, `placeCamera`, `flyTo`, `clampView`, `groundAt` (ranch.js 343–362); fly/follow update (519–524).
- **Size:** ~25 lines.
- **Depends on:** THREE.PerspectiveCamera (fov 38); a raycast against the ground plane y=0.
- **Tangled with content:** clean; only the map half-sizes WX/WZ come from the trace.
- **Fingerprint:** follow smoothing `min(1, real*4)`; zoom limits 22 m (map) / 5.5 m (follow) up to FAR / 45 m; the up vector flips to "north up" only above pitch 1.45; near = max(0.2, d*0.02), far = d*4+600; when far out, cattle are drawn up to 5× (`1+4*sstep(150,750,d)`, 526).

#### Touch and mouse gestures, tap picking — input
- **Does:** Pointer Events with capture. One finger grabs the ground (raycast) and pans so the same ground point stays under the finger. While following, one finger orbits instead (yaw −dx·0.01, distance ×exp(dy·0.004)). Two fingers pinch-zoom and twist-rotate together. The wheel zooms by exp(deltaY·0.0015). A tap is less than 10 px of movement in under 450 ms. It picks the rancher (40 px radius) or the nearest cow (42 px) by projecting them to the screen.
- **Main pieces:** listeners (ranch.js 365–370), `startGesture`, `moveGesture` (371–386), `tap` (387–394).
- **Size:** ~30 lines.
- **Depends on:** camera, `HERD`, `CREW`.
- **Tangled with content:** clean.
- **Fingerprint:** touch-only gestures (grab-pan, pinch, twist); no keyboard, gamepad or Mooncart keys anywhere in the page (no `keydown` handler); `touch-action: none` on the canvas (ranch.css L19).

#### Pop-up props and trees — effects / presentation
- **Does:** objects within `radius` of the view centre, when the view is near (d < 330), spring out of the ground. They spring back when you pull away. Each gets a staggered delay so nearer ones pop first. Trees between the camera and the followed animal or focus point are hidden (`inTheWay`: segment-distance test, tree radius + 1.5 m). Trees standing on painted water (`wet`) never pop up.
- **Main pieces:** `popper`, `stepPops` (ranch.js 48–60), `inTheWay` (66–70), `stepTrees` (71–85); `land.trees.begin/put/end` (ranch-land.js 283–294).
- **Size:** ~40 lines.
- **Depends on:** the view; `land.trees`.
- **Tangled with content:** clean. It is generic "appear near the camera" logic.
- **Fingerprint:** props use the spring `v += ((goal−s)*120 − v*13)*dt` with scale xz `0.35+0.65s` and y `s`; trees use stiffness 110 and damping 12; delay `d/radius*0.45 + rand*0.08` (trees `*0.5 + seed*0.12`); radius `clamp(d*1.35, 80, 260)`. The README credits the idea to What the Map Forgot (ranch.js:7).

#### Grid A* pathfinding (herd and crew) — walking / pathfinding
- **Does:** A* on the trace grid (256×384 cells, 4 map px = 1.2 m each), 8-way, with no corner cutting on diagonals. The heuristic is octile. A hand-written binary heap is capped at 60,000 pops. The path is smoothed by two passes of a [1,2,1]/4 filter. `nearestOpen` is a 4-way BFS capped at 4,000. The herd may walk on `t` (trail, cost 1) and `g` (grass, 1.7). It is limited to `herdLand`, a flood fill from the hay ring. The crew has its own grid. It blocks water `w`, tree cells `T`, building footprints (stamped every 2 px), fence lines (stamped every 1.5 px), and circles round the troughs, hay ring and tap, all at cost 1.
- **Main pieces:** `cellOf`/`cellW` (ranch.js 115–116), `nearestOpen` (118), `herdLand` flood fill (120–122), `COST` and `route` (123–148), `crewBlock`/`blockAt`/`crewPath`/`free` (152–160), extra blocks (292).
- **Size:** ~50 lines.
- **Depends on:** `RANCH_TRACE`.
- **Tangled with content:** clean. `route(from, to, ok, cost)` already takes a passability test and a cost function.
- **Fingerprint:** grid letters `t g T w x o` (trail, grass, tree, water, yard, outside); trace counts o 52,185 · g 26,922 · T 10,730 · t 4,433 · x 3,529 · w 505; each call allocates new Float32Array/Int32Array of 98,304. Same structure as Stranded's `living/walker.js` `route` (see clues), but with a different heuristic, costs and smoothing.

#### Herd behaviour (leader, follow, hay, water, fidgets) — enemy/NPC AI
- **Does:** each cow has a mode (`graze`, `walk`, `hay`, `drink`) and a timer. Henry leads: he wanders within 30 m, and 35% of the time within 55 m. The other cows wander to within 14 m of Henry's goal, and the calf to within 5 m of its mother. They re-wander when they fall more than 22 m (calf 8 m) behind. Wander targets prefer grass cells (trail cells are kept with p=0.3). When hay is out, cows walk to slots round the ring and eat it down. When the troughs are full, thirsty cows (thirst > 0.5) walk to a trough and drink. Otherwise, on each timer they choose: lie down 12%, wander 55%, or graze/stand. Cows push apart, and step away from the tractor (2.8 m) and the rancher (1 m). Every 8–30 s they play a fidget move.
- **Main pieces:** `HERD` setup (ranch.js 171–186), `goTo` (187–190), `wander` (192–202), `stepCow` (207–250), `faceTo`, `arrive`, `callToHay`, `callToWater` (251–265), `putOutHay`/`fillTroughs` (463–464).
- **Size:** ~100 lines.
- **Depends on:** A*, `makeZebuHD` (`act`, `play`, `update`, `state`, `busy`), trace places, tractor and crew positions.
- **Tangled with content:** needs some untangling: the herd keys, Henry, the calf/mother pair and the hay/trough places are built in.
- **Fingerprint:** walk speeds 1.1 / 0.55 (short) / 1.15 (to hay) / 1.0 (to water) m/s; turn 1.6 rad/s while walking, 0.8 rad/s when facing; speed follows target ×min(1, dt·2), stops ×dt·3; waypoint radius 1.4 m (0.35 m for the last); separation distance (sizeA+sizeB)·1.1; one bale = `hayLeft` 1 eaten at 0.0016/s per cow (~625 cow-seconds); thirst +0.004/s, drink −0.08/s; lying lasts 40–90 s; fidget list `swat×2, shake, lick×2, moo, stretch`; `Z.events` is emptied each frame ("for sounds the ranch doesn't make yet", L249). Everything uses `Math.random`.

#### Chickens — NPC AI (tiny)
- **Does:** 7 birds (every third is a brown hen, the rest white) stay hidden "in" until let out. Then each picks a random target near the coop (r 6) or near the feed (r 1.3) every 1.5–5 s. It walks at min(2d, 1.1) m/s with a bobbing body and swinging legs, and pecks (head dips with `sin(clock*6+ph)`) while standing.
- **Main pieces:** `makeChicken`/`CHICKENS` (ranch.js 108–111), `stepChickens` (268–284), `letChickensOut`, `feedChickens` (465–466); model `chicken` (ranch-land.js 479–494).
- **Size:** ~40 lines.
- **Depends on:** the coop place; land materials.
- **Tangled with content:** clean.
- **Fingerprint:** the feed is a flat translucent disc of r 1.4 m (466); there is no pathfinding (chickens walk straight).

#### Rancher job queue and step planner — quests / NPC AI
- **Does:** `makeOrders(G)` keeps a FIFO of job ids. Each job has a label, a "doing" text, an optional `busy()` check that refuses the job with a spoken line, and `plan()`. `plan()` returns a list of step objects `{start(), run(dt)→done}`. Step kinds: `say`, `call`, `walk` (re-paths every 2.5 s when following a moving target), `face`, `act` (hold a pose for N s, then a callback), `wait(cond, max)`, `climbOn`, `climbOff`, `drive` (lines up 4 m in front so it arrives facing the right way), `creep` (straight forward or back), and `loader`. A plan can extend itself at run time: `look` pushes the next-nearest unseen cow's steps through `queueSteps`. Movement is shared by `along()`. On foot it turns fast. Driving uses car-like steering: it cannot turn on the spot and slows for sharp turns and on approach.
- **Main pieces:** `along` (ranch-orders.js 27–45), `wayTo` (47–52), `step` kinds (56–85), `onTractor`/`onFoot` (87–88), `JOBS` hay/water/chickens/feed/look/salt/fence/come/park/house (91–166), `give`/`stop`/`tick` (169–192), API (193–198); world side `SP` spots and `act` callbacks (ranch.js 287–328).
- **Size:** ~200 + ~55 lines.
- **Depends on:** the `G` interface only (crew, tractor, path fn, spots, act callbacks, say, climbOn/Off). It has no THREE dependency.
- **Tangled with content:** the queue and step engine are clean and reusable. The `JOBS` table is ranch content.
- **Fingerprint:** walk 1.35 m/s, drive 3.2 m/s top speed; walking turn 5 rad/s, speed eases ×dt·6, drops to 0.3 when |dh| > 1.2; driving: speed cap 0.9 (|dh| > 0.9) or 1.8 (|dh| > 0.4), final approach `0.5 + d·0.8`, turn rate `0.35 + |v|/2.6` rad/s, accel +1.6/s², brake −3/s², steer `clamp(dh·1.4, ±0.6)`; pass radius 0.6 m walking, 1.7 m driving; creep 0.9 m/s; speech lasts 3.6 s of real time (ranch.js 312). The README calls it "a little helper made inside the game, not a program on the internet".

#### Rancher, tractor and yard props built in code — 3D models + procedural animation
- **Does:** the rancher is a jointed cartoon: hips, spine, neck, head, two arms with shoulder/elbow/hand, two legs with hip/knee/foot. It is built from lathe "limbs" (capsules; r128 has no CapsuleGeometry), spheres, a hat brim deformed per vertex, and canvas textures for the plaid and denim. Its walk cycle and named poses (`stand, sit, reach, scatter, look, carry, wave, climb`) blend joint rotations each frame. The tractor has an extruded hood, canvas tread and grille textures, steering front wheels, a front-loader boom whose tool stays level, a bale spear with a bale, a seat anchor, and engine shake. `makeYardBits` makes a standpipe and a hose laid as a CatmullRom tube.
- **Main pieces:** `limb` (ranch-crew.js 23–28), `makeRancher` (31–154, update 117–150), `makeTractor` (157–244, update 233–241), `makeYardBits` (247–264).
- **Size:** ~265 lines.
- **Depends on:** THREE only.
- **Tangled with content:** clean. These are self-contained factories with `update(dt, t, o)`.
- **Fingerprint:** stride 1.25 m per cycle (`ph += sp·dt/1.25·TAU`); joint smoothing `k = 1−exp(−dt·10)`, walk blend exp(−dt·8); materials MeshPhysical with sheen (rancher) and clearcoat red paint (tractor); loader angle `0.33 − h·0.95`, eased exp(−dt·3); wheel spin = distance/r; engine shake `sin(t·47)·.004 + sin(t·31)·.003`.

#### Painted-map ground and paint mask — rendering
- **Does:** the six 512 px map tiles are planes (153.6 m each) with a patched MeshStandardMaterial. The shader samples the painting with a LOD bias that blurs it when close (`max(0, 3.8−lod)·uNear`). It runs the colour through `unfilm()` (the inverse ACES curve) and divides by the computed sun+sky irradiance, so after lighting and the film curve the ground shows exactly the painted colour. Shadows and cloud shade (−35%) still darken it. Close up (depth < 30–90 m) it multiplies in detail textures cut from the painting itself. A grass patch comes from tile 1 (752,32, 192 px) and a dirt patch from tile 4 (704,1216, 256 px), each made seamless by half-offset blending, mixed by the mask. Pond pixels get noise-normal ripples driven by the wind and roughness 0.06, so they mirror the sky. A 6 km "beyond" plane uses the same shader with flat turf. The mask (512×768, 0.6 m/px, RGBA = grass, bare, water, plowed field) is built from the trace grid first, then rebuilt from painting pixels in `setPaint`, which also tints each 3D tree from the green under it.
- **Main pieces:** `classify` (ranch-land.js 49–69), `GROUND_FS`/`GROUND_N` (93–113), `irr` (115–116), `groundMat` (117–133), `groundTile` (135–139), `beyond` (141–144), `patch` (500–510), `setPaint` (511–535); tile loading (ranch.js 35–39, 537).
- **Size:** ~150 lines.
- **Depends on:** land-kit (`AIR`, `CSH`, `UNFILM`, `EXPU`, `AIRU`), `RANCH_TRACE`, the tile images (`getImageData`, wrapped in try/catch for file:// pages).
- **Tangled with content:** needs some untangling: the patch coordinates and the colour thresholds are tuned to this painting.
- **Fingerprint:** `uNear = 1 − sm(90, 260, d)`; detail scales 1.9 m (grass) and 2.6 m (dirt), plus a rotated second sample at 5.3 / 7.1 m; classify thresholds: bare = `sm(.05,.12, r−g)·(1−sm(−.02,.03, green))`, water inside 1.25× the pond ellipse when `b−g > −.01`, rail corridor 3.4 m without grass; `IRR_SKY = 1.35`; cache key `'ranch-ground'`.

#### Procedural grass rings round the focus — rendering / procedural generation
- **Does:** three static ring meshes of grass cards are centred on the focus point, snapped to their lattice spacing so tufts stay put on the ground. Each vertex works out its tuft in the shader: a cell hash gives jitter, height and kind; the paint mask gives density and shortens it on bare ground; the painting gives its tint. Grass grows in as you come below ~32 m (`uGrow = 1 − sm(16,32,d)`). Cards lean toward a high camera. Wind and pushes come from the kit's `grassMat`, and the followed animal's body pushes grass aside (`uBodyA/B`).
- **Main pieces:** `grassU`, `GRASS_ROOT`, `GRASS_LEAN` (ranch-land.js 150–164), `grassRings` (165–180), per-frame (550–556).
- **Size:** ~40 lines.
- **Depends on:** `K.grassMat` (single L2350–2376), the mask and paint textures.
- **Tangled with content:** clean. It needs only a density/tint mask.
- **Fingerprint:** rings `[r0, r1, spacing, segs, big, fw]` = `[-1,13,.3,3,1,3]`, `[10,32,.7,2,1.6,3]`, `[28,78,1.6,1,2.6,6]`; height `mix(.1,.5,h4²)·(.45+.55·dens)·(1−.6·bare)`; 4 kinds in a 2048×512 atlas; tint `clamp(paint/(.06,.15,.035), .45, 1.6)` at 65%.

#### Instanced 3D trees from the painting — rendering / procedural generation
- **Does:** there are three tree kinds: a post oak (55%), a taller round tree (23%) and a cedar (22%). Each is built once as tube limbs along Catmull-Rom curves (Frenet frames) plus a crown of leaf cards on lobes, in near and far LODs. Each kind × LOD is one InstancedMesh for trunks and one for leaves, with instance colours. Every one of the 1,357 painted trees (from the trace) gets a kind, a turn and a height factor from a sin-hash, and is scaled to its painted radius. A sway shader bends instances by `windAt·.55 + pushAt·.15` from the root up, with translucency glow toward the sun.
- **Main pieces:** `treeModel` (ranch-land.js 187–242), `sway` (245–262), `TREES` (266–271), `TK` instanced meshes (273–282), `trees` API (283–294).
- **Size:** ~110 lines.
- **Depends on:** kit `leafTex`, `barkTex`, `AIR`, `A2C`; `RANCH_TRACE.trees`.
- **Tangled with content:** clean apart from the species mix.
- **Fingerprint:** LOD switch at 38 m (the comment at 286 says 45 m); 30 leaf cards per lobe near, ×0.4 far; only the near LOD casts shadows; leaf depth material alphaTest 0.45; alpha-to-coverage on WebGL2.

#### Buildings, fences, railroad and work props — 3D models built in code
- **Does:** buildings come from trace tuples `[name, mx, my, w, d, h, roofHex, kind]`. Each gets walls (lap siding, corrugated metal, or weathered boards by kind), a two-sheet metal gable roof with a ridge cap and overhang, a concrete slab for houses and barns, a door on the south, house windows, and an open-sided hay barn with posts and 7 stacked bales. Textures use world-sized UVs (`worldUV`). Fences are wire (instanced cedar posts plus 4 sagging barbed-wire strands as LineSegments), board, or steel pipe pens, cut into 12-post runs that each pop up separately. The railroad has a gravel bed extrusion, instanced ties every 0.6 m and two rails, in segments of up to 36 m. Also built here: a galvanised hay ring with an on-end bale and 900 instanced straws, a ribbed stock tank whose water plane rises, and a salt block on a post. All textures are painted on canvas in code.
- **Main pieces:** `worldUV` (ranch-land.js 298–302), canvas textures (303–332), material cache `std` (333–341), `building` (342–386), `fence` (390–418), `railroad` (421–440), `straw`, `hayRing`, `trough`, `salt` (444–475).
- **Size:** ~180 lines.
- **Depends on:** kit helpers (`rnd`, `rr`, `cvs`, `own`, `LIN`), `RANCH_TRACE`.
- **Tangled with content:** needs some untangling. The kinds and colours are ranch-specific, but the generators are parameterised.
- **Fingerprint:** footprint `W = w·0.3·0.9`, `D = d·0.3·0.82`, walls 55% of h; post gaps wire 3.5 m, pen 2.4 m, board 2.6 m; wire heights .45/.75/1.02/1.28 m with 0.05 m sag.

#### Sun, shadows, fog and film per frame — rendering / effects
- **Does:** each frame `update` runs the kit (wind, clouds) and resizes the sun's orthographic shadow box to `clamp(d·0.85, 9, 70)` (only on >10% change). It snaps the box to shadow-map texels round the focus, places the fill light opposite the camera, sets grass growth and the ground's near factor, and scales fog with distance. `render` sets the film camera's focus to the view distance and an aperture that shrinks with distance. The environment map is made once: a PMREM of the kit sky plus a ring of 24 far tree cards.
- **Main pieces:** `update` (ranch-land.js 541–557), `render` (558–561), env block (563–567), `lighter` (574); cinema settings (36).
- **Size:** ~35 lines.
- **Depends on:** land-kit `lights`, `env`, `update`; `makeCinema`.
- **Tangled with content:** clean.
- **Fingerprint:** PCFSoftShadowMap, map 2048 (kit default), shadow far 500; fog near `70 + 1.6d`, far `480 + 4.5d`; cinema `{msaa 4, exposure K.E (0.95 day), bloom .24, rays 0, grain .025, vignette .176, split 0, maxBlur 7, saturation 1.22, fringe .001}`, aperture `0.2·clamp(12/d, .1, .8)`; renderer `outputEncoding Linear`, `NoToneMapping` (the film pass does the tone mapping); `antialias: false`.

#### Land kit (borrowed: `animal-3d-models/viewer/land-kit.js`, single L2044–2446) — rendering / effects
- **Does:** `makeLandKit(renderer, {time, seed, maz})` provides: three hour palettes (`night` = "the Colossus page's night", `dusk`, `day`); `UNF`/`UNFILM` to invert the film's ACES curve, so colours written as screen colours survive the grade; one GLSL "air" block (value noise `mh/mn/mf`, `gustAt`, `windAt`, `pushAt` with 4 expanding push rings plus a capsule-shaped body push); a cloud-shadow function `cshade`; lazily painted canvas textures (grass atlas with seed heads, asters and clover; turf; 8-kind tree atlas; leaves; bark; mist) with "full mips" that raise alpha per level; a sky dome shader (gradient, sun or moon disc, stars, two ridge layers of far hills, drifting clouds, sun flare); `lights()` (hemisphere, shadowed key, fill, fog); `grassMat` (camera-facing cards bent by wind, back-lit glow, alpha-to-coverage); `airy` tree sway; `env` (PMREM); and `update` (wandering wind direction, flow offsets, cloud cover over the disc dims the key light by up to 55%).
- **Main pieces:** palettes (single L2090–2105), ACES (2107–2117), `AIRU`/`AIR`/`CSH`/`A2C` (2125–2151), textures (2154–2274), sky (2277–2327), `lights` (2332–2341), `grassMat` (2350–2376), `airy` (2380–2394), `env` (2397–2402), `update`/`ring` (2405–2428), API (2433–2441).
- **Size:** ~400 lines.
- **Depends on:** THREE, the renderer.
- **Tangled with content:** fairly clean, though the palettes and texture art are Texas-prairie content.
- **Fingerprint:** seeded Park–Miller LCG `seed = seed·16807 % 2147483647` (the ranch passes 20261004); `MAZ = 2.45` is hard-coded (single L2120). **`opts.maz` is documented (L2057) but never read**, so the ranch's `maz: -2.43` (ranch-land.js 22, "high in the north-west") has no effect. By the formulas as read, the sun sits at azimuth 2.45 (north-east). Day palette: exposure .95, fog 70–450, cloud .32, `li` 1.9; default wind `(.83, .55, .35, .6)`; wind angle `.6 + .45 sin(t·.021) + .2 sin(t·.057+1)`.

#### Film camera (borrowed: `animal-3d-models/viewer/cinema.js`, single L126–292) — rendering / post-processing
- **Does:** renders the scene into a half-float target (an MSAA target on WebGL2) with a depth texture. Then: depth of field (signed circle of confusion, single-pass golden-angle bokeh, composite), a 6-level bloom down/up chain, optional radial light shafts toward the sun/moon, and a final grade (exposure, ACES, lift/gain, split toning, saturation, vignette, fringe, grain, letterbox bars, fade, flash). `set()` changes parameters; `scale` sets the internal resolution.
- **Main pieces:** `makeCinema` (single L135), targets `build` (155–166), passes (171–231), `render` (236–275), API (276–289).
- **Size:** ~165 lines.
- **Depends on:** THREE r128.
- **Tangled with content:** clean.
- **Fingerprint:** identical to envoi's `3d-model-main-characters/io/cinema.js` (checked with diff against 5 envoi branches: the only difference is one trailing blank line). Its header promises `setSize(w, h)`, but the returned object has none (L133 vs L276–289).

#### Cartoon Zebu cattle (borrowed: `animal-3d-models/zebu-cattle/zebu-hd.js` + `zebu-moves.js`, single L797–2043) — 3D models built in code + animation
- **Does:** `makeZebuHD(key, {style:'storybook', shade:'soft', detail:.45})` builds one skinned mesh per material pile from lofted sections and swept tubes. It is bound to a bone skeleton, with storybook proportions (short legs, big head) applied by warp functions. Physical "soft" materials replace the toon look. `makeZebuMoves(rig)` animates it with a channel vector (~55 named channels). States are `stand`, `graze`, `lie`, `sleep`, with lie-down and get-up sequences. One-shot moves are keyframe tables eased with smoothstep (`moo, shake, swat, paw, toss, buck, hop, stretch, lick`). Gaits are a walk (duty 0.64) or a trot (0.42) with stride matched to speed. Idle life covers breathing, weight shifts, a spring-damped look-at, ear flicks, tail swats, blinks and chewing. Ears, tail, dewlap and hump hang on springs integrated at 1/120 s substeps. Events are emitted for sound and dust.
- **Main pieces:** `kf` (single L946–951), `makeZebuMoves` (953–1229: `act` 979, `play` 1015, `GAIT` 1046, `locomotion` 1054, `idle` 1087, `springs` 1185–1198, `update` 1202–1213); `makeZebuHD` (1341–2039, rig 2004–2026, API 2035–2038).
- **Size:** ~1,245 lines.
- **Depends on:** `ZEBU_LOOKS`/`ZEBU_STORYBOOK` from zebu.js; THREE.
- **Tangled with content:** the rig/moves engine is generic for quadrupeds, but the channels, poses and looks are cattle-specific.
- **Fingerprint:** update dt clamp 0.1; look spring K 22, C 8.5; spring substeps `ceil(dt·120)` capped at 10; `kf` matches envoi's `80-actions.js` `kf` (smoothstep between keys). Not read in detail: the geometry and the `MOVES` table.

#### zebu.js (borrowed: `animal-3d-models/zebu-cattle/zebu.js`, single L293–796) — content + dead code
- **Does here:** supplies only `ZEBU_LOOKS` (Henry and five cows: colours, horn shapes, sizes; L391–420) and `ZEBU_STORYBOOK` (L422–428) to zebu-hd. Its own `makeZebu` (toon-shaded rigid-part cattle with its own animation, L429–791, ~360 lines) and `makeZebuStorybook` (L793) are never called in this page. They were the first version's cattle.
- **Fingerprint:** its header says it was made the way Stranded makes animals (L296).

#### Assets, tracing and the Walking Paths bridge — asset loading / map tools
- **Does:** the six map tiles are embedded as webp data URIs (`RANCH_ART`), with a fallback to `map/tiles/i.webp` when unbuilt (ranch.js 39). `tools/make-trace.mjs` resizes `map/ranch-map.webp` to 1024×1536 with ImageMagick and classifies 4×4-pixel cells by colour: dirt → trail `t`, at least 9 dark-green pixels → tree `T` (pond water excluded), otherwise `g`. It then applies the hand-measured pasture polygon, yards, building footprints and pond, and opens the cells round hay/troughs/salt. Tree centres come from a 2-pass chamfer distance transform with greedy non-overlap (radius ≤ 22 px). It writes `map/trace.js`. With `--export` it writes `map/ranch-walking-paths.json` (picture, walk = pasture, blocks = yards, buildings, pond and pasture trees as circles, spots = places). When that file exists, the next run reads walk areas, blocks and spot positions back from it.
- **Main pieces:** make-trace.mjs 18–63 (hand data), 67–78 (Walking Paths import), 80–103 (colour classify), 107–119 (trees), 121–132 (write and export).
- **Size:** ~135 lines (tool) + 5 lines (data).
- **Tangled with content:** the classifier thresholds are tuned to this painting; the structure is reusable.
- **Fingerprint:** trace `{w 256, h 384, cell 4, mapW 1024, mapH 1536, grid (string), trees [x,y,r]×1,357, places 9, buildings 11, fences 5, pond {x,y,rx,ry}, pasture 71 pts, rail 4 pts}`.

#### Tests and checks (tools beside the page) — self-checks
- `tools/ranch-check.mjs`: Playwright Chromium on SwiftShader, 390×844 @2x with touch, moving time with `RANCH.skip()`. It checks: loading; all 6 tiles; the title; land painted from the picture; herd `style === 'storybook'` with tris > 5000; >100 3D trees; close-up map detail; the Hay ring sign; no tree in the pond. Then it plays: the hay job (tractor boards, spears, drops; at least 4 of 6 cows get 3 m closer in 12 s at 4×; parks); three queued jobs (troughs full, chickens out); Henry's sheet with Lie down/Stand; grass close up; "look the herd over" completes; the Whole ranch button. Nine screenshots. It ends with "all good"; page errors fail it.
- `tools/trace-check.mjs`: draws the trace grid (38% alpha), trees, buildings, fences and places over the map with ImageMagick into `trace-check.png` + a farmyard crop. It flood-fills from the hay ring and fails if the hay cell is not open, if troughs or salt are unreachable, or if under 60% of open cells are reachable. It ends with "trace ok".
- `tools/make-trace.mjs`: see above (a generator, not a check). `tools/build.mjs`: the inliner (`--artifact` strips the outer tags).
- In-page hooks: `window.RANCH` (herd, places, view, orders, crew, tractor, `skip`, `calls`, `tris`, `pondTrees`, `screenOf`...; ranch.js 559–571), `window.READY`, `window.ERR`.

#### UI: Today checklist, world signs, bottom sheet — menus and UI
- **Does:** DOM buttons pinned to world points each frame by projection. Each sign has a range in metres and hides when off-screen or too far; cow signs hide while following. The rancher's sign shows his current speech. The Today panel holds 4 jobs (hay, water, chickens, look with an n-of-6 count), ticked by `finish(id)`. One reusable bottom sheet `sheet(title, text, buttons[{label, main, disabled, pressed, go}])` serves places, cows and the rancher. The rancher's sheet re-renders when his status text changes.
- **Main pieces:** `sign`/`stepSigns`/`stepCrewSign` (ranch.js 397–420), `JOBS`/`renderToday`/`finish` (423–436), `sheet`/`closeSheet`/`openPlace` (439–462), crew sheet (469–486), `lookAt`/`cowSheet` (488–503), bar (506–510).
- **Size:** ~115 lines.
- **Tangled with content:** needs some untangling. The sheet and sign helpers are generic; `openPlace` is all ranch text.
- **Fingerprint:** sign ranges 420 m (places), 600 m (fence), 160 m (cows), 320 m (rancher); CSS transitions with `prefers-reduced-motion` honoured (ranch.css L80).

#### Random numbers — RNG
- `Math.random` for all simulation (herd, chickens, crew textures, tree delays). The land kit uses a seeded Park–Miller LCG (16807) for painted textures and tree models (single L2065), and the ranch seeds it with 20261004. Per-tree kind and seed use a sin-hash of the index (ranch-land.js 267–270). Shaders use `fract(sin(dot…))` hashes. There is no replay or seed control for the simulation.

#### Save, audio, settings — not present
- No localStorage, IndexedDB or artifact store: the Today checklist resets on reload. No WebAudio: the cattle's `events` are discarded (ranch.js 249). The only setting is the 1×/4× time chip, plus automatic quality.

### Content
| What | Where | ~lines |
|---|---|---|
| Map tiles (6 × 512 px webp, cartoon painting) | single L116 `RANCH_ART` (stripped, ~1.6 MB base64) | 1 |
| Trace: walk grid, 1,357 trees, 9 places, 11 buildings, 5 fences, pond, pasture, rail | `map/trace.js` L2 / single L2449 | 1 |
| Hand-measured buildings, yards, pond, places, fences, rail, pasture | `tools/make-trace.mjs` 22–63 | 42 |
| Herd: 6 animals and blurbs | ranch.js 163–181 | 19 |
| Cattle looks (Henry + 5 cows; storybook colours) | single L391–428 (`zebu.js`) | 38 |
| Rancher jobs (10) with spoken lines | ranch-orders.js 91–166 | 76 |
| Today's 4 jobs and how-to text | ranch.js 423–428 | 6 |
| Place sheet texts (hay, troughs, coop, pens, fence, salt, pond, barn, house) | ranch.js 447–462 | 16 |
| Work spots (park, bale, ring, tap, coop, feed, salt, porch, fence walk) | ranch.js 287–304 | 18 |
| Hour palettes (night/dusk/day) | single L2090–2105 | 16 |
| Walking Paths export of the map | `map/ranch-walking-paths.json` (87,704 chars, one line) | 1 |
| README "a day on the ranch" (Chris's real routine, 9 steps) | README.md | 12 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Look: cartoon map + "soft" cartoon cattle/rancher/chickens in physically lit, film-graded realistic surroundings | ranch-land.js 1–15 header; cinema settings L36 | — |
| CSS tokens: dark translucent panels `rgba(34,30,24,.86)`, hay-gold accent `#e3b04b`, done green `#9cc56b`, cream signs; `ui-rounded` system font stack; no webfonts | ranch.css 3–16 | 14 |
| Top chip bar (Today n of 4, Rancher, 1×, Whole ranch), safe-area aware | ranch.css 23–30, ranch.html 12–18 | 15 |
| Bottom sheet with springy rise animation, 2-column button grid | ranch.css 42–60 | 19 |
| Signpost buttons with a post (`::after`), pop scale transition, `.cow`/`.crew`/`.talk`/`.done` variants | ranch.css 62–76 | 15 |
| Canvas-painted textures (metal, boards, siding, straw, gravel, plaid, denim, tread) | ranch-land.js 72–79, 303–332, 461; ranch-crew.js 33–39, 164–170, 220–223 | ~45 |

### Shared-code clues
- **envoi Colossus in the Meadow (verified: copied and adapted through land-kit).** land-kit header, single L2045–2047: "Taken from the wild meadow of Colossus in the Meadow (envoi-on-the-longest-night, living-battlefields/field.js, makeLivingField, at commit 5439f2c), by way of Henry's pasture (henry-meadow.js), and shared by Henry's pasture and the ranch". Evidence against the stripped `Colossus_Fight.html` (`/* living-battlefields/field.js */` starts at L5637): of land-kit's 341 distinct trimmed lines, 87 occur verbatim in Colossus L5661–6500, 48 of them over 60 characters. Verbatim matches include the noise `mh/mn` (GLSL), `gustAt` (single L2138 = Colossus L5731), `windAt` (L2139–2140 = L5732–5733), the `pushAt` ring loop, `CSH` cloud shadows (L2149 = L5742), `ridge3` far hills (L2284 = L5923), `TREECELL` (L2199 = L5806), `fullMips` and its comment, the grass-blade and tree-atlas painting code, bark/mist textures, and the wind wander formula (L2420 = L6487). Changed in the kit: default `uWind` `(.83,.55,.4,.7)` → `(.83,.55,.35,.6)`; push ring radius 19 m → 4.5 m and decay 1.25 → 2.4 (L2425 vs L6490); `uVortex` dropped and `uBodyA/B` (Henry's body pushing grass) added; day and dusk palettes, the sun disc, an ACES inverse (`UNFILM`) and PMREM `env` added (none of these found in Colossus by grep). The grass colour term `mix(.58, 1.05, vHt) * (1. + .5 * vB * vHt)` is shared (L2370 vs L6040); the kit swapped Colossus's decal term for cloud shade. The ranch's own `ranch-land.js` copies nothing from Colossus directly. Its line 3 says "It is drawn the way envoi's Colossus in the Meadow draws its meadow, through the land kit". README: "the way envoi's *Colossus in the Meadow* draws its meadow".
- **envoi film camera:** single L127 "cinema.js is copied as it was from envoi-on-the-longest-night, 3d-model-main-characters/io/cinema.js (October 4, 2026)… Nothing in it is changed." Verified byte-identical apart from one trailing newline (diff against envoi `origin/work/arenas` and 4 other branches).
- **envoi animation:** single L800 "Animated the way envoi animates its models (…3d-model-main-characters/io/model/80-actions.js)"; L945 "as envoi's kf". `kf` is the same smoothstep-eased keyframe function as envoi `80-actions.js` L17–21 (`git show origin/work/arenas:…`). zebu-hd L1240–1241 cites envoi `3d-model-main-characters/io` and `3d-model-new-character-ideas/emberback` for the 'envoi' style, which the ranch does not use.
- **Stranded (`the-clearing-stranded/living/`):** zebu.js single L296 "Made the way Stranded makes its animals (the-clearing-stranded/living/beasts.js and survivor.js)", but only 6 trivial lines are shared with beasts.js+survivor.js (helpers and the outline `outMat` shader), and that path (`makeZebu`) is dead in the ranch. The ranch A* (ranch.js 125–148) has the same shape as Stranded `living/walker.js` `route` L24–48: the binary-heap `push`/`pop` one-liners are near-identical text, both are 8-way with diagonals only where both sides are open, and both end with the same null check (`if (came[to] < 0 && to !== from) return null` vs `if (prev[t0] < 0 && s0 !== t0) return null`). Differences: octile heuristic in cells vs Euclidean in metres; costs `{t:1, g:1.7}` vs `{t:1, g:1.25, f:1.3, s:1.4, m:1.6, G:1.7}`; [1,2,1] smoothing vs line-of-sight straightening; grid 256×384 auto-traced from colours vs 48×32 from hand-drawn polygon traces (`living/traces/*.js`, painting 1536×1024). The trace formats are not shared. Stranded's particle system is not in the ranch (there are no particles at all), and no beasts code is shared.
- **What the Map Forgot:** ranch.js:7 "(the way the towns stand up off the world map in What the Map Forgot)" for the pop-up; zebu.js L310 and zebu-hd L1245 "What the Map Forgot's 3D look (what_the_map_forgot wren-3d)"; zebu-hd L1317 "as Wren's are painted (wren-3d src/wren-model.js)"; zebu.js L421 palette "ink #1d1b2c, paper #f4efe2".
- **Walking Paths (Mooncart repo `building-with-assets-`, branch `claude/gifted-wozniak-v579gl`, `editing-tools/walking-paths/`):** `ranch-walking-paths.json` was made by the ranch's own `make-trace.mjs --export`, not saved from the editor. Its `"about"` is `"The ranch map, from the-ranch/tools/make-trace.mjs --export"` (the editor writes its own long `ABOUT`, files.js L14–21), `savedAt` is `2026-10-04T20:02:48.003Z`, and all 9 spot coordinates equal `PLACES` in make-trace.mjs 45–55, so it has not been edited in the editor since. It was committed in `4dc167a` "Henry at full detail, and the ranch map in Walking Paths". The format does match the editor's: files.js L85 `{ format: 'walking-paths', version: 1, about: ABOUT, savedAt: …, maps }`, and the map keys `name, src, size, walker, start, walk, block, front, exits, people, spots` are those in its ABOUT. The ranch sets `walker: 8`. One small difference: the ranch's `look` spots carry an `id` (the editor's ABOUT lists `id` only for story areas); make-trace matches by `sp.id || label`. The editor has no README; I read only `js/files.js` L1–30 plus a grep. Its ABOUT ends "These are the rules of the field in Envoi on the Longest Night (src/game/field.js)".
- Seeded LCG `seed * 16807 % 2147483647` (single L2065) is the same as Colossus L5666 (and Colossus L269, L1745, L3517).
- `window.RANCH` / `window.READY` / `window.ERR` test-hook pattern with a Playwright `*-check.mjs` that ends in "all good": the same convention as the cursed-worlds CLAUDE.md checks for Stranded.

### Notes
- **Sun direction bug:** `makeLandKit` ignores `opts.maz` (documented at single L2057, but `MAZ = 2.45` is a constant at L2120). The ranch asks for `maz: -2.43` ("high in the north-west where the painting has it", ranch-land.js 21–22; README says the same). By `dirAt` (x = sin az, z = cos az, x east, z south) the light then comes from the north-east, so shadows fall south-west, against the painted shadows. This is from reading the code only; I did not render it. The first version lit from (−60, 120, −70), which is north-west.
- **Dead code in the page:** zebu.js `makeZebu`/`makeZebuStorybook` (~360 lines, single L429–793); zebu-hd's 'envoi' style branch (the ranch always passes `style:'storybook', shade:'soft'`); land-kit's night/dusk palettes, `groundTex`, `treeTex`, `mistTex`, `airy`, `ring`. By grep, ranch-land.js uses only `K.sky, lights, grassMat, env, update, leafTex, barkTex, DISC, E, dispose` plus the helpers destructured at line 23.
- `putOutHay` calls the herd with `setTimeout(400 + i·700 ms)` (ranch.js 463): this is real time, so it ignores the 4× chip and `RANCH.skip()`.
- `route` allocates two 98,304-entry typed arrays per call, and `wander` scans every reachable herd cell (up to ~31k) on each call (ranch.js 197). Fine for 6 cows, but would not scale to big herds.
- Comment/code mismatches: tree LOD "within 45 m" vs 38 m (ranch-land.js 286 vs 288); cinema's `setSize` is promised but missing.
- No save, no versioning, no audio. The cattle already emit `moo/step/thump` events, ready for sound.
- **First version** (`versions/the-ranch-2026-10-04.html`, 1,218 lines, stripped 815,372 bytes): one script, `ranch.js` (L630–1215), plus `zebu.js` only. It used toon shading (`MeshToonMaterial` with a 3-step gradient plus an inverted-hull outline shader, L712–717), the low-detail rigid `makeZebu(k, {detail:'low'})` cattle (L933) with an `eat` state, a plain `renderer.render` with `antialias: true`, a fixed sky colour and fog (L655–658), a sun at (−60, 120, −70), one instanced crown/trunk for all trees, and a grass-grain overlay on the ground. There was no land kit, film camera, rancher, tractor, orders, adaptive quality, `skip()` or Moo button. About 299 of the current `ranch.js`'s 506 distinct trimmed lines are unchanged from it (popper, A*, herd, camera, gestures, signs, sheets). The rewrite moved the world into `ranch-land.js` + land-kit and added crew/orders.
