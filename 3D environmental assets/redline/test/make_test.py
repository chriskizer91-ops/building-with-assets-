# Builds a TEST COPY of Redline County: Wide Open 2: Road Not Found + Traffic with Field & Forest's add-on in it.
# It reads the game's own files and writes a new page; it never changes the game.
#   python3 make_test.py <the game's rlcwo2rnf-traffic folder> <the 3D environmental assets folder> [out.html]
# e.g. python3 make_test.py ~/cargames/rlcwo2rnf-traffic "../.." rlc_ff_test.html
# The page has the game's modules in the game's order (from its build.sh), then ff_redline.js, the pack's .glb
# files (as text), and ff_test.js (the scenes the screenshots were taken with). Shoot it with shot_ff.js.
import json, base64, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
G, PACK = sys.argv[1], sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'rlc_ff_test.html')
man = json.load(open(os.path.join(PACK, 'manifest.json')))
rd = lambda p: base64.b64encode(open(os.path.join(PACK, p), 'rb').read()).decode()
data = [{'id': a['id'], 'group': a['group'], 'collider': a['collider'], 'near': rd(a['files']['near']), 'far': rd(a['files']['far'])} for a in man['assets']]
b = open(os.path.join(G, 'build.sh')).read()
mods = []
for k in ['CARS', 'DRIVE', 'WORLD', 'GAME']: mods += re.search(k + r'="([^"]+)"', b).group(1).split()
head = open(os.path.join(G, 'shell/game.head.html')).read(); fonts = open(os.path.join(G, 'shell/fonts.html')).read()
head = '\n'.join(fonts if l == '<!--FONTS-->' else l for l in head.split('\n'))
body = ''.join(open(os.path.join(G, 'src', m + '.js')).read() for m in mods)
body += open(os.path.join(HERE, '..', 'ff_redline.js')).read()
body += 'const FF_GLB=' + json.dumps(data) + ';\n' + open(os.path.join(HERE, 'ff_test.js')).read()
open(OUT, 'w').write(head + body + open(os.path.join(G, 'shell/game.tail.html')).read())
print(OUT, os.path.getsize(OUT), 'bytes,', len(mods), 'game modules + the add-on')
