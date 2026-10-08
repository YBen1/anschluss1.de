import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await (await fetch(process.env.CDP_URL||'http://127.0.0.1:9334/json/list')).json();const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
function send(method,params={}){const cid=++id;return new Promise((resolve,reject)=>{pending.set(cid,{resolve,reject});ws.send(JSON.stringify({id:cid,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

const requests=[];ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);});
async function until(expression){for(let i=0;i<400;i++){if(await evaluate(expression))return;await wait(100);}throw Error('Timeout: '+expression+' '+await evaluate(`document.querySelector('#parcel-status')?.textContent`));}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Page.bringToFront');
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*']});
await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:process.env.TEST_URL||'http://127.0.0.1:8788/'});
await until(`document.querySelector('#state-filter')?.options.length===17&&!document.querySelector('#parcels').disabled`);
assert.ok(!requests.some(u=>u.toLowerCase().includes('request=getmap')),'No parcel requests before enabling');
await evaluate(`document.querySelector('#parcels').click()`);await wait(300);
assert.ok(!requests.some(u=>u.toLowerCase().includes('request=getmap')),'No parcel requests at overview zoom');
assert.ok(await evaluate(`!document.querySelector('#parcel-zoom').hidden`));
const providers=await evaluate(`fetch('data/parcel-services.json').then(r=>r.json()).then(d=>d.providers)`);
const results=[];
for(const provider of providers){
  const [lat,lon]=provider.sample;
  await evaluate(`document.querySelector('#search').value='${lat}, ${lon}';document.querySelector('#search-form').requestSubmit();document.querySelector('#parcel-zoom').click();`);
  await until(`document.querySelector('#parcel-status').textContent.includes('Flurstückskarten geladen:')&&document.querySelector('#parcel-status').textContent.includes(${JSON.stringify(provider.name)})`);
  assert.ok(await evaluate(`Array.from(document.querySelectorAll('.leaflet-parcels-pane img')).some(i=>i.complete&&i.naturalWidth===256)`),'Decoded cadastral images '+provider.id);
  assert.ok(await evaluate(`document.querySelector('.leaflet-control-attribution').textContent.includes(${JSON.stringify(provider.attribution)})`),'Attribution '+provider.id);
  results.push({state:provider.id,status:await evaluate(`document.querySelector('#parcel-status').textContent`)});
  if(provider.id==='DE-BE'){mkdirSync('/tmp/anschluss-parcel-browser',{recursive:true});const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync('/tmp/anschluss-parcel-browser/berlin.png',Buffer.from(shot.data,'base64'));
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await wait(400);
    await evaluate(`document.querySelector('.map-section').scrollIntoView()`);assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),'No mobile overflow');
    const mobile=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync('/tmp/anschluss-parcel-browser/mobile.png',Buffer.from(mobile.data,'base64'));
    await send('Emulation.setDeviceMetricsOverride',{width:1024,height:900,deviceScaleFactor:1,mobile:false});await wait(400);
}
}
await evaluate(`document.querySelector('#parcels').click()`);assert.equal(await evaluate(`document.querySelectorAll('.leaflet-parcels-pane img').length`),0,'Disable removes all layers');
await evaluate(`document.querySelector('#search').value='52.52, 13.405';document.querySelector('#search-form').requestSubmit()`);
await wait(500);await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*','*gdi.berlin.de*']});await evaluate(`document.querySelector('#parcels').click()`);
await until(`document.querySelector('#parcel-status').textContent.includes('nicht erreichbar')`);assert.ok(await evaluate(`!document.querySelector('#parcel-retry').hidden`));
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*']});await evaluate(`document.querySelector('#parcel-retry').click()`);
await until(`document.querySelector('#parcel-status').textContent.includes('Flurstückskarten geladen:')`);
await evaluate(`document.querySelector('#fit-germany').click()`);await until(`document.querySelectorAll('.leaflet-parcels-pane img').length===0`);
assert.equal(errors.length,0,JSON.stringify(errors));writeFileSync('/tmp/anschluss-parcel-browser/results.json',JSON.stringify({passed:true,results,errors},null,2));console.log(JSON.stringify({passed:true,states:results.length,errorRecovery:true,errors}));ws.close();
