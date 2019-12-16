import { meta, Tw2BaseClass } from "global";

/**
 * Tr2ShLightingManager
 * TODO: Implement
 *
 * @property {Number} primaryIntensity   -
 * @property {Number} secondaryIntensity -
 */
@meta.data({
    ccp: "Tr2ShLightingManager",
    notImplemented: true
})
export class Tr2ShLightingManager extends Tw2BaseClass
{

    @meta.black.float
    primaryIntensity = 0;

    @meta.black.float
    secondaryIntensity = 0;

}
