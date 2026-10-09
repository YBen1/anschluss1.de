const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const levels={mv:'Mittelspannung',hv:'Hochspannung'};
export const operatorQuery='query ($coordinates: String, $filter: vnb_FilterInput) { vnb_coordinates(coordinates: $coordinates) { vnbs(filter: $filter) { _id name types voltageTypes website services { type { name type } title activated options } } } }';
export function officialURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function operatorRequest(site,level){
  if(!Number.isFinite(site?.lat)||!Number.isFinite(site?.lon)||!levels[level])throw Error('Standort und Anschlussebene prüfen.');
  return {query:operatorQuery,variables:{coordinates:`${site.lat.toFixed(6)},${site.lon.toFixed(6)}`,filter:{voltageTypes:[levels[level]]}}};
}
export function parseOperators(response,level){
  if(response.errors||!Array.isArray(response.data?.vnb_coordinates?.vnbs))throw Error('Die Netzbetreibersuche hat keine gültige Antwort geliefert.');
  return response.data.vnb_coordinates.vnbs.filter(p=>p.voltageTypes?.includes(levels[level])).map(p=>({id:String(p._id),name:String(p.name),website:officialURL(p.website),portals:(p.services||[]).filter(s=>s.activated&&s.type?.type==='link'&&s.type?.name==='Netzanschluss'&&s.options?.activated!==false).map(s=>({title:s.title||'Netzanschluss',url:officialURL(s.options?.link)})).filter(s=>s.url)}));
}
export function setupApplication({container,getSite,getRequest,getLevel}){
  let controller=null,revision=0;
  function reset(){revision++;controller?.abort();controller=null;render();}
  function render(){
    const site=getSite();if(!site){container.textContent='Bitte zuerst einen Standort auswählen.';return;}
    let req;try{req=getRequest();}catch(e){container.textContent=e.message;return;}
    const level=getLevel(req),direction={draw:'Strom beziehen',feed:'Strom einspeisen',both:'Strom beziehen und einspeisen'}[req.direction];
    const search=new URL('https://www.vnbdigital.de/overview');search.searchParams.set('coordinates',`${site.lat},${site.lon}`);
    container.innerHTML=`<div class="location-summary"><strong>${escape(site.name||'Ihr Projektstandort')}</strong><br>${escape(site.lat.toFixed(5))}, ${escape(site.lon.toFixed(5))}<br>${escape(req.mw)} MW · ${escape(direction)}<br>${escape(levels[level])} · gewünschte Anschlussebene</div><p>Ermitteln Sie den Netzbetreiber für Ihren Standort. Anschließend öffnen Sie dessen offizielle Anschlussseite.</p><button id="find-operator" class="button primary">Zuständigen Netzbetreiber ermitteln</button><p class="hint">Die Abfrage übermittelt die Standortkoordinaten und die gewünschte Spannungsebene an VNBdigital. Sie sendet keine Anschlussanmeldung.</p><div id="operator-status" role="status" aria-live="polite"></div><div id="operator-results"></div><p class="hint">Quelle: <a href="${escape(search.href)}" target="_blank" rel="noopener">VNBdigital · Standort dort prüfen ↗</a>. Die endgültige Zuständigkeit und technische Anschlussmöglichkeit bestätigt der Netzbetreiber. Bei Einspeisung, Speichern und besonderen Netzsituationen kann eine zusätzliche Klärung erforderlich sein.</p>`;
    const button=container.querySelector('#find-operator'),status=container.querySelector('#operator-status'),results=container.querySelector('#operator-results');
    if(level==='ehv'){button.hidden=true;status.innerHTML='<p class="notice">Für Höchstspannungsanschlüsse reicht die Verteilnetzbetreibersuche nicht aus. Klären Sie die Zuständigkeit mit dem Übertragungsnetzbetreiber; eine automatische Zuordnung wird hier nicht behauptet.</p><p><a href="https://www.50hertz.com/" target="_blank" rel="noopener">50Hertz</a> · <a href="https://www.amprion.net/" target="_blank" rel="noopener">Amprion</a> · <a href="https://www.tennet.eu/de" target="_blank" rel="noopener">TenneT</a> · <a href="https://www.transnetbw.de/" target="_blank" rel="noopener">TransnetBW</a></p>';return;}
    button.onclick=async()=>{
      const current=++revision;controller?.abort();controller=new AbortController();const activeController=controller,signal=activeController.signal;const timeout=setTimeout(()=>activeController.abort(),15000);
      button.disabled=true;status.textContent='Netzbetreiber wird anhand von Standort und Spannungsebene ermittelt …';results.replaceChildren();
      try{
        const r=await fetch('/operator-service',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(operatorRequest(site,level)),signal});if(!r.ok)throw Error('Die Netzbetreibersuche ist derzeit nicht erreichbar.');
        const operators=parseOperators(await r.json(),level);if(current!==revision)return;
        status.textContent=operators.length===1?'Ein Netzbetreiber laut VNBdigital gefunden.':operators.length?`${operators.length} Netzbetreiber kommen laut VNBdigital infrage. Bitte die Zuständigkeit vor der Anmeldung klären.`:'Keine eindeutige Zuordnung gefunden. Prüfen Sie den Standort direkt bei VNBdigital oder lassen Sie die Zuständigkeit klären.';
        for(const op of operators){const article=document.createElement('article');article.className='operator-card';article.innerHTML=`<h3>${escape(op.name)}</h3><p>${escape(levels[level])} · standortbezogene Auskunft von VNBdigital</p>${op.portals.map(p=>`<a class="button primary" href="${escape(p.url)}" target="_blank" rel="noopener">Zur Anschlussanmeldung ↗</a>`).join('')||'<p>Für diesen Betreiber ist keine direkte Anschlussseite hinterlegt.</p>'}<p><a href="https://www.vnbdigital.de/vnb/${encodeURIComponent(op.id)}" target="_blank" rel="noopener">Betreiberprofil und Kontaktdaten ↗</a>${op.website?`<br><a href="${escape(op.website)}" target="_blank" rel="noopener">Website des Netzbetreibers ↗</a>`:''}</p>`;results.append(article);}
        if(operators.length){const note=document.createElement('p');note.className='notice';note.textContent='Die Anmeldung erfolgt auf der Website des Netzbetreibers. Wählen Sie dort den passenden Vorgang für Ihr Vorhaben. Das Öffnen des Portals reicht noch keine Anmeldung ein; Projektdaten werden nicht automatisch übertragen.';results.append(note);}
      }catch(error){if(current===revision)status.textContent=signal.aborted?'Die Abfrage dauert zu lange. Bitte erneut versuchen.':error.message;}
      finally{clearTimeout(timeout);if(current===revision){controller=null;button.disabled=false;button.textContent='Netzbetreibersuche erneut ausführen';}}
    };
  }
  document.addEventListener('planner:site',reset);
  document.addEventListener('planner:step',e=>{if(e.detail==='application')reset();});
  for(const id of ['power','unit','direction','project','redundancy','level'])document.getElementById(id).addEventListener('change',reset);
  return {reset};
}
