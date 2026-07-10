import { EveChild } from "./EveChild";
import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { EveChildInheritProperties } from "unsupported/eve/child/EveChildInheritProperties";
import { GetAverageAxisScale } from "unsupported/core/lighting/CewgLightMath";


@meta.type("EveChildContainer", true)
@meta.define({
    wgl: "EveChildContainer",
    ccp: true
})
@meta.stage(2)
export class EveChildContainer extends EveChild
{

    @meta.string
    name = "";

    @meta.notImplemented
    @meta.boolean
    alwaysOn = false;

    @meta.int32
    boneIndex = -1;

    @meta.list("Tr2Controller")
    controllers = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.boolean
    display = true;

    @meta.notImplemented
    @meta.int32
    displayFilter = -1;

    @meta.notImplemented
    @meta.list()
    fxAttributes = [];

    @meta.notImplemented
    @meta.boolean
    hideOnLowQuality = false;

    @meta.notImplemented
    @meta.struct("EveChildInheritProperties")
    inheritProperties = null;

    @meta.notImplemented
    @meta.list("Tr2PointLight")
    lights = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.list("EveChild")
    objects = [];

    @meta.notImplemented
    @meta.list("TriObserverLocal")
    observers = [];

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.notImplemented
    @meta.boolean
    staticTransform = false;

    @meta.boolean
    useStaticRotation = false;

    @meta.boolean
    useStaticScale = false;

    @meta.notImplemented
    @meta.list("EveChildModifier")
    transformModifiers = [];

    @meta.vector3
    translation = vec3.create();

    @meta.boolean
    useSRT = true;

    _hasBone = false;
    _boneTransform = null;
    _worldTransform = mat4.create();
    //_worldTransformLast = mat4.create();
    _controllersLinked = false;

    /**
     * The top-level space object this container ultimately hangs off (e.g. the `EveShip2`),
     * recorded each `Update` from the `parentSpaceObject` argument threaded down by the caller.
     * Backs this container's own `ShipSpeed()`/`ShipMaxSpeed()` delegation below: controllers
     * attached directly to an effect-child container get `owner = this container`
     * (`Initialize()` below), not the ship, so the container must forward those builtin lookups
     * itself. Carbon parity: `EveChildContainer` stores `spaceObjectParent` and child containers
     * inherit the parent object's velocity (`EveChildContainer.cpp:603,1012`).
     * @type {?EveShip2}
     */
    _parentSpaceObject = null;

