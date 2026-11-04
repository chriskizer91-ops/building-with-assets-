# usage: fshot.py out.png "query" [phone|laptop] [js] [wait_ms]
import os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent  # the source folder
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')  # a Chrome or Edge to drive
os.makedirs(ROOT / 'shots', exist_ok=True)
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
out, q = sys.argv[1], sys.argv[2]; dev = sys.argv[3] if len(sys.argv) > 3 else 'laptop'; js = sys.argv[4] if len(sys.argv) > 4 else ''; wait = int(sys.argv[5]) if len(sys.argv) > 5 else 2500
url = pathlib.Path(str(ROOT) + '/out/forest.html').as_uri() + '?shot=1&' + q
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        if dev == 'phone': ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        else: ctx = await b.new_context(viewport={'width': 1366, 'height': 768})
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto(url); await pg.wait_for_function('window.__ready === true', timeout=180000)
        if js: r = await pg.evaluate(js); print('JS:', r)
        await pg.wait_for_timeout(wait)
        await pg.screenshot(path=out, timeout=180000)
        print('STATS:', await pg.evaluate("document.getElementById('stats').innerText.replace(/\\n/g,' | ')"))
        for e in errs[:8]: print('ERR:', e[:300])
        await b.close()
asyncio.run(main())
