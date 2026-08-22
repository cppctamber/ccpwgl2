/**
 * Smart light GEOMETRY, runtime behaviour - 2026-08-22.
 *
 * `EveChildSmartLightSet` used to be `@meta.notImplemented` and discarded both
 * `distribution` and `lightGroups` through `skippedObject`/`skippedObjectArray`,
 * so a hull carrying smart lights parsed with no error and hydrated NOTHING.
 * That failure mode is invisible: nothing throws, nothing logs, there is simply
 * no geometry. So the checks below are mostly about the seams where silence is
 * the symptom - registration, fan-out, and the vertex layout.
 *
 * The vertex layout matters more than it looks. `EveSmartLightQuad` de-instances
 * Carbon's 108-byte instance record into four corner vertices, and every float
 * has to land where `flarequad` expects it. A transposed matrix row or an
 * off-by-one offset produces quads that render - just in the wrong place, at the
 * wrong size, or invisible - which is far harder to diagnose than a throw.
 *
 * NOTE this exercises dist/, so it proves the LAST BUILD. Rebuild before
 * trusting it.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const bundle = path.resolve(__dirname, "../dist/ccpwgl2_int.js");
if (!fs.existsSync(bundle))
{
    console.log("Smart light geometry skipped - no dist build");
    process.exit(0);
}

stubBrowser();
const mod = require(bundle);
const tw2 = mod.tw2 || mod.default || mod;

testClassesAreRegistered();
testSetFansOutToDistributionAndGroups();
testSetIsInertWithoutADistribution();
testQuadVertexLayout();
testQuadHonoursTheLiveCount();
testShipExposesLocatorSets();
testParentLocatorsCopyTheLocatorTransform();
testSpeedExpressionsReadTheShip();
testShipPublishesItsControllerVariables();
testBeamTintReachesTheEffect();
console.log("Smart light geometry verified");

/**
 * The registration itself. An unregistered class is not a load error - the
 * black reader builds a plain `{_type}` bag and then throws on the first
 * property it cannot type, naming a property rather than the class, which reads
 * as a data problem.
 */
function testClassesAreRegistered()
{
    for (const name of [ "EveChildSmartLightSet", "EveSmartLightQuad" ])
    {
        assert.ok(tw2.HasClass(name), `${name} must be registered or nothing can hydrate it`);
    }
}

/**
 * Carbon's order: the distribution advances BEFORE the groups read placements
 * from it (EveChildSmartLightSet.cpp:73-86). A group that ran first would see
 * last frame's placements - correct-looking geometry lagging one tick.
 */
function testSetFansOutToDistributionAndGroups()
{
    const set = new (tw2.GetClass("EveChildSmartLightSet"))();
    const order = [];

    set.distribution = {
        GetPlacementData: () => [],
        GetNumberOfPlacements: () => 0,
        UpdateSyncronous: (ctx) =>
        {
            order.push("distribution");
            assert.equal(typeof ctx.GetDeltaT, "function", "the update context must expose GetDeltaT");
            assert.equal(ctx.GetDeltaT(), 0.25, "GetDeltaT must report the dt the parent passed");
        }
    };

    set.lightGroups = [ {
        UpdateSyncronous: (ctx, params, distribution) =>
        {
            order.push("group");
            assert.equal(distribution, set.distribution, "a group is handed the distribution - it holds no placements itself");
            assert.equal(params.activationStrength, 0.5, "activation strength comes off the parent per-object data");
        }
    } ];

    set.Update(0.25, identity(), { activationStrength: 0.5 });

    assert.deepEqual(order, [ "distribution", "group" ], "the distribution must advance before the groups read it");
}

/**
 * Carbon gates every fan-out on `m_distribution && m_display`
 * (EveChildSmartLightSet.cpp:101-110, 151-160). Without a distribution there
 * are no placements, so a group has nothing to place and must not be called.
 */
function testSetIsInertWithoutADistribution()
{
    const set = new (tw2.GetClass("EveChildSmartLightSet"))();
    let called = false;
    set.lightGroups = [ { UpdateSyncronous: () => { called = true; }, GetBatches: () => { called = true; return true; } } ];

    set.Update(0.25, identity(), {});
    assert.equal(called, false, "no distribution means no fan-out");
    assert.equal(set.GetBatches(0, null, {}), false, "no distribution means no batches");

    set.distribution = { GetPlacementData: () => [], GetNumberOfPlacements: () => 0 };
    set.display = false;
    set.Update(0.25, identity(), {});
    assert.equal(called, false, "display false means no fan-out either");
}

/**
 * The de-instanced vertex layout, checked float by float against
 * `EveChildQuad.vertexDeclarations` - which is the ccpwgl form of Carbon's
 * `EveChildQuad.cpp:33-51`, the definition smart light quads reuse verbatim
 * (EveSmartLightQuad.cpp:61,70).
 */
