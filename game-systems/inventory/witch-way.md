## Follow Me Down Witch Way (milestone 4)

**What it is:** A cozy moonlit witch game with no combat. The Moonlight Witch walks painted 1448×1086 scenes (polygon walk areas), gathers herbs by moon phase, brews remedies and duds, and helps the living and the kindly dead. Chapter 1 is Wickhollow; Chapters 2–3 (the Sable Fells, 8 places; the Cradle, 6) were built in milestones 1–4.
**Inventoried:** `follow-me-down-witch-way` @ `origin/claude/bold-turing-t225o0` (`b95448c`). No single file is committed on this branch; `tools/build_single.py` built `Follow_Me_Down_Witch_Way.html` into a scratch copy: 29,083,308 bytes, stripped 1,967 KB, 12,424 lines. Line 180 is the packed `window.__BUNDLE`, 1.49 M characters even stripped (never printed). **Line numbers refer to the stripped source files** `game-systems/stripped/witch-way/source/game/src/*.js` (and `source/game/data/`). "S" numbers in the Code map are where each module starts in the stripped single file.
**Tech:** 2D canvas only, 640×360 game pixels at integer scale. Plain ES modules (56 files), wrapped by a Python bundler as `const __mN_src_x_js = (() => {…})();` with imports hoisted, in one classic `<script>`. Assets are Z85 text in `window.__BUNDLE`, turned into blob URLs on first use. No outside libraries. Fonts: Pixelify Sans and Jacquard 12 (TTF). Repo tools: Python (Pillow) and Node (`node --test`, Playwright).

### Coverage
- **Read fully:** main, game, config, screen, input, assets, text, ui, sound, save, state, world, walker, regions, regionart, lore, rooms, rules, brewing, gates, sky, rest, collection, mountain, cradle, playtest, `screens/map.js`. Also `docs/CODE-MAP.md`, `package.json`, and the single-file shell L1–L186 and L12410–L12424.
- **Read in part:** trades L1–L260 and L279–L408; actions L1–L470 (not the drawing); dialogue L1–L206; ambience L1–L140; editor L1–L50, L106–L135, L530–L560 and L845–L868; minimap L1–L40 and L120–L160; fells L1–L130; deep L1–L70 and L132–L160; `screens/brew.js` L1–L50 and L136–L256; foundit L14–L136; dudfx L14–L60; decor L77–L130 (plus a grep of its fade code); scenery L1–L60; `screens/title.js` L1–L60; `screens/room.js` L144–L175. `docs/HANDOFF.md` skimmed.
- **Headers and function lists only** (marked "(header)" where used): bench, notes, stories, grimoire, altar, pageinfo, menu, basket, journal, ending, lantern, river, standins, intro, loading.
- **Data:** all `data/*.json` measured and summarised with a JSON reader. Kit `manifest.json` (v5, 86 KB, via `git show`) read for its keys, tunables, charms, duds and controls only. The bundle line counted with regexes, never printed.
- **Tests and tools:** all 5 unit-test files by test name (71 tests); `tests/browser/run.mjs` by step name (10 groups, 52 steps); the 8 tools by header, and `check_roundtrip.py` in full.
- **Skipped:** `materials/`, LORE.md and the Path Polish source. The two older builds: grep only.

### Code map
| Files (stripped `source/game/src/`), lines (S = start in single file) | Group | What | ~lines |
|---|---|---|---|
| `main.js` 170 (S12227), `game.js` 97 (S381), `config.js` 190 (S185), `screens/loading.js` 32 (S3024) | system | boot, rAF loop, mute button, error bar, screen switch, fader, `words()`, all tuning constants | 489 |
| `screen.js` 110 (S897), `text.js` 146 (S2425), `ui.js` 97 (S2578) | system | integer-scale canvas, fullscreen; crisp outlined text; panel, button and choice dialog | 353 |
| `input.js` 321 (S1013) | system | keys, DOM pad and A/B/Menu, canvas taps, hold timing | 321 |
| `assets.js` 244 (S484), `regionart.js` 51 (S10330), `regions.js` 101 (S734), `lore.js` 50 (S841) | system | bundle and Z85, image cache, hi-res art, story-state tiles, per-region load and release, region merge, LORE.md parser | 446 |
| `world.js` 67 (S1341), `walker.js` 157 (S2856) | system | polygon walk mask, feet box, exits; movement, corner slide, sprite animation | 224 |
| `save.js` 56 (S3062), `state.js` 183 (S4934) | system | localStorage slots, prefs, new state, save repair | 239 |
| `sound.js` 235 (S5591) | system | music playlist, synthesized effects | 235 |
| `rules.js` 293 (S1853), `brewing.js` 264 (S2154) | system (rules) | moon, clouds, herb spots, basket, sleep; recipes, duds, virtues, water | 557 |
| `trades.js` 408 (S4216), `gates.js` 113 (S5132), `collection.js` 92 (S4810), `rest.js` 52 (S7593), `rooms.js` 20 (S4908), `stories.js` 95 (S6698) | system + content | friends, rewards, charms, letters; gates and ending; grimoire pages and finds; night pipeline; rooms; notes | 780 |
| `lantern.js` 99 (S4003), `river.js` 102 (S4108), `mountain.js` 155 (S1536), `cradle.js` 150 (S1697) | content (rules) | small-story state machines; Fells and Cradle nightly rules | 506 |
| `screens/map.js` 762 (S11045), `actions.js` 626 (S8716), `scenery.js` 165 (S4635) | system | map screen (camera, exits, overlay stack), press and hold actions, Moonlight, standees | 1,553 |
| `ambience.js` 325 (S5253), `sky.js` 59 (S7525), `dudfx.js` 164 (S2681), `decor.js` 490 (S10390), `standins.js` 116 (S1414) | presentation | flicker, wisps, glimmers, moon badge, dud effects, Path Polish props, canopy fade, code stand-ins | 1,154 |
| `minimap.js` 258 (S7256) | system | corner map, region map | 258 |
| `fells.js` 444 (S7890), `deep.js` 341 (S8356) | content (mechanics + presentation) | Fells places, gusts, blown hat; Cradle places, facing glint, follower | 785 |
| `dialogue.js` 346 (S5833), `foundit.js` 136 (S6486), `pageinfo.js` 60 (S6418), `grimoire.js` 294 (S6801), `altar.js` 131 (S7112), `menu.js` 53 (S6636), `basket.js` 137 (S9360), `journal.js` 146 (S10888), `notes.js` 97 (S7658), `bench.js` 104 (S7768), `ending.js` 208 (S6193) | UI | conversation, letters, swaps; Found-it cards; books; menu; basket; journal; wake cards; bench rest; ending | 1,712 |
| `screens/brew.js` 574 (S9509), `screens/room.js` 207 (S10099), `screens/title.js` 173 (S11947), `screens/intro.js` 78 (S12138) | UI screens | cauldron; room menu; title (R, L and P walks); intro | 1,032 |
| `editor.js` 868 (S3124), `playtest.js` 83 (S11855) | debug | F2 scene editor; play-test walk | 951 |
| **Total `game/src`** | | 56 modules | **11,595** |
| single file L1–L179 | presentation | page CSS (L9–L159) and HTML: canvas, `#touch`, `#rotate`, `#editor` | 179 |
| single file L180 | content (packed) | 365 assets (361 WebP, 2 TTF, 2 MP3; 22.6 MB raw) and 12 data files | 1 |
| `source/game/data/*.json` | content | scenes 4,813, art 17,422, wording 396, dialogue 464, walker 56, clouds 18, regions 87 + 791 + 545 | 24,592 |

