/* eslint-env node */
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
let source = fs.readFileSync(path.join(__dirname, "../src/core/resource/Tw2GeometryRes.js"), "utf8");
source = source.replace(/^import[\s\S]*?from "[^"]+";\r?\n/gm, "").replace(/^\s*@.*$/gm, "").replace(/^export /gm, "");
let now = 0, pending = 0, cancelled = 0, prepared = 0, builds = 0;
const queue = [], jobs = [];
const resMan = { useGeometryWorkers: true, _prepareBudget: .01, tw2: { get now() { return now; } }, AddPendingLoad() { pending++; }, RemovePendingLoad() { pending--; }, Queue(...args) { queue.push(args); }, IsSystemMirrorEnabled() { return true; } };
const gr2WorkerPool = { Decode() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); promise.cancel = () => { cancelled++; reject(Error("cancelled")); }; jobs.push({ resolve, reject }); return promise; } };
class Base { OnRequested() { return true; } OnError(error) { this.error = error; } OnPrepared() { prepared++; } OnUnloaded() {} }
const Reader = { extension: "gr2", *BuildGeometryResSteps() { builds++; for (let i = 0; i < 3; i++) { now += 8; yield; } } };
const vec3 = { fromValues: (...x) => x, create: () => [ 0, 0, 0 ], set: (out, ...x) => out.splice(0, 3, ...x) };
const dependencies = { resMan, gr2WorkerPool, prepareGr2() {}, Tw2Resource: Base, Tw2Error: Error, Gr2Reader: Reader, GR2JsonReader: { extension: "gr2_json" }, GsfReader: { extension: "gsf" }, OBJReader: { extension: "obj" }, GltfReader: { extension: "gltf" }, vec3, box3: {}, sph3: {}, device: { gl: {} } };
const Resource = new Function(...Object.keys(dependencies), source + ";return Tw2GeometryRes;")(...Object.values(dependencies));
const flush = () => new Promise(resolve => setImmediate(resolve));
async function main()
{
    const res = new Resource(); res.path = "fixture.gr2"; res._extension = "gr2"; res.RebuildBounds = () => {};
    res.Prepare(new ArrayBuffer(4)); assert.equal(pending, 1); assert.equal(prepared, 0);
    res.OnRequested(); await flush(); assert.equal(pending, 0); assert.equal(cancelled, 1);
    jobs[0].resolve({}); await flush(); assert.equal(queue.length, 0, "A cancelled result must never queue completion");
    res.Prepare(new ArrayBuffer(4)); jobs[1].resolve({}); await flush(); assert.equal(pending, 0); assert.equal(queue.length, 1);
    let entry = queue.shift(); entry[0].Prepare(entry[1], entry[2]);
    assert.equal(now, 16); assert.equal(prepared, 0); assert.equal(queue.length, 1, "Mesh steps respect the prepare budget");
    res.Unload(); entry = queue.shift(); entry[0].Prepare(entry[1], entry[2]); assert.equal(prepared, 0, "Stale queued completion cannot resurrect an unloaded resource");
    res.Prepare(new ArrayBuffer(4)); jobs[2].resolve({}); await flush();
    while (queue.length) { const [r, data, options] = queue.shift(); r.Prepare(data, options); }
    assert.equal(prepared, 1); assert.equal(res._gr2Task, null);
    res.Prepare(new ArrayBuffer(4)); jobs[3].reject(Error("decode failed")); await flush();
    assert.match(res.error.message, /decode failed/); assert.equal(pending, 0); assert.equal(res._gr2Task, null);
    console.log("GR2 resource jobs: reload/unload cancellation, stale completion, prepare budget, readiness and pending accounting passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
