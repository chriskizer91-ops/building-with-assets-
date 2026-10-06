## Aethermoor: Hearth & Heirloom (Milestone 7)

**What it is:** A phone-first browser JRPG. A four-hero party walks 60 tile maps and fights turn-based battles on a speed-based "Initiative Ribbon" with visible d20 rolls, pries named relics out of foes' hands, and forges loot. Built from Chris's D&D interactive map and character sheet.
**Inventoried:** `New-game` @ `origin/claude/cool-ptolemy-uc93gg` (`49195c1`), `game/dist/aethermoor.html`. Full size 31,841,097 bytes; the stripped copy is 2,699 KB in 23 lines (line 11: 173,801 characters of CSS; line 19: 2,589,092 characters of the esbuild bundle). The stripped source tree `source/game/src/` has 244 files and ~52.7k lines. Line numbers refer to the **stripped source files** (`source/game/src/<path>`), because the single file is whitespace-minified.
**Tech:**
- Rendering: DOM screens, plus 2D canvases of `ImageData` pixel art drawn in code by a vector-to-pixel "Pixel Forge" (integer scale, pixelated).
- Build: ES2023 modules bundled by esbuild into one IIFE, inlined into `src/index.html`.
- External dependencies: no libraries; Google Fonts only.
- Assets: painted maps embedded as WebP data URLs (~29 MB of the file).
- Layers: ui → art/rules → data/core. Rules never touch the DOM, `Math.random` or `Date`.

### Coverage
- **Read fully:**
  - `core/`: `rng`, `dice`, `freeze`, `input`, `save`; `audio.js` except its track data (L35–168, skimmed).
  - `rules/`: all 19 files (5,025 lines).
  - `data/`: `tuning`, `statuses`, `aspects`, `rarity`, `omens`; `foes.js` L1–117.
  - `art/`: `forge`, `cache`, `index`, `item-art`, `hero-looks`.
  - `ui/`: `app.js`, `main.js`, `index.html`, `ui/lib/{keys,dom,overlay,anim}`, `ui/screens/{battle,settings}`, `ui/battle/util`, `ui/world/{loop,camera,constants,session,controls}`.
  - Docs, tests, tools: `ARCHITECTURE.md`, `test/core` and `test/frozen`, `tools/sim.mjs` L1–520.
- **Skimmed:**
  - `art/heroes.js` L1–130 and `art/item-looks.js` (about 150 lines).
  - Headers and exports of the other art modules.
  - Battle UI: `player.js` L1–80 and its handler list; `stage.js` (grep plus L280–360).
  - `screens/world.js` (about 200 lines plus its function list).
  - Header comments of the other `ui/` files.
  - Data: sampled, with entry counts from a read-only `node` import.
  - `RULES.md`: §1–4 read, the rest skimmed.
  - Tests: `combat.test` L1–120 and the names of the other tests.
  - Tools: the header comment of each.
- **Skipped:**
  - The drawing code in `art/foes`, `tiles`, `map-sprites`, `scenes` and `recipes` (~15k lines).
  - Dialogue, NPC and quest text.
  - Map rows beyond `keep.js`.
  - Most CSS.
  - Base64 assets.
  - The older builds m2–m6 (named only).

### Code map
| Lines / files | Group | What | ~lines |
|---|---|---|---|
| `core/rng.js, dice.js, freeze.js, input.js, save.js` | systems | RNG, dice, freeze, keys, saves | 264 |
| `core/audio.js` | systems (+ track data L35–180) | WebAudio synth and sequencer | 511 |
| `rules/battle.js, combat.js, ai.js, foe.js` | systems | battle engine, effects, intent AI, foe scaling | 1,521 |
| `rules/stats.js, gear.js, progression.js, party.js, loot.js, forge.js, codex.js` | systems | stats, XP, equip, loot, crafting, collection | 1,213 |
| `rules/gauntlet.js, migrate.js, world.js, path.js, cond.js, story.js, autoplay.js, util.js` | systems | flow, migration, overworld, A*, conditions, story, auto policy | 2,291 |
| `data/tuning.js` + 14 small rule tables | content (rules data) | balance knobs, statuses, aspects, rarity, items, skills… | 1,566 |
| `data/foes.js, relics.js, encounters.js` | content | 57 foes, 75 relics, 138 encounters | 3,665 |
| `data/dialogue.js, npcs.js, quests.js` | content | 449 nodes, 52 NPCs, 41 quests and bounties | 3,021 |
| `data/maps/*.js` (61 files) | content | 60 tile maps plus the index | 4,554 |
| `art/forge.js, cache.js, index.js` | systems | Pixel Forge renderer and LRU cache | 336 |
| `art/recipes.js, item-looks.js, item-art.js` | systems + content | item shapes, procedural item looks | 2,777 |
| `art/heroes.js, hero-looks.js, walkers.js, map-sprites.js` | systems + content | layered character rigs, sprites | 4,086 |
| `art/foes.js, scenes.js, tiles.js, icons.js` | content-heavy art | foe sprites, backdrops, tile atlases, icons | 11,110 |
| `ui/app.js, main.js, index.html, ui/lib/*` | systems / presentation | shell, router, overlays, helpers | 1,358 |
| `ui/screens/battle.js` + `ui/battle/*` | presentation | battle screen, event player | 3,708 |
| `ui/screens/world.js` + `ui/world/*` | presentation | world screen, view, camera, controls | 4,720 |
| other 8 screens + `ui/card.js` | presentation | title, new game, aftermath, party, codex, journal, atlas, settings, item card | 3,981 |
| `ui/*.css` (6) | presentation | theme and screen styles | 2,334 |
| `ui/assets/**` (71) | content | painted maps, stills, atlas image (base64 stripped) | 316 |
| **Total** | | systems ≈ 9.6k · art ≈ 18.3k · UI ≈ 15.8k · data ≈ 12.8k | **≈ 52.7k** |

### Systems

#### Seeded RNG — random numbers
- **Does:** A serializable mulberry32 generator. A string seed is hashed with FNV-1a; a number seed is used as `>>>0`. Its state is one int32, so battles and games store `rngState` and resume exactly. Named streams keep systems apart: `roam:<seed>:<map>:<visit>`, `chest:<seed>:<id>`, `echo:<seed>:…`, `sim:<seed>`, and item art keyed `kind|rarity|aspect|seed`.
- **Main pieces:** `hashSeed` (`core/rng.js` L3), `createRng` (L10) → `{next,int,pick,chance,fork,getState,setState}`, `rngFrom` (`rules/util.js` L14). **Size:** 28 lines. **Depends on:** nothing. **Tangled:** clean.
- **Fingerprint:** Core step: `a=(a+0x6D2B79F5)|0; t=imul(a^(a>>>15),1|a); t=(t+imul(t^(t>>>7),61|t))^t; ((t^(t>>>14))>>>0)/2^32`. FNV basis 2166136261, prime 16777619. `int()` is inclusive. `Math.random` appears only in UI and audio: ability rolls, the new-game seed (`(Date.now()%2147483647)^random`), dice tumbles, particles, the cosmetic identify roll (`ui/card.js` L233), and the noise buffer.

#### Dice notation — random numbers
- **Does:** Visible dice that return every face, and a d20 with advantage or disadvantage (two dice, keep higher or lower; both cancel). A parser reads `"2d8+6"` and `"1d10 + 1d6 - 1"` into terms (which can be negative) plus a flat bonus. Rules add "+1 die every N levels" scaling, and a crit doubles the dice count.
- **Main pieces:** `core/dice.js`: `rollDice` (L3), `rollD20` (L9), `parseDice` (L16). `rules/util.js`: `scaledTerms` (L22), `rollTerms(rng,terms,mult)` (L29), `rollExpr` (L54), `avgExpr` (L60), `weightedPick` (L65).
- **Size:** ~70 lines. **Depends on:** RNG. **Tangled:** clean.
- **Fingerprint:** `rollD20` returns `{rolls,kept,nat}`. Scaling adds `floor((L-1)/every)` dice to the first term only.

