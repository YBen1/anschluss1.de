import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await (await fetch(process.env.CDP_URL||'http://127.0.0.1:9334/json/list')).json();const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
function send(method,params={}){const cid=++id;return new Promise((resolve,reject)=>{pending.set(cid,{resolve,reject});ws.send(JSON.stringify({id:cid,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function until(expression){for(let i=0;i<300;i++){if(await evaluate(expression))return;await wait(100);}throw Error('Timeout: '+expression);}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*']});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:process.env.TEST_URL||'http://127.0.0.1:8788/'});
await until(`document.querySelector('#state-filter')?.options.length===17&&!document.querySelector('#parcels').disabled`);
const providers=JSON.parse(readFileSync(new URL('../data/parcel-services.json',import.meta.url))).providers;
const geometryStates=['DE-BW','DE-BE','DE-BB','DE-MV','DE-NI','DE-NW','DE-ST','DE-SH'];
for(const p of providers.filter(p=>p.query)){
  const raw=readFileSync(new URL(`fixtures/parcel-info/${p.id}.txt`,import.meta.url),'utf8');
  const features=await evaluate(`import('./parcel-selection.js').then(m=>m.parseParcelFeatures(${JSON.stringify(raw)},${JSON.stringify(p)}))`);
  assert.ok(features.length, p.id+' identifies a parcel');
  assert.ok(features.every(f=>f.number||f.reference),p.id+' never selects metadata or unrelated features');
  assert.equal(!!features[0].geometry,geometryStates.includes(p.id),p.id+' geometry availability');
  if(features[0].geometry){const coords=features[0].geometry.type==='Polygon'?features[0].geometry.coordinates[0]:features[0].geometry.coordinates[0][0];assert.ok(coords.every(([lon,lat])=>lon>=5&&lon<=16&&lat>=47&&lat<=56),p.id+' axis order');}
}
async function locate(lat,lon){await evaluate(`document.querySelector('#search').value='${lat}, ${lon}';document.querySelector('#search-form').requestSubmit()`);await wait(700);}
async function chooseParcel(){await until(`document.querySelector('.parcel-result')`);await evaluate(`(Array.from(document.querySelectorAll('.parcel-result')).find(b=>b.textContent.includes('11000191900558'))||document.querySelector('.parcel-result')).click()`);await until(`!document.querySelector('[data-use]').disabled`);}
async function clickMap(){const rect=await evaluate(`(()=>{const r=document.querySelector('#map').getBoundingClientRect();return {x:r.x+r.width/2+14,y:r.y+r.height/2+14};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});}
await locate(52.52,13.405);await evaluate(`document.querySelector('#parcel-mode').click()`);await wait(800);
assert.equal(await evaluate(`document.querySelector('#parcel-mode').getAttribute('aria-pressed')`),'true');
assert.equal(await evaluate(`document.querySelector('#parcels').checked`),true);
await clickMap();await chooseParcel();
assert.ok((await evaluate(`document.querySelector('[data-results]').textContent`)).includes('11000191900558'));
assert.ok((await evaluate(`document.querySelector('#parcel-selection [data-status]').textContent`)).includes('Grenze'));
mkdirSync('/tmp/anschluss-selection-results',{recursive:true});
let screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync('/tmp/anschluss-selection-results/selection.png',Buffer.from(screenshot.data,'base64'));
await evaluate(`document.querySelector('[data-use]').click()`);
assert.ok((await evaluate(`document.querySelector('#location-summary').textContent`)).includes('amtliches Flurstück'));
await until(`!document.querySelector('#save-site').disabled`);
await evaluate(`document.querySelector('#save-site').click();document.querySelector('#compare-tab').click()`);
await until(`document.querySelector('[data-load]')`);
await evaluate(`document.querySelector('[data-load]').click()`);
assert.ok((await evaluate(`document.querySelector('#location-summary').textContent`)).includes('amtliches Flurstück'));
await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:'/tmp/anschluss-selection-results'});
await evaluate(`document.querySelector('#export').click()`);
await until(`document.querySelector('#print-report').textContent.includes('11000191900558')`);
// Error and retry use actual network blocking, never silently select a map point.
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*','*/parcel-service/*']});await wait(600);await clickMap();
await until(`document.querySelector('#parcel-selection [data-status]').textContent.includes('nicht erreichbar')`);
assert.equal(await evaluate(`document.querySelector('[data-use]').disabled`),true);
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*']});await evaluate(`document.querySelector('#parcel-selection [data-retry]').click()`);await chooseParcel();
await evaluate(`document.querySelector('#parcel-selection [data-clear]').click()`);assert.equal(await evaluate(`document.querySelector('[data-use]').disabled`),true);
// Manual fallback must not claim an official identified parcel.
await locate(48.137,11.575);await clickMap();await until(`document.querySelector('[data-results] button')?.textContent.includes('manuell')`);
await evaluate(`document.querySelector('[data-results] button').click();document.querySelector('[data-use]').click()`);
assert.ok(!(await evaluate(`document.querySelector('#location-summary').textContent`)).includes('amtliches Flurstück'));
// Geometry-free service still selects a real cadastral identifier.
await locate(51.34,12.37);await clickMap();await chooseParcel();
assert.ok((await evaluate(`document.querySelector('#parcel-selection [data-status]').textContent`)).includes('keine Grenze'));
// Mode switching cancels a pending response and keeps drawing exclusive.
await clickMap();await evaluate(`document.querySelector('#draw-mode').click()`);await wait(1500);
assert.equal(await evaluate(`document.querySelector('#parcel-selection').hidden`),true);
assert.equal(await evaluate(`document.querySelector('#draw-actions').hidden`),false);
assert.equal(await evaluate(`document.querySelector('[data-use]').disabled`),true);
await evaluate(`document.querySelector('#point-mode').click()`);
// Mobile layout and keyboard-accessible result.
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await locate(52.52,13.405);await evaluate(`document.querySelector('#parcel-mode').click()`);await wait(700);
await evaluate(`document.querySelector('#map').scrollIntoView({block:'center',behavior:'instant'})`);await wait(400);await clickMap();await chooseParcel();
await evaluate(`document.querySelector('#parcel-selection').scrollIntoView({block:'start',behavior:'instant'});document.querySelector('.parcel-result').focus()`);
assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),'No mobile overflow');
assert.equal(await evaluate(`document.activeElement.className`),'parcel-result');
screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync('/tmp/anschluss-selection-results/mobile.png',Buffer.from(screenshot.data,'base64'));
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,parsers:14,live:['Berlin','Bayern fallback','Sachsen'],comparison:true,report:true,errorRecovery:true,mobile:true}));ws.close();
