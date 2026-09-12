// Exercise the production loader with a deterministic clock and object reader.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const src = fs.readFileSync(path.join(__dirname, '../src/core/resource/Tw2LoadingObject.js'), 'utf8');
function rig(source=src,budget=.01,cost=6) {
 let now=0,serial=0; const queue=[],resolved=[],rejected=[];
 const rm={_prepareBudget:budget,tw2:{get now(){return now;}},Queue(r,data){queue.push([r,data]);},RetainLoadingObject(){return true;},RemoveResource(){}};
 class Base {GetLastError(){return null;} OnPrepared(){this.completions=(this.completions||0)+1;} OnError(e){this.error=e;} OnWarning(){} }
 class Reader {constructor(){now+=2;} Construct(){now+=cost;return ++serial;} }
 const clean=source.replace(/^import .*;\r?\n/gm,'').replace('export class','class');
 const C=Function('resMan','Tw2Resource','Tw2ObjectReader','Tw2BlackReader','ErrResourceFormatUnsupported',clean+';return Tw2LoadingObject;')(rm,Base,Reader,Reader,Error);
 const o=new C();o.path='fixture.black';
 const add=(label,callback)=>o.AddObject(v=>{resolved.push([label,v]);callback?.();},e=>rejected.push([label,e.message]));
 const step=()=>{const t=now;const [r,data]=queue.shift()||[o,new ArrayBuffer(1)];r.Prepare(data);return now-t;};
 return {o,rm,queue,resolved,rejected,add,step,get now(){return now;}};
}
const r=rig(); for(let i=0;i<200;i++)r.add(i);
const slices=[r.step()]; assert.equal(r.o.completions,undefined); assert.ok(r.o._objects.length>0);
while(r.queue.length){slices.push(r.step());assert.ok(slices.length<300);}
assert.deepEqual(r.resolved.map(x=>x[0]),Array.from({length:200},(_,i)=>i));
assert.deepEqual(r.resolved.map(x=>x[1]),Array.from({length:200},(_,i)=>i+1));
assert.equal(r.o.completions,1);assert.equal(r.o._objects.length,0);
assert.ok(Math.max(...slices)<=16);
const nested=rig();nested.add('a',()=>nested.add('d'));nested.add('b');nested.add('c');nested.step();
assert.equal(nested.queue.length,1);while(nested.queue.length)nested.step();
assert.deepEqual(nested.resolved.map(x=>x[0]),['a','b','c','d']);
nested.add('retained');assert.equal(nested.queue.length,1);nested.step();assert.equal(nested.resolved.at(-1)[0],'retained');
const errors=rig();errors.add('bad',()=>{throw Error('callback');});errors.add('good');errors.step();while(errors.queue.length)errors.step();
assert.deepEqual(errors.rejected,[['bad','callback']]);assert.equal(errors.resolved.at(-1)[0],'good');
const failure=rig();failure.add('a',()=>failure.add('late'));failure.add('b');failure.add('c');failure.step();failure.o.OnError(Error('cancel'));assert.deepEqual(failure.rejected.map(x=>x[0]),['c','late']);
const zero=rig(src,0);zero.add(1);zero.add(2);zero.step();assert.equal(zero.resolved.length,1);assert.equal(zero.queue.length,1);zero.step();assert.equal(zero.resolved.length,2);
console.log('Loading-object budget: FIFO, reentrancy, reuse, errors, zero budget and completion checks passed.');
