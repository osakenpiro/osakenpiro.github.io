"use strict";
(function(){
  const $ = function(id){return document.getElementById(id);};
  const labels={active:"掲載中",watch:"観測中",hidden:"非掲載",retired:"終了申告"};
  let records=[];
  function el(tag,cls,value){
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(value!==undefined&&value!==null)e.textContent=String(value);
    return e;
  }
  function add(parent,child){parent.appendChild(child);return child;}
  function allowedURL(raw){
    try{
      const u=new URL(raw);
      return (u.protocol==="https:"&&u.hostname==="osakenpiro.github.io")?u.href:null;
    }catch(e){return null;}
  }
  function draw(){
    const query=$("search").value.trim().toLocaleLowerCase("ja");
    const category=$("category").value;
    const state=$("state").value;
    const matched=records.filter(function(r){
      if(state!=="all"&&r.state!==state)return false;
      if(category!=="all"&&r.category!==category)return false;
      const field=[r.name,r.description,r.category].concat(Array.isArray(r.tags)?r.tags:[]).join(" ").toLocaleLowerCase("ja");
      return !query||field.includes(query);
    }).sort(function(a,b){return a.name.localeCompare(b.name,"ja");});
    $("result").textContent=matched.length+" 件表示 / "+records.length+" 件を記録";
    const target=$("entries");target.replaceChildren();
    if(!matched.length){
      add(target,el("p","empty","この条件で見つかる記録はありません。"));
      // Prefill a different dictionary, but NEVER transmit the query automatically.
      const link=add(target,el("a","dictionary-jump","外部辞書で探す ↓"));
      link.href="#external-dictionary";
      link.addEventListener("click",function(){
        const external=document.getElementById("dictionary-query");
        if(external && q.length>=2) external.value=$("search").value.trim().slice(0,80);
      });
      return;
    }
    matched.forEach(function(r,i){
      const row=add(target,el("article","entry"));
      add(row,el("div","ordinal",String(i+1).padStart(2,"0")));
      const body=add(row,el("div"));
      const head=add(body,el("div","entry-top"));
      add(head,el("h3","",r.name));
      add(head,el("span","badge "+(labels[r.state]?r.state:"hidden"),labels[r.state]||"状態不明"));
      add(head,el("span","badge",r.category||"未分類"));
      add(body,el("p","",r.description||"説明未登録"));
      const meta=add(body,el("div","meta"));
      add(meta,el("span","","運営 osakenpiro"));
      add(meta,el("span","","確認日 "+(r.last_checked_at||"未確認")));
      if(r.state!=="active")add(meta,el("span","",r.reason||"再確認待ち"));
      if(r.commercial_relation&&r.commercial_relation!=="none"){
        add(meta,el("span","badge","収益関係あり："+r.commercial_relation));
      }
      const tags=add(body,el("div","meta"));
      (Array.isArray(r.tags)?r.tags:[]).forEach(function(tag){add(tags,el("span","tag","#"+tag));});
      const url=allowedURL(r.url);
      if(url&&(r.state==="active"||r.state==="watch")){
        const a=add(body,el("a","go","公式サイトへ →"));
        a.href=url;a.target="_blank";a.rel="noopener noreferrer";
        a.setAttribute("aria-label",r.name+" の公式サイトを新しいタブで開く");
      }else{
        const off=add(body,el("span","go off","現在は非掲載"));
        off.setAttribute("aria-disabled","true");
      }
    });
  }
  fetch("./catalog.json",{cache:"no-store"})
    .then(function(resp){if(!resp.ok)throw Error("HTTP "+resp.status);return resp.json();})
    .then(function(data){
      if(!data||!Array.isArray(data.services))throw Error("Invalid catalog");
      records=data.services.filter(function(r){return r&&typeof r.id==="string"&&typeof r.name==="string";});
      $("count-all").textContent=records.length;
      $("count-active").textContent=records.filter(function(r){return r.state==="active";}).length;
      $("count-other").textContent=records.filter(function(r){return r.state!=="active";}).length;
      const categories=Array.from(new Set(records.map(function(r){return r.category;}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,"ja");});
      categories.forEach(function(category){const opt=el("option","",category);opt.value=category;$("category").appendChild(opt);});
      ["search","category","state"].forEach(function(id){$(id).addEventListener(id==="search"?"input":"change",draw);});
      draw();
    })
    .catch(function(){
      $("result").textContent="名鑑データを読み込めませんでした。";
      add($("entries"),el("p","empty","時間をおいて再表示してください。"));
    });
})();
