# Where each game's source is

A check made October 12, 2026, for Chris. For every game: is the readable code saved in Git, or is the built page the
only copy? Nothing in any game was changed, rebuilt in place or recovered. Every check was read-only, on copies in a
scratch folder.

## The short version

- **One game needs your attention: The Magpie over Aethermoor.** Its newest page has a minimap, region banners, full
  sail, the Nearby list, cards for 19 places and painted-map effects that exist in no readable code anywhere, on any
  branch of any of your 13 repositories, now or in the past. The rest of that page (the ship, the Witch, Inkblot,
  Nettie, the sounds and music, and plain flying and landing) is in Git. The missing parts are listed below as things
  to look for in your old chats.
- **Every other game is safe.** For each one, either the page itself is readable code, or running the game's own
  build on the code in Git gives back exactly the same file, down to the last letter. (Three come with a small,
  explained difference: Envoi's final polish has one extra line that switches on the four ideas to try, and the two
  Sand games carry the date and time they were built.)
- A few things are worth knowing even though nothing is lost. They're under "Worth knowing" below.

## What the cases mean

- **(a) Written directly.** The page is itself readable code, with real names and comments. Nothing needs rebuilding.
- **(b) Built from source in Git.** The readable code is saved in Git, and a build step packs it into the page.
- **(c) No source.** The page is built or squashed, and its readable code is on no branch anywhere.
- **(d) Mixed.** Readable code is in Git, but the newest page has things in it that code doesn't.

**"Rebuilt exactly"** means: the game's own build was run on the code from Git, in a scratch folder, and the result
had the same fingerprint as the page saved in Git. (The fingerprint, a "sha1", changes if even one letter changes.)
Where the evidence says *checked*, a command was run or the code was read. Where it says *inferred*, it comes from
notes, file names or commit messages.

## The games

Branch names are the part after `origin/`. "Build" is the command, run from the folder named.