#### Keyboard input — input
- **Does:** Maps key codes to action names; a screen returns `true` from `onAction` to consume a key. Keys are ignored while typing or with Alt/Ctrl/Meta held. Overlays get a capture-phase key trap that only the topmost one uses. `screenNav` moves focus with the arrows and confirms by clicking the focused button or the `[data-primary]` one.
- **Main pieces:** `KEYMAP`/`createInput` (`core/input.js` L4, L12); `moveFocus`/`screenNav`/`trapKeys` (`ui/lib/keys.js` L19, L29, L49); the world's held keys `KEY_DIR` (`ui/world/controls.js` L18). **Size:** ~100 lines. **Depends on:** DOM. **Tangled:** clean.
- **Fingerprint:** Arrows/WASD → up/down/left/right. Enter/Space/Z → confirm. Escape/X/Backspace → back. M → menu. F → fast (battle speed). Digit1–9 → `pick1..9`. In the world: Shift or X held = run; J = Journal. **Mooncart:** arrows yes, Enter = A yes, Escape = B yes, M = menu (matches START), **H/SELECT not mapped**. No gamepad support. The keymap is duplicated in `core/input.js` and `ui/lib/keys.js`.

#### Touch controls (world) — input
- **Does:** A virtual d-pad with pointer capture, a dead zone and axis hysteresis. An A button that fires on pointerdown, and a B button: hold to run, tap (under 250 ms) to go back. Plus a Menu pill. Tap-to-walk (finds a path with A* to the tapped tile) and hold-to-inspect. A buffered direction, so a tap made mid-step is not lost. The "auto" setting shows the deck on the first touch.
- **Main pieces:** `createControls` (`ui/world/controls.js` L23); `pump`/`tryStep` (`ui/screens/world.js` L508, L552). **Size:** ~260 lines. **Depends on:** overlays, world engine. **Tangled:** clean.
- **Fingerprint:** D-pad 144 px, dead zone 14 px, hysteresis 0.2. A press under 90 ms only turns. Step 160 ms, run 110 ms, hold 450 ms, path max 48 tiles. Battles use DOM buttons only: tap a foe or hero card to target.

#### Save, load and export codes — save
- **Does:** One live localStorage slot plus a backup, with every access in try/catch. A milestone writes only its own key, and reads older milestones' keys (newest first) without ever writing or removing them. An older save is migrated in memory and offered on a carry-over card; it is written on the world's first step. Export/import codes move saves between devices. Import strips `<>` from every string and key (`scrub`) and names a code from a newer version as such.
- **Main pieces:** `core/save.js`: `loadGame(migrate)` (L47), `saveGame` (L61), `backupGame`/`restoreBackup` (L73–85), `exportCode` (L116), `scrub` (L149), `importCode` (L159), `loadSettings`/`saveSettings` (L104–107). **Size:** 173 lines. **Depends on:** an injected `migrate` (core imports nothing game-specific). **Tangled:** clean; the key names are per milestone.
- **Fingerprint:** Keys: live `aethermoor.save.m7`, backup `aethermoor.save.m7.bak`, marker `aethermoor.m7.started='1'`. Read-only keys: `aethermoor.save.m6`, `m5`, `m4.5`, `m4`, `v2`, `v1`. Settings: `aethermoor.settings.v1`. Format: JSON with `version: 6`. Code format: `AETH<version>.` + base64(UTF-8 JSON); AETH1–6 accepted. Autosave on every `ctx.setGame` (`ui/app.js` L83). The world also saves on map change, before a battle, every 20 steps, and on pagehide. `game.settings` is written by `newGame` but never read.

#### Save migration and validation — save
- **Does:** A pure, idempotent chain from any older save to version 6. `toV2` places an M2 road save onto the map: it picks a map anchor, kindles the fires already reached, and sets story flags. `toV3` adds the materials purse, gem pouch, Codex pages and settled Grudges. It claims whole relics and marks won fights as beaten. `toV4` and `toV5` only bump the version; `toV6` adds `ending:null`. `saveProblems` checks the shape of a pasted save: items, party, counts, map position, and one Masterpiece.
- **Main pieces:** `rules/migrate.js`: `toV2` (L33), `toV3` (L66), `toV4` (L93), `toV5` (L102), `toV6` (L112), `migrate` (L120), `saveProblems` (L124), `SAVE_VERSION=6` (L31). **Size:** 141 lines. **Depends on:** data (encounters, heroes, world, relics, maps). **Tangled:** some untangling needed; it names M2 encounters and flags.
- **Fingerprint:** Versions: 1 = M2, 2 = M3, 3 = M4/4.5, 4 = M5, 5 = M6, 6 = M7. There are 18 real v1 fixtures (`test/fixtures/v1`), generated by `tools/make-v1-fixtures.mjs` from the unmodified M2 rules.

#### WebAudio synth and step sequencer — audio
- **Does:** Everything is synthesized; there are no audio files. Master gain feeds a compressor, with separate SFX and music buses. SFX are scheduled oscillators, FM bells and filtered noise, including rarity-tiered reveal chimes. Music tracks are token strings per part ("D5", "D4+F#4", `-` hold, `.` rest, drum letters). A 30 ms `setInterval` look-ahead scheduler plays them and crossfades between tracks. Silent until a user gesture. Suspends when the tab is hidden. `duck()` lowers the music.
- **Main pieces:** `core/audio.js`: `TRACKS` (L35–180), `parsePart` (L183), `createAudio` (L201). Synth primitives `env/tone/bell/noise` (L230–268) and `SFX` (L274). `duck` (L329), instruments `horn/wind/reed/frog/peep` (L341–402), `musicVoice` (L404), `drum` (L420), `startTrack/stopTrack/sync` (L436–486).
- **Size:** 511 lines (~145 of them track data). **Depends on:** WebAudio. **Tangled:** some untangling needed; the engine is generic, the tracks are themed.
- **Fingerprint:** Gains: master 0.6, SFX 1, music 0.5. The "25% pulse NES lead" is a PeriodicWave with 32 harmonics; the FM bell uses ratio 2.76. Look-ahead 0.15 s; crossfade 0.9 s. 12 tracks: peaks, desert, title, road, battle, boss, hearth, wilds, fen, town, dungeon, victory. About 35 SFX names. Voices: horn, reed, bell, tri, pulse, square, pluck, flute, pad. Drum letters: `k s h c d t a w f p`. On/off for SFX and music; no volume control. L230 comments "ported from the Loot Forge prototype".

#### Hero stats and item profiles — stats
- **Does:** `deriveHero` merges into one derived hero: base abilities, traits, gear, affixes, enchant (rarity + temper), gems, a relic's Kindled bonus and Awakened branch, set bonuses, and the party-wide Codex bonus. Outputs: weapon hit and damage, Guard, speed, ribbon delay, crit range, resists (capped at 60%), regen, surge gain, grip damage, save bonus, and Surge powers sorted by rarity. `canUse` checks proficiencies, `refuses` (Alondra: no blades), ability `needs`, and whether the item is shattered.
- **Main pieces:** `itemProfile` (`rules/stats.js` L89), `maxHpFor` (L145), `deriveHero` (L154), `heroStats` (L228), `heroSkills` (L240), `POWERS` (L40); `canUse` (`rules/gear.js` L17); `mod`/`profFor`/`ibFor` (`rules/util.js` L6–12). **Size:** 278 lines. **Depends on:** data (heroes, items, relics, affixes, rarity, gems, tuning), codex. **Tangled:** some untangling needed; it imports the relic, set and masterpiece tables.
- **Fingerprint:** Stats STR/DEX/CON/INT/WIS/CHA, with `mod=floor((s-10)/2)`. Proficiency is `2+floor((L-1)/4)`; the "Imprint Bonus" for a Domain level uses the same curve. Hero save DC = `8+IB+domain-ability mod`. Weapon hit = prof + the best of the weapon's abilities + weapon hit (enchant + relic) + other gear hit. Guard = `armor.base+min(DEX,maxDex)`, or `10+DEX`, plus gear. Speed = `10+DEX+gear`. Crit range is `max(17,20-crit)`. HP = hit die + CON at L1, then the stored roll + CON for each level (minimum 1), plus gear, ×(1+hpPct). MP = `base+perLevel(L-1)+2·mod(stat)+gear`. Enchant for worn → storied is 0/0/1/1/2, plus temper. It adds to hit and damage on weapons, Guard on body armour and shields, and 3 HP per point elsewhere.

