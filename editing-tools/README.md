# Editing tools

Tools for making the games. Each one is plain HTML, CSS and JavaScript in its own folder here, built into a
single file that opens in a web browser on a laptop or a phone, with nothing loaded from the internet.

| tool | what it does | get it |
|---|---|---|
| [Walking Paths](walking-paths/) | Mark where people can walk on a painted map, join maps with ways out and a world map, make the pictures smaller, walk round to try it, and save the maps for a game. | [Walking-Paths.html](https://github.com/chriskizer91-ops/building-with-assets-/releases/download/walking-paths/Walking-Paths.html) |

How to use Walking Paths is in the main [README](../README.md#walking-paths-mapping-your-painted-maps); how it
is made, in [docs/how-it-works.md](../docs/how-it-works.md#walking-paths).

A new tool gets its own folder here, a `tools/build-….mjs` that makes its one file, a `tools/…-smoke.mjs` that
checks it in Chromium (ending with "all good"), and a workflow that puts the file on the Releases page.
