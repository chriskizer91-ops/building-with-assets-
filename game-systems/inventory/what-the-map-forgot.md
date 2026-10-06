## What the Map Forgot

**What it is:** A story RPG in ten chapters. Wren, a lamplighter, lights lamps and charts maps against "the Blank". It has 16 px pixel-art characters over painted maps (or maps synthesized in code), tile-grid walking, side-view battles with timing rings, a stealth chapter, a lamp-defence "Vigil", and a Mode-7 airship flight with landings.
**Inventoried:** `what_the_map_forgot` @ `origin/claude/trusting-gauss-gbuygw` (`9369b13`), `what-the-map-forgot.html`. Full size 6,422,161 bytes; stripped 525 KB (537,469 bytes), 9,338 lines. Line numbers are lines of the stripped single file `game-systems/stripped/what-the-map-forgot/what-the-map-forgot.html`, which match the real file. Module names (`engine/x.js`, `data/x.js`) are the repo's `source/src/` files. The build puts each one behind a `/* ==== MODULE: name ==== */` marker.
**Tech:** 2D canvas only (no WebGL). The game draws in 240×160 game pixels on a backing store k = 2–4 device pixels per game pixel. Paintings are WebP data URIs (stripped in the copy). ES-module-style source files are concatenated into one classic `<script>` (`'use strict'`). Everything hangs off one global `window.G`, and assets register by name in `G.reg`. There are no outside libraries. Repo tools use Node and Playwright.

