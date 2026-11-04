# Field & Forest

A shared library of environment models for all your games, kept here in building-with-assets in its own folder
(Mooncart's build doesn't look in it, so nothing here changes the app): 19 models (3 grasses, 3 bushes, 8 trees, 5
props) made in one style, one size system and one file format, so any game can use the same pile. They were first made
to match Redline County (its colours, its units, its way of drawing trees), so they fit there, and they work just as
well anywhere else: the woods game, or anything built in three.js or a standard game engine.

Two pages to try them out, both working on the laptop (Edge or Chrome) and the phone:

## pieces.html: each model, and a 60 × 60 ft plot

- **Look**: one model at a time, with a 5′10″ figure for scale. Drag to turn round it; pinch or scroll to zoom.
- **Plot**: a 60 × 60 ft square (18.3 m). Pick a model and tap the ground to place it. **Undo** takes back the last
  tap. Under **•••**: the Country sample or the Woods sample, near or far versions, each tree's solid part, the 10 ft
  grid, the ground (grass, dirt, forest floor or sidewalk), scatter 10, or clear.
- **Walk**: walk round the plot (left thumb on the phone; W A S D on the laptop, Shift to jog; drag to look). Trees stop
  you; everything else lets you through, and the top of the screen says which happened.
- **Size**: at the top of the model list. The slider sets the size of what you place next (40% to 160%); **Vary
  sizes** (on to start) lets each one come out a little bigger or smaller, so no two match. The readout gives the
  height ("70% · 32 ft tall"). Props stay their real size.

## forest.html: the Forest Builder, a 480 × 480 ft field

- **Building** (the map): the field starts with a sample forest (mixed woods, an aspen grove, pine and spruce, a creek
  with willows and reeds, a clearing and a path).
  - **Paint ▾** picks the tool: **Place** (tap to put down one), **Paint** (drag to scatter; the brush keeps trees a
    sensible distance apart and keeps grass off trunks) or **Erase** (drag to clear everything under the brush), with the
    brush size (10 to 160 ft across) and the density (Sparse, Normal, Thick).
  - The model button picks what to paint: one model, or a **mix** (Mixed woods, Pine & spruce, Aspen grove, Creek side,
    Dry country, Meadow), with the same size slider as the pieces page.
  - **↶** undoes the last stroke. One finger paints; two fingers (or the right mouse button) move the map; pinch or
    scroll to zoom. With the Place tool, one finger turns the view.
  - The white circle in the middle of the view is how far you'll see when you walk.
- **Walk**: drops you where the middle of the map was, inside a **circle of fog with a 40 ft radius** (fully
  thick at 40 ft). Only what's inside the circle is drawn: everything in full detail, grass in its simpler version past
  about 24 ft. Trees stop you.
- **•••**: the fog distance (20 to 160 ft), the trees' solid parts, the grid and the circle, the ground (forest floor,
  grass or dirt), and the layout: **Sample forest**, **Fill all** (scatter the current pick over the whole field),
  **Copy layout**, **Load layout** and **Clear** (undo brings it back).
- The page keeps your forest in the browser and brings it back next time. **Copy layout** gives the forest as text
  (below) for a game to read.

## The models

