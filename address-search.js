// Accessible, rate-limited address suggestions using the configured Photon service.
export function setupAddressSearch({input,form,list,status,getConfig,isReady,isAllowed,selectSite,onError}) {
  let timer,controller,revision=0,lastRequest=0,active=-1,items=[],composing=false;
  const cache=new Map();
  const coordinates=q=>q.match(/^(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)$/);
  function close(){
    clearTimeout(timer);controller?.abort();revision++;items=[];active=-1;
    list.replaceChildren();list.hidden=true;input.setAttribute('aria-expanded','false');
    input.removeAttribute('aria-activedescendant');input.setAttribute('aria-busy','false');status.textContent='';
  }
  function highlight(index){
    active=index;
    [...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));
    if(active<0)input.removeAttribute('aria-activedescendant');
    else{input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});}
  }
  async function choose(item){
    close();input.value=item.label;
    try{await selectSite(item.point,{name:item.label});}catch(error){onError(error.message);}
  }
  function show(features){
    const seen=new Set();
    items=features.flatMap(feature=>{
      const c=feature.geometry?.coordinates,p=feature.properties||{};
      if(!Array.isArray(c)||!Number.isFinite(c[0])||!Number.isFinite(c[1]))return [];
      const point={lat:c[1],lon:c[0]};if(!isAllowed(point))return [];
      const street=[p.street,p.housenumber].filter(Boolean).join(' ');
      const locality=[p.postcode,p.city||p.town||p.village].filter(Boolean).join(' ');
      const title=[p.name!==p.street?p.name:null,street].filter(Boolean).join(' · ')||locality||p.state||'Standort';
      const detail=[locality!==title?locality:null,p.district,p.state].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
      const label=[title,detail].filter(Boolean).join(', '),key=`${label}:${point.lat}:${point.lon}`;
      if(seen.has(key))return [];seen.add(key);return [{point,title,detail,label}];
    }).slice(0,6);
    list.replaceChildren();active=-1;input.removeAttribute('aria-activedescendant');
    for(const [i,item] of items.entries()){
      const option=document.createElement('button');option.type='button';option.className='search-result';option.id=`address-option-${i}`;
      option.setAttribute('aria-label',item.label);option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.tabIndex=-1;
      const title=document.createElement('strong');title.textContent=item.title;option.append(title);
      if(item.detail){const detail=document.createElement('span');detail.textContent=item.detail;option.append(detail);}
      option.addEventListener('pointerdown',e=>e.preventDefault());option.onclick=()=>choose(item);list.append(option);
    }
    list.hidden=!items.length;input.setAttribute('aria-expanded',String(items.length>0));
    status.textContent=items.length?`${items.length} Vorschläge. Mit Pfeiltasten auswählen und mit Enter übernehmen.`:'Keine Treffer in Deutschland. Straße und Ort ergänzen oder Koordinaten eingeben.';
  }
  async function search(q,token){
    if(token!==revision)return;
    if(!isReady()){status.textContent='Adresssuche wird vorbereitet …';return;}
    const key=q.toLocaleLowerCase('de');
    if(cache.has(key)){show(cache.get(key));return;}
    const config=getConfig(),remaining=Math.max(0,(config.searchIntervalMs||1500)-(Date.now()-lastRequest));
    if(remaining){timer=setTimeout(()=>search(q,token),remaining);return;}
    controller=new AbortController();const requestController=controller;
    const timeout=setTimeout(()=>requestController.abort(),15000);
    lastRequest=Date.now();input.setAttribute('aria-busy','true');status.textContent='Adressvorschläge werden gesucht …';
    try{
      const url=new URL(config.geocoder);url.search=new URLSearchParams({q,limit:'6',lang:'de',bbox:'5.8,47.2,15.1,55.2'});
      const response=await fetch(url,{signal:requestController.signal});if(!response.ok)throw Error('Suchdienst nicht erreichbar');
      const data=await response.json();if(token!==revision)return;
      const features=Array.isArray(data.features)?data.features:[];cache.set(key,features);
      while(cache.size>30)cache.delete(cache.keys().next().value);
      show(features);
    }catch(error){if(token===revision)status.textContent='Adresssuche derzeit nicht erreichbar. Erneut suchen, auf die Karte klicken oder Koordinaten eingeben.';}
    finally{clearTimeout(timeout);if(token===revision)input.setAttribute('aria-busy','false');}
  }
  function schedule(immediate=false){
    close();const q=input.value.trim();if(composing||!q)return;
    if(coordinates(q)){status.textContent='Koordinaten mit Enter übernehmen.';return;}
    if(q.length<3){status.textContent='Mindestens 3 Zeichen für Adressvorschläge eingeben.';return;}
    status.textContent='Adressvorschläge werden gesucht …';const token=revision;
    timer=setTimeout(()=>search(q,token),immediate?0:450);
  }
  input.addEventListener('input',()=>schedule());
  input.addEventListener('compositionstart',()=>{composing=true;close();});
  input.addEventListener('compositionend',()=>{composing=false;schedule();});
  input.addEventListener('focus',()=>{if(input.value.trim())schedule();});
  input.addEventListener('blur',close);
  input.addEventListener('keydown',e=>{
    if(e.isComposing||composing)return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if((e.key==='ArrowDown'||e.key==='ArrowUp')&&items.length){e.preventDefault();highlight((active+(e.key==='ArrowDown'?1:active<0?0:-1)+items.length)%items.length);}
    if(e.key==='Enter'&&active>=0&&items[active]){e.preventDefault();choose(items[active]);}
  });
  form.addEventListener('submit',e=>{
    e.preventDefault();if(composing)return;
    const q=input.value.trim(),coords=coordinates(q);
    if(coords){close();try{Promise.resolve(selectSite({lat:Number(coords[1]),lon:Number(coords[2])})).catch(error=>onError(error.message));}catch(error){onError(error.message);}return;}
    schedule(true);
  });
  return {refresh(){if(document.activeElement===input)schedule();}};
}