#### XP and leveling — stats/leveling
- **Does:** Levels 1–50. A level-up rolls the hit die (never below half; stored in `hpRolls`). Every 4 levels, +1 to a pair of abilities (from the hero's `asi` list, capped at 20). Skills unlock at set levels. Domain levels rise: the primary equals the level, secondaries `ceil(L/2)`, capped at 20. Every active hero gets the full XP.
- **Main pieces:** `xpToNext` (`rules/progression.js` L13), `xpForLevel` (L19), `levelForXp` (L25), `levelUp` (L36), `grantXp` (L65); `awardXp` (`rules/gauntlet.js` L315). **Size:** 75 lines. **Depends on:** heroes, tuning. **Tangled:** clean.
- **Fingerprint:** **XP to next level = round(30 × L^1.55)**. Totals: L5 = 540, L10 = 3,655, L20 = 22,908, L50 = 246,489. Foe XP = `round(rate×L×(1+0.2·omens))`, rates rabble 7, veteran 16, relic-bearer 48, champion 110. Gold rates are 3/8/25/60.

#### Battle engine and Initiative Ribbon — battles
- **Does:** A pure state machine: `createBattle` builds heroes, foes and M7 guests, rolls initiative, applies opening effects (ambush, First Strike, ward, Iron Stance, toll) and first intents. `act`/`foeTurn` clone the state and return `{state,events}` for the UI to animate. Turn start: damage ticks, regen, frozen/held skip, charm auto-turn; turn end: statuses count down, next turn scheduled, next intent rolled. Commands: attack, skill, item, defend (+2 MP), Surge, flee. `outcome` returns rewards, vitals, a deed log and rounds; `inspect` feeds Analyze.
- **Main pieces:** `rules/battle.js`: `createBattle` (L79), `rollInitiative` (L134), openers (L143–194), `unitDelay` (L216), `timeline` (L226), `startTurn` (L244), `finishTurn` (L311), `advance` (L329), `checkEnd` (L348), `outcome` (L371), `inspect` (L384), `commands` (L432), `doFlee` (L485), `act` (L560), `playIntent` (L589), `foeTurn` (L608). **Size:** 623 lines. **Depends on:** combat, ai, foe, stats, loot, data. **Tangled:** some untangling needed; it checks `unfair-toll`, `iron-stance` and the Thornwatch text.
- **Fingerprint:** **A conditional turn-based speed timeline, not ATB.** The unit with the lowest `next` acts; ties go by `seq` (heroes, then foes, then allies). First turn: `max(0, 64 − 2(d20+speed−10))`. Delay: hero `max(45, 100+weaponWeight−4(speed−10))`; foe `max(45, 100−4(speed−10))`. A turn's step = `max(22.5, round(delay×actionMult×statusMult×frenzy))`. Defend ×0.8; skills, items and foe moves use their `delay`; Hasted ×0.7, Rooted ×1.2, Chilled ×(1+0.1·stacks), Frenzied under 25% HP ×0.5. Shifts: fumble +25, Stagger +35, ambush heroes +40, First Strike foes +40, toll +80. One round = 100 ticks; `timeline(state,8)` previews 8 turns. **Flee:** d20 + the best DEX mod + prof against `10 + the highest foe tier DC` (veteran 3, relic-bearer 6, champion 99); a natural 1 always fails. Victory when the only foes left are summons. Battle state field `v:1`.

#### Attacks, damage and saves (the effect interpreter) — battles
- **Does:** Skills, moves and powers are data-driven effect lists: `attack | damage | heal | status | cleanse | delay | revive | grip | reveal | surge | mp | summon | escape`. There is no per-skill code. An attack is a visible d20 against Guard with five outcomes. Damage dice come in groups (weapon, bonus aspect dice, gear `extra`, `vsHurt`, `vsUnaware`), plus a flat bonus and multipliers. `dealDamage` then applies Guarding, Frozen and Warded. Thornskinned foes reflect damage; Omen riders apply when foes hit.
- **Main pieces:** `rules/combat.js`: `effGuard` (L26), `saveDC` (L30), `aspectMult` (L40), `damageMult` (L49), `dealDamage` (L184), `rollAttack` (L357), `resolveAttack` (L376), `savingThrow` (L420), `resolveDamage` (L430), `resolveHeal` (L445), `resolveSummon` (L495), `applyEffect` (L513), `runEffects` (L538). **Size:** ~350 of 548 lines. **Depends on:** dice, statuses, aspects, omens, tuning. **Tangled:** clean.
- **Fingerprint:** **Hit:** `d20 (adv/dis) + bonus ≥ Guard`. Natural 1 = fumble. Natural roll ≥ crit range (heroes 17–20, foes 20) = **Legend Strike crit**: hits automatically, doubles the dice count, +20 Surge, and jars 25% of the grip loose. **Missing by 3 or less = graze**: half damage, no riders, +2 Surge. Otherwise a miss. Advantage from `eff.adv` or Frozen/Rooted/Marked targets; disadvantage when Frightened or Hexed. Having both cancels. **Damage:** `raw = max(1, Σdice+flat)×mult`, ×0.5 on a graze. `m = armourChart × aspectWheel(×1.5 if the attacking aspect beats the target's, ×0.5 if the target's beats it or they are the same) × (×1.5 for each weak, ×0.5 for each resist, by kind and by aspect) × (1−hero resist%, capped at 60)`. `final = m==0 ? 0 : max(1, round(raw·m))`. Then Guarding `ceil(×0.5)`, Frozen against crush `round(×1.5)` (the ice shatters), and Warded absorbs. Marked adds +2. Armour chart (slash/pierce/crush): against hide 1.25/1/0.75, mail 0.75/1.25/1, plate 0.75/1/1.25, chitin 1/0.75/1.25. Eight aspects; radiant and blight beat each other. **Saves:** d20 (disadvantage if Hexed) + bonus ≥ DC; a natural 20 always passes and a natural 1 always fails. Foe DC = `10+floor(L/2)+tier (0–3)`.

#### Status effects — battles
- **Does:** 22 statuses with engine flags. Durations count the bearer's own turns and tick down at the end of each turn; damage-over-time ticks at turn start. Stacks cap at `maxStacks`; `atMax` converts (3 Chilled → Frozen). On being added, push and breaksCharge apply: a Stagger cancels a charging intent. A held (swallowed) unit can't be targeted, loses its turns and takes a 1d6 tick. It is released by a hit of at least 15% of the holder's max HP, by the holder's KO, or if it would be the last one standing. A charmed unit plays one attack on an ally. Rotting halves heals. Hexed rolls d20s with disadvantage. Unmade blocks relic Surges. Hearthlit gives +1 to hit.
- **Main pieces:** `STATUSES` (`data/statuses.js` L33); `addStatus` (`rules/combat.js` L78), `removeStatus` (L123), `applyHeal` (L132), `release` (L145), `knockOut` (L167); upkeep (`rules/battle.js` L244–308); `targetable` (`rules/ai.js` L20). **Size:** ~280 lines. **Depends on:** battle and combat. **Tangled:** some untangling needed. The flags `forceTarget`, `tickHeal`, `absorb` and `shatter` are documented but not read: the engine hard-codes the ids provoked, regenerating, warded, frozen, guarding and marked.
- **Fingerprint:** Burning 1d6 for 3 turns; poisoned 1d4 per stack ×3 for 4; bleeding 1d4 per stack ×3 for 3. Chilled at 3 stacks becomes frozen: skips its turn, gives attackers advantage, takes crush ×1.5. Staggered: pushed 35, −1 Guard. Also frightened, rooted, marked, exposed (−2 Guard), provoked, warded, hasted, regenerating, guarding (+2 Guard, half damage). Added later: M5 burrowed, swallowed, charmed; M6 rotting (1d6 per stack, heals ×0.5), hexed; M7 unmade, hearthlit.

#### Foe intent dice and move tables — enemy AI
- **Does:** The tier's die face picks a move from the family's D&D-style table `[[lo,hi,move]]`, or from the current boss phase's table. Moves fall back when unavailable (a required relic is no longer held, `when.hpBelow` isn't met, the summon cap is reached), up to 4 hops. The intent is rolled at battle start and at **the end of the foe's previous turn**, then shown ("7: Bite at Wren, charging"). It is re-aimed if the target falls. Analyze pre-rolls a queue that the foe really uses. A move's `then` forces the next intent; `opener` fixes the first move. M7: the hollow tier adds +4 to the natural roll while its gift relic is held; prying the gift off re-reads earlier rolls without the +4. The Unsmith rolls two dice and makes two moves.
- **Main pieces:** `rules/ai.js`: `familyData` (L22), `foeTable` (L30), `dieBonus` (L39), `usable` (L56), `resolveMoveId` (L68), `stepDownDie` (L75), `strongest` (L82), `chooseTarget` (L88), `rollIntent` (L124), `dropBonus` (L141), `intentFor` (L157), `refreshIntent` (L173). Also `FOE_TIERS`/`DIE_STEPS` (`data/foes.js` L31, L43). **Size:** 181 lines. **Depends on:** foe data, rival kits. **Tangled:** clean.
- **Fingerprint:** Dice: rabble d6, veteran d8, relic-bearer d12 (d8 once disarmed), champion d20, hollow d20+4 (capped at 20), Unsmith 2×d20. Target weights: under 35% HP ×2.5, under 60% ×1.4, a hero with `mend` ×1.4, Marked ×3, Guarding ×0.5. Provoked must hit its source. Boss phases change at the HP fractions in `phases[i].at`.

