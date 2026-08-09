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

        this._turretSet.UpdateItemsFromLocators(this._locators);

        if (this._targetObject) this._turretSet.SetTargetObject?.(this._targetObject);
        else this._turretSet.SetTargetPosition(this._target);

        this.UpdateFaction();
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
    static async RebuildLocatorSlots(parent, wrappedObjects, type, targetArray)
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
