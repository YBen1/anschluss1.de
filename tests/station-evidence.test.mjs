import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {voltages,candidates,defaultModel,estimate} from '../engine.js';
import {evidenceHtml} from '../station-evidence.js';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url)));
const all=read('stations.json'), berlin=read('states/DE-BE-stations.json'), manifest=read('manifest.json');
const req={mw:5,level:'mv',direction:'draw',project:'commercial',redundancy:'single'};
const filters={type:'all',voltage:'all',operator:'all'};
test('Wuhletal has traceable voltage without rewriting OSM and is usable in MV planning',()=>{
 const s=berlin.find(x=>x.id==='way/46507168');
 assert.equal(s.tags.voltage,undefined);assert.deepEqual(voltages(s),[110000,10000]);
 assert.equal(candidates(berlin,s,req,filters)[0].id,s.id);
 assert.equal(estimate({...s,km:1,level:'mv'},req,defaultModel()).total,null);
 assert.match(evidenceHtml(s),/2015/);assert.match(evidenceHtml(s),/Freie Anschlusskapazität bleibt unbestätigt/);
});
test('decommissioned and uncommissioned works remain visible but never become candidates',()=>{
 for(const id of ['way/46507166','way/46523216','way/1080486178','way/1218053753']){
  const s=berlin.find(x=>x.id===id);assert.ok(s);
  // Even if a matching voltage is added, the status still prevents selection.
  assert.equal(candidates([{...s,tags:{...s.tags,voltage:'110000;10000'}}],s,req,filters).length,0);
  assert.match(evidenceHtml(s),/nicht als bestehender Anschlusskandidat/);
 }
});
test('equipment stays separate, is uniquely assigned, sourced, and matches manifest counts',()=>{
 const equipment=all.flatMap(s=>s.equipment||[]);
 assert.equal(equipment.length,manifest.enrichment.transformerCount);
 assert.equal(new Set(equipment.map(e=>e.id)).size,equipment.length);
 assert.equal(all.filter(s=>s.equipment?.length).length,manifest.enrichment.stationsWithEquipment);
 assert.equal(berlin.filter(s=>s.operatorEvidence?.length).length,manifest.enrichment.berlinStationsWithOperatorEvidence);
 for(const t of equipment){assert.match(t.id,/^node\/\d+$/);assert.equal(t.tags.power,'transformer');assert.ok(Date.parse(t.updated));assert.equal(t.association,'within-osm-station-polygon');}
 assert.deepEqual(voltages({tags:{},equipment:[{tags:{voltage:'110000'}}]}),[]);
});
test('operator evidence does not silently override conflicting OSM voltages',()=>{
 assert.deepEqual(voltages({tags:{voltage:'30000'},operatorEvidence:[{voltage:'110000;10000'}]}),[30000]);
});
test('all curated records have explicit source and review date; rendered content is escaped',()=>{
 for(const e of read('berlin-operator-evidence.json').records){assert.ok(e.url.startsWith('https://www.stromnetz.berlin/'));assert.equal(e.reviewedAt,manifest.enrichment.reviewedAt);assert.ok(e.note);assert.ok(e.stationIds.every(id=>berlin.some(s=>s.id===id)));}
 const html=evidenceHtml({operatorEvidence:[{title:'<img onerror=alert(1)>',note:'<script>',url:'javascript:alert(1)',publisher:'test'}]});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));assert.ok(html.includes('&lt;img'));
});