#### Grip & Claim — battles/loot
- **Does:** Each relic a foe holds has its own grip meter. Grip wears from crush damage, from skill grip dice (Disarm, Wrench, Sunder), from crits and from gear `gripDmg`. The player can aim at one piece (`cmd.relic`). At 0 grip: a disarm. The holder loses the Arts that need the relic (named in the text), a relic-bearer's die drops a size, and pending intents are re-rolled. At victory, pried pieces are claimed. A holder KO'd while still gripping **shatters** its relic; Hilda can reforge it. Exceptions: `gentle` fights don't shatter, `lend` pieces are never claimed, and `keepsRelics` holders keep theirs. A relic the player already owns shows up on its holder as an Echo (a generated runed or storied copy).
- **Main pieces:** `heldPieces` (`rules/foe.js` L81); `applyGrip`/`disarm` (`rules/combat.js` L275–314); `battleLoot` (`rules/loot.js` L212); `heldFor`/`echoItem` (`rules/gauntlet.js` L141–153); `reforge` (`rules/party.js` L125). **Size:** ~80 lines. **Tangled:** clean.
- **Fingerprint:** Max grip = `round(base(20 if unset)×(1+0.1(L−1))×1.5 if Ironclad)`. Wear = `floor(crush dealt×0.6) + dice + stat mod + ceil(0.25·max on a crit) + gripDmg`. Grazes still wear grip. Reforge costs 12 gold × item level.

#### Legend Surge — battles
- **Does:** Each hero has a 0–100 gauge, kept between battles. When full, the `surge` command fires the best-rarity equipped item's power (an effect list that never misses; Awakened branches can override it). With no powered item, or when Unmade, the hero does a Heroic Strike instead (an automatic-crit weapon blow). This emits a `legend` event carrying the item.
- **Main pieces:** `addSurge` (`rules/combat.js` L69), `surgePower` (`rules/battle.js` L426), `POWERS` (`rules/stats.js` L40). **Size:** ~40 lines. **Tangled:** clean.
- **Fingerprint:** +5 per hit, +2 per graze, +20 per crit, +8 per kill, +3 per heal given, +50×(damage taken/max HP). All gains ×(1+surgeGain%); the Warden gets +10%.

#### Foe building, the Waking and Omens — enemy scaling
- **Does:** Turns a spawn into a combatant. Stats scale with level, gear tier (humanoids only) and Omens. Visible gear tiers set both drops and art. The Waking escalates every spawn and adds deterministic Omens: Emberblooded, Thornskinned, Twinned (splits at 50% HP), Frenzied, Ironclad, Swift. A unique foe is never Twinned. M7: the Unsmith's Stolen Arts turn relics the player never claimed into his moves.
- **Main pieces:** `rules/foe.js`: `familyOf` (L17), `addOmens` (L28), `escalateSpawn` (L51), `visibleGear` (L67), `buildFoe` (L95), `stolenArt` (L146). Also `splitTwin`/`takeStolen` (`rules/combat.js` L241–264). **Size:** 213 lines. **Tangled:** some untangling needed (Act III Stolen Arts).
- **Fingerprint:** **Foe HP = round(base×(1+0.24(L−1))×(1+0.12·gearTier)×(1+0.1·omens))**. Per level: Guard +1 per 3, attack +1 per 2, damage +1 per 2, dice +1 per 3, saves +1 per 3. Gear tier adds Guard and attack. Rewards ×(1+0.2·omens). Each Waking: rabble +2 levels, others +6. Gear tier +1 (cap 3). Omens: rabble get `waking−1`, others `waking`.

#### Loot generation — gear/loot
- **Does:** Rarity comes from a weight curve bent by luck. The base is chosen by slot weight, with newer bases likelier at higher item levels. Affixes: the count follows rarity, at most 2 prefixes (named for regions) and 2 suffixes (named for Domains), groups are exclusive, values scale with `statMult` and item level. Names: worn "Patched X"; affixed items "Prefix Base Suffix"; storied items get a generated "First+Second, Epithet", drop unidentified, and carry lore and a minor power. Drops by tier: rabble drop the weapon they carry, veterans a piece they wear, bosses extra items with a minimum rarity. Also consumables, and a Grudge bonus (one rarity up, stamped).
- **Main pieces:** `rules/loot.js`: `newUid` (L17), `rarityWeights` (L24), `rollRarity` (L28), `pickBase` (L41), `affixValueAt` (L53), `rollAffixes` (L59), `rerollAffix` (L116), `generateItem` (L133), `relicItem` (L153), `foeDrops` (L186), `battleLoot` (L212). **Size:** 234 lines. **Tangled:** clean.
- **Fingerprint:** Rarities: worn, wrought, tempered, runed and storied roll randomly; heirloom, regalia and primal are hand-made. Weights 100/55/22/7/1.5, each ×(1+luck)^(rank×0.7). Luck = tier (0–3) + Waking + 0.5 per Omen + 1 for a Grudge. Affix counts 0/1/2/3/3. `statMult` 1/1/1.1/1.2/1.35, then 1.5, 1.5, 1.8 for the hand-made tiers. Dice affixes cap at 6 (1d12). Rabble drop their weapon 35% of the time, otherwise 30% random gear. Consumable chance by tier 6/15/50/100%. Item ids are `"i"+base36+base36`. Every item has a `seed` for its art.

