/* Artwork/motion port from received revision-manifest; game state remains authoritative. */
(()=>{'use strict';
const hand=new Image(),sign=new Image();hand.src='assets/motion/hand.png';sign.src='assets/motion/fineplay-sign.svg';
const GOLD='#c7a34a',random=(a,z)=>a+Math.random()*(z-a),clamp=(x,a=0,z=1)=>Math.max(a,Math.min(z,x));
function diamond(c,x,y,s,color){c.save();c.translate(x,y);c.fillStyle=color;c.beginPath();c.moveTo(0,-s);c.bezierCurveTo(s*.21,-s*.21,s*.21,-s*.21,s,0);c.bezierCurveTo(s*.21,s*.21,s*.21,s*.21,0,s);c.bezierCurveTo(-s*.21,s*.21,-s*.21,s*.21,-s,0);c.bezierCurveTo(-s*.21,-s*.21,-s*.21,-s*.21,0,-s);c.fill();c.restore()}

function create(honor,staticOnly){
 const layer=document.createElement('div');layer.className='fp-celebration-layer';layer.dataset.tier=honor.visibleEffect;layer.dataset.static=String(staticOnly);layer.setAttribute('aria-hidden','true');
 const front=document.createElement('canvas');front.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none';layer.style.cssText='position:fixed;inset:0;z-index:10000;pointer-events:none;overflow:hidden';layer.append(front);document.body.append(layer);
 let W=720,H=1000,particles=[],eventId=1,raf=0,frames=0,last=0;const reduce={checked:staticOnly},f=front.getContext('2d'),started=performance.now();
 function add(p){p.id=eventId;p.start=performance.now()+(p.delay||0);particles.push(p)}
function stamp(x,y,scale=1,delay=0,drift=0,symbol='hand'){add({kind:'stamp',x,y,scale,delay,drift,symbol,rot:random(-.2,.2),life:1320});}
function confetti(n,power){for(let i=0;i<n;i++)add({kind:'confetti',x:random(120,600),y:random(H*.63,H*.71),vx:random(-.27,.27)*power,vy:random(-.59,-.32)*power,gravity:.00046,rotation:random(0,6.28),spin:random(-.012,.012),color:['#c9a448','#f1d991','#94a47e','#d9ddc2','#f4e5b0'][i%5],size:random(5,12),life:random(1600,2450),delay:random(60,430)});}
function crowd(n,power){for(let i=0;i<n;i++){const x=50+(W-100)*(i/(n-1||1));add({kind:'hands',x,y:H+75,size:random(158,200)*power,life:2100+power*140,delay:i*72,tilt:(x-W/2)*.0006,phase:random(0,Math.PI)});}}

 function stampDraw(c,p,a){const u=a/p.life;const rise=1-Math.pow(1-clamp(a/1000),2.6);const x=p.x+p.drift*rise,y=p.y-110*rise+Math.pow(clamp((a-750)/570),2)*24;const s=a<230?1+Math.exp(-a/77)*-Math.cos(a/43):1;const alpha=u>.74?1-(u-.74)/.26:1;c.save();c.translate(x,y);c.rotate(p.rot*Math.sin(u*Math.PI));c.scale(p.scale*s,p.scale*s);c.globalAlpha=clamp(alpha);c.shadowColor='#9c76253d';c.shadowBlur=15;c.shadowOffsetY=5;if(p.symbol==='star'){diamond(c,0,0,53,'#fffaf0');c.shadowBlur=0;diamond(c,0,0,42,GOLD)}else if(sign.complete){c.shadowBlur=12;c.drawImage(sign,-68,-68,136,136)}c.restore();}
function handsDraw(c,p,a){if(!hand.complete)return;const u=a/p.life;const entry=1-Math.pow(1-clamp(a/420),3),exit=Math.pow(clamp((u-.68)/.32),2);const y=p.y-(p.size*.89)*entry+(p.size*1.05)*exit;const beat=Math.sin(a*.019+p.phase),clap=beat*9;const bounce=Math.sin(a*.012+p.phase)*6;c.save();c.translate(p.x,y+bounce);c.rotate(p.tilt);c.globalAlpha=clamp((1-u)*8);const width=p.size*.66,h=p.size;for(const side of [-1,1]){c.save();c.translate(side*(20+clap),0);c.rotate(side*(.17+beat*.075));c.scale(side,1);c.drawImage(hand,-width*.48,-h*.9,width,h);c.restore()}c.restore();}
function foregroundDraw(t){f.clearRect(0,0,W,H);particles=particles.filter(p=>t-p.start<p.life);for(const p of particles){const a=t-p.start;if(a<0)continue;const u=a/p.life;if(p.kind==='stamp')stampDraw(f,p,a);else if(p.kind==='hands')handsDraw(f,p,a);else if(p.kind==='confetti'){const x=p.x+p.vx*a,y=p.y+p.vy*a+.5*p.gravity*a*a;f.save();f.translate(x,y);f.rotate(p.rotation+a*p.spin);f.scale(Math.cos(a*.009+p.rotation),1);f.globalAlpha=clamp((1-u)*4);f.fillStyle=p.color;f.fillRect(-p.size/2,-p.size/4,p.size,p.size*.5);f.restore()}else if(p.kind==='ring'){f.save();f.globalAlpha=(1-u)*.65;f.strokeStyle='#d4b366';f.lineWidth=(1-u)*3;f.beginPath();f.ellipse(p.x,p.y,55+u*310,18+u*155,0,0,Math.PI*2);f.stroke();f.restore()}else if(p.kind==='quiet'){f.globalAlpha=Math.sin(u*Math.PI);if(p.effect==='super')diamond(f,p.x,p.y,17,GOLD);else if(sign.complete)f.drawImage(sign,p.x-26,p.y-28,52,52);f.globalAlpha=1}}}

 function resize(){const ratio=Math.min(devicePixelRatio||1,2);front.width=Math.round(innerWidth*ratio);front.height=Math.round(innerHeight*ratio);H=innerHeight/(innerWidth/W);f.setTransform(front.width/W,0,0,front.width/W,0,0);}
 resize();
 const kind=honor.visibleEffect;
 if(staticOnly)add({kind:'quiet',effect:kind,life:1000,x:360,y:H*.46});
 else if(kind==='normal'){stamp(360,H*.53,.78,0,random(-55,55));stamp(220,H*.62,.50,120,-65);stamp(500,H*.64,.45,250,55);confetti(7,.55)}
 else if(kind==='super'){stamp(350,H*.53,1.05,0,-60,'star');stamp(487,H*.605,.75,130,84,'star');stamp(209,H*.633,.62,255,-65,'star');crowd(4,.8);confetti(54,.85)}
 else{stamp(360,H*.55,1.42);stamp(183,H*.615,.85,175,-85);stamp(529,H*.627,.86,320,73);stamp(291,H*.746,.64,440,-69);stamp(485,H*.782,.58,555,47);crowd(6,1.05);confetti(kind==='hundred'?125:98,1.06);add({kind:'ring',x:360,y:H*.568,life:850})}
 // The foreground must not paint over editable text, including the lower edge
 // after scroll, resize, focus changes or a remote render replaces the input.
 function protect(){const sx=front.width/innerWidth,sy=front.height/innerHeight,rects=[];f.save();f.setTransform(1,0,0,1,0,0);for(const e of document.querySelectorAll('input,textarea,select,[contenteditable="true"],.modal button,.attrs-fp-palette[open] .attrs-fp-options')){const r=e.getBoundingClientRect();if(r.width&&r.height&&r.bottom>0&&r.top<innerHeight){const a={x:r.left-8,y:r.top-8,w:r.width+16,h:r.height+16};f.clearRect(a.x*sx,a.y*sy,a.w*sx,a.h*sy);rects.push(a)}}f.restore();layer._protectedRects=rects;}
 function frame(t){if(!layer.isConnected)return;foregroundDraw(t);protect();frames++;layer.dataset.frames=String(frames);layer.dataset.elapsed=String(Math.round(t-started));layer.dataset.active=String(particles.length);layer.dataset.clock=String(t);layer.dataset.monotonic=String(t>=last);last=t;raf=requestAnimationFrame(frame)}
 layer._stop=()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)};layer._reduce=()=>{particles=[{kind:'quiet',effect:kind,life:1000,x:360,y:H*.46,start:performance.now()}];layer.dataset.static='true'};
 layer._lifetime=staticOnly?1000:2900;window.addEventListener('resize',resize);raf=requestAnimationFrame(frame);return layer;
}
window.FinePlayMotion=Object.freeze({create});})();
