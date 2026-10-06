## One Moon (Witch Way spin-off)

**What it is:** a ~15-minute game from Follow Me Down Witch Way's art: five nights (one turn of the moon). Friends knock at dusk, she gathers by Moonlight in a dimmed painting against a 75-second moon timer, brews at her cauldron, and holds the Full Moon Gathering on night 5.
**Inventoried:** `follow-me-down-witch-way` @ `origin/ccr-4b49ab19-vv72q2` (`b9d1a99`), `dist/One_Moon.html` (built by `tools/build_one_moon.py`): full size 12,495,376 bytes, stripped 250 KB, 4,803 lines. Source is `one-moon/src/` (19 files, 4,503 lines), stripped at `game-systems/stripped/one-moon/source/one-moon/src/`. **Line numbers refer to the stripped source files** (`src/<file>:L`). The built file is the same code, so its ranges are given in the code map too.
**Tech:** 2D canvas (640 x 360 logical page), plain ES modules. The build packs them into one `<script>`, each module wrapped as `const __mN_src_x_js = (() => {...})()` with its imports blanked. No outside libraries. Assets sit in `window.__BUNDLE` as base64 data URLs: 136 PNG, 7 WebP, 2 TTF, 1 MP3 (built line 87, 67,820 chars). The kit manifest is inlined as `__BUNDLE.data`.

### Coverage
- **Read fully:** `engine.js` (180), `game.js` (67), `main.js` (130), `state.js` (28), `assets.js` (57), `witch.js` (64), `rules.js` (370), `sound.js` (215), `text.js` (110), `ui.js` (174), `fx.js` (89); `screens/gather.js` L1–504 and L693–781; `screens/cottage.js` L1–390 and L528–545; `screens/night.js` L1–52; `screens/map.js` L1–100; `screens/title.js` L1–85; `screens/finale.js` L1–104 and L201–233; `overlays.js` L1–108 and L345–364; `docs/ONE-MOON.md`.
- **Skimmed:** `data.js` (359: outline of every export; sampled NIGHTS L12–18, constants L21–26, REQUESTS L33–56, PLACES L178–200, GATES L260–264, FIND_PERKS and HERB_TINT; counted 7 places, 109 herb spots and 10 requests); the draw-only parts of `gather.js` (L504–692: highlights, friends, wisps, crow, altar), `cottage.js` (L390–807: fire, pot, visitors, workbench, SwapView), `finale.js` (L104–200, L234–290), `overlays.js` (Card, Letter, Choice, Book, L109–344; names and constructors only). Tests: `tests/one-moon/rules.test.mjs` (test names; L138–175 read), `play.mjs` (step names, L1–40), `lib.mjs` (exports). Tools: `build_one_moon.py` (docstring and function list).
- **Skipped:** the base64 bundle (built L87), the CSS in the built file beyond a read-through (L8–83), `one-moon/index.html` (diffed against `condensed/index.html`: only the title, aria-label and portrait hint differ), and `tests/browser/lib.mjs` (shared runner; name only).

### Code map
| Lines / files (built file range) | Group | What | ~lines |
|---|---|---|---|
| built L1–86 (`index.html`) | presentation | CSS: letterbox, safe-area padding, portrait hint, canvas element | 86 |
| `engine.js` (91–277) | system | logical page, canvas scaling, pointer, keys, easing/rand helpers | 180 |
| `game.js` (278–351) | system | shared game object, screen registry, fade, overlay stack, shake | 67 |
| `assets.js` (352–415) | system | bundle-or-fetch URLs, image cache, fonts | 57 |
| `text.js` (416–532) | system | outlined text, labels, wrapping, Bellow Broth shouting | 110 |
| `sound.js` (533–754) | system | one music loop, 19 synthesized sounds, mute | 215 |
| `witch.js` (755–825) | system | witch sprite-sheet drawing and dud looks | 64 |
| `data.js` (826–1191) | content | nights, requests, rewards, places and spots, gates, letters, dawn and toast lines | 359 |
| `ui.js` (1192–1375) | system | panels, buttons, slots, the `Hits` tap registry | 174 |
| `rules.js` (1376–1752) | system | pure rules: pot, friends, still-needed, gates, sleep, Gathering, swaps, verdict | 370 |
| `overlays.js` (1753–2130) | system + presentation | Talk, Card, Letter, Choice, Book (recipes), overlay update | 364 |
| `state.js` (2131–2165) | system | save and load | 28 |
| `screens/title.js` (2166–2288) | presentation | intro lines, title, new or continue | 108 |
| `screens/night.js` (2289–2419) | presentation | moonrise card (saves here), Wren's letter | 115 |
| `fx.js` (2420–2516) | system | sparks, sparkles, bubbles, floating words | 89 |
| `screens/cottage.js` (2517–3340) | system + presentation | visitors, cauldron, shelf, give queue, Quill's swaps, sleep | 807 |
| `screens/map.js` (3341–3550) | system + presentation | Witch Way chooser, gates, thumbnail downscaler | 195 |
| `screens/gather.js` (3551–4348) | system | gathering by Moonlight, moon timer, mandrakes, clouds, Inkblot | 781 |
| `screens/finale.js` (4349–4655) | presentation | altar, Gathering, toasts, Wren, ending verdict | 290 |
| `main.js` (4656–4799) | system | boot, picture list, frame loop, dud timer, test hook | 130 |
| **Total** | | systems ~2,350 · content ~360 · screen and presentation ~1,800 | ~4,500 |

### Systems
#### Game loop and screen manager (system)
- **Does:** `requestAnimationFrame` drives a variable timestep, with dt clamped to 0.05 s (16 ms on the first frame). Each frame is wrapped in try/catch (only the first 5 errors are logged) so the loop always continues. If an overlay was open at the start of the frame, the screen underneath gets no pointer or key presses that frame. Screens register themselves in `SCREENS` so they never import each other. A black fade (alpha step = dt x speed, default 3) swaps screens at full black. Screen shake is a random integer translate that decays over 0.4 s.
- **Main pieces:** `frame`/`step` (main.js L65–112), `SCREENS`, `game` (game.js L7–18), `setScreen` (L20), `fadeTo`/`updateFade`/`drawFade` (L27–56), `busy` (L62), `shake` (L64–67), test hook `globalThis.__om` (main.js L128).
- **Size:** ~200 lines.
- **Depends on:** engine.js, overlays.js.
- **Tangled with content:** clean.
- **Fingerprint:** rAF, variable dt, clamp 0.05. No pause state, but the music pauses on `visibilitychange`. Fade colour `#07030a`. All pictures are loaded before the intro (main.js L25–61), with a loading bar.

#### Screen scaling and input (system)
- **Does:** the logical page is 640 x 360. The canvas backing is a whole number of device pixels per game pixel, capped at 3 (`ceil(css*dpr - 0.15)`), while CSS stretches it smoothly to fit the window. Pointer events become game coordinates. A tap is a release after less than 12 game px of travel and less than 0.6 s. Key presses are latched per frame (`pressed`/`held`). A first-input hook unlocks audio.
- **Main pieces:** `initScreen` (engine.js L18–44), `beginFrame` (L47), `pointer` (L57–68), `initInput` (L78–121), `pollInput` (L124), `KEYMAP` (L137–143), `anyGo` (L155), `onFirstInputDo` (L161), helpers (L170–180).
- **Size:** 180 lines.
- **Depends on:** the DOM.
- **Tangled with content:** clean.
- **Fingerprint:** arrows/WASD = direction, Space/Enter/Z = confirm, Escape/X/Backspace = cancel, M = mute. Mooncart: arrows yes, Enter = A (confirm) yes, Escape = B (cancel) yes, **M = START mutes** instead of opening a menu, H (SELECT) is unmapped. Touch has no on-screen pad: the finger is the Moonlight. Pixel art is drawn with `imageSmoothingEnabled=false`.
- **Drift:** new, not copied. Main `screen.js` `fit()` uses an uncapped integer scale and sets CSS size = device px / dpr (no stretching). Main `input.js` maps Enter to **menu** (input.js L18) and has on-screen touch controls (input.js L1).

