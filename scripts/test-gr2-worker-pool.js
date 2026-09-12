/* eslint-env node */
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../src/core/reader/geometry/Gr2WorkerPool.js"), "utf8").replace(/^import .*;\r?\n/gm, "").replace(/^export /gm, "");
class WorkerMock
{
    static all = [];
    constructor() { WorkerMock.all.push(this); this.dead = false; }
    postMessage(data, transfers) { this.data = structuredClone(data, { transfer: transfers }); }
    terminate() { this.dead = true; }
    ready() { this.onmessage({ data: { ready: true } }); }
    finish() { this.onmessage({ data: { id: this.data.id, result: this.data.options.value } }); }
}
const Pool = new Function("prepareGr2", "Worker", source + "; return Gr2WorkerPool;")((buffer, options) => ({ fallback: true, bytes: buffer.byteLength, value: options.value }), WorkerMock);
async function main()
{
    const pool = new Pool(), buffers = Array.from({ length: 4 }, () => new ArrayBuffer(12));
    const jobs = buffers.map((buffer, value) => pool.Decode(buffer, { value }, "fixture.js"));
    const settled = jobs.map(job => job.then(value => ({ value }), error => ({ error: error.message })));
    assert.equal(pool.workers.length, 2);
    for (const worker of WorkerMock.all) worker.ready();
    assert.equal(buffers[0].byteLength, 0);
    assert.equal(buffers[1].byteLength, 0);
    assert.equal(buffers[2].byteLength, 12, "Queued bytes remain with the caller until a worker is ready");
    jobs[3].cancel();
    jobs[0].cancel();
    assert.equal(WorkerMock.all[0].dead, true);
    WorkerMock.all[1].finish();
    // Finishing the second job dispatches the remaining queued job.
    WorkerMock.all[1].finish();
    const result = await Promise.all(settled);
    assert.match(result[0].error, /cancelled/); assert.match(result[3].error, /cancelled/);
    assert.equal(result[1].value, 1); assert.equal(result[2].value, 2);
    assert.equal(pool.queue.length, 0);
    const broken = new Pool();
    const fallback = broken.Decode(new ArrayBuffer(8), { value: 7 }, "broken.js");
    broken.Fail(new Error("Startup failure"));
    assert.deepEqual(await fallback, { fallback: true, bytes: 8, value: 7 });
    const active = new Pool(), failed = active.Decode(new ArrayBuffer(4), {}, "active.js");
    active.workers[0].worker.ready();
    const failure = assert.rejects(failed, /worker crashed/);
    active.Fail(new Error("worker crashed")); await failure;
    pool.Fail(new Error("test cleanup"));
    console.log("GR2 worker pool: concurrency, transfers, queued/active cancellation, startup fallback and active failure passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