function testQuadVertexLayout()
{
    const quad = makeQuad();
    // A world transform with distinguishable entries, so a transposed read is
    // visible rather than symmetric.
    const m = quad.worldTransform;
    for (let i = 0; i < 16; i++) m[i] = i + 1;

    quad.BuildQuads([ placement({ translation: [ 7, 8, 9 ], scale: [ 2, 3, 4 ] }) ], 1, null);

    assert.equal(quad._quadCount, 1, "one placement builds one quad");

    const size = 31;
    const array = quad._array;

    for (let corner = 0; corner < 4; corner++)
    {
        const o = corner * size;

        assert.equal(array[o], corner, "float 0 is the corner index the shader expands the quad from");

        // Carbon packs Vector4 rows (_11,_21,_31,_41), which on the shared
        // D3D-row-major / GL-column-major byte layout is the column stride.
        assert.deepEqual(slice(array, o + 1, 4), [ m[0], m[4], m[8], m[12] ], "POSITION0 is world column 0");
        assert.deepEqual(slice(array, o + 5, 4), [ m[1], m[5], m[9], m[13] ], "POSITION1 is world column 1");
        assert.deepEqual(slice(array, o + 9, 4), [ m[2], m[6], m[10], m[14] ], "POSITION2 is world column 2");

        // localTransform is SYNTHESISED per placement: diagonal scale, with the
        // placement position in the w column. Not the authored localTransform.
        assert.deepEqual(slice(array, o + 13, 4), [ 2, 0, 0, 7 ], "POSITION3 is scaleX with position.x in w");
        assert.deepEqual(slice(array, o + 17, 4), [ 0, 3, 0, 8 ], "POSITION4 is scaleY with position.y in w");
        assert.deepEqual(slice(array, o + 21, 4), [ 0, 0, 4, 9 ], "POSITION5 is scaleZ with position.z in w");

        assert.equal(array[o + 28], quad.customColor[3], "alpha comes from the RAW customColor, not the group colour (cpp:162)");
        assert.equal(array[o + 29], quad.brightness, "TEXCOORD1.x is brightness");
        assert.equal(array[o + 30], 0, "TEXCOORD1.y is Carbon's unused second half");
    }
}

/**
 * `GetNumberOfPlacements()` can report FEWER than the array holds - the
 * distribution keeps dead rows in place rather than compacting. Carbon passes
 * the live count separately and it is the one that counts; reading
 * `placements.length` instead would render stale placements.
 */
function testQuadHonoursTheLiveCount()
{
    const quad = makeQuad();
    const placements = [ placement({}), placement({}), placement({}) ];

    quad.BuildQuads(placements, 2, null);
    assert.equal(quad._quadCount, 2, "the live count wins over the array length");

    quad.BuildQuads(placements, 0, null);
    assert.equal(quad._quadCount, 0, "a live count of zero builds nothing");
}

/**
 * The placement generators ask a hull for a named locator set by Carbon's name.
 * EveShip2 had only the private `_GetLocatorSetItems`, so the call threw
 * "parent.GetLocatorsForSet is not a function" from inside EveShip2.Update -
 * which aborts the whole child loop, taking every sibling after the smart light
 * set down with it. A missing method on a hot path is not a quiet failure.
 */
function testShipExposesLocatorSets()
{
    const ship = new (tw2.GetClass("EveShip2"))();

    assert.equal(typeof ship.GetLocatorsForSet, "function", "EveShip2 must answer Carbon's GetLocatorsForSet");
    assert.equal(ship.GetLocatorsForSet("primaryspotlight_01"), null, "an absent set is null, not a throw");

    ship.locatorSets.push({ name: "primaryspotlight_01", locators: [ 1, 2 ] });
    assert.deepEqual(ship.GetLocatorsForSet("primaryspotlight_01"), [ 1, 2 ], "a present set returns its locators");
}

/**
 * The generator reads a locator's transform off whatever the hull returns.
 * Carbon's `Locator` struct spells that position/direction/scale; ccpwgl's
 * `EveLocatorSetItem` spells it position/rotation/scaling. Reading Carbon's
 * names off a ccpwgl item gives undefined, and `Float32Array.set(undefined)`
 * THROWS - which `EveChildSmartLightSet` catches and latches, so the set goes
 * permanently inert with nothing on screen and nothing obviously wrong.
 *
 * That is not hypothetical: it is what shipped the moment `GetLocatorsForSet`
 * started resolving, because until then `_locators` stayed null and this loop
 * never ran.
 */