Roughly 6,300 lines are systems, 2,700 UI screens, 1,300 content-tied rule and region code, 950 debug, plus 24.6 k lines of JSON.

### Systems

#### Game loop, screens and fades — core
- **Does:** `frame` ticks input, updates and draws the current screen, then the fader and the mute button, and clears one-frame input in `finally`. An error is painted as a bottom bar ("Oops, something broke. Please tell Claude:"). A screen is an object with `enter/update/draw/exit`. `fadeThrough(fn)` fades to black, runs `fn`, then fades back in.
- **Main pieces:** `frame` (main.js L27–L47), `boot` (L107–L152), `showError` (L93–L105), `setScreen` (game.js L20–L24), fader (L28–L66), `words` (L71–L76).
- **Size:** ~270 lines.
- **Depends on:** screen, input, sound.
- **Tangled with content:** clean.
- **Fingerprint:** rAF, variable timestep, `dt = min(0.05, max(0,(now-last)/1000))` (main.js L28). No pause state; the music pauses on `visibilitychange`. Fade 0.35 s. Test hooks `globalThis.__game/__sound/__fader/__rules/__world/__regionart` (L163–L168).

#### Integer-scale canvas — rendering
- **Does:** The canvas backing store is 640×360 × the largest whole-number scale that fits in *device* pixels. Each frame starts with `setTransform(scale)` and smoothing off. Pixel art stays crisp, while text and painted art draw at device resolution. On touch it goes fullscreen and locks landscape after a tap.
- **Main pieces:** `fit` (screen.js L37–L60), `prepareContext` (L63–L69), `toView` (L72–L83), `goFullscreenOnPhone` (L96–L105).
- **Size:** 110 lines.
- **Depends on:** the DOM.
- **Tangled with content:** clean.
- **Fingerprint:** letterboxed and centred, CSS `pixelated`. Code-identical to the first upload.

#### Crisp text and the UI kit — rendering/UI
- **Does:** Text is drawn at screen scale with alpha snapped to 0 or 255 and a one-game-pixel outline on all 8 sides (`#13060f`), cached in an LRU capped at 16 M screen pixels; `wrapText` wraps lines. The UI kit draws the kit's panel and button style, a modal `ChoiceDialog` (arrows, hover, tap; cancel picks the last option) and `hit` with 2 px of slack.
- **Main pieces:** `textImage` (text.js L59–L118), `drawText` (L122–L131), `wrapText` (L134–L146); `drawPanel` (ui.js L15–L25), `drawButton` (L37–L44), `ChoiceDialog` (L47–L88), `hit` (L94–L97).
- **Size:** 243 lines.
- **Depends on:** the screen scale.
- **Tangled with content:** clean.
- **Fingerprint:** body font at 12 or 16, title font at 24, 36 or 48. Buttons 23 px tall; colours `#c9a04a` / `#f3cf73` / `#3a1838` / `#1a0a1c`. text.js is code-identical to the first upload.

#### Input — input
- **Does:** Keys and touch become 7 actions, each with held, pressed, released and `heldFor`. `moveIntent` sums the held directions into a normalised diagonal; she faces the latest held direction. A DOM pad follows one finger. A canvas tap counts if the finger moves less than 14 game pixels; unmapped keys go to `specialKeys`.
- **Main pieces:** `KEYS` (input.js L11–L19), `moveIntent` (L82–L95), `onKeyDown` (L125–L135), `padDirs` (L174–L191), `bindButton` (L227–L248), `layoutTouch` (L252–L267), `setTouchControls` (L281–L284).
- **Size:** 321 lines.
- **Depends on:** screen; DOM `#pad`, `#btnConfirm`, `#btnCancel`, `#btnMenu`.
- **Tangled with content:** clean.
- **Fingerprint:**
  - **Keys:** arrows or WASD move. Space or Z confirms; holding 0.35 s casts Moonlight. X or Esc cancels (opens the basket). **Enter, NumpadEnter or M opens the menu.** F2 opens the editor; R, L and P on the title.
  - **Touch:** a fixed d-pad in the left margin, `max(96, min(0.4·vh, 150))` px across, deadzone 0.28, 8 ways. A, B and Menu buttons on the right. Modes `map`, `buttons`, `menu`, `none`.
  - **Mooncart:** arrows, B (Esc, cancel) and START (M, menu) work; SELECT (H) does nothing. But **A sends Enter by default** (`building-with-assets-/web/js/store.js:13`), which opens the menu here instead of confirming. `games.json` sets no override.
  - Code-identical to the first upload.

