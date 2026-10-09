// Official WMS feature information; all rendered text is escaped, never upstream HTML.
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=s=>s.toLowerCase().replace(/[^a-z0-9äöü]/g,'');
const local=node=>node.localName;
export function featureInfoURL(provider,point){
  const {query}=provider,modern=provider.version==='1.3.0',d=.0001;
  const params=new URLSearchParams({SERVICE:'WMS',VERSION:provider.version,REQUEST:'GetFeatureInfo',LAYERS:query.layers,QUERY_LAYERS:query.layers,STYLES:'',FORMAT:'image/png',WIDTH:'101',HEIGHT:'101',INFO_FORMAT:query.format,FEATURE_COUNT:'10'});
  params.set(modern?'CRS':'SRS','EPSG:4326');
  params.set('BBOX',(modern?[point.lat-d,point.lon-d,point.lat+d,point.lon+d]:[point.lon-d,point.lat-d,point.lon+d,point.lat+d]).join(','));
  params.set(modern?'I':'X','50');params.set(modern?'J':'Y','50');
  return `/parcel-service/${provider.id}?${params}`;
}
function geometry(raw,swap){
  if(!raw||!['Polygon','MultiPolygon'].includes(raw.type))return null;
  function coords(c){if(!Array.isArray(c))throw Error('coordinates');if(typeof c[0]==='number'){const [lon,lat]=swap?[c[1],c[0]]:c;if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<47||lat>56||lon<5||lon>16)throw Error('coordinates');return [lon,lat];}return c.map(coords);}
  try{return {type:raw.type,coordinates:coords(raw.coordinates)};}catch{return null;}
}
function metadata(properties){
  const flat={};
  function visit(obj){for(const [k,v] of Object.entries(obj||{})){if(v&&typeof v==='object'){if('value' in v)flat[key(k)]=v.value;else visit(v);}else if(v!==null&&v!==undefined&&v!=='')flat[key(k)]=v;}}
  visit(properties);
  const pick=(...keys)=>{for(const k of keys)if(flat[key(k)]!==undefined)return String(flat[key(k)]);return '';};
  const reference=pick('Flurstückskennzeichen','flurstueckskennzeichen','nationalCadastralReference','cp_nationalcadastralreference','flstkennz');
  const numerator=pick('Flurstückskennzeichen (Zähler)','zaehler','flstnrzae'),denominator=pick('Flurstückskennzeichen (Nenner)','nenner','flstnrnen');
  return {reference,number:pick('label','flurstueckstext','Flurstuecksnummer')||(numerator+(denominator&&denominator!=='0'?'/'+denominator:'')),district:pick('Gemarkungsname','gemarkung_name','gemarkung','Gemarkungsschluessel','Gemarkungsnummer','gemarkung_id'),section:pick('flurnummer','flur'),area:pick('Amtliche Fläche (m2)','amtliche_flaeche','amtlicheFlaeche','areaValue','flaeche','Flaeche_in_m2','Amtliche_Flaeche_qm')};
}
export function parseParcelFeatures(text,provider){
  let features=[];
  if(provider.query.format.includes('json')){
    const data=JSON.parse(text);if(!Array.isArray(data.features))throw Error('Ungültige Dienstantwort');
    features=data.features.map(f=>({...metadata(f.properties),geometry:geometry(f.geometry,provider.query.swapXY===true)}));
  }else{
    const doc=new DOMParser().parseFromString(text,'application/xml');
    if(doc.querySelector('parsererror')||Array.from(doc.getElementsByTagName('*')).some(n=>/Exception/.test(local(n))))throw Error('Ungültige Dienstantwort');
    const nodes=Array.from(doc.getElementsByTagName('*')).filter(n=>['AX_Flurstueck','EX_Flurstueck','CadastralParcel','CP.CadastralParcel','flurstuecke'].includes(local(n)));
    features=nodes.map(node=>{
      const props={};for(const n of node.getElementsByTagName('*'))if(!n.children.length&&n.textContent.trim())props[local(n)]=n.textContent.trim();
      const polygons=Array.from(node.getElementsByTagName('*')).filter(n=>local(n)==='Polygon').map(poly=>{
        const rings=Array.from(poly.getElementsByTagName('*')).filter(n=>['exterior','interior','outerBoundaryIs','innerBoundaryIs'].includes(local(n)));
        return rings.map(r=>{const pos=Array.from(r.getElementsByTagName('*')).find(n=>local(n)==='posList');if(!pos)return [];const vals=pos.textContent.trim().split(/\s+/).map(Number);if(vals.length%2)return [];return Array.from({length:vals.length/2},(_,i)=>[vals[i*2],vals[i*2+1]]);});
      }).filter(rings=>rings.length&&rings.every(r=>r.length>=4));
      return {...metadata(props),geometry:polygons.length?geometry({type:'MultiPolygon',coordinates:polygons},true):null};
    });
  }
  const seen=new Set();
  return features.filter(f=>f.reference||f.number).filter(f=>{const id=f.reference||`${f.district}/${f.section}/${f.number}`;if(seen.has(id))return false;seen.add(id);return true;}).map(f=>({...f,provider:provider.name,providerId:provider.id,source:provider.source,attribution:provider.attribution,license:provider.license,licenseUrl:provider.licenseUrl}));
}
export function parcelDescription(parcel){return `Flurstück ${parcel.number||parcel.reference}${parcel.district?' · Gemarkung '+parcel.district:''}${parcel.section?' · Flur '+parcel.section:''}`;}
export function parcelSummaryHTML(parcel,links=true){
  return `<strong>${escape(parcelDescription(parcel))}</strong>${parcel.reference?`<br>Kennzeichen: ${escape(parcel.reference)}`:''}${parcel.area?`<br>Amtliche Fläche: ${escape(new Intl.NumberFormat('de-DE').format(Number(parcel.area)))} m²`:''}<br>${links?`<a href="${escape(parcel.source)}" target="_blank" rel="noopener">${escape(parcel.attribution)}</a> · <a href="${escape(parcel.licenseUrl)}" target="_blank" rel="noopener">${escape(parcel.license)}</a>`:escape(parcel.attribution)+' · '+escape(parcel.license)}`;
}
export function setupParcelSelection({map,button,panel,checkbox,getProviders,getSite,onSelect,onMode}){
  let enabled=false,revision=0,controller=null,pending=null,lastPoint=null,group=[];
  const highlight=L.layerGroup().addTo(map);
  const status=panel.querySelector('[data-status]'),results=panel.querySelector('[data-results]'),use=panel.querySelector('[data-use]'),retry=panel.querySelector('[data-retry]');
  function reset(){revision++;controller?.abort();pending=null;lastPoint=null;highlight.clearLayers();results.replaceChildren();use.disabled=true;panel.querySelector('[data-add-group]').disabled=true;retry.hidden=true;drawGroup();}
  function drawGroup(){
    const holder=panel.querySelector('[data-group-list]'),finish=panel.querySelector('[data-finish-group]');holder.replaceChildren();
    group.forEach((parcel,index)=>{const row=document.createElement('p');row.className='scope-chip';row.textContent=`${index+1}. ${parcelDescription(parcel)}${parcel.area?` · ${new Intl.NumberFormat('de-DE').format(Number(parcel.area))} m²`:''}`;holder.append(row);});
    finish.hidden=group.length===0;finish.textContent=`Standort mit ${group.length} ${group.length===1?'Flurstück':'Flurstücken'} übernehmen`;
    for(const parcel of group)if(parcel.geometry)L.geoJSON({type:'Feature',properties:{},geometry:parcel.geometry},{interactive:false,style:{color:'#b46523',weight:3,fillColor:'#f2b75b',fillOpacity:.32}}).addTo(highlight);
  }
  function choose(feature,point){
    pending={feature,point};highlight.clearLayers();
    if(feature){feature.selectedPoint=point;}if(feature?.geometry)L.geoJSON({type:'Feature',properties:{},geometry:feature.geometry},{interactive:false,style:{color:'#b46523',weight:3,fillColor:'#f2b75b',fillOpacity:.35}}).addTo(highlight);
    L.circleMarker([point.lat,point.lon],{interactive:false,radius:7,color:'#9b4c14',fillColor:'#ffd38a',fillOpacity:1,weight:3}).addTo(highlight);
    use.disabled=false;panel.querySelector('[data-add-group]').disabled=!feature||group.some(p=>p.reference===feature.reference);use.textContent=feature?'Flurstück als Standort übernehmen':'Kartenpunkt als Standort übernehmen';
    status.textContent=feature?(feature.geometry?'Flurstück ausgewählt. Orange zeigt die vom Landesdienst gelieferte Grenze.':'Flurstück ausgewählt. Der Dienst liefert keine Grenze; markiert ist der angeklickte Punkt.'):'Manuelle Auswahl auf der Flurstückskarte. Kennzeichen und Grenze wurden nicht automatisch ermittelt.';
  }
  async function lookup(point){
    reset();map.closePopup();lastPoint=point;
    if(map.getZoom()<17){status.textContent='Bitte bis Zoom 17 hineinzoomen und innerhalb des gewünschten Flurstücks klicken.';map.setView([point.lat,point.lon],17);return;}
    const providers=getProviders(point).filter(p=>point.lat>=p.bounds[0]&&point.lat<=p.bounds[2]&&point.lon>=p.bounds[1]&&point.lon<=p.bounds[3]);
    if(!providers.length){status.textContent='Hier sind keine Flurstücksdienste verfügbar. Bitte einen Standort in Deutschland wählen.';return;}
    const queryable=providers.filter(p=>p.query);
    if(!queryable.length){status.textContent=`${providers.map(p=>p.name).join(', ')}: Der Kartendienst liefert keine einzelnen Flurstücke. Sie können einen Kartenpunkt manuell übernehmen oder die Fläche zeichnen.`;const b=document.createElement('button');b.className='button';b.textContent='Diesen Punkt manuell auswählen';b.onclick=()=>choose(null,point);results.append(b);return;}
    const current=revision;controller=new AbortController();const abort=controller;
    const timer=setTimeout(()=>abort.abort(),20000);status.textContent='Flurstück wird beim Landesdienst abgefragt …';
    const responses=await Promise.allSettled(queryable.map(async p=>{const r=await fetch(featureInfoURL(p,point),{signal:abort.signal});if(!r.ok)throw Error('Dienstfehler');const text=await r.text();if(text.length>5000000)throw Error('Antwort zu groß');return parseParcelFeatures(text,p);}));
    clearTimeout(timer);if(current!==revision||!enabled)return;
    const features=responses.flatMap(r=>r.status==='fulfilled'?r.value:[]),failed=responses.some(r=>r.status==='rejected');
    if(!features.length){status.textContent=failed?'Flurstücksabfrage nicht erreichbar. Bitte erneut versuchen.':'Kein Flurstück gefunden. Bitte innerhalb einer sichtbaren Flurstücksgrenze klicken.';retry.hidden=false;return;}
    for(const f of features){const b=document.createElement('button');b.className='parcel-result';b.innerHTML=parcelSummaryHTML(f,false);b.setAttribute('aria-pressed','false');b.onclick=e=>{if(e.target.closest('a'))return;for(const child of results.children)child.setAttribute('aria-pressed','false');b.setAttribute('aria-pressed','true');choose(f,point);};results.append(b);}
    if(features.length===1)results.firstElementChild.click();else status.textContent=`${features.length} Flurstücke gefunden. Bitte das gewünschte Flurstück auswählen.`;
    if(failed){status.textContent+=' Ein weiterer Landesdienst ist nicht erreichbar.';retry.hidden=false;}
  }
  function setEnabled(value){enabled=value;if(!value)group=[];reset();panel.hidden=!value;button.classList.toggle('selected',value);button.setAttribute('aria-pressed',String(value));onMode(value);map.getContainer().style.cursor=value?'crosshair':'';
    if(value){checkbox.checked=true;checkbox.dispatchEvent(new Event('change'));const site=getSite();if(site)map.setView([site.lat,site.lon],Math.max(17,map.getZoom()));status.textContent='Adresse suchen oder hineinzoomen. Dann innerhalb eines Flurstücks klicken und die Auswahl übernehmen.';}
  }
  button.onclick=()=>setEnabled(!enabled);
  panel.querySelector('[data-map]').onclick=()=>map.getContainer().scrollIntoView({block:'center',behavior:'smooth'});
  document.getElementById('parcel-selection-back').onclick=()=>panel.scrollIntoView({block:'start',behavior:'smooth'});
  panel.querySelector('[data-add-group]').onclick=()=>{if(!pending?.feature)return;group.push(pending.feature);reset();drawGroup();status.textContent=`${group.length} ${group.length===1?'Flurstück wurde':'Flurstücke wurden'} hinzugefügt. Klicken Sie auf ein benachbartes Flurstück oder übernehmen Sie den Standort.`;};
  panel.querySelector('[data-finish-group]').onclick=()=>{if(!group.length)return;const parcels=[...group],points=parcels.map(p=>p.selectedPoint).filter(Boolean),coords=points.length?points:[pending?.point].filter(Boolean);const point={lat:coords.reduce((n,p)=>n+p.lat,0)/coords.length,lon:coords.reduce((n,p)=>n+p.lon,0)/coords.length};const geometries=parcels.flatMap(p=>p.geometry?(p.geometry.type==='Polygon'?[p.geometry.coordinates]:p.geometry.coordinates):[]);const numericAreas=parcels.map(p=>Number(p.area)).filter(Number.isFinite);const district=[...new Set(parcels.map(p=>p.district).filter(Boolean))].join(', ');const parcel={...parcels[0],number:parcels.map(p=>p.number||p.reference).join(', '),reference:parcels.map(p=>p.reference).filter(Boolean).join('; '),district,area:numericAreas.length===parcels.length?numericAreas.reduce((n,a)=>n+a,0):'',geometry:geometries.length?{type:'MultiPolygon',coordinates:geometries}:null,parcels};onSelect(point,parcel);group=[];drawGroup();};
  panel.querySelector('[data-clear]').onclick=()=>{group=[];reset();status.textContent='Auswahl aufgehoben. Klicken Sie auf ein Flurstück.';};
  retry.onclick=()=>{if(lastPoint)lookup(lastPoint);};
  use.onclick=()=>{if(!pending)return;try{onSelect(pending.point,pending.feature);status.textContent='Auswahl als Projektstandort übernommen.';}catch(error){status.textContent=error.message;}};
  checkbox.addEventListener('change',()=>{if(!checkbox.checked&&enabled)setEnabled(false);});
  map.on('movestart',()=>{if(controller){revision++;controller.abort();controller=null;if(enabled&&!pending){status.textContent='Klicken Sie im neuen Ausschnitt auf ein Flurstück.';retry.hidden=true;}}});
  return {get enabled(){return enabled;},setEnabled,lookup,cancelPending:()=>{if(enabled){reset();status.textContent='Klicken Sie am neuen Standort auf ein Flurstück.';}}};
}
