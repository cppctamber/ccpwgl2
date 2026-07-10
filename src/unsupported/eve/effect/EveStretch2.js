import { meta } from "utils";
import { vec3, mat4 } from "math";


/**
 * EveStretch2
 *
 * Source: carbonengine trinity/trinity/Eve/Renderable/Stretch/EveStretch2.h/.cpp
 * ("EveStretch2 is a simplified version of EveStretch. Renders an effect
 * between two points as a set of quads.", EveStretch2.h:20-24). Persisted
 * property set from EveStretch2_Blue.cpp's ExposeToBlue(); cross-checked
 * against the format-black schema (`EveStretch2` entry) - all wire types
 * match, no drift found.
 *
 * Unlike `EveStretch`/`EveStretch3`, this class has no `source`/`dest`
 * curve-function properties - the endpoints are plain runtime vectors set
 * via `SetFiringTransform` (EveStretch2.cpp:170-180), and no `stretchObject`
 * child - the "stretch" itself is a shared procedural quad strip rendered
 * with `effect`, generated once for up to `MAX_QUAD_COUNT` (128) quads
 * (EveStretch2.cpp:57-72) and drawn with `quadCount * 6` indices
 * (EveStretch2.cpp:339-359).
 *
 * NOT PORTED (rendering/geometry infrastructure ccpwgl does not have yet):
 *  - `OnPrepareResources`/`ReleaseResources` (EveStretch2.cpp:371-387): builds
 *    a `{quadIndex, cornerIndex}` vertex declaration/buffer and reserves a
 *    shared quad-list index buffer from `Tr2Renderer`. ccpwgl has no
 *    procedural-buffer allocator or shared quad-list index buffer.
 *  - `GetPerObjectData`/`GetBatches` (EveStretch2.cpp:327-359): packs
 *    `m_source`/`m_destination`/`m_effectData` into a per-object constant
 *    buffer and issues an instanced indexed draw through
 *    `ITriRenderBatchAccumulator`. ccpwgl has no equivalent constant-buffer
 *    marshalling or batch-accumulator path for this class yet.
 *  - `UpdateVisibility`/`GetRenderables` (EveStretch2.cpp:303-324): frustum
 *    culls a bounding box built from `m_boundingRadius`/endpoint distance.
 *    No frustum is threaded through to this layer.
 *  - `RegisterComponents` (EveStretch2.cpp:389-398): registers this object as
 *    an `ITr2LightOwner` component when it owns a light and is active.
 *    ccpwgl has no component registry; see `GetLights` below for the
 *    additive-hook equivalent (matching `EveStretch.GetLights`).
 *  - `GetDebugOptions`/`RenderDebugInfo` (EveStretch2.cpp:420-435): not
 *    modeled anywhere in ccpwgl's Stretch ports (see `EveStretch.js`, which
 *    likewise does not implement these despite `EveStretch.h` declaring
 *    them).
 */
@meta.notImplemented
@meta.type("EveStretch2")
@meta.define({
    wgl: "EveStretch2",
    ccp: true
})
export class EveStretch2 extends meta.Model
{

    @meta.string
    name = "";

    // float, default 100 (EveStretch2.h:116, ctor default EveStretch2.cpp:87).
    // Radius of the bounding cylinder used for frustum culling
    // (EveStretch2_Blue.cpp:83-87) - not consumed since UpdateVisibility/
    // frustum culling isn't ported (see class doc).
    @meta.notImplemented
    @meta.float
    boundingRadius = 100;

    // Tr2GpuSharedEmitterPtr m_destinationEmitter (EveStretch2.h:96),
    // EveStretch2_Blue.cpp:68-72. GPU particle emitter at the destination -
    // ccpwgl's `Tr2GpuSharedEmitter` is itself `@meta.notImplemented`.
    @meta.notOwned
    @meta.struct("Tr2GpuSharedEmitter")
    destinationEmitter = null;

    // Tr2PointLightPtr m_destinationLight (EveStretch2.h:94),
    // EveStretch2_Blue.cpp:58-62.
    @meta.notOwned
    @meta.struct("Tr2PointLight")
    destinationLight = null;

    // TriObserverLocalPtr m_destinationObserver (EveStretch2.h:99),
    // EveStretch2_Blue.cpp:78-82. Observer at the destination position -
    // ccpwgl's `TriObserverLocal` is itself `@meta.notImplemented` (has no
    // `Update` method to drive from this class's `Update`).
    @meta.notOwned
    @meta.struct("TriObserverLocal")
    destinationObserver = null;

    @meta.struct("Tw2Effect")
    effect = null;