| Model | Group | Walking into it | Size | Triangles near / far | Where it goes |
| --- | --- | --- | --- | --- | --- |
| Meadow Tuft | Grass | passes through | 11 in tall, 24 in wide | 280 / 36 | Lawns, parks, yards, meadows and the floor of open woods; scatter thick. |
| Dry Prairie Grass | Grass | passes through | 3 ft tall, 4 ft wide | 462 / 84 | Road shoulders, fence lines, dry country and the sunny edges of woods. |
| Creek Reeds | Grass | passes through | 5 ft tall, 7 ft wide | 423 / 98 | Creek banks, ponds, standing water and roadside ditches. |
| Sagebrush | Bushes | passes through | 3 ft tall, 6 ft wide | 2,583 / 240 | Anywhere dry: open country, hills, empty lots, the edge of a salt flat. |
| Oleander | Bushes | passes through | 7 ft tall, 6 ft wide | 2,825 / 320 | Town landscaping: in front of houses, along a boulevard, round a diner or a gas station. |
| Prickly Pear | Bushes | passes through | 3 ft tall, 3 ft wide | 3,934 / 480 | Rocky ground, roadside desert, dry yards, the sunny side of a ranch. |
| Cottonwood | Trees | **solid** | 40 ft tall, 50 ft wide | 6,269 / 132 | Along creeks, round farms (windbreaks, shade by the house), parks. |
| Ponderosa Pine | Trees | **solid** | 57 ft tall, 30 ft wide | 6,906 / 76 | Hills and higher ground in loose stands; open pine woods. |
| Mesquite | Trees | **solid** | 17 ft tall, 32 ft wide | 5,194 / 150 | Dry country and pasture, alone or in twos; shade beside a dirt road. |
| Dead Snag | Trees | **solid** | 24 ft tall, 14 ft wide | 1,723 / 144 | One at a time: an old pasture, a burn, deep woods, beside a dirt track. |
| Bur Oak | Trees | **solid** | 34 ft tall, 55 ft wide | 5,442 / 196 | Open woods and pasture edges; one big one alone in a clearing. |
| Quaking Aspen | Trees | **solid** | 45 ft tall, 14 ft wide | 4,574 / 80 | Groves of a dozen or more, close together, on hillsides and at the edges of conifer woods. |
| Spruce | Trees | **solid** | 52 ft tall, 27 ft wide | 4,303 / 106 | Thick conifer woods and north slopes; close enough together to wall in a path. |
| Weeping Willow | Trees | **solid** | 31 ft tall, 47 ft wide | 7,511 / 112 | Beside creeks and ponds and on wet ground; one beside a farmhouse. |
| Fire Hydrant | Props | passes through | 3 ft tall, 17 in wide | 2,188 / 144 | Town sidewalks, about one a block, at the kerb near corners. |
| Ice Chest | Props | passes through | 4 ft tall, 5 ft wide | 480 / 36 | Against the wall of a gas station or corner store; one a store. |
| Tire Stack | Props | passes through | 3 ft tall, 4 ft wide | 3,360 / 500 | A garage, behind a gas station, a farm yard, a race paddock. |
| Oil Drum | Props | passes through | 3 ft tall, 23 in wide | 3,040 / 100 | Anywhere work happens: a garage, farm yards, a paddock, a lone one out in a field or the woods. |
| Rural Mailbox | Props | passes through | 4 ft tall, 22 in wide | 260 / 56 | At the end of a farm or cabin drive on a country road. |

All 19 near versions together are 61,757 triangles; the far versions 3,090.

## The files

| File | What it is |
| --- | --- |
| `models/<group>/<name>.glb` | The model, for close up. |
| `models/<group>/<name>_far.glb` | The same model as a cheap stand-in for a distance. |
| `manifest.json` | Every model: its name, group, size, triangles, draws, file sizes, whether it's solid, its solid part, its materials and where it goes. |
| `pieces.html`, `forest.html` | The two pages. Each carries its own copy of every model, so it works on its own. |
| `docs/` | Pictures: every model near and far, the two samples, the sizes, the Forest Builder, the walking tests, and the models in Redline County. |
| `redline/` | The add-on that puts these models into Redline County (below), and the scripts the in-game test was run with. |
| `source/` | The code that makes the models and the pages. In `source/`: `npm install` once, then `sh build.sh` remakes every model and both pages into `source/out/` (the ones at the top of this folder are copies of those). `tools/` holds the checks: the glTF Validator, the walking test, the pictures. |

## How they're made, so they work together

- **One size system**: metres, y up, the ground at y = 0 under the model's centre, the front facing +z. A model at
  scale 1 is its real size.