| # | Game | Case | Where the source is | Build | Evidence |
|--:|---|:-:|---|---|---|
| 1 | **The Magpie over Aethermoor** (your reference page) | **(d)** | Page: `airship-game-in-aethermoor-` @ `claude/ship-game-magpie-l8cbdn`, `reference/the-magpie-over-aethermoor.html` (2,564,204 bytes; the same file is on all 3 airship branches and in `envoi-on-the-longest-night` as `reference/demos/the-magpie-over-aethermoor.html`). Partial source: `20-min` @ `ccr-5afa0fa7-7ojc16`, `src/airship/`, `src/actors/`, `src/audio/`, `src/stage.js`, `src/input.js`, `vendor/thareia-sfx/`. | In `20-min`: `npm ci`, then `node tools/build.mjs airship`. It builds the older Magpie page, not this one. | *Checked:* the page's own words ("See the whole map (M)", "Shift for full sail", "Charting Aethermoor…", the region grid, the rumours) were searched for on every branch of all 13 repos and in their history: found only in the built page and in the October 6 inventory. 20-min's `src/airship/mode.js` has no minimap, region, Shift, M key or Nearby list. Comparing the page's text with the 20-min code leaves 90 pieces of text with no source: nearly all belong to the features listed below (the rest are colours and one library message). The ship, characters and audio match the 20-min code almost line for line. *Inferred:* the page was made in a chat outside Git. Envoi's commit `66bf0e5` (Oct 2) calls it "Chris's world travel demo"; the airship repo's `d3d27ca` (Oct 6) calls it "Chris's upload of 'The Magpie over Aethermoor' (finished version)". |
| 2 | **What the Map Forgot** | (b) | `what_the_map_forgot` @ `claude/trusting-gauss-gbuygw` (the same `source/` folder is on all 3 branches): `source/src/` (52 modules and the paintings), `source/tools/`. | From the repo root: `node source/tools/build.js <out.html>` | *Checked:* rebuilt exactly at `9369b13` (fingerprint `354dc4c2`). No text in the page is missing from the source. |
| 3 | **What the Map Forgot in 3D** | (b) | `what_the_map_forgot` @ `ccr-9c545e56-4m3vqr`: `wren-3d/src/`, `wren-3d/vendor/`, `wren-3d/assets/`, plus the 2D game's `source/`. | From the repo root: `node wren-3d/tools/game-build.mjs` | *Checked:* `wren-3d/dist/game-3d.html` rebuilt exactly at `9a84c2f` (`414e17c6`). The eight 3D demo scenes (`node wren-3d/tools/build.mjs`) also rebuilt exactly, on both 3D branches. |
| 4 | **Follow Me Down Witch Way** (milestone 4) | (b) | `follow-me-down-witch-way` @ `claude/bold-turing-t225o0`: `game/src/`, `game/data/`, `game/index.html`, `witch_game_assets/`, `tools/`. No built page is saved in Git (on purpose: `dist/` is left out). | From the repo root: `python3 tools/build_single.py --out <file>` (Pillow optional) | *Checked:* no milestone 4 page was ever committed. Two separate builds from Git (the coordinator's and a helper's) came out identical (`d5b22db0`), so the build is repeatable. No game text is missing from the source. See "Worth knowing" about where this source came from. |
| 5 | **One Moon** | (b) | `follow-me-down-witch-way` @ `ccr-4b49ab19-vv72q2`: `one-moon/`, `witch_game_assets/`, `game/`, `tools/`. No built page saved in Git. | From the repo root: `python3 tools/build_one_moon.py --out <file>` | *Checked:* two separate builds identical (`62f1836c`). Uses only Python's standard parts. No game text missing from the source. |
| 6 | **The Short Road** | (b) | Same branch: `condensed/` (with its pictures and music), `one-moon/`, `witch_game_assets/`, `game/`, `tools/`. No built page saved in Git. | From the repo root: `python3 tools/build_condensed.py --out <file>` | *Checked:* two separate builds identical (`7725176b`). No game text missing from the source. |
| 7 | **Moonlight in the Aether** | (b) | `20-min` @ `ccr-5afa0fa7-7ojc16`: `src/`, `vendor/`, `scenes/`, `art/`, `tools/game-shell.html`, `tools/game-page.mjs`. | From the repo root: `npm ci`, then `node tools/build.mjs game` (needs Python with Pillow to shrink the paintings) | *Checked:* `dist/game.html` rebuilt exactly (`41a913e5`), at the branch tip and at `29688c8`, the commit that added it. All 12 demo pages in `dist/` also rebuilt exactly. |
| 8 | **Sunstone Skies** | (b) | `20-min` @ `ccr-c41cdbf6-3p3qws`: `sunstone-skies/src/`, `sunstone-skies/demos/`, `sunstone-skies/assets/`. | From `sunstone-skies/`: `npm ci`, then `node tools/build.mjs` | *Checked:* `dist/game.html` rebuilt exactly at `fca839a` (`f23ac8ab`); the shipyard and hangar pages exactly at the commits that last changed them. See "Worth knowing" about the ChatGPT version. |
| 9 | **Skies of Aethermoor, polished** | (b) | `airship-game-in-aethermoor-` @ `claude/laughing-curie-qbp98i` (the same files are on `claude/jolly-ramanujan-xqqm3h`): `polished/src/`, `polished/demos/`, `polished/assets/`. | From `polished/`: `npm ci`, then `node tools/build.mjs` | *Checked:* `polished/dist/game.html` rebuilt exactly (`8b915915`) at `3193334` (last change) and at the tip `3570f8b`; the hangar page and both `.artifact.html` copies too. |
| 10 | **Skies of Aethermoor, stage 4** (newest, Oct 9) | (b) | `airship-game-in-aethermoor-` @ `claude/jolly-ramanujan-xqqm3h`: `stage4/src/`, `stage4/demos/`, `stage4/assets/`. | From `stage4/`: `npm ci`, then `node tools/build.mjs` | *Checked:* `stage4/dist/game.html` rebuilt exactly (`a5ef5ed1`) at `4dce941` ("Work in progress: tactics…") and at the tip `d8e095a`. Even this unfinished stage matches its source. |
| 11 | **Aethermoor: Hearth & Heirloom** (milestone 7) | (b) | `New-game` @ `claude/cool-ptolemy-uc93gg`: `game/src/` (244 files; the painted maps are generated files made from the pictures in `art-in/`), `game/tools/`. | From `game/`: `npm ci`, then `node tools/build.mjs --out <folder>` | *Checked:* `game/dist/aethermoor.html` (= `aethermoor-m7.html`) rebuilt exactly (`78515e06`). Milestones 2, 3, 4, 4.5, 5 and 6 also rebuilt exactly at the commits that made them. |
| 12 | **Thareia** (T2, unfinished) | (b) | `New-game` @ `claude/tender-babbage-4wiplk`: `thareia/game/src/` (297 files), `thareia/sfx/`. Needs nothing from the Aethermoor branch. | From `thareia/game/`: `npm ci`, then `node tools/build.mjs --out <folder>` | *Checked:* `thareia.html` (= `thareia-t2.html`) and its `.artifact.html` rebuilt exactly at `146a9ac` (`0289aa83`). See "Worth knowing" about the T1 file. |
| 13 | **Envoi on the Longest Night** (final polish) | (b) | `envoi-on-the-longest-night` @ `claude/send-note-gigdew`: `src/`, `putting-it-all-together/`, `art/`, `envoi-final-draft/items/`, the cutscene and model folders, `tools/`. | From the repo root: `npm install --prefix tools`, then `node tools/build.mjs --min --offline putting-it-all-together/game.html` | *Checked:* rebuilt at `b31afe5` (the commit its notes name), the result is exactly the "final polish" file apart from one line after the title, `<script>window.ENVOI_TRY = {…}</script>`, which turns on the four ideas to try. The folder's README says the file is exactly that build plus that one line. The file you sent (`from-chris/Envoi_on_the_Longest_Night-1.html`) is exactly the build of `856f522` plus the same line, and the Oct 4 final draft rebuilds exactly at `1ae47db`. Nothing in any Envoi page is missing from the source. |
| 14 | **Stranded** (The Clearing) | (a) | `cursed-worlds` @ `claude/jolly-mendel-bqoxiy`: `the-clearing-stranded/index.html` is the game itself, written directly ("One file, no build step"), with the hand-written `living/*.js` files beside it. | To play: open `index.html`. For one file to share: from `the-clearing-stranded/`, `node tools/build-game.mjs --out Stranded.html` (that file is left out of Git on purpose). | *Checked:* `index.html` has real names and comments and was edited directly in 16 commits; nothing generates it. The one-file build adds nothing that isn't in `index.html` and `living/`. `living/Stranded_Living_Camp.html` rebuilt exactly (`c8933248`). The other branch, `claude/practical-bohr-smpp6z`, holds an older Stranded (exactly commit `71a461f`). |
| 15 | **The Ranch** | (b) | `cursed-worlds` @ `claude/practical-bohr-smpp6z`: `the-ranch/`, `animal-3d-models/` (three.js r128 is kept there). No built page saved in Git (on purpose). | From the repo root: `node the-ranch/tools/build.mjs --out <file>` | *Checked:* two separate builds identical (`993b44c6`), no text missing. The first version, `the-ranch/versions/the-ranch-2026-10-04.html`, rebuilt exactly at `4662207` (`fa7e17f9`). |
| 16 | **Tiny Dominion** | (b) | `different-ideas-` @ `ccr-2caac74a-av649o`: `src/js/` (24 files), `src/head.html`, `src/body.html`, `src/style.css`, `tools/build.mjs`. | From the repo root: `node tools/build.mjs` | *Checked:* `Tiny_Dominion.html` (`87f0d3b9`) and `dist/tiny-dominion.html` rebuilt exactly at `ca7f11a`. The page is readable too (nothing is squashed), but it's made from the files in `src/`. |
| 17 | **Art Farm** | (b) | `farm-project` @ `claude/determined-cerf-bua9qu`: `art-farm/src/`, `art-farm/index.html`, `art-farm/vendor/`, `art-farm/assets/`. | From the repo root: `node art-farm/tools/build.mjs` | *Checked:* `art-farm/dist/art-farm.html` rebuilt exactly (`0ec99978`). The `.artifact.html` copy is left out of Git on purpose; the same build makes it. |
| 18 | **Starfall** (Mooncart's sample game) | (a) | `building-with-assets-`, `samples/starfall.html` (the same file on all 3 branches). | None: the page is the code. | *Checked:* hand-written, with comments such as "Starfall: a small sample game for the Mooncart demo, one file like every Mooncart game". |
| 19 | **Fresh Grad Seasons** (v2, the visual upgrade) | (b) | `atoms-games-` @ `ccr-3228f98b-96z2gs`: `fresh-grad/v2-visual-upgrade/src/` (html parts, 21 css files, 81 js files), `fresh-grad/tools/build.js`. | From `fresh-grad/`: `node tools/build.js --out <file>` | *Checked:* `v2-visual-upgrade/index.html` rebuilt exactly at the tip `a499b79` (`6a8e4f95`) and at `6f59b80`. Every helper branch's work was merged; nothing is left on a side branch. The game draws everything in code; the pictures in `IMAGE_PROMPTS.md` are still for you to make, and it plays without them. |
| 20 | **Creek Care** | (a) | `creeks` @ `ccr-ef7e4042-wgyo22` (it includes all of `claude/admiring-bardeen-wcljjx`): `index.html`, `style.css`, `src/` (28 plain script files), `assets/` (pictures). | To play: serve the folder and open `index.html` ("Plain scripts (no build step)"). For one file: `python3 tools/bundle.py <out.html>` (add `--embed` to put the pictures inside); that file is left out of Git on purpose. | *Checked:* the code is readable files with real names and comments; the only HTML ever committed is the small `index.html`. A one-file build from Git has no text the source lacks, and needs nothing from the internet. |
| 21 | **Sandcastle Cays** (v0.1, The Calm Lagoon) | (b) | `sand` @ `claude/fervent-sagan-d87ede` (unchanged on the two later branches): `sandcastle-cays/src/` (TypeScript), `build.mjs`, `package.json`. Page: `sandcastle-cays/builds/sandcastle-cays-v0.1.html`. | From `sandcastle-cays/`: `npm ci`, then `node build.mjs` (`npm run release` copies it into `builds/`) | *Checked:* rebuilt at `781fdb5`: the same size, and the same letter for letter except the build's date stamp, which every build writes in (10 characters). Loads nothing from the internet. |
| 22 | **Wind, Wing & Wave** (path 1, v0.1) | (b) | `sand` @ `claude/jolly-pascal-d3lqs6`: `wind-wing-wave-path-1/src/` (TypeScript), `build.mjs`, `package.json`. Page: `wind-wing-wave-path-1/builds/wind-wing-wave-v0.1.html`. The older folder `wind-wing-wave/` (also on `claude/eager-johnson-ij9j8z`) is the ten parts before they were joined; it has nothing the newer folder lacks. | From `wind-wing-wave-path-1/`: `npm ci`, then `node build.mjs` (`npm run release` copies it into `builds/`) | *Checked:* rebuilt at `20e312a`: the same size, and the same letter for letter except the build's date stamp (written in twice). Loads nothing from the internet. `docs/handoff-build-workflow.js` is the script that organised the ten builders, not game code. |

## The Magpie page: what has no source

These are in the newest Magpie page (`reference/the-magpie-over-aethermoor.html`) and in no readable code anywhere.
They're listed the way you'd see them on screen, with words from the page, so you can search your old chats for
them. The page was probably finished in a chat around October 1–2, 2026: it reached Envoi on October 2 as your
"world travel demo".

1. **The minimap in the corner.** A small copy of the whole painted map, with gold dots for towns, an orange arrow for
   the ship and a box for what's on screen. Tap it to fly there. Its label: "The whole map: tap a town to fly there".
2. **"See the whole map (M)".** A button, and the M key, that pull the camera back to show all of Aethermoor, plus a
   short fly-over of the whole map when the page opens.
3. **The region banner.** As you fly, the name of the region fades in: "The Verdant Wilds", "The Gloamwood",
   "The Gloomfen", "The Ironspire Peaks", "The Sunscorch Wastes", "The Hearthsea", "The Open Sea". The grid that
   decides which region you're over is in no other file. (The airship game reuses the names, but with its own,
   different grid.)
