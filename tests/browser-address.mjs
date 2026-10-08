import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await (await fetch(process.env.CDP_URL||'http://127.0.0.1:9334/json/list')).json();const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
function send(method,params={}){const cid=++id;return new Promise((resolve,reject)=>{pending.set(cid,{resolve,reject});ws.send(JSON.stringify({id:cid,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function until(expression){for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(100);}throw Error('Timeout: '+expression);}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Network.setBlockedURLs',{urls:['*tile.openstreetmap.org/*','*wms.nrw.de/*']});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.searchCalls=[];window.realFetch=window.fetch;window.fetch=async function(url,options){if(String(url).includes('photon.komoot.io')){const q=new URL(url).searchParams.get('q');window.searchCalls.push(q);await new Promise(r=>setTimeout(r,q==='Langsam'?2500:30));if(q==='Fehler')return {ok:false};return {ok:true,json:async()=>({features:q==='Leer'?[]:[{geometry:{coordinates:[13.405,52.52]},properties:{name:q,street:'Alexanderplatz',housenumber:'1',postcode:'10178',city:'Berlin',state:'Berlin'}},{geometry:{coordinates:[12.37,51.34]},properties:{name:q+' Zweiter',city:'Leipzig',state:'Sachsen'}}]})};}return window.realFetch(url,options);};`});
await send('Page.bringToFront');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:process.env.TEST_URL||'http://127.0.0.1:8788/'});
await until(`document.querySelector('#state-filter').options.length===17`);
async function type(value){await evaluate(`document.querySelector('#search').focus();document.querySelector('#search').value=${JSON.stringify(value)};document.querySelector('#search').dispatchEvent(new Event('input',{bubbles:true}));`);}
await type('Be');await wait(700);assert.equal(await evaluate('window.searchCalls.length'),0);
await type('Ber');await wait(100);await type('Berl');await wait(100);await type('Berlin');
await until(`document.querySelectorAll('#search-results [role="option"]').length===2`);
assert.deepEqual(await evaluate('window.searchCalls'),['Berlin']);
assert.equal(await evaluate(`document.querySelector('#search').getAttribute('aria-expanded')`),'true');
await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40,nativeVirtualKeyCode:40});
assert.equal(await evaluate(`document.querySelector('#search').getAttribute('aria-activedescendant')`),'address-option-0');
await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
await until(`document.querySelectorAll('[data-candidate]').length===3`);
assert.ok(await evaluate(`document.querySelector('#search').value.includes('Alexanderplatz 1')`));
assert.equal(await evaluate(`document.querySelector('#search').getAttribute('aria-expanded')`),'false');
await type('Berlin');await until(`!document.querySelector('#search-results').hidden`);assert.equal(await evaluate('window.searchCalls.length'),1,'Cached query');
await evaluate(`document.querySelectorAll('#search-results button')[1].click()`);
await until(`document.querySelector('#location-summary').textContent.includes('Leipzig')`);
await type('Langsam');await until(`window.searchCalls.includes('Langsam')`);await type('Neu');
await until(`document.querySelector('#search-results').textContent.includes('Neu')`);await wait(1600);
assert.ok(!await evaluate(`document.querySelector('#search-results').textContent.includes('Langsam')`),'Discard stale response');
await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});assert.ok(await evaluate(`document.querySelector('#search-results').hidden`));
await type('Leer');await until(`document.querySelector('#search-status').textContent.includes('Keine Treffer')`);
await type('Fehler');await until(`document.querySelector('#search-status').textContent.includes('nicht erreichbar')`);
const count=await evaluate('window.searchCalls.length');await type('51.34, 12.37');await evaluate(`document.querySelector('#search-form').requestSubmit()`);await wait(500);assert.equal(await evaluate('window.searchCalls.length'),count,'Coordinates remain local');
await type('Berlin');await until(`!document.querySelector('#search-results').hidden`);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await wait(300);
assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));
mkdirSync('/tmp/anschluss-address-results',{recursive:true});const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync('/tmp/anschluss-address-results/mobile.png',Buffer.from(shot.data,'base64'));
await type('');await wait(600);assert.ok(await evaluate(`document.querySelector('#search-results').hidden`));
assert.equal(errors.length,0,JSON.stringify(errors));console.log('Address suggestion checks passed: debounce, cache, keyboard, click, stale responses, escape, empty/error, coordinates, mobile');ws.close();
