import fs from 'fs'; import path from 'path'; import validator from 'gltf-validator';
const man = JSON.parse(fs.readFileSync('out/manifest.json')); let bad = 0;
for (const a of man.assets) for (const k of ['near', 'far']) { const f = path.join('out', a.files[k]); const r = await validator.validateBytes(new Uint8Array(fs.readFileSync(f)), { uri: f });
  const i = r.issues; if (i.numErrors) bad++; console.log(`${path.basename(f).padEnd(28)} errors ${i.numErrors}  warnings ${i.numWarnings}  ${i.messages.filter(m => m.severity < 2).slice(0, 2).map(m => m.code).join(' ')}`); }
console.log(bad ? `${bad} files with errors` : `all ${man.assets.length * 2} files valid`);
