import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {RegionalData,searchBounds} from '../regions.js';
import {candidates,distance} from '../engine.js';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const index=read('data/states.json'), national=read('data/stations.json');
const fetcher=async url=>({ok:true,json:async()=>read(url.split('?')[0])});
test('all 16 states retain every source object exactly, including crossing lines',()=>{
  assert.equal(index.features.length,16);assert.equal(new Set(index.features.map(f=>f.properties.id)).size,16);
  for(const kind of ['stations','lines']){
    const objects=new Map();let count=0;
    for(const feature of index.features){
      const descriptor=feature.properties.files[kind];
      const bytes=readFileSync(new URL('../'+descriptor.url,import.meta.url));
      assert.equal(bytes.length,descriptor.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),descriptor.sha256);
      const records=JSON.parse(bytes);assert.equal(records.length,descriptor.count);count+=records.length;
      for(const o of records)objects.set(o.id,o);
    }
    const source=read('data/'+kind+'.json');assert.equal(objects.size,source.length);
    for(const o of source)assert.deepEqual(objects.get(o.id),o);
    if(kind==='lines')assert.ok(count>source.length,'Cross-border lines belong to multiple states');
  }
});
test('regional search matches national results for all voltage levels at capitals, borders and rural sites',async()=>{
  const store=new RegionalData(index,fetcher);
  const points=[[52.52,13.405],[48.137,11.575],[53.55,10],[53.08,8.8],[50.94,6.96],[51.34,12.37],[48.78,9.18],[54.79,9.43],[47.55,9.68],[51.7,14.3],[50,8.27],[50.08,8.24],[49.23,7],[52.4,13.05],[50.98,11.03],[52.13,11.62],[53.63,11.42],[52.37,9.73],[49.47,8.47]];
  for(const [lat,lon] of points){
    const site={lat,lon}, regional=await store.forSites([site]);
    const nearby=national.filter(s=>distance(s,site)<=50);const ids=new Set(regional.stations.map(s=>s.id));
    assert.ok(nearby.every(s=>ids.has(s.id)),`All stations within 50 km of ${lat},${lon}`);
    for(const level of ['mv','hv','ehv']){
      const req={mw:5,level,direction:'draw',project:'commercial',redundancy:'single'};
      for(const filter of [{type:'all',voltage:'all',operator:'all'},{type:'station',voltage:level,operator:'all'}])
        assert.deepEqual(candidates(regional.stations,site,req,filter),candidates(national,site,req,filter));
    }
  }
});
test('deduplicates requests and records, bounds cache, retries failed downloads',async()=>{
  let calls=0,fail=true;
  const store=new RegionalData(index,async url=>{calls++;if(fail)throw Error('offline');return fetcher(url);},2);
  const feature=index.features[0];await assert.rejects(store.load(feature,'stations'),/offline/);fail=false;
  await Promise.all([store.load(feature,'stations'),store.load(feature,'stations')]);assert.equal(calls,2);
  await store.load(feature,'stations');assert.equal(calls,2);
  const data=await store.collect(index.features.slice(0,3));
  assert.equal(new Set(data.lines.map(l=>l.id)).size,data.lines.length);assert.ok(store.cache.size<=2);assert.equal(store.pending.size,0);
});
