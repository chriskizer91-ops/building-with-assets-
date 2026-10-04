# How Mooncart works

Mooncart is a web page (the console, `web/`) inside a tiny Android app (`android/`) that shows
it full screen and answers its requests from inside the phone. Games are web pages too; each
runs in a frame on the console's screen. The same console also runs on its own in a web browser
(see *In a web browser* below).

## The pieces

**The console page** (`web/`, plain ES modules, no build step)

| file | what it does |
|---|---|
| `js/main.js` | starts everything and routes every button press to whatever is on screen |
| `js/layout.js`, `js/art.js`, `js/fonts.js`, `js/themes.js` | the pixel-art handheld: layout in "art pixels", drawn with rectangles on a low-res canvas scaled up with hard edges. Two shapes: *side* (phone sideways) and *stack* (upright); the one with the bigger screen wins |
| `js/consoleview.js` | the canvas, the touch areas over the drawn buttons, the cartridge in the slot, the LED |
| `js/screen.js` | what's on the screen when no game runs: boot intro, game picker, loading card, in-game menu, toasts |
| `js/game.js` | runs one game in an iframe at its own address, sends button presses as key presses, play time, cartridge pictures |
| `js/store.js` | settings and the library: a virtual folder tree in `library.json` (built-in games plus games the player added) |
| `js/library-ui.js`, `js/menu.js`, `js/dialogs.js` | the library ("main menu"): menu bar, toolbar, folder tree, list or cartridge grid, dialogs |
| `js/saves.js`, `__mooncart/helper.js`, `__mooncart/saves.html` | reading and writing each game's saved data (for backups and the save tools) |
| `js/pack.js` | packs scripts, stylesheets and fonts a page loads from the internet into the page |
| `js/native.js` | the only file that talks to the platform: Android's bridge, the desktop test server, or a plain web browser |

**The Android app** (`android/src/.../`, Java 8, no libraries)

| file | what it does |
|---|---|
| `MainActivity.java` | full-screen WebView; file pickers, backups, saving the installer, controllers, Back button, keep-awake, orientation, recovering when a game runs the phone out of memory |
| `Server.java` | answers every request: `https://mooncart.invalid/` is the console (from `assets/web/`), `https://<slot>.mooncart.invalid/` is one game |
| `Bridge.java` | the calls the page can make (`MooncartNative.call` / `callAsync`); each must carry the secret the page was started with (`#k=` in its address), which games can't see |
| `Storage.java` | the app's private files: `text/` (library.json, settings.json), `blobs/` (added games), `thumbs/`; backups (zip) |
| `Keys.java` | web key names ↔ Android key codes ↔ console buttons |

## Decisions worth keeping

- **No internet, ever.** `.invalid` is a reserved name that can never be a real website, and every request for it
  is answered inside the app. The INTERNET permission exists only so a game the player adds can be packed for
  offline play while the phone is online.
- **Each game gets its own address**, `https://<save slot>.mooncart.invalid/`, so its localStorage and IndexedDB
  are its own. The save slot is the slug of the game's `<title>` (`saveKeyFor` in `web/js/util.js`), so a newer
  build of the same game finds the same saves; `games.json` can set it. **Never change the host name, the
  scheme or how slots are named**, or every save on every phone disappears.
- **Never change the package name (`io.github.chriskizer91ops.mooncart`) or the signing key** (`android/mooncart.keystore`,
  see `android/KEYSTORE.md`). Android only installs an update over the same name and key; anything else means
  uninstalling, which deletes the saves.
- **Built-in games are read straight out of the app**; deleting one only hides it (Settings brings it back).
  Games the player adds are copied into the app's storage and survive updates.
- **The console's buttons send real key presses** (Android `KeyEvent`s into the focused game frame), so games see
  `isTrusted` events with the right `key`, `code` and `keyCode`. The desktop test server can't do that, so there
  the helper inside the game dispatches synthetic ones.
- **minSdk 24, targetSdk 35.** Android 7 is the oldest whose WebView can be updated to a modern engine.
- **No Gradle.** `android/build.sh` calls the SDK's tools directly, so the build has nothing to download but the SDK.
- **Pixelify Sans for names and menus, the phone's font for numbers and long text**: Pixelify's small digits blur together.

## In a web browser

`tools/build-demo.mjs` bundles the console (esbuild) into one page with its styles and fonts inside, for two uses:
the demo page published as a Claude artifact (`build/demo/`, the sample games from `samples/` beside it) and
`Mooncart.html` (`--standalone`, the samples inside it), which the workflow puts on the Releases page for laptops.
Neither has the built-in games; people add their own.

There `native.js` uses its `web()` bridge:

- The library, settings and added games live in the browser's IndexedDB (database `mooncart`).
- A game runs in a frame made from its own text (`srcdoc`), with the helper put in front of its scripts, since
  a browser page can't give each game its own address. All games share the page's address, so the helper files a
  game's localStorage, sessionStorage and IndexedDB names under `mc:<save slot>:`, and `saves.js` reads them there.
- Button presses reach the game as synthetic key events, as with the test server.
- No backups, cartridge pictures or offline packing there; on the demo page (inside the artifact viewer) files
  can't be saved either, and the helper shows a game's `alert()` on the console because the viewer swallows it.

