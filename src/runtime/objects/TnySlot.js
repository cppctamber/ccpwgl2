import { Tw2EventEmitter } from "core/Tw2EventEmitter";
import { EveTurretSet } from "eve/item";
import { addToArray, removeFromArray, toArray } from "utils/arr";
import { mat4, vec3 } from "math";
import { tw2 } from "global";


/**
 * A weapon/utility slot resolved from a space object's locators.
 *
 * Runtime replacement for the wrapped layer's WrappedSlot: same behaviour
 * (mounting turret sets onto locator groups, live/fixed targeting, faction
 * materials), but sof data comes straight from tw2.eveSof — which is the
 * lazy handler's instance when a dna handler is registered.
 */
export class TnySlot extends Tw2EventEmitter
{

    name = "";

    /** Reuse the parent hull's mesh materials on the turret */
    lockParentMaterials = true;

    /** @type {String} locator group this slot binds, e.g. "locator_turret_1" */
    locatorName = "";

    _parent = null;
    _wrapped = null;
    _locators = null;
    _faction = "";
    _resPathValue = "";
    _promise = null;
    _turretSet = null;
    _target = vec3.create();
    _targetObject = null;
    _state = EveTurretSet.State.INACTIVE;
    _materialUsage = [ -1, -1, -1, -1 ];

    /**
     * @param {*} parent          - the Tny object owning the slot
     * @param {*} wrapped         - the wrapped source object carrying the locators
     * @param {String} locatorName
     * @param {Array} locators
     */
    constructor(parent, wrapped, locatorName, locators)
    {
        super();
        this._parent = parent;
        this._wrapped = wrapped;
        this._locators = locators;
        this._faction = this._ParentFaction();
        Reflect.defineProperty(this, "locatorName", { value: locatorName });
    }

    /** @type {String} the mounted turret's res path, or "" */
    get resPath()
    {
        return this._resPathValue;
    }

    get materialUsageMtl1() { return this._materialUsage[0]; }
    set materialUsageMtl1(x) { this._SetMaterialUsage(0, x); }

    get materialUsageMtl2() { return this._materialUsage[1]; }
    set materialUsageMtl2(x) { this._SetMaterialUsage(1, x); }

    get materialUsageMtl3() { return this._materialUsage[2]; }
    set materialUsageMtl3(x) { this._SetMaterialUsage(2, x); }

    get materialUsageMtl4() { return this._materialUsage[3]; }
    set materialUsageMtl4(x) { this._SetMaterialUsage(3, x); }

    /**
     * Gets the mounted turret set
     * @returns {null|EveTurretSet}
     */
    GetTurretSet()
    {
        return this._turretSet;
    }

    /**
     * Mounts a turret set from a res path
     * @param {String} resPath
     * @returns {Promise<Boolean>} true when this mount is the active one
     */
    async Mount(resPath)
    {
        if (this._resPathValue !== resPath)
        {
            this.Unmount();
            this._resPathValue = resPath;
            this._promise = tw2.Fetch(resPath)
                .then(turretSet =>
                {
                    if (this._resPathValue !== resPath) return false;
                    turretSet._resPath = resPath;
                    turretSet.locatorName = this.locatorName;
                    this._turretSet = turretSet;
                    this.Rebuild();
                    return true;
                })
                .catch(() =>
                {
                    if (this._resPathValue === resPath)
                    {
                        this._resPathValue = "";
                        this._promise = null;
                    }
                    return false;
                });
        }
        return this._promise;
    }

    /**
     * Unmounts the turret set
     */
    Unmount()
    {
        if (this._turretSet)
        {
            const array = this._AttachmentArray();
            if (array) removeFromArray(array, this._turretSet);
        }
        this._resPathValue = "";
        this._promise = null;
        this._turretSet = null;
    }

    /**
     * Sets a fixed target position
     * @param {vec3} v
     */
    SetTarget(v)
    {
        this._targetObject = null;
        this._turretSet?.SetTargetObject?.(null);
        vec3.copy(this._target, v);
        this._turretSet?.SetTargetPosition(this._target);
    }

    /**
     * Sets a scene object as the live target
     * @param {*} object
     * @returns {Boolean} true if the target position was resolved
     */
    SetTargetObject(object)
    {
        if (!object)
        {
            this._targetObject = null;
            this._turretSet?.SetTargetObject?.(null);
            return false;
        }

        this._targetObject = object;
        if (this._turretSet && this._turretSet.SetTargetObject?.(object) === false)
        {
            this._targetObject = null;
            return false;
        }
        return this.UpdateTarget();
    }