#### Asset loading (system)
- **Does:** `url()` returns a data URL from `window.__BUNDLE.assets` if present, otherwise `'../'+path` from the dev server. JSON comes from the bundle or fetch. Images are cached in a Map: `img()` returns null until a picture has loaded (a missing picture only warns), and `loadImages` reports progress. Two kit fonts are loaded with FontFace.
- **Main pieces:** `url` (assets.js L12), `loadJSON` (L17), `loadImage`/`loadImages`/`img` (L24–47), `FONTS`/`loadFonts` (L49–57).
- **Size:** 57 lines.
- **Depends on:** the DOM; `build_one_moon.py` fills the bundle.
- **Tangled with content:** clean.
- **Fingerprint:** base64 data-URL bundle (the main game packs z85 runs instead). No unloading. Fonts: Pixelify Sans (body), Jacquard 12 (title).

#### Text rendering (system)
- **Does:** draws text in the kit fonts with a stroked `#13060f` outline (2.5 px, or 3 px at 24 px and up). It breaks Pixelify Sans "fi/fl" ligatures with a zero-width non-joiner. `drawLabel` puts text on a dark rounded backing for use over paintings, and `wrap` word-wraps. While Bellow Broth is active, text drawn with `shouty` comes out in upper case.
- **Main pieces:** `COLORS` (text.js L6–17), `shout` (L20), `SMALL=14`/`BODY=16` (L23–24), `unjoin` (L29–30), `drawText` (L40–61), `drawLabel` (L64–82), `wrap` (L85–101), `drawWrapped` (L104, unused).
- **Size:** 110 lines.
- **Fingerprint:** never smaller than 14 px.
- **Drift:** new. The colour table matches main `text.js` L13–20, but the main game snaps alpha and draws an 8-direction outline at device resolution (main text.js L1–9).

#### UI kit and tap registry (system)
- **Does:** draws panels in the kit's colours, a parchment box, the magenta four-point sparkle, image drawing (smoothed only at non-integer scales), buttons and item slots. `Hits`: tappable rectangles are registered while drawing (`add`) and swapped in at the end of the frame (`swap`). On the next update, a press-and-release on the same id fires its callback and plays its sound, so a tap always lands on what was drawn.
- **Main pieces:** `UI` palette (ui.js L12–21), `drawPanel` (L23), `drawParchment` (L38), `drawSparkle` (L53), `drawImg` (L63), `Hits` (L85–132), `button` (L135–154), `slot` (L162–174).
- **Size:** 174 lines.
- **Fingerprint:** hit padding 2 px. Border `#c9a04a` (selected `#f3cf73`), inner line `#3a1838`, fill `#1a0a1c`.
- **Drift:** new. Only the palette lines match main `ui.js`.

#### Overlays and dialogue (system)
- **Does:** a stack of modal overlays; only the top one updates and draws (`updateOverlays` also drops finished ones). `Talk` shows a portrait panel with a typewriter at 75 characters per second; a tap first completes the line, the next tap advances. Ghost friends bob and glow. The other overlays are `Card` (item or brew card with a badge), `Letter` (Wren), `Choice` (buttons) and `Book` (recipes). `knockTalk`, `thanksTalk` and `rewardCard` build them from data.
- **Main pieces:** `Talk` (overlays.js L41–106), `drawWants` (L109), `Card` (L134), `Letter` (L187), `Choice` (L218), `Book` (L264), helpers (L320–346), `updateOverlays`/`drawOverlays` (L348–362).
- **Size:** 364 lines.
- **Depends on:** ui.js, text.js, rules.js (names), data.js `REQUESTS`.
- **Tangled with content:** needs some untangling: the helpers read `REQUESTS` and portraits by kit path (`npcs/<id>/<id>_portrait[_happy].png`, L26–28).
- **Fingerprint:** typewriter at 75 chars/s; the Talk panel sits at (8, 236), 624x116; 3 lines visible.

