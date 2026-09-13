export const validURL = value => {try{return ['http:','https:'].includes(new URL(value).protocol)}catch{return false}};
const urlKey = value => validURL(value) ? new URL(value).href : null;
const titleKey = value => String(value||'').normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase();

// A WORKS row is an identity, not a URL. Several works may share one destination.
export function mergeCatalogues(original, extras, works, legacyPlaces, resolutions={}, sourceUpdates=null){
  const records=(works?.items||[]).map(item=>({...item,aliases:[],legacyRecords:[]}));
  for(const legacy of [...original.destinations,...(extras?.items||[])]){
    const key=urlKey(legacy.url);
    const candidates=key?records.filter(item=>urlKey(item.url)===key):records.filter(item=>titleKey(item.title)===titleKey(legacy.title));
    const sameTitle=candidates.filter(item=>titleKey(item.title)===titleKey(legacy.title));
    const resolved=records.find(item=>item.id===resolutions[legacy.id]);
    const match=resolved||(candidates.length===1?candidates[0]:sameTitle.length===1?sameTitle[0]:null);
    if(match){
      match.aliases.push(legacy.id);match.legacyRecords.push({...legacy});
      if(legacyPlaces[legacy.id])match.place=legacyPlaces[legacy.id];
    }else records.push({...legacy,place:legacy.place||legacyPlaces[legacy.id]||'workshop',sourceKind:'cosmos',aliases:[],legacyRecords:[]});
  }
  const byId=new Map();
  for(const item of records){
    for(const id of [item.id,...item.aliases]){
      if(byId.has(id))throw Error(`Ambiguous catalogue identity: ${id}`);
      byId.set(id,item);
    }
  }
  for(const update of sourceUpdates?.updates||[]){
    const item=byId.get(update.id);
    if(!item||!validURL(update.url))throw Error('Invalid source entrance update');
    if(item.id===update.id)item.legacyRecords.push({...original.destinations.find(i=>i.id===update.id)});
    item.url=update.url;if(update.desc)item.desc=update.desc;
    item.entranceSource={url:sourceUpdates.sourceUrl,blobSha:sourceUpdates.sourceBlobSha};
  }
  return {records,byId};
}

export function searchRecords(records,{query='',place='all',status='all'}={}){
  const words=query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter(item=>{
    const text=[item.title,item.desc,item.type,item.pillar,...(item.aliases||[])].join(' ').normalize('NFKC').toLocaleLowerCase();
    return (place==='all'||item.place===place)&&(status==='all'||item.sourceStatus===status)&&words.every(word=>text.includes(word));
  });
}
