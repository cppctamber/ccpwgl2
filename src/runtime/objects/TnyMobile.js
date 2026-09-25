import { meta } from "utils";
import { getApiService } from "../api";
import { TnySlot } from "./TnySlot";
import { TnySpaceObject } from "./TnySpaceObject";


/**
 * A space object that carries weapon and utility slots.
 *
 * Mirrors Carbon's `EveMobile`, which sits between `EveSpaceObject2` and
 * `EveShip2` and exists for exactly this reason - its own header says "This
 * class adds functionalty like turrets to the spaceobjects class". Turret sets
 * are `EveMobile`'s (`EveMobile.h:88`); the base owns locators and locator
 * sets, but nothing that mounts to them.
 *
 * ccpwgl now has an `EveMobile` in the same place, so the wrapper and the
 * wrapped agree on where turrets live. The sof builder does not build one yet
 * (see `TnyScene.EVE_CLASS`), so what this wraps in practice is still an
 * `EveShip2`.
 *
 * Before this class existed the slot arrays sat on `TnySpaceObject`, so a jump
 * gate, a station and a planet all carried six of them and ran `RebuildSlots`.
 *
 * The slot kinds themselves - turret, xl, launcher, chain, atomic, bomb - are
 * a ccpwgl/Tny extension. Carbon has no slot or hardpoint abstraction at all:
 * "slot" appears only as `EveTurretSet::GetSlotNumber`. That is not a porting
 * gap. Turret sets in Carbon are built by the game's Python and appended to
 * `EveMobile::turretSets`, and this layer is what stands in for that Python.
 */
@meta.define("TnyMobile")
export class TnyMobile extends TnySpaceObject
{

    /** @type {Array<TnySlot>} */
    turrets = [];
    /** @type {Array<TnySlot>} */
    xlTurrets = [];
    /** @type {Array<TnySlot>} */
    launchers = [];
    /** @type {Array<TnySlot>} */
    chains = [];
    /** @type {Array<TnySlot>} */
    atomics = [];
    /** @type {Array<TnySlot>} */
    bombs = [];

    /**
     * Reconciles the weapon/utility slot arrays from the wrapped object's
     * locators. Call again after the wrapped object (or its parts) change.
     * @param {*|Array} [parts=this.wrapped] - wrapped source object(s)
     * @returns {Promise<this>}
     */
    async RebuildSlots(parts = this.wrapped)
    {
        if (!parts) return this;
        await Promise.all([
            TnySlot.rebuildLocatorSlots(this, parts, "turret", this.turrets),
            TnySlot.rebuildLocatorSlots(this, parts, "xl", this.xlTurrets),
            TnySlot.rebuildLocatorSlots(this, parts, "launcher", this.launchers),
            TnySlot.rebuildLocatorSlots(this, parts, "chain", this.chains),
            TnySlot.rebuildLocatorSlots(this, parts, "atomic", this.atomics),
            TnySlot.rebuildLocatorSlots(this, parts, "bomb", this.bombs)
        ]);
        return this;
    }

    /**
     * Gets all slot arrays as one list
     * @param {Array} [out=[]]
     * @returns {Array<TnySlot>}
     */
    GetSlots(out = [])
    {
        out.push(...this.turrets, ...this.xlTurrets, ...this.launchers, ...this.chains, ...this.atomics, ...this.bombs);
        return out;
    }

    /**
     * Mounts and configures declarative weapon entries.
     *
     * Each entry names a slot `group`. With no `slot`, it applies to every
     * slot in that group; a numeric slot is a zero-based array index and a
     * string slot is a locator name. `typeID` is resolved through tools-core,
     * while `resPath` and `faction` can be supplied directly.
     *
     * @param {Array|Object} specs
     * @param {Function} resolveRef - resolves a scene id to an object
     * @returns {Promise<TnyMobile>}
     */
    async ConfigureWeapons(specs, resolveRef)
    {
        const entries = TnyMobile.normalizeWeaponSpecs(specs);
        const typeCache = new Map();
        const operations = [];

        for (let i = 0; i < entries.length; i++)
        {
            const entry = entries[i];
            const group = entry.group;
            const slots = this[group];
            if (!TnyMobile.WEAPON_GROUPS.includes(group) || !Array.isArray(slots))
            {
                throw new TypeError(`Invalid weapon group: ${group}`);
            }

            let selected;
            if (entry.slot === undefined || entry.slot === null || entry.slot === "*" || entry.slot === "all")
            {
                selected = slots.slice();
            }
            else if (typeof entry.slot === "number")
            {
                selected = slots[entry.slot] ? [ slots[entry.slot] ] : [];
            }
            else
            {
                selected = slots.filter(x => x.locatorName === entry.slot || x.name === entry.slot);
            }

            if (!selected.length)
            {
                throw new TypeError(`Weapon slot not found: ${group}.${entry.slot}`);
            }

            let weapon = entry;
            if (!weapon.resPath && weapon.typeID !== undefined && weapon.typeID !== null)
            {
                const key = String(weapon.typeID);
                if (!typeCache.has(key))
                {
                    typeCache.set(key, getApiService().GetWeaponType(weapon.typeID));
                }
                weapon = { ...await typeCache.get(key), ...weapon };
            }
            const faction = weapon.faction !== undefined ? weapon.faction : weapon.sofFactionName;
            if (!weapon.resPath)
            {
                throw new TypeError(`Weapon ${group} requires resPath or typeID`);
            }

            for (let j = 0; j < selected.length; j++)
            {
                operations.push({ slot: selected[j], spec: weapon, faction });
            }
        }

        await Promise.all(operations.map(async operation =>
        {
            const mounted = await operation.slot.Mount(operation.spec.resPath, operation.faction || "");
            if (!mounted)
            {
                throw new Error(`Failed to mount weapon: ${operation.spec.resPath}`);
            }
        }));

        for (let i = 0; i < operations.length; i++)
        {
            const { slot, spec } = operations[i];
            if (spec.target !== undefined)
            {
                if (Array.isArray(spec.target))
                {
                    slot.SetTarget(spec.target);
                }
                else
                {
                    const ref = typeof spec.target === "string" ? spec.target : spec.target && spec.target.ref;
                    if (!ref) throw new TypeError("Weapon target requires a ref or [x, y, z]");
                    const target = resolveRef(ref);
                    if (!target) throw new ReferenceError(`Unknown scene object ref: ${ref}`);
                    slot.SetTargetObject(target.wrapped || target);
                }
            }
            if (spec.continuousFire !== undefined || spec.continuous !== undefined)
            {
                slot.SetContinuousFire(spec.continuousFire !== undefined ? spec.continuousFire : spec.continuous);
            }
            if (spec.state !== undefined) slot.SetState(spec.state);
        }

        return this;
    }

    static normalizeWeaponSpecs(specs)
    {
        if (!specs) return [];
        if (Array.isArray(specs)) return specs.slice();
        if (typeof specs !== "object") throw new TypeError("Weapons must be an array or group object");

        const result = [];
        for (const group of Object.keys(specs))
        {
            const value = specs[group];
            const entries = Array.isArray(value) ? value : [ value ];
            for (let i = 0; i < entries.length; i++)
            {
                result.push({ ...entries[i], group });
            }
        }
        return result;
    }

    static WEAPON_GROUPS = [ "turrets", "xlTurrets", "launchers", "chains", "atomics", "bombs" ];

}
