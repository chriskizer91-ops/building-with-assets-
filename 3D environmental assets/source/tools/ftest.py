import os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent  # the source folder
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')  # a Chrome or Edge to drive
os.makedirs(ROOT / 'shots', exist_ok=True)
import asyncio, pathlib, json
from playwright.async_api import async_playwright
url = pathlib.Path(str(ROOT) + '/out/forest.html').as_uri() + '?shot=1&fresh=1'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(url); await pg.wait_for_function('window.__ready === true', timeout=180000)
        r = await pg.evaluate('''(() => { const A = window.__api, live = () => A.O.filter(o => !o.dead).length, out = {};
          out.sample = live();
          // clear, then paint a stroke of Mixed woods 60 ft long with a 40 ft brush
          A.applyLayout(JSON.stringify({ ids: [], objects: [] })); out.afterClear = live();
          A.S.sel = 'mix:woods'; A.S.tool = 'paint'; A.S.brush = 20; A.S.density = 1;
          A.begin([0, 0]); for (let x = 2.7; x <= 18.3; x += 2.7) A.dab(x, 0); A.end();
          const kinds = {}; for (const o of A.O) if (!o.dead) { const k = A.AS[o.a].id; kinds[k] = (kinds[k] || 0) + 1; }
          out.painted = live(); out.paintedKinds = kinds;
          // the same stroke at Thick
          A.S.density = 2; A.begin([0, 30]); for (let x = 2.7; x <= 18.3; x += 2.7) A.dab(x, 30); A.end(); out.thickAdded = live() - out.painted;
          // erase a 40 ft circle in the middle of the first stroke
          A.S.tool = 'erase'; const before = live(); A.begin([9, 0]); A.end(); out.erased = before - live();
          A.undo(); out.afterUndo = live();
          // size: one spruce at 50% and one at 150% (vary off)
          A.S.vary = false; A.S.sel = 'tree_spruce'; A.S.size = .5; const sp = A.spec(); const o1 = []; A.S.size = 1.5;
          return out; })()''')
        print(json.dumps(r, indent=1))
        # walk into a tree: find the nearest spruce to a clear spot and walk straight at it
        w = await pg.evaluate('''(() => { const A = window.__api; A.setMode('walk'); const t = A.O.find(o => !o.dead && A.AS[o.a].kind === 'tree');
          const C = A.AS[t.a].meta.collider; A.walk.x = t.x; A.walk.z = t.z + 4; A.walk.yaw = 0; A.walk.keys.KeyW = true;
          for (let i = 0; i < 240; i++) A.stepWalk(1 / 60); A.walk.keys.KeyW = false;
          return { tree: A.AS[t.a].meta.name, scale: +t.s.toFixed(2), solid_r_m: +(C.r * t.s).toFixed(2), stopped_m_from_centre: +Math.hypot(A.walk.x - t.x, A.walk.z - t.z).toFixed(2), walked_past: A.walk.z < t.z }; })()''')
        print('walk into tree:', json.dumps(w))
        # stress: the sample forest, then Fill all with Mixed woods at Thick on top; count what's in the fog circle at 20 spots
        s = await pg.evaluate('''(() => { const A = window.__api; A.setMode('build'); A.applyLayout(JSON.stringify({ ids: [], objects: [] })); A.sampleForest();
          A.S.sel = 'mix:woods'; A.S.density = 2; const add = []; A.scatter(A.spec(), 146.3 * 146.3, () => [(Math.random() * 2 - 1) * 73, (Math.random() * 2 - 1) * 73], add, 2);
          const O = A.O.filter(o => !o.dead); let trees = 0, grass = 0; for (const o of O) { const k = A.AS[o.a].kind; if (k === 'tree') trees++; if (k === 'grass') grass++; }
          A.setMode('walk'); const res = [];
          for (let i = 0; i < 20; i++) { A.walk.x = -60 + (i % 5) * 30; A.walk.z = -60 + Math.floor(i / 5) * 40; A.stepWalk(0); A.rebuild(); res.push([A.drawn.obj, A.drawn.tris, A.drawn.draws]); }
          const avg = k => Math.round(res.reduce((s, r) => s + r[k], 0) / res.length), mx = k => Math.max(...res.map(r => r[k]));
          return { objects: O.length, trees, grass, layoutKB: Math.round(A.layoutJSON().length / 1024), inFog_avg: { objects: avg(0), tris: avg(1), draws: avg(2) }, inFog_max: { objects: mx(0), tris: mx(1), draws: mx(2) } }; })()''')
        print('stress:', json.dumps(s))
        for e in errs[:5]: print('ERR', e)
        await b.close()
asyncio.run(main())
