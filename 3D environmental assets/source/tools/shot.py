# usage: shot.py out.png "query" [phone|laptop] [js-before-shot]
import os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent  # the source folder
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')  # a Chrome or Edge to drive
os.makedirs(ROOT / 'shots', exist_ok=True)
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
out, q = sys.argv[1], sys.argv[2]; dev = sys.argv[3] if len(sys.argv) > 3 else 'laptop'; js = sys.argv[4] if len(sys.argv) > 4 else ''
page_url = pathlib.Path(str(ROOT) + '/out/pieces.html').as_uri() + '?shot=1&' + q
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        if dev == 'phone': ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        else: ctx = await b.new_context(viewport={'width': 1366, 'height': 768}, device_scale_factor=1)
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(page_url); await pg.wait_for_function('window.__ready === true', timeout=120000)
        if js: await pg.evaluate(js)
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=out, timeout=120000)
        for e in errs[:8]: print('CONSOLE:', e[:300])
        await b.close()
asyncio.run(main())
