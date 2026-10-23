/* Save/rejoin UI only. Authority and secret payloads stay in FPSaveSession. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const kinds = {owner:'卓のバックアップ',guest:'自分の復帰情報',profile:'名前・アイコン'};
  const phases = {lobby:'開始前',preparing:'お題の準備中',playing:'進行中',solved:'正解後',passed:'答え合わせ後'};
  const maxInput = 16 * 1024 * 1024;
  let panel = null, panelMode = '', signature = '', epoch = 0, detailsOpen = false;
  let dialog = null, flow = null, listTicket = 0, importTicket = 0, entryBusy = false;

  const el = (tag, cls, text) => {
    const node = document.createElement(tag); if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text; return node;
  };
  const text = (x, limit=180) => typeof x === 'string' ? x.slice(0,limit) : '';
  const api = () => window.FPSaveSession;
  const context = () => { try { return api()?.context() || null; } catch { return null; } };
  const seatIdentity = c => JSON.stringify([!!c?.demo,!!c?.hasRoom,!!c?.owner,c?.me||'',c?.sessionKey??c?.epoch??'']);
  const identity = c => JSON.stringify([!!c?.demo,!!c?.hasRoom,!!c?.owner,c?.me||'',!!c?.ready,c?.sessionKey??c?.epoch??'']);
  const date = value => { const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleString('ja-JP') : '時刻不明'; };
  function button(id, label, action, cls='') {
    const b=el('button',cls,label); b.id=id; b.type='button'; b.onclick=action; return b;
  }
  function notice(root, message, failed=false) {
    const line=root.querySelector('[data-save-notice]'); if (!line) return;
    line.textContent=message; line.classList.toggle('is-error',failed);
  }
  function statusLine() { const line=el('p','fp-save-notice');line.dataset.saveNotice='1';line.setAttribute('role','status');return line; }
  function clearInputs() {
    if (!panel) return;
    for(const input of panel.querySelectorAll('textarea,input')) input.value='';
  }
  function close() {
    if(flow?.applying) return;
    if(flow?.blobURL){try{URL.revokeObjectURL(flow.blobURL);}catch{}}
    epoch++; flow=null;
    if(dialog){for(const input of dialog.querySelectorAll('input,textarea'))input.value='';dialog.replaceChildren();if(dialog.open)dialog.close();}
  }
  function reset() {
    if(flow?.applying) return;
    importTicket++;listTicket++;entryBusy=false;clearInputs();close();signature='';paint();
  }
  function begin(title, type) {
    close();
    if(!dialog){
      dialog=el('dialog','fp-save-dialog');dialog.id='fp-save-dialog';dialog.setAttribute('aria-labelledby','fp-save-dialog-title');document.body.append(dialog);
      dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
      // A close event from the previous view can arrive after this dialog was reopened.
      dialog.addEventListener('close',()=>{if(!dialog.open&&!flow?.applying)close();});
    }
    const item={id:++epoch,type,identity:identity(context()),seatIdentity:seatIdentity(context()),applying:false,blobURL:null};flow=item;
    dialog.replaceChildren();
    const head=el('div','fp-save-dialog-head'),heading=el('h2','',title);heading.id='fp-save-dialog-title';head.append(heading,button('fp-save-close','閉じる',close,'quiet'));
    const body=el('div','fp-save-dialog-body');dialog.append(head,body,statusLine());
    dialog.showModal(); return {item,body};
  }
  function current(item, permission) {
    const c=context();return flow===item&&dialog?.open&&c&&!c.demo&&identity(c)===item.identity&&(!permission||permission(c));
  }
  function fail(root, message='処理できませんでした。元の保存はそのままです。内容や保存先を確認して、もう一度お試しください。') {notice(root,message,true);}
  function previewContent(preview) {
    if(!Object.hasOwn(kinds,preview?.kind))throw Error('unsupported');
    const {item,body}=begin('続きの確認','preview');item.preview=preview;
    const fields=el('dl','fp-save-meta');
    const pair=(label,value)=>{fields.append(el('dt','',label),el('dd','',value));};
    pair('種類',kinds[preview.kind]);if(text(preview.name))pair('名前',text(preview.name,48));
    if(preview.at)pair('保存日時',date(preview.at));if(text(preview.scope))pair('お題の範囲',text(preview.scope));
    if(Object.hasOwn(phases,preview.phase))pair('進行',phases[preview.phase]);body.append(fields);
    const description={
      profile:'名前・アイコンを移します。今の端末プロフィールを置き換えます。元の卓の得点・参加状態は戻りません。',
      guest:'元の卓へ戻ります。作成者が接続していて、元の席を確認できた場合だけ復帰します。名前や役割は卓の現在の状態を使います。',
      owner:'この保存時点から新しい卓を作ります。保存後の進行は戻りません。仲間には新しい招待URLを送ってください。'
    };
    body.append(el('p','fp-save-description',description[preview.kind]));
    const row=el('div','fp-save-actions');
    row.append(button('fp-save-apply',preview.kind==='owner'?'新しい卓として再開':preview.kind==='guest'?'元の卓に戻る':'名前・アイコンを読み込む',()=>apply(item),'primary'),button('fp-save-cancel','やめる',close,'quiet'));
    body.append(row);$('#fp-save-apply')?.focus();
  }
  async function apply(item) {
    if(!current(item,c=>!c.hasRoom))return close();
    item.applying=true;for(const b of dialog.querySelectorAll('button'))b.disabled=true;
    notice(dialog,'保存を確認して適用しています…');
    let result;
    try{result=await api().apply(item.preview);}catch{result={ok:false};}
    if(flow!==item)return;
    item.applying=false;
    if(!result?.ok){for(const b of dialog.querySelectorAll('button'))b.disabled=false;fail(dialog,'読み込めませんでした。復帰を完了したとは扱っていません。元の保存を確認し、もう一度お試しください。');paint();return;}
    const kind=item.preview.kind;item.preview=null;
    complete(kind,result);paint();
  }
  function invite(value) {
    try{const u=new URL(value,location.href);return u.origin===location.origin&&u.pathname===location.pathname&&!u.search&&/^#r=[a-f0-9-]{36}$/.test(u.hash)?u.href:'';}catch{return '';}
  }
  function complete(kind,result) {
    const {item,body}=begin(kind==='profile'?'名前・アイコンを読み込みました':kind==='owner'?'新しい卓を用意しました':'卓への復帰','complete');
    item.resultKind=kind;
    const c=context();
    body.append(el('p','',kind==='profile'?'この端末のプロフィールに反映しました。':c?.ready?'卓への接続を確認しました。':'接続を確認しています。通信の復帰はまだ完了していません。'));
    if(kind==='owner'){
      body.append(el('p','fp-save-description','仲間には新しい招待URLを送ってください。元の席に戻す人には、その人の席の復帰コードを個別に渡せます。'));
      const url=invite(result.inviteURL);
      if(url)body.append(button('fp-save-new-invite','新しい招待URLをコピー',()=>copyToClipboard(url,item,'招待URLをコピーしました。'),'primary'));
      else body.append(el('p','fp-save-description','接続できたら、卓の「招待URLをコピー」を使ってください。'));
    }
    body.append(button('fp-save-done','閉じる',close,'quiet'));
  }
  async function copyToClipboard(value,item,message) {
    if(!current(item))return close();
    try{if(!navigator.clipboard?.writeText)throw Error('clipboard');await navigator.clipboard.writeText(value);if(current(item))notice(dialog,message);}
    catch{if(!current(item))return;const box=dialog.querySelector('[data-save-output]');if(box){box.closest('details').open=true;box.focus();box.select();notice(dialog,'コードを選択しました。端末のコピー操作を使ってください。');}else notice(dialog,'コピーできませんでした。卓の招待URLを確認してください。',true);}
  }
  function showOutput(item,body,value,kind) {
    if(typeof value!=='string'||!value.length||value.length>maxInput)throw Error('export');
    body.replaceChildren();body.append(el('p','fp-save-description',kind==='owner'?'未公開の答えや仲間の復帰情報を含む、自分用の暗号化ファイルです。合言葉を忘れると読み込めません。':kind==='seat'?'このコードを、その席の本人だけに渡してください。コードを持つ人がその席に入れます。':'自分だけで保管してください。このコードを持つ人があなたの席に入れます。'));
    const name=kind==='owner'?'fineplay-table-backup.fpsave':kind==='seat'?'fineplay-seat-rejoin.fpsave':'fineplay-my-rejoin.fpsave';
    try{
      const url=URL.createObjectURL(new Blob([value],{type:'application/octet-stream'}));item.blobURL=url;
      const a=el('a','btn primary','ファイルを保存');a.id='fp-save-download';a.href=url;a.download=name;body.append(a);
    }catch{body.append(el('p','fp-save-description','ファイル保存を準備できませんでした。下のコードを自分で控えられます。'));}
    const code=el('details','fp-save-code');code.append(el('summary','','コードで控える'));
    const label=el('label','','自分で保管するコード');label.htmlFor='fp-save-output';
    const box=el('textarea');box.id='fp-save-output';box.dataset.saveOutput='1';box.readOnly=true;box.rows=4;box.value=value;box.spellcheck=false;
    code.append(label,box,button('fp-save-copy','コードをコピー',()=>copyToClipboard(value,item,'コードをコピーしました。公開せず、自分で保管してください。')));body.append(code);
    body.append(button('fp-save-output-done','閉じる',close,'quiet'));notice(dialog,'持ち出し用のデータを準備しました。ファイルを端末に保存してください。');
  }
  function exportDialog(seatId) {
    const c=context();if(!c||c.demo||!c.hasRoom)return;
    if(seatId&&(!c.owner||!c.ready||seatId===c.me||!c.players?.some(p=>p.id===seatId)))return;
    if(!c.owner&&!c.ready)return;
    const kind=seatId?'seat':c.owner?'owner':'guest';
    const {item,body}=begin(kind==='owner'?'卓を持ち出す':kind==='seat'?'仲間の席の復帰コード':'自分の復帰コード','export');
    item.exportKind=kind;item.seatId=seatId;
    body.append(el('p','fp-save-description',kind==='owner'?'未公開の答えや参加者の復帰情報を含む、自分用のバックアップです。公開用リザルトとは別です。':kind==='seat'?'選んだ席の本人へ、個別に渡すためのコードを作ります。全員の通話や公開リザルトに貼らないでください。':'元の作成者が接続している卓へ戻るための秘密のコードです。卓全体のバックアップにはなりません。'));
    if(kind==='owner'){
      const label=el('label','','合言葉（8文字以上）');label.htmlFor='fp-save-export-password';
      const pw=el('input');pw.id='fp-save-export-password';pw.type='password';pw.minLength=8;pw.maxLength=256;pw.autocomplete='new-password';
      const confirmLabel=el('label','','合言葉をもう一度');confirmLabel.htmlFor='fp-save-export-password-again';
      const again=el('input');again.id='fp-save-export-password-again';again.type='password';again.maxLength=256;again.autocomplete='new-password';
      body.append(label,pw,confirmLabel,again,el('p','fp-save-description','読み込むときに必要です。他のサービスのパスワードは使わず、ファイルと合言葉を自分で保管してください。'));
    }
    body.append(button('fp-save-export','持ち出しを準備',async()=>{
      if(!current(item,c=>c.hasRoom&&(kind==='owner'?c.owner:kind==='seat'?c.owner&&c.ready&&c.players?.some(p=>p.id===seatId):!c.owner&&c.ready)))return close();
      const pass=kind==='owner'?$('#fp-save-export-password')?.value:'';
      if(kind==='owner'&&(!pass||pass.length<8||pass!==$('#fp-save-export-password-again')?.value)){fail(dialog,'8文字以上の合言葉を、2回同じ内容で入力してください。');return;}
      const prepare=$('#fp-save-export');if(prepare.disabled)return;prepare.disabled=true;notice(dialog,'持ち出し用のデータを準備しています…');
      try{
        const value=await(kind==='seat'?api().exportSeat(seatId):api().exportCurrent(kind==='owner'?pass:undefined));
        if(!current(item))return;showOutput(item,body,value,kind);
      }catch{if(current(item)){prepare.disabled=false;fail(dialog,'持ち出しを準備できませんでした。接続や端末の保存を確認し、もう一度お試しください。');}}
    },'primary'));
  }
  async function requestPreview(task) {
    const c=context();if(!c||c.demo||c.hasRoom||entryBusy)return;
    const expected=identity(c),ticket=++importTicket;entryBusy=true;entryControls();notice(panel,'保存の内容を確認しています…');
    try{const preview=await task();if(ticket!==importTicket||identity(context())!==expected||context()?.hasRoom)return;clearInputs();previewContent(preview);notice(panel,'内容を確認してから再開してください。');}
    catch{if(ticket===importTicket&&panel?.isConnected)fail(panel,'読み込めませんでした。ファイル・コードや合言葉を確認してください。元の保存は変更していません。');}
    finally{if(ticket===importTicket){entryBusy=false;entryControls();}}
  }
  function entryControls(){if(panelMode!=='entry'||!panel)return;for(const b of panel.querySelectorAll('button,input,textarea'))b.disabled=entryBusy;}
  async function loadList() {
    if(panelMode!=='entry'||context()?.hasRoom)return;
    const ticket=++listTicket,target=panel.querySelector('#fp-save-list');target.textContent='保存を確認しています…';
    try{
      const rows=await api().list();if(ticket!==listTicket||panelMode!=='entry'||!target.isConnected)return;
      target.replaceChildren();let count=0;
      for(const record of Array.isArray(rows)?rows:[]){
        if(!Object.hasOwn(kinds,record?.kind)||typeof record.key!=='string')continue;
        const row=el('div','fp-save-record');row.append(el('span','',kinds[record.kind]+(text(record.name)?' · '+text(record.name,48):'')),el('small','',date(record.at)+(text(record.scope)?' · '+text(record.scope,80):'')));
        row.append(button('fp-save-record-'+count,'内容を確認',()=>requestPreview(()=>api().previewLocal(record.key))));target.append(row);count++;
      }
      if(!count)target.append(el('p','fp-save-description','このブラウザに残した保存は、まだありません。'));
    }catch{if(ticket===listTicket&&target.isConnected){target.textContent='保存を確認できませんでした。ファイル・コードから読み込むか、もう一度お試しください。';}}
    entryControls();
  }
  function buildEntry(body) {
    body.append(el('p','fp-save-description','このブラウザに残した保存、または自分で保管したファイル・コードから戻れます。'));
    const list=el('div','fp-save-list');list.id='fp-save-list';body.append(list,button('fp-save-refresh-list','保存一覧を更新',loadList,'quiet'));
    const read=el('details','fp-save-import');read.id='fp-save-import';read.append(el('summary','','ファイル・コードを読み込む'));
    const fileLabel=el('label','','保存ファイル');fileLabel.htmlFor='fp-save-file';
    const file=el('input');file.id='fp-save-file';file.type='file';file.accept='.fpsave,.json,.txt,application/json,text/plain';
    const codeLabel=el('label','','または、控えたコードを貼り付け');codeLabel.htmlFor='fp-save-input';
    const code=el('textarea');code.id='fp-save-input';code.rows=3;code.maxLength=maxInput;code.spellcheck=false;code.autocomplete='off';
    const passwordLabel=el('label','','合言葉（暗号化したファイル・コードだけ）');passwordLabel.htmlFor='fp-save-import-password';
    const password=el('input');password.id='fp-save-import-password';password.type='password';password.maxLength=256;password.autocomplete='off';
    file.onchange=()=>{code.value='';notice(panel,file.files?.[0]?'ファイルを選びました。合言葉が必要なら入力し、内容を確認してください。':'');};
    code.oninput=()=>{file.value='';};
    read.append(fileLabel,file,codeLabel,code,passwordLabel,password,button('fp-save-preview','内容を確認',()=>{
      const selected=file.files?.[0],input=code.value,pass=password.value;
      if(selected?.size>maxInput||input.length>maxInput){fail(panel,'保存のデータが大きすぎます。別のファイルを確認してください。');return;}
      if(!selected&&!input.trim()){fail(panel,'保存ファイルを選ぶか、コードを貼り付けてください。');return;}
      requestPreview(async()=>api().previewImport(selected?await selected.text():input,pass));
    }));body.append(read);
  }
  function buildActive(body) {
    const health=el('p','fp-save-description');health.id='fp-save-health';body.append(health);
    const row=el('div','fp-save-actions');
    row.append(button('fp-save-now','このブラウザに保存',async()=>{
      const c=context();if(!c||c.demo||!c.hasRoom)return;
      const expected=identity(c);
      const b=$('#fp-save-now');if(b.disabled)return;b.disabled=true;notice(panel,'このブラウザに保存しています…');
      try{const result=await api().saveNow();if(panel?.isConnected&&panelMode==='active'&&identity(context())===expected)notice(panel,result?.ok?'このブラウザに保存しました。元のタブの再読込用情報とは別に残しています。':'保存を確認できませんでした。このタブを閉じずに、持ち出し用ファイルを控えてください。',!result?.ok);}
      catch{if(panel?.isConnected&&identity(context())===expected)fail(panel,'このブラウザに保存できませんでした。このタブを閉じずに、持ち出し用ファイルを控えてください。');}
      finally{if(b.isConnected)b.disabled=false;paint();}
    }),button('fp-save-export-open','持ち出す',()=>exportDialog()));body.append(row);
    const seats=el('details','fp-save-seats');seats.id='fp-save-seats';seats.append(el('summary','','仲間の席の復帰コード'));
    const label=el('label','','元の席に戻す仲間');label.htmlFor='fp-save-seat-player';
    const select=el('select');select.id='fp-save-seat-player';
    seats.append(el('p','fp-save-description','卓の作成者から、各本人にだけ渡してください。コードを持つ人がその席に戻れます。'),label,select,button('fp-save-seat-export','選んだ席のコードを作る',()=>exportDialog(select.value)));body.append(seats);
  }
  function activeControls(c) {
    const health=$('#fp-save-health');if(health)health.textContent=c.savedStatus==='saved'?'このブラウザに保存済み。ファイルで控えると別の端末でも持ち運べます。':c.savedStatus==='unavailable'?'このブラウザに保存できません。タブを閉じずに、ファイルで控えてください。':c.savedStatus==='pending'?'このブラウザへの保存を確認中です。':'このブラウザに保存できます。元のタブの再読込用保存とは別です。';
    const exportButton=$('#fp-save-export-open');if(exportButton){exportButton.textContent=c.owner?'卓を持ち出す':'自分の復帰コード';exportButton.disabled=!c.owner&&!c.ready;}
    const seats=$('#fp-save-seats');if(!seats)return;seats.hidden=!c.owner;
    if(!c.owner){seats.open=false;return;}
    const select=$('#fp-save-seat-player'),selected=select.value;select.replaceChildren();
    for(const p of Array.isArray(c.players)?c.players:[]){if(p.id===c.me)continue;const option=el('option','',text(p.name,48)+(p.online?'':'（未接続）'));option.value=p.id;select.append(option);}
    if([...select.options].some(o=>o.value===selected))select.value=selected;
    const issue=$('#fp-save-seat-export');issue.disabled=!c.ready||!select.options.length;select.disabled=!c.ready||!select.options.length;
  }
  function paint() {
    const c=context();if(!c)return;
    const next=identity(c);
    if(signature&&signature!==next&&!flow?.applying){
      importTicket++;listTicket++;entryBusy=false;clearInputs();if(panel)notice(panel,'');
      // Keep the explicit success view while its connection confirmation arrives.
      if(flow?.type==='complete'&&flow.seatIdentity===seatIdentity(c))flow.identity=next;
      else close();
    }
    signature=next;
    if(c.demo){panel?.remove();if(!flow?.applying)close();return;}
    const mode=c.hasRoom?'active':'entry';
    if(!panel||panelMode!==mode){
      panel?.remove();panelMode=mode;panel=el('details','fp-save-panel');panel.id='fp-save-panel';panel.dataset.saveMode=mode;panel.open=detailsOpen;
      panel.append(el('summary','',mode==='entry'?'前の続きから':'保存・持ち出し'));
      const body=el('div','fp-save-panel-body');mode==='entry'?buildEntry(body):buildActive(body);panel.append(body,statusLine());
      panel.addEventListener('toggle',()=>{detailsOpen=panel.open;if(detailsOpen&&panelMode==='entry')loadList();});
    }
    if(mode==='entry'){
      const target=$('.entry-form');if(target&&panel.parentElement!==target)target.append(panel);
    }else{
      const top=$('.fp-top')||$('.top'),main=$('#main');if(top&&panel.previousElementSibling!==top)top.after(panel);else if(!top&&main&&panel.parentElement!==main)main.prepend(panel);
      activeControls(c);
    }
    if(flow?.type==='complete'&&flow.resultKind!=='profile'&&dialog?.open){const first=dialog.querySelector('.fp-save-dialog-body > p');if(first)first.textContent=c.ready?'卓への接続を確認しました。':'接続を確認しています。通信の復帰はまだ完了していません。';}
  }
  window.FPSaveUI=Object.freeze({paint,reset});
  window.addEventListener('fineplay-save-refresh',paint);
  window.addEventListener('fineplay-save-reset',reset);
  window.addEventListener('pagehide',()=>{if(!flow?.applying)close();clearInputs();});
  paint();
})();
