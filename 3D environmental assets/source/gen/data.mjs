import fs from 'fs'; import path from 'path';
const OUT = process.argv[2] || 'out', man = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'))), files = {};
for (const a of man.assets) for (const k of ['near', 'far']) files[a.files[k]] = fs.readFileSync(path.join(OUT, a.files[k])).toString('base64');
fs.writeFileSync('viewer/src/data.js', 'export default ' + JSON.stringify({ manifest: man, files }) + ';\n');
