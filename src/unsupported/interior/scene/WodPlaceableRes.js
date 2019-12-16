import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("WodPlaceableRes", true)
export class WodPlaceableRes extends Tw2BaseClass
{

    @meta.black.float
    farFadeDistance = 0;

    @meta.black.float
    nearFadeDistance = 0;

    @meta.black.objectOf("Tr2Model")
    visualModel = null;

}
