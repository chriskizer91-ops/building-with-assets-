## The Magpie over Aethermoor

**What it is:** Chris's reference page. The Magpie, a sunstone skiff built in 3D in code with the witch at the helm, Inkblot on the rail and Nettie boarding at Bogmire, flies over a painted night map of all of Aethermoor. You tap to fly, steer with keys, pick a place and she flies there and docks. Place cards, a minimap, region banners and flying music.
**Inventoried:** `airship-game-in-aethermoor-` @ `origin/claude/ship-game-magpie-l8cbdn` (`1887984`), `reference/the-magpie-over-aethermoor.html`. Full size 2,564,204 bytes (blob `3cd698db`). Stripped copy 826 KB, 4,482 lines (L4482 closes the outer wrapper from L1). Line numbers refer to `game-systems/stripped/magpie-over-aethermoor/the-magpie-over-aethermoor.html`. The page is one minified bundle (esbuild-style output) whose code sits in a few giant lines, so a position is cited as `L4478@113873`: line 4478, character offset 113873 (0-based) in the stripped copy.
**Tech:** three.js **r186** (`revision:"186"`, L159), tree-shaken and inlined. WebGL through `WebGLRenderer`. A painted-backdrop "stage": the painting drawn on a screen quad, 3D actors rendered into a depth target and composited over it, plus cutout cards. MeshToon materials with a rim-light shader hook and inverted-hull ink outlines. DOM HUD. WebAudio synthesis only, with no audio files. The page is one IIFE produced by bundling ES modules (the readable source is the 20-min repo, see Shared-code clues). The only outside library is three.js, plus three's `BufferGeometryUtils` inlined (L4478@17925). Fonts (Jacquard 12, Pixelify Sans) are WOFF data URIs.