4. **Full sail.** Hold Shift to fly 1.8 times faster; long trips also speed up on their own. The help line says:
   "Tap the map to fly there · arrows or WASD to steer, Shift for full sail · Space to land · scroll or pinch to zoom
   · M for the whole map".
5. **Zoom.** Pinch, the mouse wheel, or the + and − keys.
6. **The "Nearby" list and the "Fly to" button.** Three nearby towns to pick from, and a button that flies you to the
   next one.
7. **Cards for 19 places over all of Aethermoor.** Twelve towns and seven sights, each with a type, a short
   description, a Notable person and a Rumour. Examples:
   - Wickhollow: "Where the Gloamwood meets the river: the witch's cottage and garden, the square with its well and
     chapel, Hilde's smithy, Quill's stall…"
   - Bogmire, "Swamp town": "A ramshackle stilt town on plank streets around the moot-circle…"; rumour: "Children
     have gone missing near the eastern bogs, and the lights are growing brighter."
   - the Blackwater crossing, with "Hodge, the 'Bridge Troll'": "Something enormous moves through the Blackwater,
     capsizing boats."
   - the heart of Aethermoor on the Hearthsea, with "Warden Isolde", "Fenwick the hearthkeeper" and "Captain Mara":
     "The eternal hearth flickered, for the first time in recorded history."
   - Ironhold ("Hilda Ironvein"), a desert trade city ("Theron Duskwalker": "A caravan arrived with a sealed crate that
     hums."), a sunstone mining camp ("Foreman Krell"), an oasis ("Seer Naima"), a military outpost ("Commander Vex",
     "Rook, the prisoner"), a rangers' outpost ("Pip the scout") and more.

   (Mother's Hollow, the hidden sight "A light in the willows", is already in the 20-min code.) The names come from your
   February Aethermoor interactive map (`New-game`, `aethermoor-interactive-image-map-polished.html`),
   but the shortened descriptions and the rumour lines are in no other file.
8. **Nettie boarding.** "Nettie climbs aboard with her staff and lantern." (The older code has a different line:
   "Took your time.")
9. **The painted map coming alive.** Cloud shadows drifting across the map, a swell and glints on the sea, lamps and
    windows that glow and breathe, and sharper paint when you zoom in.
10. **The loading words and title:** "Charting Aethermoor…" and "The Magpie · over Aethermoor".

## Worth knowing

Nothing below is lost, but each one is good to know.

- **The ChatGPT "Expanded Flight Edition" isn't in Git.** Sunstone Skies borrowed ideas (the top-down map, settings,
  sound, the firing board, the photo camera, the guide, Explore) from a page you uploaded on October 6,
  `Skies-of-Aethermoor-Enhanced_1sol2.html` ("Skies of Aethermoor, the Expanded Flight Edition", 16 MB, made with
  ChatGPT). Only eight small pieces of it are kept, in `20-min`, `sunstone-skies/reference/gpt-version/`, and its nine
  map tiles were taken out of it. Everything Sunstone uses was rewritten into its own code, which is in Git. If you
  want that ChatGPT page itself kept, it's only in the chat where you uploaded it.
