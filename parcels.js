export const overlaps=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
export function visibleParcelProviders(providers,bounds,zoom){return providers.filter(p=>zoom>=p.minZoom&&overlaps(p.bounds,bounds));}
export function setupParcels({map,checkbox,status,zoomButton,retryButton,getSite}){
  let providers=[],ready=false,failed=false;
  const active=new Map();
  map.createPane('parcels');map.getPane('parcels').style.zIndex=350;map.getPane('parcels').style.pointerEvents='none';
  function report(){
    retryButton.hidden=true;zoomButton.hidden=true;
    if(failed){status.textContent='Flurstücksdienste konnten nicht vorbereitet werden. Bitte erneut laden.';retryButton.hidden=false;return;}
    if(!ready){status.textContent='Flurstücksdienste werden vorbereitet …';return;}
    if(!checkbox.checked){status.textContent='Amtliche Landesdienste für 16 Bundesländer · ab Zoom 17. Bayern: Parzellarkarte ohne Flurstücksnummern.';return;}
    if(map.getZoom()<17){status.textContent='Für Flurstücksgrenzen bitte näher an den Standort zoomen (ab Zoom 17).';zoomButton.hidden=false;return;}
    if(!active.size){status.textContent='Außerhalb der erfassten Landesgebiete. Bitte einen Standort in Deutschland wählen.';return;}
    const records=[...active.values()],errors=records.filter(r=>r.errors),loading=records.some(r=>r.loading);
    const names=records.map(r=>r.provider.name).join(', ');
    status.textContent=errors.length?`Flurstückskarten teilweise oder vollständig nicht erreichbar: ${errors.map(r=>r.provider.name).join(', ')}. Erneut laden möglich.`:loading?`Flurstücke werden geladen: ${names} …`:`Flurstückskarten geladen: ${names}. ${records.map(r=>r.provider.note).filter(Boolean).join(' ')} Stand und Beschriftung laut Landesdienst; keine amtliche Vermessung.`;
    retryButton.hidden=!errors.length;
  }
  function update(){
    if(!ready){report();return;}
    const b=map.getBounds(),bounds=[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()];
    const wanted=checkbox.checked?visibleParcelProviders(providers,bounds,map.getZoom()):[];
    for(const [id,r] of active)if(!wanted.some(p=>p.id===id)){active.delete(id);map.removeLayer(r.layer);}
    for(const p of wanted){
      if(active.has(p.id))continue;
      const record={provider:p,loading:true,errors:0};
      const attribution=`Flurstücke: <a href="${p.source}" target="_blank" rel="noopener">© ${p.attribution}</a> · <a href="${p.licenseUrl}" target="_blank" rel="noopener">${p.license}</a>`;
      const layer=L.tileLayer.wms(p.url,{layers:p.layers,styles:p.styles,version:p.version,format:'image/png',transparent:true,pane:'parcels',minZoom:p.minZoom,maxZoom:19,bounds:[[p.bounds[0],p.bounds[1]],[p.bounds[2],p.bounds[3]]],attribution,keepBuffer:0,updateWhenIdle:true,updateWhenZooming:false});
      record.layer=layer;active.set(p.id,record);
      layer.on('loading',()=>{if(active.get(p.id)!==record)return;record.loading=true;record.errors=0;report();});
      layer.on('tileerror',()=>{if(active.get(p.id)!==record)return;record.errors++;report();});
      layer.on('load',()=>{if(active.get(p.id)!==record)return;record.loading=false;report();});
      layer.addTo(map);
    }
    report();
  }
  async function init(){
    failed=false;checkbox.disabled=true;report();
    try{const response=await fetch('data/parcel-services.json');if(!response.ok)throw Error('Manifest');const data=await response.json();if(!Array.isArray(data.providers)||data.providers.length!==16)throw Error('Manifest');providers=data.providers;ready=true;checkbox.disabled=false;update();}
    catch{failed=true;report();}
  }
  checkbox.addEventListener('change',()=>{if(checkbox.checked&&getSite()&&map.getZoom()<17){const site=getSite();map.setView([site.lat,site.lon],17);}update();});
  zoomButton.onclick=()=>{const site=getSite();map.setView(site?[site.lat,site.lon]:map.getCenter(),17);};
  retryButton.onclick=()=>{if(!ready){init();return;}for(const r of active.values()){r.errors=0;r.layer.redraw();}report();};
  map.on('moveend',update);init();
  return {getProviders:()=>providers,sourcesHtml(esc){return providers.map(p=>`<li><strong>${esc(p.name)}</strong>: <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.attribution)}</a> · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>${p.note?' · '+esc(p.note):''}</li>`).join('');}};
}