    /**
     * Gets the live target object
     * @returns {*|null}
     */
    GetTargetObject()
    {
        return this._targetObject;
    }

    /**
     * Updates the target from the live target object's world position.
     * When `sceneObjects` is supplied it doubles as the liveness check.
     * @param {Array} [sceneObjects]
     * @returns {Boolean|null} true when updated, false when invalidated,
     * null when the slot is using a fixed position
     */
    UpdateTarget(sceneObjects)
    {
        const object = this._targetObject;
        if (!object) return null;

        if (sceneObjects && !sceneObjects.includes(object))
        {
            this.SetTargetObject(null);
            return false;
        }

        const g = TnySlot.global;
        if (typeof object.GetWorldTranslation === "function")
        {
            object.GetWorldTranslation(g.vec3_0);
        }
        else if (typeof object.GetWorldTransform === "function")
        {
            object.GetWorldTransform(g.mat4_0);
            mat4.getTranslation(g.vec3_0, g.mat4_0);
        }
        else if (typeof object.GetTransform === "function")
        {
            object.GetTransform(g.mat4_0);
            mat4.getTranslation(g.vec3_0, g.mat4_0);
        }
        else
        {
            this.SetTargetObject(null);
            return false;
        }

        vec3.copy(this._target, g.vec3_0);
        if (this._turretSet?.GetTargetObject?.() !== object)
        {
            this._turretSet?.SetTargetObject?.(object);
        }
        return true;
    }

    /**
     * Sets the turret's faction
     * @param {String} [faction] - defaults to the current faction
     * @param {Boolean} [force]
     * @returns {Promise<void>}
     */
    async SetFaction(faction = this._faction, force)
    {
        if (this._faction === faction && !force) return;
        this._faction = faction;
        return this.UpdateFaction();
    }

    /**
     * Reapplies faction materials to the mounted turret
     * @returns {Promise<void>}
     */
    async UpdateFaction()
    {
        if (!this._turretSet || !tw2.eveSof) return;
        tw2.eveSof.SetupTurretMaterial(
            this._turretSet,
            this._ParentFaction(),
            this._faction,
            this.lockParentMaterials ? this._parent.wrapped.mesh.opaqueAreas[0].effect.parameters : null,
            this._materialUsage
        );
    }

    /** Fires the turret */
    Fire()
    {
        this._SetState(EveTurretSet.State.FIRING);
    }

    /** Sets the turret to idle */
    Idle()
    {
        this._SetState(EveTurretSet.State.IDLE);
    }

    /** Packs the turret */
    Deactivate()
    {
        this._SetState(EveTurretSet.State.INACTIVE);
    }

    /**
     * (Re)attaches the mounted turret set and syncs it to the slot's
     * locators, target and faction
     * @param {Array} [newLocators]
     */
    Rebuild(newLocators)
    {
        if (newLocators) this._locators = newLocators;
        if (!this._turretSet) return;

        const array = this._AttachmentArray();
        if (array && !array.includes(this._turretSet)) array.push(this._turretSet);

        // Resolved by the OWNER and pushed in, rather than bound onto the
        // locators for the turret set to read back off them. See
        // _ResolveTransforms.
        this._turretSet.UpdateItemsFromLocators(this._locators, this._ResolveTransforms());

        if (this._targetObject) this._turretSet.SetTargetObject?.(this._targetObject);
        else this._turretSet.SetTargetPosition(this._target);

        this.UpdateFaction();
    }

