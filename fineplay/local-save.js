/* Device-only saves. A profile is display data, never a room credential. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);})(globalThis,function(scope){
 'use strict';
 const APP='fp-save',VERSION=1,SOURCE='device-save-candidate-v1-20261011',MAX=2*1024*1024;
 const PROFILE_KEY='fineplay:device:v1:profile',DB_NAME='fineplay:device:v1',STORE='rooms';
 const ICONS=Object.freeze([{id:'default',label:'おまかせ'},{id:'leaf',label:'葉'},{id:'moon',label:'月'},{id:'lantern',label:'ランタン'},{id:'flower',label:'花'},{id:'bird',label:'小鳥'},{id:'gem',label:'宝石'}].map(Object.freeze));
 const iconIds=new Set(ICONS.map(x=>x.id)),uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
 class SaveError extends Error{constructor(code,message){super(message);this.code=code;}}
 const bad=(code,message)=>{throw new SaveError(code,message);};
 const failure=e=>({ok:false,code:e instanceof SaveError?e.code:'SAVE_FAILED',error:e instanceof SaveError?e.message:'端末の保存処理を完了できません。元の保存を確認してください。'});
 const now=()=>new Date().toISOString();
 const validTime=x=>typeof x==='string'&&x.length===24&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 function canonical(value){let nodes=0;function walk(v,depth){
  if(++nodes>150000||depth>60)bad('TOO_COMPLEX','保存データの構造が大きすぎます。');
  if(v===null||typeof v==='boolean'||typeof v==='string')return JSON.stringify(v);
  if(typeof v==='number'){if(!Number.isFinite(v))bad('INVALID_DATA','保存データの数値を確認してください。');return JSON.stringify(v);}
  if(Array.isArray(v)){if(v.length>25000)bad('TOO_COMPLEX','保存データの配列が大きすぎます。');const d=Object.getOwnPropertyDescriptors(v);if(Object.getOwnPropertySymbols(v).length||Object.keys(d).some(k=>k!=='length'&&(!/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=v.length)))bad('INVALID_DATA','保存データの配列を確認してください。');const values=[];for(let i=0;i<v.length;i++){if(!d[i]||!own(d[i],'value'))bad('INVALID_DATA','保存データの配列を確認してください。');values.push(walk(d[i].value,depth+1));}return '['+values.join(',')+']';}
  if(object(v)){const p=Object.getPrototypeOf(v),d=Object.getOwnPropertyDescriptors(v);if((p!==null&&Object.getPrototypeOf(p)!==null)||Object.getOwnPropertySymbols(v).length||Object.entries(d).some(([k,x])=>!own(x,'value')||!x.enumerable||['__proto__','constructor','prototype'].includes(k)))bad('INVALID_DATA','保存データの形式を確認してください。');return '{'+Object.keys(d).sort().map(k=>JSON.stringify(k)+':'+walk(d[k].value,depth+1)).join(',')+'}';}
  bad('INVALID_DATA','保存データの形式を確認してください。');
 }return walk(value,0);}
 function bytes(text){try{return new scope.TextEncoder().encode(text);}catch{bad('UNSUPPORTED','このブラウザでは保存データを処理できません。');}}
 function bounded(text){if(typeof text!=='string'||text.length>MAX||bytes(text).length>MAX)bad('TOO_LARGE','保存データは2MBまでです。');return text;}
 function clone(value){return JSON.parse(bounded(canonical(value)));}
 function keys(x,expected){if(!object(x)||Object.keys(x).length!==expected.length||expected.some(k=>!own(x,k)))bad('INVALID_FORMAT','保存データの形式を確認してください。');}
 function cleanName(name){if(typeof name!=='string')bad('INVALID_NAME','名前を入力してください。');name=name.trim();if(!name||name.length>24)bad('INVALID_NAME','名前は1〜24文字で入力してください。');return name;}
 function profileData(data){keys(data,['name','icon','profileId']);const name=cleanName(data.name);if(!iconIds.has(data.icon)||typeof data.profileId!=='string'||!uuid.test(data.profileId))bad('INVALID_PROFILE','プロフィールの保存データを確認してください。');return {name,icon:data.icon,profileId:data.profileId};}
 function kindRoom(kind,room){if(!['owner','guest'].includes(kind)||typeof room!=='string'||!uuid.test(room))bad('INVALID_ROOM','卓の保存先を確認してください。');return kind+':'+room;}
 function validate(kind,data){const input=clone(data);if(kind==='profile')return profileData(input);
  if(!['owner','guest'].includes(kind))bad('INVALID_KIND','未対応の保存データです。');
  const validator=scope.FPValidateSave;if(!validator||typeof validator.record!=='function')bad('VALIDATOR_UNAVAILABLE','復元の検証を準備できません。再読み込みしてください。');
  try{return clone(validator.record(kind,input,{rules:scope.FPRules}));}catch(e){if(e instanceof SaveError)throw e;bad('INVALID_DATA','卓の保存データを検証できません。元のデータは変更していません。');}
 }
 function cryptoAPI(){const api=scope.crypto;if(!api?.subtle||typeof api.getRandomValues!=='function')bad('CRYPTO_UNAVAILABLE','このブラウザでは安全な保存処理を利用できません。');return api;}
 function newId(){const c=cryptoAPI();if(c.randomUUID)return c.randomUUID();const b=c.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
 let profileStatus='unknown',profileBlocked=false,profileError='';
 function blockProfile(){profileStatus='blocked';profileBlocked=true;profileError='プロフィールの保存データを読み込めません。元のデータを残しています。';}
 function parseProfile(raw){const record=JSON.parse(bounded(raw));keys(record,['app','kind','schemaVersion','sourceVersion','updatedAt','data']);if(record.app!==APP||record.kind!=='profile'||record.schemaVersion!==VERSION||typeof record.sourceVersion!=='string'||!validTime(record.updatedAt))bad('INVALID_PROFILE','プロフィールの保存形式を確認してください。');return profileData(record.data);}
 function loadProfile(){if(profileBlocked)return null;let raw;try{raw=scope.localStorage.getItem(PROFILE_KEY);}catch{profileStatus='unavailable';profileError='この端末にプロフィールを保存できません。';return null;}
  if(raw===null){profileStatus='missing';profileError='';return null;}try{const profile=parseProfile(raw);profileStatus='saved';profileError='';return profile;}catch{blockProfile();return null;}
 }
 function saveProfile(input){try{
  const name=cleanName(input?.name),icon=input?.icon;if(!iconIds.has(icon))bad('INVALID_ICON','同梱アイコンから選んでください。');
  const current=loadProfile();if(profileBlocked)bad('CORRUPT_PROFILE',profileError);if(profileStatus==='unavailable')bad('STORAGE_UNAVAILABLE',profileError);
  const storage=scope.localStorage,original=storage.getItem(PROFILE_KEY);let latest=current;
  if(original!==null){try{latest=parseProfile(original);}catch{blockProfile();bad('CORRUPT_PROFILE',profileError);}}else latest=null;
  const profile={name,icon,profileId:latest?.profileId||newId()};
  const raw=bounded(canonical({app:APP,kind:'profile',schemaVersion:VERSION,sourceVersion:SOURCE,updatedAt:now(),data:profile}));
  // Preserve the original before touching the current key. Quota/no-op stops here.
  if(original!==null){storage.setItem(PROFILE_KEY+':previous',original);if(storage.getItem(PROFILE_KEY+':previous')!==original)bad('BACKUP_FAILED','以前のプロフィールを退避できません。元の保存は変更していません。');}
  if(storage.getItem(PROFILE_KEY)!==original)bad('SAVE_CONFLICT','別のタブでプロフィールが変わりました。読み直してください。');
  try{storage.setItem(PROFILE_KEY,raw);if(storage.getItem(PROFILE_KEY)!==raw)bad('READBACK_FAILED','プロフィールの保存を確認できません。');}
  catch(e){let restored=false;try{if(original===null)storage.removeItem(PROFILE_KEY);else storage.setItem(PROFILE_KEY,original);restored=storage.getItem(PROFILE_KEY)===original;}catch{}
   if(!restored)blockProfile();else{profileStatus='unavailable';profileError='プロフィールを保存できません。以前の保存を残しています。';}
   throw e instanceof SaveError?e:new SaveError('STORAGE_UNAVAILABLE','プロフィールを保存できません。以前の保存を残しています。');
  }
  profileStatus='saved';profileError='';return {ok:true,profile};
 }catch(e){if(!profileBlocked&&!(e instanceof SaveError)){profileStatus='unavailable';profileError='この端末にプロフィールを保存できません。';}return failure(e);}}
 const FPLocalProfile=Object.freeze({ICONS,iconURL:id=>iconIds.has(id)&&id!=='default'?'assets/profile/'+id+'.svg':'',load:loadProfile,save:saveProfile,inspect:()=>({status:profileStatus,blocked:profileBlocked,...(profileError?{error:profileError}:{})})});

 let dbPromise=null,deviceStatus='unknown';const blockedRooms=new Set(),writeQueues=new Map();
 async function openDB(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{
  let request,stopped=false;try{if(!scope.indexedDB)bad('IDB_UNAVAILABLE','このブラウザでは卓を端末に保存できません。');request=scope.indexedDB.open(DB_NAME,1);}catch(e){reject(e);return;}
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};
  request.onerror=()=>reject(new SaveError('IDB_UNAVAILABLE','端末の保存領域を開けません。'));
  request.onblocked=()=>{stopped=true;reject(new SaveError('IDB_BLOCKED','別のタブが保存領域を使用しています。'));};
  request.onsuccess=()=>{const db=request.result;if(stopped){db.close();return;}db.onversionchange=()=>{db.close();dbPromise=null;};resolve(db);};
 });try{return await dbPromise;}catch(e){dbPromise=null;deviceStatus='unavailable';throw e;}}
 function transaction(db,mode,work){return new Promise((resolve,reject)=>{let tx,result,error;try{tx=db.transaction(STORE,mode);work(tx.objectStore(STORE),value=>{result=value;},e=>{error=e;try{tx.abort();}catch{}});}catch(e){reject(e);return;}
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||new SaveError('IDB_ABORTED','端末への保存を完了できません。以前の保存を残しています。'));tx.onerror=()=>{error=error||new SaveError('IDB_FAILED','端末の保存領域を利用できません。');};
 });}
 function storedRecord(raw,kind,room){keys(raw,['app','schemaVersion','kind','room','updatedAt','sourceVersion','current','previous']);if(raw.app!==APP||raw.schemaVersion!==VERSION||raw.kind!==kind||raw.room!==room||typeof raw.sourceVersion!=='string'||!raw.sourceVersion||raw.sourceVersion.length>120||!validTime(raw.updatedAt))bad('CORRUPT_RECORD','卓の保存データを読み込めません。元のデータを残しています。');
  const generation=g=>{keys(g,['savedAt','data']);if(!validTime(g.savedAt))bad('CORRUPT_RECORD','卓の保存時刻を確認してください。');const data=validate(kind,g.data);if(data.room!==room)bad('CORRUPT_RECORD','卓の保存先が一致しません。');return {savedAt:g.savedAt,data};};
  return {...raw,current:generation(raw.current),previous:raw.previous===null?null:generation(raw.previous)};
 }
 function blockedError(key){blockedRooms.add(key);deviceStatus='blocked';return new SaveError('CORRUPT_RECORD','卓の保存データを読み込めません。元のデータを残しています。');}
 async function readRecord(kind,room){try{const key=kindRoom(kind,room),db=await openDB();if(blockedRooms.has(key))throw blockedError(key);
  const raw=await transaction(db,'readonly',(store,done)=>{const r=store.get(key);r.onsuccess=()=>done(r.result);});if(raw===undefined)return {ok:true,record:null,previous:null};
  let value;try{value=storedRecord(raw,kind,room);}catch{throw blockedError(key);}deviceStatus=blockedRooms.size?'blocked':'saved';return {ok:true,record:value.current.data,previous:value.previous?.data||null,updatedAt:value.updatedAt,sourceVersion:value.sourceVersion};
 }catch(e){return failure(e);}}
 async function writeRecordNow(kind,room,payload){try{const key=kindRoom(kind,room);if(blockedRooms.has(key))throw blockedError(key);const db=await openDB(),stamp=now();let expected;
  await transaction(db,'readwrite',(store,done,abort)=>{const r=store.get(key);r.onsuccess=()=>{try{let previous=null;if(r.result!==undefined){let old;try{old=storedRecord(r.result,kind,room);}catch{throw blockedError(key);}previous=old.current;}
    if(kind==='owner'&&previous&&Number.isSafeInteger(previous.data.game?.rev)&&Number.isSafeInteger(payload.game?.rev)&&payload.game.rev<previous.data.game.rev)bad('STALE_REV','より新しい卓の保存があります。現在の保存を確認してください。');
    expected={app:APP,schemaVersion:VERSION,kind,room,updatedAt:stamp,sourceVersion:SOURCE,current:{savedAt:stamp,data:payload},previous};store.put(expected,key);done(true);
   }catch(e){abort(e);}};});
  const saved=await transaction(db,'readonly',(store,done)=>{const r=store.get(key);r.onsuccess=()=>done(r.result);});let verified;try{verified=storedRecord(saved,kind,room);}catch{throw blockedError(key);}
  if(canonical(verified)!==canonical(expected)){deviceStatus=blockedRooms.size?'blocked':'saved';bad('WRITE_CONFLICT','別のタブで卓の保存が更新されました。今回の保存結果を確認してください。');}
  deviceStatus=blockedRooms.size?'blocked':'saved';return {ok:true,updatedAt:stamp};
 }catch(e){if(!blockedRooms.size&&!['WRITE_CONFLICT','STALE_REV'].includes(e.code))deviceStatus='unavailable';return failure(e);}}
 function writeRecord(kind,room,data){let key,payload;try{key=kindRoom(kind,room);payload=validate(kind,{...clone(data),room});}catch(e){return Promise.resolve(failure(e));}
  // Snapshot at call time, and serialize our own commits through readback. Other
  // tabs can still advance a valid generation; that is a conflict, not damage.
  const job=(writeQueues.get(key)||Promise.resolve()).catch(()=>{}).then(()=>writeRecordNow(kind,room,payload));writeQueues.set(key,job);
  const clear=()=>{if(writeQueues.get(key)===job)writeQueues.delete(key);};job.then(clear,clear);return job;
 }
 async function listRecords(){try{const db=await openDB();const records=await transaction(db,'readonly',(store,done)=>{const rows=[],r=store.openCursor();r.onsuccess=()=>{const cursor=r.result;if(!cursor){done(rows);return;}const raw=cursor.value;
    let kind=raw?.kind,room=raw?.room,key;try{key=kindRoom(kind,room);if(key!==cursor.key||blockedRooms.has(key))throw Error();storedRecord(raw,kind,room);rows.push({kind,room,updatedAt:raw.updatedAt,sourceVersion:raw.sourceVersion,hasPrevious:raw.previous!==null,status:'saved'});}catch{blockedRooms.add(String(cursor.key));deviceStatus='blocked';rows.push({kind:['owner','guest'].includes(kind)?kind:null,room:typeof room==='string'&&uuid.test(room)?room:null,status:'blocked',hasPrevious:false});}cursor.continue();
   };});return {ok:true,records};}catch(e){return failure(e);}}
 async function removeRecord(kind,room){try{const key=kindRoom(kind,room),db=await openDB();await transaction(db,'readwrite',(store,done)=>{store.delete(key);done(true);});blockedRooms.delete(key);deviceStatus=blockedRooms.size?'blocked':'saved';return {ok:true};}catch(e){return failure(e);}}

 function b64(buffer){let binary='';for(const b of new Uint8Array(buffer))binary+=String.fromCharCode(b);return scope.btoa(binary);}
 function unb64(text,length){if(typeof text!=='string'||text.length>MAX||!text.length||text.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(text))bad('INVALID_FORMAT','保存データの符号を確認してください。');let result;try{result=Uint8Array.from(scope.atob(text),c=>c.charCodeAt(0));}catch{bad('INVALID_FORMAT','保存データの符号を確認してください。');}if(b64(result)!==text||(length&&result.length!==length))bad('INVALID_FORMAT','保存データの符号を確認してください。');return result;}
 async function digest(value){const hash=await cryptoAPI().subtle.digest('SHA-256',bytes(canonical(value)));return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');}
 function passphrase(value){if(typeof value!=='string'||value.length<8||value.length>256)bad('PASSPHRASE_REQUIRED','作成者の保存には8〜256文字の解除情報が必要です。');return value;}
 async function encryptionKey(pass,salt){const c=cryptoAPI(),material=await c.subtle.importKey('raw',bytes(passphrase(pass)),'PBKDF2',false,['deriveKey']);return c.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',iterations:250000,salt},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
 function metadata(kind){return {app:APP,kind,schemaVersion:VERSION,sourceVersion:SOURCE,savedAt:now()};}
 async function exportRecord(kind,data,options={}){try{const normalized=validate(kind,data);let body;
  if(kind==='owner'){const c=cryptoAPI(),salt=c.getRandomValues(new Uint8Array(16)),iv=c.getRandomValues(new Uint8Array(12));const header={...metadata(kind),protection:'pbkdf2-aes-gcm',kdf:{name:'PBKDF2',hash:'SHA-256',iterations:250000,salt:b64(salt)},cipher:{name:'AES-GCM',iv:b64(iv),tagLength:128}};
   const key=await encryptionKey(options.passphrase,salt),cipher=await c.subtle.encrypt({name:'AES-GCM',iv,additionalData:bytes(canonical(header)),tagLength:128},key,bytes(bounded(canonical(normalized))));body={...header,payload:b64(cipher)};
  }else body={...metadata(kind),protection:'none',data:normalized};
  const text=bounded(canonical({...body,checksum:await digest(body)}));return {ok:true,text};
 }catch(e){return failure(e);}}
 async function importRecord(text,options={}){try{bounded(text);let value;try{value=JSON.parse(text);}catch{bad('INVALID_JSON','保存データを読み込めません。元の保存は変更していません。');}
  if(!object(value)||value.app!==APP||value.schemaVersion!==VERSION||!['profile','guest','owner'].includes(value.kind))bad('UNSUPPORTED_FORMAT','未対応の保存データです。');
  if(typeof value.sourceVersion!=='string'||!value.sourceVersion||value.sourceVersion.length>120||!validTime(value.savedAt))bad('INVALID_FORMAT','保存データの版・時刻を確認してください。');
  const encrypted=value.kind==='owner';if(encrypted&&value.protection!=='pbkdf2-aes-gcm')bad('ENCRYPTION_REQUIRED','平文の作成者バックアップは読み込めません。');
  keys(value,encrypted?['app','kind','schemaVersion','sourceVersion','savedAt','protection','kdf','cipher','payload','checksum']:['app','kind','schemaVersion','sourceVersion','savedAt','protection','data','checksum']);
  if(!encrypted&&value.protection!=='none')bad('UNSUPPORTED_FORMAT','未対応の保存方式です。');
  if(typeof value.checksum!=='string'||!/^[a-f0-9]{64}$/.test(value.checksum))bad('INVALID_CHECKSUM','保存データの破損を確認してください。');const {checksum,...body}=value;if(await digest(body)!==checksum)bad('INVALID_CHECKSUM','保存データが変更または破損しています。');
  let data;if(encrypted){keys(value.kdf,['name','hash','iterations','salt']);keys(value.cipher,['name','iv','tagLength']);if(value.kdf.name!=='PBKDF2'||value.kdf.hash!=='SHA-256'||value.kdf.iterations!==250000||value.cipher.name!=='AES-GCM'||value.cipher.tagLength!==128)bad('UNSUPPORTED_FORMAT','未対応の暗号形式です。');
   const salt=unb64(value.kdf.salt,16),iv=unb64(value.cipher.iv,12),cipher=unb64(value.payload);if(cipher.length<16)bad('INVALID_FORMAT','作成者バックアップが欠けています。');const key=await encryptionKey(options.passphrase,salt),{payload,...header}=body;
   try{const plain=await cryptoAPI().subtle.decrypt({name:'AES-GCM',iv,additionalData:bytes(canonical(header)),tagLength:128},key,cipher);const decoded=new scope.TextDecoder('utf-8',{fatal:true}).decode(plain);data=JSON.parse(bounded(decoded));}catch{bad('DECRYPT_FAILED','解除情報または保存データが正しくありません。');}
  }else data=value.data;
  return {ok:true,kind:value.kind,data:validate(value.kind,data),sourceVersion:value.sourceVersion,savedAt:value.savedAt};
 }catch(e){return failure(e);}}
 const FPDeviceSave=Object.freeze({list:listRecords,read:readRecord,write:writeRecord,remove:removeRecord,exportRecord,importRecord,inspect:()=>({status:deviceStatus,blocked:blockedRooms.size})});
 return {FPLocalProfile,FPDeviceSave};
});
