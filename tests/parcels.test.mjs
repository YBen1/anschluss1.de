import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {visibleParcelProviders} from '../parcels.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));const {providers}=read('data/parcel-services.json');
test('all federal states have sourced, licensed parcel layers allowed by CSP',()=>{
  const states=read('data/states.json').features.map(f=>f.properties.id).sort();assert.deepEqual(providers.map(p=>p.id).sort(),states);
  const csp=read('vercel.json').headers.flatMap(x=>x.headers).find(h=>h.key==='Content-Security-Policy').value;
  for(const p of providers){assert.ok(p.layers&&p.attribution&&p.license&&p.source&&p.checkedAt);assert.equal(new URL(p.url).protocol,'https:');assert.ok(csp.split('img-src ')[1].split(';')[0].includes(new URL(p.url).origin));const [lat,lon]=p.sample;assert.ok(visibleParcelProviders([p],[lat-.001,lon-.001,lat+.001,lon+.001],17).includes(p),p.id);}
});
test('does not load cadastral images for the national overview or outside Germany',()=>{
  assert.deepEqual(visibleParcelProviders(providers,[47,5,56,16],16),[]);
  assert.deepEqual(visibleParcelProviders(providers,[40,-4,41,-3],18),[]);
  const berlin=visibleParcelProviders(providers,[52.519,13.404,52.521,13.406],17);
  assert.ok(berlin.some(p=>p.id==='DE-BE'));assert.ok(!berlin.some(p=>p.id==='DE-BY'));
  const border=visibleParcelProviders(providers,[52.37,13.1,52.43,13.2],17);
  assert.ok(border.some(p=>p.id==='DE-BE')&&border.some(p=>p.id==='DE-BB'));
});

test('parcel lookup uses fixed same-origin routes and WMS axis order',async()=>{
  const {featureInfoURL}=await import('../parcel-selection.js');
  const routes=read('vercel.json').rewrites;
  assert.equal(providers.filter(p=>p.query).length,14);
  for(const provider of providers.filter(p=>p.query)){
    const u=new URL(featureInfoURL(provider,{lat:52.5,lon:13.4}),'https://www.anschluss1.de');
    assert.ok(routes.some(r=>r.source===u.pathname&&r.destination===provider.url));
    assert.equal(u.searchParams.get('REQUEST'),'GetFeatureInfo');
    assert.equal(u.searchParams.get('QUERY_LAYERS'),provider.query.layers);
    assert.equal(u.searchParams.get('FEATURE_COUNT'),'10');
    assert.equal(u.searchParams.get(provider.version==='1.3.0'?'I':'X'),'50');
    const box=u.searchParams.get('BBOX').split(',').map(Number);
    assert.ok(Math.abs(box[0]-(provider.version==='1.3.0'?52.4999:13.3999))<1e-8);
  }
  assert.ok(!providers.find(p=>p.id==='DE-BY').query);
  assert.ok(!providers.find(p=>p.id==='DE-RP').query);
});
