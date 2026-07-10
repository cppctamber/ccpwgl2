import { meta } from "utils";
import { vec3, mat4, quat } from "math";
import { Tw2Float } from "core";


// Carbon's private `StretchState` enum (EveStretch3.h:139-145). Not exposed
// to Blue - purely internal bookkeeping for `StartFiring`/`StopFiring`/`Update`.
const STRETCH_STATE_UNDEFINED = 0;
const STRETCH_STATE_STARTING = 1;
const STRETCH_STATE_STARTED = 2;
const STRETCH_STATE_STOPPING = 3;


/**
 * EveStretch3
 *
 * Source: carbonengine trinity/trinity/Eve/Renderable/Stretch/EveStretch3.h/.cpp,
 * the successor of `EveStretch` (see `EveStretch.js`) built on
 * `IEveSpaceObjectChild` components instead of `EveTransform`. Persisted
 * property set from EveStretch3_Blue.cpp's ExposeToBlue(); cross-checked
 * against the format-black schema (`EveStretch3` entry) - all wire types
 * match, no drift found. Unlike `EveStretch`/`EveStretch2`, this class does
 * not implement `ITr2LightOwner` (no light-owning properties either) - it
 * has no `GetLights` hook.
 *
 * NOT PORTED / NOT SUPPORTED:
 *  - `EveChildModifierStretch` (`m_stretchModifier`, EveStretch3.cpp:501-506)
 *    is only a data/transform port in ccpwgl right now. The full Carbon
 *    `EveStretch3` behavior, including verified source/dest modifier binding,
 *    visibility, controller, dynamic-binding and audio integration, is not
 *    supported yet.
 *  - `controllers`/`ITr2ControllerOwner` (EveStretch3.cpp:764-793): no
 *    `ITr2Controller` implementations are wired to anything in ccpwgl beyond
 *    the standalone `Tr2Controller` data class - `SetControllerVariable`,
 *    `HandleControllerEvent`, `StartControllers`, `GetBindingRoots` are not
 *    reproduced.
 *  - `dynamicBindings`/`ITr2DynamicBindingOwner`, `audio`/`stretchAudio`
 *    (`ITr2SoundEmitterOwner`): not wired to anything at this layer.
 *  - `UpdateVisibility`'s frustum-driven visibility toggle and
 *    `GetBoundingSphere`/`GetLocalBoundingBox`/`GetLocalToWorldTransform`/
 *    `RegisterWithQuadRenderer`/`AddQuadsToQuadRenderer` (IEveSpaceObject2
 *    surface area ccpwgl's Stretch ports don't model - `EveStretch.js`
 *    likewise omits these).
 *  - `GetDebugOptions`/`RenderDebugInfo`: not modeled, matching `EveStretch.js`.
 */
@meta.notImplemented
@meta.type("EveStretch3")
@meta.define({
    wgl: "EveStretch3",
    ccp: true
})
export class EveStretch3 extends meta.Model
{

    @meta.string
    name = "";

    // ITr2AudioPtr m_audio (EveStretch3.h:194), EveStretch3_Blue.cpp:165-169
    // (deprecated per Carbon's own doc string). No concrete audio interface
    // type is registered in ccpwgl to reference here.
    @meta.notImplemented
    @meta.struct()
    audio = null;

    // PITr2ControllerVector m_controllers (EveStretch3.h:180),
    // EveStretch3_Blue.cpp:146-150. See class doc (controllers not wired).
    @meta.notImplemented
    @meta.list("Tr2Controller")
    controllers = [];

    // PTriCurveSetVector m_curveSets (EveStretch3.h:176),
    // EveStretch3_Blue.cpp:153-157.
    @meta.list("Tw2CurveSet")
    curveSets = [];

    // ITriVectorFunctionPtr m_dest (EveStretch3.h:165),
    // EveStretch3_Blue.cpp:50-54 (Be::NOTIFY - drives `m_stretchModifier`'s
    // dest binding via `OnModified`, not ported; see class doc).
    @meta.struct()
    dest = null;