#### Brewing rule (system)
- **Does:** a pot of moonwater (always present) plus up to 3 herbs. Dose duds are checked first (any trigger herb at or above its count). Next comes an exact recipe: the same number of herbs, each listed herb exactly once. Anything else gives the `any_other_mix` dud (Swamp Tea). `brew` uses up the herbs, makes 2 with the Heart charm, and records whether this was the first time.
- **Main pieces:** `MAX_HERBS=3` (rules.js L10), `recipeOf` (L40), `brewResult` (L119–131), `brew` (L134–146).
- **Size:** ~40 lines.
- **Depends on:** the kit manifest (`game.brews`, `game.duds[].trigger`, `game.brewing.base`).
- **Tangled with content:** clean (data-driven).
- **Fingerprint / drift:** **copied (same logic, restructured)** from the branch's `game/src/brewing.js` `brewResult` L27–42. Milestone 4's main `brewing.js` has since added the mountain rules (calmbud, lady's mantle, virtue brewing, balms; main brewing.js L37–105), which One Moon doesn't have.

#### Requests, rewards and progression rules (system)
- **Does:** pure functions over `state`. `dueKnocks` returns requests whose night has come and whose `after` prerequisite is done. `canHelp`/`help` hand over a brew, herb or item and grant the reward: a charm, an item or a perk. Also here: the morning's dawn lines, friends now home in a place, `stillNeeded` (counting what she carries, plus the Gathering's needs once she has the chalice), gates (a brew poured once opens a way for good; an item only has to be carried), spots tonight (an herb shows only if it blooms in the current phase), `sleep` (night + 1, clear tonight's picks, refill the moon), the Gathering checks, Quill's swap (any bottle for exactly 2 herbs), and the verdict (perfect / bright / quiet).
- **Main pieces:** `newState` (rules.js L69–91, `v: 1`), pantry `add`/`take`/`count` (L93–104), `dueKnocks` (L151), `waiting` (L166), `help`/`reward` (L178–197), `dawnLines` (L200), `friendsHomeAt` (L205), `stillNeeded` (L221–242), `isOpen`/`canOpen`/`openGate` (L252–271), `spotsTonight`/`bloomsAt` (L274–290), `herbBlocked`/`herbHidden` (L298–308), `sleep` (L313–320), `gatheringReady`/`holdGathering`/`altarMissing` (L323–342), `swap` (L350–356), `verdict` (L365–370).
- **Size:** ~300 lines.
- **Depends on:** data.js, the manifest.
- **Tangled with content:** needs some untangling: ids like `moon_chalice`, `grave_candle`, `moonlit_draught` and `crypt` are hard-coded in rules (L232–234, L248, L324).
- **Fingerprint:** 5 nights (`NIGHT_COUNT`), phases full, waning, new, waxing, full. Cloudy on waning and waxing (`cloudyPhase`, L60).

#### Moon timer (system, new to this game)
- **Does:** each night the moon is up for `MOON_SECONDS` = 75 s, or +20 s with the Moth charm. Time only runs while she is gathering and nothing is open (gather.js L112–124); it stops at home. Moving between places on the map costs 3 s, and setting out from home costs nothing (map.js L94–97). A warning appears at 10 s left. At 0 the moon sets and she goes home after 1.8 s. The HUD draws the moon icon moving along a dashed half-ellipse (110 x 26) that turns orange when low.
- **Main pieces:** constants (data.js L21–26), `moonSeconds` (rules.js L63), `Gather.update` (gather.js L114–124), `moonset` (L379), `WitchWay.go` (map.js L94), HUD arc (gather.js L709–732).
- **Size:** ~60 lines.
- **Tangled with content:** clean.
- **Fingerprint:** `MOON_SECONDS 75`, `MOTH_EXTRA_SECONDS 20`, `WALK_COST_SECONDS 3`, `LOW_MOON 10`. The main game has no timed night: the moon only changes when she sleeps.

#### Moonlight gathering (system)
- **Does:** the painting is scaled to 640 px wide (K = 640/1448) and scrolls vertically when the light comes within 64 px of the top or bottom. The Moonlight (radius 50, x1.5 with the Owl charm, x0.75 under cloud) follows the mouse (lerp dt x 20) or a held finger, or moves with the arrow keys at 170 px/s. Darkness is a radial gradient whose outer alpha depends on the phase (0.5 to 0.66, +0.08 under cloud), plus an additive light disc and a ring. Hidden herbs and curios are revealed when the light passes within 0.85 x radius, with a chime and sparkles. The Bell charm chimes when something hidden is within 95 px (2.4 s cooldown). A tap picks the nearest pickable thing within 26 px (touch) or 20 px (mouse); confirm picks within 0.7 x radius. Rules for picking:
  - Wolfsbane needs Hilde's gloves.
  - The nightrose won't open under cloud.
  - Mandrakes must be held for 0.9 s. Letting go early makes it scream: shake, a 1.4 s pause before anything else can be picked, and her hat comes off for 2.6 s.
  - With the Horseshoe charm there is a 35% chance of picking 2.
  - The first pick of each herb shows its grimoire card.
- **Main pieces:** `Gather` constructor (gather.js L34–68), `radius`/`covered` (L72–83: cloud for 5 s of every 16), `moveLight` (L134–153), `reveal` (L155–176), `pickAt`/`handlePick` (L179–254), `pick` (L256–277), `scream` (L279), `find` (L291), `useAltar` (L302), `drawNight` (L474–502), `drawHud` (L693–760), `placeGlows` (L771–781).
- **Size:** ~500 lines of logic, ~280 of drawing.
- **Depends on:** rules, fx, ui, overlays, the kit manifest (`needs: 'gloves'|'moonlight'|'gentle'`).
- **Tangled with content:** needs some untangling: `placeGlows` hard-codes painting coordinates for each friend's lamps (L774–779), and the altar and crypt are special-cased.
- **Fingerprint:** `LIGHT_RADIUS 50`, `OWL_LIGHT 1.5`, `HORSESHOE_LUCK 0.35`, `MANDRAKE_HOLD 0.9`, `HERB_SIZE 30`. Wisps: 4 per place (12 on the new moon), doubled in the Hollow.

#### Inkblot the thief (enemy AI, small)
- **Does:** until Inkblot is given his feather, he arrives once a night 10–26 s into an outing (18–30 s on night 1), but only if this outing's basket has herbs. He swoops in for 0.9 s on an eased arc, eyes the basket for 2 s, then takes the last herb picked (or the first in the basket). A tap within 30 px during the swoop or eye phase shoos him. After his feather is returned, he leaves an herb at the door each dusk instead: a still-needed herb if there is one, otherwise a common bloomer for tonight.
- **Main pieces:** gather.js L65–67, `updateCrow` (L320–356), `crowGrabs` (L358–375); `Cottage.inkblotGift` (cottage.js L127–140).
- **Size:** ~75 lines.
- **Tangled with content:** needs some untangling (perk ids).
- **Fingerprint:** states swoop, eye, flee; once a night (`state.tonight.inkblot`).

#### Cottage, cauldron and visitor queue (system)
- **Does:** an action queue (`queue` + `next`) runs the dusk events in order: Inkblot's gift, knocks (a knock sound, then the knock talk, repeated until none are due), then `giveWhatsReady`, which flies each ready brew, herb or item to the waiting friend, plays the thanks talk and reward card, and re-checks for knocks such as Hilde's second favour. Visitors take floor spots in order (7 spots; Quill gets his own door spot once he swaps). The cauldron:
  - Tapping shelf herbs pours them into the pot (0.4 s each); the first one lights the witchfire.
  - The liquid colour is the average of the herb tints mixed 70/30 with `#78…`.
  - Stirring takes 1.3 s, then `rules.brew`, then a card.
  - A dud lasts 30 s (`game.dud`, counted down in main.js L82–85).
  - Hiccup Tonic hops her every 1.6–3 s, Swamp Tea tints her green, Droopy Hat wilts her hat, Bellow Broth makes text upper case.
  - Sleeping asks for confirmation if the moon is still up or this is the last night.
- **Main pieces:** `Cottage` (cottage.js L35–386): `placeVisitors` (L82), `arrivals` (L114), `giveWhatsReady` (L143–166), `addHerb` (L202), `mixColour` (L222), `startBrew`/`finishBrew` (L234–285), `startDud` (L287), `askSleep`/`sleepNow` (L304–322), `update` (L330–386); `SwapView` (L742).
- **Size:** ~350 lines of logic, ~450 of drawing.
- **Depends on:** rules, overlays, fx, witch, sound.
- **Tangled with content:** needs some untangling: the coordinates are for `screens/cottage.png` (`CAULDRON 122,118`, `WITCH 232,246`, L24–30), and the per-brew hint strings are inline (L267–271).
- **Fingerprint:** `STIR_SECONDS 1.3`, `DUD_SECONDS 30`, a 3-slot pot, an 8x2 shelf.

#### Witch Way map (presentation + small system)
- **Does:** a grid of place cards showing what blooms there tonight. A shut way shows what opens it and offers to pour the brew if she carries it. A cached downscaler (`thumb`) halves a painting repeatedly into a 3x canvas.
- **Main pieces:** `thumb` (map.js L19–48), `WitchWay` (L50–193).
- **Size:** 195 lines.
- **Fingerprint:** cards 146x134, thumbnails 138x58.

#### Witch sprite and dud looks (animation)
- **Does:** draws the main game's walking sheet (`game/art/walker/witch_walker.png`, cells 94x86, feet at 60,84). Rows: down, left, right, up, gather, hat off, cast. The walk cycle is 6 frames at 10 fps; standing still adds a 1-px breath (`sin(t*2π/1.6) > 0.6`). Swamp Tea tints through an offscreen `source-atop` canvas. Droopy Hat draws the top 30 px of the sprite rotated by 0.65 rad. Hiccup is a vertical hop offset.
- **Main pieces:** `drawWitch` (witch.js L17–64).
- **Size:** 64 lines.
- **Fingerprint / drift:** new code over the main game's sheet. The frame rate matches main `CONFIG.WALK_FPS 10` but is hard-coded.

#### Particles and floating words (effects)
- **Does:** `Fx` keeps unbounded arrays (no pool, no cap) of three particle kinds: sparks (velocity plus gravity), four-point stars, and expanding bubbles. Floating words rise 18 px and fade over their last 30%; a word that would land on another starts higher (up to 4 tries), and words are clamped on screen.
- **Main pieces:** `Fx` (fx.js L6–89).
- **Size:** 89 lines.
- **Tangled with content:** clean.
- **Fingerprint:** no maximum count; dead particles are filtered every frame.

#### Sound (audio)
- **Does:** one looping MP3 (`game/music/moonlit_forest_path_1.mp3`) at volume 0.32. Web Audio sound effects: `tone` (oscillator with an exponential envelope and optional glide), `filtered` (1 s white-noise buffer through a biquad filter), and 19 recipes: tick, pluck, bubble, plop, whoosh, stir, pop, dud, caw, chime, jingle, thanks, knock, shriek, sorry, ouch, hiccup, moonset, open. Mute is remembered in localStorage, and music pauses when the page is hidden. `musicLevel` softens the music during letters and the Gathering. A log of the last 60 sounds is kept for tests.
- **Main pieces:** `MUSIC`/`MUTE_KEY`/`MUSIC_VOLUME` (sound.js L7–9), `unlockSound` (L19–40), `setMuted` (L50), `musicLevel` (L57), `play` (L63), `tone` (L74), `filtered` (L97), `SYNTH` (L114–213).
- **Size:** 215 lines.
- **Fingerprint:** sfx gain 0.9; key `one-moon.muted`.
- **Drift:** **copied and changed** from `game/src/sound.js`. The `tone`/`noiseBuffer`/`filtered` core and the pluck, bubble, whoosh, caw, chime, jingle and shriek recipes are verbatim (main L123–163, L181–232 match OM L75–114, L144–200). Removed: the two-track alternation, the `RECORDED` file override and `CONFIG` volumes. Added: 12 recipes. Changed: the mute key (main: `follow-me-down-witch-way.muted`).

#### Save and load (system)
- **Does:** one save slot, written only when the moonrise card opens (night.js L26). Tonight's picks, reveals and events are blanked before saving. On load, the save is rejected unless `v === 1`, then merged over `newState()` (stats merged too). The save is cleared on a new game, on entering the Finale and on the Ending.
- **Main pieces:** `saveGame`/`loadGame`/`clearSave` (state.js L7–28); callers night.js L26, title.js L75, finale.js L33, L216.
- **Size:** 28 lines.
- **Fingerprint:** localStorage key **`one-moon.save.v1`**; JSON of the whole state; version field `v: 1` with no migration; 1 slot; autosave at each dusk. Mute key `one-moon.muted`. (Main game: `follow-me-down-witch-way.save.v2`, plus `.lantern`, `.river` and `.playtest` slots.)

#### Tests and build tools (balance and self-checks)
- `tests/one-moon/rules.test.mjs` (216 lines, `node --test`): checks that every herb, brew, friend and picture named in the story exists in the kit; the pot (exact recipes, dose duds, Swamp Tea); that brewing uses herbs up and Heart doubles; knock order and Hilde's return; help and reward; still-needed counting; gates; what blooms per phase, and that picks reset on sleep; **solvability** (every request's herbs bloom on some night, ghost pipe only on the new moon in the crypt, wolfsbane only on the waning night when Hilde asks, L157–172); the Gathering conditions; Quill's swaps; and that nothing reads past the last night.
- `tests/one-moon/play.mjs` (387 lines, Playwright and headless Chromium, through `__om`): plays a whole moon in the built file, night by night through the Gathering; then, from source: mandrake tap and hold, Inkblot shooed or pinching, wolfsbane without gloves, Hiccup Tonic, Bellow Broth, Quill's swap, the recipe book, moonset going home, the quiet ending, "Where were we?". Then a phone run (touch, dpr): tapping picks by moonlight, and the canvas fits with nothing to scroll. Every section fails on any page error.
- `tests/one-moon/lib.mjs` (134 lines): Playwright helpers (`openOneMoon`, `tapId`, `waitScreen`, `lookAt`, `gatherOne`...).
- `tools/build_one_moon.py` (236 lines): packs `one-moon/index.html` with every ES module reachable from `src/main.js` (imports resolved and blanked, exports dropped, each module an IIFE; dynamic `import()` is refused), the manifest and only the assets the game uses (as data URLs) into `dist/One_Moon.html`. `--artifact` writes the page without `<html>/<head>/<body>`. Its `pack_code` is reused by The Short Road.

