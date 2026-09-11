import { meta } from "utils";
import { mat4 } from "math";
import { EveTurretSet } from "eve/item";
import { EveSpaceObject2 } from "./EveSpaceObject2";


/**
 * A space object that mounts turrets.
 *
 * Carbon's level between `EveSpaceObject2` and `EveShip2`, and its header says
 * why in one line: "This class adds functionalty like turrets to the
 * spaceobjects class" (`EveMobile.h:15-16`). Turret sets are its own
 * (`EveMobile.h:88`); everything else a hull has - mesh, children, locators,
 * locator sets, decals, attachments - belongs to the base.
 *
 * This replaces a `@meta.notImplemented` stub that nothing constructed, and it
 * keeps ccpwgl's shape rather than Carbon's storage: the sets live in the base's
 * polymorphic `attachments` list, as they always have here, and what moves is
 * the API that knows they are turrets. `buildClass` 1 and 4 both build a mobile
 * in Carbon (`EveSOF.cpp:614-654`).
 */
@meta.define("EveMobile", true)
@meta.stage(2)
export class EveMobile extends EveSpaceObject2
{

    /**
     * Scratch for resolving turret placements, reused between rebuilds.
     * @type {Array}
     */
    _turretTransformPool = [];

    /**
     * Turret sets firing right now, recounted every frame by the base's walk.
     * @type {Number}
     */
    _activeTurretCount = 0;

    /**
     * Handles one attachment when it is a turret set.
     *
     * The base walks `attachments` and no longer recognises what is in it; this
     * is where a turret set is known for one again.
     *
     * @param {*} attachment
     * @returns {Number} 1 when the set is firing, else 0
     */
    UpdateTurretAttachment(attachment)
    {
        if (!(attachment instanceof EveTurretSet)) return 0;

        if (attachment._locatorDirty)
        {
            this.RebuildTurretSet(attachment);
        }

        // SETS, not items. A set of six barrels firing counts once, which is
        // what the attribute means and what an effect reading it is scaled
        // against.
        return attachment.IsActive() ? 1 : 0;
    }

    /**
     * Stores the count the base's walk arrived at.
     * @param {Number} count
     */
    OnTurretsCounted(count)
    {
        this._activeTurretCount = count;
    }

    /**
     * Finds a turret set by its locator
     * @param {String} locator
     * @returns {EveTurretSet}
     */
    FindTurretSetByLocatorName(locator)
    {
        for (let i = 0; i < this.attachments.length; i++)
        {
            if (this.attachments[i] instanceof EveTurretSet && this.attachments[i].locatorName === locator)
            {
                return this.attachments[i];
            }
        }
    }

    /**
     * Finds all turret prefixes
     * @param {Array<String>} [out=[]] - Receiving array
     * @returns {Array<String>} out    - Receiving array
     */
    FindTurretPrefixes(out = [])
    {
        function add(match)
        {
            if (!match) return false;
            const name = match[0].substring(0, match[0].length - 1);
            if (!out.includes(name)) out.push(name);
            return true;
        }

        for (let i = 0; i < this.locators.length; i++)
        {
            const name = this.locators[i].name;
            if (!add((/^locator_turret_([0-9]+)[a-z]$/i).exec(name)))
            {
                add((/^locator_xl_([0-9]+)[a-z]$/i).exec(name));
            }
        }

        out.sort();
        return out;
    }

    /**
     * How many turret SETS are currently firing.
     *
     * Carbon: EveMobile::GetActiveTurretCount, read by
     * EveSpaceObjectFxAttributes so an effect can scale itself by how much of
     * the ship is shooting. Recounted every Update - see the walk there.
     * @returns {Number}
     */
    GetActiveTurretCount()
    {
        return this._activeTurretCount;
    }

    /**
     * Gets a turret set by it's locator name
     * @param {String} locatorName
     * @return {null|EveTurretSet}
     */
    GetTurretSetByLocatorName(locatorName)
    {
        return this.attachments.find(x => x instanceof EveTurretSet && x.locatorName === locatorName) || null;
    }

    /**
     * Removes a turret set
     * @param {EveTurretSet} turretSet
     * @returns {Boolean} true if updated
     */
    RemoveTurretSet(turretSet)
    {
        const index = this.attachments.indexOf(turretSet);
        if (index === -1) return false;
        this.attachments.splice(index, 1);
        return true;
    }

    /**
     * Adds a turret set
     * @param {EveTurretSet} turretSet
     * @returns {Boolean} true if updated
     */
    AddTurretSet(turretSet)
    {
        if (!turretSet.locatorName)
        {
            throw new ReferenceError("Turret set must have a locator name");
        }

        const existingTurretSet = this.GetTurretSetByLocatorName(turretSet.locatorName);
        if (existingTurretSet === turretSet) return false;

        if (existingTurretSet)
        {
            this.attachments.splice(this.attachments.indexOf(existingTurretSet), 1);
        }

        this.attachments.push(turretSet);
        this.RebuildTurretSet(turretSet);
        return true;
    }

    /**
     * Rebuilds a turret set
     * @param {EveTurretSet} turretSet
     * @return {boolean}
     */
    RebuildTurretSet(turretSet)
    {
        // The SHIP resolves where a turret goes and hands the turret set the
        // matrix, rather than handing over a locator for the set to read a bone
        // off. Carbon is explicit about this - `SetLocalTransform( i, matrix )`
        // with the comment "this ship knows position" (EveMobile.cpp:182) - and
        // it is the ship that owns every input: the animation controller, the
        // mesh index, the locator list. A locator contributes only its name.
        //
        // Still resolved every frame, because `_locatorDirty` is set at
        // construction and never cleared, so this method IS the per-frame update
        // for turret placement. Carbon instead resolves the name once after
        // loading and re-reads only JOINT bindings by index. Doing that here
        // needs an invalidation hook this class does not have yet, so the data
        // flow changes first and the resolution cost comes later.
        const
            prefix = turretSet.locatorName,
            count = this.GetLocatorCount(prefix),
            types = EveSpaceObject2.LocatorType,
            locators = [],
            transforms = [];

        const binding = this._locatorBinding;
        const pool = this._turretTransformPool;

        for (let j = 0; j < count; ++j)
        {
            const name = prefix + String.fromCharCode("a".charCodeAt(0) + j);

            this.DetermineLocatorType(name, this.meshIndex, binding);

            // Falsy is both not-loaded and no-such-name. Neither yields a matrix,
            // and for this loop they mean the same thing: leave the turret on its
            // authored locator, which UpdateItemsFromLocators falls back to.
            if (!binding.type) continue;

            // Pooled: this runs per turret per frame, and a fresh mat4 each time
            // would be pure churn.
            const index = transforms.length;
            if (!pool[index]) pool[index] = mat4.create();

            // Truthy means `pool[index]` was written, whether or not the answer
            // can still change; the rebuild wants the matrix either way.
            if (!this.GetLocatorTransform(pool[index], binding.type, binding.index)) continue;

            // A JOINT need not have a locator at all - Carbon resolves either
            // kind from a name. Where there is no locator the name is carried on
            // a stand-in, because the turret set identifies its items by it.
            locators.push(this.FindLocatorByName(name) || { name, transform: pool[index] });
            transforms.push(pool[index]);
        }

        turretSet.UpdateItemsFromLocators(locators, transforms);
        return true;
    }
}