#### Equipment, compare and shops — inventory/shop
- **Does:** Pure equip and unequip. A two-hander clears the offhand; an item moves off whoever wore it before; vitals are clamped; the item's Chronicle records each bearer. `compare` gives the green and red stat deltas. `upgradeScore`/`bestHeroFor` auto-equip (the sim uses them). Also `buy`, reforge, and the M3 temper wrappers.
- **Main pieces:** `rules/party.js`: `equip` (L40), `unequip` (L60), `compare` (L89), `upgradeScore` (L103), `bestHeroFor` (L111), `reforge` (L125), `buy` (L159). **Size:** 166 lines. **Tangled:** clean.
- **Fingerprint:** 8 slots: weapon, offhand, head, body, hands, feet, amulet, ring. Score = `2·dmg+3·guard+1.5·hit+0.2·hp+0.1·mp+0.8·speed−0.05·delay+1.5·crit`. Prices: tonic 20, bitterroot 15, draught 15, salts 60 gold.

#### Forge crafting — economy
- **Does:** Temper from +1 to +10: each step is +1 enchant, paid in gold, silver and embers. Reroll one affix (uses `game.rngState`). Salvage into materials. Gem sockets: runed and storied items get 1, relics as their data says, primal items 3. Gems can be set and removed, and there is a gem shop. Awaken a relic once its 3 deeds are done, along branch a ("the Hand") or b ("the Heart"), chosen by the bearer's best Domain. One named primal Masterpiece per save.
- **Main pieces:** `rules/forge.js`: temper (L97–115), reroll (L119–147), salvage (L152–171), sockets and gems (L177–236), awaken (L248–293), masterpiece (L309–345). **Size:** 345 lines. **Tangled:** some untangling needed; the Masterpiece checks `hollow-gretch` and story flags.
- **Fingerprint:** Temper = `30×ceil(ilvl/2)×[1,2,4,6,8,11,14,18,23,30][t]` gold, plus silver `[0,0,0,1,2,3,0…]` and embers `[…,1,2,3,4]`. Reroll = `40×ceil(ilvl/2)×(1+rerolls)`. Socketing costs `20×ceil(ilvl/2)`. Awakening costs 2 embers + `150×ceil(ilvl/2)` gold. A Kindled relic gives +1 hit, +1 Guard or +5 HP, depending on slot. The Masterpiece costs 2000 gold, 5 embers, 5 silver and 2 Bog Amber; its name must match `/^[A-Za-z0-9 '-]{1,24}$/`.

#### Codex, deeds and relic stages — collection
- **Does:** Five Codex pages list relics by number. A finished page grants a permanent party-wide stat block (`pageBonus`). Each relic names 3 of the 11 deeds; fights mark them, and the stages are dormant → kindled → awakened. `stolenFor` picks the relics the Unsmith takes.
- **Main pieces:** `rules/codex.js`: `pageProgress` (L40), `pageBonus` (L56), `markPages` (L71), `deedsOf` (L86), `stageOf` (L91), `stolenFor` (L109). Also `fightDeedIds`/`markDeed`/`chronicle` (`rules/gauntlet.js` L391–446). **Size:** ~195 lines. **Tangled:** clean.
- **Fingerprint:** The 11 deeds: first-blood, fell-holder, fell-champion, legend-strike, surge, claim, settle, brand, untouched, rout, hundred. Page rewards: +5% HP; +1 hit; +1 Guard; +10% healing; +1 to saves. Pages II–V also add aspect resists.

