// Source-specific details remain separate from the original OSM station tags.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses={operational:'Inbetriebnahme belegt',planned:'Neubau geplant',construction:'Neubau – Inbetriebnahme ausstehend',decommissioned:'Außer Betrieb','transition-unconfirmed':'Alt-/Neubau: Wechsel ungeklärt',modernisation:'Modernisierung / Erweiterung'};
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v.split('-').reverse().join('.'):v||'unbekannt';
export function evidenceBadge(o){return o.operatorEvidence?.length?'Betreiberquelle vorhanden':o.equipment?.length?'OSM-Transformatordaten vorhanden':'OSM-Stationsdaten';}
export function evidenceHtml(o){
 const reviews=o.operatorEvidence||[],equipment=o.equipment||[];
 if(!reviews.length&&!equipment.length)return '';
 let html='<section class="station-evidence"><h4>Ergänzende Daten und Belege</h4>';
 for(const e of reviews){
  const url=/^https:\/\//.test(e.url)?e.url:'#';
  html+=`<p><strong>${esc(statuses[e.status]||e.title)}</strong><br>${esc(e.note)}${e.voltage?`<br>Spannung laut Projektunterlagen: ${esc(e.voltage.split(';').map(v=>Number(v)/1000+' kV').join(' / '))}`:''}${e.excludeCandidate?'<br><strong>Wird nicht als bestehender Anschlusskandidat verwendet.</strong>':''}<br><a href="${esc(url)}" target="_blank" rel="noopener">${esc(e.publisher)}: ${esc(e.title)} ↗</a><br><small>Quellenprüfung: ${esc(date(e.reviewedAt))}${e.publishedAt?' · Veröffentlichung: '+esc(date(e.publishedAt)):''}</small></p>`;
 }
 if(equipment.length){
  html+=`<details><summary>${equipment.length} erfasste Transformatoren mit technischen Angaben</summary><p>OSM-Objekte innerhalb der Stationsfläche. Räumliche Zuordnung, keine bestätigte elektrische Verschaltung; Bestand möglicherweise unvollständig. Einzelwerte werden nicht zu verfügbarer Anschlussleistung addiert.</p><ul>`;
  for(const t of equipment){
   const labels={'voltage':'Spannung (V)','voltage:primary':'Primärspannung (V)','voltage:secondary':'Sekundärspannung (V)','voltage:tertiary':'Tertiärspannung (V)','rating':'Bemessungsleistung (OSM-Rohwert)','rating:power':'Bemessungsleistung (OSM-Rohwert)','frequency':'Frequenz (Hz)'};
   html+=`<li><a href="https://www.openstreetmap.org/${esc(t.id)}" target="_blank" rel="noopener">${esc(t.tags.name||t.tags.ref||t.id)} ↗</a>${Object.entries(labels).filter(([k])=>t.tags[k]).map(([k,label])=>`<br>${label}: ${esc(t.tags[k])}`).join('')}<br><small>OSM-Objektänderung: ${esc(date(t.updated.slice(0,10)))}</small></li>`;
  }
  html+='</ul></details>';
 }
 return html+'<p><strong>Freie Anschlusskapazität bleibt unbestätigt.</strong></p></section>';
}
