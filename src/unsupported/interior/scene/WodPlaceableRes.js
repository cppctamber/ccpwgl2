import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("WodPlaceableRes")
export class WodPlaceableRes extends Tw2BaseClass
{

    @meta.float
    farFadeDistance = 0;

    @meta.float
    nearFadeDistance = 0;

    @meta.struct("Tr2Model")
    visualModel = null;

}
