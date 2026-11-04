/* test only: scenes for the screenshots and the crash test (run by the shot tool's JS hook, with the game as g) */
window.__ff={FF,
  load(){if(!this.on){FF.install(FF_GLB);this.on=1;}},
  frame(g){const G=g.GAME,M=G.car.M,P=G.car.p,l=Math.hypot(M[0],M[6]),f=[M[0]/l,M[6]/l],r=[M[2],M[8]];
    return {P,f,r,at:(a,s)=>[P[0]+f[0]*a+r[0]*s,P[2]+f[1]*a+r[1]*s],face:sg=>Math.atan2(-sg*r[0],-sg*r[1])};},
  lineup(g){this.load();const F=this.frame(g),put=(id,a,s,yaw,k=1)=>{const p=F.at(a,s);return FF.plant(id,p[0],p[1],yaw===undefined?a*1.7+s:yaw,k);};
    let n=0,R=(()=>{let x=7;return()=>(x=(x*16807)%2147483647)/2147483647;})();
    for(const [id,a,s,k] of [['tree_cottonwood',24,-13,.9],['tree_oak',32,14,.85],['tree_ponderosa',44,-11,1],['tree_spruce',52,11,1],['tree_aspen',59,-8.5,1],['tree_aspen',61.5,-10.8,.9],['tree_aspen',63.5,-8.2,1.05],['tree_willow',74,14,.9],['tree_mesquite',86,-12,1],['tree_snag',96,10,1]])n+=put(id,a,s,undefined,k);
    for(const [id,a,s] of [['prop_hydrant',8,-5.2],['prop_mailbox',11,-5],['prop_drum',14,-5.6],['prop_drum',14.7,-6.2],['prop_tires',17,-5.8],['prop_icechest',20.5,-6.4]])n+=put(id,a,s,F.face(-1));
    for(const [id,a,s] of [['bush_sage',9,5.8],['bush_oleander',13,6.4],['bush_pricklypear',17.5,5.8],['bush_sage',21,6.6]])n+=put(id,a,s);
    for(let a=3;a<30;a+=.9){n+=put(R()<.7?'grass_meadow':'grass_dry',a,-(4.6+R()*3.2),R()*6.28,.8+R()*.4);n+=put(R()<.5?'grass_dry':'grass_meadow',a+.4,4.6+R()*3.4,R()*6.28,.8+R()*.4);}
    for(let i=0;i<10;i++)n+=put('grass_reeds',25+R()*3,7.5+R()*2,R()*6.28,.9+R()*.3);
    return {planted:n,shapes:Object.keys(FF.SHAPE).length};},
  near(m){GFX.q.treeNear=m;return GFX.q.treeNear;},
  swap(g){this.load();FF.swap({0:'tree_cottonwood',1:'tree_oak',2:'tree_aspen',3:'tree_ponderosa',4:'tree_spruce'});return {swapped:5};},
  /* drive straight at something 25 m ahead on the road: where does the car end up? */
  crash(g,id){this.load();const F=this.frame(g),p=F.at(25,0),ok=FF.plant(id,p[0],p[1],0,1),G=g.GAME,t=G.car,x0=[t.p[0],t.p[2]];
    g.setTestInput({steer:0,thr:.55,brk:0,hb:0,nos:false});let vmax=0;
    for(let i=0;i<60*7;i++){g.step(1/60);const e=[t.p[0],t.p[1]+3,t.p[2]];g.worldUpdate(e,t);vmax=Math.max(vmax,Math.hypot(t.v[0],t.v[2]));}
    const dx=t.p[0]-x0[0],dz=t.p[2]-x0[1],along=dx*F.f[0]+dz*F.f[1];
    return {id,planted:ok,object_m_ahead:25,car_went_m:+along.toFixed(2),passed_it:along>25,top_speed_kmh:Math.round(vmax*3.6),speed_at_end_kmh:Math.round(Math.hypot(t.v[0],t.v[2])*3.6)};}
};
