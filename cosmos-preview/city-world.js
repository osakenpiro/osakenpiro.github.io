import * as T from './vendor/three.module.min.js';

// Original illustrated town. The spherical surface is shared by roads and buildings.
export async function makeWorld(host,places,onVisit,motionEnabled,exhibits=[],onInspect=()=>{}){
  const R=8.6,INK='#33443e',scene=new T.Scene(),root=new T.Group();scene.add(root);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.setClearColor(0,0);host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  const camera=new T.PerspectiveCamera(32,1,.15,180);camera.position.set(25,28,36);
  scene.add(new T.HemisphereLight('#fff9e5','#627a7e',1.45));const sun=new T.DirectionalLight('#fff5d8',1.5);sun.position.set(-12,24,16);scene.add(sun);
  const gradient=new T.DataTexture(new Uint8Array([105,175,235,255]),4,1,T.RedFormat);gradient.needsUpdate=true;gradient.minFilter=T.NearestFilter;gradient.magFilter=T.NearestFilter;
  const materials=new Map(),geometries=new Map(),streetAxes=[],roofMaterials=new Map(),labelMaterials=new Map(),groundFrames=[];
  function mat(color){if(!materials.has(color))materials.set(color,new T.MeshToonMaterial({color,gradientMap:gradient}));return materials.get(color)}
  function geo(key,fn){if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key)}
  function mesh(g,c,x=0,y=0,z=0,p=root,outline=false){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);p.add(m);if(outline){const e=new T.LineSegments(new T.EdgesGeometry(g,25),new T.LineBasicMaterial({color:INK,transparent:true,opacity:.72}));m.add(e)}return m}
  function box(w,h,d,c,x,y,z,p,outline=true){return mesh(geo(`b${w},${h},${d}`,()=>new T.BoxGeometry(w,h,d)),c,x,y,z,p,outline)}
  function cyl(rt,rb,h,c,x,y,z,p,n=10,outline=false){return mesh(geo(`c${rt},${rb},${h},${n}`,()=>new T.CylinderGeometry(rt,rb,h,n)),c,x,y,z,p,outline)}
  function ball(r,c,x,y,z,p){return mesh(geo(`s${r}`,()=>new T.SphereGeometry(r,12,8)),c,x,y,z,p)}
  function stroke(points,color,width=.035,p=root){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(8,points.length*3),width,5,false),color,0,0,0,p)}
  function surface(x,z,h=0){const d=Math.hypot(x,z),a=d*.135,s=d?Math.sin(a)/d:0;return new T.Vector3(x*s,Math.cos(a),z*s).multiplyScalar(R+h)}
  function ribbon(points,w,color,height){const vertices=[],indices=[];for(let i=0;i<points.length;i++){const up=points[i].clone().normalize(),tangent=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize(),side=tangent.cross(up).normalize();for(const direction of [-1,1]){const v=up.clone().multiplyScalar(R+height).addScaledVector(side,direction*w).normalize().multiplyScalar(R+height);vertices.push(v.x,v.y,v.z)}if(i){const k=i*2;indices.push(k-2,k-1,k,k-1,k+1,k)}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=mesh(g,color);m.material=mat(color).clone();m.material.side=T.DoubleSide;return m}
  function at(x,z,h=0){const g=new T.Group(),v=surface(x,z,h);g.position.copy(v);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());root.add(g);return g}
  function grounded(p,x,z){
    p.updateWorldMatrix(true,false);
    const normal=p.localToWorld(new T.Vector3(x,0,z)).normalize(),g=new T.Group();
    g.position.copy(p.worldToLocal(normal.clone().multiplyScalar(R+.045)));
    g.quaternion.copy(p.getWorldQuaternion(new T.Quaternion()).invert()).multiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal));
    p.add(g);groundFrames.push(g);return g;
  }
  let seed=318;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const globe=mesh(new T.SphereGeometry(R,64,40),'#86b5b7');globe.name='spherical-planet';
  const silhouette=new T.Mesh(new T.SphereGeometry(R+.035,48,32),new T.MeshBasicMaterial({color:INK,side:T.BackSide}));root.add(silhouette);
  // A curved inhabited continent; the lower ocean remains visibly a complete globe.
  const ground=new T.SphereGeometry(R+.022,64,32,0,Math.PI*2,0,1.45);mesh(ground,'#cbd1a0');
  const river=[];for(let i=0;i<55;i++){const z=-10+i*.39;river.push(surface(Math.sin(z*.53)*1.25+1.05,z,.055))}ribbon(river,.30,'#426f75',.043);ribbon(river,.255,'#91c9c5',.052);
  function road(points,w=.21){for(let i=1;i<points.length;i++)streetAxes.push([points[i-1],points[i]]);const pts=[];for(let i=0;i<points.length-1;i++)for(let t=0;t<1;t+=.12)pts.push(surface(T.MathUtils.lerp(points[i][0],points[i+1][0],t),T.MathUtils.lerp(points[i][1],points[i+1][1],t),.09));pts.push(surface(...points.at(-1),.09));ribbon(pts,w+.03,'#a3a384',.071);ribbon(pts,w,'#e9dcb5',.085)}
  road([[-9,1],[-6,1.2],[-3,2],[0,3],[3,3.4],[7,2.5],[9,1.5]],.26);
  road([[-5,-9],[-4,-6],[-3,-2],[-2,2],[-3,6],[-5,9]],.23);
  road([[5,-9],[4,-6],[4,-2],[5,1],[5,5],[3,9]],.22);
  road([[-8,-4],[-5,-4],[-1,-3.8],[3,-3.5],[8,-4]],.18);
  road([[-7,5],[-3,5],[0,5],[4,6],[8,5]],.18);
  for(const z of [-3.7,3.2,5.2]){const x=Math.sin(z*.53)*1.25+1.05,p=at(x,z,.19);box(1.25,.13,.55,'#b9785f',0,.08,0,p);for(const side of [-.26,.26])box(1.25,.06,.055,'#744f46',0,.30,side,p);}
  function label(text,w,h,x,y,z,p,bg='#f3e5b9',ink=INK){
    const key=JSON.stringify([text,bg,ink]);
    if(!labelMaterials.has(key)){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,192);c.strokeStyle=ink;c.lineWidth=10;c.strokeRect(6,6,500,180);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font='bold 64px "Yu Gothic",sans-serif';c.fillText(text,256,102,470);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;labelMaterials.set(key,new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));}
    const m=new T.Mesh(geo(`label${w},${h}`,()=>new T.PlaneGeometry(w,h)),labelMaterials.get(key));m.position.set(x,y,z);p.add(m);return m;
  }
  function windows(p,w,h,d,rows=2){for(let r=0;r<rows;r++)for(let k=0;k<3;k++){const x=(k-1)*w*.27,y=.4+r*.55;box(.23,.34,.028,'#526e72',x,y,d/2+.025,p,false);box(.035,.34,.035,'#e8dab6',x,y,d/2+.046,p,false)} }
  function roof(p,w,d,y,color){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,-d/2,w/2,0,-d/2,0,.5,-d/2,-w/2,0,d/2,0,.5,d/2,w/2,0,d/2,-w/2,0,-d/2,0,.5,-d/2,0,.5,d/2,-w/2,0,-d/2,0,.5,d/2,-w/2,0,d/2,w/2,0,-d/2,w/2,0,d/2,0,.5,d/2,w/2,0,-d/2,0,.5,d/2,0,.5,-d/2],3));g.computeVertexNormals();const m=mesh(g,color,0,y,0,p,true);if(!roofMaterials.has(color)){const rm=mat(color).clone();rm.side=T.DoubleSide;roofMaterials.set(color,rm)}m.material=roofMaterials.get(color);return m}
  function awning(p,w,y,z,color){for(let i=0;i<8;i++)box(w/8,.08,.47,i%2?'#f6e9c9':color,-w/2+(i+.5)*w/8,y,z,p,false);for(const x of [-w/2,w/2])cyl(.025,.025,y,color,x,y/2,z+.2,p,6)}
  function person(p,x,z,color,pose=0){cyl(.055,.085,.22,color,x,.20,z,p,7);ball(.07,'#e5cfae',x,.37,z,p);box(.045,.12,.055,INK,x-.04,.05,z,p,false);box(.045,.12,.055,INK,x+.04,.05,z+(pose?.06:0),p,false)}
  function tree(x,z,s=1){const p=at(x,z,.07);p.scale.setScalar(s);cyl(.055,.10,.65,'#84725a',0,.35,0,p,6);ball(.40,'#76966c',0,.85,0,p);ball(.3,'#9daf75',.18,1.05,0,p);ball(.24,'#6e906a',-.24,.95,.05,p)}
  const buildings=[],anchors=new Map(),objects=[];
  // Geometry and accessible paper tags share actual catalogue identities.
  function workshopObjects(p){
    const counter=grounded(p,0,2.03);
    box(2.65,.13,.67,'#ac815b',0,.48,0,counter);
    for(const x of [-1.15,1.15]){const foot=Math.sqrt((R+.045)**2-x*x)-(R+.045);box(.12,.44-foot,.49,'#795d46',x,(.46+foot)/2,0,counter);}
    for(let i=0;i<exhibits.length;i++){
      const item=exhibits[i],g=new T.Group();g.position.set((i-1)*.91,.55,0);counter.add(g);
      box(.76,.06,.55,'#f2e2b8',0,.025,0,g);
      if(item.id==='works-nandometer'){
        box(.56,.45,.31,'#9b624d',0,.28,0,g);
        const dial=cyl(.205,.205,.035,'#ecdab0',0,.32,.177,g,28,true);dial.rotation.x=Math.PI/2;
        for(let k=0;k<9;k++){const a=-Math.PI*.7+k*Math.PI*1.4/8;const tick=box(.018,.045,.018,INK,Math.sin(a)*.165,.32+Math.cos(a)*.165,.203,g,false);tick.rotation.z=-a;}
        const needle=box(.018,.15,.019,'#9e6249',.035,.36,.221,g,false);needle.rotation.z=-.7;
        ball(.03,INK,0,.32,.228,g);for(const x of [-.19,.19])ball(.038,'#d1ac60',x,.105,.191,g);
      }else if(item.id==='works-wakkazukan'){
        box(.48,.07,.39,'#617f79',0,.1,0,g);cyl(.035,.035,.47,'#a48659',0,.3,0,g,8);
        const ring=mesh(new T.TorusGeometry(.245,.027,6,32),'#c9a253',0,.40,0,g);ring.rotation.y=-.25;
        const inner=mesh(new T.TorusGeometry(.153,.019,6,28),'#688e84',0,.40,.025,g);inner.rotation.y=.55;
        ball(.065,'#c07e60',.18,.55,.015,g);ball(.075,'#93ad92',-.08,.39,.04,g);
      }else{
        // A still bellows model; no breathing rhythm or live activity is implied.
        for(let k=0;k<6;k++)box(.44-(k%2)*.065,.065,.33-(k%2)*.045,k%2?'#789c96':'#b5c7b1',0,.13+k*.065,0,g);
        box(.48,.07,.36,'#c6a061',0,.51,0,g);cyl(.045,.07,.11,'#a17d55',0,.6,0,g,10);
      }
      const point=new T.Vector3(0,.33,.29);g.traverse(o=>{if(o.isMesh)o.userData.item=item.id});
      const button=document.createElement('button');button.className='object-tag';button.dataset.worldItem=item.id;button.hidden=true;
      button.setAttribute('aria-label',`${item.title}を手にとる`);
      const number=document.createElement('span');number.className='object-number';number.textContent=String(i+1).padStart(2,'0');
      const title=document.createElement('span');title.textContent=item.title;
      button.append(number,title);button.addEventListener('click',()=>onInspect(item.id));document.getElementById('street-objects').append(button);
      objects.push({id:item.id,g,point,button});
    }
    // A narrow side alley and a workbench establish a destination around the objects.
    const bench=grounded(p,-1.91,.4);box(.8,.09,.45,'#b29264',0,.43,0,bench);for(const x of [-.29,.31])box(.08,.4,.34,'#806b4f',x,.2,0,bench);
    for(let k=0;k<4;k++)box(.10,.12+k*.035,.24,paint[k],-.24+k*.17,.53,0,bench,false);
    label('道具を手にとる',1.10,.24,0,.33,.36,counter);
    const lamp=grounded(p,1.82,.15);cyl(.035,.035,1.7,'#586f61',0,.85,0,lamp,7);box(.36,.05,.3,'#6f7f61',0,1.76,0,lamp);box(.22,.30,.2,'#e4c581',0,1.57,0,lamp);
  }
  const paint=['#e9d3a7','#cfab92','#ebdfbf','#a9bbb1','#d6bca0'];
  for(const place of places){
    const p=at(place.x,place.z,.14);p.userData.place=place.id;buildings.push(p);anchors.set(place.id,p);
    cyl(1.55,1.55,.08,'#e4d8af',0,.02,0,p,18);
    const w=2.1,d=1.65;
    if(place.kind==='library'){
      for(let i=0;i<3;i++){const b=new T.Group();b.position.set((i-1)*.68,0,0);b.rotation.z=(i-1)*-.055;p.add(b);box(.6,2.1-i*.25,1.35,['#bc8063','#84a2a0','#d2b568'][i],0,1.1-i*.12,0,b);for(let k=0;k<4;k++)box(.62,.025,1.38,'#eddab4',0,.4+k*.32,0,b,false);}
      label('本と物語',1.7,.48,0,1.25,.74,p);awning(p,2.4,.87,1.1,'#719a8c');for(let i=0;i<8;i++)box(.10,.20+rand()*.13,.25,paint[i%5],-.6+i*.17,.35,1.38,p,false);
    }else if(place.kind==='observatory'){
      cyl(.77,.96,2.2,'#e0c9a2',0,1.13,0,p,16,true);for(let i=0;i<3;i++)cyl(.80,.80,.07,'#7b9da5',0,.7+i*.6,0,p,18);mesh(new T.SphereGeometry(.92,20,12,0,Math.PI*2,0,Math.PI/2),'#82a6ac',0,2.28,0,p,true);
      const tube=cyl(.13,.21,1.45,'#e9d4a7',.2,2.85,.56,p,12,true);tube.rotation.x=1.05;label('考える天文台',1.8,.45,0,1.15,.97,p);const star=new T.Mesh(new T.TorusGeometry(.43,.032,6,32),mat('#d8af57'));star.position.set(-1.15,1.35,.1);p.add(star);
    }else if(place.kind==='museum'){
      box(2.3,1.45,1.7,'#d9c49e',0,.77,0,p);box(2.5,.12,1.9,'#789896',0,1.55,0,p);for(let i=0;i<3;i++){const x=(i-1)*.72;cyl(.26,.26,.64,'#bdd2c3',x,1.92,0,p,12,true);cyl(.3,.3,.09,'#a88a60',x,2.28,0,p,12);ball(.16,['#af8a66','#88a277','#d1ac5d'][i],x,1.94,.06,p)}
      label('標本と発見',1.9,.52,0,1.15,.91,p);for(const x of [-.9,.9])cyl(.065,.065,1.15,'#efdfb6',x,.66,1.08,p,8);box(.8,.6,.08,'#547875',0,.45,.9,p); 
    }else if(place.kind==='gallery'){
      box(1.9,1.65,2,'#c78d77',0,.88,0,p);box(2.1,.12,2.15,'#7d9d97',0,1.76,0,p);label('絵 と 音',2.15,.54,0,1.52,1.08,p,'#f2d69b');awning(p,2.15,1.06,1.25,'#b46f56');
      const reel=cyl(.55,.55,.15,'#e1cfaa',0,2.3,0,p,20,true);reel.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ball(.115,'#627b77',Math.sin(a)*.31,2.3+Math.cos(a)*.31,.11,p)}
      for(let i=0;i<3;i++){box(.43,.58,.08,'#725e4f',-.6+i*.6,.65,1.13,p);box(.34,.47,.02,['#aac0af','#cfab75','#99afb5'][i],-.6+i*.6,.65,1.18,p,false)}
    }else if(place.kind==='post'){
      box(2.2,1.25,1.55,'#d5a281',0,.67,0,p);roof(p,2.45,1.8,1.33,'#829f9a');box(.7,2.4,.78,'#e9dab5',.75,1.25,-.25,p);roof(p,.91,.91,2.5,'#ab715a');
      const face=cyl(.23,.23,.055,'#f5e8c5',.75,2.10,.17,p,20,true);face.rotation.x=Math.PI/2;box(.025,.17,.028,INK,.75,2.15,.21,p,false);box(.13,.025,.028,INK,.80,2.1,.21,p,false);label('便りの郵便局',1.9,.45,-.18,1.06,.86,p);box(.24,.47,.22,'#b66e57',-1.4,.24,.85,p);
    }else if(place.kind==='playground'){
      box(1.8,.95,1.4,'#d9bb71',0,.52,.3,p);awning(p,2,1.08,1.17,'#819ea4');label('あそび研究所',1.95,.43,0,.77,1.06,p);
      const wheel=new T.Group();wheel.position.set(0,2,-.40);p.add(wheel);mesh(new T.TorusGeometry(.9,.045,6,36),'#a17657',0,0,0,wheel);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;stroke([new T.Vector3(),new T.Vector3(Math.sin(a)*.87,Math.cos(a)*.87,0)],'#718d86',.019,wheel);box(.27,.30,.28,paint[i%5],Math.sin(a)*.91,Math.cos(a)*.91,0,wheel)}
      for(const x of [-.35,.35]){const leg=box(.06,1.9,.06,'#648984',x,1,-.4,p);leg.rotation.z=x>0?.18:-.18;}
    }else{
      box(2.4,1.15,1.65,'#d9c59a',0,.62,0,p);for(let i=0;i<3;i++)roof(p,.9,1.9,1.22,'#9e725c').position.x=-.85+i*.85;
      cyl(.18,.23,2.2,'#c18b71',-.9,1.25,-.48,p,10,true);cyl(.24,.24,.12,'#e4d4b1',-.9,2.36,-.48,p,10);label('ひみつ道具工房',2.05,.36,0,1.18,1.03,p);awning(p,2.6,.93,1.13,'#7c9d89');
      workshopObjects(p);const gear=mesh(new T.TorusGeometry(.42,.11,5,10),'#ca9f5a',1,1.85,0,p);gear.rotation.z=.2;
    }
    windows(p,w,1.4,d,1);person(p,-1.22,1.25,'#758f9b');person(p,.98,1.55,'#b47962',1);
  }
  // Street-facing lots, with different silhouettes and lived-in frontages.
  const shops=['古書室','修理室','文具店','喫茶室','写真室','道具店','音楽室'];let homes=0;
  const homeSites=[],families=new Set();
  function windowPane(p,x,y,z,w=.22,h=.28){box(w+.075,h+.075,.035,'#ede0c0',x,y,z,p,false);box(w,h,.043,'#526e72',x,y,z+.025,p,false);box(.025,h,.05,'#dfcfa9',x,y,z+.04,p,false)}
  function planter(p,x,y,z,w=.3){box(w,.13,.2,'#b98666',x,y,z,p);for(let i=0;i<3;i++)ball(.08,'#77956c',x+(i-1)*w*.27,y+.13,z,p)}
  function balcony(p,w,y,z){box(w,.08,.34,'#ab9671',0,y,z,p);for(const x of [-w/2,w/2])box(.035,.3,.035,INK,x,y+.17,z+.15,p,false);box(w,.035,.035,INK,0,y+.32,z+.15,p,false);planter(p,w*.23,y+.13,z+.04)}
  function bicycle(p,x,z){const b=new T.Group();b.position.set(x,.17,z);p.add(b);for(const v of [-.2,.2])mesh(new T.TorusGeometry(.14,.018,5,15),'#526b64',v,0,0,b);stroke([new T.Vector3(-.2,0,0),new T.Vector3(-.05,.2,0),new T.Vector3(.15,0,0),new T.Vector3(-.2,0,0)],'#b47c5c',.018,b);box(.13,.03,.08,INK,-.04,.22,0,b,false)}
  function home(x,z,angle,type,scale=1){
    const p=at(x,z,.10);p.rotateY(angle);p.scale.setScalar(scale);const w=1.05+rand()*.3,d=.82+rand()*.26,h=type===1?2.05:type===4?1.0:1.30+rand()*.35;
    const color=paint[(homes+type)%paint.length],roofColor=['#a36e58','#6e8e84','#baa068'][type%3];families.add(type);
    box(w+.16,.08,d+.3,'#d8cfad',0,.04,0,p);
    if(type===3){ // Courtyard shop: two wings and a recessed entrance.
      for(const side of [-1,1]){box(w*.34,h,d,color,side*w*.34,h/2,0,p);const r=roof(p,w*.40,d+.12,h,roofColor);r.position.x=side*w*.34}
      box(w,.65,.23,'#a2b3a2',0,.34,-d*.35,p);planter(p,0,.10,.2,.35);
    }else{
      box(w,h,d,color,0,h/2,0,p);
      if(type===0||type===1||type===5){roof(p,w+.14,d+.18,h,roofColor);box(.17,.55,.2,'#a58465',w*.27,h+.22,-.15,p);if(type===1){box(.4,.43,.23,'#e9d9b4',0,h+.08,d*.28,p);roof(p,.5,.36,h+.31,roofColor).position.z=d*.28;windowPane(p,0,h+.1,d*.42,.16,.2)}}
      else if(type===2){ // Stepped studio with a roof garden.
        box(w+.1,.09,d+.1,'#b59b75',0,h+.03,0,p);box(w*.65,.6,d*.55,'#92a99c',-.12,h+.33,-d*.18,p);roof(p,w*.7,d*.63,h+.63,roofColor).position.set(-.12,h+.63,-d*.18);planter(p,w*.25,h+.15,d*.23,.38);
      }else if(type===4){ // Curved cafe corner and broad tiled roof.
        cyl(w*.40,w*.40,h,'#d7b780',w*.25,h/2,d*.13,p,16,true);roof(p,w*1.22,d*1.2,h+.1,roofColor);awning(p,w*1.18,.72,d*.58,'#a8755c');
      }else{ // Flat-roof print/music studio with glasshouse.
        box(w+.1,.1,d+.1,'#89a293',0,h+.04,0,p);box(w*.6,.42,d*.6,'#adbfaf',-.1,h+.28,-.1,p);roof(p,w*.64,d*.64,h+.49,'#6f8e89').position.set(-.1,h+.49,-.1);for(const side of [-1,1])planter(p,side*w*.34,h+.14,d*.3,.25);
      }
      for(let row=0;row<(h>1.8?3:2);row++){const y=.34+row*.53;for(const side of [-1,1])windowPane(p,side*w*.25,y,d/2+.045,w*.22,.29)}
      windowPane(p,0,.31,d/2+.05,w*.20,.46);
      const rear=new T.Group();rear.rotation.y=Math.PI;p.add(rear);const sideWall=new T.Group();sideWall.rotation.y=Math.PI/2;p.add(sideWall);for(const y of [.38,.94]){for(const x of [-w*.25,w*.25])windowPane(rear,x,y,d/2+.025,w*.18,.25);windowPane(sideWall,0,y,w/2+.025,d*.23,.28)}
      if(type===1||type===2)balcony(p,w*.9,1.0,d*.5+.12);
      if(type===5){for(const side of [-1,1])box(.055,h,.04,'#927251',side*w*.45,h/2,d/2+.025,p,false);for(const y of [.63,1.13])box(w,.055,.04,'#927251',0,y,d/2+.02,p,false)}
    }
    if(type!==4)awning(p,w*.92,.72,d/2+.16,['#799484','#ac795f','#b59b61'][type%3]);
    label(shops[type],w*.82,.22,0,.93,d/2+.055,p);
    if(type%2===0){const sign=new T.Group();sign.position.set(w*.66,.63,d*.28);p.add(sign);label(['珈琲','本','音'][type%3],.24,.56,0,0,0,sign);box(.32,.03,.03,INK,-.12,.32,0,sign,false)}
    if(type===1||type===5)bicycle(p,-w*.46,d*.73);
    if(type===2){box(.26,.58,.2,'#9b5146',w*.64,.3,.15,p);box(.18,.27,.022,'#f2ddb2',w*.64,.36,.261,p,false)}
    if(type===0){box(.48,.12,.28,'#a68764',-.24,.3,d*.76,p);for(let k=0;k<5;k++)box(.055,.15+rand()*.08,.16,paint[k],-.4+k*.09,.45,d*.76,p,false)}
    if(homes%3===0)person(p,w*.55,d*.68,'#bb8867',1);else planter(p,-w*.55,.12,d*.5);
    homes++;
  }
  for(const [a,b] of streetAxes){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
    for(let t=.7;t<len;t+=1.58)for(const side of [-1,1]){const x=a[0]+dx*t/len+nx*side*1.02,z=a[1]+dz*t/len+nz*side*1.02;
      if(Math.hypot(x,z)>10.1||homeSites.some(q=>Math.hypot(q[0]-x,q[1]-z)<1.48)||places.some(q=>Math.hypot(q.x-x,q.z-z)<2.0||(Math.abs(q.x-x)<1.02&&z>q.z&&z<q.z+4.3))||Math.abs(x-Math.sin(z*.53)*1.25-1.05)<.9)continue;
      homeSites.push([x,z]);home(x,z,Math.atan2(-nx*side,-nz*side),(homes*3+Math.floor(t))%7);
    }
  }
  // Hand-composed low infill: a river court, a south-bank row and a northern lane.
  // Each radius includes the porch/awning. Keep the landmark approach corridors open.
  const infillSites=[];
  function distanceToStreet(x,z){return Math.min(...streetAxes.map(([a,b])=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)}))}
  function infill(x,z,angle,type,scale=.55){
    const radius=scale*1.13;
    if(Math.hypot(x,z)+radius>10.3||homeSites.some(q=>Math.hypot(q[0]-x,q[1]-z)<.85+radius)||infillSites.some(q=>Math.hypot(q.x-x,q.z-z)<q.radius+radius)||places.some(q=>Math.hypot(q.x-x,q.z-z)<1.50+radius||(Math.abs(q.x-x)<1.35+radius&&z>q.z&&z<q.z+4.3))||Math.abs(x-Math.sin(z*.53)*1.25-1.05)<.55+radius||distanceToStreet(x,z)<.28+radius)return;
    infillSites.push({x,z,radius});home(x,z,angle,type,scale);
  }
  infill(-1.1,-.2,1.12,4,.50);
  infill(0,.3,.95,0,.45);
  infill(-1.9,7.4,.95,4,.48);
  infill(-.85,6.90,1.20,3,.50);
  infill(-1.30,-9.0,.15,5,.55);
  infill(.05,-9.45,-.15,0,.55);
  infill(6.50,-1.20,-1.1,3,.40);
  infill(2.40,-6.0,-.75,4,.45);
  infill(-1.60,8.50,.75,0,.45);
  // A continuous low promenade makes the river legible from orbit without hiding it.
  for(const side of [-1,1]){
    const bank=[];for(let z=-9.8;z<=10;z+=.20)bank.push(surface(Math.sin(z*.53)*1.25+1.05+side*.55,z,.10));
    ribbon(bank,.12,'#d4c29b',.090);ribbon(bank,.087,'#ece0bb',.096);
    for(let k=0;k<27;k++){
      const z=-9.5+k*.72,x=Math.sin(z*.53)*1.25+1.05+side*.39;
      if(places.some(q=>Math.hypot(q.x-x,q.z-z)<1.8)||[-3.7,3.2,5.2].some(v=>Math.abs(v-z)<.45))continue;
      const p=at(x,z,.10);cyl(.023,.031,.22,'#7b8e78',0,.11,0,p,6);ball(.033,'#d1bd84',0,.235,0,p);
      if(k%5===1){const bench=at(x+side*.38,z,.105);bench.rotateY(Math.atan2(side,0));box(.58,.055,.19,'#a78a5f',0,.20,0,bench);box(.58,.19,.035,'#b3976c',0,.32,-.08,bench);for(const v of [-.23,.23])box(.045,.18,.15,INK,v,.095,0,bench,false)}
    }
  }
  // Small courts break the broad ground plane into places, with steps and planted edges.
  for(const [x,z,angle] of [[-.55,-8.1,0]]){
    const court=at(x,z,.092);court.rotateY(angle);
    for(let row=0;row<4;row++)for(let col=0;col<3;col++)box(.25,.015,.20,(row+col)%3?'#daca9f':'#e7d9b3',(col-1)*.29,.012,(row-1.5)*.25,court,false);
    for(const side of [-1,1]){planter(court,side*.58,.09,0,.37);box(.23,.04,.16,'#b29367',side*.58,.18,.38,court)}
  }
  // Low edge planting fills the forecourt without blocking the approach corridor.
  const workshop=anchors.get('workshop');
  if(workshop){for(const side of [-1,1]){planter(grounded(workshop,side*1.8,2.05),0,.065,0,.5);bicycle(grounded(workshop,side*2.15,1.28),0,0)}
    for(let k=0;k<6;k++)for(const side of [-1,1])box(.47,.025,.37,k%2?'#d7cba6':'#e3d7b3',0,.013,0,grounded(workshop,side*.32,2.75+k*.44),false);
  }
  // Low, place-specific forecourts enrich the town while leaving a clear central approach.
  for(const place of places){
    if(place.id==='workshop')continue;
    const p=anchors.get(place.id);
    for(let row=0;row<6;row++)for(const side of [-1,1])box(.60,.022,.37,(row+Number(side>0))%3?'#d8cba7':'#e9dcb9',0,.011,0,grounded(p,side*.34,1.9+row*.40),false);
    if(place.id==='library'){
      for(const side of [-1,1]){
        const stall=grounded(p,side*.78,2.6);stall.rotateY(-side*.20);
        box(.47,.30,.84,'#a7875f',0,.17,0,stall);box(.55,.065,.9,'#dcc799',0,.35,0,stall);
        for(let k=0;k<7;k++){const book=box(.29,.06,.075,paint[(k+Number(side>0))%5],0,.415+(k%3)*.02,-.28+k*.095,stall);book.rotation.y=(k%3-1)*.1;}
        planter(grounded(p,side*.80,3.45),0,.065,0,.36);
      }
    }else if(place.id==='museum'){
      for(let k=0;k<3;k++){
        const side=k%2?-1:1,z=2.0+k*.65;
        const plinth=grounded(p,side*.80,z);cyl(.22,.25,.18,'#b39b72',0,.09,0,plinth,10,true);
        const sample=mesh(new T.DodecahedronGeometry(.23+k*.025,0),['#a78662','#8c9f93','#c3ae70'][k],0,.40,0,plinth,true);sample.rotation.set(k*.2,.4+k*.7,.2);
        box(.20,.018,.12,'#efdfb8',0,.012,.31,plinth,false);
      }
    }else if(place.id==='playground'){
      const board=grounded(p,0,2.95);
      for(let row=0;row<5;row++)for(let col=0;col<5;col++)box(.20,.015,.20,(row+col)%2?'#a1ad8b':'#ecd7a8',(col-2)*.21,.012,(row-2)*.21,board,false);
      for(const [x,z,c] of [[-.42,-.21,'#a37455'],[.21,.42,'#a37455'],[.42,-.42,'#718c7d'],[-.21,.21,'#718c7d']])cyl(.07,.08,.065,c,x,.05,z,board,12);
      for(const side of [-1,1])cyl(.17,.20,.28,'#b09360',0,.14,0,grounded(p,side*.83,2.95),10,true);
    }else if(place.id==='gallery'){
      for(let k=0;k<3;k++){
        const e=grounded(p,k%2?-.75:.78,1.95+k*.65);e.rotateY(k%2?.24:-.24);
        box(.45,.57,.045,'#896c52',0,.38,0,e);box(.37,.48,.012,'#e6d7b1',0,.38,.03,e,false);
        const art=ball(.12,['#a9795e','#829e99','#c3a457'][k],-.05,.40,.043,e);art.scale.z=.07;
        box(.18,.06,.013,'#8eaa93',.04,.25,.051,e,false);for(const side of [-1,1])box(.035,.32,.035,'#896c52',side*.14,.14,-.04,e,false);
      }
    }else if(place.id==='observatory'){
      const compass=grounded(p,0,2.8);cyl(.71,.71,.018,'#dbc79a',0,.01,0,compass,32,true);
      for(let k=0;k<8;k++){const a=k*Math.PI/4;const ray=box(.023,.015,.53,'#819c90',Math.sin(a)*.30,.023,Math.cos(a)*.30,compass,false);ray.rotation.y=a;}
      cyl(.09,.12,.26,'#b79c60',0,.13,0,compass,10);for(const side of [-1,1])planter(grounded(p,side*.85,3.65),0,.065,0,.34);
    }else{
      for(let k=0;k<4;k++){
        const parcel=grounded(p,k%2?-.80:.78,2.0+Math.floor(k/2)*.70),h=.28+k%2*.09;box(.40,h,.34,['#b39a74','#d3bb90'][k%2],0,h/2,0,parcel);box(.04,h+.01,.35,'#e5d3a7',0,h/2,0,parcel,false);
        box(.21,.017,.11,'#eee0bd',0,h+.01,0,parcel,false);
      }
    }
  }
  for(let i=0;i<42;i++){const x=(rand()-.5)*20,z=(rand()-.5)*20;if(Math.hypot(x,z)>10||homeSites.some(q=>Math.hypot(q[0]-x,q[1]-z)<.85)||infillSites.some(q=>Math.hypot(q.x-x,q.z-z)<q.radius+.35)||places.some(p=>Math.hypot(p.x-x,p.z-z)<1.9||(Math.abs(p.x-x)<1.35&&z>p.z&&z<p.z+4.3)))continue;tree(x,z,.5+rand()*.45)}
  // Elevated railway wraps the sphere; decorative movement is not work status.
  const rail=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;rail.push(new T.Vector3(Math.sin(a),.23,Math.cos(a)).normalize().multiplyScalar(R+.21))}stroke(rail,'#6d7870',.065);stroke(rail.map(v=>v.clone().multiplyScalar(1.009)),'#ead7ab',.023);
  const train=new T.Group();root.add(train);for(let i=0;i<3;i++){box(.38,.33,.68,'#c58969',0,.2,-i*.78,train);box(.39,.1,.70,'#eddfbb',0,.40,-i*.78,train);for(const x of [-.2,.2])box(.015,.13,.48,'#52727a',x,.24,-i*.78,train,false)}
  const clouds=[];for(const [x,z] of [[-11,3],[10,-2],[-2,-12]]){const g=at(x,z,1.5);for(let i=0;i<4;i++){const puff=ball(.40+i%2*.12,'#f4eed6',(i-1.5)*.38,0,0,g);puff.scale.set(1.3,.46,1)}clouds.push(g)}
  const starPoints=[];for(let i=0;i<100;i++)starPoints.push((rand()-.5)*75,(rand()-.5)*60,-25-rand()*25);const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(starPoints,3));scene.add(new T.Points(sg,new T.PointsMaterial({color:'#e4d6b3',size:.055,transparent:true,opacity:.45})));
  // Bake static city geometry by material. Keep original matrices for exact ray hits.
  // Forecourt props are part of their place and are added after the main building.
  for(const p of buildings)p.traverse(o=>{if(o.isMesh)o.userData.place=p.userData.place});
  root.updateMatrixWorld(true);
  host.dataset.groundedFrames=String(groundFrames.length);
  host.dataset.groundMaxRadialError=String(Math.max(...groundFrames.map(g=>Math.abs(g.getWorldPosition(new T.Vector3()).length()-(R+.045)))));
  const batches=new Map(),inkVertices=[];
  for(const child of [...root.children]){
    if(child===train)continue;
    child.traverse(o=>{
      if(!o.isMesh&&!o.isLineSegments)return;
      const pos=o.geometry.attributes.position,normal=o.geometry.attributes.normal,uv=o.geometry.attributes.uv,index=o.geometry.index,n=index?index.count:pos.count;
      if(o.isLineSegments){for(let i=0;i<n;i++){const v=new T.Vector3().fromBufferAttribute(pos,index?index.getX(i):i).applyMatrix4(o.matrixWorld);inkVertices.push(v.x,v.y,v.z)}return}
      let b=batches.get(o.material.uuid);if(!b){b={material:o.material,p:[],n:[],uv:[]};batches.set(o.material.uuid,b)}const nm=new T.Matrix3().getNormalMatrix(o.matrixWorld);
      for(let i=0;i<n;i++){const k=index?index.getX(i):i,v=new T.Vector3().fromBufferAttribute(pos,k).applyMatrix4(o.matrixWorld),nn=normal?new T.Vector3().fromBufferAttribute(normal,k).applyMatrix3(nm).normalize():new T.Vector3(0,1,0);b.p.push(v.x,v.y,v.z);b.n.push(nn.x,nn.y,nn.z);b.uv.push(uv?uv.getX(k):0,uv?uv.getY(k):0)}
    });root.remove(child);
  }
  for(const b of batches.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.computeBoundingSphere();root.add(new T.Mesh(g,b.material))}
  const inks=new T.BufferGeometry();inks.setAttribute('position',new T.Float32BufferAttribute(inkVertices,3));root.add(new T.LineSegments(inks,new T.LineBasicMaterial({color:INK,transparent:true,opacity:.64})));
  let selected=null,streetLevel=false,azimuth=-.03,wantedAzimuth=-.03,elevation=.87,wantedElevation=.87,extent=26,wantedExtent=26,moving=motionEnabled,dirty=120,last=0,frame,first=true;
  const cameraUp=new T.Vector3(0,1,0),wantedUp=cameraUp.clone();const target=new T.Vector3(0,.45,0),wantedTarget=target.clone(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function setVisitTarget(){const a=anchors.get(selected.id),normal=a.position.clone().normalize(),front=new T.Vector3(0,0,1).applyQuaternion(a.quaternion),height=streetLevel?(selected.id==='workshop'?.4:.8):.65;wantedTarget.copy(a.position).addScaledVector(normal,height).addScaledVector(front,streetLevel?.35:0);wantedUp.copy(normal);wantedExtent=streetLevel?5.7:8.3;wantedElevation=streetLevel?.32:.66;dirty=150;}
  const ray=new T.Raycaster(),pointer=new T.Vector2(),solidMeshes=root.children.filter(o=>o.isMesh);let down=null,lastTags=0,lastTagView='',lastTagWidth=0,lastTagHeight=0,lastTagFov=0;
  function yawLimit(){return (streetLevel&&selected?.id==='workshop') ? .62 : 1.25;}
  const tagCameraPosition=new T.Vector3(Infinity,Infinity,Infinity),tagCameraRotation=new T.Quaternion();
  function pick(){
    const hit=ray.intersectObjects([globe,...buildings],true).find(h=>h.object.isMesh);
    if(!hit)return null;
    const front=ray.intersectObjects(solidMeshes,false)[0];
    return front&&front.distance+.035<hit.distance?null:hit;
  }
  host.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,a:wantedAzimuth,e:wantedElevation,moved:false};host.setPointerCapture(e.pointerId)});
  host.addEventListener('pointermove',e=>{if(!down)return;down.moved=down.moved||Math.hypot(e.clientX-down.x,e.clientY-down.y)>=7;wantedAzimuth=down.a-(e.clientX-down.x)*.006;wantedElevation=T.MathUtils.clamp(down.e+(e.clientY-down.y)*.004,selected?.18:-.5,selected?1.15:1.35);if(selected){const limit=yawLimit();wantedAzimuth=T.MathUtils.clamp(wantedAzimuth,-limit,limit)}dirty=120});
  host.addEventListener('pointerup',e=>{if(down&&!down.moved&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7){const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=pick();if(streetLevel&&selected?.id==='workshop'&&hit?.object.userData.item){const item=objects.find(o=>o.id===hit.object.userData.item);item?.button.focus({preventScroll:true});onInspect(hit.object.userData.item)}else if(hit?.object.userData.place)onVisit(hit.object.userData.place)}down=null});host.addEventListener('pointercancel',()=>{down=null});
  let width=0,height=0,projectionDirty=true,projectionUpdates=0;function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;if(w!==width||h!==height){renderer.setSize(w,h,false);width=w;height=h;camera.aspect=w/h;projectionDirty=true}}
  const ro=new ResizeObserver(()=>{resize();dirty=120});ro.observe(host);
  const signs=places.map(p=>({p,el:document.querySelector(`[data-place="${p.id}"]`)}));
  let signView='',signWidth=0,signHeight=0,signFov=0,signsNeedLayout=true,signLayoutPasses=0;
  const signCameraPosition=new T.Vector3(Infinity,Infinity,Infinity),signCameraRotation=new T.Quaternion();
  document.fonts?.ready.then(()=>{signsNeedLayout=true;lastTagWidth=-1;dirty=Math.max(dirty,2)});
  function render(ts){frame=requestAnimationFrame(render);if(document.hidden||ts-last<32)return;const elapsed=ts-last;last=ts;if(!moving&&dirty<=0)return;dirty--;const ease=reduced.matches?1:1-Math.exp(-elapsed/400);azimuth=T.MathUtils.lerp(azimuth,wantedAzimuth,ease);elevation=T.MathUtils.lerp(elevation,wantedElevation,ease);extent=T.MathUtils.lerp(extent,wantedExtent,ease);target.lerp(wantedTarget,ease);resize();
    const desiredFov=selected?(streetLevel?54:44):32,nextFov=Math.abs(camera.fov-desiredFov)<.00001?desiredFov:T.MathUtils.lerp(camera.fov,desiredFov,ease);if(nextFov!==camera.fov){camera.fov=nextFov;projectionDirty=true}if(projectionDirty){camera.updateProjectionMatrix();projectionDirty=false;host.dataset.projectionUpdates=String(++projectionUpdates)}
    const direction=new T.Vector3(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation));
    if(selected)direction.applyQuaternion(anchors.get(selected.id).quaternion);
    const distance=extent/(2*Math.tan(T.MathUtils.degToRad(camera.fov)/2))/Math.min(1,camera.aspect);
    const desiredPosition=target.clone().addScaledVector(direction,distance);camera.position.lerp(desiredPosition,ease);
    if(camera.position.length()<R+1.8)camera.position.setLength(R+1.8);
    cameraUp.lerp(wantedUp,ease).normalize();camera.up.copy(cameraUp);camera.lookAt(target);camera.updateMatrixWorld();
    const a=moving?ts*.000035:1.9,v=new T.Vector3(Math.sin(a),.23,Math.cos(a)).normalize();train.position.copy(v).multiplyScalar(R+.24);train.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(Math.sin(a),0,Math.cos(a)).cross(new T.Vector3(0,1,0)).normalize(),v,new T.Vector3().crossVectors(new T.Vector3(Math.cos(a),0,-Math.sin(a)),v).normalize()));
    renderer.render(scene,camera);host.dataset.viewStable=String(target.distanceTo(wantedTarget)<.03&&Math.abs(extent-wantedExtent)<.03&&Math.abs(azimuth-wantedAzimuth)<.01&&camera.position.distanceTo(desiredPosition)<.03);host.dataset.planetShape='sphere';host.dataset.renderRevision='20260913-runtime-1';host.dataset.neighborhoodBuildings=String(homes+places.length);host.dataset.buildingFamilies=String(families.size);host.dataset.cameraMode=selected?(streetLevel?'street':'exhibit'):'orbit';host.dataset.cameraDistance=distance.toFixed(2);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.exhibitObjects=String(objects.length);
    const tagView=`${selected?.id||''}:${streetLevel}`;
    if((ts-lastTags>140||reduced.matches||tagView!==lastTagView||width!==lastTagWidth||height!==lastTagHeight)&&(tagView!==lastTagView||width!==lastTagWidth||height!==lastTagHeight||Math.abs(camera.fov-lastTagFov)>.01||camera.position.distanceToSquared(tagCameraPosition)>.00001||camera.quaternion.angleTo(tagCameraRotation)>.001)){
      lastTags=ts;lastTagView=tagView;lastTagWidth=width;lastTagHeight=height;lastTagFov=camera.fov;tagCameraPosition.copy(camera.position);tagCameraRotation.copy(camera.quaternion);const tags=[];for(const item of objects){
      let visible=streetLevel&&selected?.id==='workshop';const point=item.g.localToWorld(item.point.clone()),projected=point.clone().project(camera);
      visible=visible&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.86&&Math.abs(projected.y)<.82;
      if(visible){const direction=point.clone().sub(camera.position),distance=direction.length();ray.set(camera.position,direction.normalize());const front=ray.intersectObjects(solidMeshes,false)[0];visible=!front||front.distance>=distance-.10;}
      item.button.hidden=!visible;if(visible)tags.push({el:item.button,anchorX:(projected.x+1)*width/2,y:(1-projected.y)*height/2+20,w:item.button.offsetWidth});
    }
      tags.sort((a,b)=>a.anchorX-b.anchorX);
      const crowded=tags.some((t,i)=>i&&t.anchorX-tags[i-1].anchorX<(t.w+tags[i-1].w)/2+8);
      const span=tags.reduce((sum,t)=>sum+t.w,0)+Math.max(0,tags.length-1)*8;
      let cursor=T.MathUtils.clamp(tags.reduce((sum,t)=>sum+t.anchorX,0)/Math.max(1,tags.length)-span/2,12,width-span-12);
      for(const tag of tags){tag.x=crowded?cursor+tag.w/2:T.MathUtils.clamp(tag.anchorX,tag.w/2+12,width-tag.w/2-12);cursor+=tag.w+8;}
      const y=Math.max(0,...tags.map(t=>t.y));
      for(const tag of tags){tag.el.style.left=`${tag.x}px`;tag.el.style.top=`${y}px`;tag.el.style.setProperty('--stem-x',`${T.MathUtils.clamp(tag.anchorX-tag.x+tag.w/2,8,tag.w-8)}px`);tag.el.style.setProperty('--stem-height',`${19+y-tag.y}px`);}
    }
    if(signsNeedLayout||signView!==tagView||width!==signWidth||height!==signHeight||Math.abs(camera.fov-signFov)>.00001||camera.position.distanceToSquared(signCameraPosition)>.000001||camera.quaternion.angleTo(signCameraRotation)>.0001){
      signsNeedLayout=false;signView=tagView;signWidth=width;signHeight=height;signFov=camera.fov;signCameraPosition.copy(camera.position);signCameraRotation.copy(camera.quaternion);host.dataset.signLayoutPasses=String(++signLayoutPasses);
      const visible=[];for(const {p,el} of signs){const anchor=anchors.get(p.id).position.clone(),normal=anchor.clone().normalize();const facing=normal.dot(camera.position.clone().sub(anchor).normalize());const pos=anchor.addScaledVector(normal,2.1).project(camera);const show=(!selected||selected.id===p.id)&&facing>.08&&Math.abs(pos.x)<.96&&Math.abs(pos.y)<.94;el.hidden=!show;if(show)visible.push({el,x:(pos.x+1)*.5*width,y:(1-pos.y)*.5*height,w:el.offsetWidth});}visible.sort((a,b)=>a.y-b.y);for(let i=0;i<visible.length;i++){const s=visible[i];for(let j=0;j<i;j++){const o=visible[j];if(Math.abs(s.x-o.x)<(s.w+o.w)/2+8&&s.y-o.y<49)s.y=o.y+49}s.el.style.left=`${T.MathUtils.clamp(s.x,55,width-55)}px`;s.el.style.top=`${T.MathUtils.clamp(s.y,30,height-30)}px`;}
    }
    if(first){first=false;performance.mark('planet:first-render');host.parentElement.classList.add('world-ready');host.dispatchEvent(new Event('planet:first-render'))}
    if(!moving&&reduced.matches)dirty=0;
  }
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);document.body.classList.add('no-world');document.getElementById('directory').classList.add('is-open');document.getElementById('announcement').textContent='立体表示が中断しました。目録から作品を開けます。'});
  resize();frame=requestAnimationFrame(render);
  return {
    visit(p){selected=p;streetLevel=false;wantedAzimuth=.12;setVisitTarget()},
    setStreet(value){if(!selected)return;streetLevel=value;const limit=yawLimit();wantedAzimuth=T.MathUtils.clamp(wantedAzimuth,-limit,limit);setVisitTarget()},
    overview(){selected=null;streetLevel=false;wantedAzimuth=-.03;wantedUp.set(0,1,0);wantedTarget.set(0,.45,0);wantedExtent=26;wantedElevation=.87;dirty=150},
    rotate(delta){const limit=yawLimit();wantedAzimuth=selected?T.MathUtils.clamp(wantedAzimuth+delta,-limit,limit):wantedAzimuth+delta;dirty=120},
    setMotion(value){moving=value;dirty=120}
  };
}