- **Witch Way's code was rebuilt from your uploaded files.** On September 29 both files you uploaded,
  `materials/Follow_Me_Down_Witch_Way.html` and `materials/Witch-Way-Bundle/Game/Witch_Way_-_Path_Polish_-_2026-09-27.html`,
  were unpacked back into readable code (`tools/unbundle.py`). Both uploads are still in Git on every branch. Path
  Polish rebuilds from `versions/path-polish/` exactly; the first upload rebuilds to the same file except for the
  order of its pictures. Milestone 4 grew from the first upload. Path Polish's own screens (the brewing panel with
  "Light the cauldron" and "Stir the pot", "Map of Witch Way", "The little altar", "Letters from the coast") are not
  in milestone 4, but they're kept as readable code in `versions/path-polish/`.
- **Some games keep no built page in Git, on purpose:** Witch Way milestone 4, One Moon, The Short Road and The
  Ranch, and the one-file versions of Stranded and Creek Care. Each one builds from Git to the same file every time,
  so a copy can always be made again.
- **Thareia's file named T1 isn't the T1 you were sent.** `thareia/game/dist/thareia-t1.html` was overwritten on
  September 30 (commit `039d767`) with an early T2 build. The real T1 is in Git's history at commit `f51bd6d`
  (8,147,399 bytes), and it rebuilds exactly there.
