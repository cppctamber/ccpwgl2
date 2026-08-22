/**
 * EveTurretSet wire surface - 2026-08-22.
 *
 * The black reader matches on WIRE NAMES. A persisted Carbon attribute with no
 * decorated property does not degrade - it throws and the whole file fails, so
 * one missing name costs an entire turret:
 *
 *   Unknown property "state" for "EveTurretSet"
 *   res:/dx9/model/turret/energy/pulse/s/pulse_gatling_t1.black
 *
 * Ten persisted attributes were missing, which is ten failed loads if they are
 * found one at a time. This asserts the whole set at once, and then loads the
 * asset that reported the error.
 *
 * The asset is fetched from the local tools-core service and cached beside the
 * other test assets. Skipped, not failed, when neither is available.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RES = "http://127.0.0.1:5510/eve/latest/resources/";
const ASSET = "dx9/model/turret/energy/pulse/s/pulse_gatling_t1.black";
const CACHE = path.resolve(__dirname, "../artifacts/cache", path.basename(ASSET));

const bundle = path.resolve(__dirname, "../dist/ccpwgl2_int.js");
if (!fs.existsSync(bundle))
{
    console.log("Turret set decorators skipped - no dist build");
    process.exit(0);
}

stubBrowser();
const mod = require(bundle);
const tw2 = mod.tw2 || mod.default || mod;

main();

async function main()
{
    testEveryPersistedAttributeIsDeclared();
    testTheStateEnumsAreNotInterchangeable();
    await testTheReportedAssetLoads();
    console.log("Turret set decorators verified");
}

/**
 * Every Be::PERSIST / PERSISTONLY attribute in EveTurretSet_Blue.cpp, with the
 * decorator kind each C++ type demands. EveTurretSet has NO exposure chain, so
 * this is the complete surface rather than a sample.
 */
function testEveryPersistedAttributeIsDeclared()
{
    const turretSet = new (tw2.GetClass("EveTurretSet"))();

    const persisted = {
        // string / path
        name: "string",
        locatorName: "string",
        geometryResPath: "string",
        firingEffectResPath: "string",
        // std::wstring - needs a wstring blackReader, see below
        idleToTargetingMovementAudioEvent: "string",
        targetingToIdleMovementAudioEvent: "string",
        // numeric
        maxTrackingTime: "number",
        state: "number",
        impactSize: "number",
        impactBehaviour: "number",
        maxCyclingFirePos: "number",
        cyclingFireGroupCount: "number",
        bottomClipHeight: "number",
        sysBoneHeight: "number",
        sysBonePitchFactor: "number",
        sysBonePitchOffset: "number",
        sysBonePitchMin: "number",
        sysBonePitchMax: "number",
        sysBonePitch01Factor: "number",
        sysBonePitch01Offset: "number",
        sysBonePitch02Factor: "number",
        sysBonePitch02Offset: "number",
        sysBonePitch03Factor: "number",
        sysBonePitch03Offset: "number",
        // boolean
        updatePitchPose: "boolean",
        useDynamicBounds: "boolean",
        useRandomFiringDelay: "boolean",
        chooseRandomLocator: "boolean",
        laserMissBehaviour: "boolean",
        projectileMissBehaviour: "boolean",
        randomizeExplosionRotation: "boolean",
        useLowLodFiringTransform: "boolean",
        playMovementSound: "boolean",
        // vectors
        boundingSphere: "object",
        lowLodFiringEffectScale: "object",
        lowLodFiringEffectRotation: "object",
        lowLodFiringEffectTranslation: "object",
        // structs - null is a declared property, undefined is not
        turretEffect: "object",
        turretMovementObserver: "object",
        ambientEffect: "object"
    };

    const missing = Object.keys(persisted).filter(name => turretSet[name] === undefined);
    assert.deepEqual(missing, [], "every persisted Carbon attribute needs a declaration or the file fails to read");

    for (const [ name, kind ] of Object.entries(persisted))
    {
        const value = turretSet[name];
        // null is legitimately "object" for the struct slots.
        if (value === null) continue;
        assert.equal(typeof value, kind, `${name} should default to a ${kind}`);
    }

    // The two audio events are std::wstring, and reading them at the wrong width
    // takes bytes from the next property and desynchronises everything after.
    const readers = tw2.GetClass("EveTurretSet").blackReaders || {};
    assert.ok(readers.idleToTargetingMovementAudioEvent, "the idle->targeting audio event needs the wstring reader");
    assert.ok(readers.targetingToIdleMovementAudioEvent, "the targeting->idle audio event needs the wstring reader");
}

