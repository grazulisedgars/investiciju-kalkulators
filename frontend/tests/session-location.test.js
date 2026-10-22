import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSessionLocation} from '../src/components/sessionLocation.js';
const response=(status,data)=>({status,ok:status>=200 && status<300,json:async()=>data});
test('401 is an absent session; 500 is a retryable failure',async()=>{
 assert.deepEqual(await loadSessionLocation('',undefined,async()=>response(401)),{user:null,restoredProperty:null});
 await assert.rejects(loadSessionLocation('?property=10',undefined,async()=>response(500)),/sesiju/);
});
test('failed property fetch must not turn into an empty dashboard',async()=>{
 let calls=0;
 await assert.rejects(loadSessionLocation('?property=10&tab=advanced',undefined,async()=>++calls===1?response(200,{id:1}):response(503)),/īpašumu/);
});
test('retry restores the requested property and passes the abort signal',async()=>{
 const signal=new AbortController().signal;
 const state=await loadSessionLocation('?property=10&tab=diary',signal,async(url,options)=>{
  assert.equal(options.signal,signal);assert.equal(options.credentials,'include');
  return response(200,url.endsWith('/me')?{id:1}:[{property_id:10}]);
 });
 assert.equal(state.restoredProperty.property_id,10);
});
test('network failures and cancellation propagate instead of clearing session',async()=>{
 await assert.rejects(loadSessionLocation('',undefined,async()=>{throw new TypeError('offline');}),/offline/);
 await assert.rejects(loadSessionLocation('',undefined,async()=>{throw new DOMException('cancelled','AbortError');}),{name:'AbortError'});
});

test('session expiring between session and property requests returns to login',async()=>{
 let calls=0;
 assert.deepEqual(await loadSessionLocation('?property=10',undefined,async()=>++calls===1?response(200,{id:1}):response(401)),{user:null,restoredProperty:null});
});