function testParentLocatorsCopyTheLocatorTransform()
{
    const generator = new (tw2.GetClass("EveDistributionPlacementGeneratorParentLocators"))();
    generator.locatorSetName = "primaryspotlight_01";

    // Shaped exactly like EveLocatorSetItem, which is what a hull hands back.
    const item = {
        position: Float32Array.from([ 1, 2, 3 ]),
        rotation: Float32Array.from([ 0, 0.7071, 0, 0.7071 ]),
        scaling: Float32Array.from([ 4, 5, 6 ]),
        boneIndex: 7
    };

    const ship = new (tw2.GetClass("EveShip2"))();
    ship.locatorSets.push({ name: "primaryspotlight_01", locators: [ item ] });

    generator.UpdateSyncronous({ GetDeltaT: () => 0 }, { spaceObjectParent: ship }, null);
    assert.equal(generator.IsRequestingRegeneration(), true, "resolving a locator set must ask for the pool to be rebuilt");

    const placements = [];
    generator.GetInitialPlacements(placements, { value: 0 });

    assert.equal(placements.length, 1, "one locator generates one placement");
    const data = placements[0].placement;
    assert.deepEqual(Array.from(data.initialTranslation), [ 1, 2, 3 ], "position is copied");
    assert.deepEqual(slice(data.initialRotation, 0, 4), Array.from(item.rotation), "ccpwgl spells the orientation `rotation`, not Carbon's `direction`");
    assert.deepEqual(Array.from(data.initialScale), [ 4, 5, 6 ], "ccpwgl spells the scale `scaling`, not Carbon's `scale`");
    assert.equal(data.boneIndex, 7, "the bone index rides along so skinned locators follow their bone");
}

/**
 * Speed-driven expressions, of which `amarr_primaryspotlight_01a` ships two:
 * `min(1.0, (shipSpeed*0.5)/max(shipMaxSpeed, 1.0))` on the SpeedDependant
 * lights.
 *
 * Carbon reads speed off `GetWorldVelocity`, which it has a Destiny ball for.
 * ccpwgl has no physics layer and carries embedder-set telemetry on
 * `ShipSpeed()`/`ShipMaxSpeed()` instead - so asking for Carbon's accessor got
 * 0 on every hull ccpwgl can load, and the expression evaluated at a standstill
 * forever. `shipMaxSpeed` was worse: it read a `params.ownerMaxSpeed` that
 * nothing sets, so the authored `max(shipMaxSpeed, 1.0)` always collapsed to 1.
 *
 * Zero is a legitimate answer for a stationary ship, which is exactly why this
 * failed silently - it needs a MOVING ship to tell the two apart.
 */
function testSpeedExpressionsReadTheShip()
{
    const bucket = new (tw2.GetClass("EveSmartLightAttributeModifierExpressionBucket"))();
    bucket.SetExpression("min(1.0, (shipSpeed*0.5)/max(shipMaxSpeed, 1.0))");

    const context = { GetDeltaT: () => 1 / 60 };

    bucket.UpdateSyncronous(context, { spaceObjectParent: { ShipSpeed: () => 300, ShipMaxSpeed: () => 200 } }, 1);
    assert.equal(round(bucket.attributeMultiplier), 0.75, "(300 * 0.5) / 200 - both inputs must reach the expression");

    bucket.UpdateSyncronous(context, { spaceObjectParent: { ShipSpeed: () => 0, ShipMaxSpeed: () => 200 } }, 1);
    assert.equal(bucket.attributeMultiplier, 0, "a stationary ship still evaluates to zero");

    // Carbon's own shape keeps working, so a Carbon-shaped duck is not broken
    // by preferring ccpwgl's accessor.
    const carbonShaped = { GetWorldVelocity: out => { out[0] = 300; out[1] = 0; out[2] = 0; return out; }, ShipMaxSpeed: () => 200 };
    bucket.UpdateSyncronous(context, { spaceObjectParent: carbonShaped }, 1);
    assert.equal(round(bucket.attributeMultiplier), 0.75, "GetWorldVelocity is still honoured when present");

    bucket.UpdateSyncronous(context, { spaceObjectParent: {} }, 1);
    assert.equal(bucket.attributeMultiplier, 0, "an object with neither accessor is a standstill, not a throw");
}

/**
 * A hull's own state reaches its children's controllers, and its smart lights'
 * ControllerVariableListeners, by NAME - Carbon fans it out with
 * SetControllerVariable rather than passing it as an update parameter
 * (EveSpaceObject2.cpp:224-230, and cpp:658-663 for the change case).
 *
 * ccpwgl had SetControllerVariable and the replay map, but nothing ever called
 * them with these seven names, so every listener sat on its authored
 * defaultValue forever no matter what the ship did.
 */
