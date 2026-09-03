import { meta, isNumber } from "utils";
import { EveSpaceObject } from "./EveSpaceObject";


@meta.define("EveShip", true)
export class EveShip extends EveSpaceObject
{

    @meta.struct("EveBoosterSet")
    boosters = null;

    @meta.list("EveTurretSet")
    turretSets = [];

    @meta.float
    boosterGain = 1;


    /**
     * Initializes the Eve Ship
     */
    Initialize()
    {
        super.Initialize();
        if (this.boosters)
        {
            this.RebuildBoosterSet();
        }

        this.visible.boosters = true;
        this.visible.firingEffects = true;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        super.GetResources(out);

        for (let i = 0; i < this.turretSets.length; i++)
        {
            this.turretSets[i].GetResources(out);
        }

        if (this.boosters)
        {
            this.boosters.GetResources(out);
        }

        return out;
    }

    /**
     * Rebuilds the ship's booster set
     */
    RebuildBoosterSet()
    {
        if (this.boosters)
        {
            this.boosters.UpdateItemsFromLocators(this.FindLocatorsByPrefix("locator_booster"));
        }
    }

    /**
     * Rebuilds turret sets
     */
    RebuildTurretPositions()
    {
        for (let i = 0; i < this.turretSets.length; i++)
        {
            this.RebuildTurretSet(i);
        }
    }

    /**
     * Rebuilds a turret set
     * @param {EveTurretSet|number} index
     */
    RebuildTurretSet(index)
    {
        // Allow rebuilding from a turret
        if (!isNumber(index))
        {
            index = this.turretSets.indexOf(index);
        }

        if (this.turretSets[index] === undefined) return;

        const
            turretSet = this.turretSets[index],
            prefix = turretSet.locatorName,
            count = this.GetLocatorCount(prefix),
            locators = [];

        for (let j = 0; j < count; ++j)
        {
            const
                name = prefix + String.fromCharCode("a".charCodeAt(0) + j),
                locator = this.FindLocatorByName(name);

            if (locator)
            {
                locator.FindBone(this.animation);
                locators.push(locator);
            }
        }

        turretSet.UpdateItemsFromLocators(locators);
    }

    /**
     * Updates view dependant data
     * @param {mat4} parentTransform
     * @param {Number} dt
     * @param {Number} worldSpriteScale
     */
    UpdateViewDependentData(parentTransform, dt, worldSpriteScale)
    {
        let isWorldSpriteUpdated = this._worldSpriteScale !== worldSpriteScale;

        super.UpdateViewDependentData(parentTransform, dt, worldSpriteScale);

        if (!isWorldSpriteUpdated && this.boosters)
        {
            this.boosters.SetWorldSpriteScale(this._worldSpriteScale);
        }

        for (let i = 0; i < this.turretSets.length; ++i)
        {
            this.turretSets[i].UpdateViewDependentData(this._worldTransform);
        }
    }

    /**
     * Per frame update
     * @param {number} dt - deltaTime
     */
    Update(dt)
    {
        super.Update(dt);

        if (this.boosters)
        {
            if (this.boosters._locatorDirty)
            {
                this.RebuildBoosterSet();
            }

            this.boosters.SetWorldSpriteScale(this._worldSpriteScale);
            this.boosters.Update(dt, this._worldTransform);
        }

        for (let i = 0; i < this.turretSets.length; ++i)
        {
            if (this.turretSets[i]._locatorDirty)
            {
                this.RebuildTurretSet(i);
            }

            this.turretSets[i].Update(dt);
        }
    }

    /** Applies logical visibility to ship-only attachments. */
    UpdateLod(updateContext)
    {
        super.UpdateLod(updateContext);

        if (this.boosters)
        {
            this.boosters.UpdateLod(updateContext);
            if (this.boosters.isVisible && !this.isVisible)
            {
                this._SetLodState(true, this.lodLevel, this.lodLevelWithChildren, this._isMeshVisible);
            }
        }
    }

    /** Restores ship-only attachment visibility. */
    ResetLod()
    {
        super.ResetLod();
        if (this.boosters) this.boosters.ResetLod();
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return false;

        const c = accumulator.length;

        this._perObjectData.vs.Get("Shipdata")[0] = this.boosterGain;
        this._perObjectData.ps.Get("Shipdata")[0] = this.boosterGain;

        if (this.boosters && this.visible.boosters)
        {
            this.boosters.GetBatches(mode, accumulator, this._perObjectData);
        }

        if (!this.isVisible) return accumulator.length !== c;

        super.GetBatches(mode, accumulator);

        if (this.visible.turretSets)
        {
            for (let i = 0; i < this.turretSets.length; ++i)
            {
                if (this.turretSets[i].isVisible)
                {
                    this.turretSets[i].GetBatches(mode, accumulator, this._perObjectData, this.visible.firingEffects);
                }
            }
        }

        return accumulator.length !== c;
    }

}