    // IEveSpaceObjectChildPtr m_destObject (EveStretch3.h:173),
    // EveStretch3_Blue.cpp:98-108 (attribute+property pair - the property
    // additionally registers/unregisters the object as a component,
    // EveStretch3.cpp:238-250, not ported - no component registry).
    @meta.notOwned
    @meta.struct()
    destObject = null;

    // bool m_display (EveStretch3.h:156), EveStretch3_Blue.cpp:30-36
    // (Be::NOTIFY - triggers `ReRegister()`, not ported).
    @meta.boolean
    display = true;

    // PTr2DynamicBindingVector m_dynamicBindings (EveStretch3.h:181),
    // EveStretch3_Blue.cpp:159-163. See class doc (bindings not wired).
    @meta.notImplemented
    @meta.list("Tr2DynamicBinding")
    dynamicBindings = [];

    // TriFloatPtr m_length (EveStretch3.h:185), EveStretch3_Blue.cpp:68-72.
    // Distance between source and destination, recomputed every `Update`.
    @meta.struct("Tw2Float")
    length = new Tw2Float();

    // IEveSpaceObjectChildPtr m_moveObject (EveStretch3.h:175),
    // EveStretch3_Blue.cpp:122-132. Unstretched object translated between
    // source and destination by `moveProgression`.
    @meta.struct()
    moveObject = null;

    // TriFloatPtr m_moveProgression (EveStretch3.h:186),
    // EveStretch3_Blue.cpp:134-138. 0-1 value determining `moveObject`'s
    // interpolated position between source and dest.
    @meta.struct("Tw2Float")
    moveProgression = new Tw2Float();

    // ITriVectorFunctionPtr m_source (EveStretch3.h:164),
    // EveStretch3_Blue.cpp:44-48 (Be::NOTIFY, see `dest` above).
    @meta.struct()
    source = null;

    // IEveSpaceObjectChildPtr m_sourceObject (EveStretch3.h:172),
    // EveStretch3_Blue.cpp:86-96 (attribute+property pair, see `destObject`).
    @meta.notOwned
    @meta.struct()
    sourceObject = null;

    // IStretchAudioPtr m_stretchAudio (EveStretch3.h:193),
    // EveStretch3_Blue.cpp:171-175. No concrete stretch-audio interface type
    // is registered in ccpwgl to reference here.
    @meta.notImplemented
    @meta.struct()
    stretchAudio = null;

    // IEveSpaceObjectChildPtr m_stretchObject (EveStretch3.h:174),
    // EveStretch3_Blue.cpp:110-120 (attribute+property pair, see
    // `destObject`). Object stretched from source to destination - see class
    // doc for the un-ported `EveChildModifierStretch` gap.
    @meta.struct()
    stretchObject = null;

    // bool m_update (EveStretch3.h:157), EveStretch3_Blue.cpp:38-42.
    @meta.boolean
    update = true;


    /**
     * Runtime endpoint positions, evaluated from `source`/`dest` (or set
     * directly by `SetFiringTransform`) every `Update`. Not persisted -
     * Carbon's `sourcePosition`/`destinationPosition` attributes are
     * `Be::READ`-only (EveStretch3_Blue.cpp:56-66).
     * @private
     */
    _sourcePosition = vec3.create();
    _destinationPosition = vec3.create();

    /**
     * Elapsed time accumulator driving `source.GetValueAt`/`dest.GetValueAt`,
     * matching `EveStretch.js`'s `_time` (Carbon instead threads
     * `updateContext.GetTime()` through directly).
     * @private
     */
    _time = 0;

    /**
     * Firing-transform state - `m_isMuzzleEffect`/`m_sourceMatrix`
     * (EveStretch3.h:188-189), set by `SetFiringTransform`.
     * @private
     */
    _isMuzzleEffect = false;
    _sourceMatrix = mat4.identity(mat4.create());