function testShipPublishesItsControllerVariables()
{
    const ship = new (tw2.GetClass("EveShip2"))();
    const published = [];
    ship.SetControllerVariable = (name, value) => published.push([ name, value ]);

    ship.activationStrength = 0.4;
    ship._PublishControllerVariables(ship.GetPerObjectDataBagOfStuff({}));

    assert.deepEqual(published.map(p => p[0]), [
        "DirtLevel", "ActivationStrength", "ShieldDamage", "ArmorDamage",
        "HullDamage", "ClipSphereFactor", "ClipSphereFactor2"
    ], "all seven publish on the first frame, in Carbon's order");

    assert.equal(published.find(p => p[0] === "ActivationStrength")[1], 0.4, "the CLAMPED activation strength is what goes out");

    // Carbon re-publishes only on change; a per-frame republish would restart
    // every listener's crossfade every tick.
    published.length = 0;
    ship._PublishControllerVariables(ship.GetPerObjectDataBagOfStuff({}));
    assert.equal(published.length, 0, "an unchanged frame publishes nothing");

    ship.activationStrength = 0.9;
    ship._PublishControllerVariables(ship.GetPerObjectDataBagOfStuff({}));
    assert.deepEqual(published, [ [ "ActivationStrength", 0.9 ] ], "only what changed is republished");
}

/**
 * The beam tint has to land on the effect, and the "already applied" cache must
 * not latch until it has.
 *
 * `Tw2Effect` has SetParameterS, plural. Calling the singular optionally -
 * `effect?.SetParameter?.(name, colour)` - resolved to undefined and did
 * nothing, while the cache still recorded the colour as applied. Measured on
 * ac2_t2a before the fix: the cache held the group blue while DiffuseColor
 * still held the authored orange.
 *
 * The latch is the part that makes it unrecoverable rather than merely wrong -
 * once cached, the equality check short-circuits every later frame.
 */
function testBeamTintReachesTheEffect()
{
    const mesh = new (tw2.GetClass("EveSmartLightMesh"))();
    mesh.shaderParamColorName = "DiffuseColor";

    const applied = [];
    const effect = {
        SetParameters(values) { applied.push(values); return true; }
    };
    mesh.mesh = { IsGood: () => true, display: true, additiveAreas: [ { effect } ] };
    for (const list of [ "transparentAreas", "pickableAreas", "opaqueAreas", "distortionAreas", "depthAreas", "opaquePrepassAreas", "depthNormalAreas" ])
    {
        mesh.mesh[list] = [];
    }

    const colour = Float32Array.from([ 0.032, 0.456, 1, 1 ]);
    mesh.SetMeshColorParameter(colour);

    assert.equal(applied.length, 1, "the tint must reach the area's effect");
    // Float32Array, so compare at float precision rather than literally.
    assert.deepEqual(Array.from(applied[0].DiffuseColor).map(round), [ 0.032, 0.456, 1, 1 ], "under the authored parameter name");

    // An effect that takes nothing must leave the cache alone, so the next
    // frame tries again rather than short-circuiting forever.
    const inert = new (tw2.GetClass("EveSmartLightMesh"))();
    inert.shaderParamColorName = "DiffuseColor";
    inert.mesh = { IsGood: () => true, display: true, additiveAreas: [ { effect: { SetParameters: () => false } } ] };
    for (const list of [ "transparentAreas", "pickableAreas", "opaqueAreas", "distortionAreas", "depthAreas", "opaquePrepassAreas", "depthNormalAreas" ])
    {
        inert.mesh[list] = [];
    }

    const before = Array.from(inert._lastAreaColor);
    inert.SetMeshColorParameter(colour);
    assert.deepEqual(Array.from(inert._lastAreaColor), before, "nothing applied means nothing cached");
}

function round(n)
{
    return Math.round(n * 10000) / 10000;
}

/** A quad with the GL seams stubbed - this test is about float maths, not draws. */
function makeQuad()
{
    const quad = new (tw2.GetClass("EveSmartLightQuad"))();
    quad.effect = {};                 // non-null: BuildQuads returns early without one
    quad._Reserve = function (count)  // no GL context here, so skip the index buffer
    {
        if (count <= this._capacity && this._array) return;
        this._array = new Float32Array(count * 4 * 31);
        this._capacity = count;
    };
    quad._Upload = () => {};
    return quad;
}

function placement({ translation = [ 0, 0, 0 ], scale = [ 1, 1, 1 ] })
{
    return {
        initialTranslation: Float32Array.from(translation),
        additionalTranslation: Float32Array.from([ 0, 0, 0 ]),
        initialRotation: Float32Array.from([ 0, 0, 0, 1 ]),
        additionalRotation: Float32Array.from([ 0, 0, 0, 1 ]),
        initialScale: Float32Array.from(scale),
        additionalScale: Float32Array.from([ 1, 1, 1 ])
    };
}

function slice(array, offset, count)
{
    return Array.from(array.subarray(offset, offset + count));
}

function identity()
{
    return Float32Array.from([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);
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
