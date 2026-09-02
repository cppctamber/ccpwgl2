import { meta } from "utils";
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

}
