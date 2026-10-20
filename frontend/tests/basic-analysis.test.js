import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateBasic,validateBasic,readCalculatorDraft,writeCalculatorDraft,clearCalculatorDraft} from '../src/components/basicAnalysis.js';
import {requestJson} from '../src/components/requestJson.js';
import {readAnalysisDraft,saveAnalysisDraft,clearAnalysisDraft} from '../src/components/analysisDraft.js';

const base={financing:'cash',purchasePrice:'27900',area:'39',renovationCostPerM2:'100',monthlyRent:'500',occupancy:'75',downPaymentPercent:''};
test('basic calculation matches annual rent and renovation costs',()=>{
    assert.deepEqual(calculateBasic(base),{total_investment:31800,annual_gross_rent:4500,gross_yield:4500/31800*100});
});
test('invalid and missing required values cannot be saved',()=>{
    for(const values of [{purchasePrice:'-100'},{area:'0'},{occupancy:'101'},{renovationCostPerM2:'-1'},{purchasePrice:''},{financing:'mortgage',downPaymentPercent:'100'}]) assert.ok(Object.keys(validateBasic({...base,...values})).length);
    assert.equal(calculateBasic({...base,purchasePrice:'-100'}),null);
    assert.equal(Object.keys(validateBasic({...base,financing:'mortgage',downPaymentPercent:'0'})).length,0);
});
test('missing rent stays unknown, zero rent stays zero',()=>{
    assert.equal(calculateBasic({...base,monthlyRent:''}).gross_yield,null);
    assert.equal(calculateBasic({...base,monthlyRent:'0'}).gross_yield,0);
});
test('draft survives reload and keeps account scope without passwords',()=>{
    const storage=new Map();globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)};
    assert.equal(writeCalculatorDraft({...base,ownerId:7,pending:true,password:'never-store'}),true);
    const saved=readCalculatorDraft();assert.equal(saved.ownerId,7);assert.equal(saved.purchasePrice,'27900');assert.equal(saved.pending,true);assert.equal(saved.password,undefined);
    clearCalculatorDraft();assert.equal(readCalculatorDraft(),null);
    storage.set('propfolio-calculator-draft-v1','broken');assert.equal(readCalculatorDraft(),null);
});
test('network and server errors have readable messages',async()=>{
    const previous=globalThis.fetch;
    try {
        globalThis.fetch=async()=>new Response(JSON.stringify({detail:'Neizdevās saglabāt'}),{status:422});
        await assert.rejects(requestJson('/test'),/Neizdevās saglabāt/);
        globalThis.fetch=async()=>new Response('{}',{status:401});
        await assert.rejects(requestJson('/test'),/Sesija ir beigusies/);
        globalThis.fetch=async()=>{throw new TypeError('offline');};
        await assert.rejects(requestJson('/test'),/Neizdevās savienoties/);
    } finally {globalThis.fetch=previous;}
});
test('advanced draft retains the step and is scoped by property and financing',()=>{
    const storage=new Map();globalThis.sessionStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)};
    saveAnalysisDraft(14,'cash',{monthly_rent:180},2,'saved-revision');
    assert.equal(readAnalysisDraft(14,'cash').step,2);
    assert.equal(readAnalysisDraft(14,'cash').base,'saved-revision');
    assert.equal(readAnalysisDraft(14,'mortgage'),null);
    assert.equal(readAnalysisDraft(20,'cash'),null);
    clearAnalysisDraft(14,'cash');assert.equal(readAnalysisDraft(14,'cash'),null);
});
