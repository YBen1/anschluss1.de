import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await (await fetch(process.env.CDP_URL||'http://127.0.0.1:9334/json/list')).json();const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
function send(method,params={}){const cid=++id;return new Promise((resolve,reject)=>{pending.set(cid,{resolve,reject});ws.send(JSON.stringify({id:cid,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const requests=[];ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);});
async function until(expression){for(let i=0;i<200;i++){if(await evaluate(expression))return;await wait(100);}throw Error('Timed out: '+expression);}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*','*wms.nrw.de/*']});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.removeItem('anschluss1.local-project.v1');`});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.testTools={};Object.defineProperty(document,'modelContext',{value:{registerTool(tool){window.testTools[tool.name]=tool;}}});window.longTasks=[];new PerformanceObserver(list=>window.longTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});`});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:process.env.TEST_URL||'http://127.0.0.1:8788/'});
await until(`document.querySelector('#data-status')?.textContent.includes('16 Bundesländer')`);
await evaluate(`(async()=>{const data=await (await fetch('/data/states/DE-BE-stations.json')).json();const s=data.find(s=>s.id==='way/46507168');document.querySelector('#search').value=s.lat+', '+s.lon;document.querySelector('#search-form').requestSubmit();})()`);
await until(`[...document.querySelectorAll('article')].some(e=>e.textContent.includes('Wuhletal'))`);
await evaluate(`[...document.querySelectorAll('article')].find(e=>e.textContent.includes('Wuhletal')).querySelector('[data-details-candidate]').click()`);
assert.ok(await evaluate(`document.querySelector('#detail-dialog').textContent.includes('80 MW')`));
assert.ok(await evaluate(`document.querySelector('#detail-dialog').textContent.includes('20.10.2026')`));
await evaluate(`document.querySelector('[data-close="detail-dialog"]').click();window.print=()=>{};document.querySelector('#export').click()`);
await until(`document.querySelector('#print-report').textContent.includes('80 MW')`);
assert.ok(await evaluate(`document.querySelector('#print-report').textContent.includes('Freie Anschlusskapazität bleibt unbestätigt')`));
assert.deepEqual(errors,[]);
console.log(JSON.stringify({passed:true,url:process.env.TEST_URL||'local',checks:['Wuhletal candidate','operator evidence in details','review date','evidence in report','no runtime exceptions']}));ws.close();