#### Game flow: battles in and out, wipes, Grudges, Brands — progression
- **Does:** `newGame`, `rest` (full heal, the day advances, the fire is kindled) and `travel` (to a kindled fire). `spawnsFor` resolves party-level and rival spawns, the Waking, Echoes and Grudges. `startBattle` handles authored encounters and patrols. `resolveBattle` applies a finished battle: vitals, XP, gold, loot, Codex, Chronicle, a breather heal, flags, `opens`, Brands, spoils, deeds and pages. **Wipe:** wake at the last Hearthfire (or the encounter's `wakeAt`), lose 10% of gold, keep 25% of the fight's XP, and the strongest standing elite becomes a Grudge (a title and +1 Omen). A lost duel is a yield instead. **Brand:** Waking +1, the region's non-`once` encounters re-arm, and act-completion flags are set.
- **Main pieces:** `rules/gauntlet.js`: `newGame` (L69), `rest` (L97), `partyLevel` (L109), `travel` (L119), `spawnsFor` (L186), `startBattle` (L210), `recordGrudge` (L267), `winBattle` (L323), `spoils` (L452), `earnBrand` (L472), `wipe` (L493), `yieldDuel` (L515), `resolveBattle` (L533). **Size:** 563 lines. **Tangled:** deeply tied; it names regions, story flags and special cases.
- **Fingerprint:** Starting gold 50. The breather after a win restores 20% HP and 25% MP. Grudge Omen cap: champion 1, others 2. `partyLevel` = rounded mean level. The party is 4 fixed heroes.

#### Overworld engine: maps, collision, roamers — maps/collision/AI
- **Does:** A pure lockstep world: the UI calls `move` per step and `tick` every 400 ms, each returning events (step, bump, exit, encounter, gate, lock, talk, chest, hearthfire, alert, roam, contact…). Maps are tile rows plus entities, exits, anchors and roam rects; entity presence is `check(game,e.if)`. Locks open with a relic map power or a Domain level; soft locks cost sight (darkness 2, fog 3) or HP per step. Roamers (authored packs or zone patrols) wander on a leash, spot the player by line of sight, show "!", chase, give up or flee if weak; contact from behind is a First Strike or an ambush. Includes 4-way A* (`rules/path.js` `aStar` L22: Manhattan heuristic, linear open list, max 48 steps, 24 for roamers).
- **Main pieces:** `rules/world.js`: `present` (L133), `canWalk` (L150), `freeSpot` (L185), `enterMap` (L256), `move` (L284), `interact` (L370), `tick` (L397), `findPath` (L423), `threat` (L434), `lockStatus` (L458), `openChest` (L500), `light` (L538), `isWeak` (L545), `roamMask` (L568), `seedRoamers` (L630), `tickRoamers` (L668). **Size:** 763 + 52 lines. **Tangled:** some untangling needed; it names map powers such as trackless, hymn-of-rest, stillness, longsight and dawnbell.
- **Fingerprint:** **Grid collision with 16 px tiles**: 28 tile characters, each flagged solid, over, anim, oneWay (a ledge you can only walk off southwards) or noRoam. Solid entities also block. 4-way movement. Sight 5 tiles (Chebyshev distance) with Bresenham line of sight; 2 in the dark; hunters +3. "!" wait 2 ticks. A chase skips every 3rd tick; a weak pack fleeing skips every 5th. Leash 4; a chase gives up beyond leash+6. Wandering steps on 1 tick in 3. Grace 6 ticks after a battle; stun 12 after the player flees. Patrols spawn at least 8 tiles from the player. Ichor costs 4% HP per step. Weak pack = all rabble, no relics, at least 3 levels below the party. Chest item level = map level + 6×Waking.

#### Condition evaluator — quests/story flags
- **Does:** One `check(game,cond)` decides entity presence, gates, talk, dialogue choices, quests, bounties and shops. Condition keys: `flag`, `cleared`, `done`, `beaten`, `brand`, `brands`, `waking`, `level`, `owns`, `power`, `wears`, `active`, `domain`, `unlocked`, `opened`, `kindled`, `quest`, `bounty`, `since`, `day`, `afford`, `masterpiece`, `pages`, `ending`, plus `all`, `any`, `not` and plain arrays. Quest state (hidden, active, ready, done) is derived from conditions. Validators back the data tests.
- **Main pieces:** `check` (`rules/cond.js` L91), `questState` (L75), `bountyState` (L84), `canAfford` (L136), `COND_KEYS` (L146), `condErrors` (L167). **Size:** 189 lines. **Tangled:** clean (a small DSL; an unknown key throws).
- **Fingerprint:** Story flags are stored as `flags.story[flag] = true | day`.

#### Story runner: dialogue, checks, quests — dialogue/quests
- **Does:** `talkTo` picks the first NPC talk line whose condition holds. `dialogueView` returns lines (`{warden}` filled in) and the choices whose conditions hold, with exact odds chips, prices and the reasons a choice is disabled. `choose` rolls Domain checks and N-of-K contests from `game.rngState`. Effects: flags, items, gold, gems, pay, unlock, heal, fight, open, ending, and more. Also quests, bounties, the Ladder, letters.
- **Main pieces:** `rules/story.js`: `talkTo` (L54), `passChance`/`oddsFor`/`rollCheck` (L82–112), `dialogueView` (L114), `apply` (L160), `enterDialogue` (L220), `choose` (L226), `questLog` (L250), `claimQuest` (L293), `ladder` (L301). **Size:** 331 lines. **Tangled:** clean engine; the content is in data.
- **Fingerprint:** Check = `d20 (advantage: best of 2) + IB(the best hero's Domain level) + ability mod ≥ DC`; no natural-roll rules. Odds = `clamp((21−(DC−bonus))/20)`, exact for contests. Node format: `{lines:[[speaker,text]], choices:[{text,if,do,check|contest,next,needs}], do}`.

#### Scripted battle policy (Auto) — AI/balance
- **Does:** A deterministic hero autopilot with no RNG. In priority order: Surge, heal or revive, item, grip (disarm the holder with the least grip left), control (Analyze, Mark, Rootbind, area attacks), Arts, then attack the priority target. It leaves relic holders until last so their relics don't shatter. Used by the battle Auto button, by the sim, and to finish a battle after an error.
- **Main pieces:** `rules/autoplay.js`: `priorityTarget` (L20), `healPlan` (L33), `gripPlan` (L60), `controlPlan` (L70), `artPlan` (L89), `autoCommand` (L111). **Size:** 126 lines. **Tangled:** some untangling needed (skill ids). **Fingerprint:** Heals below 45% HP; tonics below 20% or 35%.

#### Pixel Forge (vector-to-pixel renderer) — rendering
- **Does:** Builds parts from signed-distance shapes (polygon, capsule, circle, ellipse) placed by an axis transform `Xf`. Each part gets a height profile (bevel, round, ridge, flat). Normals are lit against a fixed top-left light with specular. Values are quantised onto a 6-step ramp per material, with Bayer dither, metal edge highlights and 1 px occlusion. `compose` adds a background, shadow, aura, emissive halos, a selective coloured outline, rim light, a shine sweep, flicker, tint, glints and particles. Mirroring keeps the light top-left. LRU caches sit on top.
- **Main pieces:** `MAT` (`art/forge.js` L7–98, ~85 materials), `sdPoly`/`sdShape` (L109–127), `Xf` (L137), `Forge` (`add` L152, `raster` L175), `compose` (L228); `lru`/`objId` (`art/cache.js` L3, L21). **Size:** 315 lines. **Depends on:** `ImageData`. **Tangled:** clean; it is a reusable art engine.
- **Fingerprint:** Light L3 = normalize(−1, −1.15, 1.45). Value index 0–5. Outline `#0b0910`. 4×4 Bayer dither; halos 2 px. Header line 1: "Ported from prototypes/item-card.html (the approved Loot Forge art pipeline)".

#### Item art: recipes and procedural looks — rendering/procgen
- **Does:** `RECIPE[r](F,X,P)` adds the parts for each item shape. `RELIC_ART` holds hand-made parameters for named relics. `itemArt(item)` derives deterministic parameters for any rolled item from `kind|rarity|aspect|seed`, with its own RNG and per-tier metals, woods, cloth and gems. Temper +1 to +10, set gems and relic stages become material variants. `gearLooks` makes the card's sword the sword in the hero's hand.
- **Main pieces:** `art/recipes.js` (export at L1967; body not read); `art/item-looks.js`: `RARITY_LOOK`/`ASPECT_LOOK` (L35, L51), `RELIC_ART` (L133), `ctxFor` (L297), `itemArt` (L415), `itemLookKey` (L438), `temperOf` (L466); `ART` (`art/item-art.js` L56). **Size:** ~2.8k lines. **Tangled:** some untangling needed; the recipes are generic, `RELIC_ART` is content.
- **Fingerprint:** The item art cache holds 4000 entries. Reveal beam width grows from 3 to 12 px with rarity tier.

#### Character rigs: heroes, walkers, NPCs, foes — rendering/animation
- **Does:** Heroes are layered Forge parts: identity (build, skin, hair, eyes, cloak…), gear looks, and poses. Poses: idle (2-frame breath and blink), attack (wind-up before t=0.4), cast, hurt, guard, ko, kneel, each with presets per weapon class. The rig exports anchor points (hands, weapon tip, head, foot); the face is painted after compose. Walkers are a 16×24 rig fed by the same gear looks. NPCs reuse that rig. Humanoid foes reuse the hero rig mirrored; beasts are bespoke. Rasters are prewarmed.
- **Main pieces:** `posePreset` (`art/heroes.js` L27), `heroForge` (L99); `renderHero` (`art/hero-looks.js` L109), `heroBust`, `prewarmHero`; `walkerSheet`/`rigSheet` (`art/walkers.js` L784, L725); `npcSheet`/`mapFoeSheet`/`objectSprite` (`art/map-sprites.js` L137, L423, L2680); `renderFoe` (`art/foes.js` L4506). **Size:** ~8.6k lines. **Tangled:** deeply tied (per-character art).
- **Fingerprint:** Battle frame 64×64 (offset 16,10; ground 46.6). Walker 16×24, 3 frames × 4 rows (s/n/e/w). Body builds: human, dwarf, youth, brute.

#### Backdrops, tile atlases, icons — rendering/effects
- **Does:** Battle backdrops are drawn procedurally as parallax layers (sky, far, mid, ground) with ambient particles and dark variants. Each of 41 biomes gets a tile atlas: 16 px Forge-lit tiles with hash variants, 2-frame animation, a 4-bit edge autotile and an overhead pass, built in 6 ms time slices. Icons: d4–d20 dice with numbers (tumble, crit and fumble states), status, aspect, lock, key and gem icons, and 3×5 and 4×6 digit fonts.
- **Main pieces:** `backdropLayers`/`renderBackdrop` (`art/scenes.js` L2069, L2127); `BIOMES`, `tileAtlasAsync` (`art/tiles.js` L34, L3844); `diceIcon`, `INTENT_DIE` (`art/icons.js` L101, L99). **Size:** ~6.6k lines. **Tangled:** the scenes and biomes are deeply tied; the icons and the atlas mechanism are reusable.
- **Fingerprint:** Backdrops render at 160×96 by default. Edge bits N1 E2 S4 W8. Atlases are pinned pixel-for-pixel by `test/world-art.test.mjs`.

#### App shell, router and UI framework — menus/UI
- **Does:** `createApp` owns the game state, settings, autosave, audio and input. Screens export `mount(root,ctx,params)` and return `{unmount,onAction}`. `ctx` offers: `game`/`setGame` (autosaves), `go` (aliases; closes overlays), carry-over adopt and commit, `replaceGame` (backs up first), `toast`, `reduced()`, and `services` (the card reveal, slam and preview). `openOverlay` makes a modal dialog: the app underneath goes `inert`, keys are trapped, and focus returns on close. `animate` is a shared rAF clock.
- **Main pieces:** `DEFAULT_SETTINGS`/`createApp`/`go` (`ui/app.js` L50, L56, L124); `main.js` L21–34; `openOverlay` (`ui/lib/overlay.js` L14); `el` (`ui/lib/dom.js` L6); `animate` (`ui/lib/anim.js` L27); `installCardServices` (`ui/card.js` L557). **Size:** ~450 lines. **Tangled:** clean.
- **Fingerprint:** Screens: title, newgame, world (alias road), battle, aftermath, party, codex, settings, atlas, journal. Test hooks: `__aethTest`, `__btHooks`, `window.__world`.

#### Battle screen and event player — battles (presentation)
- **Does:** On a hero's turn it waits for `CommandInput` (or `autoCommand`); otherwise it calls `foeTurn`. `Player` plays each event (`on_<t>` handlers) and updates a display model, then re-syncs from the engine state. A `Clock` scales every wait by speed (1×, 2×, 4×); a tap or Enter skips, unmount cancels. The stage is an integer-scaled canvas (backdrop, foes, sparks, rings, flashes, relics flying off). DOM overlays show plates, intent bubbles, grip meters, numbers, an 8-portrait ribbon, and a dice tray that tumbles the d20 and shows the maths. Idle time prewarms art. If the screen hits an error, the battle resolves automatically.
- **Main pieces:** `mount` (`ui/screens/battle.js` L45), `frame` (L367), `run` (L505), `finish` (L564); `Player.play` (`ui/battle/player.js` L38); `Stage` (`stage.js` L24), `Hud` (`hud.js` L50), `CommandInput` (`menu.js` L40), `Party` (`party.js` L37), `Tray` (`tray.js` L15), `Clock` (`util.js` L81). **Size:** ~3.7k lines. **Tangled:** some untangling needed (per-boss cases).
- **Fingerprint:** Draws via rAF: every 33 ms while busy, every 110 ms when idle, or once under reduced motion. Stage scale is the largest integer that fits; default s=2 at 180×120 art px; smoothing off. Sparks: 12 per burst, 480 ms, no pool. The log keeps 240 lines.

#### World screen, view, camera and loop — rendering/camera/game loop
- **Does:** The loop is dirty-flag rAF: 12 fps when idle, full rate while anything moves. The view bakes 256 px ground and overhead chunks, y-sorts sprites (at most 40 `drawImage` calls a frame), and draws darkness or fog. Painted maps (WebP, 32 px per tile) replace the tiles at 2 canvas px per art px; at most 4 stay decoded. The camera eases inside a dead zone, clamps to the map, centres small maps, and snaps on entering a map. The party walks as a conga line. Map changes fade 200 ms each way. The Walk survives battles via `session`.
- **Main pieces:** `createLoop` (`ui/world/loop.js` L10); `scaleFor`/`createCamera` (`camera.js` L15, L27); `createView` (`view.js` L479); `PAINT_DENSITY` (`view.js` L141); `createActors` (`actors.js` L174); `mount`/`save` (`ui/screens/world.js` L138, L220). **Size:** ~4.7k lines. **Tangled:** some untangling needed (region cards, Act III flows).
- **Fingerprint:** rAF, dt clamped to 0.1 s, a 2,048-entry frame-time ring buffer. Scale = `clamp(round(cssW·dpr/(target·zoom)),2,8)`, target 192 (coarse pointer) or 288 (fine); zoom 0.83/1/1.17. Camera dead zone 16×12 art px; smoothing `1−e^(−12dt)`; whole-pixel positions. Idle tick 400 ms.

#### Dialogue box, item card, settings UI — UI
- **Does:** **Dialogue:** typewriter at 45 characters per second with a "blip" voice per speaker; choices are 44 px buttons with odds chips such as "Influence DC 14 · 65% · Alondra"; the check roll is shown. **Item card:** `cardReveal` (a chest, a rarity beam, then a flip, chime and "Equip on…" with live try-on), `cardSlam` (the Surge, ~1.2 s), `cardPreview` (a grey card stamped HELD BY), and a Chronicle on the card's back. **Settings:** sound, music, reduced motion, battle speed, touch controls, always-run, map zoom; save codes, older-save carry-over, restore, start over.
- **Main pieces:** `ui/world/dialogue.js` (blip ~L144); `ui/card.js` (L557); `ui/screens/settings.js` `mount` (L18); `ui/lib/carry.js`, `carry-facts.js`. **Size:** ~1.3k lines. **Tangled:** clean (settings has one block per milestone).
- **Fingerprint:** Blip voices `[660,520,740,440,880,590,390,980]` Hz on every 3rd character. The reveal plays a rarity tier sound (0–7) and ducks the music from tier 4 up. Reduced motion comes from `prefers-reduced-motion` or the setting. 44 px tap targets, 16 px gutter.

#### Balance simulator — test tools
- **Does:** Plays routes of encounters over N seeds with `autoCommand`, teleporting between fights. Crossing a zone costs one patrol fight (a weak patrol runs instead). A wipe triggers a rest, one level of grinding on patrols, and (from M5) re-arming against the foe; 8 tries counts as "stuck". There are 17 modes covering M2–M7. It prints tables plus `ok`/`MISS` target checks and never exits non-zero. Options: `--jobs N`, end-state caches, `--seed`, `--trace`.
- **Main pieces:** `tools/sim.mjs`: routes (L141–313), `fight` (L295), `grind`, `patrolFight`, `rearm`, `playRoute` (L462), `targetChecks` (L804). **Size:** 873 lines. **Tangled:** deeply tied (the routes are encounter ids).
- **Fingerprint:** 200 seeds by default; the starter rotates with `seed%3`. Targets: Champions 30–40% first-try wipe; forged parties at most 20%; Tamsin duels a 55–70% party win; leads 15–25%; the Hollow Council 35–45% "wipe somewhere"; 0 stuck runs.

#### Tests and dev tools — tests/debug
- **Tests:** 31 `.test.mjs` files run by `node --test` (rules and data only). They cover: core (rng resume, dice, code round-trip); combat; battle (43 tests: determinism, dice per tier, immutability, Grip & Claim, every boss); statuses, m7-rules, toll, rivals, loot, forge, party, gauntlet; migrate (18 v1 fixtures, key discipline, the M2 spawn snapshot); world, walk (a bot plays to the end of Act I), road, maps (60 maps), data, story; UI helpers; art keys; world-art (atlases pixel-pinned); frozen (**SHA-256 of dist m2–m6 pinned**); zip. Expected numbers mostly come from `TUNING` and the data, and the balance targets live in `sim.mjs`.
- **Tools:**
  - `build.mjs`: esbuild IIFE plus CSS inlining. Size gates: the game warns at 2.5 MB and fails at 3.2 MB; paintings fail at 32 MB. It never overwrites a frozen milestone.
  - `zip.mjs`: its own zip writer on top of node zlib.
  - `dev-battle.mjs` and its entry file: a battle harness that starts any encounter from the URL hash.
  - Four `e2e-*.mjs` scripts: Playwright at phone and laptop sizes; they fail on console errors and paste in every older save code.
  - `gallery.mjs` plus 4 entry pages: art review screenshots.
  - `make-atlas.mjs`: turns Chris's map PNG into a module. `make-v1-fixtures.mjs`: regenerates the M2 save fixtures (needs an M2 source tree).
  - `map-draft.mjs`: draws a map as ASCII or PNG and lints it.
  - `map-shots`, `paint-refs`, `paint-prompts`, `paint-import`, `paint-sheet`: the painted-map pipeline (rows stamped with `rowsSha`).

#### Misc utilities
- `deepFreeze` (`core/freeze.js` L2) freezes every data table.
- `addCounts`, `indexItems` and `holdPhrase` live in `rules/util.js`.
- `tierAs`/`tierRow` (`data/foes.js` L39–40) let a new tier read an older tier's table rows.
- `withKit` (`data/rivals.js` L77) merges a rival's kit.

### Content
| What | Where | ~lines |
|---|---|---|
| Balance knobs for attacks, the ribbon, Surge, grip, foe scaling, the Waking, rest, wipes, XP, gold, drops, flee, the world, temper, forge, the Unsmith and the Masterpiece | `data/tuning.js` | 138 |
| 22 statuses, 8 aspects plus the armour chart, 8 rarities, 6 Omens | `data/statuses.js, aspects.js, rarity.js, omens.js` | 323 |
| 4 heroes and 3 starter relics; 21 skills, 41 item bases, 4 consumables, 33 affixes, 6 gems plus 3 materials, 9 Domains, 11 deeds, 5 Codex pages | `data/heroes.js, skills.js, items.js, affixes.js, gems.js, domains.js, deeds.js, codex.js` | 520 |
| 57 foe families (18 rabble, 18 veteran, 8 relic-bearer, 8 champion, 4 hollow, 1 Unsmith), each with moves, die tables, phases and gear tiers | `data/foes.js` | 1,412 |
| 75 relics (stats, granted Arts, Surge power, map power, deeds, sockets, two Awakened branches); 1 set; 9 storied powers | `data/relics.js` | 1,408 |
| 138 encounters, 26 patrol sets, 8 Brands, 45 backdrop ids | `data/encounters.js` | 845 |
| 60 maps (12–74 × 8–70 tiles) in 5 regions; 28 tile types, 23 lock types, 35 Hearthfires, 24 zones, critical paths | `data/maps/*, tiles.js, locks.js, world.js` | 4,872 |
| 449 dialogue nodes (plus arrivals, after-fight and rest scenes), 52 NPCs, 23 quests and 18 bounties, 48 Ladder posters, 9 letters, 8 shops, 3 endings, Tamsin's kits, name lists | `data/dialogue.js, npcs.js, quests.js, ladder.js, letters.js, shops.js, endings.js, rivals.js, names.js` | 3,288 |
| 12 music tracks written as note strings | `core/audio.js` L35–180 | ~145 |
| Art recipes: items, relic art, foe sprites, backdrops, 41 biome looks, NPC and object sprites | `art/recipes.js, item-looks.js, foes.js, scenes.js, tiles.js, map-sprites.js` | ~16,100 |
| Painted maps (one per map), 4 cut-scene stills, the illustrated Atlas | `ui/assets/**` | 316 (≈29 MB real) |

### Presentation
| What | Where | ~lines |
|---|---|---|
| Theme tokens (soot, iron and parchment palette, hearth orange, rarity colours), the pixelated `.px` canvas class, 44 px taps; one dark theme only | `ui/theme.css` | 54 |
| Screen, battle, world, card and forge CSS | `ui/screens.css, battle.css, world.css, card.css, forge.css` | 2,280 |
| Fonts: Alegreya Sans (body), Cormorant Garamond (display), Silkscreen (pixel), from Google Fonts | `index.html` L2–4 | 3 |
| Battle HUD: plates, intent bubbles, ribbon, hero cards with the Surge gauge, dice tray, banners, screen shake, log | `ui/battle/*` | 3,086 |
| World HUD (a Hearth Clock of 8 Brand coals, a bust strip, a save ember, a side panel), sheets (prefight, lock, hearth, pause, shop, forge), story cards | `ui/world/hud.js, sheets.js, story-fx.js` | 1,720 |
| Screens: title, new game (4d6-drop-lowest roll or a standard array, starter choice), aftermath, party, Codex binder, journal, Atlas (illustrated map with fast travel) | `ui/screens/*` | 2,723 |

### Shared-code clues
- **Moonlight in the Aether (`20-min`) vendors this code.** `vendor/aethermoor/README.md` on branch `origin/ccr-5afa0fa7-7ojc16` says: "`src/core`, `src/data` and `src/rules` are copied from the New-game repo, branch `claude/cool-ptolemy-uc93gg`, folder `game/src/` (Aethermoor, Milestone 7), with five of its test files". `src/battle/engine.js:1` reads "// The bridge to Aethermoor's battle rules (vendor/aethermoor)." It imports `createBattle, current, commands, targets, act, foeTurn, outcome, inspect, timeline` and `buildFoe`. Where the pieces Moonlight names live here:
  - turn ribbon: `battle.js` `timeline`/`unitDelay`
  - intent dice: `ai.js` `rollIntent`
  - d20 with grazes: `combat.js` `rollAttack` L357
  - statuses: `data/statuses.js`
  - Grip & Claim: `combat.js` `applyGrip`/`disarm` and `loot.js` `battleLoot`
  - loot: `rules/loot.js`
- **Thareia** (branch `origin/claude/tender-babbage-4wiplk`, `thareia/game/`): its `ARCHITECTURE.md` line 1 is identical ("# Aethermoor: Hearth & Heirloom — Architecture"). Its `src/core/rng.js` line 1 is also identical ("// Seeded, serializable RNG (mulberry32). Rules code must use this, never Math.random.").
- **Loot Forge prototype** (`New-game/prototypes/item-card.html`):
  - `art/forge.js:1`, `recipes.js:1` and `item-art.js:1`: "Ported from prototypes/item-card.html (the approved Loot Forge art pipeline)".
  - `art/heroes.js:1` and `ui/theme.css:1` cite the same prototype.
  - `core/audio.js:230`: "synth primitives (ported from the Loot Forge prototype)". The same comment appears in Moonlight's stripped `src/audio/synth.js:258`.
- **Chris's D&D originals** at the `New-game` root:
  - `ui/assets/atlas-image.js:2`: "Source: aethermoor-interactive-image-map-polished.html".
  - `data/domains.js:1`: "The nine Accretion Domains from the user's character sheet (aethermoor-character-sheet-4.html)".
  - `rules/util.js:9`: "the character sheet's Imprint Bonus".
- **mulberry32** also appears in `envoi` (`src/battle/engine.js:20`) with different comment wording. It is a generic algorithm, so this alone does not show copying.
- **Strings to grep for in other games:** `aethermoor.save.*`, `AETH<n>.`, event types `intent/roll/grip/disarm/legend`, `TUNING.ribbon`, `RARITY_ORDER` worn…primal.

### Notes
- **Reuse:** the rules layer is pure, deterministic, event-emitting and data-driven, which makes it the most reusable code inventoried here. It already runs in 20-min and has a fork (Thareia).
- **Content leaking into the rules:**
  - Documented status flags that are never read (see Status effects).
  - Hard-coded ids: `unfair-toll` and `iron-stance` (battle.js), regions and story flags (gauntlet.js), `hollow-gretch` (forge.js), skill ids (autoplay.js).
  - Tier tables that list only 4 tiers and rely on the `tierRow` fallback: `TIER_DC` (combat.js L17), `TIER_RANK` (gauntlet.js L37), `LEVEL` (world.js L95).
- **Duplicated code:**
  - the keymap (`core/input.js` and `ui/lib/keys.js`)
  - `afterBattle` (`rules/world.js` L405 and `ui/world/session.js` L24)
  - `healAll` (`gauntlet.js` L125 and `story.js` L151)
  - `wearerOf` (`party.js` L20 and `forge.js` L58)
  - two different `el()` helpers
- **Save handling** is versioned, migrated and fixture-tested. It never writes an older milestone's keys, keeps a backup slot, validates imports and scrubs markup. Only the `game.settings` field is vestigial.
- **File size:** 31.8 MB because every map has a full painting. `build.mjs` notes the 16 MB cap on a claude.ai page, and `zip.mjs` exists for the 30 MiB chat limit.
- **Older builds in `game/dist`:** m2 866,653 B, m3 1,403,500 B, m4 1,817,153 B, m4.5 1,820,959 B, m5 8,288,674 B, m6 31,297,950 B. m7 is the same file as `aethermoor.html` (31,841,097 B). There is also an `.artifact.html` copy. m2–m6 are SHA-pinned.
- **Unseeded randomness in the UI:** ability rolls (`newgame.js` L186), the new-game seed (L280), and the cosmetic identify roll.
- **Missing:** gamepad support, Mooncart SELECT (H), and a volume control.
- **Doc drift:** ARCHITECTURE.md lists a "tiny event emitter" in `core/`, but there is none.
