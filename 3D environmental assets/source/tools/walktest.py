# walks into the sample's cottonwood and through a sagebrush, prints the numbers, shoots both
import os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent  # the source folder
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')  # a Chrome or Edge to drive
os.makedirs(ROOT / 'shots', exist_ok=True)
import asyncio, pathlib, json
from playwright.async_api import async_playwright
url = pathlib.Path(str(ROOT) + '/out/pieces.html').as_uri() + '?shot=1&mode=walk'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = await ctx.new_page()
        await pg.goto(url); await pg.wait_for_function('window.__ready === true', timeout=120000)
        for name, target, start, yaw in [('tree', 'tree_cottonwood', 3.2, 0), ('bush', 'bush_sage', -2.2, 3.1416)]:
            info = await pg.evaluate(f'''(() => {{ const A = window.__api, t = A.placed().find(p => p.id === "{target}"), C = A.MODELS[t.id].meta.collider;
              A.walk.x = t.x; A.walk.z = t.z + {start}; A.walk.yaw = {yaw}; A.walk.pitch = 0; A.walk.keys.KeyW = true;
              return {{ x: t.x, z: t.z, scale: t.s, solidRadius: C ? C.r * t.s : 0 }}; }})()''')
            await pg.evaluate(f'(() => {{ for (let i = 0; i < {230 if name == "tree" else 150}; i++) window.__api.stepWalk(1 / 60); }})()')
            pos = await pg.evaluate('(() => { const w = window.__api.walk; w.keys.KeyW = ("' + name + '" === "tree"); return { x: w.x, z: w.z }; })()')
            d = ((pos['x'] - info['x']) ** 2 + (pos['z'] - info['z']) ** 2) ** .5
            print(json.dumps({ 'walked_into': target, 'object_at': [round(info['x'], 2), round(info['z'], 2)], 'started_m_away': start, 'solid_radius_m': round(info['solidRadius'], 2),
                'ended_at': [round(pos['x'], 2), round(pos['z'], 2)], 'ended_m_from_centre': round(d, 2), 'went_past': (pos['z'] < info['z']) if start > 0 else (pos['z'] > info['z']) }))
            await pg.wait_for_timeout(150); await pg.screenshot(path=f'{ROOT}/shots/walk_{name}.png')
        await b.close()
asyncio.run(main())
