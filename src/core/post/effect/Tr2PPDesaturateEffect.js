import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Desaturation applied near the end of the composite
 *
 * Distinct from `Tr2PPColorCorrectionEffect.colorSaturation`: this runs AFTER
 * the tone curve, the sRGB encode, the LUTs and the vignette, and it weights on
 * Rec.601 luma rather than the ACEScg weights colour correction uses. The two
 * are not interchangeable and do not commute.
 *
 * @ccp Tr2PPDesaturateEffect
 */
@meta.type("Tr2PPDesaturateEffect")
@meta.ccp.define("Tr2PPDesaturateEffect")
export class Tr2PPDesaturateEffect extends Tr2PPEffect
{

    @meta.float
    intensity = 1;

}