    /**
     * `m_destObjectScale`(1) (EveStretch3.cpp:30), set by `SetDestObjectScale`.
     * @private
     */
    _destObjectScale = 1;

    /**
     * `m_delay`/`m_stretchState` (EveStretch3.h:139-145,179), set by
     * `StartFiring`/`StopFiring`, consumed by `Update` (controller wiring
     * not reproduced - see class doc).
     * @private
     */
    _delay = 0;
    _stretchState = STRETCH_STATE_UNDEFINED;


    /**
     * Gets this stretch's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.source && this.source.GetResources) this.source.GetResources(out);
        if (this.dest && this.dest.GetResources) this.dest.GetResources(out);
        if (this.sourceObject && this.sourceObject.GetResources) this.sourceObject.GetResources(out);
        if (this.destObject && this.destObject.GetResources) this.destObject.GetResources(out);
        if (this.stretchObject && this.stretchObject.GetResources) this.stretchObject.GetResources(out);
        if (this.moveObject && this.moveObject.GetResources) this.moveObject.GetResources(out);
        return out;
    }

    /**
     * Sets the firing transform
     *
     * Reproduces both of Carbon's overloads as one method (see
     * `EveStretch2.SetFiringTransform` for the JS-has-no-overloads rationale):
     * `SetFiringTransform(Matrix, Vector3)` (EveStretch3.cpp:692-703, "this
     * means the muzzle effect should not be rotated") when `source` has 16
     * elements, otherwise `SetFiringTransform(Vector3, Vector3)`
     * (EveStretch3.cpp:705-715, "we need to calculate the direction to the
     * destination"). Both null out the `source`/`dest` curve-function
     * bindings.
     * @param {mat4|vec3} source
     * @param {vec3} dest
     */
    SetFiringTransform(source, dest)
    {
        this.source = null;
        this.dest = null;

        if (source && source.length === 16)
        {
            this._isMuzzleEffect = true;
            this._sourcePosition[0] = source[12];
            this._sourcePosition[1] = source[13];
            this._sourcePosition[2] = source[14];
            mat4.copy(this._sourceMatrix, source);
        }
        else
        {
            this._isMuzzleEffect = false;
            vec3.copy(this._sourcePosition, source);
            mat4.identity(this._sourceMatrix);
            mat4.setTranslation(this._sourceMatrix, source);
        }

        vec3.copy(this._destinationPosition, dest);
    }

    /**
     * Sets display state
     *
     * Reproduces `EveStretch3::SetDisplay` (EveStretch3.cpp:611-615), minus
     * the `ReRegister()` call (no component registry in ccpwgl).
     * @param {Boolean} display
     */
    SetDisplay(display)
    {
        this.display = !!display;
    }

    /**
     * Sets the destination object's scale
     *
     * Reproduces `EveStretch3::SetDestObjectScale` (EveStretch3.cpp:832-835).
     * @param {Number} scale
     */
    SetDestObjectScale(scale)
    {
        this._destObjectScale = scale;
    }

    /**
     * Intentional no-op
     *
     * Reproduces `EveStretch3::StartMoving` (EveStretch3.cpp:550-552), an
     * empty function in Carbon.
     */
    StartMoving()
    {

    }

    /**
     * Intentional no-op
     *
     * Reproduces `EveStretch3::DisplayEndPoints` (EveStretch3.cpp:717-719),
     * an empty function in Carbon (unlike `EveStretch2`'s real implementation).
     */
    DisplayEndPoints()
    {

    }

    /**
     * Starts the firing effect
     *
     * Reproduces the delay/state bookkeeping half of `EveStretch3::StartFiring`
     * (EveStretch3.cpp:669-679) - the actual controller start
     * (`StartControllers`/`SetControllerVariable`, applied on the next
     * `Update` per Carbon's async-safe design) is not reproduced since no
     * controllers are wired (see class doc). `m_stretchAudio->Start()` is
     * likewise not reproduced (`stretchAudio` is `@meta.notImplemented`).
     * @param {Number} delay
     */
    StartFiring(delay)
    {
        this._delay = delay;
        this._stretchState = STRETCH_STATE_STARTING;
    }

