// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildInstanceContainer.cpp
import { meta } from "utils";
import { tw2 } from "global";
import { EveChild } from "./EveChild";
import { EveChildContainer } from "./EveChildContainer";
import { mat4, quat, vec3 } from "math";


/**
 * One placement of a source child, as authored.
 *
 * Carbon's `EveChildInstanceTransform` struct
 * (`EveChildInstanceContainer.h:17-25`). Its member is `scale`, singular, unlike
 * the `scaling` every transform-carrying class uses - the name here follows the
 * struct.
 *
 * No file in the corpus checked so far carries one: the shipped containers place
 * by locator set instead, so this shape is ported from the C++ member names and
 * has not been seen against real data.
 */
@meta.type("EveChildInstanceTransform")
@meta.define({
    wgl: "EveChildInstanceTransform",
    ccp: true
})
export class EveChildInstanceTransform extends meta.Model
{

    @meta.vector3
    scale = vec3.fromValues(1, 1, 1);

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    translation = vec3.create();

    @meta.int32
    boneIndex = -1;

}


/**
 * Copies one source child across a locator set and/or a list of transforms.
 *
 * Despite the name this is NOT GPU instancing - Carbon says so itself
 * (`EveChildInstanceContainer.h:29-32`, "copies a source EveSpaceObjectChild
 * across locatorsets and or transforms"). Each instance is a real child object,
 * deep-copied from `source` and parented under its own transform, so instances
 * animate and are controlled independently. `Tw2InstancedMesh` is a different
 * mechanism entirely and this class does not use it.
 *
 * Carbon builds each instance as an `EveChildContainer` holding the copy, and
 * wraps that in a SECOND container carrying an `EveChildModifierAttachToBone`
 * when the placement names a bone (`cpp:234-292`). ccpwgl's `EveChildContainer`
 * reads `boneIndex` natively - it resolves the joint matrix in its own `Update` -
 * so the bone is set on the one container instead of adding a second one and a
 * modifier to reach the same field. Same result through the path that is already
 * exercised.
 */