`node tools/web-smoke.mjs` builds both and checks them: the demo inside a locked-down frame with a strict content
security policy (roughly the artifact viewer's), and `Mooncart.html` opened from disk.

## The built-in games

`tools/collect-games.mjs` reads `games.json`, shallow-clones each source (only the listed `paths` when given),
runs its `build` command, packs each page with `pack.js`, and writes `build/collection/` with `collection.json`
(name, folder, save slot, size, hash and the commit it came from). `android/build.sh` copies that into the app's
assets. Locally, `--local ..` uses checkouts next to this one instead of cloning, and `--mirror dir` serves
CDN files from a folder (for machines that can't reach the CDN).

## Testing

- `node tools/dev-server.mjs` serves the console with games at `http://<slot>.localhost:8090/` (the same one
  address per game as on the phone) and an HTTP stand-in for the Android bridge.
- `node tools/smoke.mjs` plays through it in Chromium at phone sizes: picking and playing games with the
  console buttons, the game menu, saves, adding, renaming, moving and removing games, backups, the upright layout.
- The GitHub workflow (`.github/workflows/build-app.yml`) builds the APK and runs `tools/phone-test.sh` on an
  Android 14 emulator given a cheap phone's screen (720 x 1600) and put in airplane mode. It starts games by their
  save slot (`adb shell am start -n io.github.chriskizer91ops.mooncart/.MainActivity --es launch bogmire`), waits
  for the console to log `[mooncart] loaded <slot> in <ms> ms`, screenshots each step, and checks the log for
  crashes, page errors and pages that reach for the internet (`Server` logs those as `internet: <address>`).
  Games that aren't in the build (the private ones) are skipped. The screenshots are uploaded as an artifact and
  a few go on the release page.

## Walking Paths

`walking-paths/` is a separate tool that shares nothing with the console at run time: Envoi on the Longest
Night's walking-path page (`envoi-game-pass-3/map-paths/` in that repository), rebuilt to work with any picture.
`tools/build-walking-paths.mjs` bundles it (esbuild) into one page with everything inside: `Walking-Paths.html`
to keep and open, and `walking-paths.html`, the same page without a `<head>`, to publish as a Claude artifact.
Like Mooncart it never loads anything from the internet.

| file | what it does |
|---|---|
| `js/state.js` | everything the page knows (`S`), a tiny event bus, and undo: each step keeps the maps it is about to change as JSON |
| `js/project.js` | maps: from a picture, from a maps file (`readMapsFile`, `takeMaps`), to a maps file (`fileMap`), renaming (a key made from the name follows it), resizing, the way back; keeping the work in IndexedDB |
| `js/editor.js` | the canvas: looking round (drag, wheel, two fingers), hit testing, dragging points and shapes, drawing by taps and by tracing, the wand, putting down ways out, people, things and story areas, drawing it all |
| `js/panel.js` | the panel: tools, the picked thing's form, the maps list and the picked map's settings, layers and the reach report, the in-page question box |
| `js/wand.js` | the magic wand (below) |
| `js/files.js` | adding pictures, opening maps files, and every file it saves |
| `js/walk.js`, `js/check.js` | "Walk it", and the reach check and stand test, both through the engine |
| `engine/engine.js` | the walk engine, one plain script: Envoi's field (`src/game/field.js` there) for any map size |
| `engine/sprites.js` | Io and the town folk as pixel sprites, copied unchanged from Envoi (`src/walk/pixel-io.js`, `src/game/sprites.js`) |
| `examples/` | Wickhollow and its jetty from Envoi (`src/game/maps.js` and their paintings), the maps it starts with |

**The maps file** is Envoi's `MAPS` (`src/game/maps.js`) with two more fields, so its maps drop into a game built
the same way: `{ format: "walking-paths", version: 1, about, maps: { key: map } }`, each map
`{ name, src, size: [w, h], walker, start, walk, block, front: [{ pts, base }], exits: [{ rect, to, at, label }],
people: [{ id, name, at, look, face0, says }], spots: [things { kind, label, note, at } or story areas
{ kind, id, label, note, rect }] }`. Points are whole pixels of the map, `size` is the map's size (the picture's,
unless changed: Envoi's are 1536 x 1024) and `walker` is how tall people are. Any other field a map had when it was
opened is kept as it was (Envoi's `band`, `music`, `wild`, people's `talk` and `role`...). `src` is the picture as a
`data:` address in the maps file and the walk-around page, or its file name in "the map data only".

**One set of rules.** The engine is the only place that says where she can stand: a point is free inside a walk
area, outside every block and away from people; she stands where the point and the points a foot to each side are
free. Envoi's numbers (6-pixel feet, 12-pixel cells, 58 pixels to talk to someone) are for a 52-pixel Io, so the
engine scales them all by `walker / 52`. The editor's readout ("she can stand here") and the reach check call the
engine's `rules`, so they can never disagree with a walk.

**The magic wand** works on a copy of the picture at most 1024 pixels across, blurred twice so cobbles and brush
strokes read as one colour. From the tap it takes every joined pixel within a colour distance ("redmean") of the
colour under the finger (6 + 1.3 x spread), closes 1-pixel cracks, then cuts every thread narrower than her feet
(she couldn't walk along it, and that is how a patch leaks into the next one), keeps the part joined to the tap and
traces its outline (Moore neighbour tracing, then Douglas-Peucker). Islands inside a walk area become blocks when
they are bigger than half a person and mostly not the ground's colour; smaller ones, and pools of lamplight on the
cobbles, are filled in.

**Saving files.** In a web browser a file is an ordinary download. Inside the Claude artifact viewer downloads are
blocked, so the page asks the viewer to save it (`claude.use("downloads")`, the artifact's `downloads` capability).
The work in progress is kept in IndexedDB (database `walking-paths`), which a private window or clearing the
browser's data loses: the page says so and points to the maps file.

`node tools/walking-paths-smoke.mjs` builds it and checks it in Chromium (ending with "all good"): from disk on a
laptop and a phone, then as the artifact page inside a locked-down frame. The workflow `walking-paths.yml` runs it
and puts `Walking-Paths.html` on the Releases page under the tag `walking-paths`, so its download link stays the same.
