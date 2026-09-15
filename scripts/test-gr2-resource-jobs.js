/* eslint-env node */
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
let source = fs.readFileSync(path.join(__dirname, "../src/core/resource/Tw2GeometryRes.js"), "utf8");
source = source.replace(/^import[\s\S]*?from "[^"]+";\r?\n/gm, "").replace(/^\s*@.*$/gm, "").replace(/^export /gm, "");
let now = 0, cancelled = 0, prepared = 0, builds = 0;
const jobs = [];
const schedulerSource = fs.readFileSync(path.join(__dirname, "../src/core/engine/Tw2ResourceProcessing.js"), "utf8").replace("export class", "class");
const Scheduler = new Function(schedulerSource + ";return Tw2ResourceProcessing;")();
const scheduler = new Scheduler();
const resMan = { useGeometryWorkers: true, tw2: { get now() { return now; } }, CancelProcessing(r) { scheduler.Cancel(r); }, Queue(...args) { scheduler.Queue(...args); }, IsSystemMirrorEnabled() { return true; } };
const pump = () => scheduler.Pump(() => now, 10);
const gr2WorkerPool = { Decode() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); promise.cancel = () => { cancelled++; reject(Error("cancelled")); }; jobs.push({ resolve, reject }); return promise; } };
class Base { OnRequested() { scheduler.Cancel(this); return true; } OnError(error) { scheduler.Cancel(this); this.error = error; } OnPrepared() { prepared++; } OnUnloaded() {} }
const Reader = { extension: "gr2", *BuildGeometryResSteps() { builds++; for (let i = 0; i < 3; i++) { now += 8; yield; } } };
const vec3 = { fromValues: (...x) => x, create: () => [ 0, 0, 0 ], set: (out, ...x) => out.splice(0, 3, ...x) };
const dependencies = { resMan, gr2WorkerPool, prepareGr2() {}, Tw2Resource: Base, Tw2Error: Error, Gr2Reader: Reader, GR2JsonReader: { extension: "gr2_json" }, GsfReader: { extension: "gsf" }, OBJReader: { extension: "obj" }, GltfReader: { extension: "gltf" }, vec3, box3: {}, sph3: {}, device: { gl: {} } };
const Resource = new Function(...Object.keys(dependencies), source + ";return Tw2GeometryRes;")(...Object.values(dependencies));
const flush = () => new Promise(resolve => setImmediate(resolve));
async function main()
{
    const res = new Resource(); res.path = "fixture.gr2"; res._extension = "gr2"; res.RebuildBounds = () => {};
    res.Prepare(new ArrayBuffer(4)); pump(); assert.equal(scheduler.size, 1); assert.equal(prepared, 0);
    res.OnRequested(); await flush(); assert.equal(scheduler.size, 0); assert.equal(cancelled, 1);
    jobs[0].resolve({}); await flush(); pump(); assert.equal(builds, 0);
    res.Prepare(new ArrayBuffer(4)); pump(); jobs[1].resolve({}); await flush(); pump();
    assert.equal(now, 16); assert.equal(prepared, 0); assert.equal(scheduler.size, 1);
    res.Unload(); pump(); assert.equal(prepared, 0, "Stale completion cannot resurrect unloaded geometry");
    res.Prepare(new ArrayBuffer(4)); pump(); jobs[2].resolve({}); await flush();
    while (scheduler.size) pump();
    assert.equal(prepared, 1);
    res.Prepare(new ArrayBuffer(4)); pump(); jobs[3].reject(Error("decode failed")); await flush();
    assert.match(res.error.message, /decode failed/); assert.equal(scheduler.size, 0);
    console.log("GR2 processing: cancellation, stale completion, budget, readiness and pending accounting passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