#### Assets, bundle and painted-art scaling — assets
- **Does:** Turns Z85 text into a blob URL the first time an asset is used. Painted art saved at `scale`× reports its drawn size: `width`/`height` getters are overridden, and **`CanvasRenderingContext2D.prototype.drawImage` is monkey-patched** to draw it smoothed. `composeState` rebuilds a story-state background from its base painting plus changed tiles, keeping 3. `drawArt` draws by ground anchor, with alpha, flip, width and rotation.
- **Main pieces:** `fromZ85` (assets.js L18–L26), `assetUrl` (L28–L38), `loadJSON` (L40–L48), `loadImage` (L71–L85), `releaseImages` (L88–L90), `composeState` (L118–L139), the drawImage patch (L149–L169), `drawArt` (L200–L212), `loadFonts` (L219–L228), `allManifestImages` (L233–L244).
- **Size:** 244 lines.
- **Depends on:** `window.__BUNDLE`, art.json.
- **Tangled with content:** some untangling: a kit folder whitelist (L235–L238).
- **Fingerprint:** Z85 alphabet `0-9a-zA-Z.-:+=^!/*?&<>()[]{}@%$#`; entries `{type, n, z85}`; `@game/` paths. `loadJSON` returns a `structuredClone`; `img()` throws before load. None of this is in the first upload, which packed base64 data URLs.

