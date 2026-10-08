import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await (await fetch(process.env.CDP_URL||'http://127.0.0.1:9334/json/list')).json();const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
function send(method,params={}){const cid=++id;return new Promise((resolve,reject)=>{pending.set(cid,{resolve,reject});ws.send(JSON.stringify({id:cid,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function until(expression){for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(100);}throw Error('Timeout: '+expression);}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Page.bringToFront');
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*','*wms.nrw.de/*']});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:process.env.TEST_URL||'http://127.0.0.1:8788/'});
await until(`document.querySelector('#state-filter').options.length===17`);
await evaluate(`document.querySelector('#search').focus();document.querySelector('#search').value='Alexanderplatz 1 Berlin';document.querySelector('#search').dispatchEvent(new Event('input',{bubbles:true}));`);
await until(`document.querySelectorAll('#search-results [role="option"]').length>0`);
assert.ok(await evaluate(`performance.getEntriesByType('resource').some(r=>r.name.includes('photon.komoot.io/api/'))`),'Real network request reached Photon');
const title=await evaluate(`document.querySelector('#search-results button').textContent`);
const rect=await evaluate(`(()=>{const r=document.querySelector('#search-results button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
await send('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});
await until(`document.querySelectorAll('[data-candidate]').length===3`);
assert.ok(await evaluate(`document.querySelector('#search-results').hidden`));assert.ok(await evaluate(`document.querySelector('#location-summary').textContent.includes('Berlin')`));
assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({passed:true,realPhotonResult:title,pointerSelection:true,candidates:3}));ws.close();
