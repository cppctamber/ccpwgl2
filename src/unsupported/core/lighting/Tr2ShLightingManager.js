import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2ShLightingManager")
export class Tr2ShLightingManager extends meta.Model
{

    @meta.float
    primaryIntensity = 0;

    @meta.float
    secondaryIntensity = 0;

}
