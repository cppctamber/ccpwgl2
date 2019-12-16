import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2ShLightingManager", true)
export class Tr2ShLightingManager extends Tw2BaseClass
{

    @meta.black.float
    primaryIntensity = 0;

    @meta.black.float
    secondaryIntensity = 0;

}