    /**
     * Links this container's controllers with the container as their owner, mirroring
     * CarbonEngine's EveChildContainer::Initialize (controller->Link(*GetRawRoot())).
     * The owner exposes GetRangeDuration/GetCurveSetDuration so expression terms like
     * CurveSetTime("Set/Range") resolve against this container's own curve sets.
     * Idempotent: only links controllers that aren't already linked.
     */
    Initialize()
    {
        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (!controller) continue;
            const linked = controller.IsLinked ? controller.IsLinked() : false;
            if (!linked && controller.Initialize)
            {
                controller.Initialize(this);
            }
        }
        this._controllersLinked = true;
    }

    /**
     * Total duration of the longest range with the given name across curve sets named `setName`,
     * recursing into child curve-set owners. Port of EveChildContainer::GetRangeDuration.
     * @param {String} setName
     * @param {String} rangeName
     * @returns {Number} seconds
     */
    GetRangeDuration(setName, rangeName)
    {
        let duration = 0;

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (cs && cs.name === setName && cs.GetRangeDuration)
            {
                duration = Math.max(duration, cs.GetRangeDuration(rangeName));
            }
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            const child = this.objects[i];
            if (child && child.GetRangeDuration)
            {
                duration = Math.max(duration, child.GetRangeDuration(setName, rangeName));
            }
        }

        return duration;
    }

    /**
     * Longest curve duration across curve sets named `setName`, recursing into child
     * curve-set owners. Port of EveChildContainer::GetCurveSetDuration.
     * @param {String} setName
     * @returns {Number} seconds
     */
    GetCurveSetDuration(setName)
    {
        let duration = 0;

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const cs = this.curveSets[i];
            if (cs && cs.name === setName && cs.GetMaxCurveDuration)
            {
                duration = Math.max(duration, cs.GetMaxCurveDuration());
            }
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            const child = this.objects[i];
            if (child && child.GetCurveSetDuration)
            {
                duration = Math.max(duration, child.GetCurveSetDuration(setName));
            }
        }

        return duration;
    }

    /**
     * Backs the `ShipSpeed()` controller-expression builtin for controllers whose owner is this
     * container (`context.owner.ShipSpeed()`,
     * `unsupported/state/expression/Tr2ExpressionProgram.js:701,779-781`), by delegating to the
     * parent space object recorded in `Update` (see `_parentSpaceObject`).
     * @returns {Number}
     */
    ShipSpeed()
    {
        return this._parentSpaceObject && this._parentSpaceObject.ShipSpeed ? this._parentSpaceObject.ShipSpeed() : 0;
    }

    /**
     * Backs the `ShipMaxSpeed()` controller-expression builtin, delegated the same way as
     * `ShipSpeed()` above.
     * @returns {Number}
     */
    ShipMaxSpeed()
    {
        return this._parentSpaceObject && this._parentSpaceObject.ShipMaxSpeed ? this._parentSpaceObject.ShipMaxSpeed() : 1;
    }

    /**
     * Resets lod
     */
    ResetLod()
    {
        this._lod = 3;

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].ResetLod();
        }
    }

    /**
     * Updates lod
     * @param {Tw2Frustum} frustum
     * @param {Number} parentLod
     */
    UpdateLod(frustum, parentLod)
    {
        this._lod = parentLod;

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].UpdateLod(frustum, this._lod);
        }
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].GetResources(out);
        }
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} perObjectData
     * @param {?EveShip2} [parentSpaceObject] - top-level space object, threaded down so nested
     *  containers' controllers can resolve ShipSpeed()/ShipMaxSpeed() (see `_parentSpaceObject`)
     */
    Update(dt, parentTransform, perObjectData, parentSpaceObject)
    {
        this._parentSpaceObject = parentSpaceObject || null;

        if (this.useSRT)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        // The object or a modifier can set a bone
        this._hasBone = false;

        // Get bone transform
        // This may be unnecessary if there is a bone modifier
        if (this.boneIndex > -1)
        {
            const
                bones = EveChild.GetJointMatrices(perObjectData),
                offset = this.boneIndex;

            if (bones && (bones[offset] || bones[offset + 4] || bones[offset + 8]))
            {
                if (!this._boneTransform) this._boneTransform = mat4.create();
                mat4.fromJointMatIndex(this._boneTransform, bones, offset);
                this._hasBone = true;
            }
        }

        // TODO: Figure out how this should work

        let updatedWorld = false;
        if (this.transformModifiers.length)
        {
            for (let i = 0; i < this.transformModifiers.length; i++)
            {
                if ("ApplyTransform" in this.transformModifiers[i])
                {
                    this.transformModifiers[i].ApplyTransform(this.localTransform);
                }
                else if ("Modify" in this.transformModifiers[i])
                {
                    if (this.transformModifiers[i].Modify(this, perObjectData, parentTransform))
                    {
                        updatedWorld = true;
                    }
                }
            }
        }

        if (!this._hasBone)
        {
            this._boneTransform = null;
        }

        if (!updatedWorld)
        {
            if (this._hasBone)
            {
                mat4.multiply(this._worldTransform, this._boneTransform, this.localTransform);
                mat4.multiply(this._worldTransform, parentTransform, this._worldTransform);
            }
            else
            {

                mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
            }
        }

        if (this.controllers.length)
        {
            // Effect-child controllers arrive via deserialization rather than an AddController
            // call, so link them (owner = this container) on first tick before updating.
            if (!this._controllersLinked) this.Initialize();

            for (let i = 0; i < this.controllers.length; i++)
            {
                this.controllers[i].Update(dt);
            }
        }

        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].UpdateDelta(dt);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            // Forward the same top-level parentSpaceObject (not `this`) so deeply nested
            // containers still resolve ShipSpeed() against the ship, not an intermediate container.
            this.objects[i].Update(dt, this._worldTransform, perObjectData, parentSpaceObject);
        }

        /*
        for (let i = 0; i < this.lights.length; i++)
        {
            this.lights[i].Update(dt, this._worldTransform, perObjectData);
        }
        */
    }

    /**
     * Collects this container's owned lights into a CewgLightCollector
     *
     * Additive hook: not called by any per-frame code yet (the render-loop /
     * EveSpaceScene call site is separate scene-wiring work). For each
     * populated light (i.e. one with the CEWG light API added in
     * src/unsupported/core/lighting - `Update`/`GetCewgLightData`), updates
     * its world position against this container's own `_worldTransform`
     * (computed each `Update()`, see above) and collects its
     * `GetCewgLightData` row. Plain deserialized lights that predate that
     * API (missing `Update`/`GetCewgLightData`) are skipped silently, so
     * populated and un-populated lights can coexist in `this.lights`.
     *
     * Recurses into `this.objects`: light owners can sit at any depth
     * (`container.objects[].objects[]...lights`), and the scene-side walk
     * (`EveObject.GetLights`) only descends `effectChildren`, so nested
     * containers would otherwise never be visited. Each child's own
     * `_worldTransform` was refreshed by this container's `Update()` (which
     * updates `this.objects`), so recursion only needs to forward the collect.
     * @param {CewgLightCollector} collector
     * @param {object} [parentContext]
     * @param {number} [parentContext.dt=0] forwarded to `light.Update` - 0 until scene wiring threads a real per-frame delta through
     * @param {Array} [parentContext.bones=null] forwarded to `light.Update` - null until scene wiring threads real bone matrices through
     * @param {number} [parentContext.parentBrightness=1] forwarded to `light.GetCewgLightData`
     */
    GetLights(collector, parentContext = {})
    {
        if (!collector) return;

        const dt = parentContext.dt || 0;
        const bones = parentContext.bones || null;
        const parentBrightness = parentContext.parentBrightness !== undefined ? parentContext.parentBrightness : 1;
        const parentScale = GetAverageAxisScale(this._worldTransform);

        for (let i = 0; i < this.lights.length; i++)
        {
            const light = this.lights[i];
            if (!light || typeof light.Update !== "function" || typeof light.GetCewgLightData !== "function") continue;

            light.Update(dt, this._worldTransform, bones);
            collector.Collect([ light.GetCewgLightData({ parentBrightness, parentScale }) ]);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            const child = this.objects[i];
            if (child && typeof child.GetLights === "function") child.GetLights(collector, parentContext);
        }
    }

    /**
     * Applies a resolved faction colour set to this container's inherit properties
     * and cascades it to child containers.
     * Port of CarbonEngine EveChildContainer::SetInheritProperties.
     * @param {EveSOFDataFactionColorSet} colorSet
     */
    SetInheritProperties(colorSet)
    {
        if (!this.inheritProperties)
        {
            this.inheritProperties = new EveChildInheritProperties();
        }

        this.inheritProperties.SetProperties(colorSet);

        for (let i = 0; i < this.objects.length; i++)
        {
            if (typeof this.objects[i].SetInheritProperties === "function")
            {
                this.objects[i].SetInheritProperties(colorSet);
            }
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} Returns true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display) return false;
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();

        const c = accumulator.length;

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].GetBatches(mode, accumulator, perObjectData);
        }

        /*
        for (let i = 0; i < this.lights.length; i++)
        {
            this.lights[i].GetBatches(mode, accumulator, perObjectData);
        }
        */

        return accumulator.length !== c;
    }

}
