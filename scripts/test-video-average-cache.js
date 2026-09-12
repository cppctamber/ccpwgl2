/* eslint-env node */
require("./test-attachment-lights-runtime.js");
const assert = require("node:assert/strict");
const mod = require("../dist/ccpwgl2_int.js"), tw2 = mod.tw2 || mod.default || mod;
const Texture = tw2.GetClass("Tw2TextureRes"), format = Texture.GetFormat("webm");
const pending = new Map(); let id = 0, allocations = 0, reads = 0, fail = false;
let pixel = [255, 0, 0, 255];
global.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
global.cancelAnimationFrame = key => pending.delete(key);
global.document.createElement = name => {
    assert.equal(name, "canvas"); allocations++;
    return { getContext: () => ({
        drawImage(video, x, y, w, h) { assert.equal(w, 16); assert.equal(h, 16); },
        getImageData(x, y, w, h) {
            reads++; assert.equal(w*h*4, 1024);
            if (fail) throw new Error("Unreadable test source");
            const data = new Uint8ClampedArray(1024);
            for (let i=0;i<data.length;i+=4) data.set(pixel,i);
            return {data};
        }
    }) };
};
function flush() { const tasks = Array.from(pending.values()); pending.clear(); tasks.forEach(fn => fn()); }
const res = new Texture(), runtime = format.EnsureRuntime(res);
runtime.el = {readyState:2,currentTime:0,pause(){},load(){}};
runtime.useVFC = true;
for (let i=0;i<100;i++) assert.deepEqual(Array.from(res.GetAverageColor()),[0,0,0,0]);
assert.equal(pending.size,1); assert.equal(reads,0);
flush(); assert.deepEqual(Array.from(res.GetAverageColor()),[1,0,0,1]);
assert.equal(reads,1); assert.equal(pending.size,0);
runtime.el.currentTime=.01;
res.GetAverageColor(); assert.equal(pending.size,0,"media time alone is not a decoded frame");
runtime.frameSerial++; pixel=[0,255,0,255];
assert.deepEqual(Array.from(res.GetAverageColor()),[1,0,0,1],"old colour remains until callback");
for(let i=0;i<100;i++)res.GetAverageColor(); flush();
assert.deepEqual(Array.from(res.GetAverageColor()),[0,1,0,1]);
assert.equal(allocations,1); assert.equal(reads,2);
runtime.frameSerial++;res.GetAverageColor();runtime.Unload();
assert.equal(pending.size,0,"unload cancels pending sample");
const res2=new Texture(), rt2=format.EnsureRuntime(res2);
rt2.el={readyState:2,currentTime:0};rt2.useVFC=false;
res2.GetAverageColor();flush();res2.GetAverageColor();assert.equal(pending.size,0);
rt2.el.currentTime=1;res2.GetAverageColor();fail=true;
const warn=console.warn;console.warn=()=>{};
try {flush();} finally {console.warn=warn;}
const before=reads;rt2.el.currentTime=2;res2.GetAverageColor();flush();assert.equal(reads,before);
assert.deepEqual(Array.from(res2.GetAverageColor()),[0,1,0,1],"failed read keeps last valid colour");
console.log("Video colour cache: deferred/coalesced reads, decoded-frame gating, reuse, fallback and cleanup passed");
