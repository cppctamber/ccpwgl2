import { meta } from "utils";
import { Tw2Error } from "core";


@meta.ctor("EveSOFDataPattern")
export class EveSOFDataPattern
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
     * @param {string} name
     * @returns {boolean}
     */
    Has(name)
    {
        return this.IndexOfProjection(name) !== -1;
    }

    /**
     * Gets a pattern projection
     * @param {String} name
     * @returns {*}
     */
    Get(name)
    {
        const index = this.IndexOfProjection(name);

        if (index === -1)
        {
            throw new ErrSOFProjectionNotFound({ pattern: this.name, projection: name });
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
     * @param {String} name
     * @returns {number}
     */
    IndexOfProjection(name)
    {
        for (let i = 0; i < this.projections.length; i++)
        {
            if (this.projections[i].name.toUpperCase() === name.toUpperCase())
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