    // TriCurveSetPtr m_end (EveStretch2.h:91), EveStretch2_Blue.cpp:48-52.
    // Curve set played when the effect stops (see `StopFiring`).
    @meta.struct("Tw2CurveSet")
    end = null;

    // TriCurveSetPtr m_loop (EveStretch2.h:90), EveStretch2_Blue.cpp:43-47.
    // Curve set that is played while the effect is active.
    @meta.struct("Tw2CurveSet")
    loop = null;

    // uint32_t m_quadCount (EveStretch2.h:111), EveStretch2_Blue.cpp:32-36
    // (Be::NOTIFY - `OnModified` reallocates buffers on change, not ported
    // since buffer allocation isn't ported; see class doc). Carbon asserts
    // `m_quadCount <= MAX_QUAD_COUNT` (128) (EveStretch2.cpp:104-109).
    @meta.uint
    quadCount = 0;

    // Tr2GpuSharedEmitterPtr m_sourceEmitter (EveStretch2.h:95),
    // EveStretch2_Blue.cpp:63-67.
    @meta.notOwned
    @meta.struct("Tr2GpuSharedEmitter")
    sourceEmitter = null;

    // Tr2PointLightPtr m_sourceLight (EveStretch2.h:93),
    // EveStretch2_Blue.cpp:53-57.
    @meta.notOwned
    @meta.struct("Tr2PointLight")
    sourceLight = null;

    // TriObserverLocalPtr m_sourceObserver (EveStretch2.h:98),
    // EveStretch2_Blue.cpp:73-77.
    @meta.notOwned
    @meta.struct("TriObserverLocal")
    sourceObserver = null;

    // TriCurveSetPtr m_start (EveStretch2.h:89), EveStretch2_Blue.cpp:38-42.
    // Curve set played when the firing effect starts.
    @meta.struct("Tw2CurveSet")
    start = null;


    /**
     * Runtime endpoint positions, set by `SetFiringTransform`
     * (EveStretch2.cpp:170-180). Not persisted (no `ExposeToBlue` entry).
     * @private
     */
    _source = vec3.create();
    _destination = vec3.create();

    /**
     * Runtime endpoint world transforms, rebuilt every `Update` by
     * `GetEndPointTransforms` (EveStretch2.cpp:271-301).
     * @private
     */
    _sourceTransform = mat4.identity(mat4.create());
    _destinationTransform = mat4.identity(mat4.create());

    /**
     * Visibility/intensity gates - `m_visible`(true)/`m_intensity`(1)
     * (EveStretch2.cpp:81,86), set via `SetDisplay`/`SetIntensity`.
     * @private
     */
    _visible = true;
    _intensity = 1;

    /**
     * Destination endpoint scale - `m_destinationScale`(1)/
     * `m_currentDestinationScale`(1) (EveStretch2.cpp:79-80), set via
     * `SetDestObjectScale`/`DisplayEndPoints`.
     * @private
     */
    _destinationScale = 1;
    _currentDestinationScale = 1;

    /**
     * Per-object shader constant data - `m_effectData[2]` (EveStretch2.h:109).
     * `_effectData0` = (start.scaledTime, loop.scaledTime, end.scaledTime,
     * random seed set by `StartFiring`); `_effectData1.x` = `_intensity`
     * (EveStretch2.cpp:332). Computed each `Update`/`StartFiring` for parity,
     * but nothing consumes it yet since `GetPerObjectData` isn't ported
     * (see class doc).
     * @private
     */
    _effectData0 = vec3.fromValues(0, 0, 0);
    _effectData0RandomSeed = 0;
    _effectData1X = 1;


    /**
     * Constructor
     */
    constructor()
    {
        super();
        EveStretch2.init();
    }

    /**
     * Gets this stretch's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.effect && this.effect.GetResources)
        {
            this.effect.GetResources(out);
        }

        if (this.sourceLight && this.sourceLight.GetResources)
        {
            this.sourceLight.GetResources(out);
        }

        if (this.destinationLight && this.destinationLight.GetResources)
        {
            this.destinationLight.GetResources(out);
        }

        if (this.sourceEmitter && this.sourceEmitter.GetResources)
        {
            this.sourceEmitter.GetResources(out);
        }

        if (this.destinationEmitter && this.destinationEmitter.GetResources)
        {
            this.destinationEmitter.GetResources(out);
        }

        return out;
    }

    /**
     * Sets the firing transform
     *
     * Reproduces both of Carbon's overloads (EveStretch2.cpp:170-180) as one
     * method - JS has no overload resolution, so `source` is treated as a
     * `mat4` (its translation is used, matching the `Matrix` overload) when
     * it has 16 elements, otherwise as a plain `vec3` position.
     * @param {mat4|vec3} source
     * @param {vec3} dest
     */
    SetFiringTransform(source, dest)
    {
        if (source && source.length === 16)
        {
            this._source[0] = source[12];
            this._source[1] = source[13];
            this._source[2] = source[14];
        }
        else
        {
            vec3.copy(this._source, source);
        }

        vec3.copy(this._destination, dest);
    }