    /**
     * Gets where this slot's turret actually is, right now, in MODEL space -
     * the locator's own transform with its bone applied.
     *
     * Resolved in the same order the engine does, most authoritative first:
     *
     *   1. the mounted turret item's own transform, which IS where the gun is
     *   2. the locator's bone, live - `bone.worldTransform` is already in
     *      model space despite the name, which is why the turret set composes
     *      the ship matrix on top of it afterwards
     *   3. the locator's authored transform - the bind pose, correct for a
     *      rigid hull and the best available for an unbound locator
     *
     * Deliberately NOT `EveLocator2.GetTransform`. That folds the bone in as
     * `offsetTransform * transform`, and `offsetTransform` is the SKINNING
     * matrix - bone world times inverse bind pose. It equals the bone's world
     * transform only when the locator's own transform is exactly the bind
     * pose, so on anything that moves it answers a different place than the
     * turret mounted on it. The turret reads `bone.worldTransform` outright
     * and is correctly placed; this matches the turret.
     *
     * Step 2 is asked of the SHIP, not of the locator. A locator is an inert
     * name and matrix: it owns no skeleton, no mesh index and no loading
     * state, so it cannot say where a moving hardpoint is - which is why it
     * had to cache a bone in order to appear to.
     *
     * @param {mat4} out
     * @param {Number} [index=0] - which of the slot's locators
     * @returns {?mat4} out, or null if there is nothing to report
     */
    GetTransform(out, index = 0)
    {
        const locator = this._locators && this._locators[index];
        if (!locator) return null;

        const set = this.GetTurretSet();
        const item = set && set.FindItemByLocatorName ? set.FindItemByLocatorName(locator.name) : null;

        // A mounted turret has already done this work, and its answer includes
        // anything the turret itself applied on top of the locator.
        if (item && typeof item.GetTransform === "function") return item.GetTransform(out);

        const resolved = this._ResolveTransform(out, locator.name);
        if (resolved) return resolved;

        // Nothing resolvable yet - so the authored bind pose, which is the
        // right answer on a rigid hull and the only one available before the
        // geometry lands. Nothing latches it, so the next ask can do better.
        return mat4.copy(out, locator.transform);
    }

    /**
     * Gets a transform for every locator in this slot.
     * @param {Array<mat4>} [out]
     * @returns {Array<mat4>}
     */
    GetTransforms(out = [])
    {
        const count = this._locators ? this._locators.length : 0;
        for (let i = 0; i < count; i++)
        {
            if (!out[i]) out[i] = mat4.create();
            this.GetTransform(out[i], i);
        }
        out.length = count;
        return out;
    }

    /**
     * The object that resolves a locator name to a transform.
     *
     * The ship, not the locator. It owns every input the answer depends on -
     * the animation controller, the mesh index, the locator list, whether
     * loading has finished - and Carbon puts the resolution there for exactly
     * that reason.
     *
     * Null for anything that does not resolve names, which is not a fault: a
     * station or a structure has authored locators and no skeleton, and those
     * locators' own transforms are the correct answer.
     * @private
     */
    _Resolver()
    {
        const candidates = [ this._wrapped, this._parent && this._parent.wrapped ];

        for (let i = 0; i < candidates.length; i++)
        {
            const c = candidates[i];

            if (c
                && typeof c.DetermineLocatorType === "function"
                && typeof c.GetLocatorTransform === "function") return c;
        }

        return null;
    }

    /**
     * Resolves one locator name into `out`.
     * @param {mat4} out
     * @param {String} name
     * @returns {?mat4} out, or null when there is no answer yet
     * @private
     */
    _ResolveTransform(out, name)
    {
        const resolver = this._Resolver();
        if (!resolver) return null;

        const binding = resolver.DetermineLocatorType(name, undefined, this._binding);

        // GetLocatorTransform reports a LocatorType and writes `out` whenever that
        // is truthy. A caller asking where its turret is wants the matrix, so the
        // state is collapsed here - the two falsy states, NOT_LOADED and NONE,
        // both mean there is nothing to report.
        return resolver.GetLocatorTransform(out, binding.type, binding.index) ? out : null;
    }

