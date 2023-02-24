import { meta } from "utils";
import { Tw2Error } from "core";


@meta.type("EveSOFDataPattern")
export class EveSOFDataPattern extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataPatternLayer")
    layer1 = null;

    @meta.struct("EveSOFDataPatternLayer")
    layer2 = null;

    @meta.list("EveSOFDataPatternPerHull")
    projections = [];


    /**
     * Checks if a pattern projection exists
     * @param {string} hullName
     * @returns {boolean}
     */
    Has(hullName)
    {
        return this.IndexOfProjection(hullName) !== -1;
    }

    /**
     * Gets a pattern projection
     * @param {String} hullName
     * @returns {*}
     */
    Get(hullName)
    {
        const index = this.IndexOfProjection(hullName);

        if (index === -1)
        {
            throw new ErrSOFProjectionNotFound({ pattern: this.name, projection: hullName });
        }

        return {
            name: this.name,
            layer1: this.layer1,
            layer2: this.layer2,
            transformLayer1: this.projections[index].transformLayer1,
            transformLayer2: this.projections[index].transformLayer2
        };
    }

    /**
     * Gets the index of a projection
     * @param {String} hullName
     * @returns {number}
     */
    IndexOfProjection(hullName)
    {
        for (let i = 0; i < this.projections.length; i++)
        {
            if (this.projections[i].name.toUpperCase() === hullName.toUpperCase())
            {
                return i;
            }
        }

        return -1;
    }

}

/**
 * Fires when a sof pattern projection is not found
 */
export class ErrSOFProjectionNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF pattern projection '%projection%' not found for pattern '%pattern%'");
    }
}