    /**
     * Sets display state
     *
     * Reproduces `EveStretch2::SetDisplay` (EveStretch2.cpp:187-195), minus
     * the `ReRegister()` call (no component registry in ccpwgl).
     * @param {Boolean} display
     */
    SetDisplay(display)
    {
        this._visible = !!display;
    }

    /**
     * Sets the effect's overall intensity
     *
     * Reproduces `EveStretch2::SetIntensity` (EveStretch2.cpp:197-206), minus
     * the `ReRegister()` call (no component registry in ccpwgl).
     * @param {Number} intensity
     */
    SetIntensity(intensity)
    {
        this._intensity = intensity;
    }

    /**
     * Toggles display of the destination endpoint
     *
     * Reproduces `EveStretch2::DisplayEndPoints` (EveStretch2.cpp:182-185).
     * Note `displaySource` is unused here too - it is unused in the Carbon
     * source as well (only `displayDest` has any effect).
     * @param {Boolean} displaySource unused (matches Carbon)
     * @param {Boolean} displayDest
     */
    DisplayEndPoints(displaySource, displayDest)
    {
        this._currentDestinationScale = displayDest ? this._destinationScale : 0;
    }

    /**
     * Sets the destination object's scale
     *
     * Reproduces `EveStretch2::SetDestObjectScale` (EveStretch2.cpp:113-117).
     * @param {Number} scale
     */
    SetDestObjectScale(scale)
    {
        this._destinationScale = scale;
        this._currentDestinationScale = scale;
    }

    /**
     * Intentional no-op
     *
     * Reproduces `EveStretch2::StartMoving` (EveStretch2.cpp:119-121), which
     * is an empty function in Carbon (EveStretch2 has no move object).
     */
    StartMoving()
    {

    }

    /**
     * Gets the longest duration of the start/loop curve sets
     *
     * Reproduces `EveStretch2::GetCurveDuration` (EveStretch2.cpp:123-135).
     * @returns {Number}
     */
    GetCurveDuration()
    {
        let duration = 0;

        if (this.start)
        {
            duration = Math.max(duration, this.start.GetMaxCurveDuration());
        }

        if (this.loop)
        {
            duration = Math.max(duration, this.loop.GetMaxCurveDuration());
        }

        return duration;
    }

    /**
     * Starts the firing effect
     *
     * Reproduces `EveStretch2::StartFiring` (EveStretch2.cpp:137-152).
     * @param {Number} delay
     */
    StartFiring(delay)
    {
        this._effectData0RandomSeed = Math.random();

        if (this.start) this.start.PlayFrom(-delay);
        if (this.loop) this.loop.PlayFrom(-delay);
        if (this.end) this.end.Stop();
    }

    /**
     * Stops the firing effect
     *
     * Reproduces `EveStretch2::StopFiring` (EveStretch2.cpp:154-168).
     */
    StopFiring()
    {
        if (this.start) this.start.Stop();
        if (this.loop) this.loop.Stop();
        if (this.end) this.end.Play();
    }

    /**
     * Computes the source/destination world transforms from the current
     * endpoint positions
     *
     * Reproduces `EveStretch2::GetEndPointTransforms` (EveStretch2.cpp:271-301):
     * picks the world axis least aligned with the source->destination
     * direction as a seed "up" vector, builds an orthonormal basis from it
     * (Carbon's `X = normalize(cross(up, Z))`, `Y = cross(X, Z)`, with
     * `Z = normalize(direction)`), then derives the destination transform by
     * negating the X/Z basis vectors (a 180 degree turn about Y) so the
     * destination endpoint faces back towards the source.
     * @param {mat4} sourceOut
     * @param {mat4} destOut
     */
    GetEndPointTransforms(sourceOut, destOut)
    {
        const g = EveStretch2.global;

        const direction = vec3.subtract(g.vec3_0, this._destination, this._source);
        const ax = Math.abs(direction[0]), ay = Math.abs(direction[1]), az = Math.abs(direction[2]);

        const up = vec3.set(g.vec3_1, 0, 0, 0);
        if (ax < ay && ax < az) up[0] = 1;
        else if (ay < ax && ay < az) up[1] = 1;
        else up[2] = 1;

        vec3.normalize(direction, direction);

        const right = vec3.normalize(g.vec3_2, vec3.cross(g.vec3_2, up, direction));
        const orthoUp = vec3.cross(g.vec3_3, right, direction);

        mat4.identity(sourceOut);
        sourceOut[0] = right[0]; sourceOut[1] = right[1]; sourceOut[2] = right[2];
        sourceOut[4] = orthoUp[0]; sourceOut[5] = orthoUp[1]; sourceOut[6] = orthoUp[2];
        sourceOut[8] = direction[0]; sourceOut[9] = direction[1]; sourceOut[10] = direction[2];
        mat4.setTranslation(sourceOut, this._source);

        mat4.copy(destOut, sourceOut);
        destOut[0] = -right[0]; destOut[1] = -right[1]; destOut[2] = -right[2];
        destOut[8] = -direction[0]; destOut[9] = -direction[1]; destOut[10] = -direction[2];
        mat4.setTranslation(destOut, this._destination);
    }

