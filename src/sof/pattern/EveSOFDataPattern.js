import { meta, util } from "global";
import { Tw2Error } from "core";


@meta.ctor("EveSOFDataPattern", true)
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