- **One look**: colours on the corners of the triangles (no pictures to load), with the shade in the dark parts (the
  bottom of a bush, the inside of a crown) built into the colours. No see-through leaf pictures: phones are slow at
  those, so this keeps them cheap.
- **Leaves and grass are two-sided** and should be lit the same on both faces. three.js darkens the back of a
  two-sided face; the pages turn that off (below). Other engines may show some leaf backs darker.
- **Materials** are named `grass`, `foliage`, `bark`, `wood`, `cactus`, `paint`, `metal` and `rubber`. Each carries
  `gameMat` in its extras (LEAF, WOOD, METAL or COL), the closest slot in Redline County's material list.
- **One or two pieces each**: one piece per material, so a whole field of one model is one or two instanced draws.
- **Near and far versions**: every model has both, for drawing in full close up and cheaply further off.

## Solid or not

Only the trees are solid. Each tree's solid part is an upright cylinder round the base of the trunk, scaled with the
tree. It's in the tree's .glb (the node's extras, `asset.collider`: `r` the radius and `h` the height, metres) and in
`manifest.json`:

| Tree | Radius | Height |
| --- | --- | --- |
| Cottonwood | 0.52 m | 4.2 m |
| Ponderosa Pine | 0.45 m | 5 m |
| Mesquite | 0.42 m | 2 m |
| Dead Snag | 0.42 m | 4 m |
| Bur Oak | 0.62 m | 2.8 m |
| Quaking Aspen | 0.22 m | 4 m |
| Spruce | 0.45 m | 3 m |
| Weeping Willow | 0.55 m | 3.3 m |

Everything else has `solid: false` and no collider: you pass through it.

## Using them in a game (three.js)

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const gltf = await new GLTFLoader().loadAsync('models/trees/tree_spruce.glb');
const info = gltf.scene.children[0].userData.asset;   // name, group, solid, collider { r, h }, tris
const pieces = []; gltf.scene.traverse(o => o.isMesh && pieces.push(o));

// many spruces: one InstancedMesh per piece (bark, needles), all sharing one list of places
const N = 500, places = new THREE.InstancedBufferAttribute(new Float32Array(N * 16), 16);
const meshes = pieces.map(p => { const m = new THREE.InstancedMesh(p.geometry, p.material, N); m.instanceMatrix = places; scene.add(m); return m; });
// for each tree: matrix.compose(position, rotation about y, scale) then matrix.toArray(places.array, i * 16)

// leaves lit the same on both faces, as in the pages
for (const p of pieces) if (p.material.side === THREE.DoubleSide) p.material.onBeforeCompile = s => {
  s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>',
    THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0')); };

// solid: stop the player at info.collider.r * scale + the player's own radius from the trunk's centre
```

For the trick the Forest Builder uses (draw only what's inside the fog), see `source/viewer/src/forest.js`, the
`rebuild` function: each time the walker moves half a metre it refills each model's list of places with only the ones
inside the circle.

### A layout from the Forest Builder

**Copy layout** gives text like this, for a game to read and place the same forest:

```json
{ "app": "Field & Forest", "v": 1, "area_ft": 480, "units": "m",
  "origin": "the centre of the square, y up, x east, z south",
  "ids": ["grass_meadow", "grass_dry", "…"],
  "objects": [[12, 14.31, -6.02, 2.11, 0.94], …] }
```

Each object is `[which model (its place in ids), x, z, turn about y (radians), scale]`.

## In Redline County (Wide Open 2: Road Not Found + Traffic)

These were tested inside the game itself, not only in the two pages above. A test copy of the game's page (made by
`redline/test/make_test.py`; the game's own files are only read) had one add-on in it, `redline/ff_redline.js`, which
reads these same .glb files into the game's own tree system. The game then draws them its own way: instanced, near
and far versions, in its sunlight, shadows, fog and reflections, and the trees sway in its wind. The pictures were
taken with the game's own screenshot tool (`redline/test/shot_ff.js` is a copy of it).

- **Drawn by the game** (`docs/game_salt_flats.jpg`, `docs/game_ridge_road.jpg`): all 19 models beside Highway 40 on
  the salt flats (Medium graphics) and beside Ridge Road (Low graphics), with no errors from the page.
- **Solid in the game's own physics**: driving straight at a spruce 25 m ahead, the car stopped 22.3 m along, at
  0 km/h. At a sagebrush in the same place it drove on through: 50.5 m along, still doing 45 km/h.
- **What it costs**: 92 objects planted along Ridge Road added 89,000 triangles to the view (130,000 to 220,000).
- **The game's own woods drawn with these trees** (`docs/game_hills_swap.jpg`): in the hills, the game's trees are a
  few hundred triangles each and these are several thousand close up, so the view went from 155,000 triangles to
  587,000 at the game's own switch to the far version (95 m). With the full version only within 30 m it's 244,000
  (the game's own trees at 30 m: 149,000). A few by the road cost little; a whole county of them costs more, and
  30 m is the setting that keeps it slim.

### How the game takes them (for whoever adds them)

1. Add `redline/ff_redline.js` to the game's build, after `51_world` (it uses the game's `TREES`, `TLIST`,
   `makeMesh`, `chunkAt`, `WW` and `WORLD`).
2. Once the world is made: `FF.install(list)`, where each entry is `{ id, group, collider, near, far }` from
   `manifest.json`, with `near` and `far` the .glb files (an ArrayBuffer, or the file as base64 text). Each model
   becomes one mesh per version: the game keeps the material on each vertex, so bark and leaves are one draw.
3. To put one down: `FF.plant(id, x, z, turn, size)`. A tree also gets its solid circle, the way the game's own trees do.
   This puts it into the piece of world that's already made, so when the game lets that piece go and makes it again
   it's gone: to keep them for good, add them in the world generator (`50_worldgen`, `addTree`) the same way, with
   the shape number `FF.SHAPE[id]` and, for a tree, the collider `{ t: 'c', x, z, r: collider.r * size, top: y + collider.h * size }`.
4. Or `FF.swap({ 0: 'tree_cottonwood', 1: 'tree_oak', 2: 'tree_aspen', 3: 'tree_ponderosa', 4: 'tree_spruce' })` to
   draw the game's own trees with these (0 to 2 are its broadleaf trees, 3 and 4 its pines).

Materials in the game: the trees' leaves are the game's leaves (48) and their bark its wood (46), as its own trees,
so they sway, the leaves let light through, and a crown thins out within 8 m of the camera so it never hides the car.
Grass, bushes and props are its plain colour (0) and the mailbox's metal its metal (16): the leaf material would fade
them out round the car. The colours are the models' own; the game's per-tree tint isn't applied to them.

## Checked

- All 38 .glb files pass the Khronos glTF Validator with no errors and no warnings, and the pages read them with
  three.js's standard glTF loader.
- **Walking into things** (`docs/walk_test.jpg`): on the 60 ft plot, walking at the cottonwood stops 0.8 m from the
  trunk's centre (0.5 m of trunk plus 0.3 m for the walker); walking at a sagebrush goes in one side and out the other.
  In the Forest Builder, walking at an aspen stopped 0.54 m from its centre (0.24 m of trunk plus 0.3 m).
- **Painting**: one 60 ft stroke of Mixed woods with a 40 ft brush put down 11 trees and 134 grass tufts; the same
  stroke at Thick added 231 more. Erasing a 40 ft circle took out 39; Undo put all 39 back.
- **How much the fog saves**: the sample forest with Mixed woods filled over it at Thick came to 12,222 objects
  (1,215 trees, 10,995 grass tufts; 309 KB of layout text). Standing at 20 places across it, the 40 ft fog circle held
  on average 325 objects, 174,000 triangles and 20 draws; at most 354 objects, 253,000 triangles and 26 draws.
