## Moonlight in the Aether (the whole night)

**What it is:** an FF9-style game of 20–40 minutes. Code-built 3D (three.js) characters walk over painted backgrounds, behind depth cut-outs, through field screens joined by doors. It has talking, gathering, Hag-Sight, brewing, Quill's swap shop, a skiff flight over a painted map, turn-based battles on Aethermoor's rules, and typed cut-scenes, all in one page.
**Inventoried:** `20-min` @ `origin/ccr-5afa0fa7-7ojc16` (`1fe3222`, 2026-10-01), `dist/game.html`. Full size 14,778,472 bytes; stripped 1,938 KB, 5,561 lines, with 97 data URIs removed (92 webp, 3 png, 2 ttf). Lines 1–746 are the HTML/CSS shell with four `<template>`s. Lines 747–5561 are one minified esbuild IIFE (three.js, vendor and game code; 26 long lines). **Line numbers refer to the stripped source files** under `stripped/moonlight/source/` (`src/…`, `game.html`; 100 files, 30,284 lines). The vendored code (`vendor/…`) is not in the stripped tree; I read it with `git show` and diffed it.
**Tech:** three.js **r186** (`three` 0.186.1, not r128) on WebGL. ES modules are bundled by esbuild 0.28.2 (`iife`, `minify`, `dataurl` loader for webp/png/ttf; tools/build.mjs). 2D canvas is used for the title, the cut-scenes and generated textures, and the HUD is DOM. The only outside library is three.js (plus examples' `BufferGeometryUtils`). Two pieces of Chris's own code are vendored from New-game: Aethermoor M7's rules and Thareia's sound studio.

### Coverage
- **Read fully:** `src/` input, gpu, main, paint, layers, walkmesh, stage, screen, field, town, items, assets; `game/{state,main}.js`; all 6 `battle/*` files; `airship/{mode,main}.js`; `audio/sound.js`; `brew/rules.js`; `title/{player,screen,mode}.js`; `areas/common.js`; `actors/{kit,registry,registry-foes,foes,party-crow}.js`; the `wickhollow.js` demo host. Also README.md, docs/HANDOFF.md and the vendor READMEs/NOTE.
- **Skimmed (by line range):**
  - `audio/synth.js`: header, plus a full diff against Aethermoor's `core/audio.js`.
  - `brew/`: recipes 1–60, ui 1–60 and 664–740, view 1–30, main 1–25. `swap/`: swaps 1–60, ui 1–40 and 355–367, icons 1–20. `title/`: sky 1–40, scenes 1–30, grimoire 1–20.
  - `areas/`: bogmire 1–130, 421–770, 955–1072; gloamwood 1–60, 127–200, 610–630; wickhollow 1–80, 142–200; hollow 1–25, 115–135.
  - `actors/`: witch 1–60 and 211–300; airship 1–40; foes-common 1–22, 94–147, 240–300; bosses-kit 15–34 and 560–575; party-kit 1–35.
  - Also: the bestiary and viewer headers, places.js 1–40, the game.html shell, and the BALANCE.md and PLAN.md headings.
- **Vendored:** I diffed all of `vendor/aethermoor/src` and `vendor/thareia-sfx` against the stripped Aethermoor and Thareia copies and New-game history, and read every diff. In Aethermoor's identical copy I read combat.js L21–66, L184–222 and L318–410; battle.js L126–142, L226–240 and L329–345; and rng.js and dice.js. I also grepped tuning.js and skimmed witch.js L1–130.
- **Tools and tests:** header comments and test names only. The 18 `scenes/*.json` were summarized by script.
- **Skipped:** about 28 model files in `actors/` (measured, not read), the minified dist bundle, most dialogue tables and scene bodies, LORE.md and SLICE.md, vendored data tables, the UI rendering and CSS, and the test bodies.

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| `paint.js`, `walkmesh.js`, `layers.js`, `stage.js`, `screen.js` | systems | painted-scene engine: camera, walkmesh + A*, cut-outs, compositor, screen builder | 1,001 |
| `field.js` L1–676 / L678–795 | systems / content | talk, typewriter, tap-walk, gather, bag, exits, crow AI / the square's cast and dialogue | 676 / 118 |
| `town.js`, `input.js`, `gpu.js` | systems | screens joined by doors, followers, footsteps, model portraits; keys; GPU freeing | 421 |
| `game/main.js`, `game/state.js` | systems | screen manager and host, swirl/result/defeat, menu, hints, hot reload; the night's record and save | 878 |
| `areas/*` (common 142, wickhollow 686, gloamwood 764, hollow 220, bogmire 1073) | content + mechanics | screens, casts, dialogue, flags; Hollowed patches; Hag-Sight fog; lanterns repainted | 2,885 |
| `battle/*` (director 601, mode 290, encounters 255, main 92, fx 88, engine 50) | systems + content | battle screen and director over vendored rules; B1–B6b; level curve | 1,376 |
| `airship/*`, `data/places.js` | systems + content | skiff flight over the painted map; places | 578 |
| `audio/sound.js`, `audio/synth.js` | systems | sound facade; Aethermoor synth plus Wickhollow additions | 596 |
| `brew/*` (ui 810, view 213, rules 209, recipes 136, main 121, hearth.json 57, assets 40) | systems + presentation | Pick Your Poison: rules, cauldron overlay, 3D view, demo | 1,586 |
| `swap/*` (ui 588, swaps 382, main 251, icons 250) | systems + presentation | swap shop: rules and catalogue, shop UI, pixel icons | 1,471 |
| `items.js`, `data/herbs.js`, `assets*.js` ×6 | content / assets | item ids, basket slots, herb table, data-URL imports | 240 |
| `title/*` (mode 297, grimoire 256, player 194, sky 193, scenes 123, screen 100, art 65, main 35, bake-art.py 43) | systems + content | title, canvas shot stack, cut-scene player, sky, grimoire page, 4 scenes | 1,306 |
| `actors/*` (44 files incl. `skiff-atlas.json` 333) | 3D models in code | party 3,321; foes 3,371; bosses 3,909; people 3,157; props 1,839; kit 274; registries 57 | 15,928 |
| `main.js`, `wickhollow.js`, `gloamwood.js`, `bogmire.js`, `bestiary.js`, `viewer.js` | demo hosts | one entry per demo page | 470 |
| `source/game.html` | presentation | shell CSS and 4 HUD templates copied from the demo pages | 753 |
| **Total stripped source** | | | **30,284** |
| `vendor/aethermoor` (src: core 775, rules 5,043, data 13,225 incl. maps 4,554; test 2,043) | vendored rules | Aethermoor M7 battle, loot, progression (maps not bundled) | 21,086 |
| `vendor/thareia-sfx` | vendored audio | 100+ code-made sfx, live music, sound board | 866 |

### Systems

#### Painter's camera — rendering / camera math
- **Does:** Builds the perspective camera that "took" a flat painting from `fov` (vertical), `pitch` (degrees down) and `ppm` (painting px per meter at centre), aimed at the origin. It converts pixel → ray → ground at height h (or any plane), and 3D → pixel. `heightAbove` measures a lamp's height from its foot pixel.
- **Main pieces:** `PaintCamera` paint.js L9–61 (`ray` L26, `toWorld` L34, `toPlane` L41, `toPixel` L46, `heightAbove` L52); `ring` L64 (points or `{ellipse}`).
- **Size:** 74.
- **Depends on:** three.js.
- **Tangled with content:** clean.
- **Fingerprint:** camera distance = (H/2 / tan(fov/2)) / ppm; near is ×0.25, far ×2.5. Cameras: the square 15°/30°/70; field screens fov 26–50, pitch 8–32, ppm 62–160; every battle 34/8.7/85; the map 34/32/12. Paintings are 1448×1086 or 1536×1024.

#### Walkmesh, sliding collision, A* tap-to-walk — collision / pathfinding
- **Does:** Triangulates the scene's pixel polygons (holes allowed; per-corner heights give stairs) into a 3D floor and keeps its boundary edges.
  - `canStand` checks the floor, edge distance ≥ radius, and round obstacles.
  - `step` slides along walls: it tries ±0.5 and ±1 rad turns at 0.8× length, then each axis, then the nearest wall's direction.
  - A* runs on a grid laid over the floor, with no corner cutting, then straightens the path by line of sight.
- **Main pieces:** `Walkmesh` walkmesh.js L8–227 (`locate` L28, `canStand` L49, `step` L61, `wallDirection` L86, `buildGrid` L114, `findPath` L159, `clearLine` L206, `raycast` L216); `boundaryEdges` L248; `Heap` L268.
- **Size:** 297.
- **Depends on:** PaintCamera.
- **Tangled with content:** clean.
- **Fingerprint:** polygon navmesh plus a 0.2 m grid inflated by the player radius 0.18 (town.js L27); obstacles are checked live. A* uses an octile heuristic, diagonal cost 1.414 and a 40,000-step cap. Line of sight is sampled every 0.08 m at 0.9 r, and heights are barycentric.

#### Cut-out layers (FF9 walk-behinds) — rendering
- **Does:** Turns each outline into an upright card through its `base`: a point (the card faces the camera) or a ground line. The card samples the painting at its own painting coordinates, so it is invisible.
  - Against the actors' depth texture it discards where an actor is nearer and covers actors behind it.
  - "Layers" mode tints the cards.
- **Main pieces:** shaders layers.js L17–50, `buildCutouts` L52, `basePlane` L90. Render layers ACTORS 0, CUTOUTS 1, GUIDES 2, BACKSTAGE 3 (L12–15) and GLOW 4 (stage.js L4).
- **Size:** 102.
- **Depends on:** PaintCamera, Stage depth target.
- **Tangled with content:** clean.
- **Fingerprint:** `if (gl_FragCoord.z >= actor) discard`. Uniforms `painting, paintViewProjection, actorDepth, screenSize, compareDepth, tint, tintAmount` (the same names appear in the Magpie page).

#### Stage compositor and camera — rendering / camera / effects
- **Does:** Draws each frame in passes:
  1. actors into a half-float target with a depth texture;
  2. the painting as a screen quad, cropped to the scroll window and graded (tint, saturation, lift, vignette);
  3. actors composited premultiplied, converted to sRGB;
  4. cut-outs;
  5. glows.

  The painting fills the screen ("cover") and scrolls. Other features: zoom glide, shake, a `look(pixel)` override, `setScreen` (one renderer can be shared), and "Behind the scenes", which flies a second camera out of the painter's frustum into an orbit (drag, pinch, wheel).
- **Main pieces:** `Stage` stage.js L16–313 (`setScreen` L93, `resize` L104, `makeTarget` L130, `setFocus`/`look`/`scrollTo` L158–179, `update` L181, `render` L225, `renderReveal` L256, `orbitBy`/`zoomBy` L302).
- **Size:** 325.
- **Depends on:** layers.js, PaintCamera.
- **Tangled with content:** clean.
- **Fingerprint:**
  - DPR is capped at 2 and `antialias:false`. "Pixels 1×/2×" sizes the actor target to window/pixelSize with Nearest filtering.
  - The camera follows a focus 0.8 m above the player with `1−e^(−4dt)`, no deadzone, clamped to the painting and snapped to character pixels.
  - Zoom eases with `1−e^(−3dt)`. Shake is ±shake·(18, 12) px, decaying 1.4/s. The reveal takes 1.6 s, cubic.
  - Lights Out grade: tint 0.5/0.48/0.72, vignette 1.2 (battle/mode.js L92).

#### Screen builder, lights and walking — rendering / walking
- **Does:** `buildScreen` turns a scene JSON into a camera, walkmesh, world, cut-outs, guides, backstage props and lights. `walkPlayer` steps her by keys or along the tapped path; through wide lenses, keys follow the screen (`screenDirection`). Lights are a hemisphere, the moon, and a flickering point light plus glow per lamp.
- **Main pieces:** screen.js `WALK_SPEED` L13, `buildScreen` L15, `walkPlayer` L33, `screenDirection` L67, `loadTexture` L74, `loadFonts` L85, `buildGuides` L93, `buildBackstage` L117, `addLights` L171.
- **Size:** 203.
- **Depends on:** the engine above and kit.js.
- **Tangled with content:** clean.
- **Fingerprint:** 2.3 m/s. Turning uses `turnToward` at rate 18 (keys) or 14 (path). Flicker is 1 + 0.05 sin 7.3t + 0.04 sin 13.1t.

#### Field (people, talk, gather, bag, exits) — dialogue / interaction / inventory
- **Does:** Runs a screen's cast (`enter`, `update`, `leave`, `labels`, `locked`, `music`, `ambience`).
  - **Talking:** the nearest thing in reach that she faces, or a tapped thing; she walks over and the two turn to face each other.
  - **Dialogue:** a typewriter with voice blips. Lines are strings or `{say, who, face, mood, voice, do}`; first/again sets go by visit count.
  - **Gathering** and a shared bag `{id: n}` (`count/has/give/take`) with a basket HUD.
  - **Exits** are pixel polygons with lock lines; place-name banner and toasts.
  - **Inkblot** hops and flies with a small perch AI. Additive `Sparks`.
- **Main pieces:** `Field` field.js L26–636 (`enter` L47, `leave` L81, `addPerson` L95, `plantHerbs` L119, `onKey` L140, `bindPointer` L162, `tap` L214, `walkTo` L235, `talk` L267, `advance` L290, `showSpeaker` L312, `gather`/`pick` L328–350, bag L353–392, `update` L407–470, crow L473–540, `afterRender` L543, `buildHud` L587); `Sparks` L639; `pointInPolygon` L669.
- **Size:** ~676.
- **Depends on:** Walkmesh, Stage, audio, items, herbs, and fixed DOM ids (`talk`, `basket`, `bang`, `toast`, `place`…).
- **Tangled with content:** needs some untangling: the `SQUARE` cast, the `DIALOGUE` table and a crow live in the same file, with hard-wired DOM ids.
- **Fingerprint:** reach 1.15 m (facing dot > 0.2, or within 0.35 m). The typewriter runs at 42 chars/s with a blip on every 2nd letter. A tap moves < 12 px in < 450 ms, with a pick radius of 44 px/scale. Sparks: a Points pool of 60, gravity 7, life 0.3–0.7 s.

#### Town (screens joined by doors, followers) — maps / transitions / party
- **Does:** Builds each screen once and keeps it. Neighbours are prebuilt 1.5 s after arrival (`'near'` in the game, `'all'` in demos), and far paintings' GPU copies are dropped.
  - A door fades to violet, swaps painting, floor and cast, places her at `arrivals[from]`, and walks her in.
  - Followers walk her breadcrumb trail. Footsteps change with each scene's floor.
  - `where()` gives the save position. `modelPortrait` renders a model's face into a portrait data URL per mood.
- **Main pieces:** `Town` town.js L33–303 (`screen` L47, `rest` L60, `warmNeighbours` L69, `start` L75, `go` L101–137, `where` L163, party L170–248, `frame` L251, `pause`/`resume` L281); `bootTown` L306; `modelPortrait` L322.
- **Size:** 376.
- **Depends on:** Field, Stage, screen, witch model, input.
- **Tangled with content:** clean.
- **Fingerprint:** fade out 450 ms, in 650 ms; footsteps every 1.12 s. The trail holds ≤ 80 points; follower i keeps 0.95 + 0.85i m behind at ≤ 2.3 × (1.15 + 0.15i) m/s. dt is clamped to 0.05.

#### Area/host framework — quests / story flags
- **Does:** An area is `createX(host) → {screens, images}`. The host (the game or a demo) provides `state(name, defaults)`, `flags`, `joined`, `join`, `encounter`, `brew`, `shop`, `fly`, `cutscene`, `rest` and `storyFloor`; demos stub these with encounter cards. Shared helpers:
  - `flagSet`: an array saved as JSON, used like a Set.
  - Hollowed herb patches: Moonlight reveals the rot, witchfire burns it off, then the herb blooms.
  - `facing` and `stepAside`.
- **Main pieces:** areas/common.js contract L8–25, `facing` L41, `stepAside` L53, `flagSet` L67, `plantHollowed` L78, `cleanStep` L105; the game's host `makeHost` game/main.js L195.
- **Size:** 142 + 21.
- **Depends on:** Field.
- **Tangled with content:** the contract is clean; the four areas (2,743 lines) are deeply story-bound.
- **Fingerprint:** area records are `{...structuredClone(defaults), ...saved}` (main.js L201). A fight met but not won is forgotten on load (bogmire.js L82–83).

#### Game flow and screen manager — game loop / menus / transitions
- **Does:** One rAF loop calls `game.current.frame(now)`. Four screens take turns: the title (on its own 2D canvas), and the field, battle and map (sharing one WebGL renderer). Each screen's HUD comes from a `<template>`, and only the one on show is in the DOM. It also runs:
  - New/Continue and the cut-scenes;
  - the FF9 swirl into battle, the result box, and defeat (bag snapshot restored, everyone mended, wake at the last rest);
  - the first flight's "Skiff Wakes" scene and the ending;
  - the M menu (HP/MP bars, kept items) and the "Next:" hints;
  - hot reload via `window.claude.hot`, and reload-to-title through sessionStorage.
- **Main pieces:** game/main.js `hud`/`show` L47–65, `fade` L67, `reloadTo` L83, `boot` L105, `startField` L145, `save` L175, `setParty`/`join` L229–262, `rest` L265, `brew` L273, `shop` L309, `cutscene` L348, `fly` L369, `encounter` L418–475, `swirl` L478, `showResult` L493, `ending` L539, `bindMenu` L558, `nextStep` L612, playtime L629, hot reload L638–645.
- **Size:** 645.
- **Depends on:** everything.
- **Tangled with content:** deeply tied: route flags (`b3`, `b6`, `skiffAwake`, `lightsHome`, `ending`) and wording are inline.
- **Fingerprint:**
  - Variable timestep; dt is clamped per mode (0.05; title 0.1). Paused via `town.pause()`.
  - Playtime ticks 1/s while visible.
  - CSS fade 0.45 s (slow 1.1 s). Swirl: a canvas snapshot `rotate(540deg) scale(2.6) blur(10px)` plus a violet-white flash over 1 s (game.html L41–46).

#### Night record and save — save / load / stats
- **Does:** Keeps the night in one plain JSON object. It folds a battle in:
  - HP and MP are carried; every member gets the full XP, and level-ups add HP/MP.
  - Used brews are removed; gathered herbs are added; Aethermoor consumables map to the nearest brew; relics and gear are recorded.

  It also handles join, rest, story XP floors, and the lost-fight bag snapshot. A fight only gets the moonwater the three required brews can spare.
- **Main pieces:** game/state.js `SAVE_KEY` L19, `newGame` L27, `save`/`load`/`clearSave` L52–75, `moonwaterNeeded`/`battleBag` L93–107, `relicsOf` L114, `maxOf` L122, `partyFor` L139, `join` L146, `restParty` L152, `storyFloor` L156, `afterBattle` L169–225, `snapshot`/`afterDefeat` L228.
- **Size:** 233.
- **Depends on:** encounters.js, vendor progression and witch data; no DOM.
- **Tangled with content:** needs some untangling (relic ids, the three required brews).
- **Fingerprint:**
  - **Storage:** localStorage `moonlight-in-the-aether:save`, one slot, JSON `v: 1`.
  - **Load:** rejects `v !== 1` or a missing `where`, then merges onto `newGame()`. There is no migration.
  - **Fields:** `v, playtime, where{screen,pixel,heading}, rest{…,name}, bag, swaps, grimoire, picked[], visits{}, seenHerbs[], flags{}, areas{}, party[], heroes{id:{xp,hp,mp}}, fights{}, gear[], seen[]`.
  - **Autosave** fires on every bag change (`field.onBag`, main.js L161), screen change, rest, brew, swap, join, win, cut-scene and landing.
  - sessionStorage `moonlight-in-the-aether:next` holds the next step after a reload.

#### Battle rules (vendored Aethermoor M7) — battles / AI / loot / RNG
- **Does:** All hit, damage and turn logic is **Aethermoor's code imported unchanged as modules**, not reimplemented (battle/engine.js L3, encounters.js L11–19). The copy matches **Aethermoor M7 (New-game `claude/cool-ptolemy-uc93gg` @ 49195c1)** file for file, apart from these additions, each tagged `// ADDED for the 20-min game`:
  - new `data/witch.js` (237 lines: party, gear, skills, relics, brews);
  - new `data/moonlight-foes.js` (168: Omen `hollowed`, `flustered`/`unseen`, variants);
  - 1–2-line merges in heroes, items, relics, skills, foes, omens, statuses;
  - `rules/battle.js` +1 (target `ally-any`);
  - `rules/combat.js` +16 (an Omen's own `weak` ×1.5, `struck`, `breakOmens`/`stripOmens`, `cleanse.omens`).

  The 5 vendored test files are byte-identical.
- **Main pieces (Aethermoor line numbers; the vendored copy is +0–3):** `rollInitiative` battle.js L134, `timeline` L226, `advance` L329; `damageMult` combat.js L49, `dealDamage` L184, `rollAttack` L357, `resolveAttack` L376; `createRng` core/rng.js; `rollD20` core/dice.js.
- **Size:** rules 5,043 + core 775 + data.
- **Depends on:** nothing in the page (pure and seeded).
- **Tangled with content:** clean.
- **Fingerprint:**
  - **Turns:** a CTB ribbon. Initiative is d20 + (speed − 10), and `next = initBase − initPerPoint·init`. Each action adds `unitDelay(moveDelay)` (ribbon `baseDelay` 100, `speedDelay` 4 per speed point above 10). A natural 1 adds 25.
  - **Attack roll:** d20, with advantage/disadvantage as 2d20 keep high/low (hexed = disadvantage), plus bonus against Guard (base + status guard). A natural 1 fumbles; ≥ critRange crits (heroes 20 − crit, foes 20); ≥ Guard hits; ≤ 3 short is a **graze**; otherwise a miss.
  - **Damage:** level-scaled dice (a crit doubles the dice count) + flat (hero: stat mod + dmgOther or the weapon's flat; foe: `dmg`), × `eff.mult`. A graze is ×0.5 with no riders. Then × `damageMult`: armour chart × aspect wheel (1.5 or 0.5; the same aspect counts 0.5) × weak 1.5 / resist 0.5 / immune 0 × (1 − hero resist%, max 60) × [the game's Omen weak 1.5]. Minimum 1. Guarding scales it; a ward absorbs.
  - **RNG:** mulberry32 seeded with an FNV-1a string hash, with `fork`.

#### Encounters, party builder, level curve — battles / stats / balance
- **Does:**
  - Defines B1–B6 and B6b: Aethermoor foe families with levels, variants and omens; the party; a "typical" bag; flags `noFlee`, `required`, `firstStrike`.
  - Builds level-L heroes the Aethermoor way: average hit die, +1 to an ASI pair every 4th level, skills by level, gear from a fixed seed, relics equipped.
  - Computes the XP curve for the "typical" and "brisk" paths, with story floors.
  - `nextForm` carries HP, MP, surge, bag and grip meters into B6b.
- **Main pieces:** encounters.js `ENCOUNTERS` L31–118, `STORY_FLOORS` L128, `curveFor` L139, `CURVE` L157, `makeHero` L166, `makeParty` L196, `partyFor` L209, `startEncounter` L218, `nextForm` L237.
- **Size:** 255.
- **Depends on:** vendor rules and data.
- **Tangled with content:** mixed: the table sits next to the builders.
- **Fingerprint:**
  - XP to the next level is `30 × L^1.55`: L2 at 30, L3 118, L4 283, L5 540. A fight's XP is tier × level, +20% per Omen.
  - Story floors: B2 → L2, B4 → 160 XP.
  - Stats are STR, DEX, CON, INT, WIS and CHA, plus hpDie and MP `{base, perLevel, stat}`: witch WIS 16 d10; Inkblot DEX 16 d8 +1 speed; Nettie WIS 16 d8.
  - Gear rng `gear:${id}`. The game's fight seed is `Math.floor(Math.random()*1e6)` (game/main.js L438); the demo uses `7 + 13·runs` (battle/mode.js L202).
  - `ctx.gentle: true` (nothing shatters).

#### Battle director and battle screen — battles / UI / animation
- **Does:** Plays the rules' event stream on the 3D stage and HUD, one handler per event: `turn`, `intent` (dN · face · move), `move`, `roll` (badge "d20 rolls → kept + bonus = total vs Guard · result"), `damage` (Weak/Resisted, shake), `heal`, `status`, `ko` (a "beaten" line; nothing dies), `escape`, `spawn`, `omen`, `phase`, `grip` (a meter on the relic part), `disarm` and `revive`.

  The witch's commands are renamed: Witchfire, Moonlight ▸, Gather, Brew ▸, Be Still, Full Moon, Slip Away. Companions get flat lists. Targets are chosen by arrows or tap. The ribbon shows the next 8 turns (portraits or initials).

  The screen stands the models on backdrops that share one camera (pulled inward on portrait screens), sweeps the zoom in, plays B6 → B6b as one fight, and dims the lamps for Lights Out. `Fx` draws bolts, moon rings, floating flames and sparkles.
- **Main pieces:** director.js tables L7–47, `run` L69, `play` L102, `on_*` L109–333, `chooseCommand` L337–417, `targetKey`/`tapAt` L420–439, HUD L443–585. mode.js `SCENES`/`BACKDROP`/`FOES` L45–64, `useScene` L82, `stageFight` L130, `form` L170, `fight` L200, `frame` L244, keys L256. fx.js `Fx` L5.
- **Size:** 979.
- **Depends on:** engine.js re-exports; Stage and cut-outs; model API `play/intents/grip/dropRelic/phase/setHollowed`; battle.html DOM ids.
- **Tangled with content:** needs some untangling: sound, move and "beaten" tables per family; menus per hero.
- **Fingerprint:** event-driven with `await wait(ms)` (roll 420, damage 380, KO 700). Gather plays like FF9's Steal (an athame dash, the herb chosen by foe family). Music: 'boss' for B3/B6, else 'battle'.

#### Skiff flight over the painted map — airship / camera
- **Does:** A 1536×1024 night map is shown through a PaintCamera. The code-built skiff (witch, Inkblot, optionally Nettie on deck) flies to a tapped spot, by keys, or to a chosen town, then lands at the dock and offers "Go ashore". Town and wild cards list foes and herbs. Wisps drift; painted flames follow a Catmull-Rom river path (reversed once the lights have gone home); clouds have shadows. There are two flight tunes.
- **Main pieces:** airship/mode.js constants L29–33, set-up L39–153, cards L156–220, `takeOff`/`flyTo`/`land`/`docked`/`goAshore`/`fly` L223–297, input L299–333, `step` L336–402, `zoomFor` L405, `frame` L416; data/places.js.
- **Size:** 555.
- **Depends on:** Stage, PaintCamera, `createAirship`, input, audio, airship.html DOM ids.
- **Tangled with content:** needs some untangling: the two towns are hard-wired (L164, L207).
- **Fingerprint:**
  - Cruise 4.5 m/s at 7 m altitude; docks at 1.3 and 4.5 m.
  - Turn = clamp(2.2·diff, ±1.5 rad/s). Throttle × (cos diff + 1)/2 × clamp((alt − 1.3)/3). Speed eases at 1.4 and altitude at 0.9/1.3; landing uses `1−e^(−2dt)`.
  - Pixel bounds x 70–1466, y 190–975.
  - The camera leads by speed × 0.6, with zoom ≈ 760 px across (580 portrait), clamped 1–2.6.

#### Audio facade, synth, Thareia studio — audio
- **Does:** `createSound()` sends `sfx(name)` to Thareia's library if the name exists there, otherwise to the synth. `music(track)` plays a Thareia piece (or `thareia:<id>`) or a synth track, and continues a piece already playing. sfx and music have separate flags, plus `duck`. The synth is Aethermoor's `core/audio.js`: token-string tracks (bpm, sub, parts on bell/flute/tri/pad/drum voices), a 0.9 s crossfade, and 8 blip voices. It adds the 'wickhollow' lullaby (D minor, 70 bpm) and the `anvil`, `kraa` and `flap` sfx (a 34-line diff).
- **Main pieces:** audio/sound.js L13–51; synth.js `TRACKS` L39–209, `createAudio` L229, blips L301/L356; vendored thareia `sounds.js` (`sfxInit`, `playSfx`, `SFX`, `fm`) and `music.js` (`MUSIC`, `musicPlay`, `musicStop`).
- **Size:** 596 + 616 vendored.
- **Depends on:** WebAudio. Bogmire calls `fm` directly for a far bell (bogmire.js L955).
- **Tangled with content:** clean.
- **Fingerprint:**
  - All synthesized, no audio files.
  - **Two AudioContexts** (synth.js L238, and Thareia's `sfxInit`).
  - Thareia's chain: a compressor (−16 dB, 4:1), code-built reverb, and a per-sound `LEVEL` table.
  - Pieces: travel, battle, flight, title, boss, town, ruins, marsh, desert; plus the synth's wickhollow, hearth and victory.
  - Only an on/off toggle, no volume levels.

#### Brewing (Pick Your Poison) — crafting
- **Does:** Pure rules:
  - A brew is one moonwater plus ≤ 3 herbs. An exact recipe (each herb once) makes a brew; a dose herb twice makes its dud; anything else makes Swamp Tea.
  - Nothing is spent until Bless. Stirring is required, and any later addition undoes it.
  - The pot colour is a weighted mix of the moonwater and herb-virtue colours. `nearMiss` gives hints.
  - The grimoire records order, counts and herbs.

  The overlay has an FF9 command window (Herbs, Moonwater, Stir, Bless, Grimoire, Leave), cards and grimoire tabs. The 3D view either uses the cottage painting through the Stage ('hearth') or a small staging, and duds play gags on the witch.
- **Main pieces:** brew/rules.js `brewResult` L36, `nearMiss` L57, pot ops L67–111, `bless` L118, grimoire L148–172, `potColour` L181, `REFUSALS` L198. recipes.js tables. ui.js `openCauldron` L230, `onKey` L668. view.js `createCauldronView` L22.
- **Size:** 1,586.
- **Depends on:** vendor `WITCH_CONSUMABLES` (brew ids = battle-bag ids), Stage, the witch and cauldron models.
- **Tangled with content:** the rules are clean; the UI carries her voice lines.
- **Fingerprint:** 11 herbs, 6 brews and 3 duds, plus Wisp-Calm (field only). Keys: arrows/WASD; Enter/Space/E/**Z** = OK; Esc/Backspace/**X** = back (ui.js L672–674).

#### Quill's swap shop — shop / economy (no gold)
- **Does:** Pure rules over `{bag, swaps, skiff}`:
  - A ware wants specific ids or "any" of a kind. `canSwap`/`swap` are all-or-nothing and return a new inventory.
  - The basket holds 12 slots of 5, +4 with the Horseshoe.
  - A brew or dud swaps for 2 chosen herbs. Quill's skiff swap takes a Warming Balm and the bow-lamp.
  - Gear uses Aethermoor's base items, rarities, affixes and naming.

  The UI has a list, preview, confirm step and a rarity-coloured flourish. Items with no art get 16×16 letter-grid icons turned into SVG.
- **Main pieces:** swap/swaps.js L36–38 (constants), `THINGS` L46, `gear` L90, `WARES` L168, `newInventory` L215, `basketSlots`/`basketUsed` L231, `price` L274, `canSwap` L290, `swap` L326, `status` L359; ui.js `openSwapShop` L88, `onKey` L355; icons.js.
- **Size:** 1,471.
- **Depends on:** vendor items, relics, gems, affixes, rarity.
- **Tangled with content:** the rules are clean; the catalogue is inline.
- **Fingerprint:** no currency; rarity colours are Aethermoor's `RARITY`.

#### Items catalogue — inventory
- **Does:** One id space for everything (Quill's `THINGS`): name/kind/icon lookup, the basket order (moonwater, hag stone, herb, brew, dud, found, relic, charm, gear, curio), and slot counting.
- **Main pieces:** items.js L13–33.
- **Size:** 33.
- **Depends on:** swaps.js, icons.
- **Tangled with content:** clean.
- **Fingerprint:** `ceil(n/5)` slots per stack; only `basket: true` items count.

#### Title screen and cut-scene player — cutscenes / menus
- **Does:** One 2D canvas draws a stack of "shots": the title painting, a panning still, the drawn grimoire, or black. A new shot dissolves in over the old, and anything below a fully-shown shot is dropped.
  - Beats have `still`, `from/to [x, y, zoom]`, `lines`, `music`, `sfx`, `hold` and `min`.
  - Narration types into a caption; speech goes in a box with name and portrait, with pitch blips.
  - Auto mode, Skip and Escape; a debounce on taps.
  - The sky has seeded stars, painted clouds with the skiff cut out of them, flame frames and motes.
  - Menu: Continue, New game, Story, Sound.
- **Main pieces:** title/screen.js `move` L22, `stillShot` L35, `createScreen` L62. player.js constants L11–20, `createPlayer` L24. mode.js `createTitleMode` L47, keys L219. sky.js `createTitleShot`; scenes.js `SPEAKERS`/`SCENES`; grimoire.js `grimoireShot`.
- **Size:** 1,306.
- **Depends on:** audio and title.html DOM ids.
- **Tangled with content:** the player and screen are clean; scenes.js is content.
- **Fingerprint:**
  - Speech types at 40 chars/s and narration at 34 (the field uses 42).
  - Dissolve 1.4 s; first line after 0.9 s; debounce 0.3 s; Auto holds a beat ≥ 7 s; reading time is `max(1.8, 1 + 0.05·len)`.
  - Cosine pan easing. Reduced motion holds the end framing.

#### Hag-Sight, fog and the low path — field mechanic / effects
- **Does:** In the Murkway, H or a button toggles Hag-Sight; standing still near the fog for 1.5 s brings it in at 70%.
  - Fog puffs use a shader with up to three screen-space clearings around the party; Hag-Sight thins them by up to 62%.
  - Planks glow pale green if they hold and sour violet if rotten, and a rotten plank warns when tried.
  - A CSS vignette (`body.hagsight`) leaves the cut-outs ungraded.
  - B4's foes face away, so talking to one from behind gives a First Strike.
- **Main pieces:** areas/bogmire.js `addFight`/`encounter` L447–529, `buildLowPath` L621, `updateLowPath` L699, `warnPlank` L730, `bindFenControls` L739, `hagSight` L970, `fogMaterial` L976, `fogHole` L998, `fogTexture` L1012, `plankGlow` L1043; CSS game.html L337–344.
- **Size:** ~330.
- **Depends on:** Field, Stage, scene `low.{planks, bridge, fog, near}`.
- **Tangled with content:** needs some untangling (it lives inside Bogmire).
- **Fingerprint:** smoothing `1−e^(−3dt)`; the overlay shows above 0.35; the fog texture uses a seeded Park–Miller generator (16807).

#### Repainting the painting — effects
- **Does:** In the Gloamwood, canvas copies of the painting have the lantern glass and halos darkened. Relighting blends the original pixels back around each lantern and re-uploads the texture, together with a glow sprite and a point light. Wickhollow's rot trail and grey patch are shader decals (names only).
- **Main pieces:** areas/gloamwood.js `darkPainting` L26, `buildLanterns` L127; wickhollow.js `rotPatch` L609, `rotTrail` L670.
- **Size:** ~200.
- **Depends on:** Stage.painting.
- **Tangled with content:** needs some untangling.
- **Fingerprint:** redraws at most every 0.15 s; a lantern lights over 0.7 s.

#### 3D actor toolkit and model interface — 3D models in code / animation
- **Does:** `kit.js` provides:
  - a 3-step toon ramp (70/160/255) with a moonlit rim added in `onBeforeCompile`;
  - an inverted-hull ink outline 0.016 thick;
  - `part`/`joint` helpers;
  - lathe skirts with zig-zag or ragged hems, and cloth sway;
  - tapered tubes, badges, stars and crescents;
  - blob shadows, glow sprites, `turnToward` and `Spring`.

  Every model has `{root, fx, height, radius, center, busy, moves, play(name, onHit, opts), update(dt, speed, turn), setMood}`. Foes add `intents` (Aethermoor move id → animation) and `setHollowed`; bosses add `grip(part, k)`, `dropRelic` and `phase`.

  The witch is built in code from Witch Way's description, with a painted face sheet. She has 13 timed actions (harvest 1.7 s … stir 2.4 s), a procedural walk and idle fidgets. The skiff hull is lofted from the side and top silhouettes of Thareia's sheet, with the sheet's paint projected from an atlas.
- **Main pieces:** actors/kit.js; witch.js `createWitch` L24, `ACTIONS` L211, `api` L221; foes-common.js `Hollow` L94, `Actions` L240, `Motes` L301; bosses-kit.js `rng` L17, `Particles` L395, `movePlayer` L486, `census` L566; party-kit.js `Particles` L125; airship.js L1–74.
- **Size:** 15,928 (44 files; 20 bestiary models plus props).
- **Depends on:** three.js, face and atlas art.
- **Tangled with content:** each model is content; kit.js is clean.
- **Fingerprint:** no triangle counts measured (`census` counts meshes, outlines, sprites, points and lights only). The largest model files are nettie 964, quill 827, inkblot 795 and silas 795 lines.

#### Input — input
- **Does:**
  - `createKeys`: arrows/WASD set a held direction (cleared on blur). Space/Enter/E/NumpadEnter = `act` (no repeat), Escape = `back`, B = backstage, L = layers.
  - M = menu (main.js L583). H = Hag-Sight (bogmire.js L753).
  - In battle: arrows move the target, Enter/Space picks it, Escape/Backspace cancels (mode.js L256).
  - The title, brew and swap screens bind their own keys.
  - Touch: tap to walk (A*), tap a person to go and talk, tap the "!" or the talk box. Pinch or drag in Behind the scenes. Tap the map to fly; tap a foe to target it.
- **Main pieces:** input.js L2–29; field.js `bindPointer` L162.
- **Size:** 78.
- **Depends on:** DOM events.
- **Tangled with content:** clean.
- **Fingerprint:**
  - No virtual joystick and no Gamepad API.
  - **Mooncart:** arrows, Enter=A (act), Escape=B (back) and M=START (menu) all work. H=SELECT is Hag-Sight, in the Murkway only.
  - **Gap:** the battle command menu has no arrow-key navigation (focus starts on the first button; only Tab moves it).

#### Build and asset pipeline — asset loading / tools
- **Does:**
  - esbuild bundles each page into one HTML file with art and fonts inlined; each demo has its own `assets-*.js`.
  - `compact-art.py` shrinks the game's paintings to stay under 16 MB.
  - `game-page.mjs` writes game.html from the shell plus one `<template>` per screen, taken from the demo pages (a missing edit anchor stops the build).
  - `bake-skiff.py` cuts the skiff atlas; `overlay.py` draws a scene over its painting.
  - At runtime: `import()` for modes, lazy screens with prefetching, and `freeGpu` (gpu.js L33–45).
- **Main pieces:** tools/build.mjs (12 `PAGES`, `compactArt`, LIMIT 16e6), tools/game-page.mjs, tools/game-shell.html, src/assets.js.
- **Size:** ~450 tool lines.
- **Depends on:** Node, esbuild, Python with Pillow.
- **Tangled with content:** clean.
- **Fingerprint:** also writes a `dist/<name>.fragment.html` copy without the html wrapper.

#### Balance simulator and tests — tests / tools
- `tools/balance.mjs` (1,029 lines) plays each encounter N times (default 400) with three scripted players:
  - *naive*: mashes attacks, heals below 20%;
  - *sensible*: plays to aspects, heals around 40%, Gathers and Pinches;
  - *expert*: reads the ribbon's intents using expected damage and KO chance (a normal CDF), and times Moonlight against Hollowed.

  It reports win rate, turns, minutes (6 s per hero turn, 3 s per foe turn), lowest HP, brews, command mix and hit rate. Options: `--chain`/`--arrive` carry HP, MP and the bag through the night; `--ablate`/`--ban` remove commands; `--trace` replays one fight.
- `tests/balance.test.mjs`: 50 fixed seeds per fight against win-rate bands, plus rule checks: no fleeing bosses, Gather never damages, Moonrise strips Hollowed, Heartsease revives.
- `tests/brew.test.mjs` checks recipes, duds, the moonwater limit and the grimoire. `tests/swaps.test.mjs` checks affordability, exact exchanges, basket room and the skiff swap. `tests/game.test.mjs` checks the bag, joining, floors, `afterBattle`, defeat and save/load. `tests/scene.test.mjs` checks the pixel ↔ 3D round trip, the floor's connectivity, stair slope and paths around the well.
- `tests/browser*.mjs` (9 files): headless Chromium plays each built demo. `browser-game.mjs` plays the whole night through `window.__play` and fails on any outside request.
- `vendor/aethermoor/test` (5 files) holds Aethermoor's own 97 tests.
- The page itself has only test handles: `__play`, `__game`, `__battle`, `__airship`, `__title`, `__bestiary`, `__wick`.

#### Debug and teaching views — debug tools
- "Behind the scenes" (B) flies the camera out, with labels; "Layers" (L) tints the floor and cut-outs; "Pixels" cycles off/1×/2× (field.js `buildHud` L587). The game's CSS hides these buttons but B and L still work (game.html L374–376). `bestiary.js` is a turntable of every model; `viewer.js` shows the witch up close.

#### Misc utilities
- `freeGpu` (gpu.js), `pointInPolygon` (field.js L669), `turnToward`/`Spring` (kit.js L254–273), `ring` (paint.js L64), `flagSet` (common.js L67), `sleep`/`nextFrame` (game/main.js L33).

### Content
| What | Where | ~lines |
|---|---|---|
| B1–B6 and B6b (foes, parties, bags, flags, lessons) | `battle/encounters.js` L31–118 | 90 |
| Party kits, skills, relics (Moonrise, Every Shiny Thing), brews and duds | `vendor/aethermoor/src/data/witch.js` | 237 |
| Hollowed Omen, statuses, foe variants (lamp-moth, willow-wight, gloamwing, lantern-mother moonlight and lights-out, silas) | `vendor/.../data/moonlight-foes.js` | 168 |
| All of Aethermoor's foes, relics, items and affixes, bundled though only Gloomfen's are used ("Scorchgate" appears 14× in the dist) | `vendor/aethermoor/src/data` | 8,671 excl. maps |
| Status renames, "beaten" lines, gather table, per-move sounds | `battle/director.js` L7–47 | 41 |
| Herbs, virtues, recipes, duds | `data/herbs.js`, `brew/recipes.js` | 195 |
| Quill's catalogue, wares, lines | `swap/swaps.js` L46–382 | 330 |
| Map places and the light path | `data/places.js` | 71 |
| 12 field screens: casts, story beats, dialogue, locks | `areas/*.js`, `field.js` L678–795 | ~2,800 |
| "Next:" route hints | `game/main.js` L612–626 | 15 |
| 4 cut-scenes and their speakers | `title/scenes.js` | 123 |
| Scene files, 13 field + 5 battle (camera, walk, layers, exits, lights, spots); `quills-stall.json` is used only by the swap demo | `scenes/*.json` (not stripped) | ~104 KB |
| Art: 17 backgrounds, 10 stills, 5 battle, 3 map, 10 title, 21 portraits, 12 brews, 17 swap, 13 herbs, 5 fx, skiff sheet and atlas, 2 fonts | `art/` (97 data URIs) | ~20 MB |
| Balance targets and results | `docs/BALANCE.md` | 384 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| CSS tokens (`--night #07050b`, `--plum #3a1631`, `--cream #ecdcb8`, `--magenta #c63d83`, `--gold #e2bd67`); violet fade, swirl, reduced motion | `source/game.html` L13–53 | 40 |
| HUD templates with their own styles: title L63–223, field L224–468, battle L469–629, map L630–748 | `source/game.html` | 685 |
| Fonts Jacquard 12 and Pixelify Sans; toon ramp, ink hull, rim `#b8b0ff` | `assets.js` L22–23, `actors/kit.js` | 50 |
| Field and battle HUD built in JS (talk box, basket, "!", toasts; ribbon, foe labels, roll badge, popups) | `field.js`, `battle/director.js` L441–601 | ~310 |
| Brew and swap overlay CSS (inline), pixel icons | `brew/ui.js` L64–220, `swap/ui.js` L410–588, `swap/icons.js` | ~585 |
| Title logo "Witch Way", menu, sky | `title/mode.js`, `sky.js` | ~300 |

### Shared-code clues
- **Aethermoor rules (diff-verified).** vendor/aethermoor/README.md L3–4: "copied from the New-game repo, branch `claude/cool-ptolemy-uc93gg`, folder `game/src/` (Aethermoor, Milestone 7)". The copy is identical to `stripped/aethermoor` apart from the 9 tagged files, e.g. combat.js `if (a.side === 'foe') a.struck = true; // ADDED for the 20-min game`.
- **Thareia audio (diff-verified).** vendor/thareia-sfx/NOTE.md: "Copied unchanged from the New-game repo, branch `claude/tender-babbage-4wiplk`, folder `thareia/sfx/`". It is byte-identical to New-game **7e15822** (2026-09-30). The later 146a9ac only adds `musicGain()`.
- **Aethermoor synth (diff-verified).** `audio/synth.js` L1–3: "Code-made music and sound, copied from Aethermoor (New-game repo, branch claude/cool-ptolemy-uc93gg, game/src/core/audio.js). Changes for Wickhollow Square: the 'wickhollow' track and the anvil, kraa and flap sounds". The diff is exactly those 34 lines.
- **Witch Way: lore, art, dialogue and constants, with the code reimplemented.**
  - `actors/witch.js` L10: "The Moonlight Witch, from Follow Me Down Witch Way's LORE.md". She is built from shapes.
  - `field.js` L749–750: first lines "from Follow Me Down Witch Way's dialogue.json". Verified: "hammered all night, and my heart won't settle!" is in witch-way `data/dialogue.json`.
  - `brew/rules.js` L8: "Witch Way's rules (game/src/brewing.js), kept". It is a rewrite: WW's `brewResult(manifest, herbs, state, {base, still})` differs.
  - `swap/swaps.js` L36–37: `BASKET_SLOTS = 12; // WW game/src/config.js basket_slots`, `STACK = 5`, matching witch-way `src/config.js` L179–180.
  - Also `data/herbs.js` L1; `areas/gloamwood.js` L11 and `areas/hollow.js` L9 ("Witch Way's own painting").
- **Skiff art:** `actors/airship.js` L5–6 names the source as Thareia's turnaround sheet, New-game `thareia/art-in/airship/ship-2-refitted-skiff.webp`.
- **The "skiff page after *The Magpie over Aethermoor*" lineage is backwards.** The Magpie page (airship repo, added 2026-10-06 in d3d27ca) carries this game's engine:
  - the cut-out uniforms `paintViewProjection`, `actorDepth`, `compareDepth` (its L4405);
  - Stage's `this.reveal={on:!1,t:0,yaw:.7…` (L4468);
  - place records with `dockAlt`/`heading`/`music`, and a Wickhollow blurb identical to `data/places.js` L19;
  - the header `<h1>Moonlight in the Aether</h1><p>The Magpie · over Aethermoor</p>` (L126), where ours is "· down the Sable" (`source/game.html` L720).

  This commit dates from 2026-10-01, so this game is the ancestor.
- **Envoi** model headers say "Code-built three.js r128 model for Moonlight in the Aether" (`envoi/source/src/models/halcyon.js` L5, `originals/sol.js` L4; `noctara.js` L1 says "final boss of Moonlight in the Aether"). This build has no Sol, Halcyon or Noctara and uses r186 modules rather than r128 globals. Only the name is shared.
- **Mooncart** `games.json` L22: `{ "file": "dist/airship.html", …, "saveKey": "moonlight-the-magpie" }`. The page's `<title>` is "The Magpie", and the airship code (Thareia included) writes no storage. `dist/game.html`, the whole game, is **not** listed in games.json; only the 11 demos are.
- **Borrowed prefix:** `'witch-way:gloamwood'` (areas/gloamwood.js L623) and `'witch-way:rest'` (areas/bogmire.js L576) are localStorage writes made only by demo hosts that have no `host.rest`. Nothing ever reads them.

### Notes
- **Dead code:**
  - `battle/engine.js` `makeHero` L17 and `startBattle` L40 are never called. The live `makeHero` is encounters.js L166, which uses a different gear seed, ASI handling and secondary-domain level.
  - `actors/villagers.js` `createCrow` L150 is dead; `party-crow.js` replaced it.
- **Duplicated helpers:** the models came from separate "modelers" (registry.js L1). As a result:
  - the toon ramp exists 3 times (kit.js L7, foes-common.js L14, bosses-kit.js L25);
  - there are 4 particle systems (`Sparks`, two `Particles`, `Motes`);
  - there are 3 `canvasTexture` helpers;
  - `Fx` makes one unpooled sprite per particle.
- **Save:** `v: 1` with no migration (anything else loads as nothing), one slot, written on every bag change. The fight seed comes from `Math.random` and is not saved, which is fine since fights aren't saved mid-way.
- **Mooncart:** only the battle command menu can't be driven by D-pad (see Input).
- **Runtime:**
  - The bundle carries all of Aethermoor's region data (its maps are tree-shaken out).
  - The page uses the artifact runtime's hot reload (`window.claude.hot`, main.js L638–645).
  - Two AudioContexts run at once.
  - The field types at 42 chars/s and cut-scenes at 40.
- **Engine extraction:** three.js is r186 (`colorSpace`, `#include <colorspace_fragment>`), unlike the r128-global style of several sibling games. PaintCamera, Walkmesh, cut-outs, Stage and Town are clean, data-free modules: this game's best shared-engine candidates.
