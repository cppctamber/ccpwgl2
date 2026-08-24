import { meta } from "utils";
import { vec3, vec4, quat, mat4, sph3, box3 } from "math";
import { GLESPerObjectDataEveSpaceObject } from "core";
import { EveObject } from "./EveObject";
import { PlayCurveSetOn, StopCurveSetOn, GetRangeDurationOn, GetCurveSetDurationOn } from "../../curve/curveSetOwner";
import { SetControllerVariableOn, ReplayControllerVariablesOn } from "../../state/controllerVariables";
import { GetAverageAxisScale } from "core/lighting/Tw2CarbonLightMath";


/**
 * A standalone effect: a transform that owns effect children, curve sets,
 * controllers, observers and LIGHTS, and can be put in a scene on its own.
 *
 * Ported from Carbon `trinity/trinity/Eve/EveEffectRoot2.{h,cpp}`. Note there is
 * no `EveEffectRoot` in Carbon at all - the v1 class beside this one is ccpwgl's
 * own legacy, which is why parts of it already carry EveEffectRoot2 citations.
 *
 * Two things make it worth having rather than reaching for a ship:
 *
 *   1. it is `ITr2LightOwner` (`EveEffectRoot2.h:99-102`), so it is where a
 *      light belonging to no object goes. `EveSpaceScene.lights` does that job
 *      today and is the quicker rig, but the scene list is ccpwgl's invention
 *      and this is Carbon's answer;
 *   2. `effectChildren` with no hull under them is how a VFX is built
 *      independently of a ship.
 *
 * It is also the base class of Carbon's `EvePlanet`.
 *
 * Deliberately NOT ported: the damage-locator half of `ITriTargetable` is a set
 * of constant answers in Carbon (`cpp:617-681` - zero locators, the world
 * position for any index, +Y for any direction), the impostor and quad-renderer
 * registration have no ccpwgl counterpart, and the component-registry calls are
 * inert here because nothing wires a registry yet (see the note in
 * `EveObject.GetLights`).
 */
@meta.define("EveEffectRoot2", true)
@meta.stage(2)
export class EveEffectRoot2 extends EveObject
{

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list("Tr2Controller")
    controllers = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    /**
     * Carbon's `m_effectDuration` starts at -1 (`cpp:34`), NOT 0 - it means "no
     * declared duration" rather than "instantaneous". Nothing here reads it yet;
     * it is persisted so a consumer deciding when to drop a one-shot effect has
     * the authored answer instead of guessing from the curve sets.
     */
    @meta.float
    duration = -1;

    @meta.boolean
    dynamicLOD = false;

    @meta.list("EveChild")
    effectChildren = [];

    /**
     * Carbon binds these onto object elements by name (`m_externalParameters`).
     * Persisted and reachable via {@link GetExternalParameters}; nothing applies
     * them yet, matching `EveChildPlug`.
     */
    @meta.notImplemented
    @meta.list("Tr2ExternalParameter")
    externalParameters = [];

    /**
     * This root's OWN lights - the reason the class matters. Collected by
     * {@link GetLights} against the root's world transform, so moving the root
     * moves its lights.
     */
    @meta.list("Tr2PointLight")
    lights = [];

    /**
     * Carbon `m_modelRotation`, "used to add rotations to the basic rotation
     * curve" - composed ONTO `rotationCurve`, not instead of it.
     */
    @meta.notImplemented
    @meta.struct()
    modelRotationCurve = null;

    /**
     * Carbon `m_modelTranslation`, "used to add animated translations". Applied
     * AFTER the world matrix is built and REPLACES its translation outright
     * (`cpp:387-392`) - it is not summed with `translationCurve`.
     */
    @meta.notImplemented
    @meta.struct()
    modelTranslationCurve = null;

    @meta.notImplemented
    @meta.list("TriObserverLocal")
    observers = [];

    @meta.quaternion
    rotation = quat.create();

    /**
     * Carbon's `m_ballRotation` - the destiny ball slot. Exposed as
     * `rotationCurve` in Blue (`_Blue.cpp:70`), which is the name the black
     * reader wants.
     */
    @meta.notImplemented
    @meta.struct()
    rotationCurve = null;

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.color
    secondaryLightingEmissiveColor = vec4.create();

