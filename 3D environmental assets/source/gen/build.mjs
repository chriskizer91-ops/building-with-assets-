import fs from 'fs';
import path from 'path';
import { glb } from './lib.mjs';
import { ASSETS } from './assets.mjs';
const OUT = process.argv[2] || 'out';
const dirOf = { Grass: 'grass', Bushes: 'bushes', Trees: 'trees', Props: 'props' };
const r3 = v => Math.round(v * 1000) / 1000;
const manifest = { pack: 'Field & Forest environment pack', units: 'metres', up: '+y', front: '+z', ground: 'y = 0 at the model’s origin', assets: [] };
for (const A of ASSETS) {
  const t0 = Date.now(), out = A.fn(), d = path.join(OUT, 'models', dirOf[A.group]); fs.mkdirSync(d, { recursive: true });
  const stat = parts => { let tris = 0, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], bad = 0;
    for (const p of parts) { tris += p.mb.tris; const b = p.mb.bounds(); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], b.mn[k]); mx[k] = Math.max(mx[k], b.mx[k]); } for (const v of p.mb.P) if (!Number.isFinite(v)) bad++; }
    return { tris, draws: new Set(parts.filter(p => p.mb.tris).map(p => p.mat.name)).size, size: [r3(mx[0] - mn[0]), r3(mx[1]), r3(mx[2] - mn[2])], bad }; };
  const sn = stat(out.near), sf = stat(out.far);
  if (sn.bad || sf.bad) throw new Error(A.id + ' has NaN vertices');
  const solid = !!out.collider;
  const meta = { id: A.id, name: A.name, group: A.group, solid, collider: out.collider || null, where: A.where };
  const fN = `${A.id}.glb`, fF = `${A.id}_far.glb`;
  fs.writeFileSync(path.join(d, fN), glb(A.id, out.near, { asset: { ...meta, lod: 'near', tris: sn.tris } }));
  fs.writeFileSync(path.join(d, fF), glb(A.id + '_far', out.far, { asset: { ...meta, lod: 'far', tris: sf.tris } }));
  const kb = f => Math.round(fs.statSync(path.join(d, f)).size / 102.4) / 10;
  manifest.assets.push({ ...meta, files: { near: `models/${dirOf[A.group]}/${fN}`, far: `models/${dirOf[A.group]}/${fF}` }, size_m: sn.size,
    tris: { near: sn.tris, far: sf.tris }, draws: { near: sn.draws, far: sf.draws }, kb: { near: kb(fN), far: kb(fF) },
    materials: [...new Set(out.near.map(p => p.mat.name))] });
  console.log(`${A.id.padEnd(18)} near ${String(sn.tris).padStart(6)} tris ${sn.draws} draws  far ${String(sf.tris).padStart(5)}  size ${sn.size.join(' x ')} m  ${kb(fN)} KB  ${Date.now() - t0} ms`);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