### Content
| What | Where | ~lines |
|---|---|---|
| Nights (phase, who knocks, letter) | data.js L12–18 | 7 |
| 10 requests (9 friends), each with knock and thanks lines shortened from `game/data/dialogue.json` | data.js L33–145 | 113 |
| Short names, rewards (charm, item or perk) | data.js L147–164 | 18 |
| 7 places, 109 herb spots `[herb,x,y]` in painting pixels, finds, `needs`, `view` | data.js L178–258 | 80 |
| Gates (stream, hollow, crypt) and their strings | data.js L260–264 | 5 |
| Find perks, herb tints (cauldron colours) | data.js L267–284 | 18 |
| Wren's letters, dawn news, homes, "after" lines, toasts, Gathering and quiet lines | data.js L286–359 | 74 |
| Intro lines | screens/title.js L14 | 10 |
| Verdict titles | screens/finale.js L201–205 | 5 |
| Kit manifest (herbs, items, brews, duds, charms, phases, friends) | bundle data (`witch_game_assets/manifest.json`, 86 KB) | n/a |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Page CSS: `--night #07030a`, plum, gold `#c9a04a` and `#f3cf73`, letterbox with 16 px gutters and safe-area insets, "Turn your phone sideways" hint in portrait | built L8–86 | 78 |
| Kit UI palette and fonts (Pixelify Sans, Jacquard 12) | ui.js L12–21, assets.js L49 | 15 |
| Moonrise card (70 twinkling stars, phase title) | screens/night.js L52–113 | 60 |
| Cottage drawing (fire, pot, visitors, bubbles, workbench) | screens/cottage.js L390–740 | 350 |
| Gathering HUD (place name, Home and Witch Way buttons, moon arc, basket, "Needed:" strip) | screens/gather.js L693–760 | 70 |
| Finale (altar flash, Gathering painting, toasts, Wren's visit), ending | screens/finale.js L104–290 | 180 |

### Shared-code clues
- rules.js L4: "The brewing rules are the big game's, unchanged: a bottle of moonwater (always in the pot here)…". Confirmed: it matches `game/src/brewing.js` L27–42 on this branch.
- sound.js L2: "(the big game's, plus a knock, a plop, a pop and a sad trombone for duds)". The main game's synth core is verbatim (see Sound).
- witch.js L1: "Her, drawn from the big game's walking sheet (game/art/walker/witch_walker.png, 94 x 86 cells, feet at 60, 84)".
- data.js L6–7: "the same numbers the big game's scene editor uses (game/data/scenes.json), so a herb sits where it grows there". data.js L30: "Lines are shortened from game/data/dialogue.json".
- engine.js L3: "The game is laid out on a 640 x 360 page, like the big game."
- Shared with The Short Road: `fx.js`, `game.js` and `text.js` are byte-identical; `engine.js` and `ui.js` differ by 1–3 lines; `tools/build_condensed.py` imports `pack_code` from `build_one_moon.py`. The intro, title, night, finale, sound and overlays modules are the ancestors of the Short Road versions.
- Same text-colour constants as the main `text.js` L13–20.

### Notes
- **Drift summary (vs `game/src`):** nothing is copied unchanged. **Copied and changed:** `sound.js` (from `game/src/sound.js`) and the brewing rule inside `rules.js` (from `game/src/brewing.js` L27–42). **New, rewritten in the main game's style:** `engine.js` (replacing screen.js and input.js), `game.js`, `main.js`, `assets.js`, `text.js`, `ui.js`, `witch.js` (drawing the main game's sheet), `state.js`, `fx.js`, `overlays.js` and all `screens/*`. A main-game module with the same name shares at most a handful of lines.
- **Reference versions:** the spin-off branch's `game/src` is unchanged since the merge base `0754d3c` (2026-09-29, before milestone 3: 48 files, no `fells.js`/`deep.js`/`mountain.js`/`cradle.js`). The milestone 4 stripped copy (`origin/claude/bold-turing-t225o0` @ `b95448c`) differs from it in 24 source files, including `brewing.js` and `state.js`, and adds 4 new ones. `sound.js`, `text.js`, `ui.js`, `screen.js`, `input.js`, `main.js`, `game.js`, `save.js`, `world.js` and `walker.js` are identical in both, so the comparisons above hold for either.
- **Charm effects differ from the kit's manifest:** Horseshoe in the kit is "+4 basket slots" but here a 35% double pick; Moth in the kit is "walks a quarter faster" but here +20 s of moon. Owl (x1.5 light) and Heart (x2 brews) match the kit; Bell's chime here also covers hidden finds.
- **Dead code:** `state.hasSave` (L24), `text.drawWrapped` (L104), `engine.inRect`/`easeBack` (L170, L178), `data.COTTAGE_SPOTS` (L167; cottage.js uses its own `SPOTS`, L29). None are referenced by the tests either.
- **Saves:** written once a night, so a reload mid-night returns to dusk with tonight's picks gone; there is no completed-game record because the save is cleared at the Finale and the Ending. `Math.random` is used everywhere (luck, Inkblot, sparkles), with no seeding.