    /**
     * Carbon defaults this to 0.5, not 0 (`cpp:37`).
     */
    @meta.float
    secondaryLightingSphereRadius = 0.5;

    @meta.vector3
    translation = vec3.create();

    /** Carbon's `m_ballPosition`, exposed as `translationCurve` (`_Blue.cpp:64`). */
    @meta.notImplemented
    @meta.struct()
    translationCurve = null;


    // Sticky record of controller variables, so one set before a controller
    // linked still reaches it. Same mechanism as EveChildContainer's.
    controllerVariables = new Map();

    // Runtime only - Carbon maps `mute` READWRITE|NOTIFY with no PERSIST.
    _mute = false;

    _parentTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = new GLESPerObjectDataEveSpaceObject();
    _controllersLinked = false;

    // Carbon's `GetPerObjectStructs` (cpp:520-536) zeroes the struct and sets
    // shipData.y and shipData.w to 1. Held as one reused bag so a frame
    // allocates nothing.
    _perObjectDataBag = { shipData: [ 0, 1, 0, 1 ] };


    /**
     * Links this root's controllers with itself as their owner, so an expression
     * term like `CurveSetTime("Set/Range")` resolves against the curve sets held
     * here. Carbon `Initialize` (`cpp:59-70`) also claims ownership of every
     * effect child; ccpwgl children learn their parent from the `Update`
     * argument instead, so there is nothing to set.
     */
    Initialize()
    {
        super.Initialize();

        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (!controller) continue;

            const linked = controller.IsLinked ? controller.IsLinked() : false;
            if (!linked && controller.Initialize) controller.Initialize(this);
        }