- **Some games need the internet for their fonts.** Aethermoor, Thareia, Tiny Dominion and Fresh Grad load their
  lettering from Google Fonts. Offline they still play, in plain fonts. Envoi's *Colossus in the Meadow* demo
  (`living-battlefields/Colossus_Fight.html`) loads three.js from the internet and won't run offline.
- **Mooncart probably builds Witch Way from before milestone 4.** Mooncart's `games.json` builds "witchway" from that
  repo's default branch, which is `claude/bold-brahmagupta-amnclm` (before milestone 4). *Inferred*; that build wasn't
  run.
- **Published links weren't checked.** Many games are also published as claude.ai pages. Their notes say they're
  published from the same builds, but the live pages weren't opened.

## Older versions and side pages

| Page | Case | Evidence |
|---|:-:|---|
| Art Farm v1 (`farm-project`, `art-farm/versions/v1-cel-shaded.html`) | (b) | *Checked:* rebuilt exactly from commit `2d6a839` (its code is only in history now). |
| Aethermoor milestones 2–6 (`New-game`, `game/dist/aethermoor-m2.html` … `-m6.html`) | (b) | *Checked:* each rebuilt exactly at the commit that made it. |
| Thareia T1 (`New-game`, commit `f51bd6d`) | (b) | *Checked:* rebuilt exactly. The tip's `thareia-t1.html` is a near build of `039d767` whose source has a little more (57 item names). |
| Thareia sound board, walk test, demo 2 (`New-game`, `thareia/`) | (b) | *Checked:* the sound board rebuilt exactly; the two demos have no text missing from their source (their builds need a full Git checkout and weren't run). |
| The Ranch's first version (`cursed-worlds`, `the-ranch/versions/the-ranch-2026-10-04.html`) | (b) | *Checked:* rebuilt exactly at `4662207`. |
| Stranded's first version (`cursed-worlds`, `the-clearing-stranded/versions/the-clearing-2026-09-24.html`) | (a) | *Checked:* readable, "One file, no build step"; it's the same file `index.html` was in the repo's first commit. *Inferred:* the copy from before that is in no repo. |
| Stranded Living Camp (`cursed-worlds`, `the-clearing-stranded/living/Stranded_Living_Camp.html`) | (b) | *Checked:* rebuilt exactly on both branches. |
| Tiny Dominion original (`different-ideas-`, `original/Tiny_Dominion_original.html`) | (a) | *Checked:* readable, never changed. Its "Hold a council" and "Speak to the ruler" Claude features were removed on purpose (commit `19df2f3`) and live only in this file, which is in Git. |
| Tiny Dominion, older copy (`different-ideas-` @ `claude/friendly-curie-5h7j1p`, `tiny-dominion/`) | (b) | *Checked:* rebuilt exactly. |
| Fresh Grad v1 (`atoms-games-`, `fresh-grad/v1-original/Fresh_Grad_Seasons.html`) | (a) | *Checked:* readable; the v2 source split from it, joined back at `3ba726f`, gives it exactly. *Inferred:* it was made outside Git ("exactly as provided"). |
| Moonlight's older demo pages (`20-min` @ `claude/amazing-hamilton-h3g6sg`, `ccr-c41cdbf6-3p3qws`, `claude/stoic-cannon-9qxgh1`) | (b) | *Checked:* all rebuilt exactly, two of them (`airship`, `witch-up-close`) at the earlier commit `c8b8148`. The Witch HD viewer (`witch-hd/`) too. |
| The two older Magpie pages: Envoi's `reference/demos/the-magpie.html` and Thareia's `thareia/art-in/airship/the-magpie-3d.html` | (b) | *Checked:* each is exactly 20-min's `dist/airship.fragment.html` at commits `5af02b1` and `b223a09` in a small wrapper; both rebuilt exactly there. |
| The airship game's main-folder copy (`airship-game-in-aethermoor-`, `dist/game.html`) | (b) | *Checked:* rebuilt exactly at `1887984` (`813d012d`). |
| Envoi's Colossus in the Meadow, your reference demos, and the Sound Check (`envoi-on-the-longest-night`) | (b) / (a) / (b) | *Checked:* Colossus rebuilt exactly at `5439f2c`; the reference demos are readable hand-written pages (Bramble Colossus has three.js pasted in); *inferred:* the Sound Check is built from `sound-tool/`. |
| Witch Way's uploads (`follow-me-down-witch-way`, `materials/`) | (b) | See "Worth knowing". |
| Not games: the Aethermoor character sheet and interactive map (`New-game` main), Rain Check (`different-ideas-`), the Witch Way backgrounds gallery (`other-game/`), the Henry viewers (`cursed-worlds`), the Walking Paths editor (`building-with-assets-`) | (a) or (b) | *Checked:* the character sheet and map are hand-written; Rain Check and the backgrounds gallery rebuild exactly; the Henry viewers and Walking Paths are page shells for builds that weren't run. |

## How this was checked

- **All 13 repositories were fetched with every branch** on October 12. The October 6 inventory
  (`SYSTEMS_INVENTORY.md`) named the newest version of 15 games; four games added since then (Fresh Grad Seasons,
  Creek Care, Sandcastle Cays, Wind, Wing & Wave) and the newer branches of Sunstone Skies and Skies polished were added.
  Every branch pushed after October 6 was looked at.
- **Pages were read with the pictures and sounds taken out** (`tools/strip.mjs`), so no one read packed pictures or
  squashed lines by mistake.
- **Each page was compared with its source by the text that survives building:** on-screen words, names, save keys
  (`tools/gap.mjs`, which reads the code with a proper JavaScript reader, so squashed code is read correctly). Text in
  the page that is in no source file is a gap.
- **Where a build existed, it was run** on a copy taken straight from Git, at the commit that last changed the page,
  and its fingerprint compared with the saved page. That's the strongest proof, and it worked for every built game
  but the Magpie page.
- **The four new games were added to a scratch copy of `games.json`** to strip them; `games.json` itself is unchanged.
  `tools/gap.mjs` needs the `acorn` package (`npm install acorn` next to it).
- **Who did what.** Helpers (one per group in `inventory/`, plus new groups for the new games) did the first pass. The
  coordinator then re-checked every game's main result: the fingerprint of each rebuild against the saved page (and
  that the build really ran that day, rather than a copy coming out of Git), Envoi's rebuild done again from scratch,
  and, for the Magpie page, the phrase search on every branch of all 13 repos and in the history of the four repos
  involved, and the gap list. The rows for older versions and side pages are the helpers' checks, not all repeated.
  One helper made one read-only network lookup (`git ls-remote`) that the rules didn't allow; it changed nothing.
- **Not checked:** the published claude.ai pages; games played in a browser; the builds of Thareia's two demos and the
  Henry and Walking Paths pages.
