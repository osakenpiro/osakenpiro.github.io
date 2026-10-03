/* FINEPLAY bounded state transport over unchanged PeerJS JSON channels.
 * State is already projected for one authenticated viewer before encoding.
 * Controls/commands remain small JSON; game schema and authority are unchanged. */
(()=>{'use strict';
 const VERSION=1,CHUNK=6144,MAX_BYTES=8*1024*1024,MAX_FRAMES=Math.ceil(MAX_BYTES/CHUNK),MAX_FRAME_BYTES=9000,TIMEOUT=15000,RETRIES=2;
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 const encode=b=>btoa(String.fromCharCode(...b));
 const decode=s=>{if(typeof s!=='string'||s.length>8192||!s.length||s.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))throw Error('invalid piece');const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0));};
 class Sender{
  constructor({send,buffered=()=>0,onStatus=()=>{},timeout=TIMEOUT}){this.send=send;this.buffered=buffered;this.onStatus=onStatus;this.timeout=timeout;this.seq=0;this.current=null;this.pending=null;this.closed=false;this.status='syncing';this.revision=-1;this.lastResend=0;}
  offer(state,force=false){if(this.closed||(!force&&this.status==='failed'))return;let bytes;try{if(!integer(state?.rev))throw Error('revision');bytes=encoder.encode(JSON.stringify(state));if(bytes.length>MAX_BYTES)throw Error('limit');}catch{this.fail('limit',state?.rev);return;}if(!force&&((this.current?.rev===state.rev)||(this.pending?.rev===state.rev)||(this.status==='ok'&&this.revision===state.rev)))return;this.pending={bytes,rev:state.rev,retries:0};if(!this.current)this.begin();}
  notify(status,rev,reason){this.status=status;this.revision=rev;this.onStatus({status,rev,reason});}
  begin(){if(this.closed||!this.pending)return;const job=this.pending;this.pending=null;job.seq=++this.seq;job.index=0;job.count=Math.ceil(job.bytes.length/CHUNK);this.current=job;this.notify('syncing',job.rev);if(!this.stallTimer)this.stallTimer=setTimeout(()=>this.fail('timeout',this.current?.rev??this.revision),this.timeout*(RETRIES+1));this.deadline=setTimeout(()=>this.retry(),this.timeout);this.pump();}
  pump(){const job=this.current;if(!job||this.closed)return;if(this.buffered()>65536){this.pumpTimer=setTimeout(()=>this.pump(),20);return;}const data=encode(job.bytes.subarray(job.index*CHUNK,Math.min(job.bytes.length,(job.index+1)*CHUNK)));const frame={type:'state-piece',wire:VERSION,seq:job.seq,rev:job.rev,index:job.index,count:job.count,bytes:job.bytes.length,data};if(encoder.encode(JSON.stringify(frame)).length>=MAX_FRAME_BYTES||!this.send(frame)){this.fail('send',job.rev);return;}job.index++;if(job.index<job.count)this.pumpTimer=setTimeout(()=>this.pump(),0);}
  acknowledge(m){const job=this.current;if(!job||m.wire!==VERSION||m.seq!==job.seq||m.rev!==job.rev)return false;clearTimeout(this.deadline);clearTimeout(this.pumpTimer);clearTimeout(this.stallTimer);this.stallTimer=null;this.current=null;this.notify('ok',job.rev);if(this.pending)this.begin();return true;}
  retry(){const job=this.current;if(!job||this.closed)return;clearTimeout(this.deadline);clearTimeout(this.pumpTimer);this.current=null;const next=this.pending||{bytes:job.bytes,rev:job.rev,retries:job.retries+1};this.pending=null;if(next.retries>RETRIES){this.fail('timeout',next.rev);return;}this.pending=next;this.begin();}
  resync(state,manual=false){if(this.closed||(!manual&&Date.now()-this.lastResend<1000))return;if(!manual&&this.status==='failed')return;this.lastResend=Date.now();if(this.current){if(this.current.index<this.current.count)return;this.retry();return;}this.offer(state,true);}
  fail(reason,rev){clearTimeout(this.deadline);clearTimeout(this.pumpTimer);clearTimeout(this.stallTimer);this.stallTimer=null;this.current=null;this.pending=null;this.notify('failed',rev,reason);this.send({type:'sync-error',wire:VERSION,rev:integer(rev)?rev:0,reason});}
  close(){this.closed=true;clearTimeout(this.deadline);clearTimeout(this.pumpTimer);clearTimeout(this.stallTimer);this.stallTimer=null;this.current=null;this.pending=null;}
  stats(){return{status:this.status,revision:this.revision,activeBytes:this.current?.bytes.length||0,pendingBytes:this.pending?.bytes.length||0,seq:this.seq};}
 }
 class Receiver{
  constructor({send,onState,onStatus=()=>{},timeout=TIMEOUT,revision=-1}){this.send=send;this.onState=onState;this.onStatus=onStatus;this.timeout=timeout;this.revision=revision;this.wantedRevision=revision;this.seq=0;this.completedSeq=0;this.active=null;this.closed=false;this.lastRequest=0;this.window=Date.now();this.frames=0;this.status='syncing';}
  notify(status,reason){if(this.status===status&&this.reason===reason)return;this.status=status;this.reason=reason;this.onStatus({status,rev:this.revision,reason});}
  request(){if(this.closed||Date.now()-this.lastRequest<1000)return;this.lastRequest=Date.now();this.send({type:'state-resync',wire:VERSION,rev:this.revision});}
  fail(reason){clearTimeout(this.deadline);this.deadline=null;this.active=null;this.notify('failed',reason);this.request();}
  expect(rev){if(!integer(rev)){this.fail('protocol');return;}this.wantedRevision=Math.max(this.wantedRevision,rev);if(this.wantedRevision>this.revision){if(this.status==='ok')this.notify('syncing');if(!this.active){if(!this.deadline)this.deadline=setTimeout(()=>{this.deadline=null;this.fail('timeout');},this.timeout);this.request();}}}
  receive(m){if(this.closed)return false;if(!m||m.type!=='state-piece')return false;
   const now=Date.now();if(now-this.window>=1000){this.window=now;this.frames=0;}if(++this.frames>1000){this.fail('rate');return true;}
   if(m.wire!==VERSION||!integer(m.seq)||m.seq<1||!integer(m.rev)||!integer(m.index)||!integer(m.count)||!integer(m.bytes)||m.bytes<1||m.bytes>MAX_BYTES||m.count!==Math.ceil(m.bytes/CHUNK)||m.count>MAX_FRAMES||m.index>=m.count){this.fail('protocol');return true;}
   if(m.rev<this.revision||m.seq<this.seq||m.seq<=this.completedSeq)return true;
   let chunk;try{chunk=decode(m.data);if(chunk.length!==Math.min(CHUNK,m.bytes-m.index*CHUNK))throw Error('length');}catch{this.fail('protocol');return true;}
   this.wantedRevision=Math.max(this.wantedRevision,m.rev);if(m.seq>this.seq){clearTimeout(this.deadline);this.seq=m.seq;this.active={seq:m.seq,rev:m.rev,count:m.count,bytes:m.bytes,pieces:new Array(m.count),received:0,stored:0};this.notify('syncing');this.deadline=setTimeout(()=>{this.deadline=null;this.fail('timeout');},this.timeout);}
   const active=this.active;if(!active)return true;if(active.rev!==m.rev||active.count!==m.count||active.bytes!==m.bytes){this.fail('protocol');return true;}
   const old=active.pieces[m.index];if(old){if(old.length!==chunk.length||old.some((n,i)=>n!==chunk[i]))this.fail('conflict');return true;}
   active.pieces[m.index]=chunk;active.received++;active.stored+=chunk.length;
   if(active.received===active.count){clearTimeout(this.deadline);this.deadline=null;const joined=new Uint8Array(active.bytes);let offset=0;for(const piece of active.pieces){joined.set(piece,offset);offset+=piece.length;}this.active=null;let state;try{state=JSON.parse(decoder.decode(joined));if(!state||state.version!==3||state.rev!==active.rev||typeof state.you!=='string'||!Array.isArray(state.players)||!Array.isArray(state.entries))throw Error('state');}catch{this.fail('protocol');return true;}this.revision=state.rev;this.completedSeq=m.seq;const fresh=state.rev>=this.wantedRevision;this.onState(state,fresh);this.notify(fresh?'ok':'syncing');this.send({type:'state-ack',wire:VERSION,seq:m.seq,rev:state.rev});if(!fresh)this.request();}
   return true;
  }
  close(){this.closed=true;clearTimeout(this.deadline);this.deadline=null;this.active=null;}
  stats(){return{status:this.status,revision:this.revision,wantedRevision:this.wantedRevision,activeBytes:this.active?.stored||0,allocatedPieces:this.active?.pieces.length||0,seq:this.seq,completedSeq:this.completedSeq};}
 }
 window.FPStateWire={VERSION,CHUNK,MAX_BYTES,MAX_FRAMES,MAX_FRAME_BYTES,TIMEOUT,RETRIES,Sender,Receiver};
})();