        this._controllersLinked = true;
        ReplayControllerVariablesOn(this, null);
    }

    /**
     * Fires when bounds need to be rebuilt.
     *
     * The AUTHORED sphere is unioned in as well as the children's, because
     * Carbon's `GetBoundingSphere` (`cpp:344-348`) returns the authored value and
     * nothing else - an effect root whose children have not loaded still has the
     * size the artist gave it, and that size is what LOD and the secondary light
     * radius are scaled by.
     */
    OnRebuildBounds()
    {
        const { box3_0, sph3_0 } = EveObject.global;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (!child) continue;

            let bounds;

            if (child.GetBoundingBox)
            {
                child.GetBoundingBox(box3_0);
                sph3.fromBox3(sph3_0, box3_0);
                bounds = true;
            }
            else if (child.GetBoundingSphere)
            {
                child.GetBoundingSphere(sph3_0);
                bounds = true;
            }

            if (bounds) sph3.union(this._boundingSphere, this._boundingSphere, sph3_0);
        }

        sph3.unionPositionRadius(
            this._boundingSphere,
            this._boundingSphere,
            this.boundingSphereCenter,
            this.boundingSphereRadius
        );

        box3.fromSph3(this._boundingBox, this._boundingSphere);
        this._boundsDirty = false;
    }

    /**
     * Carbon `GetRadius` (`cpp:655-658`) - the AUTHORED radius, not the rebuilt
     * one, because it is what a targeting or miss-position calculation uses and
     * those must not shift as children stream in.
     * @returns {Number}
     */
    GetRadius()
    {
        return this.boundingSphereRadius;
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.effectChildren.length; i++)
        {
            if (this.effectChildren[i].GetResources) this.effectChildren[i].GetResources(out);
        }
        return out;
    }

    /**
     * Sets this root's transform by decomposing a matrix into its SRT.
     * Carbon `SetTransform` (`cpp:715-718`).
     * @param {mat4} transform
     * @returns {EveEffectRoot2}
     */
    SetTransform(transform)
    {
        mat4.getScaling(this.scaling, transform);
        mat4.getRotation(this.rotation, transform);
        mat4.getTranslation(this.translation, transform);
        this.OnValueChanged();
        return this;
    }

    /**
     * Adds a light to this root.
     *
     * Carbon `AddLight` (`cpp:494-497`) appends BY REFERENCE - unlike the packed
     * light sets, which copy. A light added here stays the caller's object, so
     * moving it afterwards moves what is collected.
     *
     * @param {Tr2PointLight|Tr2SpotLight|Tr2FactionLight} light
     * @returns {*} light
     */
    AddLight(light)
    {
        if (light && !this.lights.includes(light)) this.lights.push(light);
        return light;
    }

    /**
     * Removes a light. Not in Carbon, which only appends and clears - but a rig
     * that can add and not remove is a leak.
     * @param {*} light
     * @returns {Boolean} true if it was there
     */
    RemoveLight(light)
    {
        const index = this.lights.indexOf(light);
        if (index === -1) return false;
        this.lights.splice(index, 1);
        return true;
    }

    /**
     * Carbon `ClearLights` (`cpp:499-502`).
     * @returns {Number} how many were removed
     */
    ClearLights()
    {
        const count = this.lights.length;
        this.lights.length = 0;
        return count;
    }

    /**
     * Collects this root's own lights, then its children's.
     *
     * Carbon `GetLights` (`cpp:475-492`): skip when not displayed, take the
     * AVERAGE of the world matrix's three axis lengths as the scale, and hand
     * each light the world transform. The average is what lets a scaled root
     * scale its lights' radii with it - a light is a sphere, so it has no way to
     * follow a non-uniform scale.
     *
     * The `super` call reaches `effectChildren`, where nested light owners live.
     *
     * @param {Tw2CarbonLightCollector} collector
     * @param {Object} [parentContext]
     * @param {Number} [parentContext.dt=0]
     * @param {Number} [parentContext.parentBrightness=1]
     * @returns {Number} how many of THIS root's own lights were collected
     */
    GetLights(collector, parentContext = {})
    {
        if (!collector || !this.display) return 0;

        const
            dt = parentContext.dt || 0,
            parentBrightness = parentContext.parentBrightness !== undefined ? parentContext.parentBrightness : 1,
            parentScale = GetAverageAxisScale(this._worldTransform);

        let collected = 0;

        for (let i = 0; i < this.lights.length; i++)
        {
            const light = this.lights[i];

            // Duck checked: `lights` is a public array a consumer fills, and a
            // plain object pushed into it should be ignored rather than throw in
            // the middle of a frame.
            if (!light || typeof light.Update !== "function" || typeof light.GetCarbonLightData !== "function") continue;
            if (light.display === false) continue;

            light.Update(dt, this._worldTransform, null);
            collector.Collect([ light.GetCarbonLightData({ parentBrightness, parentScale }) ]);
            collected++;
        }

        super.GetLights(collector, parentContext);
        return collected;
    }

    /**
     * Starts every curve set on this root and on its effect children.
     * Carbon `Start` (`cpp:574-589`).
     */
    Start()
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].Play();
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.PlayAllCurveSets) child.PlayAllCurveSets();
        }
    }

    /**
     * Stops every curve set on this root and on its effect children.
     * Carbon `Stop` (`cpp:594-610`).
     */
    Stop()
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].Stop();
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.StopAllCurveSets) child.StopAllCurveSets();
        }
    }

    /**
     * Plays a NAMED curve set, optionally only a named range of it.
     * Carbon `PlayCurveSet` (`cpp:723-747`) - the addressed form, as opposed to
     * `Start` above, which plays everything.
     * @param {String} name
     * @param {String} [rangeName]
     * @returns {Boolean}
     */
    PlayCurveSet(name, rangeName)
    {
        return PlayCurveSetOn(this, name, rangeName, [ this.effectChildren ]);
    }

    /**
     * Carbon `StopCurveSet` (`cpp:750-771`).
     * @param {String} name
     * @returns {Boolean}
     */
    StopCurveSet(name)
    {
        return StopCurveSetOn(this, name, [ this.effectChildren ]);
    }

    /**
     * Carbon `GetCurveSetDuration` (`cpp:788-807`).
     * @param {String} setName
     * @returns {Number} seconds
     */
    GetCurveSetDuration(setName)
    {
        return GetCurveSetDurationOn(this, setName, [ this.effectChildren ]);
    }

    /**
     * Carbon `GetRangeDuration` (`cpp:809-827`).
     * @param {String} setName
     * @param {String} rangeName
     * @returns {Number} seconds
     */
    GetRangeDuration(setName, rangeName)
    {
        return GetRangeDurationOn(this, setName, rangeName, [ this.effectChildren ]);
    }

    /**
     * Sets a controller variable here and everywhere below, remembering it for
     * controllers that link later. Carbon `SetControllerVariable`
     * (`cpp:880-899`).
     * @param {String} name
     * @param {Number} value
     */
    SetControllerVariable(name, value)
    {
        SetControllerVariableOn(this, name, value, this.effectChildren);
    }

    /**
     * Every controller variable set on this root so far.
     * @returns {Map<String, Number>}
     */
    GetControllerVariables()
    {
        return this.controllerVariables;
    }

    /**
     * Raises a controller event on this root and its effect children.
     * Carbon `HandleControllerEvent` (`cpp:901-911`).
     *
     * Unlike a variable, an event is NOT remembered: it fires whatever is linked
     * at the time.
     *
     * @param {String} name
     */
    HandleControllerEvent(name)
    {
        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (controller && controller.HandleEvent) controller.HandleEvent(name);
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.HandleControllerEvent) child.HandleControllerEvent(name);
        }
    }

    /**
     * Carbon `StartControllers` (`cpp:914-925`).
     */
    StartControllers()
    {
        if (!this._controllersLinked) this.Initialize();

        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (controller && controller.Start) controller.Start();
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.StartControllers) child.StartControllers();
        }
    }

    /**
     * Carbon `GetEffectChildByName` (`cpp:928-940`).
     * @param {String} name
     * @returns {?EveChild}
     */
    GetEffectChildByName(name)
    {
        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.name === name) return child;
        }
        return null;
    }

    /**
     * Carbon `AddToEffectChildrenList` (`cpp:943-954`). Replays the recorded
     * controller variables onto the newcomer and starts its controllers, which is
     * what Carbon's list-modified hook does (`cpp:118-133`) - without it a
     * variable set before the child arrived never reaches it.
     * @param {EveChild} child
     * @returns {EveChild} child
     */
    AddToEffectChildrenList(child)
    {
        if (!child || this.effectChildren.includes(child)) return child;

        this.effectChildren.push(child);

        if (child.SetControllerVariable)
        {
            this.controllerVariables.forEach((value, name) => child.SetControllerVariable(name, value));
        }

        if (child.StartControllers) child.StartControllers();

        this._boundsDirty = true;
        return child;
    }

    /**
     * Carbon `RemoveFromEffectChildrenList` (`cpp:957-972`).
     * @param {EveChild} child
     * @returns {Boolean} true if it was there
     */
    RemoveFromEffectChildrenList(child)
    {
        const index = this.effectChildren.indexOf(child);
        if (index === -1) return false;

        this.effectChildren.splice(index, 1);
        this._boundsDirty = true;
        return true;
    }

    /**
     * Carbon `SetShaderOption` (`cpp:974-981`).
     * @param {String} name
     * @param {String} value
     */
    SetShaderOption(name, value)
    {
        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.SetShaderOption) child.SetShaderOption(name, value);
        }
    }

    /**
     * Carbon `SetProceduralContainerVariable` (`cpp:1030-1037`).
     * @param {String} name
     * @param {Number} value
     */
    SetProceduralContainerVariable(name, value)
    {
        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.SetProceduralContainerVariable) child.SetProceduralContainerVariable(name, value);
        }
    }

    /**
     * The external parameters authored on this root. Exposed the way
     * `EveChildPlug` exposes its own; nothing applies them yet.
     * @returns {Array<Tr2ExternalParameter>}
     */
    GetExternalParameters()
    {
        return this.externalParameters;
    }

    /**
     * Mutes or unmutes this root's children and observers.
     * Carbon `SetMute` (`cpp:1009-1019`); `mute` is NOTIFY but not PERSIST, so it
     * is runtime state rather than an authored property.
     * @param {Boolean} isMute
     */
    SetMute(isMute)
    {
        this._mute = !!isMute;

        for (const list of [ this.effectChildren, this.observers ])
        {
            for (let i = 0; i < list.length; i++)
            {
                const item = list[i];
                if (item && item.SetMute) item.SetMute(this._mute);
            }
        }
    }

    /**
     * Carbon `FindSoundEmitter` (`cpp:983-1002`): the observers first, by their
     * own name, then anything below that owns emitters.
     * @param {String} name
     * @returns {?*}
     */
    FindSoundEmitter(name)
    {
        for (let i = 0; i < this.observers.length; i++)
        {
            const observer = this.observers[i];
            if (observer && observer.name === name)
            {
                return observer.GetObserver ? observer.GetObserver() : observer;
            }
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.FindSoundEmitter)
            {
                const emitter = child.FindSoundEmitter(name);
                if (emitter) return emitter;
            }
        }

        return null;
    }

    /**
     * Carbon `AddObserver` (`cpp:1004-1007`).
     * @param {TriObserverLocal} observer
     * @returns {TriObserverLocal} observer
     */
    AddObserver(observer)
    {
        if (observer && !this.observers.includes(observer)) this.observers.push(observer);
        return observer;
    }

    /**
     * Pins every effect child at the highest detail level.
     * Carbon `FreezeHighDetailMesh` (`cpp:1021-1028`).
     */
    FreezeHighDetailMesh()
    {
        this._lod = 3;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.ChangeLOD) child.ChangeLOD(this._lod);
        }
    }

    /**
     * Resets LOD.
     */
    ResetLod()
    {
        this._lod = 3;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            if (this.effectChildren[i].ResetLod) this.effectChildren[i].ResetLod();
        }
    }

    /**
     * Updates LOD.
     *
     * Carbon picks a level from the sphere's PIXEL SIZE against three thresholds
     * and only when `dynamicLOD` is set (`cpp:277-311`). ccpwgl's frustum has no
     * pixel-size query, so this stays at full detail and forwards - the same
     * thing `EveEffectRoot` does, and a gap rather than a decision.
     *
     * @param {Tw2Frustum} frustum
     */
    @meta.todo("Select a level from the bounding sphere's pixel size, as Carbon does")
    UpdateLod(frustum)
    {
        this._lod = 3;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            if (this.effectChildren[i].UpdateLod) this.effectChildren[i].UpdateLod(frustum, this._lod);
        }
    }

    /**
     * Per frame update.
     *
     * Carbon splits this into a synchronous and an asynchronous half
     * (`cpp:182-274`); ccpwgl has one pass, so what carries over is the ORDER:
     * controllers before curve sets before children, because a controller drives
     * a curve set and a curve set drives what a child reads.
     *
     * Carbon hands its controllers an update FREQUENCY (0..1) derived from LOD,
     * not a time step. ccpwgl's `Tr2Controller.Update` advances its own clock
     * from the argument, so passing a frequency would make every state machine
     * run at the wrong rate - it gets `dt`, like every other controller owner
     * here.
     *
     * @param {Number} dt - delta time
     */
    Update(dt)
    {
        if (this.controllers.length)
        {
            // Controllers arrive by deserialization rather than an Add call, so
            // link them on first tick before updating.
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

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            child.Update(dt, this._worldTransform, this._perObjectData, this);
            if (child._boundsDirty) this._boundsDirty = true;
        }

        for (let i = 0; i < this.observers.length; i++)
        {
            const observer = this.observers[i];
            if (observer && observer.Update) observer.Update(this._worldTransform);
        }
    }

    /**
     * Per frame view dependent update.
     *
     * FILLS the per-object data, which is the one reason this is not simply
     * inherited from `EveEffectRoot`: that class builds a buffer and never writes
     * a value into it, so a child bound through it gets an all-zero `WorldMat`
     * and any shader that transforms by it collapses to the origin.
     *
     * `Shipdata` is Carbon's `GetPerObjectStructs` (`cpp:520-536`) exactly - the
     * struct zeroed, then `.y = 1` (activation) and `.w = 1`. The `1` is literal
     * rather than the bounding radius a SHIP writes there: an effect root has no
     * hull to scale surface effects against.
     *
     * @param {mat4} parentTransform
     * @param {Number} [dt]
     */
    UpdateViewDependentData(parentTransform, dt)
    {
        mat4.copy(this._worldTransformLast, this._worldTransform);
        mat4.copy(this._parentTransform, parentTransform);
        this.RebuildTransforms({ force: true, skipUpdate: true });

        const bag = this._perObjectDataBag;
        bag.worldTransform = this._worldTransform;
        bag.worldTransformLast = this._worldTransformLast;

        GLESPerObjectDataEveSpaceObject.Pack(bag, this._perObjectData);

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.UpdateViewDependentData) child.UpdateViewDependentData(this._worldTransform, dt);
        }
    }

    /**
     * Gets render batches.
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return false;

        const c = accumulator.length;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
        }

        return accumulator.length !== c;
    }

}