#### Region packs and region art streaming — content framework
- **Does:** `mergeRegion` merges each `data/regions/<id>.json` into the kit manifest: scenes, new exits on kit scenes, herbs (also added to the phases' bloom lists), items, brews, duds, charms, friends, NPC pictures, herb virtues and letters, each tagged `region`. `regionart` loads a region's paintings on the way in. It releases every region except Wickhollow, the one she is entering and the one she is leaving.
- **Main pieces:** `REGION_IDS` (regions.js L25), `mergeRegion` (L59–L92), `regionOf`/`sceneRegion` (L95–L101); `ensureRegion` (regionart.js L36–L41), `releaseOthers` (L45–L51).
- **Size:** ~150 lines.
- **Depends on:** assets, rooms.
- **Tangled with content:** clean, except `HOME='wickhollow'`.
- **Fingerprint:** at most 2 regions' backgrounds in memory (each about 6 MB decoded). New in milestones 1–4.

#### Polygon walk mask and exits — collision
- **Does:** A point is walkable inside some `walkable` polygon and no `blocked` one (even-odd test). Her feet are a box sampled every 4 px, so thin posts still stop her. Exits are rects with `spawn`, `face`, `to` and optional `door`/`reveal`. She arrives at the spawn of the exit leading back where she came from, else at `start`.
- **Main pieces:** `sceneData` (world.js L6–L19), `pointInPoly` (L21–L28), `walkableAt` (L30–L33), `feetFit` (L39–L47), `exitAt` (L55–L57), `arrivalPoint` (L60–L67).
- **Size:** 67 lines.
- **Depends on:** `game.scenes`.
- **Tangled with content:** clean.
- **Fingerprint:** polygons in painting pixels; feet box 16×8; step 4. Only `exitAt`'s `doors` flag differs from the first upload (6 lines).

#### Walker — walking / animation
- **Does:** She moves at `WALK_SPEED·speedMult·dt`, trying x and y separately. When a straight step is blocked, she searches up to 7 px either side and drifts toward the opening. She is drawn from `walker.json`'s sheet (6-frame walk at 10 fps, an idle frame per facing), with the lower 30% drawn separately for bob, sway and breath. Dud looks: green tint, droopy hat, hatless, hiccup lift, head shake.
- **Main pieces:** `Walker` (walker.js L20–L157), `tryMove` (L59–L69), `slide` (L71–L88), `frame` (L98–L105), `offsets` (L108–L121), `draw` (L123–L156).
- **Size:** 157 lines.
- **Depends on:** world, standins, dudfx.
- **Tangled with content:** some untangling (named dud looks).
- **Fingerprint:** 66 px/s, diagonals on, four facings. `CORNER_SLIDE_PX` 7. Cell 94×86, anchor (60, 84). Only the hatless look differs from the first upload (9 lines).

#### Map screen: camera, exits, overlay stack — scene management
- **Does:** Overlays take over `update` in a fixed order: editor, ending, rest, letter, dialogue, choice, story cards, Found-it, menu, book, big map, basket. Otherwise it runs actions, walker, region modules and camera. Walking into an exit calls `goThrough`, which checks the gate, waits in place while another region loads, then fades. A shut way snaps her back to `lastFree` and says why (at most every 2.2 s); `waitForRelease` stops a held key walking her straight back out.
- **Main pieces:** `MapScreen` (screens/map.js L87), `enterScene` (L153–L176), `goThrough` (L237–L262), `followCamera` (L334–L340), `update` (L356–L556), `shutWay` (L561–L589), `useTomb` (L592–L606), `ringBell` (L610–L626), `draw` (L668–L728).
- **Size:** 762 lines.
- **Depends on:** 36 imports (L8–L50).
- **Tangled with content:** deeply tied (Wickhollow, Fells and Cradle hooks inline).
- **Fingerprint:** the camera is a hard follow on `(x, y−34)`, rounded and clamped to the painting, with **no smoothing or deadzone**. Depth sort `sprites.sort((a,b)=>a.y-b.y)` (L688). An exit is armed only after she has stood outside every exit.

#### Actions: tap, hold, Moonlight, places, sitting still — interaction
- **Does:** Confirm is a tap if released before 0.35 s, a hold after that. The tap target is the herb, curio or friend that scores best on `d − 0.5·along` (in reach, not behind her), else the nearest place within its kind's reach, or a door within 14 px. Holding casts Moonlight: a growing circle that reveals hidden spots and curios. At a mandrake, holding apologises first (1.1 s). Sitting ducks the music and opens a stillness herb after 3.5 s; this module also handles bubbles, queued toasts and sparks.
- **Main pieces:** `PLACE_REACH` (actions.js L34–L36), `placeTarget` (L90–L108), `usePlace` (L116–L134), `updateSit` (L170–L193), `target` (L229–L244), `update` (L246–L282), `whileHeld` (L285–L304), `tap` (L306–L325), `revealAround` (L396–L434), `sparkle`/`tickEffects` (L446–L469).
- **Size:** 626 lines.
- **Depends on:** rules, brewing, trades, river, fells, deep.
- **Tangled with content:** some untangling: the press core is generic, but `usePlace` and the reveals are story-specific.
- **Fingerprint:** gather reach 34, talk reach 46. Moonlight radius 48 (× 1.5 with the Owl charm), and she stands still while casting. Gathering kneels 0.75 s. A sparkle is 9 sparks living 0.6 s.

#### Depth-sorted standees — rendering
- **Does:** Builds tonight's herbs from the gathering rules: hidden until revealed, shut under cloud, a glow on common ones. Adds curios and friends at their spots (ghosts only with the hag stone, `when` spots, a moment or happy pose). Each draws by its ground anchor, breathing or floating.
- **Main pieces:** `sceneryFor` (scenery.js L29–L57), `Standee` (L59–L137).
- **Size:** 165 lines.
- **Tangled with content:** some untangling (hag-stone rule; `grave_candle` at L41).
- **Fingerprint:** ghost alpha 0.76, float 2 px.

#### Moon phases, clouds, night reset — day/night
- **Does:** Each sleep moves the phase on: full, waning, new, waxing. Waning and waxing nights get a deterministic schedule of clouds over the moon badge. While a cloud's measured range (clouds.json) covers the moon, clear-moon herbs are shut. `sleep` resets picked spots, reveals, water drawn, the candle, the dud and the hat; new moons get a 0.28 dark veil.
- **Main pieces:** `nextPhase` (rules.js L33–L36), `cloudPasses` (L59–L78), `moonCovered` (L94–L103), `sleep` (L282–L293); `Sky` (sky.js L14–L59).
- **Size:** ~170 lines.
- **Tangled with content:** clean.
- **Fingerprint:** seeded with `seeded(night*7919 + phase.length*104729)`. First gap 3–8 s, then gaps of 6–16 s; speed 13–19 px/s; loops every 900 s.

#### Herb spots, basket — gathering / inventory
- **Does:** `herbSpotState` checks, in order: blooms tonight (or `cultivated`, or its `shaft` matches the phase); `requires` met; not picked; hidden until Moonlight (rare, or marked `moonlight`); `clear_moon`; `gloves`; Lull `moon_order`; `angle`; `stillness`. The basket has 12 slots (charms add more) of up to 5 `{id, count}`. `keeps_night` herbs stack only with buds from the same night. `basketAdd` is all-or-nothing, and things go back to the earth one at a time.
- **Main pieces:** `herbHidden` (rules.js L121–L123), `SPOT_REQUIRES` (L127–L131), `spotBlooms` (L143–L146), `herbSpotState` (L161–L177), `basketSlots` (L189–L195), `basketAdd` (L224–L241), `basketReturnOne` (L245–L251), `pickHerb` (L257–L266).
- **Size:** ~150 lines.
- **Tangled with content:** some untangling (story names in `requires`/`needs`).
- **Fingerprint:** reasons `hidden | clouds | gloves | dark | angle | still`. 12 slots, stacks of 5 (manifest `tunables`). No weight, no money.

#### Brewing — crafting
- **Does:** `brewResult(manifest, herbs, state, {base, still})` returns brew, dud, `spat` or `unsettled`.
  - **Chapter 1, in order:**
    1. A dud whose trigger `{herb: n}` is reached (two of witch's bells, wolfsbane or mandrake).
    2. An exact recipe: each listed herb once, on the right base, and a tincture only in the still.
    3. Anything else: Swamp Tea (`any_other_mix`).
  - **Once `flags.runestones` is set, these come first:**
    - Calmbud: 3 from one night make the Quiet Cup; mixed nights make the `mixed_moons` dud; fewer, or with other herbs, are `unsettled`.
    - One lady's mantle forgives one wrong herb (it tries each one-herb-removed subset).
    - A `balm_only` herb must make a balm, or it is `spat`.
    - A `bitter` herb with nothing `sweet` makes the `no_honey` dud.
    - `virtueBrew`: each virtue the brew needs is matched by a different herb (backtracking).
  - **`finishBrew`:** uses 1 base (spring water is free), puts the herbs back if the result won't fit, applies the Heart charm's yield and starts the dud timer.
  - **Water:** each source `group` gives 3 bottles a night in one draw; bottles she doesn't use keep.
- **Main pieces:** `brewResult` (brewing.js L37–L65), `plainResult` (L75–L106), `virtueBrew` (L123–L136), `fits` (L139–L143), `drawWater` (L164–L174), `potRoom`/`potAdd` (L186–L201), `finishBrew` (L215–L244), `tickDud` (L255–L260).
- **Size:** 264 lines.
- **Depends on:** the basket.
- **Tangled with content:** some untangling (`calmbud` and `runestones` hard-coded, L39/L44).
- **Fingerprint:** up to 3 herbs plus one mantle drop; 3 bottles a night; a dud lasts 60 s, counted only on the map. Fully deterministic: no dice, no chance.

#### Cauldron screen — crafting UI
- **Does:** Steps: cold, lit, water, herbs, stirred, bless. Each step bursts particles, and the pot bubbles (35% of bubbles make a sound). The basket shelf works by arrows or taps. Nothing is used before the blessing; the `PLACES` table holds the brewing places (wayside, inn, hut, sablehead, hearth, still).
- **Main pieces:** `PLACES` (screens/brew.js L37–L45), `BrewScreen` (L57), `light…bless` (L136–L196), `burst` (L198–L205), `update` (L208–L254).
- **Size:** 574 lines.
- **Tangled with content:** some untangling (`CAULDRON` fixed to the cottage painting, L31).
- **Fingerprint:** a plain particle array with gravity 20; no pool, no cap.

#### Friends, trades, charms, letters — quests/NPCs
- **Does:** A friend's `wants[stage]` is the current request. `give` takes the thing (a given curio stays on the altar), raises the stage and applies `REWARDS[friend][stage]`: gloves, a charm (by `source`), curios, a recipe, swaps, a flag, a story moment or a reunion. `talk` picks lines by stage, with branches for particular friends. Quill swaps 1 bottle for 2 Wickhollow herbs. Inkblot steals a common herb at rest until he's helped, then gives one a night. `charmEffect` multiplies effects; letters come on full moons.
- **Main pieces:** `REWARDS` (trades.js L14–L36), `LETTER_RECIPES` (L43), `give` (L104–L131), `hasCurio` (L152–L155), `WHEN` (L163–L169), `talk` (L187–L217), `talkPlain` (L219–L256), `quillSwap` (L301–L321), `inkblotAtRest` (L337–L359), `charmEffect` (L362–L371), `letterDue` (L376–L386).
- **Size:** 408 lines.
- **Tangled with content:** deeply tied.
- **Fingerprint:** the charms are Horseshoe (+4 slots), Owl (Moonlight × 1.5), Bell (chimes within 160 px of a rare herb), Heart (brews × 2) and Moth (walk × 1.25). Letters on the full moons of nights 1, 5 and 9: `floor((night−1)/4)`.

#### Dialogue box, letters, swaps — dialogue
- **Does:** Lines from `talk` are paged at up to 3 wrapped rows of 440 px and advance on confirm, menu or a tap. If she has what the friend wants, it ends with Give or Not yet. The portrait is troubled before she helps and happy after; on phones it is mirrored to the left, clear of the A/B buttons. `SwapView` is Quill's chooser; `LetterView` shows letters and notes.
- **Main pieces:** `BOX` (dialogue.js L17), `DialogueView` (L51–L195), `choose` (L122–L137), `pages` (L197–L206), `SwapView` (L208), `LetterView` (L304).
- **Size:** 346 lines.
- **Tangled with content:** some untangling.
- **Fingerprint:** box {8, 248, 624, 104}; 0.15 s guard between pages. No typewriter effect, no branching.

#### Gates and the ending — progression
- **Does:** An exit's `needs` can be a brew (used once, then the way stays open: `opened: ['from>to']`), a curio (just held) or a flag. `tombCheck` needs a full moon, the chalice, the candle and the draught; `playEnding` uses up the draught.
- **Main pieces:** `exitNeeds` (gates.js L28–L31), `gateOpen` (L45–L52), `openGate` (L56–L73), `tombCheck` (L91–L99), `playEnding` (L102–L108).
- **Size:** 113 lines.
- **Tangled with content:** some untangling (`village>hollow` and `wisp_jar` at L71).
- **Fingerprint:** gate keys are `from>to` strings.

#### Story flags and small-story state machines — progression
- **Does:** `state.flags` allows 9 flags and `state.notes` 3 notes. Lantern and river are staged stories (header). mountain.js holds Nibble's appetite, the nightly honey, the Lull's moving moonlight, the gust cycle and the Quiet Cup. cradle.js holds the moonshafts, the nightly cheese, the knockers hiding a curio in a `silly` place picked by `night % n`, Nutmeg and the boat; both import nothing, so rules.js can call them without import loops.
- **Main pieces:** `FLAG_IDS` (state.js L19–L22); `nibbleAtRest` (mountain.js L45–L57), `lullStep`/`inMoonlight` (L113–L122), `gustAt` (L125–L136); `neededCurios` (cradle.js L61–L71), `knockersAtRest` (L84–L96), `boatReady` (L134–L139).
- **Size:** ~600 lines.
- **Tangled with content:** deeply tied. The reusable part is the pattern: fresh, normalize and stage functions with per-night stamps (`honeyNight !== night`).
- **Fingerprint:** a gust cycle is 7 s: calm until 3.3 s, rising until 4.4 s, then the gust.

#### Night pipeline, rooms and rest — progression
- **Does:** `restNight` runs the same for every bed: the region's visitor (Inkblot, Nibble or the knockers), the lantern sync, `sleep`, the cleft after the Quiet Cup, a letter (saved as `pendingLetter`) and Wren's visit. The room screen and bench rest both call it, then `writeSave`.
- **Main pieces:** `restNight` (rest.js L23–L52), `ROOMS` (rooms.js L12–L16), `goToSleep` (screens/room.js L165–L173), `RestView` (bench.js L40, header).
- **Size:** ~400 lines with its views.
- **Tangled with content:** some untangling.

#### Collection, Found-it queue, lore text — collection/UI
- **Does:** `grimoirePages(manifest, region)` lists one region's book; a page fills when the thing is found, brewed or met. `Finds` queues new finds and marks each shown **only after its card closes**, so quitting never loses a card. `parseLore` reads LORE.md's bullet shapes for the wording.
- **Main pieces:** `grimoirePages` (collection.js L20–L29), `pageFilled` (L35–L42), `unannounced` (L65–L76), `wrenVisitDue` (L90–L92); `FoundItView` (foundit.js L28), `Finds` (L88–L136); `parseLore` (lore.js L11–L34); `GrimoireView` (grimoire.js L62, header).
- **Size:** ~720 lines.
- **Tangled with content:** some untangling (5 fixed tabs).
- **Fingerprint:** Wickhollow's book is fixed at 47 pages; a card stays at least 0.5 s.

#### Save and load with repair — save
- **Does:** Saves the whole state as JSON in localStorage, one key per walk `mode`, with try/catch around every access. `checkedSave` merges the loaded object over `newGameState()` and cleans every field against the merged manifest. It converts version-1 fields, and moves her to a safe point if her feet no longer fit the walk polygons.
- **Main pieces:** `KEYS` (save.js L10–L16), `loadSave`/`writeSave` (L22–L38), `getPref`/`setPref` (L45–L56); `SAVE_VERSION` (state.js L26), `MODES` (L29), `newGameState` (L31–L79), `checkedSave` (L83–L183); `saveNow` (main.js L156–L160).
- **Size:** ~240 lines.
- **Tangled with content:** some untangling (it knows every field).
- **Fingerprint:**
  - **Keys:** `follow-me-down-witch-way.save.v2` (main), `….save.v2.lantern`, `….save.v2.river`, `….save.v2.playtest`. Prefs `follow-me-down-witch-way.<name>`; mute `follow-me-down-witch-way.muted` (`'1'`/`'0'`).
  - **Format:** `JSON.stringify(state)` with `v: 2`, repaired on load rather than migrated. 4 slots, chosen by `state.mode`.
  - **Autosave:** on sleep and rest, after the ending, the moth-bower or a note, and on `pagehide`/`visibilitychange`.
  - **First upload:** used `follow-me-down-witch-way.save.v1` (first-upload L2242); this build never reads it (save.js L8).
  - **Mooncart:** gives this build save slot `follow-me-down-witch-way`, and the older builds `witch-way-path-polish` and `witch-way-first-version` (`building-with-assets-/games.json` L13–L15).

#### Audio — audio
- **Does:** Two MP3s play in turn through one `HTMLAudioElement` at volume 0.32, starting on the first gesture and pausing when hidden or muted. Seven effects are synthesised with WebAudio (pluck, bubble, whoosh, caw, chime, jingle, shriek) from `tone`, `filtered` noise and an LFO. A `RECORDED` table can swap any effect for a file, and `setMusicLevel` lowers the music while she sits.
- **Main pieces:** `unlockSound` (sound.js L38–L54), `startMusic` (L56–L69), `play` (L95–L102), `tone` (L122–L135), `filtered` (L146–L161), `SYNTH` (L163–L233); mute button (main.js L54–L89).
- **Size:** 235 lines.
- **Tangled with content:** clean.
- **Fingerprint:** `tone` is an oscillator with an exponential envelope and glide; `filtered` is a 1 s noise buffer through a swept biquad. Effects gain 0.7; mute only, no volume sliders. 5 lines differ from the first upload.

#### Ambience and effects — effects
- **Does:** Painted lights get cached radial-gradient discs drawn with `lighter`, flickering on 3 sines and flaring for the ending. Wisps are seeded by scene and night; ghosts not yet seen show as motes. Duds show hiccup bubbles, Bellow capitals and Crosspatch stomps. decor.js fades the branches and willow to about 0.47 while she is under them, and standins.js draws missing art in code.
- **Main pieces:** `seeded`/`hashString` (ambience.js L25–L41), `glowDisc` (L46–L62), `Ambience` (L64), `drawLights` (L123–L140); `updateDudFx` (dudfx.js L34–L48); canopy fade (decor.js L363–L376); standins.js L28–L82.
- **Size:** ~1,100 lines (mostly not read line by line).
- **Tangled with content:** flicker and wisps are clean; decor is deeply tied.
- **Fingerprint:** `FLICKER` per light kind (config.js L125–L130). Wisps by phase: full 3, waning 4, new 7, waxing 4. No particle pool; fade to black is the only transition.

#### Minimaps — minimap
- **Does:** The corner map (96×72) is a dimmed thumbnail of the scene with the walk area lit, re-cached when the polygons change. The region map shows 84×63 thumbnails at fixed `LAYOUTS` positions, joined by dotted lines.
- **Main pieces:** `cornerPicture` (minimap.js L36), `CornerMap` (L63), `LAYOUTS` (L122–L150), `WitchWayMap` (L161).
- **Size:** 258 lines.
- **Tangled with content:** some untangling (layouts placed by hand).

#### Region mechanics: Fells and Deep — content-tied mechanics
- **Does:** The Fells have the lift, telescope, hives, Lull beds and seat; a gust blows her hat back along the path to fetch. `sceneBackground` and `deepBackground` pick story-state paintings. Goblin's gold shows only within 130 px and in front of her (dot > 0.55), and `state.glinting` is set **non-enumerable** so it is never saved. Nutmeg follows a 40-point trail (aiming 14 back, lerp `dt·6`, stopping within 26 px).
- **Main pieces:** `sceneBackground` (fells.js L43–L52), `Fells` (L54–L278); `deepBackground` (deep.js L44–L53), `Deep.update` (L132–L156; follower L144–L154).
- **Size:** 785 lines.
- **Tangled with content:** deeply tied. The follower and the facing-cone test are reusable.

#### Scene editor (F2), play-test seeding, RNG — debug / RNG
- **Does:** The editor has zoom and pan, and tools for polygons, exit rects with spawn points, herbs, friends, places (25 kinds), lights (4 kinds) and teleport, with undo. It saves via `POST /api/save-scenes` (tools/serve.py), or downloads `scenes.json`. P on the title starts a walk with Chapter 1 done, at the pond, the mountain or the Cradle, in its own slot.
- **Main pieces:** `Editor` (editor.js L33), `save` (~L530–L543), `formatScenes` (L845–L848); `seedPlaytest` (playtest.js L15–L83); `seeded` (rules.js L105–L114, **duplicated** at ambience.js L25–L34), `hashString` (ambience.js L36–L41).
- **Size:** ~980 lines.
- **Tangled with content:** some untangling.
- **Fingerprint:** RNG is mulberry32 (`+0x6D2B79F5`) plus FNV-1a. `Math.random` is used only for sound pitch, particles, ending sparks and wind (sound.js L141/L166/L172, brew.js L200–L216, ending.js L122, fells.js L180). Gameplay never rolls: Inkblot and the knockers choose by `night %`.

#### Build, tests and self-checks (repo) — tests/tools
| File | What it checks or does |
|---|---|
| `tests/unit/chapter1.test.mjs` (13) | Chapter 1 lists; every recipe in any order; duds; water and grimoire; gathering conditions; sleep; gates; 47 pages, Wren; ending; finished save survives `checkedSave` |
| `tests/unit/opening.test.mjs` (12) | the first Fells places joined both ways; spawns standable; calmbud pages and nights; bench night; rooms and `inCottage` saves; reachability; play-test walk |
| `tests/unit/pathpolish.test.mjs` (13) | riverbank exits; doors by press; Inkblot; rest anywhere; Lantern Oil; river story; return-one; adventures; save repair |
| `tests/unit/mountain.test.mjs` (19) | Chapter 1 recipes stay exact; virtues, balm, bitters, overdose, mantle, calmbud; example recipes; reachability; gates; friends; Nibble; letters; Lull; Quiet Cup; gusts; saves; journal |
| `tests/unit/cradle.test.mjs` (14) | moonmilk vs moonwater; still and tinctures; overdoses; reachability; shafts; gates; friends; shoes; knockers; glint; Moon Sleeps; saves |
| `tests/browser/run.mjs` + `lib.mjs` (10 groups, 52 steps) | headless Chromium on the built file and the dev server: every exit of every scene, gathering, talking, brewing, sleep/save/reload, both stories, the way up, Fells, Cradle, adventures, "no errors in the page" |
| `tools/build_single.py` | follows imports from `src/main.js`, wraps modules, packs data as JSON and assets as Z85 (PNG → lossless WebP when smaller) |
| `tools/unbundle.py` | single file (data-URL or Z85) → project tree |
| `tools/check_roundtrip.py` | rebuilds and compares with a reference: page and code byte for byte, assets and data by content |
| `tools/make_art.py` + `art_spec.json` | cuts source art to WebP at 3× drawn size, writes `art.json`; story states as changed tiles |
| `tools/scene_overlay.py` | draws a scene's walk, blocked and exit shapes over its painting |
| `tools/serve.py`, `bundle_format.py`, `make_standins.py` | no-cache dev server with the editor save route; shared format helpers; recoloured stand-in art |

### Content
| What | Where | ~lines |
|---|---|---|
| Kit manifest v5: 13 herbs, 10 curios, 10 brews, 4 duds, 5 charms, 10 friends, 4 letters, phases, ending, tunables, controls | `witch_game_assets/manifest.json` (86 KB, packed) | — |
| Wickhollow additions: riverbank scene, 2 exits, 13 herb virtues | `data/regions/wickhollow.json` | 87 |
| Sable Fells: 8 scenes, 9 herbs, 5 curios, 8 virtue remedies, 3 duds, 7 friends, 2 letters | `data/regions/sable_fells.json` | 791 |
| The Cradle: 6 scenes, 6 herbs, 6 curios, 5 moonmilk remedies, 2 duds, 4 friends | `data/regions/cradle.json` | 545 |
| Walk polygons, exits, spots, places, lights, wisp areas for 21 scenes (`version: 1`) | `data/scenes.json` | 4,813 |
| Lines for 20 friends | `data/dialogue.json` | 464 |
| 355 wording keys with `{name}` blanks | `data/wording.json` | 396 |
| 181 painted pictures (15 backgrounds, 10 story states, 156 others), each with size, anchor, scale and tiles | `data/art.json` | 17,422 |
| Walker sheet; cloud cover | `data/walker.json`, `clouds.json` | 74 |
| Rewards, letter recipes, `when` rules, spot requirements | trades.js L14–L43, L163–L169; rules.js L127–L131 | ~45 |
| Rooms, brew places, title adventures, map layouts, reach tables | rooms.js L12–L16; brew.js L37–L45; title.js L25–L28; minimap.js L122–L150; actions.js L34–L41; fells.js L37–L40; deep.js L38–L41 | ~70 |
| Play-test seeds | playtest.js L15–L83 | 69 |
| 361 WebP, 2 TTF, 2 MP3 (22.6 MB) | single file L180 | — |

### Presentation
| What | Where | ~lines |
|---|---|---|
| CSS colours: `--letterbox #07030a`, `--gold #c9a04a`, `--gold-bright #f3cf73`, `--plum #1a0a1c` | single file L9–L159 | 150 |
| CSS styles: pixelated canvas; pad and buttons; rotate note; editor panel | single file L9–L159 | (same lines) |
| HTML: `canvas#screen`; `#touch` (`#pad`, "A", "B", "Menu"); `#rotate`; `#editor` | single file L161–L179 | 19 |
| Fonts (Pixelify Sans, Jacquard 12); text and UI colours | assets.js L214–L228; text.js L14–L21; ui.js L6–L13 | 31 |
| HUD: corner map at (8, 8); moon badge; mute button [614, 64, 22, 18]; almanac; charm helpers; dud badge | config.js L46–L56, L147–L148; map.js L702–L760 | ~70 |
| Screens: intro, title (`overlays.json` rects), dialogue, Found-it panel {24, 18, 592, 318}, books, journal, menu, basket, cauldron | screens/*.js, dialogue.js, foundit.js, grimoire.js, … | ~2,700 |
| Visual tuning (ghost, herb glow, flicker, wisps, new-moon veil, swamp tint) | config.js L74–L142 | 70 |

### Shared-code clues
- **Envoi's painted walker came from Path Polish, not milestone 4 (verified).**
  - The file is `envoi-on-the-longest-night` @ `origin/claude/confident-albattani-nhdy6e`, `src/walk/painted-io.js:1–2`: "painted-io.js: Io walking the ground maps as Chris's Path Polish paints her (follow-me-down-witch-way, versions/path-polish/game: art/witch-walk-hd-v1.png, src/sprites.js and src/motion.js)".
  - Path Polish is a separate, older codebase (`versions/path-polish/game/src/`, 16 files; save key `'witch-way-save-v1'` at its `config.js:10`).
- **Envoi's field walking, "after Witch Way's pad and walker" (verified):**
  - `putting-it-all-together/README.md:24`: "…a one-thumb pad, slipping round corners | `../src/game/field.js` | In (pass three), after Witch Way's pad and walker".
  - `src/game/field.js:59`: "(Witch Way's pad, follow-me-down-witch-way game/src/input.js)".
  - `src/game/field.js:289`: "(Witch Way's walker.js, slide)".
  - The code is rewritten: Envoi's slip loop at `field.js:291` steps 2 px along a perpendicular. The idea came over, not the file.
  - Also `docs/design-decisions.md:1004`: "after Witch Way's scene editor".
- **Moonlight in the Aether (`20-min`) took the Moonlight Witch and Wickhollow (verified):**
  - `20-min` @ `origin/ccr-5afa0fa7-7ojc16`, `docs/HANDOFF.md:7`: "It merges the user's games: *Follow Me Down Witch Way* (the Moonlight Witch, Wickhollow), Aethermoor (…), and Thareia (…)".
  - The brewing rules were ported by rewriting: `src/brew/rules.js:8`: "Witch Way's rules (game/src/brewing.js), kept:", followed by a "Changed here:" list. Its `brewResult(herbs)` (L36) covers only the Chapter 1 rules.
  - Lines and art taken: `src/areas/gloamwood.js:462` "His lines are Witch Way's (game/data/dialogue.json, "silas")"; `src/actors/silas.js:650` uses `game/art/props/kettle.webp, crock.webp, bench.webp`.
  - No shared function names (besides `brewResult`) or save keys turned up in a grep.
- **Spin-offs on branch `origin/ccr-4b49ab19-vv72q2`** (`b9d1a99`; not inventoried here). Its `README.md` lists "`one-moon/` | **One Moon**, a second, short game from the same art" and "`condensed/` | **The Short Road**, Witch Way condensed".
- **Inside this repo:** `lantern.js:1` and `river.js:1` say "(moved here from Path Polish…)", and `decor.js:1` says "Path Polish's touches … moved here with its stories". The art.json entry `lamp` names `versions/path-polish/game/art/lantern-props-v1.png` as its source.
- **Mooncart:** `games.json:5` builds this game with `tools/build_single.py`, and L13–L15 set its save slots. Which branch it builds from was not checked.

### Notes
- **Older versions (grep and line diffs only):**
  - The first upload (8,332 lines, 41 modules) already had every core system. That covers the walk mask, the walker (66 px/s, diagonals, 7 px slide), input, text, screen and the editor. It also covers clouds, gathering, Chapter 1 brewing, trades, gates, the ending, grimoire, altar, Found-it and minimap, and a cottage screen.
  - Diff against milestone 4: input, screen and text are code-identical. world differs by 6 lines, walker by 9, sound by 5, rules by 87 and brewing by 186.
  - **Milestones 1–4 added** these modules: regions, regionart, rooms and `screens/room.js` (replacing `screens/cottage.js`), rest, bench, notes, stories, journal, lantern, river, decor, mountain, cradle, fells, deep and playtest.
  - Milestones 1–4 also added these features: virtue, base and still brewing; `keepsNight` stacks; Z85 packing; hi-res painted art; story-state tiles; save v2 with one slot per mode.
  - Path Polish's stripped copy (504 lines) is one base64 code module, so it couldn't be inventoried.
- **Ready to extract:**
  - The rule modules (rules, brewing, gates, trades, collection, rest, mountain, cradle) are plain `(manifest, state)` functions with no DOM.
  - 71 Node tests cover them.
- **Duplication:**
  - "Take one from the basket" is written 5 times (gates.js L75–L79, trades.js L91–L93, mountain.js L50–L53 and L143–L145, brewing.js L226–L229).
  - `basketCount` is redeclared in mountain.js L18 and cradle.js L17, to avoid import loops.
  - mulberry32 appears twice.
- **Risky globals:** assets.js patches `drawImage` for every canvas on the page and redefines `width`/`height` on Image objects (L149–L169).
- **Mooncart mismatch:** A sends Enter, which this game treats as *menu*. Gathering, talking and using places need Space or Z (confirm).
- **Saves:**
  - Repaired, not migrated, and nothing reads the v1 key.
  - `scenes.json` is `version: 1` with no migration.
  - `glinting` is kept out of saves by being non-enumerable (deep.js L143).
- **Content in code:** REWARDS, WHEN, ROOMS, LAYOUTS, PLACES and the reach tables. Ids such as `calmbud`, `runestones`, `village>hollow` and `wisp_jar` are hard-coded into the rules. The map screen imports 36 modules.
- **Size budget:** the build is 29.1 MB, under the 30 MiB send limit (CODE-MAP). Backgrounds load per region because 14 more paintings would have added about 88 MB of decoded pixels.