## The Short Road (Witch Way, condensed)

**What it is:** both chapters of Witch Way (Wickhollow and the Sable Fells) as one free-roaming walk: 15 full-size paintings, every path open from night 1, 331 herb spots that all grow back nightly, 17 favours, music by region, and two endings (the Full Moon Gathering and the Quiet Cup).
**Inventoried:** `follow-me-down-witch-way` @ `origin/ccr-4b49ab19-vv72q2` (`b9d1a99`), `dist/The_Short_Road.html` (built by `tools/build_condensed.py`): full size 29,557,472 bytes, stripped 382 KB, 6,083 lines. Source is `condensed/` (24 files: 21 JS files, 5,758 lines, plus `data/scenes.json` 4,738 lines, `data/art.json` 718, `index.html` 89), stripped at `game-systems/stripped/short-road/source/condensed/`. **Line numbers refer to the stripped source files.**
**Tech:** 2D canvas (640 x 360 logical page), ES modules packed by the One Moon packer (built L88–6080; module ranges in the code map). No outside libraries. Bundle (built L87, 138,337 chars): 132 PNG, 97 WebP, 2 TTF, 3 MP3 as data URLs, plus inlined JSON: the kit manifest, `scenes.json`, `art.json` and the main game's `game/data/dialogue.json`.

### Coverage
- **Read fully:** `world.js` (218), `rules.js` (416), `state.js` (25), `people.js` (70); `screens/scene.js` L1–612 and L811–1050, plus L1152–1165 and L612–666 (talk and give); `screens/night.js` L1–100; `screens/title.js` L53–97; `screens/map.js` L17–95; `screens/brew.js` L19–110 and L152–210; `overlays.js` L304–344 (Menu). Diffed against One Moon and read every changed hunk: `engine.js`, `ui.js`, `assets.js`, `main.js`, `witch.js`, `sound.js`. Byte-identical to One Moon: `fx.js`, `game.js`, `text.js`. Also `docs/SHORT-ROAD.md`.
- **Skimmed:** `data.js` (425: exports outlined; sampled L1–70, L100–160; 17 requests counted); `scenes.json` (summarised with a script: 15 scenes, counts of walkable, blocked, exits, spots, places, lights, wisps and friends); `art.json` (top-level keys); the draw-only parts of `scene.js` (L1050–1404), `brew.js` (L210–485), `finale.js` (outline only: `Finale`, `QuietCup` L175, `ChapterEnd` L312) and `overlays.js` (BasketView, Journal, Book, SwapView; names only). Tests: `tests/condensed/rules.test.mjs` (test names; L19–47 read), `play.mjs` (step names), `lib.mjs` (exports). Tools: the docstrings and function lists of `build_condensed.py`, `condensed_scenes.py` and `make_condensed_art.py`.
- **Skipped:** the base64 bundle; scene polygons and coordinates; the long herb notes and the dialogue text.

### Code map
| Lines / files (built file range) | Group | What | ~lines |
|---|---|---|---|
| built L1–86 (`index.html`) | presentation | same CSS as One Moon (title, aria-label and hint text differ) | 86 |
| `engine.js` (91–278) | system | One Moon's + 1 keymap line | 181 |
| `game.js` (279–352) | system | identical to One Moon | 67 |
| `assets.js` (353–435) | system | One Moon's + asset base, decode, painting eviction | 76 |
| `text.js` (436–552) | system | identical to One Moon | 110 |
| `sound.js` (553–860) | system | region music with crossfade, 24 sounds | 301 |
| `data.js` (861–1292) | content | places, rooms, uses, Chapter Two herbs/brews/duds, friends, favours, rewards, letters | 425 |
| `witch.js` (1293–1402) | system | One Moon's + 17 fps, hat cut-out, hatless, stomp, shadow | 102 |
| `ui.js` (1403–1587) | system | One Moon's + finger hit padding | 175 |
| `rules.js` (1588–2010) | system | catalogue, two-chapter pot, favours, sleep events, endings, Lull, swaps | 416 |
| `people.js` (2011–2090) | system | portraits, standing figures, dialogue lookup | 70 |
| `overlays.js` (2091–2696) | system + presentation | Talk (with choices), Card, Letter, Choice, Menu, Basket, Journal, Book, Swap | 592 |
| `state.js` (2697–2728) | system | save and load | 25 |
| `screens/title.js` (2729–2865) | presentation | intro, title, continue at the saved spot | 121 |
| `fx.js` (2866–2962) | system | identical to One Moon | 89 |
| `world.js` (2963–3187) | system | walk mask, A* pathfinding, arrival | 218 |
| `screens/scene.js` (3188–4611) | system | walking, camera, interaction, exits, place mechanics, drawing | 1,404 |
| `screens/brew.js` (4612–5115) | system + presentation | cauldron at 5 brewing spots, beds | 485 |
| `screens/night.js` (5116–5268) | system + presentation | ask to sleep (almanac), moonrise news | 137 |
| `screens/map.js` (5269–5515) | presentation | Witch Way node map (travel), Hester's telescope | 232 |
| `screens/finale.js` (5516–5928) | presentation | Gathering, Quiet Cup, chapter ends | 395 |
| `main.js` (5929–6079) | system | boot (loads 4 JSON files), frame loop, `__cw` hook | 137 |
| `data/scenes.json`, `data/art.json` | content | walk polygons, exits, 331 spots, places, lights, wisps; art index | 5,456 |
| **Total** | | systems ~3,300 · content ~5,900 (with JSON) · presentation ~1,700 | ~11,300 |

### Systems
Identical or near-identical to One Moon (see that section). Each is one line here.
- **Game loop and screen manager:** `game.js` is identical. `main.js` changes: it also loads `condensed/data/art.json`, `scenes.json` and `game/data/dialogue.json`, builds `game.cat` (main.js L54–57), calls `updateMusic(dt)` each frame (L86) and exposes `globalThis.__cw` (L135). The dt clamp is still 0.05 (L81).
- **Text:** identical to One Moon's `text.js`.
- **Particles:** identical to One Moon's `fx.js`.
- **Screen and input:** One Moon's `engine.js` plus `Tab: 'menu', e/E: 'confirm'` (engine.js L143). Mooncart: arrows, Enter = A and Escape = B work. In a scene, cancel or menu opens the Menu (scene.js L320), so **B opens the menu, M (START) mutes, H (SELECT) is unmapped**.
- **UI kit:** One Moon's `ui.js` plus a 5 px hit padding for touch, 2 px for the mouse (ui.js L105).
- **Asset loading:** One Moon's plus: `window.__ASSET_BASE` for the Artifact build (assets.js L12), URI-encoded paths (L19), resolving only after `im.decode()` (L34–37), `ready()` (L57, unused) and **`keepOnly()` eviction**: on entering a place it keeps only that painting and its neighbours' (assets.js L63–66, called at scene.js L154–156). Small pictures are preloaded; paintings load as she walks.

