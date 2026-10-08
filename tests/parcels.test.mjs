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
