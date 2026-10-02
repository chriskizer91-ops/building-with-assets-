# CLAUDE.md

## What this is

Mooncart: a retro handheld console for Android phones that plays single-file HTML games, with
Chris's games built in, made to keep working offline for decades. `README.md` is for Chris;
`docs/how-it-works.md` is for whoever works on it next.

## Rules

- This is the only repository to write to for Mooncart. The game repositories (`20-min`,
  `New-game`, `follow-me-down-witch-way`, `envoi-on-the-longest-night`, `what_the_map_forgot`)
  are read-only here: the games come from them through `games.json` and `tools/collect-games.mjs`.
  Never commit to them. When copying anything from one, name the source repo and path in the commit message.
- Mooncart must work with no internet. Never make `web/` load anything from the web (fonts, scripts, images).
- Never change the Android package name, the signing key, the `mooncart.invalid` addresses or how save
  slots are named: each one breaks updates or loses every saved game (see `docs/how-it-works.md`).
- Chris tries things on his phone. Every change should end with a build he can install, or screenshots he can open there.
- Write anything Chris reads (README, menus, messages in the app) in plain words; he isn't a programmer.

## Checking a change

```
node tools/collect-games.mjs --local ..       # or without --local in CI
node tools/dev-server.mjs --data /tmp/mc &    # fresh data folder
node tools/smoke.mjs                          # must end with "all good"
```

The GitHub workflow builds the APK and runs `tools/phone-test.sh` on an emulator; look at its screenshots.
