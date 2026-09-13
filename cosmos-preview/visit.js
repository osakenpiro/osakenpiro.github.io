import {mergeCatalogues,searchRecords,validURL} from './catalogue.js';
const $ = (id) => document.getElementById(id);
const initialRoute=new URLSearchParams(location.hash.slice(1));
if(initialRoute.has('place')||initialRoute.get('view')==='island'){
  document.body.classList.add('visiting');$('arrival').inert=true;$('arrival').setAttribute('aria-hidden','true');
}
const districts = [
  {id:'workshop',no:'01',title:'道具の工房',short:'工房',desc:'眺めるだけでは終わらない。日々の手元で使う、ひみつ道具の入口。',items:['moon'],x:-4.2,z:2.8,kind:'workshop'},
  {id:'museum',no:'02',title:'素材の標本館',short:'標本館',desc:'身のまわりを、もう一度よく見る。素材や人間を、ひとつずつ標本として並べる場所。',items:['materials','ningen'],x:3.5,z:2.1,kind:'museum'},
  {id:'library',no:'03',title:'物語の書庫',short:'書庫',desc:'言葉をたどると、別の世界につながっている。読む速さも、寄り道も、あなたのままに。',items:['note','kakuyomu','panda','jikoshoukai','negai'],x:-3.2,z:-3.6,kind:'library'},
  {id:'observatory',no:'04',title:'思想の観測所',short:'観測所',desc:'当たり前の輪郭を、少しずつずらしてみる。論文と、その書き手にたどり着く観測点。',items:['zenodo','orcid','mission'],x:3.3,z:-4,kind:'observatory'},
  {id:'gallery',no:'05',title:'絵と音の回廊',short:'回廊',desc:'線を追う。音に耳を澄ます。絵、映像、音楽の続きは、それぞれの展示先で。',items:['pixiv','yt','spotify','ig'],x:-6.7,z:-.4,kind:'gallery'},
  {id:'post',no:'06',title:'便りの波止場',short:'波止場',desc:'この星の外へ、つくったものを届ける。日々の便りと、おすそわけの小さな店。',items:['x','tiktok','booth'],x:5.4,z:5,kind:'post'},
  {id:'playground',no:'07',title:'遊びの東屋',short:'東屋',desc:'ルールをひとつ覚えたら、遊びが始まる。盤を囲んで、少し寄り道。',items:[],x:0,z:-6.7,kind:'playground'},
];
const legacyPlaces=Object.fromEntries(districts.flatMap(d=>d.items.map(id=>[id,d.id])));
let byId=new Map(),currentItem=null,shelfPage=0,catalogueStamp='';
const PAGE_SIZE=3;
let catalogue, currentPlace=null, filter='all', world, previousFocus=null;
let motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let available = new Map();
const isExternalURL = (url) => {try{return ['https:','http:'].includes(new URL(url).protocol)}catch{return false}};
function node(tag,attrs={},text=''){const el=document.createElement(tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);el.textContent=text;return el}
function owner(id){return districts.find(d=>d.items.includes(id))}
function exhibit(item,index){
  const el=node('article',{class:'exhibit','data-item':item.id});
  el.append(node('span',{class:'exhibit-number'},`${owner(item.id)?.short || '目録'} ／ ${String(index+1).padStart(2,'0')}`),node('h3',{},item.title),node('p',{},item.desc));
  const inspect=node('button',{'aria-label':`${item.title}を手にとる`,class:'inspect'},'手にとる');inspect.addEventListener('click',()=>showSpecimen(item.id));el.append(inspect);
  el.append(entrance(item));
  if(statusText(item))el.append(node('span',{class:'source-state'},statusText(item)));
  return el;
}
function statusText(item){return ({Live:'登録上：公開',WIP:'登録上：制作中',Deprecated:'登録上：旧版・移行済'})[item.sourceStatus]||''}
function entrance(item){
  const el=node('div',{class:'entrance','data-entrance-item':item.id});
  const check=available.get(item.id);
  if(item.detailAvailable===false)el.append(node('span',{class:'unavailable'},'紹介ページを確認できず、入口は未確認です。'));
  else if(!isExternalURL(item.url)) el.append(node('span',{class:'unavailable'},item.sourceStatus==='WIP'?'制作中です。実物の入口はまだ登録されていません。':'入口はまだ登録されていません。'));
  else if(check?.status===404&&check.url===item.url) el.append(node('span',{class:'unavailable'},'この入口は現在見つかりません。'));
  else {
    const link=node('a',{href:item.url,rel:'noopener noreferrer','aria-label':`${item.title}をひらく`},'実物をひらく ↗');
    if(item.id==='moon')link.textContent='月で道具を選ぶ ↗';
    if(item.id==='mission')link.textContent='共有ボードをひらく ↗';
    link.addEventListener('click',event=>{if(link.getAttribute('aria-disabled')==='true'){event.preventDefault();return;}$('announcement').textContent=`${item.title}へ出かけます。ブラウザの「戻る」で同じ場所に帰れます。`});
    el.append(link);
  }
  return el;
}
function renderDirectory(){
  const matches=searchRecords(catalogue.destinations,{query:$('search').value,place:filter});
  $('catalogue-list').replaceChildren(...matches.map(exhibit));
  if(!matches.length)$('catalogue-list').append(node('p',{class:'no-results'},'見つかりませんでした。別の名前や説明で探してみてください。'));
  $('result-count').textContent=`${catalogue.destinations.length}件のうち ${matches.length}件`;
  for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b.dataset.filter===filter));
}
function writeRoute(replace=false){
  const params=new URLSearchParams();
  if(currentPlace)params.set('place',currentPlace.id);else if(document.body.classList.contains('visiting'))params.set('view','island');
  if(currentPlace&&shelfPage)params.set('shelf',shelfPage+1);
  if(currentPlace&&document.body.classList.contains('street-view'))params.set('street','1');
  if(currentItem)params.set('item',currentItem.id);
  if($('directory').classList.contains('is-open')){params.set('catalogue','1');if($('search').value)params.set('q',$('search').value);if(filter!=='all')params.set('filter',filter);}
  const url=location.pathname+location.search+(params.size?'#'+params:'');
  if(location.pathname+location.search+location.hash!==url)history[replace?'replaceState':'pushState'](null,'',url);
}
function directoryIsolation(value){for(const el of [$('world'),$('world-tools'),$('place-panel'),$('street-caption'),document.querySelector('.world-footer')])el.inert=value;$('arrival').inert=value||document.body.classList.contains('visiting');}
function showDirectory(record=true,focus=true){previousFocus=document.activeElement;$('directory').classList.add('is-open');directoryIsolation(true);if(focus)$('search').focus();if(record)writeRoute();}
function hideDirectory(record=true){$('directory').classList.remove('is-open');directoryIsolation(false);if(record)writeRoute();(previousFocus?.isConnected?previousFocus:$('directory-toggle')).focus();}
function visit(id,{focus=true,record=true,page=0}={}){
  const place=districts.find(d=>d.id===id);if(!place)return;
  currentPlace=place;shelfPage=page;
  document.body.classList.remove('street-view');$('return-exhibits').hidden=true;$('street-caption').hidden=true;
  $('arrival').inert=true;$('arrival').setAttribute('aria-hidden','true');
  document.body.classList.add('visiting','place-open');$('place-panel').hidden=false;
  $('place-number').textContent=`PLACE ${place.no} ／ ${place.items.length}件の展示`;
  $('place-title').textContent=place.title;$('place-description').textContent=place.desc;
  renderShelf();$('place-panel').scrollTop=0;
  $('location-label').textContent=`街の中 · ${place.title}`;
  for(const sign of $('landmarks').children)sign.setAttribute('aria-current',String(sign.dataset.place===id));
  world?.visit(place);
  if(record)writeRoute();
  $('announcement').textContent=`${place.title}に到着しました。${place.items.length}件の展示があります。`;
  if(focus)$('place-title').focus({preventScroll:true});
}
function overview({focus=true,record=true}={}){
  document.body.classList.remove('street-view');$('return-exhibits').hidden=true;$('street-caption').hidden=true;
  const old=currentPlace;currentPlace=null;$('arrival').inert=true;$('arrival').setAttribute('aria-hidden','true');$('place-panel').hidden=true;document.body.classList.remove('place-open');document.body.classList.add('visiting');
  $('location-label').textContent='惑星のまわり · 全景';world?.overview();
  for(const sign of $('landmarks').children)sign.removeAttribute('aria-current');
  if(record)writeRoute();
  if(focus)(document.querySelector(`[data-place="${old?.id}"]`)||$('overview')).focus();
}
function streetView(value,{record=true,focus=true}={}){
  if(!currentPlace||document.body.classList.contains('no-world'))return;
  document.body.classList.toggle('street-view',value);$('place-panel').hidden=value;$('return-exhibits').hidden=!value;$('street-caption').hidden=!value;
  $('street-name').textContent=currentPlace.title+'の前';$('location-label').textContent=`${value?'通り':'街の中'} · ${currentPlace.title}`;
  $('street-hint').textContent=currentPlace.id==='workshop'?'ドラッグで見回す。台の上の道具を、手にとろう。':'ドラッグで見回す。ひと息ついたら、展示に戻ろう。';
  world?.setStreet(value);if(record)writeRoute();
  if(focus)(value?$('return-exhibits'):$('street-view')).focus({preventScroll:true});
}
$('street-view').addEventListener('click',()=>streetView(true));$('return-exhibits').addEventListener('click',()=>streetView(false));
function noWorld(message){document.body.classList.add('no-world');showDirectory(false,false);$('loading').textContent=message;$('announcement').textContent=message;}
$('directory-toggle').addEventListener('click',()=>showDirectory());
$('close-directory').addEventListener('click',()=>hideDirectory());
$('search').addEventListener('input',()=>{renderDirectory();writeRoute(true)});
$('leave-place').addEventListener('click',()=>overview());
$('arrive').addEventListener('click',()=>visit('workshop'));
$('overview').addEventListener('click',()=>overview());
$('turn-left').addEventListener('click',()=>world?.rotate(-.3));
$('turn-right').addEventListener('click',()=>world?.rotate(.3));
$('canvas-host').addEventListener('planet:first-render',()=>{$('loading').hidden=true});
$('motion-toggle').addEventListener('click',()=>{motion=!motion;world?.setMotion(motion);updateMotion()});
function updateMotion(){$('motion-toggle').textContent=motion?'動きを止める':'動きをつける';$('motion-toggle').setAttribute('aria-pressed',String(!motion))}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('specimen').open){if($('directory').classList.contains('is-open')&&!document.body.classList.contains('no-world'))hideDirectory();else if(document.body.classList.contains('street-view'))streetView(false);else if(currentPlace&&!document.body.classList.contains('no-world'))overview();}});
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();showDirectory()});
function restoreRoute(){
  const params=new URLSearchParams(location.hash.slice(1));
  closeSpecimen(false);const rawPage=Number(params.get('shelf'));const page=Number.isInteger(rawPage)&&rawPage>0?rawPage-1:0;
  if(districts.some(d=>d.id===params.get('place')))visit(params.get('place'),{focus:false,record:false,page});
  else if(params.get('view')==='island')overview({focus:false,record:false});
  else {currentPlace=null;$('place-panel').hidden=true;document.body.classList.remove('place-open','visiting','street-view');$('return-exhibits').hidden=true;$('street-caption').hidden=true;$('arrival').inert=false;$('arrival').removeAttribute('aria-hidden');world?.overview();$('location-label').textContent='軌道上 · 訪問の入口';}
  if(currentPlace&&params.get('street')==='1')streetView(true,{record:false,focus:false});
  if(params.get('catalogue')==='1'){
    $('search').value=params.get('q')||'';filter=districts.some(d=>d.id===params.get('filter'))?params.get('filter'):'all';
    for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b.dataset.filter===filter));
    renderDirectory();showDirectory(false,false);
  }else {$('directory').classList.remove('is-open');directoryIsolation(false);}
  if(params.get('item'))showSpecimen(params.get('item'),false);
}
function renderShelf(){
  if(!currentPlace)return;const pages=Math.max(1,Math.ceil(currentPlace.items.length/PAGE_SIZE));shelfPage=Math.max(0,Math.min(pages-1,shelfPage));const start=shelfPage*PAGE_SIZE;
  $('shelf').replaceChildren(...currentPlace.items.slice(start,start+PAGE_SIZE).map((id,i)=>exhibit(byId.get(id),start+i)));
  $('shelf-page').textContent=`${shelfPage+1} / ${pages} 棚`;$('shelf-previous').disabled=shelfPage===0;$('shelf-next').disabled=shelfPage===pages-1;
}
function showSpecimen(id,record=true){
  const item=byId.get(id);if(!item)return;currentItem=item;
  $('specimen-label').textContent=[owner(item.id)?.title,item.type].filter(Boolean).join(' ／ ');
  const icon=item.icon||'◌';$('specimen-icon').textContent=[...icon].length<=4&&!/[\p{L}\p{N}]/u.test(icon)?icon:'◌';
  $('specimen-title').textContent=item.title;$('specimen-description').textContent=item.desc;
  $('specimen-steps').replaceChildren(...(item.steps||[]).map(step=>node('li',{},step)));$('specimen-steps').hidden=!item.steps?.length;
  $('specimen-actions').replaceChildren(entrance(item));
  if(item.sourceKind==='works'){
    const stamp=item.sourceGenerated||catalogueStamp;
    $('specimen-provenance').textContent=`${statusText(item)}。紹介・状態はWORKSの記録${stamp?'（'+stamp+'）':''}です。現在の稼働を示すものではありません。`;
    if(item.detailAvailable&&validURL(item.sourceUrl))$('specimen-provenance').append(document.createTextNode(' '),node('a',{href:item.sourceUrl},'元の紹介を見る ↗'));
  }else if(item.entranceSource){$('specimen-provenance').textContent='入口と紹介文は、現在の玄関に掲載されている内容を引き継いでいます。';$('specimen-provenance').append(document.createTextNode(' '),node('a',{href:item.entranceSource.url},'玄関を見る ↗'))}
  else $('specimen-provenance').textContent='既存の惑星に登録されていた行き先です。内容の続きは、リンク先でご覧いただけます。';
  if(!$('specimen').open)$('specimen').showModal();if(record)writeRoute();
}
function closeSpecimen(record=true){const old=currentItem;currentItem=null;if($('specimen').open)$('specimen').close();if(record){writeRoute(true);if(old&&document.body.classList.contains('street-view')){const tag=[...$('street-objects').children].find(el=>el.dataset.worldItem===old.id&&!el.hidden);(tag||$('return-exhibits')).focus({preventScroll:true});}}}
$('close-specimen').addEventListener('click',()=>closeSpecimen());$('specimen').addEventListener('cancel',e=>{e.preventDefault();closeSpecimen()});
for(const [id,delta] of [['shelf-previous',-1],['shelf-next',1]])$(id).addEventListener('click',()=>{shelfPage+=delta;renderShelf();writeRoute(true);$('shelf').scrollIntoView({block:'start'});if($(id).disabled)$(delta>0?'shelf-previous':'shelf-next').focus()});
$('place-directory').addEventListener('click',()=>{filter=currentPlace?.id||'all';$('search').value='';renderDirectory();showDirectory()});
$('wander').addEventListener('click',()=>{const candidates=catalogue.destinations.filter(i=>i.sourceKind==='works'&&i.sourceStatus==='Live'&&i.detailAvailable&&validURL(i.url));if(!candidates.length)return;const item=candidates[Math.floor(Math.random()*candidates.length)],place=owner(item.id);visit(place.id,{record:false,focus:false,page:Math.floor(place.items.indexOf(item.id)/PAGE_SIZE)});showSpecimen(item.id)});
async function optionalJSON(path){try{const r=await fetch(path);return r.ok?await r.json():null}catch{return null}}
async function loadLinkChecks(){
  try{
    const report=await optionalJSON('link-checks.json');
    if(!report||!Array.isArray(report.checks)||report.checks.some(check=>!check||typeof check.id!=='string'||!check.id||typeof check.url!=='string'||!(check.status===null||(Number.isInteger(check.status)&&check.status>=100&&check.status<=599))))return;
    const checks=new Map(report.checks.map(check=>[check.id,check]));
    if(checks.size!==report.checks.length)return;
    available=checks;
    // Patch entrances in place so a late optional report cannot reset navigation or focus.
    for(const el of document.querySelectorAll('[data-entrance-item]')){
      const item=byId.get(el.dataset.entranceItem),check=item&&available.get(item.id),link=el.querySelector('a');
      if(!link||check?.status!==404||check.url!==item.url)continue;
      const focused=document.activeElement===link;
      link.tabIndex=focused?0:-1;link.setAttribute('role','link');link.setAttribute('aria-disabled','true');link.removeAttribute('href');
      link.classList.add('unavailable');link.textContent='この入口は現在見つかりません。';link.setAttribute('aria-label',`${item.title}：この入口は現在見つかりません。`);
      if(focused)link.addEventListener('blur',()=>{link.tabIndex=-1},{once:true});
    }
  }catch{ /* Optional reachability evidence must never prevent the visit. */ }
}
addEventListener('popstate',restoreRoute);
async function boot(){
  try {
    const response=await fetch('destinations.json');if(!response.ok)throw Error('Catalogue unavailable');catalogue=await response.json();
    if(!Array.isArray(catalogue.destinations)||!catalogue.destinations.length)throw Error('Catalogue empty');
    const [extras,works,sourceUpdates]=await Promise.all([optionalJSON('tool-exhibits.json'),optionalJSON('works-catalogue.json'),optionalJSON('source-updates.json')]);
    // Both the current root and WORKS identify the Panda book behind the old '#'.
    const merged=mergeCatalogues(catalogue,extras,works,legacyPlaces,{panda:'works-amazon-b0gt4hjbf4'},sourceUpdates);catalogue.destinations=merged.records;byId=merged.byId;catalogueStamp=works?.sourceGenerated||'';
    const featured=['works-nandometer','works-wakkazukan','works-breathe'];
    for(const d of districts){d.items=catalogue.destinations.filter(item=>item.place===d.id).map(item=>item.id);d.items.sort((a,b)=>{const x=featured.indexOf(a),y=featured.indexOf(b);return(x<0?99:x)-(y<0?99:y)})}
    for(const d of districts){
      const sign=node('button',{class:'sign','data-place':d.id,'aria-label':`${d.title}を訪ねる`});sign.append(node('span',{},d.no),document.createTextNode(d.short));sign.addEventListener('click',()=>visit(d.id));$('landmarks').append(sign);
    }
    for(const d of [{id:'all',title:'すべて'},...districts]){const b=node('button',{'aria-pressed':String(d.id==='all'),'data-filter':d.id},d.id==='all'?d.title:d.short);b.addEventListener('click',()=>{filter=d.id;for(const c of $('filters').children)c.setAttribute('aria-pressed',String(c===b));renderDirectory();writeRoute(true)});$('filters').append(b)}
    renderDirectory();$('catalogue-date').textContent=works?`WORKS ${works.count}件と既存の行き先を接続。WORKSの目録：${catalogueStamp}。紹介・状態は登録時の記録です。`:`既存の行き先：${catalogue.updated}更新。追加の作品目録を読み込めませんでした。`;
    for(const id of ['arrive','wander','search'])$(id).disabled=false;
    $('loading').textContent='街を準備中です。先に目録から探せます。';
    document.body.classList.add('js-ready');updateMotion();restoreRoute();performance.mark('planet:catalogue-ready');
    void loadLinkChecks();
    try {
      const {makeWorld}=await import('./city-world.js?v=20260913-runtime-1');world=await makeWorld($('canvas-host'),districts,visit,motion,featured.map(id=>byId.get(id)).filter(item=>item&&validURL(item.url)),showSpecimen);
      if(currentPlace){world.visit(currentPlace);if(document.body.classList.contains('street-view'))world.setStreet(true)}else if(document.body.classList.contains('visiting'))world.overview();
    } catch(error){console.warn('World unavailable; catalogue retained.',error);noWorld('立体表示を読み込めないため、目録から作品をひらけます。');}
  } catch(error){console.error(error);$('catalogue-list').replaceChildren(node('p',{},'目録を読み込めませんでした。'),node('a',{href:'https://osakenpiro.github.io/works/'},'WORKSの作品目録へ ↗'),node('a',{href:'https://osakenpiro.github.io/'},'いつもの玄関へ ↗'));noWorld('目録の読み込みに失敗しました。作品目録か、いつもの玄関をご利用ください。');}
}
// GamingWatch transfer experiment: a local planning allocation, never a dispatch.
const planKinds=['research','development','verification'];
function calculateAllocation(){
  const budget=$('planning-budget').valueAsNumber;
  const shares=Object.fromEntries(planKinds.map(k=>[k,Number($('share-'+k).value)]));
  const sum=Object.values(shares).reduce((a,b)=>a+b,0);
  const valid=Number.isSafeInteger(budget)&&budget>0&&budget<=100000000&&sum<=100;
  $('planning-budget').setCustomValidity(sum>100?'配分の合計を100%以内にしてください。':'');
  const tokens=Object.fromEntries(planKinds.map(k=>[k,valid?Math.floor(budget*shares[k]/100):0]));
  for(const k of planKinds)$('tokens-'+k).textContent=valid?`${shares[k]}% · ${tokens[k].toLocaleString()} tokens`:`${shares[k]}%`;
  const reserve=valid?budget-Object.values(tokens).reduce((a,b)=>a+b,0):0;
  $('allocation-rest').textContent=sum>100?`配分が${sum-100}%超えています。どこに余力を戻そう。`:valid?`次の発見に残す余力：${reserve.toLocaleString()} tokens`:'まず、この計画に使う量を決めてみよう。';
  return valid?{budget,shares,tokens,reserve,kind:'planning-only'}:null;
}
$('open-council').addEventListener('click',()=>{
  try{const saved=JSON.parse(localStorage.getItem('bokunowakusei:planning:v1')||'null');if(saved?.kind==='planning-only'&&Number.isSafeInteger(saved.budget)&&saved.budget>0){$('planning-budget').value=String(saved.budget);for(const k of planKinds)if(Number.isFinite(saved.shares?.[k]))$('share-'+k).value=String(saved.shares[k]);}}catch{}
  calculateAllocation();$('council').showModal();
});
$('close-council').addEventListener('click',()=>$('council').close());
$('council').addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation()});
$('allocation-form').addEventListener('input',calculateAllocation);
$('allocation-form').addEventListener('submit',e=>{e.preventDefault();const plan=calculateAllocation();if(!plan)return;try{localStorage.setItem('bokunowakusei:planning:v1',JSON.stringify(plan));$('allocation-rest').textContent=`配分案をこのブラウザに保存しました。残す余力：${plan.reserve.toLocaleString()} tokens。`;}catch{$('allocation-rest').textContent='保存できませんでした。この画面では引き続き配分を試せます。'}});
boot();