#### Catalogue (system, new)
- **Does:** builds one `Map` of every herb, item, charm, brew and dud. Chapter One entries come from the kit manifest; Chapter Two entries come from `data.js` (`HERBS2`, `CURIOS2`, `BREWS2`, `DUDS2`, `ARNICA_SPIT`) with pictures from `art.json`. Each entry has `{id, kind, name, note, icon, card, anchor, chapter, recipe?, trigger?}`. A charm's note is rewritten to its effect in this game. Calmbud stacks carry the night they were picked (`'calmbud@7'`, via `baseId`/`budNight`).
- **Main pieces:** `buildCatalogue` (rules.js L28–46), `thing`/`nameOf`/`isHerb`/`isBottle` (L48–51), `baseId`/`budNight` (L54–55).
- **Size:** ~30 lines.
- **Tangled with content:** clean (data-driven). The lookup pattern could serve the main game too.

#### Brewing rule, two chapters (system)
- **Does:** moonwater is always in the pot, and up to **4** things go in. The checks run in order (header rules.js L4–13):
  1. Chapter One dose duds.
  2. Arnica: only Arnica Balm, otherwise it is spat out and nothing is used (`spit`).
  3. Calmbud: only at Sablehead spring (otherwise `wait`). It must be alone, or the pot makes Swamp Tea. Fewer than 3 buds gives `wait`. Three buds from one night make the Quiet Cup; mixed nights make Crosspatch Tea.
  4. An exact recipe by tally (`exactRecipe`, multiset match).
  5. Gentian without heather honey makes Sourpuss Tea.
  6. Two or more roseroot make Rose-Tinted Tea.
  7. One lady's mantle forgives one wrong herb (tries removing each other herb).
  8. Anything else is Swamp Tea.
  `brew` uses nothing on `spit` or `wait`; Heart makes 2.
- **Main pieces:** `MAX_POT=4` (rules.js L20), `exactRecipe` (L154–163), `brewResult` (L167–202), `brew` (L206–218); Chapter Two recipes in data.js `BREWS2` (L129–139) and duds `DUDS2` (L140–144).
- **Size:** ~70 lines.
- **Depends on:** the catalogue; `where` (`'spring'`) passed in by brew.js L167.
- **Tangled with content:** needs some untangling: herb ids (arnica, calmbud, gentian, heather_honey, roseroot, ladys_mantle) are hard-coded in the rule.
- **Fingerprint / drift:** the Chapter One order and exact-match behaviour come from One Moon's / the branch `brewing.js`. The Chapter Two rules were **written separately from milestone 4's main game**. Main m4 `brewing.js` L37–105 uses *virtue* matching (`virtueBrew`), `balm_only` and `bitter`/`sweet` flags, the `mixed_moons`/`no_honey` dud triggers, a calmbud night suffix `:n`, and base/still options. The Short Road uses fixed two-herb recipes "from the bible", `@n` suffixes and hard-coded dud ids.

#### Favours, rewards and endings (system)
- **Does:** everything is open from the first night (`available`): a favour is waiting unless already helped or its `after` prerequisite is undone. `currentRequest` returns a friend's open favour. Some favours must be used at a place (`r.use`, e.g. Hive Smoke at the hives; `canHelp` L236–245). `reward` handles charms, items and perks; the `honey` perk also adds one heather honey. `stillNeeded` counts only friends she has met. Chapter One's end needs the chalice, a grave candle, the Moonlit Draught and **a full moon**. Chapter Two's end: drink the Quiet Cup on the seat. The Lull's lit bed is 1 to 3, advancing with each bud picked (full moon only).
- **Main pieces:** `newState` (rules.js L61–90, `v: 1`, starts at night 1, full moon, scene `village`), `available`/`currentRequest`/`canHelp`/`help`/`reward` (L224–273), `friendDone` (L276), `stillNeeded` (L288–310), `gatheringMissing`/`holdGathering` (L366–381), `drinkQuietCup` (L384), `litBed` (L393), `bottles`/`swap` (L406–416: excludes the Quiet Cup, the Moonlit Draught and calmbud).
- **Size:** ~150 lines.
- **Tangled with content:** needs some untangling (special ids).
- **Fingerprint:** 17 favours (data.js L181–327), each tagged with its chapter.

#### Nights and sleep events (system)
- **Does:** the phase cycles full, waning, new, waxing. Sleep (in any bed or on any bench) advances night and phase; with the moon almanac she can sleep until a chosen phase (a do-while loop). Sleep clears tonight's picks and the Lull count, then rolls events:
  - Inkblot pinches one random **common Chapter One** herb from the basket, or, once he has his feather, leaves a random Chapter One herb.
  - Nibble (once met, before her bell is returned) eats the first bitter herb in `BITTER` order.
  - The honey perk sets "honey waiting".
  The moonrise card lists dawn news, these events and honey. Every herb grows every night except calmbud, which needs a full moon (`growsTonight`).
- **Main pieces:** `nextPhase`/`cloudy`/`growsTonight` (rules.js L123–130), `pick` (L135–144: Horseshoe 35%, injectable `luck`), `sleep` (L316–355: injectable `rng`), `dawnNews` (L358); `askSleep` (night.js L25–46), `NightCard` (L48–82).
- **Size:** ~110 lines.
- **Fingerprint:** RNG is `Math.random`, but `sleep(rng)` and `pick(luck)` accept injected values for tests. No moon timer: unlike One Moon, time only passes when she sleeps.

#### Walk mask and A* pathfinding (system, new)
- **Does:** rasterizes a scene's `walkable` polygons (white), then its `blocked` polygons and dynamic `blockers` (black), onto an `OffscreenCanvas` at 2 painting px per cell, and reads it into a `Uint8Array`. `feetFit` tests a 16x8 feet box every 4 px. Pathfinding builds an 8-px grid lazily, marking each cell open if the feet fit at its centre. A* runs with 8 neighbours, no corner cutting, an octile heuristic (`max + 0.414·min`), a binary min-heap and a 60,000-step cap. Start and goal snap to the nearest open cell (radius 3 for the start, 16 for the goal). The path is then smoothed into straight runs by line-of-sight checks every 4 px.
- **Main pieces:** `Walkmap` (world.js L14–168): `rasterize` (L25–41), `walkable` (L43), `feetFit` (L49–57), `buildGrid` (L61–68), `nearestOpen` (L73–88), `path` (L92–141), `smooth`/`clear` (L144–167); `MinHeap` (L170–205); `arrival` (L212, unused: scene.js has its own `arrive`, L63).
- **Size:** 218 lines.
- **Depends on:** the DOM canvas (OffscreenCanvas when available), `scenes.json` shapes.
- **Tangled with content:** clean. A strong extraction candidate.
- **Fingerprint / drift:** the same 16x8 box and 4-px step as the main `game/src/world.js` `feetFit` (L36–47). The main game instead tests point-in-polygon on every check (`walkableAt`, L30–33) and **has no pathfinding**: grep finds no A*, heap or path code in the main game. `MK=2`, `GRID=8`, painting 1448x1086.

#### Walking scene: movement, camera, interaction, exits (system)
- **Does:** the painting is drawn 1:1 in game pixels, unscaled (scene.js L946–947). Movement:
  - Keys move her at `WALK_SPEED` 124 px/s, normalised for diagonals, x1.25 with the Moth charm and x0.85 under Crosspatch Tea. `step` slides along walls and tries sideways nudges at 0.7 x step to round corners.
  - A tap on the ground runs A* (`walkTo`). A tap on a thing acts if it is within `REACH` 44, otherwise walks there with it as the goal, acting on arrival within 1.6 x REACH.
  - A finger held for more than 0.22 s (and moved more than 6 px, or held more than 0.35 s) steers her, re-pathing every 0.15 s.
  - Confirm acts on the nearest thing within REACH.
  Interaction: `things()` lists the herbs growing tonight, curios, beds, places, friends and doors, each with a verb label and a prompt arrow. The camera lerps toward her (k = min(1, dt x 7)), aiming 34 px above her feet, clamped to the painting and snapped to device pixels. Exits: walking within 12 px of an exit rect (22 px for doors, and only while facing up or heading there) leaves the scene. On arrival she spawns at the way back that best matches the side she left from (`arrive`, L63–76). The game saves every 6 s and on each action.
