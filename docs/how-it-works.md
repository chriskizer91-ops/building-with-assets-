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