    /**
     * Stops the firing effect
     *
     * Reproduces the state bookkeeping half of `EveStretch3::StopFiring`
     * (EveStretch3.cpp:681-690) - see `StartFiring`.
     */
    StopFiring()
    {
        this._stretchState = STRETCH_STATE_STOPPING;
    }

    /**
     * Gets the longest curve set duration, scaled by each set's time scale
     *
     * Reproduces `EveStretch3::GetCurveDuration` (EveStretch3.cpp:658-667).
     * Carbon additionally takes the max against `RunOnComponentsGetMax`
     * over `sourceObject`/`destObject`/`stretchObject`/`moveObject` - not
     * reproduced, ccpwgl's child objects have no `ITr2CurveSetOwner`
     * equivalent interface.
     * @returns {Number}
     */
    GetCurveDuration()
    {
        let maxDuration = 0;

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (cs) maxDuration = Math.max(maxDuration, cs.GetMaxCurveDuration() / cs.GetTimeScale());
        }

        return maxDuration;
    }

    /**
     * Plays a named curve set
     *
     * Reproduces the local half of `EveStretch3::PlayCurveSet`
     * (EveStretch3.cpp:884-914) - the `RunOnComponents` delegation to child
     * `ITr2CurveSetOwner`s is not reproduced (see `GetCurveDuration`).
     * @param {String} name
     * @param {String} [rangeName]
     */
    PlayCurveSet(name, rangeName)
    {
        if (!this.display) return;

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (!cs || cs.name !== name) continue;

            if (!rangeName)
            {
                cs.ResetTimeRange();
                cs.Play();
            }
            else
            {
                cs.PlayTimeRange(rangeName);
            }
        }
    }

    /**
     * Stops a named curve set
     *
     * Reproduces the local half of `EveStretch3::StopCurveSet`
     * (EveStretch3.cpp:916-938) - see `PlayCurveSet`.
     * @param {String} name
     */
    StopCurveSet(name)
    {
        if (!this.display) return;

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (cs && cs.name === name) cs.Stop();
        }
    }

    /**
     * Forces a named curve set to a specific time
     *
     * Reproduces the local half of `EveStretch3::UpdateCurveSet`
     * (EveStretch3.cpp:940-957) - see `PlayCurveSet`. Carbon calls
     * `TriCurveSet::Update(time, time)` (a two-argument overload); ccpwgl's
     * `Tw2CurveSet` has no matching signature, so `ApplyTime` is used
     * instead - it directly sets `scaledTime` and applies the curves/bindings
     * the same way, without requiring the set to already be playing.
     * @param {String} name
     * @param {Number} time
     */
    UpdateCurveSet(name, time)
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (cs && cs.name === name) cs.ApplyTime(time);
        }
    }

    /**
     * Gets a named curve set's max duration
     *
     * Reproduces the local half of `EveStretch3::GetCurveSetDuration`
     * (EveStretch3.cpp:959-984) - see `PlayCurveSet`.
     * @param {String} name
     * @returns {Number}
     */
    GetCurveSetDuration(name)
    {
        if (!this.display) return 0;

        let maxDuration = 0;

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (cs && cs.name === name) maxDuration = Math.max(maxDuration, cs.GetMaxCurveDuration());
        }

        return maxDuration;
    }

    /**
     * Gets a named curve set's named time range duration
     *
     * Reproduces the local half of `EveStretch3::GetRangeDuration`
     * (EveStretch3.cpp:986-1012) - see `PlayCurveSet`.
     * @param {String} name
     * @param {String} rangeName
     * @returns {Number}
     */
    GetRangeDuration(name, rangeName)
    {
        if (!this.display) return 0;

        let maxDuration = 0;

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (cs && cs.name === name) maxDuration = Math.max(maxDuration, cs.GetRangeDuration(rangeName));
        }

        return maxDuration;
    }

    /**
     * Per frame update
     *
     * Merges the portable state half of `EveStretch3::UpdateSyncronous`
     * (EveStretch3.cpp:379-459) and `UpdateAsyncronous`
     * (EveStretch3.cpp:461-538) into a single `dt`-based update, matching
     * `EveStretch.js`'s convention (Carbon's sync/async split isn't
     * reproduced by ccpwgl's Stretch ports). Not reproduced: dynamic
     * bindings/controller updates (EveStretch3.cpp:403-410), and the audio
     * position pushes (`m_audio`/`m_stretchAudio`, both `@meta.notImplemented`).
     * @param {Number} dt
     */
    Update(dt)
    {
        if (!this.update) return;

        // EveStretch3.cpp:388-399 - state transition bookkeeping only; the
        // controller start/stop calls they gate are not reproduced (see
        // `StartFiring`/`StopFiring`).
        if (this._stretchState === STRETCH_STATE_STARTING)
        {
            this._stretchState = STRETCH_STATE_STARTED;
        }
        else if (this._stretchState === STRETCH_STATE_STOPPING)
        {
            this._stretchState = STRETCH_STATE_UNDEFINED;
        }

        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].UpdateDelta(dt);
        }

        this._time += dt;

        if (this.source) this.source.GetValueAt(this._time, this._sourcePosition);
        if (this.dest) this.dest.GetValueAt(this._time, this._destinationPosition);

        // Carbon: directionVec = sourcePosition - destinationPosition
        // (EveStretch3.cpp:423, also :485) - note the operand order is the
        // opposite of EveStretch.js's dest-source; length is order
        // independent but the sign matters for the forward-facing rotation
        // computed in UpdateViewDependentData below.
        const directionVec = vec3.subtract(EveStretch3.global.vec3_0, this._sourcePosition, this._destinationPosition);
        this.length.value = vec3.length(directionVec);

        if (this.sourceObject && this.sourceObject.Update) this.sourceObject.Update(dt);
        if (this.destObject && this.destObject.Update) this.destObject.Update(dt);
        if (this.stretchObject && this.stretchObject.Update) this.stretchObject.Update(dt);
        if (this.moveObject && this.moveObject.Update) this.moveObject.Update(dt);
    }

    /**
     * Updates view dependent data
     *
     * Reproduces the transform-construction portion of
     * `EveStretch3::UpdateVisibility` (EveStretch3.cpp:554-594, minus the
     * frustum-driven visibility toggle - not reproduced, see class doc),
     * matching `EveStretch.js`/`EveStretch2.js`'s `UpdateViewDependentData`
     * call-site convention. The source-facing rotation is computed via
     * `QuaternionArcFromForward`, reproducing Carbon's
     * `TriQuaternionArcFromForward` (trinity/trinity/TriMath.cpp:341-356) -
     * a closed-form "shortest arc" rotation from local -Z to the (normalized)
     * source->destination direction.
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        if (!this.display) return;

        const g = EveStretch3.global;

        const directionVec = vec3.normalize(g.vec3_0,
            vec3.subtract(g.vec3_0, this._sourcePosition, this._destinationPosition));

        const rotation = EveStretch3.QuaternionArcFromForward(g.quat_0, directionVec);
        const rotationMatrix = mat4.fromQuat(g.mat4_0, rotation);

        if (this.sourceObject && this.sourceObject.UpdateViewDependentData)
        {
            let sourceMatrix;
            if (this._isMuzzleEffect)
            {
                sourceMatrix = this._sourceMatrix;
            }
            else
            {
                sourceMatrix = mat4.copy(g.mat4_1, rotationMatrix);
                mat4.setTranslation(sourceMatrix, this._sourcePosition);
            }
            this.sourceObject.UpdateViewDependentData(sourceMatrix);
        }

        if (this.stretchObject && this.stretchObject.UpdateViewDependentData)
        {
            // SIMPLIFICATION: `EveChildModifierStretch` isn't ported (see
            // class doc) - reproduces Carbon's own fallback path when no
            // modifier is bound (EveStretch3.cpp:508): a plain translation to
            // the source position, no scaling/orientation towards dest.
            const stretchMatrix = mat4.identity(g.mat4_2);
            mat4.setTranslation(stretchMatrix, this._sourcePosition);
            this.stretchObject.UpdateViewDependentData(stretchMatrix);
        }

        if (this.moveObject && this.moveObject.UpdateViewDependentData)
        {
            const movedPosition = vec3.lerp(g.vec3_1, this._sourcePosition, this._destinationPosition, this.moveProgression.value);
            const moveMatrix = mat4.copy(g.mat4_3, rotationMatrix);
            mat4.setTranslation(moveMatrix, movedPosition);
            this.moveObject.UpdateViewDependentData(moveMatrix);
        }

        if (this.destObject && this.destObject.UpdateViewDependentData)
        {
            // Reproduces the linear part of EveStretch3.cpp:523-526's
            // `ScalingMatrix(1,1,1)*destObjectScale * oneEighty * rotationMatrix`
            // chain (row-vector composition) algebraically: composing the
            // three linear maps (scale by s, flip diag(-1,1,-1), then rotate
            // by R) and evaluating on each basis vector gives
            // destCol_x=-s*Rx, destCol_y=s*Ry, destCol_z=-s*Rz, where
            // Rx/Ry/Rz are `rotationMatrix`'s basis columns and
            // s=`_destObjectScale`. UNVERIFIED against a live carbon
            // reference render - worth a sanity check.
            const s = this._destObjectScale;
            const destMatrix = mat4.identity(g.mat4_4);
            destMatrix[0] = -s * rotationMatrix[0]; destMatrix[1] = -s * rotationMatrix[1]; destMatrix[2] = -s * rotationMatrix[2];
            destMatrix[4] = s * rotationMatrix[4]; destMatrix[5] = s * rotationMatrix[5]; destMatrix[6] = s * rotationMatrix[6];
            destMatrix[8] = -s * rotationMatrix[8]; destMatrix[9] = -s * rotationMatrix[9]; destMatrix[10] = -s * rotationMatrix[10];
            mat4.setTranslation(destMatrix, this._destinationPosition);
            this.destObject.UpdateViewDependentData(destMatrix);
        }
    }

    /**
     * Computes the "shortest arc" rotation quaternion from local -Z to a
     * (normalized) direction vector
     *
     * Ported from `TriQuaternionArcFromForward`
     * (carbonengine trinity/trinity/TriMath.cpp:341-356). Faithfully
     * reproduces Carbon's degenerate-case handling: when `v.z >= 0.99999`
     * (`v` antipodal to local forward -Z) it returns a fixed 180 degree
     * rotation about +X rather than an arbitrary-axis fallback.
     * @param {quat} out
     * @param {vec3} v normalized direction
     * @returns {quat} out
     */
    static QuaternionArcFromForward(out, v)
    {
        if (v[2] < 0.99999)
        {
            const tz = Math.sqrt(1 - v[2]);
            const div = 0.707106781187 / tz;
            out[0] = v[1] * div;
            out[1] = -v[0] * div;
            out[2] = 0;
            out[3] = 0.707106781187 * tz;
            return out;
        }

        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        return out;
    }

    /**
     * Initializes class global and scratch variables
     */
    static init()
    {
        if (!EveStretch3.global)
        {
            EveStretch3.global = {
                vec3_0: vec3.create(),
                vec3_1: vec3.create(),
                mat4_0: mat4.create(),
                mat4_1: mat4.create(),
                mat4_2: mat4.create(),
                mat4_3: mat4.create(),
                mat4_4: mat4.create(),
                quat_0: quat.create()
            };
        }
    }

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = null;

    /**
     * Constructor
     */
    constructor()
    {
        super();
        EveStretch3.init();
    }

}
