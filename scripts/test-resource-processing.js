/* eslint-env node */
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
function source(file)
{
    return fs.readFileSync(path.join(__dirname, "../src", file), "utf8")
        .replace(/^import[\s\S]*?from "[^"]+";\r?\n/gm, "")
        .replace(/^\s*@.*$/gm, "").replace(/^export /gm, "");
}
const Scheduler = new Function(source("core/engine/Tw2ResourceProcessing.js") + ";return Tw2ResourceProcessing;")();
const scheduler = new Scheduler();
let time = 0;
const resMan = { activeFrame: 42, CancelProcessing: r => scheduler.Cancel(r), OnPathEvent() {} };
const Resource = new Function("resMan", "Tw2Notifications", "Tw2Error", "isFunction",
    source("core/resource/Tw2Resource.js") + ";return Tw2Resource;")(
    resMan, class { UpdateNotifications() {} }, Error, x => typeof x === "function");
const Manager = new Function("Tw2EventEmitter", "Tw2Error", source("core/engine/Tw2ResMan.js") + ";return Tw2ResMan;")(class {}, Error);
const manager = Object.create(Manager.prototype);
Object.assign(manager, { processing: scheduler, _prepareQueue: [], _prepareQueueHead: 0,
    _pendingLoads: new Set(), _loadQueue: [], _loadQueueHead: 0 });
class Processed extends Resource { static requiresProcessing = true; }
const flush = () => new Promise(resolve => setImmediate(resolve));
async function main()
{
    const old = new Resource(), modern = new Processed();
    old.OnLoaded(); modern.OnLoaded();
    assert.equal(old.IsGood(), true); assert.equal(modern.IsGood(), false);
    assert.equal(modern.activeFrame, 42, "IsGood still refreshes usage while processing");
    manager.Queue(old, "legacy");
    assert.equal(manager._prepareQueue.length, 1);
    let resolve, cancel = 0, completed = 0;
    const promise = new Promise(r => { resolve = r; }); promise.cancel = () => cancel++;
    modern.Process = function* () { const value = yield promise; assert.equal(value, 7); time += 8; yield; time += 8; yield; completed++; };
    manager.Queue(modern, null);
    assert.equal(manager.pendingProcessing, 1); assert.equal(manager.pendingLoads, 2);
    scheduler.Pump(() => time, 10);
    assert.equal(modern.HasCompleted(), false); assert.equal(manager.pendingLoads, 2);
    resMan.activeFrame = 99;
    scheduler.Pump(() => time, 10);
    assert.equal(modern.activeFrame, 42, "Scheduling must not keep resources alive by polling IsGood");
    resolve(7); await flush(); scheduler.Pump(() => time, 10);
    assert.equal(time, 16); assert.equal(modern.HasPrepared(), false);
    scheduler.Pump(() => time, 10);
    assert.equal(completed, 1); assert.equal(modern.IsGood(), true); assert.equal(manager.pendingProcessing, 0);

    let late;
    const pending = new Promise(r => { late = r; }); pending.cancel = () => cancel++;
    modern.Process = function* () { yield pending; throw Error("stale result executed"); };
    modern.OnRequested(); modern.OnLoaded(); manager.Queue(modern); scheduler.Pump(() => time, 10);
    modern.OnUnloaded(); assert.equal(cancel, 1); late(); await flush(); scheduler.Pump(() => time, 10);
    assert.equal(modern.IsUnloaded(), true); assert.equal(manager.pendingProcessing, 0);

    const order = [];
    for (const name of ["a", "b"]) scheduler.Queue({ *Process() { order.push(name); time++; yield; order.push(name); time++; }, OnPrepared() {} });
    scheduler.Pump(() => time, 2); assert.deepEqual(order, ["a", "b"]);
    scheduler.Pump(() => time, 2); assert.deepEqual(order, ["a", "b", "a", "b"]);

    modern.Process = function* () { yield Promise.reject(Error("decode failed")); };
    modern.OnRequested(); modern.OnLoaded(); manager.Queue(modern); scheduler.Pump(() => time, 10); await flush();
    assert.equal(modern.HasErrored(), true); assert.equal(manager.pendingProcessing, 0);
    assert.equal(manager._prepareQueue[0][1], "legacy", "Legacy entry is unchanged");
    let legacyPrepared = 0;
    old.Prepare = data => { assert.equal(data, "legacy"); legacyPrepared++; time++; old.OnPrepared(); };
    Object.assign(manager, { tw2: { get now() { return time; }, dt: 0 }, maxPrepareTime: .01,
        PumpLoadQueue() {}, _noLoadFrames: 0, _autoReload: new Map(), _purgeTime: 0,
        motherLode: { UpdateWatched() {} } });
    scheduler.Queue({ *Process() { for (let i = 0; i < 15; i++) { time++; yield; } }, OnPrepared() {} });
    const start = time;
    manager.Tick();
    assert.equal(legacyPrepared, 1, "Processing must leave time for the legacy queue");
    assert.equal(time - start, 6, "The processing and prepare paths share the frame budget");
    assert.equal(manager.IsLoading(), true);
    while (manager.pendingLoads) manager.Tick();
    manager.Tick(); manager.Tick(); assert.equal(manager.IsLoading(), false);
    console.log("Processing: opt-in readiness, keep-alive, routing, pending accounting, waiting, fairness, cancellation and failure passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });

// Completion polling must share the budget and rotate fairly across frames.
const pollingScheduler = new Scheduler();
let pollTime = 0;
const polled = [];
for (let i = 0; i < 100; i++) pollingScheduler.Queue({ *Process() { yield { poll() { polled.push(i); pollTime++; return false; } }; } });
pollingScheduler.Pump(() => pollTime, 10);
for (let frame = 0; frame < 10; frame++) {
    const start = pollTime;
    pollingScheduler.Pump(() => pollTime, 10);
    assert.equal(pollTime - start, 10);
}
assert.equal(new Set(polled).size, 100);
let readySteps = 0;
pollingScheduler.Queue({ *Process() { readySteps++; yield; }, OnPrepared() {} });
pollingScheduler.Pump(() => pollTime, 10);
assert.ok(readySteps > 0, 'Waiting polls must leave room for ready jobs');
pollingScheduler.Clear();
const reentrant = new Scheduler();
let closed = 0, cleaned = 0;
const resource = { *Process() { try { reentrant.Cancel(this); yield; } finally { closed++; } }, OnProcessingCancelled() { cleaned++; } };
reentrant.Queue(resource); reentrant.Pump(() => 0, 10);
assert.equal(reentrant.size, 0); assert.equal(closed, 1); assert.equal(cleaned, 1);
console.log('Scheduler review regressions: bounded fair polling and reentrant cleanup passed');

// A failed permutation can cancel every sibling in the polling set.
const failedPolls = new Scheduler();
let reported = 0;
failedPolls.Queue({ *Process() { yield { poll() { throw Error('link failure'); } }; }, OnError() { reported++; failedPolls.Clear(); } });
failedPolls.Queue({ *Process() { yield { poll() { return false; } }; } });
failedPolls.Pump(() => 0, 10);
assert.doesNotThrow(() => failedPolls.Pump(() => 0, 10));
assert.equal(reported, 1); assert.equal(failedPolls.size, 0);
