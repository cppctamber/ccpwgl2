import { meta } from "utils";
import { EveMobile } from "./EveMobile";


/**
 * A mobile that moves under its own power.
 *
 * Carbon's leaf of the chain, and it owns very little: boosters, speed and
 * acceleration, the audio speed it publishes, and the kill counter value
 * (`EveShip2.h:69,95`, `EveShip2_Blue.cpp:21-24`). Turrets are `EveMobile`'s
 * above it and everything else is the base's - this class was 2,861 lines
 * because it WAS the base.
 *
 * `buildClass` 0 builds a ship; 3 builds `EveSwarm`, which extends it
 * (`EveSOF.cpp:614-654`).
 */
@meta.define("EveShip2", true)
@meta.stage(2)
export class EveShip2 extends EveMobile
{

    /**
     * Scratch for resolving booster placements, reused between rebuilds.
     * @type {Array}
     */
    _boosterTransformPool = [];

    /** @type {Array} */
    _boosterTransforms = [];

    /**
     * Boosters whose placement is not final yet, which is why the rebuild is
     * not driven by the dirty flag alone - see `UpdateBoosters`.
     * @type {Number}
     */
    _boosterUnsettledCount = 1;

    /**
     * Initializes the ship, then places its boosters.
     */
    Initialize()
    {
        super.Initialize();
        this.RebuildBoosterSet();
    }

    /**
     * Rebuilds the boosters when they need it, then updates them.
     *
     * Called by the base before it walks the attachments, which is where this
     * ran when the two classes were one.
     *
     * @param {Number} dt
     */
    UpdateBoosters(dt)
    {
        if (this.boosters)
        {
            // `_boosterUnsettledCount` is why this is not just the dirty flag. The
            // booster set CLEARS _locatorDirty, unlike a turret set, so the
            // rebuild is one-shot - which is correct only once every booster's
            // place is final. A booster on a bone is right for the frame it was
            // resolved in and no other, and a hull mid-load cannot say yet which
            // it has; both keep the question open, and both are rare.
            if (this.boosters._locatorDirty || this._boosterUnsettledCount)
            {
                this.RebuildBoosterSet();
            }

            this.boosters.Update(dt, this._worldTransform, {
                gain: Math.max(Math.min(this.visible.boosters ? this.boosterGain : 0, 1), 0)
            });

            if (this.boosters._boundsDirty)
            {
                this._boundsDirty = true;
            }
        }
    }

    @meta.struct("EveBoosterSet2")
    boosters = null;

    @meta.uint
    killCount = 0;

    @meta.float
    boosterGain = 1;

    @meta.ui({ group: "Speed", index: 2 })
    @meta.float
    speed = 0;

    /**
     * Embedder-set maximum ship speed, backing the `ShipMaxSpeed()` builtin. Used by expressions
     * that normalize `speed` into a 0..1 input (e.g. warp-state mixers).
     *
     * This is the hull's maximum speed WITHOUT a propulsion module, so `speed` is not bounded
     * by it: `speed / maxSpeed` reaches 1 at an unmodified hull's top speed and carries on to
     * roughly 2 with a propulsion module fitted, which is where expressions peak. Defaulting
     * maxSpeed to 1 and sweeping `speed` to 2 therefore exercises the whole domain.
     *
     * Both values stand in for the real ship's speed and max speed until an embedder supplies
     * them; these defaults give the correct normalised range in the meantime.
     * Runtime-only: not persisted.
     * @type {Number}
     */
    @meta.ui({ group: "Speed", index: 2 })
    @meta.float
    maxSpeed = 1;

    /**
     * Rebuilds boosters
     * @return {boolean}
     */
    RebuildBoosterSet()
    {
        if (!this.boosters) return false;

        const locators = this.FindLocatorsByPrefix("locator_booster");
        const pool = this._boosterTransformPool;
        const transforms = this._boosterTransforms;

        // Zero means every booster's place is final, and this method is the
        // one-shot it has always been - a rigid hull, which is nearly all of
        // them. Non-zero means at least one booster is on a bone, or the hull
        // has not finished loading and cannot yet say, so Update keeps asking.
        this._boosterUnsettledCount = this.ResolveLocatorTransforms(locators, transforms, pool);

        this.boosters.UpdateItemsFromLocators(locators, transforms);
        return true;
    }

    /**
     * Backs the `ShipSpeed()` controller-expression builtin, resolved via
     * `context.owner.ShipSpeed()` (`state/expression/Tr2ExpressionProgram.js:701,779-781`).
     * See the `speed` field doc for the carbon reference and why ccpwgl leaves derivation to the
     * embedder.
     * @returns {Number}
     */
    ShipSpeed()
    {
        return this.speed;
    }

    /**
     * Backs the `ShipMaxSpeed()` controller-expression builtin, resolved via
     * `context.owner.ShipMaxSpeed()` (`state/expression/Tr2ExpressionProgram.js:702,779-781`).
     * @returns {Number}
     */
    ShipMaxSpeed()
    {
        return this.maxSpeed;
    }

    /**
     * Backs the `ShipBoosterIntensity()` controller-expression builtin, resolved via
     * `context.owner.ShipBoosterIntensity()` (`state/expression/Tr2ExpressionProgram.js:703`).
     *
     * Carbon averages every booster renderable's intensity into the ship data's
     * booster glow slot; ccpwgl's booster set carries no per-renderable intensity,
     * so `boosterGain` - the value that already occupies that same slot - stands in.
     * Only negatives clamp: the warp overlay states gate on values above one, so the
     * shader side's upper clamp must not apply here.
     * @returns {Number}
     */
    ShipBoosterIntensity()
    {
        if (!this.boosters) return 0;
        return this.boosterGain > 0 ? this.boosterGain : 0;
    }

    /**
     * Backs the `KillCount()` controller-expression builtin, resolved via
     * `context.owner.KillCount()` (`state/expression/Tr2ExpressionProgram.js:704`).
     * Carbon reads `EveShip2::GetKillCounterValue()`; ccpwgl already carries the
     * same number as the `killCount` field that drives kill-mark decals, so this
     * exposes that rather than introducing a second counter.
     * @returns {Number}
     */
    KillCount()
    {
        return this.killCount;
    }
}
