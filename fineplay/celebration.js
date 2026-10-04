/* Display-only effects. No state/engine/network hooks; caller supplies public honors. */
(()=>{'use strict';
 const NS='http://www.w3.org/2000/svg',tiers=['normal','super','ultra','hundred'];
 const hand='M21 52 12 26Q10 20 15 18 20 16 22 23L29 43 28 36Q28 31 33 31 38 31 38 36V44 34Q38 29 43 29 48 29 48 34V42 12Q48 6 54 6 60 6 60 12V47L74 33Q78 29 82 33 85 37 81 41L67 61Q62 77 45 77 27 77 23 64Z';
 const diamond='m77 7 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z';
 function svgNode(tag,attrs={}){const node=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
 function createIcon({tier='normal',stars=1,label}={}){
  if(!tiers.includes(tier))throw new TypeError('Unknown celebration tier');
  if(!Number.isInteger(stars)||stars<1||stars>3)throw new TypeError('Normal stars must be 1–3');
  const icon=svgNode('svg',{viewBox:'0 0 96 96',class:'fp-celebration-icon','data-tier':tier,focusable:'false',fill:'none',stroke:'currentColor','stroke-width':tier==='super'?4:6,'stroke-linejoin':'round','stroke-linecap':'round'});
  if(label){icon.setAttribute('role','img');const title=svgNode('title');title.textContent=label;icon.append(title);}else icon.setAttribute('aria-hidden','true');
  if(tier==='super'){icon.append(svgNode('path',{d:'M48 7Q55 41 89 48Q55 55 48 89Q41 55 7 48Q41 41 48 7Z',fill:'#c7a34a'}));return icon;}
  icon.append(svgNode('path',{d:hand,fill:'#fffaf0'}),svgNode('path',{d:'M29 43Q34 49 38 44M38 44Q43 49 48 42M38 59Q47 52 56 57'}));
  if(tier!=='normal'){
   icon.append(svgNode('path',{d:'M10 58Q7 78 24 88M70 69Q80 61 88 43','stroke-width':3}));
   for(const [x,y,s]of(tier==='ultra'?[[3,66,.4],[10,51,.35],[-4,19,.55]]:[[3,66,.4]]))icon.append(svgNode('path',{d:diamond,transform:`translate(${x} ${y}) scale(${s})`,'stroke-width':5}));
  }
  return icon;
 }
 function crowd(tier){
  const width=Math.max(320,Math.min(1440,window.innerWidth)),count=Math.min(tier==='ultra'?22:12,Math.floor(width/(tier==='ultra'?35:52)));
  const svg=svgNode('svg',{viewBox:`0 0 ${width} 160`,preserveAspectRatio:'none',class:'fp-celebration-crowd','aria-hidden':'true'});
  for(let i=0;i<count;i++){
   const x=7+i*((width-35)/(count-1)),y=12+(i*29%43),height=54+(i*17%34);
   const g=svgNode('g',{transform:`translate(${x} ${y}) rotate(${i%2?9:-9} 15 70)`,fill:i%3===0?'#587767':i%3===1?'#294c3d':'#456c58',stroke:'#fffaf0','stroke-width':1.2});
   g.append(svgNode('path',{d:`M2 160V${height}L-12 14Q-15 7-11 4Q-7 1-5 8L6 35 5 8Q5 2 9 2Q14 2 14 8L17 30 20 2Q21-4 25-3Q30-2 29 4L27 32 35 11Q37 5 41 7Q45 9 42 15L33 44Q32 53 26 58L34 160Z`}));
   svg.append(g);svg.append(svgNode('circle',{cx:x+22,cy:177+(i%3)*4,r:24,fill:i%2?'#294c3d':'#456c58'}));
  }
  return svg;
 }
 function render(honor,staticOnly){
  if(window.FinePlayMotion)return window.FinePlayMotion.create(honor,staticOnly);
  const tier=honor.visibleEffect,layer=document.createElement('div');layer.className='fp-celebration-layer';layer.dataset.tier=tier;layer.dataset.static=String(staticOnly);layer.setAttribute('aria-hidden','true');
  const chip=document.createElement('div');chip.className='fp-celebration-chip';chip.append(createIcon({tier,stars:honor.stars||1}));const label=document.createElement('span');label.textContent=tier==='ultra'?'ULTRA FINEPLAY!':tier==='super'?'SUPER FINEPLAY!':'FINEPLAY!';chip.append(label);layer.append(chip);
  if(tier!=='normal'&&!staticOnly){
   for(let i=0;i<4;i++){const beam=document.createElement('i');beam.className='fp-celebration-light';beam.style.left=`${10+i*25}%`;beam.style.transform=`rotate(${i%2?25:-25}deg)`;layer.append(beam);}
   layer.append(crowd(tier));
   const count=tier==='ultra'?52:24,palette=['#d3ad59','#fffaf0','#75a88b','#cb879f'];
   for(let i=0;i<count;i++){
    const p=document.createElement('i');p.className='fp-celebration-particle';
    // Edge-biased positions keep the middle question/input area readable.
    const edge=i%2===0,x=edge?4+(i*7%22):74+(i*7%22),y=18+(i*11%48);
    const vars={x:`${x}%`,y:`${y}%`,color:palette[i%4],delay:`${i%7*15}ms`,dx:`${(edge?1:-1)*(20+i*13%90)}px`,dy:`${100+i*19%170}px`,spin:`${(i%2?1:-1)*(120+i*23%360)}deg`};
    for(const[k,v]of Object.entries(vars))p.style.setProperty('--'+k,v);layer.append(p);
   }
  }
  document.body.append(layer);return layer;
 }
 function create({admitHonor,readAudioPreferences,playSound,announce}={}){
  let live=false,paused=false,disposed=false,active=null,activeHonor=null,pending=null,coalesceTimer=null,expiryTimer=null,lastSound=-Infinity;
  const seen=new Set(),media=window.matchMedia('(prefers-reduced-motion: reduce)'),rank={normal:0,super:1,ultra:2,hundred:3};
  const stats={accepted:0,rejected:0,duplicate:0,coalesced:0,shown:0,sound:0,audioUnavailable:0};
  const validString=x=>typeof x==='string'&&x.length>0&&x.length<=256;
  const validTarget=t=>validString(t)||(t&&['question','topic'].includes(t.scope)&&validString(t.roundId)&&validString(t.rewardId)&&validString(t.recipientId)&&(t.scope==='topic'?t.entryId===null:validString(t.entryId)));
  function clear(){if(coalesceTimer!==null)clearTimeout(coalesceTimer);if(expiryTimer!==null)clearTimeout(expiryTimer);coalesceTimer=expiryTimer=null;pending=null;active?._stop?.();active?.remove();active=activeHonor=null;}
  function audio(tier){
   if(typeof readAudioPreferences!=='function'||typeof playSound!=='function'||performance.now()-lastSound<1500)return;
   try{const p=readAudioPreferences();if(p?.enabled!==true||p.muted!==false||!Number.isFinite(p.volume)||p.volume<=0||p.volume>1)return;
    lastSound=performance.now();const result=playSound({tier,volume:p.volume});stats.sound++;if(result&&typeof result.catch==='function')result.catch(()=>{stats.audioUnavailable++;});
   }catch{stats.audioUnavailable++;}
  }
  function flush(){
   coalesceTimer=null;if(!live||disposed||document.hidden||!pending){pending=null;return;}
   const honor=pending;pending=null;activeHonor=honor;active=render(honor,media.matches);stats.shown++;
   try{announce?.(honor.visibleEffect==='ultra'?'Ultra FinePlay!':honor.visibleEffect==='super'?'Super FinePlay!':'FinePlay!');}catch{}
   audio(honor.visibleEffect);
   expiryTimer=setTimeout(()=>{expiryTimer=null;active?._stop?.();active?.remove();active=activeHonor=null;if(pending&&live&&!disposed&&!document.hidden)coalesceTimer=setTimeout(flush,100);},active?._lifetime||(media.matches?1000:honor.visibleEffect==='normal'?850:1350));
  }
  function dispatchHonor(honor){
   if(disposed||!live||paused||document.hidden||typeof admitHonor!=='function'||!honor||typeof honor.eventId!=='string'||!honor.eventId||honor.eventId.length>1024||!validTarget(honor.target)||!tiers.includes(honor.visibleEffect)||(honor.stars!==undefined&&(!Number.isInteger(honor.stars)||honor.stars<1||honor.stars>3))){stats.rejected++;return false;}
   let admitted=false;try{admitted=admitHonor(honor)===true;}catch{}if(!admitted){stats.rejected++;return false;}
   if(seen.has(honor.eventId)){stats.duplicate++;return false;}
   // Fail closed at the bounded dedupe capacity; never evict an ID and replay it.
   if(seen.size>=12000){stats.rejected++;return false;}seen.add(honor.eventId);stats.accepted++;
   const t=honor.target,safe={eventId:honor.eventId,target:typeof t==='string'?t:{scope:t.scope,roundId:t.roundId,rewardId:t.rewardId,entryId:t.entryId,recipientId:t.recipientId},visibleEffect:honor.visibleEffect,stars:honor.stars};
   if(pending){stats.coalesced++;if(rank[safe.visibleEffect]>=rank[pending.visibleEffect])pending=safe;}else pending=safe;
   if(!active&&coalesceTimer===null)coalesceTimer=setTimeout(flush,90);return true;
  }
  // Admission may pause during a same-connection state transfer. Already
  // admitted public motion (including its pending cue) keeps its original clock.
  function pauseAdmission(){paused=true;}
  function cancelWhere(test){
   if(typeof test!=='function')return;
   if(pending&&test(pending))pending=null;
   if(activeHonor&&test(activeHonor)){if(expiryTimer!==null)clearTimeout(expiryTimer);expiryTimer=null;active?._stop?.();active?.remove();active=activeHonor=null;}
   if(!pending&&coalesceTimer!==null){clearTimeout(coalesceTimer);coalesceTimer=null;}
   if(pending&&!active&&coalesceTimer===null&&live&&!disposed&&!document.hidden)coalesceTimer=setTimeout(flush,100);
  }
  function suspend(){live=false;paused=false;clear();}
  function resume(){if(!disposed){live=true;paused=false;}}
  function resetBaseline(){suspend();seen.clear();}
  function visibility(){if(document.hidden)suspend();}
  function motionChange(){if(media.matches&&active){active.dataset.static='true';active._reduce?.();active.querySelectorAll('.fp-celebration-crowd,.fp-celebration-light,.fp-celebration-particle').forEach(e=>e.remove());}}
  document.addEventListener('visibilitychange',visibility);media.addEventListener('change',motionChange);
  function dispose(){if(disposed)return;suspend();disposed=true;seen.clear();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motionChange);}
  return Object.freeze({dispatchHonor,pauseAdmission,cancelWhere,suspend,resume,resetBaseline,dispose,inspect:()=>({...stats,live,paused,disposed,seen:seen.size,active:!!active,pending:!!pending,timers:Number(coalesceTimer!==null)+Number(expiryTimer!==null)})});
 }
 const CONTRACT='fineplay-fp/3',CONTRACTS=Object.freeze(['fineplay-fp/1','fineplay-fp/2',CONTRACT]),RULE='distinct-donors/1';
 function publicView(v){return v?.locked===false&&v.hidden===false&&((v.mode==='live'&&v.playMode==='cooperative')||v.phase==='solved'||v.phase==='passed');}
 function targetKey(t){return JSON.stringify([t.roundId,t.scope,t.rewardId]);}
 function sameTarget(a,b){return a&&b&&a.scope===b.scope&&a.roundId===b.roundId&&a.rewardId===b.rewardId&&a.entryId===b.entryId&&a.recipientId===b.recipientId;}
 function sourceEvents(v,resolveFPEvents){
  if(!CONTRACTS.includes(v?.fpContractVersion)||v.fpRuleVersion!==RULE||!Array.isArray(v.fpEvents)||v.fpEvents.length>2761||!Array.isArray(v.entries)||v.entries.length>250)return null;
  if(v.fpContractVersion===CONTRACT&&(!Array.isArray(v.fpEventTargets)||v.fpEventTargets.length>251))return null;
  let expanded;
  try{const resolver=resolveFPEvents||window.FPRules?.resolveFPEvents;
   if(typeof resolver==='function')expanded=resolver(v);
   else if(v.fpContractVersion!==CONTRACT)expanded=v.fpEvents;
   else return null;
  }catch{return null;}
  if(!Array.isArray(expanded)||expanded.length>2761)return null;
  if(!publicView(v))return [];
  const targets=new Map();if(v.problem?.honors?.target)targets.set(targetKey(v.problem.honors.target),v.problem.honors);
  for(const e of v.entries)if(e.kind==='question'&&e.honors?.target&&e.honors.target.entryId===e.id)targets.set(targetKey(e.honors.target),e.honors);
  const result=[],ids=new Set(),str=x=>typeof x==='string'&&x.length>0&&x.length<=256;
  for(const e of expanded){
   const t=e?.target;if(!t||!str(t.roundId)||t.roundId!==v.roundId||!str(t.rewardId)||!str(t.recipientId)||!['question','topic'].includes(t.scope)||(t.scope==='topic'?t.entryId!==null:!str(t.entryId)))return null;
   const h=targets.get(targetKey(t));
   if(!h||!sameTarget(h.target,t)||e.contractVersion!==v.fpContractVersion||e.reveal!=='public'||!['super','ultra'].includes(e.stage)||!Number.isInteger(e.donorCount)||!Number.isInteger(e.eligibleDonorCount)||e.eligibleDonorCount<2||e.eligibleDonorCount>11||e.donorCount<2||e.donorCount>e.eligibleDonorCount||e.donorCount!==h.donorCount||e.eligibleDonorCount!==h.eligibleDonorCount||e.totalBonus!==h.bonusPoints)return null;
   if(e.stage==='super'?!(Number.isInteger(e.threshold)&&e.threshold>=2&&e.threshold<=e.donorCount&&e.amount===5&&h.super===true):!(e.threshold===e.eligibleDonorCount&&e.donorCount===e.eligibleDonorCount&&e.amount===20&&h.ultra===true))return null;
   if(e.id!=='fp1:'+JSON.stringify([t.roundId,t.scope,t.rewardId,e.stage,e.threshold])||ids.has(e.id)||e.id.length>1024)return null;
   ids.add(e.id);result.push({eventId:e.id,target:{scope:t.scope,roundId:t.roundId,rewardId:t.rewardId,entryId:t.entryId,recipientId:t.recipientId},visibleEffect:e.stage});
  }
  return result;
 }
 // No voter identity or hidden score is inferred. Normal cues are derived only
 // from increases between two confirmed public aggregate projections.
 function normalTargets(v){
  const result=new Map();if(!publicView(v))return result;
  const str=x=>typeof x==='string'&&x.length>0&&x.length<=256;
  const add=(h,scope,entryId,recipientId)=>{
   const t=h?.target;
   if(!t||t.scope!==scope||t.entryId!==entryId||t.recipientId!==recipientId||t.roundId!==v.roundId||!str(t.roundId)||!str(t.rewardId)||!str(t.recipientId)||(scope==='question'&&!str(t.entryId))||!Number.isInteger(h.eligibleDonorCount)||h.eligibleDonorCount<0||h.eligibleDonorCount>11||!Number.isInteger(h.donorCount)||h.donorCount<0||h.donorCount>h.eligibleDonorCount||!Number.isInteger(h.normalStars)||h.normalStars<h.donorCount||h.normalStars>3*h.donorCount||h.normalPoints!==h.normalStars)return false;
   const key=targetKey(t);if(result.has(key))return false;
   result.set(key,{target:{scope:t.scope,roundId:t.roundId,rewardId:t.rewardId,entryId:t.entryId,recipientId:t.recipientId},stars:h.normalStars});return true;
  };
  if(!add(v.problem?.honors,'topic',null,v.presenter))return null;
  for(const e of v.entries)if(e.kind==='question'&&!add(e.honors,'question',e.id,e.asker))return null;
  return result;
 }
 function createViewController({resolveFPEvents,readAudioPreferences,playSound,announce}={}){
  let topic='',identity='',revision=-1,needsBaseline=true,wasPublic=false,disposed=false,admitted=null,currentIds=new Set(),normals=new Map(),applauseTotal=0;
  const seen=new Set(),stats={baselines:0,observations:0,stale:0,invalid:0,events:0,normalEvents:0,transferPauses:0};
  const effects=create({admitHonor:h=>h===admitted,readAudioPreferences,playSound,announce});
  function suspend(){needsBaseline=true;effects.suspend();}
  function observe(v,{ready=false,viewKey,baseline=false,transient=false}={}){
   stats.observations++;
   if(disposed)return {status:'disposed',accepted:0};
   if(document.hidden){suspend();return {status:'suspended',accepted:0};}
   // Incomplete transfers are common between confirmed views, not reconnects.
   // Explicit suspend()/baseline:true identifies a reconnect and reseeds silently.
   if(!ready){const same=v&&JSON.stringify([v.owner,v.roundId])===topic&&JSON.stringify([viewKey,v.you,v.locked,v.hidden])===identity&&publicView(v)===wasPublic;if(transient&&same&&!baseline&&!needsBaseline){stats.transferPauses++;effects.pauseAdmission();return {status:'transfer-paused',accepted:0};}suspend();return {status:'suspended',accepted:0};}
   if(!v||typeof viewKey!=='string'||!viewKey||viewKey.length>512||typeof v.owner!=='string'||!v.owner||typeof v.roundId!=='string'||!v.roundId||!Number.isSafeInteger(v.rev)||v.rev<0||typeof v.you!=='string'||typeof v.locked!=='boolean'||typeof v.hidden!=='boolean'){
    stats.invalid++;suspend();return {status:'invalid',accepted:0};
   }
   const nextTopic=JSON.stringify([v.owner,v.roundId]);
   const changedTopic=nextTopic!==topic;
   if(v.rev<revision){stats.stale++;return {status:'stale',accepted:0};}
   const events=sourceEvents(v,resolveFPEvents);
   if(events===null){stats.invalid++;suspend();return {status:'unsupported-or-invalid',accepted:0};}
   const nextNormals=normalTargets(v);
   if(nextNormals===null){stats.invalid++;suspend();return {status:'unsupported-or-invalid',accepted:0};}
   if(changedTopic){topic=nextTopic;identity='';revision=-1;seen.clear();currentIds.clear();normals.clear();effects.resetBaseline();needsBaseline=true;}
   const nextIdentity=JSON.stringify([viewKey,v.you,v.locked,v.hidden]),pub=publicView(v),boundary=baseline||needsBaseline||nextIdentity!==identity||pub!==wasPublic;
   if(!boundary&&v.rev===revision){stats.stale++;if(pub)effects.resume();return {status:'stale',accepted:0};}
   if(boundary){
    effects.suspend();
    for(const e of events){if(seen.size>=12000&&!seen.has(e.eventId)){stats.invalid++;return {status:'capacity',accepted:0};}seen.add(e.eventId);}
    identity=nextIdentity;revision=v.rev;wasPublic=pub;needsBaseline=false;currentIds=new Set(events.map(e=>e.eventId));normals=nextNormals;applauseTotal=Number.isSafeInteger(v.applause?.total)?v.applause.total:0;stats.baselines++;
    if(pub)effects.resume();return {status:'baseline',accepted:0};
   }
   identity=nextIdentity;revision=v.rev;wasPublic=pub;
   const nextIds=new Set(events.map(e=>e.eventId));
   const removed=new Set([...currentIds].filter(id=>!nextIds.has(id))),decreased=new Set([...normals].filter(([key,n])=>!nextNormals.has(key)||nextNormals.get(key).stars<n.stars).map(([key])=>key));
   effects.cancelWhere(h=>removed.has(h.eventId)||!nextNormals.has(targetKey(h.target))||(h.visibleEffect==='normal'&&decreased.has(targetKey(h.target))));
   currentIds=nextIds;
   if(!pub){normals=nextNormals;effects.suspend();return {status:'private',accepted:0};}
   effects.resume();let accepted=0;
   const advanced=new Set(events.filter(e=>!seen.has(e.eventId)).map(e=>targetKey(e.target))),normalEvents=[];
   for(const[key,n]of nextNormals){const previous=normals.get(key);if(previous&&n.stars>previous.stars&&!advanced.has(key))normalEvents.push({eventId:'fp-normal:'+JSON.stringify([n.target.roundId,n.target.scope,n.target.rewardId,v.rev]),target:n.target,visibleEffect:'normal',stars:Math.min(3,n.stars-previous.stars)});}
   const nextApplause=Number.isSafeInteger(v.applause?.total)&&v.applause.total>=0&&v.applause.total<=1200?v.applause.total:0;
   const applauseEvents=[];
   if((v.phase==='solved'||v.phase==='passed')&&nextApplause>applauseTotal){const hundred=applauseTotal<100&&nextApplause>=100;applauseEvents.push({eventId:hundred?'fp-hundred:'+JSON.stringify([v.roundId]):'fp-applause:'+JSON.stringify([v.roundId,v.applauseId,v.rev]),target:v.problem.honors.target,visibleEffect:hundred?'hundred':'normal'});}
   applauseTotal=nextApplause;normals=nextNormals;
   for(const e of [...events,...normalEvents,...applauseEvents]){
    if(seen.has(e.eventId))continue;
    if(seen.size>=12000){effects.suspend();needsBaseline=true;stats.invalid++;return {status:'capacity',accepted};}
    seen.add(e.eventId);
    // Only the normalized command from this confirmed view can pass admission.
    admitted={eventId:e.eventId,target:e.target,visibleEffect:e.visibleEffect,...(e.stars?{stars:e.stars}:{})};
    if(effects.dispatchHonor(admitted)){accepted++;stats.events++;if(e.visibleEffect==='normal')stats.normalEvents++;}admitted=null;
   }
   return {status:'live',accepted};
  }
  function visibility(){if(document.hidden)suspend();}
  document.addEventListener('visibilitychange',visibility);
  function dispose(){if(disposed)return;suspend();disposed=true;seen.clear();currentIds.clear();normals.clear();effects.dispose();document.removeEventListener('visibilitychange',visibility);}
  return Object.freeze({observe,suspend,dispose,inspect:()=>({...stats,revision,seen:seen.size,needsBaseline,disposed,effects:effects.inspect()})});
 }
 window.FinePlayCelebration=Object.freeze({version:5,contractVersion:CONTRACT,supportedContractVersions:CONTRACTS,createIcon,create,createViewController});
})();