- **Main pieces:** `Scene` constructor (scene.js L95–144), `enter` (L146–168: music region, painting eviction, letters), `things` (L182–222), `verb` (L224–245), `nearest`/`thingAt` (L249–269), camera (L273–280, L306–309), `update` (L284–377), `step` (L380–392), `faceTo` (L394), `walkTo`/`reachGoal` (L400–427), `handlePointer` (L429–475), `checkExits`/`go` (L485–514), `act` (L518–529).
- **Size:** ~450 lines of logic in a 1,404-line file.
- **Depends on:** world.js, rules, people, overlays, assets, sound.
- **Tangled with content:** needs some untangling: the movement and camera code is generic, but `things()` special-cases Agnes and Tobias's bench on full moons (L204–208) and Bracken (L210).
- **Fingerprint:** `WALK_SPEED 124`, `WALK_FPS 17` (the main game uses 66 and 10; data.js L13–14 notes Path Polish walked at 125). `REACH 44`, `AIM 34`, `HOLD_TO_STEER 0.22`. Camera lerp 7/s, no deadzone.

#### Place mechanics (system)
- **Does:**
  - **Picking:** wolfsbane needs gloves. Mandrakes need a 0.9 s hold by finger or confirm key; letting go early makes one scream (shake, her hat flies off).
  - **Lull calmbud:** standing within 70 px of the lit bed and not walking for `STILL_SECONDS` 2.4 opens the bud, and the music dips to 50% while she waits. The lit bed's overlay is drawn from `art.json` states.
  - **Hatless Edge:** gusts every 9–16 s take her hat.
  - **Duds:** every 4–7 s each dud shows its own effect: floating words, buzzing bees, or hiccups.
  - **Bell:** chimes within 150 px of something a friend needs (3 s cooldown).
  - **Places:** hives, the lift, the telescope, the seat, the altar, rest, and the brewing spots (`usePlace`). Pouring Wisp Calm or Rootwalk Draught at a place triggers its event.
  - **Bracken:** follows her 10 points back along a 40-point trail.
- **Main pieces:** `pickHerb`/`pluck`/`updateHolding`/`scream` (scene.js L531–594), `talkTo`/`give`/`gift` (L612–662), `usePlace` (L666–704), `pour` (L719), `useAltar` (L751), `useHives` (L765), `useBed`/`calmbud` (L818–869), `updateHat` (L873–892), `updateDud` (L894–916), `bell` (L918), `brackenSpot` (L1152–1165), `drawLights` (L1002–1021, additive flicker per light kind), `drawPhaseShade` (L1042: new moon 0.2, waning and waxing 0.08).
- **Size:** ~400 lines.
- **Tangled with content:** deeply tied: each mechanic names its place, friend or item.
- **Fingerprint:** `MANDRAKE_HOLD 0.9`, `STILL_SECONDS 2.4`, `GUST_EVERY [9,16]`, `DUD_SECONDS 30`.

#### People and dialogue lookup (system)
- **Does:** Chapter One portraits and standing figures come from the kit manifest (with its ground anchor); Chapter Two's come from `art.json` moods (0 before helping, 1 after). A favour's words come from the main game's `game/data/dialogue.json`, read at runtime: `lines: 'hilde:2'` selects `want2`/`thanks2`/`after2`. `greeting` picks greet+want on first meeting, otherwise want; after the last favour it uses the "later" lines (Tobias has a reunion line). Gideon is special-cased.
- **Main pieces:** `portraitOf`/`standingOf` (people.js L12–33), `wordsFor` (L38–47), `greeting` (L51–70).
- **Size:** 70 lines.
- **Tangled with content:** needs some untangling (Gideon and Tobias cases).

#### Witch sprite (animation)
- One Moon's `drawWitch` with these changes: the walk runs at 17 fps (`WALK_FPS`); the hat is cut at a per-pose top row (`HAT_TOP`, 30 rows) for hatless and droop drawing; `stomp` adds a 2-px thump every third frame; `drawHat` draws the hat alone for wind and screams; `drawShadow` draws a foot shadow. The `scale` option is gone (witch.js L14–100).

