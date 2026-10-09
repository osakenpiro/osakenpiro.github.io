/* Browser-local audio only. Call enqueue only from confirmed, role-filtered views. */
(()=>{'use strict';
 const KINDS=['question','correct','incorrect','fineplay','applause','comment'];
 const KEY='fineplay:online:v2:sound',LEGACY=['fineplay:online:v3:feedback-look','fineplay:online:v2:feedback-look'];
 // No synthetic stand-ins for recorded humans. Fill only after license review.
 const SAMPLES={correct:'assets/audio/correct.wav',applause:'assets/audio/applause.wav'};
 const PRIORITY={correct:6,fineplay:5,applause:4,incorrect:3,question:2,comment:1};
 let preferences={version:2,master:false,volume:.4,events:Object.fromEntries(KINDS.map(k=>[k,true]))};
 let storageError=null,audioError=null,ctx=null,output=null,unlocked=false,timer=null,round=null,generation=0;
 const listeners=new Set(),queue=new Map(),seen=new Set(),voices=new Set(),buffers=new Map(),kindEpoch=Object.fromEntries(KINDS.map(k=>[k,0]));
 const clamp=x=>Math.max(0,Math.min(1,x));
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved?.version===2){
   if(typeof saved.master==='boolean')preferences.master=saved.master;
   if(Number.isFinite(saved.volume))preferences.volume=clamp(saved.volume);
   for(const k of KINDS)if(typeof saved.events?.[k]==='boolean')preferences.events[k]=saved.events[k];
  }else{
   for(const key of LEGACY){
    const old=JSON.parse(localStorage.getItem(key)||'null');
    if(Number.isFinite(old?.volume)&&old.volume>=0&&old.volume<=30){preferences.volume=old.volume/30;break;}
   }
  }
 }catch{storageError='STORAGE_READ_FAILED';}
 const supported=()=>typeof(window.AudioContext||window.webkitAudioContext)==='function';
 function getSnapshot(){return {preferences:{...preferences,events:{...preferences.events}},status:!preferences.master?'off':!supported()||ctx?.state==='closed'?'unavailable':unlocked&&ctx?.state==='running'?'ready':'suspended',error:audioError||storageError};}
 function notify(){for(const fn of listeners)try{fn(getSnapshot());}catch{}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(preferences));storageError=null;}catch{storageError='STORAGE_WRITE_FAILED';}notify();}
 function stopVoice(v){
  if(v.stopping)return;v.stopping=true;
  try{
   const t=ctx.currentTime,p=v.gain.gain;
   p.cancelScheduledValues(t);
   // Cancel admission immediately; let the current waveform end over 10 ms.
   if(ctx.state==='running'&&typeof p.linearRampToValueAtTime==='function'){
    p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(0,t+.010);v.source.stop(t+.012);return;
   }
   p.setValueAtTime(0,t);v.source.stop();
  }catch{}
  voices.delete(v);try{v.source.disconnect();v.gain.disconnect();}catch{}
 }
 function stopAll(){generation++;if(timer!==null)clearTimeout(timer);timer=null;queue.clear();for(const v of [...voices])stopVoice(v);}
 function stopKind(kind){kindEpoch[kind]++;queue.delete(kind);for(const v of [...voices])if(v.kind===kind)stopVoice(v);}
 function gesture(){return navigator.userActivation?.isActive===true;}
 async function resume(){
  if(!preferences.master||!gesture()||document.hidden)return false;
  if(!supported()){audioError='AUDIO_UNAVAILABLE';notify();return false;}
  try{
   if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();output=ctx.createGain();output.gain.value=preferences.volume*.16;output.connect(ctx.destination);ctx.onstatechange=()=>{if(ctx.state!=='running'){unlocked=false;stopAll();}notify();};}
   await ctx.resume();unlocked=ctx.state==='running';audioError=unlocked?null:'PLAYBACK_SUSPENDED';notify();return unlocked;
  }catch{unlocked=false;audioError='RESUME_FAILED';stopAll();notify();return false;}
 }
 function setMaster(value){if(typeof value!=='boolean')return false;preferences.master=value;if(!value)stopAll();save();return value?resume():true;}
 function setVolume(value){if(!Number.isFinite(value))return false;preferences.volume=clamp(value);if(output)output.gain.value=preferences.volume*.16;if(!preferences.volume)stopAll();save();return true;}
 function setEvent(kind,value){if(!KINDS.includes(kind)||typeof value!=='boolean')return false;preferences.events[kind]=value;if(!value)stopKind(kind);save();return true;}
 function allowed(kind,preview=false){return KINDS.includes(kind)&&preferences.master&&preferences.volume>0&&!document.hidden&&unlocked&&ctx?.state==='running'&&(preview||preferences.events[kind]);}
 function musical(kind,tier){
  const duration={question:.28,incorrect:.30,fineplay:tier==='ultra'?.95:tier==='super'?.72:.48,comment:.18}[kind];
  const notes={question:[880,1320],incorrect:[392,330],fineplay:tier==='ultra'?[784,988,1175,1568,1976]:tier==='super'?[784,988,1175,1568]:[784,988,1175],comment:[1046]}[kind];
  const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=b.getChannelData(0);
  // Each tier has the same peak ceiling: extra partials/duration, not gain.
  for(let i=0;i<data.length;i++){const t=i/ctx.sampleRate;let value=0;for(let j=0;j<notes.length;j++){const u=t-j*.035;if(u>=0)value+=Math.sin(2*Math.PI*notes[j]*u)*Math.min(1,u/.008)*Math.exp(-u*9);}data[i]=value/notes.length*.7*Math.min(1,(duration-t)/.025);}
  return b;
 }
 async function bufferFor(kind,tier){
  const key=kind+':'+tier;if(buffers.has(key))return buffers.get(key);
  let b;
  if(kind==='correct'||kind==='applause'){
   if(!SAMPLES[kind])throw new Error('SAMPLE_PENDING:'+kind);
   const response=await fetch(SAMPLES[kind]);if(!response.ok)throw new Error('ASSET_FAILED:'+kind);
   b=await ctx.decodeAudioData(await response.arrayBuffer());
  }else b=musical(kind,tier);
  buffers.set(key,b);return b;
 }
 async function play(cue,preview=false){
  if(!allowed(cue.kind,preview))return false;
  const epoch=generation,localEpoch=kindEpoch[cue.kind];let b;
  try{b=await bufferFor(cue.kind,cue.tier||'normal');}catch(e){if(epoch===generation){audioError=e.message||'ASSET_FAILED';notify();}return false;}
  if(epoch!==generation||localEpoch!==kindEpoch[cue.kind]||!allowed(cue.kind,preview)||voices.size>=2)return false;
  // Merge audio only: acknowledged applause counts and commands are untouched.
  if(cue.kind==='applause'&&[...voices].some(v=>v.kind==='applause'))return false;
  let voice=null;
  try{
   const source=ctx.createBufferSource(),gain=ctx.createGain(),v={source,gain,kind:cue.kind};voice=v;
   source.buffer=b;gain.gain.value=.5;source.connect(gain).connect(output);voices.add(v);
   source.onended=()=>{voices.delete(v);source.disconnect();gain.disconnect();};source.start();audioError=null;notify();return true;
  }catch{if(voice)stopVoice(voice);audioError='PLAYBACK_FAILED';notify();return false;}
 }
 function flush(){timer=null;const candidates=[...queue.values()].filter(c=>allowed(c.kind));queue.clear();candidates.sort((a,b)=>PRIORITY[b.kind]-PRIORITY[a.kind]);if(candidates[0])void play(candidates[0]);}
 function enqueue(cue){
  if(!cue||!KINDS.includes(cue.kind)||typeof cue.eventId!=='string'||!cue.eventId||cue.eventId.length>1024||typeof cue.roundId!=='string'||!cue.roundId||cue.roundId.length>256||cue.private===true||cue.confirmed===false||cue.public===false)return false;
  if(cue.tier!==undefined&&!['normal','super','ultra','hundred'].includes(cue.tier))return false;
  if(round!==cue.roundId){stopAll();round=cue.roundId;seen.clear();}
  const id=JSON.stringify([cue.roundId,cue.eventId]);if(seen.has(id)||seen.size>=12000)return false;seen.add(id);
  if(!allowed(cue.kind))return false;
  if((cue.kind==='correct'||cue.kind==='applause')&&!SAMPLES[cue.kind]){audioError='SAMPLE_PENDING:'+cue.kind;notify();return false;}
  const ranks={normal:0,super:1,ultra:2,hundred:3},prior=queue.get(cue.kind);
  if(!prior||(ranks[cue.tier||'normal']>=ranks[prior.tier||'normal']))queue.set(cue.kind,{kind:cue.kind,eventId:cue.eventId,roundId:cue.roundId,tier:cue.tier});
  if(timer===null)timer=setTimeout(flush,80);return true;
 }
 async function preview(kind){
  if(!KINDS.includes(kind))return false;
  if(!preferences.master||!preferences.volume||!gesture()||document.hidden)return false;
  const epoch=generation,localEpoch=kindEpoch[kind];if(!await resume()||epoch!==generation||localEpoch!==kindEpoch[kind])return false;
  return play({kind,tier:'normal'},true);
 }
 function subscribe(fn){if(typeof fn!=='function')return ()=>{};listeners.add(fn);try{fn(getSnapshot());}catch{}return ()=>listeners.delete(fn);}
 document.addEventListener('visibilitychange',()=>{stopAll();if(document.hidden)unlocked=false;notify();});
 window.addEventListener('pagehide',()=>{unlocked=false;stopAll();});
 window.FPSound=Object.freeze({getSnapshot,subscribe,setMaster,setVolume,setEvent,resume,preview,enqueue,stopAll});
})();
