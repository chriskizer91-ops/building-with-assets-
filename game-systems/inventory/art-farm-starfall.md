## Art Farm

**What it is:** A virtual scavenger hunt at the Russell Farm Art Center: Chris's painted farm map lies flat on a table, pops up into a 3D paper pop-up book (every wall, tree and sign a hinged card printed with his paintings), and you walk it to find twelve things from clues, each giving a postcard.
**Inventoried:** `farm-project` @ `origin/claude/determined-cerf-bua9qu` (`13b38dc`), `art-farm/dist/art-farm.html`. Full size 11,571,740 bytes, stripped 765 KB (783,301 bytes), 2,151 lines (`wc -l`). Line numbers refer to the stripped single file `game-systems/stripped/art-farm/art-farm.html`, which has the same numbers as the real file. Each system also names its source file under `stripped/art-farm/source/art-farm/src/`. The build (`tools/build.mjs`) puts each file inline after a `/* src/<file> */` marker.
**Tech:** three.js r128 (WebGL, inlined at L174). Built-in Lambert materials are patched through `onBeforeCompile` shader injection, plus two custom `ShaderMaterial`s (billboards, sky). DOM/CSS for all UI. Ten plain scripts: each `src/*.js` defines one global (`FARM`, `FARM_PAINT`, `PAPER_ART`, `makeTextures`, `makePaper`, `makeBuildings`, `makeNature`, `makeWorld`, `makeCritters`), and `game.js` is an IIFE that exposes `window.ArtFarm`. No libraries besides three.js. No audio or gamepad code (grep for AudioContext/Audio/gamepad found nothing).

### Coverage
- **Read fully:** L1–173 (head, CSS, markup); L175–429 (farm-layout.js, farm-paint.js header); L431–436; L438–2151 (paper-art.js header, textures, paper, buildings, nature, world, critters, game.js). Repo tools, read fully with `git show`: `art-farm/tools/check.mjs` (115 lines), `build.mjs`, `sheet.mjs`, `art-farm/versions/README.md`.
- **Skimmed:**
  - L430 `FARM_PAINT` (17,423 chars): peeked at its keys `map`/`drives`/`islands`/`ponds`/`trees` and counted about 684 traced trees.
  - L437 `PAPER_ART` (9,794 chars): peeked at its keys and counted entries (`hero` 18 painted walls, `materials` 13, `cutouts` 10, `trees` 9 tree cards, `things` 41, plus `sky` and `ground`).
  - Headers only (first 15 lines): `paper-art.py`, `prepare-art.py`, `aerial_frame.py`.
  - v1 `stripped/art-farm-v1/v1-cel-shaded.html`: grepped only.
  - What the Map Forgot 3D `stripped/what-the-map-forgot-3d/source/wren-3d/src/farwick-3d.js`: grepped L46/L52/L76 only, to check the lineage.
