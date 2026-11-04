/* =====================================================================================
   FIELD & FOREST IN REDLINE COUNTY (Wide Open 2: Road Not Found + Traffic).
   Reads the pack's .glb files straight into the game's own tree shapes (51_world's TREES), so the game draws them
   the way it draws its own trees: instanced, a near and a far version each, in the shadows and the reflection probe,
   with the game's light, fog and TAA. Each model is ONE mesh a version: the game carries the material on each vertex,
   so a model that is two pieces in the .glb (bark and leaves) is one draw here.
   Materials, by what the game's shader does with them (13_lit):
     trees    leaves -> LEAF 48, bark -> WOOD 46: as the game's own trees. They sway in the wind, the leaves let light
              through, and a crown thins out within 8 m of the camera so it never hides the car.
     the rest grass, bushes, props -> COL 0 (metal -> METAL 16): they stay put, and stay drawn right beside the car
              (LEAF would fade them out round the car).
   Colours are the models' own (each vertex's alpha is 2, which tells the game not to tint it per tree).
   Goes in the game's one script scope after 51_world (it uses TREES, TLIST, makeMesh, chunkAt, WW, WORLD, gl).
   ===================================================================================== */
const FF=(()=>{
  const B64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;};
  /* one .glb (an ArrayBuffer) to the game's mesh arrays */
  function readGlb(buf,group){
    const dv=new DataView(buf),jl=dv.getUint32(12,true),J=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))),bo=20+jl+8;
    const acc=i=>{const a=J.accessors[i],v=J.bufferViews[a.bufferView],k={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],
      T=a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:Uint16Array,o=bo+(v.byteOffset||0)+(a.byteOffset||0);
      return new T(buf.slice(o,o+a.count*k*T.BYTES_PER_ELEMENT));};
    const tree=group==='Trees',P=[],N=[],C=[],M=[],I=[];let nv=0;
    for(const pr of J.meshes[0].primitives){
      const mn=J.materials[pr.material].name,mid=tree?(mn==='foliage'||mn==='needles'?48:mn==='bark'?46:0):(mn==='metal'?16:0);
      const p=acc(pr.attributes.POSITION),n=acc(pr.attributes.NORMAL),c=acc(pr.attributes.COLOR_0),ix=acc(pr.indices),cn=c.length/(p.length/3);
      for(let i=0;i<p.length/3;i++){P.push(p[i*3],p[i*3+1],p[i*3+2]);N.push(n[i*3],n[i*3+1],n[i*3+2]);C.push(c[i*cn],c[i*cn+1],c[i*cn+2],2);M.push(mid);}
      for(let i=0;i<ix.length;i++)I.push(ix[i]+nv);nv+=p.length/3;}
    return {pos:new Float32Array(P),nrm:new Float32Array(N),col:new Float32Array(C),mat:new Float32Array(M),idx:new Uint32Array(I)};
  }
  const mesh=d=>{const m=makeMesh(d);m.tris=d.idx.length/3;return m;};
  const SHAPE={},INFO={};
  /* the tree lists keep one buffer per shape: when shapes are added they're made again */
  function resetLists(){for(const L of TLIST.values())for(const g of L.gb)for(const b of g)gl.deleteBuffer(b);TLIST.clear();WORLD.treeGen++;}
  /* add models: [{id, group, near (ArrayBuffer or base64), far, collider}] -> their shape numbers */
  function install(list){
    for(const a of list){const near=typeof a.near==='string'?B64(a.near):a.near,far=typeof a.far==='string'?B64(a.far):a.far;
      if(SHAPE[a.id]===undefined){SHAPE[a.id]=TREES.shapes.length;TREES.shapes.push(null);}
      TREES.shapes[SHAPE[a.id]]=[mesh(readGlb(near,a.group)),mesh(readGlb(far,a.group))];INFO[a.id]=a;}
    resetLists();return SHAPE;}
  /* put one down (world metres; yaw in radians; s its size), into the chunk it stands in, on the ground there; trees solid */
  function plant(id,x,z,yaw=0,s=1){const c=chunkAt(x,z);if(!c||!c.st||SHAPE[id]===undefined)return false;
    const T=c.st.trees||new Float32Array(0),n=new Float32Array(T.length+12);n.set(T);
    const y=WW.heightAt(x,z);n.set([x,y-.02,z,yaw,s,s,s,SHAPE[id],1,1,1,0],T.length);c.st.trees=n;WORLD.treeGen++;
    /* a tree is solid: a circle round its trunk in the chunk's 16 m collider buckets, as the game's own trees (50_worldgen addTree) */
    const C=INFO[id].collider;if(C){const r=C.r*s,o={t:'c',x,z,r,top:y+C.h*s},cb=c.st.cb;
      for(let i=Math.max(0,Math.floor((x-r-c.x0)/16));i<=Math.min(7,Math.floor((x+r-c.x0)/16));i++)for(let j=Math.max(0,Math.floor((z-r-c.z0)/16));j<=Math.min(7,Math.floor((z+r-c.z0)/16));j++)(cb[j*8+i]||(cb[j*8+i]=[])).push(o);}
    return true;}
  /* the game's own tree shapes drawn with these instead: {gameShape: id} (0-2 broadleaf, 3-4 pines, 5-6 palms) */
  const GAME0=[];function swap(map){if(!GAME0.length)GAME0.push(...TREES.shapes.slice(0,7));
    for(const k in map)TREES.shapes[+k]=map[k]?TREES.shapes[SHAPE[map[k]]]:GAME0[+k];resetLists();}
  return {readGlb,install,plant,swap,SHAPE,INFO};
})();