    /**
     * Resolves a transform for each of this slot's locators.
     *
     * A null entry means "no answer yet", and the turret set falls back to the
     * locator's authored transform for it - the bind pose, correct on a rigid
     * hull and the best available before geometry lands. Because nothing
     * latches that, the next frame asks again.
     *
     * Warns about the one combination that is a genuine fault: a hull that HAS
     * a skeleton, where a hardpoint resolves to an authored locator rather than
     * a bone. Nothing about the picture says so - the gun sits at its bind pose
     * a few metres from where it belongs, and the turret item, an annotation and
     * a drop target all agree about the wrong place.
     *
     * @param {Array} [out]
     * @returns {Array}
     * @private
     */
    _ResolveTransforms(out = [])
    {
        const locators = this._locators;
        const count = locators ? locators.length : 0;

        out.length = count;
        if (!count) return out;

        const resolver = this._Resolver();
        if (!resolver)
        {
            out.fill(null);
            return out;
        }

        // Taken off the resolver rather than imported, so this works for anything
        // that answers the same two calls.
        const types = resolver.constructor.LocatorType;

        const binding = this._binding || (this._binding = { type: 0, index: -1 });
        const pool = this._transformPool || (this._transformPool = []);
        const boneless = [];

        for (let i = 0; i < count; i++)
        {
            const locator = locators[i];

            if (!locator)
            {
                out[i] = null;
                continue;
            }

            if (!pool[i]) pool[i] = mat4.create();

            resolver.DetermineLocatorType(locator.name, undefined, binding);
            const resolved = resolver.GetLocatorTransform(pool[i], binding.type, binding.index);

            // The matrix, never the type - the turret set treats these as
            // transforms.
            out[i] = resolved ? pool[i] : null;

            // TRANSFORM means this hardpoint resolved to an authored locator and
            // will never move. Nothing resolves at all until the geometry is
            // loaded, so this cannot fire early on a hull that simply had not
            // arrived yet - which is what makes it worth warning about.
            if (types && resolved === types.TRANSFORM) boneless.push(locator.name);
        }

        // A hull with no models is rigid, and a hardpoint resolving to an authored
        // locator is what rigid MEANS. Saying so for each one would bury the case
        // worth hearing under every frigate in the game.
        const models = resolver.animation && resolver.animation.models;

        if (boneless.length && models && models.length)
        {
            tw2.Debug({
                name: "Slots",
                message: `No bone for ${boneless.length} locator(s) on ${this.locatorName}: ${boneless.join(", ")}`
            });
        }

        return out;
    }

    _AttachmentArray()
    {
        return this._wrapped.attachments || this._wrapped.turretSets || null;
    }

    _ParentFaction()
    {
        return (this._parent.wrapped.dna || "").split(":")[1] || "";
    }

    _SetMaterialUsage(index, value)
    {
        if (this._materialUsage[index] !== value)
        {
            this._materialUsage[index] = value;
            this.UpdateFaction();
        }
    }

    _SetState(state)
    {
        this._state = state;
        if (!this._turretSet) return;

        switch (state)
        {
            case EveTurretSet.State.FIRING:
                this._turretSet.EnterStateFiring();
                break;

            case EveTurretSet.State.IDLE:
                this._turretSet.EnterStateIdle();
                break;

            case EveTurretSet.State.INACTIVE:
                this._turretSet.EnterStateDeactive();
                break;
        }
    }

    /**
     * Reconciles one locator type's slots on a target array: existing slots
     * rebuild in place, new locator groups grow slots, orphans unmount.
     * @param {*} parent            - the Tny object owning the slots
     * @param {*|Array} wrappedObjects - wrapped source object(s)
     * @param {String} type         - "turret" | "xl" | "launcher" | "chain" | "atomic" | "bomb"
     * @param {Array} targetArray   - the slot array to reconcile
     * @returns {Promise<Array>}
     */
    static async rebuildLocatorSlots(parent, wrappedObjects, type, targetArray)
    {
        const
            re = RegExp(String.raw`^(locator_${type})_([0-9]+)([a-z]+)`, "i"),
            groups = [];

        toArray(wrappedObjects).forEach(wrapped =>
        {
            wrapped.locators.forEach(locator =>
            {
                const match = re.exec(locator.name);
                if (!match) return;

                const
                    index = parseInt(match[2], 10),
                    name = `${match[1]}_${index}`;

                let group = groups.find(x => x.name === name);
                if (!group)
                {
                    group = { name, index, locators: [], wrapped };
                    groups.push(group);
                }
                addToArray(group.locators, locator);
            });
        });

        // Locator order is not guaranteed
        groups.sort((a, b) => a.index - b.index);

        // Nothing to bind. A slot now asks the ship where its locators are at
        // the moment it is asked, so an EMPTY slot - the one a consumer asks
        // about when offering somewhere to fit a gun - answers as well as a
        // mounted one, without anything having walked the skeleton first.

        const orphans = Array.from(targetArray);
        for (const group of groups)
        {
            const existing = targetArray.find(x => x.locatorName === group.name);
            if (existing)
            {
                orphans.splice(orphans.indexOf(existing), 1);
                existing.Rebuild(group.locators);
            }
            else
            {
                targetArray.push(new this(parent, group.wrapped, group.name, group.locators));
            }
        }

        for (const orphan of orphans)
        {
            orphan.Unmount();
            removeFromArray(targetArray, orphan);
        }

        return targetArray.sort((a, b) => a.locatorName.localeCompare(b.locatorName, undefined, { numeric: true }));
    }

    /**
     * Shared target transform scratch values
     */
    static global = {
        mat4_0: mat4.create(),
        vec3_0: vec3.create()
    };

}
