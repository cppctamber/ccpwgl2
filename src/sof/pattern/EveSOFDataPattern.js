import { meta, util } from "global";
import { Tw2Error } from "core";


@meta.type("EveSOFDataPattern", true)
export class EveSOFDataPattern
{

    @meta.black.string
    name = "";

    @meta.black.objectOf("EveSOFDataPatternLayer")
    layer1 = null;

    @meta.black.objectOf("EveSOFDataPatternLayer")
    layer2 = null;

    @meta.black.listOf("EveSOFDataPatternPerHull")
    projections = [];


    /**
     * Gets a hull pattern
     * @param {String} hullName
     * @returns {*}
     */
    GetHullPattern(hullName)
    {
        const projection = this.GetProjection(hullName);

        return {
            name: this.name,
            layer1: this.layer1,
            layer2: this.layer2,
            transformLayer1: projection.transformLayer1,
            transformLayer2: projection.transformLayer2
        };
    }

    /**
     * Checks if a pattern has a projection for a hull
     * @param name
     * @returns {boolean}
     */
    HasProjection(name)
    {
        return !!util.findElementByPropertyValue(this.projections, "name", name);
    }

    /**
     * Gets a hull projection
     * @param {String} name
     * @returns {null|EveSOFDataPatternPerHull}
     */
    GetProjection(name)
    {
        for (let i = 0; i < this.projections.length; i++)
        {
            if (this.projections[i].name === name)
            {
                return this.projections[i];
            }
        }
        throw new ErrSOFProjectionNotFound({ pattern: this.name, projection: name });
    }

}

/**
 * Fires when a sof pattern projection is not found
 */
export class ErrSOFProjectionNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Pattern projection '%projection%' not found for pattern '%pattern%'");
    }
}