### Coverage
- **Read fully:** L1–L104 (CSS, the handheld HTML, the screen-fit script). L105–L4054 (every engine module: core, gfx, input, audio, world, art, field, ui, script, battle, main, journal, vigil, sky, ending, debug, plus data/palette, data/art structure, data/artfix, data/font). Also data/grounds.js L4055–L4173, data/maps/farwick.js L4756–L4839, data/battle.js L5078–L5207, data/music.js L5208–L5283 and boot L9332–L9338. Repo tool `source/tools/check.js` (all 284 lines) and `README.md` (64 lines).
- **Read in part:** props.js L4503–L4560 (house) and L4642–L4666 (lamp). ch1 story L4845–L4880. data/ch6.js helpers L7843–L7866. data/ch7.js L8026–L8135 (world sites, airship thing). data/ch8.js L8430–L8440. data/finale.js L8730–L8830 (Heart map factory) and L8898–L8912 (final boss). data/story/finale.js and journal L9058–L9086. town gear table L5976–L5992. sprites.js header L4174–L4189.
- **Skimmed:** the other chapter asset modules (road, town, tower, lumen, ch6–ch8, finale). For these I read only their headers and the ids they register, counted with grep. Map modules: only their sizes. Story scripts: counted, plus a few samples.
- **Skipped:** sprite pixel grids (most of L4183–L4502), most dialogue lines, most map grids, the long line L8609 (margins layer patch, 2,138 chars), and the base64 paintings (already stripped). Of the repo tools other than check.js I read only the header comments: build, unbundle, export-reference, image-requests, import-art, register, shift-shell and refresh.

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| L1–L104 (shell.html) | presentation | Page CSS, handheld HTML (d-pad, A/B, Menu), screen-fit script | 104 |
| L106–L203 engine/core.js | systems | Registry `G.def/get`, utilities, hash/noise, game-clock waits/tweens | 98 |
| L204–L420 data/palette, art, artfix, font | content | Named palette, map ink colours, painting table and object checks, art corrections, font bands | 217 |
| L421–L668 engine/gfx.js | systems | Sprite baker, bitmap font and text, pencilize, pixel lines, panels, cursor, particles | 248 |
| L669–L745 engine/input.js | systems | Keyboard, d-pad, buttons, tap mapped onto virtual buttons | 77 |
| L746–L942 engine/audio.js | systems | WebAudio chiptune sequencer and SFX | 197 |
| L943–L1197 engine/world.js | systems | Map loader, layers, collision index, ground synthesis, Blank edge, lighting | 255 |
| L1198–L1745 engine/art.js | systems | Painted-map overlay: decoding, variant choice, occluders, alignment check, faded/Blank overlay | 548 |
| L1746–L2167 engine/field.js | systems | Walking mode: grid movement, followers, NPC wander/patrol/vision, roamers, BFS tap-to-walk, camera, render | 422 |
| L2168–L2532 engine/ui.js | systems | Modal stack, dialogue, choices, name entry, card, book menu with map, list picker, items, gear, shop, HUD | 365 |
| L2533–L2683 engine/script.js | systems | Async story-command interpreter (49 commands), conditions | 151 |
| L2684–L3202 engine/battle.js | systems | Party, stats and XP; battle with CT turn order, timing rings, foe AI; drawing | 519 |
| L3203–L3466 engine/main.js | systems | Save/load (localStorage + claude.ai db), title screen, main loop, reset/new/load | 264 |
| L3467–L3599 engine/journal.js | systems | Objectives from flags, toast, recap page, journal screen | 133 |
| L3600–L3664 engine/vigil.js | systems | Lamp-defence mode | 65 |
| L3665–L3838 engine/sky.js | systems | Mode-7 airship flight, billboards, landing | 174 |
| L3839–L3919 engine/ending.js | systems | Explored-ink map drawer, epilogue pages, credits | 81 |
| L3920–L4054 engine/debug.js | systems | `?debug` keys: collision overlay, painting nudges, state jumps, test battle | 135 |
| L4055–L4173 data/grounds.js | content | 10 ground types as per-pixel colour functions | 119 |
| L4174–L4502 data/sprites.js | content | Letter-grid sprites (heroes, townsfolk, lamp) | 329 |
| L4503–L4755 data/props.js | content | Map objects drawn in code (house, tree, lamp, lighthouse, etc.) | 253 |
| L5078–L5283 data/battle.js, music.js | content | Ch1 heroes, skills, foes, scribble foe art, backdrop; songs; SFX table | 206 |
| L5284–L9073 chapter asset modules (road, town, tower, lumen, ch6, ch7, ch8, finale) | content (+small logic) | Per-chapter things, foes, foe art, backdrops, songs, gear, `G.fn` helpers, world map, Heart map factory | 1,760 |
| maps/*.js (8 files, within L4756–L8610) | content | Text-grid maps, things, NPCs, events, layers | 892 |
| story/*.js (9 files, within L4840–L9073) | content | ~145 story scripts as command lists | 1,460 |
| L9074–L9331 data/journal.js | content | 10 chapter titles, 37 goals | 258 |
| L9332–L9338 boot | systems | `G.Main.init()` | 7 |
| **Totals** | | Engine/systems ≈ 3,740 · content ≈ 5,490 · shell ≈ 105 | **9,338** |

### Systems

#### Registry and core utilities — infrastructure
- **Does:** One global `G` holds every asset, registered by kind and id. `get` throws on a missing id and `def` warns on a redefinition, so assets are only ever looked up by name. Also holds shared helpers: clamp/lerp/ease, colour lookup by palette name, offscreen canvas creation, `{name}` text fill, direction tables.
- **Main pieces:** `G` (L113–L122), `G.def` (L124), `G.get/has/all` (L131–L137), `G.U` (L139–L184), `G.U.hash` (L142), `G.U.noise` (L148), `G.U.fill` (L181).
- **Size:** ~80 lines (L106–L184).
- **Depends on:** `G.PAL` for colours, `G.names`/`G.vars` for fill.
- **Tangled with content:** clean.
- **Fingerprint:** Kinds used: sprite, ground, thing, map, mapfactory, script, battle, battlebg, foe, foeart, move, hero, skill, item, gear, song, sfx, world, start, goal, chapter. `G.W=240, G.H=160, G.T=16`. Hash: `Math.imul(x,374761393) ^ Math.imul(y,668265263) ^ Math.imul(s+1,1442695041)`, then `Math.imul(h^(h>>>13),1274126177)`, `h^=h>>>16`, `/2^32`. Value noise is a smoothstep bilinear blend of hashed lattice points.

#### Random numbers — RNG
- **Does:** Gameplay randomness uses `Math.random` directly (31 call sites). Everything procedural (grounds, the Blank's edge, the title art, the world texture, scribble jitter) uses the deterministic `G.U.hash`/`G.U.noise` of (x, y, seed).
- **Main pieces:** `G.U.pick` (L180), damage variance (L2915, L2977), turn-order start (L2768), foe targeting (L2968), wander/roam timers (L1936–L1973), vigil spawns (L3627), particles.
- **Size:** spread out; ~10 lines of helpers.
- **Depends on:** nothing.
- **Tangled with content:** clean.
- **Fingerprint:** No seedable PRNG and no seed in the save. Hash seeds are small integers per use (e.g. ground warp uses seeds 7 and 13, Blank flecks 50+L).

#### Game-clock waits and tweens — timing
- **Does:** Promise helpers that run on the game clock `G.t`: wait N ms, wait until a predicate is true, and tween object fields with an easing. `G.tick` runs them each frame. Scripts and battles `await` these.
- **Main pieces:** `G.wait/until/tween` (L188–L194), `G.tick` (L195–L203), `G.U.ease/easeOut` (L176–L177).
- **Size:** ~18 lines.
- **Depends on:** the main loop advancing `G.t`.
- **Tangled with content:** clean.
- **Fingerprint:** A tween stores `{o, from, to, t0, d, ease, res}`. The comment says they "pause when the game pauses", but `G.t` always advances in `step` (L3397), so there is no pause state.

#### Main loop, scenes and screen effects — game loop
- **Does:** Decodes all paintings, then starts a requestAnimationFrame loop. Each frame updates input, audio scheduling and tweens. The top modal UI layer gets update first; otherwise the scene updates with an `input` flag that is false while a modal is open or a script is running. Then it draws: scene, debug, HUD, fades, UI stack, toast, flash, script error. Scenes are plain objects with `update/render` (Field, Battle, Title, Sky).
- **Main pieces:** `G.Main.init` (L3352–L3377), `step` (L3396–L3423), `snapshot` (L3425), `reset/newGame/load/toTitle` (L3427–L3465).
- **Size:** ~115 lines.
- **Depends on:** every engine system.
- **Tangled with content:** needs some untangling. `newGame` reads `G.get('start','game')`, and `init` wires lamp counters into `G.vars` (L3361).
- **Fingerprint:** rAF loop with a variable timestep and `dt = min(0.05, …)`. No pause. When the tab is hidden it autosaves (L3376). Screen shake is a random translate of ±`shakeMag` px. `G.fade` is a dark overlay `rgba(14,13,24,a)` and `white` is a paper overlay. Errors from scripts are drawn on screen.

#### Display fit and resolution scaling — rendering
- **Does:** CSS sizes the 240×160 canvas: whole-number scale when it is 2× or more, smooth below that, with separate portrait and landscape layouts. The backing store holds k device pixels per game pixel (k = round(css px × devicePixelRatio / 240), clamped 2–4, `?scale=N` up to 8). Paintings keep their detail while everything is drawn in game coordinates through `setTransform(k…)`.
- **Main pieces:** fit IIFE (L85–L103), `fitBacking` (L3382–L3389), CSS `#screen{image-rendering:pixelated}` (L37).
- **Size:** ~35 lines.
- **Depends on:** the DOM (`#screen`, `#console`).
- **Tangled with content:** clean.
- **Fingerprint:** Internal 240×160. Landscape breakpoint `(orientation: landscape) and (max-height: 560px)`. ResizeObserver re-fits.

#### Input — input
- **Does:** Keyboard, the on-screen d-pad (slide between directions), the A/B/Menu buttons and taps on the screen all feed virtual buttons `up/down/left/right/a/b/menu`. Each button has held, pressed-this-frame and auto-repeat state. It also collects typed characters for name entry.
- **Main pieces:** `G.I.keys` (L677–L680), `set/update/rep/ok/endFrame` (L681–L697), `bind` (L702–L744).
- **Size:** ~75 lines.
- **Depends on:** DOM ids `dpad`, `btnA`, `btnB`, `btnMenu`, `G.A.unlock`.
- **Tangled with content:** clean.
- **Fingerprint:** Arrows/WASD move. Z, Enter and Space are A. X, Escape, Backspace and ShiftLeft are B. M, C and Tab are Menu. Hold B to run. Auto-repeat waits 0.34 s, then repeats every 0.11 s. The d-pad dead zone is 12% of its width. A tap is converted to game coordinates (`G.I.tap`). Mooncart keys: arrows, Enter=A, Escape=B and M=START all work. H=SELECT is not mapped (H is a `?debug` key).

#### Pixel sprites from letter grids — rendering / animation
- **Does:** Sprites are text grids where each letter is a palette key. A frame can copy another frame (`from`), mirror it (`flip`), shift it, or replace some rows. A sprite can be `like` a parent and change only colours or a few frames. Frames are baked once to canvases. Solid-colour tint silhouettes are cached for hit flashes.
- **Main pieces:** `G.Spr.shape/get/rowsOf/bake/frame/tint` (L427–L497), `G.draw` (L498).
- **Size:** ~75 lines.
- **Depends on:** `G.U.rgb`, `G.PAL`.
- **Tangled with content:** clean.
- **Fingerprint:** Default 16×16; `.` is transparent. Frames are `down/up/right`, with `left` = right flipped, and step frames `dir1/dir2` (L2151). Frame-loop guard depth is 10.

#### Bitmap font and text layout — text
- **Does:** A 9-px-tall bitmap font is defined as readable `#`/`.` bands, one glyph column per character. Glyphs are cached per colour. Draws text with alignment, outline, shadow, integer scale and a character cap. Word-wraps by pixel width.
- **Main pieces:** `G.Font.init/glyph/width/wrap` (L507–L552), `G.text` (L554–L574), `G.FONT` data (L337–L420).
- **Size:** ~70 lines of code plus 85 of data.
- **Depends on:** canvas.
- **Tangled with content:** clean.
- **Fingerprint:** Height 9, baseline row 6, descenders on rows 7–8. 1 px letter spacing; space is 3 px wide. Covers A–Z, a–z, 0–9 and `.,!?'"-:;()/+=%&*<>_[]`.

#### Drawing primitives and UI chrome — rendering / UI
- **Does:** Bresenham 1 px lines, boxes with rounded corners, the standard ink panel with a paper rule, the blinking flame cursor, `pencilize` (recolours any canvas into 5 paper/pencil tones by luminance), and `G.scribble` (jittered polylines for drawn creatures).
- **Main pieces:** `G.pencilize` (L577), `G.pline` (L593), `G.box` (L605), `G.panel` (L615), `G.cursor` (L626), `G.scribble` (L2730).
- **Size:** ~60 lines.
- **Depends on:** `G.PAL`, `G.U.hash`.
- **Tangled with content:** clean (the colours are the game's palette names).
- **Fingerprint:** Panel fill `rgba(22,21,36,0.94)` with a `paper2` rule. `pline` is capped at 600 steps.

#### Particles — effects
- **Does:** A single array of particles. Each has position, velocity, gravity, drag, wobble, flicker, fade and size, drawn as 1–n px squares, and belongs to a named layer (`world`, `glow`, `battle`, `title`). `burst` scatters n particles with random angle and speed.
- **Main pieces:** `G.P.add/burst/update/draw/clear` (L636–L668).
- **Size:** ~33 lines.
- **Depends on:** `G.U`.
- **Tangled with content:** clean.
- **Fingerprint:** Not pooled. Capped at 600; the oldest is dropped with `shift()`. Alpha is `min(1, (1-age/life)*1.5)`.

#### Chiptune music and SFX synth — audio
- **Does:** WebAudio is unlocked on the first input. A song is data: bpm, a chord list (one chord per bar), a lead melody as `NOTE:sixteenths` tokens, arp/bass patterns that read each bar's chord, and drum tokens (k/s/h). It is compiled into a sorted event list and scheduled 0.25 s ahead each frame, looping. SFX are lists of `[wave, f0, f1, sec, vol, delay]` frequency sweeps.
- **Main pieces:** `G.A.unlock` (L753–L779), `compile` (L794–L835), `play/stop` (L836–L861), `tick` (L862–L879), `voice` (L880–L903), `drum` (L904–L920), `sfx` (L922–L941).
- **Size:** ~195 lines.
- **Depends on:** `G.get('song'|'sfx')`.
- **Tangled with content:** clean.
- **Fingerprint:** Gains: master 0.8, music 0.55, fx 0.7. Echo is a 0.33 s delay with feedback 0.28 and send 0.22. Pulse waves come from PeriodicWave with duty 12.5/25/50% and 40 harmonics. Noise is a 1 s buffer. Lead vibrato is a 5.5 Hz LFO at 0.6% depth. A song can be `like` another song. Only a Sound on/off toggle exists (L2355), and it is not saved.

#### Map loading, story layers and collision — maps and collision
- **Does:** A map is a text grid plus a legend that names a ground type per character. On load it builds a tile and solid grid and places things from `[type, x, y, opts]`, skipping those whose `if` condition fails. Layers (named story states: grid patches, things added, ids dropped) are applied when the flag `restored_<layer>` is set, at load or live with `applyLayer`. The index pass sets solid tiles from ground and things, and the "touch" tiles that run scripts. Maps stay cached once visited. `mapfactory` maps are built from code when entered.
- **Main pieces:** `G.World.get/load` (L954–L980), `tilesFromGrid` (L981), `patchGrid` (L988), `index` (L990–L997), `applyLayer` (L999–L1007), `place` (L1019–L1030), `drop` (L1018).
- **Size:** ~90 lines.
- **Depends on:** the ground, thing, map and mapfactory registries; `G.S.cond`; `G.Art.attach`; `G.exploredStore`.
- **Tangled with content:** clean. All the specifics come from data.
- **Fingerprint:** Collision is a tile grid at 16 px (`m.solid[y][x]`) built from `ground.solid` and each thing's `solid` tiles. `def.solidNow(th)` gives dynamic solids. Actors block tiles too (`Field.freeTile`). Thing ids default to `type@x,y`.

#### Procedural ground painter and the Blank's edge — procedural rendering
- **Does:** Each ground type supplies `px(x, y)`, a palette colour per map pixel. Borders between "warp" grounds are pushed around by value noise, so tiles meet organically. A second pass adds a soft shadow south of grounds that cast one, sea foam by distance to land, foam under piers, and sea sparkles. The Blank (graph paper) gets a BFS distance field out to 7 px. Three flicker layers of paper flecks are drawn over that band, plus a one-pixel-per-tile glow map.
- **Main pieces:** `G.World.buildGround` (L1033–L1080), `buildBlank` (L1083–L1123), `sketchPaper` (L1009); ground defs in data/grounds.js (L4061–L4173) and later chapter modules.
- **Size:** ~100 lines of engine plus ~120 of ground data.
- **Depends on:** `G.U.noise/hash`, `G.PAL`.
- **Tangled with content:** clean.
- **Fingerprint:** Warp amplitude A = 5.5 px, frequency 0.11, seeds 7 and 13. Cast shadows reach 4 px with factor 0.68 + 0.04·d. Foam forms within 1–3 px of land. Ground flags: `warp, solid, casts, sea, pier, fade, blank`. 23 ground types.

#### Lighting and day/night — effects
- **Does:** A screen-sized lightmap is filled with an ambient colour (night → dawn → day by `G.Light.night` 0..1, or a fixed dark ambient on maps marked dark). Lights are radial gradients and beams are triangles, both added on top, and the lightmap is multiplied over the scene. Pixel-art maps get stepped rings; painted maps get smooth falloff. Additive glows (windows, flames) are drawn afterwards. The Blank's glow map is sampled into the lightmap at night.
- **Main pieces:** `G.Light.ambient` (L1134), `glow` (L1144–L1155), `isDark` (L1156), `apply` (L1157–L1187), `beam` (L1188); lantern lights in the Field render (L2106–L2129).
- **Size:** ~70 lines.
- **Depends on:** the map, the camera, things' `lights`/`beams`/`glow`.
- **Tangled with content:** mostly clean. The player-lantern radius values are hard-coded in Field (L2113).
- **Fingerprint:** Colours: day `[255,255,255]`, night `[84,96,156]`, dawn `[236,170,150]`, dark `[20,20,36]`. Stepped stops at 0.3, 0.58 and 0.8 with alphas 1/0.72/0.42/0.16. Lamp flicker is `1 + sin(t·9+x)·0.03 + rand·0.04`. Night is tweened by the script commands `night` and `dawn` and is saved.

#### Painted-map overlay and alignment — rendering / asset loading
- **Does:** Decodes every painting before the title screen; one that fails falls back to the engine's art. For each map it picks the painting variant (`<map>__<layer>`) whose grid differs least from the current grid. "Scene" paintings hide the engine's sprites for objects they show. Each painted object gets an occluder cut out of the painting in the shape of its sprite, so walkers go behind it. Alignment uses a precomputed or live colour-correlation search that finds objects painted slightly off their spot. Story changes a painting doesn't show are drawn over it: the Blank as graph paper, faded ground as the painting drained to pencil, both with noise-warped, box-blurred edges, and anything else with the engine's own ground. It also builds a 4-px glow map and finer edge flecks.
- **Main pieces:** `G.Art.load` (L1227–L1249), `attach` (L1278–L1338), `patch` (L1343), `overlay` (L1368–L1452), `tileAt` (L1456), `lightOf` (L1470), `edgeFlakes` (L1500), `occluders` (L1581), `check` (L1604–L1642), `checked` (L1654), `paint/blit/drawGround/drawThing/glowThing` (L1670–L1744).
- **Size:** ~545 lines.
- **Depends on:** `G.ART` (data/art.js), `G.World` ground canvases, things' canvases.
- **Tangled with content:** needs some untangling. Lists of engine-drawn types (`ENGINE`, `UNIQUE`, L1218/L1222) name this game's things, and the house-window glow is special-cased (L1736).
- **Fingerprint:** Paintings are 32 px per tile (2× map pixels). Battle and title paintings are 960×640, the world 1280×1024 (per check.js). The alignment score is RGB Pearson correlation inside the sprite mask. The search covers ±32 px in steps of 2, then ±1, with a distance penalty of 0.004/px. An offset is used when best ≥ max(0.35, score+0.15). The precomputed table is `G.ART.checks[key][id] = [score, dx, dy, best]`. Corrections are `G.ART.fix[key] = {dx, dy, sx, sy}`.

#### Map objects ("things") — maps / art in code
- **Does:** A thing type defines `make(th, m)`, which draws its canvas once (cached by options) and pushes solid tiles, touch tiles (with script) and lights. Optional hooks are `draw`, `overlay`, `glow`, `ink` (its mark on the book map), `tick`, `solidNow`, `beams`. Things are depth-sorted with actors by `sortY`.
- **Main pieces:** `G.World.place` (L1019), the depth sort in `Field.render` (L2091–L2103); defs `house` (L4519), `lamp` (L4642–L4666), 41 types across data modules.
- **Size:** ~20 lines of engine; content ~1,000 lines spread over props and chapter modules.
- **Depends on:** `G.U.canvas`, `G.Spr`, `G.Light`, `G.flags`.
- **Tangled with content:** the contract is clean; the types themselves are content.
- **Fingerprint:** Spec `[type, x, y, {id, if, script, …}]`. The lamp: lit flag `lit_<id>`, light radius 62 with alpha 0.85 and flicker, plus a 30 px secondary light.

#### Field: grid walking, followers, NPCs and events — walking
- **Does:** Actors step tile to tile. `prog` advances by speed·dt, the pixel position is interpolated, and leftover progress carries into the next step. The player walks, runs while B is held, follows a path, or interacts with the faced tile (A). Followers trail in a snake chain. NPCs can wander within a radius of home or walk patrol waypoints. On arrival the game reveals ink and checks event rectangles (`once`, `checkpoint`, `warp`, `if`). Scripts can walk actors along direction lists.
- **Main pieces:** `G.Field.enter` (L1755–L1774), `add/addFollower` (L1775–L1788), `move` (L1798–L1814), `walk` (L1816), `interactAt` (L1853), `arrive` (L1902–L1918), `update` (L1920–L1984), `playerStep` (L1985–L2011), `drawActor/drawEmote` (L2142–L2166).
- **Size:** ~200 lines.
- **Depends on:** `G.World`, `G.S`, `G.UI`, `G.I`, `G.Vigil`, `G.Journal`, `G.P`.
- **Tangled with content:** needs some untangling. The player's sprite is hard-coded `'wren'` with `lantern: true` (L1758), followers are any hero with flag `<id>_joined` (L1768), and the 0.5 s journal poll lives here (L1980).
- **Fingerprint:** Speeds in tiles/s: walk 5.2, run (hold B) 8.5, tap path 6, NPC wander 3, patrol 2.2, roamer 2 (3.2 when chasing). 4 directions, no diagonals. Tapping a direction still takes one step (`dirTapped`). Grace period after entering or a battle: 1.5 s.

#### Tap-to-walk pathfinding — pathfinding
- **Does:** Breadth-first search over the 4-neighbour tile grid from the player to the tapped tile. If the tile is an NPC or a touchable thing, or is blocked, it searches for a tile next to it and then interacts on arrival. A ring marker shows where you tapped (red if there is no path).
- **Main pieces:** `findPath` (L1867–L1887), `tapTo` (L1888–L1900), the marker in render (L2131–L2139).
- **Size:** ~40 lines.
- **Depends on:** `Field.freeTile`.
- **Tangled with content:** clean.
- **Fingerprint:** BFS with an Int32Array `prev`; the `adjacent` goal means Manhattan distance 1; no diagonal moves.

#### Camera — camera
- **Does:** Centres on the player's tile pixel position plus 8, clamped to the map's edges. When a script sets `camFocus` (the `cam` and `camback` commands), it eases toward the focus.
- **Main pieces:** `snapCam/updateCam` (L2050–L2059), script `cam/camback` (L2643–L2644).
- **Size:** ~12 lines.
- **Depends on:** Field.
- **Tangled with content:** clean.
- **Fingerprint:** Hard follow with no dead zone. Smoothing `k = min(1, dt·4)` only while a script has focus. Clamped to `[0, map px − 240/160]`.

#### Exploration ink (fog of war) and sketch reveal — exploration / minimap
- **Does:** Each map keeps a byte per tile for "explored". Arriving on a tile marks a radius around the player (5, or 3 on sketch maps). Sketch maps draw bare graph paper and fade each tile in over 0.7 s with a pencil-scratch sound. Explored data persists in the save as '0'/'1' strings per map and drives the book map's "Charted %" and the ending.
- **Main pieces:** `revealAround` (L1827–L1838), `drawSketch` (L1840–L1851), `G.fn.exploredOf` (L3844), `G.fn.uncache` (L7844, in data/ch6.js).
- **Size:** ~35 lines.
- **Depends on:** `G.exploredStore`, Save.
- **Tangled with content:** needs some untangling. `uncache` lives in a chapter data file but the engine calls it (sky.js L3744, debug.js L3995).
- **Fingerprint:** Reveal is a disc with `i²+j² ≤ r²+1`. Saved as `explored: {mapId: "0101…"}`.

#### Warden stealth (patrol and vision cone) — enemy AI
- **Does:** NPCs with `patrol` walk waypoints, pausing at each. NPCs with `watch` see the player inside a range and field-of-view cone, with line of sight ray-marched against solid tiles. Being seen plays a "Halt!" scene, fades, and returns the party to the last checkpoint event (or the map's checkpoint). Wardens carry a lantern light and a visible beam.
- **Main pieces:** patrol update (L1943–L1957), `sees` (L2013–L2025), `caught` (L2026–L2037), `resetWatch` (L2038), beams (L2114–L2117).
- **Size:** ~45 lines.
- **Depends on:** Field, Script, Light.
- **Tangled with content:** needs some untangling. The caught dialogue ("Warden", three lines) is hard-coded (L2031).
- **Fingerprint:** Default range 4.5 tiles, fov 0.5 rad, LOS step 0.25 tile, always seen within 0.6 tile. Patrol pause 1.4 s (`npc.pause`).

#### Roaming field enemies — enemy AI / encounters
- **Does:** Visible "scrawler" enemies drift randomly within a radius of their spawn point. Within sight distance (Manhattan) they chase, moving along the larger axis first. On contact (distance ≤ 1) they start their battle; beating one sets `beat_<id>` so it never returns.
- **Main pieces:** roamer spawn (L1763–L1766), roamer update (L1960–L1978), `encounter` (L2045–L2049).
- **Size:** ~25 lines.
- **Depends on:** Field, Script `battle`, `foeart` for drawing (L2143–L2147).
- **Tangled with content:** clean.
- **Fingerprint:** Sight 4 and radius 3 by default. Chase re-plans every 0.05 s; wander every 0.8–2.4 s. No random encounters: every enemy is visible.

#### Modal UI stack, dialogue and menus — UI / dialogue
- **Does:** A stack of layers, each with `update/render/close`. `push` returns a Promise that resolves with the closing value, so menus are awaited. Built on it: a paged typewriter dialogue box (top or bottom depending on where the player stands), a choice list, a name-entry grid with typing, a fading title card, the "book" pause menu (explored map on the left page; party, gold, lamps and options on the right), a scrolling picker with a help panel, a toast banner, a recap page and a journal list.
- **Main pieces:** `G.UI.push/update/render` (L2173–L2180), `say` (L2183–L2224), `choose` (L2227), `nameEntry` (L2249–L2306), `card` (L2309), `openBook` (L2331–L2423), `pick` (L2426–L2461), `hud` (L2525), `toast/drawToast` (L3510–L3520), `recap` (L3523), `journal` (L3549).
- **Size:** ~400 lines.
- **Depends on:** Font, panel, cursor, input, audio, Party, Journal.
- **Tangled with content:** needs some untangling. The book's title ("Wren's route card" / "{mira}'s book"), "Lamps lit N of 6", the HUD's "n / 6" and the currency word "marks" are hard-coded (L2365, L2384–L2385, L2530).
- **Fingerprint:** Dialogue: 3 lines a page, width 240−26, 52 chars/s, a blip every 3 chars, box height 44. Picker shows 7 rows. Name entry: up to 8 characters, letters + `-`, Aa/Del/Done. Toast lasts 4.5 s. Taps are hit-tested per row.

#### Items, gear, shops and inn — inventory / economy
- **Does:** Items and gear are counts keyed by id (`G.items`, `G.gear`) with one currency `G.gold` ("marks"). From the menu, healing items can be used on a party member and key items described. Gear has two slots per hero (`weapon` shown as "Tool", and `charm`), optionally limited to certain heroes, and adds flat stats. A shop buys from a stock list. The inn charges, heals, fades and saves.
- **Main pieces:** `itemsMenu` (L2462–L2483), `gearMenu` (L2484–L2505), `shop` (L2506–L2522), `G.gearText` (L2172), script `inn/gold/item/shop` (L2629–L2647), `Party.stat` (L2695).
- **Size:** ~75 lines.
- **Depends on:** UI picker, Party, item and gear registries.
- **Tangled with content:** clean.
- **Fingerprint:** Item fields `heal, mp, revive (fraction), key, price`. Gear fields `slot, who[], atk/def/mag/spd/mhp/mmp, price`. No selling and no inventory limit.

#### Story script interpreter — quests / cutscenes
- **Does:** Story events are arrays of `[command, …args]` (or JS functions), run in order with `await`. `busy` blocks field input while one runs. Conditions are a flag name, `!flag`, an array (AND), or a function. 49 commands cover dialogue, movement, camera, flags, branching, choices, fades and shakes, music and sfx, battles, joining, shops, inns, story layers, saving, map changes and night/dawn. Story files can register named helpers in `G.fn` and call them.
- **Main pieces:** `G.S.cond` (L2541), `run/exec` (L2552–L2568), `cmd` table (L2574–L2681), `G.fn` (L2683).
- **Size:** ~150 lines.
- **Depends on:** Field, UI, Battle, Audio, World, Save, Light.
- **Tangled with content:** mostly clean (the comment says "the engine never knows the story"). Only `lamp`, `lampCount`, `edge` and `calm` are this game's own mechanics.
- **Fingerprint:** Flags live in `G.flags` with prefixes `lit_`, `restored_`, `beat_`, `ev_`, `<hero>_joined`, `vigil_pct`, `vigil_m<k>`. `goto` fades 380 ms. Walk strings use `UDLR`. A command returning `'stop'` ends the list. Script errors are caught and shown on screen.

#### Party, stats and leveling — stats
- **Does:** Hero state is built from a hero definition (base stats, skills, per-level growth, skills learned at given levels). Effective stats add equipped gear. A hero who joins later is levelled to the party's average level. XP gain loops level-ups, refills HP/MP, and reports level and skill messages.
- **Main pieces:** `G.Party.make` (L2690), `stat` (L2695), `join` (L2700–L2710), `need` (L2712), `gain` (L2713–L2726).
- **Size:** ~40 lines.
- **Depends on:** hero, gear and skill registries.
- **Tangled with content:** clean.
- **Fingerprint:** Stats are `hp/mhp, mp/mmp (renamed per hero: Oil, Ink, Grit), atk, def, mag, spd`, plus `lv` and `exp`. XP to the next level is `12 × lv²`, and exp resets each level. Growth per level is a flat `grow{hp,mp,atk,def,mag,spd}`. Wren starts at 38/10/7/3/6/10 and grows +7/2/2/1/1/1.

#### Battle — battle
- **Does:** Side-view battle with heroes on the right and foes on the left. Turn order works by charge time: the lowest `ct` acts, then adds `100/spd`. Guard multiplies the next wait by 0.6, and the next 7 turns are shown as a timeline. Hero commands are Attack, Skill, Item and Guard, with targets picked by cursor or tap. On every attack, skill and heal a timing ring closes in: pressing A in the window gives ×1.5. On foe attacks a correct press blocks and halves the damage. Foes run their move list in order, with telegraphed charge moves, guard moves, all-target and MP-drain moves, and a boss phase switch at an HP fraction (which can fully heal the party). A win splits nothing: each hero gets the full XP, and gold is added. A loss restores the party and restarts the battle (no game over). The intro splits a screenshot into 10 sliding strips.
- **Main pieces:** `G.Battle.start/setup` (L2747–L2770), `next/preview` (L2773–L2783), `run` (L2786–L2803), `heroTurn` (L2806–L2842), `ring` (L2851), `attack/skill` (L2855–L2912), `calc` (L2913–L2919), `damage/heal/ko` (L2920–L2949), `foeTurn` (L2952–L2985), `win/lose/leave` (L2988–L3025), `update` input (L3028–L3073), `render`/`drawHero`/`drawTimeline`/`drawPanel` (L3076–L3201).
- **Size:** ~460 lines.
- **Depends on:** Party, foe, move, skill, battlebg and foeart registries; tweens; particles; audio; `G.Main.snapshot`.
- **Tangled with content:** needs some untangling. Hero weapon drawings (staff, pole, book) and the default intro line are hard-coded (L3140–L3157, L2789), and hero positions are fixed per party size (L2762).
- **Fingerprint:** Initial `ct = (100/spd)·U(0.55, 0.95)`. Physical damage = `max(1, atk·2 − def) × mult × U(0.9, 1.1)`. Magic damage = `mag·2.2 × mult × U(0.9, 1.1)` (ignores def). Marked targets ×1.5 for 3 of their turns; guard ×0.5. Result is rounded with a minimum of 1. Foe damage = `max(1, round((atk·2 − def) × move.pow × U(0.9, 1.1)))`, then guard and block each `ceil(×0.5)`. Heal = `round(mag × pow × (1.5 if timed))`. Hit window is p ∈ [0.8, 1.08] of 0.62 s; block window is p ∈ [0.72, 1.07] of 0.75 s. Foes pick the lowest-HP hero 40% of the time (if more than one is alive), otherwise a random hero. No dice and no accuracy/evasion. Final boss "The Erasure": hp 2400, atk 33, def 13, spd 15, phase at 0.5 (L8898–L8902).

#### Scribble enemy art (creatures drawn in code) — art in code / animation
- **Does:** Each foe has a `foeart` with `draw(ctx, unit, x, y, scale)`. The creatures are jittered polylines (`G.scribble`) re-seeded several times a second so they "never hold still". They flash red when hit, lose strokes as they die, and get an iris grid when marked. The same art is drawn small for roaming field enemies, and inverted to chalk on dark backdrops (`lightInk`).
- **Main pieces:** `G.scribble` (L2730), `foeart hound/smudge` (L5120–L5161); 19 foeart defs in total.
- **Size:** ~45 lines per creature; ~20 lines of engine.
- **Depends on:** `G.pline`, `G.U.hash`, Battle.
- **Tangled with content:** clean (the art is content).
- **Fingerprint:** Seed = `floor(t·6..7) + unit.seed`. Dying skip probability is `dying × 1.1`.

#### Save and load — save
- **Does:** Writes JSON to localStorage and mirrors it to the person's claude.ai account through the artifact runtime (`window.claude.use('db')` and `use('user')`). On the title screen it loads the newer of the two copies by timestamp. Load rebuilds flags, names, items, gold, gear, party, night and explored ink, enters the saved map and shows the recap page. A save is only written from the field (or from a battle entered from the field).
- **Main pieces:** `G.Save.data/write/local/ref/cloud/remote/best` (L3208–L3245), `G.Main.load` (L3449–L3464).
- **Size:** ~55 lines.
- **Depends on:** Field, Party, World, Light, `window.claude` (optional).
- **Tangled with content:** clean.
- **Fingerprint:** Key `wtmf.save.v1`. Cloud doc `data/users/<uid>/wtmf_save` holding `{json, at}`. Format `{v:1, at, map, x, y, dir, flags, names, items, gold, gear, night, calm, party[], explored{}}`. The `v` field is written but never checked. The only migration accepts `explored` as an old single string (L3456). One slot. Autosaves: the `save` command (intro, every lamp lit, inn, airship landing), the tab going hidden, and "Save and go to title".

#### Title screen — UI / procedural art
- **Does:** Shows the title painting, or a procedurally drawn island map that "erases itself" into graph paper toward the right, with drifting paper particles. Menu: Continue/New game, with the current chapter name read from the save's flags.
- **Main pieces:** `G.Title.enter/update/render` (L3250–L3299), `makeArt` (L3301–L3343).
- **Size:** ~95 lines.
- **Depends on:** Save, Journal (`withFlags`), Art.
- **Tangled with content:** deeply tied. The title text and the island art are this game's.
- **Fingerprint:** "Tap or press A to begin" until audio is unlocked.

#### Journal and objectives — quests / progression
- **Does:** Goals are defined in story order with `done` (a flag or a function), `hint`, `note`, optional `show`/`progress`/`says`. The current objective is the first required goal not yet done, so any save has a complete journal with no extra state. The field polls every 0.5 s and shows a "New in the journal" toast when the objective changes. There is a recap page on continue and a scrollable journal grouped by chapter.
- **Main pieces:** `G.Journal` (L3473–L3498), UI pages (L3500–L3599), goal data (L9074–L9331).
- **Size:** ~130 lines of engine plus 258 of data.
- **Depends on:** Script conditions, UI.
- **Tangled with content:** needs some untangling. The heading "Wren's journal" is hard-coded (L3532, L3575).
- **Fingerprint:** 10 chapters, 37 goals. Chapter names are written as words ("Chapter three: …").

#### Vigil (lamp defence) — minigame
- **Does:** A timed mode on a field map. Progress rises while at least 3 of the listed lamps are lit, faster the more are lit. Snuffer creatures spawn at intervals from edge points, walk greedily to a random lit lamp and put it out. Touching one starts a battle. Milestone percentages run scripts, and 100% runs the finish script. Progress is stored in flags, so a saved vigil resumes.
- **Main pieces:** `G.Vigil.start/stop/update/spawn/hud` (L3608–L3664), config in `G.fn.vigilGo` (L7854).
- **Size:** ~60 lines.
- **Depends on:** Field, Script, Particles, flags.
- **Tangled with content:** needs some untangling. The HUD label "Farwick" is hard-coded (L3654).
- **Fingerprint:** `progress += dt·rate·(lit−2)/4` when lit ≥ 3. Farwick setup: rate 100/150, spawn every 8–13 s, at most 3 snuffers, speed 1.4, milestones 25/45/60/85.

#### Sky: Mode-7 airship flight — rendering / vehicle
- **Does:** The world texture (a painting or one drawn in code) is rendered row by row as a ground plane seen at an angle, into a 240×160 ImageData. Above it is a sky gradient with noise clouds, with distance fog, and graph paper past the texture's edge. Towns stand up as depth-sorted billboards and the airship sprite banks in the foreground. Up/down sets speed and left/right turns. Near a site, A lands there (fade, field entry, save) or a site script runs. The HUD shows a compass strip and an arrow to the current goal.
- **Main pieces:** `G.Sky.build/paperGrid` (L3678–L3705), `enter/update` (L3714–L3738), `land/takeoff` (L3739–L3760), `render` (L3761–L3815), `hud` (L3816–L3837); world data `G.def('world','main')` (L8033).
- **Size:** ~170 lines.
- **Depends on:** `G.Art.world`, world registry, Field, Script.
- **Tangled with content:** clean (sites and the goal come from data).
- **Fingerprint:** HZ 44, CAMH 30, FOCAL 120, K 2 world units per texture pixel. World is 640×512 map pixels. Speed targets: up 80, neutral 32, down 0, eased with dt·1.5. Turn rate 1.6 rad/s. Fog = clamp((z−50)/320, 0, 0.82). Landing radius = (s.r‖26)·K·0.8. Night dims everything by `1 − night·0.55`.

#### Ending: epilogue map pages and credits — cutscenes
- **Does:** Draws any map "in ink" from its grid and the explored data (charted tiles in map colours, the rest faint, houses as roof blocks) and returns the percent charted. The epilogue turns pages per place, sorted by how much the player charted. The credits roll and can be sped up by holding A.
- **Main pieces:** `G.UI.inkMap` (L3851–L3872), `epilogue` (L3880–L3899), `credits` (L3900–L3918); pages in data/story/finale.js (L9062–L9072).
- **Size:** ~80 lines.
- **Depends on:** `G.MAPINK`, `G.fn.exploredOf`, UI.
- **Tangled with content:** clean.
- **Fingerprint:** The reveal sweeps explored tiles first, over 2.2 s.

#### The Heart: a map built from the save — procedural generation
- **Does:** The final dungeon is a `mapfactory`. For each of 5 earlier maps it finds the 12×8 walkable window with the most tiles the player never explored. It copies those tiles in pencil grounds into rooms along a ruled corridor and adds a sketch lamp, a memory sign and roaming enemies. The chosen rooms are stored in the flag `heart_rooms` so they stay the same.
- **Main pieces:** `pick` (L8761–L8778), `G.def('mapfactory','heart')` (L8781–L8810), `G.fn.heartMemory` (L8812).
- **Size:** ~55 lines.
- **Depends on:** `G.fn.exploredOf`, map registry, World.
- **Tangled with content:** deeply tied (it is this game's finale), but the technique is reusable.
- **Fingerprint:** Window 12×8 with step 2, needing ≥ 44 walkable tiles. Corridor map 44×62.

#### Debug mode (`?debug`) — debug tools
- **Does:** Key shortcuts for lining up paintings with the tile grid and for jumping to any map or story state. **G** toggles the collision overlay (red for terrain, orange for objects, plus the grid and the player's tile; on painted maps it outlines objects the painting shows off their spot in blue or doesn't show in red). **H** ghosts the engine's ground over the painting. **I J K L** nudge the painting (Shift for ¼ px) and **[ ]** stretch it. **0** clears the corrections and **P** prints and copies the `artfix` line. **T** / Shift+T cycle 19 map states, standing near the middle. **N** toggles night/day, **R** reveals a sketch map, and **V** starts a test battle on each backdrop. `?scale=N` forces the backing scale.
- **Main pieces:** `G.Debug.STATES` (L3939–L3947), `init/key` (L3948–L3988), `jump` (L3990–L4007), `battle` (L4008), `render` (L4016–L4053).
- **Size:** ~135 lines.
- **Depends on:** Art, World, Field, Battle, `G.fn.uncache`.
- **Tangled with content:** needs some untangling. STATES lists this game's maps and layers, and check.js reuses it.
- **Fingerprint:** Turned on by `/[?&]debug\b/`.

#### Repo tools beside the game (not in the page) — tests / build
- **Does:** `check.js` is a Playwright validator. Inside the page it checks map grids, legends, things, NPCs, events, layers, every script command's references, battles, foes, heroes, gear, the start spot and airship sites. It also checks that paintings decode at the right sizes. It then visits every map state by day and by night, starts a battle on every backdrop, lands the airship at every site, and fails on page errors or a file of 16 MB or more. The other tools (header comments only, not read): `build.js` (concatenates modules in order) and `unbundle.js` (splits a built file back into sources); `import-art.js` (resize, register, stitch, WebP), `register.js` (block-matching warp of a painting onto its layout) and `shift-shell.js` (moves painted walls but not furniture); `image-requests.js`, `export-reference.js` (reference plates from the engine) and `refresh.js` (runs the pipeline).
- **Main pieces:** `source/tools/check.js` `checkData` (L24–L152), `checkArt` (L155–L178), run (L180–L284).
- **Size:** check.js 284 lines; the tools total ~1,920 lines (from `wc`).
- **Depends on:** Playwright, the built HTML, `G.Debug.STATES`.
- **Tangled with content:** generic data checks against this engine's registry shapes.
- **Fingerprint:** **No balance simulator.** check.js only checks that battles start, not how hard they are. Its success line is "All good."

### Content
| What | Where | ~lines |
|---|---|---|
| Palette (91 named colours) and book-map ink colours (12) | L209–L249 | 41 |
| Painting table (15 map paintings incl. variants, 10 battle, world, title), `scenes`, precomputed `checks`, `hold`, `fix` | L267–L331 | 65 |
| Bitmap font bands | L337–L420 | 84 |
| Ground types (23: grass, flowers, path, cobble, sand, sea, pier, forest, fade, blank, wall, stonefloor, planks, marble, sky, hull, pencil variants, inkwater, ruled) | grounds.js L4055–L4173 + chapter modules | ~200 |
| Sprites (19: wren, mira, folk, hollis, tamsin, crane, bram, pip, lamp, odile, fenn, quill, ondine, echofolk, echokid, linnet…) | sprites.js L4174–L4502 + chapter modules | ~380 |
| Map objects (41 thing types) | props.js L4503–L4755 + chapter modules | ~1,000 |
| Maps (12: farwick 44×30, westroad 72×34, harrowmere 50×36, towergrounds 30×22, tower1–3, lumen 44×34, atlashall 30×24, meridian 28×12, margins 48×40, heart built in code) with story layers | maps/*.js (8 files) | 892 |
| Heroes 3 (wren, mira, fenn); skills 8; items 12; gear (two tables, 8 in Harrowmere) | battle.js L5082–L5096, town L5972–L5990, lumen L7315 | ~60 |
| Foes 24, enemy moves 55, battles 31, scribble foe art 19, battle backdrops 10 | battle.js + chapter modules | ~1,000 |
| Songs 24 (theme, farwick, blank, battle, victory, dawn, road, ashby, boss, camp, harrowmere, fenn, tower, crane, beacon, lumen, stealth, vance, vigil, sky, margins, heart, finale, ending); SFX 22 | music.js L5208–L5283 + chapter modules | ~200 |
| Story scripts (~145, chapters 1–8 + finale) | story/*.js | 1,460 |
| World map for the airship (5 sites, a goal, drawn-in-code texture, icons) | ch7.js L8033–L8106 | ~75 |
| Journal: 10 chapter titles, 37 goals | journal.js L9074–L9331 | 258 |
| Epilogue pages and credits text | story/finale.js L9062–L9072 | ~12 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Handheld console look in CSS (shell colours, d-pad, A/B, Menu, dark mode, landscape layout, safe areas, 16 px graph-paper background) | L7–L72 | 66 |
| Console HTML and control hint text | L73–L83 | 11 |
| "Ink and paper" UI style: ink panels with a paper rule, flame cursor, pencil/graph-paper backgrounds for journal, recap and name entry | L615–L631, L3501–L3505, L2282–L2285 | ~30 |
| Book menu (two-page layout, map, party bars) | L2358–L2420 | 62 |
| Battle HUD (timeline, party panel, command menu, ring prompt, numbers) | L3076–L3201 | 125 |
| Sky HUD (compass strip, goal arrow, landing prompt) | L3816–L3837 | 22 |
| Title layout and procedural island art | L3280–L3343 | 64 |
| Lamp HUD, Vigil HUD, toast | L2525–L2531, L3651–L3663, L3511–L3520 | ~30 |

### Shared-code clues
- **Mooncart hosts this game with its console hidden (confirmed).** building-with-assets- `games.json:4` `"map": { "repo": "chriskizer91-ops/what_the_map_forgot", "paths": ["/what-the-map-forgot.html"] }`, and `games.json:11` `{ "source": "map", "file": "what-the-map-forgot.html", "folder": "", "opts": { "frame": false } }`. Its `README.md:51` reads "What the Map Forgot draws its own handheld, so it starts with Mooncart's console hidden." `tools/smoke.mjs:102` checks this.
- **Art Farm borrows the pop-up look from the 3D branch, not from this file (confirmed).** farm-project `art-farm/src/paper.js:5–6`: "The wave and the merged meshes are What the Map Forgot's (chriskizer91-ops/what_the_map_forgot, branch ccr-9c545e56-4m3vqr, wren-3d/src/farwick-3d.js: popK, popAt, geometry merged per material)". `popK`/`popAt` appear at game-3d.html L10484/L10508. `art-farm/tools/build.mjs:4` and `tools/sheet.mjs:2` credit `wren-3d/tools/build.mjs` and `sheet.mjs`. farm-project `CLAUDE.md:16–17` names the same branch and folder.
- **Envoi borrowing from WTMF: not found.** I searched every Envoi remote branch, outside `.html` files, for "map forgot", "wtmf" and "wren-3d" and found no mention. The `.html` matches were inside base64. Envoi's `docs/landscape.md:71` describes "painted maps where the painting is the ground and a grid of letters only marks what is solid", which is the same idea as WTMF's tile grid under a painting, but it names no source.
- **The flow runs the other way for 3D:** game-3d.html L9341–L9343 (wren-model.js): "The method follows the Envoi models (envoi-on-the-longest-night, src/models/sol.js): its geometry helpers, skinned buckets merged per material, two-bone leg IK, spring chains on 1/120 s substeps and keyed actions are reused here".
- **Save-path convention:** `db.doc('data/users/' + uid + '/wtmf_save')` (L3234) follows the same `data/users/<id>/…` pattern as the airship game's save (its CLAUDE.md: `data/users/<id>/save`, with capabilities db + user). This is a shared artifact-runtime convention, not copied code.
- In the 2D game itself I found no comments naming another of Chris's games or repos. I searched for witch, envoi, mooncart, aethermoor, magpie, farm, stranded and others.

### Notes
- **Engine depends on chapter data:** `G.fn.uncache` is defined in data/ch6.js (L7844), but engine/sky.js (L3744) and engine/debug.js (L3995) call it. A shared engine would need to move it into world.js.
- **Story text hard-coded in engine files:** the player sprite `'wren'` (L1758), "Wren's route card" / "{mira}'s book" (L2365), "Lamps lit N of 6" and "n / 6" (L2385, L2530), "marks" (L2384, L2449), "Wren's journal" (L3532, L3575), the Vigil HUD's "Farwick" (L3654), the warden's lines (L2031), and the hero weapon drawings (L3140–L3157). `G.S.lampCount` counts things of type `lamp`.
- **Save version written but unused:** `v: 1` is never checked on load. Sound on/off is not saved. There is one save slot with no slot choice.
- **No pause:** the comment at L186 says waits "pause when the game pauses", but nothing stops `G.t`. "Pause" means the scene skips update while a modal is open or a script is running.
- **Mixed module style:** data/story/ch1.js declares `const S` at top level, a global lexical binding (L4847), while the later chapters wrap theirs in IIFEs. Concatenation still works because ch1 is the only top-level one.
- **Losing a battle restarts it fully healed** (L3006–L3017). There is no game over.
- **The 2D game has a complete code-drawn fallback** for everything painted (grounds, things, backdrops, world, title). A painting that fails to decode falls back to it.

### The 3D copy (wren-3d)
Branch `origin/ccr-9c545e56-4m3vqr` (`9a84c2f`, 2026-10-05). The stripped copy `what-the-map-forgot-3d/game-3d.html` has 14,932 lines. A full `diff` of its L1–L9331 against the 2D stripped file differs **only at L6** (`<title>What the Map Forgot in 3D</title>`), and the boot lines are identical. The 3D layer is **inserted at L9332–L14926**, between the last data module and `G.Main.init()`. Its own comment (game3d.js L10939–L10943) says it adds a 3D view drawn into the game's own screen and leaves the game's files untouched.

| Module (in game-3d.html) | Lines | ~lines | What (from its header comment only) |
|---|---|---|---|
| three r128 (minified, one 603,352-char line) | L9332–L9339 | 8 | Library |
| wren-model.js | L9340–L10431 | 1,092 | `makeWren(opts)`: rigged Wren built from her sprite and palette, using Envoi's model method |
| farwick-3d.js | L10432–L10937 | 506 | `makeFarwick3D(opts)`: town from the game's map; one ground mesh with uWipe (painting) and uPop (pop-up) shaders, `popK`/`popAt` |
| game3d.js | L10938–L11776 | 839 | Hooks into the game (sections: "Chapter one's ladder", "The 3D view", moments, "Into the game") |
| game3d-ashby / -harrowmere / -tower | L11777–L12471 | 167 / 166 / 362 | Chapter 2–4 3D moments |
| folk.js | L12472–L12519 | 48 | Farwick people dressed from their sprites |
| game3d-atlas / -vigil | L12520–L12960 | 330 / 111 | Chapter 5–6 |
| world-3d.js, airship.js | L12961–L13603 | 399 / 244 | Chapter 7 world and ships |
| game3d-parallax.js | L13604–L14427 | 824 | 3D flight replacing the Mode-7 render |
| game3d-margins / -lumen | L14428–L14926 | 322 / 177 | Chapter 8 pencil map; Lumen |

From grep only (assignment names, bodies not read), the layer reassigns these engine functions at runtime: `G.Field.enter` (several times), `G.Field.render/update/tapTo/drawActor`, `G.Sky.build/update/enter/render/land`, `G.World.applyLayer`, `G.S.cmd.lamp/tele/restore`, `G.I.dirHeld/dirTapped`, `G.Spr.frame`, `G.U.canvas`. It keeps a separate save: `G.Save.key = 'wtmf3d.save.v1'` with the cloud copy turned off (L10970–L10971, read). The source folder `source/wren-3d/src/` also has demo-only modules that are not in the game copy: parallax 1,580, vigil 1,119, stage 905, atlas 794, remembered 738, hound 542, ashby-home 427, sound 398, ashby 338, wick 134, plus `*-data.js` packed lines. The branch's `wren-3d/tools/` folder holds build.mjs, game-build.mjs, extract*.mjs, sheet.mjs, budget.mjs and *-shots.mjs; I saw only their names in the branch file listing.
**What I read:** the full-file diff, module markers, each module's header comment (the first ~6 lines), the four section headers in game3d.js and in game3d-parallax.js, the save-key lines, and the `popK`/`popAt` lines. **What I did not read:** the module bodies, the three.js line, or any `wren-3d` tool or demo file.