### Coverage
- **Read fully:** HTML/CSS L1–L154. Audio engines L155@9574–27801 and L155@61313–78593 (song parser, `Ad` synth, Thareia sfx core, loudness table, instruments, score helpers, music player, `Xd` router). App data and PaintCamera L4374@58069–67834. Cutouts, Stage class and shaders L4375–L4468@5935. Noise texture, Magpie recipe and toon kit L4468@5935–L4477. Model kit L4478@0–3012. Magpie builder L4478@3012–13414. Witch props and fx L4478@13586–17925. Actor helpers L4478@23037–26997. Witch builder and animation L4478@26997–43333. Input and main app L4478@104949–121364.
- **Skimmed:** Synth song table `Td` L155@~360–9574 (13 songs, sampled). Thareia sound catalogue L155@27801–61313 (182 entries in 18 categories, names read and bodies sampled). Orchestral scores `Mh` L155@68305–76406 (9 pieces, header and first sections read). Places table L4374@58810–66093 (all 19 entries' ids, kinds and music read, blurbs sampled). Inkblot L4478@43333–65166 (palette, constants, builder start, API and move list read; gait and pose code not read). Nettie and her face painters L4478@65166–104949 (function heads, API and move list read; bodies not read). BufferGeometryUtils L4478@17925–23037 (recognised as the stock three addon by its error strings).
- **Skipped:** three.js r186, L155@78593 to L4374@58069 (~588 KB, 3,800+ shader-chunk lines). All base64 (stripped).

### Code map
| Lines / files | Group | What | ~chars |
|---|---|---|---|
| L1 | presentation | an outer document wrapper (light colour-scheme, safe-area padding) before the page's own doctype on L2 | 0.5 K |
| L2–L120 | presentation | CSS: plum/cream/gold tokens, banners, card, minimap, region banner, tapmark, phone rules | 8 K |
| L121–L154 | presentation | markup: `#stage` canvas, `#labels`, `#hud-right` (tools + minimap), `#dock` (card, Land, Nearby), hint, error | 2 K |
| L155@0–412 | assets | script open, 2 WOFF fonts (stripped) | 0.4 K |
| L155@~360–10069 | content + system | Aethermoor synth song table `Td` (13 songs) and parser `Vp`/`Ed` | 9.7 K |
| L155@10069–23696 | system | `Ad()`: Aethermoor synth (step sequencer, 40 SFX) | 13.6 K |
| L155@23696–27801 | system | Thareia sfx core: context, reverb, routing, envelope, oscillator/noise/FM voices, helpers | 4.1 K |
| L155@27801–61313 | content | Thareia sound catalogue: 182 `nt(cat,id,name,desc,play)` entries | 33.5 K |
| L155@61313–64242 | system + content | `Id`/`yh`/`Pd` playback, `Xp` per-sound loudness table | 2.9 K |
| L155@64242–68305 | system | `qp` 25 instruments, score helpers `nn`, `Yp`, `oi`, `zn`, `ai`, `Zr`, `kd`, `Ne`, `Gd` | 4.1 K |
| L155@68305–76406 | content | `Mh`: 9 orchestral pieces | 8.1 K |
| L155@76406–78593 | system | music player `wh`/`Hd`/`Vd`, router `Xd` | 2.2 K |
| L155@78593 → L4374@58069 | library | three.js r186 | 588 K |
| L4374@58069–58300 | assets | map AVIF, fx-map AVIF, clouds AVIF, wisps WebP (stripped) | 0.2 K |
| L4374@58300–66500 | content | `Wn` map config, `ed` region names, `nd` region grid, places `ur` (19), wisp path `$0`, clouds `J0` | 8.2 K |
| L4374@66500–67834 | system | `oh` PaintCamera, `K0` outline util, layer ids | 1.3 K |
| L4374@67834 → L4405@1172 | system | cutout shaders and `Q0` buildCutouts, `_y` card plane | 3.5 K |
| L4405@1172 → L4468@5935 | system | `lh` Stage class with bg/composite shaders (WORLD_FX block L4408–L4456) | 12 K |
| L4468@5935–6713 | system | `by()` tiling noise texture | 0.8 K |
| L4468@6713–7867 | content | Magpie picture sheet (stripped) and recipe `Us` | 1.1 K |
| L4468@7867 → L4477 | system | toon kit: `ip` gradient, `$o`/`sp` rim hook (L4469–4472), `gt`/`dn` materials, `ke`, `Bs`, `Ur`, `ch` shapes, `Sy` ink outline | 2.6 K |
| L4478@0–3012 | system | model kit: `$` part (+ink), `Bt` joint, primitives, `Os` skirt, `ks` cloth ripple, blob shadow, glow sprite, `Pi` layers, `Be` spring | 3 K |
| L4478@3012–13414 | system | `cp()` Magpie skiff builder, `op`/`ad` UV helpers | 10.4 K |
| L4478@13414–17925 | assets + system | witch textures (stripped), athame, slash trail, rune, moonlight ring, veil, bottle | 4.5 K |
| L4478@17925–23037 | library | BufferGeometryUtils `mergeGeometries`/`mergeVertices` | 5.1 K |
| L4478@23037–26997 | system | actor helpers: easing, canvas textures, feathers, mood textures, `Zi` particle pool, glow, world-pose utils | 4 K |
| L4478@26997–43333 | system | witch `Sp()` (+ face atlas, spoon, textures) | 16.3 K |
| L4478@43333–65166 | system | Inkblot crow `Ep()`/`Tp()` | 21.8 K |
| L4478@65166–104949 | system | Nettie `Fp()` + painted-face and portrait painters, staff, toad, fx | 39.8 K |
| L4478@104949–105913 | system | `Np` keyboard, tuning constants, `mh` texture loader | 1 K |
| L4478@105913–120836 | system | `Op()` map mode: scene setup, HUD, flight, camera, minimap, frame, test hook | 14.9 K |
| L4478@120836–121364 | system | font loading, `hb()` boot, error box | 0.5 K |
| L4479–L4482 | presentation | `</script></html>`, then the outer wrapper's `</body></html>` | — |
| **Totals** | | app code ~228 K chars (systems ~150 K, content ~63 K, presentation ~10 K); three.js ~588 K | 826 K |

### Systems

#### Boot, game loop and timing — core
- **Does:** `hb()` loads the two FontFaces from data URIs, creates the sound router, awaits `Op()` and then runs a rAF loop calling `t.frame(now)`. `frame` computes `dt = clamp((now-last)/1000, 0, 0.05)` and steps flight, ship, actors, ambient FX, camera, stage update and render, then the labels. Every 0.25 s it also updates the region, the Nearby list and the HUD rects. A failure shows "The map couldn't start: …" in `#error`.
- **Main pieces:** `hb` (L4478@120881), `it.frame` (L4478@118796), the throttled block inside it (`Yt>.25`).
- **Size:** ~2.5 K chars.
- **Depends on:** `Op`, `Xd`, DOM.
- **Tangled with content:** clean.
- **Fingerprint:** rAF, variable timestep, dt clamp **0.05 s**, no pause. Audio suspends on `visibilitychange` (inside `Ad`). `window.__airship` holds the map-mode object.

#### Painted-map stage renderer (`lh`, the "Stage") — rendering
- **Does:** Draws the painting through a scrolling, zooming "window" as a graded full-screen quad (tint, saturation, lift, vignette). Actors (layer 0) render into a half-float target with depth and are composited over it; cutout cards (layer 1) test against that depth; the glow layer (4) draws last. Zoom eases (`1-exp(-3dt)`) and the window scrolls toward the focus (`1-exp(-4dt)`), clamped to the painting and snapped to whole screen pixels. It also has a pixel-art mode (`pixelSize`), screen shake, a guides layer, `look()` overrides and `setScreen()` scene swaps. A "reveal" mode tweens the camera into an orbiting 3D view of the cutouts (`renderReveal`, `orbitBy`, `zoomBy`), which nothing on this page turns on.
- **Main pieces:** constructor (L4405@1172), `makeTarget`, `scrollTo`, `update`, `render` (L4468@3720), `renderReveal` (L4468@3779), `screenToPixel`/`pixelToScreen`/`worldToScreen`, `ep` quad scene (L4468@5800), `yy` easing.
- **Size:** ~12 K chars.
- **Depends on:** PaintCamera, cutouts, three.js.
- **Tangled with content:** clean. It takes `{paint, painting, world, cutouts, renderer, fx}`.
- **Fingerprint:** DPR capped at 2. `antialias:false`. Clear colour `460043` (#07050b). Layers `_s=0` actors, `id=1` cutouts, `j0=2` guides, `Zo=4` glow. Render target `HalfFloatType`, nearest filtering. Window snap = `pixelSize` or `1/scale`. Shake decays 1.4/s with ±18/±12 px. Reveal: yaw 0.7, pitch 0.5, distance 32 (clamped 12–110), auto-orbit after 2.5 s idle.

#### Paint camera (`oh`) — rendering / camera math
- **Does:** Builds the perspective camera a painting was "taken" with from `{fov, pitch, ppm}`. The distance is `(h/2/tan(fov/2))/ppm`, raised by the pitch and looking at the origin. It converts between painting pixels and the world: `ray`, `toWorld(px,py,h)` (meets the plane y=h), `toPlane`, `toPixel`, `heightAbove`. The whole map, the places and the ship's clamping all use painting-pixel coordinates.
- **Main pieces:** `oh` (L4374@66500).
- **Size:** ~1.1 K chars.
- **Depends on:** three.js.
- **Tangled with content:** clean.
- **Fingerprint:** here `Wn.camera = {fov:8, pitch:52, ppm:12}` and `size [4608,3072]`, so the map is 384 × 256 m. Near and far planes are 0.25× and 2.5× the distance.

#### Cutout cards with actor-depth occlusion (`Q0`) — rendering
- **Does:** Turns painted layer outlines (polygons or ellipses in painting pixels) into flat cards standing on vertical planes. The cards are triangulated and textured by reprojecting the painting through the paint camera. A character nearer the camera shows through a card, and the card hides any actor behind it, so painted foreground occludes 3D actors. On this page it is called with `{layers:[]}`, so no cards exist; the depth target and composite still run.
- **Main pieces:** `xy`/`vy` shaders (L4374@67834, L4382), `Q0` (L4405@2), `_y` (L4405@788).
- **Size:** ~3.5 K chars.
- **Depends on:** PaintCamera, Stage's depth target.
- **Tangled with content:** clean.
- **Fingerprint:** debug tint `#ff3fd0`. The card fragment shader discards where `gl_FragCoord.z >= actorDepth`.

#### World FX shader (cloud shadows, sea, lamps, sharpening) — effects
- **Does:** With an `fx` map the backdrop shader gets `WORLD_FX`: drifting fbm cloud shadows; on sea (`fx.r`) a moonlit swell and glints that fade when zoomed out (`detail = smoothstep(scale,.45,.9)`); on windows and lamps (`fx.g`) a flickering warm halo; and contrast-adaptive sharpening ("after AMD's CAS") when magnified. The noise comes from a 256² RGBA tiling texture made once (`by()`: Park–Miller LCG, seed **20261002**, a box blur run three times on two channels and white noise on the other two).
- **Main pieces:** shader L4406–L4460, uniforms in the constructor (L4405), `update` sets time, detail and sharpen (L4468), `by` (L4468@5935).
- **Size:** ~4 K chars.
- **Depends on:** Stage. The fx map is X0 AVIF, loaded without sRGB.
- **Tangled with content:** needs some untangling: cloud scale 760 px, swell 140 px and the colours are tuned to this painting.
- **Fingerprint:** cloud shadow `1-0.26*smoothstep(.52,.8,cs)`. Sharpen `smoothstep(l,1.3,4.5)*.85`. Time wraps at 3600 s.

#### Flight model, landing and docking — movement
- **Does:** Ship state `E` (`mode` docked/flying/landing, `pos`, `alt`, `heading`, `speed`, `turn`, `climb`, `target`, `goal`). Keys cancel any target and steer directly; otherwise she turns toward the target, slows near it and arrives, landing at a town or opening the goal's card. Turning is clamped, and the throttle drops when she faces away from where she's heading, while she is low, and while a sight's card is open. Speed and altitude follow exponentially. Landing lerps her onto the dock at the place's heading. She docks when height and position are within tolerance, which plays the dock sound and the town's music, makes the witch cheer and opens the card. Her position is clamped to the map bounds in painting pixels. Near a town (<10 m) a "Land at X" button appears. Passing a sight (<6 m) opens its card, with a "new-area" sound the first time.
- **Main pieces:** `P(dt)` (L4478@113873), `G` takeOff (L4478@110997), `Z` flyTo (L4478@111166), `yt` land (L4478@111366), `Lt` docked (L4478@111445), `bt`/`j` tap target and clamp (L4478@113491).
- **Size:** ~3.5 K chars.
- **Depends on:** PaintCamera, places, audio, actors, HUD.
- **Tangled with content:** needs some untangling: the Bogmire/Nettie event and the place kinds are inline.
- **Fingerprint:** constants (L4478@105698): cruise `ab=9` m/s, full sail `Up=1.8`× (Shift, or automatic on long legs: `1+(Up-1)*smoothstep(d,30,90)`), cruise altitude `ob=7` m, turn `Bp=1.6` rad/s, ship scale `lb=1.7`. Throttle to target `min(1,d/14)`. Arrive at `d < .4 + speed*.1`. Turn `clamp(diff*2.2,±1.6)`, turn smoothing `exp(-4dt)`. Facing factor `max(.2,(cos diff+1)/2)`. Low-altitude factor `clamp((alt-1.3)/3,.15,1)`. Sight-card slowdown ×0.35. Speed follows at `1-exp(-1.2dt)`. Altitude follows at rate 0.9 flying, 1.3 landing/docked. Landing lerp `1-exp(-2dt)`. Docks when |alt-dockAlt|<0.05 and distance <0.1. Each town has its own `dockAlt` (1.4–4.5) and `heading`.

#### Follow camera and zoom — camera
- **Does:** Each frame the focus is the ship's position plus a lookahead along her heading (`speed*.7`), at y=`alt*.6`. It is projected to painting pixels and nudged so she is centred in the space above the bottom dock panel. Map (overview) mode focuses the map centre at zoom 1. The zoom target fits about 1150 painting px across a landscape screen or 640 on a portrait one, times the user zoom. Wheel, pinch and +/- change the user zoom, and zooming in leaves overview.
- **Main pieces:** `at()` (L4478@118423), `tt()` (L4478@117933), `ct`/`pt` (L4478@113706), Stage `update`.
- **Size:** ~1.2 K chars.
- **Depends on:** Stage, PaintCamera, HUD rects.
- **Tangled with content:** clean.
- **Fingerprint:** zoom target `clamp(max(w,h)/(base*(portrait?640:1150))*E.zoom, 1, 9)`. User zoom clamped 0.3–1.6. Leaves overview above 0.45. No deadzone. The smoothing is the Stage's (3/s zoom, 4/s scroll).

#### Input: keys, taps, pinch, wheel, minimap — input
- **Does:** `Np` maps arrows and WASD to a normalised world vector, Space/Enter/E/NumpadEnter to "act" (take off, or land when near a town), Escape to "back" (close the card), and B/L to "backstage"/"layers". This page ignores the last two. A second listener handles Shift (full sail), +/= and -/_ (zoom) and M (map toggle). On the canvas, a pointer that ends without moving more than 12 px is a tap. A tap within 34/scale painting px of a place flies there; otherwise she flies to the tapped point (clamped), shown by a `#tapmark` ring. Two pointers pinch-zoom, and the wheel zooms by `exp(-deltaY*.0015)`. A tap on the minimap flies to a town near the tap, or to the point. Place labels fly on pointerdown. Taps, `Np` keys and buttons call `audio.unlock()`. Taps, `Np` keys and the wheel end the intro.
- **Main pieces:** `Np` (L4478@104949), extra keys (L4478@112038), pointer handlers (L4478@112356–113183), `te` tap resolver (L4478@113183), minimap handler (L4478@116250).
- **Size:** ~2.5 K chars.
- **Depends on:** DOM, flight, camera.
- **Tangled with content:** clean.
- **Fingerprint:** there is no on-screen pad (touch is tap-to-fly only) and no gamepad. Keyboard input is ignored while focus is in a button, input or textarea. Mooncart keys: arrows yes, Enter = act (A), Escape = back (B), M toggles the map (Mooncart's START key is M), H unused.

#### HUD: labels, place card, Nearby list, Land button — menus/UI
- **Does:** One button per place (town banner, or sight pin shown as "???" if hidden), placed each frame and hidden when off screen, under the title or HUD, behind the dock, at the docked town, or (zoomed out, `scale<.55`, class `far`) when not a town. The card shows name, `type · region (· docked)`, blurb and data rows ("Rumour" rows in italics, others as chips). Its buttons are Fly on, Fly to (Bogmire from Wickhollow, else the nearest town) and Take off. Every 0.25 s the Nearby list is rebuilt from the 3 nearest towns. The tools are Map/Follow, a tune toggle and Sound on/off.
- **Main pieces:** labels `H` (L4478@108581) and per-frame placement inside `frame`, `O` showCard (L4478@109873), `k` Nearby (L4478@110695), `Q` button sync (L4478@109426), `ot` HUD rects (L4478@118195).
- **Size:** ~3 K chars.
- **Depends on:** places data, Stage, DOM ids.
- **Tangled with content:** needs some untangling: the Wickhollow→Bogmire suggestion and the hidden-place wording are inline.
- **Fingerprint:** labels use `transform: translate(x,y)` per frame. HUD rects are re-measured every 0.25 s and on resize.

#### Region lookup and banner — map logic
- **Does:** Every 0.25 s, takes the region of the nearest place if it is within 25 m. Otherwise it reads a 12×8 letter grid over the map (384 px cells). On a change it shows the region's name in `#region` with a 3.2 s CSS animation.
- **Main pieces:** `Xt` (L4478@115710), `qt` (L4478@116070), data `ed`, `nd`, `Z0` (L4374@58432–58810).
- **Size:** ~0.8 K chars.
- **Depends on:** places, PaintCamera.
- **Tangled with content:** clean (data-driven).
- **Fingerprint:** grid rows such as `"sswwwwwppppp"`. Letters: s sea, w wilds, g gloamwood, f fen, h hearth, p peaks, k wastes.

#### Minimap — UI
- **Does:** Draws a 768-px-wide downscaled copy of the painting once. On a size or goal change it caches a base layer with a dark wash and gold town dots (the goal larger and paler). Every frame it draws the viewport rectangle (unless in overview) and the ship as an orange arrow with a pulsing glow, rotated to her on-map heading. It is hidden on narrow or short screens by CSS.
- **Main pieces:** setup (L4478@116250), `q(t)` (L4478@116791).
- **Size:** ~1.4 K chars.
- **Depends on:** painting image, Stage window, PaintCamera.
- **Tangled with content:** clean.
- **Fingerprint:** DPR capped at 2. Cache key `${w}x${h}:${goalId}`.

#### Intro and reduced motion — presentation flow
- **Does:** Unless `prefers-reduced-motion` is set, the page starts in overview, showing the whole map for 1.6 s. Then (or on any input) `Ft()` zooms to the ship, opens the Wickhollow card and shows the region banner 0.9 s later. With reduced motion it opens on the Wickhollow card.
- **Main pieces:** `Ht` (L4478@111752), `Ft` (L4478@111814), start (L4478@120712).
- **Size:** ~0.6 K chars. **Depends on:** HUD, camera. **Tangled with content:** clean. **Fingerprint:** intro 1.6 s.

#### Ambient world: drifting lights, clouds, glow, moonlight — effects
- **Does:** 14 animated sprites from a 4×2 sheet, each with a violet glow (layer 4, no depth test), loop along a Catmull-Rom path from Wickhollow to Mother's Hollow, bobbing and fading at the ends. 18 painted cloud sprites from a 2×2 sheet, each with a radial-gradient shadow on the ground, drift east and wrap, and fade when near the ship. A warm additive disc under the ship pulses and fades with altitude, replacing the ship's own shadow, which is hidden. The light rig is hemisphere `#9aa8ff`/`#1c1830` 0.95 plus a directional `#d2d8ff` 1.25 at (-50,60,-30).
- **Main pieces:** `R` lights (L4478@106647), `S` clouds (L4478@107262), `B` glow (L4478@108100), per-frame updates in `frame`.
- **Size:** ~2.5 K chars.
- **Depends on:** Stage layers, PaintCamera, the `$0`/`J0` data.
- **Tangled with content:** needs some untangling (counts, path and sheet layout inline).
- **Fingerprint:** lights move at `.9/pathLength` per second, sprite frames at 8 fps. Clouds: size `20+(i*7%13)`, speed `.35+(i%5)*.08`, y `16+(i%4)*2.5`, opacity `.7*smoothstep(dist,7,18)`.

#### The Magpie skiff model (`cp` + recipe `Us`) — 3D model built in code
- **Does:** Builds Quill's sunstone skiff from one 1024² picture sheet and two outlines in sheet pixels: side (`rim`, `keel`) and top (`half`). Each hull side is a 44×12 grid, rows bunched toward the bow, sections `[half·cos t, rim − depth·sin(t)^0.75]`, with the painted side view projected on as UVs (mirrored for the other side). Also: stern cap, deck (top-view UVs), brass rails, a lathe brazier with a flickering light, five lathe crystals (`L` table) on struts with glows and violet hearts, two cloth sails with a barycentric belly, fin, rudder and lantern cards from the sheet, a wheel, a shadow disc, and embers rising off the crystals. `update(dt, speed, turn, climb, ground)` bobs the deck, banks and pitches it through springs, works the rudder, wheel, fins and sails, pulses the crystals and lights, and moves embers and shadow. `{lit:false}` gives a cold, unlit ship.
- **Main pieces:** recipe `Us` (L4468@6771), hull math `ii…rp` (L4478@3012), `mr`/`rd` sheet-to-UV (L4478@3579), `cp` (L4478@4058), `op`/`ad` (L4478@13098).
- **Size:** ~11.5 K chars.
- **Depends on:** toon kit, model kit, `Be` spring, `Sn` glow, the atlas texture `np`.
- **Tangled with content:** clean. All shape data is in `Us` and the few constants.
- **Fingerprint:** `STERN=-2.4`, `BOW=2.7` (`ii`, `Ty`), length 5.1 m. Brass `#c9a24d`, dark wood `#4e2d19`, copper `#b8683a`, deck y −0.06. Rows `ii+Br*(1-(1-r/44)^1.25)`. Section exponent 0.75. Springs `Be(8,4)` bank and `Be(10,5)` pitch. Bob `sin(1.3t)*.12+sin(.7t)*.06`. Sail belly `.1+min(1,speed/6)*.22`. Embers at most 110, spawning at `12+34*speed01`/s, life 1.6–2.6 s. Exposes `helm (0,-.06,-2)` and `perch`. The page passes `speed*.67`.

#### Toon material kit, ink outlines and model helpers — rendering kit
- **Does:** `gt(color, opts)` makes cached `MeshToonMaterial`s with a 3-step gradient (70/160/255) and a rim light patched into the shader via `onBeforeCompile` (rim `#b8b0ff`, shared strength 0.32, `smoothstep(.62,.8)`). `dn(map)` is the same with a texture. `$()` adds a mesh and, unless `ink:false`, a back-face "ink" shell pushed out along normals (`Sy`: `#12091a`, thickness 0.016). Then: `Bt` joints, primitive shorthands, `ke` tapered tube, `Bs` extruded shape, `Ur` star, `ch` crescent, `Os` jagged skirt or cape mesh (seeded LCG 7), `ks` cloth ripple of a skirt, `Ga` blob shadow, `Ko` radial texture, `Sn` additive glow sprite, `Be` damped spring (`k`, `d`, semi-implicit), `Zi` ring-buffer particle pool, `Fi` feather lathe with profiles `yi`, `wp` mood-switchable canvas textures, `_i` canvas-texture factory.
- **Main pieces:** L4468@7867–L4477, L4478@0–3012, L4478@23037–26997.
- **Size:** ~9 K chars.
- **Depends on:** three.js.
- **Tangled with content:** clean.
- **Fingerprint:** material cache key is `color+JSON(opts)`. Program cache key `"rim"`. The rim hook replaces `#include <opaque_fragment>` (r186). `Zi.spawn` uses fade-in to 0.15 of life and fade-out from 0.55.

#### Witch actor (`Sp`) — 3D model and animation
- **Does:** Builds the witch from joints and toon parts: layered skirts, shawl, basket, athame, bottle, spoon, an 8-frame witchfire sprite with a light, a painted 4-mood face atlas, spring-driven hair, and a three-segment hat with horns and charms. `update(dt, speed, turn)` walks (stride from speed), breathes, blinks, turns her head, swings her hair, hat, charms and shawl on springs, ripples the skirts and animates the witchfire. `play(name, onHit)` runs one of 13 moves (harvest, cast, throw, moonlight, rune, dash, brew, veil, stir, cheer, hurt, ko, rise) with its effects (slash trail, rune path, moonlight ring, veil). The page only calls `setMood('happy')`, `play('cheer')` and `update(dt,0,0)`.
- **Main pieces:** palette `fe` (L4478@26997), `Sp` (L4478@27379), API (L4478@33845), `Oy` face (L4478@40610), props and fx (L4478@13586–17925).
- **Size:** ~21 K chars.
- **Depends on:** toon kit, model kit, face texture `hd`, witchfire sheet `dd`.
- **Tangled with content:** clean as a module, but it carries all her moves for battle.
- **Fingerprint:** height 1.68, radius 0.2. Move durations `{harvest 1.7, cast 1.3, throw .9, moonlight 1.8, rune 1.7, dash 1.1, brew 1.4, veil 1.6, stir 2.4, cheer 1, hurt .5, ko 1.2, rise .8}`. Moods calm, blink, surprised, happy.

#### Inkblot actor (`Ep`/`Tp`) — 3D model and animation (skimmed)
- **Does (from what was read):** A crow of feather lathes (`Fi`) with canvas feather textures, beak and jaw, eyes and a corded charm, posed through a pose object (`$y`) by gait helpers. `Tp` adds `update(dt, 'stand'|'fly', ground)` with a height-faded shadow; the page uses `'stand'` on the perch.
- **Main pieces:** `Ze` palette and constants (L4478@43333), `Ep` (L4478@43631), API (L4478@51068), `Tp` (L4478@64749).
- **Size:** ~22 K chars.
- **Fingerprint:** moves `peck, pinch, kraa, caw, fetch, preen, puff, hop, walk, fly, perch, cheer, hurt, ko, rise`. Height 0.44, flyHeight 0.42.

#### Nettie actor (`Fp`) — 3D model and animation (skimmed)
- **Does (from what was read):** Swamp witch with staff and lantern (`eb`), a toad (`ib`) and `Zi`-pool fx (`rb`). Her canvas-painted mood face (`Cp`) is repainted from a portrait sheet once it loads (`V.src=ud`, `Lp`/`tb`, L4478@81835). Same API as the witch. Hidden on deck until the first Bogmire docking.
- **Main pieces:** `$t` palette (L4478@67359), `Fp` (L4478@76862), API (L4478@84962).
- **Size:** ~40 K chars.
- **Fingerprint:** moves `{attack 1, jars 1.4, stir 2, tide 1.6, hex 1.3, ward 1.6, undo 1.9, cast 1.2, cheer 1.4, hurt .5, ko 1.3, rise .9}`. Height 1.52.

#### Aethermoor synth (`Ad`) — audio
- **Does:** A lazily created AudioContext with a master gain of 0.6 into a compressor, plus music and SFX buses. A 1.5 s noise buffer and a pulse PeriodicWave are built at start. A step sequencer plays songs written as strings of notes per part, with `-` to hold and `.` for rest. Voices: horn, reed, bell (FM), tri, pulse, square, pluck, flute, pad, and drums `k s h c d t a w f p`. It crossfades between songs (0.9 s, or 0.35 s for the first) and stops non-looping songs at their end. It has 40 game SFX (select, dice, hit, crit, heal, reveal tiers, kraa, flap, blip…) and a `duck()` on the SFX bus. The context suspends when the page is hidden.
- **Main pieces:** `Td` songs, `Vp` parser (L155@9574), `Ad` (L155@10069), sequencer `it` and stop `H` inside.
- **Size:** ~23 K chars including songs.
- **Depends on:** WebAudio.
- **Tangled with content:** clean (songs are data).
- **Fingerprint:** scheduler `setInterval 30 ms`, lookahead 0.15 s, step = `60/bpm/sub`. Note parse `A4=440`. 13 songs: wickhollow 70, peaks 56, desert 76, title 84, road 116, battle 144, boss 156, hearth 66, wilds 104, fen 58, town 96, dungeon 76, victory 132 (bpm).

#### Thareia sound studio (sfx) — audio
- **Does:** A second context: compressor (−16 dB, ratio 4) → master 0.85, a convolver reverb on a generated 2.4 s impulse (`rand·(1−t)^2.8`), a noise buffer, and per-voice routing `xh(pan, reverb, echo)`. Voices: oscillator `Pt` (glide, vibrato, filter, AM), noise `Nt`, FM bell `je`, plus arpeggio, chord, thud, click and whoosh helpers. It holds a catalogue of 182 named sounds in 18 categories, each with a human name and description, played by `Pd(id)` through per-sound gain from the loudness table `Xp`.
- **Main pieces:** L155@23696–27801 (core), L155@27801–61313 (catalogue), `Pd`/`Xp` (L155@61313–64242).
- **Size:** ~40 K chars (34 K of it catalogue).
- **Depends on:** WebAudio.
- **Tangled with content:** clean.
- **Fingerprint:** sound ids are kebab-case (`ui-cursor`, `ship-takeoff`, `dock-clamp`…). Loudness gains run 0.6–16 (e.g. `"ui-cursor":7.83`).

#### Thareia music player — audio
- **Does:** 25 instruments (`qp`: strings, stab, pad, harp, flute, brass, choir, bell, glock, bass, pbass, kick, snare, hat, shaker, taiko, tom, crash, wind, heart, doum, tek, frog, reed…) built on the sfx voices. Pieces are written as sections of bars whose parts come from helpers: `nn("C5:1 r:2 …")` notes, `oi` held chords, `zn` arpeggios, `ai`/`Zr` bass, `kd` stabs, and `Ne("x..X")` drum grids over chord names (`Yp`). The scheduler flattens the events and loops from section `loop`, through a tempo-synced echo (delay 0.75 beat, feedback 0.38, lowpass 2600) and the reverb. A new piece fades out the old one (0.6 s).
- **Main pieces:** `qp` (L155@64242), helpers (L155@66607), `Mh` (L155@68305), `wh`/`Hd`/`Vd` (L155@76476–78006).
- **Size:** ~14 K chars. **Tangled with content:** clean.
- **Fingerprint:** `setInterval 60 ms`, lookahead 0.3 s. 9 pieces: travel "Over the Wilds" 92, battle "Break the Grip" 150, flight "Sunstone Wind" 80, title "Thareia (main theme)" 76, boss "The Holder Wakes" 160, town "Market Day" 108, ruins "Beneath the Stone" 66, marsh "Gloomfen Drift" 84, desert "Sunscorch Road" 96.

#### Sound router (`Xd`, "createSound") — audio
- **Does:** One interface over both engines: `unlock`, `setEnabled`, `setMusicEnabled`, `music(id)`, `sfx(id)`, `duck`, `track`. A music id that names a Thareia piece plays there (except `victory` and `title`, or forced with `thareia:<id>`), unless that piece is already playing. Anything else goes to the synth. `sfx` prefers Thareia's catalogue unless `{synth:true}`. On this page: `flight`, `travel`, `marsh` and `desert` play Thareia pieces; `wickhollow`, `fen`, `wilds`, `hearth` and `peaks` play synth songs.
- **Main pieces:** `Xd` (L155@78006).
- **Size:** ~0.6 K chars. **Tangled with content:** clean.
- **Fingerprint:** a single Sound on/off button toggles both SFX and music. No volume sliders and no saved setting.

#### Asset loading — assets
- **Does:** All assets are data URIs. `mh(url, srgb)` promisifies `TextureLoader`; map, fx map, wisps and clouds load in parallel (map: trilinear, anisotropy 8, canvas copy for the minimap). Fonts via `FontFace`; skiff atlas loaded once, lazily (`ap`).
- **Main pieces:** `mh` (L4478@105809), start of `Op` (L4478@105913), `cb`/`hb` (L4478@120836).
- **Size:** ~0.8 K chars. **Fingerprint:** no loading progress; `#loading` fades when `body.ready` is set.

#### Test hook — debug/tests
- **Does:** `window.__airship` exposes `frame`, `advance(seconds, renderEach)` (steps 50 ms ticks, rendering only the last unless asked), `flyTo`, `takeOff`, `showCard`, `setZoom`, `endIntro`, `resize`, plus `stage`, `paint`, `ship`, `witch`, `nettie`, `state` and `places`. No tool in the airship repo drives it (`git grep` finds the page only in CLAUDE.md, README.md, docs/ships.md).
- **Main pieces:** L4478@120358–120712.

#### Misc utilities
- BufferGeometryUtils `xp` (mergeGeometries), `gp` (mergeAttributes) and `vp` (mergeVertices), stock three addon code (L4478@17925). Easing and colour helpers `he`, `ve`, `Li`, `an`, `me`, `$i` (L4478@23037). `K0` ellipse-to-polygon (L4374@67603). `Ni`/`Or` world position and quaternion helpers (L4478@26723).

### Content
| What | Where | ~lines |
|---|---|---|
| Map config: AVIF painting (3072×2048 per the commit), coordinates 4608×3072, fov 8 / pitch 52 / 12 px per m, bounds | `Wn` L4374@58300 | 0.1 K chars |
| 7 region names, 12×8 region grid | `ed`, `nd`, `Z0` L4374@58432 | 0.4 K |
| 19 places: 12 towns (dock pixel, `dockAlt`, `heading`, music, type, blurb, Notable/Rumour rows) and 7 sights (one hidden) | `ur` L4374@58810–66093 | 7.3 K |
| Drifting-light path (13 points, Wickhollow → Mother's Hollow); 18 cloud placements | `$0`, `J0` L4374@66093–66500 | 0.4 K |
| Magpie picture-sheet recipe (9 pieces, rim/keel/half outlines) | `Us` L4468@6771 | 1.1 K |
| Crystal row, lantern spots, sail corners, brass and wood colours | inside `cp` L4478@4058 | — |
| Witch, Inkblot and Nettie palettes (`fe`, `Ze`, `$t`) and move-duration tables | L4478@26997, @43333, @67359, @33845, @85095 | 2 K |
| 13 synth songs | `Td` L155@~360–9574 | 9.2 K |
| 182 described SFX in 18 categories, with the loudness table | L155@27801–64242 | 36 K |
| 9 orchestral pieces with chord progressions | `Mh` L155@66807–76406 | 9.6 K |
| Images (stripped): map AVIF ~755 KB, fx map, clouds, wisps, skiff sheet, witch face, witchfire sheet, Nettie portrait | L4374@58069, L4468@6713, L4478@13414 | — |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Palette tokens: night `#07050b`, plum `#3a1631`, cream `#ecdcb8`, gold `#e2bd67`, magenta, wild `#9ff0b0`; fonts Jacquard 12 (display) and Pixelify Sans (body) | L9–L27 | 19 |
| Town banners, sight pins, `.far` banners, minimap frame, region banner (3.2 s keyframe), tapmark, Land-button glow, card rise | L42–L104 | 60 |
| Phone layout: HUD moves under the title, minimap hidden below 560 px wide or 520 px tall, hint hidden | L106–L119 | 14 |
| Title "Moonlight in the Aether" / "The Magpie · over Aethermoor"; loading text "Charting Aethermoor…" | L125–L126 | 2 |
| Vignette 0.62 on the painting; hemisphere and moon light rig | L4478@105913+ | — |

### Shared-code clues
- The airship repo's commit `d3d27ca` (2026-10-06): *"reference/the-magpie-over-aethermoor.html is Chris's upload of 'The Magpie over Aethermoor' (finished version), kept as the model the ships are built from."*
- Envoi's commit `66bf0e5` (2026-10-02) says its copy's *"readable source is an earlier version in the read-only chriskizer91-ops/20-min repo, branch ccr-5afa0fa7-7ojc16 (src/airship/main.js, src/actors/airship.js)"*. That source is in the stripped Moonlight tree. Its `src/input.js` is `Np` token for token (including the unused `KeyB`→`backstage` and `KeyL`→`layers`). `src/actors/skiff-atlas.json` is `Us` number for number. `src/actors/airship.js` has `const STERN = -2.4, BOW = 2.7` and `createAirship({ lit = true } = {})`. `src/audio/sound.js` is `Xd` (comment: *"Two libraries, both from the New-game repo: Thareia's sound studio (vendor/thareia-sfx) … Aethermoor's synth (./synth.js)"*; same `'thareia:<id>'` rule and `musicPlaying() === t` check). `src/stage.js` has `setScreen` and `look`, but no `WORLD_FX`.
- The Magpie builder's source comment (Moonlight `src/actors/airship.js`): *"from Thareia's turnaround sheet (art/airship/skiff-sheet.webp, from the New-game repo's thareia/art-in/airship/ship-2-refitted-skiff.webp)"*.
- The audio catalogue and scores are Thareia's: `"ui-cursor":7.83` and `name:"Sunstone Wind"` also appear in the Thareia sound board, Thareia T1/T2, Moonlight, envoi (`src/game/thareia-audio.js`) and skies-polished `src/audio/thareia/music.js`.
- `window.__airship` and the text "The map couldn't start:" appear in this page (L4478@120881), in envoi's copy, and in Moonlight's `src/airship/main.js`.
- The witch, Inkblot and Nettie builders and the toon/ink kit are Moonlight's actors (`src/actors/witch.js` has `stir: 2.4` and `buildSpoon`; `src/actors/nettie.js:158–159` repaints the face from a sheet image, as `Fp` does).

### Notes
- **Byte-identical copies:** envoi's `reference/demos/the-magpie-over-aethermoor.html` on `origin/claude/send-note-gigdew` has the same blob (`3cd698db8520a9eca01898216a1f2d97879f4585`, 2,564,204 bytes) as this file. Envoi added it on 2026-10-02 (`66bf0e5`), four days before the airship repo did.
- **Dead code in the bundle:** the Stage's reveal mode and guides, the cutouts (empty), the B and L keys, the actors' battle moves and fx, the 40 synth SFX and most of the 182-sound catalogue. Only 8 sound ids are used (`map-open`, `ship-takeoff`, `sails`, `ui-confirm`, `ship-land`, `dock-clamp`, `deck-steps`, `new-area`).
- **Two audio engines**, two AudioContexts, each with its own compressor and noise buffer.
- No save, no settings persistence and no gamepad. Every random number is `Math.random`, except two seeded Park–Miller LCGs (noise texture seed 20261002, skirt zigzag seed 7).
- L1/L4482 wrap the page in an outer document (apparently saved from a published artifact); envoi's copy too.
- The places table includes a hidden sight, "Mother's Hollow" ("A light in the willows"), and the drifting lights lead there. Envoi's CLAUDE.md retires the Drowned Mother's lore, so the envoi copies of this data need care when reused there.

### Drift between the copies
Envoi's `reference/demos/the-magpie.html` (stripped `the-magpie/the-magpie.html`, 4,401 lines, title "The Magpie"; cited `env Lnnn@offset`) is an **older build** of the same page: "The Magpie · down the Sable", the Gloomfen region only. Both bundle three.js r186. The differences between them in the three.js lines (L4278–4312 vs env L4237–4277, etc.) are minifier names and wrapping only. The envoi build imports the whole `THREE` namespace (`window.__airship.THREE`, env L4398@189696) where this one is tree-shaken. Shared modules compared with identifiers normalised:

| Area | This page (airship copy) | Envoi copy | Same? |
|---|---|---|---|
| Model kit (`$`, `Bt`, `Os`, `ks`…) | L4478@0–3012 | env L4398@0–3012 | identical |
| Magpie recipe `Us` | L4468@6771 | env L4388@5220 | identical numbers |
| Magpie builder | `cp({lit})` L4478@4058 | `C3()` env L4398@4058 | same except `lit` (envoi is always lit) |
| Inkblot, BufferGeometryUtils, `Np` keys | L4478@43333 / @17925 / @104949 | env L4398@41919 / @32941 / @100259 | identical |
| Witch | L4478@26997 | env L4398@17560 | airship adds the `stir` move and spoon `Gy` |
| Nettie | painted canvas face, repainted from portrait `ud` (L4478@81835) through the `repaint()` that airship's `wp` helper adds (L4478@24590) | canvas face only, `wp` has no `repaint` | airship newer |
| Stage | `lh`: `renderer`/`fx` options, WORLD_FX shader, `setScreen`, `look`, noise `by` | `Ef` (env L4370–4388): none of these | airship newer |
| Audio | `Xd` skips restarting a Thareia piece that is already playing (`Hd`), has a `track` getter; WOFF fonts | restarts the piece; TTF fonts (env L4339@58287) | otherwise identical (182 sfx, 13 + 9 tracks) |

Behaviour of the map mode (`Op` L4478@105913 vs `hw` env L4398@179554):

| Behaviour | This page | Envoi copy |
|---|---|---|
| **Map** | whole Aethermoor, 4608×3072 coordinate space (AVIF), fov 8, pitch 52, bounds `x0 90…y1 3000` (L4374@58300) | `art/map/world-night.webp` 1536×1024, fov 34, pitch 32, bounds `x0 70…y1 975` (env L4339@58522) |
| **Places** | 19: 12 towns + 7 sights with type, region and Notable/Rumour rows (L4374@58810) | 9: Wickhollow, Bogmire, 6 "wild" places (on-foot areas with foes, herbs, `near`), 1 sight (env L4339@58650) |
| **Flight constants** | cruise 9, full sail ×1.8 (Shift or long legs), turn 1.6, ship scale 1.7, throttle `d/14`, arrive `.4+.1v`, speed lag 1.2 (L4478@105698, @113873) | cruise 4.5, no boost, turn 1.5, scale 1.6, throttle `d/9`, arrive `.35+.12v`, lag 1.4 (env L4398@179448, @185988) |
| **Controls** | tap-to-fly (34/scale px hit, drag-cancel), pinch, wheel, +/-, Shift, M, minimap tap (L4478@112038–113183) | every pointerdown flies, 45 px hit, no zoom, no Shift or M (env L4398@185403) |
| **Landing/docking** | same lerp and thresholds; town near <10 m, sight card <6, close >10; sight card slows her ×0.35 | same lerp and thresholds; near <9, card <5, close >9; no slowdown |
| **Nettie at Bogmire** | appears, "Nettie climbs aboard with her staff and lantern." (L4478@111445) | appears and plays `cheer`, quote `"Took your time."` (env L4398@185000) |
| **Cards** | sub `type · region (· docked)`, data rows, Fly-to = Bogmire or nearest town; Nearby list of 3 (L4478@109873, @110695) | sub "Docked/Town/Seen from the air/Wild place · on foot from X", rows Foes/Herbs/On foot; Fly-to toggles Wickhollow↔Bogmire; fixed two buttons (env L4398@183537) |
| **Music** | same two flying tunes; docking plays each town's track (wickhollow, marsh, fen, wilds, hearth, peaks, desert) | same tunes; only wickhollow and marsh |
| **Camera** | lookahead .7, zoom `/(640\|1150)` clamped 1–9, user zoom 0.3–1.6, overview intro 1.6 s (L4478@117933–118423) | lookahead .6, zoom `/(580\|760)` clamped 1–2.6, no intro (env L4398@187671) |
| **Extras only here** | minimap, region banner, `.far` labels, WORLD_FX, vignette .62, ship glow disc (shadow hidden), 18 fading clouds, `advance()` test hook | — |
| **Extras only in envoi** | — | 2 marsh-light sprites circling each wild place (env L4398@180298); ship shadow kept at ×0.55; 6 clouds (3×2 sheet); unused embedded images `hildeAgnes`, `sparks`, `mothsFireflies` (env L4339@58403) |

### Descendants
- **Moonlight in the Aether** (`stripped/moonlight/source/src/airship/`, 20-min @ `1fe3222`) is the **source, not a copy**. Both pages are builds of its modules at different times.
  - `airship/mode.js` is the readable form of the *envoi* copy's map mode. Its constants `CRUISE = 4.5`, `CRUISE_ALT = 7`, `TURN = 1.5`, `SHIP_SCALE = 1.6` and `TUNES` are envoi's `ow`, `lw`, `v5`, `cw`, `Df`, and the step and landing code reads line for line like env L4398@185988. It adds game hooks: `fly({from, nettie, lightsHome})` returning a promise, `goAshore`/`btn-ashore`, `active`, a passed-in `renderer`, and lights that flow back once "home".
  - `actors/airship.js`, `witch.js`, `nettie.js`, `input.js`, `audio/sound.js` and `stage.js` already match *this* page's newer actor and audio versions (`lit`, `stir`, the painted Nettie face, the `musicPlaying` check, `setScreen`/`look`). They lack only the WORLD_FX stage.
  - This page's Aethermoor-wide map mode (minimap, regions, boost, intro, `advance`) is not in that tree; per envoi's note its source is a later, unseen revision.
- **Airship game's ship builder** (`skies-polished/source/polished/src/ship/`): **reimplemented** on the Magpie's recipe.
  - `hull.js:1` says *"a ship's hull, shaped the Magpie's way from outlines measured off its pictures: how wide it is from above (half), how high its deck edge is (rim) and how deep its keel is (keel)"*. The section's round part is `half·cos(a), … − bowlD·sin(a)^p` with `p = H.fullness ?? 0.75`, the Magpie's 0.75 exponent.
  - Changed: outlines are in metres per ship recipe (`ships/skiff.js` etc.), not sheet pixels. A straight wall runs down to a wale before the bowl, with tumblehome. Hulls wear tiled painted planks (with relief normals from the paint, `materials.js`) instead of a projected side view. There are 3 detail levels, and everything is batched into one mesh per material (`build.js` `LEVELS`, `FINE`).
  - `build.js:35` has *"Embers: sparks of sunstone light drifting up off every crystal, as on the Magpie"*, moved from a CPU list of at most 110 to a GPU `Points` shader.
  - Other borrowings in that game: `game/world.js:19` *"The regions, a 12 x 8 grid over the map read off Chris's painting (names from the Magpie page)"*, with the same 7 names as `ed` and a re-read grid. `audio/thareia/music.js` and `sounds.js` are copied unchanged, per its NOTE.md. Same Thareia lineage as this page's audio.
- **Envoi's world-map flight** (`stripped/envoi/source/src/`):
  - `models/magpie.js` is the **model, copied** with technical changes only. Its header: *"Chris's model from the 20-min repo (branch ccr-5afa0fa7-7ojc16, src/actors/airship.js …) unchanged in shape and paint. Only the technical changes for this game's three.js r128: one plain script instead of modules, the toon shader's rim hooked on r128's output_fragment chunk, its two point lights scaled …"* (`LIGHT_K = 0.2`). Its `ATLAS` is `Us` verbatim. Also identical: `ROWS = 44, COLS = 12`, the `1.25` row bunching, the crystal `ROW` table, `new Spring(8, 4), pitch = new Spring(10, 5)`, `makeMagpie({ lit = true })`.
  - `game/fly.js` **reimplements** the flight, *"after Chris's world travel demo (reference/demos/the-magpie-over-aethermoor.html)"*. From this page it takes the map frame (`PPM = 12, WW = 4608, WH = 3072`, `PITCH = 52°`). From the older page it takes the constants (`CRUISE = 4.5, ALT = 7, TURN = 1.5, SHIP_SCALE = 1.6`) and the hemisphere and moon light values.
  - Changed in `fly.js`: r128 globals. A plain textured ground plane under its own perspective camera instead of the painted Stage and PaintCamera. Takeoff and landing as climb and descent at 3 m/s. An on-screen 4-way pad (faster/slower/turn, CRUISE ×1.6 / ×0.35). Turn law `diff*2.5`. "Cold mist" over bands not yet open, which turns her back. A minimap from an RLE land mask. Zoom buttons. 26 random clouds. Landings come from `opts`. It returns a promise of the landing id.
- **Thareia's `art-in/airship/the-magpie-3d.html`** (New-game `origin/claude/tender-babbage-4wiplk`, blob `716dc37c`, 2,466,085 bytes, added 2026-09-30 in `068ab30`): **another, earlier build of the envoi-era page**, not this one. Checked by grep on lines cut at 300 characters.
  - Same 4,401-line shape and head, title "The Magpie", raw line 94 *"The Magpie · over the Gloomfen"*.
  - Adds a `btn-time` "Time of day" button (raw line 96) cycling `night`/`dusk`/`day` grades (`Zd={day:{name:"Day",tint:[1,1,1],saturation:1,…},dusk:{…},night:{…}}`) over `art/map/gloomfen-region.webp` 1536×1024 (fov 16, pitch 42).
  - Same flight constants as envoi (`eS=4.5,tS=7,…b3=1.5,nS=1.6`) and the same wild places (`the-lantern-path` …). It has no `#error` box.