    /**
     * Per frame update
     *
     * Reproduces the portable half of `EveStretch2::Update` (EveStretch2.cpp:218-269):
     * advances the start/loop/end curve sets and rebuilds the endpoint
     * transforms. Not reproduced: pushing `updateContext`-derived time into
     * `sourceObserver`/`destinationObserver` (`TriObserverLocal` has no
     * `Update` method ported yet) or `sourceEmitter`/`destinationEmitter`
     * (`Tr2GpuSharedEmitter.Update()` takes no arguments in ccpwgl and does
     * nothing - the GPU particle system isn't wired to this layer).
     * @param {Number} dt
     */
    Update(dt)
    {
        this._effectData0[0] = this._effectData0[1] = this._effectData0[2] = 0;

        if (this.start)
        {
            this.start.UpdateDelta(dt);
            this._effectData0[0] = this.start.scaledTime;
        }

        if (this.loop)
        {
            this.loop.UpdateDelta(dt);
            this._effectData0[1] = this.loop.scaledTime;
        }

        if (this.end)
        {
            this.end.UpdateDelta(dt);
            this._effectData0[2] = this.end.scaledTime;
        }

        this.GetEndPointTransforms(this._sourceTransform, this._destinationTransform);
    }

    /**
     * Collects this stretch's `sourceLight`/`destinationLight` into a
     * CewgLightCollector
     *
     * Reproduces `EveStretch2::GetLights` (EveStretch2.cpp:400-418): skipped
     * when not visible/zero intensity or when neither light is set; the
     * source light is added at full scale, the destination light at
     * `_currentDestinationScale` (matching `AddLight(lightManager,
     * m_sourceTransform, 1.0f)` / `AddLight(lightManager,
     * m_destinationTransform, m_currentDestinationScale)`). Additive hook,
     * matching `EveStretch.GetLights` - not called by any per-frame code yet
     * (the render-loop/EveSpaceScene call site is separate scene-wiring
     * work).
     * @param {CewgLightCollector} collector
     * @param {object} [parentContext]
     * @param {number} [parentContext.dt=0] forwarded to `light.Update`
     * @param {Array} [parentContext.bones=null] forwarded to `light.Update`
     * @param {number} [parentContext.parentBrightness=1] forwarded to `light.GetCewgLightData`
     */
    GetLights(collector, parentContext = {})
    {
        if (!collector || !this._visible || this._intensity === 0) return;
        if (!this.sourceLight && !this.destinationLight) return;

        const dt = parentContext.dt || 0;
        const bones = parentContext.bones || null;
        const parentBrightness = parentContext.parentBrightness !== undefined ? parentContext.parentBrightness : 1;

        if (this.sourceLight && typeof this.sourceLight.Update === "function" && typeof this.sourceLight.GetCewgLightData === "function")
        {
            this.sourceLight.Update(dt, this._sourceTransform, bones);
            collector.Collect([ this.sourceLight.GetCewgLightData({ parentBrightness, parentScale: 1 }) ]);
        }

        if (this.destinationLight && typeof this.destinationLight.Update === "function" && typeof this.destinationLight.GetCewgLightData === "function")
        {
            this.destinationLight.Update(dt, this._destinationTransform, bones);
            collector.Collect([ this.destinationLight.GetCewgLightData({ parentBrightness, parentScale: this._currentDestinationScale }) ]);
        }
    }

    /**
     * Initializes class global and scratch variables
     */
    static init()
    {
        if (!EveStretch2.global)
        {
            EveStretch2.global = {
                vec3_0: vec3.create(),
                vec3_1: vec3.create(),
                vec3_2: vec3.create(),
                vec3_3: vec3.create()
            };
        }
    }

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = null;

}