#### Brewing screen (system + presentation)
- **Does:** derived from One Moon's cottage cauldron (279 identical lines): the same 1.3 s stir, pot colour mix and cards, with the visitors removed. Five brewing spots: three rooms (her cottage, the Weary Mule, Wren's hut, each with a bed) and two outdoor spots (Silas's kettle, Sablehead spring; the spring passes `where='spring'`). A 4-slot pot and a 7x2 shelf. Entering saves her position outside the door. A dud sets `game.dud` for 30 s.
- **Main pieces:** `Brew` (brew.js L33–485): constructor (L36–67), `enter` (L71–85), `sleep` (L96), `finishBrew` (L164–208).
- **Size:** 485 lines.
- **Tangled with content:** needs some untangling (rooms and backdrops come from data.js `ROOMS`/`USE`).

#### Map and telescope (presentation + small system)
- **Does:** a node map of 15 places at fixed screen positions, with links built from `scenes.json` exits. Marks: friends she can help now; ghosts not yet helped (with the hag stone); needed herbs (with the rune shard). Tapping a visited place offers to walk straight there. Hester's telescope is a separate view.
- **Main pieces:** `NODES` (map.js L17–33), `MapView` (L35–173), `marks` (L61–84), `travel` (L86–93), `Telescope` (L182).
- **Size:** 232 lines.

#### Sound (audio)
- **Does:** One Moon's synth plus **region music**. `TRACKS` has wickhollow (2 pieces alternating on `ended`) and fells (1 piece). `setMusic(region)` fades the other region's player to 0 and starts or keeps this one. `updateMusic` steps each player's volume over `FADE_SECONDS` 1.6 and removes silent players; `musicLevel` scales the whole mix. 24 recipes: drops `knock`, adds bleat, bark, gust, lift, buzz and door; volumes trimmed slightly; long noise sounds loop their buffer (sound.js L146).
- **Main pieces:** `TRACKS`/`MUTE_KEY`/`MUSIC_VOLUME 0.34`/`FADE_SECONDS` (sound.js L9–15), `setMusic`/`startRegion` (L46–69), `updateMusic` (L71–84), `musicLevel` (L100), `musicNow` (L103, for tests), `SYNTH` (L161–299).
- **Size:** 301 lines.
- **Fingerprint:** music files `condensed/music/wickhollow_1.mp3`, `wickhollow_2.mp3`, `fells.mp3` (re-encoded at 128 kbps); sfx gain 0.85. The main game alternates two tracks but has no region crossfade.

#### Save and load (system)
- **Does:** saves the **whole state** (no fields blanked) as JSON, including scene, position, facing, basket and tonight's picks. Saves happen every 6 s while walking (scene.js L373) and at about 18 action sites: scene enter, pluck, curio, give, pour, hives, beds, exits, brew, night, finale. On load, a save without `v === 1` is dropped, then merged over `newState()`. "Where were we?" resumes in the saved scene at the saved position (title.js L88–96); doors and the brewing screen save her position outside first.
- **Main pieces:** `saveGame`/`loadGame`/`clearSave` (state.js L8–25).
- **Size:** 25 lines.
- **Fingerprint:** localStorage key **`witch-way-short-road.save.v1`**; mute key **`witch-way-short-road.muted`**; 1 slot; frequent autosave; version 1 with no migration.

#### Tests and build tools (balance and self-checks)
- `tests/condensed/rules.test.mjs` (234 lines): checks that every catalogue picture and friend mood file exists; that every place is mapped, every herb spot is real, every exit has a way back and every friend stands somewhere; that every favour asks for and gives real things (dialogue keys included); the Chapter One pot exactly as in the big game; the Chapter Two pot (recipes, balm spitting, bitters, roseroot, lady's mantle); calmbud and the Quiet Cup; picking (calmbud's night, picks until sleep, Horseshoe); almanac sleep; second and use-at-place favours; night events (Inkblot, Nibble, honey); still-needed; both endings; swaps; that every Chapter Two herb grows on the mountain.
- `tests/condensed/play.mjs` (485 lines, Playwright, plays the built file through `__cw`). Chapter One: music playing, keys and walls, tap-to-walk round walls, picking and the first card, mandrakes, gloves, give and thanks, cottage brew and dud, sleeping, edge exits, the Gathering. Chapter Two: the Falls Stair and a letter, Clem and the lift, Hester's two favours, the hives and honey, Bracken following, Wren's hut and almanac sleep, the Hatless Edge wind, Lull stillness and three buds, the spring's Quiet Cup, the seat and Gideon's note. Extras: Quill's swap, Agnes and Tobias's bench, Wisp Calm, map travel, menu screens, "Where were we?". Then a phone run (touch, sideways, sharp).
- `tests/condensed/lib.mjs` (170 lines): helpers (`openShortRoad`, `goTo`, `beside`, `findThing`, `setUp`...).
- `tools/build_condensed.py` (112 lines): reuses `pack_code`/`write`/`TYPES` from `build_one_moon.py`. It inlines four JSON files and all used pictures, the 15 paintings, the Lull light, the fonts and 3 MP3s into `dist/The_Short_Road.html` (about 30 MB).
- `tools/condensed_scenes.py` (660 lines): writes `condensed/data/scenes.json`. It copies the main game's tracing for 9 places with every way opened (`open_ways`, L302), adds hand-traced polygons for the 6 Fells places, and adds extra herb spots along path edges with `random.Random(scene_id)`, seeded per scene (L394–416). `--check` flood-fills from each first way in and fails on anything unreachable (L497–559). `--overlay` draws the tracing over the paintings.
- `tools/make_condensed_art.py` (233 lines): uses PIL to cut Chapter Two icons (48 px) and cards (128 px) at 3x/2x, friend portraits (two moods) and standing figures, saves the 6 paintings as WebP and the painted state changes as diff overlays; ffmpeg re-encodes the music at 128 kbps. Writes `condensed/data/art.json`.

### Content
| What | Where | ~lines |
|---|---|---|
| Tunables (walk speed, fps, Moth, reach, stillness, dud time, luck) | data.js L10–21 | 12 |
| 15 places with region and art; start point; 3 rooms; place uses; look lines; place names | data.js L25–107 | 83 |
| Chapter Two: 9 herbs, 5 curios, 8 brews, 3 duds, arnica spit, `BITTER` order | data.js L109–149 | 41 |
| Friends (chapter, ghost and animal flags), 17 favours, Gideon, rewards | data.js L156–359 | 204 |
| Letters, dawn news, toasts, Gathering, Quiet Cup and waking lines, Gideon's note | data.js L360–425 | 66 |
| Scenes: 15 places, 331 herb spots, walk and blocked polygons, exits (with door flag, spawn, facing), places, 150 lights, wisp areas, friend spots | data/scenes.json | 4,738 |
| Art index (26 things, 7 friends, 6 backgrounds, 4 states, 3 music) | data/art.json | 718 |
| Chapter One dialogue | main game `game/data/dialogue.json` (inlined in the bundle) | n/a |
| Scene captions, dud looks, curio subtitles, pour prompts, light colours | scene.js L34–61 | 28 |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Page CSS (shared with One Moon) | built L1–86 | 86 |
| Scene drawing (things sorted by y, her, Bracken, wisps, hat flight, wind, phase shade, exit arrows with names, bubbles, prompt, HUD, caption, place banner) | scene.js L941–1404 | 460 |
| Menu (basket, journal, recipes, map, sound) | overlays.js L304–340 | 37 |
| Basket, journal (each friend's status and where they are), recipe book, swap view | overlays.js L344–576 | 230 |
| Cauldron backdrop per spot, fire, pot, workbench | brew.js L268–484 | 215 |
| Moonrise (sky gradient, stars, rising moon, news list) | night.js L84–135 | 50 |
| Finale, Quiet Cup (valley lights going out), chapter-end cards | finale.js L90–392 | 300 |

### Shared-code clues
- data.js L13–14: "the big game walks at 66 and 10; Path Polish walked at 125."
- world.js L5: "Her feet take a 16 x 8 box (the kit's collision box), checked every 4 px, like the big game."
- rules.js L5–6: "Chapter One's rules first and exactly as in the big game"; rules.js L33: "a charm's note is what it does here (the big game's perks are different)".
- people.js L4: "their words are the big game's (game/data/dialogue.json)". The dialogue file is loaded at runtime (main.js L56).
- scene.js L488: "tools/condensed_scenes.py checks with the same" (exit padding shared between the game and the checking tool).
- `tools/build_condensed.py` L30: `from build_one_moon import pack_code, write, TYPES`.
- The Chapter Two herb notes match milestone 4's `game/data/regions/sable_fells.json` text (e.g. eyebright, "Each tiny white flower has purple veins…"): the same source (the lore bible), implemented twice.
- Test hooks: `__om` (One Moon) and `__cw` (The Short Road). Save keys: `one-moon.save.v1`, `witch-way-short-road.save.v1`, and the main game's `follow-me-down-witch-way.save.v2`.

### Notes
- **Drift summary (each module):**
  - **Identical to One Moon:** `game.js`, `fx.js`, `text.js`.
  - **One Moon's with small changes:** `engine.js` (+1 line), `ui.js` (+touch padding), `assets.js` (+eviction and asset base), `state.js` (key, whole state), `main.js` (+data loads, music, hook), `witch.js` (+17 fps, hat), `sound.js` (+region crossfade, 6 new sounds).
  - **Derived from One Moon, mostly rewritten:** `rules.js` (113 lines in common), `overlays.js` (219), `screens/title.js` (91), `night.js` (59), `finale.js` (180), and `brew.js` (279 lines in common with One Moon's `cottage.js`).
  - **New:** `world.js` (A*), `people.js`, `screens/scene.js` (144 lines in common with `gather.js`: the picking, mandrake and fly-to-basket code), `screens/map.js` (22 in common).
  - **From `game/src`:** nothing copied unchanged. The `sound.js` synth core reaches it through One Moon. Chapter One recipes and dud triggers come from the kit manifest. `scenes.json` is generated from the main game's `game/data/scenes.json` for 9 places.
- **The same charm ids do different things in three games.** Owl: kit/main "light reaches half again as far", One Moon x1.5 light, here "what a friend needs glints gold". Bell: kit "chimes near rare herb", here "chimes near what a friend needs". Horseshoe: kit "+4 basket slots", both spin-offs a 35% double pick. Moth: kit "walk a quarter faster", same here (x1.25), One Moon +20 s of moon.
- **Dead code:** `newState().dud` (rules.js L87) is never read; dud state lives in `game.dud`, isn't saved, and is cleared on resume (title.js L93). Also unused: `world.arrival` (L212), `assets.ready` (L57), `text.drawWrapped`, `engine.easeBack`.
- **Memory:** each painting costs about 6 MB once decoded (assets.js header L8–9), which is why `keepOnly` evicts paintings away from her. One Moon preloads all of its pictures, which include only 7 paintings.
- **Risky globals:** the screens reach into `game.state`, `game.cat`, `game.scenes` and `game.art` directly. Rules functions are pure but take `cat` and `state`.