- **Skipped:**
  - L174: three.js r128, 603,352 chars (vendor).
  - All base64 images, already stripped to `[[stripped]]` markers: the `ASSETS` map/tint at L1677, 14 `CARDS` postcards at L1678–1685, and the image URLs inside L437.

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| L1–6 | presentation | doctype, viewport, title | 6 |
| L7–124 | presentation | CSS: palette tokens, HUD, stick, Look button, pins, title, postcard/list sheets, toast, landscape rules | 118 |
| L125–166 | presentation | DOM: canvas, pins layer, top bar, clue, stick, Look, title, map note, card, list, toast, loading | 42 |
| L167–176 | vendor | three.js r128 (1 line of 603 KB) | 10 |
| L177–423 `farm-layout.js` | content | `FARM`: format docs (L178–207); start/sun; 20 buildings; pavilion; 9 fences; beds/rows/pond; 26 props; 3 cows; the 12-step hunt | 247 |
| L424–432 `farm-paint.js` | content (generated) | `FARM_PAINT` traced from the aerial painting (1 data line) | 9 |
| L433–439 `paper-art.js` | content (generated) | `PAPER_ART` atlas rects and embedded picture sheets (1 data line) | 7 |
| L440–542 `textures.js` | systems + content | sign/mural canvas atlas, slot packer, auto-fit sign text, code-painted mural | 103 |
| L543–775 `paper.js` | systems | paper pop-up engine: wave and hinge GLSL, patched materials, merged buckets, panel/face/quad/put/box, instanced billboards | 233 |
| L776–1018 `buildings.js` | systems | data-driven paper buildings (walls, gables, hip/shed roofs, doors, windows, signs, porches) giving targets, colliders and labels | 243 |
| L1019–1311 `nature.js` | systems + content | cards, model sheets, turning cards; trees plus a procedural forest ring; fences on polylines; beds; pavilion; lily pond; small props | 293 |
| L1312–1570 `world.js` | systems | textures, heightfield, baked "kinds" canvas, ground shader, water, sky dome, lights, spatial-hash collision | 259 |
| L1571–1658 `critters.js` | systems | wandering grazing cows; visitor sprite that turns its picture to the camera | 88 |
| L1659–2149 `game.js` | systems | boot, save, player, camera rig, tweens, pop/fold sequences, hunt, postcards, HUD, map pins, input, walk, loop, test hooks | 491 |
| L2150–2151 | — | closing tags | 2 |
| **Total** | | systems about 1,710 (with some content mixed in: the mural, nature's one-off props), content/data about 265 (including 2 packed data lines), presentation about 165, vendor 10 (1 giant line) | **2,151** |

### Systems

#### 1. Boot and asset loading — asset loading
- **Does:** Turns every data-URI picture (the map, the tint, and every `PAPER_ART` sheet) into an `Image`, waits for all of them with `Promise.all`, then calls `boot()`. Any failure, or a missing WebGL renderer, puts a plain message in `#loading`. `boot()` creates the renderer, scene and world, records timing, and finally sets `window.ArtFarm.ready`.
- **Main pieces:** `ASSETS`/`CARDS` (L1677–1685), `load` (L1687), `fail` (L1688), `ART` list and `Promise.all` (L1690–1694), `boot` (L1696–1715, L2142–2146).
- **Size:** about 30 lines.
- **Depends on:** `PAPER_ART`, three.js, DOM `#loading`.
- **Tangled with content:** clean. A generic "load these URLs, then start" step.
- **Fingerprint:** Every asset is a base64 data URI inlined by `tools/build.mjs`, so there is no network. Error text: "The farm could not open on this phone: …". `timing.world`, `timing.firstRender` and `timing.total` are measured with `performance.now()`.

#### 2. Game loop, game clock and tweens — game loop / timing
- **Does:** A `requestAnimationFrame` loop with a variable timestep, where `dt` is capped at 0.05 s. Each frame runs `tick(dt)` (tweens, toast timer, pop/fold uniforms, walking, camera, animals) and then `render()`. Tweens are promises driven by the game clock, not wall time. With `?manual` the loop does not tick, and `ArtFarm.advance(s)` steps it at 1/30 s, so the check tool runs deterministically. Resolution adapts to a slow phone: after more than 45 slow frames (dt > 0.04) while walking, the pixel ratio drops by 0.25, down to a floor of 1.
- **Main pieces:** `tweens`/`tween`/`runTweens` (L1774–1776), `tick` (L2064–2081), `render` (L2082), `resize` (L2085–2090), `frame` (L2093–2099), `advance` (L2106).
- **Size:** about 45 lines.
- **Depends on:** world, camera rig, critters, hunt HUD.
- **Tangled with content:** clean. The tween runner and the manual clock are fully generic.
- **Fingerprint:**
  - rAF, variable dt, `Math.min(0.05, …)`. There is no pause: card and list only change `state`, and the world keeps animating.
  - The pop wave clock `popT` is pinned to 99 once it passes 9 s while walking.
  - Pixel ratio starts at `min(2, devicePixelRatio)` and drops by 0.25 after 45 slow frames.
  - `?manual` steps at 1/30 s, with two `await Promise.resolve()` between steps.

#### 3. Input: thumb stick, drag-look, tap and keys — input
- **Does:** Uses pointer events on the canvas.
  - A touch (non-mouse) in the left 45% of the screen and below the top 30% becomes a floating stick: the stick DOM element moves to the finger, its radius is 48 px and the knob moves up to 34 px.
  - Any other pointer drag turns the view (yaw 0.0058 rad/px, pitch 0.0045 rad/px, pitch clamped to −0.9…0.7).
  - A short tap (under 9 px and under 450 ms) finds the current target if it is findable and within 90 px of its projected point on screen. Otherwise it casts a ray to the ground plane and sets a walk-to destination (under 60 m away).
  - Keys depend on the game state.
- **Main pieces:** `stick`, `looks`, `keys` (L1969), `stickAt`/`stickHome` (L1971–1972), `pointerdown/move/up` (L1973–1997), `tapAt` (L1999–2009), `keydown` (L2010–2022), `keyup`/`blur` (L2023–2024), button handlers (L2025–2035).
- **Size:** about 70 lines.
- **Depends on:** DOM `#stick`/`#knob`, camera (`THREE.Raycaster`), the hunt (`findable`, `foundIt`), `state`.
- **Tangled with content:** needs some untangling. The stick and drag-look are generic, but `keydown` mixes in hunt, card, list and map actions.
- **Fingerprint:**
  - **Walking:** W/S or ↑/↓ forward and back; A/D strafe; ←/→ or Q/E turn at 1.9 rad/s.
  - **Actions:** Enter or Space = Look, M = fold to the map, L or H = list, V = switch eyes/walker view.
  - **Card open:** Enter, Space or Escape closes it.
  - **List open:** Escape, H or L closes it.
  - **Title:** Enter, Space or M starts.
  - **Map:** Enter, Space, M or Escape walks again.
  - **Mooncart:** the keys fit Mooncart's mapping (arrows, Enter = A, Escape = B, M = START, H = SELECT = list), but nothing in the page names Mooncart, and Art Farm is not in `building-with-assets-/games.json`.
  - **Touch:** a floating virtual stick on the left plus drag-to-look anywhere, tap-to-walk, tap-to-find, and an on-screen Look button.
  - No gamepad support.

#### 4. Walking movement — walking
- **Does:** Combines the stick and keys into forward/strafe input and handles turning. A tap destination steers the player toward its heading, slowing when off course, and is dropped when reached (under 0.5 m) or when stuck. The player moves at 4.2 m/s, times 1.3 when the stick is pushed past 0.93. The new position goes through `world.collide` with radius 0.32 m. A smoothed speed is kept for the walker's animation, and the facing angle follows actual movement.
- **Main pieces:** `player` (L1724), `walk` (L2038–2063).
- **Size:** about 30 lines.
- **Depends on:** Input, Collision world, `heightAt`.
- **Tangled with content:** clean.
- **Fingerprint:**
  - 4.2 m/s, with a ×1.3 "run" when the stick is above 0.93.
  - Turn rate 1.9 rad/s; tap-to-walk heading gain `dt*5`.
  - Radius 0.32 m, eye height 1.55 m.
  - Heading convention: forward = (−sin h, cos h), where x grows west and z grows north.

#### 5. Collision world — maps and collision
- **Does:** Buildings, nature and ponds produce a list of colliders of four kinds: `box`, `circle`, `seg` (a capsule segment) and `poly` (a pond outline). Each is indexed by its bounding box into an 8 m spatial-hash grid. `collide(x,z,r)` runs 3 relaxation passes that push the walker out of nearby shapes, then clamps to the map bounds. `blocked()` reports whether the walker was pushed more than 0.05 m.
- **Main pieces:** `CELL`/`grid` (L1515–1526), `near` (L1527), `BOUND` (L1528), `collide` (L1530–1555), `blocked` (L1556). Colliders come from buildings.js L936 and L1011, nature.js (throughout), and world.js L1486.
- **Size:** about 45 lines.
- **Depends on:** `inPoly`/`edgeDist` (L1346–1347), map rect `R`.
- **Tangled with content:** clean. A generic 2D push-out against mixed shapes.
- **Fingerprint:** analytic shapes rather than a tile grid or mask; an 8 m hash; 3 iterations; bounds `[x0+2, z0+2, x1−2, z1+6]`. Building boxes are the footprint plus 0.14 m and carry `h` (wall plus rise) for the camera's pull-in test.

#### 6. Terrain height — procedural generation / maps
- **Does:** The ground is flat inside the farm rectangle (x −30…165, z 65…215). Outside it rolls gently with value noise, amplitude 1.8 m, ramping in over 30 m. Inside pond polygons it dips by −0.08 m, deepening by half the distance to the edge, to at most 1.2 m.
- **Main pieces:** `hash`/`vnoise` (L1343–1344), `inPoly` (L1346), `edgeDist` (L1347), `heightAt` (L1348–1353).
- **Size:** about 12 lines.
- **Depends on:** `FARM_PAINT.ponds` plus `FARM.ponds`.
- **Tangled with content:** needs some untangling. The flat-zone rectangle is hard-coded to this farm.
- **Fingerprint:** sin-hash value noise (127.1, 311.7, 43758.5453, smoothstep interpolation) at frequency 0.025 per meter.

#### 7. Paper pop-up engine — rendering / animation (core)
- **Does:** Every static piece is written into buckets keyed by material and 64 m chunk, each with per-vertex attributes:
  - `hA`: a hinge point plus the yaw of the hinge axis.
  - `hB`: a second hinge, applied first, used for roofs folding at the eave.
  - `pp`: the wave timing point, a jitter, and how far hinge B turns.

  A patched `MeshLambertMaterial` vertex shader computes `popAt()` from a radial wave centered on the player. It rotates each vertex about its hinges with a Rodrigues rotation (`hRot`), from flat (90°) to standing. Pieces with no hinge scale up instead. Pieces still flat sink 0.6 m under the map. A second wave (`uFold`) folds everything back flat. `finish()` turns the buckets into merged `BufferGeometry` meshes, using a Uint32 index when there are more than 65,535 vertices.
- **Main pieces:**
  - Uniforms and GLSL: `POP`/`WIND` (L557–558), `NOISE` with `popK` (L559–565), `POPFN` with `arrive`/`popAt` (L568–574), `HINGE` (L576).
  - Materials: `patch` (L583–604), `lambert` (L607–616).
  - Geometry building: `spot`/`hingeA`/`hingeB` (L640–643), `bucket` (L644–649), `vert` (L651–655), `put` (L658–672), `box` (L676), `face` (L681–685), `panel` (L688–696), `quad` (L698–700), `finish` (L755–772).
- **Size:** about 190 lines (L543–700, L755–775).
- **Depends on:** three.js, `PAPER_ART.materials`, the textures passed in.
- **Tangled with content:** clean. It knows nothing about the farm; any game can feed it hinged quads.
- **Fingerprint:**
  - `popK(x)` = 0 if x ≤ 0, 1 if x ≥ 0.7, otherwise `1 + 2.7t³ + 1.7t²` with `t = x/0.7 − 1` (ease-out-back over 0.7 s).
  - `arrive(d) = d / (uPopV·(1 + d/150))`, with `uPopV = 34` m/s.
  - `popAt = popK(uPop − arrive(d) − j) · (1 − smoothstep(0, 0.4, uFold − 0.55·arrive(d) − 0.5j))`.
  - Hinge A angle `(1−pkA)·π/2`. Hinge B uses `popAt` at j + 0.28 and turns by `pp.w`.
  - Card thickness `TH = 0.07` m, with white cut edges and a cream back (0.96, 0.93, 0.86).
  - Chunk size 64 m with origin −400; bounding sphere +30 m.
  - Cutouts use `alphaTest 0.5` with `alphaToCoverage`.

#### 8. Instanced billboard cards — rendering
- **Does:** All trees, and separately all "round" prop cards, are drawn as one `InstancedBufferGeometry` each. Each instance carries position, size, atlas rect and pivot/jitter. The vertex shader turns each card toward the camera about the y-axis (a cylindrical billboard), tips it up from lying on its back with the same `popAt` wave, and sways tree tops in a breeze. Near the camera the card dithers away with a screen-door effect, so trees down to their trunks and small cards fully, so they never fill the view.
- **Main pieces:** `trees` (L705), `billboards` (L706–753).
- **Size:** about 50 lines.
- **Depends on:** Paper engine GLSL (`POPU`, `POPFN`, `NOISE`), three.js fog chunks.
- **Tangled with content:** clean.
- **Fingerprint:**
  - Sway `sin(uT·1.2 + x·0.37 + z·0.21)·0.018·y`, only once fully up.
  - Fade range 1.2–3.5 m for small cards and 3.5–8 m for big ones (taller than 6 m).
  - Dither with interleaved gradient noise (`52.9829189`, `0.06711056`, `0.00583715`).
  - Discard at alpha < 0.4. `frustumCulled = false`.

#### 9. Building generator — 3D models built in code
- **Does:** For each `FARM.buildings` entry (footprint, facing, wall height, wall looks, roof), the generator:
  - Builds four wall cards hinged at the ground, shaped as gable, shed slope or rectangle.
  - Prints each wall with a whole painted wall (with the gable apex lined up to the painting), a repeating painted strip, or a tiling material.
  - Adds doors, windows, prints, panels, painted signs, lamps, a mural, porches, and roof panels hinged at the eave: gable "across" or "deep" with an off-center apex, hip, or shed, plus ridge vents.
  - Outputs hunt `targets` keyed `sign:`, `spot:`, `mural:` or `building:`, each a point plus a facing normal. Also box colliders and map labels.
- **Main pieces:** `makeBuildings` (L787); local frame `L`/`WP`/`WN`/`onWall` (L804–812); `outline` (L817–830); wall loop (L832–867); wall decorations (L870–929); porch (L931–953); `roofPanel` (L957–967); `vent` (L970–973); roof kinds (L974–1008); targets, colliders and labels (L1009–1012).
- **Size:** about 230 lines.
- **Depends on:** Paper engine, `FARM`, `PAPER_ART` (`hero`, `cutouts`, `things`), `makeTextures` (`sign`, `mural`).
- **Tangled with content:** needs some untangling. The geometry is generic, but material names (`roof-rust`, `window-dairy`…) and the data schema are farm-specific.
- **Fingerprint:**
  - Roof kinds: gable (ridge `across`/`deep`, `apex` fraction), `hip`, `shed`.
  - Door kinds: `door`, `double`, `french`, `open`, `roll`. Window kinds: `white`, `dairy`, `house`.
  - Hinge B angle for a roof panel = π/2 − slope. Roof overhang at the gable ends (`ovs`) is 0.3 m.

#### 10. Nature and props generator — 3D models built in code / procedural generation
- **Does:** Builds everything that isn't a building, as paper cards from Chris's "things" sheet:
  - `card`: a standing picture hinged at its feet. `model`: a side card plus front and back end cards from a model sheet. `turning`: a camera-facing round card.
  - Trees from the traced aerial list, with species chosen by crown radius, plus a procedural forest ring of up to 260 trees outside the painting, thinning with distance and keeping the road clear.
  - Fences printed along polylines in roughly 3 m lengths, with gaps and open gates.
  - Raised beds, rows of young trees, the pavilion, the lily pond (with a rotated water UV, a stone ring and a spout), standees, the garden sign, hay bales (cylinders with UV remapping), the fire ring and the wire donkey.
  - A `switch` dispatches on prop kind. Each piece adds its colliders and hunt targets (`prop:<id>`).
- **Main pieces:** `makeNature` (L1030); `sizeOf`/`card`/`model`/`turning` (L1045–1075); `KIND`/`pick`/`tree` and the forest loop (L1078–1098); `along` and fences (L1103–1139); beds and rows (L1144–1158); pavilion (L1161–1182); `lilyPond` (L1185–1208); `standee` (L1212); `gardenSign` (L1225); `bales` (L1238); `fireRing` (L1256); `wireDonkey` (L1264); prop switch (L1275–1307).
- **Size:** about 280 lines.
- **Depends on:** Paper engine, `heightAt`, `FARM`, `FARM_PAINT`, `PAPER_ART.things/cutouts/trees`.
- **Tangled with content:** deeply tied in parts. `card`, `model`, `turning`, `along` and the forest ring are generic, but most functions are one specific farm object.
- **Fingerprint:**
  - Park-Miller LCG with seed 77, so placement is the same on every load.
  - Tree width = r × 2.15 (oak) or × 1.3 (young). Tree colliders are circles of radius `0.18 + r·0.05`, only for trees with r ≥ 2.1.
  - Fence piece length 3 m; fence collider capsule radius 0.18.

#### 11. Sign and mural canvas atlas — rendering / text layout
- **Does:** One 2048×2048 canvas atlas with a shelf (row) slot packer. `sign(text, look, w, h)` paints a sign face in one of 6 looks (wood grain streaks, border, multi-line text shrunk until it fits 86% of the width) and returns its UV slot. `mural()` paints the welcome mural procedurally (sky gradient, hills, barn, lettering, Texas star, water tower, train, singer), as a fallback for when Chris's painting is missing.
- **Main pieces:** `makeTextures` (L446), `rnd` (L449), `slot` (L459–464), `LOOKS` (L465–472), `sign` (L474–492), `mural` (L496–538), returned API (L539–540).
- **Size:** about 100 lines (the mural is about 45 of them).
- **Depends on:** three.js `CanvasTexture`.
- **Tangled with content:** `slot`/`sign` are clean. `mural` is pure content.
- **Fingerprint:** Park-Miller LCG with seed 1234. Sign scale 180 px/m, capped at 1024×512. 4 px padding between slots. Anisotropy up to 8.

#### 12. Ground: the flat map that becomes terrain — rendering / effects
- **Does:**
  - Builds a 4 m grid mesh covering the painting plus 260 m around it. Each vertex stores its terrain normal and height (`gh`), and rises from flat to `heightAt` as the wave passes.
  - Flat, the fragment shader shows the painting with a 3.5 m white paper border on a procedural wood-table colour with a soft shadow. This is drawn as emissive, so lighting doesn't touch it.
  - Popped up, it shows Chris's painted grass and gravel, each sampled at two scales and mixed with noise so no repeat shows, and tinted by the low-resolution painting.
  - A "kinds" canvas is baked at load from the traced polygons: R = gravel, G = water edge, B = shade. Shade comes from ellipses offset from each tree and convex hulls of each building's footprint extruded away from the sun.
- **Main pieces:** `SUNDIR`/`SHADOW`/`LONG` (L1365–1366), kinds canvas (L1369–1397), textures (L1398–1402), `ground` mesh and shader (L1406–1462).
- **Size:** about 95 lines.
- **Depends on:** Paper engine GLSL, `FARM_PAINT`, `FARM.buildings`, `PAPER_ART.ground`, map and tint images.
- **Tangled with content:** needs some untangling. The technique is generic, but it reads farm data directly.
- **Fingerprint:**
  - No shadow maps: shade is painted into a canvas with `blur()` filters and shaded cool blue `(0.5, 0.52, 0.78)`.
  - Kinds canvas is 1024 px wide. Grid step `GS = 4` m.
  - Fog 110–430 m, shifted by the camera's orbit distance.

#### 13. Water, sky dome and light — rendering / effects
- **Does:**
  - **Water:** pond shapes are `ShapeGeometry` with a patched basic material. They are hidden until the wave arrives, ripple with two noise octaves, add a Fresnel sky reflection, and show foam at noise peaks.
  - **Sky:** a 900 m back-faced sphere wraps Chris's painted sky strip around the horizon `round` times, up to `up` radians, blending to a top colour and a haze below, with a very slow drift.
  - **Light:** a soft hemisphere light plus a weak directional sun, from `FARM.sun`.
- **Main pieces:** `waterMat` and `waters` (L1465–1485), `skyMat` and `sky` (L1489–1507), `hemi`/`sun` (L1510–1512), `update(t, cam)` (L1562–1565).
- **Size:** about 50 lines.
- **Depends on:** Paper engine GLSL, `PAPER_ART.sky`.
- **Tangled with content:** clean.
- **Fingerprint:**
  - Water Fresnel `pow(1−vd.y, 3)·0.6`, foam above 0.78.
  - Sky drift `uT·0.0004`; `round = 3`, `up = 1.0472` (from the data).
  - Hemisphere light 0.74, sun 0.42; sun heading 200°, elevation 38°.

#### 14. Critters: wandering cows and a turning walker — enemy/ambient AI / animation
- **Does:**
  - **Cows:** a side card, front and back cards, and a separate grazing card. Every 7–17 s a cow picks a random goal within 5 m of home, turns toward it (turn rate `dt·1.2`), walks at 0.6 m/s only when facing within 0.6 rad of it, rocks as she walks, then grazes with probability 0.7.
  - **Walker:** a set of view cards (front, side, step, back). Each frame `stride()` shows the view matching the camera angle (dot product above 0.7 = front, below −0.7 = back, otherwise side, alternating with step while walking), flips the side view by mirroring, and bobs it.
  - In `tick`, both scale with `popAt` so they pop up with the farm.
- **Main pieces:** `makeCritters` (L1580), `view` (L1584–1591), `cow` (L1595–1606), `walker` (L1609–1615), `update` (L1618–1639), `stride` (L1642–1655). Pop scaling in game.js L2073–2078.
- **Size:** about 85 lines.
- **Depends on:** three.js, `PAPER_ART.things` (`cow-*`, `walker-*`), `heightAt`.
- **Tangled with content:** clean. A generic "multi-view billboard impostor" and "wander near home" AI.
- **Fingerprint:** uses `Math.random`. Stride rate `speed·3.2`. Walker height 1.75 m. Cow length 2.3 m. Views: 4 for the walker (front/side/step/back), 4 for the cow (side/graze/front/back).

#### 15. Camera rig — camera
- **Does:**
  - `orbitPose` places the camera from target, yaw, elevation, fov and a "visible height" `hv`, solving the distance as `hv/2/tan(fov/2)`.
  - **Flat map:** fov 1° from about 90° elevation (nearly orthographic). The painting fits the screen, rotated −90° when the phone is upright.
  - **Drone:** elevation 0.95, fov 46°, hv 26.
  - **Walk views:** first-person eyes at 1.55 m, or over the shoulder 4.4 m back. The shoulder camera is pulled in, in 0.2 m steps, when a building box is in the way.
  - Poses are blended linearly, with fov interpolated in log space. Near and far planes and fog follow the orbit distance.
- **Main pieces:** `orbitPose` (L1729–1732), `portrait` (L1733), `flatParams` (L1734–1739), `droneParams` (L1740), `lerpParams` (L1741), `vfov` (L1742), `viewPose` (L1744–1759), `blend` (L1760–1763), `applyPose` (L1765–1771).
- **Size:** about 45 lines.
- **Depends on:** player, building colliders that have `h`, `heightAt`.
- **Tangled with content:** clean.
- **Fingerprint:**
  - No smoothing while walking: the pose is set directly each tick.
  - Vertical fov 74° upright, 56° sideways.
  - Shoulder camera height `1.35 + back·(0.5 − 0.8·pitch)`.
  - Near plane `max(0.08, dist·0.02)`.

#### 16. Pop-up and fold sequences — transitions
- **Does:**
  - `popUp()` starts the wave at the player, tweens the camera from the flat map to the drone (2.4 s), then blends into the walk view (1.1 s), and shows a first-time hint toast (touch or keyboard wording).
  - `foldDown()` blends to the drone (0.6 s), starts the fold wave at the player, and tweens out to the flat map (1.9 s).
  - A JS copy of `popK`/`arrive`/`popAt` lets CPU-side objects (cows, walker) follow the GPU wave.
- **Main pieces:** state variables (L1779–1780), JS `popK`/`arrive`/`popAt` (L1781–1787), `popUp` (L1788–1798), `foldDown` (L1799–1808).
- **Size:** about 30 lines.
- **Depends on:** Paper engine `POP` uniforms, camera rig, tweens, HUD.
- **Tangled with content:** clean.
- **Fingerprint:** easing `t²(3−2t)`. Durations 2.4 + 1.1 s up and 0.6 + 1.9 s down. Yaw is unwrapped with `wrap()` so it takes the short way.

#### 17. Scavenger hunt — quests / progression
- **Does:**
  - The current target is the one picked from the list, otherwise the first unfound item in hunt order.
  - `findable()` returns the nearest unfound item that is within its `reach` (default 6 m), in front of you (cos ≥ 0.5 when more than 1.4 m away), and on the side its target faces (normal check > −0.3). The current item wins ties with a −100 score bonus.
  - `foundIt` marks the item found, saves, and shows a postcard.
  - A "Hot/Warm/Cold" badge shows the distance to the current target. The Look button pulses when something is findable.
  - When all twelve are found, a final card appears.
- **Main pieces:** `item`/`current`/`where` (L1812–1814), `findable` (L1816–1830), `foundIt` (L1863–1868), `closeCard` completion (L1879–1887), `heat` (L1927–1932), Look pulse (L2080), `lookHere` (L2032).
- **Size:** about 50 lines.
- **Depends on:** world `targets` (from buildings and nature), save, postcards, HUD.
- **Tangled with content:** clean logic driven by the `FARM.hunt` data (target strings, reach, card).
- **Fingerprint:**
  - Hot under 18 m, warm under 50 m, otherwise cold.
  - Targets are `{p:[x,y,z], n:[nx,0,nz]|null}`, keyed `sign:` / `spot:` / `mural:` / `building:` / `prop:`.
  - 12 items, in a fixed order.

#### 18. Postcards and snapshots — UI / rendering
- **Does:** Each find shows a postcard sheet with Chris's painting (`CARDS[it.card]`). Without a card, `snapshot()` would place the camera a few meters back from the target (walking round free-standing things to find a clear side), render the scene to a 640×360 canvas, and return a JPEG data URL. The list shows found items with their picture, and a "Find this" button for unfound ones that sets the pick.
- **Main pieces:** `FRAME` (L1832), `snapshot` (L1833–1862), `showCard` (L1869–1878), `closeCard` (L1879–1887), `showList`/`hideList` (L1888–1904).
- **Size:** about 70 lines.
- **Depends on:** renderer, camera, `world.blocked`, DOM sheets.
- **Tangled with content:** needs some untangling. `FRAME` hard-codes item IDs.
- **Fingerprint:** snapshot at 640×360, JPEG quality 0.82, fov 52°, 12 tries around the target at 30° apart. Postcards are rotated −1.4° in CSS with a "FOUND" seal.

#### 19. HUD, sheets and toasts — menus / UI framework
- **Does:** `hud(mode)` shows or hides the DOM pieces for each mode (title, popping, walk, folding, map). `updateHud` fills the found count, the view name, the clue, and the map note. `toast` shows a message for a set time, using a CSS opacity transition. The state machine runs `loading → title → popping → walk ⇄ card/list`, and `walk → folding → map → popping`.
- **Main pieces:** `toast` (L1908), `hud` (L1909–1918), `updateHud` (L1919–1926), `toggleView` (L2034), `startHunt` (L2035).
- **Size:** about 30 lines, plus CSS and markup.
- **Depends on:** DOM IDs in L125–166.
- **Tangled with content:** needs some untangling. The strings and IDs are game-specific, but the pattern (one mode decides what is shown) is reusable.
- **Fingerprint:** DOM overlay only (no canvas UI). `prefers-reduced-motion` stops the Look button's pulse. Touch-only elements are chosen with `matchMedia('(pointer: coarse)')`.

#### 20. Map pins overlay — minimap
- **Does:** On the title and map screens, it projects 3D points to screen space and positions DOM pins:
  - building labels (skipping `check` guesses) plus 3 extra names;
  - a "you" arrow SVG rotated to the heading;
  - green tick stamps on found items;
  - a dashed red "go here" circle about 16 m across, centered off the true spot by a hash of the item ID, so it hints rather than pinpoints.
- **Main pieces:** `LABELS` (L1935), `pinEl` (L1937), `toScreen` (L1939), `updatePins` (L1940–1966).
- **Size:** about 35 lines.
- **Depends on:** camera, world labels and targets, hunt state.
- **Tangled with content:** clean except for the 3 hard-coded extra labels.
- **Fingerprint:** string hash `(a·31 + c) % 997` seeded with 7; offset ±6 × 0.9 m; minimum circle radius 28 px.

#### 21. Save and load — save
- **Does:** Loads JSON from localStorage at boot, keeping only found IDs that are still in the hunt. Saves `{found, view, pick}` after a find, a pick from the list, or a view change. Both read and write are wrapped in try/catch: in a private window, progress lasts only for that visit.
- **Main pieces:** `SAVE` (L1686), `saved`/`got`/`view`/`pick` (L1717–1719), `save` (L1721), `reset` hook (L2114).
- **Size:** about 8 lines.
- **Depends on:** `localStorage`, `FARM.hunt`.
- **Tangled with content:** clean.
- **Fingerprint:**
  - Storage: localStorage key `artfarm.v1`. The version lives only in the key, with no version field.
  - Format: JSON `{found: string[], view: 'eyes'|'walker', pick: string|null}`.
  - One slot; it autosaves.
  - Migration: unknown IDs are filtered out on load.
  - `saved.finished` is set in memory but never written.
  - Under Mooncart the slot would be the slug of the title, `art-farm` (by the `saveKeyFor` rule), but the game is not in `games.json`.

#### 22. Test hooks, reachability check and the phone check — tests / debug tools
- **Does:**
  - **In the page:** `window.ArtFarm` exposes `state`, `found`, `view` and `player`, plus `start`, `advance(s)` (the manual clock), `place`, `faceTo`, `look`, `closeCard`, `showList`/`hideList`, `openMap`, `walk`, `setView`, `pick`, `hold(key)`, `reset`, `targets`, and `info` (triangles, draw calls, timing).
  - `reachable()` flood-fills a 1 m grid from the start using `world.blocked(…, 0.32)`. For each target it finds a reachable cell within 0.8 × reach, more than 1.5 m away, and on the target's front side.
- **Main pieces:** `MANUAL` (L1671), `window.ArtFarm` (L2102–2139), `reachable` (L2117–2136), `info` (L2137).
- **Size:** about 40 lines in the page, plus `tools/check.mjs` (115 lines).
- **Depends on:** everything above.
- **Tangled with content:** clean.
- **Fingerprint:** `art-farm/tools/check.mjs` (Playwright Chromium on SwiftShader) does the following:
  - Opens `dist/art-farm.html?manual` on a 412×860 upright phone (touch, DPR 2) and blocks every http(s) request; any internet request counts as an error.
  - Checks that the game opens on the title, and that after the pop-up the state is `walk`.
  - Holds W for 2 s and checks the player moved more than 5 m.
  - Calls `reachable()` and `targets()`. For each of the 12 items it checks that the item has a position and a reachable spot, places the player there facing it, presses `look()`, and checks it found that item.
  - Checks that all 12 are found, then shoots several views, the list, and the map.
  - Checks that `openMap` leads to the `map` state and `walk()` back to `walk`.
  - Logs triangles and draw calls.
  - Opens an 860×412 sideways pass (unless `--quick`).
  - Writes screenshots to `art-farm/shots/`. Fails on any page error or console error or warning; otherwise ends with "all good".

  The other tools:
  - `build.mjs` inlines the scripts and `assets/*` pictures as data URIs into `dist/art-farm.html`, and also writes `art-farm.artifact.html` without the outer tags.
  - `sheet.mjs` makes a contact sheet from phone screenshots.
  - `paper-art.py` (offline) cuts Chris's paintings into the paper sheets: hero walls, tiling materials, cutouts, trees, ground.
  - `prepare-art.py` (offline) lines the aerial painting up with the Google Maps screenshots and writes `farm-map.webp`, `farm-tint.webp` and `src/farm-paint.js` (the traced drives, ponds and trees).
  - `aerial_frame.py` (offline) is the shared frame for lining up the screenshots.

#### 23. Misc utilities and random numbers — utilities / RNG
- **Does:**
  - Small helpers: `$`, `clamp`, `lerp`, `ease` (smoothstep), and `wrap` (angle into −π…π).
  - The hex-to-RGB helper `C`, defined three times (L650, L790, L1033).
  - Compass helpers `deg`/`dirOf`/`rotOf`.
  - Two Park-Miller LCGs, `seed = seed·16807 % 2147483647` (seed 1234 in textures, 77 in nature), so placement is fixed.
  - `Math.random` for the pop jitter (L640, L802) and for the cows.
- **Main pieces:** L1670–1676, L449, L1035, L1037–1039, L640.
- **Size:** about 20 lines.
- **Depends on:** nothing.
- **Tangled with content:** clean.
- **Fingerprint:** Park-Miller "minimal standard" LCG with multiplier 16807 and modulus 2³¹−1. `Math.random` is used where the result doesn't matter.

### Content
| What | Where | ~lines |
|---|---|---|
| Format docs for the farm data (units, axes, building schema) | L178–207 | 30 |
| Start point and sun | L211–212 | 2 |
| 20 buildings (footprints, facings, wall looks, roofs, doors, windows, spots, signs; `check` marks guesses) | L214–333 | 120 |
| Pavilion, (empty) tanks, 9 fences with gaps, 2 bed groups, 1 tree row, 1 creek | L335–357 | 23 |
| 26 props (pond, benches, picnic tables, tractor, bales, standees, wagon, wire donkey, garden sign, birdhouses, trough, pumpkins) | L358–375 | 18 |
| 3 cows | L377 | 1 |
| Hunt: 12 items, each with clue text, found text (real farm facts), target, reach and card | L383–420 | 38 |
| `FARM_PAINT`: traced gravel drives, islands, ponds, about 684 trees (generated by `prepare-art.py`) | L430 | 1 (17 KB) |
| `PAPER_ART`: atlas rects for 18 painted walls, 13 tiling materials, 10 cutouts, 9 tree cards, 41 "things", sky, ground; picture sheets as data URIs (generated by `paper-art.py`) | L437 | 1 (10 KB stripped) |
| Map and tint images; 14 postcard paintings (`CARDS`) | L1677–1685 | 9 (about 2.6 MB of base64) |
| 6 sign looks (colours, fonts) | L465–472 | 8 |
| Code-painted welcome mural (fallback art) | L496–538 | 43 |
| Snapshot framing distances per item | L1832 | 1 |
| Extra map labels (Community Garden, Pasture, Pond) | L1935 | 1 |
| UI strings: title, how-to, toasts, completion card | L141–144, L1797, L1885, L1923–1925, L2032–2034 | about 12 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Palette tokens (`--ink #2a1d17`, `--paper #f7f0de`, `--barn #a8352a`, `--gold #e7b541`, `--table #3b2a20` …); fonts Georgia serif for headings and `ui-rounded`/system for UI | L9–15 | 7 |
| Top bar (Map, n/12 found, Eyes/Walker), clue card with heat badge | L28–46, L130–137 | 27 |
| Thumb stick and round Look button (pulse animation, reduced-motion variant) | L47–61, L138–139 | 17 |
| Map pins: labels, "you" arrow, stamps, dashed area | L62–71 | 10 |
| Title card, "Start the hunt" and "Back to walking" buttons, map note | L72–84, L140–147 | 21 |
| Postcard and list sheets (rotated postcard, FOUND seal, list rows with thumbnails) | L85–108, L148–163 | 40 |
| Toast, loading screen ("Unfolding the map..."), landscape tweaks | L109–123, L164–165 | 17 |
| Paper look in GL: cream backs, white cut edges, gentle hemisphere and sun light, haze fog `#e6e2cc`, table clear colour `#3b2a20`, wood-table shader | L603, L691–694, L1431–1439, L1490, L1702, L1708 | about 10 |

### Shared-code clues
- **What the Map Forgot, verified:**
  - L549–550: `// The wave and the merged meshes are What the Map Forgot's (chriskizer91-ops/what_the_map_forgot, branch` / `// ccr-9c545e56-4m3vqr, wren-3d/src/farwick-3d.js: popK, popAt, geometry merged per material); the hinges are new.`
  - `stripped/what-the-map-forgot-3d/source/wren-3d/src/farwick-3d.js` L52 has the same `popK` GLSL string, and L46 the same `POP` uniform names (`uPop`, `uPopC`, `uPopV`, `uFold`, `uFoldC`). There, `uPopV` is 220 px/s; here it is 34 m/s.
  - WTMF's `popAt` (L76) is simpler: `popK(uPop − length/uPopV − j)·(1 − smoothstep(0, 0.45, …))`. Art Farm adds `arrive(d)`, which speeds the wave up with distance, plus the 0.55 fold factor and a 0.4 smoothstep.
  - The hinge rotation (`hRot`, `hA`/`hB`) is Art Farm's own, as the comment says.
- **Tools borrowed from WTMF:**
  - `tools/build.mjs` line 4: `// The same way as What the Map Forgot's wren-3d/tools/build.mjs (chriskizer91-ops/what_the_map_forgot).`
  - `tools/sheet.mjs` line 2: `// The same idea as What the Map Forgot's wren-3d/tools/sheet.mjs.`
- **Only the technique is borrowed, not content.** L182–183: `…what they look like comes from his photos and paintings. Nothing here comes from` / `// another game.`
- **v1 (`versions/v1-cel-shaded.html`, grep only):**
  - It has the same file split (`farm-layout.js`, `farm-paint.js`, `textures.js`, `buildings.js`, `nature.js`, `world.js`, `critters.js`, `game.js`), with an identical 17,423-char `FARM_PAINT` line (v1 L442).
  - It has the same `game.js` skeleton: save key `artfarm.v1` (v1 L1829), `orbitPose`, `popUp`/`foldDown`, `findable`, `snapshot`, `walk`, `tick`, the `Math.min(0.05…)` clamp, `window.ArtFarm` with `reachable()`, and the same JS `popK`/`arrive`/`popAt`.
  - It also has `heightAt`, `collide`, the ground and water `popAt` lines, and `makeCritters`.
  - What differs is that `paper.js` replaces v1's `builder.js` (`makeBuilder`, v1 L451–452: "Taken from What the Map Forgot … popK, popAt, the merged buckets, cel shading and the ink outline"), and v1's `uPopV` is 38 where the current file uses 34. v1 also turns shadows on after the pop (v1 L2200).
- **Common shader idioms:** sin-hash value noise `127.1, 311.7, 43758.5453` (L560, L1343) and interleaved gradient noise `52.9829189` (L744). These are standard snippets, not proof of copying.
- **Mooncart:** no mention in the page. The key choices (Enter, Escape, M, H, arrows) match Mooncart's mapping.

### Notes
- **Dead code paths:**
  - Building features with no data using them: `porch`, `lamps`, `panels`, `trim`, `walls.tint`, `french` doors (L866–953).
  - `FARM.tanks` (empty), `FARM.name`/`town` and `rows[].along` are never read.
  - `snapshot()` (L1833–1862) never runs: all 12 hunt items have a `card`, so the `FRAME` entries are leftovers.
  - The `farmhouse-front` postcard (L1683, about 154 KB of base64) is never used.
- **Duplicated logic:**
  - `popK`/`arrive`/`popAt` exist in GLSL (L563–574) and again in JS (L1781–1787), and must be kept in step by hand.
  - Value noise exists in GLSL (L560–562) and JS (L1343–1344).
  - The `C` colour helper is defined 3 times; the Park-Miller LCG twice.
- **Save:**
  - `saved.finished` is never written to storage (L1721 saves only `found`/`view`/`pick`).
  - Taken postcards (`shots`) are not saved, which doesn't matter while every item has a painted card.
  - There is no version field; `v1` is only in the key name.
- **Globals:** each source file defines one global function. `window.ArtFarm` is always exposed in production, including `reset()`, which wipes progress.
- **Pause:** no pause state; the world keeps ticking under the card and list.
- **Escape while walking:** not handled; it falls into `keys.add('escape')`, which is harmless.
- **Pop timing:** `Math.random` jitter (L640, L802) means each load times the pop differently. Placement is deterministic (LCG).
- **Size:** about 11 MB of the 11.5 MB file is base64 pictures (the tree sheet is about 2.2 MB and the things sheet about 2.1 MB in `PAPER_ART`; the map is about 0.7 MB).

---

## Starfall

**What it is:** A tiny catch-the-stars, dodge-the-rocks arcade game: the sample game bundled with Mooncart's browser version (demo page and `Mooncart.html`).
**Inventoried:** `building-with-assets-` @ `claude/zealous-cerf-p6pmrn` (`7422f97`), `samples/starfall.html`. Full size 8,679 bytes, stripped 8.5 KB (byte-identical; nothing to strip), 209 lines (`wc -l`). Line numbers refer to `game-systems/stripped/starfall/starfall.html`, which is the same as the real file.
**Tech:** 2D canvas with `fillRect` pixel plotting; one ES5 IIFE script; no libraries; WebAudio oscillators.

### Coverage
- **Read fully:** L1–209, all of it.
- **Context read:** `docs/how-it-works.md` L36–72 (save slots, browser version); `web/js/util.js` L59–70 (`slug`, `saveKeyFor`); `tools/build-demo.mjs` L55–66 (how samples get their `saveKey`); `web/__mooncart/helper.js` L23 (the `mc:<slot>:` prefix; one line only).
- **Skimmed:** none.
- **Skipped:** none.

### Code map
| Lines | Group | What | ~lines |
|---|---|---|---|
| L1–13 | presentation | head, CSS (full-screen canvas, `touch-action: none`), canvas | 13 |
| L14–18 | — | header comment (controls, Mooncart, saves) | 5 |
| L19–42 | systems | IIFE start; 160×120 integer-scaled canvas fit; `px` and `text` primitives | 24 |
| L44–46 | systems | best-score save | 3 |
| L48–54 | systems + content | starfield; state variables; `reset` | 7 |
| L56–69 | systems | `beep` synth | 14 |
| L71–79 | systems | state transitions: start, pause, resume, over | 9 |
| L81–104 | systems | keyboard, touch and mouse input; auto-pause on hidden | 24 |
| L106–133 | systems | update: movement, spawner and difficulty ramp, collision, scoring | 28 |
| L135–159 | presentation | code-drawn sprites: star, rock, cart, moon; overlay panel | 25 |
| L161–195 | presentation | draw: background, ground strip, things, HUD, title/pause/over screens | 35 |
| L197–209 | systems | rAF loop; closing tags | 13 |
| **Total** | | systems about 122, presentation about 73, header comment 5, blank separator lines 9 (content is inline in the systems) | **209** |

### Systems

#### 1. Game loop and state machine — game loop / timing
- **Does:** A `requestAnimationFrame` loop with variable dt capped at 0.05 s. It runs `update(dt)` then `draw(now)`. The states are `title → play ⇄ pause → over → play`. `update` does nothing outside `play`. The game pauses itself when the tab is hidden.
- **Main pieces:** state variables (L51–54), `start`/`pause`/`resume`/`over` (L71–79), `visibilitychange` (L104), `frame` (L197–205).
- **Size:** about 25 lines.
- **Depends on:** Audio (a beep on each transition), Save (in `over`).
- **Tangled with content:** clean.
- **Fingerprint:** rAF, variable timestep, `dt = Math.min(0.05, …)` (the same clamp as Art Farm). Paused by state, and automatically when the page is hidden.

#### 2. Integer-scaled pixel canvas — rendering
- **Does:** The canvas backing store is sized to the window × devicePixelRatio. The game's own pixels (160×120) are scaled by the largest whole number that fits, and the picture is centered with a letterbox. `px()` fills a scaled rectangle at rounded game coordinates. `text()` draws monospace text scaled by `z`.
- **Main pieces:** `W`/`H` (L21), `fit` (L24–31), resize listener (L32), `px` (L35), `text` (L36–42).
- **Size:** about 20 lines.
- **Depends on:** the canvas.
- **Tangled with content:** clean. A drop-in retro screen scaler.
- **Fingerprint:** internal resolution 160×120; integer scale `z = floor(min(cw/W, ch/H))` in device pixels; letterbox colour `#05040c`. There are no image sprites, so smoothing doesn't matter.

#### 3. Input: keys, touch halves, click — input
- **Does:** ArrowLeft and ArrowRight are held in `keys`. Enter, Space or z/Z starts the game (from title or game over) or resumes it. Escape, m/M or p/P toggles pause. A touch starts or resumes, and then holding the left or right half of the screen steers (`touchDir`, from `touches[0]` only). A mouse click only starts or resumes.
- **Main pieces:** `keys`/`touchDir` (L52), `keydown` (L81–90), `keyup` (L91), `touch` (L92–96), touch listeners (L97–102), `mousedown` (L103), direction combine (L109–110).
- **Size:** about 25 lines.
- **Depends on:** the state machine.
- **Tangled with content:** clean.
- **Fingerprint:**
  - Mooncart d-pad left/right = arrows, A = Enter (start/resume), B = Escape (pause), START = M (pause). SELECT = H is unused, and up/down are unused.
  - Touch scheme: left or right half of the screen (a two-zone virtual pad); touchstart also starts the game.
  - No `blur` handler, so a key released while the page is out of focus can stay held. Hiding the tab does pause the game.

#### 4. Falling objects: spawner, difficulty ramp, collision — gameplay / balance
- **Does:** The cart moves at 100 px/s and is clamped to [1, W−15]. A spawn timer drops a 5×5 star or rock at a random x. The rock chance and the fall speed rise with elapsed time, and the spawn gap shrinks. Collision is an axis-aligned box test against the cart's 14 px tray at y 101. A star scores (with a 0.18 s glow and a beep); a rock ends the run. Things below the screen are removed.
- **Main pieces:** `reset` (L53), `update` (L106–133).
- **Size:** about 30 lines.
- **Depends on:** Input, Audio, the state machine (`over`).
- **Tangled with content:** needs some untangling. The balance constants sit inline.
- **Fingerprint:**
  - Rock probability `min(0.42, 0.14 + time/140)`.
  - Spawn gap `max(0.26, 0.85 − time/80)` s, with the first spawn at 0.4 s.
  - Fall speed `26 + rand·16 + time·0.8` px/s.
  - Hit when `t.y+5 ≥ 101 && t.y ≤ 106 && t.x+5 ≥ cart.x && t.x ≤ cart.x+14`.
  - Score +1 per star. RNG is `Math.random`.

#### 5. Synth beeps — synthesized audio
- **Does:** Creates an `AudioContext` lazily on the first beep, which follows a user press. Each beep is one oscillator through a gain node, with an exponential fade to 0.0001 over `dur`. Errors are swallowed.
- **Main pieces:** `ac`/`beep` (L57–69). Calls at L71–73, L78 and L127.
- **Size:** about 14 lines.
- **Depends on:** WebAudio.
- **Tangled with content:** clean.
- **Fingerprint:**
  - Start: 660 Hz square, 0.12 s.
  - Pause: 330 Hz. Resume: 520 Hz.
  - Game over: 150 Hz sawtooth, 0.4 s.
  - Catch: `880 + (score%5)·110` Hz triangle, 0.09 s.
  - Default volume 0.05. No music, no volume setting.

#### 6. Best-score save — save
- **Does:** Reads `best` from localStorage at start. Writes it only when a run ends with a new best. Both are wrapped in try/catch, so the game works without storage.
- **Main pieces:** `best` and the read (L44–45), `keepBest` (L46), `over` (L76–77).
- **Size:** about 5 lines.
- **Depends on:** `localStorage`.
- **Tangled with content:** clean.
- **Fingerprint:**
  - localStorage key `best` (a generic name), holding the number as a string.
  - No version field, one value, no autosave beyond the new-best write.
  - Under Mooncart's browser version, the sample's save slot is the slug of its title, `starfall` (`tools/build-demo.mjs` L63). The helper files its localStorage under `mc:starfall:`, making the key `mc:starfall:best` (how-it-works L66–68, `helper.js` L23).
  - On Android every game gets its own origin `https://<slot>.mooncart.invalid/`. But the samples ship only with the browser builds, which have no built-in games.
  - Opened on its own, the bare `best` key could collide with any other page on the same origin.

#### 7. Code-drawn pixel sprites and starfield — rendering / presentation
- **Does:**
  - A star is a plus sign with a blinking colour.
  - A rock is a rounded 5×5 blob.
  - The cart has a tray, a glowing body after a catch, and wheels.
  - The moon is a crescent: the pixels of one disc that a shifted disc doesn't cover.
  - 46 background stars twinkle on `sin(now/700 + t)`.
  - `panel()` dims the screen behind the overlays.
- **Main pieces:** `sky` (L48–49), `star` (L135–138), `rock` (L139–141), `drawCart` (L142–149), `moon` (L151–158), `panel` (L159).
- **Size:** about 30 lines.
- **Depends on:** `px`.
- **Tangled with content:** this is the content (the art).
- **Fingerprint:** star blink `sin(now/120 + t) > 0`; crescent offset (+3, −2); palette `#15122d` sky, `#ffe680` gold, `#7a6cc4` cart.

#### 8. HUD and overlay screens — menus / UI
- **Does:** Draws the score and BEST in the top-left. Draws the title ("STARFALL", "A to start", "d-pad or touch to move"), PAUSED ("A to go on") and game over ("NEW BEST!" or "GAME OVER", the star count, "A to play again") screens over the dimmed playfield.
- **Main pieces:** `draw` (L161–195).
- **Size:** about 20 lines.
- **Depends on:** `text`, `panel`, the state.
- **Tangled with content:** needs some untangling. The strings are inline.
- **Fingerprint:** canvas text only, `ui-monospace` bold; the prompts use Mooncart button names (A, d-pad).

### Content
| What | Where | ~lines |
|---|---|---|
| Balance constants (speeds, spawn and rock ramps, tray size) | L111–117, L122 | 8 |
| Sprite shapes and palette | L135–158, L162–171 | 30 |
| Screen texts | L177–194 | 15 |
| Sound pitches | L71–78, L127 | 5 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Full-screen canvas CSS, `touch-action: none`, no text selection | L7–10 | 4 |
| Night palette (`#05040c` letterbox, `#15122d` sky, `#2a2350` ground, gold stars) | L159–171 | 13 |
| Monospace pixel-scaled text | L36–42 | 7 |

### Shared-code clues
- L15: `// Starfall: a small sample game for the Mooncart demo, one file like every Mooncart game.`
- L17–18: `// A (Enter) starts, B (Escape) or START (M) pauses. The best` / `// score is kept in localStorage, so it also shows Mooncart keeping each game's saves.`
- The `Math.min(0.05, (now - last) / 1000)` dt clamp (L199) is the same as Art Farm's (art-farm L2096). That is a weak clue, since it is a common idiom.
- No other repo or game is named.

### Notes
- It is a demonstration of the Mooncart contract: arrow, Enter, Escape and M keys, a per-game localStorage save, pause when hidden, and no network. It does not use SELECT (H).
- `keyup` sets `keys[e.key] = false` for every key, while only the arrows are ever set to true. Harmless.
- A mouse can start the game but not steer it; steering needs the arrow keys or touch.
- The save is a single unversioned number under a generic key, which relies on Mooncart's per-game slot to stay separate.
