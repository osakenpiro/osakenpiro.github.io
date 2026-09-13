const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.hidden=false;this.value='';this._text='';}
 set textContent(t){this._text=String(t);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set innerHTML(_){throw Error('HTML insertion is forbidden for record content');}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this._text='';this.children=nodes;}
 setAttribute(k,v){this.attrs[k]=v;}
 focus(){} click(){this.onclick?.();}
}
const nodes=new Map(),events={},outgoing=[];
const get=id=>{if(!nodes.has(id))nodes.set(id,new Element('div'));return nodes.get(id);};
get('body').contentWindow={postMessage:(data,origin)=>outgoing.push({data,origin})};
const document={getElementById:get,createElement:tag=>new Element(tag),querySelectorAll:()=>get('topics').children};
const context={document,location:{origin:'http://localhost'},addEventListener:(name,fn)=>events[name]=fn};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/../atlas.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
const valid={schema:'body-records/v1',records:[{id:'demo',title:'<img src=x onerror=alert(1)>',date:'2026-01-01',topics:['kidney'],source:'synthetic fixture',evidence:'test only',series:[{date:'2026-01-01',value:'未測定',unit:'mg/dL'}]}]};
async function importData(data){await get('record-file').onchange({target:{files:[{size:100,text:async()=>JSON.stringify(data)}],value:'fixture'}});}
(async()=>{
 assert.equal(get('topics').children.length,8);
 await importData(valid);
 assert.match(get('record-list').textContent,/<img src=x onerror=alert\(1\)>/);
 assert.match(get('record-list').textContent,/未測定/);
 run("selectTopic('eye')");assert.match(get('record-list').textContent,/まだ記録がありません/);
 run("selectTopic('kidney')");assert.match(get('record-list').textContent,/synthetic fixture/);
 await importData({...valid,records:[valid.records[0],valid.records[0]]});assert.match(get('import-status').textContent,/読込できません/);
 assert.match(get('record-list').textContent,/synthetic fixture/); // bad import does not destroy old records
 await importData({...valid,records:[{...valid.records[0],topics:['toString']}]});assert.match(get('import-status').textContent,/読込できません/);
 let resolve;const pending=get('record-file').onchange({target:{files:[{size:100,text:()=>new Promise(r=>resolve=r)}],value:''}});
 get('clear').click();resolve(JSON.stringify(valid));await pending;assert.doesNotMatch(get('record-list').textContent,/synthetic fixture/);
 await importData(valid);events.pagehide();assert.doesNotMatch(get('record-list').textContent,/synthetic fixture/);
 assert(outgoing.every(x=>x.origin==='http://localhost'&&Object.keys(x.data).sort().join(',')==='groups,type'));
 const before=get('region-label').textContent;events.message({origin:'https://evil.example',source:get('body').contentWindow,data:{type:'body-atlas-picked',name:'wrong'}});assert.equal(get('region-label').textContent,before);
 get('tab-knowledge').onkeydown({key:'ArrowRight',preventDefault(){}});assert.equal(get('records').hidden,false);
 const html=fs.readFileSync(__dirname+'/../index.html','utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Function(m[1]);
 assert.match(fs.readFileSync(__dirname+'/../atlas.html','utf8'),/connect-src 'none'/);
 console.log('PASS: 8 topics; import/render; text injection; missing values; filters; duplicate/unknown topic rejection; atomic import; clear race; pagehide; message privacy/origin; keyboard tabs; existing inline JS syntax; CSP. Browser/WebGL visual verification is separate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