@meta.type("EveChildInstanceContainer")
@meta.define({
    wgl: "EveChildInstanceContainer",
    ccp: true
})
@meta.stage(2)
export class EveChildInstanceContainer extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.boolean
    alwaysOn = false;

    /** The child that gets copied. Never drawn directly once instances exist. */
    @meta.struct()
    source = null;

    /**
     * Names a locator set on the owning space object; every locator in it gets an
     * instance. This is how shipped content places instances - `chjita_fx_01a`
     * has a `locatorSet` and no `transforms` at all.
     */
    @meta.string
    locatorSet = "";

    @meta.list("EveChildInstanceTransform")
    transforms = [];

    @meta.list("EveChildModifier")
    transformModifiers = [];

    @meta.notImplemented
    @meta.struct("EveChildInheritProperties")
    inheritProperties = null;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.matrix4
    localTransform = mat4.create();

    @meta.boolean
    useSRT = true;

    @meta.boolean
    staticTransform = false;

    @meta.boolean
    useStaticRotation = false;

    /** The built instances - each an `EveChildContainer` holding a copy of `source`. */
    instances = [];

    /** Sticky controller variables, replayed onto instances as they are built. */
    controllerVariables = new Map();

    _worldTransform = mat4.create();

    /** Instances need (re)building. Carbon's `m_reset`, and it starts true. */
    _reset = true;

    _hasUpdated = false;

    _pendingColorSet = null;

    /** Reported a failed source copy already - see `CloneSource`. */
    _cloneFailed = false;

    /**
     * Builds one instance per locator and per authored transform.
     *
     * Carbon `CreateInstances` (cpp:193-221): locators first, then the transform
     * list, and both may be present. A locator contributes its own rotation,
     * position and bone at unit scale.
     *
     * @param {EveShip2} [parentSpaceObject] - the object whose locator sets are named
     * @returns {Number} how many instances were built
     */
    CreateInstances(parentSpaceObject)
    {
        this.instances = [];

        if (!this.source) return 0;

        if (this.locatorSet && parentSpaceObject)
        {
            const locators = EveChildInstanceContainer.GetLocatorsForSet(parentSpaceObject, this.locatorSet);

            if (locators)
            {
                for (let i = 0; i < locators.length; i++)
                {
                    const locator = locators[i];
                    this.CreateInstance(
                        EveChildInstanceContainer.UNIT_SCALE,
                        locator.rotation,
                        locator.position,
                        locator.boneIndex
                    );
                }
            }
        }

        for (let i = 0; i < this.transforms.length; i++)
        {
            const transform = this.transforms[i];
            if (transform) this.CreateInstance(transform.scale, transform.rotation, transform.translation, transform.boneIndex);
        }

        return this.instances.length;
    }

    /**
     * Copies the source into a container placed at the given transform.
     * Carbon `CreateInstance` (cpp:234-292).
     *
     * @param {vec3} scale
     * @param {quat} rotation
     * @param {vec3} translation
     * @param {Number} [boneIndex=-1]
     * @returns {EveChildContainer|null} the instance, or null if the source could not be copied
     */
    CreateInstance(scale, rotation, translation, boneIndex = -1)
    {
        if (!this.source || typeof this.source.Clone !== "function") return null;

        const copy = this.CloneSource();
        if (!copy) return null;

        const instance = new EveChildContainer();
        instance.name = this.name;
        instance.objects.push(copy);

        vec3.copy(instance.scaling, scale);
        quat.copy(instance.rotation, rotation);
        vec3.copy(instance.translation, translation);
        instance.useSRT = true;

        // ccpwgl's container resolves the joint itself, so no bone modifier is needed
        if (boneIndex >= 0) instance.boneIndex = boneIndex;

        for (let i = 0; i < this.transformModifiers.length; i++)
        {
            instance.transformModifiers.push(this.transformModifiers[i]);
        }

        instance.Initialize();

        // Carbon replays the recorded variables onto each instance as it is built
        // (cpp:258-264) - an instance created after a variable was set still gets it.
        this.controllerVariables.forEach((value, name) => instance.SetControllerVariable(name, value));

        if (this._pendingColorSet) instance.SetInheritProperties(this._pendingColorSet);

        this.instances.push(instance);
        return instance;
    }

    /**
     * Copies the source, surviving a copy that cannot be made.
     *
     * STOPGAP, 2026-08-21. `Model.clone` is `from(GetValues())`
     * (`src/global/meta/Model.js:875-878`) - a round trip through plain values -
     * and a source carrying curve sets whose bindings reference sibling objects
     * does not survive it: `Tw2ValueBinding.destinationObject` is
     * `@meta.notOwned @meta.struct()` with NO declared constructors, so
     * rebuilding it throws `Unknown struct constructor for destinationObject`.
     *
     * Carbon has no equivalent problem: it copies with `BeClasses->CopyTo`
     * (`cpp:246`), a real deep copy that preserves references.
     *
     * Left unguarded this takes the whole object build down, and it fires once
     * per attempted instance - the report that prompted this had 1984 of them.
     * A missing effect is a better failure than a dead page, but this is NOT the
     * fix: the copy still needs to work. The warning is deliberately loud and
     * fires ONCE per container so the real defect stays visible instead of being
     * buried under a flood.
     *
     * @returns {?EveChild} the copy, or null if it could not be made
     */
    CloneSource()
    {
        try
        {
            return this.source.Clone();
        }
        catch (err)
        {
            if (!this._cloneFailed)
            {
                this._cloneFailed = true;
                tw2.Debug({
                    name: "EveChildInstanceContainer",
                    message: `Could not copy the source of "${this.name}" - instances will be missing: ${err.message}`,
                    data: { err }
                });
            }
            return null;
        }
    }

    /**
     * Empties the instance list.
     *
     * Carbon `ClearInstanceList` (`cpp:339-344`) also unregisters the instances
     * from the component registry, which ccpwgl's child path does not have.
     *
     * Note this does NOT clear `_reset`: a container placing from a locator set
     * will rebuild on its next update, which is what Carbon does too. A caller
     * that owns the instance list itself - `EveChildEffectPropagator` - must keep
     * `_reset` false so its spawns are not discarded.
     */
    ClearInstanceList()
    {
        this.instances = [];
    }

    /**
     * Removes the OLDEST instance. Carbon `PopFront` (`cpp:346-360`).
     *
     * This is how a propagator retires instances as they expire, paced against
     * the spawn rate, so the two counters stay in step.
     *
     * @returns {Boolean} true if one was removed
     */
    PopFront()
    {
        if (!this.instances.length) return false;
        this.instances.shift();
        return true;
    }

    /**
     * The objects this container drives.
     *
     * Carbon `RunOnInstances` (cpp:318-331) falls back to the SOURCE when no
     * instances have been built - so a container that names a locator set the
     * object does not have still shows its source rather than nothing. That is
     * editor behaviour, and it is also what makes an unconfigured container
     * visible instead of silently empty.
     *
     * @returns {Array} instances, or a single-element list holding the source
     */
    GetInstances()
    {
        if (!this.instances.length && this.source) return [ this.source ];
        return this.instances;
    }

    /**
     * Rebuilds on the next update. Anything that changes what should be placed,
     * or where, sets this - Carbon sets `m_reset` from every such handler.
     */
    OnModified()
    {
        this._reset = true;
        return true;
    }

    /**
     * @returns {Boolean}
     */
    IsAlwaysOn()
    {
        return this.alwaysOn;
    }

    /**
     * Sets a controller variable on every instance, recording it for instances
     * built later. Carbon `SetControllerVariable` (cpp) plus the replay in
     * `CreateInstance`.
     * @param {String} name
     * @param {Number} value
     */
    SetControllerVariable(name, value)
    {
        this.controllerVariables.set(name, value);

        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            const instance = instances[i];
            if (instance && instance.SetControllerVariable) instance.SetControllerVariable(name, value);
        }
    }

    /**
     * @param {String} name
     */
    HandleControllerEvent(name)
    {
        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            const instance = instances[i];
            if (instance && instance.HandleControllerEvent) instance.HandleControllerEvent(name);
        }
    }

    /**
     * Starts every instance's controllers.
     */
    StartControllers()
    {
        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            const instance = instances[i];
            if (instance && instance.StartControllers) instance.StartControllers();
        }
    }

    /**
     * Records the colour set and applies it to every instance, so one built later
     * still receives it.
     * @param {EveSOFDataFactionColorSet} colorSet
     */
    SetInheritProperties(colorSet)
    {
        this._pendingColorSet = colorSet;

        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            const instance = instances[i];
            if (instance && instance.SetInheritProperties) instance.SetInheritProperties(colorSet);
        }
    }

    /**
     * @param {Tw2Frustum} frustum
     * @param {Number} parentLod
     */
    UpdateLod(frustum, parentLod)
    {
        this._lod = parentLod;

        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            if (instances[i] && instances[i].UpdateLod) instances[i].UpdateLod(frustum, this._lod);
        }
    }

    /**
     * Resets lod
     */
    ResetLod()
    {
        this._lod = 3;

        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            if (instances[i] && instances[i].ResetLod) instances[i].ResetLod();
        }
    }

    /**
     * Per frame update.
     *
     * The instances are built here rather than at load, because the locator set
     * they place against lives on the owning space object and is only reachable
     * once that object threads itself down. Carbon does the same, in
     * `UpdateSyncronous` (cpp:395-399), gated on the same reset flag.
     *
     * @param {Number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} [perObjectData]
     * @param {EveShip2} [parentSpaceObject]
     */
    Update(dt, parentTransform, perObjectData, parentSpaceObject)
    {
        if (!this.display) return;

        if (this.useSRT && !this.staticTransform)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
        this._hasUpdated = true;

        if (this._reset)
        {
            this.CreateInstances(parentSpaceObject);
            this._reset = false;
        }

        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            const instance = instances[i];
            if (instance && instance.Update) instance.Update(dt, this._worldTransform, perObjectData, parentSpaceObject);
        }
    }

    /**
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        // Instances are copies of the source, so the source alone names every
        // resource they need - and it does so before any instance exists.
        if (this.source && this.source.GetResources) this.source.GetResources(out);

        for (let i = 0; i < this.instances.length; i++)
        {
            if (this.instances[i].GetResources) this.instances[i].GetResources(out);
        }

        return out;
    }

    /**
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches were accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this._hasUpdated) return false;

        const
            instances = this.GetInstances(),
            count = accumulator.length;

        for (let i = 0; i < instances.length; i++)
        {
            const instance = instances[i];
            if (instance && instance.GetBatches) instance.GetBatches(mode, accumulator, perObjectData);
        }

        return accumulator.length !== count;
    }

    /**
     * Collects lights from every instance.
     * @param {Tw2CarbonLightCollector} collector
     * @param {Object} [parentContext]
     */
    GetLights(collector, parentContext)
    {
        const instances = this.GetInstances();
        for (let i = 0; i < instances.length; i++)
        {
            const instance = instances[i];
            if (instance && instance.GetLights) instance.GetLights(collector, parentContext);
        }
    }

    /**
     * Reads a named locator set off a space object.
     *
     * Carbon calls `spaceObject->GetLocatorsForSet(name)` (cpp:206). ccpwgl's
     * equivalent is `EveShip2._GetLocatorSetItems`, marked private because until
     * now only the damage locators used it.
     *
     * @param {EveShip2} spaceObject
     * @param {String} name
     * @returns {Array<EveLocatorSetItem>|null}
     */
    static GetLocatorsForSet(spaceObject, name)
    {
        if (!spaceObject) return null;
        if (typeof spaceObject.GetLocatorsForSet === "function") return spaceObject.GetLocatorsForSet(name);
        if (typeof spaceObject._GetLocatorSetItems === "function") return spaceObject._GetLocatorSetItems(name);
        return null;
    }

    static UNIT_SCALE = vec3.fromValues(1, 1, 1);

}
