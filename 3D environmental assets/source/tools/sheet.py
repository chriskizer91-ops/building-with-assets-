# one page load, a Look screenshot of every model (near, or far with 'far'), then a contact sheet
import os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent  # the source folder
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')  # a Chrome or Edge to drive
os.makedirs(ROOT / 'shots', exist_ok=True)
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
lod = sys.argv[1] if len(sys.argv) > 1 else 'near'; only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
url = pathlib.Path(str(ROOT) + '/out/pieces.html').as_uri() + f'?shot=1&mode=look&lod={lod}'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 900, 'height': 700}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto(url); await pg.wait_for_function('window.__ready === true', timeout=120000)
        ids = await pg.evaluate('Object.keys(window.__api.MODELS)'); ids = [i for i in ids if not only or i in only]; shots = []
        for i in ids:
            await pg.evaluate(f'window.__api.setAsset("{i}")'); await pg.wait_for_timeout(900)
            f = f'{ROOT}/shots/look_{lod}_{i}.png'; await pg.screenshot(path=f); shots.append((i, f))
        for e in errs[:5]: print('ERR', e[:300])
        await b.close()
    cols = 5 if len(shots) > 4 else len(shots); rows = (len(shots) + cols - 1) // cols; W, H = 450, 350
    sheet = Image.new('RGB', (cols * W, rows * H), 'white')
    for k, (i, f) in enumerate(shots):
        im = Image.open(f).convert('RGB').resize((W, H)); sheet.paste(im, ((k % cols) * W, (k // cols) * H))
    sheet.save(f'{ROOT}/shots/sheet_{lod}.png'); print('ok', len(shots))
asyncio.run(main())
