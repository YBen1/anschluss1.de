// Presentation state only: project data and calculations remain in app.js.
export function setupPlannerUI({map,getSite,getSearchLevel}){
  const $=id=>document.getElementById(id),workspace=$('workspace'),sidebar=document.querySelector('.sidebar');
  const mobile=matchMedia('(max-width: 760px)');
  let step='location',height='middle',drag=null,suppressClick=false;
  const titles={location:'Standort wählen',project:'Vorhaben beschreiben',results:'Anschlussmöglichkeiten',application:'Anmeldung vorbereiten'};
  document.querySelector('.results-section').dataset.plannerPanel='results';
  $('planner-content').append(document.querySelector('.results-section'));
  const panels=()=>document.querySelectorAll('[data-planner-panel]');
  function resizeMap(){requestAnimationFrame(()=>map.invalidateSize({pan:false}));}
  function setHeight(value){height=value;sidebar.dataset.sheet=value;$('sheet-toggle').setAttribute('aria-expanded',String(value!=='collapsed'));$('sheet-toggle').setAttribute('aria-label',value==='expanded'?'Detailfläche verkleinern':'Detailfläche vergrößern');}
  function focusPanel(){const heading=sidebar.querySelector('[data-planner-panel]:not([hidden]) h2');heading?.focus({preventScroll:true});}
  function setStep(value,{focus=false}={}){
    if(value!=='location'&&!getSite())return;
    step=value;panels().forEach(p=>p.hidden=p.dataset.plannerPanel!==value);
    document.querySelectorAll('[data-planner-step]').forEach(b=>{const active=b.dataset.plannerStep===value;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('sheet-title').textContent=titles[value];$('planner-content').scrollTop=0;
    workspace.classList.remove('sidebar-collapsed');sidebar.inert=false;$('sidebar-toggle').setAttribute('aria-expanded','true');
    if(mobile.matches)setHeight('middle');
    if(focus)focusPanel();document.dispatchEvent(new CustomEvent('planner:step',{detail:value}));resizeMap();
  }
  function update(){
    const hasSite=!!getSite();document.querySelectorAll('[data-planner-step]').forEach(b=>b.disabled=b.dataset.plannerStep!=='location'&&!hasSite);
    $('continue-project').disabled=!hasSite;
    $('project-site').textContent=hasSite?getSite().name||`${getSite().lat.toFixed(5)}, ${getSite().lon.toFixed(5)}`:'Noch kein Standort gewählt';
    const filter=$('voltage-filter');$('visible-voltage').textContent=`Karte: ${filter.selectedOptions[0].textContent}`;
    $('search-voltage').textContent=`Anschlusssuche: ${getSearchLevel()}`;
  }
  document.querySelectorAll('[data-planner-step]').forEach(b=>b.addEventListener('click',()=>setStep(b.dataset.plannerStep,{focus:true})));
  $('continue-project').onclick=()=>setStep('project',{focus:true});
  $('back-location').onclick=()=>setStep('location',{focus:true});
  $('back-project').onclick=()=>setStep('project',{focus:true});
  $('continue-application').onclick=()=>setStep('application',{focus:true});
  $('analyze').addEventListener('click',()=>{if(getSite()&&$('power').checkValidity())setStep('results',{focus:true});});
  $('sidebar-toggle').onclick=()=>{const collapsed=workspace.classList.toggle('sidebar-collapsed');$('sidebar-toggle').setAttribute('aria-expanded',String(!collapsed));$('sidebar-toggle').textContent=collapsed?'Planung öffnen':'Planung einklappen';sidebar.inert=collapsed;resizeMap();};
  $('sheet-toggle').onclick=()=>{if(suppressClick){suppressClick=false;return;}setHeight(height==='expanded'?'middle':height==='collapsed'?'middle':'expanded');};
  $('sheet-toggle').addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();setHeight(e.key==='ArrowUp'?'expanded':'collapsed');}});
  $('sheet-toggle').addEventListener('pointerdown',e=>{if(!mobile.matches)return;drag={y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);});
  $('sheet-toggle').addEventListener('pointerup',e=>{if(!drag)return;const delta=e.clientY-drag.y;drag=null;if(Math.abs(delta)>35){e.preventDefault();suppressClick=true;setHeight(delta<0?'expanded':'collapsed');}});
  $('sheet-toggle').addEventListener('pointercancel',()=>drag=null);
  function showMap(){if(mobile.matches)setHeight('collapsed');else{workspace.classList.add('sidebar-collapsed');sidebar.inert=true;$('sidebar-toggle').textContent='Planung öffnen';$('sidebar-toggle').setAttribute('aria-expanded','false');resizeMap();}map.getContainer().focus({preventScroll:true});}
  $('show-map').onclick=showMap;
  // Replace scrolling between distant mobile sections with a persistent sheet.
  document.querySelector('#parcel-selection [data-map]').onclick=showMap;
  $('parcel-selection-back').onclick=()=>{sidebar.inert=false;setStep('location');setHeight('expanded');$('parcel-selection').scrollIntoView({block:'nearest'});};
  for(const id of ['point-mode','draw-mode','parcel-mode'])$(id).addEventListener('click',()=>{if(mobile.matches&&!(id==='parcel-mode'&&$(id).getAttribute('aria-pressed')==='false'))setHeight('collapsed');});
  const parcelObserver=new MutationObserver(()=>{if(!mobile.matches||$('parcel-selection').hidden)return;if(document.querySelector('#parcel-selection .parcel-result'))setHeight('middle');});
  parcelObserver.observe(document.querySelector('#parcel-selection [data-results]'),{childList:true});
  $('location-summary').addEventListener('click',()=>{if(getSite())map.setView([getSite().lat,getSite().lon],17);});
  for(const id of ['voltage-filter','power','unit','level'])$(id).addEventListener('change',update);
  document.addEventListener('planner:site',()=>{update();if(mobile.matches&&height==='collapsed'&&!document.body.classList.contains('parcel-selecting'))setHeight('middle');});
  mobile.addEventListener('change',()=>{workspace.classList.remove('sidebar-collapsed');sidebar.inert=false;$('sidebar-toggle').setAttribute('aria-expanded','true');setHeight('middle');resizeMap();});
  setHeight('middle');setStep('location');update();
  return {setStep,update,showMap};
}
