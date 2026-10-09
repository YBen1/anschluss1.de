import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {operatorRequest,parseOperators,officialURL} from '../application.js';
test('operator search sends the selected location and voltage to VNBdigital',()=>{
 const request=operatorRequest({lat:52.52,lon:13.405},'mv');
 assert.equal(request.variables.coordinates,'52.520000,13.405000');
 assert.deepEqual(request.variables.filter.voltageTypes,['Mittelspannung']);
 assert.match(request.query,/vnb_coordinates/);
});
test('operator results use active connection links and HTTPS only',()=>{
 const data=JSON.parse(readFileSync('/tmp/vnb-coordinate-response.json','utf8'));
 const providers=parseOperators(data,'mv');
 assert.equal(providers[0].name,'Stromnetz Berlin GmbH');
 assert.equal(providers[0].portals[0].url,'https://www.stromnetz.berlin/anschliessen');
 assert.equal(officialURL('javascript:alert(1)'),null);
 const noPortal=structuredClone(data);noPortal.data.vnb_coordinates.vnbs[0].services[0].activated=false;
 assert.equal(parseOperators(noPortal,'mv')[0].portals.length,0);
});
test('high-voltage mapping does not claim an extra-high-voltage VNB lookup',()=>{
 assert.equal(operatorRequest({lat:53.55,lon:10},'hv').variables.filter.voltageTypes[0],'Hochspannung');
 assert.throws(()=>operatorRequest({lat:53.55,lon:10},'ehv'));
});