/**
 * ccpwgl's runtime states and Carbon's persisted ones share names at DIFFERENT
 * ordinals, so the wire value cannot be assigned to `_state` directly. The
 * shipped asset carries 4, which is FIRING to Carbon and PACKING here.
 */
function testTheStateEnumsAreNotInterchangeable()
{
    const EveTurretSet = tw2.GetClass("EveTurretSet");

    assert.ok(EveTurretSet.CarbonState, "the persisted ordinals must be recorded separately");
    assert.equal(EveTurretSet.CarbonState.IDLE, 2);
    assert.equal(EveTurretSet.CarbonState.FIRING, 4);

    assert.notEqual(EveTurretSet.State.IDLE, EveTurretSet.CarbonState.IDLE,
        "if these ever agree, the warning in the source is stale and should be revisited");
    assert.equal(EveTurretSet.State.PACKING, 3, "PACKING is a ccpwgl invention with no Carbon counterpart");
}

/** The asset from the error report, loaded end to end. */
async function testTheReportedAssetLoads()
{
    const buffer = await getAsset();
    if (!buffer)
    {
        console.log("  (asset load skipped - no local resource service and no cached copy)");
        return;
    }

    const root = new (tw2.GetClass("Tw2BlackReader"))(
        new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    ).Construct();

    assert.equal(root.constructor.name, "EveTurretSet", "the file is a turret set");
    assert.equal(root.name, "Pulse_Gatling_T1");

    // Read, not merely declared: a decorator that reads the wrong width still
    // "works" until you look at the value.
    assert.equal(root.idleToTargetingMovementAudioEvent, "turret_move_energy_out_small");
    assert.equal(root.targetingToIdleMovementAudioEvent, "turret_move_energy_in_small");
    assert.equal(root.state, 4, "the authored state is Carbon's FIRING ordinal");
}

async function getAsset()
{
    if (fs.existsSync(CACHE)) return fs.readFileSync(CACHE);

    try
    {
        const response = await fetch(RES + ASSET, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) return null;
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.mkdirSync(path.dirname(CACHE), { recursive: true });
        fs.writeFileSync(CACHE, buffer);
        return buffer;
    }
    catch
    {
        return null;
    }
}

function stubBrowser()
{
    global.window = global;
    global.self = global;
    global.navigator = { userAgent: "node" };
    global.document = {
        baseURI: "http://localhost/",
        createElement: () => ({ getContext: () => null, style: {}, addEventListener: () => {} }),
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    global.location = { search: "", href: "http://localhost/", protocol: "http:", hostname: "localhost" };
    global.requestAnimationFrame = fn => setTimeout(fn, 16);
    global.addEventListener = () => {};
    global.removeEventListener = () => {};

    const names = [ "WebGLShader", "WebGLProgram", "WebGLBuffer", "WebGLTexture", "WebGLFramebuffer",
        "WebGLRenderbuffer", "WebGLRenderingContext", "WebGL2RenderingContext", "WebGLUniformLocation",
        "WebGLVertexArrayObject", "WebGLActiveInfo", "HTMLCanvasElement", "HTMLImageElement", "Image",
        "OffscreenCanvas", "ImageBitmap", "Audio", "HTMLVideoElement", "XMLHttpRequest" ];

    for (const name of names) if (!global[name]) global[name] = class {};
}
