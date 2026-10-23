/* Device save candidate: authority remains the host's credentials -> player ID. */
(() => {
 'use strict';
 const pendingPreviews=new WeakMap();let health='unknown',errorText='',epoch=0,queued=null,saving=null,hostOpenedEpoch=-1,applying=false;
 const refresh=()=>window.dispatchEvent(new Event('fineplay-save-refresh'));
 const fail=t=>{throw new Error(t);};
 const checked=(kind,data)=>window.FPValidateSave.record(kind,data,{rules:R});
 const mustResult=r=>{if(!r?.ok)fail(r?.error||'保存を確認できません。元のデータは残しています。');return r;};
 function currentRecord(){
  if(demo||!room||restoreBlocked)return null;
  if(owner&&game)return {kind:'owner',data:{room,game:R.cp(game),credentials:{...credentials},name:game.players.find(p=>p.id===me)?.name||name,me}};
  if(!owner&&token&&state?.you===me&&state.players.some(p=>p.id===me))return {kind:'guest',data:{room,name:state.players.find(p=>p.id===me).name,token,role:state.players.find(p=>p.id===me).role,playerId:me}};
  return null;
 }
 async function flush(){
  while(queued){const item=queued;queued=null;const r=await window.FPDeviceSave.write(item.kind,item.data.room,item.data);
   if(!queued&&item.epoch===epoch){health=r.ok?'saved':'unavailable';errorText=r.ok?'':r.error||'このブラウザに保存できません。';refresh();}
  }
 }
 function capture(){
  if(owner&&ready)hostOpenedEpoch=epoch;
  if(owner&&!ready&&hostOpenedEpoch!==epoch)return Promise.resolve({ok:false,error:'作成者の接続を確認してから保存します。'});
  const item=currentRecord();if(!item)return Promise.resolve({ok:false});
  queued={...item,epoch};health='pending';errorText='';refresh();
  if(!saving)saving=flush().finally(()=>{saving=null;if(queued)capture();});
  return saving.then(()=>({ok:health==='saved',error:errorText}));
 }
 function context(){return {demo,owner,ready,hasRoom:!!state||!!game,name,me,
  players:state?.players.map(p=>({id:p.id,name:p.name,online:p.online}))||[],
  savedStatus:health,savedError:errorText,sessionKey:String(epoch)+':'+room};}
 async function list(){
  const r=mustResult(await FPDeviceSave.list()),out=[];
  for(const meta of r.records){const r2=await FPDeviceSave.read(meta.kind,meta.room);if(!r2.ok||!r2.record)continue;
   out.push({key:meta.kind+':'+meta.room,kind:meta.kind,at:meta.updatedAt,name:r2.record.name,
    phase:meta.kind==='owner'?r2.record.game.phase:'',scope:meta.kind==='owner'?r2.record.game.scope:''});
  }return out.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
 }
 function preview(kind,data,at){
  const normalized=checked(kind,data);const message=kind==='profile'?'名前・アイコンを移します。元の卓の得点・参加状態は戻りません。':kind==='guest'?'元の作成者が開いている卓で、保存した席への復帰を確認します。':'この保存時点から新しい卓を作ります。仲間には新しい招待URLと、それぞれの席の復帰コードを渡してください。';
  const view=Object.freeze({kind,name:normalized.name,at,scope:kind==='owner'?normalized.game.scope:'',phase:kind==='owner'?normalized.game.phase:'',message});
  pendingPreviews.set(view,{kind,data:normalized,epoch,expires:Date.now()+10*60*1000});return view;
 }
 async function previewLocal(key){
  if(typeof key!=='string'||key.length>100)fail('保存を選び直してください。');
  const split=key.indexOf(':'),kind=key.slice(0,split),id=key.slice(split+1);
  if(!['owner','guest'].includes(kind)||!validRoom(id))fail('保存を選び直してください。');
  const result=mustResult(await FPDeviceSave.read(kind,id));if(!result.record)fail('保存が見つかりません。');
  return preview(kind,result.record,result.updatedAt);
 }
 async function previewImport(text,passphrase){
  const r=mustResult(await FPDeviceSave.importRecord(text,{passphrase}));return preview(r.kind,r.data,r.savedAt);
 }
 async function apply(view){
  const p=pendingPreviews.get(view);if(!p||p.epoch!==epoch||p.expires<Date.now())fail('確認画面を開き直してください。');
  if(state||game||connecting||busy)fail('今の卓を保つため、ここでは読み込めません。別の空の画面で開いてください。');
  if(applying)fail('復元を確認中です。完了までお待ちください。');
  applying=true;
  try{
  const d=checked(p.kind,p.data);
  if(p.kind==='profile'){
   const r=mustResult(FPLocalProfile.save(d));pendingPreviews.delete(view);name=r.profile.name;render();return {ok:true,message:'このブラウザにプロフィールを保存しました。'};
  }
  if(p.kind==='guest'){
   // Stage all checks before changing runtime or URL. Never persist an unconfirmed identity.
   resetPeer();epoch++;queued=null;restoreBlocked=false;owner=false;room=d.room;name=d.name;token=d.token;joinRole=d.role;
   recoveryOnly=true;expectedRecoveryPlayer=d.playerId||'';health='unknown';errorText='';
   history.replaceState(null,'',location.pathname+'#r='+room);pendingPreviews.delete(view);
   window.dispatchEvent(new Event('fineplay-save-reset'));render();await connect(false);
   return {ok:true,message:'保存した席を作成者に確認しています。通信がそろうまで復帰は未完了です。'};
  }
  // A restored host starts a new room. IDs, ledger, private state and receipts survive;
  // every old guest credential is replaced, so live old rooms are never taken over.
  const next=R.cp(d.game),newRoom=uid(),newCredentials={};
  next.players.forEach(player=>{player.online=player.id===d.me;if(player.id!==d.me)newCredentials[uid()]=player.id;});
  const staged=checked('owner',{room:newRoom,game:next,credentials:newCredentials,name:next.players.find(x=>x.id===d.me).name,me:d.me});
  const oldSession=recovery.read('owner:'+newRoom);if(oldSession.status!=='missing')fail('復元先を用意できません。もう一度読み込んでください。');
  if(!recovery.write('owner:'+newRoom,{game:staged.game,credentials:staged.credentials,name:staged.name,me:staged.me}))fail('新しい卓の復帰情報を保存できません。元の保存は残しています。');
  const device=await FPDeviceSave.write('owner',newRoom,staged);
  if(!device.ok){try{sessionStorage.removeItem(P+'owner:'+newRoom);}catch{}fail(device.error||'新しい卓を保存できません。元の保存は残しています。');}
  if(p.epoch!==epoch||state||game||connecting||busy){
   try{sessionStorage.removeItem(P+'owner:'+newRoom);}catch{}
   await FPDeviceSave.remove('owner',newRoom);
   fail('画面の状態が変わりました。元の保存は残しています。空の画面で開き直してください。');
  }
  resetPeer();epoch++;queued=null;restoreBlocked=false;recoveryOnly=false;expectedRecoveryPlayer='';owner=true;
  room=newRoom;game=staged.game;credentials=staged.credentials;name=staged.name;me=staged.me;state=R.view(game,me);
  health='saved';errorText='';seen.clear();draft='';history.replaceState(null,'',location.pathname+'#r='+room);
  pendingPreviews.delete(view);window.dispatchEvent(new Event('fineplay-save-reset'));render();await connect(true);
  return {ok:true,inviteURL:inviteURL(),message:'保存時点から新しい卓を用意しました。接続後、新しい招待URLと各席の復帰コードで再集合してください。'};
  }finally{applying=false;}
 }
 async function exportCurrent(passphrase){
  const item=currentRecord();if(item)return mustResult(await FPDeviceSave.exportRecord(item.kind,checked(item.kind,item.data),{passphrase})).text;
  const profile=FPLocalProfile.load();if(!profile)fail('先にプロフィールを保存してください。');
  return mustResult(await FPDeviceSave.exportRecord('profile',profile)).text;
 }
 async function exportSeat(playerId){
  if(demo||!owner||!game||playerId===me)fail('作成者だけが仲間の席の復帰情報を用意できます。');
  const seat=game.players.find(x=>x.id===playerId),entry=Object.entries(credentials).find(([,id])=>id===playerId);
  if(!seat||!entry)fail('その席の復帰情報がありません。');
  return mustResult(await FPDeviceSave.exportRecord('guest',{room,token:entry[0],name:seat.name,role:seat.role,playerId})).text;
 }
 window.FPSaveSession=Object.freeze({context,list,previewLocal,previewImport,apply,exportCurrent,exportSeat,capture,saveNow:capture});
 // No auto host restore from a new tab: selection and preview are deliberate.
 // A guest URL may match a stored seat; resume through its dedicated handshake.
 async function tryGuestResume(){
  if(demo||state||game||connecting||applying||restoreBlocked||!room)return;
  const wanted=room,result=await FPDeviceSave.read('guest',wanted);
  if(result.ok&&result.record&&room===wanted&&!state&&!game&&!connecting&&!applying){
   try{const d=checked('guest',result.record);name=d.name;token=d.token;joinRole=d.role;recoveryOnly=true;expectedRecoveryPlayer=d.playerId||'';render();await connect(false);}catch{health='unavailable';errorText='保存した席を読み込めません。元のデータは残しています。';refresh();}
  }
 }
 queueMicrotask(()=>{capture();tryGuestResume();refresh();});
})();
