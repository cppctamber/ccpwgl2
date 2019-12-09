import { meta, Tw2BaseClass } from "global";


/**
 * WodPlaceableRes
 *
 * @property {Number} farFadeDistance  -
 * @property {Number} nearFadeDistance -
 * @property {Tr2Model} visualModel    -
 */
@meta.ccp("WodPlaceableRes")
@meta.notImplemented
export class WodPlaceableRes extends Tw2BaseClass
{

    @meta.black.float
    farFadeDistance = 0;

    @meta.black.float
    nearFadeDistance = 0;

    @meta.black.object
    visualModel = null;

}
